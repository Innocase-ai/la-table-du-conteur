// Quel son pour quel effet : la correspondance entre ce qui se passe au combat et les bruitages (dossier `sons/`).
// Logique pure, sans lecture audio (voir `sons.ts`), pour pouvoir la tester.
import type { Evenement } from '@crpg/regles';
import { estPhysique, type Famille } from './effets-visuels';

/** Les bruitages disponibles : un fichier `sons/<nom>.mp3` chacun. */
export const SONS = [
  'epee',
  'hache',
  'arc',
  'perforant',
  'contondant',
  'feu-1',
  'feu-2',
  'glace',
  'foudre',
  'projectile-magique',
  'soin',
  'protection',
] as const;

export type Son = (typeof SONS)[number];

export const LIBELLES_SONS: Record<Son, string> = {
  epee: 'Coup d’épée',
  hache: 'Coup de hache',
  arc: 'Tir à l’arc',
  perforant: 'Coup perforant (corps à corps)',
  contondant: 'Coup contondant',
  'feu-1': 'Sort de feu',
  'feu-2': 'Sort de feu (rayon)',
  glace: 'Magie de glace',
  foudre: 'Foudre',
  'projectile-magique': 'Projectile magique',
  soin: 'Soin',
  protection: 'Protection',
};

/** Sons propres à certains sorts, quand on les lance (projectile, rayon, zone ou contact). */
const SONS_SORTS: Record<string, Son> = {
  'trait-de-feu': 'feu-1',
  'mains-brulantes': 'feu-1',
  'rayon-ardent': 'feu-2',
  'rayon-de-givre': 'glace',
  'eclair-tracant': 'foudre',
  'poigne-electrique': 'foudre',
  'projectile-magique': 'projectile-magique',
};

/** Les sorts de protection : leur son se joue au lancement, puisque rien ne traverse le plateau. */
const SORTS_DE_PROTECTION: ReadonlySet<string> = new Set(['bouclier', 'bouclier-de-la-foi', 'benediction']);

/** À défaut d'un son propre, un sort prend le son de la famille de ses dégâts (quand elle en a un). */
const SONS_FAMILLES: Partial<Record<Famille, Son>> = {
  feu: 'feu-1',
  froid: 'glace',
  foudre: 'foudre',
  force: 'projectile-magique',
};

/** Le son d'un sort qui part (projectile, rayon, zone, contact) ; `undefined` si on n'en a pas pour lui. */
export function sonDeSort(sortId: string | undefined, famille?: Famille): Son | undefined {
  if (!sortId) return undefined;
  return SONS_SORTS[sortId] ?? (famille ? SONS_FAMILLES[famille] : undefined);
}

/** Le son d'un sort de protection au moment où on le lance. */
export function sonDeProtection(sortId: string | undefined): Son | undefined {
  return sortId && SORTS_DE_PROTECTION.has(sortId) ? 'protection' : undefined;
}

/** Une arme qui se tire : arc, arbalète, fronde (on entend la corde, pas l'impact). */
export function estArmeDeTir(nomArme: string | undefined): boolean {
  return !!nomArme && /\b(arc|arbal[èe]te|fronde)\b/i.test(nomArme);
}

/** Le son de départ d'un tir d'arme (la flèche part) ; `undefined` pour une arme de jet ou un sort. */
export function sonDeTir(nomArme: string | undefined): Son | undefined {
  return estArmeDeTir(nomArme) ? 'arc' : undefined;
}

export interface Coup {
  famille: Famille;
  /** Nom de l'arme (ou de l'action du monstre), tel qu'il figure dans le journal. */
  arme?: string;
  /** Le coup vient d'un sort : son propre son a déjà joué au départ. */
  sort?: boolean;
  /** Le coup vient d'une attaque à distance (flèche, javeline…). */
  distance?: boolean;
}

/** Le son d'un coup qui porte. Seuls les coups d'arme en font un ; ceux d'un sort ont joué le leur au départ. */
export function sonDeCoup(c: Coup): Son | undefined {
  if (c.sort || !estPhysique(c.famille)) return undefined;
  switch (c.famille) {
    case 'tranchant':
      return c.arme && /hache/i.test(c.arme) ? 'hache' : 'epee';
    case 'perforant':
      // À distance, la flèche a fait son bruit au départ ; au corps à corps, on entend la pointe.
      return c.distance ? undefined : 'perforant';
    case 'contondant':
      return 'contondant';
  }
}

/**
 * Les dégâts que porte une attaque : l'événement « degats » qui la suit sur la même cible, avant l'action suivante.
 * Sert à jouer le bruit du coup au moment où il porte (la secousse de la cible), sans attendre l'événement des dégâts.
 */
export function degatsDeLAttaque(journal: readonly Evenement[], i: number): Evenement | undefined {
  const attaque = journal[i];
  if (!attaque || attaque.type !== 'attaque') return undefined;
  for (let j = i + 1; j < journal.length; j++) {
    const e = journal[j]!;
    if (e.type === 'attaque' || e.type === 'sort' || e.type === 'tour') return undefined;
    if (e.type === 'degats' && e.cible === attaque.cible) return e;
  }
  return undefined;
}

/** Le nom de l'arme dans une ligne de journal d'attaque (« Grukk attaque Gobelin (Hache à deux mains) : … »). */
export function armeDuJournal(texte: string): string | undefined {
  return /attaque .+? \((.+?)\) :/.exec(texte)?.[1];
}
