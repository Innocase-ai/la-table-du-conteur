// Le simulateur de parcours dans un Web Worker : il joue le moteur pendant des secondes, la page reste fluide.
// Pour l'arrêter, la page termine le worker (le calcul est synchrone et ne lit pas ses messages en route).
import { assemblerMonde, explorerParcours, type OptionsParcours, type RapportExploration } from '@crpg/regles';
import { chargerDonnees } from './donnees';

export type EntreeSimulateur = { monde: unknown; fichiers: { chemin: string; contenu: unknown }[]; options: Pick<OptionsParcours, 'graines' | 'budgetEtats' | 'budgetMs' | 'couvrir'> };
export type SortieSimulateur =
  | { type: 'progres'; etats: number; fins: string[]; ms: number }
  | { type: 'fini'; rapport: RapportExploration }
  | { type: 'erreur'; message: string };

const envoyer = (m: SortieSimulateur) => (self as unknown as { postMessage(m: SortieSimulateur): void }).postMessage(m);

self.onmessage = (e: MessageEvent<EntreeSimulateur>) => {
  try {
    const r = assemblerMonde(e.data.monde, e.data.fichiers);
    if (!r.ok) return envoyer({ type: 'erreur', message: `Monde illisible : ${r.erreurs[0]?.fichier} — ${r.erreurs[0]?.message}` });
    const rapport = explorerParcours({ dm: r.monde, srd: chargerDonnees() }, { ...e.data.options, progres: (p) => void envoyer({ type: 'progres', ...p }) });
    envoyer({ type: 'fini', rapport });
  } catch (err) {
    envoyer({ type: 'erreur', message: (err as Error).message });
  }
};
