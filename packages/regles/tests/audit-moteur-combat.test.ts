// Correctifs de combat de l'audit du moteur du 18/11/2026 (docs/AUDIT-MOTEUR.md), rangs 4 et 5 :
// M4 la botte Poussée envoyait la cible hors de la grille ; M5 l'IA modifiait le vrai combattant en simulant une potion.
import { describe, expect, it } from 'vitest';
import {
  attaqueArme,
  calculerFiche,
  cartesDisponibles,
  choisirEtape,
  combattant,
  creerCombat,
  grilleDepuisTexte,
  heroDepuisFiche,
  HEROS_PRE_TIRES,
  IA_NORMALE,
  IA_RAPIDE,
  jouerTourIA,
  monstreDepuisProfil,
  type AttaqueArme,
  type Combattant,
  type EtatCombat,
} from '../src';
import { cloner } from '../src/combat/etat';
import { embarquerDepuis } from '../src/combat/objets';
import { chargerDonneesSrd } from '../src/donnees-node';

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };
const ARENE = grilleDepuisTexte(Array.from({ length: 5 }, () => '..............'));
const bran = (x: number, y: number): Combattant => {
  const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === 'Bran')!;
  const r = calculerFiche(h.choix, donnees);
  if (!r.ok) throw new Error(r.erreurs.join());
  return heroDepuisFiche(r.fiche, h.kit, donnees, { x, y });
};
const gobelin = (id: string, x: number, y: number) => monstreDepuisProfil(donnees.monstres.get('combattant-gobelin')!, id, { x, y });
const combat = (cs: Combattant[], des: number[] = []): EtatCombat => {
  const e = creerCombat(ARENE, cs.map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), 1, { elan: false });
  e.desImposes = [...des];
  return e;
};
// Un marteau qui touche toujours et ne tue pas un gobelin (1d4, dé imposé à 1) : seule la poussée compte.
const marteau: AttaqueArme = { id: 'marteau', nom: 'Marteau', mode: 'corps-a-corps', caracteristique: 'for', bonusAttaque: 50, degats: [{ des: '1d4', bonus: 0, type: 'contondant' }], allonge: 1.5, finesse: false, botte: 'poussee' };

describe('M4 : la botte Poussée reste dans la grille', () => {
  it('poussé contre le bord gauche, le gobelin ne sort pas de la grille et le combat peut finir', () => {
    const etat = combat([bran(1, 2), gobelin('g1', 0, 2)], [15, 1]);
    attaqueArme(etat, combattant(etat, 'bran'), combattant(etat, 'g1'), marteau);
    const g = combattant(etat, 'g1');
    expect(g.pv).toBeGreaterThan(0);
    expect(g.position).toEqual({ x: 0, y: 2 });
    expect(cartesDisponibles(etat, ctx, 'bran').some((k) => k.categorie === 'attaque' && k.cibles.includes('g1'))).toBe(true);
    for (let t = 0; t < 200 && !etat.vainqueur; t++) jouerTourIA(etat, ctx, IA_RAPIDE);
    expect(etat.vainqueur).toBeDefined();
  });

  it('poussé contre le bord droit, il s’arrête sur la dernière case', () => {
    const etat = combat([bran(12, 2), gobelin('g1', 13, 2)], [15, 1]);
    attaqueArme(etat, combattant(etat, 'bran'), combattant(etat, 'g1'), marteau);
    expect(combattant(etat, 'g1').position).toEqual({ x: 13, y: 2 });
  });

  it('en terrain libre, la poussée repousse toujours de 3 m (deux cases), avec la même ligne de journal', () => {
    const etat = combat([bran(4, 2), gobelin('g1', 5, 2)], [15, 1]);
    attaqueArme(etat, combattant(etat, 'bran'), combattant(etat, 'g1'), marteau);
    expect(combattant(etat, 'g1').position).toEqual({ x: 7, y: 2 });
    expect(etat.journal.some((e) => e.texte === `${combattant(etat, 'g1').nom} est repoussé.`)).toBe(true);
  });
});

describe('M5 : simuler un coup ne modifie pas le vrai combattant', () => {
  const potion = 'potion-de-force-de-geant-collines';
  const resume = (c: Combattant) => JSON.stringify({ mods: c.mods, sauvegardes: c.sauvegardes, competences: c.competences, attaques: c.attaques, autre: c.autreJeu?.attaques });

  it('l’IA qui envisage une potion de force de géant ne change ni la Force ni les attaques tant que la potion n’est pas bue', () => {
    const b = bran(1, 2);
    const o = donnees.objets.get(potion)!;
    b.objetsEmbarques = { [potion]: embarquerDepuis(o.nom, o.usage, () => 1) };
    b.ressources[`objet:${potion}`] = 1;
    const etat = combat([b, gobelin('g1', 9, 2)]);
    const h = combattant(etat, 'bran');
    expect(cartesDisponibles(etat, ctx, 'bran').some((k) => k.id === `base:objet-${potion}` && k.jouable)).toBe(true);
    const avant = resume(h);
    choisirEtape(etat, ctx, IA_NORMALE);
    expect(h.ressources[`objet:${potion}`]).toBe(1);
    expect(resume(h)).toBe(avant);
  });

  it('une copie de simulation ne partage ni les caractéristiques, ni les sauvegardes, ni les compétences, ni les attaques', () => {
    const etat = combat([bran(1, 2), gobelin('g1', 9, 2)]);
    const vrai = combattant(etat, 'bran');
    const avant = resume(vrai);
    const copie = cloner(etat).combattants.find((c) => c.id === 'bran')!;
    copie.mods.for += 5;
    copie.sauvegardes.for += 5;
    if (copie.competences) copie.competences['athletisme'] = 99;
    copie.attaques[0]!.bonusAttaque += 5;
    copie.attaques[0]!.degats[0] = { ...copie.attaques[0]!.degats[0]!, bonus: 99 };
    if (copie.autreJeu?.attaques[0]) copie.autreJeu.attaques[0].bonusAttaque += 5;
    expect(resume(vrai)).toBe(avant);
  });
});
