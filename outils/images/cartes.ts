// Cartes illustrées d'un monde : une image par lieu qui en contient d'autres (région, ville, donjon, niveau…), sur laquelle le jeu
// pose les lieux enfants (position à la main dans l'atelier : le service d'images ne place pas les lieux où on le demande).
// Pas de texte dans l'image (les noms sont écrits par le jeu), ni de personnage, ni de référence de héros.
import type { DonneesMonde, Lieu } from '../../packages/regles/src/monde/schemas';
import type { Charte, Element } from './charte';
import { ordreLieux } from './monde';

const TYPES_EN: Record<string, string> = {
  region: 'a whole region', ville: 'a town', village: 'a village', hameau: 'a hamlet', camp: 'a camp', route: 'a road and its surroundings', grotte: 'a cave system', donjon: 'a dungeon complex',
  niveau: 'one level of a dungeon', salle: 'a chamber', ruine: 'a ruin', batiment: 'a large building and its grounds', quartier: 'a district of a town', 'lieu-dit': 'a locality',
};

/** Au-delà de ce nombre d'enfants, la carte vaut le coup (en dessous, on pose les lieux sur celle du parent). */
export const SEUIL_CARTE = 5;

export function enfantsDe(dm: DonneesMonde, id: string): Lieu[] {
  return [...dm.lieux.values()].filter((l) => l.parent === id);
}

/** Les lieux conteneurs qui méritent une carte, dans l'ordre du parcours de l'arbre. */
export function candidatsCartes(dm: DonneesMonde): Lieu[] {
  return ordreLieux(dm).filter((l) => enfantsDe(dm, l.id).length >= SEUIL_CARTE);
}

const court = (t: string, n = 110) => {
  const phrase = t.split(/(?<=[.!?])\s/)[0] ?? t;
  return phrase.length <= n ? phrase : `${phrase.slice(0, n).replace(/\s+\S*$/, '')}…`;
};

export interface OptionsCartes {
  charte: Charte;
  /** Remplace le texte d'un élément (`carte-<id>`) : même mécanisme que `images.json` des autres images. */
  retouches?: Record<string, string>;
}

/** Les éléments à illustrer : une carte par lieu conteneur donné (par défaut ceux de `candidatsCartes`). */
export function elementsCartes(dm: DonneesMonde, { charte, retouches = {} }: OptionsCartes, lieux: Lieu[] = candidatsCartes(dm)): Element[] {
  return lieux.map((l) => {
    const fils = enfantsDe(dm, l.id).slice(0, 12);
    return {
      id: `carte-${l.id}`,
      groupe: 'cartes' as const,
      nom: `Carte : ${l.nom}`,
      format: 'paysage' as const,
      references: [],
      prompt: [
        charte.style,
        `A hand-painted top-down fantasy map, seen from high above like a cartographer's illustration, of ${TYPES_EN[l.type] ?? 'a place'} (the description is in French): ${retouches[`carte-${l.id}`] ?? l.visuel}`,
        `It shows several distinct, clearly separated landmarks spread over the whole map, with open ground, paths or water between them: ${fils.map((f) => court(f.visuel)).join(' ; ')}.`,
        `Colour palette: ${dm.monde.direction.palette.join(', ')}.`,
        'An illustrated game map, aged and painterly, readable at a glance. No people and no creatures in the image. No labels, no legend, no compass rose, no scale bar, no border.',
        charte.contraintes,
      ].join('\n'),
    };
  });
}
