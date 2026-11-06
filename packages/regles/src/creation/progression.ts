// Montée de niveau : les choix du joueur sont gardés tels quels ; seuls les choix nouveaux du niveau atteint (amélioration
// de caractéristique, sorts en plus, options de classe, bottes, expertises, style de combat) sont complétés par les
// recommandations, comme le bouton « Recommandé » de la création.
import type { Donnees } from '../donnees';
import { calculerFiche, NIVEAU_MAX, type ChoixPersonnage, type Fiche } from '../fiche';
import { recommanderCaracteristiques, recommanderCompetences } from './recommandations';

/** Ajoute à `garde` les éléments de `propose` qui n'y sont pas encore, jusqu'à `n` éléments au total. */
function completer<T>(garde: T[] | undefined, propose: T[] | undefined, n: number): T[] {
  const res = [...(garde ?? [])];
  for (const x of propose ?? []) {
    if (res.length >= n) break;
    if (!res.includes(x)) res.push(x);
  }
  return res;
}

/**
 * Les choix d'un personnage passé au niveau `niveau` (au plus NIVEAU_MAX), avec sa nouvelle fiche ; `undefined` si les
 * choix complétés ne donnent pas une fiche valide (le personnage reste alors à son niveau).
 */
export function monterAuNiveau(choix: ChoixPersonnage, niveau: number, donnees: Donnees): { choix: ChoixPersonnage; fiche: Fiche } | undefined {
  if (niveau <= choix.niveau || niveau > NIVEAU_MAX) return undefined;
  const base: ChoixPersonnage = { ...choix, niveau };
  const carac = recommanderCaracteristiques(base, donnees);
  const comp = recommanderCompetences(base, donnees);
  const prochain: ChoixPersonnage = {
    ...base,
    // Améliorations : celles déjà faites, puis les recommandées pour les nouveaux paliers (niveau 4).
    ameliorations: [...(choix.ameliorations ?? []), ...(carac.ameliorations ?? []).slice((choix.ameliorations ?? []).length)],
    expertises: completer(choix.expertises, comp.expertises, comp.expertises?.length ?? 0),
    competencesSupplementaires: completer(choix.competencesSupplementaires, comp.competencesSupplementaires, comp.competencesSupplementaires?.length ?? 0),
    dons: completer(choix.dons, comp.dons, comp.dons?.length ?? 0),
    bottes: completer(choix.bottes, comp.bottes, comp.bottes?.length ?? 0),
    sortsMineurs: completer(choix.sortsMineurs, comp.sortsMineurs, comp.sortsMineurs?.length ?? 0),
    sortsPrepares: completer(choix.sortsPrepares, comp.sortsPrepares, comp.sortsPrepares?.length ?? 0),
    choix: Object.fromEntries(
      Object.entries({ ...(comp.choix ?? {}), ...(choix.choix ?? {}) }).map(([id, ids]) => [id, completer(choix.choix?.[id], comp.choix?.[id], comp.choix?.[id]?.length ?? ids.length)]),
    ),
  };
  const r = calculerFiche(prochain, donnees);
  return r.ok ? { choix: prochain, fiche: r.fiche } : undefined;
}
