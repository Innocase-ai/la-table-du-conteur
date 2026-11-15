// Audit de la gestion des héros en combat (15/11/2026) : états (inconscient, stable, mort), jets contre la mort, soins d'un allié
// tombé, ordre d'initiative, PV, placement au départ, sauvegarde en plein combat, partage des PX. Complète
// `combat-heros-groupe.test.ts` (la cause du héros qui « disparaît »).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { creerMoteur, MODULES_STANDARD, personnageDepuisFiche, resultatDeCombat, sauvegarderPartie, type Partie } from '../src';
import { heroDepuisFiche, monstreDepuisProfil } from '../src/combat/creation';
import { actif, aEtat, combattant, type Combattant, type EtatCombat } from '../src/combat/etat';
import { grilleDepuisTexte } from '../src/combat/grille';
import { creerCombat, finTour, infligerDegats, soigner } from '../src/combat/moteur';
import { HEROS_PRE_TIRES, preparerRencontre } from '../src/combat/prototype';
import { chargerDonneesSrd } from '../src/donnees-node';
import { calculerFiche } from '../src/fiche';
import { chargerMonde } from '../src/monde/chargeur';
import { MONDES_ESSAI } from './mondes-essai';

const donnees = chargerDonneesSrd();

function ficheDe(nom: string) {
  const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === nom)!;
  const r = calculerFiche(h.choix, donnees);
  if (!r.ok) throw new Error(r.erreurs.join());
  return { fiche: r.fiche, kit: h.kit };
}
const hero = (nom: string, x: number, y: number): Combattant => {
  const { fiche, kit } = ficheDe(nom);
  return heroDepuisFiche(fiche, kit, donnees, { x, y });
};
const gobelin = (id: string, x: number, y: number): Combattant => monstreDepuisProfil(donnees.monstres.get('combattant-gobelin')!, id, { x, y });
const ARENE = grilleDepuisTexte(Array.from({ length: 5 }, () => '..............'));
/** Le premier combattant joue en premier ; `des` : d20 imposés. */
const combat = (combattants: Combattant[], des: number[] = []): EtatCombat => {
  const etat = creerCombat(ARENE, combattants.map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), 1, { elan: false });
  etat.desImposes = [...des];
  return etat;
};
const mettreATerre = (etat: EtatCombat, c: Combattant) => infligerDegats(etat, c, [{ montant: c.pv, type: 'contondant' }], undefined);

describe('états d’un héros à terre (inconscient, stable, mort)', () => {
  it('un héros à 0 PV garde sa place dans l’ordre d’initiative et remonte à 1 PV sur un 20 naturel', () => {
    const etat = combat([gobelin('g1', 9, 4), hero('Bran', 1, 1), hero('Hilda', 2, 1)], [20]);
    const bran = combattant(etat, 'bran');
    mettreATerre(etat, bran);
    const ordre = [...etat.ordre];
    expect(aEtat(bran, 'inconscient')).toBe(true);
    finTour(etat); // fin du tour du gobelin : début de celui de Bran, jet contre la mort (20)
    expect(bran.pv).toBe(1);
    expect(aEtat(bran, 'inconscient')).toBe(false);
    expect(etat.ordre).toEqual(ordre);
  });

  it('trois échecs : mort ; le mort garde sa place mais ne joue plus, et les soins ne le relèvent pas', () => {
    const etat = combat([gobelin('g1', 9, 4), hero('Bran', 1, 1), hero('Hilda', 2, 1)], [2]);
    const bran = combattant(etat, 'bran');
    mettreATerre(etat, bran);
    bran.jetsMort = { succes: 0, echecs: 2 };
    finTour(etat); // jet contre la mort : 2, un échec de plus
    expect(bran.mort).toBe(true);
    expect(etat.ordre).toHaveLength(3);
    expect(soigner(etat, bran, 10)).toBe(0);
    expect(bran.mort).toBe(true);
    expect(bran.pv).toBe(0);
    for (let i = 0; i < 6 && !etat.vainqueur; i++) {
      expect(actif(etat).mort, `tour ${i}`).toBeFalsy();
      finTour(etat);
    }
  });

  it('un soin relève un héros stabilisé à 0 PV : plus inconscient, jets contre la mort remis à zéro', () => {
    const etat = combat([hero('Hilda', 1, 1), hero('Bran', 2, 1), gobelin('g1', 9, 4)]);
    const bran = combattant(etat, 'bran');
    mettreATerre(etat, bran);
    bran.stable = true;
    bran.jetsMort = { succes: 1, echecs: 2 };
    soigner(etat, bran, 5);
    expect(bran.pv).toBe(5);
    expect(bran.stable).toBe(false);
    expect(aEtat(bran, 'inconscient')).toBe(false);
    expect(bran.jetsMort).toEqual({ succes: 0, echecs: 0 });
  });

  it('les soins ne dépassent jamais les PV maximum', () => {
    const etat = combat([hero('Hilda', 1, 1), hero('Bran', 2, 1), gobelin('g1', 9, 4)]);
    const bran = combattant(etat, 'bran');
    bran.pv = bran.pvMax - 1;
    soigner(etat, bran, 1000);
    expect(bran.pv).toBe(bran.pvMax);
  });

  it('un mort et un tombé sont tous deux rendus à 1 PV par la fin de combat (victoire ou défaite)', () => {
    const etat = combat([gobelin('g1', 2, 2), hero('Bran', 1, 1), hero('Hilda', 1, 3)]);
    const bran = combattant(etat, 'bran');
    const hilda = combattant(etat, 'hilda');
    mettreATerre(etat, bran);
    hilda.mort = true;
    hilda.pv = 0;
    for (const vainqueur of ['monstres', 'heros'] as const) {
      const res = resultatDeCombat({ ...etat, vainqueur });
      expect(res.heros.bran!.pv).toBe(1);
      expect(res.heros.hilda!.pv).toBe(1);
    }
  });
});

