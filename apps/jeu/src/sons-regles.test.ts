import { describe, expect, it } from 'vitest';
import type { Evenement } from '@crpg/regles';
import { degatsDeLAttaque, estArmeDeTir, LIBELLES_SONS, SONS, sonAuLancement, sonDeCoup, sonDeRate, sonDeSort, sonDeTir } from './sons-regles';

const ev = (type: Evenement['type'], extra: Partial<Evenement> = {}): Evenement => ({ round: 1, type, texte: '', ...extra });

describe('degatsDeLAttaque', () => {
  it('trouve les dégâts portés par l’attaque, sur sa cible', () => {
    const journal = [ev('attaque', { cible: 'gob' }), ev('etat', { cible: 'gob' }), ev('degats', { cible: 'gob', valeur: 7 })];
    expect(degatsDeLAttaque(journal, 0)?.valeur).toBe(7);
  });

  it('ne prend pas les dégâts d’une attaque suivante', () => {
    const journal = [ev('attaque', { cible: 'gob' }), ev('attaque', { cible: 'gob' }), ev('degats', { cible: 'gob', valeur: 7 })];
    expect(degatsDeLAttaque(journal, 0)).toBeUndefined();
    expect(degatsDeLAttaque(journal, 1)?.valeur).toBe(7);
  });

  it('ignore les dégâts subis par quelqu’un d’autre', () => {
    const journal = [ev('attaque', { cible: 'gob' }), ev('degats', { cible: 'loup', valeur: 3 })];
    expect(degatsDeLAttaque(journal, 0)).toBeUndefined();
  });

  it('une attaque ratée n’a pas de dégâts', () => {
    const journal = [ev('attaque', { cible: 'gob' }), ev('tour', { acteur: 'loup' }), ev('degats', { cible: 'gob', valeur: 2 })];
    expect(degatsDeLAttaque(journal, 0)).toBeUndefined();
  });

  it('rend undefined pour un événement qui n’est pas une attaque', () => {
    expect(degatsDeLAttaque([ev('degats', { cible: 'gob' })], 0)).toBeUndefined();
  });
});

describe('sonDeCoup : armes', () => {
  it('tranchant : épée par défaut, hache pour les haches, fouet pour le fouet', () => {
    expect(sonDeCoup({ famille: 'tranchant', arme: 'Épée longue' })).toBe('epee');
    expect(sonDeCoup({ famille: 'tranchant', arme: 'Cimeterre' })).toBe('epee');
    expect(sonDeCoup({ famille: 'tranchant', arme: 'Hache à deux mains' })).toBe('hache');
    expect(sonDeCoup({ famille: 'tranchant', arme: 'Hachette' })).toBe('hache');
    expect(sonDeCoup({ famille: 'tranchant', arme: 'Fouet' })).toBe('fouet');
    expect(sonDeCoup({ famille: 'tranchant' })).toBe('epee');
  });

  it('perforant au corps à corps : estoc pour les lances, rapière pour les lames fines', () => {
    expect(sonDeCoup({ famille: 'perforant', arme: 'Lance' })).toBe('lance');
    expect(sonDeCoup({ famille: 'perforant', arme: 'Pique' })).toBe('lance');
    expect(sonDeCoup({ famille: 'perforant', arme: 'Pic de guerre' })).toBe('lance');
    expect(sonDeCoup({ famille: 'perforant', arme: 'Trident' })).toBe('lance');
    expect(sonDeCoup({ famille: 'perforant', arme: 'Rapière' })).toBe('rapiere');
    expect(sonDeCoup({ famille: 'perforant', arme: 'Dague' })).toBe('rapiere');
    expect(sonDeCoup({ famille: 'perforant', arme: 'Épée courte' })).toBe('rapiere');
    expect(sonDeCoup({ famille: 'perforant', arme: 'Morgenstern' })).toBe('masse');
    expect(sonDeCoup({ famille: 'perforant', arme: 'Griffes' })).toBe('perforant');
  });

  it('perforant à distance : la flèche a fait son bruit au départ', () => {
    expect(sonDeCoup({ famille: 'perforant', arme: 'Arc court', distance: true })).toBeUndefined();
  });

  it('contondant : masse, massue ou choc générique', () => {
    expect(sonDeCoup({ famille: 'contondant', arme: 'Masse d’armes' })).toBe('masse');
    expect(sonDeCoup({ famille: 'contondant', arme: 'Marteau de guerre' })).toBe('masse');
    expect(sonDeCoup({ famille: 'contondant', arme: 'Fléau d’armes' })).toBe('masse');
    expect(sonDeCoup({ famille: 'contondant', arme: 'Massue' })).toBe('massue');
    expect(sonDeCoup({ famille: 'contondant', arme: 'Gourdin' })).toBe('massue');
    expect(sonDeCoup({ famille: 'contondant', arme: 'Bâton de combat' })).toBe('massue');
    expect(sonDeCoup({ famille: 'contondant', arme: 'Coup de poing' })).toBe('contondant');
    expect(sonDeCoup({ famille: 'contondant', arme: 'Fronde', distance: true })).toBeUndefined();
  });

  it('un coup de sort ne rejoue rien : son son a joué au départ', () => {
    expect(sonDeCoup({ famille: 'feu', sort: true })).toBeUndefined();
    expect(sonDeCoup({ famille: 'tranchant', sort: true })).toBeUndefined();
  });

  it('une arme enchantée (dégâts de feu sans sort) reste muette plutôt que de se tromper', () => {
    expect(sonDeCoup({ famille: 'feu', arme: 'Épée de feu' })).toBeUndefined();
  });
});

