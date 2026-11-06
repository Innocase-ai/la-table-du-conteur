import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chargerDonneesSrd } from '../../packages/regles/src/donnees-node';
import { chargerMonde } from '../../packages/regles/src/monde/chargeur';
import { validerMonde } from '../../packages/regles/src/monde/validation';
import { creerSquelette, DOSSIERS_MODULES, DOSSIERS_MONDE } from './nouveau';

const MODELES = { dossier: join(import.meta.dirname, '../../.claude/skills/creer-monde/assets'), atlas: join(import.meta.dirname, '../../.claude/skills/decrire-lieux/assets/ATLAS.modele.md') };

describe('échafaudage d\'un monde', () => {
  it('crée un monde en brouillon qui respecte le schéma, avec la bible et le guide personnalisés', () => {
    const racine = mkdtempSync(join(tmpdir(), 'mondes-'));
    const dossier = creerSquelette(racine, 'ile-aux-brumes', "L'Île aux Brumes", MODELES);
    for (const d of [...DOSSIERS_MONDE, ...DOSSIERS_MODULES]) expect(existsSync(join(dossier, d))).toBe(true);
    // L'atlas des lieux (skill decrire-lieux) est prêt à remplir, au nom du monde ; le guide des zones le cite.
    expect(readFileSync(join(dossier, 'LIEUX.md'), 'utf8')).toContain("Atlas des lieux de L'Île aux Brumes");
    expect(readFileSync(join(dossier, 'GUIDE-ZONE.md'), 'utf8')).toContain('packages/mondes/ile-aux-brumes/LIEUX.md');
    expect(readFileSync(join(dossier, 'GUIDE-ZONE.md'), 'utf8')).not.toContain('veillecendre');
    const bible = readFileSync(join(dossier, 'BIBLE.md'), 'utf8');
    expect(bible).toContain("Bible de L'Île aux Brumes");
    expect(readFileSync(join(dossier, 'GUIDE-ZONE.md'), 'utf8')).toContain('packages/mondes/ile-aux-brumes/BIBLE.md');
    expect(bible + readFileSync(join(dossier, 'GUIDE-ZONE.md'), 'utf8')).not.toContain('{{');
    const r = chargerMonde(dossier);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.monde.monde.statut).toBe('brouillon');
      // Le monde vide n'est pas jouable : le validateur le dit (lieu de départ inconnu).
      expect(validerMonde(r.monde, chargerDonneesSrd()).erreurs.join('\n')).toMatch(/lieu inconnu « ile-aux-brumes-hub »/);
    }
  });

  it('refuse un identifiant invalide et un monde existant', () => {
    const racine = mkdtempSync(join(tmpdir(), 'mondes-'));
    expect(() => creerSquelette(racine, 'Île Brumeuse', 'x', MODELES)).toThrow(/Identifiant invalide/);
    creerSquelette(racine, 'monde-test', 'Test', MODELES);
    expect(() => creerSquelette(racine, 'monde-test', 'Test', MODELES)).toThrow(/existe déjà/);
  });
});
