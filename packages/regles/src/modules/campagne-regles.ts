// La campagne (F5 de docs/PRD-SAGA.md, pas (b) puis (d)) : le BILAN de fin d'épisode (ce que le groupe emporte) et l'ENTRÉE dans l'épisode suivant.
// Fonctions pures du moteur, sans écran : le client les branche (écran de fin « Continuer la saga »). Un épisode est un monde ; ce qui est à lui (lieux,
// drapeaux, quêtes, PNJ, jauges) reste derrière, ce qui est au groupe (héros, XP, or, sac) voyage.
//
// Ce qui voyage : les héros (fiche, choix de montée, sorts, équipement, objets embarqués), l'XP, l'or, les objets du sac et ceux qu'on porte (ceux du CATALOGUE SRD, et
// les objets PROPRES à l'épisode quitté : une relique, une arme nommée, dont la définition voyage avec la partie, `SagaPartie.souvenirs`), le carnet de campagne et
// les phrases de ses échos. Ce qui ne voyage pas : les objets de quête et les clés (ils n'ont de sens que dans leur épisode), les compagnons (des PNJ escortés,
// propres à leur épisode), le lieu, le jour, tout l'état du monde.
import type { Donnees } from '../donnees';
import { creerGenerateur, type Generateur } from '../des';
import { SEUILS_PX } from '../caracteristiques';
import { estAncienEquipement } from '../equipement/ranger';
import { EMPLACEMENTS } from '../equipement/emplacements';
import { ajouterSouvenirs, type Moteur } from '../noyau/moteur';
import type { ContexteJeu, EchoCarnet, Partie } from '../noyau/types';
import { recuperer, type Personnage } from '../personnage';
import { CATEGORIES_JAMAIS_TIREES } from '../monde/butin-niveau';
import { echosDeFin } from '../monde/campagne';
import type { Objet } from '../monde/schemas';
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
  /** Le sac : les objets du catalogue SRD et ceux du monde quitté (leurs définitions sont dans `souvenirs`), hors quête et clés. */
  inventaire: Record<string, number>;
  /** Les définitions des objets propres au monde quitté que le groupe garde (sac ou équipement). */
  souvenirs: Objet[];
  /** Ce qui reste derrière : objets de quête, clés, objets inconnus (par identifiant). */
  laisses: string[];
  /** Le carnet de campagne cumulé : celui de départ plus les échos de l'épisode (identifiants, pour les conditions). */
  campagne: string[];
  /** Les mêmes échos avec leur phrase et leur épisode d'origine, pour le joueur (ceux qui ont une phrase). */
  carnet: EchoCarnet[];
}

const connuDuCatalogue = (srd: Donnees | undefined, id: string): boolean => !!srd && (srd.objets.has(id) || srd.armes.has(id) || srd.armures.has(id));

/** Un objet de quête ou une clé ne voyage pas (il n'a de sens que dans son épisode). */
const estDeQuete = (srd: Donnees | undefined, dm: ContexteJeu['dm'], id: string): boolean => {
  const c = dm.objets.get(id)?.categorie ?? srd?.objets.get(id)?.categorie;
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
  const souvenirs = new Map<string, Objet>();
  const groupe = structuredClone(partie.groupe);
  /** Garde l'objet (catalogue, ou propre au monde : sa définition voyage) ; sinon il est laissé. */
  const garder = (id: string): boolean => {
    if (estDeQuete(srd, dm, id)) return false;
    if (dm.objets.has(id)) {
      souvenirs.set(id, structuredClone(dm.objets.get(id)!));
      return true;
    }
    return connuDuCatalogue(srd, id);
  };

  // L'équipement porté : un objet de quête, une clé ou un objet inconnu est retiré (et laissé).
  for (const h of groupe) {
    if (!h.equipe || estAncienEquipement(h.equipe)) continue;
    let change = false;
    for (const s of EMPLACEMENTS) {
      const id = h.equipe.emplacements[s];
      if (!id || garder(id)) continue;
      delete h.equipe.emplacements[s];
      laisses.add(id);
      change = true;
    }
    if (change) appliquerEquipement(ctx, h);
  }

  const inventaire: Record<string, number> = {};
  for (const [id, q] of Object.entries(partie.etat.inventaire)) {
    if (q <= 0) continue;
    if (garder(id)) inventaire[id] = q;
    else laisses.add(id);
  }

  const campagne = [...new Set([...(partie.etat.campagne ?? []), ...echosDeFin(dm, partie.etat), ...(options.echos ?? [])])];
  // Les phrases : celles qui viennent déjà de la saga, plus celles que cet épisode déclare pour les échos qu'il émet.
  const carnet = new Map<string, EchoCarnet>((partie.saga?.carnet ?? []).map((e) => [e.id, e]));
  for (const e of dm.monde.campagne?.emet ?? []) if (campagne.includes(e.id) && !carnet.has(e.id)) carnet.set(e.id, { id: e.id, phrase: e.phrase, monde: dm.monde.id });

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
    souvenirs: [...souvenirs.values()],
    laisses: [...laisses].sort(),
    campagne,
    carnet: [...carnet.values()],
  };
}

export interface EntreeEpisode {
  partie: Partie;
  /** Ce que le joueur doit savoir de l'entrée (groupe en dessous du niveau de l'épisode, par exemple) ; vide quand tout va bien. */
  avis: string[];
}

/**
 * Entre dans l'épisode que porte `moteur` avec le bilan du précédent : la partie neuve commence au lieu de départ, le jour 1, avec les
 * héros reposés (PV et emplacements pleins : du temps a passé entre deux épisodes), l'XP, l'or, le sac, le carnet et les objets gardés (leurs définitions
 * sont ajoutées au monde et gardées dans `partie.saga`). Un groupe sous le niveau minimal de l'épisode garde son niveau et ses PX montent au seuil de ce
 * minimum : il rattrape à sa première action (la progression lit l'XP) ; le moteur ne le fait pas monter d'office ici, pour que les choix de montée
 * restent ceux du joueur.
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
  // Les objets gardés d'abord : les modules s'en servent dès le départ (équipement du groupe).
  const saga = bilan.souvenirs.length || bilan.carnet.length ? { carnet: bilan.carnet, souvenirs: bilan.souvenirs } : undefined;
  ajouterSouvenirs(moteur.ctx, saga);
  const nouvelle = moteur.nouvellePartie(groupe, { graine, niveau: bilan.niveau, campagne: bilan.campagne });
  if (saga) nouvelle.saga = structuredClone(saga);
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
