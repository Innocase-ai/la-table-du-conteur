import { describe, expect, it } from 'vitest';
import { atteignables, trouverChemin } from '../src/chemin';
import { creerRng } from '../src/rng';

/** Référence lente : Dijkstra sans tas, pour comparer le coût du meilleur chemin. */
function dijkstra(l: number, h: number, depart: { x: number; y: number }, arrivee: { x: number; y: number }, cout: (i: number) => number): number {
  const d = new Array<number>(l * h).fill(Infinity);
  const fait = new Array<boolean>(l * h).fill(false);
  d[depart.y * l + depart.x] = 0;
  for (;;) {
    let m = -1;
    for (let i = 0; i < d.length; i++) if (!fait[i] && Number.isFinite(d[i]!) && (m < 0 || d[i]! < d[m]!)) m = i;
    if (m < 0) break;
    fait[m] = true;
    const x = m % l;
    const y = (m - x) / l;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= l || ny >= h) continue;
      const v = ny * l + nx;
      const c = cout(v);
      if (Number.isFinite(c) && d[m]! + c < d[v]!) d[v] = d[m]! + c;
    }
  }
  return d[arrivee.y * l + arrivee.x]!;
}

describe('recherche de chemin', () => {
  it('trouve le même coût que Dijkstra sur 60 grilles au hasard', () => {
    const rng = creerRng(77);
    for (let k = 0; k < 60; k++) {
      const l = 12 + Math.floor(rng() * 10);
      const h = 10 + Math.floor(rng() * 8);
      const couts = Array.from({ length: l * h }, () => (rng() < 0.2 ? Infinity : 1 + Math.floor(rng() * 9)));
      const depart = { x: 0, y: 0 };
      const arrivee = { x: l - 1, y: h - 1 };
      couts[0] = 1;
      couts[l * h - 1] = 1;
      const cout = (i: number) => couts[i]!;
      const ref = dijkstra(l, h, depart, arrivee, cout);
      const ch = trouverChemin(l, h, depart, arrivee, cout, 1);
      if (!Number.isFinite(ref)) expect(ch).toBeNull();
      else {
        expect(ch).not.toBeNull();
        expect(ch!.cout).toBe(ref);
        expect(ch!.cases[0]).toEqual(depart);
        expect(ch!.cases[ch!.cases.length - 1]).toEqual(arrivee);
        // Chaque pas est d'une case, jamais sur un obstacle.
        for (let i = 1; i < ch!.cases.length; i++) {
          const a = ch!.cases[i - 1]!;
          const b = ch!.cases[i]!;
          expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBe(1);
          expect(Number.isFinite(cout(b.y * l + b.x))).toBe(true);
        }
      }
    }
  });

  it('renvoie null si l’arrivée est un mur ou murée', () => {
    const cout = (i: number) => (i % 10 === 5 ? Infinity : 1);
    expect(trouverChemin(10, 5, { x: 0, y: 0 }, { x: 9, y: 4 }, cout)).toBeNull();
    expect(trouverChemin(10, 5, { x: 0, y: 0 }, { x: 5, y: 2 }, cout)).toBeNull();
  });

  it('marque les cases atteignables', () => {
    const cout = (i: number) => (i % 10 === 5 ? Infinity : 1);
    const vus = atteignables(10, 5, { x: 0, y: 0 }, cout);
    expect(vus[4]).toBe(1);
    expect(vus[6]).toBe(0);
  });
});
