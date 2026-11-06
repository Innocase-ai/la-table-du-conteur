import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type Encart, type Partie } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { validerMonde } from '../src/monde/validation';
import { COMMANDES_HORS_CONTEUR } from '../src/conteur/outils';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(RACINE_MONDES, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));

const DILEMME = {
  id: 'le-deserteur',
  titre: 'Le déserteur',
  situation: 'Un garde blessé vous supplie de le laisser fuir. Ses camarades arrivent.',
  quand: { lieu: 'vei-maison-des-gardiens' },
  delai: 2,
  options: [
    {
      id: 'epargner',
      libelle: 'Je le laisse partir.',
      ton: 'Clémence',
      couts: ['Les Gardiens vous en voudront'],
      gains: ['Il vous doit la vie'],
      effets: [{ reputation: { faction: 'gardiens-de-la-veille', delta: -10 } }, { narration: 'Il disparaît dans la neige.' }],
      epilogue: 'Le déserteur a refait sa vie loin du col.',
    },
    {
      id: 'livrer',
      libelle: 'Je le livre aux Gardiens.',
      ton: 'Loi',
      couts: ['Il sera jugé sans vous écouter'],
      gains: ['Les Gardiens vous respectent'],
      effets: [{ reputation: { faction: 'gardiens-de-la-veille', delta: 10 } }, { jauge: { id: 'cendre', delta: 1 } }],
      epilogue: 'Le déserteur a été pendu au petit matin.',
    },
    {
      id: 'persuader',
      libelle: 'Je plaide sa cause.',
      couts: ['Un jet risqué'],
      gains: ['Tout le monde peut s’en sortir'],
      jet: { competence: 'persuasion', dd: 30 },
      effets: [{ reputation: { faction: 'gardiens-de-la-veille', delta: 5 } }],
      echec: [{ reputation: { faction: 'gardiens-de-la-veille', delta: -5 } }],
    },
  ],
  abstention: { couts: ['On décidera sans vous'], effets: [{ reputation: { faction: 'gardiens-de-la-veille', delta: -3 } }], epilogue: 'Personne ne sait ce qu’il est devenu.' },
  echos: [{ si: 'epargner', apres: 1, annonce: 'Un messager vous apporte un mot du déserteur.', effets: [{ pieces: 20 }] }],
};

const dm = { ...r.monde, extensions: { ...(r.monde.extensions ?? {}), dilemmes: [DILEMME] } };
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);

function depart(): Partie {
  const g = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  let p = moteur.executer(moteur.nouvellePartie(g, { graine: 11, niveau: 3 }), { type: 'commencer' }).partie;
  p = moteur.executer(p, { type: 'terminerScene', scene: 'ouverture' }).partie;
  return p;
}
const ouvert = () => moteur.executer(depart(), { type: 'aller', vers: 'vei-maison-des-gardiens' });
const boutons = (p: Partie) => moteur.propositions(p).filter((x) => x.groupe.id === 'dilemme:le-deserteur');

