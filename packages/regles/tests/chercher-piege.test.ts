// F1 (PRD-SAGA) — les verbes en deux étages : fouiller la pièce, chercher un piège (jet, DD secret, une tentative par héros et par
// cible), désamorcer, crocheter, ouvrir, prendre. Le drapeau de monde `piegesACherche` rend l'étage « chercher » obligatoire ;
// sans lui, le monde se joue à l'identique (P1, P2). Monde d'essai : Le Val des Cendres, dont le cellier du bailli porte un
// coffret verrouillé ET piégé (c'est la pièce de F1 : aucun monde publié n'en a un).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  chercherPiege,
  creerMoteur,
  etatInitial,
  fouiller,
  herosPreTires,
  MODULES_STANDARD,
  nouvellePartie,
  ouvrir,
  outilsDuConteur,
  personnageDepuisFiche,
  Tresor,
  VERSION_PARTIE,
  type DonneesMonde,
  type Generateur,
  type Partie,
  type PartieMonde,
  type Personnage,
  type Proposition,
} from '../src';
import { chargerMonde } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();

function charger(drapeau: boolean): DonneesMonde {
  const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  r.monde.monde.piegesACherche = drapeau;
  return r.monde;
}
/** Le même monde, avec et sans le drapeau (deux chargements : chacun a ses propres données). */
const ancien = charger(false);
const nouveau = charger(true);

/** Dés imposés : 0.999 donne 20 sur un d20, 0 donne 1. */
const des = (v: number): Generateur => () => v;
const SUCCES = des(0.999);
const ECHEC = des(0);

const CELLIER = 'vei-cellier-du-bailli';
const COFFRET = 'vei-t-plancher-du-bailli';
const PIEGE = 'vei-p-aiguille-du-coffret';
const FOYER = 'vei-foyer-de-la-lanterne';
const PIEGE_LIBRE = 'vei-p-souffle-de-la-flamme';

function groupe(bonus?: number): Personnage[] {
  return herosPreTires(srd).map((h) => {
    if (bonus !== undefined) for (const c of ['perception', 'investigation', 'escamotage'] as const) h.fiche.competences[c] = { ...h.fiche.competences[c], bonus };
    return personnageDepuisFiche(h.fiche, { id: h.fiche.nom.toLowerCase(), outils: h.fiche.nom === 'Pip' ? ['outils-de-voleur'] : [] });
  });
}

/** Au niveau du monde (sans noyau) : le groupe est dans le lieu demandé. */
function enPartie(dm: DonneesMonde, lieu: string, gen: Generateur = SUCCES): PartieMonde {
  const p = nouvellePartie(dm, etatInitial(dm, 3), groupe(), gen);
  p.etat.lieu = lieu;
  return p;
}

/** Au niveau du noyau (propositions, ordres) : le groupe est dans le lieu demandé, avec des bonus qui garantissent les jets. */
function enJeu(dm: DonneesMonde, lieu: string, bonus = 25): { moteur: ReturnType<typeof creerMoteur>; p: Partie } {
  const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
  let p = moteur.executer(moteur.nouvellePartie(groupe(bonus), { graine: 5, niveau: 3 }), { type: 'commencer' }).partie;
  p.etat.lieu = lieu;
  p.etat.inventaire['outils-de-voleur'] = 1;
  return { moteur, p };
}

const libelles = (props: Proposition[]) => props.map((x) => x.libelle);
const trouvePiege = (p: PartieMonde | Partie) => p.etat.exploration.decouverts.includes(`piege:${PIEGE}`);

describe('sans le drapeau, le monde se joue comme avant (P1, P2)', () => {
  it('la fouille du cellier révèle toujours le piège du coffret', () => {
    const p = enPartie(ancien, CELLIER, SUCCES);
    expect(fouiller(p).constats.join(' ')).toMatch(/piège/);
    expect(trouvePiege(p)).toBe(true);
  });

  it('chercherPiege est refusé, aucun bouton ne l’annonce, et l’état n’a pas de champ nouveau', () => {
    const p = enPartie(ancien, CELLIER);
    const r = chercherPiege(p, { tresor: COFFRET });
    expect(r.ok).toBe(false);
    expect(r.refus).toMatch(/révèle déjà les pièges/);
    expect(p.etat.exploration.recherches).toBeUndefined();

    const { moteur, p: partie } = enJeu(ancien, CELLIER);
    expect(libelles(moteur.propositions(partie)).some((l) => /piège/i.test(l) && l.startsWith('Chercher'))).toBe(false);
    const ordre = moteur.executer(partie, { type: 'chercherPiege', cible: { tresor: COFFRET } });
    expect(ordre.refus).toBeDefined();
  });
});

