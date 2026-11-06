// Les éléments posés sur les cases : lus dans les cartes en texte, avec leurs règles. Arbre et rocher font l'effet d'un mur, eau,
// boue et neige celui d'un terrain difficile ; les obstacles bas (rocher bas, tronc, caisse) bloquent le passage et donnent un couvert.
import { describe, expect, it } from 'vitest';
import { heroDepuisFiche, monstreDepuisProfil } from '../src/combat/creation';
import { combattant } from '../src/combat/etat';
import { BONUS_COUVERT, cheminsAtteignables, couvert, grilleDepuisTexte, INFO_RELIEFS, ligneDeVue, RELIEFS, reliefDe, TERRAINS, typeCase } from '../src/combat/grille';
import { ca, couvertSauvegarde, creerCombat, detailsJet, jetAttaque, sauvegarde } from '../src/combat/moteur';
import { HEROS_PRE_TIRES, RENCONTRES } from '../src/combat/prototype';
import { chargerDonneesSrd } from '../src/donnees-node';
import { calculerFiche } from '../src/fiche';

const vide = { bloquees: new Set<string>(), occupees: new Set<string>() };

describe('éléments sur les cases', () => {
  it('chaque élément a sa lettre, unique et sans collision avec les autres caractères d’une carte', () => {
    const lettres = RELIEFS.map((r) => INFO_RELIEFS[r].lettre);
    expect(new Set(lettres).size).toBe(RELIEFS.length);
    for (const l of lettres) expect('.#~Hm').not.toContain(l);
  });

  it('une carte en texte est lue : le type de case suit l’élément, et l’élément est retrouvé', () => {
    const g = grilleDepuisTexte(['.TR', 'ebn', '#~.']);
    expect(typeCase(g, { x: 1, y: 0 })).toBe('mur');
    expect(reliefDe(g, { x: 1, y: 0 })).toBe('arbre');
    expect(typeCase(g, { x: 2, y: 0 })).toBe('mur');
    expect(reliefDe(g, { x: 2, y: 0 })).toBe('rocher');
    expect(typeCase(g, { x: 0, y: 1 })).toBe('difficile');
    expect(reliefDe(g, { x: 0, y: 1 })).toBe('eau');
    expect(reliefDe(g, { x: 1, y: 1 })).toBe('boue');
    expect(reliefDe(g, { x: 2, y: 1 })).toBe('neige');
    // Les cases d'avant restent ce qu'elles étaient, sans élément.
    expect(typeCase(g, { x: 0, y: 2 })).toBe('mur');
    expect(reliefDe(g, { x: 0, y: 2 })).toBeUndefined();
    expect(typeCase(g, { x: 1, y: 2 })).toBe('difficile');
    expect(reliefDe(g, { x: 1, y: 2 })).toBeUndefined();
    expect(reliefDe(g, { x: 0, y: 0 })).toBeUndefined();
  });

  it('une carte sans élément n’a pas de table d’éléments (les anciennes cartes ne changent pas)', () => {
    expect(grilleDepuisTexte(['..#', '.~.']).reliefs).toBeUndefined();
  });

  it('les types de case de chaque élément : mur pour l’arbre et le rocher, terrain difficile pour les plaques, obstacle bas pour le reste', () => {
    expect(INFO_RELIEFS.arbre.type).toBe('mur');
    expect(INFO_RELIEFS.rocher.type).toBe('mur');
    for (const r of ['eau', 'boue', 'neige'] as const) expect(INFO_RELIEFS[r].type).toBe('difficile');
    for (const r of ['rocher-bas', 'tronc', 'caisse'] as const) expect(INFO_RELIEFS[r].type).toBe('obstacle');
  });

  it('un arbre bloque le passage et la vue comme un mur', () => {
    const arbre = grilleDepuisTexte(['.T.']);
    const mur = grilleDepuisTexte(['.#.']);
    expect(ligneDeVue(arbre, { x: 0, y: 0 }, { x: 2, y: 0 })).toBe(false);
    expect(ligneDeVue(mur, { x: 0, y: 0 }, { x: 2, y: 0 })).toBe(false);
    const a = [...cheminsAtteignables(arbre, { x: 0, y: 0 }, 30, vide).keys()].sort();
    const m = [...cheminsAtteignables(mur, { x: 0, y: 0 }, 30, vide).keys()].sort();
    expect(a).toEqual(m);
    expect(a).not.toContain('1,0');
  });

  it('l’eau, la boue et la neige coûtent le double, comme un terrain difficile', () => {
    const coutVers = (carte: string[]) => cheminsAtteignables(grilleDepuisTexte(carte), { x: 0, y: 0 }, 30, vide).get('1,0')?.cout;
    const difficile = coutVers(['.~']);
    expect(difficile).toBe(3);
    for (const lettre of ['e', 'b', 'n']) expect(coutVers([`.${lettre}`])).toBe(difficile);
    expect(coutVers(['..'])).toBe(1.5);
  });

  it('les rencontres du prototype n’ont que des caractères connus, et une ambiance connue', () => {
    const connus = new Set(['.', '#', '~', 'H', 'm', ...RELIEFS.map((r) => INFO_RELIEFS[r].lettre)]);
    for (const r of RENCONTRES) {
      expect(TERRAINS).toContain(r.terrain);
      for (const ligne of r.carte) for (const c of ligne) expect(connus.has(c), `${r.id} : « ${c} »`).toBe(true);
    }
  });
});

