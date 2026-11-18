// Corrections des rangs 1, 3 et 4 de docs/AUDIT-CREATION-HISTOIRE.md (18/11/2026), sur le monde d'essai de la Forge
// (l'exemple `fixtures/villambrune.forge.json`, importé dans un dossier temporaire) :
//   rang 1 : le profil « épisode » du validateur (opt-in `monde.format`), qui remplace les avis « Richesse » par les règles du cap ;
//   rang 3 : `manque` vérifie les fichiers d'images, les références communes et les champs « À écrire » ;
//   rang 4 : trop de PNJ dans un lieu, titre qui trahit, réplique qui place le PNJ ailleurs.
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { chargerDonneesSrd } from '../../packages/regles/src/donnees-node';
import { chargerMonde } from '../../packages/regles/src/monde/chargeur';
import type { DonneesMonde, Lieu, Pnj } from '../../packages/regles/src/monde/schemas';
import { validerMonde } from '../../packages/regles/src/monde/validation';
import { ecrireMondeForge } from './importer-forge';
import { completudeDuMonde } from './verifier';

const FIXTURE = join(import.meta.dirname, 'fixtures/villambrune.forge.json');
const MODELES = { dossier: join(import.meta.dirname, '../../.claude/skills/creer-monde/assets'), atlas: join(import.meta.dirname, '../../.claude/skills/decrire-lieux/assets/ATLAS.modele.md') };
const SRD = chargerDonneesSrd();
let dossier = '';
beforeAll(() => {
  const racine = mkdtempSync(join(tmpdir(), 'audit-creation-'));
  dossier = ecrireMondeForge(racine, 'essai', FIXTURE, JSON.parse(readFileSync(FIXTURE, 'utf8')), MODELES, { profils: [...SRD.monstres.keys()], armes: [...SRD.armes.keys()] }).dossier;
});
const charger = (): DonneesMonde => {
  const r = chargerMonde(dossier);
  if (!r.ok) throw new Error(JSON.stringify(r.erreurs));
  return r.monde;
};
const avis = (dm: DonneesMonde) => validerMonde(dm, SRD).avertissements;
const episode = (dm: DonneesMonde) => ((dm.monde as { format?: string }).format = 'episode', dm);
const mots = (n: number) => Array.from({ length: n }, (_, i) => `mot${i}`).join(' ');
const premierPnj = (dm: DonneesMonde): Pnj => [...dm.pnj.values()][0]!;
const batiments = (dm: DonneesMonde): Lieu[] => [...dm.lieux.values()].filter((l) => l.type === 'batiment');

