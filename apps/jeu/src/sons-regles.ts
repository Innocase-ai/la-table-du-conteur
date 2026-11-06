// Quel son pour quel effet : la correspondance entre ce qui se passe au combat et les bruitages (dossier `sons/`).
// Logique pure, sans lecture audio (voir `sons.ts`), pour pouvoir la tester. La liste de ce qu'on a et de ce qui manque
// encore est dans `docs/SONS.md`.
import type { Evenement } from '@crpg/regles';
import { estPhysique, type Famille } from './effets-visuels';

/** Les bruitages disponibles : un fichier `sons/<nom>.mp3` chacun. */
export const SONS = [
  // Armes : coups
  'epee',
  'hache',
  'fouet',
  'lance',
  'rapiere',
  'perforant',
  'masse',
  'massue',
  'contondant',
  'rate-arme',
  // Armes : tirs et jets
  'arc',
  'arbalete',
  'fronde',
  'arme-a-feu',
  'sarbacane',
  'lancer',
  // Sorts de dégâts
  'feu-1',
  'feu-2',
  'glace',
  'foudre',
  'radiant',
  'acide',
  'poison',
  'necrotique',
  'tonnerre',
  'projectile-magique',
  'arme-spirituelle',
  // Sorts de soutien et d'état
  'soin',
  'protection',
  'renforcement',
  'marque',
  'malediction',
  'sommeil',
  'immobilisation',
] as const;

export type Son = (typeof SONS)[number];

export const LIBELLES_SONS: Record<Son, string> = {
  epee: 'Coup d’épée',
  hache: 'Coup de hache',
  fouet: 'Coup de fouet',
  lance: 'Coup de lance (estoc)',
  rapiere: 'Coup de rapière, de dague',
  perforant: 'Coup perforant (corps à corps)',
  masse: 'Coup de masse, de marteau',
  massue: 'Coup de massue, de gourdin',
  contondant: 'Coup contondant',
  'rate-arme': 'Attaque ratée',
  arc: 'Tir à l’arc',
  arbalete: 'Tir à l’arbalète',
  fronde: 'Tir à la fronde',
  'arme-a-feu': 'Arme à feu',
  sarbacane: 'Sarbacane',
  lancer: 'Arme lancée',
  'feu-1': 'Sort de feu',
  'feu-2': 'Sort de feu (rayon)',
  glace: 'Magie de glace',
  foudre: 'Foudre',
  radiant: 'Lumière sacrée',
  acide: 'Acide',
  poison: 'Poison',
  necrotique: 'Magie nécrotique',
  tonnerre: 'Tonnerre',
  'projectile-magique': 'Projectile magique',
  'arme-spirituelle': 'Arme spirituelle',
  soin: 'Soin',
  protection: 'Protection',
  renforcement: 'Renforcement (Aide)',
  marque: 'Marque du chasseur',
  malediction: 'Malédiction',
  sommeil: 'Sommeil',
  immobilisation: 'Immobilisation',
};

/** Sons propres à certains sorts, quand ils partent (projectile, rayon, zone, contact ou jet de sauvegarde). */
const SONS_SORTS: Record<string, Son> = {
  'trait-de-feu': 'feu-1',
  'mains-brulantes': 'feu-1',
  'rayon-ardent': 'feu-2',
  'rayon-de-givre': 'glace',
  'poigne-electrique': 'foudre',
  'eclair-tracant': 'radiant',
  'flamme-sacree': 'radiant',
  'aspersion-acide': 'acide',
  'bouffee-de-poison': 'poison',
  'contact-glacial': 'necrotique',
  blessure: 'necrotique',
  'vague-tonnante': 'tonnerre',
  sommeil: 'sommeil',
  'immobilisation-de-personne': 'immobilisation',
  'projectile-magique': 'projectile-magique',
  'arme-spirituelle': 'arme-spirituelle',
};

/**
 * Les sorts dont le son se joue au lancement : rien ne traverse le plateau ni ne fait de jet de sauvegarde visible
 * (protection, bénédiction, renforcement, marque, malédiction) ; leur son part avec le cercle d'incantation.
 */
const SONS_AU_LANCEMENT: Record<string, Son> = {
  bouclier: 'protection',
  'bouclier-de-la-foi': 'protection',
  benediction: 'protection',
  aide: 'renforcement',
  'marque-du-chasseur': 'marque',
  fleau: 'malediction',
};

/** À défaut d'un son propre, un sort prend le son de la famille de ses dégâts (quand elle en a un). */
const SONS_FAMILLES: Partial<Record<Famille, Son>> = {
  feu: 'feu-1',
  froid: 'glace',
  foudre: 'foudre',
  force: 'projectile-magique',
  radiant: 'radiant',
  acide: 'acide',
  poison: 'poison',
  necrotique: 'necrotique',
  tonnerre: 'tonnerre',
};

