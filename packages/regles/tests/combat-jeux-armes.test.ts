// Les deux jeux d'armes en combat (carte « Changer d'armes ») et l'attaque de la main gauche (propriété Légère, botte Coup double),
// du personnage d'une histoire jusqu'au combat, et le jeu en main qui revient à l'histoire après.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, equipementDe, groupeConseille, heroCombatDe, MODULES_STANDARD, personnageDepuisFiche, type Partie } from '../src';
import { cartesDisponibles, executer } from '../src/combat/cartes';
import { heroDepuisFiche, monstreDepuisProfil, type Kit } from '../src/combat/creation';
import { combattant, type Combattant, type EtatCombat } from '../src/combat/etat';
import { grilleDepuisTexte } from '../src/combat/grille';
import { jouerTourSimple } from '../src/combat/ia';
import { creerCombat, finTour } from '../src/combat/moteur';
import { HEROS_PRE_TIRES } from '../src/combat/prototype';
import { chargerDonneesSrd } from '../src/donnees-node';
import { calculerFiche } from '../src/fiche';
import { chargerMonde } from '../src/monde/chargeur';
import { MONDES_ESSAI } from './mondes-essai';

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };

function fiche(nom: string) {
  const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === nom)!;
  const r = calculerFiche(h.choix, donnees);
  if (!r.ok) throw new Error(r.erreurs.join());
  return r.fiche;
}
const hero = (nom: string, kit: Kit, x: number, y: number): Combattant => heroDepuisFiche(fiche(nom), kit, donnees, { x, y });
const gobelin = (x: number, y: number, id = 'gob') => monstreDepuisProfil(donnees.monstres.get('combattant-gobelin')!, id, { x, y });
const ARENE = grilleDepuisTexte(Array.from({ length: 5 }, () => '..............'));

function combat(combattants: Combattant[], des: number[] = []): EtatCombat {
  const etat = creerCombat(ARENE, combattants.map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), 1, { elan: false });
  etat.desImposes = [...des];
  return etat;
}
const carte = (etat: EtatCombat, id: string, nom: string) => cartesDisponibles(etat, ctx, id).find((k) => k.id === nom);

describe('changer de jeu d’armes en combat', () => {
  const kitBran: Kit = { armes: [{ id: 'epee-a-deux-mains' }], autreJeu: { armes: [{ id: 'javeline' }], ca: 15 }, jeu: 1 };

  it('la carte est gratuite, prend l’autre jeu en main (attaques et CA), une fois par tour', () => {
    const etat = combat([hero('Bran', kitBran, 1, 1), gobelin(8, 1)]);
    const bran = combattant(etat, 'bran');
    const ca = bran.caBase;
    expect(bran.ressources.jeuArmes).toBe(1);
    const k = carte(etat, 'bran', 'base:changer-armes')!;
    expect(k).toMatchObject({ jouable: true, cout: 'gratuit', image: 'javeline' });
    expect(k.description).toMatch(/Javeline/);
    expect(bran.attaques.map((a) => a.id)).toEqual(['epee-a-deux-mains']);
    expect(executer(etat, ctx, { type: 'jouer', carte: 'base:changer-armes' }).ok).toBe(true);
    expect(bran.attaques.map((a) => a.id)).toEqual(['javeline', 'javeline-lancer']);
    expect(bran.caBase).toBe(15);
    expect(bran.ressources.jeuArmes).toBe(2);
    expect(bran.tour.action).toBe(true);
    expect(bran.tour.bonus).toBe(true);
    // Une fois par tour ; l'autre jeu (l'épée) est prêt à revenir, avec l'ancienne CA.
    expect(carte(etat, 'bran', 'base:changer-armes')).toMatchObject({ jouable: false, raison: 'Une fois par tour.' });
    expect(bran.autreJeu).toMatchObject({ caBase: ca });
    expect(bran.autreJeu!.nom).toMatch(/Épée à deux mains/);
    // La javeline lancée atteint le gobelin à 10,5 m.
    expect(carte(etat, 'bran', 'attaque:javeline-lancer')!.jouable).toBe(true);
  });

  it('sans autre jeu garni, pas de carte', () => {
    const etat = combat([hero('Bran', { armes: [{ id: 'epee-a-deux-mains' }] }, 1, 1), gobelin(8, 1)]);
    expect(carte(etat, 'bran', 'base:changer-armes')).toBeUndefined();
  });

  it('l’IA simple change d’armes quand rien n’est à portée avec son jeu mais l’est avec l’autre', () => {
    const etat = combat([hero('Bran', kitBran, 1, 1), gobelin(12, 1)]);
    jouerTourSimple(etat, ctx);
    expect(etat.journal.some((e) => /prend en main Javeline/.test(e.texte))).toBe(true);
    expect(etat.journal.some((e) => e.type === 'attaque' && /Javeline \(lancer\)/.test(e.texte))).toBe(true);
  });

  it('au contact, l’IA garde l’arme à deux mains', () => {
    const etat = combat([hero('Bran', kitBran, 1, 1), gobelin(2, 1)]);
    jouerTourSimple(etat, ctx);
    expect(etat.journal.some((e) => /prend en main/.test(e.texte))).toBe(false);
  });
});

