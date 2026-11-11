import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, ficheDeTour, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type Encart, type Partie } from '../src';
import { chargerMonde } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { validerMonde } from '../src/monde/validation';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm0 = r.monde;
const LIEU = 'vei-maison-des-gardiens';

// Des détails à examiner qui apprennent des faits : le moyen le plus simple de « faire apprendre » dans un test.
const EXAMENS = [
  { id: 'exa-un', lieu: LIEU, nom: 'Un', texte: 'Un détail.', effets: [{ fait: 'f-nuit-de-la-cendre' }] },
  { id: 'exa-deux', lieu: LIEU, nom: 'Deux', texte: 'Un autre détail.', effets: [{ fait: 'z6-braise-protege' }, { fait: 'z6-rumeur-volcan' }, { fait: 'f-ecluse-noire' }] },
  { id: 'exa-trois', lieu: LIEU, nom: 'Trois', texte: 'Encore un détail.', effets: [{ fait: 'f-pelerins-motif' }] },
];
const QUESTIONS = [
  { id: 'q-la-cendre', texte: 'D’où vient la cendre ?', quand: { fait: 'f-nuit-de-la-cendre' }, resolue: { fait: 'z6-braise-protege' }, piste: 'Regardez ce que la cendre épargne.', reponse: 'La cendre ne tombe pas dans les murs de la Lanterne.' },
  { id: 'q-cachee', texte: 'Qui sont les Pèlerins ?', quand: { fait: 'f-pelerins-motif' }, resolue: { fait: 'f-fer-gris-veut-la-forge' }, reponse: 'Des croyants.' },
];
const dm = { ...dm0, extensions: { ...(dm0.extensions ?? {}), examens: EXAMENS, codex: QUESTIONS } };
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);

function depart(): Partie {
  const g = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  let p = moteur.executer(moteur.nouvellePartie(g, { graine: 9, niveau: 3 }), { type: 'commencer' }).partie;
  p = moteur.executer(p, { type: 'terminerScene', scene: 'ouverture' }).partie;
  return moteur.executer(p, { type: 'aller', vers: LIEU }).partie;
}
const examiner = (p: Partie, id: string) => moteur.executer(p, { type: 'examiner', examen: id }).partie;
const encart = (p: Partie, id: string) => moteur.encarts(p).find((e) => e.id === id) as Encart | undefined;

describe('module Codex : ce que le groupe sait, rangé et sourcé, et les questions qu’il se pose', () => {
  it('chaque fait appris garde sa source : le lieu, le jour, et l’interlocuteur en conversation', () => {
    let p = examiner(depart(), 'exa-un');
    const s = (p.modules['codex'] as { sources: Record<string, { lieu: string; jour: number; par?: string }> }).sources;
    expect(s['f-nuit-de-la-cendre']).toMatchObject({ lieu: LIEU, jour: p.etat.jour });
    expect(s['f-nuit-de-la-cendre']!.par).toBeUndefined();
    const pnj = [...dm.pnj.keys()][0]!;
    p = examiner({ ...p, scene: { type: 'dialogue', pnj } }, 'exa-trois');
    expect((p.modules['codex'] as { sources: Record<string, { par?: string }> }).sources['f-pelerins-motif']!.par).toBe(pnj);
  });

  it('les faits sont rangés par rubrique, une rumeur non vérifiée est marquée, la fiche donne la source', () => {
    const p = examiner(examiner(depart(), 'exa-un'), 'exa-deux');
    const histoire = encart(p, 'codex-histoire')!;
    expect(histoire.lignes!.some((l) => l.libelle.startsWith('La Nuit de la Cendre'))).toBe(true);
    const ligne = histoire.lignes!.find((l) => l.libelle.startsWith('La Nuit de la Cendre'))!;
    expect(ligne.detail).toMatch(/^Appris à .+, jour \d+\.$/);
    expect(ligne.fiche).toMatchObject({ rubrique: 'Ce que nous savons' });
    expect(ligne.fiche!.proprietes.map((x) => x.libelle)).toEqual(expect.arrayContaining(['Rubrique', 'Appris à', 'Jour']));
    expect(encart(p, 'codex-indices')!.lignes!.some((l) => l.libelle.startsWith('La cendre ne tombe jamais'))).toBe(true);
    expect(encart(p, 'codex-lieux')!.lignes!.some((l) => l.libelle.startsWith('L’Écluse noire') || l.libelle.startsWith("L'Écluse noire"))).toBe(true);
    const rumeur = encart(p, 'codex-rumeurs')!.lignes![0]!;
    expect(rumeur.detail).toMatch(/^Rumeur non vérifiée\./);
    expect(rumeur.ton).toBe('faible');
    expect(encart(p, 'codex-personnes')).toBeUndefined();
  });

  it('une question apparaît quand son fait de départ est connu, et se ferme avec sa réponse quand le fait qui la résout est appris', () => {
    const p0 = depart();
    expect(encart(p0, 'codex-questions')!.lignes).toEqual([]);
    expect(encart(p0, 'codex-eclaircies')).toBeUndefined();
    const p1 = examiner(p0, 'exa-un');
    const q = encart(p1, 'codex-questions')!.lignes!;
    expect(q).toHaveLength(1);
    expect(q[0]).toMatchObject({ libelle: 'D’où vient la cendre ?', detail: 'Regardez ce que la cendre épargne.' });
    const p2 = examiner(p1, 'exa-deux');
    expect(encart(p2, 'codex-questions')!.lignes).toEqual([]);
    expect(encart(p2, 'codex-eclaircies')!.lignes![0]).toMatchObject({ libelle: 'D’où vient la cendre ?', detail: 'La cendre ne tombe pas dans les murs de la Lanterne.', ton: 'succes' });
  });

  it('le conteur voit les questions en suspens (avec la piste) et éclaircies, jamais la réponse d’une question en suspens', () => {
    const p1 = examiner(depart(), 'exa-un');
    const fiche = ficheDeTour(moteur, p1);
    expect(fiche).toContain('Questions en suspens');
    expect(fiche).toContain('D’où vient la cendre ?');
    expect(fiche).toContain('piste : Regardez ce que la cendre épargne.');
    expect(fiche).not.toContain('La cendre ne tombe pas dans les murs de la Lanterne.');
    expect(ficheDeTour(moteur, examiner(p1, 'exa-deux'))).toContain('Questions éclaircies : D’où vient la cendre ? → La cendre ne tombe pas dans les murs de la Lanterne.');
  });

  it('la validation : références des conditions, ids en double ; conseil pour un codex trop mince', () => {
    const module = MODULES_STANDARD.find((m) => m.id === 'codex')!;
    expect(module.valider!({ dm, srd })).toEqual([]);
    expect(module.conseils!({ dm, srd }).join('\n')).toMatch(/2 question\(s\) ; visez 10 à 15/);
    expect(module.conseils!({ dm, srd }).join('\n')).toMatch(/« q-cachee » : sans piste/);
    const double = { ...dm0, extensions: { codex: [QUESTIONS[0], QUESTIONS[0]] } };
    expect(module.valider!({ dm: double, srd }).join('\n')).toMatch(/Question « q-la-cendre » : identifiant en double/);
    const bilan = validerMonde({ ...dm0, extensions: { codex: [{ ...QUESTIONS[0]!, quand: { fait: 'inconnu' }, resolue: { lieu: 'nulle-part' } }] } }, srd);
    expect(bilan.erreurs.join('\n')).toMatch(/Question « q-la-cendre » : fait inconnu « inconnu »/);
    expect(bilan.erreurs.join('\n')).toMatch(/Question « q-la-cendre » : lieu inconnu « nulle-part »/);
  });
});

