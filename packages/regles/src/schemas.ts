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
    // Le bonus lu dans une colonne de la progression de la classe au niveau du personnage (« +4,50 m ») ; `metres` vaut s'il n'y a rien.
    colonne: z.string().optional(),
  }),
  z.object({ type: z.literal('vision_dans_le_noir'), metres: z.number() }),
  z.object({ type: z.literal('resistance'), degats: z.string() }),
  z.object({ type: z.literal('maitrise_competences'), nombre: z.number().int(), parmi: z.array(Competence).optional() }),
  z.object({ type: z.literal('expertise'), nombre: z.number().int(), parmi: z.array(Competence).optional() }),
  z.object({ type: z.literal('maitrise_initiative') }),
  z.object({ type: z.literal('demi_maitrise_tests_non_maitrises') }),
  z.object({ type: z.literal('formation_armures'), categories: z.array(CategorieArmure) }),
  z.object({ type: z.literal('maitrise_armes'), armes: z.array(z.string()) }),
  // Amélioration de caractéristique (niveau 4, etc.) : +2 à une ou +1 à deux.
  z.object({ type: z.literal('amelioration_caracteristique') }),
  // Faveur épique (niveau 19) : un don de faveur, +1 à une caractéristique (max 30).
  z.object({ type: z.literal('faveur_epique') }),
  // Sorts mineurs en plus de ceux de la classe (Thaumaturge, Mage primitif) : le joueur les choisit.
  z.object({ type: z.literal('sorts_mineurs_supplementaires'), nombre: z.number().int() }),
  // Sorts toujours connus, accordés par l'espèce ou une option (ids des données de sorts).
  z.object({ type: z.literal('sorts_accordes'), sorts: z.array(z.string()) }),
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
  // Une entrée par niveau de classe (1 à 5 pendant la migration, 20 à terme).
  sortsMineurs: z.array(z.number().int()).length(20),
  sortsPrepares: z.array(z.number().int()).length(20),
  // emplacements[niveauClasse - 1][niveauSort - 1] ; pour le pacte, nombre d'emplacements au niveau indiqué.
  emplacements: z.array(z.array(z.number().int())).length(20),
  niveauEmplacementPacte: z.array(z.number().int()).length(20).optional(),
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
  // Table « Aptitudes de … » (niveaux 1 à 5 pendant la migration, 1 à 20 à terme).
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
    .length(20),
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

// ---------------------------------------------------------------------------
// Combat : actions de monstres et sorts (M1)
// ---------------------------------------------------------------------------

export const ETATS = [
  'a-terre',
  'aveugle',
  'charme',
  'empoigne',
  'entrave',
  'effraye',
  'inconscient',
  'neutralise',
  'paralyse',
  'empoisonne',
] as const;
export const Etat = z.enum(ETATS);
export type Etat = z.infer<typeof Etat>;

export const Degats = z.object({
  des: z.string().regex(/^(\d+d\d+|\d+)$/),
  bonus: z.number().int().default(0),
  type: z.string(),
});
export type Degats = z.infer<typeof Degats>;

const EtatInflige = z.object({
  etat: Etat,
  // Durée en rounds ; absente = jusqu'à la fin de l'effet ou une sauvegarde réussie.
  dureeRounds: z.number().int().optional(),
  // Sauvegarde répétée en fin de tour de la cible pour y mettre fin.
  sauvegardeFinDeTour: z.boolean().default(false),
  // Jet de sauvegarde pour éviter l'état après une attaque qui touche (Griffe de la goule).
  sauvegarde: z.object({ caracteristique: Caracteristique, dd: z.number().int() }).optional(),
  // DD pour s'échapper d'une empoignade ou d'une entrave.
  evasion: z.number().int().optional(),
  // Taille maximale de la cible affectée (« M ou inférieure »).
  tailleMax: z.enum(['TP', 'P', 'M', 'G', 'TG', 'Gig']).optional(),
});

// Résolution commune aux attaques de monstres et aux sorts.
export const Resolution = z.discriminatedUnion('type', [
  // bonus fixe pour un monstre ; absent pour un sort (bonus d'attaque de sort du lanceur).
  z.object({ type: z.literal('attaque'), mode: z.enum(['corps-a-corps', 'distance']), bonus: z.number().int().optional() }),
  z.object({
    type: z.literal('sauvegarde'),
    caracteristique: Caracteristique,
    dd: z.number().int().optional(),
    moitieSiReussite: z.boolean(),
  }),
  z.object({ type: z.literal('automatique') }),
]);
export type Resolution = z.infer<typeof Resolution>;

export const Zone = z.object({
  forme: z.enum(['cone', 'sphere', 'cube', 'ligne', 'cylindre', 'emanation']),
  taille: z.number(), // mètres (longueur du cône/de la ligne, rayon de la sphère, arête du cube)
  largeur: z.number().optional(),
});

