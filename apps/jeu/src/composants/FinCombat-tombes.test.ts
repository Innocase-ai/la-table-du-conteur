import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { EtatCombat } from '@crpg/regles';
import { FinCombat, libelleHerosTombe } from './FinCombat';

const etat = {
  vainqueur: 'heros',
  round: 4,
  combattants: [
    { camp: 'heros', nom: 'Bran', pv: 0, pvMax: 12, mort: true, px: 0 },
    { camp: 'heros', nom: 'Hilda', pv: 0, pvMax: 12, mort: false, px: 0 },
    { camp: 'heros', nom: 'Pip', pv: 9, pvMax: 9, mort: false, px: 0 },
    { camp: 'monstres', nom: 'Lame', pv: 0, pvMax: 5, mort: true, enFuite: false, px: 50 },
  ],
} as unknown as EtatCombat;

const rendre = (enHistoire: boolean) =>
  renderToStaticMarkup(createElement(FinCombat, { etat, onRejouer: () => undefined, onRetour: () => undefined, onVoir: () => undefined, ...(enHistoire ? { onContinuer: () => undefined } : {}) }));

describe('héros tombés sur l’écran de fin de combat', () => {
  it('libellé : relevé à 1 PV en histoire (mort ou à terre), « mort » seulement en escarmouche', () => {
    expect(libelleHerosTombe({ nom: 'Bran', mort: true }, true)).toBe('Bran (relevé à 1 PV)');
    expect(libelleHerosTombe({ nom: 'Hilda', mort: false }, true)).toBe('Hilda (relevé à 1 PV)');
    expect(libelleHerosTombe({ nom: 'Bran', mort: true }, false)).toBe('Bran (mort)');
    expect(libelleHerosTombe({ nom: 'Hilda', mort: false }, false)).toBe('Hilda');
  });

  it('combat d’histoire : le bilan ne dit plus « (mort) »', () => {
    const html = rendre(true);
    expect(html).toContain('Bran (relevé à 1 PV)');
    expect(html).toContain('Hilda (relevé à 1 PV)');
    expect(html).not.toContain('(mort)');
    expect(html).not.toContain('Pip (');
  });

  it('escarmouche : « (mort) » reste vrai', () => {
    const html = rendre(false);
    expect(html).toContain('Bran (mort)');
    expect(html).not.toContain('relevé');
  });
});
