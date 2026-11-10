// Le relais de l'assistant d'écriture de l'atelier (développement seulement). Le navigateur envoie ses messages à
// `POST /api/atelier/ia` ; le relais ajoute la clé OpenRouter lue dans le `.env` du projet (jamais envoyée au navigateur, jamais
// affichée), impose le modèle et la longueur de réponse, et coupe quand la dépense de la session du serveur dépasse un plafond
// (`ATELIER_PLAFOND_USD`, 0,50 $ par défaut). Une seule requête à la fois, pour que le plafond tienne.
//   GET  /api/atelier/ia-etat   { disponible, modele, depense, plafond }
//   POST /api/atelier/ia        { messages: [{ role, content }] } → { texte, cout, depense, plafond }
// Les règles (`verifierDemande`, `traiterDemande`) sont sans réseau : `appeler` est injecté, les tests passent un faux.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { cleOpenRouter, variablesProjet } from '../../outils/cle';
import { corpsJson, origineAutorisee } from './chemins';

export const URL_OPENROUTER = 'https://openrouter.ai/api/v1/chat/completions';
/** Le modèle de l'assistant : celui du conteur (Claude Haiku 5.5, 0,10 $ / 0,50 $ le million de tokens). */
export const MODELE_ASSISTANT = 'anthropic/claude-haiku-5.5';
export const PLAFOND_ASSISTANT_DEFAUT = 0.5;
export const MAX_TOKENS_ASSISTANT = 1200;
export const MESSAGES_MAX = 24;
/** Taille maximale de la conversation, en caractères (la bible et la fiche y entrent largement). */
export const CARACTERES_MAX = 150_000;

export interface MessageIa {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface EtatRelaisIa {
  depense: number;
  plafond: number;
  enCours: boolean;
}

export type Appeler = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ status: number; text: () => Promise<string> }>;