describe('avec le drapeau : la fouille ne révèle plus les pièges', () => {
  it('même avec un 20 au dé et une perception passive énorme, le piège du coffret reste caché', () => {
    const p = enPartie(nouveau, CELLIER, SUCCES);
    for (const a of p.groupe) a.fiche.perceptionPassive = 40;
    const f = fouiller(p);
    expect(trouvePiege(p)).toBe(false);
    expect(f.constats.join(' ')).not.toMatch(/piège/);
  });

  it('le monde ne change pas pour le reste : les trésors cachés et les indices se trouvent toujours à la fouille', () => {
    const p = enPartie(nouveau, 'vei-halle-du-bailli', SUCCES);
    const f = fouiller(p);
    expect(f.constats.join(' ')).toMatch(/trouve/); // la trappe vers le cellier
  });
});

describe('chercherPiege', () => {
  it('sur le coffret : réussite = piège repéré, désamorcer devient possible ; le journal ne garde pas le DD', () => {
    const p = enPartie(nouveau, CELLIER, SUCCES);
    const r = chercherPiege(p, { tresor: COFFRET });
    expect(r.ok).toBe(true);
    expect(r.constats.join(' ')).toMatch(/repère un piège sur le coffret/);
    expect(trouvePiege(p)).toBe(true);
    expect(r.jets).toHaveLength(1);
    expect(r.jets[0]!.ddSecret).toBe(true);
    expect(r.jets[0]!.dd).toBe(0);
    expect(r.jets[0]!.reussite).toBe(true);
    expect(['perception', 'investigation']).toContain(r.jets[0]!.test);
  });

  it('échec : « rien de suspect », jamais « pas de piège » ; le même constat que sur un contenant sans piège', () => {
    const p = enPartie(nouveau, CELLIER, ECHEC);
    nouveau.tresors.set(
      't-essai-sans-piege',
      Tresor.parse({ id: 't-essai-sans-piege', nom: 'Le coffret sous le plancher du bailli', lieu: CELLIER, contenant: 'coffre', description: 'Un coffret ordinaire.', contenu: { pieces: { po: 1 } }, acces: {} }),
    );
    try {
      const piege = chercherPiege(p, { tresor: COFFRET }, 'bran');
      const sans = chercherPiege(p, { tresor: 't-essai-sans-piege' }, 'bran');
      expect(piege.constats).toHaveLength(1);
      expect(piege.constats[0]).toMatch(/ne remarque rien de suspect/);
      expect(piege.constats.join(' ')).not.toMatch(/pas de piège|aucun piège|sans piège/i);
      // Même phrase, même forme de jet : rien ne distingue un contenant piégé d'un contenant sain.
      expect(sans.constats).toEqual(piege.constats);
      expect({ ...sans.jets[0]!, des: [], total: 0 }).toEqual({ ...piege.jets[0]!, des: [], total: 0 });
      expect(trouvePiege(p)).toBe(false);
    } finally {
      nouveau.tresors.delete('t-essai-sans-piege');
    }
  });

  it('une tentative par héros et par cible : le même héros ne retente pas, un autre peut, puis le groupe a tout essayé', () => {
    const p = enPartie(nouveau, CELLIER, ECHEC);
    expect(chercherPiege(p, { tresor: COFFRET }, 'bran').ok).toBe(true);
    const encore = chercherPiege(p, { tresor: COFFRET }, 'bran');
    expect(encore.ok).toBe(false);
    expect(encore.refus).toMatch(/a déjà cherché/);
    expect(encore.jets).toHaveLength(0);
    // Sans désigner personne, le moteur prend le meilleur de ceux qui n'ont pas encore cherché : jamais Bran.
    const suivant = chercherPiege(p, { tresor: COFFRET });
    expect(suivant.ok).toBe(true);
    expect(suivant.jets[0]!.qui).not.toBe('bran');
    // Une autre cible n'est pas touchée par la limite.
    expect(chercherPiege(p, { piece: true }, 'bran').ok).toBe(true);
    // Tout le groupe finit par avoir cherché sur le coffret : plus rien à tenter, dit sans révéler quoi que ce soit.
    let n = 0;
    while (chercherPiege(p, { tresor: COFFRET }).ok) n++;
    expect(n).toBe(p.groupe.length - 2);
    const fin = chercherPiege(p, { tresor: COFFRET });
    expect(fin.refus).toMatch(/Chacun a déjà cherché/);
    expect(p.etat.exploration.recherches!.filter((x) => x.startsWith(`tresor:${COFFRET}:`))).toHaveLength(p.groupe.length);
  });

  it('un héros à terre ne cherche pas, un inconnu non plus', () => {
    const p = enPartie(nouveau, CELLIER);
    p.groupe.find((a) => a.id === 'bran')!.pv = 0;
    expect(chercherPiege(p, { tresor: COFFRET }, 'bran').ok).toBe(false);
    expect(chercherPiege(p, { tresor: COFFRET }, 'personne').ok).toBe(false);
    expect(chercherPiege(p, { tresor: 'n-existe-pas' }).refus).toMatch(/rien de tel/);
  });

  it('un piège déjà repéré n’est plus cherché (désamorcer est là) ; le dire ne cache rien', () => {
    const p = enPartie(nouveau, CELLIER, SUCCES);
    expect(chercherPiege(p, { tresor: COFFRET }).ok).toBe(true);
    expect(chercherPiege(p, { tresor: COFFRET }).refus).toMatch(/déjà connu/);
  });

  it('dans la pièce : trouve le piège libre d’un lieu, mais pas celui d’un contenant (qui se cherche sur lui)', () => {
    const foyer = enPartie(nouveau, FOYER, SUCCES);
    for (const a of foyer.groupe) a.fiche.competences.perception = { ...a.fiche.competences.perception, bonus: 20 };
    expect(chercherPiege(foyer, { piece: true }).constats.join(' ')).toMatch(/repère un piège dans la pièce/);
    expect(foyer.etat.exploration.decouverts).toContain(`piege:${PIEGE_LIBRE}`);

    const cellier = enPartie(nouveau, CELLIER, SUCCES);
    const r = chercherPiege(cellier, { piece: true });
    expect(r.constats[0]).toMatch(/rien de suspect dans la pièce/);
    expect(trouvePiege(cellier)).toBe(false);
  });
});

