// Le noyau du moteur : l'état de partie unique, les événements, les commandes et le contrat des modules.
// Voir docs/ARCHITECTURE-CIBLE.md. Tout ce qui se passe dans le jeu passe par une commande ; tout ce qui s'est
// passé est un événement. Les modules (exploration, dialogue, combat, inventaire…) se branchent ici.
import type { ZodTypeAny, z } from 'zod';
import type { Donnees } from '../donnees';
import type { EtatMonde, StatutQuete } from '../monde/etat';
import type { EtatExploration } from '../monde/exploration';
import type { CarteMonde } from '../monde/carte';
import type { FormulaireReponse } from '../monde/reponses';
import type { Personnage } from '../personnage';
import type { DonneesMonde } from '../monde/schemas';
import type { Generateur } from '../des';

/** Version du format de sauvegarde ; chaque changement de forme ajoute une migration (noyau/migrations.ts). */
export const VERSION_PARTIE = 2;

/** Un jet de dés fait par le moteur, montré au joueur tel quel. */
export interface Jet {
  qui: string;
  nom: string;
  /** Compétence, caractéristique ou « sauvegarde de con »… */
  test: string;
  dd: number;
  des: number[];
  bonus: number;
  total: number;
  reussite: boolean;
  avantage?: boolean;
  desavantage?: boolean;
  /** DD tenu secret (fouille) : le jet est montré, pas le DD. */
  ddSecret?: boolean;
}

/** Où en est le groupe : il explore, parle à quelqu'un, fait face à une rencontre, ou l'histoire est finie. */
export type Scene = { type: 'exploration' } | { type: 'dialogue'; pnj: string } | { type: 'rencontre'; rencontre: string } | { type: 'fin'; fin: string };

/** L'état complet d'une partie : du JSON, sauvegardable tel quel, versionné. */
export interface Partie {
  version: number;
  monde: string;
  /** État du hasard : une partie rechargée tire les mêmes dés. */
  graine: number;
  scene: Scene;
  groupe: Personnage[];
  /** État du monde (lieux, faits, quêtes, jauges…) et de son exploration. */
  etat: EtatMonde & { exploration: EtatExploration };
  /** État propre à chaque module, par id de module. */
  modules: Record<string, unknown>;
  /** Tout ce qui s'est passé, dans l'ordre. */
  journal: EvenementJeu[];
}

/**
 * Les événements, par type. Un module en ajoute en complétant cette interface :
 * `declare module '../noyau/types' { interface CarteEvenements { sortLance: { sort: string } } }`.
 */
export interface CarteEvenements {
  jet: { jet: Jet };
  /** Texte écrit par l'auteur du monde (narration, réponse d'un PNJ si `voix`). */
  texte: { texte: string; voix?: string };
  /** Fait établi par le moteur, en phrase simple. */
  constat: { texte: string };
  refus: { texte: string };
  /** Le groupe entre dans l'histoire (lieu de départ). */
  arrivee: { lieu: string };
  deplacement: { de: string; vers: string };
  faitAppris: { fait: string };
  decouverte: { cle: string };
  objetObtenu: { objet: string; quantite: number };
  objetPerdu: { objet: string; quantite: number };
  pieces: { delta: number; total: number };
  pvChange: { personnage: string; avant: number; apres: number };
  /** Une ressource durable d'un héros change (`potions`, `secondSouffle`…, ou `emplacement-<niveau>`). */
  ressourceChange: { personnage: string; ressource: string; avant: number; apres: number };
  xp: { delta: number; total: number };
  jaugeChange: { jauge: string; avant: number; apres: number };
  /** `nouvelle` : la quête vient d'entrer au journal. */
  queteMiseAJour: { quete: string; statut: StatutQuete; etapesAccomplies: string[]; nouvelle: boolean };
  sceneChange: { scene: Scene };
  fin: { fin: string };
  jourSuivant: { jour: number };
}

export type TypeEvenement = keyof CarteEvenements;
export type EvenementJeu<K extends TypeEvenement = TypeEvenement> = { [P in K]: { type: P } & CarteEvenements[P] }[K];

/** Le contenu (non modifiable) sur lequel tourne une partie. */
export interface ContexteJeu {
  dm: DonneesMonde;
  srd?: Donnees;
}

/** Ce qu'une commande ou une réaction peut faire pendant une action : lire et modifier le brouillon, émettre, tirer les dés. */
export interface Transaction {
  ctx: ContexteJeu;
  /** Copie de travail de la partie : la modifier directement. */
  partie: Partie;
  hasard: Generateur;
  emettre(e: EvenementJeu): void;
}

/**
 * Une action concrète proposée au joueur dans l'état présent (« Aller à la halle », « Crocheter le coffret ») :
 * l'écran en fait un bouton sans connaître la commande. Les indications de présentation (panneau, ligne, style)
 * restent génériques : un nouveau module apparaît à l'écran sans code d'interface.
 */