describe('attaque de la main gauche', () => {
  const kitPip = (botte: boolean): Kit => ({ armes: [{ id: 'dague' }, { id: 'dague', main: 'gauche', botte }] });

  it('après l’attaque Légère de la main droite, en action bonus, sans le modificateur aux dégâts', () => {
    const etat = combat([hero('Pip', kitPip(false), 1, 1), gobelin(2, 1)], [15, 3, 15, 3]);
    const pip = combattant(etat, 'pip');
    const gauche = pip.attaques.find((a) => a.main === 'gauche' && a.mode === 'corps-a-corps')!;
    expect(gauche.id).toBe('dague-2');
    const k0 = carte(etat, 'pip', `gauche:${gauche.id}`)!;
    expect(k0).toMatchObject({ jouable: false, cout: 'bonus' });
    expect(k0.raison).toMatch(/d’abord/);
    // La carte montre des dégâts sans le modificateur de Dextérité.
    expect(k0.stats!.degats![0]!.bonus).toBe(gauche.degats[0]!.bonus - pip.mods.dex);
    expect(executer(etat, ctx, { type: 'jouer', carte: 'attaque:dague', cibles: ['gob'] }).ok).toBe(true);
    expect(pip.tour.attaqueLegere).toBe(true);
    expect(carte(etat, 'pip', `gauche:${gauche.id}`)!.jouable).toBe(true);
    expect(executer(etat, ctx, { type: 'jouer', carte: `gauche:${gauche.id}`, cibles: ['gob'] }).ok).toBe(true);
    expect(pip.tour.bonus).toBe(false);
    expect(etat.journal.some((e) => e.type === 'attaque' && /main gauche/.test(e.texte))).toBe(true);
    expect(carte(etat, 'pip', `gauche:${gauche.id}`)).toMatchObject({ jouable: false, raison: 'Une fois par tour.' });
    // Au tour suivant, tout est à refaire.
    finTour(etat);
    finTour(etat);
    expect(combattant(etat, 'pip').tour.attaqueLegere).toBeFalsy();
  });

  it('avec la botte Coup double, elle fait partie de l’action Attaque : l’action bonus reste libre', () => {
    const etat = combat([hero('Pip', kitPip(true), 1, 1), gobelin(2, 1)], [15, 3, 15, 3]);
    const pip = combattant(etat, 'pip');
    executer(etat, ctx, { type: 'jouer', carte: 'attaque:dague', cibles: ['gob'] });
    const k = carte(etat, 'pip', 'gauche:dague-2')!;
    expect(k).toMatchObject({ jouable: true, cout: 'gratuit' });
    executer(etat, ctx, { type: 'jouer', carte: 'gauche:dague-2', cibles: ['gob'] });
    expect(pip.tour.bonus).toBe(true);
  });

  it('une arme qui n’est pas Légère à droite n’ouvre pas la main gauche', () => {
    const etat = combat([hero('Pip', { armes: [{ id: 'rapiere' }, { id: 'dague', main: 'gauche' }] }, 1, 1), gobelin(2, 1)], [15, 3]);
    executer(etat, ctx, { type: 'jouer', carte: 'attaque:rapiere', cibles: ['gob'] });
    expect(carte(etat, 'pip', 'gauche:dague')!.jouable).toBe(false);
  });
});

