// F8 (20/11/2026) : la réserve de décors génériques (`apps/jeu/src/communs/lieux/`, catalogue, référence `commun:lieux/<id>` d'un manifeste).
// Additif (P1, P2) : un monde qui ne cite aucun `commun:lieux/…` est inchangé, un manifeste d'avant reste valide.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { verifierCompletude, type EntreesCompletude } from '../src/monde/completude';
import {
  EntreeLieuAGenerer,
  lireReferenceCommune,
  ManifesteImages,
  referenceCommune,
  TableLieuxAGenerer,
  TableLieuxCommuns,
  TYPES_DE_DECOR,
  typesIncomplets,
  VARIANTES_PAR_TYPE,
  verifierImages,
} from '../src';
import type { DonneesMonde } from '../src/monde/schemas';

const RACINE = join(import.meta.dirname, '..', '..', '..');
const DOSSIER = join(RACINE, 'apps', 'jeu', 'src', 'communs', 'lieux');
const catalogue = TableLieuxCommuns.parse(JSON.parse(readFileSync(join(DOSSIER, 'catalogue.json'), 'utf8'))).lieux;
const lot = TableLieuxAGenerer.parse(JSON.parse(readFileSync(join(RACINE, 'packages', 'donnees', 'visuel', 'lieux-communs-a-generer.json'), 'utf8')));

describe('le catalogue de la réserve de décors', () => {
  it('chaque entrée a son image, les ids sont uniques ; un décor du lot générique installé garde son origine « lot »', () => {
    for (const e of catalogue) expect(existsSync(join(DOSSIER, `${e.id}.webp`)), e.id).toBe(true);
    expect(new Set(catalogue.map((e) => e.id)).size).toBe(catalogue.length);
    expect(new Set(lot.lieux.map((e) => e.id)).size).toBe(lot.lieux.length);
    for (const e of lot.lieux) {
      const dedans = catalogue.find((c) => c.id === e.id);
      if (dedans) expect(dedans.origine, e.id).toEqual({ lot: lot.lot });
    }
  });

  it('chaque image du dossier est au catalogue (aucun fichier orphelin)', () => {
    const fichiers = new Set(catalogue.map((e) => `${e.id}.webp`));
    for (const f of readdirSync(DOSSIER).filter((x) => x.endsWith('.webp'))) expect(fichiers.has(f), f).toBe(true);
  });

  it('les décors venus d\'une histoire gardent leur origine : l\'image d\'origine existe et c\'est la même', () => {
    for (const e of catalogue) {
      if (!('monde' in e.origine)) continue;
      const manifeste = JSON.parse(readFileSync(join(RACINE_MONDES, e.origine.monde, 'images', 'manifeste.json'), 'utf8')) as { lieux: Record<string, string> };
      const fichier = manifeste.lieux[e.origine.lieu];
      expect(fichier, `${e.id} ← ${e.origine.monde}/${e.origine.lieu}`).toBeTruthy();
      const source = join(RACINE_MONDES, e.origine.monde, 'images', fichier!);
      expect(statSync(join(DOSSIER, `${e.id}.webp`)).size, e.id).toBe(statSync(source).size);
    }
  });

  it('chaque type de pièce courante est présent ; les descriptions ne nomment ni personnage ni enseigne', () => {
    for (const type of TYPES_DE_DECOR) expect(catalogue.some((e) => e.type === type) || lot.lieux.some((e) => e.type === type), type).toBe(true);
    for (const e of [...catalogue, ...lot.lieux]) {
      expect(e.description, e.id).not.toMatch(/\b(héros|groupe|aubergiste|forgeron|marchand)\b/i);
      expect(e.ambiance.length, e.id).toBeGreaterThan(3);
    }
  });

  it('3 variantes au moins pour chacun des 10 types de pièces (critère d\'acceptation de F8)', () => {
    expect(typesIncomplets(catalogue)).toEqual([]);
    for (const type of TYPES_DE_DECOR) expect(catalogue.filter((e) => e.type === type).length, type).toBeGreaterThanOrEqual(VARIANTES_PAR_TYPE);
    // Le lot générique n'a pas dépassé ce qu'il fallait : chaque décor du lot était nécessaire à atteindre 3 variantes.
    for (const type of TYPES_DE_DECOR) {
      const deLot = catalogue.filter((e) => e.type === type && 'lot' in e.origine).length;
      const sansLot = catalogue.filter((e) => e.type === type && 'monde' in e.origine).length;
      expect(deLot, type).toBeLessThanOrEqual(Math.max(0, VARIANTES_PAR_TYPE - sansLot));
    }
  });

  it('sans le lot générique, 7 types sur 10 n\'auraient pas leurs 3 variantes (ce que le lot a comblé)', () => {
    const sansLot = catalogue.filter((e) => 'monde' in e.origine);
    expect(typesIncomplets(sansLot).map((x) => x.type)).toEqual(['chambre', 'forge', 'marche', 'boutique', 'interieur-modeste', 'cave-ou-grenier', 'place-du-village']);
  });

  it('chaque décor à générer a un prompt de scène en anglais, sans personnage', () => {
    for (const e of lot.lieux) {
      expect(EntreeLieuAGenerer.safeParse(e).success, e.id).toBe(true);
      expect(e.prompt, e.id).not.toMatch(/\b(man|woman|person|people:|child|soldier)\b(?!.*no people)/i);
    }
  });
});

