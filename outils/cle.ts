// La clé d'API et les montants des garde-fous de dépense, lus de la même façon par tous les outils et par le relais du
// conteur. Règle unique : **le fichier `.env` du projet gagne** sur les variables du shell, pour qu'une variable
// `OPENROUTER_API_KEY` laissée par un autre projet ne fasse jamais payer le mauvais compte (erreur « User not found »,
// ou pire : une autre clé valide facturée sans rien dire).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const CLE_OPENROUTER = 'OPENROUTER_API_KEY';

export type Env = Record<string, string | undefined>;

/** Les variables d'un fichier `.env` (lignes `NOM=valeur`, guillemets retirés, commentaires et lignes vides ignorés). */
export function lireFichierEnv(fichier: string): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!existsSync(fichier)) return vars;
  for (const ligne of readFileSync(fichier, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(ligne);
    if (m && m[2]) vars[m[1]!] = m[2].replace(/^["']|["']$/g, '');
  }
  return vars;
}

/** Les variables du projet : celles du shell, puis celles du `.env` de `racine`, qui les remplacent. */
export function variablesProjet(racine: string, shell: Env = process.env): Env {
  return { ...shell, ...lireFichierEnv(join(racine, '.env')) };
}

/** La clé OpenRouter du projet (`.env` d'abord, puis le shell), ou `undefined`. */
export function cleOpenRouter(racine: string, shell: Env = process.env): string | undefined {
  return variablesProjet(racine, shell)[CLE_OPENROUTER] || undefined;
}

/** Les quatre derniers caractères d'une clé, à afficher avant un appel payant pour savoir quel compte paie. */
export function empreinte(cle: string): string {
  return `…${cle.slice(-4)}`;
}

/**
 * Un montant en dollars saisi par l'utilisateur (option `--plafond`, variable `CONTEUR_PLAFOND_USD`). La virgule est
 * acceptée (« 0,10 »). Une valeur invalide est une erreur : un garde-fou de dépense ne doit jamais sauter en silence
 * (`Number('0,10')` vaut `NaN`, et `x > NaN` est toujours faux).
 */
export function lireMontant(texte: string | undefined, defaut: number): number {
  if (texte === undefined || texte.trim() === '') return defaut;
  const n = Number(texte.trim().replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) throw new Error(`Montant invalide : « ${texte} » (un nombre de dollars, par exemple 0.10).`);
  return n;
}
