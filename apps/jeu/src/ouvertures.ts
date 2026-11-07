// Les ouvertures de conversation des PNJ (packages/donnees/repliques/ouvertures.json), chargées avec le jeu. Un fichier
// invalide ne casse pas le jeu : les PNJ ouvrent alors sans phrase d'accroche.
import ouvertures from '../../../packages/donnees/repliques/ouvertures.json';
import { FichierOuvertures } from './ouvertures-regles';

const lu = FichierOuvertures.safeParse(ouvertures);

export const OUVERTURES: FichierOuvertures | undefined = lu.success ? lu.data : undefined;