/** Le plafond lu dans l'environnement (virgule acceptée) ; une valeur invalide prend le défaut, et le dit. */
export function lirePlafondAssistant(texte: string | undefined): { plafond: number; invalide: boolean } {
  if (texte === undefined || texte.trim() === '') return { plafond: PLAFOND_ASSISTANT_DEFAUT, invalide: false };
  const n = Number(texte.trim().replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? { plafond: n, invalide: false } : { plafond: PLAFOND_ASSISTANT_DEFAUT, invalide: true };
}

/** La conversation envoyée par la page : des messages `system` / `user` / `assistant` en texte, en nombre et en taille bornés. */
export function verifierDemande(brut: unknown): { ok: true; messages: MessageIa[] } | { ok: false; erreur: string } {
  const messages = (brut as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(messages) || messages.length === 0) return { ok: false, erreur: 'Requête invalide : messages attendus.' };
  if (messages.length > MESSAGES_MAX) return { ok: false, erreur: `Conversation trop longue (${MESSAGES_MAX} messages au plus) : recommencez-la.` };
  let total = 0;
  const propres: MessageIa[] = [];
  for (const m of messages) {
    const x = m as { role?: unknown; content?: unknown } | null;
    if (!x || !['system', 'user', 'assistant'].includes(String(x.role)) || typeof x.content !== 'string') return { ok: false, erreur: 'Requête invalide : message mal formé.' };
    total += x.content.length;
    propres.push({ role: x.role as MessageIa['role'], content: x.content });
  }
  if (total > CARACTERES_MAX) return { ok: false, erreur: 'Requête trop grande.' };
  if (propres[propres.length - 1]!.role !== 'user') return { ok: false, erreur: 'Requête invalide : le dernier message doit être celui de l’auteur.' };
  return { ok: true, messages: propres };
}

/** Une demande à l'assistant : vérifie, respecte le plafond, appelle OpenRouter et compte la dépense. */
export async function traiterDemande(etat: EtatRelaisIa, cle: string | undefined, brut: unknown, appeler: Appeler): Promise<{ statut: number; corps: unknown }> {
  if (!cle) return { statut: 503, corps: { erreur: 'Pas de clé sur ce serveur (variable OPENROUTER_API_KEY du fichier .env).' } };
  if (etat.enCours) return { statut: 429, corps: { erreur: 'Une demande à l’assistant est déjà en cours.' } };
  if (etat.depense >= etat.plafond) return { statut: 402, corps: { erreur: `Plafond de dépense de l’assistant atteint (${etat.plafond} $ pour cette session du serveur ; variable ATELIER_PLAFOND_USD).` } };
  const v = verifierDemande(brut);
  if (!v.ok) return { statut: 400, corps: { erreur: v.erreur } };
  etat.enCours = true;
  try {
    const rep = await appeler(URL_OPENROUTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cle}` },
      body: JSON.stringify({ model: MODELE_ASSISTANT, messages: v.messages, max_tokens: MAX_TOKENS_ASSISTANT, temperature: 0.8, usage: { include: true } }),
    });
    const texte = await rep.text();
    let json: { usage?: { cost?: number }; choices?: { message?: { content?: unknown } }[]; error?: { message?: string } } = {};
    try {
      json = JSON.parse(texte) as typeof json;
    } catch {
      // réponse non JSON : traitée plus bas
    }
    const cout = typeof json.usage?.cost === 'number' && Number.isFinite(json.usage.cost) ? json.usage.cost : 0;
    etat.depense += cout;
    if (rep.status < 200 || rep.status >= 300) return { statut: 502, corps: { erreur: `OpenRouter : ${json.error?.message ?? `erreur ${rep.status}`}` } };
    const contenu = json.choices?.[0]?.message?.content;
    if (typeof contenu !== 'string' || !contenu.trim()) return { statut: 502, corps: { erreur: 'Réponse vide du modèle.' } };
    return { statut: 200, corps: { texte: contenu.trim(), cout, depense: etat.depense, plafond: etat.plafond } };
  } catch (e) {
    return { statut: 502, corps: { erreur: (e as Error).message } };
  } finally {
    etat.enCours = false;
  }
}

function repondre(res: ServerResponse, statut: number, corps: unknown): void {
  res.statusCode = statut;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(corps));
}

function lireCorps(req: IncomingMessage): Promise<string> {
  return new Promise((ok, ko) => {
    let texte = '';
    req.on('data', (c: Buffer) => {
      texte += c.toString('utf8');
      if (texte.length > CARACTERES_MAX * 2) {
        ko(new Error('Requête trop grande.'));
        req.destroy();
      }
    });
    req.on('end', () => ok(texte));
    req.on('error', ko);
  });
}

/** Le plugin Vite : `dossierEnv` est la racine du projet (là où est le `.env`), relative à la racine de l'atelier. */
export function relaisIa(dossierEnv: string): Plugin {
  let cle: string | undefined;
  const etat: EtatRelaisIa = { depense: 0, plafond: PLAFOND_ASSISTANT_DEFAUT, enCours: false };
  return {
    name: 'relais-ia-atelier',
    apply: 'serve',
    configResolved(config) {
      const racine = resolve(config.root, dossierEnv);
      cle = cleOpenRouter(racine);
      const lu = lirePlafondAssistant(variablesProjet(racine)['ATELIER_PLAFOND_USD']);
      etat.plafond = lu.plafond;
      if (lu.invalide) config.logger.warn(`ATELIER_PLAFOND_USD invalide : plafond de l'assistant ramené à ${etat.plafond} $.`);
    },
    configureServer(serveur) {
      serveur.middlewares.use('/api/atelier/ia-etat', (req, res) => {
        if (!origineAutorisee(req.headers.origin)) return repondre(res, 403, { erreur: 'Origine refusée.' });
        repondre(res, 200, { disponible: !!cle, modele: MODELE_ASSISTANT, depense: etat.depense, plafond: etat.plafond });
      });
      serveur.middlewares.use('/api/atelier/ia', async (req, res) => {
        if (req.method !== 'POST') return repondre(res, 405, { erreur: 'POST seulement.' });
        if (!origineAutorisee(req.headers.origin)) return repondre(res, 403, { erreur: 'Origine refusée : le relais ne sert que l’atelier.' });
        if (!corpsJson(req.headers['content-type'])) return repondre(res, 415, { erreur: 'Corps JSON attendu.' });
        let brut: unknown;
        try {
          brut = JSON.parse(await lireCorps(req));
        } catch (e) {
          return repondre(res, 400, { erreur: `Requête illisible : ${(e as Error).message}` });
        }
        const r = await traiterDemande(etat, cle, brut, (url, init) => fetch(url, init));
        repondre(res, r.statut, r.corps);
      });
    },
  };
}
