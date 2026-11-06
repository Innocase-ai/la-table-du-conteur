// Le moteur de combat à haut niveau : attaques par action, dégâts de rage et d'attaque sournoise qui suivent le niveau.
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creationRapide, kitDepuisFiche, nouvelId, preparerRencontre, RENCONTRES, type PersonnageCree } from '../src';
import { chargerDonneesSrd } from '../src/donnees-node';

const donnees = chargerDonneesSrd();

function heroDe(classe: string, niveau: number) {
  const p: PersonnageCree = { id: nouvelId(), sexe: 'F', alignement: 'NB', portrait: 'humain-f-1', choix: creationRapide({ classe, espece: 'humain', niveau, nom: classe }, donnees) };
  const b = bilanPersonnage(p, donnees);
  expect(b.fiche, b.erreurs.join(' ')).toBeDefined();
  const { combattants } = preparerRencontre(RENCONTRES[0]!, donnees, [{ fiche: b.fiche!, kit: kitDepuisFiche(b.fiche!) }]);
  return combattants.find((c) => c.camp === 'heros')!;
}

describe('attaques par action', () => {
  it.each([
    ['guerrier', 4, undefined],
    ['guerrier', 5, 2],
    ['guerrier', 10, 2],
    ['guerrier', 11, 3],
    ['guerrier', 19, 3],
    ['guerrier', 20, 4],
    ['barbare', 5, 2],
    ['barbare', 20, 2],
    ['magicien', 20, undefined],
  ])('%s niveau %i : %s attaque(s)', (classe, niveau, attendu) => {
    expect(heroDe(classe, niveau).ressources.attaquesParAction).toBe(attendu);
  });
});

describe('valeurs qui suivent le niveau', () => {
  it('les dégâts de rage du barbare suivent la table (+2, +3, +4)', () => {
    expect(heroDe('barbare', 1).ressources.degatsRage).toBe(2);
    expect(heroDe('barbare', 9).ressources.degatsRage).toBe(3);
    expect(heroDe('barbare', 16).ressources.degatsRage).toBe(4);
  });

  it('un lanceur de niveau 20 a tous ses emplacements, jusqu\'au niveau de sort 9', () => {
    const m = heroDe('magicien', 20);
    expect(m.incantation?.emplacementsMax.length).toBe(9);
    expect(m.incantation?.emplacementsMax.every((n) => n > 0)).toBe(true);
  });
});
