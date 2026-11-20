// F4 (PRD-SAGA) — le butin par difficulté et par niveau : la difficulté d'un contenant, le plafond lu au tirage (opt-in par le drapeau de
// monde `butinPlafonne`), les trois degrés de butin (tiré, nommé, unique), l'indice visible de richesse, les avis du validateur.
// Monde d'essai : Le Val des Cendres, chargé en mémoire et complété par les trésors et les tables de chaque test (aucune donnée écrite).
import { describe, expect, it } from 'vitest';
import { herosPreTires, Monde, Objet, personnageDepuisFiche, TableButin, Tresor, validerMonde, VERSION_PARTIE, type DonneesMonde, type Generateur, type PartieMonde } from '../src';
import { lancer } from '../src/des';
import { chargerDonneesSrd } from '../src/donnees-node';
import { chargerMonde } from '../src/monde/chargeur';
import { tableDe } from '../src/monde/butin-commun';
import {
  CATEGORIES_JAMAIS_TIREES,
  conseilsButin,
  conseilsButinEpisode,
  difficulteDeRencontre,
  difficulteDeTresor,
  entreesRetenues,
  infosObjet,
  palierDeNiveau,
  PALIER_DE_RARETE,
  uniquesDeLEpisode,
  valeurDeTresor,
} from '../src/monde/butin-niveau';
import { etatInitial } from '../src/monde/etat';
import { issueRencontre, nouvellePartie, prendre } from '../src/monde/exploration';
import { ficheDeScene } from '../src/monde/scene';
import { dossierMonde } from './mondes-essai';

const srd = chargerDonneesSrd();

function charger(plafonne: boolean): DonneesMonde {
  const r = chargerMonde(dossierMonde('val-des-cendres'));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  r.monde.monde.butinPlafonne = plafonne;
  return r.monde;
}

/** Un lieu du Val sans piège ni trésor : on y pose les contenants d'essai. */
const lieux = new WeakMap<DonneesMonde, string>();
const lieuLibre = (dm: DonneesMonde): string => {
  if (!lieux.has(dm)) lieux.set(dm, [...dm.lieux.values()].find((l) => l.type !== 'region' && ![...dm.pieges.values()].some((p) => p.lieu === l.id) && ![...dm.tresors.values()].some((t) => t.lieu === l.id))!.id);
  return lieux.get(dm)!;
};

