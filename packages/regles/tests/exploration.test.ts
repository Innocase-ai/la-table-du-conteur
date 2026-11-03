import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  aller,
  etatInitial,
  desarmer,
  ddInfluence,
  ficheDeScene,
  fouiller,
  herosPreTires,
  creerGenerateur,
  influencer,
  issueRencontre,
  nouvellePartie,
  ouvrir,
  parler,
  prendre,
  repondreEnigme,
  seReposer,
  sortiesDe,
  testLibre,
  type Aventurier,
  type Generateur,
  type Partie,
} from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(RACINE_MONDES, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde;

/** Dés imposés : 0.999 donne 20 sur un d20, 0 donne 1. */
const des = (v: number): Generateur => () => v;
const SUCCES = des(0.999);
const ECHEC = des(0);

function groupe(): Aventurier[] {
  return herosPreTires(srd).map((h) => ({
    id: h.fiche.nom.toLowerCase(),
    nom: h.fiche.nom,
    fiche: h.fiche,
    pv: h.fiche.pvMax,
    outils: h.fiche.nom === 'Pip' ? ['outils-de-voleur'] : [],
  }));
}

function partie(gen: Generateur = SUCCES): Partie {
  return nouvellePartie(dm, etatInitial(dm, 3), groupe(), gen);
}

describe('déplacements', () => {
  it('on entre dans un bâtiment du village et on en ressort (parent et enfants)', () => {
    const p = partie();
    expect(sortiesDe(p, 'veillecendre').map((s) => s.vers)).toContain('vei-auberge-dernier-feu');
    expect(aller(p, 'vei-auberge-dernier-feu').ok).toBe(true);
    expect(p.etat.lieu).toBe('vei-auberge-dernier-feu');
    expect(p.etat.lieuxVisites).toContain('vei-auberge-dernier-feu');
    expect(aller(p, 'veillecendre').ok).toBe(true);
  });

  it("refuse un lieu qui n'est pas voisin, et un passage bloqué par une condition du monde", () => {
    const p = partie();
    const loin = aller(p, 'haute-forge');
    expect(loin.ok).toBe(false);
    expect(loin.refus).toMatch(/Aucun passage/);
    p.etat.lieu = 'cryptes-d-ormgard';
    const scelle = aller(p, 'haute-forge');
    expect(scelle.ok).toBe(false);
    expect(scelle.refus).toMatch(/infranchissable/);
  });
});

describe('le cellier du bailli : passage secret, piège, coffret', () => {
  it('trouver la trappe, repérer et désarmer le piège, crocheter le coffret, le vider', () => {
    const p = partie(SUCCES);
    aller(p, 'vei-halle-du-bailli');
    expect(aller(p, 'vei-cellier-du-bailli').ok).toBe(false); // la trappe est cachée

    const f1 = fouiller(p);
    expect(f1.constats.join(' ')).toMatch(/passage caché vers Le cellier du bailli|cellier/i);
    expect(f1.jets[0]!.ddSecret).toBe(true);
    expect(fouiller(p).ok).toBe(false); // une fouille par lieu et par jour
    expect(aller(p, 'vei-cellier-du-bailli').ok).toBe(true);

    const f2 = fouiller(p);
    expect(f2.constats.join(' ')).toMatch(/piège/);
    const coffret = 'vei-t-plancher-du-bailli';
    expect(ficheDeScene(p).pieges.map((x) => x.id)).toContain('vei-p-aiguille-du-coffret');

    expect(prendre(p, coffret).ok).toBe(false); // fermé
    const d = desarmer(p, 'vei-p-aiguille-du-coffret', 'pip');
    expect(d.ok).toBe(true);
    expect(p.etat.exploration.pieges['vei-p-aiguille-du-coffret']).toBe('desarme');

    const o = ouvrir(p, { tresor: coffret }, 'crocheter', 'pip');
    expect(o.jets[0]!.test).toBe('escamotage');
    expect(p.etat.exploration.ouverts).toContain(`tresor:${coffret}`);
    const pip = p.groupe.find((a) => a.id === 'pip')!;
    expect(pip.pv).toBe(pip.fiche.pvMax); // piège désarmé : pas d'aiguille

    const pris = prendre(p, coffret);
    expect(pris.ok).toBe(true);
    expect(p.etat.pieces).toBe(85);
    expect(p.etat.inventaire['vei-double-registre']).toBe(1);
    expect(prendre(p, coffret).ok).toBe(false); // déjà vidé
  });

  it('un désarmement raté de 5 ou plus déclenche le piège ; sans outils, pas de crochetage', () => {
    const p = partie(SUCCES);
    aller(p, 'vei-halle-du-bailli');
    fouiller(p);
    aller(p, 'vei-cellier-du-bailli');
    fouiller(p);
    p.gen = ECHEC;
    const pip = p.groupe.find((a) => a.id === 'pip')!;
    const d = desarmer(p, 'vei-p-aiguille-du-coffret', 'pip');
    expect(d.constats.join(' ')).toMatch(/se déclenche/);
    expect(p.etat.exploration.pieges['vei-p-aiguille-du-coffret']).toBe('declenche');
    expect(pip.pv).toBeLessThan(pip.fiche.pvMax);
    expect(d.jets.some((j) => j.test === 'sauvegarde de con')).toBe(true);

    const bran = ouvrir(p, { tresor: 'vei-t-plancher-du-bailli' }, 'crocheter', 'bran');
    expect(bran.ok).toBe(false);
    expect(bran.refus).toMatch(/outils de voleur/);
  });
});

describe('dialogue', () => {
  it('Nério salue, liste ses sujets, et révèle un fait sur le bon sujet', () => {
    const p = partie();
    aller(p, 'vei-auberge-dernier-feu');
    expect(ficheDeScene(p).pnj.map((n) => n.id)).toContain('vei-nerio-braisemolle');
    const salut = parler(p, 'vei-nerio-braisemolle');
    expect(salut.narrations).toHaveLength(1);
    expect(salut.constats[0]).toMatch(/les-accusations/);
    const sujet = parler(p, 'vei-nerio-braisemolle', 'les-accusations');
    expect(sujet.revele).toContain('f-vei-tieffelins-accuses');
    expect(p.etat.faits).toContain('f-vei-tieffelins-accuses');
    expect(parler(p, 'vei-nerio-braisemolle', 'les-dragons').ok).toBe(false);
  });

  it("on ne parle qu'aux PNJ présents ; la persuasion change l'attitude", () => {
    const p = partie(SUCCES);
    expect(parler(p, 'vei-nerio-braisemolle').ok).toBe(false); // il est à l'auberge
    aller(p, 'vei-auberge-dernier-feu');
    const avant = p.etat.attitudes['vei-nerio-braisemolle']!;
    influencer(p, 'vei-nerio-braisemolle', 'persuasion');
    expect(p.etat.attitudes['vei-nerio-braisemolle']).toBe(avant + 10);
    p.gen = ECHEC;
    influencer(p, 'vei-nerio-braisemolle', 'tromperie');
    expect(p.etat.attitudes['vei-nerio-braisemolle']).toBe(avant - 5);
    expect(ddInfluence(0)).toBe(15);
    expect(ddInfluence(100)).toBe(5);
  });
});

describe('énigmes, repos, tests, fiche de scène', () => {
  it("le mot d'ordre de la caserne des cryptes : bonne réponse, fait, XP, trésor accessible", () => {
    const p = partie();
    p.etat.lieu = 'cry-caserne';
    const rep = repondreEnigme(p, 'cry-e-le-mot-d-ordre', "L'Enclume");
    expect(rep.ok).toBe(true);
    expect(p.etat.faits).toContain('f-cry-mot-d-ordre');
    expect(p.etat.xp).toBe(75);
    expect(p.etat.exploration.ouverts).toContain('tresor:cry-t-caserne-capitaine');
    expect(repondreEnigme(p, 'cry-e-le-mot-d-ordre', 'enclume').ok).toBe(false); // déjà résolue
  });

  it('un repos long à Veillecendre : PV pleins, jour suivant, la cendre monte et franchit un palier', () => {
    const p = partie();
    p.groupe[0]!.pv = 1;
    const avant = p.etat.jauges['cendre']!;
    const rp = seReposer(p, 'long');
    expect(rp.ok).toBe(true);
    expect(p.groupe[0]!.pv).toBe(p.groupe[0]!.fiche.pvMax);
    expect(p.etat.jour).toBe(2);
    expect(p.etat.jauges['cendre']).toBe(avant + 1);
    expect(rp.constats.join(' ')).toMatch(/Les morts rôdent/);
  });

  it('un test libre refuse un DD hors bornes', () => {
    const p = partie();
    expect(testLibre(p, 'athletisme', 40).ok).toBe(false);
    expect(testLibre(p, 'athletisme', 12).jets).toHaveLength(1);
  });

  it('la fiche de scène du départ : lieu, sorties visibles, groupe, jauges', () => {
    const p = partie();
    const f = ficheDeScene(p);
    expect(f.lieu.id).toBe('veillecendre');
    expect(f.sorties.length).toBeGreaterThan(5);
    expect(f.groupe).toHaveLength(6);
    expect(f.jauges.map((j) => j.id)).toContain('cendre');
    expect(JSON.stringify(f)).not.toMatch(/secret/i);
  });
});

describe('robustesse', () => {
  it('une marche au hasard de 400 actions dans tout le Val ne plante pas et explore le monde', () => {
    const p = partie(creerGenerateur(42));
    const hasard = creerGenerateur(7);
    for (let i = 0; i < 400; i++) {
      const libres = sortiesDe(p, p.etat.lieu).filter((s) => !s.cache && !s.bloque && (!s.verrou || s.verrou.ouvert));
      const choix = hasard();
      let cr;
      if (choix < 0.25) cr = fouiller(p);
      else if (choix < 0.3) cr = seReposer(p, 'court');
      else cr = aller(p, libres[Math.floor(hasard() * libres.length)]!.vers);
      expect(cr.jets.every((j) => Number.isFinite(j.total))).toBe(true);
      if (cr.combat) issueRencontre(p, cr.combat, { type: 'victoire' });
      for (const a of p.groupe) if (a.pv === 0) a.pv = 1;
      if (p.etat.fin) break;
    }
    expect(p.etat.lieuxVisites.length).toBeGreaterThan(25);
    expect(p.etat.rencontresFaites.length).toBeGreaterThan(0);
  });
});
