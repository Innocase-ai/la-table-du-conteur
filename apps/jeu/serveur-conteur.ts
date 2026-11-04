// Le relais du conteur pour le serveur de développement : le navigateur parle à `/api/conteur/chat`, ce relais ajoute la
// clé OpenRouter lue dans `.env` (jamais envoyée au navigateur) et transmet la requête. Il n'accepte que le modèle du
// conteur, borne la taille de la requête et coupe quand la dépense de la session dépasse un plafond. Avec la clé du joueur
// (application de bureau), le client appelle OpenRouter directement et ce relais n'existe pas.
// Garde-fous (règles et tests dans `relais.ts`) : seules les requêtes du jeu lui-même sont acceptées (une page web ouverte
// dans le navigateur ne peut pas dépenser la clé), le corps doit être du JSON, la longueur de réponse et le plafond de
// dépense ne sautent jamais sur une valeur invalide, et une seule requête passe à la fois (pas de dépassement du plafond
// par des requêtes simultanées). La clé est celle du `.env` du projet, même si le shell en a une autre (`outils/cle.ts`).
import type { IncomingMessage, ServerResponse } from 'node:http';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { cleOpenRouter, variablesProjet } from '../../outils/cle';
import { bornerMaxTokens, corpsJson, lirePlafond, origineAutorisee } from './relais';

const URL_OPENROUTER = 'https://openrouter.ai/api/v1/chat/completions';
const MODELES_PERMIS = ['anthropic/claude-haiku-5.5'];
const TAILLE_MAX = 2_000_000;

function repondre(res: ServerResponse, statut: number, corps: unknown): void {
  res.statusCode = statut;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(corps));
}

function lireCorps(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let texte = '';
    req.on('data', (c: Buffer) => {
      texte += c.toString('utf8');
      if (texte.length > TAILLE_MAX) {
        reject(new Error('Requête trop grande.'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(texte));
    req.on('error', reject);
  });
}

export function relaisConteur(dossierEnv: string): Plugin {
  let cle: string | undefined;
  let plafond = 0.5;
  let depense = 0;
  /** Une requête est en cours : les suivantes attendent leur tour (réponse 429), pour que le plafond tienne. */
  let enCours = false;
  return {
    name: 'relais-conteur',
    apply: 'serve',
    configResolved(config) {
      const racine = resolve(config.root, dossierEnv);
      cle = cleOpenRouter(racine);
      const lu = lirePlafond(variablesProjet(racine)['CONTEUR_PLAFOND_USD']);
      plafond = lu.plafond;
      if (lu.invalide) config.logger.warn(`CONTEUR_PLAFOND_USD invalide : plafond du conteur ramené à ${plafond} $.`);
    },
    configureServer(serveur) {
      serveur.middlewares.use('/api/conteur/etat', (_req, res) => repondre(res, 200, { disponible: !!cle, modele: MODELES_PERMIS[0], depense, plafond }));
      serveur.middlewares.use('/api/conteur/chat', async (req, res) => {
        if (req.method !== 'POST') return repondre(res, 405, { error: { message: 'POST seulement.' } });
        if (!origineAutorisee(req.headers.origin)) return repondre(res, 403, { error: { message: 'Origine refusée : le relais ne sert que le jeu.' } });
        if (!corpsJson(req.headers['content-type'])) return repondre(res, 415, { error: { message: 'Corps JSON attendu.' } });
        if (enCours) return repondre(res, 429, { error: { message: 'Une requête du conteur est déjà en cours.' } });
        if (!cle) return repondre(res, 503, { error: { message: 'Pas de clé du conteur sur ce serveur (variable OPENROUTER_API_KEY du fichier .env).' } });
        if (depense >= plafond)
          return repondre(res, 402, { error: { message: `Plafond de dépense du conteur atteint (${plafond} $ pour cette session du serveur).` } });
        enCours = true;
        try {
          const brut = JSON.parse(await lireCorps(req)) as Record<string, unknown>;
          if (!MODELES_PERMIS.includes(String(brut['model']))) return repondre(res, 400, { error: { message: 'Modèle non autorisé.' } });
          if (!Array.isArray(brut['messages']) || (brut['tools'] !== undefined && (!Array.isArray(brut['tools']) || brut['tools'].length > 40)))
            return repondre(res, 400, { error: { message: 'Requête invalide.' } });
          // Seuls les champs du conteur sont transmis, avec un plafond de longueur de réponse.
          const requete = {
            model: brut['model'],
            messages: brut['messages'],
            tools: brut['tools'],
            tool_choice: brut['tool_choice'],
            max_tokens: bornerMaxTokens(brut['max_tokens']),
            temperature: brut['temperature'],
            usage: { include: true },
          };
          const rep = await fetch(URL_OPENROUTER, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cle}` },
            body: JSON.stringify(requete),
          });
          const texte = await rep.text();
          try {
            depense += (JSON.parse(texte) as { usage?: { cost?: number } }).usage?.cost ?? 0;
          } catch {
            // réponse non JSON : rien à compter
          }
          res.statusCode = rep.status;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(texte);
        } catch (e) {
          repondre(res, 502, { error: { message: (e as Error).message } });
        } finally {
          enCours = false;
        }
      });
    },
  };
}
