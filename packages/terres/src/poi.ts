// Les points d'intérêt hors route : ce qui donne envie de quitter le chemin. Le moteur de terres les sème (déterministe, selon
// la graine de la carte) ; ce qui se passe quand on les atteint (un événement à choix, un trésor, un piège) est l'affaire du
// moteur de jeu, qui les relie à son contenu par `type`.
import { hash2 } from './rng';
import type { PointInteret, Terrain, TypePoi } from './types';

export const TYPES_POI_DEFAUT: TypePoi[] = [
  { id: 'puits', nom: 'Un puits à demi comblé', terrains: ['plaine', 'colline'], poids: 3 },
  { id: 'cairn', nom: 'Un cairn ancien', terrains: ['colline', 'montagne', 'plaine'], poids: 3 },
  { id: 'cabane', nom: 'Une cabane de berger', terrains: ['foret', 'plaine', 'colline'], poids: 3 },
  { id: 'ruine', nom: 'Une ruine envahie de ronces', terrains: ['plaine', 'colline', 'foret'], poids: 2 },
  { id: 'camp-abandonne', nom: 'Un camp abandonné', terrains: ['foret', 'plaine', 'marais'], poids: 3 },
  { id: 'chariot-brise', nom: 'Un chariot brisé', terrains: ['plaine', 'marais', 'colline'], poids: 2 },
  { id: 'bosquet-sacre', nom: 'Un bosquet aux arbres noués', terrains: ['foret'], poids: 2 },
  { id: 'tour-de-guet', nom: 'Une tour de guet délabrée', terrains: ['colline', 'montagne'], poids: 1, repere: { rayon: 14, nuit: false } },
  { id: 'pierre-dressee', nom: 'Une pierre dressée', terrains: ['colline', 'plaine'], poids: 1, repere: { rayon: 9, nuit: false } },
  { id: 'fumee', nom: 'Une colonne de fumée', terrains: ['foret', 'plaine', 'colline'], poids: 2, repere: { rayon: 12, nuit: false } },
  { id: 'feu-de-camp', nom: 'La lueur d’un feu de camp', terrains: ['foret', 'plaine', 'colline', 'marais'], poids: 2, repere: { rayon: 11, nuit: true } },
];

export interface ParamsSemis {
  graine: number;
  largeur: number;
  hauteur: number;
  tuiles: readonly Terrain[];
  /** Cases interdites (route, blocage, hors d'atteinte) : 1 = on n'y pose rien. */
  interdit: Uint8Array;
  ancres: readonly { x: number; y: number }[];
  densite: number;
  types: readonly TypePoi[];
}

const ESPACE_ENTRE_POI = 8;
const ESPACE_ANCRE = 5;
const MARGE_BORD = 2;

/** Sème les points d'intérêt : des cases franchissables, hors route, espacées entre elles et des lieux écrits. */
export function semerPoi(p: ParamsSemis): PointInteret[] {
  const cible = Math.round(p.largeur * p.hauteur * p.densite);
  const res: PointInteret[] = [];
  const poses: { x: number; y: number }[] = [];
  const types = p.types;
  for (let essai = 0; essai < cible * 60 && res.length < cible; essai++) {
    const x = MARGE_BORD + Math.floor(hash2(p.graine + 555, essai, 1) * (p.largeur - 2 * MARGE_BORD));
    const y = MARGE_BORD + Math.floor(hash2(p.graine + 555, essai, 2) * (p.hauteur - 2 * MARGE_BORD));
    const i = y * p.largeur + x;
    if (p.interdit[i]) continue;
    if (p.ancres.some((a) => Math.abs(a.x - x) + Math.abs(a.y - y) < ESPACE_ANCRE)) continue;
    if (poses.some((q) => Math.abs(q.x - x) + Math.abs(q.y - y) < ESPACE_ENTRE_POI)) continue;
    const terrain = p.tuiles[i]!;
    const possibles = types.filter((t) => t.terrains.includes(terrain));
    if (!possibles.length) continue;
    const total = possibles.reduce((s, t) => s + t.poids, 0);
    let r = hash2(p.graine + 556, essai, 3) * total;
    let choisi = possibles[possibles.length - 1]!;
    for (const t of possibles) {
      r -= t.poids;
      if (r < 0) {
        choisi = t;
        break;
      }
    }
    poses.push({ x, y });
    res.push({ id: `poi-${res.length + 1}`, type: choisi.id, nom: choisi.nom, x, y, ...(choisi.repere ? { repere: choisi.repere } : {}) });
  }
  return res;
}
