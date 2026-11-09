// Le modèle du conteur, par OpenRouter (compatible avec l'API de chat à outils). La clé ne se trouve jamais dans le
// navigateur : en développement, le serveur du jeu la lit dans `.env` et relaie la requête (`/api/conteur/chat`) ; avec la
// clé du joueur (application de bureau), l'appel part directement vers OpenRouter.
import type { LLM, MessageLLM, UsageLLM } from './tour';

/** Le modèle conseillé par défaut : rapide et peu cher (0,10 $ / 0,50 $ le million de tokens ; cache 0,01 $). */
export const MODELE_CONTEUR = 'anthropic/claude-haiku-5.5';
export const URL_OPENROUTER = 'https://openrouter.ai/api/v1/chat/completions';

export interface ConfigLLM {
  /** Où envoyer la requête : le relais du serveur du jeu, ou OpenRouter avec `cle`. */
  url?: string;
  cle?: string;
  modele?: string;
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
  /** Attente entre deux essais (les tests la remplacent). */
  pause?: (ms: number) => Promise<void>;
}

/** Une erreur du service, avec un message que le joueur peut lire. */
export class ErreurService extends Error {
  constructor(
    message: string,
    readonly statut?: number,
  ) {
    super(message);
  }
}

function messageHttp(statut: number, corps: string): string {
  if (statut === 401 || statut === 403) return 'La clé du conteur est refusée : vérifie-la dans les options.';
  if (statut === 402) return 'Le crédit du compte du conteur est épuisé : recharge-le, puis reprends.';
  if (statut === 429) return 'Le service du conteur est très sollicité : réessaie dans un instant.';
  if (statut >= 500) return 'Le service du conteur est momentanément indisponible : réessaie dans un instant.';
  return `Le service du conteur a répondu une erreur (${statut}) : ${corps.slice(0, 200)}`;
}

export function creerLLM(config: ConfigLLM = {}): LLM {
  const url = config.url ?? URL_OPENROUTER;
  const attendre = config.pause ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  return async ({ messages, tools }) => {
    const corps = JSON.stringify({
      model: config.modele ?? MODELE_CONTEUR,
      messages,
      tools,
      tool_choice: 'auto',
      max_tokens: config.maxTokens ?? 1200,
      temperature: config.temperature ?? 0.8,
      usage: { include: true },
    });
    let derniere = '';
    for (let essai = 0; essai < 3; essai++) {
      let rep: Response;
      try {
        rep = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(config.cle ? { Authorization: `Bearer ${config.cle}` } : {}) },
          body: corps,
          signal: config.signal,
        });
      } catch (e) {
        if ((e as Error).name === 'AbortError') throw new ErreurService('Le tour a été interrompu.');
        derniere = 'Le service du conteur est injoignable : vérifie la connexion.';
        await attendre(800 * (essai + 1));
        continue;
      }
      if (!rep.ok) {
        const texte = await rep.text().catch(() => '');
        derniere = messageHttp(rep.status, texte);
        // Limite de débit et pannes passagères : on réessaie ; une clé ou un crédit refusés ne changeront pas.
        if (rep.status === 429 || rep.status >= 500) {
          await attendre(1000 * (essai + 1));
          continue;
        }
        throw new ErreurService(derniere, rep.status);
      }
      const json = (await rep.json()) as {
        choices?: { message?: { content?: string | null; tool_calls?: MessageLLM['tool_calls'] } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number; prompt_tokens_details?: { cached_tokens?: number } };
        error?: { message?: string };
      };
      const choix = json.choices?.[0]?.message;
      if (!choix) throw new ErreurService(json.error?.message ?? 'Le conteur n’a rien répondu.');
      const u = json.usage ?? {};
      const usage: UsageLLM = {
        entree: u.prompt_tokens ?? 0,
        cache: u.prompt_tokens_details?.cached_tokens ?? 0,
        sortie: u.completion_tokens ?? 0,
        cout: u.cost ?? 0,
      };
      return { message: { role: 'assistant', content: choix.content ?? null, tool_calls: choix.tool_calls }, usage };
    }
    throw new ErreurService(derniere || 'Le service du conteur ne répond pas.');
  };
}
