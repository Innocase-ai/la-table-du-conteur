// Le SRD côté navigateur : les JSON sont inclus par Vite puis validés par les schémas du moteur (comme dans le jeu).
import { donneesDepuisFichiers, type Donnees } from '@crpg/regles';

const fichiers = import.meta.glob('../../../packages/donnees/srd/**/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;

let cache: Donnees | undefined;

export function chargerDonnees(): Donnees {
  cache ??= donneesDepuisFichiers(fichiers);
  return cache;
}
