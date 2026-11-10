import { describe, expect, it } from 'vitest';
import type { ChoixAffiche, Jet } from '@crpg/regles';
import { actionDeTouche, libelleJet, ligneDeJet, nomDuTest } from './evenement-regles';

const choix: ChoixAffiche[] = [
  { id: 'boire', libelle: 'Buvez à la source.' },
  { id: 'goutter', origine: 'Nain', libelle: '« Laissez-moi goûter. »' },
  { id: 'cher', libelle: 'Plonger la main.', desactivee: 'Trop cher.' },
];

describe('écran des événements à choix : règles pures', () => {
  it('les touches : un chiffre choisit, le chiffre suivant le dernier choix quitte, Échap quitte', () => {
    expect(actionDeTouche('1', choix, false)).toEqual({ type: 'choix', id: 'boire' });
    expect(actionDeTouche('2', choix, false)).toEqual({ type: 'choix', id: 'goutter' });
    expect(actionDeTouche('3', choix, false)).toBeUndefined();
    expect(actionDeTouche('4', choix, false)).toEqual({ type: 'partir' });
    expect(actionDeTouche('9', choix, false)).toBeUndefined();
    expect(actionDeTouche('Escape', choix, false)).toEqual({ type: 'partir' });
    expect(actionDeTouche('a', choix, false)).toBeUndefined();
  });

  it('une fois le résultat lu, seuls Échap, Entrée et Espace quittent : un chiffre ne choisit plus rien', () => {
    expect(actionDeTouche('1', [], true)).toBeUndefined();
    expect(actionDeTouche('Enter', [], true)).toEqual({ type: 'partir' });
    expect(actionDeTouche(' ', [], true)).toEqual({ type: 'partir' });
    expect(actionDeTouche('Escape', [], true)).toEqual({ type: 'partir' });
  });

  it('les libellés des tests et des jets', () => {
    expect(nomDuTest('medecine')).toBe('Médecine');
    expect(libelleJet({ competence: 'medecine', dd: 12 })).toBe('Médecine, DD 12');
    const jet = { qui: 'pip', nom: 'Pip', test: 'medecine', dd: 12, des: [10], bonus: 4, total: 14, reussite: true } as Jet;
    expect(ligneDeJet(jet)).toBe('Pip — Médecine : 14 contre DD 12, réussi');
    expect(ligneDeJet({ ...jet, reussite: false })).toMatch(/raté$/);
  });
});
