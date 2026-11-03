import { describe, expect, it } from 'vitest';
import { budgetDuGroupe, composerRencontre, DIFFICULTES, herosPreTires, monstresMax, preparerRencontre, THEMES } from '../src';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const niveaux = (n: number, nombre = 6) => Array.from({ length: nombre }, () => n);
const px = (r: { monstres: { profil: string; nombre: number }[] }) => r.monstres.reduce((s, m) => s + srd.monstres.get(m.profil)!.px * m.nombre, 0);
const nombreDeMonstres = (r: { monstres: { nombre: number }[] }) => r.monstres.reduce((s, m) => s + m.nombre, 0);

describe('escarmouches : des rencontres composées pour le groupe', () => {
  it('le budget suit le niveau, le nombre de héros et la difficulté', () => {
    for (const d of DIFFICULTES) {
      const parNiveau = [1, 2, 3, 4, 5].map((n) => budgetDuGroupe(niveaux(n), d));
      expect(parNiveau, d).toEqual([...parNiveau].sort((a, b) => a - b));
      expect(Math.abs(budgetDuGroupe(niveaux(3, 3), d) * 2 - budgetDuGroupe(niveaux(3, 6), d))).toBeLessThanOrEqual(1); // à l'arrondi près
    }
    expect(budgetDuGroupe(niveaux(3), 'faible')).toBeLessThan(budgetDuGroupe(niveaux(3), 'moderee'));
    expect(budgetDuGroupe(niveaux(3), 'moderee')).toBeLessThan(budgetDuGroupe(niveaux(3), 'elevee'));
    // Un groupe de niveaux mêlés : la somme de ce que vaut chaque héros.
    expect(budgetDuGroupe([1, 3, 5], 'faible')).toBe(budgetDuGroupe([1], 'faible') + budgetDuGroupe([3], 'faible') + budgetDuGroupe([5], 'faible'));
  });

  it.each(THEMES.map((t) => [t.id, t] as const))(
    '« %s » : chaque niveau, nombre de héros et difficulté donne une rencontre valide qui tient dans son budget',
    (_id, theme) => {
      const heros = herosPreTires(srd);
      for (const niveau of [1, 2, 3, 4, 5]) {
        for (const nombre of [1, 2, 3, 4, 5, 6]) {
          for (const d of DIFFICULTES) {
            const r = composerRencontre(theme, niveaux(niveau, nombre), d, srd);
            const ou = `niveau ${niveau}, ${nombre} héros, ${d}`;
            expect(r.px, ou).toBe(px(r));
            expect(nombreDeMonstres(r), ou).toBeGreaterThanOrEqual(1);
            expect(nombreDeMonstres(r), ou).toBeLessThanOrEqual(monstresMax(nombre));
            // Jamais plus que le budget, sauf le monstre unique d'un budget minuscule.
            if (nombreDeMonstres(r) > 1) expect(r.px, ou).toBeLessThanOrEqual(r.depense);
            // Aucun monstre seul ne domine la rencontre (55 % du budget au plus : le chef).
            const plusFort = Math.max(...r.monstres.map((m) => srd.monstres.get(m.profil)!.px));
            if (nombreDeMonstres(r) > 1)
              expect(plusFort, ou).toBeLessThanOrEqual(Math.max(0.55 * r.depense, Math.min(...theme.troupes.map((t) => srd.monstres.get(t.profil)!.px))));
            // La rencontre se prépare : assez de cases de départ pour tous, héros compris.
            expect(() => preparerRencontre(r, srd, heros.slice(0, nombre)), ou).not.toThrow();
          }
        }
      }
    },
  );

  it('la difficulté fait monter les PX, et un thème n’en dépense jamais moins à un niveau plus élevé', () => {
    for (const theme of THEMES) {
      for (const niveau of [1, 2, 3, 4, 5]) {
        const pxParDifficulte = DIFFICULTES.map((d) => composerRencontre(theme, niveaux(niveau), d, srd).px);
        expect(pxParDifficulte, `${theme.id} niveau ${niveau}`).toEqual([...pxParDifficulte].sort((a, b) => a - b));
      }
      for (const d of DIFFICULTES) {
        const pxParNiveau = [1, 2, 3, 4, 5].map((n) => composerRencontre(theme, niveaux(n), d, srd).px);
        expect(pxParNiveau, `${theme.id} ${d}`).toEqual([...pxParNiveau].sort((a, b) => a - b));
      }
    }
  });

  it('une rencontre est déterministe et garde le décor de son thème', () => {
    const t = THEMES[1]!;
    const a = composerRencontre(t, niveaux(3), 'moderee', srd);
    const b = composerRencontre(t, niveaux(3), 'moderee', srd);
    expect(a).toEqual(b);
    expect(a).toMatchObject({ id: t.id, nom: t.nom, terrain: t.terrain, carte: t.carte, difficulte: 'moderee' });
  });

  it('au niveau 3 avec six héros, la rencontre « faible » du camp gobelin ressemble à l’embuscade d’origine : un chef et sa troupe', () => {
    const r = composerRencontre(THEMES[0]!, niveaux(3), 'faible', srd);
    expect(r.monstres[0]!.profil).toBe('chef-gobelin');
    expect(r.monstres[0]!.nombre).toBe(1);
    expect(r.px).toBeGreaterThan(0.8 * r.depense);
  });

  it('un héros seul affronte peu de monstres ; un grand groupe, une troupe', () => {
    for (const t of THEMES) {
      expect(nombreDeMonstres(composerRencontre(t, [3], 'moderee', srd))).toBeLessThanOrEqual(6);
      expect(nombreDeMonstres(composerRencontre(t, niveaux(3), 'moderee', srd))).toBeGreaterThan(nombreDeMonstres(composerRencontre(t, [3], 'moderee', srd)));
    }
  });

  it('au niveau 1, la difficulté faible n’oppose que des petits monstres ; au niveau 5, les plus puissants du thème paraissent', () => {
    for (const t of THEMES) {
      const fort = (n: number, d: (typeof DIFFICULTES)[number]) =>
        Math.max(...composerRencontre(t, niveaux(n), d, srd).monstres.map((m) => srd.monstres.get(m.profil)!.px));
      expect(fort(1, 'faible'), t.id).toBeLessThanOrEqual(200);
      expect(fort(1, 'elevee'), t.id).toBeLessThanOrEqual(fort(5, 'elevee'));
    }
  });
});
