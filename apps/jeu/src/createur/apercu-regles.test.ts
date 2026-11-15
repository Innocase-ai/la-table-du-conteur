// L'aperçu en direct du créateur, le filtre des sorts jouables en combat et la création rapide variée (proposition 9).
import { describe, expect, it } from 'vitest';
import { SORTS_JOUABLES_EN_COMBAT, bilanPersonnage, type Sort } from '@crpg/regles';
import { chargerDonneesSrd } from '../../../../packages/regles/src/donnees-node';
import { apercuBrouillon, compterParUsage, filtrerParUsage, meilleureAttaque, sortsDuBrouillon } from './apercu-regles';
import { brouillonVide, changerClasse, changerEspece, creationRapideBrouillon, versPersonnage, type Brouillon } from './brouillon';
import { NOMS_PRETIRES, PORTRAITS, nomAuHasard, portraitsPour } from './portraits';

const srd = chargerDonneesSrd();

function rapide(classe: string, espece = 'humain', hasard = () => 0): Brouillon {
  let b = brouillonVide(1);
  b = changerEspece(b, espece, srd);
  b = changerClasse(b, classe, srd);
  const r = creationRapideBrouillon(b, srd, hasard);
  if (!r) throw new Error('création rapide impossible');
  return r;
}

describe("aperçu du héros en construction", () => {
  it("n'affiche rien tant que la classe et l'espèce ne sont pas choisies, en disant quoi choisir", () => {
    const vide = apercuBrouillon(brouillonVide(1), srd);
    expect(vide.disponible).toBe(false);
    expect(vide.indication).toMatch(/espèce et une classe/);
    const classeSeule = apercuBrouillon(changerClasse(brouillonVide(1), 'guerrier', srd), srd);
    expect(classeSeule.disponible).toBe(false);
    expect(classeSeule.indication).toMatch(/espèce/);
  });

  it("un brouillon complet donne les chiffres de la fiche du moteur, marqués exacts", () => {
    const b = rapide('guerrier');
    const a = apercuBrouillon(b, srd);
    const p = versPersonnage(b, 'x', srd)!;
    const fiche = bilanPersonnage(p, srd).fiche!;
    expect(a.exact).toBe(true);
    expect(a.pv).toBe(fiche.pvMax);
    expect(a.ca).toBe(fiche.ca);
    expect(a.attaque?.bonus).toBeGreaterThan(0);
    expect(a.attaque?.degats).toMatch(/d\d/);
    expect(a.sorts).toBeUndefined();
  });

  it("tolère un brouillon incomplet : classe et espèce suffisent, l'aperçu est alors provisoire", () => {
    const b = changerClasse(changerEspece(brouillonVide(1), 'nain', srd), 'clerc', srd);
    const a = apercuBrouillon(b, srd);
    expect(a.disponible).toBe(true);
    expect(a.exact).toBe(false);
    expect(a.pv).toBeGreaterThan(0);
    expect(a.ca).toBeGreaterThan(0);
  });

  it("suit chaque choix : une Constitution plus haute donne plus de points de vie", () => {
    const b = rapide('guerrier');
    // Répartition standard : on échange la Constitution avec la plus haute puis avec la plus basse valeur (toujours valide).
    const echanger = (valeur: (v: number[]) => number) => {
      const v = b.choix.valeursBase!;
      const autre = (['for', 'dex', 'int', 'sag', 'cha'] as const).find((k) => v[k] === valeur(Object.values(v)))!;
      return { ...b, choix: { ...b.choix, valeursBase: { ...v, con: v[autre], [autre]: v.con } } };
    };
    const plus = apercuBrouillon(echanger((t) => Math.max(...t)), srd);
    const moins = apercuBrouillon(echanger((t) => Math.min(...t)), srd);
    expect(plus.exact && moins.exact).toBe(true);
    expect(plus.pv!).toBeGreaterThan(moins.pv!);
  });

  it("un lanceur de sorts montre DD, bonus d'attaque et sorts pris dont les jouables en combat", () => {
    const b = rapide('magicien');
    const a = apercuBrouillon(b, srd);
    const fiche = bilanPersonnage(versPersonnage(b, 'x', srd)!, srd).fiche!;
    expect(a.sorts).toBeDefined();
    expect(a.sorts!.dd).toBe(fiche.incantation!.ddSauvegarde);
    expect(a.sorts!.bonusAttaque).toBe(fiche.incantation!.bonusAttaque);
    expect(a.sorts!.mineurs.max).toBe(fiche.incantation!.sortsMineurs);
    expect(a.sorts!.mineurs.pris).toBe(b.choix.sortsMineurs?.length ?? 0);
    const pris = sortsDuBrouillon(b.choix, fiche);
    expect(a.sorts!.total).toBe(pris.length);
    expect(a.sorts!.jouables).toBe(pris.filter((id) => SORTS_JOUABLES_EN_COMBAT.has(id)).length);
  });

  it("la meilleure attaque est celle au plus gros bonus", () => {
    expect(
      meilleureAttaque([
        { nom: 'a', bonus: 2, degats: '1d4 perforant', mode: 'distance' },
        { nom: 'b', bonus: 5, degats: '1d8 tranchant', mode: 'corps-a-corps' },
        { nom: 'c', bonus: 5, degats: '1d6 tranchant', mode: 'corps-a-corps' },
      ])?.nom,
    ).toBe('b');
    expect(meilleureAttaque([])).toBeUndefined();
  });
});

