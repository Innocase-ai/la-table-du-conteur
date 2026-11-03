// Le conteur côté client : savoir s'il est disponible (le serveur du jeu a-t-il une clé ?), et l'appeler. La clé n'est
// jamais dans le navigateur : les requêtes passent par le relais du serveur (`serveur-conteur.ts`).
import { creerLLM, type LLM } from '@crpg/regles';

export interface EtatConteur {
  disponible: boolean;
  modele?: string;
  /** Dépense déjà faite et plafond du relais, en dollars. */
  depense?: number;
  plafond?: number;
}

/** Interroge le relais ; sans relais (jeu publié sans serveur) ou sans clé, le conteur est simplement absent. */
export async function etatConteur(): Promise<EtatConteur> {
  try {
    const rep = await fetch('/api/conteur/etat');
    if (!rep.ok || !(rep.headers.get('content-type') ?? '').includes('json')) return { disponible: false };
    return (await rep.json()) as EtatConteur;
  } catch {
    return { disponible: false };
  }
}

export const llmDuJeu = (signal?: AbortSignal): LLM => creerLLM({ url: '/api/conteur/chat', signal });