describe('module Dilemmes', () => {
  it("s'ouvre quand sa condition devient vraie et propose chaque option avec son coût et son gain", () => {
    expect(boutons(depart())).toEqual([]);
    const res = ouvert();
    expect(res.evenements).toContainEqual({ type: 'dilemmeOuvert', dilemme: 'le-deserteur' });
    const b = boutons(res.partie);
    expect(b.map((x) => x.libelle)).toEqual(['Je le laisse partir.', 'Je le livre aux Gardiens.', 'Je plaide sa cause.', 'Je ne tranche pas.']);
    expect(b[0]!.etiquette).toBe('Clémence');
    expect(b[0]!.apercu).toMatch(/Coût : Les Gardiens vous en voudront/);
    expect(b[0]!.apercu).toMatch(/Gain : Il vous doit la vie/);
    expect(b[3]!.apercu).toMatch(/Coût : On décidera sans vous/);
    expect(b[2]!.aide).toMatch(/DD 30/);
    expect(b[0]!.groupe.description).toMatch(/avant le jour 3/);
  });

  it('trancher applique les effets, pose les drapeaux, ferme le choix et nourrit la chronique', () => {
    let p = ouvert().partie;
    const avant = p.etat.reputations['gardiens-de-la-veille'] ?? 0;
    const res = moteur.executer(p, { type: 'trancher', dilemme: 'le-deserteur', option: 'epargner' });
    expect(res.refus).toBeUndefined();
    p = res.partie;
    expect(p.etat.reputations['gardiens-de-la-veille']).toBe(avant - 10);
    expect(p.etat.flags['choix-le-deserteur']).toBe(true);
    expect(p.etat.flags['choix-le-deserteur-epargner']).toBe(true);
    expect(p.etat.flags['choix-le-deserteur-livrer']).toBeUndefined();
    expect(res.evenements).toContainEqual({ type: 'texte', texte: 'Il disparaît dans la neige.' });
    expect(boutons(p)).toEqual([]);
    expect(moteur.executer(p, { type: 'trancher', dilemme: 'le-deserteur', option: 'livrer' }).refus).toMatch(/déjà tranché/);
    const chronique = moteur.encarts(p).find((e) => e.id === 'dilemmes-chronique') as Encart;
    expect(chronique.lignes![0]!.detail).toMatch(/Je le laisse partir/);
    expect(chronique.lignes![0]!.detail).toMatch(/Gain : Il vous doit la vie/);
  });

  it("refuse un choix qui ne se pose pas encore ou une option inconnue", () => {
    expect(moteur.executer(depart(), { type: 'trancher', dilemme: 'le-deserteur', option: 'epargner' }).refus).toMatch(/pas encore/);
    expect(moteur.executer(ouvert().partie, { type: 'trancher', dilemme: 'le-deserteur', option: 'fuir' }).refus).toMatch(/Option inconnue/);
  });

  it("un jet raté n'arrête pas l'histoire : l'échec a ses propres effets", () => {
    const p = ouvert().partie;
    const avant = p.etat.reputations['gardiens-de-la-veille'] ?? 0;
    const res = moteur.executer(p, { type: 'trancher', dilemme: 'le-deserteur', option: 'persuader' });
    expect(res.refus).toBeUndefined();
    expect(res.evenements.some((e) => e.type === 'jet')).toBe(true);
    // DD 30 : un échec est quasi certain, et il coûte quand même quelque chose.
    expect([avant - 5, avant + 5]).toContain(res.partie.etat.reputations['gardiens-de-la-veille']);
    expect(res.partie.etat.flags['choix-le-deserteur-persuader']).toBe(true);
    expect(boutons(res.partie)).toEqual([]);
  });

  it('un écho différé survient plusieurs jours plus tard', () => {
    let p = moteur.executer(ouvert().partie, { type: 'trancher', dilemme: 'le-deserteur', option: 'epargner' }).partie;
    const po = p.etat.pieces;
    // Un jour passe (le repos long fait avancer le calendrier).
    p = { ...p, etat: { ...p.etat, jour: p.etat.jour + 1 } };
    const res = moteur.executer(p, { type: 'aller', vers: 'veillecendre' });
    expect(res.evenements).toContainEqual({ type: 'texte', texte: 'Un messager vous apporte un mot du déserteur.' });
    expect(res.partie.etat.pieces).toBe(po + 20);
  });

  it("le temps presse : faute de décision à temps, l'abstention s'applique d'elle-même", () => {
    let p = ouvert().partie;
    const avant = p.etat.reputations['gardiens-de-la-veille'] ?? 0;
    p = { ...p, etat: { ...p.etat, jour: p.etat.jour + 3 } };
    const res = moteur.executer(p, { type: 'aller', vers: 'veillecendre' });
    expect(res.evenements).toContainEqual({ type: 'dilemmeTranche', dilemme: 'le-deserteur', option: 'abstention', automatique: true });
    expect(res.partie.etat.reputations['gardiens-de-la-veille']).toBe(avant - 3);
    expect(res.partie.etat.flags['choix-le-deserteur-abstention']).toBe(true);
  });

  it('la validation et les conseils repèrent un dilemme mal écrit', () => {
    const module = MODULES_STANDARD.find((m) => m.id === 'dilemmes')!;
    expect(module.valider!({ dm, srd })).toEqual([]);
    const faux = { ...r.monde, extensions: { dilemmes: [{ ...DILEMME, options: [{ ...DILEMME.options[0]!, jet: { competence: 'persuasion', dd: 12 }, echec: undefined }, DILEMME.options[1]!] }] } };
    expect(module.valider!({ dm: faux, srd }).join('\n')).toMatch(/jet raté|échec/);
    const sec = { ...r.monde, extensions: { dilemmes: [{ ...DILEMME, echos: [{ si: 'inconnue', apres: 1 }], options: [DILEMME.options[0], { ...DILEMME.options[1]!, effets: DILEMME.options[0]!.effets }] }] } };
    expect(module.valider!({ dm: sec, srd }).join('\n')).toMatch(/option inconnue « inconnue »/);
    expect(module.conseils!({ dm: sec, srd }).join('\n')).toMatch(/mêmes effets/);
    const sans = { ...r.monde, extensions: { dilemmes: [{ ...DILEMME, echos: [], options: DILEMME.options.map((o) => ({ ...o, epilogue: undefined, effets: [{ flag: 'x' }] })) }] } };
    const avis = module.conseils!({ dm: sans, srd }).join('\n');
    expect(avis).toMatch(/aucun écho/);
    expect(avis).toMatch(/seulement narratifs/);
    expect(avis).toMatch(/épilogue/);
  });

  it('le validateur du monde connaît les drapeaux de choix et vérifie les références des dilemmes', () => {
    const bilan = validerMonde(dm, srd);
    expect(bilan.avertissements.join('\n')).not.toMatch(/choix-le-deserteur/);
    const casse = validerMonde({ ...r.monde, extensions: { dilemmes: [{ ...DILEMME, quand: { lieu: 'nulle-part' } }] } }, srd);
    expect(casse.erreurs.join('\n')).toMatch(/Dilemme « le-deserteur » : lieu inconnu « nulle-part »/);
    // Un drapeau de choix lu par une fin ne déclenche pas « lu mais jamais posé ».
    const lit = { ...dm, fins: new Map(dm.fins) };
    const fin = [...lit.fins.values()][0]!;
    lit.fins.set(fin.id, { ...fin, condition: { flag: 'choix-le-deserteur-epargner' } });
    expect(validerMonde(lit, srd).avertissements.join('\n')).not.toMatch(/choix-le-deserteur-epargner/);
  });

  it('à la fin, les épilogues rappellent ce que les choix ont laissé derrière eux', () => {
    const fin = [...r.monde.fins.keys()][0]!;
    const final = { ...DILEMME, options: [{ ...DILEMME.options[1]!, effets: [{ fin }] }, DILEMME.options[0]!] };
    const m = creerMoteur({ dm: { ...r.monde, extensions: { ...(r.monde.extensions ?? {}), dilemmes: [final] } }, srd }, MODULES_STANDARD);
    let p = m.executer(depart(), { type: 'aller', vers: 'vei-maison-des-gardiens' }).partie;
    const res = m.executer(p, { type: 'trancher', dilemme: 'le-deserteur', option: 'livrer' });
    p = res.partie;
    expect(p.scene.type).toBe('fin');
    expect(res.evenements).toContainEqual({ type: 'constat', texte: 'Ce que vos choix ont laissé derrière eux :' });
    expect(res.evenements).toContainEqual({ type: 'texte', texte: 'Le déserteur a été pendu au petit matin.' });
  });
});

