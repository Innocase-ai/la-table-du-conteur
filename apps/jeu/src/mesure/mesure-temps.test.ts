import { describe, expect, it } from 'vitest';
import { ajouterAction, ajouterSecondes, ajouterSession, bilan, dureeLisible, exporterMesures, INACTIVITE_MAX_S, lireMesures, tempsActif } from './mesure-temps';

const t0 = new Date('2026-11-15T10:00:00Z');

describe('mesure du temps de jeu', () => {
  it('le temps ne compte que si le joueur a agi dans les 90 dernières secondes', () => {
    expect(tempsActif(1_000, 1_000 + 5_000)).toBe(5);
    expect(tempsActif(0, INACTIVITE_MAX_S * 1000)).toBe(5); // pile à la limite : encore là
    expect(tempsActif(0, INACTIVITE_MAX_S * 1000 + 1)).toBe(0); // au-delà : parti
  });

  it('cumule secondes, actions et sessions par histoire, sans toucher aux autres', () => {
    let m = ajouterSession({}, 'tombe', t0);
    m = ajouterSecondes(m, 'tombe', 5, t0);
    m = ajouterSecondes(m, 'tombe', 5, t0);
    m = ajouterAction(m, 'tombe', t0);
    m = ajouterAction(ajouterSecondes(m, 'dime', 5, t0), 'dime', t0);
    expect(m['tombe']).toMatchObject({ secondes: 10, actions: 1, sessions: 1 });
    expect(m['dime']).toMatchObject({ secondes: 5, actions: 1, sessions: 0 });
  });

  it('est pure : les mesures d\'origine ne bougent pas', () => {
    const avant = ajouterSecondes({}, 'a', 5, t0);
    const copie = JSON.stringify(avant);
    ajouterAction(avant, 'a', t0);
    ajouterSecondes(avant, 'a', 5, t0);
    expect(JSON.stringify(avant)).toBe(copie);
  });

  it('lit un texte abîmé sans erreur, entrée par entrée', () => {
    expect(lireMesures(undefined)).toEqual({});
    expect(lireMesures('pas du json')).toEqual({});
    expect(lireMesures('[1,2]')).toEqual({});
    const texte = JSON.stringify({ bon: { secondes: 60, actions: 3, sessions: 1, premiere: 'a', derniere: 'b' }, negatif: { secondes: -1, actions: 0, sessions: 0 }, faux: 'x', incomplet: { secondes: 1 } });
    expect(Object.keys(lireMesures(texte))).toEqual(['bon']);
  });

  it('exporte puis relit les mesures à l\'identique', () => {
    const m = ajouterAction(ajouterSecondes(ajouterSession({}, 'tombe', t0), 'tombe', 3600, t0), 'tombe', t0);
    const export_ = JSON.parse(exporterMesures(m)) as { version: number; mesures: unknown };
    expect(export_.version).toBe(1);
    expect(lireMesures(JSON.stringify(export_.mesures))).toEqual(m);
  });

  it('le bilan donne les secondes par action et le rapport à l\'estimation', () => {
    const m = ajouterAction(ajouterSecondes({}, 'x', 7200, t0), 'x', t0)['x']!;
    const b = bilan('x', { ...m, actions: 90 }, 4);
    expect(b.heures).toBe(2);
    expect(b.secondesParAction).toBe(80);
    expect(b.rapport).toBe(0.5); // 2 h mesurées pour 4 h estimées
    expect(bilan('x', { ...m, actions: 0 }, 4).rapport).toBeUndefined(); // aucune action : rien à comparer
    expect(bilan('x', m, undefined).rapport).toBeUndefined();
  });

  it('écrit une durée lisible', () => {
    expect(dureeLisible(20)).toBe("moins d'une minute");
    expect(dureeLisible(12 * 60)).toBe('12 min');
    expect(dureeLisible(2 * 3600 + 5 * 60)).toBe('2 h 05');
  });
});
