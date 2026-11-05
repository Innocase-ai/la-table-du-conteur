// Un tour du conteur : le joueur écrit, le conteur appelle les outils (les commandes du moteur), le moteur vérifie et
// exécute, le conteur raconte. Tout ce qui change dans la partie passe par `moteur.executer`, donc par les règles ; le
// récit et la saisie sont consignés au journal comme n'importe quel événement.
import type { Moteur } from '../noyau/moteur';
import type { Partie } from '../noyau/types';
import { evenementsEnTexte, ficheDeTour, promptSysteme } from './contexte';
import { outilsDuConteur, PROPOSER_ACTIONS, type OutilLLM } from './outils';

export interface AppelOutil {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export type ContenuMessage = string | { type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }[] | null;

export interface MessageLLM {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: ContenuMessage;
  tool_calls?: AppelOutil[];
  tool_call_id?: string;
}

/** Ce qu'un appel a consommé : tokens d'entrée (dont ceux relus du cache), tokens produits, et son coût en dollars. */
export interface UsageLLM {
  entree: number;
  cache: number;
  sortie: number;
  cout: number;
}

export type LLM = (requete: { messages: MessageLLM[]; tools: OutilLLM[] }) => Promise<{ message: MessageLLM; usage: UsageLLM }>;

/** Un échange gardé en mémoire d'un tour à l'autre : ce que le joueur a écrit et ce que le conteur a raconté. */
export interface Echange {
  role: 'user' | 'assistant';
  content: string;
}

export interface ParamsTour {
  moteur: Moteur;
  partie: Partie;
  texte: string;
  /** La bible du monde (`BIBLE.md`), réservée au conteur. */
  bible: string;
  llm: LLM;
  memoire?: Echange[];
  /** Appels du modèle au plus pour un tour (outils compris). */
  maxAppels?: number;
  /** Échanges gardés en mémoire (les plus récents). */
  memoireMax?: number;
  /** Prévenu à chaque outil exécuté (pour l'afficher pendant que le conteur travaille). */
  surOutil?: (o: { nom: string; args: unknown; refus?: string }) => void;
}

export interface ResultatTour {
  partie: Partie;
  recit: string;
  actions: string[];
  memoire: Echange[];
  appels: number;
  usage: UsageLLM;
  outils: { nom: string; args: unknown; refus?: string }[];
  /** Le tour n'a pas pu aller au bout (clé refusée, service injoignable…) : le message pour le joueur. */
  erreur?: string;
}

/** Les mots des coulisses, interdits dans le récit (voir la règle 9 du prompt). */
export const MACHINE = /\bmoteur\b|\barbitre\b|\bl['’]outil\b|\bsyst[èe]me de jeu\b|\br[èe]gles? du jeu\b|\bLLM\b|\bl['’]IA\b|\brefus(e|é|és)? (du|par le) (jeu|moteur)\b/i;

const vide = (): UsageLLM => ({ entree: 0, cache: 0, sortie: 0, cout: 0 });
const texteDe = (m: MessageLLM) => (typeof m.content === 'string' ? m.content : (m.content ?? []).map((c) => c.text).join('')).trim();

export async function jouerTour(p: ParamsTour): Promise<ResultatTour> {
  const { moteur, texte, llm } = p;
  const maxAppels = p.maxAppels ?? 6;
  const tools = outilsDuConteur(moteur);
  const noms = new Set(tools.map((t) => t.function.name));
  const resultat: ResultatTour = { partie: p.partie, recit: '', actions: [], memoire: p.memoire ?? [], appels: 0, usage: vide(), outils: [] };

  // Le joueur a écrit : c'est un événement de la partie.
  const saisie = moteur.executer(p.partie, { type: 'saisie', texte });
  if (saisie.refus) return { ...resultat, erreur: saisie.refus };
  let partie = saisie.partie;
  let modifiee = false; // un outil a changé la partie : en cas d'erreur du service, on la garde

  const messages: MessageLLM[] = [
    { role: 'system', content: [{ type: 'text', text: promptSysteme(moteur.ctx.dm, p.bible), cache_control: { type: 'ephemeral' } }] },
    ...(p.memoire ?? []).map((m): MessageLLM => ({ role: m.role, content: m.content })),
    { role: 'user', content: `${ficheDeTour(moteur, partie)}\n\n## Le joueur écrit\n${texte}` },
  ];

  let recit = '';
  try {
    for (let i = 0; i < maxAppels; i++) {
      const { message, usage } = await llm({ messages, tools });
      resultat.appels++;
      resultat.usage = {
        entree: resultat.usage.entree + usage.entree,
        cache: resultat.usage.cache + usage.cache,
        sortie: resultat.usage.sortie + usage.sortie,
        cout: resultat.usage.cout + usage.cout,
      };
      const dit = texteDe(message);
      if (dit) recit = dit;
      messages.push({ role: 'assistant', content: message.content, tool_calls: message.tool_calls?.length ? message.tool_calls : undefined });
      if (!message.tool_calls?.length) break;

      let fini = false;
      for (const appel of message.tool_calls) {
        const nom = appel.function.name;
        let args: unknown;
        try {
          args = appel.function.arguments ? JSON.parse(appel.function.arguments) : {};
        } catch {
          messages.push({ role: 'tool', tool_call_id: appel.id, content: "ERREUR : les arguments ne sont pas du JSON valide. Recommence l'appel." });
          continue;
        }
        if (nom === PROPOSER_ACTIONS) {
          const liste = (args as { actions?: unknown }).actions;
          resultat.actions = Array.isArray(liste)
            ? liste
                .filter((a): a is string => typeof a === 'string' && !!a.trim())
                .map((a) => a.trim())
                .slice(0, 4)
            : [];
          messages.push({ role: 'tool', tool_call_id: appel.id, content: 'Actions proposées au joueur.' });
          // Narration et actions dans le même message : le tour est fini, pas besoin d'un autre appel.
          if (recit) fini = true;
          continue;
        }
        if (!noms.has(nom)) {
          messages.push({ role: 'tool', tool_call_id: appel.id, content: `ERREUR : l'outil « ${nom} » n'existe pas.` });
          continue;
        }
        const res = moteur.executer(partie, { type: nom, ...(typeof args === 'object' && args !== null ? args : {}) });
        resultat.outils.push({ nom, args, refus: res.refus });
        p.surOutil?.({ nom, args, refus: res.refus });
        if (res.refus) messages.push({ role: 'tool', tool_call_id: appel.id, content: `IMPOSSIBLE POUR L'INSTANT : ${res.refus} (à raconter comme un fait du monde, sans parler de refus ni de règles)` });
        else {
          partie = res.partie;
          modifiee = true;
          messages.push({ role: 'tool', tool_call_id: appel.id, content: evenementsEnTexte(moteur.ctx.dm, res.evenements) });
        }
      }
      if (fini) break;
    }
  } catch (e) {
    // Rien n'a changé : le joueur peut réécrire. Sinon, on garde ce que les règles ont déjà appliqué.
    const erreur = (e as Error).message;
    return { ...resultat, partie: modifiee ? partie : p.partie, erreur };
  }

  // Garde-fou : un récit qui parle des coulisses (« le moteur refuse… ») est réécrit une fois, dans la fiction.
  if (recit && MACHINE.test(recit) && resultat.appels < maxAppels + 1) {
    try {
      messages.push({ role: 'user', content: "Ta narration parle des coulisses du jeu (« moteur », « règles », « refus »…). Réécris-la en une seule fois, sans ces mots : tout est un fait du monde, raconté de l'intérieur de l'histoire. Même longueur, mêmes événements." });
      const { message, usage } = await llm({ messages, tools });
      resultat.appels++;
      resultat.usage = {
        entree: resultat.usage.entree + usage.entree,
        cache: resultat.usage.cache + usage.cache,
        sortie: resultat.usage.sortie + usage.sortie,
        cout: resultat.usage.cout + usage.cout,
      };
      const propre = texteDe(message);
      if (propre && !MACHINE.test(propre)) recit = propre;
    } catch {
      // Le récit d'origine reste : mieux vaut un mot de trop qu'un tour perdu.
    }
  }

  if (!recit) recit = 'Le conteur reste un instant silencieux…';
  const racontee = moteur.executer(partie, { type: 'raconter', texte: recit });
  partie = racontee.refus ? partie : racontee.partie;
  const memoire = [...(p.memoire ?? []), { role: 'user' as const, content: texte }, { role: 'assistant' as const, content: recit }].slice(-(p.memoireMax ?? 8));
  return { ...resultat, partie, recit, memoire };
}
