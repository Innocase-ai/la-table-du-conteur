// Format d'un monde (une histoire jouable) : lieux, PNJ, objets, trésors, rencontres, énigmes, pièges, quêtes…
// Un monde est un dossier de fichiers JSON (packages/mondes/<id>/) ; le moteur est le même pour tous les mondes.
// Ce fichier est la référence du format : voir docs/MONDES.md.
import { FAMILLES } from '../equipement/emplacements';
import { z } from 'zod';
import { Caracteristique, Competence, ETATS } from '../schemas';
import { nomsDesRegistres, REGISTRE_INCONNU, resoudreSalutationsCommunes, SALUTATIONS_COMMUNES } from './salutations-communes';

export const Id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'identifiant en kebab-case ASCII');
export type Id = z.infer<typeof Id>;

const Dd = z.number().int().min(5).max(30);
// Compétences qui permettent de repérer un trésor caché, un passage secret ou un piège.
const COMPETENCES_RECHERCHE = z.enum(['perception', 'investigation', 'survie', 'nature']);
const Texte = z.string().min(1);

// ---------------------------------------------------------------------------
// Conditions et effets : le langage commun à tout le monde (lieux, PNJ, quêtes, événements)
// ---------------------------------------------------------------------------

/** Comment une rencontre s'est dénouée : combat gagné, autre issue (négocier, ruser…), fuite, défaite. */
export const TYPES_ISSUE = ['victoire', 'alternative', 'fuite', 'defaite'] as const;
export type TypeIssue = (typeof TYPES_ISSUE)[number];

export type Condition =
  | { flag: string }
  | { fait: string }
  | { quete: { id: string; statut: 'proposee' | 'active' | 'terminee' | 'echouee' } }
  | { etape: { quete: string; etape: string } }
  | { faction: { id: string; min?: number; max?: number } }
  | { jauge: { id: string; min?: number; max?: number } }
  | { objet: string }
  | { pnj: { id: string; attitudeMin?: number; attitudeMax?: number; etat?: 'vivant' | 'mort' | 'parti' } }
  /** Le groupe est déjà passé par ce lieu (et non : il s'y trouve maintenant). */
  | { lieu: string }
  /** La rencontre a été jouée ; avec `issue` (et `alternative`), elle s'est dénouée ainsi. */
  | { rencontre: { id: string; issue?: TypeIssue; alternative?: string } }
  /** Le groupe a déjà parlé à ce PNJ (sujet, salutation ou parole libre). */
  | { parle: string }
  /** Ce PNJ était présent quand une rencontre s'est dénouée (de cette façon, si `genre` est donné). */
  | { temoin: { pnj: string; genre?: TypeIssue } }
  | { pieces: { min?: number; max?: number } }
  | { niveauGroupe: { min?: number; max?: number } }
  /** Le moment de la journée (jour 6 h-17 h, soir 18 h-21 h, nuit) : un événement ou un sujet qui ne vaut qu'à cette heure (un PNJ présent le jour seulement). */
  | { moment: 'jour' | 'soir' | 'nuit' }
  | { heros: { classe?: string; espece?: string; historique?: string } }
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
    z.object({ rencontre: z.object({ id: Id, issue: z.enum(TYPES_ISSUE).optional(), alternative: Id.optional() }) }).strict(),
    z.object({ parle: Id }).strict(),
    z.object({ temoin: z.object({ pnj: Id, genre: z.enum(TYPES_ISSUE).optional() }) }).strict(),
    z.object({ pieces: z.object({ min: z.number().optional(), max: z.number().optional() }) }).strict(),
    z.object({ niveauGroupe: z.object({ min: z.number().int().optional(), max: z.number().int().optional() }) }).strict(),
    z.object({ moment: z.enum(['jour', 'soir', 'nuit']) }).strict(),
    // Au moins un héros du groupe a cette classe, cette espèce et cet historique (ceux qui sont donnés) : les origines du groupe.
    z
      .object({ heros: z.object({ classe: Id.optional(), espece: Id.optional(), historique: Id.optional() }).refine((h) => !!(h.classe || h.espece || h.historique), 'heros : au moins une classe, une espèce ou un historique') })
      .strict(),
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
  | { escorte: { pnj: string; actif?: boolean } }
  | { debloquer: string }
  | { rencontre: string }
  | { fin: string }
  /**
   * Une blessure : des dégâts (« 1d4 ») à un héros vivant tiré au hasard (`un`) ou à tous. Elle ne tue ni n'assomme jamais : les PV ne
   * descendent pas sous 1 (pas de mort définitive en histoire). C'est le prix d'une chute, d'une embuscade, d'un échec qui fait mal.
   */
  | { blessure: { des: string; cible?: 'un' | 'tous' } }
  /** Du temps qui passe (en heures, jusqu'à 24) : une attente, une poursuite, un échec qui fait perdre une demi-journée. Les jauges « jour » avancent à minuit. */
  | { temps: number }
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
  // Escorter : le PNJ suit le groupe et se trouve présent dans tous les lieux où il va (`actif: false` : il reste où il est).
  z.object({ escorte: z.object({ pnj: Id, actif: z.boolean().default(true) }) }).strict(),
  z.object({ debloquer: Id }).strict(),
  z.object({ rencontre: Id }).strict(),
  z.object({ fin: Id }).strict(),
  z.object({ blessure: z.object({ des: z.string().regex(/^\d*d\d+\s*([+-]\s*\d+)?$/, 'dés comme « 1d4 » ou « 2d6+1 »'), cible: z.enum(['un', 'tous']).default('un') }) }).strict(),
  z.object({ temps: z.number().positive().max(24) }).strict(),
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

