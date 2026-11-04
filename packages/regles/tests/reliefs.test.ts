// Les éléments posés sur les cases (arbre, rocher, eau, boue, neige) : lus dans les cartes en texte, et sans rien changer
// aux règles : un arbre ou un rocher fait le même effet qu'un mur, l'eau, la boue ou la neige celui d'un terrain difficile.
import { describe, expect, it } from 'vitest';
import { cheminsAtteignables, grilleDepuisTexte, INFO_RELIEFS, ligneDeVue, RELIEFS, reliefDe, TERRAINS, typeCase } from '../src/combat/grille';
import { RENCONTRES } from '../src/combat/prototype';

const vide = { bloquees: new Set<string>(), occupees: new Set<string>() };

describe('éléments sur les cases', () => {
  it('chaque élément a sa lettre, unique et sans collision avec les autres caractères d’une carte', () => {
    const lettres = RELIEFS.map((r) => INFO_RELIEFS[r].lettre);
    expect(new Set(lettres).size).toBe(RELIEFS.length);
    for (const l of lettres) expect('.#~Hm').not.toContain(l);
  });

  it('une carte en texte est lue : le type de case suit l’élément, et l’élément est retrouvé', () => {
    const g = grilleDepuisTexte(['.TR', 'ebn', '#~.']);
    expect(typeCase(g, { x: 1, y: 0 })).toBe('mur');
    expect(reliefDe(g, { x: 1, y: 0 })).toBe('arbre');
    expect(typeCase(g, { x: 2, y: 0 })).toBe('mur');
    expect(reliefDe(g, { x: 2, y: 0 })).toBe('rocher');
    expect(typeCase(g, { x: 0, y: 1 })).toBe('difficile');
    expect(reliefDe(g, { x: 0, y: 1 })).toBe('eau');
    expect(reliefDe(g, { x: 1, y: 1 })).toBe('boue');
    expect(reliefDe(g, { x: 2, y: 1 })).toBe('neige');
    // Les cases d'avant restent ce qu'elles étaient, sans élément.
    expect(typeCase(g, { x: 0, y: 2 })).toBe('mur');
    expect(reliefDe(g, { x: 0, y: 2 })).toBeUndefined();
    expect(typeCase(g, { x: 1, y: 2 })).toBe('difficile');
    expect(reliefDe(g, { x: 1, y: 2 })).toBeUndefined();
    expect(reliefDe(g, { x: 0, y: 0 })).toBeUndefined();
  });

  it('une carte sans élément n’a pas de table d’éléments (les anciennes cartes ne changent pas)', () => {
    expect(grilleDepuisTexte(['..#', '.~.']).reliefs).toBeUndefined();
  });

  it('les types de case de chaque élément : mur pour l’arbre et le rocher, terrain difficile pour le reste', () => {
    expect(INFO_RELIEFS.arbre.type).toBe('mur');
    expect(INFO_RELIEFS.rocher.type).toBe('mur');
    for (const r of ['eau', 'boue', 'neige'] as const) expect(INFO_RELIEFS[r].type).toBe('difficile');
  });

  it('un arbre bloque le passage et la vue comme un mur', () => {
    const arbre = grilleDepuisTexte(['.T.']);
    const mur = grilleDepuisTexte(['.#.']);
    expect(ligneDeVue(arbre, { x: 0, y: 0 }, { x: 2, y: 0 })).toBe(false);
    expect(ligneDeVue(mur, { x: 0, y: 0 }, { x: 2, y: 0 })).toBe(false);
    const a = [...cheminsAtteignables(arbre, { x: 0, y: 0 }, 30, vide).keys()].sort();
    const m = [...cheminsAtteignables(mur, { x: 0, y: 0 }, 30, vide).keys()].sort();
    expect(a).toEqual(m);
    expect(a).not.toContain('1,0');
  });

  it('l’eau, la boue et la neige coûtent le double, comme un terrain difficile', () => {
    const coutVers = (carte: string[]) => cheminsAtteignables(grilleDepuisTexte(carte), { x: 0, y: 0 }, 30, vide).get('1,0')?.cout;
    const difficile = coutVers(['.~']);
    expect(difficile).toBe(3);
    for (const lettre of ['e', 'b', 'n']) expect(coutVers([`.${lettre}`])).toBe(difficile);
    expect(coutVers(['..'])).toBe(1.5);
  });

  it('les rencontres du prototype n’ont que des caractères connus, et une ambiance connue', () => {
    const connus = new Set(['.', '#', '~', 'H', 'm', ...RELIEFS.map((r) => INFO_RELIEFS[r].lettre)]);
    for (const r of RENCONTRES) {
      expect(TERRAINS).toContain(r.terrain);
      for (const ligne of r.carte) for (const c of ligne) expect(connus.has(c), `${r.id} : « ${c} »`).toBe(true);
    }
  });
});
