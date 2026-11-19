// La campagne, pas (b) de F5 (docs/PRD-SAGA.md) : le BILAN de fin d'épisode (ce que le groupe emporte) et l'ENTRÉE dans l'épisode suivant.
// Fonctions pures du moteur, sans écran ni sauvegarde : le client les branchera au pas (d). Un épisode est un monde ; ce qui est à lui (lieux,
// drapeaux, quêtes, PNJ, jauges) reste derrière, ce qui est au groupe (héros, XP, or, sac) voyage.
//
// Ce qui voyage : les héros (fiche, choix de montée, sorts, équipement, objets embarqués), l'XP, l'or, les objets du CATALOGUE SRD du sac, le
// carnet de campagne. Ce qui ne voyage pas : les objets propres au monde quitté (une relique, une arme nommée : sa définition n'existe pas dans
// l'épisode suivant ; une arme ou une armure redevient son modèle SRD, le reste est laissé et nommé dans `laisses`), les objets de quête et les
// clés, les compagnons (des PNJ escortés, propres à leur épisode), le lieu, le jour, tout l'état du monde.
import type { Donnees } from '../donnees';
import { creerGenerateur, type Generateur } from '../des';
import { SEUILS_PX } from '../caracteristiques';
import { estAncienEquipement } from '../equipement/ranger';
import { EMPLACEMENTS } from '../equipement/emplacements';
import type { Moteur } from '../noyau/moteur';
import type { ContexteJeu, Partie } from '../noyau/types';
import { recuperer, type Personnage } from '../personnage';
import { CATEGORIES_JAMAIS_TIREES } from '../monde/butin-niveau';
import { echosDeFin } from '../monde/campagne';
import { appliquerEquipement } from './equipement-regles';

/** Ce que le groupe emporte à la fin d'un épisode : du JSON, sans rien de l'épisode quitté. */
export interface BilanEpisode {
  version: 1;
  /** L'épisode quitté (id du monde), et la fin qui l'a conclu si le groupe en a atteint une. */
  monde: string;
  fin?: string;
  niveau: number;
  jour: number;
  groupe: Personnage[];
  xp: number;
  pieces: number;
  /** Le sac : seulement des objets du catalogue SRD, hors quête et clés. */
  inventaire: Record<string, number>;
  /** Ce qui était propre à l'épisode et reste derrière (objets du sac ou portés, par identifiant). */
  laisses: string[];
  /** Le carnet de campagne cumulé : celui de départ plus les échos de l'épisode. */
  campagne: string[];
}

const connuDuCatalogue = (srd: Donnees | undefined, id: string): boolean => !!srd && (srd.objets.has(id) || srd.armes.has(id) || srd.armures.has(id));

/** Un objet du SRD qui sert à une quête ou ouvre quelque chose ne voyage pas (il n'a de sens que dans son épisode). */
const estDeQuete = (srd: Donnees | undefined, id: string): boolean => {
  const c = srd?.objets.get(id)?.categorie;
  return !!c && CATEGORIES_JAMAIS_TIREES.includes(c);
};

/**
 * Le bilan d'un épisode : à appeler quand l'histoire est finie (ou à tout moment, pour un bilan « tel quel »). La partie n'est pas modifiée.
 * Le carnet du bilan = celui de départ, plus les échos que le monde émet (`campagne.emet`, ceux dont la condition est vraie dans l'état final), plus
 * `echos` (ajoutés à la main : essais, outils).
 */
