// Sujet.variantes : la réponse d'un sujet écrit évolue avec l'état du monde (première variante vraie, repli sur la réponse de base),
// comme les salutations (`salutations.variantes`). `revele` et `effets` restent ceux du sujet, communs à toutes les variantes.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, Canon, etatInitial, groupeConseille, parler, personnageDepuisFiche, revoirMonde, Sujet, validerMonde, type DonneesMonde } from '../src';
import { nouvellePartie, type PartieMonde } from '../src/monde/exploration';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { reponseDuSujet } from '../src/monde/dialogue';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const BREGOR = 'bregor-le-borgne';
const COMPTOIR = 'ald-auberge-comptoir-et-cellier';
const LONG = 'Il se penche sur le comptoir, essuie une chope qui n’en a pas besoin, puis baisse la voix : « Les gens d’ici préfèrent ne pas en parler, et je ne suis pas sûr de les blâmer. Ce qui est arrivé à la grange, on le sait tous, mais personne ne l’a vu de ses yeux. Demandez au charretier, il en sait plus que moi. »';

function marche(): DonneesMonde {
  const r = chargerMonde(join(RACINE_MONDES, 'marche-d-ombrefiel'));
  if (!r.ok) throw new Error('monde illisible');
  return r.monde;
}

function partie(dm: DonneesMonde): PartieMonde {
  const groupe = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  const etat = etatInitial(dm);
  etat.lieu = COMPTOIR;
  etat.heure = 10;
  return nouvellePartie(dm, etat, groupe, () => 0.999);
}

/** Un sujet ouvert de Brégor, vidé de ses effets, avec deux variantes (la première sur `a`, la seconde sur `b`). */
function sujetAVariantes(dm: DonneesMonde) {
  const sujet = dm.pnj.get(BREGOR)!.sujets.find((s) => !s.condition && !s.attitudeMin)!;
  sujet.unique = false;
  sujet.effets = [];
  sujet.revele = [];
  sujet.reponse = 'BASE';
  sujet.variantes = [
    { condition: { flag: 'a' }, reponse: 'VARIANTE-A' },
    { condition: { flag: 'b' }, reponse: 'VARIANTE-B' },
  ];
  return sujet;
}

const dit = (p: PartieMonde, id: string) => parler(p, BREGOR, id).narrations[0];

describe('Sujet.variantes : quelle réponse est dite', () => {
  it('un sujet sans variante répond comme avant', () => {
    const dm = marche();
    const sujet = dm.pnj.get(BREGOR)!.sujets.find((s) => !s.condition && !s.attitudeMin)!;
    sujet.variantes = [];
    expect(dit(partie(dm), sujet.id)).toBe(sujet.reponse);
  });

  it('sans condition vraie : la réponse de base', () => {
    const dm = marche();
    const sujet = sujetAVariantes(dm);
    expect(dit(partie(dm), sujet.id)).toBe('BASE');
  });

  it('la première variante vraie l’emporte, même si une suivante est vraie aussi', () => {
    const dm = marche();
    const sujet = sujetAVariantes(dm);
    const p = partie(dm);
    p.etat.flags.b = true;
    expect(dit(p, sujet.id)).toBe('VARIANTE-B');
    p.etat.flags.a = true;
    expect(dit(p, sujet.id)).toBe('VARIANTE-A');
    expect(reponseDuSujet(p, sujet)).toBe('VARIANTE-A');
  });

  it('un sujet reposé après un changement d’état donne la réponse du moment', () => {
    const dm = marche();
    const sujet = sujetAVariantes(dm);
    const p = partie(dm);
    expect(dit(p, sujet.id)).toBe('BASE');
    p.etat.flags.a = true;
    expect(dit(p, sujet.id)).toBe('VARIANTE-A');
  });

  it('les effets et les faits révélés sont ceux du sujet, quelle que soit la variante, et ne se rejouent pas', () => {
    const dm = marche();
    const sujet = sujetAVariantes(dm);
    sujet.effets = [{ pieces: 7 }, { flag: 'sujet-pose' }];
    const p = partie(dm);
    p.etat.flags.a = true;
    const avant = p.etat.pieces;
    expect(dit(p, sujet.id)).toBe('VARIANTE-A');
    expect(dit(p, sujet.id)).toBe('VARIANTE-A');
    expect(p.etat.pieces).toBe(avant + 7);
    expect(p.etat.flags['sujet-pose']).toBe(true);
  });

  it('la variante n’ouvre ni ne ferme le sujet : sa condition ne gouverne que la réponse', () => {
    const dm = marche();
    const sujet = sujetAVariantes(dm);
    sujet.condition = { flag: 'sujet-ouvert' };
    const p = partie(dm);
    p.etat.flags.a = true;
    expect(parler(p, BREGOR, sujet.id).ok).toBe(false);
    p.etat.flags['sujet-ouvert'] = true;
    expect(dit(p, sujet.id)).toBe('VARIANTE-A');
  });
});

