// L'en-tête de l'aventure : heure lisible, quête suivie et son objectif, badges de changement d'état.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { EtatMonde } from '@crpg/regles';
import { chargerMonde } from '../../../packages/regles/src/monde/chargeur';
import { MONDES_ESSAI } from '../../../packages/regles/tests/mondes-essai';
import { badgesEtat, boussoleDeQuete, heureLisible, momentLisible, queteSuivie, type NomsBadge } from './boussole-regles';

const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde;
const [q1, q2, q3] = [...dm.quetes.values()];
const etapeDe = (id: string) => dm.quetes.get(id)!.debut;

const noms: NomsBadge = { objet: (id) => `<${id}>`, jauge: (id) => `Jauge ${id}` };
const etat = (sur: Partial<EtatMonde> = {}): EtatMonde =>
  ({ monde: 'm', lieu: 'a', jour: 1, heure: 8, niveauGroupe: 1, flags: {}, faits: [], jauges: {}, reputations: {}, attitudes: {}, pnjEtats: {}, pnjLieux: {}, inventaire: {}, pieces: 0, xp: 0, quetes: {}, lieuxVisites: [], debloques: [], rencontresFaites: [], evenementsJoues: [], narrations: [], ...sur }) as EtatMonde;
const active = (id: string) => ({ statut: 'active' as const, actives: [etapeDe(id)], accomplies: [] });

describe('l’heure lisible', () => {
  it('donne l’heure et le moment de la journée', () => {
    expect(heureLisible(14)).toBe('14 h · après-midi');
    expect(heureLisible(8)).toBe('8 h · matin');
    expect(heureLisible(19)).toBe('19 h · soir');
    expect(heureLisible(2)).toBe('2 h · nuit');
    expect(heureLisible(24)).toBe('0 h · nuit');
    expect(heureLisible(13.6)).toBe('13 h · après-midi');
  });
  it('les bornes des moments', () => {
    expect([5, 6, 11, 12, 17, 18, 21, 22].map(momentLisible)).toEqual(['nuit', 'matin', 'matin', 'après-midi', 'après-midi', 'soir', 'soir', 'nuit']);
  });
});

describe('la quête suivie', () => {
  it('sans quête en cours : rien', () => {
    expect(queteSuivie(dm, {})).toBeUndefined();
    expect(queteSuivie(dm, { [q1!.id]: { statut: 'proposee', actives: [], accomplies: [] } })).toBeUndefined();
    expect(boussoleDeQuete(dm, {})).toBeUndefined();
  });

  it('par défaut : la dernière quête entrée au journal parmi celles en cours (ni proposée, ni finie)', () => {
    const quetes = { [q1!.id]: active(q1!.id), [q2!.id]: active(q2!.id), [q3!.id]: { statut: 'terminee' as const, actives: [], accomplies: [etapeDe(q3!.id)] } };
    expect(queteSuivie(dm, quetes)).toBe(q2!.id);
  });

  it('le choix du joueur prime tant que la quête est en cours ; sinon retour à la règle', () => {
    const quetes = { [q1!.id]: active(q1!.id), [q2!.id]: active(q2!.id) };
    expect(queteSuivie(dm, quetes, q1!.id)).toBe(q1!.id);
    const finie = { ...quetes, [q1!.id]: { statut: 'terminee' as const, actives: [], accomplies: [etapeDe(q1!.id)] } };
    expect(queteSuivie(dm, finie, q1!.id)).toBe(q2!.id);
    expect(queteSuivie(dm, quetes, 'quete-inconnue')).toBe(q2!.id);
  });

  it('la boussole donne le nom, l’objectif de l’étape active et la liste des quêtes en cours (la plus récente d’abord)', () => {
    const quetes = { [q1!.id]: active(q1!.id), [q2!.id]: active(q2!.id) };
    const b = boussoleDeQuete(dm, quetes)!;
    expect(b.id).toBe(q2!.id);
    expect(b.nom).toBe(q2!.nom);
    expect(b.objectif).toBe(q2!.etapes.find((e) => e.id === etapeDe(q2!.id))!.texte);
    expect(b.enCours.map((x) => x.id)).toEqual([q2!.id, q1!.id]);
    const autre = boussoleDeQuete(dm, quetes, q1!.id)!;
    expect(autre.id).toBe(q1!.id);
  });

  it('plusieurs étapes actives : la première s’affiche, le nombre des autres est compté', () => {
    const def = [...dm.quetes.values()].find((q) => q.etapes.length >= 2)!;
    const quetes = { [def.id]: { statut: 'active' as const, actives: def.etapes.slice(0, 2).map((e) => e.id), accomplies: [] } };
    const b = boussoleDeQuete(dm, quetes)!;
    expect(b.etapesEnPlus).toBe(1);
    expect(b.objectif).toBe(def.etapes[0]!.texte);
  });

  it('le lieu de l’étape est nommé quand l’auteur l’a donné', () => {
    const [lieu] = [...dm.lieux.values()];
    const def = { ...q1!, etapes: q1!.etapes.map((e) => ({ ...e, lieu: lieu!.id })) };
    const avecLieu = { ...dm, quetes: new Map([[def.id, def]]) } as typeof dm;
    const b = boussoleDeQuete(avecLieu, { [def.id]: active(def.id) })!;
    expect(b.lieu).toBe(lieu!.nom);
    expect(boussoleDeQuete(dm, { [q1!.id]: active(q1!.id) })!.lieu).toBeUndefined();
  });
});

