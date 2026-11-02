// Format d'un monde (une histoire jouable) : lieux, PNJ, objets, trésors, rencontres, énigmes, pièges, quêtes…
// Un monde est un dossier de fichiers JSON (packages/mondes/<id>/) ; le moteur est le même pour tous les mondes.
// Ce fichier est la référence du format : voir docs/MONDES.md.
import { z } from 'zod';
import { Caracteristique, Competence } from '../schemas';

export const Id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'identifiant en kebab-case ASCII');
export type Id = z.infer<typeof Id>;

const Dd = z.number().int().min(5).max(30);
// Compétences qui permettent de repérer un trésor caché, un passage secret ou un piège.
const COMPETENCES_RECHERCHE = z.enum(['perception', 'investigation', 'survie', 'nature']);
const Texte = z.string().min(1);

// ---------------------------------------------------------------------------
// Conditions et effets : le langage commun à tout le monde (lieux, PNJ, quêtes, événements)
// ---------------------------------------------------------------------------

export type Condition =
  | { flag: string }
  | { fait: string }
  | { quete: { id: string; statut: 'proposee' | 'active' | 'terminee' | 'echouee' } }
  | { etape: { quete: string; etape: string } }
  | { faction: { id: string; min?: number; max?: number } }
  | { jauge: { id: string; min?: number; max?: number } }
  | { objet: string }
  | { pnj: { id: string; attitudeMin?: number; attitudeMax?: number; etat?: 'vivant' | 'mort' | 'parti' } }
  | { lieu: string }
  | { niveauGroupe: { min?: number; max?: number } }
  | { non: Condition }
  | { et: Condition[] }
  | { ou: Condition[] };

export const Condition: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.object({ flag: Id }).strict(),
    z.object({ fait: Id }).strict(),
    z.object({ quete: z.object({ id: Id, statut: z.enum(['proposee', 'active', 'terminee', 'echouee']) }) }).strict(),
    z.object({ etape: z.object({ quete: Id, etape: Id }) }).strict(),
    z.object({ faction: z.object({ id: Id, min: z.number().optional(), max: z.number().optional() }) }).strict(),
    z.object({ jauge: z.object({ id: Id, min: z.number().optional(), max: z.number().optional() }) }).strict(),
    z.object({ objet: Id }).strict(),
    z
      .object({
        pnj: z.object({ id: Id, attitudeMin: z.number().optional(), attitudeMax: z.number().optional(), etat: z.enum(['vivant', 'mort', 'parti']).optional() }),
      })
      .strict(),
    z.object({ lieu: Id }).strict(),
    z.object({ niveauGroupe: z.object({ min: z.number().int().optional(), max: z.number().int().optional() }) }).strict(),
    z.object({ non: Condition }).strict(),
    z.object({ et: z.array(Condition).min(1) }).strict(),
    z.object({ ou: z.array(Condition).min(1) }).strict(),
  ]),
);

export type EffetMonde =
  | { flag: string; valeur?: boolean }
  | { fait: string }
  | { jauge: { id: string; delta: number } }
  | { reputation: { faction: string; delta: number } }
  | { attitude: { pnj: string; delta: number } }
  | { objet: { id: string; quantite?: number; retirer?: boolean } }
  | { pieces: number }
  | { xp: number }
  | { quete: { id: string; statut: 'proposee' | 'active' | 'terminee' | 'echouee' } }
  | { etape: { quete: string; etape: string } }
  | { pnjEtat: { pnj: string; etat: 'vivant' | 'mort' | 'parti' } }
  | { deplacer: { pnj: string; lieu: string } }
  | { debloquer: string }
  | { rencontre: string }
  | { fin: string }
  | { narration: string };

