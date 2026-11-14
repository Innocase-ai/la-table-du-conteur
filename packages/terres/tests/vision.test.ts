import { describe, expect, it } from 'vitest';
import { estVisible, ligneDeVue, nouvelleExploration, rayonVision, reperesVisibles, reveler, VISION_BASE, VISION_MIN } from '../src/vision';
import { carteManuelle } from './aide';

const JOUR = 12 * 60;
const NUIT = 23 * 60;

describe('vision', () => {
  const c = carteManuelle(40, 30, (x, y) => (x === 20 && y === 10 ? 'colline' : x === 22 && y === 10 ? 'montagne' : undefined));

  it('voit moins loin la nuit, mais pas moins que le minimum', () => {
    expect(rayonVision(c, { x: 5, y: 5, minutes: JOUR })).toBe(VISION_BASE);
    expect(rayonVision(c, { x: 5, y: 5, minutes: NUIT })).toBe(VISION_BASE - 1);
    expect(rayonVision(c, { x: 5, y: 5, minutes: NUIT }, { bonusVision: -10 })).toBe(VISION_MIN);
  });

  it('la vision dans le noir annule le malus de la nuit', () => {
    expect(rayonVision(c, { x: 5, y: 5, minutes: NUIT }, { visionNocturne: true })).toBe(VISION_BASE);
  });

  it('gagne de la portée sur une hauteur et grâce aux bonus du groupe', () => {
    expect(rayonVision(c, { x: 20, y: 10, minutes: JOUR })).toBe(VISION_BASE + 1);
    expect(rayonVision(c, { x: 22, y: 10, minutes: JOUR })).toBe(VISION_BASE + 2);
    expect(rayonVision(c, { x: 5, y: 5, minutes: JOUR }, { bonusVision: 2 })).toBe(VISION_BASE + 2);
  });

  it('la vue est un losange', () => {
    const p = { x: 10, y: 10, minutes: JOUR };
    expect(estVisible(c, p, 10 + VISION_BASE, 10)).toBe(true);
    expect(estVisible(c, p, 10 + VISION_BASE, 11)).toBe(false);
    expect(estVisible(c, p, 12, 12)).toBe(true);
  });

  it('révèle des cases sans modifier l’ancienne grille, et ne reperd rien', () => {
    const avant = nouvelleExploration(c);
    const apres = reveler(c, avant, { x: 10, y: 10, minutes: JOUR });
    expect(avant.every((v) => v === 0)).toBe(true);
    const n = apres.reduce((s, v) => s + v, 0);
    expect(n).toBe(2 * VISION_BASE * (VISION_BASE + 1) + 1);
    const encore = reveler(c, apres, { x: 10, y: 10, minutes: JOUR });
    expect(encore).toBe(apres);
    const plusLoin = reveler(c, apres, { x: 11, y: 10, minutes: JOUR });
    expect(plusLoin.reduce((s, v) => s + v, 0)).toBeGreaterThan(n);
    apres.forEach((v, i) => {
      if (v) expect(plusLoin[i]).toBe(1);
    });
  });

  it('ne sort pas de la carte', () => {
    const e = reveler(c, nouvelleExploration(c), { x: 0, y: 0, minutes: JOUR });
    expect(e.reduce((s, v) => s + v, 0)).toBeGreaterThan(0);
  });

  it('une montagne coupe la vue, sauf pour qui s’y tient', () => {
    const m = carteManuelle(40, 30, (x, y) => (x === 15 && y === 10 ? 'montagne' : undefined));
    expect(ligneDeVue(m, { x: 10, y: 10 }, { x: 20, y: 10 })).toBe(false);
    expect(ligneDeVue(m, { x: 10, y: 10 }, { x: 14, y: 10 })).toBe(true);
    expect(ligneDeVue(m, { x: 10, y: 12 }, { x: 20, y: 12 })).toBe(true);
    expect(ligneDeVue(m, { x: 15, y: 10 }, { x: 25, y: 10 })).toBe(true);
  });

  it('les repères se voient de loin, de jour ; seuls les feux se voient la nuit', () => {
    const k = carteManuelle(60, 30);
    k.pois = [
      { id: 'tour', type: 'tour-de-guet', nom: 'Une tour', x: 24, y: 10, repere: { rayon: 14, nuit: false } },
      { id: 'feu', type: 'feu-de-camp', nom: 'Un feu', x: 10, y: 20, repere: { rayon: 12, nuit: true } },
      { id: 'puits', type: 'puits', nom: 'Un puits', x: 12, y: 11 },
    ];
    k.ancres = [{ id: 'moulin', nom: 'Moulin', x: 10, y: 3, rayonRepere: 9 }];
    const jour = reperesVisibles(k, { x: 10, y: 10, minutes: JOUR }).map((r) => r.id).sort();
    expect(jour).toEqual(['feu', 'moulin', 'tour']);
    const nuit = reperesVisibles(k, { x: 10, y: 10, minutes: NUIT }).map((r) => r.id);
    expect(nuit).toEqual(['feu']);
    expect(reperesVisibles(k, { x: 50, y: 25, minutes: JOUR })).toEqual([]);
  });

  it('une montagne cache un repère derrière elle', () => {
    const k = carteManuelle(60, 30, (x, y) => (x === 17 && y === 10 ? 'montagne' : undefined));
    k.pois = [{ id: 'tour', type: 'tour-de-guet', nom: 'Une tour', x: 24, y: 10, repere: { rayon: 16, nuit: false } }];
    expect(reperesVisibles(k, { x: 10, y: 10, minutes: JOUR })).toEqual([]);
    expect(reperesVisibles(k, { x: 10, y: 12, minutes: JOUR }).map((r) => r.id)).toEqual(['tour']);
  });
});
