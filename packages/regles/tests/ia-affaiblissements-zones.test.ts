// L'IA valorise les affaiblissements (Fléau, Ralentissement, à terre…) et choisit où poser une zone (14/11/2026).
import { describe, expect, it } from 'vitest';
import { cartesDisponibles } from '../src/combat/cartes';
import { heroDepuisFiche, monstreDepuisProfil } from '../src/combat/creation';
import { actif, combattant, type Combattant, type EtatCombat } from '../src/combat/etat';
import { grilleDepuisTexte } from '../src/combat/grille';
import { DOCTRINE_PAR_DEFAUT, evaluer, pointsZone } from '../src/combat/ia';
import { creerCombat } from '../src/combat/moteur';
import { HEROS_PRE_TIRES } from '../src/combat/prototype';
import { chargerDonneesSrd } from '../src/donnees-node';
import { calculerFiche } from '../src/fiche';

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };
const LARGE = grilleDepuisTexte(Array.from({ length: 5 }, () => '.'.repeat(24)));

function ambrine(x: number, y: number): Combattant {
  const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === 'Ambrine')!;
  const r = calculerFiche(h.choix, donnees);
  if (!r.ok) throw new Error(r.erreurs.join());
  const c = heroDepuisFiche(r.fiche, h.kit, donnees, { x, y });
  c.sorts.push('boule-de-feu');
  c.incantation!.emplacements = [4, 3, 3];
  c.incantation!.emplacementsMax = [4, 3, 3];
  return c;
}

const gobelin = (id: string, x: number, y: number): Combattant => monstreDepuisProfil(donnees.monstres.get('combattant-gobelin')!, id, { x, y });
/** Un gobelin passé du côté des héros : un allié du lanceur. */
const allie = (id: string, x: number, y: number): Combattant => ({ ...gobelin(id, x, y), camp: 'heros' });

function combat(combattants: Combattant[]): EtatCombat {
  return creerCombat(LARGE, combattants.map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), 1, { elan: false });
}

const carteBoule = (etat: EtatCombat) => cartesDisponibles(etat, ctx, actif(etat).id).find((k) => k.id === 'sort:boule-de-feu')!;

describe('l’IA valorise ce qui entrave un adversaire', () => {
  const duel = () => combat([ambrine(0, 2), gobelin('g1', 5, 2)]);
  const note = (etat: EtatCombat) => evaluer(etat, 'heros', DOCTRINE_PAR_DEFAUT);

  it('un malus de Fléau, une Vitesse réduite, un désavantage ou l’état à terre rapportent des points', () => {
    const base = note(duel());
    const fleau = duel();
    combattant(fleau, 'g1').modificateurs.push({ id: 'fleau-a', type: 'de_attaque', de: '-1d4', source: 'ambrine' });
    const ralenti = duel();
    combattant(ralenti, 'g1').modificateurs.push({ id: 'ralentissement', type: 'vitesse', valeur: -3, source: 'ambrine' });
    const sape = duel();
    combattant(sape, 'g1').modificateurs.push({ id: 'sape', type: 'desavantage_attaque', source: 'ambrine', usageUnique: true });
    const terre = duel();
    combattant(terre, 'g1').etats.push({ etat: 'a-terre' });
    for (const e of [fleau, ralenti, sape, terre]) expect(note(e)).toBeGreaterThan(base);
  });

  it('les mêmes entraves sur un héros lui coûtent', () => {
    const base = note(duel());
    const e = duel();
    combattant(e, 'ambrine').etats.push({ etat: 'empoisonne' });
    expect(note(e)).toBeLessThan(base);
  });

  it('un adversaire qui ne peut plus agir n’est pas compté deux fois : l’entrave s’efface devant la neutralisation', () => {
    const neutre = duel();
    combattant(neutre, 'g1').etats.push({ etat: 'paralyse' });
    const neutreEtTerre = duel();
    combattant(neutreEtTerre, 'g1').etats.push({ etat: 'paralyse' }, { etat: 'a-terre' });
    expect(note(neutreEtTerre)).toBe(note(neutre));
  });
});

describe('l’IA choisit où poser une zone', () => {
  it('vise le point qui touche le plus d’adversaires', () => {
    // Deux gobelins côte à côte au fond, un troisième isolé près du lanceur.
    const etat = combat([ambrine(0, 2), gobelin('g1', 20, 1), gobelin('g2', 20, 3), gobelin('seul', 6, 2)]);
    const points = pointsZone(etat, actif(etat), carteBoule(etat));
    expect(points.length).toBeGreaterThan(0);
    const g = (id: string) => combattant(etat, id).position;
    // Le meilleur point est à moins de 4 cases des deux gobelins du fond.
    const proche = (p: { x: number; y: number }, q: { x: number; y: number }) => Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y)) <= 4;
    expect(proche(points[0]!, g('g1')) && proche(points[0]!, g('g2'))).toBe(true);
  });

  it('ne propose aucun point qui blesserait plus d’alliés que d’adversaires', () => {
    // Un adversaire pris en sandwich entre deux alliés : tout point qui l’atteint touche aussi un allié.
    const etat = combat([ambrine(0, 2), allie('a1', 11, 2), gobelin('g1', 12, 2), allie('a2', 13, 2)]);
    expect(pointsZone(etat, actif(etat), carteBoule(etat))).toEqual([]);
  });

  it('accepte un point qui touche deux adversaires pour un allié touché', () => {
    const etat = combat([ambrine(0, 2), allie('a1', 10, 0), gobelin('g1', 14, 2), gobelin('g2', 14, 3)]);
    expect(pointsZone(etat, actif(etat), carteBoule(etat)).length).toBeGreaterThan(0);
  });
});
