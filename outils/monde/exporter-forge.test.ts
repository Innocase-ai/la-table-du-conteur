import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chargerDonneesSrd } from '../../packages/regles/src/donnees-node';
import { CATEGORIES, convertirForge, ecrireMondeForge } from './importer-forge';
import { exporterVersForge, lienValide, type ActifExporte, type MondeBrut } from './exporter-forge';

const FIXTURE = join(import.meta.dirname, 'fixtures/villambrune.forge.json');
const MODELES = { dossier: join(import.meta.dirname, '../../.claude/skills/creer-monde/assets'), atlas: join(import.meta.dirname, '../../.claude/skills/decrire-lieux/assets/ATLAS.modele.md') };
const SRD = chargerDonneesSrd();
const profils = [...SRD.monstres.keys()];
const armes = [...SRD.armes.keys()];

/** Lit un monde sur le disque comme le fait le serveur de l'atelier : monde.json et les fichiers JSON de ses dossiers. */
function lireMondeBrut(dossier: string): MondeBrut {
  const fichiers: MondeBrut['fichiers'] = [];
  for (const d of readdirSync(dossier, { withFileTypes: true }).filter((x) => x.isDirectory() && !['images', 'voix'].includes(x.name))) {
    for (const f of readdirSync(join(dossier, d.name)).filter((x) => x.endsWith('.json'))) fichiers.push({ chemin: `${d.name}/${f}`, contenu: JSON.parse(readFileSync(join(dossier, d.name, f), 'utf8')) });
  }
  return { monde: JSON.parse(readFileSync(join(dossier, 'monde.json'), 'utf8')), fichiers };
}

const compter = (assets: ActifExporte[], type: string) => assets.filter((a) => a.type === type).length;

/** Une conception exportée doit être lisible par la Forge : parents existants et sans cycle, liens autorisés, enfants dans leur lieu, lieux qui ne se recouvrent pas. */
function verifierConception(assets: ActifExporte[], liens: { from: string; to: string; type: string }[]) {
  const parId = new Map(assets.map((a) => [a.id, a]));
  expect(parId.size).toBe(assets.length);
  for (const a of assets) {
    expect(CATEGORIES[a.type], `type ${a.type}`).toBeTruthy();
    const vus = new Set<string>();
    for (let c: ActifExporte | undefined = a; c; c = c.parent ? parId.get(c.parent) : undefined) {
      expect(vus.has(c.id), `cycle sur ${a.nom}`).toBe(false);
      vus.add(c.id);
      if (c.parent) expect(parId.has(c.parent), `parent de ${c.nom}`).toBe(true);
    }
    expect(Number.isFinite(a.x) && Number.isFinite(a.y)).toBe(true);
    if (CATEGORIES[a.type] === 'lieu') expect(a.w && a.h).toBeTruthy();
    // Un asset dans un lieu se trouve dans les bornes de ce lieu (sauf les objets d'un contenant, posés sur lui).
    const p = a.parent ? parId.get(a.parent) : undefined;
    if (p && CATEGORIES[p.type] === 'lieu') {
      expect(a.x, `${a.nom} dans ${p.nom}`).toBeGreaterThanOrEqual(p.x);
      expect(a.y).toBeGreaterThanOrEqual(p.y);
      expect(a.x + (a.w ?? 78)).toBeLessThanOrEqual(p.x + p.w!);
      expect(a.y + (a.h ?? 96)).toBeLessThanOrEqual(p.y + p.h!);
    }
  }
  for (const l of liens) expect(lienValide(l.type, parId.get(l.from)!.type, parId.get(l.to)!.type), `lien ${l.type}`).toBe(true);
  // Les lieux de plus haut niveau ne se recouvrent pas.
  const racines = assets.filter((a) => !a.parent && CATEGORIES[a.type] === 'lieu');
  for (const [i, a] of racines.entries())
    for (const b of racines.slice(i + 1)) expect(a.x + a.w! <= b.x || b.x + b.w! <= a.x || a.y + a.h! <= b.y || b.y + b.h! <= a.y, `${a.nom} recouvre ${b.nom}`).toBe(true);
}

