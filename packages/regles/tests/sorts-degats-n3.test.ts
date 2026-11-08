// Sorts de dégâts jusqu'au niveau 3 jouables en combat (08/11/2026).
import { describe, expect, it } from 'vitest';
import { cartesDisponibles, executer } from '../src/combat/cartes';
import { heroDepuisFiche, monstreDepuisProfil } from '../src/combat/creation';
import { aEtat, combattant, type Combattant, type EtatCombat } from '../src/combat/etat';
import { distanceCases, grilleDepuisTexte } from '../src/combat/grille';
import { creerCombat, finTour } from '../src/combat/moteur';
import { HEROS_PRE_TIRES } from '../src/combat/prototype';
import { SORTS_JOUABLES_EN_COMBAT } from '../src/combat/sorts';
import { chargerDonneesSrd } from '../src/donnees-node';
import { calculerFiche } from '../src/fiche';

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };
const ARENE = grilleDepuisTexte(['..........', '..........', '..........', '..........', '..........']);

const NOUVEAUX = [
  'boule-de-feu',
  'eclair',
  'fracassement',
  'epine-mentale',
  'poussiere-d-etoile',
  'rayon-empoisonne',
  'moquerie-cruelle',
  'murmures-dissonants',
  'decharge-occulte',
  'couteau-de-glace',
  'fleche-acide',
];

/** Ambrine (magicienne) qui connaît tous les nouveaux sorts et a des emplacements de niveau 1 à 3. */
function ambrine(x: number, y: number, niveau = 3): Combattant {
  const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === 'Ambrine')!;
  const r = calculerFiche(h.choix, donnees);
  if (!r.ok) throw new Error(r.erreurs.join());
  const c = heroDepuisFiche(r.fiche, h.kit, donnees, { x, y });
  c.niveau = niveau;
  c.sorts.push(...NOUVEAUX);
  c.incantation!.emplacements = [4, 3, 3];
  c.incantation!.emplacementsMax = [4, 3, 3];
  return c;
}

function gobelin(id: string, x: number, y: number): Combattant {
  return monstreDepuisProfil(donnees.monstres.get('combattant-gobelin')!, id, { x, y });
}

function combat(combattants: Combattant[], des: number[] = []): EtatCombat {
  const etat = creerCombat(ARENE, combattants.map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), 1, { elan: false });
  etat.desImposes = [...des];
  return etat;
}

const jouer = (etat: EtatCombat, carte: string, extra: object) => executer(etat, ctx, { type: 'jouer', carte: `sort:${carte}`, ...extra } as never);

