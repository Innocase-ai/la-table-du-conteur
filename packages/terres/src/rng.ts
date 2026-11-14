// Hasard déterministe du moteur de terres. Tout est fonction d'une graine : aucune fermeture, aucun état caché, donc
// une partie rechargée retrouve exactement les mêmes tirages (le compteur de tirages est dans l'état sauvegardé).

/** Générateur mulberry32 : une suite de nombres dans [0, 1) à partir d'une graine. */
export function creerRng(graine: number): () => number {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash d'un point de grille vers [0, 1). */
export function hash2(graine: number, x: number, y: number): number {
  let h = (graine ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
}

/** Le n-ième tirage d'une graine, dans [0, 1) : pur, sans état (on sauvegarde seulement le compteur n). */
export const alea = (graine: number, n: number): number => hash2(graine, n, 0x9e3779b1);

const lisse = (t: number): number => t * t * (3 - 2 * t);

/** Bruit de valeur lissé dans [0, 1). */
export function bruit(graine: number, x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = lisse(x - x0);
  const fy = lisse(y - y0);
  const a = hash2(graine, x0, y0);
  const b = hash2(graine, x0 + 1, y0);
  const c = hash2(graine, x0, y0 + 1);
  const d = hash2(graine, x0 + 1, y0 + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/** Somme de plusieurs octaves de bruit, normalisée dans [0, 1). */
export function bruitFractal(graine: number, x: number, y: number, octaves = 4): number {
  let total = 0;
  let amp = 1;
  let norme = 0;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    total += bruit(graine + i * 101, x * freq, y * freq) * amp;
    norme += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return total / norme;
}
