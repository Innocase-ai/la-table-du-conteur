// La bibliothèque commune d'assets venus des histoires : tables cohérentes avec les fichiers, références dans un manifeste, recherche du plus proche.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  lireReferenceCommune,
  ManifesteImages,
  proposerObjets,
  proposerPortraits,
  referenceCommune,
  TableObjetsHistoires,
  TablePnjCommuns,
  TableSalutationsReprises,
  verifierImages,
} from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';

const RACINE = join(import.meta.dirname, '..', '..', '..');
const lire = (f: string) => JSON.parse(readFileSync(join(RACINE, 'packages', 'donnees', 'visuel', f), 'utf8'));
const pnj = TablePnjCommuns.parse(lire('pnj-communs.json')).pnj;
const objets = TableObjetsHistoires.parse(lire('objets-histoires.json')).objets;
const salutations = TableSalutationsReprises.parse(lire('salutations-reprises.json')).salutations;

describe('tables communes', () => {
  it('chaque entrée a son image dans le moteur, et les ids sont uniques', () => {
    for (const e of pnj) expect(existsSync(join(RACINE, 'apps', 'jeu', 'src', 'communs', 'pnj', `${e.id}.webp`)), `pnj ${e.id}`).toBe(true);
    for (const e of objets) expect(existsSync(join(RACINE, 'apps', 'jeu', 'src', 'communs', 'objets', `${e.id}.webp`)), `objet ${e.id}`).toBe(true);
    expect(new Set(pnj.map((e) => e.id)).size).toBe(pnj.length);
    expect(new Set(objets.map((e) => e.id)).size).toBe(objets.length);
  });

  it('reprend les portraits, les objets et les salutations des histoires existantes', () => {
    expect(pnj.length).toBeGreaterThan(100);
    expect(objets.length).toBeGreaterThan(100);
    expect(salutations.length).toBeGreaterThan(30);
    // chaque salutation reprise a bien son fichier voisé
    for (const s of salutations) expect(existsSync(join(RACINE, 'apps', 'jeu', 'src', 'voix', 'dialogues', s.voix, `${s.cle}.mp3`)), `${s.voix}/${s.cle}`).toBe(true);
  });

  it('les origines pointent vers des PNJ et des objets qui existent', () => {
    const cache = new Map<string, ReturnType<typeof chargerMonde>>();
    const monde = (m: string) => {
      if (!cache.has(m)) cache.set(m, chargerMonde(join(RACINE_MONDES, m)));
      return cache.get(m)!;
    };
    for (const e of pnj) {
      const r = monde(e.origine.monde);
      expect(r.ok && r.monde.pnj.has(e.origine.pnj!), `${e.id} ← ${e.origine.monde}/${e.origine.pnj}`).toBe(true);
    }
    for (const e of objets) {
      const r = monde(e.origine.monde);
      expect(r.ok && r.monde.objets.has(e.origine.objet!), `${e.id} ← ${e.origine.monde}/${e.origine.objet}`).toBe(true);
    }
  });
});

describe('références communes dans un manifeste', () => {
  it('se lisent et s’écrivent', () => {
    expect(referenceCommune('pnj', 'garde-x')).toBe('commun:pnj/garde-x');
    expect(lireReferenceCommune('commun:objets/chope')).toEqual({ groupe: 'objets', id: 'chope' });
    expect(lireReferenceCommune('lieu-x.webp')).toBeUndefined();
    expect(lireReferenceCommune('commun:lieux/x')).toBeUndefined();
  });

  it('un PNJ ou un objet peut citer un asset commun ; un lieu ne le peut pas', () => {
    const ok = ManifesteImages.safeParse({ pnj: { a: 'commun:pnj/garde-x' }, objets: { o: 'commun:objets/chope' } });
    expect(ok.success).toBe(true);
    expect(ManifesteImages.safeParse({ lieux: { l: 'commun:pnj/garde-x' } }).success).toBe(false);
    expect(ManifesteImages.safeParse({ pnj: { a: 'commun:autre/x' } }).success).toBe(false);
  });

  it('la vérification signale une référence à un asset inconnu ou du mauvais groupe', () => {
    const r = chargerMonde(join(RACINE_MONDES, 'marche-d-ombrefiel'));
    if (!r.ok) throw new Error('monde illisible');
    const idsCommuns = { pnj: new Set(pnj.map((e) => e.id)), objets: new Set(objets.map((e) => e.id)) };
    const premier = pnj[0]!.id;
    const manifeste = ManifesteImages.parse({
      pnj: { 'bregor-le-borgne': referenceCommune('pnj', premier), 'varek-le-brise': 'commun:pnj/inconnu-du-tout', 'perrin-le-garde': referenceCommune('objets', objets[0]!.id) },
    });
    const bilan = verifierImages(r.monde, manifeste, idsCommuns);
    expect(bilan.inconnues.some((x) => x.includes('bregor-le-borgne'))).toBe(false);
    expect(bilan.inconnues.some((x) => x.includes('varek-le-brise'))).toBe(true);
    expect(bilan.inconnues.some((x) => x.includes('perrin-le-garde'))).toBe(true);
  });
});

describe('recherche du portrait le plus proche', () => {
  it('même espèce et même sexe d’abord, génériques avant les personnages principaux', () => {
    const base = { espece: 'humain', sexe: 'F' as const, age: undefined, tranche: 'adulte' as const, apparence: 'x', origine: { monde: 'm', pnj: 'p' } };
    const table = [
      { ...base, id: 'a', nom: 'A', metiers: ['garde'], categorie: 'principal' as const },
      { ...base, id: 'b', nom: 'B', metiers: ['garde'], categorie: 'secondaire' as const },
      { ...base, id: 'c', nom: 'C', metiers: ['garde'], categorie: 'secondaire' as const, sexe: 'M' as const },
      { ...base, id: 'd', nom: 'D', metiers: ['garde'], categorie: 'secondaire' as const, espece: 'nain' },
    ];
    const res = proposerPortraits(table, { espece: 'humain', sexe: 'F', tranche: 'adulte', metiers: ['garde'] });
    expect(res.map((x) => x.entree.id)).toEqual(['b', 'a', 'c']);
    expect(proposerPortraits(table, { espece: 'humain', sexe: 'F', tranche: 'adulte', metiers: ['garde'] }, new Set(['b']))[0]!.entree.id).toBe('a');
  });

  it('un objet est proposé dans sa catégorie, jamais dans une autre', () => {
    const base = { origine: { monde: 'm', objet: 'o' }, rarete: 'commun', magique: false, resume: 'x' };
    const table = [
      { ...base, id: 'x1', nom: 'X1', objetCategorie: 'potion', categorie: 'generique' as const },
      { ...base, id: 'x2', nom: 'X2', objetCategorie: 'cle', categorie: 'generique' as const },
    ];
    expect(proposerObjets(table, { categorie: 'potion', rarete: 'commun', magique: false }).map((x) => x.entree.id)).toEqual(['x1']);
    expect(proposerObjets(table, { categorie: 'livre', rarete: 'commun', magique: false })).toEqual([]);
  });
});
