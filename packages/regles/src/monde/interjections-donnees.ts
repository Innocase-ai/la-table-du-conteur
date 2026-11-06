// Les interjections d'un monde (dossier `interjections/`) : les petites phrases qu'un personnage qui accompagne le groupe
// (escorté, ou simplement présent) lance de lui-même quand quelque chose arrive : un lieu où l'on entre, un fait appris, une
// quête, un choix, la jauge du monde qui monte. Écrites à l'avance (aucun appel au LLM, gratuit), elles donnent une présence
// et une opinion à ceux qui voyagent avec nous ; leurs effets (attitude…) font l'approbation. Ce fichier ne dépend que du
// format du monde : le validateur et le module `interjections` le lisent tous deux.
import { z } from 'zod';
import { Condition, EffetMonde, Id, type DonneesMonde } from './schemas';

export const Interjection = z.object({
  id: Id,
  /** Qui parle : un PNJ du monde, qui doit être avec le groupe (escorté ou présent) pour parler. */
  pnj: Id,
  /** Quand : cette condition devient vraie (un lieu visité, un fait appris, une quête, un choix, un palier de jauge…). */
  quand: Condition,
  /** Ce qu'il dit : une à deux phrases, dans sa voix. */
  texte: z.string().min(1),
  /** Ce que ça change (l'approbation : `{ "attitude": { "pnj": …, "delta": … } }`, un drapeau lu plus loin…). */
  effets: z.array(EffetMonde).default([]),
});
export type Interjection = z.infer<typeof Interjection>;

const cache = new WeakMap<DonneesMonde, { interjections: Interjection[]; erreurs: string[] }>();

/** Les interjections d'un monde (dossier `interjections/`), validées une fois. */
export function interjectionsDe(dm: DonneesMonde): { interjections: Interjection[]; erreurs: string[] } {
  let r = cache.get(dm);
  if (!r) {
    r = { interjections: [], erreurs: [] };
    for (const [i, brut] of (dm.extensions?.['interjections'] ?? []).entries()) {
      const s = Interjection.safeParse(brut);
      if (s.success) r.interjections.push(s.data);
      else r.erreurs.push(`Interjection « ${(brut as { id?: string })?.id ?? `#${i}`} » : ${s.error.issues[0]?.path.join('.')} — ${s.error.issues[0]?.message}`);
    }
    cache.set(dm, r);
  }
  return r;
}
