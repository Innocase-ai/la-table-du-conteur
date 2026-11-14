// Le personnage du joueur, un seul modèle pour tout le jeu : sa fiche (calculée à la création) et son état
// durable (PV, potions, usages d'aptitudes, emplacements de sorts). L'exploration le modifie, le combat le prend
// et le rend : une potion bue en combat est bue pour de bon, un sort lancé use son emplacement jusqu'au repos.
import { etatDurableMax, RECUPERATION, type EtatDurable } from './combat/creation';
import { PREFIXE_CHARGES, PREFIXE_OBJET, type ObjetEmbarque } from './combat/objets';
import type { HeroCombat } from './combat/prototype';
import { kitDepuisFiche } from './creation/kit';
import { accorderApresRepos } from './creation/preparation';
import { lancer, type Generateur } from './des';
import { estAncienEquipement, rangerEquipement, type AncienEquipement } from './equipement/ranger';
import type { Emplacement, Jeu } from './equipement/emplacements';
import type { ChoixPersonnage, Fiche } from './fiche';

/** Les bonus d'une arme magique (ou le nom propre d'une arme du monde), posés sur l'emplacement qui la tient. */
export interface BonusArme {
  attaque: number;
  degats: number;
  nom?: string;
}

/**
 * Ce que porte un héros, emplacement par emplacement, en identifiants d'objets (catalogue du SRD, commun à tous les mondes, ou objets
 * du monde). Un seul objet par emplacement. Deux jeux d'armes (I et II), dont un seul est en main : `jeuActif`. Le SRD est la
 * référence : une arme ou une armure du monde repose sur une arme ou une armure du SRD (`base`).
 */
export interface Equipement {
  emplacements: Partial<Record<Emplacement, string>>;
  jeuActif: Jeu;
  /** Bonus des armes magiques portées, par emplacement ; recalculé quand on équipe. */
  bonus?: Partial<Record<Emplacement, BonusArme>>;
  /** Les mains du jeu actif qui tiennent une arme (droite d'abord) : dans l'ordre des armes de la fiche, pour leur donner leurs bonus ; recalculé quand on équipe. */
  armesActives?: Emplacement[];
  /** Les mains de l'autre jeu qui tiennent une arme (droite d'abord), dans l'ordre de `fiche.equipement.autreJeu.armes` ; recalculé quand on équipe. */
  armesAutres?: Emplacement[];
}

/**
 * Ce qu'un héros peut changer de ses sorts, gagné par un repos ou un niveau (SRD 5.2.1, voir `creation/preparation.ts`) :
 * sorts préparés à remplacer (`'tous'` = toute sa liste) et sorts mineurs à remplacer.
 */
export interface DroitsPreparation {
  prepares: number | 'tous';
  mineurs: number;
}

export interface Personnage extends EtatDurable {
  id: string;
  nom: string;
  fiche: Fiche;
  pv: number;
  /** Outils portés (`outils-de-voleur`…), pour crocheter et désamorcer. */
  outils: string[];
  /** Portrait de galerie choisi par le joueur (`elfe-f-2`). */
  portrait?: string;
  /** Ce qu'il porte ; absent tant qu'on n'a rien changé à l'équipement de départ (voir `equipementDe`). Peut être l'ancienne forme en listes dans une vieille sauvegarde : la partie la convertit au chargement. */
  equipe?: Equipement | AncienEquipement;
  /** Ce que le héros a reçu pour le combat (potions, antidote…), par identifiant d'objet : ce qu'ils font ; le nombre est dans `ressources['objet:<id>']`. */
  embarques?: Record<string, ObjetEmbarque>;
  /** Ses choix de création, pour le faire monter de niveau en gardant ce que le joueur a choisi. */
  choix?: ChoixPersonnage;
  /** Le niveau qu'il vient d'atteindre, tant que ses nouveaux choix (amélioration, sorts…) n'ont pas été revus par le joueur. */
  monteeEnAttente?: number;
  /** Ses changements de sorts permis (repos, niveau) ; absent quand il n'a rien à changer. Dépensé par `changerSortsPrepares`. */
  preparation?: DroitsPreparation;
}