describe('sonDeTir et sonDeRate', () => {
  it('chaque arme de tir a son bruit au départ', () => {
    expect(sonDeTir('Arc court')).toBe('arc');
    expect(sonDeTir('Arc long')).toBe('arc');
    expect(sonDeTir('Arbalète légère')).toBe('arbalete');
    expect(sonDeTir('Arbalète de poing')).toBe('arbalete');
    expect(sonDeTir('Fronde')).toBe('fronde');
    expect(sonDeTir('Mousquet')).toBe('arme-a-feu');
    expect(sonDeTir('Pistolet')).toBe('arme-a-feu');
    expect(sonDeTir('Sarbacane')).toBe('sarbacane');
  });

  it('une arme lancée fend l’air', () => {
    expect(sonDeTir('Javeline (lancer)')).toBe('lancer');
    expect(sonDeTir('Hachette (lancer)')).toBe('lancer');
    expect(sonDeTir('Dague (lancer)')).toBe('lancer');
  });

  it('sans arme connue, pas de son', () => {
    expect(sonDeTir(undefined)).toBeUndefined();
  });

  it('estArmeDeTir reconnaît les armes qui se tirent, pas les armes de jet', () => {
    expect(estArmeDeTir('Arc long')).toBe(true);
    expect(estArmeDeTir('Arbalète légère')).toBe(true);
    expect(estArmeDeTir('Pistolet')).toBe(true);
    expect(estArmeDeTir('Épée courte')).toBe(false);
    expect(estArmeDeTir('Javeline (lancer)')).toBe(false);
  });

  it('une arme qui rate siffle, un sort qui rate se tait', () => {
    expect(sonDeRate({ sort: false })).toBe('rate-arme');
    expect(sonDeRate({ sort: true })).toBeUndefined();
  });
});

