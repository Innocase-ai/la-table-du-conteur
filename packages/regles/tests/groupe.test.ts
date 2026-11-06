import { describe, expect, it } from 'vitest';
import { IA_RAPIDE, SORTS_JOUABLES_EN_COMBAT, avertissementsGroupe, bilanPersonnage, creationRapide, creerCombat, groupeVide, jouerTourIA, kitDepuisFiche, lireGroupe, nouvelId, personnageComplet, preparerRencontre, RENCONTRES, serialiser, type PersonnageCree } from '../src';
import { chargerDonneesSrd } from '../src/donnees-node';

const donnees = chargerDonneesSrd();

function personnage(classe: string, espece: string, niveau = 3): PersonnageCree {
  return { id: nouvelId(), sexe: 'F', alignement: 'NB', portrait: `${espece}-f-1`, choix: creationRapide({ classe, espece, niveau, nom: classe }, donnees) };
}

describe('groupe', () => {
  it('se sérialise et se relit à l’identique, et refuse un fichier invalide', () => {
    const g = groupeVide(3);
    g.emplacements[0] = personnage('guerrier', 'humain');
    g.emplacements[2] = personnage('magicien', 'gnome');
    const relu = lireGroupe(serialiser(g));
    expect(relu.ok && relu.groupe).toEqual(g);
    expect(lireGroupe('pas du json').ok).toBe(false);
    const erreur = lireGroupe(JSON.stringify({ version: 1, niveau: 9, emplacements: [] }));
    expect(!erreur.ok && erreur.erreur).toMatch(/format d'un groupe/);
    expect(lireGroupe(JSON.stringify({ version: 2 })).ok).toBe(false);
    const casse = JSON.parse(serialiser(g));
    casse.emplacements[0].choix.classe = 12;
    expect(lireGroupe(JSON.stringify(casse)).ok).toBe(false);
  });

  it('un personnage de création rapide, avec nom et portrait, est complet', () => {
    expect(personnageComplet(bilanPersonnage(personnage('clerc', 'nain'), donnees))).toBe(true);
    const sansNom = personnage('clerc', 'nain');
    sansNom.choix.nom = '';
    expect(personnageComplet(bilanPersonnage(sansNom, donnees))).toBe(false);
  });

  it('les conseils de composition signalent les manques', () => {
    const fiches = ['guerrier', 'barbare', 'moine', 'roublard'].map((c) => bilanPersonnage(personnage(c, 'humain'), donnees).fiche!);
    const avis = avertissementsGroupe(fiches, donnees).join('\n');
    expect(avis).toMatch(/Groupe de 4/);
    expect(avis).toMatch(/Aucun soigneur/);
    expect(avis).toMatch(/Aucun lanceur/);
    const bon = ['guerrier', 'clerc', 'roublard', 'magicien', 'rodeur', 'paladin'].map((c) => bilanPersonnage(personnage(c, 'humain'), donnees).fiche!);
    const avisBon = avertissementsGroupe(bon, donnees).join('\n');
    expect(avisBon).not.toMatch(/Aucun soigneur|Aucun lanceur|première ligne|incomplet/);
  });
});

describe('sorts jouables en combat', () => {
  it('existent tous dans les données', () => {
    for (const id of SORTS_JOUABLES_EN_COMBAT) expect(donnees.sorts.has(id), id).toBe(true);
  });
});

describe('un groupe créé se bat', () => {
  const classes = [...donnees.classes.keys()];
  for (const niveau of [1, 3, 5, 10, 20]) {
    for (let partie = 0; partie < 2; partie++) {
      it(`classes ${partie * 6 + 1} à ${partie * 6 + 6}, niveau ${niveau}`, () => {
        const heros = classes.slice(partie * 6, partie * 6 + 6).map((classe, i) => {
          const p = personnage(classe, [...donnees.especes.keys()][(i + partie) % 9]!, niveau);
          const b = bilanPersonnage(p, donnees);
          expect(b.fiche, b.erreurs.join(' ')).toBeDefined();
          return { fiche: b.fiche!, kit: kitDepuisFiche(b.fiche!) };
        });
        const rencontre = RENCONTRES[0]!;
        const { grille, combattants } = preparerRencontre(rencontre, donnees, heros);
        expect(combattants.filter((c) => c.camp === 'heros')).toHaveLength(6);
        for (const h of combattants.filter((c) => c.camp === 'heros')) expect(h.attaques.length, h.nom).toBeGreaterThan(0);
        const etat = creerCombat(grille, combattants, 99 + niveau);
        let tours = 0;
        while (!etat.vainqueur && tours < 500) {
          jouerTourIA(etat, { sorts: donnees.sorts }, IA_RAPIDE);
          tours++;
        }
        expect(etat.vainqueur, 'le combat doit se terminer').toBeDefined();
      });
    }
  }
});

describe('groupe conseillé', () => {
  it('est complet et sans avertissement de composition, à tous les niveaux', async () => {
    const { groupeConseille } = await import('../src');
    for (let niveau = 1; niveau <= 5; niveau++) {
      const g = groupeConseille(niveau, donnees);
      const bilans = g.emplacements.map((p) => bilanPersonnage(p!, donnees));
      for (const b of bilans) expect(personnageComplet(b), b.erreurs.concat(b.manquants.map((m) => m.message)).join(' | ')).toBe(true);
      expect(avertissementsGroupe(bilans.map((b) => b.fiche!), donnees)).toEqual([]);
    }
  });
});
