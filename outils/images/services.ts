// Génération d'images par OpenRouter : une seule clé et une seule API (`POST /api/v1/images`) pour
// des dizaines de modèles (FLUX, Gemini, gpt-image…). Un « service » est un modèle OpenRouter.
// `fetch` est injectable pour les tests.
//
// Documentation lue le 02/11/2026 : https://openrouter.ai/docs/features/multimodal/image-generation
// Aucun appel n'a encore été exécuté avec une vraie clé : le premier essai peut révéler un ajustement.
import type { Format } from './charte';

export interface Reference {
  nom: string;
  mime: string;
  donnees: Buffer;
}

export interface Requete {
  prompt: string;
  references: Reference[];
  format: Format;
}

export interface Resultat {
  image: Buffer;
  mime: string;
  dureeMs: number;
  /** Coût facturé par OpenRouter, en dollars (`usage.cost`). */
  coutUsd?: number;
  modele: string;
}

export type Fetch = typeof fetch;
export type Env = Record<string, string | undefined>;

export interface Service {
  id: string;
  nom: string;
  cleEnv: string;
  /** Nombre maximal d'images de référence (champ `input_references` de l'endpoint du modèle). */
  maxReferences: number;
  modele(env: Env): string;
  generer(requete: Requete, cle: string, env: Env, fetcher?: Fetch): Promise<Resultat>;
}

export const URL_OPENROUTER = 'https://openrouter.ai/api/v1/images';
export const CLE_OPENROUTER = 'OPENROUTER_API_KEY';

const RATIOS: Record<Format, string> = { carre: '1:1', paysage: '3:2' };

async function verifier(rep: Response, service: string): Promise<void> {
  if (rep.ok) return;
  const corps = (await rep.text()).slice(0, 600);
  throw new Error(`${service} : HTTP ${rep.status} — ${corps}`);
}

/** Paramètres propres à un modèle, ajoutés à la requête (ex. `resolution`, `quality`). */
type Parametres = Record<string, unknown>;

export function openrouter(id: string, nom: string, slug: string, maxReferences: number, parametres: Parametres = {}): Service {
  return {
    id,
    nom,
    cleEnv: CLE_OPENROUTER,
    maxReferences,
    modele: () => slug,
    async generer(req, cle, _env, fetcher = fetch) {
      const debut = Date.now();
      const corps: Record<string, unknown> = { model: slug, prompt: req.prompt, aspect_ratio: RATIOS[req.format], n: 1, ...parametres };
      if (req.references.length) {
        corps.input_references = req.references.map((r) => ({
          type: 'image_url',
          image_url: { url: `data:${r.mime};base64,${r.donnees.toString('base64')}` },
        }));
      }
      const rep = await fetcher(URL_OPENROUTER, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(corps),
        signal: AbortSignal.timeout(300_000),
      });
      await verifier(rep, nom);
      const json = (await rep.json()) as { data?: { b64_json?: string; media_type?: string }[]; usage?: { cost?: number } };
      const image = json.data?.[0];
      if (!image?.b64_json) throw new Error(`${nom} : aucune image dans la réponse (${JSON.stringify(json).slice(0, 300)}).`);
      return { image: Buffer.from(image.b64_json, 'base64'), mime: image.media_type ?? 'image/png', dureeMs: Date.now() - debut, coutUsd: json.usage?.cost, modele: slug };
    },
  };
}

/** Modèles comparés par défaut (références max d'après les endpoints OpenRouter du 02/11/2026). */
export const SERVICES: Service[] = [
  openrouter('flux2', 'FLUX.2 pro', 'black-forest-labs/flux.2-pro', 8),
  openrouter('flux3', 'FLUX 3 Image', 'black-forest-labs/flux-3-image', 10, { resolution: '1K' }),
  openrouter('gemini', 'Gemini Nano Banana 2.1', 'google/gemini-nano-banana-2.1', 14, { resolution: '1K' }),
  openrouter('gemini-pro', 'Gemini 3 Pro Image', 'google/gemini-3-pro-image', 14, { resolution: '1K' }),
  openrouter('gpt-image', 'OpenAI gpt-image 2.5', 'openai/gpt-image-2.5-sunburst', 16, { quality: 'medium' }),
];

/** Retrouve un service par son alias (`flux2`) ou par un identifiant OpenRouter quelconque (`auteur/modele`). */
export function trouverService(nom: string): Service | undefined {
  const connu = SERVICES.find((s) => s.id === nom);
  if (connu) return connu;
  if (/^[a-z0-9._-]+\/[a-z0-9._-]+$/i.test(nom)) return openrouter(nom.replace('/', '__'), nom, nom, 8);
  return undefined;
}

/** Dépense cumulée de la clé OpenRouter, en dollars (GET /api/v1/key). `undefined` si l'API ne la donne pas. */
export async function utilisationCle(cle: string, fetcher: Fetch = fetch): Promise<number | undefined> {
  try {
    const rep = await fetcher('https://openrouter.ai/api/v1/key', { headers: { Authorization: `Bearer ${cle}` }, signal: AbortSignal.timeout(20_000) });
    if (!rep.ok) return undefined;
    const json = (await rep.json()) as { data?: { usage?: number } };
    return typeof json.data?.usage === 'number' ? json.data.usage : undefined;
  } catch {
    return undefined;
  }
}
