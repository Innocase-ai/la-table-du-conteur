import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chargerCharte, construireElements } from './charte';
import { construirePageComparaison } from './comparer';
import { mimeDepuisOctets } from './cli';
import { SERVICES, trouverService, type Fetch, type Requete } from './services';

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

  it('produit 6 portraits et 4 scènes', () => {
    expect(elements.filter((e) => e.groupe === 'portraits')).toHaveLength(6);
    expect(elements.filter((e) => e.groupe === 'scenes')).toHaveLength(4);
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
