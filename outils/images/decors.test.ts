// F8 (20/11/2026) : le lot générique de la réserve de décors (jamais lancé sans --go) et le registre des décors (la partie générée se régénère à l'identique,
// la partie écrite n'est jamais touchée).
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RACINE_MONDES } from '../../packages/regles/src/monde/chargeur';
import { chargerCharte, RACINE } from './charte';
import {
  CATALOGUE_DECORS,
  coutAnnonce,
  DEBUT_GENERE,
  ecrireRegistre,
  elementsDecors,
  FIN_GENERE,
  lireCatalogueDecors,
  lireLotDecors,
  lotRestant,
  REGISTRE_DECORS,
  registreGenere,
  usagesDeDecors,
} from './decors';

const charte = chargerCharte();
const catalogue = lireCatalogueDecors(CATALOGUE_DECORS);
const lot = lireLotDecors();

describe('le lot générique de décors', () => {
  it('un élément par décor à générer, au format paysage, avec la charte, « aucun personnage » et les contraintes', () => {
    const elements = elementsDecors(charte, lot.lieux);
    expect(elements).toHaveLength(lot.lieux.length);
    for (const e of elements) {
      expect(e.groupe).toBe('lieux');
      expect(e.format).toBe('paysage');
      expect(e.prompt).toContain(charte.style);
      expect(e.prompt).toContain('No people and no creatures');
      expect(e.prompt).toContain(charte.contraintes);
    }
  });

  it('--ids restreint le lot ; un décor déjà au catalogue n\'est pas refait (le lot installé n\'a plus rien à générer)', () => {
    expect(elementsDecors(charte, lot.lieux, ['chambre-lit-et-coffre']).map((e) => e.id)).toEqual(['chambre-lit-et-coffre']);
    expect(elementsDecors(charte, lot.lieux, undefined, new Set(['chambre-lit-et-coffre'])).map((e) => e.id)).not.toContain('chambre-lit-et-coffre');
    expect(lotRestant(lot.lieux, catalogue)).toEqual([]);
    expect(lotRestant(lot.lieux, [])).toHaveLength(lot.lieux.length);
  });

  it('le coût est annoncé avant toute dépense : ≈ 0,009 $ l\'image', () => {
    expect(coutAnnonce(11)).toBe(0.099);
    expect(coutAnnonce(30)).toBe(0.27);
    expect(coutAnnonce(0)).toBe(0);
  });

  it('`pnpm images decors` sans --go ne génère ni ne dépense rien ; le lot installé n\'a plus d\'image à faire', () => {
    const r = spawnSync(process.execPath, ['--import', 'tsx', 'outils/images/cli.ts', 'decors'], { cwd: RACINE, encoding: 'utf8' });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('0 image(s) à générer');
    expect(r.stdout).not.toContain('Bilan');
  }, 60_000);

  it('l\'installateur et le CLI documentent la commande (sorties/images/decors → apps/jeu/src/communs/lieux)', () => {
    const installer = readFileSync(join(RACINE, 'outils', 'images', 'installer.py'), 'utf8');
    expect(installer).toContain('installer.py decors');
    expect(installer).toContain('apps/jeu/src/communs/lieux');
    expect(readFileSync(join(RACINE, 'outils', 'images', 'cli.ts'), 'utf8')).toContain('pnpm images decors');
  });
});

