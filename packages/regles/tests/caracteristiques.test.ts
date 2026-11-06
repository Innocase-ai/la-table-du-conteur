import { describe, expect, it } from 'vitest';
import { bonusMaitrise, coutAchat, modificateur, niveauPourPx, tirerValeurs } from '../src/caracteristiques';
import { creerGenerateur } from '../src/des';

describe('caractéristiques', () => {
  it('calcule les modificateurs de la table du SRD', () => {
    const attendus: [number, number][] = [[1, -5], [3, -4], [8, -1], [9, -1], [10, 0], [11, 0], [12, 1], [15, 2], [18, 4], [20, 5]];
    for (const [valeur, mod] of attendus) expect(modificateur(valeur)).toBe(mod);
  });

  it('donne le bonus de maîtrise par niveau', () => {
    expect([1, 4, 5, 8, 9, 13, 17, 20].map(bonusMaitrise)).toEqual([2, 2, 3, 3, 4, 5, 6, 6]);
  });

  it('convertit les PX en niveau', () => {
    expect(niveauPourPx(0)).toBe(1);
    expect(niveauPourPx(299)).toBe(1);
    expect(niveauPourPx(300)).toBe(2);
    expect(niveauPourPx(6500)).toBe(5);
    expect(niveauPourPx(400000)).toBe(20);
  });

  it("calcule le coût de l'acquisition par points", () => {
    expect(coutAchat({ for: 15, dex: 15, con: 15, int: 8, sag: 8, cha: 8 })).toBe(27);
    expect(coutAchat({ for: 14, dex: 14, con: 14, int: 12, sag: 10, cha: 8 })).toBe(27);
    expect(coutAchat({ for: 16, dex: 8, con: 8, int: 8, sag: 8, cha: 8 })).toBeUndefined();
  });

  it('tire six valeurs entre 3 et 18', () => {
    const valeurs = tirerValeurs(creerGenerateur(3));
    expect(valeurs).toHaveLength(6);
    for (const v of valeurs) expect(v >= 3 && v <= 18).toBe(true);
  });
});
