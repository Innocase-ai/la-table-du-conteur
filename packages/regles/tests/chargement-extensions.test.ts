// Le chargement d'un monde ne laisse plus rien passer en silence : une fiche d'extension invalide, un dossier mal nommé, une clé de fiche
// inconnue (faute de frappe) sont dits par `problemesDeChargement`. Avant, `chargerMonde` répondait « ok » et le jeu jouait l'histoire
// amputée de la fiche invalide, sans un mot.
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chargerDonneesSrd } from '../src/donnees-node';
import { problemesDeChargement } from '../src/monde/assemblage';
import { chargerMonde, listerMondes, RACINE_MONDES } from '../src/monde/chargeur';
import { diagnostiquerMonde } from '../src/monde/diagnostiquer';
import { dilemmesDe } from '../src/monde/dilemmes-donnees';
import { DOSSIERS_EXTENSIONS, schemaExtension } from '../src/monde/extensions';
import type { DonneesMonde } from '../src/monde/schemas';
import { scenesDu } from '../src/modules/scenes';
import { IDS_MONDES_ESSAI, MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();

/** Une copie du monde d'essai, sans images ni voix, dans un dossier temporaire : on y casse ce qu'on veut. */
function copie(id: string): string {
  const dossier = join(mkdtempSync(join(tmpdir(), 'monde-')), id);
  cpSync(join(MONDES_ESSAI, id), dossier, { recursive: true, filter: (src) => !/[\\/](images|voix)([\\/]|$)/.test(src) });
  return dossier;
}

const charger = (dossier: string): DonneesMonde => {
  const r = chargerMonde(dossier);
  if (!r.ok) throw new Error(r.erreurs.map((e) => `${e.fichier} : ${e.message}`).join('\n'));
  return r.monde;
};

const modifier = (fichier: string, f: (donnees: any) => void): void => {
  const d = JSON.parse(readFileSync(fichier, 'utf8'));
  f(d);
  writeFileSync(fichier, JSON.stringify(d, null, 2));
};

describe('chargement : ce que les mondes livrés et les jeux d\'essai ne cachent pas', () => {
  for (const id of [...listerMondes(), ...IDS_MONDES_ESSAI]) {
    it(`${id} : aucune fiche invalide, aucun dossier ni clé inconnus`, () => {
      const dossier = IDS_MONDES_ESSAI.includes(id) ? join(MONDES_ESSAI, id) : join(RACINE_MONDES, id);
      const p = problemesDeChargement(charger(dossier));
      expect(p.erreurs).toEqual([]);
      expect(p.avis).toEqual([]);
    });
  }
});

describe('chargement : les fiches d\'extension invalides', () => {
  it('une fiche d\'extension invalide : le chargement réussit, le jeu l\'écarte, et le problème est dit', () => {
    const dossier = copie('port-sillage');
    const fichier = join(dossier, 'dilemmes', readdirSync(join(dossier, 'dilemmes')).find((f) => f.endsWith('.json'))!);
    const avant = dilemmesDe(charger(dossier)).dilemmes.length;
    let casse = '';
    modifier(fichier, (d) => {
      const un = Array.isArray(d) ? d[0] : d;
      casse = un.id;
      un.options = un.options.slice(0, 1); // un dilemme a au moins deux options
    });
    const dm = charger(dossier);
    // Avant : rien ne le disait. Le jeu lit un dilemme de moins…
    expect(dilemmesDe(dm).dilemmes.length).toBe(avant - 1);
    // …et maintenant le chargement le dit, avec le nom de l'entité et du fichier.
    const p = problemesDeChargement(dm);
    expect(p.erreurs).toHaveLength(1);
    expect(p.erreurs[0]).toMatch(new RegExp(`Dilemme « ${casse} » \\(dilemmes/.+\\.json\\) : options`));
    // Le diagnostic complet le disait déjà, par le module : une seule fois, pas de doublon.
    const bilan = diagnostiquerMonde(dm, srd);
    expect(bilan.erreurs.filter((e) => e.includes(`« ${casse} »`) && e.startsWith('[dilemmes]'))).toHaveLength(1);
  });

  it('une scène invalide est vérifiée elle aussi (son schéma n\'était pas dans le registre de l\'atelier)', () => {
    const dossier = copie('port-sillage');
    const fichier = join(dossier, 'scenes', readdirSync(join(dossier, 'scenes')).find((f) => f.endsWith('.json'))!);
    let casse = '';
    modifier(fichier, (d) => {
      const un = Array.isArray(d) ? d[0] : d;
      casse = un.id;
      un.plans = []; // une scène a au moins un plan
    });
    const dm = charger(dossier);
    expect(scenesDu(dm).scenes.some((s) => s.id === casse)).toBe(false);
    expect(problemesDeChargement(dm).erreurs.join('\n')).toMatch(new RegExp(`Scène « ${casse} » \\(scenes/`));
  });

  it('chaque dossier d\'extension a un schéma ; un dossier de base n\'en est pas un', () => {
    for (const d of DOSSIERS_EXTENSIONS) expect(schemaExtension(d), d).toBeDefined();
    expect(schemaExtension('lieux')).toBeUndefined();
    expect(schemaExtension('dilemme')).toBeUndefined();
  });
});

describe('chargement : les fautes de frappe', () => {
  it('un dossier mal nommé est signalé avec le nom probable, sans erreur', () => {
    const dossier = copie('port-sillage');
    renameSync(join(dossier, 'dilemmes'), join(dossier, 'dilemme'));
    const dm = charger(dossier);
    expect(dilemmesDe(dm).dilemmes).toHaveLength(0); // tout son contenu est ignoré
    const p = problemesDeChargement(dm);
    expect(p.erreurs).toEqual([]);
    expect(p.avis).toHaveLength(1);
    expect(p.avis[0]).toMatch(/Dossier « dilemme » inconnu du moteur.*vouliez-vous dire « dilemmes »/);
    // L'atelier et `pnpm monde valider` le montrent (diagnostic « chargement.inconnu »).
    const bilan = diagnostiquerMonde(dm, srd);
    expect(bilan.avertissements.some((a) => a.startsWith('Dossier « dilemme » inconnu'))).toBe(true);
    expect(bilan.diagnostics.some((d) => d.code === 'chargement.inconnu')).toBe(true);
  });

  it('une clé de fiche inconnue est signalée avec la clé probable', () => {
    const dossier = copie('port-sillage');
    const fichier = join(dossier, 'pnj', readdirSync(join(dossier, 'pnj')).find((f) => f.endsWith('.json'))!);
    let id = '';
    modifier(fichier, (d) => {
      const un = Array.isArray(d) ? d[0] : d;
      id = un.id;
      un.salutaions = un.salutations;
      un.sujets[0].reponsee = 'x'; // une clé imbriquée
    });
    const p = problemesDeChargement(charger(dossier));
    expect(p.avis).toHaveLength(1);
    expect(p.avis[0]).toContain(`PNJ « ${id} »`);
    expect(p.avis[0]).toContain('« salutaions » (vouliez-vous dire « salutations » ?)');
    expect(p.avis[0]).toContain('« sujets.0.reponsee »');
  });

  it('un dossier de médias ou un fichier à la racine n\'est pas un dossier inconnu', () => {
    const dossier = copie('port-sillage');
    mkdirSync(join(dossier, 'images'), { recursive: true });
    writeFileSync(join(dossier, 'images', 'manifeste.json'), '{}');
    writeFileSync(join(dossier, 'NOTES.md'), 'x');
    expect(problemesDeChargement(charger(dossier)).avis).toEqual([]);
  });
});

describe('chargement : un monde qui ne vient pas d\'assemblerMonde', () => {
  it('ne signale rien (pas de fichiers bruts à relire)', () => {
    const dm = charger(join(MONDES_ESSAI, 'port-sillage'));
    expect(problemesDeChargement({ ...dm })).toEqual({ erreurs: [], avis: [] });
  });
});
