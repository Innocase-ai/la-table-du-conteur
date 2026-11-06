// Petites fonctions de texte partagées par le créateur (comparaison de noms français).

/** Minuscules, sans accents, apostrophes et ponctuation ramenées à des espaces. */
export function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'`]/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Identifiant kebab-case d'un nom français (« Lumières dansantes » → `lumieres-dansantes`). */
export function identifiant(texte: string): string {
  return normaliser(texte).replace(/ /g, '-');
}