describe('obstacles bas et couvert (phase 2)', () => {
  it('un obstacle bas (rocher bas, tronc, caisse) bloque le passage mais pas la vue', () => {
    for (const lettre of ['r', 't', 'c']) {
      const g = grilleDepuisTexte([`.${lettre}.`]);
      expect(typeCase(g, { x: 1, y: 0 })).toBe('obstacle');
      expect(ligneDeVue(g, { x: 0, y: 0 }, { x: 2, y: 0 })).toBe(true);
      expect(cheminsAtteignables(g, { x: 0, y: 0 }, 30, vide).has('1,0')).toBe(false);
    }
  });

  it('demi-couvert : +2 quand un obstacle bas est entre les deux, rien s’il est collé à celui qui tire', () => {
    const g = grilleDepuisTexte(['......', '......']);
    expect(couvert(g, { x: 0, y: 0 }, { x: 5, y: 0 })).toBe(0);
    const derriere = grilleDepuisTexte(['....r.']);
    expect(couvert(derriere, { x: 0, y: 0 }, { x: 5, y: 0 })).toBe(BONUS_COUVERT);
    expect(BONUS_COUVERT).toBe(2);
    // Le tireur se tient contre le rocher : il tire par-dessus.
    const contre = grilleDepuisTexte(['.r....']);
    expect(couvert(contre, { x: 0, y: 0 }, { x: 5, y: 0 })).toBe(0);
    // Un obstacle hors du tracé ne protège pas.
    const cote = grilleDepuisTexte(['......', '....r.']);
    expect(couvert(cote, { x: 0, y: 0 }, { x: 5, y: 0 })).toBe(0);
    // Au corps à corps (cases voisines), rien entre les deux.
    expect(couvert(derriere, { x: 3, y: 0 }, { x: 5, y: 0 })).toBe(0);
  });

  it('un arbre ou un mur ne donne pas de couvert : il coupe la vue, l’attaque n’a pas lieu', () => {
    const g = grilleDepuisTexte(['..T...']);
    expect(couvert(g, { x: 0, y: 0 }, { x: 5, y: 0 })).toBe(0);
    expect(ligneDeVue(g, { x: 0, y: 0 }, { x: 5, y: 0 })).toBe(false);
  });
});

describe('le couvert dans un vrai combat', () => {
  const donnees = chargerDonneesSrd();
  const hero = (x: number, y: number) => {
    const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === 'Sylvaine')!;
    const r = calculerFiche(h.choix, donnees);
    if (!r.ok) throw new Error(r.erreurs.join());
    return heroDepuisFiche(r.fiche, h.kit, donnees, { x, y });
  };
  const combat = (carte: string[]) => {
    const etat = creerCombat(
      grilleDepuisTexte(carte),
      [
        { ...hero(0, 0), bonusInitiative: 100 },
        { ...monstreDepuisProfil(donnees.monstres.get('combattant-gobelin')!, 'gob', { x: 5, y: 0 }), bonusInitiative: 0 },
      ],
      1,
      { elan: false },
    );
    return { etat, sylvaine: combattant(etat, 'sylvaine'), gob: combattant(etat, 'gob') };
  };

  it('le même jet touche à découvert et rate derrière un rocher bas, et le journal dit pourquoi', () => {
    const ouvert = combat(['......']);
    const juste = ca(ouvert.gob) - 5;
    ouvert.etat.desImposes = [juste];
    expect(jetAttaque(ouvert.etat, ouvert.sylvaine, ouvert.gob, 5, 'distance').touche).toBe(true);

    const abrite = combat(['....r.']);
    abrite.etat.desImposes = [juste];
    const jet = jetAttaque(abrite.etat, abrite.sylvaine, abrite.gob, 5, 'distance');
    expect(jet.couvert).toBe(2);
    expect(jet.ca).toBe(ca(abrite.gob) + 2);
    expect(jet.touche).toBe(false);
    expect(detailsJet(jet, true).couvert).toBe(2);
  });

  it('le couvert aide aux sauvegardes de Dextérité, et à elles seules', () => {
    const { etat, gob } = combat(['....r.']);
    expect(couvertSauvegarde(etat, gob, 'dex', { x: 0, y: 0 })).toBe(2);
    expect(couvertSauvegarde(etat, gob, 'sag', { x: 0, y: 0 })).toBe(0);
    // Un jet qui rate de 1 réussit avec le couvert.
    const dd = 15;
    etat.desImposes = [dd - 1 - gob.sauvegardes.dex];
    expect(sauvegarde(etat, gob, 'dex', dd)).toBe(false);
    etat.desImposes = [dd - 1 - gob.sauvegardes.dex];
    expect(sauvegarde(etat, gob, 'dex', dd, couvertSauvegarde(etat, gob, 'dex', { x: 0, y: 0 }))).toBe(true);
  });
});
