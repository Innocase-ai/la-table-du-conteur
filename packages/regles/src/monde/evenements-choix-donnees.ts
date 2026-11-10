// Les événements à choix illustrés d'un monde (dossier `evenements-choix/`) : un tableau (une grande image, une courte
// narration, des choix, un résultat). Des choix généraux, et des choix réservés à l'origine d'un héros du groupe (condition
// `heros` : espèce, classe, historique), préfixés de cette origine à l'écran : « (Nain) « Laissez-moi goûter la pierre. » ».
// Ce fichier ne dépend que du format du monde : le validateur du monde et le module `evenementsChoix` le lisent tous deux.
import { z } from 'zod';
import { Competence } from '../schemas';
import { Condition, EffetMonde, Id, type DonneesMonde } from './schemas';

const Texte = z.string().min(1);
const Effets = z.array(EffetMonde);

export const ChoixEvenement = z
  .object({
    id: Id,
    /** Un choix général est un geste à l'impératif (« Buvez à la source. ») ; un choix d'origine est une réplique du héros entre guillemets. */
    libelle: Texte,
    /** Remplace l'origine tirée de la condition `heros` (« Nain », « Magicien ») : le préfixe entre parenthèses. */
    origine: z.string().optional(),
    /** Le choix n'apparaît que si cette condition est vraie ; avec `heros`, un héros vivant du groupe doit correspondre, et c'est lui qui agit. */
    condition: Condition.optional(),
    /** Ce que le groupe doit posséder pour tenter le choix : sans cela, il s'affiche grisé avec `requisTexte`. */
    requis: Condition.optional(),
    requisTexte: z.string().optional(),
    /** Un choix incertain : un test du héros qui agit (le meilleur du groupe pour un choix général). */
    jet: z.object({ competence: Competence, dd: z.number().int().min(5).max(30) }).optional(),
    effets: Effets.default([]),
    /** Ce qui arrive si le jet est raté (obligatoire avec un `jet` : l'histoire ne s'arrête jamais sur un échec). */
    echec: Effets.optional(),
    /** Le texte du résultat (50 à 80 mots) ; avec un `jet`, c'est le texte de la réussite. */
    resultat: Texte,
    resultatEchec: Texte.optional(),
  })
  .refine((c) => !c.jet || (!!c.echec && !!c.resultatEchec), { message: 'un choix avec un jet doit dire ce qui se passe en cas d’échec (`echec` et `resultatEchec`) : l’histoire ne s’arrête jamais sur un jet raté', path: ['echec'] });
export type ChoixEvenement = z.infer<typeof ChoixEvenement>;

export const EvenementChoix = z.object({
  id: Id,
  titre: Texte,
  /** Le lieu où il se joue. */
  lieu: Id,
  /** Condition facultative (un fait appris, une quête, un drapeau, `rencontre`, `parle`, `temoin`, `heros`…). */
  quand: Condition.optional(),
  /** `entree` : l'écran s'ouvre tout seul dès que le groupe est là et que `quand` est vrai ; `bouton` : une action « Regarder de plus près » du panneau Ici. */
  ouverture: z.enum(['entree', 'bouton']).default('entree'),
  /** L'illustration : une image déjà au manifeste du monde (par défaut, celle du lieu). */
  image: z.object({ groupe: z.enum(['lieux', 'pnj', 'monstres', 'objets']), id: Id }).optional(),
  /** Prompt d'une illustration propre à l'événement, pour plus tard (sans personnage ni héros pré-tiré). */
  visuel: z.string().optional(),
  /** La narration d'ouverture (70 à 110 mots), au joueur, sans secret. */
  narration: Texte,
  /** La dernière variante dont la condition est vraie remplace la narration de base. */
  variantes: z.array(z.object({ condition: Condition, narration: Texte })).default([]),
  /** Les choix, 2 à 6 : « Partir » s'ajoute toujours. */
  choix: z.array(ChoixEvenement).min(2).max(6),
  /** Le libellé du bouton de sortie. */
  partir: Texte.default('Partir.'),
});
export type EvenementChoix = z.infer<typeof EvenementChoix>;

const cache = new WeakMap<DonneesMonde, { evenements: EvenementChoix[]; erreurs: string[] }>();

/** Les événements à choix d'un monde (dossier `evenements-choix/`), validés une fois. */
export function evenementsChoixDe(dm: DonneesMonde): { evenements: EvenementChoix[]; erreurs: string[] } {
  let r = cache.get(dm);
  if (!r) {
    r = { evenements: [], erreurs: [] };
    for (const [i, brut] of (dm.extensions?.['evenements-choix'] ?? []).entries()) {
      const s = EvenementChoix.safeParse(brut);
      if (s.success) r.evenements.push(s.data);
      else r.erreurs.push(`Événement à choix « ${(brut as { id?: string })?.id ?? `#${i}`} » : ${s.error.issues[0]?.path.join('.')} — ${s.error.issues[0]?.message}`);
    }
    cache.set(dm, r);
  }
  return r;
}

/** Les drapeaux que pose un choix : `evt-<événement>` (quel que soit le choix) et `evt-<événement>-<choix>`. */
export const drapeauxEvenement = (evenement: string, choix: string): string[] => [`evt-${evenement}`, `evt-${evenement}-${choix}`];

/** Tous les drapeaux qu'un monde peut poser par ses événements à choix (pour le validateur). */
export function drapeauxDesEvenements(dm: DonneesMonde): string[] {
  return evenementsChoixDe(dm).evenements.flatMap((e) => e.choix.flatMap((c) => drapeauxEvenement(e.id, c.id)));
}

/** Tous les effets qu'un événement peut produire (réussites et échecs de chaque choix). */
export const effetsDeLEvenement = (e: EvenementChoix): EffetMonde[] => e.choix.flatMap((c) => [...c.effets, ...(c.echec ?? [])]);

type Heros = { classe?: string; espece?: string; historique?: string };

/** L'origine de héros qu'une condition exige, au niveau supérieur ou dans un `et` (sinon rien : un choix général). */
export function herosDeCondition(c: Condition | undefined): Heros | undefined {
  if (!c) return undefined;
  if ('heros' in c) return c.heros;
  if ('et' in c) return c.et.map(herosDeCondition).find(Boolean);
  return undefined;
}
