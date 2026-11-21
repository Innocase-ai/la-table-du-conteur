// Ambiance du plateau d'un combat d'histoire (21/11/2026) : celle que la rencontre déclare, sinon celle que donne son lieu.
// Une salle prend l'ambiance du premier ancêtre qui décide (donjon, grotte, bâtiment…) ; une salle d'un lieu extérieur
// (la salle des meules d'un moulin) est un intérieur. Une cave ne se devine pas : la rencontre la déclare (`terrain: "cave"`).
import type { Terrain } from '../combat/grille';
import type { DonneesMonde } from './schemas';

const DECISIFS: Record<string, Terrain> = {
  grotte: 'caverne',
  donjon: 'souterrain',
  niveau: 'souterrain',
  ruine: 'souterrain',
  camp: 'camp',
  batiment: 'interieur',
};

/** L'ambiance que donne un lieu (et ses ancêtres) ; sans lieu, la forêt. */
export function ambianceDuLieu(lieux: DonneesMonde['lieux'], id: string | undefined): Terrain {
  let dansUneSalle = false;
  const vus = new Set<string>();
  let l = id ? lieux.get(id) : undefined;
  while (l && !vus.has(l.id)) {
    vus.add(l.id);
    const decide = DECISIFS[l.type];
    if (decide) return decide;
    if (l.type === 'salle') dansUneSalle = true;
    else return dansUneSalle ? 'interieur' : 'foret';
    l = l.parent ? lieux.get(l.parent) : undefined;
  }
  return dansUneSalle ? 'interieur' : 'foret';
}

/** L'ambiance d'une rencontre : la sienne, sinon celle de son lieu. */
export function ambianceDeRencontre(dm: Pick<DonneesMonde, 'lieux'>, r: { terrain?: Terrain; lieu?: string }): Terrain {
  return r.terrain ?? ambianceDuLieu(dm.lieux, r.lieu);
}
