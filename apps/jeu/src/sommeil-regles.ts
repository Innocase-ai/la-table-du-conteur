// L'écran de sommeil : quand le groupe dort une nuit (bouton « Dormir », chambre payée à un aubergiste, ou à la demande du
// conteur), une illustration plein écran (chambre ou camp) et une horloge qui avance d'une heure par seconde. Tout est pur :
// le moteur a déjà tout réglé (récupération, nouveau jour) ; ces règles disent seulement quoi montrer.
import type { EvenementJeu } from '@crpg/regles';

/** Une heure de sommeil dure une seconde à l'écran. */
export const MS_PAR_HEURE = 1000;

export type DecorSommeil = 'chambre' | 'camp';

/** Les types de lieux où l'on dort sous un toit (auberge, maison, monastère…) ; ailleurs, on campe autour d'un feu. */
const SOUS_UN_TOIT = new Set(['batiment', 'salle', 'village', 'ville', 'quartier', 'hameau']);

/** Le décor de la nuit : une chambre si elle est payée à un aubergiste ou si le lieu est un bâtiment habité, sinon un camp. */
export function decorSommeil(typeLieu: string | undefined, nuitPayee: boolean): DecorSommeil {
  return nuitPayee || (typeLieu !== undefined && SOUS_UN_TOIT.has(typeLieu)) ? 'chambre' : 'camp';
}

/** Le texte que le moteur écrit après une nuit entière (`seReposer`, repos long). */
const NUIT_ENTIERE = /^Le groupe se repose une nuit entière/;
/** Le texte d'un service payé (`payerService`) : une chambre payée précède la nuit dans la même commande. */
const SERVICE_PAYE = / payés à /;

/** Une nuit vient-elle d'être dormie dans ces nouvelles entrées du journal ? Et était-elle payée (chambre) ? */
export function detecterSommeil(nouvelles: readonly EvenementJeu[]): { nuitPayee: boolean } | undefined {
  const constats = nouvelles.flatMap((e) => (e.type === 'constat' ? [e.texte] : []));
  if (!constats.some((t) => NUIT_ENTIERE.test(t))) return undefined;
  return { nuitPayee: constats.some((t) => SERVICE_PAYE.test(t)) };
}

/**
 * Le nombre d'heures dormies, d'après le jour et l'heure avant et après (au moins une), toujours entier : le temps du moteur
 * avance parfois par fractions d'heure (8,1 h), l'écran ne compte que des heures pleines.
 */
export function heuresDormies(avant: { jour: number; heure: number }, apres: { jour: number; heure: number }): number {
  return Math.max(1, Math.round((apres.jour - avant.jour) * 24 + (apres.heure - avant.heure)));
}

/** L'heure qu'affiche le cadran après `ecoulees` heures de sommeil commencé à `debut` heures : « 23 h », « minuit », « 1 h »… */
export function heureDuCadran(debut: number, ecoulees: number): string {
  const h = (((Math.floor(debut) + ecoulees) % 24) + 24) % 24;
  return h === 0 ? 'minuit' : h === 12 ? 'midi' : `${h} h`;
}

/**
 * L'heure (comptée depuis le coucher) où une rencontre tire le groupe du sommeil : quelque part au milieu de la nuit, jamais
 * à la toute première ni à la dernière heure. `hasard` est dans [0, 1[.
 */
export function heureDuReveilBrutal(heures: number, hasard: number): number {
  if (heures <= 2) return 1;
  return Math.min(heures - 1, Math.max(1, Math.floor(heures * (0.3 + 0.4 * hasard))));
}

/** L'obscurité de l'image (0 : pleine lumière, 1 : noir) : la nuit est sombre, l'aube éclaircit les deux dernières heures. */
export function obscurite(ecoulees: number, heures: number): number {
  const restant = heures - ecoulees;
  if (restant <= 0) return 0.1;
  if (restant <= 2) return 0.1 + 0.25 * (restant / 2);
  return 0.55;
}