export const CATEGORIES_OBJET = ['arme', 'armure', 'bouclier', 'potion', 'parchemin', 'baguette', 'anneau', 'bijou', 'vetement', 'outil', 'materiel', 'nourriture', 'livre', 'cle', 'quete', 'curiosite', 'monnaie-ancienne', 'gemme', 'objet-d-art', 'divers'] as const;
export const RARETES = ['commun', 'peu-commun', 'rare', 'tres-rare', 'legendaire'] as const;

/**
 * Ce qu'un consommable fait à celui qui le prend (potion, onguent, antidote…), en jeu comme en combat. Les soins d'un objet
 * (`usage.soins`) comptent comme une première action. La durée d'une aide de combat est `usage.rounds` (10 rounds = 1 minute).
 */
export const ActionObjet = z.union([
  z.object({ soins: z.string().regex(/^\d+d\d+([+-]\d+)?$/) }).strict(),
  z.object({ pvTemporaires: z.number().int().positive() }).strict(),
  // Met fin à ces états (identifiants du combat : empoisonne, aveugle, paralyse…).
  z.object({ retirerEtats: z.array(z.enum(ETATS)).min(1) }).strict(),
  // Résistance à un type de dégâts, à tous (« tous »), ou à un type tiré au d10 quand on boit (« au-hasard » : table de la potion de résistance).
  z.object({ resistance: z.string().min(1) }).strict(),
  // Un dé en plus à chaque jet d'attaque ou de sauvegarde (Bénédiction : 1d4).
  z.object({ de: z.object({ pour: z.enum(['attaque', 'sauvegarde']), de: z.string().regex(/^\d+d\d+$/) }) }).strict(),
  // La valeur de Force devient celle-ci (potions de force de géant) ; sans effet si elle est déjà supérieure ou égale.
  z.object({ force: z.number().int().min(11).max(30) }).strict(),
  // Objet de jet (acide, feu grégeois, eau bénite) : lancé sur un ennemi à portée, à la place d'une attaque ; sauvegarde contre le DD du lanceur
  // (8 + modificateur de Dextérité + maîtrise) ; `contre` : seulement ces types de créatures (« Fiélon », « Mort-vivant ») ; `enflamme` : la cible brûle.
  z.object({ jet: z.object({ sauvegarde: Caracteristique, des: z.string().regex(/^\d+d\d+$/), type: z.string().min(1), contre: z.array(z.string()).optional(), enflamme: z.boolean().optional(), portee: z.number().positive().default(6) }) }).strict(),
  // L'état Invisible (potion d'invisibilité) : attaques contre lui avec désavantage, les siennes avec avantage, jusqu'à ce qu'il attaque, inflige des dégâts ou lance un sort.
  z.object({ etat: z.literal('invisible') }).strict(),
  // Hâte (potion de vitesse) : +2 CA, Vitesse doublée, avantage aux sauvegardes de Dextérité, une attaque de plus par tour.
  z.object({ hate: z.literal(true) }).strict(),
  // Dégâts subis en le prenant (potion toxique).
  z.object({ degats: z.object({ des: z.string().regex(/^\d+d\d+$/), type: z.string().min(1) }) }).strict(),
]);
export type ActionObjet = z.infer<typeof ActionObjet>;

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
      // Ce que l'objet fait à un héros (voir `ActionObjet`) : un héros peut le porter en combat et le prendre par une action Bonus.
      agit: z.array(ActionObjet).default([]),
      // Durée de ses aides de combat, en rounds (10 = 1 minute) ; sans elle, jusqu'à la fin du combat.
      rounds: z.number().int().positive().optional(),
      // Les sorts que l'objet lance (parchemin, baguette, bâton) : un héros qui le porte les joue en combat, sans emplacement. `niveau` : le niveau
      // auquel le sort est lancé (par défaut le sien) ; `charges` : ce que ça coûte à un objet à charges (1 par défaut).
      sorts: z.array(z.object({ sort: Id, niveau: z.number().int().min(0).max(9).optional(), charges: z.number().int().positive().optional() })).default([]),
      // DD de sauvegarde et bonus d'attaque des sorts de l'objet.
      dd: z.number().int().min(5).max(30).optional(),
      attaque: z.number().int().min(0).max(20).optional(),
      // Un objet à charges : son nombre, et ce qu'il en regagne à l'aube (`des` + `bonus`) ; sans `recharge`, jamais.
      charges: z.object({ max: z.number().int().positive(), recharge: z.object({ des: z.string().regex(/^\d+d\d+$/), bonus: z.number().int().default(0) }).optional() }).optional(),
    })
    .optional(),
  identification: Dd.optional(),
  // Ce que le joueur voit tant qu'il n'a pas identifié l'objet (nom et description vagues) ; sans cela, l'objet se montre tel quel.
  inconnu: z.object({ nom: Texte, resume: Texte }).optional(),
  maudit: z.string().optional(),
  attunement: z.boolean().default(false),
  visuel: z.string().optional(),
  // Où il se porte (tête, cou, torse, dos, gants, ceinture, pieds, anneau, main) ; sans cela, le moteur le déduit de sa catégorie et de son identifiant (voir equipement/emplacements.ts).
  emplacement: z.enum(FAMILLES).optional(),
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
  // Piège de passage (corniche rongée, dalles au sol) : il part quand le groupe quitte le lieu sans l'avoir trouvé, au lieu d'attendre qu'on y prenne quelque chose.
  passage: z.boolean().default(false),
});
export type Piege = z.infer<typeof Piege>;

