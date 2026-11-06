import { describe, expect, it } from 'vitest';
import type { Generateur } from '../src/des';
import { testD20 } from '../src/tests-d20';

/** Générateur qui renvoie les faces de d20 demandées, dans l'ordre. */
function des(...faces: number[]): Generateur {
  const suite = faces.map((f) => (f - 0.5) / 20);
  return () => suite.shift()!;
}

describe('tests d20', () => {
  it('réussit quand le total atteint le DD', () => {
    expect(testD20({ bonus: 3, dd: 15 }, des(12)).reussite).toBe(true);
    expect(testD20({ bonus: 3, dd: 15 }, des(11)).reussite).toBe(false);
  });

  it("garde le meilleur dé avec l'avantage, le pire avec le désavantage", () => {
    expect(testD20({ bonus: 0, dd: 10, avantage: true }, des(4, 17)).retenu).toBe(17);
    expect(testD20({ bonus: 0, dd: 10, desavantage: true }, des(4, 17)).retenu).toBe(4);
  });

  it("annule l'avantage et le désavantage", () => {
    const r = testD20({ bonus: 0, dd: 10, avantage: true, desavantage: true }, des(9));
    expect(r.des).toEqual([9]);
  });

  it("un 20 naturel touche et fait un critique, un 1 naturel rate, pour les attaques seulement", () => {
    expect(testD20({ bonus: -5, dd: 30, attaque: true }, des(20))).toMatchObject({ reussite: true, critique: true });
    expect(testD20({ bonus: 30, dd: 5, attaque: true }, des(1)).reussite).toBe(false);
    expect(testD20({ bonus: 30, dd: 5 }, des(1)).reussite).toBe(true);
  });
});
