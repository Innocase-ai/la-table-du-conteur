// Les musiques d'ambiance de combat et le choix de celle qui joue. Logique pure, sans lecture audio (voir `musique.ts`).

/** Les ambiances disponibles : un fichier `musique/<id>.mp3` chacune (une boucle, voir outils/musique). */
export const AMBIANCES_MUSIQUE = ['foret', 'souterrain', 'caverne', 'camp', 'intense'] as const;

export type AmbianceMusique = (typeof AMBIANCES_MUSIQUE)[number];

export const LIBELLES_MUSIQUES: Record<AmbianceMusique, string> = {
  foret: 'Embuscade en forêt',
  souterrain: 'Crypte et souterrain',
  caverne: 'Caverne',
  camp: 'Camp de guerre',
  intense: 'Combat intense',
};

/**
 * Choisit l'ambiance d'un combat au hasard, sans reprendre celle du combat précédent (sinon on entendrait deux fois
 * de suite la même musique alors qu'il y en a cinq). `hasard` est un nombre de [0, 1[ (Math.random() en jeu).
 */
export function choisirAmbiance(precedente: AmbianceMusique | undefined, hasard: number): AmbianceMusique {
  const choix = AMBIANCES_MUSIQUE.length > 1 ? AMBIANCES_MUSIQUE.filter((a) => a !== precedente) : AMBIANCES_MUSIQUE;
  const i = Math.min(choix.length - 1, Math.max(0, Math.floor(hasard * choix.length)));
  return choix[i]!;
}
