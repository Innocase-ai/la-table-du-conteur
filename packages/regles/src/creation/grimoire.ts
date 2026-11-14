// Le grimoire du Magicien (SRD 5.2.1) : six sorts du 1er niveau au départ, deux de plus à chaque niveau gagné ; les sorts préparés
// se choisissent dans ce livre. Une partie ou un groupe créés avant le grimoire n'en ont pas : on leur inscrit leurs sorts
// préparés, complétés par les sorts conseillés jusqu'à la taille du livre (le héros ne perd rien).
import type { Donnees } from '../donnees';
import type { Personnage } from '../personnage';
import { recommanderCompetences } from './recommandations';
import { tailleGrimoire } from './regles-creation';

/** Le héros est-il d'une classe à grimoire, sans livre encore choisi ? */
export function grimoireManquant(h: Pick<Personnage, 'choix'>): boolean {
  return !!h.choix && tailleGrimoire(h.choix.classe, h.choix.niveau) !== undefined && !h.choix.sortsGrimoire;
}

/** Inscrit le grimoire d'un héros qui n'en a pas (voir plus haut) ; renvoie vrai si le héros a changé. */
export function inscrireGrimoireManquant(h: Personnage, donnees: Donnees): boolean {
  if (!grimoireManquant(h)) return false;
  const livre = recommanderCompetences({ ...h.choix!, niveau: h.choix!.niveau }, donnees).sortsGrimoire;
  if (!livre?.length) return false;
  h.choix = { ...h.choix!, sortsGrimoire: livre };
  h.fiche = { ...h.fiche, grimoire: livre };
  return true;
}
