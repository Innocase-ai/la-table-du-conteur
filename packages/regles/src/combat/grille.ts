// Grille tactique : cases de 1,5 m, diagonales au même coût que l'orthogonal (SRD 5.2.1).

export const TAILLE_CASE = 1.5;

export type TypeCase = 'sol' | 'mur' | 'difficile';

/** Ambiances de plateau : chacune a ses textures (sol, difficile, mur), communes à tous les mondes. */
export const TERRAINS = ['foret', 'souterrain', 'caverne', 'camp', 'neige'] as const;
export type Terrain = (typeof TERRAINS)[number];

export interface Position {
  x: number;
  y: number;
}

/**
 * Éléments posés sur les cases, indépendants de l'ambiance du plateau (un arbre ou de l'eau peuvent se trouver sur
 * n'importe quel sol). Chacun reprend les règles d'un type de case existant : l'apparence est libre, le jeu ne change pas.
 */
export const RELIEFS = ['arbre', 'rocher', 'eau', 'boue', 'neige'] as const;
export type Relief = (typeof RELIEFS)[number];

export interface InfoRelief {
  /** Le caractère qui le désigne dans une carte écrite en texte. */
  lettre: string;
  /** Les règles qu'il applique : un mur (bloque le passage et la vue) ou un terrain difficile (déplacement doublé). */
  type: Exclude<TypeCase, 'sol'>;
  libelle: string;
}

export const INFO_RELIEFS: Record<Relief, InfoRelief> = {
  arbre: { lettre: 'T', type: 'mur', libelle: 'Arbre' },
  rocher: { lettre: 'R', type: 'mur', libelle: 'Rocher' },
  eau: { lettre: 'e', type: 'difficile', libelle: 'Eau peu profonde' },
  boue: { lettre: 'b', type: 'difficile', libelle: 'Boue' },
  neige: { lettre: 'n', type: 'difficile', libelle: 'Neige profonde' },
};

const RELIEF_PAR_LETTRE = new Map(RELIEFS.map((r) => [INFO_RELIEFS[r].lettre, r]));

export interface Grille {
  largeur: number;
  hauteur: number;
  cases: TypeCase[]; // index = y * largeur + x
  /** Les éléments posés sur certaines cases (clé « x,y »), sans effet sur les règles au-delà de leur type de case. */
  reliefs?: Record<string, Relief>;
}

/**
 * Construit une grille à partir de lignes de texte : « . » sol, « # » mur, « ~ » terrain difficile, et les éléments
 * « T » arbre, « R » rocher (comme des murs), « e » eau peu profonde, « b » boue, « n » neige (terrain difficile).
 */
export function grilleDepuisTexte(lignes: string[]): Grille {
  const hauteur = lignes.length;
  const largeur = Math.max(...lignes.map((l) => l.length));
  const cases: TypeCase[] = [];
  const reliefs: Record<string, Relief> = {};
  for (let y = 0; y < hauteur; y++) {
    for (let x = 0; x < largeur; x++) {
      const c = lignes[y]![x] ?? '#';
      const relief = RELIEF_PAR_LETTRE.get(c);
      if (relief) reliefs[`${x},${y}`] = relief;
      cases.push(relief ? INFO_RELIEFS[relief].type : c === '#' ? 'mur' : c === '~' ? 'difficile' : 'sol');
    }
  }
  return Object.keys(reliefs).length ? { largeur, hauteur, cases, reliefs } : { largeur, hauteur, cases };
}

/** L'élément posé sur une case, s'il y en a un. */
export function reliefDe(grille: Grille, p: Position): Relief | undefined {
  return grille.reliefs?.[`${p.x},${p.y}`];
}

export function dans(grille: Grille, p: Position): boolean {
  return p.x >= 0 && p.y >= 0 && p.x < grille.largeur && p.y < grille.hauteur;
}

export function typeCase(grille: Grille, p: Position): TypeCase {
  return dans(grille, p) ? grille.cases[p.y * grille.largeur + p.x]! : 'mur';
}

export function memePosition(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

export function cle(p: Position): string {
  return `${p.x},${p.y}`;
}

/** Distance en cases (diagonale = 1). */
export function distanceCases(a: Position, b: Position): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

export function distanceMetres(a: Position, b: Position): number {
  return distanceCases(a, b) * TAILLE_CASE;
}

export function voisins(grille: Grille, p: Position): Position[] {
  const res: Position[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const v = { x: p.x + dx, y: p.y + dy };
      if (typeCase(grille, v) !== 'mur') res.push(v);
    }
  }
  return res;
}

