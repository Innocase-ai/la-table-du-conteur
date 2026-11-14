// Lutte et Bousculade (coup à mains nues, SRD 5.2.1) : cartes de base des héros, à la place d'une attaque (14/11/2026).
import { describe, expect, it } from 'vitest';
import { cartesDisponibles, executer } from '../src/combat/cartes';
import { heroDepuisFiche, monstreDepuisProfil } from '../src/combat/creation';
import { aEtat, combattant, type Combattant, type EtatCombat } from '../src/combat/etat';
import { grilleDepuisTexte } from '../src/combat/grille';
import { creerCombat, situationAttaque, vitesse } from '../src/combat/moteur';
import { HEROS_PRE_TIRES } from '../src/combat/prototype';
import { chargerDonneesSrd } from '../src/donnees-node';
import { calculerFiche } from '../src/fiche';

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };
const ARENE = grilleDepuisTexte(Array.from({ length: 5 }, () => '..............'));

function hero(nom: string, x: number, y: number): Combattant {
  const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === nom)!;
  const r = calculerFiche(h.choix, donnees);
  if (!r.ok) throw new Error(r.erreurs.join());
  return heroDepuisFiche(r.fiche, h.kit, donnees, { x, y });
}
const monstre = (profil: string, id: string, x: number, y: number): Combattant => monstreDepuisProfil(donnees.monstres.get(profil)!, id, { x, y });
function combat(combattants: Combattant[], des: number[] = []): EtatCombat {
  const etat = creerCombat(ARENE, combattants.map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), 1, { elan: false });
  etat.desImposes = [...des];
  return etat;
}
const carte = (etat: EtatCombat, id: string, k: string) => cartesDisponibles(etat, ctx, id).find((x) => x.id === k);
const jouer = (etat: EtatCombat, k: string, cible: string) => executer(etat, ctx, { type: 'jouer', carte: k, cibles: [cible] });

describe('Lutte et Bousculade : les cartes', () => {
  it('un héros les a, au contact d’un adversaire ; elles coûtent l’action', () => {
    const etat = combat([hero('Bran', 1, 2), monstre('combattant-gobelin', 'g1', 2, 2)]);
    for (const k of ['base:lutter', 'base:renverser', 'base:repousser']) expect(carte(etat, 'bran', k), k).toMatchObject({ jouable: true, cout: 'action', cibles: ['g1'] });
  });

  it('hors de portée : refusées, « Aucune cible à portée »', () => {
    const etat = combat([hero('Bran', 1, 2), monstre('combattant-gobelin', 'g1', 4, 2)]);
    expect(carte(etat, 'bran', 'base:lutter')).toMatchObject({ jouable: false, raison: 'Aucune cible à portée.' });
  });

  it('une créature G est à portée (une taille de plus), pas une TG', () => {
    const etat = combat([hero('Bran', 1, 2), monstre('ogre', 'ogre', 2, 2), monstre('ankylosaure', 'gros', 2, 3)]);
    expect(carte(etat, 'bran', 'base:lutter')!.cibles).toEqual(['ogre']);
  });

  it('les monstres n’ont pas ces cartes (leurs actions sont dans leur profil)', () => {
    const etat = combat([monstre('combattant-gobelin', 'g1', 1, 2), hero('Bran', 2, 2)]);
    expect(carte(etat, 'g1', 'base:lutter')).toBeUndefined();
    expect(carte(etat, 'g1', 'base:repousser')).toBeUndefined();
  });

  it('une carte inutile est écartée : pas de Lutte sur qui est déjà empoigné par soi, pas de renversement sur qui est à terre', () => {
    const etat = combat([hero('Bran', 1, 2), monstre('combattant-gobelin', 'g1', 2, 2)], [1]);
    jouer(etat, 'base:lutter', 'g1');
    expect(carte(etat, 'bran', 'base:lutter')!.cibles).toEqual([]);
    const e2 = combat([hero('Bran', 1, 2), monstre('combattant-gobelin', 'g1', 2, 2)], [1]);
    jouer(e2, 'base:renverser', 'g1');
    expect(carte(e2, 'bran', 'base:renverser')!.cibles).toEqual([]);
  });
});

