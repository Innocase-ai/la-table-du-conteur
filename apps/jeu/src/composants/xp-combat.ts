import type { EtatCombat } from '@crpg/regles';

/** Ce que le moteur ajoute à l'XP du combat d'une histoire : voir `reglerRencontre` (packages/regles/src/monde/exploration.ts). */
export interface XpHistoire {
  /** Nombre de héros du groupe : l'XP du combat se partage entre eux (SRD 5.2.1). */
  nbHeros: number;
  /** XP de la rencontre elle-même (effets de victoire), la même pour chacun. */
  bonus: number;
  /** Rencontre déjà vaincue : le combat ne rapporte plus de PX (pas de farm), seul le bonus compte. */
  dejaFaite: boolean;
}

/** XP gagnée par chaque héros à la victoire, comme le moteur l'attribue ; `px` : total des PX des adversaires vaincus ou en fuite. */
export function xpGagnee(etat: EtatCombat, xp: XpHistoire): { parHeros: number; px: number } {
  const px = etat.combattants.filter((c) => c.camp === 'monstres' && (c.mort || c.enFuite)).reduce((s, c) => s + c.px, 0);
  const partage = xp.dejaFaite ? 0 : Math.floor(px / Math.max(1, xp.nbHeros));
  return { parHeros: partage + xp.bonus, px };
}
