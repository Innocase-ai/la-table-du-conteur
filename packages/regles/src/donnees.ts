// Accès aux données de règles. Le moteur reçoit un objet Donnees ; d'où il vient
// (fichiers JSON sous Node, import statique côté client) ne le concerne pas.
import type { Arme, Armure, Classe, Don, Espece, Historique } from './schemas';

export interface Donnees {
  classes: Map<string, Classe>;
  especes: Map<string, Espece>;
  historiques: Map<string, Historique>;
  dons: Map<string, Don>;
  armures: Map<string, Armure>;
  armes: Map<string, Arme>;
}

export function indexer<T extends { id: string }>(elements: T[]): Map<string, T> {
  return new Map(elements.map((e) => [e.id, e]));
}
