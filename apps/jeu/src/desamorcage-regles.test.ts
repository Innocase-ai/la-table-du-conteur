// L'écran de désamorçage : le mécanisme déduit du nom et du résumé (tous les pièges des quatre mondes), la durée entière, les
// messages, le bruitage, et le repérage d'un désamorçage dans le journal du vrai moteur (réussite, échec, déclenchement),
// sans rien révéler de caché.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type DonneesMonde, type EvenementJeu, type Partie } from '@crpg/regles';
import { chargerDonneesSrd } from '../../../packages/regles/src/donnees-node';
import { chargerMonde, RACINE_MONDES } from '../../../packages/regles/src/monde/chargeur';
import {
  detecterDesamorcage,
  dureeDesamorcage,
  dureeResultat,
  mecanismeDuPiege,
  messageFinal,
  objetEnPhrase,
  phraseDeTravail,
  sonDuResultat,
  titreDesamorcage,
  type IssueDesamorcage,
  type MecanismePiege,
} from './desamorcage-regles';

const MECANISMES: MecanismePiege[] = ['aiguille', 'fil', 'plaque', 'sol', 'chute', 'gaz', 'glyphe', 'rouages'];
const ISSUES: IssueDesamorcage[] = ['reussi', 'rate', 'declenche'];

const charger = (id: string): DonneesMonde => {
  const r = chargerMonde(join(RACINE_MONDES, id));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  return r.monde;
};

describe('le mécanisme dessiné', () => {
  it('se déduit du nom, puis du résumé', () => {
    const m = (nom: string, resume = '') => mecanismeDuPiege({ nom, resume });
    expect(m('Aiguille empoisonnée du coffret')).toBe('aiguille');
    expect(m("L'arbalète du chambranle")).toBe('aiguille');
    expect(m("Fil d'alarme des drains")).toBe('fil');
    expect(m('Le collet des roseaux')).toBe('fil');
    expect(m('La clochette d’alarme')).toBe('fil');
    expect(m('Plaque de pression du hall')).toBe('plaque');
    expect(m('La dalle aux faucilles')).toBe('plaque');
    expect(m('Les lames de la galerie', 'Le couloir est semé de plaques à contrepoids')).toBe('plaque');
    expect(m('La fosse aux pieux')).toBe('sol');
    expect(m('Dalle creuse du puits de cendre')).toBe('sol');
    expect(m('La planche pourrie du fenil')).toBe('sol');
    expect(m('La herse du caveau', 'Une dalle de pression devant le coffre libère une herse')).toBe('chute');
    expect(m('Le plafond-enclume')).toBe('chute');
    expect(m('Chaîne de barrage du pont')).toBe('chute');
    expect(m('Éboulement de la ravine', 'Des dalles posées en équilibre')).toBe('chute');
    expect(m('Poche de gaz du filon')).toBe('gaz');
    expect(m('La vapeur de cendre')).toBe('gaz');
    expect(m('Le glyphe de la trempe ratée')).toBe('glyphe');
    expect(m('Coulée de fonderie', 'La cuve géante bascule')).toBe('rouages');
  });

  it('un piège sans mot connu retombe sur les rouages', () => {
    expect(mecanismeDuPiege({ nom: 'Le truc', resume: 'Quelque chose de louche.' })).toBe('rouages');
  });

  it('tous les pièges des quatre mondes ont un mécanisme, et plusieurs sortes sont dessinées', () => {
    const vus = new Set<MecanismePiege>();
    for (const id of ['val-des-cendres', 'citadelle-des-marees', 'dime-des-roseaux', 'port-sillage']) {
      for (const pg of charger(id).pieges.values()) {
        const m = mecanismeDuPiege(pg);
        expect(MECANISMES, pg.nom).toContain(m);
        vus.add(m);
      }
    }
    for (const m of MECANISMES) expect(vus.has(m), `aucun piège ne montre « ${m} »`).toBe(true);
  });

  it('chaque mécanisme a ses phrases (travail, réussite, échec, déclenchement)', () => {
    for (const m of MECANISMES) {
      expect(phraseDeTravail(m).length).toBeGreaterThan(10);
      const phrases = ISSUES.map((i) => messageFinal(m, i));
      expect(new Set(phrases).size).toBe(3);
    }
  });
});

describe('la durée', () => {
  it('est un nombre entier de secondes, de 3 à 7, plus longue quand le DD dépasse le bonus', () => {
    for (let bonus = -2; bonus <= 15; bonus++) {
      for (let dd = 5; dd <= 30; dd++) {
        const d = dureeDesamorcage(bonus, dd);
        expect(Number.isInteger(d), `${bonus}/${dd}`).toBe(true);
        expect(d).toBeGreaterThanOrEqual(3);
        expect(d).toBeLessThanOrEqual(7);
      }
    }
    expect(dureeDesamorcage(2, 20)).toBeGreaterThan(dureeDesamorcage(9, 12));
  });

  it('le résultat reste plus longtemps affiché quand le piège s’est déclenché', () => {
    expect(dureeResultat('declenche')).toBeGreaterThan(dureeResultat('reussi'));
    expect(dureeResultat('rate')).toBe(dureeResultat('reussi'));
  });
});

