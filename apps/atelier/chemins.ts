// Gardes du serveur de l'atelier : quels mondes et quels fichiers le navigateur a le droit de demander. Fonctions pures,
// testées dans chemins.test.ts. Rien n'est lu ni écrit hors de la racine des mondes (packages/mondes), jamais par `..`.
import { isAbsolute, relative, resolve } from 'node:path';

export const PORT_ATELIER = 5180;

/** Un identifiant de monde : kebab-case ASCII, comme les dossiers de packages/mondes. */
export const idMondeValide = (id: unknown): id is string => typeof id === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(id);

/** Un fichier de données d'un monde : `monde.json`, `canon.json`, ou `<dossier>/<fichier>.json` (un seul niveau). */
export const cheminFichierValide = (chemin: unknown): chemin is string =>
  typeof chemin === 'string' && (/^(?:monde|canon)\.json$/.test(chemin) || /^[a-z0-9][a-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(chemin));

/** Les dossiers de médias d'un monde (images, voix) : ce ne sont pas des données de jeu et l'atelier n'y touche pas. */
export const DOSSIERS_IGNORES = ['images', 'voix'];

/**
 * Le chemin absolu d'un monde ou d'un de ses fichiers, ou `null` s'il sort de la racine (id ou chemin invalides, `..`,
 * chemin absolu, lecteur Windows).
 */
export function resoudre(racine: string, id: string, chemin?: string): string | null {
  if (!idMondeValide(id)) return null;
  if (chemin !== undefined && (!cheminFichierValide(chemin) || chemin.includes('..') || isAbsolute(chemin))) return null;
  const base = resolve(racine);
  const cible = resolve(base, id, ...(chemin ? chemin.split('/') : []));
  const rel = relative(base, cible);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) return null;
  return cible;
}

/** Seules les pages de l'atelier lui-même (ou une requête sans origine, du même site) peuvent lire les mondes. */
export function origineAutorisee(origine: string | undefined): boolean {
  if (origine === undefined) return true;
  return new RegExp(`^http://(localhost|127\\.0\\.0\\.1):${PORT_ATELIER}$`).test(origine);
}

/** Le corps de la requête doit être du JSON (pas un formulaire envoyé depuis une autre page). */
export const corpsJson = (typeContenu: string | undefined): boolean => /^application\/json(;|$)/i.test(typeContenu ?? '');