describe('sonDeSort', () => {
  it('les sorts de dégâts ont leur son', () => {
    expect(sonDeSort('trait-de-feu')).toBe('feu-1');
    expect(sonDeSort('mains-brulantes')).toBe('feu-1');
    expect(sonDeSort('rayon-ardent')).toBe('feu-2');
    expect(sonDeSort('rayon-de-givre')).toBe('glace');
    expect(sonDeSort('poigne-electrique')).toBe('foudre');
    expect(sonDeSort('eclair-tracant')).toBe('radiant');
    expect(sonDeSort('flamme-sacree')).toBe('radiant');
    expect(sonDeSort('aspersion-acide')).toBe('acide');
    expect(sonDeSort('bouffee-de-poison')).toBe('poison');
    expect(sonDeSort('contact-glacial')).toBe('necrotique');
    expect(sonDeSort('blessure')).toBe('necrotique');
    expect(sonDeSort('vague-tonnante')).toBe('tonnerre');
    expect(sonDeSort('projectile-magique')).toBe('projectile-magique');
    expect(sonDeSort('arme-spirituelle')).toBe('arme-spirituelle');
  });

  it('les sorts d’état ont leur son', () => {
    expect(sonDeSort('sommeil')).toBe('sommeil');
    expect(sonDeSort('immobilisation-de-personne')).toBe('immobilisation');
  });

  it('un sort sans son propre prend celui de sa famille, s’il y en a un', () => {
    expect(sonDeSort('boule-de-feu', 'feu')).toBe('feu-1');
    expect(sonDeSort('rayon-glace-superieur', 'froid')).toBe('glace');
    expect(sonDeSort('nuage-nauseabond', 'poison')).toBe('poison');
    expect(sonDeSort('vitriol', 'acide')).toBe('acide');
    expect(sonDeSort('lumiere-du-jour', 'radiant')).toBe('radiant');
    expect(sonDeSort('mot-de-pouvoir', 'psychique')).toBeUndefined();
  });

  it('sans sort, pas de son', () => {
    expect(sonDeSort(undefined, 'feu')).toBeUndefined();
  });
});

describe('sonAuLancement', () => {
  it('les sorts de soutien jouent au lancement', () => {
    expect(sonAuLancement('bouclier')).toBe('protection');
    expect(sonAuLancement('bouclier-de-la-foi')).toBe('protection');
    expect(sonAuLancement('benediction')).toBe('protection');
    expect(sonAuLancement('aide')).toBe('renforcement');
    expect(sonAuLancement('marque-du-chasseur')).toBe('marque');
    expect(sonAuLancement('fleau')).toBe('malediction');
    expect(sonAuLancement('restauration-partielle')).toBe('soin');
  });

  it('les sorts qui partent ne jouent pas deux fois (au lancement et au départ)', () => {
    expect(sonAuLancement('trait-de-feu')).toBeUndefined();
    expect(sonAuLancement('sommeil')).toBeUndefined();
    expect(sonAuLancement(undefined)).toBeUndefined();
  });
});

describe('armes données par leur identifiant (celui que le moteur met dans le journal)', () => {
  it('reconnaît les identifiants du SRD', () => {
    expect(sonDeCoup({ famille: 'tranchant', arme: 'hache-a-deux-mains' })).toBe('hache');
    expect(sonDeCoup({ famille: 'tranchant', arme: 'fouet' })).toBe('fouet');
    expect(sonDeCoup({ famille: 'perforant', arme: 'pic-de-guerre' })).toBe('lance');
    expect(sonDeCoup({ famille: 'perforant', arme: 'lance-d-arcon' })).toBe('lance');
    expect(sonDeCoup({ famille: 'perforant', arme: 'epee-courte' })).toBe('rapiere');
    expect(sonDeCoup({ famille: 'contondant', arme: 'fleau-d-armes' })).toBe('masse');
    expect(sonDeCoup({ famille: 'contondant', arme: 'baton-de-combat' })).toBe('massue');
    expect(sonDeTir('arbalete-de-poing')).toBe('arbalete');
    expect(sonDeTir('arc-long')).toBe('arc');
    expect(sonDeTir('javeline-lancer')).toBe('lancer');
  });

  it('cherche des mots entiers : « arc » n’est pas dans « lance d’arçon »', () => {
    expect(estArmeDeTir('lance-d-arcon')).toBe(false);
    expect(sonDeTir('lance-d-arcon')).toBe('lancer');
  });
});

describe('les sons déclarés', () => {
  it('chaque son a un nom unique et un libellé', () => {
    expect(new Set(SONS).size).toBe(SONS.length);
    for (const s of SONS) expect(LIBELLES_SONS[s].length).toBeGreaterThan(3);
  });
});
