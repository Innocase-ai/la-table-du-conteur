// Vision, exploration et repères. La vue de près est un losange autour du groupe (comme le brouillard de RPGSEB), élargi sur une
// hauteur et réduit la nuit. Les repères (tour, fumée, moulin, tertre) se voient de bien plus loin : c'est ce qui donne des
// destinations à l'horizon, tant qu'une montagne ne coupe pas la vue.
import { dansCarte } from './generation';
import { moment, estNuit, TERRAINS } from './terrain';
import type { Ancre, CarteTerres, Case, ContexteVoyage, EtatVoyage, PointInteret } from './types';

export const VISION_BASE = 4;
export const VISION_MIN = 2;

type Position = Pick<EtatVoyage, 'x' | 'y' | 'minutes'>;

/** Rayon de vision de près : la base, plus les bonus du groupe et de la hauteur, moins la nuit (sauf vision dans le noir). */
export function rayonVision(carte: CarteTerres, p: Position, ctx: Pick<ContexteVoyage, 'bonusVision' | 'visionNocturne'> = {}): number {
  const hauteur = TERRAINS[carte.tuiles[p.y * carte.largeur + p.x]!].hauteur;
  const nuit = estNuit(p.minutes) && !ctx.visionNocturne ? 1 : 0;
  return Math.max(VISION_MIN, VISION_BASE + (ctx.bonusVision ?? 0) + hauteur - nuit);
}

export const nouvelleExploration = (carte: CarteTerres): Uint8Array => new Uint8Array(carte.largeur * carte.hauteur);

export function estVisible(carte: CarteTerres, p: Position, x: number, y: number, ctx: Pick<ContexteVoyage, 'bonusVision' | 'visionNocturne'> = {}): boolean {
  return Math.abs(p.x - x) + Math.abs(p.y - y) <= rayonVision(carte, p, ctx);
}

/** Marque comme explorées les cases visibles de près. Renvoie la même grille s'il n'y a rien de nouveau (pur : ne modifie pas l'entrée). */
export function reveler(carte: CarteTerres, explore: Uint8Array, p: Position, ctx: Pick<ContexteVoyage, 'bonusVision' | 'visionNocturne'> = {}): Uint8Array {
  const r = rayonVision(carte, p, ctx);
  let copie: Uint8Array | null = null;
  for (let y = Math.max(0, p.y - r); y <= Math.min(carte.hauteur - 1, p.y + r); y++) {
    for (let x = Math.max(0, p.x - r); x <= Math.min(carte.largeur - 1, p.x + r); x++) {
      if (Math.abs(p.x - x) + Math.abs(p.y - y) > r) continue;
      const i = y * carte.largeur + x;
      if (explore[i]) continue;
      copie ??= explore.slice();
      copie[i] = 1;
    }
  }
  return copie ?? explore;
}

/** Ligne de vue entre deux cases (Bresenham) : les montagnes coupent la vue, sauf pour qui se tient lui-même sur une hauteur de montagne. */
export function ligneDeVue(carte: CarteTerres, a: Case, b: Case): boolean {
  if (TERRAINS[carte.tuiles[a.y * carte.largeur + a.x]!].hauteur >= 2) return true;
  let x = a.x;
  let y = a.y;
  const dx = Math.abs(b.x - a.x);
  const dy = Math.abs(b.y - a.y);
  const sx = a.x < b.x ? 1 : -1;
  const sy = a.y < b.y ? 1 : -1;
  let err = dx - dy;
  for (;;) {
    if (x === b.x && y === b.y) return true;
    if (!(x === a.x && y === a.y) && TERRAINS[carte.tuiles[y * carte.largeur + x]!].coupeLaVue) return false;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

export interface RepereVisible {
  genre: 'poi' | 'ancre';
  id: string;
  nom: string;
  x: number;
  y: number;
  distance: number;
}

/**
 * Les repères visibles de là où l'on se tient : les points d'intérêt qui sont des repères (tour, fumée, feu) et les ancres qui en sont
 * (moulin sur une crête). De jour, ou de nuit pour ceux qui brillent. La portée gagne la hauteur du point de vue.
 */
export function reperesVisibles(carte: CarteTerres, p: Position): RepereVisible[] {
  const res: RepereVisible[] = [];
  const bonus = TERRAINS[carte.tuiles[p.y * carte.largeur + p.x]!].hauteur;
  const nuit = moment(p.minutes) === 'nuit';
  const voit = (x: number, y: number, rayon: number): number | undefined => {
    const d2 = (x - p.x) ** 2 + (y - p.y) ** 2;
    const r = rayon + bonus;
    if (d2 > r * r || !dansCarte(carte, x, y)) return undefined;
    return ligneDeVue(carte, p, { x, y }) ? Math.abs(x - p.x) + Math.abs(y - p.y) : undefined;
  };
  for (const poi of carte.pois as PointInteret[]) {
    if (!poi.repere || (nuit && !poi.repere.nuit)) continue;
    const d = voit(poi.x, poi.y, poi.repere.rayon);
    if (d !== undefined) res.push({ genre: 'poi', id: poi.id, nom: poi.nom, x: poi.x, y: poi.y, distance: d });
  }
  for (const a of carte.ancres as Ancre[]) {
    if (!a.rayonRepere || nuit) continue;
    const d = voit(a.x, a.y, a.rayonRepere);
    if (d !== undefined) res.push({ genre: 'ancre', id: a.id, nom: a.nom, x: a.x, y: a.y, distance: d });
  }
  return res;
}