export const EffetMonde: z.ZodType<EffetMonde> = z.union([
  z.object({ flag: Id, valeur: z.boolean().optional() }).strict(),
  z.object({ fait: Id }).strict(),
  z.object({ jauge: z.object({ id: Id, delta: z.number() }) }).strict(),
  z.object({ reputation: z.object({ faction: Id, delta: z.number() }) }).strict(),
  z.object({ attitude: z.object({ pnj: Id, delta: z.number() }) }).strict(),
  z.object({ objet: z.object({ id: Id, quantite: z.number().int().positive().optional(), retirer: z.boolean().optional() }) }).strict(),
  z.object({ pieces: z.number().int() }).strict(),
  z.object({ xp: z.number().int().positive() }).strict(),
  z.object({ quete: z.object({ id: Id, statut: z.enum(['proposee', 'active', 'terminee', 'echouee']) }) }).strict(),
  z.object({ etape: z.object({ quete: Id, etape: Id }) }).strict(),
  z.object({ pnjEtat: z.object({ pnj: Id, etat: z.enum(['vivant', 'mort', 'parti']) }) }).strict(),
  z.object({ deplacer: z.object({ pnj: Id, lieu: Id }) }).strict(),
  z.object({ debloquer: Id }).strict(),
  z.object({ rencontre: Id }).strict(),
  z.object({ fin: Id }).strict(),
  z.object({ narration: Texte }).strict(),
]);

const Effets = z.array(EffetMonde);

// ---------------------------------------------------------------------------
// Faits : les vérités du monde que le MJ connaît, et que les joueurs découvrent
// ---------------------------------------------------------------------------

export const Fait = z.object({
  id: Id,
  texte: Texte, // la vérité, à plat
  categorie: z.enum(['histoire', 'lieu', 'pnj', 'faction', 'indice', 'rumeur', 'secret']),
  // 3 = indispensable à la quête principale, 1 = couleur.
  importance: z.number().int().min(1).max(3).default(2),
  // Une rumeur peut être fausse : le MJ doit alors la présenter comme douteuse.
  fiable: z.boolean().default(true),
});
export type Fait = z.infer<typeof Fait>;

// ---------------------------------------------------------------------------
// Objets, trésors
// ---------------------------------------------------------------------------

export const CATEGORIES_OBJET = ['arme', 'armure', 'bouclier', 'potion', 'parchemin', 'baguette', 'anneau', 'bijou', 'vetement', 'outil', 'materiel', 'nourriture', 'livre', 'cle', 'quete', 'curiosite', 'monnaie-ancienne', 'divers'] as const;
export const RARETES = ['commun', 'peu-commun', 'rare', 'tres-rare', 'legendaire'] as const;

export const Objet = z.object({
  id: Id,
  nom: Texte,
  categorie: z.enum(CATEGORIES_OBJET),
  rarete: z.enum(RARETES).default('commun'),
  valeurPo: z.number().min(0),
  poidsKg: z.number().min(0).optional(),
  resume: Texte,
  // Histoire de l'objet, racontée par le MJ à qui l'identifie.
  lore: z.string().optional(),
  // Arme ou armure du SRD sur laquelle l'objet est basé (« épée longue +1 »).
  base: Id.optional(),
  bonus: z.object({ attaque: z.number().int().optional(), degats: z.number().int().optional(), ca: z.number().int().optional() }).optional(),
  magique: z.boolean().default(false),
  // Effets de fiche quand l'objet est porté (mêmes effets que les traits d'espèce et de classe).
  effets: z.array(z.record(z.unknown())).default([]),
  usage: z
    .object({
      type: z.enum(['consommable', 'charges', 'permanent']),
      soins: z.string().regex(/^\d+d\d+([+-]\d+)?$/).optional(),
      resume: z.string().optional(),
      effets: Effets.default([]),
    })
    .optional(),
  identification: Dd.optional(),
  maudit: z.string().optional(),
  attunement: z.boolean().default(false),
  visuel: z.string().optional(),
});
export type Objet = z.infer<typeof Objet>;

const Pieces = z.object({ po: z.number().int().min(0).optional(), pa: z.number().int().min(0).optional(), pc: z.number().int().min(0).optional() });

export const EntreeButin = z.object({
  poids: z.number().positive(),
  objet: Id.optional(),
  quantite: z.number().int().positive().optional(),
  pieces: z.object({ des: z.string().regex(/^\d+d\d+([+-]\d+)?$/), unite: z.enum(['po', 'pa', 'pc']).default('po') }).optional(),
  table: Id.optional(),
  rien: z.boolean().optional(),
});

export const TableButin = z.object({
  id: Id,
  nom: Texte,
  // Palier de niveau : 1 = niveaux 1-4, 2 = 5-10, 3 = 11-16, 4 = 17-20.
  palier: z.number().int().min(1).max(4),
  entrees: z.array(EntreeButin).min(1),
});
export type TableButin = z.infer<typeof TableButin>;

