// Corrections de l'audit des règles du 07/11/2026 (lot 1) : chaque écart relevé contre le SRD 5.2.1 est figé ici.
import { describe, expect, it } from 'vitest';
import { BUDGET_PX } from '../src/budget';
import { budgetDuGroupe } from '../src/combat/escarmouche';
import { chargerDonneesSrd } from '../src/donnees-node';
import { calculerFiche, metresDeColonne, type ChoixPersonnage } from '../src/fiche';

const donnees = chargerDonneesSrd();

function fiche(choix: ChoixPersonnage) {
  const r = calculerFiche(choix, donnees);
  if (!r.ok) throw new Error(r.erreurs.join('\n'));
  return r.fiche;
}

const moine = (niveau: number): ChoixPersonnage => ({
  nom: 'Durgan',
  classe: 'moine',
  niveau,
  espece: 'nain',
  historique: 'soldat',
  methode: 'standard',
  valeursBase: { for: 12, dex: 15, con: 13, int: 10, sag: 14, cha: 8 },
  bonusHistorique: { dex: 2, con: 1 },
  ameliorations: [{ sag: 2 }, { sag: 2 }, { sag: 2 }].slice(0, Math.floor(niveau / 4)),
  competencesClasse: ['acrobaties', 'intuition'],
});

describe('audit lot 1 : classes', () => {
  it('Moine : le Déplacement sans armure suit la colonne de la progression (+3, +4,5, +6, +7,5, +9 m)', () => {
    // Nain : Vitesse 9 m.
    expect(fiche(moine(2)).vitesse).toBeCloseTo(12);
    expect(fiche(moine(6)).vitesse).toBeCloseTo(13.5);
    expect(fiche(moine(10)).vitesse).toBeCloseTo(15);
  });

  it('metresDeColonne lit « +4,50 m » et ignore un trait', () => {
    expect(metresDeColonne('+4,50 m')).toBe(4.5);
    expect(metresDeColonne('+3 m')).toBe(3);
    expect(metresDeColonne('—')).toBeUndefined();
    expect(metresDeColonne(undefined)).toBeUndefined();
  });

  it('Clerc : 3 sorts mineurs aux niveaux 1-3, 4 aux niveaux 4-9, 5 à partir du niveau 10', () => {
    const clerc = donnees.classes.get('clerc')!;
    const mineurs = clerc.incantation!.sortsMineurs;
    expect(mineurs).toHaveLength(20);
    expect(mineurs.slice(0, 3)).toEqual([3, 3, 3]);
    expect(mineurs.slice(3, 9)).toEqual([4, 4, 4, 4, 4, 4]);
    expect(mineurs.slice(9)).toEqual(Array(11).fill(5));
  });

  it('Manifestations occultes et Métamagie : nombres définis jusqu’au niveau 20', () => {
    const choix = [...donnees.choix.values()];
    const manif = choix.find((c) => c.id === 'manifestations-occultes')!;
    const meta = choix.find((c) => c.id === 'metamagie')!;
    expect(manif.nombres).toHaveLength(20);
    expect(manif.nombres[19]).toBe(10);
    expect(meta.nombres).toHaveLength(20);
    expect(meta.nombres[1]).toBe(2); // niveau 2
    expect(meta.nombres[9]).toBe(4); // niveau 10
    expect(meta.nombres[16]).toBe(6); // niveau 17
  });
});

describe('audit lot 1 : objets magiques (table « Rareté et valeur » du SRD)', () => {
  const objets = [...donnees.objets.values()].filter((o) => o.magique && o.rarete);
  const TABLE: Record<string, number> = { commun: 100, 'peu-commun': 400, rare: 4000, 'tres-rare': 40000, legendaire: 200000 };

  it('un objet magique permanent vaut la valeur de sa rareté ; un objet à usage unique, la moitié', () => {
    let permanents = 0;
    let uniques = 0;
    for (const o of objets) {
      const t = TABLE[o.rarete!];
      if (t === undefined || o.valeurPo === undefined) continue;
      if (o.usage?.type === 'consommable') {
        // Les munitions (Projectile +1 à +3) se vendent à la pièce : un vingtième d'un lot.
        if (/^projectile-plus-/.test(o.id)) expect(o.valeurPo, o.id).toBe(t / 20);
        else if (o.rarete !== 'commun' || o.valeurPo !== 100) expect(o.valeurPo, o.id).toBe(t / 2);
        uniques++;
      } else if (o.rarete !== 'commun') {
        expect(o.valeurPo, o.id).toBe(t);
        permanents++;
      }
    }
    expect(permanents).toBeGreaterThan(100);
    expect(uniques).toBeGreaterThan(30);
  });

  it('la potion de guérison (courante) vaut 50 po', () => {
    expect(donnees.objets.get('potion-de-guerison')?.valeurPo).toBe(50);
  });
});

describe('audit lot 1 : budget de PX des rencontres, niveaux 1 à 20', () => {
  it('la table du SRD est complète (20 niveaux, croissante)', () => {
    expect(Object.keys(BUDGET_PX)).toHaveLength(20);
    for (let n = 2; n <= 20; n++) {
      const [a, b, c] = BUDGET_PX[n]!;
      expect(a).toBeLessThan(b);
      expect(b).toBeLessThan(c);
      expect(a).toBeGreaterThanOrEqual(BUDGET_PX[n - 1]![0]);
    }
    expect(BUDGET_PX[11]).toEqual([1900, 2900, 4100]);
    expect(BUDGET_PX[20]).toEqual([6400, 13200, 22000]);
  });

  it('un groupe de niveau 15 n’a plus le budget du niveau 10', () => {
    const quinze = budgetDuGroupe([15, 15, 15, 15], 'faible');
    const dix = budgetDuGroupe([10, 10, 10, 10], 'faible');
    expect(quinze).toBe(Math.round(3300 * 4));
    expect(quinze).toBeGreaterThan(dix);
  });
});
