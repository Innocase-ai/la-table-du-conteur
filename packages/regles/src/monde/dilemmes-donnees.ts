// Les dilemmes d'un monde (dossier `dilemmes/`) : des choix difficiles écrits comme des données.
// Un dilemme s'ouvre quand sa condition devient vraie ; chaque option annonce ce qu'elle coûte et ce qu'elle rapporte,
// l'abstention (ne pas trancher) a elle aussi un prix, et un dilemme peut laisser des échos plusieurs jours plus tard.
// Ce fichier ne dépend que du format du monde : le validateur du monde et le module `dilemmes` le lisent tous deux.
import { z } from 'zod';
import { Competence } from '../schemas';
import { Condition, EffetMonde, Id, type DonneesMonde } from './schemas';

const Texte = z.string().min(1);
const Effets = z.array(EffetMonde);

export const OptionDilemme = z
  .object({
    id: Id,
    /** La réplique ou l'acte du joueur, à la première personne (« Je laisse partir le déserteur. »). */
    libelle: Texte,
    /** Le ton de l'option, affiché entre crochets (« Clémence », « Fermeté », « Ruse »). */
    ton: z.string().optional(),
    /** Ce que ça coûte, dit au joueur avant qu'il tranche : au moins une ligne, jamais « aucun coût ». */
    couts: z.array(Texte).min(1),
    /** Ce que ça rapporte, dit au joueur avant qu'il tranche. */
    gains: z.array(Texte).min(1),
    /** Une option réservée (un objet, un fait, la confiance d'un PNJ) n'apparaît que si cette condition est vraie. */
    condition: Condition.optional(),
    /** Ce que le groupe doit posséder pour tenter l'option (par exemple de l'argent) : sans cela, l'option s'affiche mais est grisée, avec `requisTexte`. */
    requis: Condition.optional(),
    requisTexte: z.string().optional(),
    /** Une option incertaine : un test du groupe ; les effets de `echec` s'appliquent s'il est raté (l'histoire avance toujours). */
    jet: z.object({ competence: Competence, dd: z.number().int().min(5).max(30) }).optional(),
    effets: Effets.default([]),
    echec: Effets.optional(),
    /** Une phrase du « ce qu'il est advenu » de la fin de l'histoire, si cette option a été choisie. */
    epilogue: Texte.optional(),
  })
  .refine((o) => !o.jet || !!o.echec, { message: 'une option avec un jet doit dire ce qui se passe en cas d’échec (`echec`) : l’histoire ne s’arrête jamais sur un jet raté', path: ['echec'] });
export type OptionDilemme = z.infer<typeof OptionDilemme>;

export const Echo = z.object({
  /** L'option dont c'est la suite (`abstention` pour le choix de ne pas trancher). */
  si: Id,
  /** Nombre de jours après le choix. */
  apres: z.number().int().min(1).max(60),
  /** Ce que le joueur lit quand l'écho survient. */
  annonce: Texte.optional(),
  effets: Effets.default([]),
});
export type Echo = z.infer<typeof Echo>;

export const Dilemme = z.object({
  id: Id,
  titre: Texte,
  /** La situation, écrite pour le joueur ; elle s'affiche à l'ouverture du dilemme. */
  situation: Texte,
  /** Le dilemme s'ouvre dès que cette condition est vraie (un fait appris, une quête, un lieu visité, un drapeau…). */
  quand: Condition,
  /** S'il est donné, le choix ne se fait que dans ce lieu. */
  lieu: Id.optional(),
  /** Nombre de jours avant que l'abstention ne s'applique d'elle-même : le temps presse. Sans délai, le dilemme attend. */
  delai: z.number().int().min(1).max(60).optional(),
  options: z.array(OptionDilemme).min(2).max(4),
  /** Ne pas trancher : un coût aussi. */
  abstention: z.object({ libelle: Texte.default('Je ne tranche pas.'), couts: z.array(Texte).min(1), effets: Effets.default([]), epilogue: Texte.optional() }),
  /** Les conséquences plus tardives : un choix important laisse une trace dans la suite de l'histoire. */
  echos: z.array(Echo).default([]),
});
export type Dilemme = z.infer<typeof Dilemme>;

const cache = new WeakMap<DonneesMonde, { dilemmes: Dilemme[]; erreurs: string[] }>();

/** Les dilemmes d'un monde (dossier `dilemmes/`), validés une fois. */
export function dilemmesDe(dm: DonneesMonde): { dilemmes: Dilemme[]; erreurs: string[] } {
  let r = cache.get(dm);
  if (!r) {
    r = { dilemmes: [], erreurs: [] };
    for (const [i, brut] of (dm.extensions?.['dilemmes'] ?? []).entries()) {
      const s = Dilemme.safeParse(brut);
      if (s.success) r.dilemmes.push(s.data);
      else r.erreurs.push(`Dilemme « ${(brut as { id?: string })?.id ?? `#${i}`} » : ${s.error.issues[0]?.path.join('.')} — ${s.error.issues[0]?.message}`);
    }
    cache.set(dm, r);
  }
  return r;
}

/** Les drapeaux que pose un choix : `choix-<dilemme>` (trancher, quoi que ce soit) et `choix-<dilemme>-<option>`. */
export const drapeauxChoix = (dilemme: string, option: string): string[] => [`choix-${dilemme}`, `choix-${dilemme}-${option}`];

/** Tous les drapeaux qu'un monde peut poser par ses dilemmes (pour le validateur). */
export function drapeauxDesDilemmes(dm: DonneesMonde): string[] {
  return dilemmesDe(dm).dilemmes.flatMap((d) => [...d.options.map((o) => o.id), 'abstention'].flatMap((o) => drapeauxChoix(d.id, o)));
}

/** Tous les effets qu'un dilemme peut produire (options, échecs, abstention, échos). */
export function effetsDuDilemme(d: Dilemme): EffetMonde[] {
  return [...d.options.flatMap((o) => [...o.effets, ...(o.echec ?? [])]), ...d.abstention.effets, ...d.echos.flatMap((e) => e.effets)];
}
