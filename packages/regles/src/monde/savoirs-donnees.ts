// Le savoir des PNJ (dossier `savoirs/` d'un monde) : ce qu'un personnage sait, croit, ressent et se rappelle, pour qu'il
// puisse parler librement dans le jeu sans jamais rien inventer. Le LLM du jeu s'appuie sur cette fiche ; le jeu vérifie
// chaque réplique (module `savoirs`) : un souvenir ou un fait qui n'est pas dans la fiche ne peut pas être cité.
// Ce fichier ne dépend que du format du monde : le validateur et le module le lisent tous deux.
import { z } from 'zod';
import { Condition, Id, type DonneesMonde } from './schemas';

const Texte = z.string().min(1);

/** Un souvenir, une anecdote, une opinion, une manie : de la couleur, librement utilisable, qui ne change rien à l'intrigue. */
export const Couleur = z.object({
  id: Id,
  texte: Texte,
  /** Une confidence intime se gagne : confiance et/ou condition, comme pour un fait ; sans accès, elle est libre. */
  acces: z.object({ attitudeMin: z.number().optional(), condition: Condition.optional() }).default({}),
  /** Ce qu'il laisse entendre tant que la confidence reste fermée. */
  evasif: z.string().optional(),
});
export type Couleur = z.infer<typeof Couleur>;

/** Ce que le PNJ pense d'une autre personne (un PNJ du monde, ou quelqu'un hors scène : `qui`). */
export const LienPnj = z
  .object({ pnj: Id.optional(), qui: z.string().min(1).optional(), nature: Texte, opinion: Texte })
  .refine((l) => !!l.pnj !== !!l.qui, { message: 'un lien désigne soit un `pnj` du monde, soit `qui` (quelqu’un hors scène)' });
export type LienPnj = z.infer<typeof LienPnj>;

/** Un fait du canon que le PNJ connaît, dit à sa façon, et à quelle condition il en parle. */
export const Sait = z.object({
  id: Id,
  /** Le fait du canon (`faits/`). */
  fait: Id,
  /** Comment le PNJ le dit ou le comprend (sa version, qui peut être partielle). */
  version: Texte,
  /** À partir de quand il en parle : confiance et/ou condition ; sans accès, il en parle librement. */
  acces: z.object({ attitudeMin: z.number().optional(), condition: Condition.optional() }).default({}),
  /** Ce qu'il laisse entendre tant que l'accès est fermé (esquive, silence gêné). */
  evasif: z.string().optional(),
  /** Mots qui trahissent ce fait : interdits dans toute réplique tant que le groupe ne le connaît pas. */
  tabou: z.array(z.string().min(2)).default([]),
});
export type Sait = z.infer<typeof Sait>;

export const Savoir = z.object({
  pnj: Id,
  /** Le passé du personnage, 80 à 150 mots : pour nourrir ses répliques, jamais lu tel quel au joueur. */
  passe: Texte,
  liens: z.array(LienPnj).default([]),
  couleur: z.array(Couleur).default([]),
  sait: z.array(Sait).default([]),
});
export type Savoir = z.infer<typeof Savoir>;

const cache = new WeakMap<DonneesMonde, { savoirs: Savoir[]; erreurs: string[] }>();

/** Les savoirs d'un monde (dossier `savoirs/`), validés une fois. */
export function savoirsDe(dm: DonneesMonde): { savoirs: Savoir[]; erreurs: string[] } {
  let r = cache.get(dm);
  if (!r) {
    r = { savoirs: [], erreurs: [] };
    for (const [i, brut] of (dm.extensions?.['savoirs'] ?? []).entries()) {
      const s = Savoir.safeParse(brut);
      if (s.success) r.savoirs.push(s.data);
      else r.erreurs.push(`Savoir « ${(brut as { pnj?: string })?.pnj ?? `#${i}`} » : ${s.error.issues[0]?.path.join('.')} — ${s.error.issues[0]?.message}`);
    }
    cache.set(dm, r);
  }
  return r;
}

export const savoirDe = (dm: DonneesMonde, pnj: string): Savoir | undefined => savoirsDe(dm).savoirs.find((s) => s.pnj === pnj);

/** Un texte sans accents ni majuscules, pour chercher des mots tabous. */
export const normaliser = (t: string): string =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Le nombre de mots d'un texte. */
export const nbMots = (t: string): number => t.split(/\s+/).filter(Boolean).length;
