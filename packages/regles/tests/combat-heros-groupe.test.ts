// Aucun héros ne sort du groupe ni de l'écran (audit du 15/11/2026, signalement : « mon guerrier est mort puis revenu à 1 PV,
// mon paladin a disparu »). Cause trouvée : un héros mis à terre par une attaque d'opportunité PENDANT son déplacement restait
// sur la case d'un allié qu'il traversait ; deux jetons sur la même case, le second invisible (et impossible à viser pour le soigner).
// Plus : la fin de combat relève toujours les tombés à 1 PV, quelle que soit la taille du groupe (4 ou 6), et le moteur le garantit
// lui-même sans compter sur le client.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creationRapide, creerMoteur, heroCombatDe, MODULES_STANDARD, personnageDepuisFiche, resultatDeCombat, sauvegarderPartie, type Partie, type Personnage, type Rencontre } from '../src';
import { adapterRencontre } from '../src/combat/echelle';
import { heroDepuisFiche, monstreDepuisProfil } from '../src/combat/creation';
import { aEtat, combattant, type Combattant, type EtatCombat } from '../src/combat/etat';
import { grilleDepuisTexte } from '../src/combat/grille';
import { IA_RAPIDE, jouerTourIA } from '../src/combat/ia';
import { creerCombat, deplacer } from '../src/combat/moteur';
import { HEROS_PRE_TIRES, preparerRencontre } from '../src/combat/prototype';
import { chargerDonneesSrd } from '../src/donnees-node';
import { calculerFiche } from '../src/fiche';
import { chargerMonde } from '../src/monde/chargeur';
import { MONDES_ESSAI } from './mondes-essai';

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };

function hero(nom: string, x: number, y: number): Combattant {
  const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === nom)!;
  const r = calculerFiche(h.choix, donnees);
  if (!r.ok) throw new Error(r.erreurs.join());
  return heroDepuisFiche(r.fiche, h.kit, donnees, { x, y });
}
const gobelin = (id: string, x: number, y: number): Combattant => monstreDepuisProfil(donnees.monstres.get('combattant-gobelin')!, id, { x, y });

/** Règle le bonus d'attaque de toutes les actions d'un monstre. */
function touche(m: Combattant, bonus: number): void {
  for (const a of m.actionsMonstre) if (a.resolution?.type === 'attaque') a.resolution = { ...a.resolution, bonus };
}

/** Deux créatures vivantes (ni mortes ni en fuite) sur la même case. */
function superposes(etat: EtatCombat): string[] {
  const vus = new Map<string, string>();
  const res: string[] = [];
  for (const c of etat.combattants) {
    if (c.mort || c.enFuite) continue;
    const k = `${c.position.x},${c.position.y}`;
    if (vus.has(k)) res.push(`${vus.get(k)} et ${c.nom} sur la case ${k}`);
    else vus.set(k, c.nom);
  }
  return res;
}

describe('un déplacement interrompu ne laisse pas un héros sur la case d’un allié', () => {
  // Couloir d'une case de large (rangée 1) avec une alcôve en (1,0) où se tient un gobelin : en traversant la case de l'allié (2,1),
  // le héros quitte la portée du gobelin et s'expose à son attaque d'opportunité.
  const COULOIR = ['#.############', '..............', '##############'];
  const nouveau = (pvDuMarcheur: number): { etat: EtatCombat; marcheur: Combattant; allie: Combattant; gob: Combattant } => {
    const marcheur = hero('Bran', 0, 1);
    const allie = hero('Hilda', 2, 1);
    const gob = gobelin('g1', 1, 0);
    // Le gobelin touche toujours ; le marcheur n'a plus qu'un point de vie : un coup le met à terre.
    touche(gob, 100);
    marcheur.pv = pvDuMarcheur;
    const etat = creerCombat(grilleDepuisTexte(COULOIR), [marcheur, allie, gob].map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), 1, { elan: false });
    return { etat, marcheur: combattant(etat, 'bran'), allie: combattant(etat, 'hilda'), gob: combattant(etat, 'g1') };
  };

  it('Bran traverse Hilda, tombe sous l’attaque d’opportunité : il ne reste pas sur sa case', () => {
    const { etat, marcheur, allie } = nouveau(1);
    expect(deplacer(etat, marcheur, { x: 6, y: 1 })).toBe(true);
    expect(marcheur.pv).toBe(0); // l'attaque d'opportunité a bien eu lieu
    expect(aEtat(marcheur, 'inconscient')).toBe(true);
    expect(superposes(etat)).toEqual([]);
    expect(marcheur.position).not.toEqual(allie.position);
  });

  it('un héros qui n’est pas touché va au bout de son chemin', () => {
    const { etat, marcheur, gob } = nouveau(30);
    touche(gob, -100); // le gobelin rate
    expect(deplacer(etat, marcheur, { x: 6, y: 1 })).toBe(true);
    expect(marcheur.position).toEqual({ x: 6, y: 1 });
    expect(superposes(etat)).toEqual([]);
  });

  it('un héros tué net en traversant un allié n’est pas caché sous lui non plus', () => {
    const { etat, marcheur, allie, gob } = nouveau(1);
    // Dégâts énormes : mort massive.
    for (const a of gob.actionsMonstre) a.degats = [{ des: '10d10', bonus: 50, type: 'tranchant' }];
    deplacer(etat, marcheur, { x: 6, y: 1 });
    expect(marcheur.mort).toBe(true);
    expect(marcheur.position).not.toEqual(allie.position);
  });
});

