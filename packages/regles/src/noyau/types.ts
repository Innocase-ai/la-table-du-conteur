// Le noyau du moteur : l'état de partie unique, les événements, les commandes et le contrat des modules.
// Voir docs/ARCHITECTURE-CIBLE.md. Tout ce qui se passe dans le jeu passe par une commande ; tout ce qui s'est
// passé est un événement. Les modules (exploration, dialogue, combat, inventaire…) se branchent ici.
import type { ZodTypeAny, z } from 'zod';
import type { Donnees } from '../donnees';
import type { EtatMonde, StatutQuete } from '../monde/etat';
import type { EtatExploration } from '../monde/exploration';
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

export interface CommandeJeu<S extends ZodTypeAny = ZodTypeAny> {
  /** Ce que la commande fait, pour le joueur et pour le conteur (description de l'outil). */
  description: string;
  entree: S;
  /** Possible maintenant ? `true`, ou la raison du refus. Sans fonction : toujours possible. */
  disponible?(ctx: ContexteJeu, partie: Partie): true | string;
  /** Résout la commande ; renvoie une raison pour la refuser sans rien changer. */
  executer(t: Transaction, entree: z.infer<S>): void | { refus: string };
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