describe('un piège non cherché se déclenche à l’ouverture', () => {
  it('crocheter le coffret sans avoir cherché : l’aiguille part, même si le crochetage réussit', () => {
    const p = enPartie(nouveau, CELLIER, SUCCES);
    p.etat.inventaire['outils-de-voleur'] = 1;
    const r = ouvrir(p, { tresor: COFFRET }, 'crocheter', 'pip');
    expect(p.etat.exploration.ouverts).toContain(`tresor:${COFFRET}`);
    expect(p.etat.exploration.pieges[PIEGE]).toBe('declenche');
    expect(r.narrations.join(' ')).toMatch(/aiguille/);
  });
});

describe('de bout en bout : pièce → contenant → piège → désarmement → crochetage → butin', () => {
  it('le joueur fouille, repère le coffret, cherche un piège, le désamorce, crochète, ouvre et prend', () => {
    const { moteur, p: depart } = enJeu(nouveau, CELLIER);
    let p = depart;
    const piecesAvant = p.etat.pieces;

    // 1. Fouiller la pièce : le coffret est déjà visible, le piège ne l'est pas.
    p = moteur.executer(p, { type: 'fouiller' }).partie;
    expect(moteur.vue<{ pieges: unknown[]; tresors: { id: string }[] }>('scene', p).pieges).toHaveLength(0);
    expect(moteur.vue<{ tresors: { id: string }[] }>('scene', p).tresors.map((t) => t.id)).toContain(COFFRET);
    expect(libelles(moteur.propositions(p))).not.toContain('Désamorcer');

    // 2. Le contenant propose de chercher un piège, avec le héros par défaut et son bonus ; aucun DD.
    const chercher = moteur.propositions(p).find((x) => x.ordre?.type === 'chercherPiege' && (x.ordre.cible as { tresor?: string }).tresor === COFFRET)!;
    expect(chercher.libelle).toBe('Chercher un piège');
    expect(chercher.element?.id).toBe(`tresor:${COFFRET}`);
    expect(chercher.jet?.dd).toBeUndefined();
    expect(chercher.jet?.bonus).toBe(25);
    expect(chercher.acteurs?.length).toBe(p.groupe.length);

    // 3. Chercher : piège trouvé, Désamorcer apparaît.
    const c = moteur.executer(p, chercher.ordre!);
    expect(c.refus).toBeUndefined();
    p = c.partie;
    expect(trouvePiege(p)).toBe(true);
    const desamorcer = moteur.propositions(p).find((x) => x.libelle === 'Désamorcer')!;
    expect(desamorcer).toBeDefined();
    // Le même bouton n'est plus proposé sur ce coffret (le piège est connu).
    expect(moteur.propositions(p).some((x) => x.ordre?.type === 'chercherPiege' && (x.ordre.cible as { tresor?: string }).tresor === COFFRET)).toBe(false);

    // 4. Désamorcer.
    p = moteur.executer(p, desamorcer.ordre!).partie;
    expect(p.etat.exploration.pieges[PIEGE]).toBe('desarme');

    // 5. Crocheter : le coffret s'ouvre et personne n'est blessé.
    const crocheter = moteur.propositions(p).find((x) => x.libelle === 'Crocheter' && x.element?.id === `tresor:${COFFRET}`)!;
    const pvAvant = p.groupe.map((h) => h.pv);
    p = moteur.executer(p, crocheter.ordre!).partie;
    expect(p.etat.exploration.ouverts).toContain(`tresor:${COFFRET}`);
    expect(p.groupe.map((h) => h.pv)).toEqual(pvAvant);

    // 6. Prendre : le butin du coffret.
    const prendre = moteur.propositions(p).find((x) => x.libelle === 'Prendre' && x.element?.id === `tresor:${COFFRET}`)!;
    p = moteur.executer(p, prendre.ordre!).partie;
    expect(p.etat.exploration.tresorsPris).toContain(COFFRET);
    expect(p.etat.pieces).toBe(piecesAvant + 85);
    expect(p.etat.inventaire['vei-double-registre']).toBe(1);
  });

  it('le bouton « Chercher des pièges » de la pièce existe aussi, et se grise quand chacun a cherché', () => {
    const { moteur, p } = enJeu(nouveau, FOYER);
    const bouton = (x: Partie) => moteur.propositions(x).find((q) => q.ordre?.type === 'chercherPiege' && (q.ordre.cible as { piece?: boolean }).piece)!;
    expect(bouton(p).libelle).toBe('Chercher des pièges');
    expect(bouton(p).desactivee).toBeUndefined();
    let q = p;
    for (let i = 0; i < p.groupe.length; i++) q = moteur.executer(q, bouton(q).ordre!).partie;
    expect(bouton(q).desactivee).toMatch(/Chacun a déjà cherché/);
  });
});

