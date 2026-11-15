import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { EtatCombat } from '@crpg/regles';
import { FinCombat } from './FinCombat';

const etat = (vainqueur: 'heros' | 'monstres') =>
  ({
    vainqueur,
    round: 3,
    combattants: [
      { camp: 'heros', nom: 'Bran', pv: 12, pvMax: 12, mort: false, px: 0 },
      { camp: 'monstres', nom: 'Lame', pv: 0, pvMax: 5, mort: true, enFuite: false, px: 50 },
      { camp: 'monstres', nom: 'Lame', pv: 0, pvMax: 5, mort: true, enFuite: false, px: 50 },
    ],
  }) as unknown as EtatCombat;

const rendre = (e: EtatCombat, xp?: { nbHeros: number; bonus: number; dejaFaite: boolean }) =>
  renderToStaticMarkup(createElement(FinCombat, { etat: e, onRejouer: () => undefined, onRetour: () => undefined, onVoir: () => undefined, onContinuer: () => undefined, xpHistoire: xp }));

describe('panneau de fin de combat', () => {
  it('montre l’XP gagnée par héros à la victoire d’un combat d’histoire', () => {
    const html = rendre(etat('heros'), { nbHeros: 4, bonus: 0, dejaFaite: false });
    expect(html).toContain('XP gagnée');
    expect(html).toContain('+25 par héros');
  });

  it('une rencontre déjà vaincue le dit', () => {
    const html = rendre(etat('heros'), { nbHeros: 4, bonus: 0, dejaFaite: true });
    expect(html).toContain('aucune');
    expect(html).toContain('déjà vaincue');
  });

  it('ne montre rien à la défaite, ni hors histoire (escarmouche)', () => {
    expect(rendre(etat('monstres'), { nbHeros: 4, bonus: 0, dejaFaite: false })).not.toContain('XP gagnée');
    expect(rendre(etat('heros'))).not.toContain('XP gagnée');
  });
});
