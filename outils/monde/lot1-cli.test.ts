// Lot 1, fiche C3 (docs/FICHES-LOT-1.md) : un CLI qui ne ment pas. O1 à O5 de docs/AUDIT-CREATION-HISTOIRE.md et les cosmétiques O6 à O9.
// Les tests O1, O6 et O8 lancent vraiment `outils/monde/cli.ts` ; `MONDES_RACINE` le fait travailler dans un dossier temporaire.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chargerDonneesSrd } from '../../packages/regles/src/donnees-node';
import { chargerMonde } from '../../packages/regles/src/monde/chargeur';
import type { DonneesMonde } from '../../packages/regles/src/monde/schemas';
import { validerMonde } from '../../packages/regles/src/monde/validation';
import { MONDES_ESSAI } from '../../packages/regles/tests/mondes-essai';
import { conseilArret, lignesParcours, lireOptions } from './cli-aide';
import { creerSquelette } from './nouveau';
import { afficherBilan, verifierMonde, type BilanVerification } from './verifier';

const srd = chargerDonneesSrd();
const DEPOT = join(import.meta.dirname, '../..');
const MODELES = { dossier: join(DEPOT, '.claude/skills/creer-monde/assets'), atlas: join(DEPOT, '.claude/skills/decrire-lieux/assets/ATLAS.modele.md') };
const dossierEssai = join(MONDES_ESSAI, 'port-sillage');
const r = chargerMonde(dossierEssai);
if (!r.ok) throw new Error('Port-Sillage illisible');
const dm: DonneesMonde = r.monde;

/** Lance le vrai CLI. */
function cli(args: string[], env: Record<string, string> = {}) {
  const res = spawnSync(process.execPath, ['--import', 'tsx', 'outils/monde/cli.ts', ...args], { cwd: DEPOT, encoding: 'utf8', env: { ...process.env, ...env } });
  return { code: res.status, sortie: `${res.stdout}\n${res.stderr}` };
}

/** Un dossier de monde réduit à ce que la vérification lit : des fichiers écrits tels quels (texte brut). */
function dossierAvec(fichiers: Record<string, string> = {}): string {
  const d = mkdtempSync(join(tmpdir(), 'lot1-cli-'));
  mkdirSync(join(d, 'images'));
  for (const [nom, texte] of Object.entries(fichiers)) writeFileSync(join(d, nom), texte);
  return d;
}
const rubrique = (b: BilanVerification, nom: string) => b.rubriques.find((x) => x.nom === nom)!;
const CANON_VIDE = JSON.stringify({ secrets: [], noms: { lexique: [] }, personnages: [] });

describe('O1 : une commande inconnue est refusée', () => {
  it('`frobnicate` sort en code 1 et donne la liste des commandes', () => {
    const { code, sortie } = cli(['frobnicate', 'dime-des-roseaux']);
    expect(code).toBe(1);
    expect(sortie).toMatch(/Commande inconnue « frobnicate »/);
    for (const c of ['valider', 'verifier', 'manque', 'parcours', 'nouveau']) expect(sortie).toContain(c);
    // Aucun bilan n'est affiché : on n'a rien validé.
    expect(sortie).not.toMatch(/avertissement/);
  });

  it('une faute de frappe (`verifie`) est refusée de même, et `lister` marche toujours', () => {
    expect(cli(['verifie', 'dime-des-roseaux']).code).toBe(1);
    expect(cli(['lister']).code).toBe(0);
  });
});

describe('O2 : un fichier JSON mal formé est une rubrique en échec qui le nomme, pas un plantage', () => {
  it('estimation.json', () => {
    const b = verifierMonde('x', dossierAvec({ 'estimation.json': '{ "tours": 3, }' }), dm, srd, { parcours: false });
    expect(rubrique(b, 'Estimation')).toMatchObject({ statut: 'echec' });
    expect(rubrique(b, 'Estimation').resume).toMatch(/estimation\.json/);
    expect(b.ok).toBe(false);
  });

  it('images/manifeste.json', () => {
    const b = verifierMonde('x', dossierAvec({ 'images/manifeste.json': '{ "lieux": ' }), dm, srd, { parcours: false });
    expect(rubrique(b, 'Complétude')).toMatchObject({ statut: 'echec' });
    expect(rubrique(b, 'Complétude').resume).toMatch(/manifeste\.json/);
  });

  it('revue.json (le canon étant lisible)', () => {
    const b = verifierMonde('x', dossierAvec({ 'canon.json': CANON_VIDE, 'revue.json': '[oups' }), dm, srd, { parcours: false });
    expect(rubrique(b, 'Revue de secrets')).toMatchObject({ statut: 'echec' });
    expect(rubrique(b, 'Revue de secrets').resume).toMatch(/revue\.json/);
  });

  it('les autres rubriques sont rendues quand même', () => {
    const b = verifierMonde('x', dossierAvec({ 'estimation.json': '{' }), dm, srd, { parcours: false });
    expect(b.rubriques.map((x) => x.nom)).toEqual(['Validation', 'Défauts de jeu', 'Complétude', 'Estimation', 'Revue de secrets', 'Parcours']);
  });
});

