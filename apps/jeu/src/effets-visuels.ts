import type { Combattant, Etat } from '@crpg/regles';

// Familles de dégâts pour les effets visuels : une famille = un habillage (impact, couleur des chiffres, mort).
// Les types viennent du moteur (« feu », « nécrotique », « tranchant »…), avec ou sans accent.

export const FAMILLES = [
  'tranchant',
  'perforant',
  'contondant',
  'feu',
  'froid',
  'foudre',
  'acide',
  'poison',
  'necrotique',
  'radiant',
  'force',
  'psychique',
  'tonnerre',
] as const;

export type Famille = (typeof FAMILLES)[number];

export type FamillePhysique = 'tranchant' | 'perforant' | 'contondant';

const PHYSIQUES: ReadonlySet<string> = new Set(['tranchant', 'perforant', 'contondant']);

export const LIBELLES_FAMILLES: Record<Famille, string> = {
  tranchant: 'Tranchant',
  perforant: 'Perforant',
  contondant: 'Contondant',
  feu: 'Feu',
  froid: 'Froid',
  foudre: 'Foudre',
  acide: 'Acide',
  poison: 'Poison',
  necrotique: 'Nécrotique',
  radiant: 'Radiant',
  force: 'Force',
  psychique: 'Psychique',
  tonnerre: 'Tonnerre',
};

/** Couleur dominante d'une famille (chiffres de dégâts, halo, éclats). */
export const COULEURS_FAMILLES: Record<Famille, string> = {
  tranchant: '#e6ecf5',
  perforant: '#f0dfb8',
  contondant: '#e0b98a',
  feu: '#ff8a3c',
  froid: '#9fe2ff',
  foudre: '#ffe45c',
  acide: '#a8ff3c',
  poison: '#7fd94a',
  necrotique: '#6fdc8c',
  radiant: '#fff0b5',
  force: '#b98cff',
  psychique: '#ff8ad8',
  tonnerre: '#c9d4ff',
};

const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Famille d'un type de dégâts du moteur ; les types inconnus sont traités comme du contondant. */
export function famille(type: string | undefined): Famille {
  const t = type ? sansAccent(type) : '';
  return (FAMILLES as readonly string[]).includes(t) ? (t as Famille) : 'contondant';
}

export function estPhysique(f: Famille): f is FamillePhysique {
  return PHYSIQUES.has(f);
}

/** Famille dominante d'un événement de dégâts : un élément l'emporte sur le physique (une épée de feu brûle). */
export function familleDominante(types: readonly string[] | undefined): Famille {
  const familles = (types ?? []).map(famille);
  return familles.find((f) => !estPhysique(f)) ?? familles[0] ?? 'contondant';
}

/** Une mort « à la façon de » la famille : durée et image-clés du jeton qui disparaît. */
export interface StyleMort {
  duree: number;
  images: Keyframe[];
}

export function styleMort(f: Famille, definitive: boolean): StyleMort {
  if (!definitive) {
    return {
      duree: 300,
      images: [
        { opacity: 1, transform: 'scale(1) translateY(0)' },
        { opacity: 0.35, transform: 'scale(0.72) translateY(14%) rotate(-8deg)' },
      ],
    };
  }
  switch (f) {
    case 'feu':
      // Le jeton noircit, se recroqueville et s'effrite.
      return {
        duree: 700,
        images: [
          { opacity: 1, filter: 'none', transform: 'scale(1)' },
          { opacity: 1, filter: 'brightness(1.8) sepia(1) saturate(4) hue-rotate(-20deg)', transform: 'scale(1.05)', offset: 0.25 },
          { opacity: 0.6, filter: 'brightness(0.25) grayscale(1)', transform: 'scale(0.85) translateY(6%)', offset: 0.7 },
          { opacity: 0.35, filter: 'brightness(0.2) grayscale(1)', transform: 'scale(0.72) translateY(14%)' },
        ],
      };
    case 'froid':
      // Le jeton se fige puis éclate.
      return {
        duree: 620,
        images: [
          { opacity: 1, filter: 'none', transform: 'scale(1)' },
          { opacity: 1, filter: 'brightness(1.6) saturate(0.4) hue-rotate(160deg)', transform: 'scale(1)', offset: 0.35 },
          { opacity: 0.9, filter: 'brightness(2) saturate(0.3) hue-rotate(160deg)', transform: 'scale(1.25)', offset: 0.55 },
          { opacity: 0.35, filter: 'brightness(0.6) grayscale(0.6)', transform: 'scale(0.72) translateY(14%)' },
        ],
      };
    case 'radiant':
      // Le jeton blanchit et s'élève.
      return {
        duree: 700,
        images: [
          { opacity: 1, filter: 'none', transform: 'translateY(0)' },
          { opacity: 1, filter: 'brightness(3) saturate(0)', transform: 'translateY(-10%)', offset: 0.4 },
          { opacity: 0.35, filter: 'brightness(0.5) grayscale(1)', transform: 'scale(0.72) translateY(14%)' },
        ],
      };
    case 'acide':
    case 'poison':
    case 'necrotique':
      // Le jeton s'affaisse en virant au vert.
      return {
        duree: 700,
        images: [
          { opacity: 1, filter: 'none', transform: 'scale(1)' },
          { opacity: 1, filter: 'sepia(1) saturate(3) hue-rotate(60deg) brightness(0.9)', transform: 'scale(0.95) translateY(5%)', offset: 0.4 },
          { opacity: 0.35, filter: 'sepia(1) saturate(2) hue-rotate(60deg) brightness(0.4)', transform: 'scale(0.7) translateY(18%)' },
        ],
      };
    case 'foudre':
    case 'tonnerre':
      // Le jeton grésille avant de tomber.
      return {
        duree: 600,
        images: [
          { opacity: 1, filter: 'none', transform: 'translateX(0)' },
          { opacity: 1, filter: 'brightness(3)', transform: 'translateX(-6%)', offset: 0.12 },
          { opacity: 1, filter: 'invert(1)', transform: 'translateX(6%)', offset: 0.24 },
          { opacity: 1, filter: 'brightness(2)', transform: 'translateX(-4%)', offset: 0.36 },
          { opacity: 0.35, filter: 'brightness(0.4) grayscale(1)', transform: 'scale(0.72) translateY(14%) rotate(-8deg)' },
        ],
      };
    default:
      return {
        duree: 560,
        images: [
          { opacity: 1, transform: 'scale(1) translateY(0)' },
          { opacity: 0.35, transform: 'scale(0.72) translateY(14%) rotate(-8deg)' },
        ],
      };
  }
}

