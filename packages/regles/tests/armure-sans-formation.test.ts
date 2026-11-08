import { describe, expect, it } from 'vitest';
import { situationAttaque } from '../src/combat/moteur';
import { preparerIncantation } from '../src/combat/sorts';
import type { Combattant, EtatCombat } from '../src/combat/etat';
import type { Sort } from '../src/schemas';

const sort = { id: 'projectile-magique', nom: 'Projectile magique', niveau: 1 } as Sort;
const heros = (sansFormation: boolean) =>
  ({ id: 'h', nom: 'Mage', camp: 'heros', sorts: ['projectile-magique'], sansFormation, traits: [], etats: [], modificateurs: [], tour: {}, position: { x: 0, y: 0 }, incantation: { emplacements: [2] } }) as unknown as Combattant;

describe('armure ou bouclier sans formation', () => {
  it('interdit l’incantation', () => {
    expect(typeof preparerIncantation(heros(true), sort)).toBe('string');
    expect(preparerIncantation(heros(false), sort)).toBe(1);
  });
  it('donne le désavantage aux attaques', () => {
    const cible = { id: 'm', camp: 'monstres', etats: [], modificateurs: [], tour: {}, position: { x: 3, y: 0 } } as unknown as Combattant;
    const etat = { combattants: [heros(true), cible] } as unknown as EtatCombat;
    expect(situationAttaque(etat, heros(true), cible, 'corps-a-corps').desavantage).toBe(true);
    expect(situationAttaque(etat, heros(false), cible, 'corps-a-corps').desavantage).toBe(false);
  });
});
