// Les ouvertures de conversation : quand on adresse la parole à un PNJ, il lance d'abord une courte phrase tirée d'un fonds
// commun à toutes les histoires (`packages/donnees/repliques/ouvertures.json`), dite avec une voix d'homme ou de femme selon
// son genre. Tout est pur : le hasard est passé en paramètre.
import { z } from 'zod';
import { SEUIL_AMICAL, SEUIL_HOSTILE } from '@crpg/regles';
import { accorder } from './repliques-regles';

/** Le ton d'une ouverture : il suit l'attitude du PNJ envers le groupe (méfiant s'il est hostile, amical s'il est dévoué). */
export const TONS_OUVERTURE = ['neutre', 'amical', 'mefiant'] as const;
export type TonOuverture = (typeof TONS_OUVERTURE)[number];

export const LIBELLES_TONS: Record<TonOuverture, string> = { neutre: 'Neutre', amical: 'Amical', mefiant: 'Méfiant' };

const VoixOuverture = z.object({
  /** Identifiant de la voix (`m-charon`, `f-matrone`) : le dossier de ses fichiers audio. */
  id: z.string().regex(/^[mf]-[a-z0-9-]+$/),
  /** Une des 30 voix de Gemini (voir `VOIX_GEMINI` dans outils/voix/repliques.ts). */
  timbre: z.string().min(3),
  /** Le personnage à jouer, transmis à part comme style (il n'est pas lu à voix haute). */
  jeu: z.string().min(5),
  /** Âge minimum du PNJ pour cette voix (une voix de vieux sage ne va pas à un novice) ; absent : tous les âges. */
  ageMin: z.number().int().min(0).optional(),
});

/**
 * `packages/donnees/repliques/ouvertures.json` : les ouvertures (de 10 à 30, les mêmes pour tous les PNJ et toutes les
 * histoires) et, une fois choisies à l'oreille, les voix d'homme (`m`) et de femme (`f`) : plusieurs de chaque, un PNJ gardant
 * toujours la même (voir `voixDuPnj`). L'accord de genre s'écrit `{ravi|ravie}`.
 */
export const FichierOuvertures = z
  .object({
    voix: z.object({ m: z.array(VoixOuverture).min(1), f: z.array(VoixOuverture).min(1) }).optional(),
    ouvertures: z
      .array(z.object({ id: z.string().regex(/^[a-z0-9-]+$/), ton: z.enum(TONS_OUVERTURE), texte: z.string().min(5) }).strict())
      .min(1),
  })
  .strict()
  .refine((f) => new Set(f.ouvertures.map((o) => o.id)).size === f.ouvertures.length, { message: 'Deux ouvertures ont le même identifiant.' });
export type FichierOuvertures = z.infer<typeof FichierOuvertures>;
export type Ouverture = FichierOuvertures['ouvertures'][number];

/** Un nombre stable tiré d'un texte (le même texte donne toujours le même nombre). */
export function empreinteTexte(texte: string): number {
  let h = 2166136261;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Le genre de la voix d'un PNJ : « f » pour une femme, « m » pour un homme ; pour un PNJ de genre N, l'un des deux, toujours le même pour lui. */
export function genreDeVoix(sexe: 'F' | 'M' | 'N', idPnj: string): 'm' | 'f' {
  if (sexe === 'F') return 'f';
  if (sexe === 'M') return 'm';
  return empreinteTexte(`${idPnj}:genre`) % 2 === 0 ? 'm' : 'f';
}

export type VoixOuverture = z.infer<typeof VoixOuverture>;

const UNITES: Record<string, number> = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16 };
const DIZAINES: Record<string, number> = { vingt: 20, vingts: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60 };
const AINES: Record<string, number> = { vingtaine: 20, trentaine: 30, quarantaine: 40, cinquantaine: 50, soixantaine: 60 };

/**
 * L'âge d'un PNJ, d'après le texte libre de sa fiche (« 52 ans », « trente-cinq ans », « une cinquantaine d'années »), ou rien
 * quand il n'est pas lisible ou n'a pas de sens pour un humain (« mort depuis deux siècles », « environ 210 ans »).
 */
export function ageApproximatif(age: string | undefined): number | undefined {
  if (!age) return undefined;
  const t = age
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (/siecle|millenaire|mort|anime|immortel/.test(t) || !/\b(an|ans|annee|annees)\b|aine\b/.test(t)) return undefined;
  const chiffres = /\d+/.exec(t);
  let n = 0;
  if (chiffres) n = Number(chiffres[0]);
  else {
    const mots = t.split(/[^a-z]+/).filter(Boolean);
    for (let i = 0; i < mots.length; i++) {
      const m = mots[i]!;
      if (AINES[m]) n += AINES[m]!;
      else if (m === 'quatre' && (mots[i + 1] === 'vingt' || mots[i + 1] === 'vingts')) {
        n += 80;
        i++;
      } else if (DIZAINES[m]) n += DIZAINES[m]!;
      else if (m === 'dix' && ['sept', 'huit', 'neuf'].includes(mots[i + 1] ?? '')) {
        n += 10 + UNITES[mots[i + 1]!]!;
        i++;
      } else if (UNITES[m] && !AINES[mots[i + 1] ?? '']) n += UNITES[m]!; // « une cinquantaine » : le « une » n'ajoute rien
    }
  }
  return n > 0 && n <= 100 ? n : undefined;
}

/**
 * La voix d'un PNJ parmi celles de son genre (et de son âge, si on le connaît) : toujours la même pour lui (d'après son
 * identifiant), différente d'un PNJ à l'autre.
 */
export function voixDuPnj(voix: NonNullable<FichierOuvertures['voix']>, sexe: 'F' | 'M' | 'N', idPnj: string, age?: number): VoixOuverture {
  const toutes = voix[genreDeVoix(sexe, idPnj)];
  const convenables = age === undefined ? toutes : toutes.filter((v) => !v.ageMin || age >= v.ageMin);
  const liste = convenables.length ? convenables : toutes;
  return liste[empreinteTexte(idPnj) % liste.length]!;
}

/** La phrase, accordée au genre de la voix. */
export function texteOuverture(o: Pick<Ouverture, 'texte'>, genre: 'm' | 'f'): string {
  return accorder(o.texte, genre === 'f');
}

/**
 * Le ton de l'ouverture d'un PNJ d'après son attitude envers le groupe : hostile → méfiant, dévoué → amical ; entre les deux,
 * le plus souvent neutre, parfois un peu amical ou un peu méfiant selon le côté où penche l'attitude. `hasard` est dans [0, 1[.
 */
export function tonDeLAttitude(attitude: number, hasard: number): TonOuverture {
  if (attitude <= SEUIL_HOSTILE) return 'mefiant';
  if (attitude >= SEUIL_AMICAL) return 'amical';
  if (hasard < 0.7) return 'neutre';
  return attitude >= 0 ? 'amical' : 'mefiant';
}

/** Tire une ouverture du ton demandé, sans reprendre la précédente (sinon deux conversations de suite se ressembleraient). */
export function choisirOuverture(ouvertures: readonly Ouverture[], ton: TonOuverture, precedente: string | undefined, hasard: number): Ouverture {
  const duTon = ouvertures.filter((o) => o.ton === ton);
  const base = duTon.length ? duTon : ouvertures;
  const choix = base.length > 1 ? base.filter((o) => o.id !== precedente) : base;
  return choix[Math.min(choix.length - 1, Math.max(0, Math.floor(hasard * choix.length)))]!;
}
