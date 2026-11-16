import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importerForge } from './forge';

const FIXTURE = resolve(import.meta.dirname, '../../outils/monde/fixtures/villambrune.forge.json');
const conception = () => JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, unknown>;
// Les mondes sont écrits dans un dossier temporaire ; le SRD et les modèles sont ceux du projet (emplacements par défaut, relatifs à packages/mondes).
const nouvelleRacine = () => {
  const projet = mkdtempSync(join(tmpdir(), 'atelier-forge-'));
  return join(projet, 'packages/mondes');
};
const DEPOTS = {
  srd: resolve(import.meta.dirname, '../../packages/donnees/srd'),
  modeles: { dossier: resolve(import.meta.dirname, '../../.claude/skills/creer-monde/assets'), atlas: resolve(import.meta.dirname, '../../.claude/skills/decrire-lieux/assets/ATLAS.modele.md') },
};
const demande = (d: Record<string, unknown> = {}) => ({ id: 'villambrune', forge: conception(), ...d });

describe('importer une conception de la Forge depuis l’atelier', () => {
  it('crée un monde brouillon, avec son rapport, et renvoie les chiffres', () => {
    const racine = nouvelleRacine();
    const r = importerForge(racine, demande({ niveaux: { min: 1, max: 3 } }), DEPOTS);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.stats['lieux']).toBe(8);
    expect(r.stats['quetes']).toBe(2);
    expect(r.aEcrire).toBeGreaterThan(0);
    expect(r.rapport).toContain('Correspondance Forge → monde');
    const monde = JSON.parse(readFileSync(join(racine, 'villambrune/monde.json'), 'utf8')) as { statut: string; niveaux: { min: number; max: number } };
    expect(monde.statut).toBe('brouillon');
    expect(monde.niveaux).toEqual({ min: 1, max: 3 });
    // Le profil de la goule est trouvé dans les monstres du SRD ; la conception reçue est gardée à côté du monde.
    expect(readFileSync(join(racine, 'villambrune/rencontres/forge-rencontres.json'), 'utf8')).toContain('"profil": "goule"');
    expect(existsSync(join(racine, 'villambrune/conception.forge.json'))).toBe(true);
  });

  it('refuse un identifiant invalide, un monde existant (sans rien écraser) et une conception illisible', () => {
    const racine = nouvelleRacine();
    expect(importerForge(racine, demande({ id: '../hors' }), DEPOTS)).toMatchObject({ ok: false, statut: 400 });
    expect(importerForge(racine, demande({ id: 'Mon Monde' }), DEPOTS)).toMatchObject({ ok: false, statut: 400 });
    expect(importerForge(racine, demande(), DEPOTS).ok).toBe(true);
    const avant = readFileSync(join(racine, 'villambrune/monde.json'), 'utf8');
    expect(importerForge(racine, demande(), DEPOTS)).toMatchObject({ ok: false, statut: 409 });
    expect(readFileSync(join(racine, 'villambrune/monde.json'), 'utf8')).toBe(avant);
    expect(importerForge(racine, demande({ id: 'x', forge: { version: 2 } }), DEPOTS)).toMatchObject({ ok: false, statut: 400 });
    expect(importerForge(racine, demande({ id: 'y', forge: { version: 1, histoire: { assets: [], liens: [] } } }), DEPOTS)).toMatchObject({ ok: false, statut: 400, erreur: expect.stringMatching(/aucun lieu/) });
    expect(existsSync(join(racine, 'x')) || existsSync(join(racine, 'y'))).toBe(false);
    expect(importerForge(racine, { id: 'z' }, DEPOTS)).toMatchObject({ ok: false, statut: 400 });
  });
});