describe('la fin d’un combat d’histoire ne fait sortir aucun héros du groupe (4 ou 6)', () => {
  const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  const dm = r.monde;
  const moteur = creerMoteur({ dm, srd: donnees }, MODULES_STANDARD);
  const CLASSES = ['guerrier', 'paladin', 'clerc', 'roublard', 'magicien', 'barbare'];
  const RENCONTRE: Rencontre = {
    id: 'essai',
    nom: 'Essai',
    description: 'Une escarmouche d’essai.',
    difficulte: 'moderee',
    terrain: 'foret',
    carte: ['#..............#', '#..HHHHHH......#', '#..............#', '#..............#', '#.....mmm......#', '#..............#'],
    monstres: [{ profil: 'combattant-gobelin', nombre: 3 }],
  };

  function groupe(taille: number): Personnage[] {
    return CLASSES.slice(0, taille).map((classe, i) => {
      const choix = creationRapide({ classe, espece: 'humain', niveau: 3, nom: `${classe}${i}` }, donnees);
      const f = bilanPersonnage({ id: `x${i}`, sexe: 'M', alignement: 'LB', portrait: 'humain-m-1', choix } as never, donnees).fiche!;
      return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
    });
  }
  function enRencontre(p: Partie): Partie {
    return { ...p, scene: { type: 'rencontre', rencontre: [...dm.rencontres.keys()][0]! } };
  }
  function allerRetour(p: Partie): Partie {
    let json = '';
    expect(sauvegarderPartie(p, (j) => (json = j))).toBe(true);
    return moteur.charger(json);
  }
  /** Un combat gagné où le guerrier est mort, le paladin et un autre à terre. */
  function combatGagne(p: Partie): EtatCombat {
    const { grille, combattants } = preparerRencontre(adapterRencontre(RENCONTRE, p.groupe.length), donnees, p.groupe.map(heroCombatDe));
    const etat = creerCombat(grille, combattants, 3);
    for (const m of etat.combattants.filter((c) => c.camp === 'monstres')) {
      m.pv = 0;
      m.mort = true;
    }
    const guerrier = combattant(etat, 'guerrier0');
    guerrier.pv = 0;
    guerrier.mort = true;
    const paladin = combattant(etat, 'paladin1');
    paladin.pv = 0;
    paladin.etats.push({ etat: 'inconscient' });
    etat.vainqueur = 'heros';
    return etat;
  }

  for (const taille of [4, 6]) {
    it(`groupe de ${taille} : le guerrier mort et le paladin à terre sont relevés à 1 PV, personne ne manque, même après sauvegarde`, () => {
      const p0 = enRencontre(moteur.executer(moteur.nouvellePartie(groupe(taille), { graine: 5, niveau: 3 }), { type: 'commencer' }).partie);
      const ids = p0.groupe.map((h) => h.id);
      const etat = combatGagne(p0);
      const res = resultatDeCombat(etat);
      expect(Object.keys(res.heros).sort()).toEqual([...ids].sort());
      const apres = allerRetour(moteur.executer(p0, { type: 'reglerRencontre', issue: res.issue, px: res.px, heros: res.heros }).partie);
      expect(apres.groupe.map((h) => h.id)).toEqual(ids);
      expect(apres.groupe.find((h) => h.id === 'guerrier0')!.pv).toBe(1);
      expect(apres.groupe.find((h) => h.id === 'paladin1')!.pv).toBe(1);
      for (const h of apres.groupe) expect(h.pv).toBeGreaterThanOrEqual(1);
    });
  }

  it('le moteur relève lui-même un héros que le client rendrait à 0 PV (victoire, repli ou défaite)', () => {
    for (const issue of ['victoire', 'fuite', 'defaite'] as const) {
      const p0 = enRencontre(moteur.executer(moteur.nouvellePartie(groupe(4), { graine: 5, niveau: 3 }), { type: 'commencer' }).partie);
      const heros = Object.fromEntries(p0.groupe.map((h) => [h.id, { pv: 0 }]));
      const apres = moteur.executer(p0, { type: 'reglerRencontre', issue, ...(issue === 'victoire' ? { px: 50 } : {}), heros }).partie;
      expect(apres.groupe.map((h) => h.pv), issue).toEqual(apres.groupe.map(() => 1));
    }
  });

  it('un combat joué par l’IA avec un paladin et un guerrier : le groupe revient entier, à 1 PV au moins', () => {
    for (const graine of [1, 2, 3]) {
      const p0 = enRencontre(moteur.executer(moteur.nouvellePartie(groupe(6), { graine, niveau: 3 }), { type: 'commencer' }).partie);
      const { grille, combattants } = preparerRencontre(adapterRencontre(RENCONTRE, 6), donnees, p0.groupe.map(heroCombatDe));
      const etat = creerCombat(grille, combattants, graine);
      for (let t = 0; t < 400 && !etat.vainqueur && etat.round < 40; t++) {
        jouerTourIA(etat, ctx, IA_RAPIDE);
        expect(superposes(etat), `graine ${graine} tour ${t}`).toEqual([]);
      }
      const res = resultatDeCombat(etat);
      const apres = moteur.executer(p0, { type: 'reglerRencontre', issue: res.issue, ...(res.issue === 'victoire' ? { px: res.px } : {}), heros: res.heros }).partie;
      expect(apres.groupe).toHaveLength(6);
      for (const h of apres.groupe) expect(h.pv).toBeGreaterThanOrEqual(1);
    }
  });
});
