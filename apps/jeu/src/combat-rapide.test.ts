import { describe, expect, it } from 'vitest';
import { CLE_RAPIDE, ecrireRapide, lireRapide, type Stockage } from './combat-rapide';

const memoire = (): Stockage & { valeurs: Map<string, string> } => {
  const valeurs = new Map<string, string>();
  return { valeurs, getItem: (k) => valeurs.get(k) ?? null, setItem: (k, v) => void valeurs.set(k, v) };
};

const casse: Stockage = {
  getItem: () => {
    throw new Error('stockage indisponible');
  },
  setItem: () => {
    throw new Error('quota dépassé');
  },
};

describe('réglage « Rapide » mémorisé', () => {
  it('par défaut, le combat est à vitesse normale', () => {
    expect(lireRapide(memoire())).toBe(false);
    expect(lireRapide(undefined)).toBe(false);
  });

  it('un choix écrit est relu au combat suivant', () => {
    const s = memoire();
    ecrireRapide(true, s);
    expect(s.valeurs.get(CLE_RAPIDE)).toBe('oui');
    expect(lireRapide(s)).toBe(true);
    ecrireRapide(false, s);
    expect(lireRapide(s)).toBe(false);
  });

  it('une valeur inattendue vaut « normal »', () => {
    const s = memoire();
    s.valeurs.set(CLE_RAPIDE, 'peut-être');
    expect(lireRapide(s)).toBe(false);
  });

  it('un stockage qui échoue ne fait planter ni la lecture ni l’écriture', () => {
    expect(lireRapide(casse)).toBe(false);
    expect(() => ecrireRapide(true, casse)).not.toThrow();
    expect(() => ecrireRapide(true, undefined)).not.toThrow();
  });
});
