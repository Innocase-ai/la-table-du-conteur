// Adapter une rencontre d'histoire (écrite pour 6) au nombre de héros du groupe, et jouer avec 1 à 6 héros.
import { describe, expect, it } from 'vitest';
import { adapterRencontre, avertissementsGroupe, bilanPersonnage, creationRapide, creerCombat, IA_RAPIDE, jouerTourIA, kitDepuisFiche, nouvelId, preparerRencontre, RENCONTRES, type PersonnageCree, type Rencontre } from '../src';
import { chargerDonneesSrd } from '../src/donnees-node';
import { MONDES_ESSAI } from './mondes-essai';

const donnees = chargerDonneesSrd();
const base = RENCONTRES[0]!;
const rencontre = (monstres: Rencontre['monstres']): Rencontre => ({ ...base, monstres });
const total = (r: Rencontre) => r.monstres.reduce((s, m) => s + m.nombre, 0);

describe('adapterRencontre', () => {
  it('ne change rien à 6 héros, et ne renforce jamais', () => {
    const r = rencontre([{ profil: 'gobelin', nombre: 6 }]);
    expect(adapterRencontre(r, 6)).toBe(r);
    expect(adapterRencontre(r, 8)).toBe(r);
  });

  it('réduit au prorata : 6 gobelins → 4, 3, 2, 1 pour 4, 3, 2, 1 héros', () => {
    const r = rencontre([{ profil: 'gobelin', nombre: 6 }]);
    expect([5, 4, 3, 2, 1].map((n) => total(adapterRencontre(r, n)))).toEqual([5, 4, 3, 2, 1]);
  });

  it('garde au moins un monstre par groupe tant que la part du groupe le permet, et retire les renforts d\'abord', () => {
    const r = rencontre([
      { profil: 'ogre', nombre: 1 },
      { profil: 'gobelin', nombre: 4 },
    ]);
    expect(adapterRencontre(r, 3).monstres).toEqual([
      { profil: 'ogre', nombre: 1 },
      { profil: 'gobelin', nombre: 2 },
    ]);
    // Un héros seul : le groupe principal reste, les renforts partent.
    expect(adapterRencontre(r, 1).monstres).toEqual([{ profil: 'ogre', nombre: 1 }]);
  });

  it('ne retire jamais le groupe principal et reste au moins à un monstre', () => {
    for (const n of [1, 2, 3, 4, 5]) {
      const a = adapterRencontre(rencontre([{ profil: 'loup', nombre: 2 }, { profil: 'loup-sanguinaire', nombre: 1 }]), n);
      expect(a.monstres[0]!.profil).toBe('loup');
      expect(total(a)).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('jouer avec 1 à 6 héros', () => {
  const classes = ['guerrier', 'clerc', 'roublard', 'magicien', 'rodeur', 'paladin'];
  const heros = (n: number) =>
    classes.slice(0, n).map((classe) => {
      const p: PersonnageCree = { id: nouvelId(), sexe: 'F', alignement: 'NB', portrait: 'humain-f-1', choix: creationRapide({ classe, espece: 'humain', niveau: 3, nom: classe }, donnees) };
      const b = bilanPersonnage(p, donnees);
      expect(b.fiche, b.erreurs.join(' ')).toBeDefined();
      return { fiche: b.fiche!, kit: kitDepuisFiche(b.fiche!) };
    });

  for (const n of [1, 2, 3, 4, 5, 6]) {
    it(`${n} héros : le combat se prépare avec les monstres adaptés et se joue jusqu'au bout`, () => {
      const r = adapterRencontre(base, n);
      const { grille, combattants } = preparerRencontre(r, donnees, heros(n));
      expect(combattants.filter((c) => c.camp === 'heros')).toHaveLength(n);
      expect(combattants.filter((c) => c.camp === 'monstres')).toHaveLength(total(r));
      const etat = creerCombat(grille, combattants, 11 + n);
      let tours = 0;
      while (!etat.vainqueur && tours < 500) {
        jouerTourIA(etat, { sorts: donnees.sorts }, IA_RAPIDE);
        tours++;
      }
      expect(etat.vainqueur).toBeDefined();
    });
  }
});

describe('conseils de groupe', () => {
  const fiche = (classe: string) => bilanPersonnage({ id: nouvelId(), sexe: 'F', alignement: 'NB', portrait: 'humain-f-1', choix: creationRapide({ classe, espece: 'humain', niveau: 3, nom: classe }, donnees) }, donnees).fiche!;

  it('un héros seul n\'a ni « groupe incomplet » ni conseil de rôles, mais une note sur les combats adaptés', () => {
    const avis = avertissementsGroupe([fiche('guerrier')], donnees);
    expect(avis.join('\n')).not.toMatch(/incomplet|soigneur|première ligne|roublard|lanceur/);
    expect(avis.join('\n')).toMatch(/Groupe de 1/);
  });

  it('un groupe vide demande de créer au moins un aventurier', () => {
    expect(avertissementsGroupe([], donnees)[0]).toMatch(/au moins un aventurier/);
  });

  it('un groupe de quatre sans soigneur est averti', () => {
    const avis = avertissementsGroupe(['guerrier', 'roublard', 'barbare', 'moine'].map(fiche), donnees).join('\n');
    expect(avis).toMatch(/Aucun soigneur/);
  });
});

describe('une histoire avec un groupe réduit', () => {
  it.each([1, 2, 4])('le joueur automatique explore la Citadelle avec %i héros sans erreur', async (n) => {
    const { join } = await import('node:path');
    const { chargerMonde } = await import('../src/monde/chargeur');
    const { explorerParcours, personnageDepuisFiche, groupeConseille } = await import('../src');
    const r = chargerMonde(join(MONDES_ESSAI, 'citadelle-des-marees'));
    if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
    const niveau = r.monde.monde.niveaux.min;
    const groupe = groupeConseille(niveau, donnees)
      .emplacements.slice(0, n)
      .map((p) => {
        const f = bilanPersonnage(p!, donnees).fiche!;
        return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
      });
    const rap = explorerParcours({ dm: r.monde, srd: donnees }, { groupe, niveau, graines: [21], budgetEtats: 150, budgetMs: 20_000 });
    expect(rap.etats).toBeGreaterThan(0);
  });
});
