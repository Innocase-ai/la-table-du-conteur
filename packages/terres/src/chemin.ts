// Recherche de chemin (A*) sur la grille : 4 directions, coût par case fourni par l'appelant. Un tas binaire garde la
// recherche rapide même sur une carte de 250 × 250 cases.
import type { Case } from './types';

class Tas {
  private cles: number[] = [];
  private vals: number[] = [];
  get taille(): number {
    return this.vals.length;
  }
  ajouter(val: number, cle: number): void {
    let i = this.vals.length;
    this.vals.push(val);
    this.cles.push(cle);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.cles[p]! <= this.cles[i]!) break;
      this.echanger(i, p);
      i = p;
    }
  }
  retirer(): number {
    const haut = this.vals[0]!;
    const dernierVal = this.vals.pop()!;
    const derniereCle = this.cles.pop()!;
    if (this.vals.length) {
      this.vals[0] = dernierVal;
      this.cles[0] = derniereCle;
      let i = 0;
      for (;;) {
        const g = 2 * i + 1;
        const d = g + 1;
        let m = i;
        if (g < this.vals.length && this.cles[g]! < this.cles[m]!) m = g;
        if (d < this.vals.length && this.cles[d]! < this.cles[m]!) m = d;
        if (m === i) break;
        this.echanger(i, m);
        i = m;
      }
    }
    return haut;
  }
  private echanger(a: number, b: number): void {
    [this.vals[a], this.vals[b]] = [this.vals[b]!, this.vals[a]!];
    [this.cles[a], this.cles[b]] = [this.cles[b]!, this.cles[a]!];
  }
}

export interface Chemin {
  /** Du départ (compris) à l'arrivée (comprise). */
  cases: Case[];
  /** Coût total des cases traversées, départ exclu. */
  cout: number;
}

/**
 * Le chemin le moins coûteux de `depart` à `arrivee`, ou `null` si l'arrivée est inatteignable.
 * `cout(i)` : coût d'entrer sur la case d'index i (`Infinity` = interdite). `coutMin` : le plus petit coût possible d'une case,
 * pour que l'heuristique reste admissible (le chemin trouvé est alors le meilleur).
 */
export function trouverChemin(largeur: number, hauteur: number, depart: Case, arrivee: Case, cout: (i: number) => number, coutMin = 1): Chemin | null {
  const n = largeur * hauteur;
  const g = new Float64Array(n).fill(Infinity);
  const de = new Int32Array(n).fill(-1);
  const clos = new Uint8Array(n);
  const s = depart.y * largeur + depart.x;
  const t = arrivee.y * largeur + arrivee.x;
  if (!Number.isFinite(cout(t))) return null;
  const h = (i: number) => (Math.abs((i % largeur) - arrivee.x) + Math.abs(Math.floor(i / largeur) - arrivee.y)) * coutMin;
  g[s] = 0;
  const tas = new Tas();
  tas.ajouter(s, h(s));
  while (tas.taille) {
    const c = tas.retirer();
    if (clos[c]) continue;
    clos[c] = 1;
    if (c === t) break;
    const cx = c % largeur;
    const cy = (c - cx) / largeur;
    for (let k = 0; k < 4; k++) {
      const nx = cx + (k === 0 ? 1 : k === 1 ? -1 : 0);
      const ny = cy + (k === 2 ? 1 : k === 3 ? -1 : 0);
      if (nx < 0 || ny < 0 || nx >= largeur || ny >= hauteur) continue;
      const v = ny * largeur + nx;
      if (clos[v]) continue;
      const k2 = cout(v);
      if (!Number.isFinite(k2)) continue;
      const ng = g[c]! + k2;
      if (ng < g[v]!) {
        g[v] = ng;
        de[v] = c;
        tas.ajouter(v, ng + h(v));
      }
    }
  }
  if (!Number.isFinite(g[t]!)) return null;
  const cases: Case[] = [];
  for (let c = t; c !== -1; c = de[c]!) cases.unshift({ x: c % largeur, y: Math.floor(c / largeur) });
  return { cases, cout: g[t]! };
}

/** Cases atteignables depuis `depart` (1 = atteignable) selon le coût fourni. */
export function atteignables(largeur: number, hauteur: number, depart: Case, cout: (i: number) => number): Uint8Array {
  const vus = new Uint8Array(largeur * hauteur);
  const s = depart.y * largeur + depart.x;
  if (!Number.isFinite(cout(s))) return vus;
  const pile = [s];
  vus[s] = 1;
  while (pile.length) {
    const c = pile.pop()!;
    const cx = c % largeur;
    const cy = (c - cx) / largeur;
    for (let k = 0; k < 4; k++) {
      const nx = cx + (k === 0 ? 1 : k === 1 ? -1 : 0);
      const ny = cy + (k === 2 ? 1 : k === 3 ? -1 : 0);
      if (nx < 0 || ny < 0 || nx >= largeur || ny >= hauteur) continue;
      const v = ny * largeur + nx;
      if (!vus[v] && Number.isFinite(cout(v))) {
        vus[v] = 1;
        pile.push(v);
      }
    }
  }
  return vus;
}