describe('Sujet.variantes : validation et revue', () => {
  it('le format accepte un sujet sans variantes (vide par défaut) et refuse une variante sans condition ou sans réponse', () => {
    const base = { id: 'le-sujet', mots: ['x'], reponse: 'Une réponse.' };
    expect(Sujet.parse(base).variantes).toEqual([]);
    expect(Sujet.safeParse({ ...base, variantes: [{ condition: { flag: 'a' }, reponse: 'Autre.' }] }).success).toBe(true);
    expect(Sujet.safeParse({ ...base, variantes: [{ reponse: 'Sans condition.' }] }).success).toBe(false);
    expect(Sujet.safeParse({ ...base, variantes: [{ condition: { flag: 'a' } }] }).success).toBe(false);
  });

  it('le validateur signale une condition de variante qui vise une rencontre ou un PNJ inconnu', () => {
    const dm = marche();
    const sujet = sujetAVariantes(dm);
    sujet.variantes = [
      { condition: { rencontre: { id: 'rencontre-fantome' } }, reponse: LONG },
      { condition: { parle: 'pnj-fantome' }, reponse: LONG },
    ];
    const erreurs = validerMonde(dm, srd).erreurs.join('\n');
    expect(erreurs).toMatch(/rencontre-fantome/);
    expect(erreurs).toMatch(/pnj-fantome/);
  });

  it('le validateur avertit d’un drapeau de variante jamais posé, et des variantes au style indirect ou trop courtes', () => {
    const dm = marche();
    const sujet = sujetAVariantes(dm);
    sujet.reponse = LONG;
    sujet.variantes = [
      { condition: { flag: 'drapeau-jamais-pose-xyz' }, reponse: 'Il dit que la récolte a été mauvaise et que les gens ont faim cette année, mais il n’en dira pas plus devant des étrangers.' },
      { condition: { flag: 'autre-jamais-pose-xyz' }, reponse: 'Il hausse les épaules.' },
    ];
    const bilan = validerMonde(dm, srd);
    expect(bilan.erreurs).toEqual([]);
    const a = bilan.avertissements.join('\n');
    expect(a).toMatch(/drapeau-jamais-pose-xyz/);
    expect(a).toMatch(new RegExp(`Dialogues[^\\n]*sont au style indirect[^\\n]*${BREGOR}:${sujet.id} \\(variante 1\\)`));
    expect(a).toMatch(new RegExp(`Dialogues[^\\n]*font moins de[^\\n]*${BREGOR}:${sujet.id} \\(variante 2\\)`));
  });

  it('la revue surveille chaque variante d’un sujet ouvert, mais pas celles d’un sujet verrouillé', () => {
    const dm = marche();
    const ouvert = sujetAVariantes(dm);
    ouvert.variantes = [{ condition: { flag: 'a' }, reponse: 'Le pacte du meunier, on n’en parle pas.' }];
    const canon = Canon.parse({ secrets: [{ id: 'pacte', texte: 'Le meunier a signé un pacte.', motsTabou: ['pacte'] }] });
    const chemin = (a: { chemin?: (string | number)[] }) => (a.chemin ?? []).join('.');
    const cible = `sujets.${dm.pnj.get(BREGOR)!.sujets.indexOf(ouvert)}.variantes.0.reponse`;
    expect(revoirMonde(dm, canon).some((a) => a.code === 'revue.secret' && a.entite?.id === BREGOR && chemin(a) === cible)).toBe(true);

    ouvert.attitudeMin = 40; // verrouillé : c'est là que le secret se dit
    expect(revoirMonde(dm, canon).some((a) => a.code === 'revue.secret' && a.entite?.id === BREGOR && chemin(a) === cible)).toBe(false);
  });
});
