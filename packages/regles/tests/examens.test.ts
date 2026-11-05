import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, ficheDeTour, groupeConseille, MODULES_STANDARD, outilsDuConteur, personnageDepuisFiche, type Partie } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { validerMonde } from '../src/monde/validation';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(RACINE_MONDES, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm0 = r.monde;
const LIEU = 'vei-maison-des-gardiens';

const EXAMENS = [
  {
    id: 'inscription-du-linteau',
    lieu: LIEU,
    nom: 'L’inscription du linteau',
    apercu: 'Des lettres gravées, usées par la suie.',
    texte: 'Sur le linteau, quatre lettres gravées à la pointe : un nom de famille, rongé par la suie, que la mousse n’a pas encore effacé.',
    effets: [{ flag: 'linteau-lu' }],
    variantes: [{ id: 'apres-le-fait', condition: { flag: 'secret-connu' }, texte: 'Sachant ce que vous savez, le nom du linteau n’est plus une simple famille : c’est celui des gardiens.', effets: [{ attitude: { pnj: 'hesta-cendrebrune', delta: 3 } }] }],
  },
  { id: 'cachee', lieu: LIEU, nom: 'Une niche cachée', texte: 'Une niche, derrière la planche descellée.', visible: { flag: 'niche-vue' } },
  { id: 'ailleurs', lieu: 'veillecendre', nom: 'Le puits', texte: 'Un puits de pierre sèche.' },
];
const dm = { ...dm0, extensions: { ...(dm0.extensions ?? {}), examens: EXAMENS } };
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
const textes = (evs: { type: string }[]) => evs.filter((e) => e.type === 'texte').map((e) => (e as unknown as { texte: string }).texte);
const boutons = (p: Partie) => moteur.propositions(p).filter((x) => x.ordre?.type === 'examiner');

describe('module Examens : regarder de près un détail du lieu', () => {
  it('le texte écrit par l’auteur est donné, et la première lecture applique ses effets', () => {
    const p0 = depart();
    expect(p0.etat.flags['linteau-lu']).toBeUndefined();
    const res = moteur.executer(p0, { type: 'examiner', examen: 'inscription-du-linteau' });
    expect(res.refus).toBeUndefined();
    expect(textes(res.evenements)[0]).toContain('quatre lettres gravées');
    expect(res.partie.etat.flags['linteau-lu']).toBe(true);
  });

  it('une variante prend la place de la lecture de base quand sa condition devient vraie, et ses effets ne s’appliquent qu’une fois', () => {
    const p0 = depart();
    const base = moteur.executer(p0, { type: 'examiner', examen: 'inscription-du-linteau' }).partie;
    const avant = base.etat.attitudes['hesta-cendrebrune'] ?? 0;
    const sait = { ...base, etat: { ...base.etat, flags: { ...base.etat.flags, 'secret-connu': true } } };
    const lu = moteur.executer(sait, { type: 'examiner', examen: 'inscription-du-linteau' });
    expect(textes(lu.evenements)[0]).toContain('Sachant ce que vous savez');
    expect(lu.partie.etat.attitudes['hesta-cendrebrune']).toBe(avant + 3);
    const relu = moteur.executer(lu.partie, { type: 'examiner', examen: 'inscription-du-linteau' });
    expect(textes(relu.evenements)[0]).toContain('Sachant ce que vous savez');
    expect(relu.partie.etat.attitudes['hesta-cendrebrune']).toBe(avant + 3);
  });

  it('un détail inconnu, d’un autre lieu ou encore caché est refusé ; les boutons suivent ce qui est visible et lu', () => {
    const p0 = depart();
    expect(moteur.executer(p0, { type: 'examiner', examen: 'n-existe-pas' }).refus).toMatch(/rien de ce nom/);
    expect(moteur.executer(p0, { type: 'examiner', examen: 'ailleurs' }).refus).toMatch(/pas à portée/);
    expect(moteur.executer(p0, { type: 'examiner', examen: 'cachee' }).refus).toMatch(/pas à portée/);
    expect(boutons(p0).map((b) => b.element?.titre)).toEqual(['L’inscription du linteau']);
    const vu = moteur.executer({ ...p0, etat: { ...p0.etat, flags: { ...p0.etat.flags, 'niche-vue': true } } }, { type: 'examiner', examen: 'cachee' });
    expect(textes(vu.evenements)[0]).toContain('planche descellée');
    const lu = moteur.executer(vu.partie, { type: 'examiner', examen: 'inscription-du-linteau' }).partie;
    expect(boutons(lu).every((b) => b.style === 'discret')).toBe(true);
    const sait = { ...lu, etat: { ...lu.etat, flags: { ...lu.etat.flags, 'secret-connu': true } } };
    expect(boutons(sait).find((b) => b.element?.id === 'examen:inscription-du-linteau')?.libelle).toBe('Examiner de nouveau');
  });

  it('le conteur voit la liste « À examiner ici » (sans le texte) et possède l’outil examiner', () => {
    const p = depart();
    const fiche = ficheDeTour(moteur, p);
    expect(fiche).toContain('À examiner ici : L’inscription du linteau [id: inscription-du-linteau]');
    expect(fiche).not.toContain('quatre lettres gravées');
    expect(outilsDuConteur(moteur).some((o) => o.function.name === 'examiner')).toBe(true);
  });

  it('la validation : lieu inconnu, doublons, références de la condition et des effets', () => {
    const module = MODULES_STANDARD.find((m) => m.id === 'examens')!;
    expect(module.valider!({ dm, srd })).toEqual([]);
    const casse = { ...dm0, extensions: { examens: [{ ...EXAMENS[0]!, lieu: 'nulle-part' }, EXAMENS[1], EXAMENS[1], { ...EXAMENS[1]!, id: 'b', variantes: [{ id: 'base', condition: { flag: 'x' }, texte: 'y' }] }] } };
    const erreurs = module.valider!({ dm: casse, srd }).join('\n');
    expect(erreurs).toMatch(/Examen « inscription-du-linteau » : lieu inconnu « nulle-part »/);
    expect(erreurs).toMatch(/Examen « cachee » : identifiant en double/);
    expect(erreurs).toMatch(/variante « base » en double ou réservée/);
    const bilan = validerMonde({ ...dm0, extensions: { examens: [{ ...EXAMENS[0]!, variantes: [{ id: 'v', condition: { lieu: 'nulle-part' }, texte: 'x', effets: [{ attitude: { pnj: 'inconnu', delta: 1 } }] }] }] } }, srd);
    expect(bilan.erreurs.join('\n')).toMatch(/Examen « inscription-du-linteau », variante « v » : lieu inconnu « nulle-part »/);
    expect(bilan.erreurs.join('\n')).toMatch(/Examen « inscription-du-linteau », variante « v » : pnj inconnu « inconnu »/);
  });
});

describe('La Citadelle des Marées : chaque détail à examiner se lit, dans son lieu', () => {
  const rc = chargerMonde(join(RACINE_MONDES, 'citadelle-des-marees'));
  if (!rc.ok) throw new Error(rc.erreurs.map((e) => e.message).join('\n'));
  const mc = creerMoteur({ dm: rc.monde, srd }, MODULES_STANDARD);
  const examens = (rc.monde.extensions?.['examens'] ?? []) as { id: string; lieu: string; effets: { fait?: string }[]; variantes: { id: string; condition: { fait?: string; flag?: string }; texte: string }[] }[];
  const g = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  const base = mc.executer(mc.nouvellePartie(g, { graine: 3, niveau: 3 }), { type: 'commencer' }).partie;
  const ici = (lieu: string): Partie => ({ ...base, scene: { type: 'exploration' } as Partie['scene'], etat: { ...base.etat, lieu } });

  it('au moins 20 examens, tous lisibles, avec leur texte', () => {
    expect(examens.length).toBeGreaterThanOrEqual(20);
    for (const e of examens) {
      const res = mc.executer(ici(e.lieu), { type: 'examiner', examen: e.id });
      expect(res.refus, e.id).toBeUndefined();
      expect(textes(res.evenements)[0]!.length, e.id).toBeGreaterThan(150);
    }
  });

  it('la variante remplace la lecture de base quand le fait est connu, et la première lecture apprend les faits prévus', () => {
    for (const e of examens) {
      for (const v of e.variantes) {
        const p = ici(e.lieu);
        const sait = { ...p, etat: { ...p.etat, ...(v.condition.fait ? { faits: [...p.etat.faits, v.condition.fait] } : { flags: { ...p.etat.flags, [v.condition.flag!]: true } }) } };
        const res = mc.executer(sait, { type: 'examiner', examen: e.id });
        expect(textes(res.evenements)[0], `${e.id}/${v.id}`).toBe(v.texte);
      }
      const faits = e.effets.map((x) => x.fait).filter(Boolean) as string[];
      if (faits.length) expect(faits.every((f) => mc.executer(ici(e.lieu), { type: 'examiner', examen: e.id }).partie.etat.faits.includes(f)), e.id).toBe(true);
    }
  });
});

describe('Les origines des héros : la condition heros et les regards d’origine', () => {
  const p0 = depart();
  const heros = p0.etat.heros!;
  const absent = ['guerrier', 'barbare', 'barde', 'clerc', 'druide', 'ensorceleur', 'magicien', 'moine', 'occultiste', 'paladin', 'rodeur', 'roublard'].find((c) => !heros.some((h) => h.classe === c))!;
  const classeDuGroupe = heros[0]!.classe;
  const regards = [
    { condition: { heros: { classe: classeDuGroupe } }, texte: 'Un œil de la classe du groupe y lit autre chose.' },
    { condition: { heros: { classe: absent } }, texte: 'Personne ici ne lirait cela.' },
    { condition: { heros: { classe: classeDuGroupe, espece: heros[0]!.espece, historique: heros[0]!.historique } }, texte: 'Le premier héros, tout entier, reconnaît le détail.' },
  ];
  const d2 = { ...dm0, extensions: { ...(dm0.extensions ?? {}), examens: [{ ...EXAMENS[0]!, regards }] } };
  const m2 = creerMoteur({ dm: d2, srd }, MODULES_STANDARD);

  it('l’état garde les origines du groupe (classe, espèce, historique de chaque héros)', () => {
    expect(heros).toHaveLength(p0.groupe.length);
    expect(heros[0]).toEqual({ classe: p0.groupe[0]!.fiche.classe, espece: p0.groupe[0]!.fiche.espece, historique: p0.groupe[0]!.fiche.historique });
  });

  it('un regard s’ajoute après la lecture quand un héros du groupe a l’origine demandée, jamais sinon', () => {
    const res = m2.executer(p0, { type: 'examiner', examen: 'inscription-du-linteau' });
    const t = textes(res.evenements);
    expect(t[0]).toContain('quatre lettres gravées');
    expect(t).toContain('Un œil de la classe du groupe y lit autre chose.');
    expect(t).toContain('Le premier héros, tout entier, reconnaît le détail.');
    expect(t).not.toContain('Personne ici ne lirait cela.');
    expect(t.length).toBe(3);
  });

  it('la validation connaît les classes, espèces et historiques du SRD', () => {
    const bilan = validerMonde({ ...dm0, extensions: { examens: [{ ...EXAMENS[0]!, regards: [{ condition: { heros: { classe: 'chevalier-dragon', espece: 'elfe', historique: 'pirate' } }, texte: 'x' }] }] } }, srd);
    const e = bilan.erreurs.join('\n');
    expect(e).toMatch(/classe inconnu « chevalier-dragon »/);
    expect(e).toMatch(/historique inconnu « pirate »/);
    expect(e).not.toMatch(/espece inconnu/);
  });
});

describe('Le Val des Cendres : chaque détail à examiner se lit, dans son lieu', () => {
  const mv = creerMoteur({ dm: dm0, srd }, MODULES_STANDARD);
  const examens = (dm0.extensions?.['examens'] ?? []) as { id: string; lieu: string; variantes: { condition: { fait?: string; flag?: string }; texte: string }[] }[];
  const g = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  const base = mv.executer(mv.nouvellePartie(g, { graine: 3, niveau: 3 }), { type: 'commencer' }).partie;
  const ici = (lieu: string, faits: string[] = []): Partie => ({ ...base, scene: { type: 'exploration' } as Partie['scene'], etat: { ...base.etat, lieu, faits: [...base.etat.faits, ...faits] } });

  it('au moins 20 examens, tous lisibles ; la variante remplace la lecture de base quand son fait est connu', () => {
    expect(examens.length).toBeGreaterThanOrEqual(20);
    for (const e of examens) {
      const res = mv.executer(ici(e.lieu), { type: 'examiner', examen: e.id });
      expect(res.refus, e.id).toBeUndefined();
      expect(textes(res.evenements)[0]!.length, e.id).toBeGreaterThan(150);
      for (const v of e.variantes) {
        const lu = mv.executer(ici(e.lieu, v.condition.fait ? [v.condition.fait] : []), { type: 'examiner', examen: e.id });
        expect(textes(lu.evenements)[0], e.id).toBe(v.texte);
      }
    }
  });
});
