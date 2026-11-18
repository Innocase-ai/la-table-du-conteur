// Lot 1, fiche C1 (docs/FICHES-LOT-1.md) : les défauts de jeu font échouer `verifier` ; les conseils d'écriture ne le bloquent jamais.
// Un défaut peut être « accepté » dans `revue.json` avec sa raison (décision D1 pour la Marche). Monde d'essai : le mini-monde des tests.
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chargerDonneesSrd } from '../../packages/regles/src/donnees-node';
import { Canon, Revue } from '../../packages/regles/src/monde/canon';
import { chargerMonde } from '../../packages/regles/src/monde/chargeur';
import { cleDeRevue } from '../../packages/regles/src/monde/revue';
import { diagnosticDeMessage, estDefautDeJeu } from '../../packages/regles/src/monde/diagnostics';
import { estimerCampagne } from '../../packages/regles/src/monde/estimation';
import type { DonneesMonde } from '../../packages/regles/src/monde/schemas';
import { afficherBilan, verifierMonde, type BilanVerification } from './verifier';

const srd = chargerDonneesSrd();
const MINI = join(import.meta.dirname, '../../packages/regles/tests/fixtures/mini-monde');

/** Le mini-monde déclaré publié, avec un défaut de jeu si on le demande (un objet exigé que rien ne donne). */
function monde(defaut: boolean, statut: 'publie' | 'brouillon' = 'publie'): DonneesMonde {
  const r = chargerMonde(MINI);
  if (!r.ok) throw new Error('mini-monde');
  const dm = r.monde;
  dm.pnj.get('bertrand')!.sujets[0]!.effets.push({ objet: { id: 'croc-de-loup' } }, { flag: 'croc-remis' });
  dm.monde.statut = statut;
  if (defaut) dm.quetes.get('q-loups')!.etapes[1]!.completion = { objet: 'epee-longue' };
  return dm;
}

/** Le dossier d'un monde prêt à vérifier : estimation à jour et canon vide, plus ce qu'on y ajoute (`revue.json`). */
function dossier(dm: DonneesMonde, revue?: unknown): string {
  const d = mkdtempSync(join(tmpdir(), 'lot1-defauts-'));
  mkdirSync(join(d, 'images'));
  writeFileSync(join(d, 'estimation.json'), JSON.stringify(estimerCampagne(dm)));
  writeFileSync(join(d, 'canon.json'), JSON.stringify(Canon.parse({ secrets: [{ id: 's', texte: 'Un secret.', fait: 'f-loups', motsTabou: ['zzz'], autorise: [] }], noms: { lexique: [] }, personnages: [] })));
  if (revue !== undefined) writeFileSync(join(d, 'revue.json'), JSON.stringify(revue));
  return d;
}
const verifier = (dm: DonneesMonde, revue?: unknown): BilanVerification => verifierMonde('x', dossier(dm, revue), dm, srd, { parcours: false });
const rub = (b: BilanVerification, nom: string) => b.rubriques.find((r) => r.nom === nom)!;
const MSG = "Quête « q-loups », étape « rapporter » : l'objet « epee-longue » est exigé mais ne se trouve nulle part.";
const cle = cleDeRevue(diagnosticDeMessage(MSG, 'avis'));

describe('C1 : le classement des avis', () => {
  it('les défauts de jeu : objet introuvable, drapeau jamais posé, quête sautable, lieu sans retour, conditions impossibles, textes morts', () => {
    for (const code of ['objet.introuvable', 'fait.introuvable', 'flag.lu-jamais-pose', 'quete.sautable', 'lieu.sans-retour', 'condition.impossible', 'texte.variante-morte', 'revue.fait-non-autorise']) expect(estDefautDeJeu(code), code).toBe(true);
  });
  it('les conseils d’écriture n’en sont pas : richesse, longueurs, renvois, services, passages cachés', () => {
    for (const code of ['conseil.richesse', 'conseil.dialogues', 'texte.renvoi-pnj', 'texte.compagnon-nomme', 'validation.autre', 'revue.secret', 'module.savoirs']) expect(estDefautDeJeu(code), code).toBe(false);
  });
  it('un message de défaut porte le mot qui le distingue dans sa clé de revue', () => {
    expect(cle).toBe('objet.introuvable|quetes:q-loups||epee-longue|');
  });
});