describe('PV d’un héros qui entre en combat', () => {
  it('au moins 1 PV et au plus ses PV maximum, quel que soit l’état enregistré dans la partie', () => {
    const { fiche, kit } = ficheDe('Bran');
    for (const pv of [0, -3, 9999]) {
      const { combattants } = preparerRencontre(
        { id: 'e', nom: 'E', description: '', difficulte: 'faible', terrain: 'foret', carte: ['H...m'], monstres: [{ profil: 'combattant-gobelin', nombre: 1 }] },
        donnees,
        [{ fiche, kit, etat: { pv, ressources: {}, emplacements: [] } }],
      );
      const bran = combattants[0]!;
      expect(bran.pv, `pv ${pv}`).toBeGreaterThanOrEqual(1);
      expect(bran.pv, `pv ${pv}`).toBeLessThanOrEqual(bran.pvMax);
    }
  });
});

describe('placement des héros au départ', () => {
  // Moins de cases H que de héros : les autres partent du sol libre le plus proche (promesse de la validation des mondes), sans se superposer.
  it('une carte avec moins de cases H que de héros place les autres sur le sol le plus proche, chacun sur sa case', () => {
    const heros = ['Bran', 'Hilda', 'Pip', 'Grukk'].map(ficheDe);
    const { combattants } = preparerRencontre(
      { id: 'e', nom: 'E', description: '', difficulte: 'faible', terrain: 'foret', carte: ['..........', '.HH.....mm', '..........'], monstres: [{ profil: 'combattant-gobelin', nombre: 2 }] },
      donnees,
      heros,
    );
    const h = combattants.filter((c) => c.camp === 'heros');
    expect(h).toHaveLength(4);
    expect(new Set(h.map((c) => c.position.x + ',' + c.position.y)).size).toBe(4);
  });
});

describe('une partie sauvegardée en plein combat, avec un héros mort et un héros à terre', () => {
  const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  const moteur = creerMoteur({ dm: r.monde, srd: donnees }, MODULES_STANDARD);
  const groupe = (taille: number) => ['Bran', 'Hilda', 'Pip', 'Grukk', 'Sylvaine', 'Ambrine'].slice(0, taille).map((n) => personnageDepuisFiche(ficheDe(n).fiche, { id: n.toLowerCase() }));
  const enRencontre = (taille: number): Partie => {
    const p = moteur.executer(moteur.nouvellePartie(groupe(taille), { graine: 1, niveau: 3 }), { type: 'commencer' }).partie;
    return { ...p, scene: { type: 'rencontre', rencontre: [...r.monde.rencontres.keys()][0]! } };
  };

  it('rechargée, elle rend le même état : le mort reste mort, le tombé reste tombé, personne ne manque', () => {
    const etat = combat([hero('Bran', 1, 1), hero('Hilda', 2, 1), hero('Pip', 3, 1), gobelin('g1', 9, 4)]);
    const bran = combattant(etat, 'bran');
    bran.pv = 0;
    bran.mort = true;
    const hilda = combattant(etat, 'hilda');
    mettreATerre(etat, hilda);
    hilda.jetsMort = { succes: 1, echecs: 1 };
    const avant: Partie = {
      ...enRencontre(3),
      combatEnCours: { etat: structuredClone(etat), graine: 1, rencontre: { id: 'e', nom: 'E', description: '', difficulte: 'faible', terrain: 'foret', carte: ['H'], monstres: [] }, ia: 'facile' },
    };
    let json = '';
    expect(sauvegarderPartie(avant, (j) => (json = j))).toBe(true);
    const apres = moteur.charger(json).combatEnCours!.etat;
    expect(apres.combattants.map((c) => c.id)).toEqual(etat.combattants.map((c) => c.id));
    expect(apres.ordre).toEqual(etat.ordre);
    const lu = (id: string) => apres.combattants.find((c) => c.id === id)!;
    expect(lu('bran')).toMatchObject({ mort: true, pv: 0 });
    expect(lu('hilda')).toMatchObject({ pv: 0, jetsMort: { succes: 1, echecs: 1 } });
    expect(aEtat(lu('hilda'), 'inconscient')).toBe(true);
    expect(lu('pip').position).toEqual(combattant(etat, 'pip').position);
  });

  it('les PX d’une victoire se partagent par la taille du groupe (4 ou 6), tombés compris', () => {
    for (const taille of [4, 6]) {
      const p = enRencontre(taille);
      const xp0 = p.etat.xp;
      const heros = Object.fromEntries(p.groupe.map((h, i) => [h.id, { pv: i === 0 ? 0 : h.pv }]));
      const apres = moteur.executer(p, { type: 'reglerRencontre', issue: 'victoire', px: 600, heros }).partie;
      expect(apres.etat.xp - xp0).toBeGreaterThanOrEqual(Math.floor(600 / taille));
      expect(apres.groupe).toHaveLength(taille);
    }
  });
});
