// Sauvegarde du combat d'histoire en cours (version 4 de la partie) : aller-retour en plein combat, migration 3 → 4, effacement
// par la fin de la rencontre (14/11/2026).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { creerMoteur, herosPreTires, MODULES_STANDARD, personnageDepuisFiche, sauvegarderPartie, VERSION_PARTIE, type CombatEnCours, type Partie, type Personnage } from '../src';
import { heroDepuisFiche, monstreDepuisProfil } from '../src/combat/creation';
import { actif, type Combattant, type EtatCombat } from '../src/combat/etat';
import { grilleDepuisTexte } from '../src/combat/grille';
import { IA_RAPIDE, jouerTourIA } from '../src/combat/ia';
import { creerCombat } from '../src/combat/moteur';
import { HEROS_PRE_TIRES, type Rencontre } from '../src/combat/prototype';
import { chargerDonneesSrd } from '../src/donnees-node';
import { calculerFiche } from '../src/fiche';
import { chargerMonde } from '../src/monde/chargeur';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
const ctx = { sorts: srd.sorts };
const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde;
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);

const groupe = (): Personnage[] => herosPreTires(srd).map((h) => personnageDepuisFiche(h.fiche, { id: h.fiche.nom.toLowerCase(), outils: [] }));

const ARENE = ['..............', '..............', '..............', '..............', '..............'];
const RENCONTRE: Rencontre = {
  id: 'essai',
  nom: 'Essai',
  description: 'Une escarmouche d’essai.',
  difficulte: 'moderee',
  terrain: 'foret',
  carte: ARENE,
  monstres: [{ profil: 'combattant-gobelin', nombre: 2 }],
};

function hero(nom: string, x: number, y: number): Combattant {
  const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === nom)!;
  const f = calculerFiche(h.choix, srd);
  if (!f.ok) throw new Error(f.erreurs.join());
  return heroDepuisFiche(f.fiche, h.kit, srd, { x, y });
}
const gob = (id: string, x: number, y: number): Combattant => monstreDepuisProfil(srd.monstres.get('combattant-gobelin')!, id, { x, y });

function nouveauCombat(graine: number): EtatCombat {
  return creerCombat(grilleDepuisTexte(ARENE), [hero('Bran', 1, 1), hero('Hilda', 1, 3), monstreDepuisProfil(srd.monstres.get('ogre')!, 'ogre', { x: 8, y: 2 }), gob('g1', 8, 1), gob('g2', 8, 3)], graine, { elan: false });
}

/** Une partie en scène de rencontre, avec le combat donné en cours. */
function partieEnCombat(etat: EtatCombat): Partie {
  const p = moteur.executer(moteur.nouvellePartie(groupe(), { graine: 7, niveau: 3 }), { type: 'commencer' }).partie;
  const id = [...dm.rencontres.keys()][0]!;
  const combatEnCours: CombatEnCours = { etat: structuredClone(etat), graine: 42, rencontre: RENCONTRE, ia: 'facile' };
  return { ...p, scene: { type: 'rencontre', rencontre: id }, combatEnCours };
}

/** La partie, écrite puis relue comme le fait le client (JSON dans le stockage, `moteur.charger`). */
function allerRetour(p: Partie): Partie {
  let json = '';
  expect(sauvegarderPartie(p, (j) => (json = j))).toBe(true);
  return moteur.charger(json);
}

/** Joue le combat jusqu'au bout (IA des deux camps) ; renvoie ce qui permet de comparer deux déroulements. */
function jouerJusquaLaFin(etat: EtatCombat) {
  for (let i = 0; i < 400 && !etat.vainqueur; i++) jouerTourIA(etat, ctx, IA_RAPIDE);
  return {
    vainqueur: etat.vainqueur,
    round: etat.round,
    rng: etat.rng,
    pv: Object.fromEntries(etat.combattants.map((c) => [c.id, c.pv])),
    journal: etat.journal.map((e) => e.texte),
  };
}

