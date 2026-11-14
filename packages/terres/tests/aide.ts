// Outils de test : une carte faite à la main, pour tester un comportement sans dépendre du bruit.
import { VERSION_GENERATEUR } from '../src/generation';
import type { CarteTerres, ContexteVoyage, EntreeTable, Terrain } from '../src/types';

export const CTX: ContexteVoyage = { niveauGroupe: 3, tailleGroupe: 4 };

export const TABLE_TOUT: EntreeTable[] = [{ id: 'tout', poids: 1, genre: 'combat' }];

/** Une carte de plaine, sans route ni décor ; `poser` change des cases. */
export function carteManuelle(largeur = 30, hauteur = 20, poser: (x: number, y: number) => Terrain | undefined = () => undefined): CarteTerres {
  const tuiles: Terrain[] = [];
  for (let y = 0; y < hauteur; y++) for (let x = 0; x < largeur; x++) tuiles.push(poser(x, y) ?? 'plaine');
  return {
    id: 'manuelle',
    graine: 1,
    largeur,
    hauteur,
    biome: 'prairie',
    echelle: 1,
    danger: 1,
    versionGenerateur: VERSION_GENERATEUR,
    tuiles,
    route: new Uint8Array(largeur * hauteur),
    blocage: new Uint8Array(largeur * hauteur),
    ancres: [],
    liens: [],
    pois: [],
  };
}
