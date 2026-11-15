import { describe, expect, it } from 'vitest';
import type { Estimation } from '../../packages/regles/src/monde/estimation';
import { calibrer, texteCalibrage } from './calibrer';

const estimation = (monde: string, total: number, tours: number, combats = 2): Estimation => ({ monde, tours, toursConteur: 100, heures: { recit: total - combats, combats, total }, couts: [], imagesUsd: 0, motsLus: 9000 });
const ex = (mesures: unknown) => JSON.stringify({ version: 1, mesures });

describe('pnpm monde calibrer', () => {
  const estimations = new Map([['tombe', estimation('tombe', 10, 300, 2)]]);

  it("compare le mesuré à l'estimé et dit quel rythme aurait été juste", () => {
    const r = calibrer(ex({ tombe: { secondes: 15 * 3600, actions: 240, sessions: 4 } }), estimations);
    expect(r.lignes).toHaveLength(1);
    const l = r.lignes[0]!;
    expect(l.rapport).toBe(1.5); // 15 h mesurées pour 10 h estimées
    expect(l.secondesParAction).toBe(225);
    // 15 h mesurées, moins 1 h de lecture (9 000 mots à 150 par minute) et 2 h de combats, pour 300 tours : 12 h = 43 200 s, soit 144 s par tour.
    expect(l.secondesParActionConseille).toBe(Math.round((15 * 3600 - (9000 / 150) * 60 - 2 * 3600) / 300));
    expect(texteCalibrage(r)).toMatch(/plus long que prévu/);
  });

  it('dit « conforme » à ±15 %, « plus court » en dessous', () => {
    expect(texteCalibrage(calibrer(ex({ tombe: { secondes: 10.5 * 3600, actions: 300, sessions: 1 } }), estimations))).toMatch(/conforme/);
    expect(texteCalibrage(calibrer(ex({ tombe: { secondes: 6 * 3600, actions: 300, sessions: 1 } }), estimations))).toMatch(/plus court que prévu/);
  });

  it("ignore ce qui n'est pas exploitable, sans planter", () => {
    expect(calibrer('pas du json', estimations).erreur).toMatch(/JSON/);
    expect(calibrer('{"a":1}', estimations).erreur).toMatch(/mesures/);
    const r = calibrer(ex({ inconnue: { secondes: 3600, actions: 10, sessions: 1 }, tombe: { secondes: 0, actions: 0, sessions: 0 }, bizarre: 'x' }), estimations);
    expect(r.lignes).toEqual([]);
    expect(r.inconnues).toEqual(['inconnue']);
    expect(texteCalibrage(r)).toMatch(/inconnue : histoire inconnue/);
  });
});
