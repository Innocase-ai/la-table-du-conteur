// Chargement des données SRD depuis packages/donnees/srd (Node uniquement : outils et tests).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { z, ZodTypeAny } from 'zod';
import { indexer, type Donnees } from './donnees';
import { Arme, Armure, Classe, Don, Espece, Historique, Monstre, Sort } from './schemas';

export const RACINE_SRD = join(import.meta.dirname, '../../donnees/srd');

function charger<S extends ZodTypeAny>(racine: string, dossier: string, schema: S): z.output<S>[] {
  const chemin = join(racine, dossier);
  return readdirSync(chemin)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .flatMap((f) => {
      const contenu: unknown = JSON.parse(readFileSync(join(chemin, f), 'utf8'));
      return (Array.isArray(contenu) ? contenu : [contenu]).map((e): z.output<S> => schema.parse(e));
    });
}

export function chargerDonneesSrd(racine = RACINE_SRD): Donnees {
  return {
    classes: indexer(charger(racine, 'classes', Classe)),
    especes: indexer(charger(racine, 'especes', Espece)),
    historiques: indexer(charger(racine, 'historiques', Historique)),
    dons: indexer(charger(racine, 'dons', Don)),
    armures: indexer(charger(racine, 'armures', Armure)),
    armes: indexer(charger(racine, 'armes', Arme)),
    monstres: indexer(charger(racine, 'monstres', Monstre)),
    sorts: indexer(charger(racine, 'sorts', Sort)),
  };
}
