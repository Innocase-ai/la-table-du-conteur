import { describe, expect, it } from 'vitest';
import { maitriseArme } from '../src/combat/creation';
import type { Arme } from '../src/schemas';

const arme = (id: string, categorie: Arme['categorie'], proprietes: string[]): Arme =>
  ({ id, nom: id, categorie, portee: 'corps-a-corps', degats: '1d6', typeDegats: 'tranchant', proprietes, botte: 'Sape', poidsKg: 1, prixPo: 1 });

const hache = arme('hache-a-deux-mains', 'guerre', ['Lourde', 'Deux mains']);
const rapiere = arme('rapiere', 'guerre', ['Finesse']);
const dague = arme('dague', 'courante', ['Finesse', 'Lancer', 'Légère']);
const epeeCourte = arme('epee-courte', 'guerre', ['Finesse', 'Légère']);

describe('maîtrise d’arme', () => {
  const roublard = { maitrisesArmes: ['courantes', 'armes de guerre dotées de la propriété Finesse ou Légère'] };
  it('le roublard maîtrise les armes courantes et les armes de guerre Finesse ou Légère, pas la hache', () => {
    expect(maitriseArme(roublard, dague)).toBe(true);
    expect(maitriseArme(roublard, rapiere)).toBe(true);
    expect(maitriseArme(roublard, epeeCourte)).toBe(true);
    expect(maitriseArme(roublard, hache)).toBe(false);
  });
  it('un guerrier maîtrise tout, un mage seulement les armes courantes', () => {
    expect(maitriseArme({ maitrisesArmes: ['courantes', 'guerre'] }, hache)).toBe(true);
    expect(maitriseArme({ maitrisesArmes: ['courantes'] }, hache)).toBe(false);
    expect(maitriseArme({ maitrisesArmes: ['courantes'] }, dague)).toBe(true);
  });
  it('une maîtrise par id est reconnue', () => {
    expect(maitriseArme({ maitrisesArmes: [] }, hache)).toBe(false);
    expect(maitriseArme({ maitrisesArmes: ['hache-a-deux-mains'] }, hache)).toBe(true);
  });
});
