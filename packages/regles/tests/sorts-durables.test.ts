// Sorts dont l'effet dure : zones qui restent sur le plateau et attaques répétées (08/11/2026).
import { describe, expect, it } from 'vitest';
import { cartesDisponibles, executer } from '../src/combat/cartes';
import { heroDepuisFiche, monstreDepuisProfil } from '../src/combat/creation';
import { combattant, type Combattant, type EtatCombat } from '../src/combat/etat';
import { grilleDepuisTexte } from '../src/combat/grille';
import { creerCombat, finConcentration, finTour } from '../src/combat/moteur';
import { HEROS_PRE_TIRES } from '../src/combat/prototype';
import { SORTS_JOUABLES_EN_COMBAT } from '../src/combat/sorts';
import { chargerDonneesSrd } from '../src/donnees-node';
import { calculerFiche } from '../src/fiche';

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };
const ARENE = grilleDepuisTexte(['..........', '..........', '..........', '..........', '..........']);

const DURABLES = ['sphere-de-feu', 'rayon-de-lune', 'appel-de-la-foudre', 'invocation-d-animaux', 'lame-de-feu', 'caresse-du-vampire'];

function ambrine(x: number, y: number): Combattant {
  const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === 'Ambrine')!;
  const r = calculerFiche(h.choix, donnees);
  if (!r.ok) throw new Error(r.erreurs.join());
  const c = heroDepuisFiche(r.fiche, h.kit, donnees, { x, y });
  c.sorts.push(...DURABLES);
  c.incantation!.emplacements = [4, 3, 3];
  c.incantation!.emplacementsMax = [4, 3, 3];
  return c;
}

function gobelin(id: string, x: number, y: number): Combattant {
  const g = monstreDepuisProfil(donnees.monstres.get('combattant-gobelin')!, id, { x, y });
  g.pv = g.pvMax = 200;
  return g;
}

function combat(combattants: Combattant[], des: number[] = []): EtatCombat {
  const etat = creerCombat(ARENE, combattants.map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), 1, { elan: false });
  etat.desImposes = [...des];
  return etat;
}

const jouer = (etat: EtatCombat, carte: string, extra: object) => executer(etat, ctx, { type: 'jouer', carte, ...extra } as never);
const cartes = (etat: EtatCombat) => cartesDisponibles(etat, ctx, etat.combattants[0]!.id);
const unsUns = (n = 60) => Array(n).fill(1); // toutes les sauvegardes ratées, dégâts minimaux

