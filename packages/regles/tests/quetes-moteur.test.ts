// Le moteur générique des quêtes : échec avec conséquences, récompenses calculées, journal (lieu de l'étape, étapes faites),
// objectifs sur la carte et dans les sorties, signes « ! » / « ? » au-dessus des PNJ. Sur le vrai monde publié, modifié en mémoire.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  appliquerEffets,
  bilanPersonnage,
  carteDuMonde,
  creerMoteur,
  echouerQuete,
  etatInitial,
  ficheDeScene,
  groupeConseille,
  lieuxObjectifs,
  MODULES_STANDARD,
  nouvellePartie,
  personnageDepuisFiche,
  pnjPresents,
  recompensesDeQuete,
  signeDeQuete,
  sortiesDe,
  sujetsDisponibles,
  validerMonde,
  type DonneesMonde,
  type Partie,
} from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const QUETE = 'q-le-cor-du-moulin';

function marche(): DonneesMonde {
  const r = chargerMonde(join(RACINE_MONDES, 'marche-d-ombrefiel'));
  if (!r.ok) throw new Error('monde illisible');
  return r.monde;
}

function partie(dm: DonneesMonde): Partie {
  const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
  const g = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  const p = moteur.executer(moteur.nouvellePartie(g, { graine: 3, niveau: 1 }), { type: 'commencer' }).partie;
  // Le départ ouvre sur une rencontre : on la considère réglée pour explorer l'auberge (Brégor y est).
  if (p.scene.type === 'rencontre') p.etat.rencontresFaites.push(p.scene.rencontre);
  return { ...p, scene: { type: 'exploration' } };
}

describe('échec d’une quête', () => {
  it('raconte l’échec, applique ses conséquences une seule fois, et la quête ne se rouvre pas', () => {
    const dm = marche();
    const def = dm.quetes.get(QUETE)!;
    def.echec = { texte: 'Le cor s’est tu pour de bon.', effets: [{ flag: 'cor-perdu' }, { pieces: -2 }] };
    const e = etatInitial(dm);
    appliquerEffets([{ quete: { id: QUETE, statut: 'active' } }], e, dm);
    e.pieces = 10;
    const pieces = e.pieces;
    appliquerEffets([{ quete: { id: QUETE, statut: 'echouee' } }], e, dm);
    echouerQuete(QUETE, e, dm);
    expect(e.quetes[QUETE]!.statut).toBe('echouee');
    expect(e.quetes[QUETE]!.actives).toEqual([]);
    expect(e.flags['cor-perdu']).toBe(true);
    expect(e.pieces).toBe(pieces - 2);
    expect(e.narrations.filter((n) => n === 'Le cor s’est tu pour de bon.')).toHaveLength(1);
    appliquerEffets([{ quete: { id: QUETE, statut: 'active' } }], e, dm);
    expect(e.quetes[QUETE]!.statut).toBe('echouee');
  });

  it('une étape dont la condition d’échec est remplie fait échouer la quête avec ses conséquences', () => {
    const dm = marche();
    const def = dm.quetes.get(QUETE)!;
    def.echec = { effets: [{ flag: 'cor-perdu' }] };
    def.etapes.find((x) => x.id === def.debut)!.echec = { flag: 'test-echec' };
    const e = etatInitial(dm);
    appliquerEffets([{ quete: { id: QUETE, statut: 'active' } }], e, dm);
    appliquerEffets([{ flag: 'test-echec' }], e, dm);
    expect(e.quetes[QUETE]!.statut).toBe('echouee');
    expect(e.flags['cor-perdu']).toBe(true);
  });
});

describe('récompenses calculées', () => {
  it('additionne récompenses et effets des étapes (PX, or gagné, objets donnés), sans l’or payé ni les objets retirés', () => {
    const dm = marche();
    const def = structuredClone(dm.quetes.get(QUETE)!);
    def.recompenses = { ...def.recompenses, xp: 100, pieces: 5, objets: ['a'], effets: [{ xp: 10 }], annonce: 'Une faveur du meunier' };
    def.etapes = def.etapes.map((x, i) => ({ ...x, effets: i === 0 ? [{ xp: 50 }, { pieces: 10 }, { pieces: -3 }, { objet: { id: 'b' } }, { objet: { id: 'c', retirer: true } }] : [] }));
    expect(recompensesDeQuete(def)).toEqual({ xp: 160, pieces: 15, objets: ['a', 'b'], annonce: 'Une faveur du meunier' });
  });
});

