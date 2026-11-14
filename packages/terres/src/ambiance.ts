// Les phrases de présence : ce qui donne l'impression de traverser un pays et pas une grille. Quelques réserves courtes, tirées
// sans toucher au hasard du voyage (le texte ne doit jamais changer le déroulé des rencontres). Le moteur de jeu peut les
// remplacer par celles de l'auteur, région par région.
import { hash2 } from './rng';
import type { Moment, Terrain } from './types';

const TERRAIN: Record<Terrain | 'route', string[]> = {
  route: ['La route tient bon sous les bottes, creusée d’ornières anciennes.', 'Le chemin serpente, battu par des générations de charrettes.', 'Sous vos pas, la terre du chemin est dure et grise.'],
  plaine: ['L’herbe haute ploie sous le vent, à perte de vue.', 'Le ciel s’ouvre : plus un arbre, seulement l’herbe qui ondule.', 'Des sauterelles fusent devant vous à chaque pas.'],
  foret: ['Les arbres se resserrent et la lumière tombe en taches.', 'L’air sent la mousse et le bois mouillé ; on n’entend plus que les branches.', 'Sous les frondaisons, chaque craquement semble trop fort.'],
  colline: ['Le sol se soulève en croupes ; le vent forcit sur les crêtes.', 'Chaque colline cache la suivante.', 'La pente tire sur les mollets, mais la vue s’élargit.'],
  montagne: ['La pierre remplace la terre ; l’air devient mince et froid.', 'Les éboulis roulent sous les semelles.', 'Au-dessus, la roche nue ; en dessous, tout un pays qui rapetisse.'],
  marais: ['La terre devient spongieuse et l’eau suinte à chaque pas.', 'Des roseaux, de la brume, et un silence de mauvais augure.', 'La boue colle aux bottes ; quelque chose clapote au loin.'],
  eau: ['L’eau barre le passage.'],
  gue: ['L’eau vous monte aux chevilles : le gué est là, glissant mais franchissable.', 'Le courant tire sur les jambes ; il faut garder les pieds sur les pierres plates.'],
};

const MOMENT: Record<Moment, string[]> = {
  aube: ['Le ciel pâlit à l’est ; les premiers oiseaux s’éveillent.', 'Une brume basse monte du sol avec le jour.'],
  jour: ['Le soleil est haut : plus rien ne se cache.', 'La journée s’installe, claire et sans nuages.'],
  crepuscule: ['Le jour décline ; les ombres s’allongent devant vous.', 'Le ciel rougit. Il faudra bientôt penser à un abri.'],
  nuit: ['La nuit est tombée. Le monde se réduit à quelques pas.', 'Les étoiles sortent, et avec elles tous les bruits qu’on ne voyait pas.'],
};

const SIGNES = ['Des traces fraîches coupent la piste.', 'Un cri lointain, que le vent emporte.', 'Les oiseaux se taisent d’un coup.', 'Des cendres encore tièdes, au bord du chemin.', 'Quelqu’un est passé ici il n’y a pas longtemps.'];

const choisir = (liste: readonly string[], h: number): string => liste[Math.min(liste.length - 1, Math.floor(h * liste.length))]!;

export const phraseTerrain = (terrain: Terrain | 'route', graine: number, n: number): string => choisir(TERRAIN[terrain], hash2(graine + 11, n, 1));
export const phraseMoment = (m: Moment, graine: number, n: number): string => choisir(MOMENT[m], hash2(graine + 12, n, 2));
export const phraseSigne = (graine: number, n: number): string => choisir(SIGNES, hash2(graine + 13, n, 3));

/** « au nord-est », « à l’ouest »… d'après un déplacement (y vers le bas). */
export function direction(dx: number, dy: number): string {
  const a = Math.atan2(-dy, dx) * (180 / Math.PI); // 0 = est, 90 = nord
  const noms = ['à l’est', 'au nord-est', 'au nord', 'au nord-ouest', 'à l’ouest', 'au sud-ouest', 'au sud', 'au sud-est'];
  return noms[(Math.round(a / 45) + 8) % 8]!;
}