describe('le conteur et les sauvegardes', () => {
  it('la liste d’outils du conteur est la même avec et sans le drapeau, et contient chercherPiege', () => {
    const a = outilsDuConteur(creerMoteur({ dm: ancien, srd }, MODULES_STANDARD));
    const b = outilsDuConteur(creerMoteur({ dm: nouveau, srd }, MODULES_STANDARD));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.map((o) => o.function.name)).toContain('chercherPiege');
  });

  it('VERSION_PARTIE reste 4 : le champ `recherches` est facultatif et se recharge tel quel', () => {
    expect(VERSION_PARTIE).toBe(4);
    const { moteur, p } = enJeu(nouveau, CELLIER);
    const apres = moteur.executer(p, { type: 'chercherPiege', cible: { tresor: COFFRET } }).partie;
    expect(apres.etat.exploration.recherches?.length).toBe(1);
    const rechargee = JSON.parse(JSON.stringify(apres)) as Partie;
    expect(rechargee.etat.exploration.recherches).toEqual(apres.etat.exploration.recherches);
    // Une ancienne sauvegarde n'a pas le champ : elle se joue, la première tentative le crée.
    const vieille = JSON.parse(JSON.stringify(p)) as Partie;
    delete vieille.etat.exploration.recherches;
    expect(moteur.executer(vieille, { type: 'chercherPiege', cible: { piece: true } }).refus).toBeUndefined();
  });
});

