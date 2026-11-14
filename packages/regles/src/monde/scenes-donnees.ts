// Format des scènes narrées (dossier `scenes/`) : le schéma vit ici, avec ceux des autres dossiers de données, pour que le chargeur
// d'un monde puisse le valider sans dépendre du module (`modules/scenes.ts`, qui le réexporte).
import { z } from 'zod';

const Id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);

export const PlanScene = z.object({
  /** Image du monde montrée pendant le plan (son groupe dans le manifeste et l'id de l'élément). */
  image: z.object({ groupe: z.enum(['lieux', 'pnj', 'monstres', 'objets']), id: Id }).optional(),
  /** Mouvement de caméra sur l'image fixe. */
  mouvement: z.enum(['approche', 'recul', 'gauche', 'droite', 'fixe']).default('approche'),
  /** Le texte dit par la voix et affiché à l'écran. */
  texte: z.string().min(1),
  /** Durée minimale du plan en secondes (sans voix : le temps de lecture). */
  duree: z.number().positive().optional(),
});
export type PlanScene = z.infer<typeof PlanScene>;

export const DeclencheurScene = z.union([
  z.object({ debut: z.literal(true) }).strict(),
  z.object({ lieu: Id }).strict(),
  z.object({ quete: Id, statut: z.enum(['active', 'terminee', 'echouee']).default('active') }).strict(),
  z.object({ fait: Id }).strict(),
  z.object({ fin: Id }).strict(),
]);

export const SceneNarree = z.object({
  id: Id,
  nom: z.string().min(1),
  declencheur: DeclencheurScene,
  /** Une scène unique ne se joue qu'une fois (on peut la revoir depuis le journal). */
  unique: z.boolean().default(true),
  /**
   * `plans` : un plan à la fois, le joueur avance (« Suivant »). `film` : la scène se joue d'une traite, comme une
   * vidéo : carton de titre, images en fondu enchaîné, texte qui défile au rythme de la voix (prologue, épilogues).
   */
  presentation: z.enum(['plans', 'film']).default('plans'),
  plans: z.array(PlanScene).min(1),
});
export type SceneNarree = z.infer<typeof SceneNarree>;