describe('du personnage d’une histoire au combat, et retour', () => {
  const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  const moteur = creerMoteur({ dm: r.monde, srd: donnees }, MODULES_STANDARD);
  const depart = (): Partie => {
    const groupe = groupeConseille(3, donnees).emplacements.map((p) => {
      const f = bilanPersonnage(p!, donnees).fiche!;
      return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
    });
    return moteur.nouvellePartie(groupe, { graine: 2, niveau: 3 });
  };

  it('deux dagues équipées : la seconde est tenue de la main gauche ; l’autre jeu passe au combat avec sa CA', () => {
    let p = depart();
    p.etat.inventaire['dague'] = 2;
    p.etat.inventaire['bouclier'] = 1;
    p.etat.inventaire['arc-court'] = 1;
    for (const [objet, emplacement] of [['dague', 'j1.droite'], ['dague', 'j1.gauche'], ['arc-court', 'j2.droite']] as const) {
      const res = moteur.executer(p, { type: 'equiper', objet, personnage: 'pip', emplacement });
      expect(res.refus, `${objet} → ${emplacement}`).toBeUndefined();
      p = res.partie;
    }
    const pip = p.groupe.find((h) => h.id === 'pip')!;
    const hc = heroCombatDe(pip);
    expect(hc.kit.armes).toEqual([expect.objectContaining({ id: 'dague' }), expect.objectContaining({ id: 'dague', main: 'gauche' })]);
    expect(hc.kit.autreJeu?.armes.map((a) => a.id)).toEqual(['arc-court']);
    expect(hc.kit.jeu).toBe(1);
    const c = heroDepuisFiche(hc.fiche, hc.kit, donnees, { x: 0, y: 0 }, 'pip');
    expect(c.attaques.some((a) => a.main === 'gauche')).toBe(true);
    expect(c.autreJeu?.attaques.map((a) => a.id)).toEqual(['arc-court']);
    expect(c.ressources.jeuArmes).toBe(1);
  });

  it('le jeu pris en main pendant le combat reste en main après', () => {
    const p = depart();
    const bran = p.groupe.find((h) => h.id === 'bran')!;
    expect(equipementDe(bran).jeuActif).toBe(1);
    p.scene = { type: 'rencontre', rencontre: 'pdf-controle-de-la-porte' };
    const res = moteur.executer(p, { type: 'reglerRencontre', issue: 'fuite', heros: { bran: { pv: bran.pv, ressources: { ...bran.ressources, jeuArmes: 2 } } } });
    expect(res.refus).toBeUndefined();
    const apres = res.partie.groupe.find((h) => h.id === 'bran')!;
    expect(equipementDe(apres).jeuActif).toBe(2);
    expect(apres.ressources.jeuArmes).toBeUndefined();
    expect(apres.fiche.equipement?.jeu).toBe(2);
  });
});

describe('une partie sauvegardée avant les deux jeux en combat', () => {
  it('retrouve l’autre jeu d’armes dans la fiche au chargement', () => {
    const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
    if (!r.ok) throw new Error('monde');
    const moteur = creerMoteur({ dm: r.monde, srd: donnees }, MODULES_STANDARD);
    const groupe = groupeConseille(3, donnees).emplacements.map((p) => {
      const f = bilanPersonnage(p!, donnees).fiche!;
      return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
    });
    const p = moteur.nouvellePartie(groupe, { graine: 2, niveau: 3 });
    const bran = p.groupe.find((h) => h.id === 'bran')!;
    expect(bran.fiche.equipement?.autreJeu).toBeDefined();
    // La fiche d'une sauvegarde plus ancienne n'a pas l'autre jeu : le chargement le recalcule.
    for (const h of p.groupe) delete h.fiche.equipement!.autreJeu;
    const relue = moteur.charger(JSON.stringify(p));
    expect(relue.groupe.find((h) => h.id === 'bran')!.fiche.equipement?.autreJeu).toBeDefined();
    expect(relue.groupe.map((h) => h.fiche.vitesse)).toEqual(p.groupe.map((h) => h.fiche.vitesse));
  });
});
