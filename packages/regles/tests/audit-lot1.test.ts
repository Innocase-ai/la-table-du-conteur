// Corrections de l'audit des règles du 07/11/2026 (lot 1) : chaque écart relevé contre le SRD 5.2.1 est figé ici.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BUDGET_PX } from '../src/budget';
import { budgetDuGroupe } from '../src/combat/escarmouche';
import { chargerDonneesSrd } from '../src/donnees-node';
import { niveauPourPx } from '../src/caracteristiques';
import { calculerFiche, metresDeColonne, type ChoixPersonnage } from '../src/fiche';
import { creationRapide, manquants, monterAuNiveau } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { etatInitial } from '../src/monde/etat';

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

describe('audit lot 2 : PX de départ', () => {
  const r = chargerMonde(join(RACINE_MONDES, 'val-des-cendres'));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  const dm = r.monde;

  it('un groupe qui commence au niveau N a les PX du niveau N', () => {
    expect(etatInitial(dm, 1).xp).toBe(0);
    expect(etatInitial(dm, 3).xp).toBe(900);
    expect(niveauPourPx(etatInitial(dm, 3).xp)).toBe(3);
    expect(niveauPourPx(etatInitial(dm, 3).xp + 899)).toBe(3); // le niveau 4 est à 2 700
    expect(niveauPourPx(etatInitial(dm, 3).xp + 1800)).toBe(4);
  });
});

describe('audit lot 2 : Faveur épique au niveau 19', () => {
  const classes = [...donnees.classes.keys()];

  it('les 12 classes reçoivent une faveur au niveau 19, aucune avant', () => {
    expect(classes).toHaveLength(12);
    for (const id of classes) {
      const faveur = donnees.classes.get(id)!.aptitudes.find((a) => a.id === 'faveur-epique')!;
      expect(faveur.niveau, id).toBe(19);
      expect(faveur.effets.map((e) => e.type), id).toEqual(['faveur_epique']);
    }
  });

  it('création rapide : faveur recommandée, caractéristique relevée de 1 (au-delà de 20 possible)', () => {
    for (const id of classes) {
      const choix = creationRapide({ classe: id, espece: 'humain', niveau: 19, nom: 'Test' }, donnees);
      const faveurs = (choix.dons ?? []).filter((d) => donnees.dons.get(d)?.categorie === 'faveur-epique');
      expect(faveurs, id).toHaveLength(1);
      expect(choix.faveurCaracteristique, id).toHaveLength(1);
      const avec = calculerFiche(choix, donnees);
      const sans = calculerFiche({ ...choix, faveurCaracteristique: undefined }, donnees);
      if (!avec.ok || !sans.ok) throw new Error(id);
      const k = choix.faveurCaracteristique![0]!;
      expect(avec.fiche.caracteristiques[k].valeur, id).toBe(sans.fiche.caracteristiques[k].valeur + 1);
      expect(sans.fiche.avertissements.join(' '), id).toMatch(/aucune caractéristique relevée/);
      expect(manquants(choix, donnees, { nom: 'T', portrait: 'x', alignement: 'NB' }), id).toEqual([]);
      // Sans faveur choisie, l'écran de création le réclame (la fiche, elle, reste calculable).
      const nu = { ...choix, dons: (choix.dons ?? []).filter((d) => !faveurs.includes(d)), faveurCaracteristique: undefined };
      expect(manquants(nu, donnees, { nom: 'T', portrait: 'x', alignement: 'NB' }).map((m) => m.message).join(' '), id).toMatch(/Faveur épique/);
      expect(calculerFiche(nu, donnees).ok, id).toBe(true);
    }
  });

  it('une faveur plafonne à 30 et respecte ses caractéristiques permises', () => {
    const base = creationRapide({ classe: 'guerrier', espece: 'humain', niveau: 19, nom: 'Test' }, donnees);
    const irresistible = { ...base, dons: [...(base.dons ?? []).filter((d) => donnees.dons.get(d)?.categorie !== 'faveur-epique'), 'faveur-d-attaque-irresistible'] };
    expect(calculerFiche({ ...irresistible, faveurCaracteristique: ['for'] }, donnees).ok).toBe(true);
    const refus = calculerFiche({ ...irresistible, faveurCaracteristique: ['sag'] }, donnees);
    expect(refus.ok).toBe(false);
    // Mémoire magique sans aptitude Sorts : ignorée avec un avertissement.
    const memoire = calculerFiche({ ...base, dons: [...(base.dons ?? []).filter((d) => donnees.dons.get(d)?.categorie !== 'faveur-epique'), 'faveur-de-memoire-magique'], faveurCaracteristique: ['int'] }, donnees);
    expect(memoire.ok && memoire.fiche.avertissements.join(' ')).toMatch(/aptitude Sorts/);
  });

  it('avant le niveau 19, un don de faveur reste ignoré avec un avertissement (comportement inchangé)', () => {
    const choix = creationRapide({ classe: 'guerrier', espece: 'humain', niveau: 18, nom: 'Test' }, donnees);
    const r = calculerFiche({ ...choix, dons: [...(choix.dons ?? []), 'faveur-du-destin'] }, donnees);
    expect(r.ok && r.fiche.avertissements.join(' ')).toMatch(/pas de place pour un don de cette catégorie/);
  });

  it('monter de 18 à 19 ajoute la faveur recommandée sans toucher aux autres choix', () => {
    const c18 = creationRapide({ classe: 'roublard', espece: 'humain', niveau: 18, nom: 'Test' }, donnees);
    const r = monterAuNiveau(c18, 19, donnees);
    expect(r).toBeDefined();
    expect(r!.choix.dons).toContain('faveur-de-l-esprit-nocturne');
    expect(r!.choix.faveurCaracteristique).toHaveLength(1);
    expect(r!.choix.ameliorations).toEqual(c18.ameliorations); // le Roublard n'a plus d'amélioration en trop au niveau 19
  });
});