describe('La Citadelle des Marées : le codex', () => {
  const rc = chargerMonde(join(MONDES_ESSAI, 'citadelle-des-marees'));
  if (!rc.ok) throw new Error(rc.erreurs.map((e) => e.message).join('\n'));
  const mc = creerMoteur({ dm: rc.monde, srd }, MODULES_STANDARD);
  const qs = (rc.monde.extensions?.['codex'] ?? []) as { id: string; texte: string; piste?: string; reponse: string; quand: { fait: string }; resolue: { fait: string } }[];
  const g = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  const base = mc.executer(mc.nouvellePartie(g, { graine: 3, niveau: 3 }), { type: 'commencer' }).partie;
  const avec = (...faits: string[]): Partie => ({ ...base, etat: { ...base.etat, faits: [...base.etat.faits, ...faits] } });
  const lignes = (p: Partie, id: string) => (mc.encarts(p).find((e) => e.id === id) as Encart | undefined)?.lignes ?? [];

  it('au moins 12 questions, chacune avec une piste, qui s’ouvre avec son fait puis se ferme avec le fait qui répond', () => {
    expect(qs.length).toBeGreaterThanOrEqual(12);
    for (const q of qs) {
      expect(q.piste, q.id).toBeTruthy();
      expect(lignes(avec(q.quand.fait), 'codex-questions').some((l) => l.libelle === q.texte), `${q.id} ouverte`).toBe(true);
      const ferme = avec(q.quand.fait, q.resolue.fait);
      expect(lignes(ferme, 'codex-questions').some((l) => l.libelle === q.texte), `${q.id} fermée`).toBe(false);
      expect(lignes(ferme, 'codex-eclaircies').some((l) => l.libelle === q.texte && l.detail === q.reponse), `${q.id} éclaircie`).toBe(true);
    }
  });

  it('une piste ne cite jamais le fait qui résout la question', () => {
    for (const q of qs) {
      const texte = rc.monde.faits.get(q.resolue.fait)?.texte ?? '';
      const phrase = texte.split(/[.;:]/)[0]!.trim();
      expect(q.piste!.includes(phrase), q.id).toBe(false);
    }
  });
});

describe('Le Val des Cendres : le codex', () => {
  const qs = (r.monde.extensions?.['codex'] ?? []) as { id: string; texte: string; piste?: string; reponse: string; quand: { fait: string }; resolue: { fait: string } }[];
  const g = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  const mv = creerMoteur({ dm: r.monde, srd }, MODULES_STANDARD);
  const base = mv.executer(mv.nouvellePartie(g, { graine: 3, niveau: 3 }), { type: 'commencer' }).partie;
  const avec = (...faits: string[]): Partie => ({ ...base, etat: { ...base.etat, faits: [...base.etat.faits, ...faits] } });
  const lignes = (p: Partie, id: string) => (mv.encarts(p).find((e) => e.id === id) as Encart | undefined)?.lignes ?? [];

  it('au moins 10 questions, chacune avec une piste, ouverte par son fait puis fermée par celui qui répond', () => {
    expect(qs.length).toBeGreaterThanOrEqual(10);
    for (const q of qs) {
      expect(q.piste, q.id).toBeTruthy();
      expect(lignes(avec(q.quand.fait), 'codex-questions').some((l) => l.libelle === q.texte), `${q.id} ouverte`).toBe(true);
      const ferme = avec(q.quand.fait, q.resolue.fait);
      expect(lignes(ferme, 'codex-eclaircies').some((l) => l.libelle === q.texte && l.detail === q.reponse), `${q.id} éclaircie`).toBe(true);
    }
  });
});