describe('O3 : sans parcours, le bilan ne dit pas « Rien ne bloque » tout court', () => {
  it('dit que le parcours n’a pas été joué', () => {
    const b = verifierMonde('x', dossierAvec({ 'canon.json': CANON_VIDE }), dm, srd, { parcours: false });
    const derniere = afficherBilan(b).at(-1)!;
    if (b.ok) expect(derniere).toMatch(/Rien ne bloque \(parcours non joué\)/);
    else expect(derniere).toMatch(/Pas prêt/);
    // Un bilan avec parcours joué garde la formule d'avant.
    const fictif: BilanVerification = { monde: 'x', statut: 'publie', ok: true, rubriques: [{ nom: 'Parcours', statut: 'ok', resume: '2/2 fins', details: [] }] };
    expect(afficherBilan(fictif).at(-1)).toBe('\n✅ Rien ne bloque.');
    expect(afficherBilan({ ...fictif, rubriques: [{ nom: 'Parcours', statut: 'saute', resume: 'non joué', details: [] }] }).at(-1)).toBe('\n✅ Rien ne bloque (parcours non joué).');
  });
});

describe('O4 : un canon sans secret n’est pas une revue réussie', () => {
  it('avis « aucun secret » quand `canon.secrets` est vide', () => {
    const b = verifierMonde('x', dossierAvec({ 'canon.json': CANON_VIDE }), dm, srd, { parcours: false });
    const rev = rubrique(b, 'Revue de secrets');
    expect(rev.statut).toBe('avis');
    expect([rev.resume, ...rev.details].join('\n')).toMatch(/aucun secret/);
  });
});

describe('O5 : le squelette de `nouveau` est un monde valide', () => {
  it('0 erreur au validateur, un lieu de départ et un chapitre qui existent', () => {
    const racine = mkdtempSync(join(tmpdir(), 'lot1-nouveau-'));
    const dossier = creerSquelette(racine, 'ile-aux-brumes', "L'Île aux Brumes", MODELES);
    const res = chargerMonde(dossier);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(validerMonde(res.monde, srd).erreurs).toEqual([]);
    expect(res.monde.lieux.has(res.monde.monde.depart.lieu)).toBe(true);
  });

  it('`pnpm monde valider` sur ce squelette sort en code 0', () => {
    const racine = mkdtempSync(join(tmpdir(), 'lot1-valider-'));
    const mondes = join(racine, 'packages', 'mondes');
    mkdirSync(mondes, { recursive: true });
    creerSquelette(mondes, 'ile-aux-brumes', "L'Île aux Brumes", MODELES);
    expect(cli(['valider', 'ile-aux-brumes'], { MONDES_RACINE: mondes }).code).toBe(0);
  });
});

describe('O6 : `doc` sort en code 1 si le monde a des erreurs', () => {
  it('le document est écrit, mais le code est 1', () => {
    const racine = mkdtempSync(join(tmpdir(), 'lot1-doc-'));
    const mondes = join(racine, 'packages', 'mondes');
    mkdirSync(mondes, { recursive: true });
    const dossier = creerSquelette(mondes, 'casse', 'Cassé', MODELES);
    const f = join(dossier, 'monde.json');
    writeFileSync(f, JSON.stringify({ ...JSON.parse(readFileSync(f, 'utf8')), depart: { lieu: 'introuvable', intro: 'À écrire.' } }));
    const { code, sortie } = cli(['doc', 'casse'], { MONDES_RACINE: mondes });
    expect(existsSync(join(racine, 'docs', 'mondes', 'casse.md'))).toBe(true);
    expect(sortie).toMatch(/lieu inconnu « introuvable »/);
    expect(code).toBe(1);
  });
});

