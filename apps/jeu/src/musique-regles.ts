// Les musiques du jeu et le choix de celle qui joue. Logique pure, sans lecture audio (voir `musique.ts`).
//
// Trois usages, un dossier chacun dans `musique/` :
// - `combat/`  : l'ambiance d'un combat, une boucle tirée au hasard à chaque combat ;
// - `accueil/` : la musique des menus (page d'accueil, choix d'histoire, groupe, aide, créateur) ;
// - `fond/`    : les musiques de fond des histoires, communes à toutes, très basses, enchaînées dans un ordre aléatoire.

/** Les ambiances de combat disponibles : un fichier `musique/combat/<id>.mp3` chacune (une boucle, voir outils/musique). */
export const AMBIANCES_MUSIQUE = ['foret', 'souterrain', 'caverne', 'camp', 'intense', 'bataille'] as const;

export type AmbianceMusique = (typeof AMBIANCES_MUSIQUE)[number];

export const LIBELLES_MUSIQUES: Record<AmbianceMusique, string> = {
  foret: 'Embuscade en forêt',
  souterrain: 'Crypte et souterrain',
  caverne: 'Caverne',
  camp: 'Camp de guerre',
  intense: 'Combat intense',
  bataille: 'Bataille',
};

/** Les ambiances de combat qui ne viennent pas de l'outil de génération (musiques libres de droits de Pixabay, voir CREDITS.md). */
export const AMBIANCES_EXTERNES = ['bataille'] as const;

/** Les musiques de l'accueil : `musique/accueil/<id>.mp3`. */
export const MUSIQUES_ACCUEIL = ['accueil-1', 'accueil-2'] as const;
export type MusiqueAccueil = (typeof MUSIQUES_ACCUEIL)[number];

/** Les musiques de fond des histoires : `musique/fond/<id>.mp3`. */
export const MUSIQUES_FOND = ['fond-ambiance', 'fond-documentaire', 'fond-sombre-1', 'fond-sombre-2', 'fond-donjon', 'fond-montagne'] as const;
export type MusiqueFond = (typeof MUSIQUES_FOND)[number];

/** Toutes les musiques du jeu, par identifiant de fichier. */
export type NomMusique = AmbianceMusique | MusiqueAccueil | MusiqueFond;

export const LIBELLES_FOND: Record<MusiqueFond, string> = {
  'fond-ambiance': 'Ambiance cinématique',
  'fond-documentaire': 'Fresque documentaire',
  'fond-sombre-1': 'Ombres, premier thème',
  'fond-sombre-2': 'Ombres, second thème',
  'fond-donjon': 'Sous le donjon',
  'fond-montagne': 'Chant de la montagne',
};

/**
 * Tire une musique dans `liste` au hasard, sans reprendre la précédente (sinon on entendrait deux fois de suite la même).
 * `hasard` est un nombre de [0, 1[ (Math.random() en jeu).
 */
export function choisirParmi<T extends string>(liste: readonly T[], precedente: T | undefined, hasard: number): T {
  const choix = liste.length > 1 ? liste.filter((a) => a !== precedente) : liste;
  const i = Math.min(choix.length - 1, Math.max(0, Math.floor(hasard * choix.length)));
  return choix[i]!;
}

/** Choisit l'ambiance d'un combat au hasard, sans reprendre celle du combat précédent. */
export function choisirAmbiance(precedente: AmbianceMusique | undefined, hasard: number): AmbianceMusique {
  return choisirParmi(AMBIANCES_MUSIQUE, precedente, hasard);
}

/**
 * L'ordre dans lequel les musiques de fond s'enchaînent : toutes une fois, dans un ordre mélangé, sans que la première d'un
 * nouveau tour soit la dernière du précédent. `hasard` donne un nombre de [0, 1[ à chaque appel (Math.random() en jeu).
 */
export function melangerFond(precedente: MusiqueFond | undefined, hasard: () => number): MusiqueFond[] {
  const reste = [...MUSIQUES_FOND];
  const ordre: MusiqueFond[] = [];
  while (reste.length) {
    const i = Math.min(reste.length - 1, Math.floor(hasard() * reste.length));
    ordre.push(reste.splice(i, 1)[0]!);
  }
  if (precedente && ordre.length > 1 && ordre[0] === precedente) ordre.push(ordre.shift()!);
  return ordre;
}

/** Ce que la musique doit jouer, d'après la scène du jeu et l'état du combat. */
export type SceneMusique = 'accueil' | 'histoire' | undefined;

export type Voulue = { type: 'combat'; id: AmbianceMusique } | { type: 'accueil' } | { type: 'fond' } | undefined;

/** Un combat l'emporte sur tout ; sinon la musique suit la scène (accueil des menus, fond d'une histoire en cours). */
export function musiqueVoulue(scene: SceneMusique, combat: AmbianceMusique | undefined): Voulue {
  if (combat) return { type: 'combat', id: combat };
  if (scene === 'accueil') return { type: 'accueil' };
  if (scene === 'histoire') return { type: 'fond' };
  return undefined;
}

/** Durée, en secondes, du fondu enchaîné entre deux musiques de fond. */
export const DUREE_FONDU_ENTRE_FONDS = 3;