describe('C1 : la rubrique « Défauts de jeu » de `verifier`', () => {
  it('vient juste après la validation', () => {
    const b = verifier(monde(false));
    expect(b.rubriques.map((r) => r.nom)).toEqual(['Validation', 'Défauts de jeu', 'Complétude', 'Estimation', 'Revue de secrets', 'Parcours']);
  });

  it('un monde publié sans défaut : rubrique en règle, et les conseils ne bloquent pas', () => {
    const b = verifier(monde(false));
    expect(rub(b, 'Défauts de jeu').statut).toBe('ok');
    expect(rub(b, 'Validation').statut).toBe('avis'); // des conseils d'écriture (richesse…), jamais bloquants
    expect(b.rubriques.filter((r) => r.statut === 'echec').map((r) => r.nom)).not.toContain('Défauts de jeu');
  });

  it('un monde publié avec un objet exigé introuvable : échec', () => {
    const b = verifier(monde(true));
    expect(rub(b, 'Défauts de jeu').statut).toBe('echec');
    expect(rub(b, 'Défauts de jeu').resume).toMatch(/1 défaut/);
    expect(rub(b, 'Défauts de jeu').details.join('\n')).toContain('epee-longue');
    expect(b.ok).toBe(false);
    expect(afficherBilan(b).at(-1)).toMatch(/Pas prêt : .*Défauts de jeu/);
    // Le défaut n'est plus compté parmi les conseils de la validation.
    expect(rub(b, 'Validation').details.join('\n')).not.toContain('epee-longue');
  });

  it('le même défaut dans un brouillon : un avis, pas un échec', () => {
    const b = verifier(monde(true, 'brouillon'));
    expect(rub(b, 'Défauts de jeu').statut).toBe('avis');
  });

  it('un défaut accepté dans revue.json avec sa raison : plus d’échec, et la raison est dite', () => {
    const b = verifier(monde(true), { rejets: [cle], raisons: { [cle]: 'Quête de la zone 2, pas encore écrite (prologue).' } });
    const r = rub(b, 'Défauts de jeu');
    expect(r.statut).toBe('ok');
    expect(r.resume).toMatch(/0 défaut.*1 accepté/);
    expect(r.details.join('\n')).toContain('Quête de la zone 2, pas encore écrite (prologue).');
    // Il ne reste que ce que le mini-monde n'a pas (ses images : rubrique « Complétude »), pas de défaut de jeu.
    expect(b.rubriques.filter((x) => x.statut === 'echec').map((x) => x.nom)).toEqual(['Complétude']);
  });

  it('un avis rejeté dans revue.json disparaît de la validation, avec son compte', () => {
    const base = verifier(monde(false));
    const premier = rub(base, 'Validation').details[0]!.replace(/^avis\s+/, '');
    const rejet = cleDeRevue(diagnosticDeMessage(premier, 'avis'));
    const b = verifier(monde(false), { rejets: [rejet] });
    expect(rub(b, 'Validation').resume).toMatch(/1 rejeté/);
    expect(rub(b, 'Validation').details.join('\n')).not.toContain(premier);
  });
});

describe('C1 : revue.json', () => {
  it('l’ancien format ({ rejets }) est toujours lu, `raisons` est facultatif', () => {
    expect(Revue.parse({ rejets: ['a'] })).toEqual({ rejets: ['a'], raisons: {} });
    expect(Revue.parse({ rejets: ['a'], raisons: { a: 'parce que' } }).raisons).toEqual({ a: 'parce que' });
    expect(Revue.parse({})).toEqual({ rejets: [], raisons: {} });
  });
});

describe('C1 : la clé à copier dans revue.json', () => {
  it('chaque défaut non accepté porte sa clé de revue', () => {
    const b = verifier(monde(true));
    expect(rub(b, 'Défauts de jeu').details.join('\n')).toContain(`[clé : ${cle}]`);
  });
});
