// La bibliothèque commune des assets venus des histoires : portraits de PNJ, images d'objets propres aux mondes, salutations déjà dites.
// Les tables (`packages/donnees/visuel/pnj-communs.json`, `objets-histoires.json`, `salutations-reprises.json`) sont écrites par
// `pnpm images communs extraire` ; une histoire emploie un asset par une entrée de manifeste `commun:pnj/<id>` ou `commun:objets/<id>`.
// Ce fichier ne contient que le format et la recherche du plus proche : le moteur n'en dépend pas pour jouer.
import { z } from 'zod';

export const TrancheAge = z.enum(['enfant', 'jeune', 'adulte', 'mur', 'age', 'inconnu']);
export type TrancheAge = z.infer<typeof TrancheAge>;

/** Où l'asset a été fait : on sait ainsi de quelle histoire vient un visage ou un objet. */
const Origine = z.object({ monde: z.string(), pnj: z.string().optional(), objet: z.string().optional() });

export const EntreePnjCommun = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  nom: z.string(),
  origine: Origine,
  espece: z.string(),
  sexe: z.enum(['F', 'M', 'N']),
  age: z.string().optional(),
  tranche: TrancheAge,
  metiers: z.array(z.string()),
  titre: z.string().optional(),
  apparence: z.string(),
  /** `principal` : un personnage reconnaissable de son histoire (donneur de quête, secrets…) ; `secondaire` : un visage utilisable ailleurs. */
  categorie: z.enum(['principal', 'secondaire']),
});
export type EntreePnjCommun = z.infer<typeof EntreePnjCommun>;
export const TablePnjCommuns = z.object({ version: z.literal(1), pnj: z.array(EntreePnjCommun) });

export const EntreeObjetCommun = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  nom: z.string(),
  origine: Origine,
  objetCategorie: z.string(),
  rarete: z.string(),
  magique: z.boolean(),
  resume: z.string(),
  /** `intrigue` : un objet lié à une enquête (clé, preuve, relique) ; `generique` : un objet banal réutilisable. */
  categorie: z.enum(['generique', 'intrigue']),
});
export type EntreeObjetCommun = z.infer<typeof EntreeObjetCommun>;
export const TableObjetsHistoires = z.object({ version: z.literal(1), objets: z.array(EntreeObjetCommun) });

export const EntreeSalutationCommune = z.object({
  /** La voix qui l'a dite (ex. `m-bonhomme`) : un PNJ de la même voix peut la reprendre. */
  voix: z.string(),
  genre: z.enum(['m', 'f']),
  ton: z.enum(['neutre', 'amical', 'hostile']),
  texte: z.string(),
  /** Clé du fichier `apps/jeu/src/voix/dialogues/<voix>/<cle>.mp3`. */
  cle: z.string(),
  origine: Origine,
  /** Sans nom propre ni chiffre : reprenable par un autre PNJ sans que cela se remarque. */
  generique: z.boolean(),
});
export type EntreeSalutationCommune = z.infer<typeof EntreeSalutationCommune>;
export const TableSalutationsReprises = z.object({ version: z.literal(1), salutations: z.array(EntreeSalutationCommune) });

// ---------------------------------------------------------------------------------------------------------------------------------
// La réserve de décors (F8 du 20/11/2026) : des images de LIEUX génériques, réutilisables d'un épisode à l'autre pour les pièces courantes
// d'un lieu de départ. Le catalogue vit avec les images (`apps/jeu/src/communs/lieux/catalogue.json`) ; un manifeste y renvoie par `commun:lieux/<id>`.
// Les lieux de quête, les sites de boss et tout lieu mémorable restent générés et propres à leur épisode.
// ---------------------------------------------------------------------------------------------------------------------------------

/** Les types de pièces courantes d'un lieu de départ (PRD-SAGA F8) : la réserve en garde au moins 3 variantes chacun. */
export const TYPES_DE_DECOR = ['taverne', 'chambre', 'sanctuaire', 'maison-du-chef', 'forge', 'marche', 'boutique', 'interieur-modeste', 'cave-ou-grenier', 'place-du-village'] as const;
export type TypeDeDecor = (typeof TYPES_DE_DECOR)[number];
/** Le nombre de variantes attendu par type (limite la répétition visible d'un même décor). */
export const VARIANTES_PAR_TYPE = 3;

export const EntreeLieuCommun = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  type: z.enum(TYPES_DE_DECOR),
  /** Ce qu'on y voit, en une phrase (sans nom propre ni personnage) : sert à choisir, et au registre des décors. */
  description: z.string().min(1),
  /** Le ton de l'image (lumière, saison, état) : à varier d'un épisode à l'autre. */
  ambiance: z.string().min(1),
  interieur: z.boolean(),
  /** D'où vient l'image : une histoire existante (sélection manuelle) ou le lot générique de la réserve. */
  origine: z.union([z.object({ monde: z.string(), lieu: z.string() }), z.object({ lot: z.string() })]),
});
export type EntreeLieuCommun = z.infer<typeof EntreeLieuCommun>;
export const TableLieuxCommuns = z.object({ version: z.literal(1), lieux: z.array(EntreeLieuCommun) });

