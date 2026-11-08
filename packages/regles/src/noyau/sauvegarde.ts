// Sauvegarde d'une longue campagne : le journal des événements grossit à chaque action, mais le jeu n'en relit que la fin
// (derniers échanges du conteur, derniers événements, comparaisons d'indices). On le borne donc à l'écriture.
import type { EvenementJeu, Partie } from './types';

/** Nombre d'événements gardés dans une sauvegarde normale. */
export const JOURNAL_MAX = 600;

/** Une copie de la partie dont le journal est réduit à ses `max` derniers événements (la partie en cours n'est pas modifiée). */
export function partieBornee(p: Partie, max = JOURNAL_MAX): Partie {
  if (p.journal.length <= max) return p;
  const journal: EvenementJeu[] = p.journal.slice(-Math.max(1, max));
  return { ...p, journal };
}

/**
 * Sérialise une partie pour le stockage. Si `ecrire` échoue (quota du navigateur plein), on réessaie avec un journal de plus en plus court.
 * Renvoie `true` si une sauvegarde a pu être écrite.
 */
export function sauvegarderPartie(p: Partie, ecrire: (json: string) => void): boolean {
  for (const max of [JOURNAL_MAX, 200, 50, 1]) {
    try {
      ecrire(JSON.stringify(partieBornee(p, max)));
      return true;
    } catch {
      // Stockage plein ou indisponible : on réduit le journal et on réessaie.
    }
  }
  return false;
}