describe('sorts de dégâts jusqu’au niveau 3', () => {
  it('sont tous dans le catalogue et dans la liste des sorts jouables', () => {
    for (const id of NOUVEAUX) {
      expect(donnees.sorts.has(id), id).toBe(true);
      expect(SORTS_JOUABLES_EN_COMBAT.has(id), id).toBe(true);
    }
  });

  it('Ambrine reçoit une carte pour chacun', () => {
    const etat = combat([ambrine(0, 2), gobelin('g1', 2, 2)]);
    const cartes = cartesDisponibles(etat, ctx, etat.combattants[0]!.id);
    for (const id of NOUVEAUX) expect(cartes.find((k) => k.id === `sort:${id}`), id).toBeDefined();
  });

  it('Boule de feu touche la sphère de 6 m et épargne ce qui est hors zone', () => {
    const etat = combat([ambrine(0, 4), gobelin('g1', 3, 1), gobelin('g2', 4, 2), gobelin('loin', 9, 4)]);
    const [g1, g2, loin] = [combattant(etat, 'g1'), combattant(etat, 'g2'), combattant(etat, 'loin')];
    const avant = [g1.pv, g2.pv, loin.pv];
    jouer(etat, 'boule-de-feu', { point: { x: 3, y: 1 } });
    expect(g1.pv).toBeLessThan(avant[0]!);
    expect(g2.pv).toBeLessThan(avant[1]!);
    expect(loin.pv).toBe(avant[2]);
    expect(etat.combattants[0]!.incantation!.emplacements[2]).toBe(2);
  });

  it('Éclair frappe la ligne de 30 m devant le lanceur, pas à côté', () => {
    const etat = combat([ambrine(0, 2), gobelin('a', 3, 2), gobelin('b', 8, 2), gobelin('cote', 3, 0)]);
    const [a, b, cote] = [combattant(etat, 'a'), combattant(etat, 'b'), combattant(etat, 'cote')];
    const avant = [a.pv, b.pv, cote.pv];
    jouer(etat, 'eclair', { point: { x: 1, y: 2 } });
    expect(a.pv).toBeLessThan(avant[0]!);
    expect(b.pv).toBeLessThan(avant[1]!);
    expect(cote.pv).toBe(avant[2]);
  });

  it('Fracassement : sphère de 3 m', () => {
    const etat = combat([ambrine(0, 4), gobelin('dedans', 5, 1), gobelin('dehors', 9, 1)]);
    const [dedans, dehors] = [combattant(etat, 'dedans'), combattant(etat, 'dehors')];
    const avant = [dedans.pv, dehors.pv];
    jouer(etat, 'fracassement', { point: { x: 5, y: 1 } });
    expect(dedans.pv).toBeLessThan(avant[0]!);
    expect(dehors.pv).toBe(avant[1]);
  });

  it("Rayon empoisonné : empoisonne jusqu'à la fin du prochain tour du lanceur", () => {
    const etat = combat([ambrine(0, 2), gobelin('g', 3, 2)], [20, 20, 20, 20, 20, 20]);
    const g = combattant(etat, 'g');
    g.pv = g.pvMax = 100;
    jouer(etat, 'rayon-empoisonne', { cibles: ['g'] });
    expect(aEtat(g, 'empoisonne')).toBe(true);
    finTour(etat); // fin du tour du lanceur : l'état reste
    expect(aEtat(g, 'empoisonne')).toBe(true);
    finTour(etat); // fin du tour du gobelin
    expect(aEtat(g, 'empoisonne')).toBe(true);
    finTour(etat); // fin du tour suivant du lanceur : l'état prend fin
    expect(aEtat(g, 'empoisonne')).toBe(false);
  });

  it('Flèche acide : des dégâts de plus à la fin du tour de la cible, une seule fois', () => {
    const etat = combat([ambrine(0, 2), gobelin('g', 3, 2)], [20, 20, 20, 20, 20, 20, 20, 20]);
    const g = combattant(etat, 'g');
    g.pv = g.pvMax = 100;
    jouer(etat, 'fleche-acide', { cibles: ['g'] });
    expect(g.modificateurs.some((m) => m.type === 'degats_differes')).toBe(true);
    const apresImpact = g.pv;
    expect(apresImpact).toBeLessThan(100);
    finTour(etat); // fin du tour du lanceur : rien
    expect(g.pv).toBe(apresImpact);
    finTour(etat); // fin du tour de la cible : les dégâts consécutifs
    expect(g.pv).toBeLessThan(apresImpact);
    expect(g.modificateurs.some((m) => m.type === 'degats_differes')).toBe(false);
  });

  it('Flèche acide ratée : la moitié des dégâts seulement, et rien ensuite', () => {
    const etat = combat([ambrine(0, 2), gobelin('g', 3, 2)], [1, 8, 8, 8, 8, 8, 8]);
    const g = combattant(etat, 'g');
    g.pv = g.pvMax = 100;
    jouer(etat, 'fleche-acide', { cibles: ['g'] });
    expect(g.pv).toBeLessThan(100);
    expect(g.modificateurs.some((m) => m.type === 'degats_differes')).toBe(false);
  });

  it('Moquerie cruelle : désavantage au prochain jet d’attaque sur une sauvegarde ratée', () => {
    const etat = combat([ambrine(0, 2), gobelin('g', 3, 2)], [1, 6, 6]);
    const g = combattant(etat, 'g');
    jouer(etat, 'moquerie-cruelle', { cibles: ['g'] });
    expect(g.modificateurs.some((m) => m.type === 'desavantage_attaque')).toBe(true);
  });

  it('Murmures dissonants : la cible qui échoue utilise sa Réaction pour s’éloigner', () => {
    const etat = combat([ambrine(0, 2), gobelin('g', 2, 2)], [1, 6, 6, 6]);
    const g = combattant(etat, 'g');
    g.pv = g.pvMax = 100;
    g.ressources.reaction = 1;
    const avant = distanceCases(g.position, { x: 0, y: 2 });
    jouer(etat, 'murmures-dissonants', { cibles: ['g'] });
    expect(distanceCases(g.position, { x: 0, y: 2 })).toBeGreaterThan(avant);
    expect(g.ressources.reaction).toBe(0);
  });

  it('Décharge occulte : un rayon de plus aux niveaux 5, 11 et 17', () => {
    for (const [niveau, rayons] of [[3, 1], [5, 2], [11, 3], [17, 4]] as const) {
      const etat = combat([ambrine(0, 2, niveau), gobelin('g', 3, 2)]);
      combattant(etat, 'g').pv = combattant(etat, 'g').pvMax = 500;
      jouer(etat, 'decharge-occulte', { cibles: ['g'] });
      expect(etat.journal.filter((e) => e.texte.startsWith('Rayon contre')).length, `niveau ${niveau}`).toBe(rayons);
    }
  });

  it('Couteau de glace : l’explosion atteint les voisins de la cible, pas les lointains', () => {
    const etat = combat([ambrine(0, 4), gobelin('cible', 4, 2), gobelin('voisin', 5, 2), gobelin('loin', 9, 0)], Array(30).fill(1));
    const [cible, voisin, loin] = [combattant(etat, 'cible'), combattant(etat, 'voisin'), combattant(etat, 'loin')];
    const avant = [cible.pv, voisin.pv, loin.pv];
    jouer(etat, 'couteau-de-glace', { point: { x: 4, y: 2 } });
    expect(cible.pv).toBeLessThan(avant[0]!);
    expect(voisin.pv).toBeLessThan(avant[1]!);
    expect(loin.pv).toBe(avant[2]);
  });
});
