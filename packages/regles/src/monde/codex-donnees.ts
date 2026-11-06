// Les questions du codex d'un monde (dossier `codex/`) : les mystères que le groupe se pose, comme dans le journal d'un
// grand jeu de rôle. Une question apparaît quand le groupe apprend de quoi elle part (`quand`), reste « en suspens » avec une
// piste, et se ferme quand le fait qui y répond est connu (`resolue`) : on lit alors ce que le groupe en conclut. Ce fichier
// ne dépend que du format du monde : le validateur et le module `codex` le lisent tous deux.
import { z } from 'zod';
import { Condition, Id, type DonneesMonde } from './schemas';

export const Question = z.object({
  id: Id,
  /** La question, comme le groupe se la pose : « Pourquoi… ? », « Qui… ? » (≤ 18 mots). */
  texte: z.string().min(1),
  /** Quand elle apparaît : un fait appris, une quête, un lieu visité… */
  quand: Condition,
  /** Quand elle est résolue : le fait (ou l'état) qui y répond. */
  resolue: Condition,
  /** En suspens : où chercher, sans rien révéler (≤ 25 mots). */
  piste: z.string().optional(),
  /** Une fois résolue : ce que le groupe en conclut (≤ 35 mots) ; peut n'être qu'une réponse partielle. */
  reponse: z.string().min(1),
});
export type Question = z.infer<typeof Question>;

const cache = new WeakMap<DonneesMonde, { questions: Question[]; erreurs: string[] }>();

/** Les questions d'un monde (dossier `codex/`), validées une fois. */
export function questionsDe(dm: DonneesMonde): { questions: Question[]; erreurs: string[] } {
  let r = cache.get(dm);
  if (!r) {
    r = { questions: [], erreurs: [] };
    for (const [i, brut] of (dm.extensions?.['codex'] ?? []).entries()) {
      const s = Question.safeParse(brut);
      if (s.success) r.questions.push(s.data);
      else r.erreurs.push(`Question « ${(brut as { id?: string })?.id ?? `#${i}`} » : ${s.error.issues[0]?.path.join('.')} — ${s.error.issues[0]?.message}`);
    }
    cache.set(dm, r);
  }
  return r;
}
