// La mémoire du groupe (phase 1 du plan de mémoire) : l'issue des rencontres, les PNJ à qui l'on a parlé, les témoins,
// et les conditions d'auteur `rencontre`, `parle` et `temoin` qui les lisent.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  aller,
  consignerIssue,
  Condition,
  etatInitial,
  evaluerCondition,
  herosPreTires,
  issueRencontre,
  nouvellePartie,
  parler,
  personnageDepuisFiche,
  TEMOIGNAGES_MAX,
  validerMonde,
  type DonneesMonde,
  type Generateur,
  type PartieMonde,
} from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const SUCCES: Generateur = () => 0.999;

function monde(): DonneesMonde {
  const r = chargerMonde(join(RACINE_MONDES, 'val-des-cendres'));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  return r.monde;
}
const groupe = () => herosPreTires(srd).map((h) => personnageDepuisFiche(h.fiche, { id: h.fiche.nom.toLowerCase() }));
const partieDe = (dm: DonneesMonde): PartieMonde => nouvellePartie(dm, etatInitial(dm, 5), groupe(), SUCCES);

/** Le groupe arrive à la Forge du Cœur : Thalgrin y est, la garde se présente. */
function aLaForge(): PartieMonde {
  const p = partieDe(monde());
  p.etat.lieu = 'hf-pont-de-la-veine';
  aller(p, 'hf-forge-du-coeur');
  return p;
}
const GARDE = 'hf-r-garde-de-thalgrin';
const THALGRIN = 'thalgrin-coeur-d-enclume';
const vraie = (p: PartieMonde, c: Condition) => evaluerCondition(c, p.etat);

describe('l’issue des rencontres', () => {
  it('une victoire est consignée avec le jour et le lieu, et la condition `rencontre` la lit', () => {
    const p = aLaForge();
    expect(vraie(p, { rencontre: { id: GARDE } })).toBe(false);
    issueRencontre(p, GARDE, { type: 'victoire' });
    expect(p.etat.exploration.issues?.[GARDE]).toEqual({ type: 'victoire', jour: p.etat.jour, lieu: 'hf-forge-du-coeur' });
    expect(vraie(p, { rencontre: { id: GARDE } })).toBe(true);
    expect(vraie(p, { rencontre: { id: GARDE, issue: 'victoire' } })).toBe(true);
    expect(vraie(p, { rencontre: { id: GARDE, issue: 'fuite' } })).toBe(false);
    expect(vraie(p, { rencontre: { id: GARDE, issue: 'alternative' } })).toBe(false);
  });

  it('une alternative garde son identifiant ; on peut exiger cette alternative', () => {
    const p = aLaForge();
    issueRencontre(p, GARDE, { type: 'alternative', id: 'parlementer' });
    expect(p.etat.exploration.issues?.[GARDE]).toMatchObject({ type: 'alternative', alternative: 'parlementer' });
    expect(vraie(p, { rencontre: { id: GARDE, issue: 'alternative', alternative: 'parlementer' } })).toBe(true);
    expect(vraie(p, { rencontre: { id: GARDE, alternative: 'serment' } })).toBe(false);
  });

  it('la fuite et la défaite sont consignées aussi (la rencontre fuie n’est pas « faite » pour autant)', () => {
    const p = aLaForge();
    issueRencontre(p, GARDE, { type: 'fuite' });
    expect(vraie(p, { rencontre: { id: GARDE, issue: 'fuite' } })).toBe(true);
    expect(p.etat.rencontresFaites).not.toContain(GARDE);
    issueRencontre(p, GARDE, { type: 'defaite' });
    expect(vraie(p, { rencontre: { id: GARDE, issue: 'defaite' } })).toBe(true);
    expect(vraie(p, { rencontre: { id: GARDE, issue: 'fuite' } })).toBe(false); // la dernière issue l'emporte
  });

  it('une sauvegarde d’avant la mémoire : la rencontre faite compte, mais sans issue connue', () => {
    const p = partieDe(monde());
    p.etat.rencontresFaites.push(GARDE);
    expect(vraie(p, { rencontre: { id: GARDE } })).toBe(true);
    expect(vraie(p, { rencontre: { id: GARDE, issue: 'victoire' } })).toBe(false);
    delete (p.etat.exploration as { issues?: unknown }).issues;
    expect(vraie(p, { parle: THALGRIN })).toBe(false);
  });

  it('l’issue est consignée avant les effets de la rencontre : un événement qui la lit la voit tout de suite', () => {
    const dm = monde();
    dm.evenements.set('test-ev-apres-victoire', {
      id: 'test-ev-apres-victoire',
      declencheur: 'condition',
      condition: { rencontre: { id: GARDE, issue: 'victoire' } },
      unique: true,
      narration: 'Le silence retombe après la victoire.',
      effets: [{ flag: 'test-victoire-vue' }],
    });
    const p = partieDe(dm);
    p.etat.lieu = 'hf-pont-de-la-veine';
    aller(p, 'hf-forge-du-coeur');
    issueRencontre(p, GARDE, { type: 'victoire' });
    expect(p.etat.flags['test-victoire-vue']).toBe(true);
  });
});

