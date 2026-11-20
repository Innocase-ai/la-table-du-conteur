// F3 (20/11/2026) : `pnpm monde quete` (la fiche produit le JSON) et `pnpm monde quetes` (avis et preuve par le parcours). Le vrai CLI est lancé
// sur une COPIE du Médaillon (`MONDES_RACINE`), jamais sur les mondes du dépôt : rien n'y est écrit.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { chargerDonneesSrd } from '../../packages/regles/src/donnees-node';
import { chargerMonde, RACINE_MONDES } from '../../packages/regles/src/monde/chargeur';
import { COMMANDES, lireOptions, USAGE } from './cli-aide';
import { bilanDesQuetes, genererDepuisFichier } from './quetes-cli';

const srd = chargerDonneesSrd();
const DEPOT = join(import.meta.dirname, '../..');
const MONDE = 'le-medaillon-de-la-soeur-endormie';

function cli(args: string[], env: Record<string, string> = {}) {
  const res = spawnSync(process.execPath, ['--import', 'tsx', 'outils/monde/cli.ts', ...args], { cwd: DEPOT, encoding: 'utf8', env: { ...process.env, ...env } });
  return { code: res.status, sortie: `${res.stdout}\n${res.stderr}` };
}

const FICHES = [
  { id: 'q-les-rats-de-la-cave', nom: 'Les rats de la cave', but: 'tuer', donneur: 'maitre-foulques', niveau: { min: 1, max: 1 }, resume: 'Des rats ravagent la cave du Sanglier doré.', cible: { rencontre: 'r-rats-de-la-cave' }, resolution: ['combat'], butin: { xp: 25, annonce: 'Une bière offerte.' } },
  { id: 'q-le-bandit-estropie', nom: 'Le bandit estropié', but: 'tuer', donneur: 'maitre-foulques', niveau: { min: 1, max: 1 }, resume: 'Un bandit rôde.', cible: { rencontre: 'r-bandit-estropie' }, resolution: ['combat', 'negocier'], butin: { xp: 30, annonce: 'Un merci.' } },
];

let racine: string;
let fichier: string;
beforeAll(() => {
  racine = mkdtempSync(join(tmpdir(), 'quetes-cli-'));
  cpSync(join(RACINE_MONDES, MONDE), join(racine, MONDE), { recursive: true, filter: (src) => !/[\\/](images|voix|scenes)([\\/]|$)/.test(src) });
  fichier = join(racine, 'fiches.json');
  writeFileSync(fichier, JSON.stringify(FICHES));
});

describe('les options et la liste des commandes', () => {
  it('`quete` et `quetes` sont des commandes ; --ecrire et --parcours sont lues', () => {
    expect(COMMANDES).toEqual(expect.arrayContaining(['quete', 'quetes']));
    expect(USAGE).toContain('quete <fiche.json>');
    expect(lireOptions(['quete', 'f.json', 'monde', '--ecrire']).options.ecrire).toBe(true);
    expect(lireOptions(['quetes', 'monde', '--parcours', '--etats', '500']).options).toMatchObject({ parcours: true, etats: 500, ecrire: false });
    expect(lireOptions(['verifier']).options).toMatchObject({ ecrire: false, parcours: false });
  });
});

describe('pnpm monde quete <fiche.json> [monde] [--ecrire]', () => {
  it('sans monde : la structure seule, rien n\'est écrit', () => {
    const r = cli(['quete', fichier]);
    expect(r.code).toBe(0);
    expect(r.sortie).toContain('structure seule');
    expect(r.sortie).toContain('"id": "q-les-rats-de-la-cave"');
    expect(r.sortie).toContain('les-rats-de-la-cave-rendue');
  });

  it('avec un monde : le lieu de la quête est celui du donneur, les avis du monde sont dits', () => {
    const r = cli(['quete', fichier, MONDE], { MONDES_RACINE: racine });
    expect(r.code).toBe(0);
    expect(r.sortie).toContain('"lieu": "le-sanglier-dore"');
    expect(r.sortie).toContain('Sujets à ajouter aux PNJ');
    expect(r.sortie).toContain('À écrire'); // les textes absents de la fiche
    // La quête n'est pas écrite sans --ecrire.
    expect(existsSync(join(racine, MONDE, 'quetes', 'q-les-rats-de-la-cave.json'))).toBe(false);
  });

  it('--ecrire écrit la quête dans quetes/ ; elle charge ; une seconde écriture n\'écrase rien (code 1)', () => {
    const r1 = cli(['quete', fichier, MONDE, '--ecrire'], { MONDES_RACINE: racine });
    expect(r1.code).toBe(0);
    const chemin = join(racine, MONDE, 'quetes', 'q-les-rats-de-la-cave.json');
    expect(existsSync(chemin)).toBe(true);
    const ecrit = JSON.parse(readFileSync(chemin, 'utf8')) as { id: string }[];
    expect(ecrit[0]!.id).toBe('q-les-rats-de-la-cave');
    const charge = chargerMonde(join(racine, MONDE));
    expect(charge.ok && charge.monde.quetes.has('q-les-rats-de-la-cave')).toBe(true);
    // La quête existe maintenant : la fiche est refusée (jamais remplacée).
    const r2 = cli(['quete', fichier, MONDE, '--ecrire'], { MONDES_RACINE: racine });
    expect(r2.code).toBe(1);
    expect(r2.sortie).toContain('existe déjà');
  });

  it('une fiche illisible ou mal formée donne le code 1, une phrase', () => {
    const mauvais = join(racine, 'mauvais.json');
    writeFileSync(mauvais, JSON.stringify({ id: 'q-x', nom: 'X' }));
    const r = cli(['quete', mauvais]);
    expect(r.code).toBe(1);
    expect(r.sortie).toContain('Fiche « q-x »');
    expect(cli(['quete', join(racine, 'absente.json')]).code).toBe(1);
    expect(cli(['quete']).code).toBe(1);
  });
});

describe('pnpm monde quetes [monde]', () => {
  it('donne le nombre de quêtes et leurs avis, sans jamais échouer sur un avis', () => {
    const r = cli(['quetes', MONDE]);
    expect(r.code).toBe(0);
    expect(r.sortie).toMatch(/2 quête\(s\)/);
    expect(r.sortie).toContain('avis');
  });

  it('bilanDesQuetes : sans --parcours, pas de parcours ; avec, chaque quête est jouée', () => {
    const dm = (() => {
      const c = chargerMonde(join(RACINE_MONDES, MONDE));
      if (!c.ok) throw new Error(MONDE);
      return c.monde;
    })();
    const sans = bilanDesQuetes(MONDE, dm, srd);
    expect(sans.echec).toBe(false);
    expect(sans.lignes.join('\n')).not.toContain('parcours automatique');
    const avec = bilanDesQuetes(MONDE, dm, srd, { parcours: true, etats: 300, ms: 20_000 });
    expect(avec.lignes.join('\n')).toContain('quêtes terminées par le parcours automatique');
  }, 60_000);

  it('genererDepuisFichier : un fichier de fiches, sans monde', () => {
    const r = genererDepuisFichier(fichier, {});
    expect(r.echec).toBe(false);
    expect(r.lignes.join('\n')).toContain('q-le-bandit-estropie');
  });
});