describe('la référence `commun:lieux/<id>` dans un manifeste', () => {
  it('se lit et s\'écrit ; le schéma l\'accepte pour les lieux ; un manifeste d\'avant reste valide', () => {
    expect(referenceCommune('lieux', 'taverne-foyer-et-chopes')).toBe('commun:lieux/taverne-foyer-et-chopes');
    expect(lireReferenceCommune('commun:lieux/forge-enclume-et-armes')).toEqual({ groupe: 'lieux', id: 'forge-enclume-et-armes' });
    expect(lireReferenceCommune('commun:decors/x')).toBeUndefined();
    expect(ManifesteImages.safeParse({ lieux: { taverne: 'commun:lieux/taverne-foyer-et-chopes', place: 'lieu-place.webp' } }).success).toBe(true);
    expect(ManifesteImages.safeParse({ lieux: { taverne: 'commun:inconnu/x' } }).success).toBe(false);
    // Les manifestes publiés (avant F8) se lisent toujours.
    for (const dossier of ['dime-des-roseaux', 'marche-d-ombrefiel', 'tombe-des-rois-serpents', 'le-medaillon-de-la-soeur-endormie']) {
      expect(ManifesteImages.safeParse(JSON.parse(readFileSync(join(RACINE_MONDES, dossier, 'images', 'manifeste.json'), 'utf8'))).success, dossier).toBe(true);
    }
  });

  it('verifierImages : une référence connue passe, une référence inconnue ou d\'un autre groupe est signalée', () => {
    const r = chargerMonde(join(RACINE_MONDES, 'le-medaillon-de-la-soeur-endormie'));
    if (!r.ok) throw new Error('monde illisible');
    const dm = r.monde;
    const lieux = [...dm.lieux.keys()];
    const ids = new Set(catalogue.map((e) => e.id));
    const communs = { pnj: new Set<string>(), objets: new Set<string>(), lieux: ids };
    const manifeste = ManifesteImages.parse({ lieux: { [lieux[0]!]: 'commun:lieux/taverne-foyer-et-chopes', [lieux[1]!]: 'commun:lieux/decor-qui-n-existe-pas', [lieux[2]!]: 'commun:pnj/un-portrait' } });
    const inconnues = verifierImages(dm, manifeste, communs).inconnues;
    expect(inconnues.filter((x) => x.includes('asset commun inconnu')).map((x) => x.split(' ')[0])).toEqual([`lieux/${lieux[1]}`, `lieux/${lieux[2]}`]);
    // Sans la liste des décors (ancien appelant), la référence n'est pas jugée : comportement d'avant.
    expect(verifierImages(dm, manifeste, { pnj: new Set(), objets: new Set() }).inconnues.filter((x) => x.includes('asset commun inconnu'))).toEqual([`lieux/${lieux[2]} → commun:pnj/un-portrait (asset commun inconnu)`]);
  });
});

describe('la complétude d\'un monde qui cite un décor commun', () => {
  const entrees = (dm: DonneesMonde, manifeste: ManifesteImages, communs?: EntreesCompletude['communs']): EntreesCompletude => ({
    dm, manifeste, imagesCommunes: new Set(), idImageCommune: (id) => id, scenes: [], voix: new Set(), estimationPresente: true, ...(communs ? { communs } : {}),
  });

  it('un lieu qui cite un décor connu a une image (pas de manque « sans image ») ; un décor inconnu est un manque', () => {
    const r = chargerMonde(join(RACINE_MONDES, 'le-medaillon-de-la-soeur-endormie'));
    if (!r.ok) throw new Error('monde illisible');
    const dm = r.monde;
    const [a, b] = [...dm.lieux.keys()];
    const communs = { pnj: new Set<string>(), objets: new Set<string>(), lieux: new Set(catalogue.map((e) => e.id)) };
    const manifeste = ManifesteImages.parse({ lieux: { [a!]: 'commun:lieux/sanctuaire-nef-et-vasque', [b!]: 'commun:lieux/decor-inconnu' } });
    const ecarts = verifierCompletude(entrees(dm, manifeste, communs)).filter((x) => x.categorie === 'images');
    expect(ecarts.some((x) => x.cible === a && x.detail.includes('sans image'))).toBe(false);
    expect(ecarts.some((x) => x.cible === b && x.detail.includes('référence commune inconnue'))).toBe(true);
    // Un manifeste sans aucun décor commun : exactement les manques d'avant.
    const sans = verifierCompletude(entrees(dm, ManifesteImages.parse({ lieux: { [a!]: 'lieu-a.webp' } }), communs)).filter((x) => x.categorie === 'images');
    expect(sans.some((x) => x.detail.includes('référence commune'))).toBe(false);
  });
});
