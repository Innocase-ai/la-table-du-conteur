// Faveurs épiques (niveau 19, SRD 5.2.1) : chaque classe en reçoit une. Chaque faveur donne +1 à une caractéristique (max 30),
// parfois parmi quelques-unes seulement, et un pouvoir que la fiche affiche en texte (leurs effets en combat ne sont pas joués).
import { CARACTERISTIQUES, type Caracteristique } from '../schemas';

/** Plafond d'une caractéristique relevée par une faveur épique. */
export const VALEUR_MAX_FAVEUR = 30;

/** La faveur que le SRD recommande à chaque classe. */
export const FAVEUR_RECOMMANDEE: Record<string, string> = {
  barbare: 'faveur-d-attaque-irresistible',
  barde: 'faveur-de-memoire-magique',
  clerc: 'faveur-du-destin',
  druide: 'faveur-de-deplacement-dimensionnel',
  ensorceleur: 'faveur-de-deplacement-dimensionnel',
  guerrier: 'faveur-de-prouesse-martiale',
  magicien: 'faveur-de-memoire-magique',
  moine: 'faveur-d-attaque-irresistible',
  occultiste: 'faveur-du-destin',
  paladin: 'faveur-de-vision-lucide',
  rodeur: 'faveur-de-deplacement-dimensionnel',
  roublard: 'faveur-de-l-esprit-nocturne',
};

/** Les caractéristiques qu'une faveur peut relever : « Force ou Dextérité », « Intelligence, Sagesse ou Charisme », sinon toutes. */
export function caracteristiquesDeFaveur(faveurId: string): Caracteristique[] {
  if (faveurId === 'faveur-d-attaque-irresistible') return ['for', 'dex'];
  if (faveurId === 'faveur-de-memoire-magique') return ['int', 'sag', 'cha'];
  return [...CARACTERISTIQUES];
}
