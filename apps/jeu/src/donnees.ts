// Chargement des données SRD côté navigateur : les JSON sont inclus par Vite au build
// puis validés avec les schémas Zod du moteur (`donneesDepuisFichiers`, partagé avec l'atelier d'auteur).
import { donneesDepuisFichiers, type Donnees } from '@crpg/regles';

const fichiers = import.meta.glob('../../../packages/donnees/srd/**/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;

let cache: Donnees | undefined;

export function chargerDonnees(): Donnees {
  cache ??= donneesDepuisFichiers(fichiers);
  return cache;
}