describe('objectifs et signes', () => {
  /** La première étape de la quête se joue dans un lieu voisin du départ ; la quête est en cours. */
  function avecObjectif() {
    const dm = marche();
    const p = partie(dm);
    const voisin = sortiesDe({ dm, etat: p.etat, groupe: p.groupe, gen: () => 0 }, p.etat.lieu).find((s) => !s.cache && dm.lieux.has(s.vers))!.vers;
    const def = dm.quetes.get(QUETE)!;
    def.etapes.find((x) => x.id === def.debut)!.lieu = voisin;
    appliquerEffets([{ quete: { id: QUETE, statut: 'active' } }], p.etat, dm);
    return { dm, p, voisin, def };
  }

  it('le lieu de l’étape et ses ancêtres sont des objectifs, signalés sur la carte et dans les sorties', () => {
    const { dm, p, voisin, def } = avecObjectif();
    const pm = { dm, etat: p.etat, groupe: p.groupe, gen: () => 0 };
    const obj = lieuxObjectifs(pm);
    expect(obj.get(voisin)).toEqual([def.nom]);
    const parent = dm.lieux.get(voisin)!.parent;
    if (parent) expect(obj.get(parent)).toEqual([def.nom]);
    const marqueurs = Object.values(carteDuMonde(pm).vues).flatMap((v) => v.marqueurs);
    expect(marqueurs.find((m) => m.id === voisin)?.objectifs).toEqual([def.nom]);
    const sortie = ficheDeScene(pm).sorties.find((s) => s.vers === voisin)!;
    expect(sortie.objectifs).toEqual([def.nom]);
    expect(sortie.apercu).toContain(`Objectif de quête : ${def.nom}`);
    const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
    expect(moteur.propositions(p).find((x) => x.ordre?.type === 'aller' && (x.ordre as unknown as { vers: string }).vers === voisin)?.signe).toBe('◆');
  });

  it('une quête terminée ou sans lieu d’étape ne marque rien', () => {
    const dm = marche();
    const p = partie(dm);
    appliquerEffets([{ quete: { id: QUETE, statut: 'active' } }], p.etat, dm);
    expect(lieuxObjectifs({ dm, etat: p.etat, groupe: p.groupe, gen: () => 0 }).size).toBe(0);
    const { dm: dm2, p: p2 } = avecObjectif();
    appliquerEffets([{ quete: { id: QUETE, statut: 'terminee' } }], p2.etat, dm2);
    expect(lieuxObjectifs({ dm: dm2, etat: p2.etat, groupe: p2.groupe, gen: () => 0 }).size).toBe(0);
  });

  it('le journal montre le lieu de l’étape, la récompense et les étapes déjà faites', () => {
    const { dm, p, voisin, def } = avecObjectif();
    const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
    const ligne = moteur.encarts(p).find((x) => x.id === 'quetes-en-cours')!.lignes!.find((l) => l.libelle === def.nom)!;
    expect(ligne.detail).toContain(`(${dm.lieux.get(voisin)!.nom})`);
    expect(ligne.fiche!.texte).toContain(`(${dm.lieux.get(voisin)!.nom})`);
    p.etat.quetes[QUETE]!.accomplies.push(def.debut);
    const fiche = moteur.encarts(p).find((x) => x.id === 'quetes-en-cours')!.lignes!.find((l) => l.libelle === def.nom)!.fiche!;
    expect(fiche.texte).toContain(`✓ ${def.etapes.find((x) => x.id === def.debut)!.texte}`);
    const total = recompensesDeQuete(def);
    if (total.xp) expect(fiche.proprietes!.find((x) => x.libelle === 'Récompense')?.valeur).toContain(`${total.xp} PX`);
  });

  it('« ! » sur un PNJ qui confie une quête, « ? » sur celui qui attend un rapport, rien sinon', () => {
    const dm = marche();
    const p = partie(dm);
    p.etat.lieu = dm.pnj.get('bregor-le-borgne')!.lieu;
    const pm = { dm, etat: p.etat, groupe: p.groupe, gen: () => 0 };
    const pnj = pnjPresents(pm).find((n) => sujetsDisponibles(pm, n).length)!;
    expect(pnj, `un PNJ présent à « ${p.etat.lieu} » avec un sujet ouvert (présents : ${pnjPresents(pm).map((n) => n.id).join(', ')})`).toBeTruthy();
    for (const s of pnj.sujets) s.effets = s.effets.filter((x) => !('quete' in x));
    expect(signeDeQuete(pm, pnj)).toBeUndefined();
    const sujet = sujetsDisponibles(pm, pnj)[0]!;
    sujet.effets = [{ quete: { id: QUETE, statut: 'proposee' } }];
    expect(signeDeQuete(pm, pnj)).toBe('!');
    const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
    expect(moteur.propositions(p).find((x) => x.ordre?.type === 'parler' && (x.ordre as unknown as { pnj: string }).pnj === pnj.id)?.signe).toBe('!');
    appliquerEffets([{ quete: { id: QUETE, statut: 'active' } }], p.etat, dm);
    expect(signeDeQuete(pm, pnj)).toBeUndefined();
    sujet.effets = [{ flag: 'rapport' }, { quete: { id: QUETE, statut: 'terminee' } }];
    expect(signeDeQuete(pm, pnj)).toBe('?');
    expect(ficheDeScene(pm).pnj.find((n) => n.id === pnj.id)?.quete).toBe('?');
  });
});

describe('validation', () => {
  it('signale un lieu d’étape inconnu et une référence inconnue dans les conséquences d’un échec', () => {
    const dm = marche();
    const def = dm.quetes.get(QUETE)!;
    def.etapes[0]!.lieu = 'lieu-qui-n-existe-pas';
    def.echec = { effets: [{ quete: { id: 'quete-inconnue', statut: 'active' } }] };
    const erreurs = validerMonde(dm, srd).erreurs.join('\n');
    expect(erreurs).toContain('lieu-qui-n-existe-pas');
    expect(erreurs).toContain('quete-inconnue');
  });
});

// Les anciennes fiches sans `lieu`, `annonce` ni `echec` restent valides (champs optionnels) : le monde publié en est la preuve.
it('le monde publié reste sans erreur', () => {
  const dm = marche();
  expect(validerMonde(dm, srd).erreurs).toEqual([]);
  expect(nouvellePartie).toBeTypeOf('function');
});