describe('les mots de l’écran', () => {
  it('le titre met le nom du piège en phrase', () => {
    expect(titreDesamorcage('Bran', 'La dalle aux faucilles')).toBe('Bran désamorce la dalle aux faucilles');
    expect(titreDesamorcage('Pip', "L'aiguille du trésorier")).toBe("Pip désamorce l'aiguille du trésorier");
    expect(objetEnPhrase('Les pièges à mâchoires du trappeur')).toBe('les pièges à mâchoires du trappeur');
    expect(objetEnPhrase('Plaque de pression du hall')).toBe('Plaque de pression du hall');
  });
});

describe('le bruitage du résultat', () => {
  it('un piège neutralisé fait un déclic ; un déclenchement fait le bruit de ses dégâts ; un échec sans suite se tait', () => {
    expect(sonDuResultat({ issue: 'reussi', typesDegats: [] })).toBe('serrure-ouverte');
    expect(sonDuResultat({ issue: 'rate', typesDegats: [] })).toBeUndefined();
    expect(sonDuResultat({ issue: 'declenche', typesDegats: ['perforant', 'poison'] })).toBe('perforant');
    expect(sonDuResultat({ issue: 'declenche', typesDegats: ['tranchants'] })).toBe('epee');
    expect(sonDuResultat({ issue: 'declenche', typesDegats: ['contondants'] })).toBe('contondant');
    expect(sonDuResultat({ issue: 'declenche', typesDegats: ['feu'] })).toBe('feu-1');
    expect(sonDuResultat({ issue: 'declenche', typesDegats: ['nécrotique'] })).toBe('necrotique');
    expect(sonDuResultat({ issue: 'declenche', typesDegats: [] })).toBeUndefined();
  });
});

