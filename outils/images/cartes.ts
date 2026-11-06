// Cartes illustrées d'un monde : une image par lieu qui en contient d'autres (région, ville, donjon, niveau…), sur laquelle le jeu
// pose les lieux enfants (position à la main dans l'atelier : le service d'images ne place pas les lieux où on le demande).
// Pas de texte dans l'image (les noms sont écrits par le jeu), ni de personnage, ni de référence de héros.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { RACINE } from './charte';
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
  /** Une image déjà générée existe-t-elle (`carte-<id>`, `lieu-<id>`) ? Sert à donner au service les images de référence qui assurent la cohérence. */
  existe?: (idImage: string) => boolean;
  /** Remplace le texte d'un élément (`carte-<id>`) : même mécanisme que `images.json` des autres images. */
  retouches?: Record<string, string>;
}

/** Les éléments à illustrer : une carte par lieu conteneur donné (par défaut ceux de `candidatsCartes`). */
/** La carte la plus proche au-dessus d'un lieu (celle de son parent, sinon de son grand-parent…), si son image existe. */
function carteMere(dm: DonneesMonde, l: Lieu, existe: (id: string) => boolean): Lieu | undefined {
  for (let a = l.parent ? dm.lieux.get(l.parent) : undefined; a; a = a.parent ? dm.lieux.get(a.parent) : undefined) if (existe(`carte-${a.id}`)) return a;
  return undefined;
}

export function elementsCartes(dm: DonneesMonde, { charte, existe = () => false, retouches = {} }: OptionsCartes, lieux: Lieu[] = candidatsCartes(dm)): Element[] {
  return lieux.map((l) => {
    const fils = enfantsDe(dm, l.id).slice(0, 12);
    // Cohérence avec le reste du jeu : la carte d'ensemble au-dessus (même style, mêmes matériaux, mêmes couleurs) et l'image du lieu lui-même (son architecture vue du sol).
    const mere = carteMere(dm, l, existe);
    const recadre = existe(`recadre-${l.id}`);
    const references = [...(recadre ? [`recadre-${l.id}`] : mere ? [`carte-${mere.id}`] : []), ...(existe(`lieu-${l.id}`) ? [`lieu-${l.id}`] : [])];
    const consigne = references.length
      ? [
          `Consistency is essential: this map must look like part of the same world as the attached reference images, with the same art style, colour palette, stone, roofs, vegetation, water and lighting.`,
          ...references.map((r, i) =>
            r.startsWith('recadre-')
              ? `Reference image ${i + 1} is a cutout of the overview map of the whole region (${mere?.nom ?? 'the region'}) showing exactly this place from above: keep its buildings, layout, materials, colours and lighting. This new image is a much closer, larger and more detailed view of that place alone, filling the whole frame: show nothing else (no other castle, harbour, village, lighthouse or coastline panorama).`
              : r.startsWith('carte-')
                ? `Reference image ${i + 1} is the overview map of the whole region (${mere!.nom}): take from it ONLY the art style, colour palette, stone, roofs, vegetation, water and lighting. This new image is a much closer view of ONE place, which fills the whole frame: do NOT redraw the overview composition, and show no other part of the region (no other castle, harbour, village or coastline panorama).`
                : `Reference image ${i + 1} shows this place seen from the ground: keep its architecture, materials and colours.`,
          ),
        ].join(' ')
      : undefined;
    return {
      id: `carte-${l.id}`,
      groupe: 'cartes' as const,
      nom: `Carte : ${l.nom}`,
      format: 'paysage' as const,
      references,
      prompt: [
        charte.style,
        ...(consigne ? [consigne] : []),
        `A hand-painted top-down fantasy map, seen from high above like a cartographer's illustration, of ${TYPES_EN[l.type] ?? 'a place'} (the description is in French): ${retouches[`carte-${l.id}`] ?? l.visuel}`,
        `It shows several distinct, clearly separated landmarks spread over the whole map, with open ground, paths or water between them: ${fils.map((f) => court(f.visuel)).join(' ; ')}.`,
        `Colour palette: ${dm.monde.direction.palette.join(', ')}.`,
        'An illustrated game map, aged and painterly, readable at a glance. No people and no creatures in the image. No labels, no legend, no compass rose, no scale bar, no border.',
        charte.contraintes,
      ].join('\n'),
    };
  });
}

/**
 * Prépare, pour chaque carte demandée dont le lieu est posé sur la carte d'ensemble au-dessus (position + image existante), la découpe de
 * cette carte autour du lieu (`recadre-<id>.png` dans `dossier`), qui sert de référence : le gros plan reprend alors les bâtiments
 * de la carte principale au lieu de les réinventer. Renvoie les identifiants préparés. Nécessite uv et Pillow (comme l'installeur).
 */
export function preparerRecadrages(dm: DonneesMonde, dossier: string, lieux: Lieu[]): string[] {
  const prets: string[] = [];
  for (const l of lieux) {
    const mere = carteMere(dm, l, (id) => existsSync(join(dossier, `${id}.png`)));
    if (!mere || !l.position || l.parent !== mere.id) continue;
    const sortie = join(dossier, `recadre-${l.id}.png`);
    execFileSync('uv', ['run', '--with', 'pillow', 'python', join(RACINE, 'outils/images/recadrer.py'), join(dossier, `carte-${mere.id}.png`), String(l.position.x), String(l.position.y), sortie], { stdio: 'pipe' });
    prets.push(`recadre-${l.id}`);
  }
  return prets;
}