/** Le son d'un sort qui part (projectile, rayon, zone, contact, jet de sauvegarde) ; `undefined` si on n'en a pas pour lui. */
export function sonDeSort(sortId: string | undefined, famille?: Famille): Son | undefined {
  if (!sortId) return undefined;
  return SONS_SORTS[sortId] ?? (famille ? SONS_FAMILLES[famille] : undefined);
}

/** Le son d'un sort de soutien au moment où on le lance (protection, renforcement, marque, malédiction). */
export function sonAuLancement(sortId: string | undefined): Son | undefined {
  return sortId ? SONS_AU_LANCEMENT[sortId] : undefined;
}

/**
 * Une arme sous forme de mots : son identifiant (`hache-a-deux-mains`, `javeline-lancer`) ou son nom (« Hache à deux
 * mains »), en minuscules, sans accents, mots séparés par des tirets. On cherche ensuite des mots entiers : « arc » ne
 * se confond pas avec « lance-d-arcon ».
 */
function motsDe(arme: string | undefined): string {
  if (!arme) return '-';
  const mots = arme
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `-${mots}-`;
}

/** L'arme contient-elle l'un de ces mots (ou suites de mots : `epee-courte`) ? */
function contient(mots: string, ...cherches: string[]): boolean {
  return cherches.some((c) => mots.includes(`-${c}-`));
}

/** Une arme qui se tire : arc, arbalète, fronde, arme à feu, sarbacane (on entend le départ, pas l'impact). */
export function estArmeDeTir(arme: string | undefined): boolean {
  return contient(motsDe(arme), 'arc', 'arbalete', 'fronde', 'mousquet', 'pistolet', 'sarbacane');
}

/**
 * Le son de départ d'une attaque à distance d'arme : la corde d'un arc, le déclic d'une arbalète, la fronde, la détonation,
 * la sarbacane, ou le bruit d'une arme lancée (javeline, hachette, dague…). `arme` : identifiant ou nom de l'arme.
 */
export function sonDeTir(arme: string | undefined): Son | undefined {
  if (!arme) return undefined;
  const mots = motsDe(arme);
  if (contient(mots, 'fronde')) return 'fronde';
  if (contient(mots, 'sarbacane')) return 'sarbacane';
  if (contient(mots, 'mousquet', 'pistolet')) return 'arme-a-feu';
  if (contient(mots, 'arbalete')) return 'arbalete';
  if (contient(mots, 'arc')) return 'arc';
  // Toute autre arme tirée à distance est une arme de jet : `javeline-lancer`, « Hachette (lancer) »…
  return 'lancer';
}

export interface Coup {
  /** La famille de dégâts qui fait le bruit : la part physique du coup quand il y en a une (voir `famillePhysique`). */
  famille: Famille;
  /** Identifiant (ou nom) de l'arme ou de l'action du monstre, fourni par le moteur dans le journal. */
  arme?: string;
  /** Le coup vient d'un sort : son propre son a déjà joué au départ. */
  sort?: boolean;
  /** Le coup vient d'une attaque à distance (flèche, javeline…). */
  distance?: boolean;
}

/** Le son d'un coup qui porte. Seuls les coups d'arme en font un ; ceux d'un sort ont joué le leur au départ. */
export function sonDeCoup(c: Coup): Son | undefined {
  if (c.sort || !estPhysique(c.famille)) return undefined;
  const mots = motsDe(c.arme);
  switch (c.famille) {
    case 'tranchant':
      if (contient(mots, 'fouet')) return 'fouet';
      return contient(mots, 'hache', 'hachette') ? 'hache' : 'epee';
    case 'perforant':
      // À distance, la flèche a fait son bruit au départ ; au corps à corps, on entend la pointe.
      if (c.distance) return undefined;
      if (contient(mots, 'morgenstern')) return 'masse';
      if (contient(mots, 'lance', 'pique', 'pic-de-guerre', 'trident', 'javeline')) return 'lance';
      if (contient(mots, 'rapiere', 'dague', 'epee-courte')) return 'rapiere';
      return 'perforant';
    case 'contondant':
      // Une pierre de fronde qui touche n'a pas de son propre : le tir a déjà joué.
      if (c.distance) return undefined;
      if (contient(mots, 'massue', 'gourdin', 'baton')) return 'massue';
      if (contient(mots, 'masse', 'maillet', 'marteau', 'fleau')) return 'masse';
      return 'contondant';
  }
}

/** Le bruit d'une attaque d'arme qui rate : un sifflement dans le vide. Les sorts n'en ont pas. */
export function sonDeRate(c: { sort?: boolean }): Son | undefined {
  return c.sort ? undefined : 'rate-arme';
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
