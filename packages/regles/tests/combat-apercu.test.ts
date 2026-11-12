// L'aperçu d'une carte avant de choisir sa cible : chances de toucher, chances d'échec d'une sauvegarde, dégâts moyens.
// Les estimations sont comparées à de vrais jets (`jetAttaque`, `sauvegarde`) tirés des milliers de fois.
import { describe, expect, it } from 'vitest';
import { apercuCarte, cartesDisponibles, type Carte } from '../src/combat/cartes';
import { heroDepuisFiche, monstreDepuisProfil } from '../src/combat/creation';
import { ajouterEtat, creerCombat, jetAttaque, probabiliteToucher, sauvegarde } from '../src/combat/moteur';
import { combattant, type Combattant, type EtatCombat } from '../src/combat/etat';
import { grilleDepuisTexte } from '../src/combat/grille';
import { HEROS_PRE_TIRES } from '../src/combat/prototype';
import { chargerDonneesSrd } from '../src/donnees-node';
import { moyenneDes } from '../src/des';
import { calculerFiche } from '../src/fiche';

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };

function hero(nom: string, x: number, y: number): Combattant {
  const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === nom)!;
  const r = calculerFiche(h.choix, donnees);
  if (!r.ok) throw new Error(r.erreurs.join());
  return heroDepuisFiche(r.fiche, h.kit, donnees, { x, y });
}
const monstre = (profil: string, x: number, y: number, id = profil): Combattant => monstreDepuisProfil(donnees.monstres.get(profil)!, id, { x, y });
const ARENE = grilleDepuisTexte(['..........', '..........', '..........', '..........', '..........']);
const combat = (cs: Combattant[], graine = 1): EtatCombat => creerCombat(ARENE, cs.map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), graine, { elan: false });

/** La fréquence réelle (sur `n` jets) d'un événement : l'estimation doit en être proche. */
function frequence(n: number, fait: () => boolean): number {
  let c = 0;
  for (let i = 0; i < n; i++) if (fait()) c++;
  return c / n;
}

describe('moyenneDes', () => {
  it('moyenne des expressions de dés', () => {
    expect(moyenneDes('2d6+3')).toBe(10);
    expect(moyenneDes('1d8')).toBe(4.5);
    expect(moyenneDes('4')).toBe(4);
    expect(moyenneDes('1d4-1')).toBe(1.5);
    expect(moyenneDes('n’importe quoi')).toBe(0);
  });
});

describe('probabiliteToucher', () => {
  const bran = () => hero('Bran', 1, 2);
  const gob = () => monstre('combattant-gobelin', 3, 2, 'gob');

  it('colle à la fréquence réelle des jets, sans avantage ni désavantage', () => {
    const etat = combat([bran(), gob()]);
    const [a, c] = [combattant(etat, 'bran'), combattant(etat, 'gob')];
    const p = probabiliteToucher(etat, a, c, 5, 'corps-a-corps');
    expect(p.avantage || p.desavantage).toBe(false);
    const reel = frequence(6000, () => jetAttaque(etat, a, c, 5, 'corps-a-corps').touche);
    expect(Math.abs(p.touche - reel)).toBeLessThan(0.03);
  });

  it('avantage : 1 − (1 − p)² ; désavantage : p² ; les deux s’annulent', () => {
    const etat = combat([bran(), gob()]);
    const [a, c] = [combattant(etat, 'bran'), combattant(etat, 'gob')];
    const base = probabiliteToucher(etat, a, c, 5, 'corps-a-corps').touche;
    ajouterEtat(etat, c, { etat: 'paralyse', source: 'bran' });
    const avec = probabiliteToucher(etat, a, c, 5, 'corps-a-corps');
    expect(avec.avantage).toBe(true);
    expect(avec.touche).toBeCloseTo(1 - (1 - base) ** 2, 5);
    expect(Math.abs(avec.touche - frequence(6000, () => jetAttaque(etat, a, c, 5, 'corps-a-corps').touche))).toBeLessThan(0.03);
    ajouterEtat(etat, a, { etat: 'empoisonne', source: 'gob' });
    const les2 = probabiliteToucher(etat, a, c, 5, 'corps-a-corps');
    expect(les2.avantage || les2.desavantage).toBe(false);
    expect(les2.touche).toBeCloseTo(base, 5);
  });

  it('un 1 naturel rate toujours (95 % au mieux) et un 20 touche toujours (5 % au pire)', () => {
    const etat = combat([bran(), gob()]);
    const [a, c] = [combattant(etat, 'bran'), combattant(etat, 'gob')];
    expect(probabiliteToucher(etat, a, c, 40, 'corps-a-corps').touche).toBeCloseTo(0.95, 5);
    expect(probabiliteToucher(etat, a, c, -40, 'corps-a-corps').touche).toBeCloseTo(0.05, 5);
  });
});