const Indice = z.object({ niveau: z.number().int().min(1).max(3), texte: Texte, competence: Competence.optional(), dd: Dd.optional() });

// La solution est vérifiable par le moteur : le MJ n'a pas à juger si la réponse est bonne.
const SolutionEnigme = z.discriminatedUnion('type', [
  z.object({ type: z.literal('sequence'), ordre: z.array(Texte).min(2) }),
  z.object({ type: z.literal('mot-de-passe'), mots: z.array(Texte).min(1) }),
  z.object({ type: z.literal('leviers'), positions: z.array(z.boolean()).min(2) }),
  z.object({ type: z.literal('placement'), emplacements: z.record(Id) }),
  // `plage` : valeurs que peut prendre chaque réglage (le formulaire en borne les champs) ; `libelles` : le nom de chaque réglage.
  z.object({
    type: z.literal('cadran'),
    valeurs: z.array(z.number().int()).min(1),
    plage: z.tuple([z.number().int(), z.number().int()]).optional(),
    libelles: z.array(Texte).optional(),
  }),
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
  monstres: z.array(z.object({ profil: Id, nombre: z.number().int().positive(), nom: z.string().optional(), pnj: Id.optional(), description: z.string().optional() })).default([]),
  // Carte de la grille tactique : « . » sol, « # » mur, « ~ » terrain difficile, « H » départ héros, « m » départ monstres.
  carte: z.array(z.string()).optional(),
  // Ambiance du plateau (textures) ; à défaut, le client choisit selon le lieu.
  terrain: z.enum(['foret', 'souterrain', 'caverne', 'camp']).optional(),
  tactique: z.object({ doctrine: z.string().optional(), fuite: z.string().optional(), renforts: z.string().optional() }).optional(),
  // Embuscade : le camp pris par surprise lance son Initiative avec Désavantage (SRD 5.2.1). Absent : personne n'est surpris.
  surprise: z.enum(['heros', 'monstres']).optional(),
  // Autres façons de résoudre la rencontre (négocier, ruser, fuir).
  alternatives: z
    .array(z.object({ id: Id, nom: Texte, condition: Condition.optional(), jet: z.object({ competence: Competence, dd: Dd }).optional(), resume: Texte, effets: Effets.default([]),
        // Un jet raté a un prix (fail forward) : ces effets s'appliquent à l'échec ; avec `echecResout`, l'échec dénoue aussi la rencontre (autrement, plus cher).
        echec: Effets.optional(), echecResout: z.boolean().default(false) }))
    .default([]),
  // `depouilles: false` : les adversaires n'ont rien sur eux (une rixe, un duel d'honneur, un spectre sans corps).
  butin: z.object({ tables: z.array(Id).default([]), tresors: z.array(Id).default([]), depouilles: z.boolean().default(true) }).default({}),
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
  // Ce que dit ou fait le joueur pour aborder le sujet, en quelques mots, naturellement (« Que savez-vous de la Lanterne ? »,
  // « Proposer de régler la dette »). C'est le libellé du bouton ; sans lui, le joueur ne voit que les mots-clés.
  question: z.string().optional(),
  // Ce que le PNJ dit au joueur : le jeu la montre TELLE QUELLE, sous le nom du PNJ, et le conteur la reçoit comme « texte de l'auteur,
  // déjà montré » (il ne la reformule pas). La parole libre et variable passe par `repondreEnPersonnage` et les fiches de savoir.
  reponse: Texte,
  // Le monde se souvient : la première variante dont la condition est vraie remplace `reponse` (qui reste le repli). Elle répond à la
  // même question que le sujet ; `revele` et `effets` restent ceux du sujet, communs à toutes les variantes.
  variantes: z.array(z.object({ condition: Condition, reponse: Texte })).default([]),
  revele: z.array(Id).default([]),
  effets: Effets.default([]),
  unique: z.boolean().default(false),
});