describe('sauvegarde du combat en cours', () => {
  it('la partie est de version 4', () => {
    expect(VERSION_PARTIE).toBe(4);
    expect(moteur.nouvellePartie(groupe(), { graine: 1 }).version).toBe(4);
  });

  it('aller-retour en plein combat : le combat repris se déroule exactement comme celui qu’on a quitté (mêmes dés)', () => {
    const etat = nouveauCombat(99);
    for (let i = 0; i < 4; i++) jouerTourIA(etat, ctx, IA_RAPIDE);
    expect(etat.vainqueur).toBeUndefined();
    const reprise = allerRetour(partieEnCombat(etat)).combatEnCours!;
    expect(reprise.graine).toBe(42);
    expect(reprise.ia).toBe('facile');
    expect(reprise.rencontre.nom).toBe('Essai');
    expect(reprise.etat.rng).toBe(etat.rng);
    expect(reprise.etat.round).toBe(etat.round);
    expect(actif(reprise.etat).id).toBe(actif(etat).id);
    // La suite : l'original et le combat rechargé donnent le même résultat, jet pour jet.
    expect(jouerJusquaLaFin(reprise.etat)).toEqual(jouerJusquaLaFin(etat));
  });

  it('recharger au tout début ne relance pas les dés : le premier tour est le même', () => {
    const etat = nouveauCombat(5);
    const reprise = allerRetour(partieEnCombat(etat)).combatEnCours!.etat;
    expect(jouerJusquaLaFin(reprise)).toEqual(jouerJusquaLaFin(etat));
  });

  it('un combat terminé (vainqueur connu) se sauvegarde aussi : le bilan réapparaît au rechargement', () => {
    const etat = nouveauCombat(3);
    jouerJusquaLaFin(etat);
    const reprise = allerRetour(partieEnCombat(etat)).combatEnCours!.etat;
    expect(reprise.vainqueur).toBe(etat.vainqueur);
  });

  it('migration 3 → 4 : une sauvegarde de version 3 (sans combat) se charge, passe en version 4, sans combat en cours', () => {
    const p = moteur.executer(moteur.nouvellePartie(groupe(), { graine: 7, niveau: 3 }), { type: 'commencer' }).partie;
    const v3 = { ...p, version: 3 };
    const migree = moteur.charger(JSON.stringify(v3));
    expect(migree.version).toBe(4);
    expect(migree.combatEnCours).toBeUndefined();
    expect(migree.etat.lieu).toBe(p.etat.lieu);
  });

  it('une sauvegarde plus récente que le jeu est refusée (version 5)', () => {
    const p = moteur.nouvellePartie(groupe(), { graine: 1 });
    expect(() => moteur.charger(JSON.stringify({ ...p, version: 5 }))).toThrow(/version/);
  });

  it('un combat resté dans une partie qui n’est plus en rencontre est oublié au chargement', () => {
    const p = partieEnCombat(nouveauCombat(1));
    const exploration = { ...p, scene: { type: 'exploration' as const } };
    expect(moteur.charger(JSON.stringify(exploration)).combatEnCours).toBeUndefined();
  });

  it('la fin de la rencontre efface le combat en cours (repli, victoire)', () => {
    for (const issue of ['fuite', 'victoire'] as const) {
      const p = partieEnCombat(nouveauCombat(1));
      expect(p.combatEnCours).toBeDefined();
      const apres = moteur.executer(p, { type: 'reglerRencontre', issue, ...(issue === 'victoire' ? { px: 50 } : {}) });
      expect(apres.refus, issue).toBeUndefined();
      expect(apres.partie.scene.type, issue).toBe('exploration');
      expect(apres.partie.combatEnCours, issue).toBeUndefined();
    }
  });

  it('une action quelconque garde le combat en cours tant que la rencontre n’est pas réglée', () => {
    const p = partieEnCombat(nouveauCombat(1));
    const refus = moteur.executer(p, { type: 'reglerRencontre', issue: 'alternative', alternative: 'inexistante' });
    // Une issue qui échoue laisse la rencontre en place : le combat sauvegardé aussi.
    if (refus.partie.scene.type === 'rencontre') expect(refus.partie.combatEnCours).toBeDefined();
  });
});