export interface PresentationMonstre {
  /** Le profil du catalogue SRD : le client en tire l'image du bestiaire commun. */
  profil: string;
  nom: string;
  nombre: number;
  /** Une ou deux phrases d'apparence ; absente quand on n'en a pas de juste (jamais de chiffre ni de capacité cachée). */
  description?: string;
}

export interface Proposition {
  /** Le panneau où ranger l'action ; les panneaux s'affichent par `ordre` croissant, dans l'onglet `onglet` (« Actions » par défaut). */
  groupe: { id: string; titre: string; ordre: number; description?: string; danger?: boolean; onglet?: string; monstres?: PresentationMonstre[] };
  libelle: string;
  /** Le ton ou la nature de l'action, affiché entre crochets avant le libellé (« Persuader » devant une réplique de conversation). */
  etiquette?: string;
  /** Précision affichée en petit (rôle d'un PNJ, compétence utilisée). */
  detail?: string;
  /** Texte d'aide au survol. */
  aide?: string;
  /** Un pictogramme du bouton (clé de `DESSINS`, ex. `base:fouiller`), affiché avant le libellé. */
  icone?: string;
  /** Une vignette (portrait d'un PNJ, image d'un lieu) du manifeste d'images du monde, affichée à gauche du bouton. */
  image?: { groupe: 'lieux' | 'pnj'; id: string };
  /** Une phrase d'explication affichée sous le bouton (où mène une sortie, ce que fait l'action), pour que le joueur sache pourquoi il clique. */
  apercu?: string;
  /** La commande à envoyer au moteur. */
  ordre?: Ordre;
  /** Action prise en charge par le client lui-même (ouvrir l'écran de combat). */
  intention?: 'combattre';
  /** La commande attend un texte du joueur, placé dans ce champ de l'ordre. */
  saisie?: { champ: string; indication: string };
  /** La commande attend une réponse structurée (des éléments dans l'ordre, des nombres, des leviers, un placement), placée dans le champ `champ` de l'ordre. */
  formulaire?: FormulaireReponse;
  /**
   * La commande attend un choix parmi des options (un héros, un sort…), placé dans ce champ de l'ordre. Une option qui
   * désigne un héros (`personnage`) s'affiche avec son portrait et ses points de vie.
   */
  choix?: { champ: string; indication: string; options: { valeur: string; libelle: string; detail?: string; personnage?: string; desactivee?: string }[] };
  style?: 'principal' | 'normal' | 'discret';
  /** Une action qu'on ne défait pas (jeter un objet) : l'écran demande un second clic pour confirmer. */
  confirmer?: boolean;
  /** Les propositions d'un même élément (un trésor, une sortie) s'affichent sur une ligne, sous son titre. */
  element?: { id: string; titre: string; danger?: boolean };
  /** Proposition visible mais impossible maintenant, avec la raison. */
  desactivee?: string;
}

/**
 * Une fiche d'information qu'un module montre au joueur (le contenu du sac, un livre de sorts, les quêtes en cours),
 * rangée dans un onglet. Comme les propositions, l'écran l'affiche sans connaître le module.
 */
export interface Encart {
  onglet: string;
  id: string;
  titre: string;
  ordre: number;
  texte?: string;
  /** Une ligne qui porte une `fiche` s'ouvre en fenêtre de parchemin quand le joueur la choisit. */
  lignes?: { libelle: string; valeur?: string; detail?: string; ton?: 'faible' | 'fort' | 'succes' | 'danger'; fiche?: FicheInfo; /** Id d'un sort : l'écran met à gauche le pictogramme de ce sort. */ sort?: string }[];
  /** Une grille d'éléments (objets d'un sac, sorts d'un livre…) : l'écran la montre en vignettes triables, avec une page plein écran. */
  grille?: GrilleElements;
  /** La carte du monde (lieux visités, repère du groupe) : l'écran la dessine sur l'image de la carte s'il y en a une. */
  carte?: CarteMonde;
}

/**
 * Une fiche d'information « importante » (un sort, une quête) : un titre, un tableau libellé / valeur et un texte. L'écran
 * la montre en fenêtre de parchemin, sans savoir de quoi elle parle.
 */
export interface FicheInfo {
  /** Le bandeau de la fenêtre (« Informations sur le sort »). */
  rubrique: string;
  titre: string;
  /** Sous le titre : l'école d'un sort, le type d'une quête. */
  sousTitre?: string;
  proprietes: { libelle: string; valeur: string }[];
  /** Le texte : description du sort, résumé et étapes d'une quête. Les paragraphes sont séparés par une ligne vide. */
  texte?: string;
}

export type Ton = 'faible' | 'fort' | 'succes' | 'danger';
export const RARETES_ELEMENT = ['commun', 'peu-commun', 'rare', 'tres-rare', 'legendaire'] as const;

