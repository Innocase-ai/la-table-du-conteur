// Règles pures de l'écran « événement à choix » : ce qu'on affiche d'un choix, d'un jet, et quelle touche mène où.
// Sans React : testé à part.
import type { ChoixAffiche, Jet } from '@crpg/regles';
import { NOMS_CARAC, NOMS_COMPETENCES } from './createur/libelles';

/** Le nom lisible d'un test (« Médecine », « Force »). */
export function nomDuTest(test: string): string {
  if (test in NOMS_COMPETENCES) return NOMS_COMPETENCES[test as keyof typeof NOMS_COMPETENCES];
  if (test in NOMS_CARAC) return NOMS_CARAC[test as keyof typeof NOMS_CARAC];
  return test;
}

/** Ce que le joueur lit sur un choix incertain : « Médecine, DD 12 ». */
export const libelleJet = (jet: NonNullable<ChoixAffiche['jet']>): string => `${nomDuTest(jet.competence)}, DD ${jet.dd}`;

/** La ligne d'un jet dans le résultat : « Pip — Médecine : 14 contre DD 12, réussi ». */
export function ligneDeJet(j: Jet): string {
  return `${j.nom} — ${nomDuTest(j.test)} : ${j.total} contre DD ${j.dd}, ${j.reussite ? 'réussi' : 'raté'}`;
}

/** Ce que fait une touche : un chiffre choisit un choix (1 à 9) ou, juste après le dernier, « Partir » ; Échap, ou Entrée une fois le résultat lu, quitte. */
export type ActionTouche = { type: 'choix'; id: string } | { type: 'partir' } | undefined;

export function actionDeTouche(touche: string, choix: ChoixAffiche[], resultat: boolean): ActionTouche {
  if (touche === 'Escape') return { type: 'partir' };
  if (resultat) return touche === 'Enter' || touche === ' ' ? { type: 'partir' } : undefined;
  const n = Number(touche);
  if (!Number.isInteger(n) || n < 1) return undefined;
  if (n === choix.length + 1) return { type: 'partir' };
  const c = choix[n - 1];
  return c && !c.desactivee ? { type: 'choix', id: c.id } : undefined;
}