export const Tresor = z.object({
  id: Id,
  nom: Texte,
  lieu: Id,
  contenant: z.enum(['coffre', 'cache', 'cadavre', 'etagere', 'tombe', 'sarcophage', 'sac', 'autel', 'etabli', 'vitrine', 'sol', 'autre']),
  description: Texte,
  contenu: z.object({
    pieces: Pieces.optional(),
    objets: z.array(z.object({ objet: Id, quantite: z.number().int().positive().default(1) })).default([]),
    tables: z.array(z.object({ table: Id, jets: z.number().int().positive().default(1) })).default([]),
  }),
  acces: z
    .object({
      cache: z.object({ dd: Dd, competence: COMPETENCES_RECHERCHE.default('perception') }).optional(),
      verrou: z.object({ dd: Dd, cle: Id.optional() }).optional(),
      piege: Id.optional(),
    })
    .default({}),
  // Rencontre qui garde le trésor.
  gardien: Id.optional(),
  // Fait que le trésor aide à découvrir (une note, un journal…).
  indice: Id.optional(),
  condition: Condition.optional(),
});
export type Tresor = z.infer<typeof Tresor>;

// ---------------------------------------------------------------------------
// Pièges, énigmes
// ---------------------------------------------------------------------------

export const Piege = z.object({
  id: Id,
  nom: Texte,
  lieu: Id,
  resume: Texte,
  detection: z.object({ dd: Dd, competence: COMPETENCES_RECHERCHE.default('perception') }),
  desarmement: z.object({ dd: Dd, competence: Competence.default('escamotage'), outil: z.string().optional() }),
  declenchement: Texte,
  sauvegarde: z.object({ caracteristique: Caracteristique, dd: Dd, moitieSiReussite: z.boolean().default(true) }).optional(),
  degats: z.array(z.object({ des: z.string().regex(/^\d+d\d+([+-]\d+)?$/), type: z.string() })).default([]),
  etats: z.array(z.string()).default([]),
  effets: Effets.default([]),
  reinitialisation: z.boolean().default(false),
});
export type Piege = z.infer<typeof Piege>;

const Indice = z.object({ niveau: z.number().int().min(1).max(3), texte: Texte, competence: Competence.optional(), dd: Dd.optional() });

// La solution est vérifiable par le moteur : le MJ n'a pas à juger si la réponse est bonne.
const SolutionEnigme = z.discriminatedUnion('type', [
  z.object({ type: z.literal('sequence'), ordre: z.array(Texte).min(2) }),
  z.object({ type: z.literal('mot-de-passe'), mots: z.array(Texte).min(1) }),
  z.object({ type: z.literal('leviers'), positions: z.array(z.boolean()).min(2) }),
  z.object({ type: z.literal('placement'), emplacements: z.record(Id) }),
  z.object({ type: z.literal('cadran'), valeurs: z.array(z.number().int()).min(1) }),
  z.object({ type: z.literal('deduction'), reponses: z.array(Texte).min(1) }),
]);

export const Enigme = z.object({
  id: Id,
  nom: Texte,
  lieu: Id,
  enonce: Texte, // ce que voient les joueurs
  solution: SolutionEnigme,
  indices: z.array(Indice).min(1),
  echec: z.object({ piege: Id.optional(), effets: Effets.default([]), resume: z.string().optional() }).optional(),
  recompense: z.object({ effets: Effets.default([]), tresor: Id.optional(), resume: z.string().optional() }),
});
export type Enigme = z.infer<typeof Enigme>;

// ---------------------------------------------------------------------------
// Rencontres
// ---------------------------------------------------------------------------

