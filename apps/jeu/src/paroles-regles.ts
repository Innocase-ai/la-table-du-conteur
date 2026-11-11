// Les paroles dites à voix haute par les PNJ : la salutation propre d'un PNJ (neutre, amicale, hostile, ou variable selon ce que le groupe a
// fait) et, plus tard, ses réponses. Un fichier audio est rangé par voix (`voix/dialogues/<voix>/<clé>.mp3`, la voix étant celle du PNJ :
// la même que pour son ouverture de conversation, `voixDuPnj`) et par **clé du texte** : le jeu retrouve le fichier d'après le texte même que
// le moteur affiche. Un texte sans fichier reste lu à l'écran seulement. Fonctions pures, testées ; aucun accès au navigateur.
import { empreinteTexte } from './ouvertures-regles';

/** Le texte tel que le joueur le lit, sans espaces en trop (deux écritures du même texte donnent la même clé). */
export const texteDeParole = (texte: string): string => texte.replace(/\s+/g, ' ').trim();

/** La clé d'un texte : huit caractères hexadécimaux, stables (même texte, même clé). Un texte modifié a une autre clé : sa voix est à refaire. */
export function cleParole(texte: string): string {
  return empreinteTexte(texteDeParole(texte)).toString(16).padStart(8, '0');
}

/** Le chemin du fichier dans le jeu, relatif à `apps/jeu/src/voix/dialogues/` (`m-charon/3fa9c1d2`). */
export const cheminParole = (voix: string, texte: string): string => `${voix}/${cleParole(texte)}`;
