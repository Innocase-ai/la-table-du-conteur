// Actions du SRD 5.2.1 ajoutées au combat le 14/11/2026 : Aider (attaque d'un allié, stabiliser) et la surprise à l'Initiative.
import { describe, expect, it } from 'vitest';
import { cartesDisponibles, executer } from '../src/combat/cartes';
import { heroDepuisFiche, monstreDepuisProfil } from '../src/combat/creation';
import { aEtat, combattant, type Combattant, type EtatCombat } from '../src/combat/etat';
import { grilleDepuisTexte } from '../src/combat/grille';
import { creerCombat, finTour, infligerDegats, jetAttaque } from '../src/combat/moteur';
import { HEROS_PRE_TIRES } from '../src/combat/prototype';
import { chargerDonneesSrd } from '../src/donnees-node';
import { calculerFiche } from '../src/fiche';
import { RencontreMonde } from '../src/monde/schemas';

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };
const ARENE = grilleDepuisTexte(Array.from({ length: 5 }, () => '..............'));

function hero(nom: string, x: number, y: number): Combattant {
  const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === nom)!;
  const r = calculerFiche(h.choix, donnees);
  if (!r.ok) throw new Error(r.erreurs.join());
  return heroDepuisFiche(r.fiche, h.kit, donnees, { x, y });
}
const gobelin = (id: string, x: number, y: number): Combattant => monstreDepuisProfil(donnees.monstres.get('combattant-gobelin')!, id, { x, y });
function combat(combattants: Combattant[], des: number[] = []): EtatCombat {
  const etat = creerCombat(ARENE, combattants.map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), 1, { elan: false });
  etat.desImposes = [...des];
  return etat;
}
const carte = (etat: EtatCombat, id: string, k: string) => cartesDisponibles(etat, ctx, id).find((x) => x.id === k);

describe('Aider : faciliter l’attaque d’un allié', () => {
  // Pip (qui aide) au contact du gobelin, Bran (qui attaquera) un peu plus loin.
  const scene = (des: number[] = []) => combat([hero('Pip', 1, 2), hero('Bran', 1, 4), gobelin('g1', 2, 2), gobelin('loin', 9, 2)], des);

  it('la carte cible un adversaire à 1,5 m, coûte l’action, et n’existe pas pour un héros seul', () => {
    const etat = scene();
    expect(carte(etat, 'pip', 'base:aider')).toMatchObject({ jouable: true, cout: 'action', cibles: ['g1'] });
    expect(carte(combat([hero('Pip', 1, 2), gobelin('g1', 2, 2)]), 'pip', 'base:aider')).toBeUndefined();
  });

  it('la prochaine attaque contre lui a l’Avantage, une seule fois', () => {
    const etat = scene([12, 17, 3, 5, 12, 5, 8]);
    expect(executer(etat, ctx, { type: 'jouer', carte: 'base:aider', cibles: ['g1'] }).ok).toBe(true);
    expect(combattant(etat, 'pip').tour.action).toBe(false);
    const bran = combattant(etat, 'bran');
    const g1 = combattant(etat, 'g1');
    expect(jetAttaque(etat, bran, g1, 5, 'corps-a-corps').avantage).toBe(true);
    // Consommé par cette attaque.
    expect(g1.modificateurs.some((m) => m.id === 'aide-attaque')).toBe(false);
    expect(jetAttaque(etat, bran, g1, 5, 'corps-a-corps').avantage).toBe(false);
  });

  it('l’aide prend fin au début du prochain tour de qui aide, et ne s’empile pas', () => {
    const etat = scene();
    executer(etat, ctx, { type: 'jouer', carte: 'base:aider', cibles: ['g1'] });
    // Il n'y a plus rien à aider tant que l'aide dure.
    expect(carte(etat, 'pip', 'base:aider')).toMatchObject({ jouable: false });
    const g1 = combattant(etat, 'g1');
    expect(g1.modificateurs.some((m) => m.id === 'aide-attaque')).toBe(true);
    for (let i = 0; i < 4; i++) finTour(etat); // tout le monde joue, retour à Pip
    expect(combattant(etat, 'g1').modificateurs.some((m) => m.id === 'aide-attaque')).toBe(false);
  });
});

