// Le groupe de 4 ou 6 personnages créés par le joueur : format de sauvegarde, validation et conseils de composition.
import { z } from 'zod';
import type { Donnees } from '../donnees';
import { calculerFiche, type ChoixPersonnage, type Fiche } from '../fiche';
import { CARACTERISTIQUES, Competence } from '../schemas';
import { manquants, type Manquant } from './exigences';
import { creationRapide } from './recommandations';

/**
 * Un groupe a 4 ou 6 emplacements (le joueur choisit) et compte de 1 à 6 personnages : on peut en laisser de vides. Les rencontres
 * des histoires sont écrites pour 6 et adaptées au nombre de héros (`adapterRencontre`).
 */
export const TAILLE_GROUPE = 6;
export const TAILLE_GROUPE_MIN = 1;
/** Les tailles de groupe proposées : le nombre d'emplacements. */
export const TAILLES_GROUPE = [4, 6] as const;
export type TailleGroupe = (typeof TAILLES_GROUPE)[number];

export const ALIGNEMENTS = [
  { id: 'LB', nom: 'Loyal bon' },
  { id: 'NB', nom: 'Neutre bon' },
  { id: 'CB', nom: 'Chaotique bon' },
  { id: 'LN', nom: 'Loyal neutre' },
  { id: 'N', nom: 'Neutre' },
  { id: 'CN', nom: 'Chaotique neutre' },
  { id: 'LM', nom: 'Loyal mauvais' },
  { id: 'NM', nom: 'Neutre mauvais' },
  { id: 'CM', nom: 'Chaotique mauvais' },
] as const;
export type Alignement = (typeof ALIGNEMENTS)[number]['id'];

const valeurs = z.object({ for: z.number().int(), dex: z.number().int(), con: z.number().int(), int: z.number().int(), sag: z.number().int(), cha: z.number().int() });
const chaines = z.array(z.string());

export const ChoixPersonnageSchema = z.object({
  nom: z.string(),
  classe: z.string(),
  niveau: z.number().int().min(1).max(20),
  espece: z.string(),
  historique: z.string(),
  taille: z.enum(['P', 'M']).optional(),
  methode: z.enum(['standard', 'achat', 'tirage']),
  valeursBase: valeurs,
  bonusHistorique: valeurs.partial(),
  ameliorations: z.array(valeurs.partial()).optional(),
  dons: chaines.optional(),
  faveurCaracteristique: z.array(z.enum(CARACTERISTIQUES)).optional(),
  competencesClasse: z.array(Competence),
  competencesSupplementaires: z.array(Competence).optional(),
  expertises: z.array(Competence).optional(),
  armure: z.string().optional(),
  bouclier: z.boolean().optional(),
  choix: z.record(chaines).optional(),
  sortsMineurs: chaines.optional(),
  sortsPrepares: chaines.optional(),
  sortsInitie: z.object({ mineurs: chaines, niveau1: chaines }).optional(),
  bottes: chaines.optional(),
  equipementClasse: z.string().optional(),
  equipementHistorique: z.string().optional(),
});
// Vérifie à la compilation que le schéma décrit bien ChoixPersonnage.
const _verif: z.infer<typeof ChoixPersonnageSchema> extends ChoixPersonnage ? true : never = true;
void _verif;

export const PersonnageCree = z.object({
  id: z.string().min(1),
  sexe: z.enum(['F', 'M']),
  alignement: z.enum(['LB', 'NB', 'CB', 'LN', 'N', 'CN', 'LM', 'NM', 'CM']),
  /** Identifiant d'un portrait de la galerie (`elfe-f-2`). */
  portrait: z.string().min(1),
  /** Une ligne facultative de caractère, lue plus tard par le MJ. */
  caractere: z.string().max(200).optional(),
  choix: ChoixPersonnageSchema,
});
export type PersonnageCree = z.infer<typeof PersonnageCree>;

