// Les cris de combat (packages/donnees/repliques/cris.json) et les voix par race et par genre (voix.json), chargés avec
// le jeu. Un portrait dont la race n'a pas de voix se tait. Les fichiers sont validés par `repliques.test.ts`.
import cris from '../../../packages/donnees/repliques/cris.json';
import voix from '../../../packages/donnees/repliques/voix.json';
import { FichierCris, FichierVoix, type Repliques } from './repliques-regles';

/** Les fichiers tels quels : pour les tests (un fichier invalide ne doit pas se taire en silence). */
export const FICHIER_CRIS: unknown = cris;
export const FICHIER_VOIX: unknown = voix;

const c = FichierCris.safeParse(cris);
const v = FichierVoix.safeParse(voix);

export const REPLIQUES: Repliques | undefined = c.success && v.success ? { situations: c.data.situations, voix: v.data } : undefined;
