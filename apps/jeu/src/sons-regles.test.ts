import { describe, expect, it } from 'vitest';
import { armeDuJournal, estArmeDeTir, SONS, sonDeCoup, sonDeProtection, sonDeSort, sonDeTir } from './sons-regles';

describe('sonDeCoup', () => {
  it('une épée, c’est le son d’épée ; une hache, celui de hache', () => {
    expect(sonDeCoup({ famille: 'tranchant', arme: 'Épée longue' })).toBe('epee');
    expect(sonDeCoup({ famille: 'tranchant', arme: 'Hache à deux mains' })).toBe('hache');
    expect(sonDeCoup({ famille: 'tranchant', arme: 'Hachette' })).toBe('hache');
    expect(sonDeCoup({ famille: 'tranchant' })).toBe('epee');
  });

  it('le perforant se fait entendre au corps à corps, pas pour une flèche', () => {
    expect(sonDeCoup({ famille: 'perforant', arme: 'Dague' })).toBe('perforant');
    expect(sonDeCoup({ famille: 'perforant', arme: 'Arc court', distance: true })).toBeUndefined();
  });

  it('le contondant a son son', () => {
    expect(sonDeCoup({ famille: 'contondant', arme: 'Massue' })).toBe('contondant');
  });

  it('un coup de sort ne rejoue rien : son son a joué au départ', () => {
    expect(sonDeCoup({ famille: 'feu', sort: true })).toBeUndefined();
    expect(sonDeCoup({ famille: 'tranchant', sort: true })).toBeUndefined();
  });

  it('une arme enchantée (dégâts de feu sans sort) reste muette plutôt que de se tromper', () => {
    expect(sonDeCoup({ famille: 'feu', arme: 'Épée de feu' })).toBeUndefined();
  });
});

describe('sonDeSort', () => {
  it('les sorts ont leur son', () => {
    expect(sonDeSort('trait-de-feu')).toBe('feu-1');
    expect(sonDeSort('rayon-ardent')).toBe('feu-2');
    expect(sonDeSort('rayon-de-givre')).toBe('glace');
    expect(sonDeSort('eclair-tracant')).toBe('foudre');
    expect(sonDeSort('projectile-magique')).toBe('projectile-magique');
  });

  it('un sort sans son propre prend celui de sa famille, s’il y en a un', () => {
    expect(sonDeSort('boule-de-feu', 'feu')).toBe('feu-1');
    expect(sonDeSort('rayon-glace-superieur', 'froid')).toBe('glace');
    expect(sonDeSort('mot-de-pouvoir', 'psychique')).toBeUndefined();
  });

  it('sans sort, pas de son', () => {
    expect(sonDeSort(undefined, 'feu')).toBeUndefined();
  });
});

describe('protection et tir', () => {
  it('seuls les sorts de protection jouent au lancement', () => {
    expect(sonDeProtection('bouclier-de-la-foi')).toBe('protection');
    expect(sonDeProtection('benediction')).toBe('protection');
    expect(sonDeProtection('trait-de-feu')).toBeUndefined();
  });

  it('on entend un arc, pas une épée', () => {
    expect(estArmeDeTir('Arc long')).toBe(true);
    expect(estArmeDeTir('Arbalète légère')).toBe(true);
    expect(estArmeDeTir('Arc')).toBe(true);
    expect(estArmeDeTir('Épée courte')).toBe(false);
    expect(estArmeDeTir('Marteau')).toBe(false);
    expect(sonDeTir('Arc court')).toBe('arc');
    expect(sonDeTir('Javeline')).toBeUndefined();
  });
});

describe('armeDuJournal', () => {
  it('lit le nom de l’arme dans la ligne d’attaque', () => {
    expect(armeDuJournal('Grukk attaque Sbire gobelin 1 (Hache à deux mains) : 10 avec désavantage → 15, touché.')).toBe('Hache à deux mains');
    expect(armeDuJournal('Sylvaine attaque Gob (Arc court) : 12 → 17, raté.')).toBe('Arc court');
  });

  it('rend undefined quand il n’y a pas d’arme', () => {
    expect(armeDuJournal('Loup profite d’une ouverture (attaque d’opportunité).')).toBeUndefined();
  });
});

describe('les sons déclarés', () => {
  it('chaque son a un nom unique', () => {
    expect(new Set(SONS).size).toBe(SONS.length);
  });
});
