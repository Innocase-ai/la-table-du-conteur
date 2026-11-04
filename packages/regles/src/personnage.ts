// Le personnage du joueur, un seul modèle pour tout le jeu : sa fiche (calculée à la création) et son état
// durable (PV, potions, usages d'aptitudes, emplacements de sorts). L'exploration le modifie, le combat le prend
// et le rend : une potion bue en combat est bue pour de bon, un sort lancé use son emplacement jusqu'au repos.
import { etatDurableMax, RECUPERATION, type EtatDurable } from './combat/creation';
import type { HeroCombat } from './combat/prototype';
import { kitDepuisFiche } from './creation/kit';
import { lancer, type Generateur } from './des';
import type { Fiche } from './fiche';

/**
 * Ce que porte un héros, en identifiants d'objets (catalogue du SRD, commun à tous les mondes, ou objets du monde). Le SRD
 * y est la référence : une arme ou une armure du monde repose sur une arme ou une armure du SRD (`base`).
 */
export interface Equipement {
  armure?: string;
  bouclier?: string;
  /** Armes portées (six au plus), que le combat propose. */
  armes: string[];
  /** Parures et objets magiques portés (cinq au plus, dont trois harmonisés). */
  portes: string[];
  /** Bonus des armes magiques portées, par arme du SRD sur laquelle elles reposent ; recalculé quand on équipe. */
  bonusArmes?: Record<string, { attaque: number; degats: number; nom?: string }>;
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
  /** Ce qu'il porte ; absent tant qu'on n'a rien changé à l'équipement de départ (voir `equipementDe`). */
  equipe?: Equipement;
}

/** L'équipement d'un héros : celui qu'on lui a donné, sinon son équipement de départ. */
export function equipementDe(p: Personnage): Equipement {
  if (p.equipe) return p.equipe;
  const e = p.fiche.equipement;
  return { armure: e?.armure, bouclier: e?.bouclier ? 'bouclier' : undefined, armes: [...(e?.armes ?? [])], portes: [] };
}

const NOMS_RESSOURCES: Record<string, string> = { rages: 'rages', secondSouffle: 'second souffle', fougue: 'fougue', conduit: 'conduit divin' };

/** Ressources dont l'état dure d'un combat à l'autre (les autres, comme la réaction, ne servent qu'en combat). */
export const RESSOURCES_DURABLES = Object.keys(RECUPERATION);

export function personnageDepuisFiche(fiche: Fiche, options: { id: string; portrait?: string; outils?: string[]; potions?: number }): Personnage {
  const max = etatDurableMax(fiche, options.potions ?? kitDepuisFiche(fiche).potions ?? 0);
  return { id: options.id, nom: fiche.nom, fiche, pv: fiche.pvMax, outils: options.outils ?? [], portrait: options.portrait, ...max };
}

/** Le personnage prêt pour un combat : fiche, armes, sorts, et son état du moment. */
export function heroCombatDe(p: Personnage): HeroCombat {
  const kit = kitDepuisFiche(p.fiche);
  // Les armes magiques gardent leur nom et leurs bonus.
  const armes = kit.armes.map((a) => ({ ...a, ...(p.equipe?.bonusArmes?.[a.id] ? { bonus: p.equipe.bonusArmes[a.id], nom: p.equipe.bonusArmes[a.id]!.nom } : {}) }));
  return { fiche: p.fiche, kit: { ...kit, armes, potions: p.ressources.potions ?? 0 }, portrait: p.portrait, etat: { pv: p.pv, ressources: { ...p.ressources }, emplacements: [...p.emplacements] } };
}

/** Reprend l'état durable laissé par un combat (borné par les maximums de la fiche). */
export function appliquerEtat(p: Personnage, etat: { pv: number; ressources?: Record<string, number>; emplacements?: number[] }): void {
  const max = etatDurableMax(p.fiche);
  p.pv = Math.max(0, Math.min(p.fiche.pvMax, etat.pv));
  for (const [cle, v] of Object.entries(etat.ressources ?? {})) {
    if (!RESSOURCES_DURABLES.includes(cle)) continue;
    p.ressources[cle] = Math.max(0, cle === 'potions' ? v : Math.min(max.ressources[cle] ?? v, v));
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
  } else if (p.pv > 0 && p.pv < p.fiche.pvMax) {
    p.pv = Math.min(p.fiche.pvMax, p.pv + Math.max(1, lancer(`1d${p.fiche.deVie}`, gen).total + p.fiche.caracteristiques.con.modificateur));
  }
  if (duree === 'court' && p.fiche.incantation?.niveauEmplacementPacte) p.emplacements = [...max.emplacements];
  for (const [cle, regle] of Object.entries(RECUPERATION)) {
    const m = max.ressources[cle];
    if (m === undefined || cle === 'potions') continue;
    const r = duree === 'long' ? regle.long : regle.court;
    if (r === 'toutes') p.ressources[cle] = m;
    else if (r === 'une') p.ressources[cle] = Math.min(m, (p.ressources[cle] ?? 0) + 1);
  }
  const changes: string[] = [];
  if (p.pv !== avant.pv) changes.push(`${p.pv - avant.pv} PV (${p.pv}/${p.fiche.pvMax})`);
  for (const k of Object.keys(p.ressources)) {
    const gain = (p.ressources[k] ?? 0) - (avant.ressources[k] ?? 0);
    if (gain > 0) changes.push(`${NOMS_RESSOURCES[k] ?? k} ${p.ressources[k]}/${max.ressources[k]}`);
  }
  if (p.emplacements.some((v, i) => v !== avant.emplacements[i])) changes.push('ses emplacements de sorts');
  return changes;
}
