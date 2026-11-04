// Règles du relais du conteur (`serveur-conteur.ts`), sans réseau, pour pouvoir les tester. Le relais tourne sur la machine
// du développeur avec la vraie clé : il ne doit accepter que les requêtes du jeu lui-même, et ses bornes de dépense ne
// doivent jamais sauter en silence.

/** Plafond de dépense du relais par défaut, en dollars, quand `CONTEUR_PLAFOND_USD` est absent ou invalide. */
export const PLAFOND_PAR_DEFAUT = 0.5;
/** Longueur de réponse par défaut et maximale demandée au modèle, en tokens. */
export const MAX_TOKENS_PAR_DEFAUT = 700;
export const MAX_TOKENS_PLAFOND = 1500;

/**
 * La requête vient-elle du jeu ? Sans en-tête `Origin` (outil en ligne de commande, requête de même origine sans en-tête),
 * oui ; sinon seulement depuis la machine elle-même (`localhost`, `127.0.0.1`, `[::1]`, n'importe quel port) ou depuis
 * l'application de bureau (`tauri://localhost`, `http(s)://tauri.localhost`). Une page web ouverte dans le navigateur
 * enverrait son propre domaine : elle est refusée, et ne peut donc pas dépenser la clé du développeur.
 */
export function origineAutorisee(origine: string | undefined): boolean {
  if (origine === undefined || origine === '') return true;
  let url: URL;
  try {
    url = new URL(origine);
  } catch {
    return false;
  }
  if (url.protocol === 'tauri:') return url.hostname === 'localhost';
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  return ['localhost', '127.0.0.1', '[::1]', 'tauri.localhost'].includes(url.hostname);
}

/**
 * Le corps doit être déclaré en JSON. Une page web peut envoyer du texte brut sans autorisation préalable du navigateur
 * (requête « simple ») ; exiger `application/json` l'oblige à demander cette autorisation, que le relais ne donne pas.
 */
export function corpsJson(typeContenu: string | undefined): boolean {
  return !!typeContenu && /^application\/json\b/i.test(typeContenu.trim());
}

/** La longueur de réponse demandée, toujours bornée : une valeur invalide (`"abc"`, `{}`) prend la valeur par défaut. */
export function bornerMaxTokens(valeur: unknown): number {
  const n = typeof valeur === 'number' ? valeur : typeof valeur === 'string' && valeur.trim() !== '' ? Number(valeur) : Number.NaN;
  if (!Number.isFinite(n) || n <= 0) return MAX_TOKENS_PAR_DEFAUT;
  return Math.min(Math.floor(n), MAX_TOKENS_PLAFOND);
}

/** Le plafond de dépense lu dans l'environnement (virgule acceptée) ; une valeur invalide prend le plafond par défaut. */
export function lirePlafond(texte: string | undefined): { plafond: number; invalide: boolean } {
  if (texte === undefined || texte.trim() === '') return { plafond: PLAFOND_PAR_DEFAUT, invalide: false };
  const n = Number(texte.trim().replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? { plafond: n, invalide: false } : { plafond: PLAFOND_PAR_DEFAUT, invalide: true };
}