describe('les badges de changement d’état', () => {
  it('un état identique ne donne rien', () => {
    expect(badgesEtat(etat(), etat(), noms)).toEqual([]);
  });

  it('or, PX et temps : signe, montant, genre', () => {
    const b = badgesEtat(etat({ pieces: 20, xp: 100, heure: 8 }), etat({ pieces: 5, xp: 150, heure: 10 }), noms);
    expect(b.map((x) => [x.texte, x.genre])).toEqual([
      ['−15 po', 'perte'],
      ['+50 PX', 'gain'],
      ['+2 h', 'temps'],
    ]);
    expect(badgesEtat(etat({ pieces: 1 }), etat({ pieces: 1.5 }), noms)[0]!.texte).toBe('+0,5 po');
  });

  it('le temps compte les jours : 22 h puis 2 h le lendemain = +4 h', () => {
    const b = badgesEtat(etat({ jour: 1, heure: 22 }), etat({ jour: 2, heure: 2 }), noms);
    expect(b).toHaveLength(1);
    expect(b[0]!.texte).toBe('+4 h');
  });

  it('une jauge qui bouge, un objet gagné ou perdu', () => {
    const b = badgesEtat(etat({ jauges: { menace: 2 }, inventaire: { corde: 1, rations: 3 } }), etat({ jauges: { menace: 3 }, inventaire: { corde: 2, torche: 1 } }), noms);
    const textes = b.map((x) => x.texte);
    expect(textes).toContain('Jauge menace +1');
    expect(textes).toContain('+1 <corde>');
    expect(textes).toContain('+1 <torche>');
    expect(textes).toContain('−3 <rations>');
    expect(b.find((x) => x.texte === '−3 <rations>')!.genre).toBe('perte');
  });

  it('au plus cinq badges : trop d’objets se regroupent', () => {
    const inventaire = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`o${i}`, 1]));
    const b = badgesEtat(etat({ pieces: 10 }), etat({ pieces: 0, xp: 5, inventaire }), noms);
    expect(b.length).toBeLessThanOrEqual(5);
    expect(b.map((x) => x.texte)).toContain('+8 objets');
  });

  it('les clés sont uniques (une clé = un badge à l’écran)', () => {
    const b = badgesEtat(etat({ inventaire: { a: 1 } }), etat({ pieces: 3, inventaire: { a: 2, b: 1, c: 1 } }), noms);
    expect(new Set(b.map((x) => x.cle)).size).toBe(b.length);
  });
});
