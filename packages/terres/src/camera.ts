import type { Case } from './types';

/** Coin haut-gauche de la fenêtre visible (en cases), centrée sur `centre` et bornée pour ne jamais sortir de la carte. */
export function fenetre(centre: Case, vueLargeur: number, vueHauteur: number, carteLargeur: number, carteHauteur: number): Case {
  const borne = (v: number, max: number) => Math.max(0, Math.min(v, Math.max(0, max)));
  return { x: borne(centre.x - Math.floor(vueLargeur / 2), carteLargeur - vueLargeur), y: borne(centre.y - Math.floor(vueHauteur / 2), carteHauteur - vueHauteur) };
}
