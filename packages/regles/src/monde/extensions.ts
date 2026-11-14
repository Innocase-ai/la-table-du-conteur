// Les dossiers d'extension d'un monde (`dilemmes/`, `savoirs/`, `scenes/`…) : ceux que le format de base ne connaît pas et que
// chaque module du moteur valide. Ce fichier dit lesquels existent et donne leur schéma, pour que le chargement (`assemblage.ts`)
// puisse les vérifier tout de suite, sans attendre `pnpm monde valider`. Les schémas viennent de `schemas-par-dossier.ts` (ceux
// que l'atelier édite) plus celui des scènes, que l'atelier n'édite pas.
import type { ZodTypeAny } from 'zod';
import { SceneNarree } from './scenes-donnees';
import { schemaDuDossier } from './schemas-par-dossier';

export const DOSSIERS_EXTENSIONS = ['dilemmes', 'evenements-choix', 'examens', 'codex', 'interjections', 'savoirs', 'scenes'] as const;

/** Le schéma d'un dossier d'extension, ou `undefined` si ce n'en est pas un. */
export function schemaExtension(dossier: string): ZodTypeAny | undefined {
  if (!(DOSSIERS_EXTENSIONS as readonly string[]).includes(dossier)) return undefined;
  return dossier === 'scenes' ? SceneNarree : schemaDuDossier(dossier);
}
