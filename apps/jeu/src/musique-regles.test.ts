import { describe, expect, it } from 'vitest';
import { AMBIANCES_MUSIQUE, choisirAmbiance, LIBELLES_MUSIQUES } from './musique-regles';

describe('choisirAmbiance', () => {
  it('ne reprend jamais l’ambiance du combat précédent', () => {
    for (const precedente of AMBIANCES_MUSIQUE) {
      for (let k = 0; k < 100; k++) expect(choisirAmbiance(precedente, k / 100)).not.toBe(precedente);
    }
  });

  it('peut tirer chacune des cinq quand il n’y a pas de précédente', () => {
    const tirees = new Set(Array.from({ length: 50 }, (_, k) => choisirAmbiance(undefined, k / 50)));
    expect(tirees.size).toBe(AMBIANCES_MUSIQUE.length);
  });

  it('peut tirer chacune des quatre autres quand il y a une précédente', () => {
    const tirees = new Set(Array.from({ length: 50 }, (_, k) => choisirAmbiance('foret', k / 50)));
    expect(tirees.size).toBe(AMBIANCES_MUSIQUE.length - 1);
    expect(tirees.has('foret')).toBe(false);
  });

  it('suit le hasard donné, et supporte ses valeurs limites', () => {
    expect(choisirAmbiance(undefined, 0)).toBe(AMBIANCES_MUSIQUE[0]);
    expect(choisirAmbiance(undefined, 0.999999)).toBe(AMBIANCES_MUSIQUE[AMBIANCES_MUSIQUE.length - 1]);
    expect(AMBIANCES_MUSIQUE).toContain(choisirAmbiance(undefined, 1));
    expect(AMBIANCES_MUSIQUE).toContain(choisirAmbiance(undefined, -1));
  });

  it('chaque ambiance a son libellé', () => {
    for (const a of AMBIANCES_MUSIQUE) expect(LIBELLES_MUSIQUES[a].length).toBeGreaterThan(3);
  });
});