export const RencontreMonde = z.object({
  id: Id,
  nom: Texte,
  type: z.enum(['combat', 'social', 'exploration', 'mixte']),
  lieu: Id.optional(),
  difficulte: z.enum(['faible', 'moderee', 'elevee']),
  intro: Texte, // mise en scène pour le MJ
  // Combat : profils de monstres du SRD (ou d'un PNJ qui a un profil) et carte tactique.
  monstres: z.array(z.object({ profil: Id, nombre: z.number().int().positive(), nom: z.string().optional(), pnj: Id.optional() })).default([]),
  // Carte de la grille tactique : « . » sol, « # » mur, « ~ » terrain difficile, « H » départ héros, « m » départ monstres.
  carte: z.array(z.string()).optional(),
  tactique: z.object({ doctrine: z.string().optional(), fuite: z.string().optional(), renforts: z.string().optional() }).optional(),
  // Autres façons de résoudre la rencontre (négocier, ruser, fuir).
  alternatives: z
    .array(z.object({ id: Id, nom: Texte, condition: Condition.optional(), jet: z.object({ competence: Competence, dd: Dd }).optional(), resume: Texte, effets: Effets.default([]) }))
    .default([]),
  butin: z.object({ tables: z.array(Id).default([]), tresors: z.array(Id).default([]) }).default({}),
  effetsVictoire: Effets.default([]),
});
export type RencontreMonde = z.infer<typeof RencontreMonde>;

// ---------------------------------------------------------------------------
// PNJ
// ---------------------------------------------------------------------------

export const Sujet = z.object({
  id: Id,
  // Mots ou idées qui déclenchent le sujet (le MJ comprend le sens, pas seulement les mots).
  mots: z.array(Texte).min(1),
  condition: Condition.optional(),
  attitudeMin: z.number().optional(),
  // Ce que le PNJ dit ou fait savoir (le MJ le reformule dans la voix du PNJ).
  reponse: Texte,
  revele: z.array(Id).default([]),
  effets: Effets.default([]),
  unique: z.boolean().default(false),
});

export const Pnj = z.object({
  id: Id,
  nom: Texte,
  titre: z.string().optional(),
  // Id d'espèce du SRD (`nain`, `humain`…) ou texte libre pour une créature.
  espece: Texte,
  sexe: z.enum(['F', 'M', 'N']),
  age: z.string().optional(),
  role: Texte,
  lieu: Id,
  // Pour l'illustrateur : portrait et tenue.
  apparence: Texte,
  personnalite: z.object({
    traits: z.array(Texte).min(2),
    voix: Texte, // comment il parle
    valeurs: z.array(Texte).default([]),
    desir: Texte,
    peur: z.string().optional(),
    defaut: z.string().optional(),
  }),
  // Autres endroits où on peut le croiser (selon le moment de la journée ou une condition).
  presences: z.array(z.object({ lieu: Id, moment: z.enum(['jour', 'soir', 'nuit']).default('jour'), condition: Condition.optional() })).default([]),
  faction: Id.optional(),
  // Attitude initiale envers le groupe, de -100 (hostile) à 100 (dévoué).
  attitude: z.number().min(-100).max(100).default(0),
  savoir: z.array(Id).default([]),
  secrets: z
    .array(z.object({ fait: Id, condition: Condition.optional(), jet: z.object({ competence: Competence, dd: Dd }).optional(), attitudeMin: z.number().optional(), prix: z.number().optional() }))
    .default([]),
  sujets: z.array(Sujet).default([]),
  salutations: z.object({ hostile: z.string().optional(), neutre: Texte, amical: z.string().optional() }),
  boutique: z
    .object({
      stock: z.array(z.object({ objet: Id, quantite: z.number().int().positive().default(1), prix: z.number().min(0).optional() })).default([]),
      tables: z.array(Id).default([]),
      // Part de la valeur payée pour racheter (0 à 1) ; 0 = n'achète rien.
      rachat: z.number().min(0).max(1).default(0.5),
      types: z.array(z.enum(CATEGORIES_OBJET)).default([]),
    })
    .optional(),
  services: z.array(z.object({ id: Id, nom: Texte, resume: Texte, prix: z.number().min(0), condition: Condition.optional(), effets: Effets.default([]) })).default([]),
  inventaire: z.array(Id).default([]),
  // Profil de combat (monstre du SRD) si le PNJ doit se battre.
  profilCombat: Id.optional(),
  compagnon: z
    .object({
      classe: Id,
      espece: Id,
      niveau: z.number().int().min(1).max(5),
      historique: Id.optional(),
      recrutement: Condition.optional(),
      quetePersonnelle: Id.optional(),
      repliques: z.array(z.object({ declencheur: Texte, texte: Texte })).default([]),
      opinions: z.array(z.object({ sujet: Texte, reaction: Texte, attitude: z.number().optional() })).default([]),
    })
    .optional(),
});
export type Pnj = z.infer<typeof Pnj>;