const PnjObjet = z.object({
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
  salutations: z.object({
    // Un registre de la bibliothèque commune (`salutations-communes.json`, partagée par toutes les histoires) : les salutations que le PNJ
    // n'écrit pas lui-même (neutre, amicale, hostile) en viennent, toujours les mêmes pour lui, déjà dites à voix haute. Pour les PNJ secondaires.
    commune: z.string().regex(/^[a-z0-9-]+$/).optional(),
    hostile: z.string().optional(),
    neutre: Texte,
    amical: z.string().optional(),
    // Le monde se souvient : la première variante dont la condition est vraie remplace la salutation (un acte passé, un choix, une jauge).
    variantes: z.array(z.object({ condition: Condition, texte: Texte })).default([]),
  }),
  boutique: z
    .object({
      // Un modèle de boutique commun à toutes les histoires (`apothicaire`, `alchimiste`, `arcaniste`, `magasin-general`, `forgeron` : voir `monde/butin-commun.json`) : son stock s'ajoute à celui-ci.
      modele: Id.optional(),
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

/**
 * Un PNJ. Avant la validation, `salutations.commune` est remplacé par les textes de la bibliothèque commune ; un registre inconnu est signalé.
 */
export const Pnj = z.preprocess(
  (brut) => resoudreSalutationsCommunes(brut),
  PnjObjet.superRefine((p, ctx) => {
    const c = p.salutations.commune;
    if (c && (p.salutations.neutre === REGISTRE_INCONNU || !SALUTATIONS_COMMUNES.registres.some((x) => x.id === c)))
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['salutations', 'commune'], message: `registre de salutations communes inconnu : « ${c} » (registres : ${nomsDesRegistres()})` });
  }),
);
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
  // Ce que le joueur voit de ce passage depuis ce lieu : où il mène, à quoi il ressemble, ce qu'on devine de l'autre côté
  // (une ou deux phrases, sans révéler ce qui s'y trouve ni aucun secret). Affichée sous le bouton de sortie. Sans elle, le
  // joueur ne lit rien avant d'y aller (puis le résumé du lieu, une fois visité).
  description: z.string().optional(),
  // La même chose vue depuis l'autre côté (lien à double sens). Sans elle, `description` sert aussi au retour.
  retour: z.string().optional(),
  // Destination qui n'existe pas (encore) dans le monde chargé : suite en préparation (`bientot`) ou contenu d'un pack que la partie n'a pas
  // (`pack`). Le passage reste visible, grisé, avec ce texte ; le validateur accepte alors un lieu inconnu. Dès que le lieu existe, le lien
  // fonctionne normalement et ce champ est ignoré.
  absent: z.object({ nom: z.string().min(1), motif: z.enum(['bientot', 'pack']), texte: z.string().min(1) }).strict().optional(),
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
  // Le récit d'arrivée : ce que le JOUEUR lit en entrant ici (à la première visite, puis quand une variante change). Sensoriel, au
  // présent, 60 à 150 mots, sans secret ni mécanique (jamais « jauge », DD…) ni ce qu'on peut y trouver (c'est le rôle de `description`,
  // qui est pour le MJ). Sans lui, le joueur ne lit que le résumé.
  arrivee: z.string().optional(),
  // Avant / Après : le lieu change avec l'histoire. La première variante dont la condition est vraie remplace `arrivee` ; le récit est
  // relu une fois, à la prochaine arrivée, quand la variante active change.
  arriveeVariantes: z.array(z.object({ condition: Condition, texte: Texte })).default([]),
  // Pour l'illustrateur : décrire ce qu'on voit, sans nommer les personnages.
  visuel: Texte,
  // La phrase que le joueur lit sous le bouton qui mène ici depuis le lieu parent (entrer dans un bâtiment, descendre
  // dans une salle) : ce qu'on voit du dehors, ce qui attire ou inquiète, sans secret ni contenu de la salle. Le lien
  // parent / enfant n'a pas de `description` propre : c'est elle qui l'explique.
  accroche: z.string().optional(),
  niveau: z.object({ min: z.number().int().min(1).max(20), max: z.number().int().min(1).max(20) }).optional(),
  liens: z.array(Lien).default([]),
  // Les PNJ, trésors, pièges, énigmes et événements se rattachent au lieu par leur propre champ `lieu`
  // (pas de liste ici : une seule source de vérité). Les rencontres, elles, ont un déclencheur propre au lieu.
  rencontres: z.array(z.object({ id: Id, declencheur: z.enum(['entree', 'exploration', 'repos', 'aleatoire']).default('entree'), condition: Condition.optional(), unique: z.boolean().default(true) })).default([]),
  faits: z.array(z.object({ fait: Id, decouverte: z.object({ auto: z.boolean().optional(), dd: Dd.optional(), competence: Competence.optional(), condition: Condition.optional() }).default({ auto: true }) })).default([]),
  evenements: z.array(Id).default([]),
  // Services de lieu habité : auberge, temple, forge, marché…
  services: z.array(z.string()).default([]),
  // Peut-on s'y reposer ? `sur` : une nuit entière (repos long : auberge, camp, refuge, maison) ; `dangereux` (défaut) : une halte
  // seulement (repos court), on n'y dort pas ; `impossible` : aucun repos (repaire, caserne, prison…).
  repos: z.enum(['sur', 'dangereux', 'impossible']).default('dangereux'),
  carte: z.array(z.string()).optional(),
  // Où ce lieu se trouve sur la carte illustrée de son parent (`images/manifeste.json`, groupe `cartes`), en pourcentage de
  // l'image (0 = bord gauche / haut, 100 = bord droit / bas). Sans position, la carte du jeu place le lieu en anneau.
  position: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }).optional(),
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
        // Où l'étape se joue (un lieu du monde) : le journal le dit, la carte et les sorties le signalent tant que l'étape est active.
        lieu: Id.optional(),
      }),
    )
    .min(1),
  recompenses: z.object({
    xp: z.number().int().min(0).default(0),
    pieces: z.number().int().min(0).default(0),
    objets: z.array(Id).default([]),
    effets: Effets.default([]),
    // Ce que le donneur promet, en clair, quand la récompense ne se calcule pas (« sa gratitude », « une place à sa table ») ;
    // les PX et l'or des étapes et des récompenses sont additionnés à part (`recompensesDeQuete`).
    annonce: z.string().optional(),
  }),
  // Une quête qui échoue (une étape dont l'`echec` devient vrai, ou l'effet `quete: echouee`) : ce qu'on lit et ce qui change.
  echec: z.object({ texte: Texte.optional(), effets: Effets.default([]) }).optional(),
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
  // `sens` : un palier se franchit en montant (par défaut : la menace grandit) ou en descendant (« baisse » : le danger reflue).
  // Avant le 11/11/2026 il se franchissait dans les deux sens : payer le péage racontait « la patrouille double le péage ».
  paliers: z.array(z.object({ seuil: z.number(), nom: Texte, narration: Texte, effets: Effets.default([]), sens: z.enum(['monte', 'baisse']).default('monte') })).default([]),
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
  // Taille du groupe pour laquelle l'histoire est écrite (4 ou 6 héros). Elle se joue de 1 à 6 héros : les combats s'adaptent
  // (`adapterRencontre`) ; ce champ sert à l'annoncer au joueur. 6 par défaut.
  groupe: z.object({ conseille: z.number().int().min(1).max(6) }).default({ conseille: 6 }),
  depart: z.object({ lieu: Id, intro: Texte }),
  // Direction artistique, qui complète la charte graphique commune.
  direction: z.object({ style: Texte, palette: z.array(Texte).min(2), motsCles: z.array(Texte).default([]), interdits: z.array(Texte).default([]) }),
  chapitres: z.array(Chapitre).min(1),
  // Ce que le MJ ne doit jamais faire dans ce monde (ex. magie ressuscitante).
  regles: z.array(Texte).default([]),
  // Le tirage d'arrivée (`monde/hasard-arrivee.ts`) : un dé à chaque arrivée dans un lieu (combat, rencontre, trouvaille ou rien). `false` le coupe.
  tirageArrivee: z.boolean().default(true),
  // Vivres (facultatif, 14/11/2026) : à chaque nouveau jour, chaque héros vivant mange une ration du sac du groupe (`objet`), sauf quand
  // le groupe se trouve dans un lieu dont `services` contient « repas » (on y mange à table). Sans ration, il a faim : `faim` en dégâts
  // (les PV ne descendent jamais sous 1). `depart` : jours de vivres par héros dans le sac au début de l'histoire.
  vivres: z
    .object({
      objet: Id.default('rations'),
      depart: z.number().int().min(0).max(20).default(0),
      faim: z.string().regex(/^\d*d\d+\s*([+-]\s*\d+)?$/, 'dés comme « 1d4 »').default('1d4'),
    })
    .optional(),
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
  /**
   * Données propres aux modules (dossier → éléments bruts), par exemple `scenes/` pour les scènes narrées.
   * Le moteur ne les connaît pas : chaque module valide les siennes (`Module.valider`).
   */
  extensions?: Record<string, unknown[]>;
}