describe("import inverse : un monde devient une conception de la Forge (lecture seule)", () => {
  it("aller-retour : l'exemple de la Forge, converti en monde puis ré-exporté, garde ses lieux, PNJ, contenants, quêtes et obstacles", () => {
    const racine = mkdtempSync(join(tmpdir(), 'mondes-'));
    const f = JSON.parse(readFileSync(FIXTURE, 'utf8'));
    const cercueil = f.histoire.assets.find((a: { nom: string }) => a.nom === 'Cercueil profané');
    Object.assign(cercueil.props, { verrou: 15, piege: true, piegeDetection: 14, piegeDesarmement: 16, piegeDegats: '2d6 poison' });
    f.histoire.assets.find((a: { nom: string }) => a.nom === 'Médaillon de sainte Odile').props.rarete = 'rare';
    const { dossier } = ecrireMondeForge(racine, 'villambrune', FIXTURE, f, MODELES, { profils, armes });
    const { forge, notes } = exporterVersForge(lireMondeBrut(dossier));
    const { assets, liens } = forge.histoire;
    verifierConception(assets, liens);

    // La région racine (créée par l'import) n'a pas d'équivalent dans la Forge : 7 lieux, 5 PNJ, 2 adversaires/monstres, 4 contenants.
    expect(assets.filter((a) => CATEGORIES[a.type] === 'lieu')).toHaveLength(7);
    expect(assets.filter((a) => a.type === 'village')).toHaveLength(1);
    expect(compter(assets, 'taverne')).toBe(1);
    expect(compter(assets, 'sanctuaire')).toBe(1);
    expect(compter(assets, 'quete_principale')).toBe(1);
    expect(compter(assets, 'quete_annexe')).toBe(1);
    expect(compter(assets, 'monstre') + compter(assets, 'adversaire')).toBe(2);
    expect(compter(assets, 'adversaire')).toBe(1); // le bandit a une alternative « Négocier »
    expect(notes.join(' ')).toMatch(/région/);
    // Les obstacles du cercueil et la rareté de l'objet sont revenus.
    const c = assets.find((a) => a.nom === 'Cercueil profané')!;
    expect(c.type).toBe('cercueil');
    expect(c.props).toMatchObject({ verrou: 15, piege: true, piegeDetection: 14, piegeDesarmement: 16, piegeDegats: '2d6 poison' });
    const m = assets.find((a) => a.nom === 'Médaillon de sainte Odile')!;
    expect(m.parent).toBe(c.id);
    expect(m.props['rarete']).toBe('rare');
    // Le village a la taverne, le sanctuaire, deux maisons ; le tavernier vend ses deux objets ; la goule garde le cercueil.
    const foulques = assets.find((a) => a.nom === 'Maître Foulques')!;
    expect(foulques.type).toBe('marchand');
    expect(liens.filter((l) => l.type === 'vend' && l.from === foulques.id)).toHaveLength(2);
    expect(assets.find((a) => a.nom === 'Frère Anselme')!.type).toBe('pretre');
    const goule = assets.find((a) => a.nom === 'Goule des cryptes')!;
    expect(liens.some((l) => l.type === 'garde' && l.from === goule.id && l.to === c.id)).toBe(true);
    // La quête principale : donnée par Bertrand, finit aux ruines, requiert la goule et le médaillon.
    const qp = assets.find((a) => a.type === 'quete_principale')!;
    const vers = (t: string) => liens.filter((l) => l.type === t && l.from === qp.id).map((l) => assets.find((a) => a.id === l.to)!.nom);
    expect(liens.some((l) => l.type === 'donne' && l.to === qp.id && assets.find((a) => a.id === l.from)!.nom === 'Sire Bertrand')).toBe(true);
    expect(vers('termine')).toEqual(['Ruines de la chapelle brûlée']);
    expect(vers('requiert').sort()).toEqual(['Goule des cryptes', 'Médaillon de sainte Odile']);
  });

  it("stable : exporter, reconvertir puis ré-exporter donne la même structure", () => {
    const racine = mkdtempSync(join(tmpdir(), 'mondes-'));
    const a = ecrireMondeForge(racine, 'un', FIXTURE, JSON.parse(readFileSync(FIXTURE, 'utf8')), MODELES, { profils, armes });
    const premiere = exporterVersForge(lireMondeBrut(a.dossier)).forge;
    // La conception exportée est elle-même convertible (mêmes lieux et quêtes qu'au départ).
    const b = convertirForge(premiere, 'deux', { profils, armes });
    expect((b.dossiers['lieux'] as unknown[]).length).toBe(8);
    expect((b.dossiers['quetes'] as unknown[]).length).toBe(2);
    expect((b.dossiers['tresors'] as unknown[]).length).toBe(4);
  });

  it('un monde réel (La Dîme des Roseaux) donne une conception cohérente, sans rien écrire', () => {
    const dossier = join(import.meta.dirname, '../../packages/mondes/dime-des-roseaux');
    const brut = lireMondeBrut(dossier);
    const avant = JSON.stringify(brut);
    const { forge, notes } = exporterVersForge(brut);
    expect(JSON.stringify(brut)).toBe(avant); // l'entrée n'est pas modifiée
    const { assets, liens } = forge.histoire;
    verifierConception(assets, liens);
    expect(forge.histoire.titre).toBe('La Dîme des Roseaux');
    expect(assets.filter((a) => CATEGORIES[a.type] === 'lieu').length).toBeGreaterThanOrEqual(25);
    expect(assets.filter((a) => CATEGORIES[a.type] === 'quete').length).toBe(12);
    expect(assets.filter((a) => CATEGORIES[a.type] === 'pnj').length).toBeGreaterThanOrEqual(19);
    expect(compter(assets, 'marchand')).toBeGreaterThanOrEqual(1);
    expect(liens.filter((l) => l.type === 'mene_a').length).toBeGreaterThan(10);
    expect(liens.filter((l) => l.type === 'donne').length).toBeGreaterThanOrEqual(10);
    expect(notes.length).toBeGreaterThan(0);
  });
});
