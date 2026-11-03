// Les histoires jouables : chaque dossier de packages/mondes avec un monde.json publié. Le client ne lit ici que la
// présentation (nom, accroche, résumé, ton, niveaux, chapitres) et l'image de couverture ; le monde complet sera
// chargé quand l'aventure commencera.
import { Estimation, Monde, type ManifesteImages } from '@crpg/regles';

const FICHIERS = import.meta.glob('../../../packages/mondes/*/monde.json', { eager: true, import: 'default' }) as Record<string, unknown>;
const ESTIMATIONS = import.meta.glob('../../../packages/mondes/*/estimation.json', { eager: true, import: 'default' }) as Record<string, unknown>;
const MANIFESTES = import.meta.glob('../../../packages/mondes/*/images/manifeste.json', { eager: true, import: 'default' }) as Record<string, ManifesteImages>;
// Chargement paresseux : seule la couverture affichée est téléchargée.
const IMAGES = import.meta.glob<string>('../../../packages/mondes/*/images/*.webp', { query: '?url', import: 'default' });

export interface Histoire {
  monde: Monde;
  /** Charge l'URL de l'image de couverture, s'il y en a une. */
  couverture?: () => Promise<string>;
  /** Durée et coût d'API estimés (`pnpm monde estimer`). */
  estimation?: Estimation;
}

const dossier = (chemin: string) => chemin.replace(/^.*\/mondes\/([^/]+)\/.*$/, '$1');

export function histoires(): Histoire[] {
  return Object.entries(FICHIERS)
    .flatMap(([chemin, brut]) => {
      const r = Monde.safeParse(brut);
      if (!r.success || r.data.statut !== 'publie') return [];
      const id = dossier(chemin);
      const manifeste = Object.entries(MANIFESTES).find(([c]) => dossier(c) === id)?.[1];
      // Couverture : l'image du lieu qui porte le nom du monde, sinon celle du lieu de départ.
      const fichier = manifeste?.lieux[r.data.id] ?? manifeste?.lieux[r.data.depart.lieu];
      const chargeur = fichier ? IMAGES[`../../../packages/mondes/${id}/images/${fichier}`] : undefined;
      const brute = Object.entries(ESTIMATIONS).find(([c]) => dossier(c) === id)?.[1];
      const estimation = brute ? Estimation.safeParse(brute) : undefined;
      return [{ monde: r.data, couverture: chargeur, estimation: estimation?.success ? estimation.data : undefined }];
    })
    .sort((a, b) => a.monde.nom.localeCompare(b.monde.nom));
}
