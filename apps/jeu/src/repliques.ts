// Les répliques écrites pour chaque portrait (packages/donnees/repliques/<portrait>.json), chargées avec le jeu.
// Un portrait sans fichier se tait. Les fichiers sont validés par `repliques.test.ts`.
import { FichierRepliques } from './repliques-regles';

const fichiers = import.meta.glob<unknown>('../../../packages/donnees/repliques/*.json', { eager: true, import: 'default' });

export const REPLIQUES: ReadonlyMap<string, FichierRepliques> = new Map(
  Object.values(fichiers).flatMap((brut) => {
    const r = FichierRepliques.safeParse(brut);
    return r.success ? [[r.data.portrait, r.data] as const] : [];
  }),
);

/** Les fichiers tels quels, par chemin : pour les tests (un fichier invalide ne doit pas se taire en silence). */
export const FICHIERS_REPLIQUES = fichiers;
