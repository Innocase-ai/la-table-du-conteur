// Les examens d'un monde (dossier `examens/`) : les détails d'un lieu qu'on peut regarder de près (une inscription, un
// objet, une trace, une tapisserie, une carte au mur) et le texte, écrit à l'avance, que cela révèle. C'est le « lore »
// du décor : le conteur ne l'invente jamais, il appelle la commande `examiner` et le jeu donne le texte de l'auteur.
// Une variante change ce qu'on lit selon ce que le groupe sait déjà (un fait appris, un drapeau, un choix) : la même
// inscription ne dit pas la même chose avant et après. Ce fichier ne dépend que du format du monde : le validateur et
// le module `examens` le lisent tous deux.
import { z } from 'zod';
import { Condition, EffetMonde, Id, type DonneesMonde } from './schemas';

export const ExamenVariante = z.object({
  id: Id,
  /** Quand cette lecture remplace la lecture de base : ce que le groupe sait, a fait, ou est. */
  condition: Condition,
  texte: z.string().min(1),
  effets: z.array(EffetMonde).default([]),
});

export const Examen = z.object({
  id: Id,
  lieu: Id,
  /** Ce que le joueur voit sur le bouton : « La grille des caveaux ». */
  nom: z.string().min(1),
  /** Facultatif : une phrase sous le bouton, pour donner envie sans rien révéler. */
  apercu: z.string().optional(),
  /** Ce qu'on voit, lit ou comprend en regardant de près : 40 à 110 mots, des détails concrets. */
  texte: z.string().min(1),
  /** Visible seulement si... (le détail n'apparaît qu'après un fait, une quête…). Sans condition : toujours visible. */
  visible: Condition.optional(),
  /** Appliqués la première fois qu'on lit le texte de base (un fait appris, un drapeau, de l'attitude…). */
  effets: z.array(EffetMonde).default([]),
  /** Lectures plus fines : la dernière dont la condition est vraie remplace le texte de base ; ses effets s'appliquent une fois. */
  variantes: z.array(ExamenVariante).default([]),
});
export type Examen = z.infer<typeof Examen>;

const cache = new WeakMap<DonneesMonde, { examens: Examen[]; erreurs: string[] }>();

/** Les examens d'un monde (dossier `examens/`), validés une fois. */
export function examensDe(dm: DonneesMonde): { examens: Examen[]; erreurs: string[] } {
  let r = cache.get(dm);
  if (!r) {
    r = { examens: [], erreurs: [] };
    for (const [i, brut] of (dm.extensions?.['examens'] ?? []).entries()) {
      const s = Examen.safeParse(brut);
      if (s.success) r.examens.push(s.data);
      else r.erreurs.push(`Examen « ${(brut as { id?: string })?.id ?? `#${i}`} » : ${s.error.issues[0]?.path.join('.')} — ${s.error.issues[0]?.message}`);
    }
    cache.set(dm, r);
  }
  return r;
}

/** L'identifiant de la lecture de base dans l'état (une variante porte son propre id). */
export const LECTURE_DE_BASE = 'base';
