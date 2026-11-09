import { describe, expect, it } from 'vitest';
import { monstreDepuisProfil } from '../src/combat/creation';
import { conduitesDe, DOCTRINE_PAR_DEFAUT, doctrineDe, type Doctrine } from '../src/combat/doctrine';
import { actif, combattant, type Combattant, type EtatCombat } from '../src/combat/etat';
import { distanceCases, grilleDepuisTexte } from '../src/combat/grille';
import { doitFuir, IA_RAPIDE, jouerTourIA } from '../src/combat/ia';
import { creerCombat, finTour } from '../src/combat/moteur';
import { preparerRencontre, RENCONTRES } from '../src/combat/prototype';
import { chargerDonneesSrd } from '../src/donnees-node';

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };
const ARENE = grilleDepuisTexte(['..........', '..........', '..........', '..........', '..........']);

const monstre = (profil: string, id: string, x: number, doctrine?: Partial<Doctrine>): Combattant => ({
  ...monstreDepuisProfil(donnees.monstres.get(profil)!, id, { x, y: 2 }),
  doctrine,
});

// Le mécanisme se teste sur des combattants neutres : `monstre` remplace la conduite du profil par la doctrine donnée.
/** Un duel où c'est au combattant `m` de jouer, au contact d'un adversaire solide. */
function duel(m: Combattant): EtatCombat {
  const adversaire: Combattant = { ...monstre('ogre', 'adversaire', m.position.x + 1), camp: 'heros' };
  const etat = creerCombat(ARENE, [m, adversaire], 42);
  while (actif(etat).id !== m.id) finTour(etat);
  return etat;
}

const blesser = (etat: EtatCombat, id: string, part: number) => {
  const c = combattant(etat, id);
  c.pv = Math.floor(c.pvMax * part);
};

describe('doctrine par combattant', () => {
  it('sans doctrine propre, un combattant suit celle de son camp, ou celle par défaut', () => {
    const m = monstre('ogre', 'm', 1);
    expect(doctrineDe(m)).toBe(DOCTRINE_PAR_DEFAUT);
    const prudente: Doctrine = { agressivite: 0.5, prudence: 2, focus: 'blesses', seuilFuite: 0.4 };
    expect(doctrineDe(m, { monstres: prudente })).toBe(prudente);
    expect(doctrineDe(m, { heros: prudente })).toBe(DOCTRINE_PAR_DEFAUT);
  });

  it('sa doctrine propre ne corrige que ce qu’elle précise', () => {
    const m = monstre('ogre', 'm', 1, { prudence: 3 });
    expect(doctrineDe(m)).toEqual({ ...DOCTRINE_PAR_DEFAUT, prudence: 3 });
    expect(doctrineDe(m, { monstres: { ...DOCTRINE_PAR_DEFAUT, focus: 'lanceurs' } })).toEqual({ ...DOCTRINE_PAR_DEFAUT, focus: 'lanceurs', prudence: 3 });
  });

  it('une doctrine vide ne change pas un combat, à graine égale', () => {
    const rejouer = (doctrine: Partial<Doctrine> | undefined) => {
      const r = RENCONTRES[0]!;
      const { grille, combattants } = preparerRencontre(r, donnees);
      const etat = creerCombat(grille, combattants.map((c) => ({ ...c, doctrine })), 7);
      while (!etat.vainqueur && etat.round < 30) jouerTourIA(etat, ctx, IA_RAPIDE);
      return etat.journal.map((e) => e.texte);
    };
    expect(rejouer({})).toEqual(rejouer(undefined));
  });

  it('l’IA lit la doctrine du combattant qui joue, pas seulement celle de son camp', () => {
    const offensif = duel(monstre('ogre', 'm', 1));
    expect(jouerTourIA(offensif, ctx, IA_RAPIDE)[0]).not.toBe('fin du tour');
    const passif = duel(monstre('ogre', 'm', 1, { agressivite: 0 }));
    expect(jouerTourIA(passif, ctx, IA_RAPIDE)).toEqual(['fin du tour']);
  });
});

