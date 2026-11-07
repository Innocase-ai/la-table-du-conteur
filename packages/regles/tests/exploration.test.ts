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
  personnageDepuisFiche,
  type Personnage,
  type Generateur,
  type PartieMonde,
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

function groupe(): Personnage[] {
  return herosPreTires(srd).map((h) => personnageDepuisFiche(h.fiche, { id: h.fiche.nom.toLowerCase(), outils: h.fiche.nom === 'Pip' ? ['outils-de-voleur'] : [] }));
}

function partie(gen: Generateur = SUCCES): PartieMonde {
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
  it('trouver la trappe, repérer et désamorcer le piège, crocheter le coffret, le vider', () => {
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
    expect(pip.pv).toBe(pip.fiche.pvMax); // piège désamorcé : pas d'aiguille

    const pris = prendre(p, coffret);
    expect(pris.ok).toBe(true);
    expect(p.etat.pieces).toBe(85);
    expect(p.etat.inventaire['vei-double-registre']).toBe(1);
    expect(prendre(p, coffret).ok).toBe(false); // déjà vidé
  });

  it('un désamorçage raté de 5 ou plus déclenche le piège ; sans outils, pas de crochetage', () => {
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

describe('les pièges ne se repèrent qu’en fouillant', () => {
  const PIEGE = 'vei-p-aiguille-du-coffret';
  const COFFRET = 'vei-t-plancher-du-bailli';

  /** Au cellier du bailli, avec une perception passive énorme : si les pièges se repéraient d'office, celui-ci le serait. */
  function auCellier(gen: Generateur): PartieMonde {
    const p = partie(SUCCES);
    for (const a of p.groupe) a.fiche.perceptionPassive = 40;
    aller(p, 'vei-halle-du-bailli');
    fouiller(p); // trouve la trappe
    expect(aller(p, 'vei-cellier-du-bailli').ok).toBe(true);
    p.gen = gen;
    return p;
  }

  it('entrer dans le lieu ne révèle pas le piège, même avec une perception passive très haute', () => {
    const p = auCellier(SUCCES);
    expect(p.etat.exploration.decouverts).not.toContain(`piege:${PIEGE}`);
    expect(ficheDeScene(p).pieges.map((x) => x.id)).not.toContain(PIEGE);
    expect(desarmer(p, PIEGE, 'pip').ok).toBe(false); // rien de repéré : rien à désamorcer
  });

  it('la fouille peut le trouver, ou le rater : le jet décide, et le joueur ne voit pas le DD', () => {
    const trouve = auCellier(SUCCES);
    const f = fouiller(trouve);
    expect(f.constats.join(' ')).toMatch(/piège/);
    expect(f.jets.every((j) => j.ddSecret)).toBe(true);
    expect(trouve.etat.exploration.decouverts).toContain(`piege:${PIEGE}`);

    const rate = auCellier(ECHEC);
    const dd = dm.pieges.get(PIEGE)!.detection.dd;
    const f2 = fouiller(rate);
    expect(f2.jets.some((j) => j.total >= dd)).toBe(false); // le jet est bien en dessous du DD
    expect(rate.etat.exploration.decouverts).not.toContain(`piege:${PIEGE}`);
    expect(f2.constats.join(' ')).not.toMatch(/piège/);
    // Une seule fouille par lieu et par jour : on ne relance pas les dés.
    expect(fouiller(rate).ok).toBe(false);
  });

  it('un piège non trouvé se déclenche quand on ouvre le coffret sans le désamorcer', () => {
    const p = auCellier(SUCCES);
    const pip = p.groupe.find((a) => a.id === 'pip')!;
    const o = ouvrir(p, { tresor: COFFRET }, 'crocheter', 'pip');
    expect(o.narrations.join(' ')).toBe(dm.pieges.get(PIEGE)!.declenchement);
    expect(p.etat.exploration.pieges[PIEGE]).toBe('declenche');
    expect(pip.pv).toBeLessThan(pip.fiche.pvMax);
  });

  describe('un piège que rien ne garde se déclenche si on prend ou ouvre quelque chose sans l’avoir trouvé', () => {
    const LIBRE = 'gro-p-eboulement-ravine';
    const LIEU = 'gro-sentier-ravine';
    const BUTIN = 'gro-t-vask-sacoche';

    function surLePlace(): PartieMonde {
      const p = partie(SUCCES);
      p.etat.lieu = LIEU;
      return p;
    }

    it('le piège est bien « libre » : ni contenant piégé ni énigme ne le cite', () => {
      expect([...dm.tresors.values()].some((t) => t.acces.piege === LIBRE)).toBe(false);
      expect([...dm.enigmes.values()].some((e) => e.echec?.piege === LIBRE)).toBe(false);
      expect(dm.pieges.get(LIBRE)!.lieu).toBe(LIEU);
    });

    it('prendre quelque chose le déclenche : narration, sauvegarde, dégâts, et il est alors connu', () => {
      const p = surLePlace();
      p.gen = ECHEC; // la sauvegarde est ratée : pleins dégâts
      const avant = p.groupe.reduce((s, a) => s + a.pv, 0);
      const r = prendre(p, BUTIN);
      expect(r.ok).toBe(true);
      expect(r.narrations).toContain(dm.pieges.get(LIBRE)!.declenchement);
      expect(p.etat.exploration.pieges[LIBRE]).toBe('declenche');
      expect(p.etat.exploration.decouverts).toContain(`piege:${LIBRE}`);
      expect(p.groupe.reduce((s, a) => s + a.pv, 0)).toBeLessThan(avant);
      expect(p.etat.exploration.tresorsPris).toContain(BUTIN);
    });

    it('il ne se déclenche qu’une fois, et pas quand le groupe se contente d’entrer, de fouiller ou de se reposer', () => {
      const p = surLePlace();
      aller(p, 'veillecendre'); // partir ne déclenche rien
      p.etat.lieu = LIEU;
      expect(p.etat.exploration.pieges[LIBRE]).toBeUndefined();
      prendre(p, BUTIN);
      expect(p.etat.exploration.pieges[LIBRE]).toBe('declenche');
      const apres = p.groupe.reduce((s, a) => s + a.pv, 0);
      // Le piège est connu et déclenché : plus rien à craindre ici.
      p.etat.exploration.tresorsPris = p.etat.exploration.tresorsPris.filter((t) => t !== BUTIN);
      prendre(p, BUTIN);
      expect(p.groupe.reduce((s, a) => s + a.pv, 0)).toBe(apres);
    });

    it('trouvé en fouillant, il ne se déclenche pas ; désamorcé non plus', () => {
      const trouve = surLePlace();
      for (const a of trouve.groupe) a.fiche.perceptionPassive = 40;
      const f = fouiller(trouve);
      expect(f.constats.join(' ')).toMatch(/piège/);
      const avant = trouve.groupe.reduce((s, a) => s + a.pv, 0);
      prendre(trouve, BUTIN);
      expect(trouve.etat.exploration.pieges[LIBRE]).toBeUndefined(); // repéré, pas déclenché
      expect(trouve.groupe.reduce((s, a) => s + a.pv, 0)).toBe(avant);

      const desarme = surLePlace();
      desarme.etat.exploration.pieges[LIBRE] = 'desarme';
      prendre(desarme, BUTIN);
      expect(desarme.etat.exploration.pieges[LIBRE]).toBe('desarme');
    });

    it('ouvrir quelque chose (ici un coffret crocheté) le déclenche aussi, sur celui qui crochète', () => {
      const libre = { ...structuredClone(dm.pieges.get('vei-p-aiguille-du-coffret')!), id: 'test-piege-libre', lieu: 'vei-cellier-du-bailli', degats: [{ des: '1d4', type: 'perforant' }], sauvegarde: undefined };
      dm.pieges.set(libre.id, libre);
      try {
        const p = partie(SUCCES);
        aller(p, 'vei-halle-du-bailli');
        fouiller(p);
        aller(p, 'vei-cellier-du-bailli');
        p.etat.exploration.pieges['vei-p-aiguille-du-coffret'] = 'desarme'; // celui du coffret ne compte pas ici
        const pip = p.groupe.find((a) => a.id === 'pip')!;
        const r = ouvrir(p, { tresor: 'vei-t-plancher-du-bailli' }, 'crocheter', 'pip');
        expect(r.narrations).toContain(libre.declenchement);
        expect(p.etat.exploration.pieges[libre.id]).toBe('declenche');
        expect(pip.pv).toBeLessThan(pip.fiche.pvMax);
      } finally {
        dm.pieges.delete('test-piege-libre');
      }
    });
  });

  it('les passages cachés de perception restent repérés sans jet par la perception passive (seuls les pièges changent)', () => {
    const p = partie(SUCCES);
    for (const a of p.groupe) a.fiche.perceptionPassive = 40;
    const r = aller(p, 'pont-de-fer'); // une brèche cachée (perception, DD 13) et des égouts cachés
    expect(r.constats.join(' ')).toMatch(/perception passive/);
    expect(p.etat.exploration.decouverts.some((c) => c.startsWith('lien:pont-de-fer>pdf-breche'))).toBe(true);
    // Le même groupe, avec une perception passive trop faible, ne repère rien sans fouiller.
    const faible = partie(SUCCES);
    for (const a of faible.groupe) a.fiche.perceptionPassive = 5;
    aller(faible, 'pont-de-fer');
    expect(faible.etat.exploration.decouverts.some((c) => c.startsWith('lien:pont-de-fer>pdf-breche'))).toBe(false);
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

  it('on ne dort pas n’importe où : une nuit seulement dans un lieu sûr, une halte presque partout', () => {
    const p = partie();
    // Les rues du village sont « dangereuses » : une halte, pas une nuit.
    expect(p.dm.lieux.get(p.etat.lieu)!.repos).toBe('dangereux');
    const refus = seReposer(p, 'long');
    expect(refus.ok).toBe(false);
    expect(refus.refus).toMatch(/On ne dort pas ici/);
    expect(p.etat.jour).toBe(1);
    expect(seReposer(p, 'court').ok).toBe(true);
    // Un repaire de brigands : aucun repos, même court.
    p.etat.lieu = 'gue-repaire';
    expect(p.dm.lieux.get('gue-repaire')!.repos).toBe('impossible');
    expect(seReposer(p, 'court').ok).toBe(false);
    expect(seReposer(p, 'long').ok).toBe(false);
    // L'auberge est sûre : on y dort.
    p.etat.lieu = 'vei-auberge-dernier-feu';
    expect(seReposer(p, 'long').ok).toBe(true);
    expect(p.etat.jour).toBe(2);
  });

  it('un repos long à l’auberge de Veillecendre : PV pleins, jour suivant, la cendre monte et franchit un palier', () => {
    const p = partie();
    p.etat.lieu = 'vei-auberge-dernier-feu';
    p.groupe[0]!.pv = 1;
    const avant = p.etat.jauges['cendre']!;
    const rp = seReposer(p, 'long');
    expect(rp.ok).toBe(true);
    expect(p.groupe[0]!.pv).toBe(p.groupe[0]!.fiche.pvMax);
    expect(p.etat.jour).toBe(2);
    expect(p.etat.jauges['cendre']).toBe(avant + 1);
    expect(rp.constats.join(' ')).toMatch(/Les morts rôdent/);
  });

  describe('un repos interrompu par un combat (SRD 5.2.1)', () => {
    /** L'auberge reçoit une rencontre de combat qui surgit à coup sûr pendant le repos. */
    function aubergeAgitee(): ReturnType<typeof partie> {
      const p = partie();
      p.etat.lieu = 'vei-auberge-dernier-feu';
      const lieu = p.dm.lieux.get(p.etat.lieu)!;
      const combat = [...p.dm.rencontres.values()].find((r) => r.type === 'combat')!;
      lieu.rencontres = [{ id: combat.id, declencheur: 'repos', unique: false } as (typeof lieu.rencontres)[number]];
      p.groupe[0]!.pv = 1;
      return p;
    }

    it('une nuit interrompue ne donne que les bénéfices d’un repos court : pas de nouveau jour', () => {
      const p = aubergeAgitee();
      const jour = p.etat.jour;
      const rp = seReposer(p, 'long');
      expect(rp.combat).toBeDefined();
      expect(p.etat.jour).toBe(jour); // pas de nuit entière, pas de nouveau jour
      expect(rp.constats.join(' ')).toMatch(/la nuit est interrompue/);
      expect(rp.constats.join(' ')).not.toMatch(/nuit entière/);
      expect(p.groupe[0]!.pv).toBeGreaterThan(1); // les bénéfices d'une halte sont bien là
    });

    it('une halte interrompue ne rapporte rien', () => {
      const p = aubergeAgitee();
      const rp = seReposer(p, 'court');
      expect(rp.combat).toBeDefined();
      expect(p.groupe[0]!.pv).toBe(1);
      expect(rp.constats.join(' ')).toMatch(/La halte est interrompue/);
    });
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