// ---------------------------------------------------------------------------
// Lieux : régions, villes, villages, grottes, donjons, salles… (un arbre + un graphe de liens)
// ---------------------------------------------------------------------------

export const TYPES_LIEU = ['region', 'ville', 'village', 'hameau', 'camp', 'route', 'grotte', 'donjon', 'niveau', 'salle', 'ruine', 'batiment', 'quartier', 'lieu-dit'] as const;

export const Lien = z.object({
  vers: Id,
  type: z.enum(['chemin', 'route', 'porte', 'escalier', 'echelle', 'passage', 'passage-secret', 'pont', 'gue', 'portail', 'ascenseur']),
  // Temps de trajet en heures (déplacement entre lieux d'une carte du monde ; 0 pour un lien à l'intérieur d'un lieu).
  heures: z.number().min(0).default(0),
  sens: z.enum(['double', 'simple']).default('double'),
  condition: Condition.optional(),
  verrou: z.object({ dd: Dd, cle: Id.optional() }).optional(),
  cache: z.object({ dd: Dd, competence: COMPETENCES_RECHERCHE.default('perception') }).optional(),
  description: z.string().optional(),
});

export const Lieu = z.object({
  id: Id,
  nom: Texte,
  type: z.enum(TYPES_LIEU),
  parent: Id.optional(),
  resume: Texte,
  // Pour le MJ : ce qu'on y trouve, factuel.
  description: Texte,
  ambiance: z.string().optional(),
  // Pour l'illustrateur : décrire ce qu'on voit, sans nommer les personnages.
  visuel: Texte,
  niveau: z.object({ min: z.number().int().min(1).max(20), max: z.number().int().min(1).max(20) }).optional(),
  liens: z.array(Lien).default([]),
  // Les PNJ, trésors, pièges, énigmes et événements se rattachent au lieu par leur propre champ `lieu`
  // (pas de liste ici : une seule source de vérité). Les rencontres, elles, ont un déclencheur propre au lieu.
  rencontres: z.array(z.object({ id: Id, declencheur: z.enum(['entree', 'exploration', 'repos', 'aleatoire']).default('entree'), condition: Condition.optional(), unique: z.boolean().default(true) })).default([]),
  faits: z.array(z.object({ fait: Id, decouverte: z.object({ auto: z.boolean().optional(), dd: Dd.optional(), competence: Competence.optional(), condition: Condition.optional() }).default({ auto: true }) })).default([]),
  evenements: z.array(Id).default([]),
  // Services de lieu habité : auberge, temple, forge, marché…
  services: z.array(z.string()).default([]),
  // Peut-on s'y reposer ? (un repos long dans un lieu dangereux a un coût narratif)
  repos: z.enum(['sur', 'dangereux', 'impossible']).default('dangereux'),
  carte: z.array(z.string()).optional(),
});
export type Lieu = z.infer<typeof Lieu>;

// ---------------------------------------------------------------------------
// Quêtes, factions, jauges, événements, fins
// ---------------------------------------------------------------------------

export const Quete = z.object({
  id: Id,
  nom: Texte,
  type: z.enum(['principale', 'secondaire', 'personnelle', 'faction']),
  donneur: Id.optional(),
  lieu: Id.optional(),
  // Texte du journal de quête, côté joueur.
  resume: Texte,
  niveau: z.object({ min: z.number().int().min(1).max(20), max: z.number().int().min(1).max(20) }),
  prerequis: Condition.optional(),
  debut: Id,
  etapes: z
    .array(
      z.object({
        id: Id,
        texte: Texte, // entrée du journal quand l'étape est active
        // Dès que cette condition devient vraie, l'étape est accomplie.
        completion: Condition,
        suivantes: z.array(Id).default([]),
        // Étape finale : son accomplissement termine la quête tout de suite (fins alternatives). Sans ce marqueur,
        // la quête se termine quand une étape sans suite s'accomplit et qu'il ne reste plus d'étape active.
        termine: z.boolean().default(false),
        echec: Condition.optional(),
        effets: Effets.default([]),
      }),
    )
    .min(1),
  recompenses: z.object({ xp: z.number().int().min(0).default(0), pieces: z.number().int().min(0).default(0), objets: z.array(Id).default([]), effets: Effets.default([]) }),
  // Pour le MJ : les variantes, les façons de la rater ou de la résoudre autrement.
  ramifications: z.string().optional(),
});
export type Quete = z.infer<typeof Quete>;

