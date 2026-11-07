import { describe, expect, it } from 'vitest';
import { AMBIANCES_MUSIQUE, choisirAmbiance, choisirParmi, LIBELLES_FOND, LIBELLES_MUSIQUES, melangerFond, MUSIQUES_ACCUEIL, MUSIQUES_FOND, musiqueVoulue } from './musique-regles';

describe('choisirAmbiance', () => {
  it('ne reprend jamais l’ambiance du combat précédent', () => {
    for (const precedente of AMBIANCES_MUSIQUE) {
      for (let k = 0; k < 100; k++) expect(choisirAmbiance(precedente, k / 100)).not.toBe(precedente);
    }
  });

  it('peut tirer chacune des ambiances quand il n’y a pas de précédente', () => {
    const tirees = new Set(Array.from({ length: 50 }, (_, k) => choisirAmbiance(undefined, k / 50)));
    expect(tirees.size).toBe(AMBIANCES_MUSIQUE.length);
  });

  it('peut tirer chacune des autres quand il y a une précédente', () => {
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

describe('musique de fond des histoires', () => {
  const suite = (n: number) => {
    let x = 0.37;
    return () => (x = (x * 9301 + 49297 * (n + 1)) % 233280 / 233280);
  };

  it('chaque tour joue toutes les musiques de fond une fois', () => {
    for (let n = 0; n < 20; n++) expect([...melangerFond(undefined, suite(n))].sort()).toEqual([...MUSIQUES_FOND].sort());
  });

  it('un nouveau tour ne commence jamais par la dernière musique du précédent', () => {
    for (let n = 0; n < 60; n++) {
      const derniere = MUSIQUES_FOND[n % MUSIQUES_FOND.length]!;
      expect(melangerFond(derniere, suite(n))[0]).not.toBe(derniere);
    }
  });

  it('le mélange suit le hasard donné (début et fin de plage)', () => {
    expect(melangerFond(undefined, () => 0)).toEqual([...MUSIQUES_FOND]);
    expect(melangerFond(undefined, () => 0.999999)).toEqual([...MUSIQUES_FOND].reverse());
  });

  it('chaque fond a son libellé, et il y en a au moins six', () => {
    expect(MUSIQUES_FOND.length).toBeGreaterThanOrEqual(6);
    for (const f of MUSIQUES_FOND) expect(LIBELLES_FOND[f].length).toBeGreaterThan(3);
  });
});

describe('musique de l’accueil', () => {
  it('tire une des deux musiques, sans reprendre la précédente', () => {
    expect(choisirParmi(MUSIQUES_ACCUEIL, 'accueil-1', 0.1)).toBe('accueil-2');
    expect(choisirParmi(MUSIQUES_ACCUEIL, 'accueil-2', 0.9)).toBe('accueil-1');
    expect(new Set(Array.from({ length: 20 }, (_, k) => choisirParmi(MUSIQUES_ACCUEIL, undefined, k / 20))).size).toBe(MUSIQUES_ACCUEIL.length);
  });
});

describe('ce que la musique doit jouer', () => {
  it('un combat l’emporte sur tout, y compris sur une histoire en cours', () => {
    expect(musiqueVoulue('histoire', 'camp')).toEqual({ type: 'combat', id: 'camp' });
    expect(musiqueVoulue('accueil', 'foret')).toEqual({ type: 'combat', id: 'foret' });
    expect(musiqueVoulue(undefined, 'intense')).toEqual({ type: 'combat', id: 'intense' });
  });

  it('sans combat, la musique suit la scène', () => {
    expect(musiqueVoulue('accueil', undefined)).toEqual({ type: 'accueil' });
    expect(musiqueVoulue('histoire', undefined)).toEqual({ type: 'fond' });
    expect(musiqueVoulue(undefined, undefined)).toBeUndefined();
  });
});
