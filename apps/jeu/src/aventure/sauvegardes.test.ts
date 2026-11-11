// Les sauvegardes du jeu (audit du moteur, S1, S2, S4) : une nouvelle histoire garde l'ancienne partie de côté, un échec
// d'écriture est signalé, une partie se charge depuis un fichier sans perdre la courante.
import { afterEach, describe, expect, it } from 'vitest';
import type { Partie } from '@crpg/regles';
import { CLE_PRECEDENTE, CLE_SAUVEGARDE, importerPartie, restaurerPartiePrecedente, sauvegardeEnEchec, sauverPartie } from './partie';

const stock = new Map<string, string>();
let plein = false;
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => stock.get(k) ?? null,
  setItem: (k: string, v: string) => {
    if (plein) throw new Error('QuotaExceededError');
    stock.set(k, v);
  },
  removeItem: (k: string) => void stock.delete(k),
};
afterEach(() => {
  stock.clear();
  plein = false;
});

const partie = (monde: string, graine: number, jour = 1) =>
  ({ version: 2, monde, graine, scene: { type: 'exploration' }, groupe: [], etat: { jour, lieu: 'x' }, modules: {}, journal: [] }) as unknown as Partie;

describe('sauvegardes', () => {
  it('une nouvelle histoire garde l’ancienne partie de côté ; la même partie, non', () => {
    sauverPartie(partie('marche', 1, 4));
    sauverPartie(partie('marche', 1, 5)); // même partie qui avance
    expect(stock.has(CLE_PRECEDENTE)).toBe(false);
    sauverPartie(partie('dime', 9));
    expect(JSON.parse(stock.get(CLE_PRECEDENTE)!).monde).toBe('marche');
    expect(restaurerPartiePrecedente()).toBe(true);
    expect(JSON.parse(stock.get(CLE_SAUVEGARDE)!).monde).toBe('marche');
    expect(JSON.parse(stock.get(CLE_PRECEDENTE)!).monde).toBe('dime');
  });

  it('un échec d’écriture est signalé, puis oublié quand l’écriture réussit de nouveau', () => {
    plein = true;
    expect(sauverPartie(partie('marche', 1))).toBe(false);
    expect(sauvegardeEnEchec()).toBe(true);
    plein = false;
    expect(sauverPartie(partie('marche', 1))).toBe(true);
    expect(sauvegardeEnEchec()).toBe(false);
  });

  it('charger un fichier : refuse ce qui n’est pas une partie, garde la courante comme précédente', () => {
    sauverPartie(partie('marche', 1));
    expect(importerPartie('pas du json')).toMatch(/illisible/);
    expect(importerPartie('{"monde":"x"}')).toMatch(/format/);
    expect(importerPartie(JSON.stringify(partie('dime', 3)))).toBeUndefined();
    expect(JSON.parse(stock.get(CLE_SAUVEGARDE)!).monde).toBe('dime');
    expect(JSON.parse(stock.get(CLE_PRECEDENTE)!).monde).toBe('marche');
  });
});