export const Faction = z.object({
  id: Id,
  nom: Texte,
  resume: Texte,
  objectifs: z.array(Texte).min(1),
  chef: Id.optional(),
  reputation: z.number().min(-100).max(100).default(0),
  paliers: z.array(z.object({ seuil: z.number(), nom: Texte, effet: Texte })).default([]),
  relations: z.array(z.object({ faction: Id, attitude: z.number().min(-100).max(100) })).default([]),
});
export type Faction = z.infer<typeof Faction>;

export const Jauge = z.object({
  id: Id,
  nom: Texte,
  resume: Texte,
  min: z.number(),
  max: z.number(),
  initial: z.number(),
  paliers: z.array(z.object({ seuil: z.number(), nom: Texte, narration: Texte, effets: Effets.default([]) })).default([]),
  evolution: z.array(z.object({ declencheur: z.enum(['repos-long', 'jour', 'lieu', 'condition']), delta: z.number(), lieu: Id.optional(), condition: Condition.optional() })).default([]),
});
export type Jauge = z.infer<typeof Jauge>;

export const EvenementMonde = z.object({
  id: Id,
  declencheur: z.enum(['entree-lieu', 'repos', 'jour', 'condition']),
  lieu: Id.optional(),
  condition: Condition.optional(),
  unique: z.boolean().default(true),
  narration: Texte,
  effets: Effets.default([]),
});
export type EvenementMonde = z.infer<typeof EvenementMonde>;

export const Fin = z.object({
  id: Id,
  nom: Texte,
  condition: Condition,
  epilogue: Texte,
  consequences: z.array(Texte).default([]),
});
export type Fin = z.infer<typeof Fin>;

// ---------------------------------------------------------------------------
// Le monde lui-même (monde.json)
// ---------------------------------------------------------------------------

export const Chapitre = z.object({
  id: Id,
  nom: Texte,
  niveaux: z.object({ min: z.number().int().min(1).max(20), max: z.number().int().min(1).max(20) }),
  resume: Texte,
  // Lieux de plus haut niveau (régions, villes, donjons) de ce chapitre.
  lieux: z.array(Id).min(1),
  quetes: z.array(Id).default([]),
});
export type Chapitre = z.infer<typeof Chapitre>;

export const Monde = z.object({
  id: Id,
  version: z.literal(1),
  // « brouillon » : monde en cours d'écriture (les erreurs de validation ne bloquent pas les tests) ; « publie » : monde jouable.
  statut: z.enum(['brouillon', 'publie']).default('publie'),
  nom: Texte,
  resume: Texte,
  accroche: Texte,
  ton: z.array(Texte).min(1),
  // Niveaux de personnages pour lesquels le monde est écrit.
  niveaux: z.object({ min: z.number().int().min(1).max(20), max: z.number().int().min(1).max(20) }),
  depart: z.object({ lieu: Id, intro: Texte }),
  // Direction artistique, qui complète la charte graphique commune.
  direction: z.object({ style: Texte, palette: z.array(Texte).min(2), motsCles: z.array(Texte).default([]), interdits: z.array(Texte).default([]) }),
  chapitres: z.array(Chapitre).min(1),
  // Ce que le MJ ne doit jamais faire dans ce monde (ex. magie ressuscitante).
  regles: z.array(Texte).default([]),
  auteurs: z.array(Texte).default([]),
});
export type Monde = z.infer<typeof Monde>;

/** Un monde chargé : toutes ses entités, indexées par identifiant. */
export interface DonneesMonde {
  monde: Monde;
  lieux: Map<string, Lieu>;
  pnj: Map<string, Pnj>;
  objets: Map<string, Objet>;
  tresors: Map<string, Tresor>;
  tables: Map<string, TableButin>;
  rencontres: Map<string, RencontreMonde>;
  pieges: Map<string, Piege>;
  enigmes: Map<string, Enigme>;
  quetes: Map<string, Quete>;
  factions: Map<string, Faction>;
  jauges: Map<string, Jauge>;
  evenements: Map<string, EvenementMonde>;
  fins: Map<string, Fin>;
  faits: Map<string, Fait>;
}
