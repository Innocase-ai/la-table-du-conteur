// La carte du monde : accès d'un clic, trajets depuis le lieu du groupe, double-clic.
import { describe, expect, it } from 'vitest';
import type { MarqueurCarte } from '@crpg/regles';
import { activation, DELAI_DOUBLE, estDouble, libelleHeures, motifInaccessible, peutAller, trajetsDepuisIci } from './carte-regles';

const marq = (id: string, x: number, y: number, extra: Partial<MarqueurCarte> = {}): MarqueurCarte => ({ id, nom: id.toUpperCase(), type: 'lieu-dit', x, y, auto: false, etat: 'visite', aCarte: false, ...extra });

const ici = marq('place', 50, 50, { etat: 'ici' });
const libre = marq('forge', 70, 50, { acces: { heures: 2, verrouille: false, bloque: false } });
const proche = marq('puits', 50, 58, { etat: 'connu', acces: { heures: 0.5, verrouille: false, bloque: false } });
const ferme = marq('cave', 20, 30, { acces: { heures: 1, verrouille: true, bloque: false } });
const mur = marq('mine', 80, 80, { acces: { heures: 3, verrouille: false, bloque: true } });
const loin = marq('moulin', 10, 90);

describe('lieux accessibles d’un clic', () => {
  it('seul un passage libre, depuis ailleurs, se déclenche', () => {
    expect(peutAller(libre)).toBe(true);
    expect(peutAller(proche)).toBe(true);
    expect(peutAller(ferme)).toBe(false);
    expect(peutAller(mur)).toBe(false);
    expect(peutAller(loin)).toBe(false);
    expect(peutAller(ici)).toBe(false);
    expect(peutAller(undefined)).toBe(false);
  });

  it('un lieu où le groupe est déjà, même avec un accès déclaré, ne se déclenche pas', () => {
    expect(peutAller({ ...ici, acces: { heures: 1, verrouille: false, bloque: false } })).toBe(false);
  });

  it('dit pourquoi on ne peut pas', () => {
    expect(motifInaccessible(ferme)).toMatch(/verrouillé/);
    expect(motifInaccessible(mur)).toMatch(/infranchissable/);
    expect(motifInaccessible(loin)).toMatch(/Pas de passage direct/);
    expect(motifInaccessible(libre)).toBeUndefined();
    expect(motifInaccessible(ici)).toBeUndefined();
  });
});

describe('durées', () => {
  it('en heures, à la française', () => {
    expect(libelleHeures(2)).toBe('2 h');
    expect(libelleHeures(0.5)).toBe('0,5 h');
    expect(libelleHeures(1.25)).toBe('1,3 h');
    expect(libelleHeures(0)).toBe('');
    expect(libelleHeures(undefined)).toBe('');
  });
});

describe('trajets depuis le lieu du groupe', () => {
  it('un trait vers chaque sortie connue (même fermée), avec durée, milieu et statut', () => {
    const t = trajetsDepuisIci({ marqueurs: [ici, libre, proche, ferme, mur, loin] });
    expect(t.map((x) => x.vers)).toEqual(['forge', 'puits', 'cave', 'mine']);
    expect(t[0]).toMatchObject({ de: { x: 50, y: 50 }, a: { x: 70, y: 50 }, milieu: { x: 60, y: 50 }, heures: 2, duree: '2 h', statut: 'libre' });
    expect(t[1]!.duree).toBe('0,5 h');
    expect(t[2]!.statut).toBe('verrouille');
    expect(t[3]!.statut).toBe('bloque');
  });

  it('aucun trait si le groupe n’est pas sur cette carte', () => {
    expect(trajetsDepuisIci({ marqueurs: [libre, loin] })).toEqual([]);
  });
});

describe('activation et double-clic', () => {
  it('un premier clic choisit ; Entrée sur le lieu déjà choisi y va ; jamais pour un lieu fermé', () => {
    expect(activation(libre, undefined)).toBe('choisir');
    expect(activation(libre, 'puits')).toBe('choisir');
    expect(activation(libre, 'forge')).toBe('aller');
    expect(activation(ferme, 'cave')).toBe('choisir');
    expect(activation(ici, 'place')).toBe('choisir');
  });

  it('deux clics sur le même lieu, assez rapprochés, font un double', () => {
    expect(estDouble(undefined, 'forge', 1000)).toBe(false);
    expect(estDouble({ id: 'forge', instant: 1000 }, 'forge', 1000 + DELAI_DOUBLE)).toBe(true);
    expect(estDouble({ id: 'forge', instant: 1000 }, 'forge', 1000 + DELAI_DOUBLE + 1)).toBe(false);
    expect(estDouble({ id: 'forge', instant: 1000 }, 'puits', 1100)).toBe(false);
  });
});