/** Un générateur déterministe (mulberry32) : les mêmes graines donnent les mêmes tirages. */
function graine(a: number): Generateur {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function enPartie(dm: DonneesMonde, niveau: number, gen: Generateur): PartieMonde {
  const groupe = herosPreTires(srd).map((h) => {
    h.fiche.niveau = niveau;
    return personnageDepuisFiche(h.fiche, { id: h.fiche.nom.toLowerCase() });
  });
  const p = { ...nouvellePartie(dm, etatInitial(dm, niveau), groupe, gen), srd };
  p.etat.lieu = lieuLibre(dm);
  return p;
}

const objetsParRarete = (r: string) => [...srd.objets.values()].filter((o) => o.rarete === r && !CATEGORIES_JAMAIS_TIREES.includes(o.categorie)).map((o) => o.id);
const COMMUN = 'rations';
const PEU_COMMUN = objetsParRarete('peu-commun')[0]!;
const RARE = objetsParRarete('rare')[0]!;
const TRES_RARE = objetsParRarete('tres-rare')[0]!;
const LEGENDAIRE = objetsParRarete('legendaire')[0]!;

/** Ajoute un objet d'essai au monde. */
function objet(dm: DonneesMonde, id: string, extra: Record<string, unknown> = {}): void {
  dm.objets.set(id, Objet.parse({ id, nom: id, categorie: 'divers', valeurPo: 1, resume: 'Un objet d’essai.', ...extra }));
}

function table(dm: DonneesMonde, id: string, palier: number, entrees: Record<string, unknown>[]): void {
  dm.tables.set(id, TableButin.parse({ id, nom: id, palier, entrees }));
}

function contenant(dm: DonneesMonde, id: string, extra: Record<string, unknown> = {}, contenu: Record<string, unknown> = {}): Tresor {
  const t = Tresor.parse({ id, nom: id, lieu: lieuLibre(dm), contenant: 'coffre', description: 'Un coffre d’essai.', contenu, ...extra });
  dm.tresors.set(id, t);
  return t;
}

/** Vide un contenant `n` fois (sac et or remis à zéro entre deux) et compte ce qui sort, objet par objet. */
function vider(p: PartieMonde, id: string, n: number): { objets: Record<string, number>; or: number } {
  const total: Record<string, number> = {};
  let or = 0;
  for (let i = 0; i < n; i++) {
    p.etat.exploration.tresorsPris = [];
    p.etat.exploration.ouverts.push(`tresor:${id}`);
    p.etat.inventaire = {};
    p.etat.pieces = 0;
    const r = prendre(p, id);
    expect(r.ok, r.refus).toBe(true);
    for (const [o, q] of Object.entries(p.etat.inventaire)) total[o] = (total[o] ?? 0) + q;
    or += p.etat.pieces;
  }
  return { objets: total, or };
}

describe('la difficulté d’un contenant et d’une rencontre', () => {
  it('c’est le plus haut du DD du verrou, du DD du piège et du FP du gardien (au barème des DD)', () => {
    const dm = charger(true);
    const lieu = lieuLibre(dm);
    dm.pieges.set('p-essai', { ...[...dm.pieges.values()][0]!, id: 'p-essai', lieu, detection: { dd: 12, competence: 'perception' }, desarmement: { dd: 16, competence: 'escamotage' } });
    const sansRien = contenant(dm, 'c-rien');
    expect(difficulteDeTresor(dm, srd, sansRien)).toMatchObject({ equivalentDd: 0, degre: 0 });
    const verrou = contenant(dm, 'c-verrou', { acces: { verrou: { dd: 14 } } });
    expect(difficulteDeTresor(dm, srd, verrou)).toMatchObject({ dd: 14, equivalentDd: 14, degre: 0.4 });
    const piege = contenant(dm, 'c-piege', { acces: { verrou: { dd: 14 }, piege: 'p-essai' } });
    expect(difficulteDeTresor(dm, srd, piege).dd).toBe(16);
    // Un gardien : le plus fort FP de sa rencontre, ramené à 10 + 2 × FP.
    const profil = [...srd.monstres.values()].find((m) => m.fp === '5')!;
    dm.rencontres.set('r-gardien', { ...[...dm.rencontres.values()][0]!, id: 'r-gardien', monstres: [{ profil: profil.id, nombre: 1 }] });
    const gardee = contenant(dm, 'c-gardee', { acces: { verrou: { dd: 12 } }, gardien: 'r-gardien' });
    const d = difficulteDeTresor(dm, srd, gardee);
    expect(d.fp).toBe(5);
    expect(d.equivalentDd).toBe(20);
    expect(d.degre).toBe(1);
  });

  it('une rencontre vaut sa difficulté déclarée ou son plus fort monstre, le plus haut des deux', () => {
    const dm = charger(true);
    const base = [...dm.rencontres.values()][0]!;
    const faible = { ...base, difficulte: 'faible' as const, monstres: [] };
    expect(difficulteDeRencontre(srd, faible).equivalentDd).toBe(11);
    expect(difficulteDeRencontre(srd, { ...base, difficulte: 'elevee' as const, monstres: [] }).degre).toBeCloseTo(0.7);
    const profil = [...srd.monstres.values()].find((m) => m.fp === '5')!;
    expect(difficulteDeRencontre(srd, { ...faible, monstres: [{ profil: profil.id, nombre: 2 }] }).equivalentDd).toBe(20);
  });
});

describe('sans le drapeau `butinPlafonne`, les tirages sont ceux d’avant, à graine égale (P1, P2)', () => {
  /** L’ancien tireur, recopié tel qu’il était avant F4 : un seul `gen()` par table, aucun plafond. */
  function ancien(dm: DonneesMonde, id: string, gen: Generateur, sac: Record<string, number>, caisse: { po: number }, profondeur = 0): void {
    const t = tableDe(dm, id);
    if (!t || profondeur > 5) return;
    const total = t.entrees.reduce((s, e) => s + e.poids, 0);
    let x = gen() * total;
    const e = t.entrees.find((en) => (x -= en.poids) < 0) ?? t.entrees[t.entrees.length - 1]!;
    if (e.rien) return;
    if (e.table) return ancien(dm, e.table, gen, sac, caisse, profondeur + 1);
    if (e.pieces) {
      const n = lancer(e.pieces.des, gen).total;
      caisse.po = Number((caisse.po + (e.pieces.unite === 'po' ? n : e.pieces.unite === 'pa' ? n / 10 : n / 100)).toFixed(2));
      return;
    }
    if (e.objet) sac[e.objet] = (sac[e.objet] ?? 0) + (e.quantite ?? 1);
  }

  it('le drapeau vaut faux par défaut', () => {
    const m = chargerMonde(dossierMonde('val-des-cendres'));
    if (!m.ok) throw new Error('chargement');
    const brut = JSON.parse(JSON.stringify(m.monde.monde));
    delete brut.butinPlafonne;
    expect(Monde.parse(brut).butinPlafonne).toBe(false);
  });

  it.each(['commun-consommables-p1', 'commun-consommables-p2', 'commun-decouverte-p3', 'commun-baguettes-p3'])('1 000 tirages de %s : mêmes objets, mêmes pièces, même suite de dés', (id) => {
    const dm = charger(false);
    contenant(dm, 'c-tirage', {}, { tables: [{ table: id, jets: 50 }] });
    const p = enPartie(dm, 3, graine(42));
    const reel = vider(p, 'c-tirage', 20);
    const sac: Record<string, number> = {};
    const caisse = { po: 0 };
    const gen = graine(42);
    // `prendre` ne consomme aucun dé avant le tirage (aucun piège, aucun gardien) : la suite de dés est donc la même.
    for (let i = 0; i < 20 * 50; i++) ancien(dm, id, gen, sac, caisse);
    expect(reel.objets).toEqual(sac);
    expect(p.gen()).toBe(gen());
  });

  it('une rencontre gagnée tire dans la table comme avant', () => {
    const dm = charger(false);
    table(dm, 't-essai', 1, [{ poids: 1, objet: COMMUN }, { poids: 1, objet: RARE }, { poids: 2, rien: true }]);
    const id = [...dm.rencontres.values()].find((r) => r.type === 'combat')!.id;
    dm.rencontres.get(id)!.butin = { tables: ['t-essai'], tresors: [], depouilles: false };
    const lieu = [...dm.lieux.values()].find((l) => l.rencontres.some((x) => x.id === id))!.id;
    const vus = new Set<string>();
    for (let s = 1; s <= 60; s++) {
      const p = enPartie(dm, 1, graine(s));
      p.etat.lieu = lieu;
      p.etat.inventaire = {};
      issueRencontre(p, id, { type: 'victoire', px: 10 });
      for (const o of Object.keys(p.etat.inventaire)) vus.add(o);
    }
    // Sans plafond, l'objet rare sort même à 1 niveau : c’est le comportement d’avant.
    expect([...vus].sort()).toEqual([COMMUN, RARE].sort());
  });
});

describe('avec le drapeau, le tirage est plafonné au niveau réel du groupe', () => {
  /** Une table du palier 1 qui contient de tout : de quoi voir ce que le plafond retient à chaque niveau. */
  function tableDeTout(dm: DonneesMonde): void {
    objet(dm, 'o-quete', { categorie: 'quete' });
    objet(dm, 'o-cle', { categorie: 'cle' });
    objet(dm, 'o-unique', { rarete: 'rare', degre: 'unique' });
    objet(dm, 'o-nomme', { degre: 'nomme', lore: 'Une histoire.' });
    table(dm, 't-sous-p2', 2, [{ poids: 1, objet: 'o-sous-p2' }]);
    objet(dm, 'o-sous-p2');
    table(dm, 't-tout', 1, [
      { poids: 4, objet: COMMUN },
      { poids: 3, objet: PEU_COMMUN },
      { poids: 3, objet: RARE },
      { poids: 3, objet: TRES_RARE },
      { poids: 3, objet: LEGENDAIRE },
      { poids: 3, objet: 'o-quete' },
      { poids: 3, objet: 'o-cle' },
      { poids: 3, objet: 'o-unique' },
      { poids: 3, objet: 'o-nomme' },
      { poids: 3, table: 't-sous-p2' },
      { poids: 2, pieces: { des: '1d6', unite: 'po' } },
      { poids: 2, rien: true },
    ]);
  }

  it.each([1, 2, 3, 4, 5, 8, 10, 11, 16, 17, 20])('niveau %i : 1 000 tirages, aucune entrée d’un palier supérieur, jamais de quête, de clé ni d’unique', (niveau) => {
    const dm = charger(true);
    tableDeTout(dm);
    contenant(dm, 'c-tout', {}, { tables: [{ table: 't-tout', jets: 50 }] });
    const p = enPartie(dm, niveau, graine(niveau));
    const { objets } = vider(p, 'c-tout', 20);
    expect(Object.values(objets).reduce((a, b) => a + b, 0), 'il sort bien quelque chose').toBeGreaterThan(100);
    const palier = palierDeNiveau(niveau);
    for (const id of Object.keys(objets)) {
      expect(['o-quete', 'o-cle', 'o-unique'], `${id} ne se tire jamais`).not.toContain(id);
      const info = infosObjet(dm, srd, id);
      expect(PALIER_DE_RARETE[info.rarete]!, `${id} (${info.rarete}) au niveau ${niveau}`).toBeLessThanOrEqual(palier);
      // L’objet d’une sous-table du palier 2 n’est permis qu’à partir du niveau 5.
      if (id === 'o-sous-p2') expect(niveau).toBeGreaterThanOrEqual(5);
    }
    // Les barèmes de la consigne d’auteur : pas de rare avant le niveau 5 (stricte : la consigne dit 3 à 4), pas de légendaire avant le 17.
    if (niveau < 5) expect(objets[RARE] ?? 0).toBe(0);
    if (niveau < 11) expect(objets[TRES_RARE] ?? 0).toBe(0);
    if (niveau < 17) expect(objets[LEGENDAIRE] ?? 0).toBe(0);
    // Ce qui est permis sort bel et bien : le plafond ne vide pas la table.
    expect(objets[COMMUN] ?? 0).toBeGreaterThan(0);
    if (niveau >= 5) expect((objets[RARE] ?? 0) + (objets['o-sous-p2'] ?? 0)).toBeGreaterThan(0);
    if (niveau >= 17) expect(objets[LEGENDAIRE] ?? 0).toBeGreaterThan(0);
  });

  it('une table d’un palier au-dessus du groupe ne donne rien (même ses entrées communes)', () => {
    const dm = charger(true);
    contenant(dm, 'c-haut', {}, { tables: [{ table: 'commun-consommables-p3', jets: 50 }, { table: 'commun-decouverte-p4', jets: 50 }] });
    const p = enPartie(dm, 3, graine(7));
    const { objets, or } = vider(p, 'c-haut', 10);
    expect(Object.keys(objets)).toHaveLength(0);
    expect(or).toBe(0);
  });

  it('la table commune de son palier donne des objets au niveau du groupe, jamais plus rares que le palier', () => {
    const dm = charger(true);
    contenant(dm, 'c-p2', {}, { tables: [{ table: 'commun-consommables-p2', jets: 50 }] });
    const p = enPartie(dm, 6, graine(11));
    const { objets } = vider(p, 'c-p2', 20);
    expect(Object.keys(objets).length).toBeGreaterThan(3);
    for (const id of Object.keys(objets)) expect(PALIER_DE_RARETE[infosObjet(dm, srd, id).rarete]!).toBeLessThanOrEqual(2);
  });

  it('les contenus écrits à la main (objets, pièces) ne sont jamais touchés : un unique déclaré se donne même avant son palier', () => {
    const dm = charger(true);
    objet(dm, 'o-boss', { rarete: 'legendaire', degre: 'unique' });
    contenant(dm, 'c-boss', {}, { objets: [{ objet: 'o-boss' }, { objet: RARE }], pieces: { po: 30 } });
    const p = enPartie(dm, 2, graine(1));
    const { objets, or } = vider(p, 'c-boss', 1);
    expect(objets).toEqual({ 'o-boss': 1, [RARE]: 1 });
    expect(or).toBe(30);
  });

  it('la difficulté du contenant pousse vers les objets les plus rares du palier : plus de peu communs, moins de « rien »', () => {
    const dm = charger(true);
    table(dm, 't-poussee', 1, [{ poids: 3, objet: COMMUN }, { poids: 1, objet: PEU_COMMUN }, { poids: 4, rien: true }]);
    contenant(dm, 'c-facile', {}, { tables: [{ table: 't-poussee', jets: 400 }] });
    contenant(dm, 'c-dur', { acces: { verrou: { dd: 20 } } }, { tables: [{ table: 't-poussee', jets: 400 }] });
    const p = enPartie(dm, 2, graine(5));
    const facile = vider(p, 'c-facile', 1).objets;
    const dur = vider(p, 'c-dur', 1).objets;
    const total = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
    expect(total(dur)).toBeGreaterThan(total(facile));
    expect((dur[PEU_COMMUN] ?? 0) / total(dur)).toBeGreaterThan((facile[PEU_COMMUN] ?? 0) / total(facile));
  });

  it('les poids : difficulté nulle = poids d’origine ; difficulté maximale = « rien » au quart, rang r multiplié par 1 + 2r', () => {
    const dm = charger(true);
    table(dm, 't-poids', 1, [{ poids: 2, objet: COMMUN }, { poids: 2, objet: PEU_COMMUN }, { poids: 4, rien: true }]);
    const t = dm.tables.get('t-poids')!;
    const poids = (degre: number) => entreesRetenues(t, { palier: 1, degre, dm, srd }).map((r) => r.poids);
    expect(poids(0)).toEqual([2, 2, 4]);
    expect(poids(1)).toEqual([2, 6, 1]);
  });

  it('une victoire tire dans la table plafonnée au niveau : l’objet rare n’est jamais donné à un groupe du niveau 1', () => {
    const dm = charger(true);
    table(dm, 't-essai', 1, [{ poids: 1, objet: COMMUN }, { poids: 1, objet: RARE }, { poids: 2, rien: true }]);
    const id = [...dm.rencontres.values()].find((r) => r.type === 'combat')!.id;
    dm.rencontres.get(id)!.butin = { tables: ['t-essai'], tresors: [], depouilles: false };
    const lieu = [...dm.lieux.values()].find((l) => l.rencontres.some((x) => x.id === id))!.id;
    const vus = new Set<string>();
    for (let s = 1; s <= 120; s++) {
      const p = enPartie(dm, 1, graine(s));
      p.etat.lieu = lieu;
      p.etat.inventaire = {};
      issueRencontre(p, id, { type: 'victoire', px: 10 });
      for (const o of Object.keys(p.etat.inventaire)) vus.add(o);
    }
    expect([...vus]).toEqual([COMMUN]);
  });
});

describe('les avis du validateur (jamais bloquants)', () => {
  const butin = (dm: DonneesMonde) => conseilsButin(dm, srd);
  /** Le Val sans ses trésors : seuls ceux du test comptent dans les listes d'avis. */
  const vierge = (): DonneesMonde => {
    const dm = charger(false);
    lieuLibre(dm);
    dm.tresors.clear();
    return dm;
  };

  it('un trésor riche sans verrou, piège ni gardien est signalé ; un verrou, un piège ou un gardien suffit à l’éteindre', () => {
    const dm = vierge();
    const seuil = 60 * dm.monde.niveaux.max;
    contenant(dm, 'c-riche', {}, { pieces: { po: seuil + 50 } });
    expect(butin(dm).join('\n')).toMatch(/riches.*c-riche/);
    dm.tresors.delete('c-riche');
    contenant(dm, 'c-riche', { acces: { verrou: { dd: 13 } } }, { pieces: { po: seuil + 50 } });
    expect(butin(dm).join('\n')).not.toMatch(/c-riche/);
    // Une cachette très difficile est aussi un obstacle ; une cachette facile n’en est pas un.
    dm.tresors.delete('c-riche');
    contenant(dm, 'c-riche', { acces: { cache: { dd: 17, competence: 'investigation' } } }, { pieces: { po: seuil + 50 } });
    expect(butin(dm).join('\n')).not.toMatch(/c-riche/);
    dm.tresors.delete('c-riche');
    contenant(dm, 'c-riche', { acces: { cache: { dd: 11, competence: 'investigation' } } }, { pieces: { po: seuil + 50 } });
    expect(butin(dm).join('\n')).toMatch(/c-riche/);
    // Une condition d’existence, ou une énigme qui le donne, est aussi un obstacle.
    dm.tresors.delete('c-riche');
    contenant(dm, 'c-riche', { condition: { flag: 'un-drapeau' } }, { pieces: { po: seuil + 50 } });
    expect(butin(dm).join('\n')).not.toMatch(/c-riche/);
    dm.tresors.delete('c-riche');
    contenant(dm, 'c-riche', {}, { pieces: { po: seuil + 50 } });
    const enigme = [...dm.enigmes.values()][0]!;
    enigme.recompense = { ...enigme.recompense, tresor: 'c-riche' };
    expect(butin(dm).join('\n')).not.toMatch(/c-riche/);
  });

  it('un obstacle sérieux sans rien dedans est signalé, sauf s’il garde une clé, un objet de quête, un indice ou un objet nommé', () => {
    const dm = vierge();
    contenant(dm, 'c-vide', { acces: { verrou: { dd: 18 } } }, { pieces: { po: 2 } });
    expect(butin(dm).join('\n')).toMatch(/obstacles sérieux.*c-vide/);
    objet(dm, 'o-clef', { categorie: 'cle' });
    dm.tresors.delete('c-vide');
    contenant(dm, 'c-vide', { acces: { verrou: { dd: 18 } } }, { objets: [{ objet: 'o-clef' }] });
    expect(butin(dm).join('\n')).not.toMatch(/c-vide/);
    // Un obstacle léger n’est pas sérieux.
    dm.tresors.delete('c-vide');
    contenant(dm, 'c-vide', { acces: { verrou: { dd: 12 } } }, { pieces: { po: 2 } });
    expect(butin(dm).join('\n')).not.toMatch(/c-vide/);
  });

  it('la valeur d’un trésor compte l’espérance de ses tirages', () => {
    const dm = charger(false);
    table(dm, 't-or', 1, [{ poids: 1, pieces: { des: '2d6', unite: 'po' } }, { poids: 1, rien: true }]);
    const t = contenant(dm, 'c-or', {}, { pieces: { po: 10 }, tables: [{ table: 't-or', jets: 4 }] });
    // 10 + 4 × (7 × ½) = 24
    expect(valeurDeTresor(dm, srd, t)).toBeCloseTo(24);
  });

  it('une table qui cite un objet de quête, une clé ou un objet unique est signalée', () => {
    const dm = charger(false);
    objet(dm, 'o-q', { categorie: 'quete' });
    objet(dm, 'o-u', { degre: 'unique' });
    table(dm, 't-mauvaise', 1, [{ poids: 1, objet: 'o-q' }, { poids: 1, objet: 'o-u' }, { poids: 1, objet: COMMUN }]);
    const a = butin(dm).join('\n');
    expect(a).toMatch(/o-q \(table t-mauvaise\)/);
    expect(a).toMatch(/o-u \(table t-mauvaise\)/);
    expect(a).not.toMatch(new RegExp(`${COMMUN} \\(table`));
  });

  it('un monde plafonné (hors profil épisode) est averti d’une table d’un palier trop haut', () => {
    const dm = charger(true);
    contenant(dm, 'c-p3', {}, { tables: [{ table: 'commun-consommables-p3', jets: 1 }] });
    expect(butin(dm).join('\n')).toMatch(/palier au-dessus.*commun-consommables-p3/);
    const sans = charger(false);
    contenant(sans, 'c-p3', {}, { tables: [{ table: 'commun-consommables-p3', jets: 1 }] });
    expect(butin(sans).join('\n')).not.toMatch(/palier au-dessus/);
  });

  it('ce ne sont que des avertissements : le bilan complet ne compte aucune erreur de plus', () => {
    const avant = validerMonde(charger(false), srd);
    const dm = charger(false);
    contenant(dm, 'c-riche', {}, { pieces: { po: 5000 } });
    const apres = validerMonde(dm, srd);
    expect(apres.erreurs).toEqual(avant.erreurs);
    expect(apres.avertissements.some((a) => a.startsWith('Butin et difficulté :'))).toBe(true);
  });
});

describe('les trois degrés de butin dans un épisode (tiré, nommé, unique)', () => {
  const principale = (dm: DonneesMonde) => [...dm.quetes.values()].find((q) => q.type === 'principale')!;
  /** Un monde sans objet unique ni nommé de départ (le Val en a un seul, on le garde propre). */
  const propre = () => {
    const dm = charger(false);
    for (const o of dm.objets.values()) delete o.degre;
    return dm;
  };

  it('aucun objet unique : avis « 0 objet(s) unique(s) »', () => {
    expect(conseilsButinEpisode(propre()).join('\n')).toMatch(/0 objet\(s\) unique/);
  });

  it('un unique récompense de la quête principale : aucun avis', () => {
    const dm = propre();
    objet(dm, 'o-un', { rarete: 'rare', degre: 'unique', lore: 'Histoire.' });
    principale(dm).recompenses.objets.push('o-un');
    expect(uniquesDeLEpisode(dm)).toEqual([{ id: 'o-un', rattache: true }]);
    expect(conseilsButinEpisode(dm)).toEqual([]);
  });

  it('un unique dans un trésor gardé par un boss (rencontre élevée) est rattaché ; sans gardien, il flotte', () => {
    const dm = propre();
    objet(dm, 'o-un', { rarete: 'rare', degre: 'unique' });
    const boss = [...dm.rencontres.values()].find((r) => r.type === 'combat')!;
    boss.difficulte = 'elevee';
    contenant(dm, 'c-boss', { gardien: boss.id }, { objets: [{ objet: 'o-un' }] });
    expect(uniquesDeLEpisode(dm)).toEqual([{ id: 'o-un', rattache: true }]);
    dm.tresors.delete('c-boss');
    contenant(dm, 'c-libre', {}, { objets: [{ objet: 'o-un' }] });
    expect(uniquesDeLEpisode(dm)).toEqual([{ id: 'o-un', rattache: false }]);
    expect(conseilsButinEpisode(dm).join('\n')).toMatch(/sans rattachement.*o-un/);
  });

  it('plus de 3 uniques : avis ; un nommé sans lore : avis', () => {
    const dm = propre();
    for (const i of [1, 2, 3, 4]) {
      objet(dm, `o-un-${i}`, { degre: 'unique' });
      principale(dm).recompenses.objets.push(`o-un-${i}`);
    }
    objet(dm, 'o-nomme', { degre: 'nomme' });
    const a = conseilsButinEpisode(dm).join('\n');
    expect(a).toMatch(/4 objet\(s\) unique/);
    expect(a).toMatch(/nommés sans `lore`.*o-nomme/);
  });

  it('le profil « épisode » du validateur lit ces avis ; sans lui, aucun avis d’uniques', () => {
    const dm = propre();
    dm.monde.format = 'episode';
    expect(validerMonde(dm, srd).avertissements.join('\n')).toMatch(/objet\(s\) unique/);
    dm.monde.format = undefined;
    expect(validerMonde(dm, srd).avertissements.join('\n')).not.toMatch(/objet\(s\) unique/);
  });

  it('un objet unique déclaré n’est pas jugé « trop rare » pour le niveau du monde', () => {
    const dm = propre();
    objet(dm, 'o-un', { rarete: 'legendaire', degre: 'unique' });
    objet(dm, 'o-pas-un', { rarete: 'legendaire' });
    const a = validerMonde(dm, srd).avertissements.join('\n');
    expect(a).toMatch(/Objet « o-pas-un » : rareté/);
    expect(a).not.toMatch(/Objet « o-un » : rareté/);
  });

  it('le schéma refuse un degré inconnu', () => {
    expect(Objet.safeParse({ id: 'x', nom: 'x', categorie: 'divers', valeurPo: 1, resume: 'x', degre: 'epique' }).success).toBe(false);
  });
});

describe('l’indice visible de richesse (`signe`)', () => {
  it('se lit avec la description du contenant dans la scène ; absent, la description est inchangée', () => {
    const dm = charger(false);
    contenant(dm, 'c-signe', {}, {});
    dm.tresors.get('c-signe')!.signe = 'Sa serrure est d’une finesse inhabituelle.';
    contenant(dm, 'c-nu', {}, {});
    const p = enPartie(dm, 1, graine(1));
    const scene = ficheDeScene(p);
    expect(scene.tresors.find((t) => t.id === 'c-signe')!.description).toBe('Un coffre d’essai. Sa serrure est d’une finesse inhabituelle.');
    expect(scene.tresors.find((t) => t.id === 'c-nu')!.description).toBe('Un coffre d’essai.');
  });
});

describe('sauvegardes (P4)', () => {
  it('la version de sauvegarde est 5 (F5 d : la saga voyage avec la partie, champ facultatif)', () => {
    expect(VERSION_PARTIE).toBe(5);
  });
});