export function bilanDeFin(partie: Partie, ctx: ContexteJeu, options: { echos?: readonly string[] } = {}): BilanEpisode {
  const { srd, dm } = ctx;
  const laisses = new Set<string>();
  const groupe = structuredClone(partie.groupe);

  // L'équipement : un objet du monde quitté redevient son modèle SRD (arme, armure, bouclier) ou est laissé.
  for (const h of groupe) {
    if (!h.equipe || estAncienEquipement(h.equipe)) continue;
    let change = false;
    for (const s of EMPLACEMENTS) {
      const id = h.equipe.emplacements[s];
      if (!id || connuDuCatalogue(srd, id)) continue;
      const objet = dm.objets.get(id);
      const base = objet?.base;
      if (base && (srd?.armes.has(base) || srd?.armures.has(base))) h.equipe.emplacements[s] = base;
      else delete h.equipe.emplacements[s];
      laisses.add(id);
      change = true;
    }
    if (change) appliquerEquipement(ctx, h);
  }

  const inventaire: Record<string, number> = {};
  for (const [id, q] of Object.entries(partie.etat.inventaire)) {
    if (q <= 0) continue;
    if (connuDuCatalogue(srd, id) && !estDeQuete(srd, id)) inventaire[id] = q;
    else laisses.add(id);
  }

  return {
    version: 1,
    monde: partie.monde,
    ...(partie.etat.fin ? { fin: partie.etat.fin } : {}),
    niveau: partie.etat.niveauGroupe,
    jour: partie.etat.jour,
    groupe,
    xp: partie.etat.xp,
    pieces: partie.etat.pieces,
    inventaire,
    laisses: [...laisses].sort(),
    campagne: [...new Set([...(partie.etat.campagne ?? []), ...echosDeFin(dm, partie.etat), ...(options.echos ?? [])])],
  };
}

export interface EntreeEpisode {
  partie: Partie;
  /** Ce que le joueur doit savoir de l'entrée (groupe en dessous du niveau de l'épisode, par exemple) ; vide quand tout va bien. */
  avis: string[];
}

/**
 * Entre dans l'épisode que porte `moteur` avec le bilan du précédent : la partie neuve commence au lieu de départ, le jour 1, avec les
 * héros reposés (PV et emplacements pleins : du temps a passé entre deux épisodes), l'XP, l'or, le sac et le carnet. Un groupe sous le
 * niveau minimal de l'épisode garde son niveau et ses PX montent au seuil de ce minimum : il rattrape à sa première action (la progression
 * lit l'XP) ; le moteur ne le fait pas monter d'office ici, pour que les choix de montée restent ceux du joueur.
 */
export function entrerDansEpisode(moteur: Moteur, bilan: BilanEpisode, options: { graine?: number; gen?: Generateur } = {}): EntreeEpisode {
  const dm = moteur.ctx.dm;
  const graine = (options.graine ?? Math.floor(Math.random() * 2 ** 31)) >>> 0;
  const gen = options.gen ?? creerGenerateur(graine);
  const groupe = structuredClone(bilan.groupe);
  for (const h of groupe) {
    recuperer(h, 'long', gen);
    delete h.monteeEnAttente;
  }
  const nouvelle = moteur.nouvellePartie(groupe, { graine, niveau: bilan.niveau, campagne: bilan.campagne });
  const { min, max } = dm.monde.niveaux;
  const avis: string[] = [];
  const seuilMin = SEUILS_PX[Math.min(Math.max(min, 1), SEUILS_PX.length) - 1] ?? 0;
  // `commencer` donne l'or et les vivres de départ du monde : le groupe arrive avec ce qu'il a, pas avec une seconde dotation.
  const partie = moteur.executer(nouvelle, { type: 'commencer' }).partie;
  partie.etat.xp = Math.max(bilan.xp, partie.etat.xp, bilan.niveau < min ? seuilMin : 0);
  partie.etat.pieces = bilan.pieces;
  partie.etat.inventaire = { ...bilan.inventaire };
  if (bilan.niveau < min) avis.push(`Le groupe est de niveau ${bilan.niveau} ; « ${dm.monde.nom} » est écrit pour les niveaux ${min} à ${max} : il rattrapera son retard dès sa première action.`);
  if (bilan.niveau > max) avis.push(`Le groupe est de niveau ${bilan.niveau} ; « ${dm.monde.nom} » est écrit pour les niveaux ${min} à ${max} : les combats et le butin seront trop faciles.`);
  return { partie, avis };
}
