import { describe, expect, it } from 'vitest';
import type { Personnage } from '@crpg/regles';
import { annonceDeNiveau } from './niveau-regles';

/** Un héros minimal : seuls l'identité, le niveau du choix, les PV et la montée en attente comptent ici. */
const heros = (id: string, niveau: number, pvMax: number, monteeEnAttente?: number): Personnage =>
  ({ id, nom: id.toUpperCase(), fiche: { espece: 'humain', classe: 'guerrier', pvMax }, choix: { niveau }, ...(monteeEnAttente ? { monteeEnAttente } : {}) }) as unknown as Personnage;

describe('annonce de montée de niveau', () => {
  it('rien tant que le niveau du groupe ne monte pas', () => {
    const g = [heros('a', 1, 11)];
    expect(annonceDeNiveau({ niveau: 1, groupe: g }, { niveau: 1, groupe: g })).toBeUndefined();
  });

  it('dit le niveau atteint et, pour chaque héros qui monte, ses PV avant et après', () => {
    const a = annonceDeNiveau({ niveau: 1, groupe: [heros('a', 1, 11), heros('b', 1, 9)] }, { niveau: 2, groupe: [heros('a', 2, 19), heros('b', 2, 15)] });
    expect(a?.niveau).toBe(2);
    expect(a?.heros.map((h) => [h.id, h.niveauAvant, h.niveau, h.pvAvant, h.pv])).toEqual([
      ['a', 1, 2, 11, 19],
      ['b', 1, 2, 9, 15],
    ]);
  });

  it('signale les héros qui ont des choix à revoir', () => {
    const a = annonceDeNiveau({ niveau: 1, groupe: [heros('a', 1, 11), heros('b', 1, 9)] }, { niveau: 2, groupe: [heros('a', 2, 19, 2), heros('b', 2, 15)] });
    expect(a?.heros.map((h) => h.choix)).toEqual([true, false]);
  });

  it('un héros resté en arrière (choix à revoir) n’est pas annoncé ; sans héros monté, pas d’annonce', () => {
    const avant = { niveau: 1, groupe: [heros('a', 1, 11), heros('b', 1, 9)] };
    expect(annonceDeNiveau(avant, { niveau: 2, groupe: [heros('a', 2, 19), heros('b', 1, 9)] })?.heros.map((h) => h.id)).toEqual(['a']);
    expect(annonceDeNiveau(avant, { niveau: 2, groupe: [heros('a', 1, 11), heros('b', 1, 9)] })).toBeUndefined();
  });

  it('un héros recruté entre-temps (absent d’avant) n’est pas annoncé', () => {
    const a = annonceDeNiveau({ niveau: 1, groupe: [heros('a', 1, 11)] }, { niveau: 2, groupe: [heros('a', 2, 19), heros('c', 2, 14)] });
    expect(a?.heros.map((h) => h.id)).toEqual(['a']);
  });
});
