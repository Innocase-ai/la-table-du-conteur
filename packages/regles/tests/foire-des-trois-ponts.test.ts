// La Foire des Trois Ponts (épisode pilote) : chaque fin arrive par ses boutons (le joueur automatique sature sur ce monde), les trois quêtes
// s'accomplissent, le moulin ne se contourne pas, le dilemme n'offre que ce que le groupe a gagné.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type DonneesMonde, type Partie } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { appliquerEffets, epilogueDeFin } from '../src/monde/etat';
import { validerMonde } from '../src/monde/validation';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(RACINE_MONDES, 'la-foire-des-trois-ponts'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde as DonneesMonde;
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);

/** Le groupe au départ de l'épisode (niveau 1, six héros), au lieu indiqué. */
function depart(lieu = 'verdelle', graine = 11): Partie {
  const g = groupeConseille(1, srd, 6).emplacements.map((e) => {
    const f = bilanPersonnage(e!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  let p = moteur.executer(moteur.nouvellePartie(g, { graine, niveau: 1 }), { type: 'commencer' }).partie;
  p.etat.heros = p.groupe.map(() => ({ historique: 'sage', espece: 'humain', classe: 'guerrier' }));
  p.etat.lieu = lieu;
  p.etat.lieuxVisites.push(lieu);
  return p;
}
const donner = (p: Partie, ...effets: Parameters<typeof appliquerEffets>[0]) => appliquerEffets(effets, p.etat, dm);
const parler = (p: Partie, pnj: string, sujet: string) => {
  p.scene = { type: 'dialogue', pnj };
  return moteur.executer(p, { type: 'parler', pnj, sujet });
};
/** Le groupe quitte la conversation : on ne tranche un dilemme qu'en exploration. */
const sortir = (p: Partie): Partie => ((p.scene = { type: 'exploration' }), p);
const statut = (p: Partie, q: string) => p.etat.quetes[q]?.statut;
const boutonsDilemme = (p: Partie) => moteur.propositions(p).filter((x) => x.groupe.id === 'dilemme:qui-doit-payer');
const options = (p: Partie) => boutonsDilemme(p).map((x) => (x.ordre as { option?: string }).option);
const trancher = (p: Partie, option: string) => moteur.executer(p, { type: 'trancher', dilemme: 'qui-doit-payer', option });
const epilogue = (p: Partie) => epilogueDeFin(dm.fins.get(p.etat.fin!)!, p.etat);

/** Le groupe à la halle du bailli, la clé en main, la quête principale lancée par Aubin. */
function halleAvecLaCle(graine = 11): Partie {
  const p = depart('ver-bailli-salle', graine);
  const res = parler(p, 'aubin-cerfeuil', 'aubin-cle');
  expect(res.refus, 'aubin-cle').toBeUndefined();
  donner(res.partie, { objet: { id: 'cle-du-coffre-de-la-foire' } });
  return res.partie;
}

describe('La Foire des Trois Ponts : le monde', () => {
  it('se valide sans erreur', () => {
    expect(validerMonde(dm, srd).erreurs).toEqual([]);
  });

  it('a deux fins, chacune avec un épilogue, et aucune dont la condition est vraie au départ', () => {
    expect([...dm.fins.keys()].sort()).toEqual(['fin-scandale', 'fin-silence']);
    const p = depart();
    expect(p.etat.fin).toBeUndefined();
    for (const f of dm.fins.values()) expect(f.epilogue.length).toBeGreaterThan(300);
  });
});

describe('La Foire des Trois Ponts : la quête principale et le dénouement', () => {
  it('Aubin confie la quête ; elle se lance par son sujet', () => {
    const p = depart('ver-bailli-salle');
    expect(statut(p, 'q-la-cle-de-la-foire')).toBeUndefined();
    expect(statut(parler(p, 'aubin-cerfeuil', 'aubin-cle').partie, 'q-la-cle-de-la-foire')).toBe('active');
  });

  it('rendre la clé : +60 po, la clé quitte le sac, le dilemme « qui doit payer ? » s’ouvre ; l’abstention est toujours offerte', () => {
    const p = halleAvecLaCle();
    const avant = p.etat.pieces;
    const res = parler(p, 'aubin-cerfeuil', 'aubin-rendre');
    expect(res.refus).toBeUndefined();
    const q = sortir(res.partie);
    expect(q.etat.pieces).toBe(avant + 60);
    expect(q.etat.inventaire['cle-du-coffre-de-la-foire'] ?? 0).toBe(0);
    expect(q.etat.flags['cle-rendue']).toBe(true);
    expect(options(q)).toContain('abstention');
    expect(q.etat.fin).toBeUndefined();
  });

  it('rapportée sans avoir accepté la quête, la clé est payée et la quête s’accomplit quand même (cas limite V4)', () => {
    const p = depart('ver-bailli-salle');
    donner(p, { objet: { id: 'cle-du-coffre-de-la-foire' } });
    const res = parler(p, 'aubin-cerfeuil', 'aubin-rendre');
    expect(res.refus).toBeUndefined();
    expect(statut(res.partie, 'q-la-cle-de-la-foire')).toBe('active');
    expect(res.partie.etat.flags['cle-rendue']).toBe(true);
  });

  it('sans preuve ni argent, ni le scandale ni le silence ne sont offerts ; l’abstention mène à fin-silence (variante « dette due »)', () => {
    const q = sortir(parler(halleAvecLaCle(), 'aubin-cerfeuil', 'aubin-rendre').partie);
    expect(options(q)).not.toContain('scandale');
    expect(options(q)).not.toContain('silence');
    const res = trancher(q, 'abstention');
    expect(res.refus).toBeUndefined();
    expect(res.partie.etat.fin).toBe('fin-silence');
    expect(res.partie.etat.flags['choix-qui-doit-payer-abstention']).toBe(true);
    expect(epilogue(res.partie)).toBe(dm.fins.get('fin-silence')!.variantes[0]!.epilogue);
    expect(statut(res.partie, 'q-la-cle-de-la-foire')).toBe('terminee');
    expect(res.partie.etat.inventaire['perche-d-equilibriste']).toBe(1);
  });

  it('fin-silence (payé) : connaître la dette et avoir 90 po ouvre le silence ; il coûte 90 po et ne ferme personne', () => {
    const q = sortir(parler(halleAvecLaCle(), 'aubin-cerfeuil', 'aubin-rendre').partie);
    donner(q, { fait: 'f-gedeon-et-la-dette' });
    q.etat.pieces = 80; // moins de 90 : le silence est grisé
    expect(trancher(q, 'silence').refus).toBeDefined();
    q.etat.pieces = 120;
    const res = trancher(q, 'silence');
    expect(res.refus).toBeUndefined();
    expect(res.partie.etat.fin).toBe('fin-silence');
    expect(res.partie.etat.pieces).toBe(30);
    expect(epilogue(res.partie)).toBe(dm.fins.get('fin-silence')!.epilogue);
    expect(res.partie.etat.pnjEtats['tobie-pivoine']).toBeUndefined();
  });

  it('fin-scandale : la reconnaissance de dette (ou le témoignage de l’homme de main) ouvre le scandale ; Gédéon, Tobie et Mère Pivoine partent', () => {
    for (const preuve of [{ objet: { id: 'reconnaissance-de-dette' } }, { fait: 'f-gedeon-a-engage-la-bande' }] as const) {
      const q = sortir(parler(halleAvecLaCle(), 'aubin-cerfeuil', 'aubin-rendre').partie);
      donner(q, preuve);
      const res = trancher(q, 'scandale');
      expect(res.refus).toBeUndefined();
      expect(res.partie.etat.fin).toBe('fin-scandale');
      for (const id of ['gedeon-marchebise', 'tobie-pivoine', 'mere-pivoine']) expect(res.partie.etat.pnjEtats[id]).toBe('parti');
      expect(res.partie.etat.attitudes['gedeon-marchebise']).toBeLessThanOrEqual(-100);
      expect(epilogue(res.partie)).toBe(dm.fins.get('fin-scandale')!.epilogue);
      expect(statut(res.partie, 'q-la-cle-de-la-foire')).toBe('terminee');
    }
  });

  it('les deux échos de campagne ne partent que de leur fin (le silence payé, pas l’abstention)', () => {
    const emet = dm.monde.campagne?.emet ?? [];
    expect(emet.map((e) => e.id).sort()).toEqual(['epi1-gedeon-vengeur', 'epi1-tobie-reconnaissant']);
    const flagsDe = (id: string) => JSON.stringify(emet.find((e) => e.id === id)!.quand);
    expect(flagsDe('epi1-gedeon-vengeur')).toContain('choix-qui-doit-payer-scandale');
    expect(flagsDe('epi1-tobie-reconnaissant')).toContain('choix-qui-doit-payer-silence');
    expect(flagsDe('epi1-tobie-reconnaissant')).not.toContain('abstention');
  });
});

describe('La Foire des Trois Ponts : le moulin ne se contourne pas', () => {
  it('sans la quête principale, la route du moulin est fermée ; avec elle, elle s’ouvre', () => {
    const p = depart('verdelle');
    const sans = moteur.executer(p, { type: 'aller', vers: 'mou-pont-du-meunier' });
    expect(sans.refus ?? sans.partie.etat.lieu).not.toBe('mou-pont-du-meunier');
    expect(sans.partie.etat.lieu).toBe('verdelle');
    donner(p, { quete: { id: 'q-la-cle-de-la-foire', statut: 'active' } });
    const avec = moteur.executer(p, { type: 'aller', vers: 'mou-pont-du-meunier' });
    expect(avec.refus).toBeUndefined();
    expect(avec.partie.etat.lieu).toBe('mou-pont-du-meunier');
  });

  it('on ne passe de la cour à la salle des meules ni de la salle au grenier sans avoir réglé les rencontres', () => {
    const p = depart('mou-cour');
    donner(p, { quete: { id: 'q-la-cle-de-la-foire', statut: 'active' } });
    const salle = moteur.executer(p, { type: 'aller', vers: 'mou-salle-des-meules' });
    expect(salle.partie.etat.lieu).toBe('mou-cour');
    const q = depart('mou-salle-des-meules');
    const grenier = moteur.executer(q, { type: 'aller', vers: 'mou-grenier' });
    expect(grenier.partie.etat.lieu).toBe('mou-salle-des-meules');
  });
});

describe('La Foire des Trois Ponts : les quêtes secondaires', () => {
  it('les rats de la cave : Colombe confie, la victoire règle, Colombe offre la nuit et la quête se termine', () => {
    let p = depart('ver-heron-salle');
    p = parler(p, 'colombe-tisserand', 'colombe-rats').partie;
    expect(statut(p, 'q-les-rats-de-la-cave')).toBe('active');
    donner(p, { quete: { id: 'q-les-rats-de-la-cave', statut: 'active' } });
    p.scene = { type: 'rencontre', rencontre: 'r-rats-de-la-cave' };
    p = moteur.executer(p, { type: 'reglerRencontre', issue: 'victoire' }).partie;
    p = parler(p, 'colombe-tisserand', 'colombe-rats-fait').partie;
    expect(p.etat.flags['q-les-rats-de-la-cave-rendue']).toBe(true);
    expect(p.etat.flags['nuit-offerte']).toBe(true);
    expect(statut(p, 'q-les-rats-de-la-cave')).toBe('terminee');
  });

  it('les rats tués avant d’avoir la quête : Colombe remercie quand même et la quête se termine (cas limite V4)', () => {
    let p = depart('ver-heron-salle');
    p.scene = { type: 'rencontre', rencontre: 'r-rats-de-la-cave' };
    p = moteur.executer(p, { type: 'reglerRencontre', issue: 'victoire' }).partie;
    p = parler(p, 'colombe-tisserand', 'colombe-rats-fait').partie;
    expect(statut(p, 'q-les-rats-de-la-cave')).toBe('terminee');
  });

  it('le colis du forgeron : Brun confie, Mère Pivoine reçoit (reçu), Brun reprend le reçu : 10 po et la corde, quête terminée', () => {
    let p = depart('ver-forge');
    p = parler(p, 'brun-forgefer', 'brun-colis').partie;
    expect(statut(p, 'q-le-colis-du-forgeron')).toBe('active');
    donner(p, { objet: { id: 'colis-de-brun' } }); // le coffre piégé est ouvert (crochetage et piège : voir le trésor `ver-tre-colis`)
    p.etat.lieu = 'pon-roulotte';
    p = parler(p, 'mere-pivoine', 'mp-colis').partie;
    expect(p.etat.inventaire['colis-de-brun'] ?? 0).toBe(0);
    expect(p.etat.inventaire['recu-de-mere-pivoine']).toBe(1);
    expect(p.etat.flags['colis-remis-a-mere-pivoine']).toBe(true);
    p.etat.lieu = 'ver-forge';
    const po = p.etat.pieces;
    p = parler(p, 'brun-forgefer', 'brun-recu').partie;
    expect(statut(p, 'q-le-colis-du-forgeron')).toBe('terminee');
    expect(p.etat.pieces).toBe(po + 10);
    expect(p.etat.inventaire['corde-de-funambule']).toBe(1);
  });

  it('le coffre du colis s’ouvre en le crochetant (DD 12) une fois la quête lancée : puis on le prend : le colis arrive dans le sac', () => {
    let ouvert = false;
    for (let graine = 1; graine <= 40 && !ouvert; graine++) {
      const p = parler(depart('ver-forge', graine), 'brun-forgefer', 'brun-colis').partie;
      sortir(p);
      donner(p, { objet: { id: 'outils-de-voleur' } });
      const res = moteur.executer(p, { type: 'ouvrir', cible: { tresor: 'ver-tre-colis' }, methode: 'crocheter' });
      const pris = moteur.executer(res.partie, { type: 'prendre', tresor: 'ver-tre-colis' });
      if ((pris.partie.etat.inventaire['colis-de-brun'] ?? 0) > 0) ouvert = true;
    }
    expect(ouvert).toBe(true);
  });

  it('le coffre du colis n’existe que quête active', () => {
    const t = dm.tresors.get('ver-tre-colis')!;
    expect(JSON.stringify(t.condition)).toContain('q-le-colis-du-forgeron');
  });
});

describe('La Foire des Trois Ponts : l’enquête', () => {
  it('deux indices parmi quatre déduisent que Tobie a pris la clé ; un seul ne suffit pas', () => {
    const p = depart('verdelle');
    donner(p, { fait: 'f-noeud-de-funambule' });
    p.etat.lieu = 'ver-bailli-salle';
    const un = parler(p, 'aubin-cerfeuil', 'aubin-foire').partie;
    expect(un.etat.faits).not.toContain('f-tobie-a-vole-la-cle');
    donner(un, { fait: 'f-trace-de-corde-au-cabinet' });
    const deux = parler(un, 'aubin-cerfeuil', 'aubin-forains').partie;
    expect(deux.etat.faits).toContain('f-tobie-a-vole-la-cle');
  });

  it('Tobie ne dit rien tant qu’on ne l’a pas trouvé, puis parle ; l’aveu s’ouvre au colis remis et donne le porte-bonheur', () => {
    const tobie = dm.pnj.get('tobie-pivoine')!;
    const aveu = tobie.sujets.find((s) => s.id === 'tb-aveu')!;
    expect(JSON.stringify(aveu.condition)).toContain('f-tobie-dans-la-roulotte');
    let p = depart('pon-roulotte');
    donner(p, { fait: 'f-tobie-dans-la-roulotte' }, { flag: 'colis-remis-a-mere-pivoine' });
    p = parler(p, 'tobie-pivoine', 'tb-aveu').partie;
    expect(p.etat.faits).toEqual(expect.arrayContaining(['f-tobie-a-vole-la-cle', 'f-cle-au-grenier', 'f-gedeon-et-la-dette']));
    expect(p.etat.inventaire['porte-bonheur-de-funambule']).toBe(1);
    expect(p.etat.flags['tobie-confie']).toBe(true);
  });
});
