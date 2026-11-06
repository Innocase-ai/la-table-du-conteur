// La mise en page d'un graphe, sans dépendance : des colonnes (distance à la racine), l'ordre dans chaque colonne ajusté par
// barycentre pour limiter les croisements, des courbes pour les arêtes. Pure et testée (disposition.test.ts).
import type { Graphe } from '@crpg/regles';

export interface Boite {
  id: string;
  x: number;
  y: number;
  l: number;
  h: number;
  colonne: number;
}

export interface Disposition {
  boites: Map<string, Boite>;
  largeur: number;
  hauteur: number;
}

export interface OptionsDisposition {
  /** Les nœuds de la première colonne (par défaut : ceux que rien ne vise, sinon le premier). */
  racines?: string[];
  l?: number;
  h?: number;
  ecartX?: number;
  ecartY?: number;
}

export function disposer(g: Graphe, opts: OptionsDisposition = {}): Disposition {
  const l = opts.l ?? 168;
  const h = opts.h ?? 34;
  const ecartX = opts.ecartX ?? 64;
  const ecartY = opts.ecartY ?? 14;
  const ids = g.noeuds.map((n) => n.id);
  const voisins = new Map<string, Set<string>>(ids.map((id) => [id, new Set<string>()]));
  const visés = new Set<string>();
  for (const a of g.aretes) {
    if (!voisins.has(a.de) || !voisins.has(a.vers)) continue;
    voisins.get(a.de)!.add(a.vers);
    voisins.get(a.vers)!.add(a.de);
    visés.add(a.vers);
  }

  // Colonnes : distance à la racine, en suivant les arêtes dans les deux sens ; chaque composante repart de la colonne 0.
  const colonne = new Map<string, number>();
  const racines = (opts.racines?.filter((r) => voisins.has(r)) ?? []).length ? opts.racines!.filter((r) => voisins.has(r)) : ids.filter((id) => !visés.has(id));
  const departs = [...racines, ...ids];
  for (const depart of departs) {
    if (colonne.has(depart)) continue;
    colonne.set(depart, 0);
    const file = [depart];
    while (file.length) {
      const courant = file.shift()!;
      for (const v of voisins.get(courant) ?? []) {
        if (!colonne.has(v)) {
          colonne.set(v, colonne.get(courant)! + 1);
          file.push(v);
        }
      }
    }
  }
  const nbColonnes = Math.max(0, ...colonne.values()) + 1;
  const colonnes: string[][] = Array.from({ length: nbColonnes }, () => []);
  for (const id of ids) colonnes[colonne.get(id)!]!.push(id);

  // Ordre dans chaque colonne : barycentre des voisins des colonnes proches, trois allers-retours.
  const rang = new Map<string, number>();
  const numeroter = () => colonnes.forEach((c) => c.forEach((id, i) => rang.set(id, i)));
  numeroter();
  const trier = (c: string[], vers: number) => {
    const bary = new Map<string, number>();
    for (const id of c) {
      const rs = [...(voisins.get(id) ?? [])].filter((v) => colonne.get(v) === vers).map((v) => rang.get(v)!);
      bary.set(id, rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : rang.get(id)!);
    }
    c.sort((a, b) => bary.get(a)! - bary.get(b)! || rang.get(a)! - rang.get(b)!);
  };
  for (let passe = 0; passe < 3; passe++) {
    for (let k = 1; k < nbColonnes; k++) (trier(colonnes[k]!, k - 1), numeroter());
    for (let k = nbColonnes - 2; k >= 0; k--) (trier(colonnes[k]!, k + 1), numeroter());
  }

  // Coordonnées : colonnes de gauche à droite, chaque colonne centrée sur la plus haute.
  const maxParColonne = Math.max(1, ...colonnes.map((c) => c.length));
  const hauteurMax = maxParColonne * (h + ecartY) - ecartY;
  const boites = new Map<string, Boite>();
  colonnes.forEach((c, k) => {
    const hauteurColonne = c.length * (h + ecartY) - ecartY;
    const decalage = (hauteurMax - hauteurColonne) / 2;
    c.forEach((id, i) => boites.set(id, { id, x: k * (l + ecartX), y: decalage + i * (h + ecartY), l, h, colonne: k }));
  });
  return { boites, largeur: Math.max(l, nbColonnes * (l + ecartX) - ecartX), hauteur: Math.max(h, hauteurMax) };
}

/** Le tracé d'une arête entre deux boîtes : de bord à bord, en courbe ; une boucle sur le côté si elles sont dans la même colonne. */
export function cheminArete(de: Boite, vers: Boite): { d: string; milieu: { x: number; y: number } } {
  const cy1 = de.y + de.h / 2;
  const cy2 = vers.y + vers.h / 2;
  if (de.colonne === vers.colonne) {
    const x = Math.max(de.x, vers.x) + de.l;
    // Plus les deux boîtes sont éloignées, plus la boucle s'écarte : les voisines restent serrées, les lointaines ne se superposent pas.
    const sortie = 26 + Math.min(Math.abs(cy2 - cy1) * 0.32, 150);
    return { d: `M ${x} ${cy1} C ${x + sortie} ${cy1}, ${x + sortie} ${cy2}, ${x} ${cy2}`, milieu: { x: x + sortie * 0.75, y: (cy1 + cy2) / 2 } };
  }
  const versLaDroite = vers.colonne > de.colonne;
  const x1 = versLaDroite ? de.x + de.l : de.x;
  const x2 = versLaDroite ? vers.x : vers.x + vers.l;
  const dx = (x2 - x1) / 2;
  return { d: `M ${x1} ${cy1} C ${x1 + dx} ${cy1}, ${x2 - dx} ${cy2}, ${x2} ${cy2}`, milieu: { x: (x1 + x2) / 2, y: (cy1 + cy2) / 2 } };
}
