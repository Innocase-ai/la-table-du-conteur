// Ce qu'un combat d'histoire rend au récit : l'issue, les PX des adversaires vaincus et l'état des héros.
// Séparé de l'interface pour que le moteur (et ses tests) lise la fin d'un combat comme le jeu la lit.
import type { EtatCombat } from './etat';

/** Ce qu'on transmet à `reglerRencontre` à la fin d'un combat. */
export interface ResultatCombat {
  /** Victoire des héros, défaite (tout le groupe à terre) ou repli (le combat s'arrête sans vainqueur). */
  issue: 'victoire' | 'defaite' | 'fuite';
  /** PX des adversaires morts ou en fuite : le moteur les partage entre les héros à la victoire. */
  px: number;
  /** État de chaque héros : PV (un héros tombé est relevé à 1 PV : pas de mort définitive en histoire), ressources, emplacements. */
  heros: Record<string, { pv: number; ressources: Record<string, number>; emplacements?: number[] }>;
}

export function resultatDeCombat(etat: EtatCombat): ResultatCombat {
  const heros = Object.fromEntries(
    etat.combattants
      .filter((c) => c.camp === 'heros')
      .map((c) => [c.id, { pv: Math.max(1, c.pv), ressources: c.ressources, emplacements: c.incantation?.emplacements }]),
  );
  const px = etat.combattants.filter((c) => c.camp === 'monstres' && (c.mort || c.enFuite)).reduce((s, c) => s + c.px, 0);
  const issue = etat.vainqueur === 'heros' ? 'victoire' : etat.vainqueur === 'monstres' ? 'defaite' : 'fuite';
  return { issue, px, heros };
}