export const Groupe = z.object({
  version: z.literal(1),
  /** Niveau de départ de tout le groupe (1 à 5). */
  niveau: z.number().int().min(1).max(20),
  emplacements: z.array(PersonnageCree.nullable()).refine((e) => (TAILLES_GROUPE as readonly number[]).includes(e.length), { message: 'Un groupe compte 4 ou 6 emplacements.' }),
});
export type Groupe = z.infer<typeof Groupe>;

export function groupeVide(niveau = 1, taille: TailleGroupe = TAILLE_GROUPE): Groupe {
  return { version: 1, niveau, emplacements: Array.from({ length: taille }, () => null) };
}

/** Les héros qui seraient retirés en passant à `taille` emplacements (ceux qui occupent les emplacements en trop). */
export function herosRetires(groupe: Groupe, taille: TailleGroupe): PersonnageCree[] {
  return groupe.emplacements.slice(taille).filter((p): p is PersonnageCree => !!p);
}

/** Le même groupe avec `taille` emplacements : des emplacements vides en plus, ou les derniers retirés (voir `herosRetires`). */
export function redimensionner(groupe: Groupe, taille: TailleGroupe): Groupe {
  const emplacements = groupe.emplacements.slice(0, taille);
  while (emplacements.length < taille) emplacements.push(null);
  return { ...groupe, emplacements };
}