export const Portee = z.object({
  type: z.enum(['contact', 'distance', 'personnel']),
  allonge: z.number().optional(), // corps à corps, mètres
  normale: z.number().optional(), // distance, mètres
  longue: z.number().optional(),
});

export const Cout = z.enum(['action', 'bonus', 'reaction', 'gratuit']);

export const ActionMonstre = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  nom: z.string(),
  cout: Cout,
  resume: z.string(),
  // Multiattaque : liste des actions (par id) et nombre de fois ; sinon absent.
  multiattaque: z.array(z.object({ action: z.string(), nombre: z.number().int() })).optional(),
  resolution: Resolution.optional(),
  portee: Portee.optional(),
  zone: Zone.optional(),
  degats: z.array(Degats).default([]),
  etats: z.array(EtatInflige).default([]),
  recharge: z.string().optional(), // « 5-6 »
  utilisations: z.object({ nombre: z.number().int(), par: z.enum(['jour', 'repos-long', 'repos-court']) }).optional(),
});
export type ActionMonstre = z.infer<typeof ActionMonstre>;

export const Monstre = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  nom: z.string(),
  taille: z.enum(['TP', 'P', 'M', 'G', 'TG', 'Gig']),
  type: z.string(),
  alignement: z.string(),
  ca: z.number().int(),
  pv: z.object({ moyenne: z.number().int(), des: z.string() }),
  vitesse: z.object({ marche: z.number(), escalade: z.number().optional(), nage: z.number().optional(), vol: z.number().optional() }),
  caracteristiques: z.record(Caracteristique, z.number().int()),
  sauvegardes: z.record(Caracteristique, z.number().int()).default({}),
  competences: z.record(z.string(), z.number().int()).default({}),
  initiative: z.number().int(),
  resistances: z.array(z.string()).default([]),
  immunitesDegats: z.array(z.string()).default([]),
  immunitesEtats: z.array(Etat).default([]),
  vulnerabilites: z.array(z.string()).default([]),
  sens: z.object({ visionDansLeNoir: z.number().optional(), visionAveugle: z.number().optional(), perceptionPassive: z.number().int() }),
  langues: z.string(),
  fp: z.string(), // « 1/4 », « 2 »
  px: z.number().int(),
  bonusMaitrise: z.number().int(),
  traits: z.array(z.object({ id: z.string(), nom: z.string(), resume: z.string() })).default([]),
  actions: z.array(ActionMonstre),
});
export type Monstre = z.infer<typeof Monstre>;

export const Sort = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  nom: z.string(),
  niveau: z.number().int().min(0).max(9),
  ecole: z.string(),
  classes: z.array(z.string()),
  tempsIncantation: Cout,
  portee: Portee,
  zone: Zone.optional(),
  cibles: z.number().int().optional(), // nombre maximal de cibles
  composantes: z.string(),
  duree: z.string(),
  concentration: z.boolean(),
  resume: z.string(),
  resolution: Resolution.optional(),
  degats: z.array(Degats).default([]),
  soins: z.object({ des: z.string(), ajouterModificateur: z.boolean() }).optional(),
  etats: z.array(EtatInflige).default([]),
  // Dés ajoutés par niveau d'emplacement au-dessus du niveau du sort (« 1d6 »), ou par projectile/rayon supplémentaire.
  ameliorationParNiveau: z.string().optional(),
  // Sorts mineurs : nombre de dés aux niveaux de personnage 5, 11 et 17.
  evolutionSortMineur: z.tuple([z.number().int(), z.number().int(), z.number().int()]).optional(),
  // Effet géré par du code dédié (Bouclier, Bénédiction, Marque du chasseur…) : id du gestionnaire.
  special: z.string().optional(),
});
export type Sort = z.infer<typeof Sort>;

// ---------------------------------------------------------------------------
// Création : choix proposés au joueur (lignages, ordres, métamagie…)
// ---------------------------------------------------------------------------

export const OptionChoix = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  nom: z.string(),
  // Paraphrase courte avec les nombres exacts (sorts accordés aux niveaux 3 et 5 compris).
  resume: z.string(),
  effets: z.array(Effet).default([]),
});
export type OptionChoix = z.infer<typeof OptionChoix>;

export const ChoixCreation = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  nom: z.string(),
  source: z.object({ type: z.enum(['espece', 'classe']), id: z.string() }),
  // Nombre d'options à choisir aux niveaux de personnage 1, 2, 3… (0 tant que le choix n'est pas disponible) ; au-delà de la dernière entrée, la dernière valeur continue de valoir.
  nombres: z.array(z.number().int().min(0)).min(5).max(20),
  options: z.array(OptionChoix).min(2),
});
export type ChoixCreation = z.infer<typeof ChoixCreation>;
