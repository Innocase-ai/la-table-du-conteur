import { describe, expect, it } from 'vitest';
import type { EtatCombat } from '@crpg/regles';
import { xpGagnee } from './xp-combat';

// Seuls le camp, l'état et les PX des combattants comptent pour l'XP affichée.
const combat = (monstres: { px: number; mort?: boolean; enFuite?: boolean }[]) =>
  ({ combattants: [{ camp: 'heros', px: 0 }, ...monstres.map((m) => ({ camp: 'monstres', mort: false, enFuite: false, ...m }))] }) as unknown as EtatCombat;

describe('XP affichée au panneau de victoire', () => {
  it('partage les PX des adversaires vaincus entre les héros, arrondis à l’inférieur', () => {
    const etat = combat([{ px: 50, mort: true }, { px: 50, mort: true }, { px: 25, mort: true }]);
    expect(xpGagnee(etat, { nbHeros: 4, bonus: 0, dejaFaite: false })).toEqual({ parHeros: 31, px: 125 });
  });

  it('compte les adversaires en fuite, pas ceux encore debout', () => {
    const etat = combat([{ px: 100, mort: true }, { px: 100, enFuite: true }, { px: 100 }]);
    expect(xpGagnee(etat, { nbHeros: 2, bonus: 0, dejaFaite: false }).px).toBe(200);
  });

  it('ajoute l’XP de la rencontre, la même pour chacun', () => {
    const etat = combat([{ px: 100, mort: true }]);
    expect(xpGagnee(etat, { nbHeros: 4, bonus: 40, dejaFaite: false }).parHeros).toBe(65);
  });

  it('une rencontre déjà vaincue ne rapporte plus de PX de combat', () => {
    const etat = combat([{ px: 100, mort: true }]);
    expect(xpGagnee(etat, { nbHeros: 4, bonus: 0, dejaFaite: true }).parHeros).toBe(0);
    expect(xpGagnee(etat, { nbHeros: 4, bonus: 40, dejaFaite: true }).parHeros).toBe(40);
  });
});