// ---------------------------------------------------------------------------
// Formes des sorts lancés à distance
// ---------------------------------------------------------------------------

/** Ce qui traverse le plateau : un projectile (boule, éclat de glace, dard, jet, volute) ou un rayon (instantané). */
export type FormeSort = 'boule' | 'glace' | 'dard' | 'lob' | 'volute' | 'zigzag' | 'rayon';

/** Formes propres à certains sorts ; les autres suivent la famille de leurs dégâts. */
const FORMES_SORTS: Record<string, FormeSort> = {
  'trait-de-feu': 'boule',
  'rayon-de-givre': 'glace',
  'flamme-sacree': 'rayon',
  'eclair-tracant': 'zigzag',
  'rayon-ardent': 'rayon',
  'projectile-magique': 'dard',
  'aspersion-acide': 'lob',
  'bouffee-de-poison': 'volute',
};

const FORMES_FAMILLES: Record<Famille, FormeSort> = {
  tranchant: 'dard',
  perforant: 'dard',
  contondant: 'dard',
  feu: 'boule',
  froid: 'glace',
  foudre: 'zigzag',
  acide: 'lob',
  poison: 'volute',
  necrotique: 'volute',
  radiant: 'rayon',
  force: 'dard',
  psychique: 'volute',
  tonnerre: 'boule',
};

export function formeSort(id: string | undefined, f: Famille): FormeSort {
  return (id && FORMES_SORTS[id]) || FORMES_FAMILLES[f];
}

export function estRayon(forme: FormeSort): forme is 'zigzag' | 'rayon' {
  return forme === 'zigzag' || forme === 'rayon';
}

// ---------------------------------------------------------------------------
// Auras et états : ce qui reste visible sur le jeton tant que l'effet dure
// ---------------------------------------------------------------------------

export type Aura = 'benediction' | 'bouclier' | 'fleau' | 'marque' | 'givre' | 'trace' | 'concentration' | 'pvtemp';

export const LIBELLES_AURAS: Record<Aura, string> = {
  benediction: 'béni',
  bouclier: 'protégé',
  fleau: 'maudit',
  marque: 'marqué',
  givre: 'ralenti par le froid',
  trace: 'illuminé (avantage contre lui)',
  concentration: 'concentré',
  pvtemp: 'points de vie temporaires',
};

const ORDRE_AURAS: Aura[] = ['benediction', 'bouclier', 'fleau', 'marque', 'givre', 'trace', 'concentration', 'pvtemp'];

/** Les auras d'un combattant, d'après ses modificateurs en cours (trois au plus, les plus parlantes d'abord). */
export function aurasDe(c: Pick<Combattant, 'modificateurs' | 'concentration' | 'pvTemp'>): Aura[] {
  const ids = new Set(c.modificateurs.map((m) => m.id));
  const presentes: Record<Aura, boolean> = {
    benediction: ids.has('benediction-a'),
    bouclier: ids.has('bouclier-de-la-foi') || ids.has('bouclier'),
    fleau: ids.has('fleau-a'),
    marque: ids.has('marque-du-chasseur'),
    givre: c.modificateurs.some((m) => m.type === 'vitesse' && (m.valeur ?? 0) < 0),
    trace: ids.has('eclair-tracant'),
    concentration: !!c.concentration,
    pvtemp: c.pvTemp > 0,
  };
  return ORDRE_AURAS.filter((a) => presentes[a]).slice(0, 3);
}

/** Petits signes qui flottent au-dessus d'un jeton atteint par cet état (le signe et leur nombre). */
export const FX_ETATS: Partial<Record<Etat, { glyphe: string; n: number }>> = {
  inconscient: { glyphe: 'z', n: 3 },
  neutralise: { glyphe: 'z', n: 3 },
  paralyse: { glyphe: '⚡', n: 3 },
  charme: { glyphe: '♥', n: 3 },
  effraye: { glyphe: '!', n: 2 },
  aveugle: { glyphe: '?', n: 2 },
  empoisonne: { glyphe: '●', n: 3 },
};
