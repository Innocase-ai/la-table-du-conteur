// Accès aux données de règles. Le moteur reçoit un objet Donnees ; d'où il vient
// (fichiers JSON sous Node, import statique côté client) ne le concerne pas.
import type { Objet } from './monde/schemas';
import type { Arme, Armure, ChoixCreation, Classe, Don, Espece, Historique, Monstre, Sort } from './schemas';

export interface Donnees {
  classes: Map<string, Classe>;
  especes: Map<string, Espece>;
  historiques: Map<string, Historique>;
  dons: Map<string, Don>;
  armures: Map<string, Armure>;
  armes: Map<string, Arme>;
  monstres: Map<string, Monstre>;
  sorts: Map<string, Sort>;
  choix: Map<string, ChoixCreation>;
  /** Catalogue d'objets du SRD (équipement, potions, objets magiques), partagé par tous les mondes. */
  objets: Map<string, Objet>;
}

export function indexer<T extends { id: string }>(elements: T[]): Map<string, T> {
  const index = new Map<string, T>();
  for (const e of elements) {
    if (index.has(e.id)) throw new Error(`Identifiant en double dans les données : « ${e.id} ».`);
    index.set(e.id, e);
  }
  return index;
}
