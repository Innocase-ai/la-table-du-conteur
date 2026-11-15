// Un groupe enregistré avant le grimoire du Magicien (14/11) : son Magicien n'a pas de livre. Il ne doit pas devenir « incomplet »
// (et donc rester au camp) : un groupe de 6 doit entrer en jeu à 6.
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, completerGrimoireGroupe, groupeConseille, personnageComplet, type Groupe } from '../src';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const complets = (g: Groupe) => g.emplacements.filter((p) => p && personnageComplet(bilanPersonnage(p, srd))).length;

/** Le groupe conseillé tel qu'il était enregistré avant le grimoire : aucun héros n'a de `sortsGrimoire`. */
function groupeDAvant(niveau = 1): Groupe {
  const g = groupeConseille(niveau, srd, 6);
  for (const p of g.emplacements) delete p!.choix.sortsGrimoire;
  return g;
}

describe('groupe enregistré avant le grimoire', () => {
  it('le Magicien sans livre est repéré (c\'est lui que le groupe perdait : 6 héros, 5 complets)', () => {
    expect(complets(groupeDAvant())).toBe(5);
  });

  it('une fois le livre inscrit, les 6 héros sont complets', () => {
    for (const niveau of [1, 3, 5]) expect(complets(completerGrimoireGroupe(groupeDAvant(niveau), srd))).toBe(6);
  });

  it('le Magicien ne perd rien : ses sorts préparés sont dans le livre inscrit, et le reste du groupe est inchangé', () => {
    const avant = groupeDAvant(3);
    const apres = completerGrimoireGroupe(avant, srd);
    const mage = apres.emplacements.find((p) => p!.choix.classe === 'magicien')!;
    const ancien = avant.emplacements.find((p) => p!.choix.classe === 'magicien')!;
    expect(mage.choix.sortsGrimoire!.length).toBeGreaterThanOrEqual(6);
    for (const id of ancien.choix.sortsPrepares ?? []) expect(mage.choix.sortsGrimoire).toContain(id);
    expect(mage.choix.sortsPrepares).toEqual(ancien.choix.sortsPrepares);
    apres.emplacements.forEach((p, i) => {
      if (p!.choix.classe !== 'magicien') expect(p).toBe(avant.emplacements[i]);
    });
  });

  it('un groupe à jour est rendu tel quel, et la migration ne se refait pas', () => {
    const neuf = groupeConseille(2, srd, 6);
    expect(completerGrimoireGroupe(neuf, srd)).toBe(neuf);
    const une = completerGrimoireGroupe(groupeDAvant(2), srd);
    expect(completerGrimoireGroupe(une, srd)).toBe(une);
  });

  it('les emplacements vides restent vides (groupe de 4 compris)', () => {
    const g = groupeDAvant();
    g.emplacements[1] = null;
    const r = completerGrimoireGroupe(g, srd);
    expect(r.emplacements[1]).toBeNull();
    expect(r.emplacements).toHaveLength(6);
    expect(complets(r)).toBe(5);
  });
});
