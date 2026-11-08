import { describe, expect, it } from 'vitest';
import { idAventurier } from './partie';

describe('identifiant des aventuriers', () => {
  it('retire les accents et les tirets de bord', () => {
    expect(idAventurier('Élodie', 0, new Set())).toBe('elodie');
    expect(idAventurier('Éé', 0, new Set())).toBe('ee');
  });
  it('retombe sur le rang sans nom utilisable et sépare les homonymes', () => {
    expect(idAventurier('!!!', 2, new Set())).toBe('heros-3');
    const pris = new Set<string>();
    expect(idAventurier('Bran', 0, pris)).toBe('bran');
    expect(idAventurier('Bran', 1, pris)).toBe('bran-2');
  });
});