describe('O7 : un parcours arrêté par le temps conseille --ms', () => {
  it('le conseil dépend de la cause de l’arrêt', () => {
    expect(conseilArret('temps')).toMatch(/--ms/);
    expect(conseilArret('temps')).not.toMatch(/--etats/);
    expect(conseilArret('budget')).toMatch(/--etats/);
    expect(conseilArret('epuise')).toMatch(/tous les états/);
    expect(conseilArret('toutes-atteintes')).toBeUndefined();
  });
});

describe('O8 : une option numérique mal formée est refusée', () => {
  it('lireOptions accepte les valeurs correctes et retire les options des arguments', () => {
    const { options, positionnels } = lireOptions(['parcours', 'x', '--etats', '500', '--ms', '9000', '--graines', '1,2', '--chemin', '--couvrir', '--frontiere', '80']);
    expect(options).toMatchObject({ etats: 500, ms: 9000, graines: [1, 2], chemin: true, couvrir: true, frontiere: 80, sansParcours: false });
    expect(positionnels).toEqual(['parcours', 'x']);
    expect(lireOptions(['importer-forge', 'f.json', 'm', '--niveaux', '1-2', '--heures', '1.5']).options).toMatchObject({ niveaux: { min: 1, max: 2 }, heures: 1.5 });
    expect(lireOptions(['verifier', 'x', '--sans-parcours']).options.sansParcours).toBe(true);
  });

  it('refuse une valeur non numérique, négative, nulle ou absente, des niveaux mal écrits et une option inconnue', () => {
    expect(() => lireOptions(['parcours', 'x', '--etats', 'abc'])).toThrow(/--etats/);
    expect(() => lireOptions(['parcours', 'x', '--ms', '-5'])).toThrow(/--ms/);
    expect(() => lireOptions(['parcours', 'x', '--frontiere', '0'])).toThrow(/--frontiere/);
    expect(() => lireOptions(['parcours', 'x', '--etats'])).toThrow(/--etats/);
    expect(() => lireOptions(['parcours', 'x', '--graines', '1,b'])).toThrow(/--graines/);
    expect(() => lireOptions(['importer-forge', 'f', 'm', '--niveaux', '3'])).toThrow(/--niveaux/);
    expect(() => lireOptions(['importer-forge', 'f', 'm', '--heures', 'peu'])).toThrow(/--heures/);
    expect(() => lireOptions(['parcours', 'x', '--etat', '5'])).toThrow(/Option inconnue/);
  });

  it('le CLI sort en code 1 sans jouer quoi que ce soit', () => {
    const { code, sortie } = cli(['parcours', 'dime-des-roseaux', '--etats', 'abc']);
    expect(code).toBe(1);
    expect(sortie).toMatch(/--etats/);
    expect(sortie).not.toMatch(/fins atteintes/);
  });
});

describe('O9 : un monde sans fin n’est pas « 0/0 fins atteintes » en vert', () => {
  const rapport = (extra: object = {}) => ({ parcours: [], finsNonAtteintes: [] as string[], etats: 0, arret: 'epuise' as const, ...extra });
  it('avis explicite, sans échec', () => {
    const { entete, echec } = lignesParcours('x', 0, rapport(), 0.1);
    expect(entete).toMatch(/aucune fin définie/);
    expect(entete).not.toMatch(/✅/);
    expect(echec).toBe(false);
  });
  it('un monde qui a des fins garde ses lignes d’avant, avec le bon conseil', () => {
    const ok = lignesParcours('x', 2, rapport({ parcours: [{}, {}], etats: 10, arret: 'toutes-atteintes' }), 1.5);
    expect(ok.entete).toBe('\n✅ x — 2/2 fins atteintes (10 états en 1.5 s ; arrêt : toutes-atteintes)');
    expect(ok.echec).toBe(false);
    const temps = lignesParcours('x', 2, rapport({ parcours: [{}], finsNonAtteintes: ['f2'], arret: 'temps' }), 3);
    expect(temps.echec).toBe(true);
    expect(temps.manquantes[0]).toMatch(/f2.*--ms/);
  });
});

describe('O7 (suite) : `verifier` conseille aussi --ms quand le parcours s’arrête faute de temps', () => {
  it('une fin non atteinte, arrêt « temps »', () => {
    const b = verifierMonde('x', dossierAvec({ 'canon.json': CANON_VIDE }), dm, srd, { parcours: true, ms: 1 });
    const p = rubrique(b, 'Parcours');
    expect(p.statut).toBe('echec');
    expect(p.details.join('\n')).toMatch(/--ms/);
  });
});