describe('Lutte et Bousculade : les effets', () => {
  it('Lutte réussie (sauvegarde ratée) : empoigné, Vitesse 0, DD d’évasion 8 + Force + maîtrise', () => {
    const etat = combat([hero('Bran', 1, 2), monstre('combattant-gobelin', 'g1', 2, 2)], [1]);
    const bran = combattant(etat, 'bran');
    const g = combattant(etat, 'g1');
    expect(jouer(etat, 'base:lutter', 'g1').ok).toBe(true);
    expect(aEtat(g, 'empoigne')).toBe(true);
    expect(g.etats.find((e) => e.etat === 'empoigne')).toMatchObject({ source: 'bran', evasion: 8 + bran.mods.for + bran.bonusMaitrise });
    expect(vitesse(g)).toBe(0);
    expect(bran.tour.action).toBe(false);
  });

  it('sauvegarde réussie (la cible choisit sa meilleure caractéristique) : rien ne change, l’action est quand même dépensée', () => {
    const etat = combat([hero('Bran', 1, 2), monstre('combattant-gobelin', 'g1', 2, 2)], [20]);
    jouer(etat, 'base:lutter', 'g1');
    expect(aEtat(combattant(etat, 'g1'), 'empoigne')).toBe(false);
    expect(combattant(etat, 'bran').tour.action).toBe(false);
    expect(etat.journal.some((e) => /sauvegarde réussie \(Dextérité/.test(e.texte))).toBe(true);
  });

  it('un empoigné attaque avec Désavantage tout autre que celui qui le tient', () => {
    const etat = combat([hero('Bran', 1, 2), hero('Pip', 2, 3), monstre('combattant-gobelin', 'g1', 2, 2)], [1]);
    jouer(etat, 'base:lutter', 'g1');
    const g = combattant(etat, 'g1');
    expect(situationAttaque(etat, g, combattant(etat, 'pip'), 'corps-a-corps').desavantage).toBe(true);
    expect(situationAttaque(etat, g, combattant(etat, 'bran'), 'corps-a-corps').desavantage).toBe(false);
  });

  it('l’empoigné peut s’échapper : la carte S’échapper existe, au DD de la prise', () => {
    const etat = combat([hero('Bran', 1, 2), monstre('combattant-gobelin', 'g1', 2, 2)], [1]);
    jouer(etat, 'base:lutter', 'g1');
    const dd = combattant(etat, 'g1').etats.find((e) => e.etat === 'empoigne')!.evasion;
    expect(carte({ ...etat, ordre: etat.ordre, actif: 1 }, 'g1', 'base:echapper')?.description).toContain(`DD ${dd}`);
  });

  it('Jeter à terre : la cible tombe', () => {
    const etat = combat([hero('Bran', 1, 2), monstre('combattant-gobelin', 'g1', 2, 2)], [1]);
    jouer(etat, 'base:renverser', 'g1');
    expect(aEtat(combattant(etat, 'g1'), 'a-terre')).toBe(true);
  });

  it('Repousser : la cible recule d’une case, loin du héros, sans attaque d’opportunité', () => {
    const etat = combat([hero('Bran', 1, 2), monstre('combattant-gobelin', 'g1', 2, 2)], [1]);
    jouer(etat, 'base:repousser', 'g1');
    expect(combattant(etat, 'g1').position).toEqual({ x: 3, y: 2 });
    expect(etat.journal.some((e) => /opportunité/.test(e.texte))).toBe(false);
  });

  it('Repousser contre un mur : la cible reste en place', () => {
    const etat = combat([hero('Bran', 12, 2), monstre('combattant-gobelin', 'g1', 13, 2)], [1]);
    jouer(etat, 'base:repousser', 'g1');
    expect(combattant(etat, 'g1').position).toEqual({ x: 13, y: 2 });
  });
});

describe('Lutte et Bousculade : une attaque de l’action Attaque', () => {
  it('avec Attaque supplémentaire, la première dépense l’action et il reste une attaque (arme comprise)', () => {
    const etat = combat([hero('Bran', 1, 2), monstre('combattant-gobelin', 'g1', 2, 2)], [1]);
    const bran = combattant(etat, 'bran');
    bran.ressources.attaquesParAction = 2;
    jouer(etat, 'base:renverser', 'g1');
    expect(bran.tour.action).toBe(false);
    expect(bran.tour.attaquesRestantes).toBe(1);
    expect(bran.tour.attaqueEntreprise).toBe(true);
    const arme = cartesDisponibles(etat, ctx, 'bran').find((k) => k.categorie === 'attaque' && k.jouable);
    expect(arme).toBeDefined();
    // La seconde attaque est une Lutte : plus d'attaque ensuite.
    expect(jouer(etat, 'base:lutter', 'g1').ok).toBe(true);
    expect(bran.tour.attaquesRestantes).toBe(0);
    expect(carte(etat, 'bran', 'base:repousser')).toMatchObject({ jouable: false, raison: 'Action déjà utilisée.' });
  });

  it('après une attaque d’arme, l’action est dépensée : plus de Lutte sans attaque supplémentaire', () => {
    const etat = combat([hero('Bran', 1, 2), monstre('combattant-gobelin', 'g1', 2, 2)], [15, 3, 1]);
    const arme = cartesDisponibles(etat, ctx, 'bran').find((k) => k.categorie === 'attaque' && k.jouable)!;
    expect(executer(etat, ctx, { type: 'jouer', carte: arme.id, cibles: ['g1'] }).ok).toBe(true);
    expect(carte(etat, 'bran', 'base:lutter')).toMatchObject({ jouable: false });
  });
});

describe('Lutte et Bousculade : l’IA ne les joue pas', () => {
  it('Héros auto n’emploie jamais ces cartes, même au contact', async () => {
    const { jouerTourIA, IA_RAPIDE } = await import('../src/combat/ia');
    const etat = combat([hero('Bran', 1, 2), hero('Hilda', 1, 3), monstre('ogre', 'ogre', 2, 2), monstre('combattant-gobelin', 'g1', 2, 3)]);
    for (let i = 0; i < 40 && !etat.vainqueur; i++) jouerTourIA(etat, ctx, IA_RAPIDE);
    expect(etat.journal.some((e) => /tente de (empoigner|jeter à terre|repousser)/.test(e.texte))).toBe(false);
  });
});