describe('rang 1 : profil « épisode » du validateur (opt-in)', () => {
  it('sans `format`, les avis « Richesse » restent et aucun avis « Épisode » n’apparaît', () => {
    const a = avis(charger());
    expect(a.some((x) => x.startsWith('Richesse : 8 lieux'))).toBe(true);
    expect(a.some((x) => x.startsWith('Épisode'))).toBe(false);
  });

  it('`format: "episode"` est accepté par le schéma de monde.json', () => {
    const f = join(dossier, 'monde.json');
    const brut = JSON.parse(readFileSync(f, 'utf8'));
    writeFileSync(f, JSON.stringify({ ...brut, format: 'episode' }));
    try {
      expect(charger().monde.format).toBe('episode');
    } finally {
      writeFileSync(f, JSON.stringify(brut));
    }
  });

  it('avec le profil, plus d’avis « Richesse », mais la taille du lieu de départ', () => {
    const a = avis(episode(charger()));
    expect(a.filter((x) => x.startsWith('Richesse'))).toEqual([]);
    // Villambrune : le village et ses 4 bâtiments, soit 5 pièces.
    expect(a.some((x) => x.startsWith('Épisode : le lieu de départ « villambrune » compte 5 pièces'))).toBe(true);
  });

  it('compte les quêtes (3 à 8, une seule principale, ni personnelle ni de faction)', () => {
    const a = avis(episode(charger()));
    expect(a.some((x) => x.startsWith('Épisode : 2 quêtes'))).toBe(true);
    const dm = episode(charger());
    const q = [...dm.quetes.values()].find((x) => x.type === 'secondaire')!;
    for (let i = 0; i < 8; i++) dm.quetes.set(`q-${i}`, { ...q, id: `q-${i}`, type: i === 0 ? 'principale' : i === 1 ? 'personnelle' : i === 2 ? 'faction' : 'secondaire' });
    const b = avis(dm);
    expect(b.some((x) => x.startsWith('Épisode : 10 quêtes'))).toBe(true);
    expect(b.some((x) => x.startsWith('Épisode : 2 quêtes principales'))).toBe(true);
    expect(b.some((x) => x.startsWith('Épisode : quêtes personnelles ou de faction') && x.includes('q-1') && x.includes('q-2'))).toBe(true);
  });

  it('au moins 4 sujets par PNJ qui parle', () => {
    const dm = episode(charger());
    const p = premierPnj(dm);
    expect(avis(dm).find((x) => x.startsWith('Épisode : PNJ avec moins de 4 sujets'))).toContain(p.id);
    p.sujets = Array.from({ length: 4 }, (_, i) => ({ ...p.sujets[0]!, id: `s${i}` }));
    expect(avis(dm).find((x) => x.startsWith('Épisode : PNJ avec moins de 4 sujets')) ?? '').not.toContain(`${p.id} `);
  });

  it('aucun `lieu` sur les étapes de quête (le joueur cherche)', () => {
    const dm = episode(charger());
    const q = [...dm.quetes.values()][0]!;
    q.etapes[0]!.lieu = batiments(dm)[0]!.id;
    expect(avis(dm).some((x) => x.startsWith('Épisode : étapes de quête avec un `lieu`') && x.includes(`${q.id}/${q.etapes[0]!.id}`))).toBe(true);
  });

  it('récits d’arrivée de 130 à 170 mots', () => {
    const dm = episode(charger());
    const l = batiments(dm)[0]!;
    l.arrivee = mots(215);
    expect(avis(dm).some((x) => x.startsWith('Épisode : récits d’arrivée hors de 130 à 170 mots') && x.includes(l.id))).toBe(true);
  });

  it('un objet du catalogue trop rare pour le niveau, et une table de butin d’un palier trop haut', () => {
    const dm = episode(charger());
    const t = [...dm.tresors.values()][0]!;
    t.contenu.objets.push({ objet: 'epee-vorpale', quantite: 1 });
    dm.tables.set('table-haute', { id: 'table-haute', nom: 'Table haute', palier: 3, entrees: [{ poids: 1, objet: 'potion-de-guerison' } as never] });
    const a = avis(dm);
    expect(a.some((x) => x.startsWith('Épisode : butin trop rare') && x.includes('epee-vorpale'))).toBe(true);
    expect(a.some((x) => x.startsWith('Épisode : tables de butin d’un palier trop haut') && x.includes('table-haute'))).toBe(true);
  });

  it('une pièce vide du lieu de départ', () => {
    const dm = episode(charger());
    const village = dm.lieux.get('villambrune')!;
    dm.lieux.set('grange', { ...batiments(dm)[0]!, id: 'grange', nom: 'Grange', parent: village.id, liens: [], rencontres: [], faits: [], evenements: [], services: [] });
    expect(avis(dm).some((x) => x.startsWith('Épisode : pièces vides') && x.includes('grange'))).toBe(true);
  });
});

