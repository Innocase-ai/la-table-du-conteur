// Fond du plateau d'un combat d'histoire (21/11/2026) : l'illustration du lieu où il se déroule, assombrie derrière le plateau.
// Le lieu est celui de la rencontre, sinon celui où se trouve le groupe ; s'il n'a pas d'image, on remonte à ses parents
// (une salle sans illustration prend celle de son bâtiment). Une escarmouche n'a pas de lieu : pas de fond.
import type { ManifesteImages } from '@crpg/regles';

/** Le fichier d'image du lieu (ou du premier de ses ancêtres qui en a une), d'après le manifeste du monde. */
export function fichierFondCombat(
  manifeste: Pick<ManifesteImages, 'lieux'> | undefined,
  lieux: ReadonlyMap<string, { parent?: string | undefined }>,
  lieu: string | undefined,
): string | undefined {
  const vus = new Set<string>();
  for (let id = lieu; id && !vus.has(id); id = lieux.get(id)?.parent) {
    vus.add(id);
    const fichier = manifeste?.lieux[id];
    if (fichier) return fichier;
  }
  return undefined;
}