describe('les témoins', () => {
  it('les PNJ présents quand la rencontre se dénoue en sont les témoins', () => {
    const p = aLaForge();
    issueRencontre(p, GARDE, { type: 'victoire' });
    expect(vraie(p, { temoin: { pnj: THALGRIN } })).toBe(true);
    expect(vraie(p, { temoin: { pnj: THALGRIN, genre: 'victoire' } })).toBe(true);
    expect(vraie(p, { temoin: { pnj: THALGRIN, genre: 'fuite' } })).toBe(false);
    // Un PNJ qui n'était pas là ne sait rien.
    expect(vraie(p, { temoin: { pnj: 'hesta-cendrebrune' } })).toBe(false);
  });

  it('les témoignages sont plafonnés aux plus récents', () => {
    const p = partieDe(monde());
    for (let i = 0; i < TEMOIGNAGES_MAX + 15; i++) consignerIssue(p, `rencontre-${i}`, 'victoire');
    const liste = p.etat.exploration.temoignages!;
    expect(liste).toHaveLength(TEMOIGNAGES_MAX);
    expect(liste[0]!.ref).toBe('rencontre-15');
    expect(liste.at(-1)!.ref).toBe(`rencontre-${TEMOIGNAGES_MAX + 14}`);
  });
});

describe('les paroles', () => {
  it('parler à un PNJ (salutation, sujet) le consigne, et la condition `parle` le lit', () => {
    const dm = monde();
    const p = partieDe(dm);
    p.etat.lieu = dm.pnj.get('hesta-cendrebrune')!.lieu;
    expect(vraie(p, { parle: 'hesta-cendrebrune' })).toBe(false);
    parler(p, 'hesta-cendrebrune');
    expect(p.etat.exploration.pnjVus?.['hesta-cendrebrune']).toEqual({ premierJour: p.etat.jour, dernierJour: p.etat.jour, paroles: 1 });
    expect(vraie(p, { parle: 'hesta-cendrebrune' })).toBe(true);
    p.etat.jour += 2;
    parler(p, 'hesta-cendrebrune', dm.pnj.get('hesta-cendrebrune')!.sujets[0]!.id);
    expect(p.etat.exploration.pnjVus?.['hesta-cendrebrune']).toMatchObject({ dernierJour: p.etat.jour, paroles: 2 });
    expect(p.etat.exploration.pnjVus?.['hesta-cendrebrune']!.premierJour).toBe(1);
  });

  it('une sauvegarde d’avant la mémoire : un sujet déjà abordé suffit à dire que le groupe a parlé', () => {
    const p = partieDe(monde());
    p.etat.exploration.sujetsVus.push('hesta-cendrebrune:la-lanterne');
    expect(vraie(p, { parle: 'hesta-cendrebrune' })).toBe(true);
    expect(vraie(p, { parle: 'aurele-montclar' })).toBe(false);
  });

  it('une condition d’auteur sur la mémoire gouverne vraiment un sujet de dialogue', () => {
    const dm = monde();
    const hesta = dm.pnj.get('hesta-cendrebrune')!;
    hesta.sujets.push({ id: 'test-je-sais-pour-la-garde', mots: ['garde'], question: 'test', reponse: 'Vous avez donc affronté la garde du roi.', revele: [], effets: [], unique: false, condition: { rencontre: { id: GARDE, issue: 'victoire' } } });
    const p = partieDe(dm);
    p.etat.lieu = hesta.lieu;
    expect(parler(p, 'hesta-cendrebrune', 'test-je-sais-pour-la-garde').ok).toBe(false);
    p.etat.exploration.issues = { [GARDE]: { type: 'victoire', jour: 1, lieu: 'hf-forge-du-coeur' } };
    expect(parler(p, 'hesta-cendrebrune', 'test-je-sais-pour-la-garde').ok).toBe(true);
  });
});

describe('le format et la validation', () => {
  it('le schéma accepte les trois conditions et refuse une issue inconnue', () => {
    expect(Condition.safeParse({ rencontre: { id: 'garde', issue: 'victoire', alternative: 'parlementer' } }).success).toBe(true);
    expect(Condition.safeParse({ parle: 'hesta-cendrebrune' }).success).toBe(true);
    expect(Condition.safeParse({ temoin: { pnj: 'thalgrin', genre: 'defaite' } }).success).toBe(true);
    expect(Condition.safeParse({ rencontre: { id: 'garde', issue: 'triomphe' } }).success).toBe(false);
    expect(Condition.safeParse({ parle: 'Pas Un Id' }).success).toBe(false);
  });

  it('le validateur signale une rencontre ou un PNJ inconnu dans ces conditions', () => {
    const dm = monde();
    const hesta = dm.pnj.get('hesta-cendrebrune')!;
    hesta.sujets.push(
      { id: 'test-a', mots: ['a'], reponse: 'x'.repeat(60), revele: [], effets: [], unique: false, condition: { rencontre: { id: 'rencontre-fantome' } } },
      { id: 'test-b', mots: ['b'], reponse: 'x'.repeat(60), revele: [], effets: [], unique: false, condition: { parle: 'pnj-fantome' } },
      { id: 'test-c', mots: ['c'], reponse: 'x'.repeat(60), revele: [], effets: [], unique: false, condition: { temoin: { pnj: 'autre-fantome' } } },
    );
    const erreurs = validerMonde(dm, srd).erreurs.join('\n');
    expect(erreurs).toMatch(/rencontre-fantome/);
    expect(erreurs).toMatch(/pnj-fantome/);
    expect(erreurs).toMatch(/autre-fantome/);
  });
});