/** Un décor encore à générer (le lot générique, après accord sur la dépense) : mêmes champs que le catalogue, plus le prompt. */
export const EntreeLieuAGenerer = EntreeLieuCommun.omit({ origine: true }).extend({ prompt: z.string().min(1) });
export type EntreeLieuAGenerer = z.infer<typeof EntreeLieuAGenerer>;
export const TableLieuxAGenerer = z.object({ version: z.literal(1), lot: z.string(), lieux: z.array(EntreeLieuAGenerer) });

/** Les types qui n'ont pas encore leurs 3 variantes : ce qui est dans le catalogue, ce qui est prévu au lot à générer, ce qui manque encore. */
export function typesIncomplets(catalogue: readonly { type: string }[], aGenerer: readonly { type: string }[] = []): { type: string; presentes: number; prevues: number; manque: number }[] {
  return TYPES_DE_DECOR.map((type) => {
    const presentes = catalogue.filter((e) => e.type === type).length;
    const prevues = aGenerer.filter((e) => e.type === type).length;
    return { type, presentes, prevues, manque: Math.max(0, VARIANTES_PAR_TYPE - presentes) };
  }).filter((x) => x.manque > 0);
}

/** Les préfixes d'une référence commune dans un manifeste. */
export const PREFIXE_COMMUN = 'commun:';
export type GroupeCommun = 'pnj' | 'objets' | 'lieux';

/** `commun:pnj/garde-f-2` → { groupe: 'pnj', id: 'garde-f-2' } ; autre chose : undefined. */
export function lireReferenceCommune(fichier: string): { groupe: GroupeCommun; id: string } | undefined {
  const m = /^commun:(pnj|objets|lieux)\/([a-z0-9-]+)$/.exec(fichier);
  return m ? { groupe: m[1] as GroupeCommun, id: m[2]! } : undefined;
}
export const referenceCommune = (groupe: GroupeCommun, id: string) => `${PREFIXE_COMMUN}${groupe}/${id}`;

const ORDRE_AGE: TrancheAge[] = ['enfant', 'jeune', 'adulte', 'mur', 'age'];

export interface DemandePortrait {
  espece: string;
  sexe: 'F' | 'M' | 'N';
  tranche: TrancheAge;
  metiers: string[];
}

/** Les portraits communs les plus proches d'un PNJ : même espèce et même sexe d'abord, puis l'âge et le métier ; les visages de personnages
 *  principaux passent après les génériques. */
export function proposerPortraits(table: readonly EntreePnjCommun[], demande: DemandePortrait, exclus: ReadonlySet<string> = new Set(), n = 3): { entree: EntreePnjCommun; score: number }[] {
  const evaluer = (e: EntreePnjCommun) => {
    let s = 0;
    s += e.espece === demande.espece ? 40 : -40;
    s += e.sexe === demande.sexe || demande.sexe === 'N' || e.sexe === 'N' ? 30 : -30;
    if (e.tranche !== 'inconnu' && demande.tranche !== 'inconnu') {
      const ecart = Math.abs(ORDRE_AGE.indexOf(e.tranche) - ORDRE_AGE.indexOf(demande.tranche));
      s += ecart === 0 ? 15 : ecart === 1 ? 7 : -10 * ecart;
    }
    s += 10 * e.metiers.filter((m) => demande.metiers.includes(m)).length;
    s += e.categorie === 'secondaire' ? 15 : 0;
    return s;
  };
  return table
    .filter((e) => !exclus.has(e.id))
    .map((entree) => ({ entree, score: evaluer(entree) }))
    .sort((a, b) => b.score - a.score || a.entree.id.localeCompare(b.entree.id))
    .slice(0, n);
}

/** Les objets communs d'une même catégorie, génériques d'abord (rareté proche en premier). */
export function proposerObjets(table: readonly EntreeObjetCommun[], demande: { categorie: string; rarete: string; magique: boolean }, exclus: ReadonlySet<string> = new Set(), n = 3): { entree: EntreeObjetCommun; score: number }[] {
  return table
    .filter((e) => !exclus.has(e.id))
    .map((entree) => ({
      entree,
      score: (entree.objetCategorie === demande.categorie ? 50 : 0) + (entree.rarete === demande.rarete ? 20 : 0) + (entree.magique === demande.magique ? 10 : 0) + (entree.categorie === 'generique' ? 10 : 0),
    }))
    .filter((x) => x.score >= 50)
    .sort((a, b) => b.score - a.score || a.entree.id.localeCompare(b.entree.id))
    .slice(0, n);
}