describe('les dilemmes de La Citadelle des Marées', () => {
  const c = chargerMonde(join(RACINE_MONDES, 'citadelle-des-marees'));
  if (!c.ok) throw new Error(c.erreurs.map((e) => e.message).join('\n'));
  const m = creerMoteur({ dm: c.monde, srd }, MODULES_STANDARD);
  const jeu = () => {
    const g = groupeConseille(3, srd).emplacements.map((p) => {
      const f = bilanPersonnage(p!, srd).fiche!;
      return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
    });
    return m.executer(m.nouvellePartie(g, { graine: 5, niveau: 3 }), { type: 'commencer' }).partie;
  };
  const groupeDe = (p: Partie, id: string) => m.propositions(p).filter((x) => x.groupe.id === 'dilemme:' + id);

  it('Quentin démasqué ouvre son dilemme dans les dortoirs ; le sort de Quentin laisse des traces', () => {
    let p = jeu();
    p.etat.flags['cit-infiltre-demasque'] = true;
    p = m.executer(p, { type: 'aller', vers: 'cit-dortoirs' }).partie;
    const b = groupeDe(p, 'le-sort-de-quentin');
    expect(b).toHaveLength(4);
    expect(b.every((x) => x.apercu?.includes('Coût'))).toBe(true);
    const res = m.executer(p, { type: 'trancher', dilemme: 'le-sort-de-quentin', option: 'livrer' });
    expect(res.refus).toBeUndefined();
    expect(res.partie.etat.pnjEtats['quentin-salmier']).toBe('parti');
    expect(res.partie.etat.flags['choix-le-sort-de-quentin-livrer']).toBe(true);
  });

  it("l'option des Rats est grisée sans 100 po, puis payable", () => {
    let p = jeu();
    p.etat.flags['port-atteint'] = true;
    p.etat.jauges['maree'] = 3;
    p.etat.pieces = 40;
    // Un déplacement suffit à ouvrir le dilemme (sa condition est déjà vraie) ; la nuit du départ lance une rencontre qu'on écarte.
    p = m.executer(p, { type: 'aller', vers: 'cit-dortoirs' }).partie;
    p = m.executer(p, { type: 'reglerRencontre', issue: 'fuite' }).partie;
    const rats = () => groupeDe(p, 'les-ruelles-basses').find((x) => (x.ordre as { option?: string }).option === 'rats')!;
    expect(rats().desactivee).toMatch(/100 po/);
    expect(m.executer(p, { type: 'trancher', dilemme: 'les-ruelles-basses', option: 'rats' }).refus).toMatch(/100 po/);
    p.etat.pieces = 150;
    expect(rats().desactivee).toBeUndefined();
    const res = m.executer(p, { type: 'trancher', dilemme: 'les-ruelles-basses', option: 'rats' });
    expect(res.refus).toBeUndefined();
    expect(res.partie.etat.pieces).toBe(50);
  });

  it('la validation du module est propre et sans conseil', () => {
    const module = MODULES_STANDARD.find((x) => x.id === 'dilemmes')!;
    expect(module.valider!({ dm: c.monde, srd })).toEqual([]);
    expect(module.conseils!({ dm: c.monde, srd })).toEqual([]);
  });
});

describe('le conteur ne tranche jamais à la place du joueur', () => {
  it('la commande trancher est réservée au joueur', () => {
    expect(COMMANDES_HORS_CONTEUR.has('trancher')).toBe(true);
  });
});
