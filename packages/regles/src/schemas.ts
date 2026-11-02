// Schémas des données de règles issues du SRD 5.2.1 (packages/donnees/srd).
// Les distances sont en mètres, comme dans le SRD français.
import { z } from 'zod';

export const CARACTERISTIQUES = ['for', 'dex', 'con', 'int', 'sag', 'cha'] as const;
export const Caracteristique = z.enum(CARACTERISTIQUES);
export type Caracteristique = z.infer<typeof Caracteristique>;

export const COMPETENCES = {
  acrobaties: 'dex',
  arcanes: 'int',
  athletisme: 'for',
  discretion: 'dex',
  dressage: 'sag',
  escamotage: 'dex',
  histoire: 'int',
  intimidation: 'cha',
  intuition: 'sag',
  investigation: 'int',
  medecine: 'sag',
  nature: 'int',
  perception: 'sag',
  persuasion: 'cha',
  religion: 'int',
  representation: 'cha',
  survie: 'sag',
  tromperie: 'cha',
} as const satisfies Record<string, Caracteristique>;
export type Competence = keyof typeof COMPETENCES;
export const Competence = z.enum(Object.keys(COMPETENCES) as [Competence, ...Competence[]]);

export const CategorieArmure = z.enum(['legere', 'intermediaire', 'lourde', 'bouclier']);
export type CategorieArmure = z.infer<typeof CategorieArmure>;

// Effets mécaniques qu'une aptitude, un trait ou un don applique à la fiche.
// Le moteur ne connaît que ces types : tout le reste est du texte pour le MJ.
export const Effet = z.discriminatedUnion('type', [
  // CA = base + modificateurs listés, quand le personnage ne porte pas d'armure.
  z.object({
    type: z.literal('ca_sans_armure'),
    base: z.number().int(),
    caracteristiques: z.array(Caracteristique),
    bouclierAutorise: z.boolean(),
  }),
  z.object({ type: z.literal('bonus_ca'), valeur: z.number().int(), condition: z.enum(['toujours', 'en_armure']) }),
  z.object({ type: z.literal('pv_par_niveau'), valeur: z.number().int() }),
  z.object({
    type: z.literal('bonus_vitesse'),
    metres: z.number(),
    condition: z.enum(['toujours', 'sans_armure_lourde', 'sans_armure_ni_bouclier']),
  }),
  z.object({ type: z.literal('vision_dans_le_noir'), metres: z.number() }),
  z.object({ type: z.literal('resistance'), degats: z.string() }),
  z.object({ type: z.literal('maitrise_competences'), nombre: z.number().int(), parmi: z.array(Competence).optional() }),
  z.object({ type: z.literal('expertise'), nombre: z.number().int() }),
  z.object({ type: z.literal('maitrise_initiative') }),
  z.object({ type: z.literal('demi_maitrise_tests_non_maitrises') }),
  z.object({ type: z.literal('formation_armures'), categories: z.array(CategorieArmure) }),
  z.object({ type: z.literal('maitrise_armes'), armes: z.array(z.string()) }),
  // Amélioration de caractéristique (niveau 4, etc.) : +2 à une ou +1 à deux.
  z.object({ type: z.literal('amelioration_caracteristique') }),
]);
export type Effet = z.infer<typeof Effet>;

const Aptitude = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  nom: z.string(),
  niveau: z.number().int().min(1).max(20),
  // Paraphrase courte (1 à 3 phrases) pour le MJ ; le texte complet reste dans le SRD.
  resume: z.string(),
  effets: z.array(Effet).default([]),
});
export type Aptitude = z.infer<typeof Aptitude>;

const OptionEquipement = z.object({
  id: z.string(),
  objets: z.array(z.string()),
  po: z.number(),
});