describe('rang 4 : lieux surpeuplés, titres qui trahissent, répliques mal placées', () => {
  it('plus de 6 personnages qui parlent dans un même lieu', () => {
    const dm = charger();
    const p = premierPnj(dm);
    expect(avis(dm).some((x) => x.startsWith('Lieux surpeuplés'))).toBe(false);
    for (let i = 0; i < 11; i++) dm.pnj.set(`clone-${i}`, { ...p, id: `clone-${i}`, nom: `Clone ${i}` });
    expect(avis(dm).some((x) => x.startsWith('Lieux surpeuplés') && x.includes(`${p.lieu} (12)`))).toBe(true);
  });

  it('un titre ou un nom qui trahit un rôle de jeu', () => {
    const dm = charger();
    const p = premierPnj(dm);
    p.titre = 'Mercenaire (Compagnon)';
    expect(avis(dm).some((x) => x.startsWith('Titres qui trahissent') && x.includes(p.id))).toBe(true);
    p.titre = 'Marchande de caravane';
    expect(avis(dm).some((x) => x.startsWith('Titres qui trahissent'))).toBe(false);
  });

  it('une réplique qui place le PNJ dans un lieu où il n’est jamais', () => {
    const dm = charger();
    const p = premierPnj(dm);
    const ailleurs = batiments(dm).find((l) => l.id !== p.lieu)!;
    p.sujets[0]!.reponse = `« Vous me trouverez toujours à ${ailleurs.nom}, le soir. »`;
    expect(avis(dm).some((x) => x.startsWith('Répliques qui placent un PNJ ailleurs') && x.includes(p.id) && x.includes(ailleurs.id))).toBe(true);
    // Parler d'un autre lieu sans s'y placer, ou s'y placer quand on y a une présence : rien à dire.
    p.sujets[0]!.reponse = `« Allez donc voir à ${ailleurs.nom}, on y sait des choses. »`;
    expect(avis(dm).some((x) => x.startsWith('Répliques qui placent un PNJ ailleurs'))).toBe(false);
    p.sujets[0]!.reponse = `« Vous me trouverez toujours à ${ailleurs.nom}, le soir. »`;
    p.presences = [{ lieu: ailleurs.id, moment: 'soir' }];
    expect(avis(dm).some((x) => x.startsWith('Répliques qui placent un PNJ ailleurs'))).toBe(false);
  });
});

describe('rang 3 : `manque` vérifie les fichiers, les références communes et les champs « À écrire »', () => {
  const ecrireManifeste = (dm: DonneesMonde, extra: Record<string, Record<string, string>> = {}) => {
    const m: Record<string, Record<string, string>> = { lieux: {}, pnj: {}, objets: {}, cartes: {}, monstres: {} };
    for (const id of dm.lieux.keys()) m['lieux']![id] = `lieu-${id}.webp`;
    for (const id of dm.pnj.keys()) m['pnj']![id] = `pnj-${id}.webp`;
    for (const id of dm.objets.keys()) m['objets']![id] = `objet-${id}.webp`;
    for (const [g, e] of Object.entries(extra)) Object.assign(m[g]!, e);
    mkdirSync(join(dossier, 'images'), { recursive: true });
    writeFileSync(join(dossier, 'images/manifeste.json'), JSON.stringify(m));
    return m;
  };
  const manques = (categorie: string) => completudeDuMonde(dossier, charger()).filter((x) => x.gravite === 'manque' && x.categorie === categorie);

  it('une image citée par le manifeste mais absente du disque est un manque', () => {
    const dm = charger();
    const m = ecrireManifeste(dm);
    const lieu = [...dm.lieux.keys()][0]!;
    expect(manques('images').some((x) => x.cible === m['lieux']![lieu] && /absent/.test(x.detail))).toBe(true);
    for (const g of ['lieux', 'pnj', 'objets'] as const) for (const f of Object.values(m[g]!)) writeFileSync(join(dossier, 'images', f), '');
    expect(manques('images')).toEqual([]);
  });

  it('une référence commune inconnue est un manque, une entrée orpheline un avis', () => {
    const dm = charger();
    const p = premierPnj(dm);
    ecrireManifeste(dm, { pnj: { [p.id]: 'commun:pnj/personne-de-ce-nom' }, lieux: { fantome: 'lieu-fantome.webp' } });
    writeFileSync(join(dossier, 'images', 'lieu-fantome.webp'), '');
    const ecarts = completudeDuMonde(dossier, charger());
    expect(ecarts.some((x) => x.gravite === 'manque' && x.cible === p.id && x.detail.includes('commun:pnj/personne-de-ce-nom'))).toBe(true);
    expect(ecarts.some((x) => x.gravite === 'avis' && x.cible === 'lieux/fantome')).toBe(true);
  });

  it('les champs « À écrire » et « à définir » sont des manques', () => {
    const t = manques('textes');
    expect(t.length).toBeGreaterThan(20);
    expect(t.some((x) => x.detail.startsWith('À écrire'))).toBe(true);
    expect(t.some((x) => x.cible.startsWith('monde.json') && x.detail === 'à définir')).toBe(true);
  });
});