/**
 * L'équipement d'un héros : celui qu'on lui a donné, sinon son équipement de départ rangé dans les emplacements. Sans le catalogue
 * on ne connaît pas les mains qu'une arme demande : ce rangement de secours suit l'ordre des armes ; la partie range avec le SRD
 * (`moteur.nouvellePartie` et `charger`), si bien qu'il ne sert qu'à un héros hors partie.
 */
export function equipementDe(p: Personnage): Equipement {
  if (p.equipe && !estAncienEquipement(p.equipe)) return p.equipe;
  const e = p.fiche.equipement;
  const ancien: AncienEquipement = p.equipe && estAncienEquipement(p.equipe) ? p.equipe : { armure: e?.armure, bouclier: e?.bouclier ? 'bouclier' : undefined, armes: [...(e?.armes ?? [])], portes: [] };
  return rangerEquipement(ancien).equipement;
}

const NOMS_RESSOURCES: Record<string, string> = { rages: 'rages', secondSouffle: 'second souffle', fougue: 'fougue', conduit: 'conduit divin', desVie: 'dés de vie', impositionDesMains: 'imposition des mains', inspiration: 'inspiration bardique', chatimentGratuit: 'châtiment divin gratuit', credo: 'points de Credo', metabolisme: 'métabolisme surnaturel' };

/** Ressources dont l'état dure d'un combat à l'autre (les autres, comme la réaction, ne servent qu'en combat). */
export const RESSOURCES_DURABLES = Object.keys(RECUPERATION);

export function personnageDepuisFiche(fiche: Fiche, options: { id: string; portrait?: string; outils?: string[]; potions?: number; choix?: ChoixPersonnage }): Personnage {
  const max = etatDurableMax(fiche, options.potions ?? kitDepuisFiche(fiche).potions ?? 0);
  return { id: options.id, nom: fiche.nom, fiche, pv: fiche.pvMax, outils: options.outils ?? [], portrait: options.portrait, ...max, ...(options.choix ? { choix: options.choix } : {}) };
}

/** Le personnage prêt pour un combat : fiche, armes, sorts, et son état du moment. */
export function heroCombatDe(p: Personnage): HeroCombat {
  const kit = kitDepuisFiche(p.fiche);
  // Les armes magiques gardent leur nom et leurs bonus.
  const eq = p.equipe && !estAncienEquipement(p.equipe) ? p.equipe : undefined;
  const avecBonus = (liste: typeof kit.armes, mains: Emplacement[] | undefined) =>
    liste.map((a, i) => {
      const main = mains?.[i];
      const bonus = main ? eq?.bonus?.[main] : undefined;
      return { ...a, ...(bonus ? { bonus, nom: bonus.nom } : {}) };
    });
  const armes = avecBonus(kit.armes, eq?.armesActives);
  const autreJeu = kit.autreJeu && { ...kit.autreJeu, armes: avecBonus(kit.autreJeu.armes, eq?.armesAutres) };
  return { id: p.id, fiche: p.fiche, kit: { ...kit, armes, ...(autreJeu ? { autreJeu } : {}), potions: p.ressources.potions ?? 0 }, portrait: p.portrait, ...(p.embarques ? { objets: p.embarques } : {}), etat: { pv: p.pv, ressources: { ...p.ressources }, emplacements: [...p.emplacements] } };
}

