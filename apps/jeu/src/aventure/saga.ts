// La saga côté client (F5 d de docs/PRD-SAGA.md) : choisir l'épisode suivant, passer le bilan du précédent au moteur, lire le carnet.
// Le moteur fait le gros du travail (`bilanDeFin`, `entrerDansEpisode`) ; ici : la liste des suites proposées et le chargement du monde d'arrivée.
import { bilanDeFin, entrerDansEpisode, type Donnees, type EchoCarnet, type Partie } from '@crpg/regles';
import { chargerHistoire } from '../mondes';
import { creerMoteurHistoire, type Aventure } from './partie';

/** Le carnet de la saga tel que le joueur le lit : ce que les épisodes précédents ont laissé, puis ce que celui-ci laisse (ordre du carnet, sans doublon). */
export function carnetDeLaSaga(partie: Partie, aventure: Pick<Aventure, 'moteur'>): EchoCarnet[] {
  return bilanDeFin(partie, aventure.moteur.ctx).carnet;
}

/** Quitte l'épisode fini et entre dans `monde` avec le groupe : une nouvelle aventure (à sauvegarder par l'appelant) et ce que le joueur doit savoir de l'entrée. */
export async function continuerSaga(aventure: Aventure, monde: string, donnees: Donnees): Promise<{ aventure: Aventure; avis: string[] }> {
  const bilan = bilanDeFin(aventure.partie, aventure.moteur.ctx);
  const dm = await chargerHistoire(monde);
  const moteur = creerMoteurHistoire(dm, donnees);
  const { partie, avis } = entrerDansEpisode(moteur, bilan);
  return { aventure: { moteur, partie }, avis };
}