/**
 * Un élément de grille. L'écran sait le ranger, le trier, le filtrer et en montrer la fiche sans rien savoir de ce qu'il
 * est : un objet du sac aujourd'hui, un sort ou une créature demain. Les actions qui le concernent sont les
 * propositions de l'onglet dont `element.id` est le sien.
 */
export interface ElementGrille {
  id: string;
  titre: string;
  quantite?: number;
  /** Le groupe où il se range (catégorie d'objet, niveau de sort…) ; les groupes s'affichent par `ordre` croissant. */
  groupe: { id: string; titre: string; ordre: number };
  /** Couleur du cadre, de commun à légendaire. */
  rarete?: (typeof RARETES_ELEMENT)[number];
  /** Image du monde (groupe du manifeste et id) ; sans elle, l'image commune de repli, puis l'icône. */
  image?: { groupe: string; id: string };
  /** Image commune à tous les mondes (galerie du moteur : équipement du SRD), quand le monde n'a pas la sienne. */
  imageCommune?: { groupe: string; id: string };
  /** Le héros qui le porte, quand l'élément n'est pas dans le sac mais sur quelqu'un. */
  porteur?: { id: string; nom: string };
  /** Identifiant de l'icône de repli (la catégorie de l'objet, par exemple). */
  icone?: string;
  resume?: string;
  /** Histoire ou longue description, montrée dans la fiche. */
  histoire?: string;
  /** Mesures lisibles qui servent aussi de critères de tri (valeur, poids…). */
  mesures?: { id: string; libelle: string; valeur: number; unite?: string }[];
  /** Autres informations (effets, conditions…). */
  proprietes?: { libelle: string; valeur: string }[];
  /** Arrivé depuis le dernier regard du joueur : l'écran envoie `ordreVu` quand le joueur le regarde. */
  nouveau?: boolean;
  ordreVu?: Ordre;
  /** Il reste quelque chose à découvrir : l'élément porte un « ? ». */
  inconnu?: boolean;
  /** Objet magique reconnu : l'écran le marque d'un éclat, quelle que soit sa rareté. Absent tant que l'objet reste à identifier. */
  magique?: boolean;
  ton?: Ton;
}

export interface GrilleElements {
  elements: ElementGrille[];
  /** Chiffres clés au-dessus de la grille (bourse, charge…). */
  resume?: { libelle: string; valeur: string; ton?: Ton }[];
  /** Ce qu'on lit quand la grille est vide. */
  vide?: string;
  /** Touche qui ouvre la page plein écran de l'onglet. */
  touche?: string;
}

export interface CommandeJeu<S extends ZodTypeAny = ZodTypeAny> {
  /** Ce que la commande fait, pour le joueur et pour le conteur (description de l'outil). */
  description: string;
  entree: S;
  /** Possible maintenant ? `true`, ou la raison du refus. Sans fonction : toujours possible. */
  disponible?(ctx: ContexteJeu, partie: Partie): true | string;
  /** Résout la commande ; renvoie une raison pour la refuser sans rien changer. */
  executer(t: Transaction, entree: z.infer<S>): void | { refus: string };
  /** Les actions concrètes que cette commande offre maintenant (pour les boutons). Sans fonction : aucune (outil du conteur seulement). */
  propositions?(ctx: ContexteJeu, partie: Partie): Proposition[];
}

export type Reaction<K extends TypeEvenement = TypeEvenement> = (t: Transaction, e: EvenementJeu<K>) => void;

export interface Module {
  id: string;
  dependances?: string[];
  /** État initial du module dans `partie.modules[id]`. */
  etatInitial?(ctx: ContexteJeu): unknown;
  commandes?: Record<string, CommandeJeu>;
  /** Réactions aux événements émis par n'importe quel module. */
  reactions?: { [K in TypeEvenement]?: Reaction<K> };
  /** Vues calculées pour l'interface et le conteur. */
  vues?: Record<string, (ctx: ContexteJeu, partie: Partie) => unknown>;
  /** Fiches d'information à montrer au joueur (onglets Sac, Grimoire, Journal…). */
  encarts?(ctx: ContexteJeu, partie: Partie): Encart[];
  /** Vérifie les données du module dans un monde (`dm.extensions`) : la liste des erreurs, vide si tout va bien. */
  valider?(ctx: ContexteJeu): string[];
  /** Conseils d'écriture sur les données du module (le monde reste jouable) : la liste des avis, vide si tout va bien. */
  conseils?(ctx: ContexteJeu): string[];
}

/** Une commande envoyée au moteur : son nom et ses paramètres. */
export type Ordre = { type: string } & Record<string, unknown>;

export interface ResultatOrdre {
  /** La nouvelle partie (l'ancienne n'est jamais modifiée). En cas de refus, c'est l'ancienne. */
  partie: Partie;
  evenements: EvenementJeu[];
  refus?: string;
}

/** Fonction utilitaire pour déclarer une commande avec inférence du type de son entrée. */
export function commande<S extends ZodTypeAny>(c: CommandeJeu<S>): CommandeJeu<S> {
  return c;
}
