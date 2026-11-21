import { describe, expect, it } from 'vitest';
import { fichierFondCombat } from './fond-combat';

describe('fond du plateau d’un combat d’histoire', () => {
  const lieux = new Map<string, { parent?: string }>([
    ['region', {}],
    ['village', { parent: 'region' }],
    ['auberge', { parent: 'village' }],
    ['cave', { parent: 'auberge' }],
    ['boucle-a', { parent: 'boucle-b' }],
    ['boucle-b', { parent: 'boucle-a' }],
  ]);
  const manifeste = { lieux: { auberge: 'auberge.webp', cave: 'commun:lieux/cave-tonneaux', region: 'region.webp' } };

  it('l’image du lieu lui-même, y compris un décor de la réserve commune', () => {
    expect(fichierFondCombat(manifeste, lieux, 'cave')).toBe('commun:lieux/cave-tonneaux');
    expect(fichierFondCombat(manifeste, lieux, 'auberge')).toBe('auberge.webp');
  });

  it('un lieu sans image prend celle de son premier ancêtre illustré', () => {
    expect(fichierFondCombat(manifeste, lieux, 'village')).toBe('region.webp');
    expect(fichierFondCombat({ lieux: {} }, lieux, 'cave')).toBeUndefined();
  });

  it('sans lieu, sans manifeste ou avec une boucle de parents : pas de fond, sans planter', () => {
    expect(fichierFondCombat(manifeste, lieux, undefined)).toBeUndefined();
    expect(fichierFondCombat(undefined, lieux, 'cave')).toBeUndefined();
    expect(fichierFondCombat(manifeste, lieux, 'boucle-a')).toBeUndefined();
  });
});