describe('Stabiliser un allié tombé (Sagesse (Médecine) DD 10)', () => {
  const scene = (des: number[]) => {
    const etat = combat([hero('Hilda', 1, 2), hero('Bran', 2, 2), gobelin('g1', 12, 2)], des);
    const bran = combattant(etat, 'bran');
    infligerDegats(etat, bran, [{ montant: bran.pvMax, type: 'contondant' }], combattant(etat, 'g1'));
    expect(bran.pv).toBe(0);
    return etat;
  };

  it('la carte ne cible qu’un allié à 0 PV au contact, ni mort ni déjà stabilisé', () => {
    const etat = scene([]);
    expect(carte(etat, 'hilda', 'base:stabiliser')).toMatchObject({ jouable: true, cout: 'action', cibles: ['bran'] });
    combattant(etat, 'bran').stable = true;
    expect(carte(etat, 'hilda', 'base:stabiliser')).toBeUndefined();
    const plein = combat([hero('Hilda', 1, 2), hero('Bran', 2, 2), gobelin('g1', 12, 2)]);
    expect(carte(plein, 'hilda', 'base:stabiliser')).toBeUndefined();
  });

  it('réussi : il est stabilisé et ses jets contre la mort repartent de zéro', () => {
    const etat = scene([20]);
    const bran = combattant(etat, 'bran');
    bran.jetsMort = { succes: 1, echecs: 2 };
    expect(executer(etat, ctx, { type: 'jouer', carte: 'base:stabiliser', cibles: ['bran'] }).ok).toBe(true);
    expect(bran.stable).toBe(true);
    expect(bran.jetsMort).toEqual({ succes: 0, echecs: 0 });
    expect(bran.pv).toBe(0);
    expect(aEtat(bran, 'inconscient')).toBe(true);
  });

  it('raté : rien ne change, l’action est dépensée', () => {
    const etat = scene([1]);
    const hilda = combattant(etat, 'hilda');
    // Un 1 plus le bonus de Médecine de Hilda reste sous 10 tant que ce bonus est inférieur à 9.
    expect(hilda.competences!.medecine!).toBeLessThan(9);
    executer(etat, ctx, { type: 'jouer', carte: 'base:stabiliser', cibles: ['bran'] });
    expect(combattant(etat, 'bran').stable).toBe(false);
    expect(hilda.tour.action).toBe(false);
  });

  it('un stabilisé ne fait plus de jet contre la mort à son tour', () => {
    const etat = scene([20]);
    executer(etat, ctx, { type: 'jouer', carte: 'base:stabiliser', cibles: ['bran'] });
    for (let i = 0; i < 3; i++) finTour(etat);
    const bran = combattant(etat, 'bran');
    expect(bran.jetsMort).toEqual({ succes: 0, echecs: 0 });
    expect(bran.mort).toBe(false);
  });
});

describe('surprise : Désavantage au jet d’Initiative du camp surpris (SRD 5.2.1)', () => {
  const groupe = () => [hero('Bran', 1, 2), hero('Pip', 1, 3), gobelin('g1', 8, 2), gobelin('g2', 8, 3)];
  it('le journal dit qui est pris par surprise, et seulement alors', () => {
    const surpris = creerCombat(ARENE, groupe(), 77, { elan: false, surpris: ['heros'] });
    const nu = creerCombat(ARENE, groupe(), 77, { elan: false });
    const ligne = surpris.journal.find((e) => /surprise/i.test(e.texte));
    expect(ligne?.texte).toMatch(/Bran/);
    expect(ligne?.texte).toMatch(/Pip/);
    expect(ligne?.texte).not.toMatch(/gobelin/i);
    expect(nu.journal.some((e) => /surprise/i.test(e.texte))).toBe(false);
  });

  it('à bonus égaux, le camp surpris joue après l’autre bien plus souvent que sans surprise', () => {
    const partMonstresPremiers = (options: { surpris?: ('heros' | 'monstres')[] }) => {
      let premiers = 0;
      for (let graine = 1; graine <= 200; graine++) {
        const etat = creerCombat(ARENE, groupe().map((c) => ({ ...c, bonusInitiative: 0, mods: { ...c.mods, dex: 0 } })), graine, { elan: false, ...options });
        if (combattant(etat, etat.ordre[0]!).camp === 'monstres') premiers++;
      }
      return premiers / 200;
    };
    expect(partMonstresPremiers({})).toBeGreaterThan(0.3);
    expect(partMonstresPremiers({})).toBeLessThan(0.7);
    // Avec le camp des héros surpris : deux d20 gardés le plus bas contre un seul, les monstres ouvrent presque toujours.
    expect(partMonstresPremiers({ surpris: ['heros'] })).toBeGreaterThan(0.7);
    expect(partMonstresPremiers({ surpris: ['monstres'] })).toBeLessThan(0.3);
  });

  it('une rencontre d’histoire peut déclarer qui est surpris ; une valeur inconnue est refusée', () => {
    const base = { id: 'embuscade', nom: 'Embuscade', type: 'combat', difficulte: 'moderee', intro: 'Des gobelins jaillissent du fourré.' };
    expect(RencontreMonde.safeParse({ ...base, surprise: 'heros' }).success).toBe(true);
    expect(RencontreMonde.safeParse(base).success).toBe(true);
    expect(RencontreMonde.safeParse({ ...base, surprise: 'tout-le-monde' }).success).toBe(false);
  });
});