describe('filtre des sorts : jouables en combat / utilitaires', () => {
  const sorts = [...srd.sorts.values()].filter((s) => s.niveau <= 2) as Sort[];

  it("« jouables » ne garde que les sorts que le moteur joue, « utilitaires » le reste, « tous » tout", () => {
    const combat = filtrerParUsage(sorts, 'combat');
    const utilitaires = filtrerParUsage(sorts, 'utilitaire');
    expect(combat.length).toBeGreaterThan(0);
    expect(utilitaires.length).toBeGreaterThan(0);
    expect(combat.every((s) => SORTS_JOUABLES_EN_COMBAT.has(s.id))).toBe(true);
    expect(utilitaires.every((s) => !SORTS_JOUABLES_EN_COMBAT.has(s.id))).toBe(true);
    expect(combat.length + utilitaires.length).toBe(sorts.length);
    expect(filtrerParUsage(sorts, 'tous')).toHaveLength(sorts.length);
  });

  it('les compteurs des boutons correspondent au filtre', () => {
    const n = compterParUsage(sorts);
    expect(n.combat).toBe(filtrerParUsage(sorts, 'combat').length);
    expect(n.utilitaire).toBe(filtrerParUsage(sorts, 'utilitaire').length);
    expect(n.tous).toBe(n.combat + n.utilitaire);
  });
});

describe('création rapide : sexe et portrait variés', () => {
  it('le hasard fait varier le sexe, le portrait et le prénom, toujours dans la galerie de l\'espèce', () => {
    const bas = rapide('guerrier', 'elfe', () => 0);
    const haut = rapide('guerrier', 'elfe', () => 0.99);
    expect(bas.identite.sexe).toBe('F');
    expect(haut.identite.sexe).toBe('M');
    expect(bas.identite.portrait).toBe(portraitsPour('elfe', 'F')[0]!.id);
    expect(haut.identite.portrait).toBe(portraitsPour('elfe', 'M').at(-1)!.id);
    expect(bas.identite.portrait).not.toBe(haut.identite.portrait);
  });

  it('un héros dont le portrait est déjà choisi garde son sexe et son portrait', () => {
    let b = changerClasse(changerEspece(brouillonVide(1), 'nain', srd), 'clerc', srd);
    b = { ...b, identite: { ...b.identite, sexe: 'M', portrait: 'nain-m-2', nom: 'Thorgrim' } };
    const r = creationRapideBrouillon(b, srd, () => 0)!;
    expect(r.identite.sexe).toBe('M');
    expect(r.identite.portrait).toBe('nain-m-2');
    expect(r.identite.nom).toBe('Thorgrim');
  });

  it('le héros créé est complet et valide', () => {
    for (const espece of ['humain', 'orc', 'halfelin']) {
      const b = rapide('roublard', espece, () => 0.5);
      expect(PORTRAITS.some((p) => p.id === b.identite.portrait)).toBe(true);
      expect(versPersonnage(b, 'x', srd)).toBeDefined();
    }
  });
});

describe('prénoms au hasard : jamais ceux des six héros pré-tirés', () => {
  it('aucune espèce ni aucun sexe ne rend Bran, Grukk, Pip, Sylvaine, Hilda ou Ambrine', () => {
    for (const espece of ['drakeide', 'elfe', 'gnome', 'goliath', 'halfelin', 'humain', 'nain', 'orc', 'tieffelin']) {
      for (const sexe of ['F', 'M'] as const) {
        for (let i = 0; i < 80; i++) expect(NOMS_PRETIRES).not.toContain(nomAuHasard(espece, sexe));
      }
    }
  });
});
