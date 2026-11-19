// F5 (PRD-SAGA), pas (a) — le carnet de campagne dans l'état et la condition `{ campagne: id }`. Additif (P1, P2, P4) : sans carnet, la
// condition est fausse, l'état garde la forme d'avant, la version de sauvegarde ne change pas ; avec lui, toute condition du monde
// (sujet de PNJ, rencontre, lieu, fin…) peut lire un écho d'un épisode précédent.
import { describe, expect, it } from 'vitest';
import { Condition, creerMoteur, etatInitial, herosPreTires, MODULES_STANDARD, personnageDepuisFiche, VERSION_PARTIE, type DonneesMonde } from '../src';
import { chargerDonneesSrd } from '../src/donnees-node';
import { chargerMonde } from '../src/monde/chargeur';
import { sujetsDisponibles } from '../src/monde/dialogue';
import { evaluerCondition } from '../src/monde/etat';
import { nouvellePartie } from '../src/monde/exploration';
import { refsCondition } from '../src/monde/references';
import { dossierMonde } from './mondes-essai';

const srd = chargerDonneesSrd();
const charger = (): DonneesMonde => {
  const r = chargerMonde(dossierMonde('val-des-cendres'));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  return r.monde;
};
const groupe = () => herosPreTires(srd).map((h) => personnageDepuisFiche(h.fiche, { id: h.fiche.nom.toLowerCase() }));

describe('la condition `campagne`', () => {
  it('le schéma l’accepte seule et refuse tout ce qui l’accompagne', () => {
    expect(Condition.safeParse({ campagne: 'epi1-fin-sauve-le-village' }).success).toBe(true);
    expect(Condition.safeParse({ campagne: 'a', flag: 'b' }).success).toBe(false);
    expect(Condition.safeParse({ campagne: '' }).success).toBe(false);
    expect(Condition.safeParse({ et: [{ campagne: 'a' }, { non: { campagne: 'b' } }] }).success).toBe(true);
  });

  it('est fausse sans carnet, vraie quand le carnet porte l’écho, et se combine comme les autres', () => {
    const dm = charger();
    const sans = etatInitial(dm, 3);
    const avec = etatInitial(dm, 3, ['epi1-sauve', 'epi1-allie']);
    expect(evaluerCondition({ campagne: 'epi1-sauve' }, sans)).toBe(false);
    expect(evaluerCondition({ campagne: 'epi1-sauve' }, avec)).toBe(true);
    expect(evaluerCondition({ campagne: 'epi1-autre' }, avec)).toBe(false);
    expect(evaluerCondition({ non: { campagne: 'epi1-autre' } }, avec)).toBe(true);
    expect(evaluerCondition({ et: [{ campagne: 'epi1-sauve' }, { campagne: 'epi1-allie' }] }, avec)).toBe(true);
    expect(evaluerCondition({ ou: [{ campagne: 'epi1-autre' }, { campagne: 'epi1-allie' }] }, avec)).toBe(true);
    expect(evaluerCondition({ et: [{ campagne: 'epi1-sauve' }, { campagne: 'epi1-autre' }] }, avec)).toBe(false);
  });

  it('une sauvegarde d’avant (sans le champ) la lit comme fausse', () => {
    const e = etatInitial(charger(), 3);
    delete e.campagne;
    expect(evaluerCondition({ campagne: 'x' }, e)).toBe(false);
  });

  it('ne cite aucune entité du monde (le validateur n’a rien à y chercher)', () => {
    const refs: string[] = [];
    refsCondition({ et: [{ campagne: 'epi1-sauve' }, { flag: 'f' }] }, (g, id) => refs.push(`${g}:${id}`));
    expect(refs).toEqual(['flag:f']);
  });

  it('commande un sujet de PNJ : il n’est proposé qu’avec l’écho', () => {
    const dm = charger();
    const pnj = [...dm.pnj.values()].find((p) => p.sujets.length > 1 && !p.sujets[0]!.condition && !p.sujets[0]!.attitudeMin)!;
    pnj.sujets[0]!.condition = { campagne: 'epi1-sauve' };
    const id = pnj.sujets[0]!.id;
    const sans = nouvellePartie(dm, etatInitial(dm, 3), groupe(), () => 0.5);
    const avec = nouvellePartie(dm, etatInitial(dm, 3, ['epi1-sauve']), groupe(), () => 0.5);
    expect(sujetsDisponibles(sans, pnj).map((s) => s.id)).not.toContain(id);
    expect(sujetsDisponibles(avec, pnj).map((s) => s.id)).toContain(id);
  });
});

describe('le carnet dans l’état et dans la partie (P4)', () => {
  it('sans carnet, l’état n’a pas le champ : même forme qu’avant', () => {
    const dm = charger();
    expect('campagne' in etatInitial(dm, 3)).toBe(false);
    expect('campagne' in etatInitial(dm, 3, [])).toBe(false);
    expect(etatInitial(dm, 3, [])).toEqual(etatInitial(dm, 3));
  });

  it('avec carnet, les échos sont gardés sans doublon', () => {
    expect(etatInitial(charger(), 3, ['a', 'b', 'a']).campagne).toEqual(['a', 'b']);
  });

  it('une partie neuve reçoit le carnet, le garde à la sauvegarde et au rechargement, et le monde le lit', () => {
    const dm = charger();
    const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
    const p = moteur.executer(moteur.nouvellePartie(groupe(), { graine: 3, niveau: 3, campagne: ['epi1-sauve'] }), { type: 'commencer' }).partie;
    expect(p.etat.campagne).toEqual(['epi1-sauve']);
    const rechargee = moteur.charger(JSON.stringify(p));
    expect(rechargee.etat.campagne).toEqual(['epi1-sauve']);
    expect(evaluerCondition({ campagne: 'epi1-sauve' }, rechargee.etat)).toBe(true);
  });

  it('une partie sans carnet ne porte pas le champ, et la version de sauvegarde ne bouge pas', () => {
    const dm = charger();
    const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
    const p = moteur.executer(moteur.nouvellePartie(groupe(), { graine: 3, niveau: 3 }), { type: 'commencer' }).partie;
    expect('campagne' in p.etat).toBe(false);
    expect(JSON.stringify(p)).not.toContain('"campagne"');
    expect(p.version).toBe(4);
    expect(VERSION_PARTIE).toBe(4);
  });

  it('le carnet résiste aux actions du jeu (il n’est pas modifié en cours de partie)', () => {
    const dm = charger();
    const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
    let p = moteur.executer(moteur.nouvellePartie(groupe(), { graine: 3, niveau: 3, campagne: ['epi1-sauve'] }), { type: 'commencer' }).partie;
    const prop = moteur.propositions(p).find((x) => x.ordre?.type === 'aller');
    expect(prop, 'un déplacement est proposé').toBeDefined();
    p = moteur.executer(p, prop!.ordre!).partie;
    expect(p.etat.lieu).not.toBe(dm.monde.depart.lieu);
    expect(p.etat.campagne).toEqual(['epi1-sauve']);
  });
});