export function nouvelId(): string {
  const c = globalThis.crypto;
  return c?.randomUUID ? c.randomUUID() : `p-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function serialiser(groupe: Groupe): string {
  return JSON.stringify(groupe, null, 2);
}

export type LectureGroupe = { ok: true; groupe: Groupe } | { ok: false; erreur: string };

export function lireGroupe(json: string): LectureGroupe {
  let brut: unknown;
  try {
    brut = JSON.parse(json);
  } catch {
    return { ok: false, erreur: "Ce fichier n'est pas un groupe valide (JSON illisible)." };
  }
  const r = Groupe.safeParse(brut);
  if (r.success) return { ok: true, groupe: r.data };
  const champ = r.error.issues[0]?.path.join('.');
  return { ok: false, erreur: `Ce fichier n'a pas le format d'un groupe${champ ? ` (champ « ${champ} » invalide)` : ''}.` };
}

export interface BilanPersonnage {
  fiche?: Fiche;
  erreurs: string[];
  manquants: Manquant[];
}

/** Calcule la fiche d'un personnage créé et signale ce qui manque ou ne tient pas. */
export function bilanPersonnage(p: PersonnageCree, donnees: Donnees): BilanPersonnage {
  const r = calculerFiche(p.choix, donnees);
  const manque = manquants(p.choix, donnees, { nom: p.choix.nom, portrait: p.portrait, alignement: p.alignement });
  return r.ok ? { fiche: r.fiche, erreurs: [], manquants: manque } : { erreurs: r.erreurs, manquants: manque };
}

export function personnageComplet(b: BilanPersonnage): boolean {
  return !!b.fiche && b.erreurs.length === 0 && b.manquants.length === 0;
}

const CLASSES_SOIGNEUSES = ['clerc', 'druide', 'barde', 'paladin'];
const CLASSES_PREMIERE_LIGNE = ['barbare', 'guerrier', 'paladin', 'moine'];

/** Conseils de composition (jamais bloquants). */
export function avertissementsGroupe(fiches: Fiche[], donnees: Donnees, taille: TailleGroupe = TAILLE_GROUPE): string[] {
  const avis: string[] = [];
  if (!fiches.length) return ['Aucun personnage complet : créez au moins un aventurier.'];
  const n = fiches.length;
  if (n < taille) avis.push(`Groupe de ${n} sur ${taille} emplacements : les combats des histoires auront moins de monstres (calculés pour ${n} héros au lieu de ${taille}).`);
  else if (n < TAILLE_GROUPE) avis.push(`Groupe de ${n} : les combats des histoires seront un peu moins chargés qu'à ${TAILLE_GROUPE} héros (ils s'adaptent au nombre de héros).`);
  const soigne = (f: Fiche) =>
    CLASSES_SOIGNEUSES.includes(f.classe) || [...f.sortsMineurs, ...f.sortsPrepares, ...f.sortsAccordes].some((id) => !!donnees.sorts.get(id)?.soins);
  // Les conseils de composition ne valent que pour un groupe qui peut se répartir les rôles : un héros seul ou en duo se débrouille.
  if (n >= 2 && !fiches.some(soigne)) avis.push('Aucun soigneur : personne ne rend de points de vie.');
  if (n >= 4 && !fiches.some((f) => CLASSES_PREMIERE_LIGNE.includes(f.classe) || f.ca >= 17)) avis.push('Personne en première ligne : aucun personnage robuste pour tenir le front.');
  if (n >= 4 && !fiches.some((f) => f.classe === 'roublard' || f.aptitudes.some((a) => a.id === 'expertise' && f.competences.discretion.maitrise !== 'aucune'))) {
    avis.push("Aucun roublard : pièges et serrures seront plus difficiles à gérer.");
  }
  if (n >= 4 && !fiches.some((f) => f.incantation)) avis.push('Aucun lanceur de sorts.');
  if (n >= 3 && !fiches.some((f) => f.perceptionPassive >= 14)) avis.push('Perception faible : le groupe risque de manquer pièges et embuscades.');
  const parClasse = new Map<string, number>();
  for (const f of fiches) parClasse.set(f.classe, (parClasse.get(f.classe) ?? 0) + 1);
  const doublons = [...parClasse].filter(([, k]) => k > 2).map(([c]) => donnees.classes.get(c)?.nom ?? c);
  if (doublons.length) avis.push(`Beaucoup de personnages de la même classe : ${doublons.join(', ')}.`);
  return avis;
}

/** Le groupe conseillé : six héros équilibrés, tous complets, au niveau demandé. */
export const GROUPE_CONSEILLE: { nom: string; classe: string; espece: string; sexe: 'F' | 'M'; alignement: Alignement }[] = [
  { nom: 'Bran', classe: 'guerrier', espece: 'humain', sexe: 'M', alignement: 'LB' },
  { nom: 'Hilda', classe: 'clerc', espece: 'nain', sexe: 'F', alignement: 'LB' },
  { nom: 'Pip', classe: 'roublard', espece: 'halfelin', sexe: 'F', alignement: 'CB' },
  { nom: 'Sylvaine', classe: 'rodeur', espece: 'elfe', sexe: 'F', alignement: 'NB' },
  { nom: 'Ambrine', classe: 'magicien', espece: 'gnome', sexe: 'F', alignement: 'NB' },
  { nom: 'Grukk', classe: 'barbare', espece: 'orc', sexe: 'M', alignement: 'CN' },
];

/** Les quatre héros du groupe conseillé à 4 : première ligne, soigneur, roublard et lanceur de sorts. */
const CLASSES_GROUPE_DE_4 = ['guerrier', 'clerc', 'roublard', 'magicien'];

export function groupeConseille(niveau: number, donnees: Donnees, taille: TailleGroupe = TAILLE_GROUPE): Groupe {
  const heros = taille === 4 ? GROUPE_CONSEILLE.filter((h) => CLASSES_GROUPE_DE_4.includes(h.classe)) : GROUPE_CONSEILLE;
  return {
    version: 1,
    niveau,
    emplacements: heros.map((h) => ({
      id: nouvelId(),
      sexe: h.sexe,
      alignement: h.alignement,
      portrait: `${h.espece}-${h.sexe.toLowerCase()}-1`,
      choix: creationRapide({ classe: h.classe, espece: h.espece, niveau, nom: h.nom }, donnees),
    })),
  };
}