export const Incantation = z.object({
  type: z.enum(['complet', 'demi', 'pacte']),
  caracteristique: Caracteristique,
  // Une entrée par niveau de classe 1 à 5.
  sortsMineurs: z.array(z.number().int()).length(5),
  sortsPrepares: z.array(z.number().int()).length(5),
  // emplacements[niveauClasse - 1][niveauSort - 1] ; pour le pacte, nombre d'emplacements au niveau indiqué.
  emplacements: z.array(z.array(z.number().int())).length(5),
  niveauEmplacementPacte: z.array(z.number().int()).length(5).optional(),
});
export type Incantation = z.infer<typeof Incantation>;

export const Classe = z.object({
  id: z.string().regex(/^[a-z-]+$/),
  nom: z.string(),
  caracteristiquesPrincipales: z.object({ mode: z.enum(['et', 'ou']), liste: z.array(Caracteristique).min(1) }),
  deVie: z.union([z.literal(6), z.literal(8), z.literal(10), z.literal(12)]),
  sauvegardes: z.tuple([Caracteristique, Caracteristique]),
  competences: z.object({ nombre: z.number().int(), parmi: z.union([z.array(Competence), z.literal('toutes')]) }),
  maitrisesArmes: z.array(z.string()),
  formationArmures: z.array(CategorieArmure),
  outils: z.array(z.string()),
  equipementDepart: z.array(OptionEquipement),
  incantation: Incantation.optional(),
  // Table « Aptitudes de … » pour les niveaux 1 à 5.
  progression: z
    .array(
      z.object({
        niveau: z.number().int(),
        bonusMaitrise: z.number().int(),
        aptitudes: z.array(z.string()),
        // Colonnes propres à la classe (Rages, Dégâts de rage, Points de sorcellerie…).
        colonnes: z.record(z.union([z.number(), z.string()])),
      }),
    )
    .length(5),
  aptitudes: z.array(Aptitude),
  sousClasse: z.object({ id: z.string(), nom: z.string(), aptitudes: z.array(Aptitude) }),
});
export type Classe = z.infer<typeof Classe>;

export const Espece = z.object({
  id: z.string().regex(/^[a-z-]+$/),
  nom: z.string(),
  type: z.string(),
  tailles: z.array(z.enum(['P', 'M'])).min(1),
  vitesse: z.number(),
  traits: z.array(Aptitude.omit({ niveau: true }).extend({ niveau: z.number().int().default(1) })),
});
export type Espece = z.infer<typeof Espece>;

export const Historique = z.object({
  id: z.string().regex(/^[a-z-]+$/),
  nom: z.string(),
  caracteristiques: z.tuple([Caracteristique, Caracteristique, Caracteristique]),
  don: z.string(),
  competences: z.tuple([Competence, Competence]),
  outils: z.string(),
  equipementDepart: z.array(OptionEquipement),
});
export type Historique = z.infer<typeof Historique>;

export const Don = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  nom: z.string(),
  categorie: z.enum(['origines', 'general', 'style-de-combat', 'faveur-epique']),
  prerequis: z.string().optional(),
  repetable: z.boolean().default(false),
  resume: z.string(),
  effets: z.array(Effet).default([]),
});
export type Don = z.infer<typeof Don>;

export const Armure = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  nom: z.string(),
  categorie: CategorieArmure,
  // CA de base ; pour un bouclier, c'est le bonus (+2).
  ca: z.number().int(),
  dex: z.enum(['complet', 'max2', 'aucun']),
  forceMin: z.number().int().optional(),
  desavantageDiscretion: z.boolean(),
  poidsKg: z.number(),
  prixPo: z.number(),
});
export type Armure = z.infer<typeof Armure>;

export const Arme = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  nom: z.string(),
  categorie: z.enum(['courante', 'guerre']),
  portee: z.enum(['corps-a-corps', 'distance']),
  degats: z.string().regex(/^(\d+d\d+|\d+)$/),
  typeDegats: z.string(),
  proprietes: z.array(z.string()),
  botte: z.string(),
  // Portée normale/longue en mètres pour les armes à distance ou de lancer.
  portees: z.tuple([z.number(), z.number()]).optional(),
  poidsKg: z.number(),
  prixPo: z.number(),
});
export type Arme = z.infer<typeof Arme>;