describe('sorts qui durent', () => {
  it('sont dans la liste des sorts jouables et ont une carte', () => {
    const etat = combat([ambrine(0, 2), gobelin('g', 5, 2)]);
    for (const id of DURABLES) {
      expect(SORTS_JOUABLES_EN_COMBAT.has(id), id).toBe(true);
      expect(cartes(etat).find((k) => k.id === `sort:${id}`), id).toBeDefined();
    }
  });

  it('Sphère de feu : elle reste, et fait un jet à qui finit son tour à côté', () => {
    const etat = combat([ambrine(0, 2), gobelin('g', 4, 2), gobelin('loin', 9, 4)], unsUns());
    const [g, loin] = [combattant(etat, 'g'), combattant(etat, 'loin')];
    expect(jouer(etat, 'sort:sphere-de-feu', { point: { x: 3, y: 2 } }).ok).toBe(true);
    expect(etat.zones).toHaveLength(1);
    expect(cartes(etat).find((k) => k.id === 'aptitude:zone-sphere-de-feu')).toBeDefined();
    finTour(etat); // fin du tour d'Ambrine
    finTour(etat); // fin du tour du gobelin voisin de la sphère
    expect(g.pv).toBeLessThan(200);
    expect(loin.pv).toBe(200);
  });

  it("Sphère de feu : elle roule et s'arrête sur la première créature rencontrée", () => {
    const etat = combat([ambrine(0, 2), gobelin('g', 5, 2)], unsUns());
    const g = combattant(etat, 'g');
    jouer(etat, 'sort:sphere-de-feu', { point: { x: 2, y: 2 } });
    const avant = g.pv;
    expect(jouer(etat, 'aptitude:zone-sphere-de-feu', { point: { x: 7, y: 2 } }).ok).toBe(true);
    expect(etat.zones![0]!.centre).toEqual({ x: 5, y: 2 });
    expect(g.pv).toBeLessThan(avant);
  });

  it('perdre la concentration fait disparaître la zone et ses cartes', () => {
    const etat = combat([ambrine(0, 2), gobelin('g', 5, 2)]);
    jouer(etat, 'sort:sphere-de-feu', { point: { x: 3, y: 2 } });
    finConcentration(etat, etat.combattants[0]!);
    expect(etat.zones).toHaveLength(0);
    expect(cartes(etat).find((k) => k.id === 'aptitude:zone-sphere-de-feu')).toBeUndefined();
  });

  it('Rayon de lune : touche à l’apparition et à l’arrivée, une fois par tour de table', () => {
    const etat = combat([ambrine(0, 2), gobelin('a', 4, 2), gobelin('b', 8, 4)], unsUns());
    const [a, b] = [combattant(etat, 'a'), combattant(etat, 'b')];
    jouer(etat, 'sort:rayon-de-lune', { point: { x: 4, y: 2 } });
    const apresCast = a.pv;
    expect(apresCast).toBeLessThan(200);
    expect(b.pv).toBe(200);
    finTour(etat);
    finTour(etat); // fin du tour du gobelin a, dans le rayon : déjà touché ce tour de table
    expect(a.pv).toBe(apresCast);
    // Au tour suivant d'Ambrine, elle déplace le rayon sur b.
    finTour(etat);
    expect(jouer(etat, 'aptitude:zone-rayon-de-lune', { point: { x: 8, y: 4 } }).ok).toBe(true);
    expect(b.pv).toBeLessThan(200);
  });

  it('Appel de la foudre : un éclair à l’incantation, puis un autre à chaque tour sous le nuage', () => {
    const etat = combat([ambrine(0, 2), gobelin('a', 4, 2), gobelin('b', 7, 4)], unsUns());
    const [a, b] = [combattant(etat, 'a'), combattant(etat, 'b')];
    jouer(etat, 'sort:appel-de-la-foudre', { point: { x: 4, y: 2 } });
    expect(a.pv).toBeLessThan(200);
    expect(b.pv).toBe(200);
    finTour(etat);
    finTour(etat);
    finTour(etat); // nouveau tour d'Ambrine
    expect(jouer(etat, 'aptitude:zone-appel-de-la-foudre', { point: { x: 7, y: 4 } }).ok).toBe(true);
    expect(b.pv).toBeLessThan(200);
  });

  it("Invocation d'animaux : la meute qui se déplace blesse ceux qu'elle approche", () => {
    const etat = combat([ambrine(0, 2), gobelin('g', 9, 2)], unsUns());
    const g = combattant(etat, 'g');
    jouer(etat, 'sort:invocation-d-animaux', { point: { x: 5, y: 2 } });
    expect(g.pv).toBe(200);
    expect(jouer(etat, 'aptitude:zone-invocation-d-animaux', { point: { x: 8, y: 2 } }).ok).toBe(true);
    expect(g.pv).toBeLessThan(200);
  });

  it('un point trop éloigné de la zone est refusé', () => {
    const etat = combat([ambrine(0, 2), gobelin('g', 9, 2)]);
    jouer(etat, 'sort:sphere-de-feu', { point: { x: 1, y: 2 } });
    expect(jouer(etat, 'aptitude:zone-sphere-de-feu', { point: { x: 9, y: 2 } }).ok).toBe(false);
  });

  it('Lame de feu : lancée en action bonus, puis attaque à chaque tour tant qu’on se concentre', () => {
    const etat = combat([ambrine(0, 2), gobelin('g', 1, 2)], [20, 6, 6, 6, 6]);
    const g = combattant(etat, 'g');
    expect(cartes(etat).find((k) => k.id === 'aptitude:lame-de-feu')).toBeUndefined();
    expect(jouer(etat, 'sort:lame-de-feu', {}).ok).toBe(true);
    const k = cartes(etat).find((x) => x.id === 'aptitude:lame-de-feu');
    expect(k?.jouable).toBe(true);
    expect(jouer(etat, 'aptitude:lame-de-feu', { cibles: ['g'] }).ok).toBe(true);
    expect(g.pv).toBeLessThan(200);
  });

  it('Caresse du vampire : touche au contact et rend la moitié des dégâts en PV', () => {
    const etat = combat([ambrine(0, 2), gobelin('g', 1, 2)], [20, 6, 6, 6, 6]);
    const [ambr, g] = [etat.combattants[0]!, combattant(etat, 'g')];
    ambr.pv = 1;
    expect(jouer(etat, 'sort:caresse-du-vampire', { cibles: ['g'] }).ok).toBe(true);
    const infliges = 200 - g.pv;
    expect(infliges).toBeGreaterThan(0);
    expect(ambr.pv).toBe(1 + Math.floor(infliges / 2));
    expect(cartes(etat).find((k) => k.id === 'aptitude:caresse-du-vampire')).toBeDefined();
  });
});
