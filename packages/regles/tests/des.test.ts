import { describe, expect, it } from 'vitest';
import { creerGenerateur, lancer, lancerDe } from '../src/des';

describe('dés', () => {
  it('une même graine donne la même suite', () => {
    const a = creerGenerateur(42);
    const b = creerGenerateur(42);
    expect(Array.from({ length: 10 }, () => lancerDe(20, a))).toEqual(Array.from({ length: 10 }, () => lancerDe(20, b)));
  });

  it('reste dans les bornes et couvre toutes les faces', () => {
    const gen = creerGenerateur(7);
    const vus = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const v = lancerDe(6, gen);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      vus.add(v);
    }
    expect(vus.size).toBe(6);
  });

  it('lit les expressions de dés', () => {
    const gen = creerGenerateur(1);
    const r = lancer('2d6+3', gen);
    expect(r.des).toHaveLength(2);
    expect(r.modificateur).toBe(3);
    expect(r.total).toBe(r.des[0]! + r.des[1]! + 3);
    expect(lancer('d20', gen).des).toHaveLength(1);
    expect(lancer('1d8 - 1', gen).modificateur).toBe(-1);
    expect(lancer('4', gen).total).toBe(4);
    expect(() => lancer('2x6', gen)).toThrow();
  });
});
