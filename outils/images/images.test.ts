import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chargerCharte, construireElements, RACINE } from './charte';
import { chargerMonde, RACINE_MONDES } from '../../packages/regles/src/monde/chargeur';
import { elementsParLieu } from './monde';
import { chargerGalerie, elementsGalerie } from './galerie';
import { chargerReliefs, chargerTerrains, elementsBestiaire, elementsTerrains, profilsSrd } from './plateau';
import { INFO_RELIEFS, RELIEFS, RENCONTRES, TERRAINS } from '../../packages/regles/src';
import { construirePageComparaison } from './comparer';
import { mimeDepuisOctets } from './cli';
import { SERVICES, trouverService, utilisationCle, type Fetch, type Requete } from './services';

const PNG = Buffer.from('iVBORw0KGgo=', 'base64');
const ref = (nom: string) => ({ nom, mime: 'image/png', donnees: PNG });
const requete = (n: number, format: 'carre' | 'paysage' = 'paysage'): Requete => ({ prompt: 'une scène', references: Array.from({ length: n }, (_, i) => ref(`r${i}`)), format });
const service = (id: string) => SERVICES.find((s) => s.id === id)!;

function json(corps: unknown, ok = true): Response {
  return new Response(JSON.stringify(corps), { status: ok ? 200 : 400, headers: { 'Content-Type': 'application/json' } });
}

describe('charte et prompts', () => {
  const charte = chargerCharte();
  const elements = construireElements(charte);

  it('produit 6 portraits et 7 scènes (dont 3 lieux sans héros)', () => {
    expect(elements.filter((e) => e.groupe === 'portraits')).toHaveLength(6);
    expect(elements.filter((e) => e.groupe === 'scenes')).toHaveLength(7);
  });

  it('chaque scène référence des portraits existants, dans l\'ordre cité par le prompt', () => {
    const ids = new Set(elements.map((e) => e.id));
    for (const e of elements) for (const r of e.references) expect(ids.has(r)).toBe(true);
    const embuscade = elements.find((e) => e.id === 'scene-embuscade')!;
    expect(embuscade.references).toHaveLength(6);
    expect(embuscade.prompt).toContain('reference image 1 is Bran');
    expect(embuscade.prompt).toContain('reference image 6 is Ambrine');
  });

  it('chaque prompt porte la charte et les contraintes', () => {
    for (const e of elements) {
      expect(e.prompt).toContain('Dark fantasy digital painting');
      expect(e.prompt).toContain('No text');
    }
  });

  it('les noms de héros correspondent aux héros pré-tirés du jeu', () => {
    expect(charte.heros.map((h) => h.nom)).toEqual(['Bran', 'Grukk', 'Pip', 'Sylvaine', 'Hilda', 'Ambrine']);
  });
});

describe('services OpenRouter', () => {
  it('envoie le prompt, les références en data URL et les paramètres du modèle', async () => {
    let appel: { url: string; init: RequestInit } | undefined;
    const fetcher: Fetch = async (url, init) => {
      appel = { url: String(url), init: init! };
      return json({ data: [{ b64_json: PNG.toString('base64'), media_type: 'image/png' }], usage: { cost: 0.048 } });
    };
    const r = await service('flux3').generer(requete(2), 'CLE', {}, fetcher);
    const corps = JSON.parse(String(appel!.init.body));
    expect(appel!.url).toBe('https://openrouter.ai/api/v1/images');
    expect((appel!.init.headers as Record<string, string>).Authorization).toBe('Bearer CLE');
    expect(corps).toMatchObject({ model: 'black-forest-labs/flux-3-image', aspect_ratio: '3:2', n: 1, resolution: '1K' });
    expect(corps.input_references).toHaveLength(2);
    expect(corps.input_references[0].image_url.url).toBe(`data:image/png;base64,${PNG.toString('base64')}`);
    expect(r.image.equals(PNG)).toBe(true);
    expect(r.coutUsd).toBe(0.048);
    expect(r.modele).toBe('black-forest-labs/flux-3-image');
  });

  it('sans référence : pas de champ input_references ; format carré = 1:1', async () => {
    let corps: Record<string, unknown> = {};
    const fetcher: Fetch = async (_u, init) => {
      corps = JSON.parse(String(init!.body));
      return json({ data: [{ b64_json: PNG.toString('base64') }] });
    };
    const r = await service('flux2').generer(requete(0, 'carre'), 'CLE', {}, fetcher);
    expect(corps).not.toHaveProperty('input_references');
    expect(corps).not.toHaveProperty('resolution');
    expect(corps.aspect_ratio).toBe('1:1');
    expect(r.coutUsd).toBeUndefined();
    expect(r.mime).toBe('image/png');
  });

  it('gpt-image reçoit la qualité demandée', async () => {
    let corps: Record<string, unknown> = {};
    const fetcher: Fetch = async (_u, init) => {
      corps = JSON.parse(String(init!.body));
      return json({ data: [{ b64_json: PNG.toString('base64') }] });
    };
    await service('gpt-image').generer(requete(0), 'CLE', {}, fetcher);
    expect(corps).toMatchObject({ model: 'openai/gpt-image-2.5-sunburst', quality: 'medium' });
  });

  it('une erreur HTTP donne un message lisible avec le service', async () => {
    const fetcher: Fetch = async () => json({ error: 'clé invalide' }, false);
    await expect(service('flux2').generer(requete(0), 'CLE', {}, fetcher)).rejects.toThrow(/FLUX\.2 pro : HTTP 400/);
  });

  it("une réponse sans image est signalée", async () => {
    const fetcher: Fetch = async () => json({ data: [] });
    await expect(service('flux2').generer(requete(0), 'CLE', {}, fetcher)).rejects.toThrow(/aucune image/);
  });

  it('trouverService accepte un alias ou un identifiant OpenRouter, et refuse le reste', () => {
    expect(trouverService('gemini')?.modele({})).toBe('google/gemini-nano-banana-2.1');
    const libre = trouverService('bytedance-seed/seedream-5-0-pro')!;
    expect(libre.id).toBe('bytedance-seed__seedream-5-0-pro');
    expect(libre.modele({})).toBe('bytedance-seed/seedream-5-0-pro');
    expect(trouverService('nimporte quoi')).toBeUndefined();
  });

  it('les alias déclarent assez de références pour la scène à 6 héros', () => {
    for (const s of SERVICES) expect(s.maxReferences).toBeGreaterThanOrEqual(6);
  });
});