describe('les cartes portent leurs chiffres', () => {
  it('une attaque d’arme : bonus, dégâts, mode ; la description reste la phrase', () => {
    const etat = combat([hero('Bran', 1, 2), monstre('combattant-gobelin', 2, 2, 'gob')]);
    const cartes = cartesDisponibles(etat, ctx, 'bran');
    const attaque = cartes.find((k) => k.id.startsWith('attaque:') && k.stats?.mode === 'corps-a-corps')!;
    expect(attaque.stats!.attaque).toBeGreaterThan(0);
    expect(attaque.stats!.degats!.length).toBeGreaterThan(0);
    expect(attaque.stats!.degats![0]!.des).toMatch(/^\d+d\d+$/);
    expect(attaque.description).toContain(`+${attaque.stats!.attaque}`);
  });

  it('apercuCarte : chances de toucher et dégâts moyens d’une attaque sur une cible', () => {
    const etat = combat([hero('Bran', 1, 2), monstre('combattant-gobelin', 2, 2, 'gob')]);
    const attaque = cartesDisponibles(etat, ctx, 'bran').find((k) => k.id.startsWith('attaque:') && k.jouable)!;
    const ap = apercuCarte(etat, 'bran', attaque, 'gob')!;
    expect(ap.pourcentToucher).toBeGreaterThanOrEqual(5);
    expect(ap.pourcentToucher).toBeLessThanOrEqual(95);
    const attendu = attaque.stats!.degats!.reduce((t, d) => t + moyenneDes(d.des) + d.bonus, 0);
    expect(ap.degatsMoyens).toBeCloseTo(attendu, 1);
  });

  it('apercuCarte : chances d’échec de la sauvegarde d’une cible, comparées à de vrais jets', () => {
    const lanceurs = ['Ambrine', 'Hilda', 'Sylvaine'];
    let trouve: { k: Carte; qui: string } | undefined;
    for (const nom of lanceurs) {
      const etat = combat([hero(nom, 1, 2), monstre('combattant-gobelin', 2, 2, 'gob')]);
      const k = cartesDisponibles(etat, ctx, nom.toLowerCase()).find((x) => x.stats?.sauvegarde && x.jouable);
      if (k) {
        trouve = { k, qui: nom.toLowerCase() };
        break;
      }
    }
    expect(trouve, 'un sort à sauvegarde parmi les héros pré-tirés').toBeDefined();
    const etat = combat([hero(trouve!.qui[0]!.toUpperCase() + trouve!.qui.slice(1), 1, 2), monstre('combattant-gobelin', 2, 2, 'gob')], 7);
    const k = cartesDisponibles(etat, ctx, trouve!.qui).find((x) => x.id === trouve!.k.id)!;
    const ap = apercuCarte(etat, trouve!.qui, k, 'gob')!;
    const { caracteristique, dd } = k.stats!.sauvegarde!;
    const reel = frequence(6000, () => !sauvegarde(etat, combattant(etat, 'gob'), caracteristique, dd));
    expect(ap.pourcentEchec).toBeDefined();
    expect(Math.abs(ap.pourcentEchec! / 100 - reel)).toBeLessThan(0.03);
    expect(ap.dd).toBe(dd);
  });

  it('rien à comparer pour une carte sans chiffres', () => {
    const etat = combat([hero('Bran', 1, 2), monstre('combattant-gobelin', 2, 2, 'gob')]);
    const base = cartesDisponibles(etat, ctx, 'bran').find((k) => k.categorie === 'base' && !k.stats)!;
    expect(apercuCarte(etat, 'bran', base, 'gob')).toBeUndefined();
  });
});