describe('le registre des décors', () => {
  const usages = usagesDeDecors(RACINE_MONDES);

  it('la partie générée de docs/REGISTRE-DECORS.md se régénère à l\'identique', () => {
    const fichier = readFileSync(REGISTRE_DECORS, 'utf8');
    const a = fichier.indexOf(DEBUT_GENERE);
    const b = fichier.indexOf(FIN_GENERE);
    expect(a).toBeGreaterThan(0);
    const genere = registreGenere(catalogue, lotRestant(lot.lieux, catalogue), usages, lot.lot);
    expect(fichier.slice(a, b + FIN_GENERE.length)).toBe(`${DEBUT_GENERE}\n\n${genere}\n${FIN_GENERE}`);
    // Deux régénérations donnent le même texte, et le fichier réécrit est inchangé.
    expect(ecrireRegistre(fichier, genere)).toBe(fichier);
  });

  it('liste chaque décor du catalogue et chaque type ; le lot installé n\'est plus « à générer »', () => {
    const texte = registreGenere(catalogue, lotRestant(lot.lieux, catalogue), usages, lot.lot);
    for (const e of catalogue) expect(texte).toContain(`\`${e.id}\``);
    expect(texte).not.toContain('_(à générer)_');
    expect(texte).toContain('Tous les types ont leurs 3 variantes.');
    expect(texte).toContain('Aucun épisode ne cite encore `commun:lieux/…`'); // aucune histoire existante n'a été modifiée
  });

  it('un lot pas encore installé apparaît « à générer », et le registre dit ce qui manque encore', () => {
    const sansLot = catalogue.filter((e) => 'monde' in e.origine);
    const texte = registreGenere(sansLot, lot.lieux, usages, lot.lot);
    for (const e of lot.lieux) expect(texte).toContain(`\`${e.id}\` _(à générer)_`);
    expect(registreGenere(sansLot, [], usages)).toMatch(/\| `chambre` \| 0 \| 0 \| 3 \|/);
    expect(texte).toContain('### Types incomplets (généré)');
  });

  it('les usages sont lus dans les manifestes : l\'épisode et le lieu qui citent un décor', () => {
    const racine = mkdtempSync(join(tmpdir(), 'decors-'));
    mkdirSync(join(racine, 'episode-un', 'images'), { recursive: true });
    writeFileSync(join(racine, 'episode-un', 'images', 'manifeste.json'), JSON.stringify({ lieux: { taverne: 'commun:lieux/taverne-foyer-et-chopes', forge: 'commun:lieux/forge-enclume-et-armes', place: 'lieu-place.webp' }, pnj: { x: 'commun:pnj/garde-x' } }));
    mkdirSync(join(racine, 'episode-deux', 'images'), { recursive: true });
    writeFileSync(join(racine, 'episode-deux', 'images', 'manifeste.json'), JSON.stringify({ lieux: { place: 'lieu-place.webp' } }));
    expect(usagesDeDecors(racine)).toEqual([{ monde: 'episode-un', decors: [{ id: 'forge-enclume-et-armes', lieu: 'forge' }, { id: 'taverne-foyer-et-chopes', lieu: 'taverne' }] }]);
    const texte = registreGenere(catalogue, [], usagesDeDecors(racine), lot.lot);
    expect(texte).toContain('| episode-un | forge | `forge-enclume-et-armes` |');
  });

  it('la partie écrite (avant les repères) n\'est jamais touchée par la réécriture ; sans repères, la partie générée est ajoutée', () => {
    const ecrit = '# Registre\n\nTexte écrit à la main.\n\n';
    const apres1 = ecrireRegistre(`${ecrit}${DEBUT_GENERE}\n\nancien\n${FIN_GENERE}\n\nPied écrit.\n`, 'nouveau');
    expect(apres1.startsWith(ecrit)).toBe(true);
    expect(apres1).toContain('nouveau');
    expect(apres1).not.toContain('ancien');
    expect(apres1.endsWith('Pied écrit.\n')).toBe(true);
    const sans = ecrireRegistre('# Registre\n\nÉcrit.', 'genere');
    expect(sans).toContain('Écrit.');
    expect(sans).toContain(`${DEBUT_GENERE}\n\ngenere\n${FIN_GENERE}`);
    expect(ecrireRegistre(undefined, 'g')).toContain(DEBUT_GENERE);
  });
});

describe('un monde qui cite un décor de la réserve (pnpm monde manque)', () => {
  it("le lieu qui cite un décor connu compte comme une image ; un décor inconnu est un manque ; le dépôt n'est pas modifié", () => {
    const monde = 'le-medaillon-de-la-soeur-endormie';
    const racine = mkdtempSync(join(tmpdir(), 'decors-monde-'));
    cpSync(join(RACINE_MONDES, monde), join(racine, monde), { recursive: true, filter: (src) => !/[\/](voix|scenes)([\/]|$)/.test(src) });
    const fichier = join(racine, monde, 'images', 'manifeste.json');
    const manifeste = JSON.parse(readFileSync(fichier, 'utf8')) as { lieux: Record<string, string> };
    manifeste.lieux['villambrune'] = 'commun:lieux/place-village-puits-et-barques';
    manifeste.lieux['sanctuaire-de-sainte-odile'] = 'commun:lieux/decor-qui-n-existe-pas';
    writeFileSync(fichier, JSON.stringify(manifeste, null, 2));
    const r = spawnSync(process.execPath, ['--import', 'tsx', 'outils/monde/cli.ts', 'manque', monde], { cwd: RACINE, encoding: 'utf8', env: { ...process.env, MONDES_RACINE: racine } });
    const sortie = `${r.stdout}
${r.stderr}`;
    expect(sortie).toContain('référence commune inconnue « commun:lieux/decor-qui-n-existe-pas »');
    expect(sortie).not.toMatch(/MANQUEs+[images] villambrune/);
    expect(sortie).not.toContain('commun:lieux/place-village-puits-et-barques');
  }, 60_000);
});