describe('type MIME', () => {
  it('reconnaît PNG, JPEG et WebP', () => {
    expect(mimeDepuisOctets(PNG)).toBe('image/png');
    expect(mimeDepuisOctets(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe('image/jpeg');
    expect(mimeDepuisOctets(Buffer.from('RIFFxxxxWEBPVP8 '))).toBe('image/webp');
  });
});

describe('dépense de la clé', () => {
  it('lit la dépense cumulée, ou renvoie undefined en cas de problème', async () => {
    const ok: Fetch = async () => json({ data: { usage: 1.11, limit: 1 } });
    expect(await utilisationCle('CLE', ok)).toBe(1.11);
    expect(await utilisationCle('CLE', async () => json({}, false))).toBeUndefined();
    expect(await utilisationCle('CLE', async () => { throw new Error('réseau'); })).toBeUndefined();
  });
});

describe('page de comparaison', () => {
  it('affiche les images présentes et des tirets pour les manquantes', () => {
    const dossier = mkdtempSync(join(tmpdir(), 'cmp-'));
    mkdirSync(join(dossier, 'gemini'));
    writeFileSync(join(dossier, 'gemini', 'portrait-bran.png'), PNG);
    writeFileSync(join(dossier, 'gemini', 'portrait-bran.json'), JSON.stringify({ dureeMs: 12300, coutUsd: 0.04, modele: 'm' }));
    const elements = construireElements(chargerCharte()).slice(0, 2);
    const html = construirePageComparaison(dossier, elements, SERVICES);
    expect(html).toContain('gemini/portrait-bran.png');
    expect(html).toContain('12.3 s · 0.040 $');
    expect(html).toContain('class="vide"');
    expect(html).toContain('Gemini Nano Banana 2.1');
    // Seuls les services qui ont des images deviennent des colonnes.
    expect(html).not.toContain('FLUX.2 pro');
  });
});

describe('règle : pas de héros du groupe dans les images du produit', () => {
  it('les scènes de lieux ne citent aucun héros ni aucune référence', () => {
    const lieux = construireElements(chargerCharte()).filter((e) => ['scene-veillecendre', 'scene-cryptes', 'scene-haute-forge'].includes(e.id));
    expect(lieux).toHaveLength(3);
    for (const e of lieux) expect(e.references).toEqual([]);
  });
});

describe('images d’un monde, lieu par lieu', () => {
  const racineSrd = join(RACINE, 'packages/donnees/srd');
  const charge = chargerMonde(join(RACINE_MONDES, 'val-des-cendres'));
  if (!charge.ok) throw new Error('monde invalide');
  const parLieu = elementsParLieu(charge.monde, { charte: chargerCharte(), racineSrd });
  const tous = [...parLieu.values()].flat();

  it('chaque lieu et chaque PNJ ont une image, une seule fois', () => {
    const ids = tous.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(tous.filter((e) => e.groupe === 'lieux')).toHaveLength(charge.monde.lieux.size);
    expect(tous.filter((e) => e.groupe === 'pnj')).toHaveLength(charge.monde.pnj.size);
  });

  it('ne cite aucune référence de héros et ne montre personne dans un lieu', () => {
    for (const e of tous) expect(e.references).toEqual([]);
    for (const e of tous.filter((x) => x.groupe === 'lieux')) expect(e.prompt).toContain('No people and no creatures');
  });

  it('les objets illustrés sont les objets notables seulement', () => {
    for (const e of tous.filter((x) => x.groupe === 'objets')) {
      const o = charge.monde.objets.get(e.id.replace('objet-', ''))!;
      expect(o.rarete !== 'commun' || o.magique).toBe(true);
    }
  });
});

describe('textes des prompts de monde', () => {
  const racineSrd = join(RACINE, 'packages/donnees/srd');
  const charge = chargerMonde(join(RACINE_MONDES, 'val-des-cendres'));
  if (!charge.ok) throw new Error('monde invalide');
  const tous = (retouches?: Record<string, string>) => [...elementsParLieu(charge.monde, { charte: chargerCharte(), racineSrd, retouches }).values()].flat();

  it('traduit les espèces et décrit les monstres en anglais', () => {
    const bertille = tous().find((e) => e.id === 'pnj-bertille-dernier-feu')!;
    expect(bertille.prompt).toContain('halfling');
    expect(bertille.prompt).not.toContain('halfelin');
    expect(tous().find((e) => e.id === 'monstre-bandit')!.prompt).toContain('human bandit');
  });

  it('une retouche remplace le texte de la fiche', () => {
    const e = tous({ 'pnj-bertille-dernier-feu': 'TEXTE DE REMPLACEMENT' }).find((x) => x.id === 'pnj-bertille-dernier-feu')!;
    expect(e.prompt).toContain('TEXTE DE REMPLACEMENT');
  });

  it('chaque monstre du monde a une fiche visuelle dans la charte', () => {
    const profils = new Set([...charge.monde.rencontres.values()].flatMap((r) => r.monstres.map((m) => m.profil)));
    const charte = chargerCharte();
    for (const p of profils) expect(charte.monstres.some((m) => m.id === p), p).toBe(true);
  });
});

describe('galerie de portraits (commune à tous les mondes)', () => {
  const elements = elementsGalerie(chargerCharte());
  const { galerie, entrees } = chargerGalerie();

  it('produit un portrait par entrée de portraits.json, avec le même id que le créateur', () => {
    expect(elements).toHaveLength(54);
    expect(elements.map((e) => e.id)).toEqual(entrees.map((p) => p.id));
  });

  it('chaque espèce a 2 sexes × 3 variantes décrites, sans doublon', () => {
    expect(Object.keys(galerie.portraits).sort()).toEqual(entrees.map((p) => p.id).sort());
    expect(new Set(Object.values(galerie.portraits)).size).toBe(54);
    expect(new Set(entrees.map((p) => p.espece))).toEqual(new Set(Object.keys(galerie.especes)));
  });

  it('visage générique : tenue neutre, aucune référence, aucun héros fixe', () => {
    for (const e of elements) {
      expect(e.references).toEqual([]);
      expect(e.format).toBe('carre');
      expect(e.prompt).toContain('no armour, no weapons');
      for (const h of chargerCharte().heros) expect(e.prompt).not.toContain(h.nom);
    }
  });
});

describe('plateau de combat (commun à tous les mondes)', () => {
  const charte = chargerCharte();

  it('le bestiaire a une image par profil de monstre du SRD, en pied et sans décor', () => {
    const elements = elementsBestiaire(charte);
    expect(elements.map((e) => e.id)).toEqual(profilsSrd());
    for (const e of elements) expect(e.prompt).toContain('Full-body figure');
  });

  it('chaque ambiance du moteur a ses trois textures, et chaque rencontre une ambiance connue', () => {
    expect(Object.keys(chargerTerrains()).sort()).toEqual([...TERRAINS].sort());
    expect(elementsTerrains(charte).filter((e) => !e.id.startsWith('relief-'))).toHaveLength(TERRAINS.length * 3);
    for (const r of RENCONTRES) expect(TERRAINS).toContain(r.terrain);
  });

  it('chaque plaque (eau, boue, neige) du moteur a sa texture, et seulement elles : arbres et rochers sont dessinés en vecteur', () => {
    const plaques = RELIEFS.filter((r) => INFO_RELIEFS[r].type === 'difficile');
    expect(Object.keys(chargerReliefs()).sort()).toEqual([...plaques].sort());
    expect(elementsTerrains(charte).filter((e) => e.id.startsWith('relief-')).map((e) => e.id).sort()).toEqual(plaques.map((r) => `relief-${r}`).sort());
  });
});