/** Ligne de vue entre deux centres de cases : aucun mur sur le tracé (Bresenham, extrémités exclues). */
export function ligneDeVue(grille: Grille, a: Position, b: Position): boolean {
  let x0 = a.x;
  let y0 = a.y;
  const dx = Math.abs(b.x - x0);
  const dy = -Math.abs(b.y - y0);
  const sx = x0 < b.x ? 1 : -1;
  const sy = y0 < b.y ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    if (x0 === b.x && y0 === b.y) return true;
    if (!(x0 === a.x && y0 === a.y) && typeCase(grille, { x: x0, y: y0 }) === 'mur') return false;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

export interface Occupation {
  /** Cases qu'on ne peut pas traverser (ennemis). */
  bloquees: Set<string>;
  /** Cases où l'on ne peut pas s'arrêter (toute créature). */
  occupees: Set<string>;
}

export interface Chemin {
  arrivee: Position;
  cout: number; // mètres
  etapes: Position[]; // départ exclu, arrivée incluse
}

/**
 * Toutes les cases atteignables depuis `depart` avec `budget` mètres de déplacement
 * (Dijkstra ; terrain difficile = coût double). Renvoie le chemin le moins cher vers chacune.
 */
export function cheminsAtteignables(grille: Grille, depart: Position, budget: number, occ: Occupation): Map<string, Chemin> {
  const meilleurs = new Map<string, { cout: number; precedent?: string; position: Position }>();
  meilleurs.set(cle(depart), { cout: 0, position: depart });
  // Les coûts sont des multiples de 1,5 m : une file par palier suffit (pas besoin de tas).
  const paliers: { cout: number; position: Position }[][] = [[{ cout: 0, position: depart }]];
  for (let palier = 0; palier < paliers.length; palier++) {
    const file = paliers[palier];
    if (!file) continue;
    for (const courant of file) {
      const k = cle(courant.position);
      if (courant.cout > meilleurs.get(k)!.cout) continue;
      for (const v of voisins(grille, courant.position)) {
        const kv = cle(v);
        if (occ.bloquees.has(kv)) continue;
        const cout = courant.cout + (typeCase(grille, v) === 'difficile' ? 2 : 1) * TAILLE_CASE;
        if (cout > budget + 1e-9) continue;
        const connu = meilleurs.get(kv);
        if (!connu || cout < connu.cout) {
          meilleurs.set(kv, { cout, precedent: k, position: v });
          const p = Math.round(cout / TAILLE_CASE);
          (paliers[p] ??= []).push({ cout, position: v });
        }
      }
    }
  }
  const res = new Map<string, Chemin>();
  for (const [k, info] of meilleurs) {
    if (k === cle(depart) || occ.occupees.has(k)) continue;
    const etapes: Position[] = [];
    let c: string | undefined = k;
    while (c && c !== cle(depart)) {
      const n: { cout: number; precedent?: string; position: Position } = meilleurs.get(c)!;
      etapes.unshift(n.position);
      c = n.precedent;
    }
    res.set(k, { arrivee: info.position, cout: info.cout, etapes });
  }
  return res;
}

/** Cases d'une zone d'effet, à partir de l'origine (le lanceur pour un cône, le point visé pour une sphère). */
export function casesZone(
  grille: Grille,
  forme: 'cone' | 'sphere' | 'cube' | 'ligne' | 'cylindre' | 'emanation',
  tailleMetres: number,
  origine: Position,
  vise: Position,
): Position[] {
  const n = Math.round(tailleMetres / TAILLE_CASE);
  const res: Position[] = [];
  for (let y = 0; y < grille.hauteur; y++) {
    for (let x = 0; x < grille.largeur; x++) {
      const p = { x, y };
      if (typeCase(grille, p) === 'mur') continue;
      let inclus = false;
      if (forme === 'sphere' || forme === 'cylindre' || forme === 'emanation') {
        inclus = distanceCases(p, vise) <= n && ligneDeVue(grille, vise, p);
      } else if (forme === 'cube') {
        inclus = p.x >= vise.x && p.x < vise.x + n && p.y >= vise.y && p.y < vise.y + n;
      } else if (forme === 'cone') {
        // Cône : la largeur égale la distance parcourue, dans la direction du point visé.
        const vx = p.x - origine.x;
        const vy = p.y - origine.y;
        const norme = Math.hypot(vise.x - origine.x, vise.y - origine.y) || 1;
        const ux = (vise.x - origine.x) / norme;
        const uy = (vise.y - origine.y) / norme;
        const along = vx * ux + vy * uy;
        const lateral = Math.abs(vx * uy - vy * ux);
        inclus = along > 0.5 && along <= n + 0.5 && lateral <= along / 2 + 0.5 && ligneDeVue(grille, origine, p);
      } else if (forme === 'ligne') {
        const d = distanceCases(origine, p);
        if (d >= 1 && d <= n) {
          const t = d / Math.max(1, distanceCases(origine, vise));
          const cx = Math.round(origine.x + (vise.x - origine.x) * t);
          const cy = Math.round(origine.y + (vise.y - origine.y) * t);
          inclus = cx === x && cy === y;
        }
      }
      if (inclus) res.push(p);
    }
  }
  return res;
}
