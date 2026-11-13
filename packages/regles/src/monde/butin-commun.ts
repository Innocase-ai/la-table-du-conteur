// Le butin et les boutiques communs à toutes les histoires : des tables de butin par palier de niveau (`commun-consommables-p2`…) et des
// modèles de boutique (apothicaire, alchimiste, marchand de parchemins, magasin général, forgeron). Une histoire les cite par leur id au lieu de
// réécrire les mêmes listes : `butin.tables: ["commun-consommables-p2"]` pour une rencontre, `contenu.tables` d'un trésor, `boutique.tables`, ou
// `boutique.modele: "apothicaire"` pour le stock d'un marchand (son propre `stock` s'y ajoute, son `rachat` reste le sien). Les identifiants
// des tables communes commencent par `commun-` : une histoire ne peut pas en définir qui portent ce préfixe.
import { z } from 'zod';
import brut from './butin-commun.json';
import { CATEGORIES_OBJET, Id, TableButin } from './schemas';

export const BoutiqueModele = z.object({
  id: Id,
  nom: z.string().min(1),
  resume: z.string().min(1),
  stock: z.array(z.object({ objet: Id, quantite: z.number().int().positive().default(1), prix: z.number().min(0).optional() })).default([]),
  tables: z.array(Id).default([]),
  rachat: z.number().min(0).max(1).default(0.5),
  types: z.array(z.enum(CATEGORIES_OBJET)).default([]),
});
export type BoutiqueModele = z.infer<typeof BoutiqueModele>;

const Fichier = z.object({ version: z.literal(1), tables: z.array(TableButin), boutiques: z.array(BoutiqueModele) });
const fichier = Fichier.parse(brut);

export const TABLES_COMMUNES: ReadonlyMap<string, TableButin> = new Map(fichier.tables.map((t) => [t.id, t]));
export const BOUTIQUES_MODELES: ReadonlyMap<string, BoutiqueModele> = new Map(fichier.boutiques.map((b) => [b.id, b]));
export const PREFIXE_TABLE_COMMUNE = 'commun-';

/** Une table de butin : celle du monde d'abord, sinon la table commune de même id. */
export const tableDe = (dm: { tables: Map<string, TableButin> }, id: string): TableButin | undefined => dm.tables.get(id) ?? TABLES_COMMUNES.get(id);

/** La boutique d'un PNJ une fois son modèle (`boutique.modele`) mêlé à ce qu'il écrit lui-même. */
export function boutiqueComplete<B extends { stock: { objet: string; quantite: number; prix?: number }[]; tables: string[]; types: string[]; modele?: string }>(b: B): B {
  const m = b.modele ? BOUTIQUES_MODELES.get(b.modele) : undefined;
  if (!m) return b;
  return { ...b, stock: [...m.stock, ...b.stock], tables: [...m.tables, ...b.tables], types: b.types.length ? b.types : [...m.types] };
}
