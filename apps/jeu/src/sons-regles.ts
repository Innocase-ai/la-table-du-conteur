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

/** Une arme qui se tire : arc, arbalète, fronde, arme à feu, sarbacane (on entend le départ, pas l'impact). */
export function estArmeDeTir(nomArme: string | undefined): boolean {
  return !!nomArme && /\b(arc|arbal[èe]te|fronde|mousquet|pistolet|sarbacane)\b/i.test(nomArme);
}

/**
 * Le son de départ d'une attaque à distance d'arme : la corde d'un arc, le déclic d'une arbalète, la fronde, la détonation,
 * la sarbacane, ou le bruit d'une arme lancée (javeline, hachette, dague…). `undefined` pour une attaque de sort.
 */
export function sonDeTir(nomArme: string | undefined): Son | undefined {
  if (!nomArme) return undefined;
  if (/\bfronde\b/i.test(nomArme)) return 'fronde';
  if (/\bsarbacane\b/i.test(nomArme)) return 'sarbacane';
  if (/\b(mousquet|pistolet)\b/i.test(nomArme)) return 'arme-a-feu';
  if (/\barbal[èe]te\b/i.test(nomArme)) return 'arbalete';
  if (/\barc\b/i.test(nomArme)) return 'arc';
  // Toute autre arme tirée à distance est une arme de jet : « Javeline (lancer) », « Hachette (lancer) »…
  return 'lancer';
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
  const arme = c.arme ?? '';
  switch (c.famille) {
    case 'tranchant':
      if (/\bfouet\b/i.test(arme)) return 'fouet';
      return /hache/i.test(arme) ? 'hache' : 'epee';
    case 'perforant':
      // À distance, la flèche a fait son bruit au départ ; au corps à corps, on entend la pointe.
      if (c.distance) return undefined;
      if (/morgenstern/i.test(arme)) return 'masse';
      if (/lance|pique|pic de guerre|trident|javeline/i.test(arme)) return 'lance';
      if (/rapi[èe]re|dague|[ée]p[ée]e courte/i.test(arme)) return 'rapiere';
      return 'perforant';
    case 'contondant':
      // Une pierre de fronde qui touche n'a pas de son propre : le tir a déjà joué.
      if (c.distance) return undefined;
      if (/massue|gourdin|b[aâ]ton/i.test(arme)) return 'massue';
      if (/masse|maillet|marteau|fl[ée]au/i.test(arme)) return 'masse';
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

/** Le nom de l'arme dans une ligne de journal d'attaque (« Grukk attaque Gobelin (Hache à deux mains) : … »). */
export function armeDuJournal(texte: string): string | undefined {
  return /attaque .+? \((.+?)\) :/.exec(texte)?.[1];
}
