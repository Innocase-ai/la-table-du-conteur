// Chargement des données SRD côté navigateur : les JSON sont inclus par Vite au build
// puis validés avec les schémas Zod du moteur.
import { Arme, Armure, ChoixCreation, Classe, Don, Espece, Historique, Monstre, Sort, indexer, type Donnees } from '@crpg/regles';
import type { z, ZodTypeAny } from 'zod';

const fichiers = import.meta.glob('../../../packages/donnees/srd/**/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;

function charger<S extends ZodTypeAny>(dossier: string, schema: S): z.output<S>[] {
  return Object.entries(fichiers)
    .filter(([chemin]) => chemin.includes(`/srd/${dossier}/`))
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([chemin, contenu]) =>
      (Array.isArray(contenu) ? contenu : [contenu]).map((e): z.output<S> => {
        const r = schema.safeParse(e);
        if (!r.success) throw new Error(`${chemin} : ${r.error.message}`);
        return r.data;
      }),
    );
}

let cache: Donnees | undefined;

export function chargerDonnees(): Donnees {
  cache ??= {
    classes: indexer(charger('classes', Classe)),
    especes: indexer(charger('especes', Espece)),
    historiques: indexer(charger('historiques', Historique)),
    dons: indexer(charger('dons', Don)),
    armures: indexer(charger('armures', Armure)),
    armes: indexer(charger('armes', Arme)),
    monstres: indexer(charger('monstres', Monstre)),
    sorts: indexer(charger('sorts', Sort)),
    choix: indexer(charger('choix', ChoixCreation)),
  };
  return cache;
}
