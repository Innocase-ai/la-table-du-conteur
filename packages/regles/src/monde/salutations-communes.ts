// Les salutations communes : une bibliothèque de salutations génériques, partagée par TOUTES les histoires, par registre de PNJ
// (aubergiste ou marchand, garde, villageois…) et par ton (neutre, amical, hostile). Un PNJ secondaire n'écrit aucun texte : sa fiche dit
// seulement `salutations: { commune: "garde" }`, et le chargement du monde (avant la validation) y met les trois salutations, tirées
// de la bibliothèque, toujours les mêmes pour ce PNJ. Chaque ligne est dite une fois par chacune des 12 voix du jeu (`pnpm salutations
// communes`) : aucune histoire n'a à écrire ni à faire dire ses PNJ secondaires. Les PNJ importants gardent leurs propres textes (et
// leurs propres voix si on le veut). Un PNJ peut aussi mélanger : un texte à lui pour un ton, la bibliothèque pour les autres.
//
// Les lignes sont **neutres en genre** (aucun accord au masculin ou au féminin) et sans lieu, nom, moment ni saison : elles vont à
// n'importe quel PNJ du registre, dans n'importe quelle histoire.
import { z } from 'zod';
import bibliothequeBrute from './salutations-communes.json';

export const TONS_SALUTATION = ['neutre', 'amical', 'hostile'] as const;
export type TonSalutation = (typeof TONS_SALUTATION)[number];

const Lignes = z.array(z.string().regex(/^« [\s\S]{8,} »$/, 'une ligne est une parole entre « » (au moins quelques mots)')).min(1);

export const RegistreSalutations = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    /** Le nom du registre, pour l'auteur. */
    libelle: z.string().min(2),
    /** Les sortes de PNJ qui y vont (pour l'auteur : « aubergiste, marchand, forgeron… »). */
    pour: z.string().min(2),
    lignes: z.object({ neutre: Lignes, amical: Lignes, hostile: Lignes }).strict(),
  })
  .strict();
export type RegistreSalutations = z.infer<typeof RegistreSalutations>;

export const FichierSalutationsCommunes = z
  .object({ registres: z.array(RegistreSalutations) })
  .strict()
  .refine((f) => new Set(f.registres.map((r) => r.id)).size === f.registres.length, { message: 'Deux registres ont le même identifiant.' });
export type FichierSalutationsCommunes = z.infer<typeof FichierSalutationsCommunes>;

/** La bibliothèque livrée avec le moteur (`salutations-communes.json`). */
export const SALUTATIONS_COMMUNES: FichierSalutationsCommunes = FichierSalutationsCommunes.parse(bibliothequeBrute);

/** Un nombre stable tiré d'un texte (FNV-1a) : le même PNJ et le même ton donnent toujours la même ligne. */
export function empreinte(texte: string): number {
  let h = 2166136261;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** La ligne d'un registre pour un PNJ et un ton : stable (identifiant du PNJ), répartie sur les lignes du registre. */
export function ligneCommune(registre: RegistreSalutations, ton: TonSalutation, idPnj: string): string {
  const lignes = registre.lignes[ton];
  return lignes[empreinte(`${idPnj}:${ton}`) % lignes.length]!;
}

/** Texte posé quand le registre demandé n'existe pas : la validation de la fiche le signale (`registreInconnu`). */
export const REGISTRE_INCONNU = '(registre commun inconnu)';

/** Les registres connus, séparés par une virgule (pour les messages). */
export const nomsDesRegistres = (b: FichierSalutationsCommunes = SALUTATIONS_COMMUNES): string => b.registres.map((r) => r.id).join(', ') || 'aucun';

/**
 * Avant la validation d'une fiche de PNJ : si `salutations.commune` nomme un registre, les salutations (neutre, amicale, hostile) que le PNJ
 * n'a pas écrites lui-même sont prises dans la bibliothèque. Une fiche sans `commune` ne change pas. Ne modifie jamais l'objet reçu.
 */
export function resoudreSalutationsCommunes(brut: unknown, bibliotheque: FichierSalutationsCommunes = SALUTATIONS_COMMUNES): unknown {
  if (!brut || typeof brut !== 'object') return brut;
  const fiche = brut as { id?: unknown; salutations?: unknown };
  const s = fiche.salutations as { commune?: unknown } | undefined;
  if (!s || typeof s !== 'object' || typeof s.commune !== 'string' || typeof fiche.id !== 'string') return brut;
  const registre = bibliotheque.registres.find((r) => r.id === s.commune);
  const propres = s as Record<string, unknown>;
  const salutations: Record<string, unknown> = { ...propres };
  for (const ton of TONS_SALUTATION) {
    if (typeof propres[ton] === 'string' && (propres[ton] as string).trim()) continue;
    if (registre) salutations[ton] = ligneCommune(registre, ton, fiche.id);
    else if (ton === 'neutre') salutations[ton] = REGISTRE_INCONNU;
  }
  return { ...(brut as object), salutations };
}