/** Reprend l'état durable laissé par un combat (borné par les maximums de la fiche). */
export function appliquerEtat(p: Personnage, etat: { pv: number; ressources?: Record<string, number>; emplacements?: number[] }): void {
  const max = etatDurableMax(p.fiche);
  p.pv = Math.max(0, Math.min(p.fiche.pvMax, etat.pv));
  for (const [cle, v] of Object.entries(etat.ressources ?? {})) {
    // Les objets confiés au héros (`objet:<id>`) se comptent comme les potions : ce qui reste après le combat reste dans ses mains.
    const objet = cle.startsWith(PREFIXE_OBJET);
    // Les charges d'un objet emporté (`charges:<id>`) durent aussi d'un combat à l'autre.
    const charges = cle.startsWith(PREFIXE_CHARGES);
    if (!RESSOURCES_DURABLES.includes(cle) && !objet && !charges) continue;
    p.ressources[cle] = Math.max(0, cle === 'potions' || objet || charges ? v : Math.min(max.ressources[cle] ?? v, v));
    if (objet && !p.ressources[cle]) {
      delete p.ressources[cle];
      if (p.embarques) delete p.embarques[cle.slice(PREFIXE_OBJET.length)];
    }
  }
  if (etat.emplacements) p.emplacements = max.emplacements.map((m, i) => Math.max(0, Math.min(m, etat.emplacements![i] ?? 0)));
}

/**
 * Repos (SRD 5.2.1). Long : PV, usages et emplacements au maximum. Court : un dé de vie de PV (plus le modificateur
 * de Constitution), une utilisation regagnée ou toutes selon l'aptitude, et la magie de pacte. Les potions ne
 * reviennent jamais. Renvoie ce qui a changé, en phrases.
 */
export function recuperer(p: Personnage, duree: 'court' | 'long', gen: Generateur): string[] {
  const max = etatDurableMax(p.fiche);
  const avant = { pv: p.pv, ressources: { ...p.ressources }, emplacements: [...p.emplacements] };
  if (duree === 'long') {
    p.pv = p.fiche.pvMax;
    p.emplacements = [...max.emplacements];
  } else if (p.pv > 0) {
    // Repos court : le héros dépense ses dés de vie, un à un, tant qu'il est blessé (dé + modificateur de Constitution).
    // Une ancienne sauvegarde sans réserve compte une réserve pleine.
    let des = p.ressources.desVie ?? p.fiche.niveau;
    while (p.pv < p.fiche.pvMax && des > 0) {
      des -= 1;
      p.pv = Math.min(p.fiche.pvMax, p.pv + Math.max(0, lancer(`1d${p.fiche.deVie}`, gen).total + p.fiche.caracteristiques.con.modificateur));
    }
    p.ressources.desVie = des;
  }
  if (duree === 'court' && p.fiche.incantation?.niveauEmplacementPacte) p.emplacements = [...max.emplacements];
  for (const [cle, regle] of Object.entries(RECUPERATION)) {
    const m = max.ressources[cle];
    if (m === undefined || cle === 'potions') continue;
    const r = duree === 'long' ? regle.long : regle.court;
    if (r === 'toutes') p.ressources[cle] = m;
    else if (r === 'une') p.ressources[cle] = Math.min(m, (p.ressources[cle] ?? 0) + 1);
  }
  // Source d'inspiration (Barde niveau 5) : le repos court rend aussi toute l'Inspiration bardique.
  if (duree === 'court' && max.ressources.inspiration !== undefined && p.fiche.aptitudes.some((a) => a.id === 'source-d-inspiration')) p.ressources.inspiration = max.ressources.inspiration;
  const changes: string[] = [];
  if (p.pv !== avant.pv) changes.push(`${p.pv - avant.pv} PV (${p.pv}/${p.fiche.pvMax})`);
  for (const k of Object.keys(p.ressources)) {
    const gain = (p.ressources[k] ?? 0) - (avant.ressources[k] ?? 0);
    if (gain > 0) changes.push(`${NOMS_RESSOURCES[k] ?? k} ${p.ressources[k]}/${max.ressources[k]}`);
  }
  if (p.emplacements.some((v, i) => v !== avant.emplacements[i])) changes.push('ses emplacements de sorts');
  // Préparer ses sorts : le repos donne le droit de changer sa liste (selon la classe), dit à part dans le constat.
  const preparation = accorderApresRepos(p, duree);
  if (preparation) changes.push(preparation.replace(`${p.nom} peut`, 'il peut'));
  return changes;
}
