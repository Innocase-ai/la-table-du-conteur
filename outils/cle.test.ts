import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { cleOpenRouter, empreinte, lireFichierEnv, lireMontant, variablesProjet } from './cle';

const dossier = mkdtempSync(join(tmpdir(), 'cle-'));
writeFileSync(join(dossier, '.env'), '# commentaire\nOPENROUTER_API_KEY="sk-or-du-projet-1234"\nAUTRE=valeur\n\nVIDE=\n');
afterAll(() => rmSync(dossier, { recursive: true, force: true }));

describe('variables du projet', () => {
  it('lit un fichier .env (guillemets retirés, commentaires et valeurs vides ignorés)', () => {
    expect(lireFichierEnv(join(dossier, '.env'))).toEqual({ OPENROUTER_API_KEY: 'sk-or-du-projet-1234', AUTRE: 'valeur' });
    expect(lireFichierEnv(join(dossier, 'absent.env'))).toEqual({});
  });

  it('le .env du projet gagne sur une variable du shell laissée par un autre projet', () => {
    const shell = { OPENROUTER_API_KEY: 'sk-or-autre-projet-9999', PATH: '/bin' };
    expect(cleOpenRouter(dossier, shell)).toBe('sk-or-du-projet-1234');
    expect(variablesProjet(dossier, shell)['PATH']).toBe('/bin');
  });

  it('sans .env, la variable du shell sert', () => {
    const vide = mkdtempSync(join(tmpdir(), 'cle-vide-'));
    expect(cleOpenRouter(vide, { OPENROUTER_API_KEY: 'sk-or-shell' })).toBe('sk-or-shell');
    expect(cleOpenRouter(vide, {})).toBeUndefined();
    rmSync(vide, { recursive: true, force: true });
  });

  it('montre seulement la fin d’une clé', () => {
    expect(empreinte('sk-or-du-projet-1234')).toBe('…1234');
  });
});

describe('lireMontant', () => {
  it('accepte le point et la virgule', () => {
    expect(lireMontant('0.10', 1)).toBe(0.1);
    expect(lireMontant('0,10', 1)).toBe(0.1);
    expect(lireMontant(' 2 ', 1)).toBe(2);
  });

  it('prend la valeur par défaut quand rien n’est donné', () => {
    expect(lireMontant(undefined, 0.25)).toBe(0.25);
    expect(lireMontant('', 0.25)).toBe(0.25);
  });

  it('refuse une valeur invalide au lieu de désactiver le garde-fou', () => {
    expect(() => lireMontant('abc', 0.1)).toThrow('Montant invalide');
    expect(() => lireMontant('-1', 0.1)).toThrow('Montant invalide');
    expect(() => lireMontant('Infinity', 0.1)).toThrow('Montant invalide');
  });
});
