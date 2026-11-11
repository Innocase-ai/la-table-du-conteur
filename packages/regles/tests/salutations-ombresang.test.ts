// Lame-Rousse : les PNJ se souviennent. Chaque salutation variable se déclenche, avec le vrai moteur, quand le groupe a fait ce que le PNJ
// a pu voir ou apprendre ; sans cela, le PNJ garde sa salutation d'origine. Les PNJ ne réagissent qu'à ce qu'ils ont pu voir (`temoin`).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  consignerIssue,
  etatInitial,
  herosPreTires,
  nouvellePartie,
  parler,
  personnageDepuisFiche,
  type DonneesMonde,
  type Generateur,
  type PartieMonde,
} from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const SUCCES: Generateur = () => 0.999;

// `MONDE_OMBRESANG` : un autre dossier du monde (essai sur une copie, avant d'écrire dans l'histoire).
const r = chargerMonde(process.env['MONDE_OMBRESANG'] ?? join(RACINE_MONDES, 'ombresang'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm: DonneesMonde = r.monde;

const groupe = () => herosPreTires(srd).map((h) => personnageDepuisFiche(h.fiche, { id: h.fiche.nom.toLowerCase() }));
/** Le groupe est chez ce PNJ, rien n'a été fait. */
function chez(pnj: string): PartieMonde {
  const p = nouvellePartie(dm, etatInitial(dm, 1), groupe(), SUCCES);
  p.etat.lieu = dm.pnj.get(pnj)!.lieu;
  return p;
}
const salut = (p: PartieMonde, pnj: string) => parler(p, pnj).narrations[0]!;
const neutre = (pnj: string) => dm.pnj.get(pnj)!.salutations.neutre;
const variante = (pnj: string, i = 0) => dm.pnj.get(pnj)!.salutations.variantes[i]!.texte;

describe('Lame-Rousse : les PNJ se souviennent de ce que le groupe a fait', () => {
  it('au moins cinq PNJ saluent autrement selon ce que le groupe a vécu, chacun avec un texte direct', () => {
    const avec = [...dm.pnj.values()].filter((p) => p.salutations.variantes.length > 0);
    expect(avec.length).toBeGreaterThanOrEqual(5);
    for (const p of avec) for (const v of p.salutations.variantes) expect(v.texte).toMatch(/^« [\s\S]+ »$/);
  });

  it('sans rien avoir fait, chaque PNJ garde sa salutation d’origine', () => {
    for (const pnj of ['odile-braise', 'gorm-meule', 'soeur-martha', 'joran-deserteur', 'vorn-bras-de-laiton', 'elinor-vane', 'brisk-sergent', 'mira-sorel', 'maitre-d-armes-sans-corps']) {
      expect(salut(chez(pnj), pnj), pnj).toBe(neutre(pnj));
    }
  });

  it('Odile réagit à la place sauvée, à la poutre regardée, et aux deux ensemble (la première condition vraie gagne)', () => {
    const place = chez('odile-braise');
    place.etat.flags['lr-place-sauvee'] = true;
    expect(salut(place, 'odile-braise')).toBe(variante('odile-braise', 1));
    const poutre = chez('odile-braise');
    poutre.etat.flags['evt-la-lame-de-la-poutre'] = true;
    expect(salut(poutre, 'odile-braise')).toBe(variante('odile-braise', 2));
    poutre.etat.flags['lr-place-sauvee'] = true;
    expect(salut(poutre, 'odile-braise')).toBe(variante('odile-braise', 0));
  });

  it('Gorm réagit à son apprenti ramené, puis au chargement récupéré', () => {
    const p = chez('gorm-meule');
    p.etat.flags['lr-chargement-recupere'] = true;
    expect(salut(p, 'gorm-meule')).toBe(variante('gorm-meule', 1));
    p.etat.flags['lr-ansel-sauve'] = true;
    expect(salut(p, 'gorm-meule')).toBe(variante('gorm-meule', 0));
  });

  it('Martha réagit à la place sauvée', () => {
    const p = chez('soeur-martha');
    p.etat.flags['lr-place-sauvee'] = true;
    expect(salut(p, 'soeur-martha')).toBe(variante('soeur-martha'));
  });

  it('Joran n’a vu que ce qui s’est passé sur la place : la victoire sur les épées, puis la charrette retenue', () => {
    const p = chez('joran-deserteur');
    p.etat.flags['lr-foule-reconnaissante'] = true;
    expect(salut(p, 'joran-deserteur')).toBe(variante('joran-deserteur', 1));
    consignerIssue(p, 'lames-de-la-place', 'victoire'); // Joran est à la place : témoin
    expect(salut(p, 'joran-deserteur')).toBe(variante('joran-deserteur', 0));
  });

  it('un PNJ qui n’était pas là ne réagit pas à la victoire : Joran ignore un combat gagné ailleurs', () => {
    const p = chez('joran-deserteur');
    p.etat.lieu = 'lr-bastion-cour';
    consignerIssue(p, 'hommes-de-la-baillie', 'victoire');
    p.etat.lieu = dm.pnj.get('joran-deserteur')!.lieu;
    expect(salut(p, 'joran-deserteur')).toBe(neutre('joran-deserteur'));
  });

  it('Vorn réagit aux épées abattues devant lui dans sa forge (témoin de la victoire), pas à une victoire ailleurs', () => {
    const ailleurs = chez('vorn-bras-de-laiton');
    ailleurs.etat.lieu = 'lr-place';
    consignerIssue(ailleurs, 'lames-de-la-place', 'victoire');
    ailleurs.etat.lieu = 'lr-forge-vorn';
    expect(salut(ailleurs, 'vorn-bras-de-laiton')).toBe(neutre('vorn-bras-de-laiton'));
    const p = chez('vorn-bras-de-laiton');
    consignerIssue(p, 'lames-du-foyer', 'victoire');
    expect(salut(p, 'vorn-bras-de-laiton')).toBe(variante('vorn-bras-de-laiton'));
  });

  it('Élinor apprend que ses hommes ont été battus ou désarmés, sans y avoir assisté', () => {
    for (const drapeau of ['lr-hommes-de-la-baillie-battus', 'lr-hommes-de-main-isoles']) {
      const p = chez('elinor-vane');
      p.etat.flags[drapeau] = true;
      expect(salut(p, 'elinor-vane'), drapeau).toBe(variante('elinor-vane'));
    }
  });

  it('Brisk distingue la herse réparée, les péagers qui posent les armes, et les hommes de main battus', () => {
    const herse = chez('brisk-sergent');
    herse.etat.flags['lr-herse-reparee'] = true;
    expect(salut(herse, 'brisk-sergent')).toBe(variante('brisk-sergent', 0));
    const isoles = chez('brisk-sergent');
    consignerIssue(isoles, 'hommes-de-la-baillie', 'alternative', 'intimider-les-peagers');
    expect(salut(isoles, 'brisk-sergent')).toBe(variante('brisk-sergent', 1));
    const battus = chez('brisk-sergent');
    consignerIssue(battus, 'hommes-de-la-baillie', 'victoire');
    expect(salut(battus, 'brisk-sergent')).toBe(variante('brisk-sergent', 2));
    expect(variante('brisk-sergent', 1)).not.toBe(variante('brisk-sergent', 2));
  });

  it('Mira remercie le groupe d’avoir tenu le camp', () => {
    const p = chez('mira-sorel');
    p.etat.flags['lr-camp-defendu'] = true;
    expect(salut(p, 'mira-sorel')).toBe(variante('mira-sorel'));
  });

  it('le Maître d’Armes entend ce qui se dit sur le parvis : un salut ou une prière, ou une note fausse', () => {
    for (const drapeau of ['evt-le-chant-de-la-lame-paladin', 'evt-le-chant-de-la-lame-clerc']) {
      const p = chez('maitre-d-armes-sans-corps');
      p.etat.flags[drapeau] = true;
      expect(salut(p, 'maitre-d-armes-sans-corps'), drapeau).toBe(variante('maitre-d-armes-sans-corps', 0));
    }
    const fausse = chez('maitre-d-armes-sans-corps');
    fausse.etat.flags['chant-note-fausse'] = true;
    expect(salut(fausse, 'maitre-d-armes-sans-corps')).toBe(variante('maitre-d-armes-sans-corps', 1));
  });
});