describe('repérer un désamorçage dans le journal du vrai moteur', () => {
  const srd = chargerDonneesSrd();
  const val = charger('val-des-cendres');

  function jeu(graine: number) {
    const moteur = creerMoteur({ dm: val, srd }, MODULES_STANDARD);
    const heros = groupeConseille(val.monde.niveaux.min, srd).emplacements.slice(0, 4).map((p) => {
      const f = bilanPersonnage(p!, srd).fiche!;
      return personnageDepuisFiche(f, { id: f.nom.toLowerCase(), outils: ['outils-de-voleur'] });
    });
    const depart = moteur.executer(moteur.nouvellePartie(heros, { graine, niveau: val.monde.niveaux.min }), { type: 'commencer' }).partie;
    // Le piège est déjà repéré (la fouille a réussi) : seul un piège repéré se désamorce.
    const repere = (piege: string): Partie => {
      const pg = val.pieges.get(piege)!;
      return { ...depart, scene: { type: 'exploration' }, etat: { ...depart.etat, lieu: pg.lieu, exploration: { ...depart.etat.exploration, decouverts: [...depart.etat.exploration.decouverts, `piege:${piege}`] } } };
    };
    return { moteur, repere, depart };
  }
  const nouvelles = (avant: Partie, apres: Partie): EvenementJeu[] => apres.journal.slice(avant.journal.length);
  const PIEGE = 'vei-p-aiguille-du-coffret';

  it('réussite, échec sans suite et déclenchement se rencontrent, avec les bons champs', () => {
    const vus: Partial<Record<IssueDesamorcage, number>> = {};
    let avecDegats = 0;
    for (let graine = 1; graine <= 80; graine++) {
      const { moteur, repere } = jeu(graine);
      const avant = repere(PIEGE);
      const res = moteur.executer(avant, { type: 'desarmer', piege: PIEGE });
      expect(res.refus, String(graine)).toBeUndefined();
      const d = detecterDesamorcage(nouvelles(avant, res.partie), val.pieges.values());
      expect(d, String(graine)).toBeDefined();
      expect(d!.piege).toBe('Aiguille empoisonnée du coffret');
      expect(d!.mecanisme).toBe('aiguille');
      expect(d!.jet.test).toBe('escamotage');
      expect(d!.jet.dd).toBe(val.pieges.get(PIEGE)!.desarmement.dd);
      expect(d!.nomHeros).toBe(d!.jet.nom);
      vus[d!.issue] = (vus[d!.issue] ?? 0) + 1;
      // Ce que le moteur a décidé : l'issue suit son jet.
      const pg = val.pieges.get(PIEGE)!;
      if (d!.issue === 'reussi') expect(d!.jet.reussite).toBe(true);
      else expect(d!.jet.reussite).toBe(false);
      if (d!.issue === 'declenche') {
        expect(d!.jet.total).toBeLessThanOrEqual(pg.desarmement.dd - 5);
        expect(d!.declenchement).toBe(pg.declenchement);
        // Une sauvegarde réussie peut réduire les dégâts à rien (1d8 divisé par deux) : les conséquences sont alors vides.
        expect(d!.sauvegarde?.test).toMatch(/^sauvegarde/);
        for (const c of d!.consequences) expect(c).toMatch(new RegExp(`^${d!.nomHeros} (subit|est) `));
        if (d!.consequences.length) {
          avecDegats++;
          expect(d!.typesDegats).toContain('poison');
        }
        expect(res.partie.etat.exploration.pieges[PIEGE]).toBe('declenche');
      } else {
        // Sans spoiler : rien du déclenchement n'est transmis quand le piège ne part pas.
        expect(d!.declenchement).toBeUndefined();
        expect(d!.sauvegarde).toBeUndefined();
        expect(d!.consequences).toEqual([]);
        expect(d!.typesDegats).toEqual([]);
        expect(res.partie.etat.exploration.pieges[PIEGE]).toBe(d!.issue === 'reussi' ? 'desarme' : undefined);
      }
    }
    expect(vus.reussi, 'réussite').toBeGreaterThan(0);
    expect(vus.rate, 'échec').toBeGreaterThan(0);
    expect(vus.declenche, 'déclenchement').toBeGreaterThan(0);
    expect(avecDegats, 'déclenchement avec dégâts').toBeGreaterThan(0);
  });

  it('un déclenchement avec sauvegarde la transmet, celle de la victime seulement', () => {
    // La dalle aux faucilles (cryptes) : sauvegarde de Dextérité DD 13, 2d10 tranchants.
    const id = 'cry-piege-dalle-du-vestibule';
    for (let graine = 1; graine <= 200; graine++) {
      const { moteur, repere } = jeu(graine);
      const avant = repere(id);
      const res = moteur.executer(avant, { type: 'desarmer', piege: id });
      const d = detecterDesamorcage(nouvelles(avant, res.partie), val.pieges.values());
      if (d?.issue !== 'declenche') continue;
      expect(d.mecanisme).toBe('plaque');
      expect(d.sauvegarde?.test).toMatch(/^sauvegarde/);
      expect(d.sauvegarde?.qui).toBe(d.heros);
      expect(d.typesDegats).toContain('tranchant');
      expect(sonDuResultat(d)).toBe('epee');
      return;
    }
    throw new Error('aucune graine ne déclenche la dalle');
  });

  it('un piège non repéré ne s’ouvre pas en écran : le moteur refuse, le détecteur ne voit rien', () => {
    const { moteur, depart } = jeu(7);
    const pg = val.pieges.get(PIEGE)!;
    const avant: Partie = { ...depart, scene: { type: 'exploration' }, etat: { ...depart.etat, lieu: pg.lieu } };
    const res = moteur.executer(avant, { type: 'desarmer', piege: PIEGE });
    expect(res.refus).toBeDefined();
    expect(detecterDesamorcage(nouvelles(avant, res.partie), val.pieges.values())).toBeUndefined();
  });

  it('un journal sans désamorçage (halte, jet libre, crochetage) n’ouvre pas l’écran', () => {
    expect(detecterDesamorcage([], val.pieges.values())).toBeUndefined();
    const autres: EvenementJeu[] = [
      { type: 'jet', jet: { qui: 'bran', nom: 'Bran', test: 'escamotage', dd: 12, des: [14], bonus: 5, total: 19, reussite: true } },
      { type: 'constat', texte: 'Bran crochète le coffre.' },
    ];
    expect(detecterDesamorcage(autres, val.pieges.values())).toBeUndefined();
    // Un constat sans jet qui le précède n'est pas pris pour un désamorçage.
    expect(detecterDesamorcage([{ type: 'constat', texte: 'Bran désamorce la dalle.' }], val.pieges.values())).toBeUndefined();
  });

  it('un piège que le monde ne connaît pas s’affiche quand même, avec les rouages', () => {
    const jet = { qui: 'bran', nom: 'Bran', test: 'escamotage', dd: 12, des: [14], bonus: 5, total: 19, reussite: true };
    const d = detecterDesamorcage([{ type: 'jet', jet }, { type: 'constat', texte: 'Bran désamorce Le truc.' }], []);
    expect(d?.mecanisme).toBe('rouages');
    expect(d?.issue).toBe('reussi');
  });
});