describe('fuite', () => {
  it('par défaut, un monstre blessé ne fuit pas seul : c’est le moral du groupe qui décide', () => {
    const etat = duel(monstre('ogre', 'm', 1));
    blesser(etat, 'm', 0.1);
    expect(doitFuir(etat, combattant(etat, 'm'))).toBe(false);
  });

  it('avec un seuil de PV, il fuit seul une fois sous ce seuil, et pas avant', () => {
    const etat = duel(monstre('ogre', 'm', 1, { seuilFuitePv: 0.25 }));
    blesser(etat, 'm', 0.5);
    expect(doitFuir(etat, combattant(etat, 'm'))).toBe(false);
    blesser(etat, 'm', 0.2);
    expect(doitFuir(etat, combattant(etat, 'm'))).toBe(true);
    expect(jouerTourIA(etat, ctx, IA_RAPIDE)).toEqual(['fuite']);
  });

  it('le seuil de PV vaut même si le groupe ne fuit jamais', () => {
    const etat = duel(monstre('ogre', 'm', 1, { seuilFuite: 1, seuilFuitePv: 0.25 }));
    blesser(etat, 'm', 0.2);
    expect(doitFuir(etat, combattant(etat, 'm'))).toBe(true);
  });

  it('un mort-vivant ne fuit jamais, quelle que soit sa doctrine', () => {
    const etat = duel(monstre('squelette', 'm', 1, { seuilFuitePv: 0.9 }));
    blesser(etat, 'm', 0.1);
    expect(doitFuir(etat, combattant(etat, 'm'))).toBe(false);
  });

  it('le moral du groupe fonctionne toujours, et suit le seuil du combattant', () => {
    const compagnon = monstre('ogre', 'compagnon', 3);
    const m = monstre('ogre', 'm', 1, { seuilFuite: 0.4 });
    const adversaire: Combattant = { ...monstre('ogre', 'adversaire', 2), camp: 'heros' };
    const etat = creerCombat(ARENE, [m, compagnon, adversaire], 42);
    expect(doitFuir(etat, combattant(etat, 'm'))).toBe(false);
    combattant(etat, 'compagnon').mort = true;
    expect(doitFuir(etat, combattant(etat, 'm'))).toBe(true);
  });

  it('un héros ne fuit pas', () => {
    const etat = duel(monstre('ogre', 'm', 1));
    const heros = combattant(etat, 'adversaire');
    heros.doctrine = { seuilFuitePv: 0.9 };
    blesser(etat, 'adversaire', 0.1);
    expect(doitFuir(etat, heros)).toBe(false);
  });
});

describe('conduite déduite du profil SRD', () => {
  const conduites = (id: string) => conduitesDe(donnees.monstres.get(id)!);

  it('reconnaît les grandes conduites', () => {
    expect(conduites('squelette')).toEqual(['sans-peur']);
    expect(conduites('zombi')).toEqual(['sans-peur']);
    expect(conduites('loup')).toEqual(['bete']);
    expect(conduites('ogre')).toEqual(['brute']);
    expect(conduites('eclaireur')).toEqual(['tireur']);
    expect(conduites('acolyte')).toEqual(['lanceur']);
    expect(conduites('mage')).toEqual(['lanceur']);
    expect(conduites('bandit')).toEqual(['tireur']);
  });

  it('un guerrier qui porte aussi un arc reste un guerrier', () => {
    for (const id of ['chevalier', 'veteran', 'combattant-hobgobelin']) expect(conduites(id), id).not.toContain('tireur');
  });

  it('la piétaille gobeline lâche prise, pas son chef', () => {
    expect(conduites('sbire-gobelin')).toContain('lache');
    expect(conduites('combattant-gobelin')).toContain('lache');
    expect(conduites('chef-gobelin')).not.toContain('lache');
    expect(conduites('combattant-kobold')).toContain('lache');
  });

  it('un soldat ordinaire suit la doctrine de son camp', () => {
    const soldat = donnees.monstres.get('combattant-hobgobelin')!;
    expect(conduitesDe(soldat)).toEqual([]);
    expect(monstreDepuisProfil(soldat, 's', { x: 0, y: 0 }).doctrine).toBeUndefined();
  });

  it('un monstre créé depuis son profil porte sa conduite', () => {
    const m = monstreDepuisProfil(donnees.monstres.get('loup')!, 'm', { x: 0, y: 0 });
    expect(m.doctrine).toEqual({ seuilFuite: 1, seuilFuitePv: 0.25 });
  });

  it('un gros lanceur (dragon, géant) ne joue pas au tireur', () => {
    expect(conduites('dragon-rouge-adulte')).not.toContain('lanceur');
    expect(conduites('geant-des-nuages')).not.toContain('lanceur');
  });

  it('chaque profil a une conduite cohérente : jamais tireur et brute, jamais sans-peur et lâche', () => {
    for (const m of donnees.monstres.values()) {
      const c = conduitesDe(m);
      expect(c.includes('tireur') && c.includes('brute'), m.id).toBe(false);
      expect(c.includes('sans-peur') && c.includes('lache'), m.id).toBe(false);
      expect(c.includes('tireur') && c.includes('lanceur'), m.id).toBe(false);
    }
  });
});

describe('garder ses distances', () => {
  /** Un tireur à trois cases d'un adversaire, avec de la place derrière lui. */
  const aDistance = (doctrine?: Partial<Doctrine>) => {
    const tireur: Combattant = { ...monstreDepuisProfil(donnees.monstres.get('eclaireur')!, 'm', { x: 5, y: 2 }), doctrine };
    const adversaire: Combattant = { ...monstre('ogre', 'adversaire', 8), camp: 'heros' };
    const etat = creerCombat(ARENE, [tireur, adversaire], 42);
    while (actif(etat).id !== 'm') finTour(etat);
    return etat;
  };

  it('un combattant qui garde ses distances reste loin ; sans cette doctrine, l’IA rapide le mène au contact', () => {
    const prudent = aDistance({ garderDistance: 0.2 });
    jouerTourIA(prudent, ctx, IA_RAPIDE);
    const neutre = aDistance();
    jouerTourIA(neutre, ctx, IA_RAPIDE);
    const distance = (e: EtatCombat) => distanceCases(combattant(e, 'm').position, combattant(e, 'adversaire').position);
    expect(distance(prudent)).toBeGreaterThan(1);
    expect(distance(neutre)).toBe(1);
  });
});
