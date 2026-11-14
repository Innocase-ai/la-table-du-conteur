import { describe, expect, it } from 'vitest';
import { atteignables } from '../src/chemin';
import { CARREFOUR_D_ALDRIC } from '../src/exemples';
import { chercherGraine, coutDeplacement, genererCarte, pireEcart, rapportDurees } from '../src/generation';
import { creerRng } from '../src/rng';
import type { DefTerres } from '../src/types';

const GRAINES = Array.from({ length: 40 }, (_, i) => i * 37 + 5);

describe('génération des terres', () => {
  it('est déterministe : même définition, même carte', () => {
    const a = genererCarte(CARREFOUR_D_ALDRIC);
    const b = genererCarte(CARREFOUR_D_ALDRIC);
    expect(b.tuiles).toEqual(a.tuiles);
    expect([...b.route]).toEqual([...a.route]);
    expect([...b.blocage]).toEqual([...a.blocage]);
    expect(b.pois).toEqual(a.pois);
    expect(b.ancres).toEqual(a.ancres);
  });

  it('change avec la graine', () => {
    const a = genererCarte(CARREFOUR_D_ALDRIC);
    const b = genererCarte({ ...CARREFOUR_D_ALDRIC, graine: 22 });
    expect(b.tuiles).not.toEqual(a.tuiles);
  });

  it('relie toujours toutes les ancres, sur 40 graines', () => {
    for (const graine of GRAINES) {
      const c = genererCarte({ ...CARREFOUR_D_ALDRIC, graine });
      const joignable = atteignables(c.largeur, c.hauteur, c.ancres[0]!, coutDeplacement(c));
      for (const a of c.ancres) {
        expect(joignable[a.y * c.largeur + a.x], `graine ${graine}, ancre ${a.id}`).toBe(1);
        const i = a.y * c.largeur + a.x;
        expect(c.tuiles[i]).not.toBe('eau');
        expect(c.blocage[i]).toBe(0);
      }
    }
  });

  it('garde la durée de chaque trajet proche de celle de l’auteur pour la grande majorité des graines', () => {
    // Un lac ou un massif mal placé peut doubler un trajet (1 graine sur 40 environ) : `chercherGraine` sert à l'auteur à l'éviter.
    const graines = Array.from({ length: 60 }, (_, i) => i + 1);
    const bonnes = graines.filter((graine) => {
      const c = genererCarte({ ...CARREFOUR_D_ALDRIC, graine });
      return rapportDurees(c).every((r) => r.rapport > 0.6 && r.rapport < 1.75);
    });
    expect(bonnes.length / graines.length).toBeGreaterThan(0.9);
  });

  it('chercherGraine trouve une carte fidèle aux durées écrites', () => {
    const trouve = chercherGraine({ ...CARREFOUR_D_ALDRIC, graine: 0 }, { essais: 80, tolerance: 1.3 })!;
    expect(trouve.ecart).toBeLessThanOrEqual(1.3);
    const c = genererCarte({ ...CARREFOUR_D_ALDRIC, graine: trouve.graine });
    expect(pireEcart(c)).toBeCloseTo(trouve.ecart, 10);
    for (const r of rapportDurees(c)) {
      expect(r.rapport).toBeGreaterThan(1 / 1.3 - 1e-9);
      expect(r.rapport).toBeLessThan(1.3 + 1e-9);
    }
  });

  it('respecte l’échelle : une carte deux fois plus lente rend les durées proches quand même', () => {
    const trouve = chercherGraine({ ...CARREFOUR_D_ALDRIC, echelle: 2, largeur: 100, hauteur: 70 }, { essais: 80, tolerance: 1.4 })!;
    expect(trouve.ecart).toBeLessThanOrEqual(1.4);
  });

  it('ne produit pas une carte noyée ni murée', () => {
    for (const graine of GRAINES) {
      const c = genererCarte({ ...CARREFOUR_D_ALDRIC, graine });
      const n = c.tuiles.length;
      const eau = c.tuiles.filter((t) => t === 'eau').length;
      expect(eau / n, `graine ${graine}`).toBeLessThan(0.4);
      const bloquees = c.blocage.reduce((s, v) => s + v, 0);
      expect(bloquees / n).toBeLessThan(0.2);
    }
  });

  it('creuse un gué là où la route traverse l’eau, et seulement là', () => {
    for (const graine of GRAINES) {
      const c = genererCarte({ ...CARREFOUR_D_ALDRIC, graine, biome: 'marais' });
      c.tuiles.forEach((t, i) => {
        if (t === 'gue') expect(c.route[i]).toBe(1);
      });
    }
  });

  it('sème des points d’intérêt joignables, hors route, espacés', () => {
    for (const graine of GRAINES.slice(0, 15)) {
      const c = genererCarte({ ...CARREFOUR_D_ALDRIC, graine });
      expect(c.pois.length).toBeGreaterThan(15);
      const joignable = atteignables(c.largeur, c.hauteur, c.ancres[0]!, coutDeplacement(c));
      for (const p of c.pois) {
        const i = p.y * c.largeur + p.x;
        expect(joignable[i]).toBe(1);
        expect(c.route[i]).toBe(0);
        expect(c.blocage[i]).toBe(0);
        for (const a of c.ancres) expect(Math.abs(a.x - p.x) + Math.abs(a.y - p.y)).toBeGreaterThanOrEqual(5);
      }
      for (let i = 0; i < c.pois.length; i++)
        for (let j = i + 1; j < c.pois.length; j++) {
          const a = c.pois[i]!;
          const b = c.pois[j]!;
          expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBeGreaterThanOrEqual(8);
        }
      expect(new Set(c.pois.map((p) => p.id)).size).toBe(c.pois.length);
    }
  });

  it('accepte une densité nulle de points d’intérêt', () => {
    expect(genererCarte({ ...CARREFOUR_D_ALDRIC, densitePoi: 0 }).pois).toEqual([]);
  });

  it('tient sur des définitions quelconques (30 cartes tirées au hasard, tous biomes)', () => {
    const rng = creerRng(4242);
    const biomes = ['prairie', 'marais', 'collines', 'montagne', 'neige', 'desert'] as const;
    for (let k = 0; k < 30; k++) {
      const n = 3 + Math.floor(rng() * 4);
      const ancres = Array.from({ length: n }, (_, i) => ({ id: `a${i}`, nom: `Lieu ${i}`, position: { x: 5 + rng() * 90, y: 5 + rng() * 90 } }));
      const liens = ancres.slice(1).map((a, i) => ({ de: `a${Math.floor(rng() * (i + 1))}`, vers: a.id, heures: 0.5 + Math.floor(rng() * 4) * 0.5 }));
      const def: DefTerres = { id: `t${k}`, graine: Math.floor(rng() * 1e6), largeur: 90 + Math.floor(rng() * 40), hauteur: 60 + Math.floor(rng() * 30), biome: biomes[k % biomes.length]!, ancres, liens };
      const c = genererCarte(def);
      const joignable = atteignables(c.largeur, c.hauteur, c.ancres[0]!, coutDeplacement(c));
      for (const a of c.ancres) expect(joignable[a.y * c.largeur + a.x], `${def.id} ${a.id}`).toBe(1);
    }
  });

  it('refuse une définition fausse, en français', () => {
    expect(() => genererCarte({ ...CARREFOUR_D_ALDRIC, largeur: 10 })).toThrow(/trop petite/);
    expect(() => genererCarte({ ...CARREFOUR_D_ALDRIC, ancres: [] })).toThrow(/aucune ancre/);
    expect(() => genererCarte({ ...CARREFOUR_D_ALDRIC, liens: [{ de: 'x', vers: 'ald-vieux-pont', heures: 1 }] })).toThrow(/ancre inconnue/);
    expect(() => genererCarte({ ...CARREFOUR_D_ALDRIC, ancres: [CARREFOUR_D_ALDRIC.ancres[0]!, CARREFOUR_D_ALDRIC.ancres[0]!] })).toThrow(/en double/);
    expect(() => genererCarte({ ...CARREFOUR_D_ALDRIC, liens: [{ de: 'ald-vieux-pont', vers: 'ald-combe-de-l-ours', heures: 0 }] })).toThrow(/plus de 0 heure/);
  });

  it('place une ancre à la case imposée par l’auteur', () => {
    const c = genererCarte({ ...CARREFOUR_D_ALDRIC, ancres: CARREFOUR_D_ALDRIC.ancres.map((a, i) => (i === 0 ? { ...a, case: { x: 60, y: 40 } } : a)) });
    expect(c.ancres[0]).toMatchObject({ x: 60, y: 40 });
  });
});
