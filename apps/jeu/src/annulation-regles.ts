// Annuler le dernier pas hors combat : le client garde la partie d'avant une action sûre (un déplacement, un achat, une vente) et
// la rend si le joueur se ravise tout de suite. « Sûre » veut dire : aucun dé lancé (sinon annuler permettrait de retirer un
// résultat), aucune rencontre, scène, événement ou quête déclenchés, aucun héros touché. Sans React : testé dans
// `annulation-regles.test.ts`.
import type { EvenementJeu, Ordre, Partie } from '@crpg/regles';

/** Les seules commandes qu'on peut défaire : un pas, un achat, une vente. */
export const ORDRES_ANNULABLES: readonly string[] = ['aller', 'acheter', 'vendre'];

/** Les états de modules qui ouvrent un écran ou une file à lire : si l'un d'eux bouge, le pas ne se défait plus. */
const MODULES_A_ECRAN = ['scenes', 'evenementsChoix', 'dilemmes', 'examens', 'progression'] as const;

/** Les événements qui montrent qu'il s'est passé autre chose qu'un simple pas. */
const EVENEMENTS_BLOQUANTS: readonly EvenementJeu['type'][] = ['jet', 'tirageArrivee', 'sceneChange', 'fin', 'queteMiseAJour', 'pvChange', 'ressourceChange', 'jourSuivant'];

/** Le pas qu'on pourrait défaire : la partie d'avant, celle d'après (pour reconnaître que rien n'a bougé depuis), et ce qu'on a fait. */
export interface PasAnnulable {
  avant: Partie;
  apres: Partie;
  ordre: Ordre;
}

const json = (x: unknown): string => JSON.stringify(x);

/**
 * Pourquoi ce pas ne peut pas être annulé (une phrase), ou rien s'il le peut. Les raisons servent aux tests et à l'infobulle de
 * l'écran quand elle explique son absence.
 */
export function refusAnnulation(avant: Partie, apres: Partie, ordre: Ordre, evenements: EvenementJeu[]): string | undefined {
  if (!ORDRES_ANNULABLES.includes(ordre.type)) return 'Seuls un déplacement, un achat ou une vente se défont.';
  // Le hasard vit dans la partie : une graine qui a bougé, c'est un dé lancé (tirage d'arrivée, jet, trouvaille…).
  if (avant.graine !== apres.graine) return 'Un dé a été lancé : le résultat ne se rejoue pas.';
  if (evenements.some((e) => EVENEMENTS_BLOQUANTS.includes(e.type))) return 'Cette action a déclenché autre chose qu’un simple pas.';
  if (apres.scene.type === 'rencontre' || apres.scene.type === 'fin' || apres.combatEnCours || apres.etat.fin) return 'Une rencontre ou la fin de l’histoire attend.';
  if (apres.etat.rencontresEnAttente?.length) return 'Une rencontre se prépare.';
  if (MODULES_A_ECRAN.some((m) => json(avant.modules[m]) !== json(apres.modules[m]))) return 'Un écran du récit s’est ouvert.';
  // Un héros touché (soins, dégâts, montée de niveau en attente) : rien de tout cela ne se défait.
  if (json(avant.groupe) !== json(apres.groupe)) return 'Le groupe a changé.';
  return undefined;
}

/** Garde le pas qu'on vient de jouer s'il est annulable ; rien sinon (et alors l'ancien pas gardé ne vaut plus). */
export function pasAnnulable(avant: Partie, ordre: Ordre, resultat: { partie: Partie; evenements: EvenementJeu[] }): PasAnnulable | undefined {
  return refusAnnulation(avant, resultat.partie, ordre, resultat.evenements) ? undefined : { avant, apres: resultat.partie, ordre };
}

/**
 * Le bouton « ↶ Annuler » ne s'offre que tant que la partie affichée est exactement celle d'après le pas : la moindre autre action
 * (une réplique, un tour du conteur, une autre commande) change la partie et le pas gardé ne vaut plus.
 */
export function annulationPossible(pas: PasAnnulable | undefined, courante: Partie): pas is PasAnnulable {
  return !!pas && pas.apres === courante && !courante.combatEnCours && courante.scene.type !== 'rencontre' && courante.scene.type !== 'fin';
}

/** Ce que le bouton annule, en clair : « l’arrivée à La halle », « l’achat de Corde », « la vente ». */
export function libelleAnnulation(pas: PasAnnulable, noms: { lieu: (id: string) => string; objet: (id: string) => string }): string {
  const o = pas.ordre as Record<string, unknown>;
  if (pas.ordre.type === 'aller') return `l’arrivée à ${noms.lieu(String(o['vers'] ?? ''))}`;
  if (pas.ordre.type === 'acheter') return `l’achat de ${noms.objet(String(o['objet'] ?? ''))}`;
  return `la vente de ${noms.objet(String(o['objet'] ?? ''))}`;
}
