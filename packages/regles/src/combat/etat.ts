// État d'un combat. Tout est sérialisable (pas de fonctions ni de Map), pour que l'IA
// puisse cloner l'état et simuler la suite, et pour les sauvegardes.
import type { ActionMonstre, Caracteristique, Degats, Etat } from '../schemas';
import type { Doctrine } from './doctrine';
import type { Grille, Position } from './grille';

export type Camp = 'heros' | 'monstres';

export const TAILLES = ['TP', 'P', 'M', 'G', 'TG', 'Gig'] as const;
export type Taille = (typeof TAILLES)[number];

export type Botte = 'sape' | 'ouverture' | 'renversement' | 'ralentissement' | 'poussee' | 'ecorchure' | 'enchainement' | 'coup-double';

export interface AttaqueArme {
  id: string;
  nom: string;
  mode: 'corps-a-corps' | 'distance';
  caracteristique: Caracteristique;
  bonusAttaque: number;
  degats: Degats[]; // le modificateur de caractéristique est déjà dans `bonus`
  allonge: number; // mètres (corps à corps)
  portees?: [number, number]; // mètres (distance ou lancer)
  finesse: boolean;
  botte?: Botte;
  /** Arme Légère (SRD 5.2.1) : attaquer avec elle ouvre l'attaque de la main gauche, en action bonus, avec une autre arme Légère. */
  legere?: boolean;
  /** Arme tenue de la main gauche : elle sert à l'attaque de la main gauche (dégâts sans le modificateur de caractéristique s'il est positif). */
  main?: 'gauche';
}

export interface EtatActif {
  etat: Etat;
  source?: string; // id du combattant à l'origine
  sort?: string; // sort qui l'impose (prend fin avec la concentration)
  // Sauvegarde répétée à la fin de chaque tour de la cible.
  sauvegarde?: { caracteristique: Caracteristique; dd: number };
  // Fin automatique à la fin du prochain tour de ce combattant.
  finTourDe?: string;
  // Laisse passer la prochaine fin de tour de `finTourDe` (l'état est posé pendant ce tour : « jusqu'à la fin de votre prochain tour »).
  passerFin?: boolean;
  // Fin automatique au début du prochain tour de ce combattant (« jusqu'au début de votre tour suivant »).
  jusquAuDebutDe?: string;
  // Prend fin si la créature subit des dégâts (Sommeil).
  finSurDegats?: boolean;
  // DD pour s'échapper (empoignade, toile).
  evasion?: number;
}

export type TypeModificateur =
  | 'bonus_ca'
  | 'de_attaque' // ajoute un dé aux jets d'attaque (Bénédiction : 1d4 ; Fléau : -1d4)
  | 'de_inspiration' // dé d'Inspiration bardique : ajouté une fois à un jet d'attaque ou de sauvegarde raté, s'il peut le rattraper
  | 'de_sauvegarde'
  | 'avantage_attaque' // avantage à la prochaine attaque de ce combattant
  | 'desavantage_attaque' // désavantage à la prochaine attaque de ce combattant
  | 'avantage_contre' // la prochaine attaque contre ce combattant a l'avantage
  | 'vitesse'
  | 'bonus_attaque'
  | 'de_degats' // dés de dégâts en plus à la prochaine attaque touchée
  | 'degats_differes' // dégâts infligés à la fin du tour du porteur, une seule fois (Flèche acide)
  | 'hate' // Hâte : une attaque de plus par tour, avantage aux sauvegardes de Dextérité (la CA et la Vitesse sont des modificateurs à part)
  | 'resistance' // résistance à un type de dégâts (`typeDegats`) ou à tous (`tous`) tant que le modificateur dure (potions)
  | 'repere'; // sans effet sur les jets : sert seulement à montrer un état en cours (aura d'Aide)

export interface Modificateur {
  id: string;
  type: TypeModificateur;
  valeur?: number;
  de?: string; // « 1d4 », « -1d4 »
  source: string; // combattant à l'origine
  sort?: string; // lié à la concentration de ce sort
  // Fin : au début ou à la fin du tour d'un combattant, ou après un usage.
  // `apres` : nombre de ces moments à laisser passer avant d'expirer (1 : « jusqu'à la fin de votre prochain tour »).
  expire?: { moment: 'debut_tour' | 'fin_tour'; de: string; apres?: number };
  usageUnique?: boolean;
  typeDegats?: string; // pour `degats_differes`
  /** `degats_differes` qui se répète à chaque fin de tour du porteur tant qu'il dure (créature en flammes). */
  repete?: boolean;
  // Restreint à des attaques contre une cible donnée (Ouverture).
  contre?: string;
}

export interface TourCourant {
  mouvement: number; // mètres restants
  action: boolean;
  bonus: boolean;
  attaquesRestantes: number; // attaques de l'action Attaque encore disponibles
  desengage: boolean;
  esquive: boolean;
  aBouge: boolean;
  sortEmplacementLance: boolean;
  sortBonusLance: boolean;
  sournoiseUtilisee: boolean;
  proieUtilisee: boolean;
  enchainementUtilise: boolean;
  frenesieUtilisee: boolean;
  temeraire: boolean;
  elanJoue: boolean;
  /** L'action Attaque a été entreprise ce tour-ci (Frappe bonus des Arts martiaux). */
  attaqueEntreprise: boolean;
  /** Frappe étourdissante déjà tentée ce tour-ci (une fois par tour). */
  etourdissanteUtilisee: boolean;
  /** Jeu d'armes déjà changé ce tour-ci (une interaction avec un objet par tour : carte « Changer d'armes »). */
  armesChangees?: boolean;
  /** Une attaque avec une arme Légère tenue de la main droite a été faite ce tour-ci, pendant l'action Attaque. */
  attaqueLegere?: boolean;
  /** L'attaque de la main gauche a déjà été faite ce tour-ci. */
  attaqueGaucheFaite?: boolean;
  /** La dernière attaque d'arme qui a touché ce tour-ci (Châtiment divin, Frappe étourdissante). */
  dernierCoup?: { cible: string; corpsACorps: boolean; critique: boolean; mainsNues: boolean };
}

export interface Combattant {
  id: string;
  nom: string;
  camp: Camp;
  modele: string; // classe du héros ou id du monstre
  /** Portrait de galerie d'un héros (figurine) ; un monstre est illustré d'après son `modele`. */
  portrait?: string;
  type: string; // « Humanoïde », « Mort-vivant »…
  taille: Taille;
  niveau: number; // niveau du héros ; 0 pour un monstre
  position: Position;
  pv: number;
  pvMax: number;
  pvTemp: number;
  caBase: number;
  vitesse: number;
  mods: Record<Caracteristique, number>;
  sauvegardes: Record<Caracteristique, number>;
  /** Bonus de compétence utiles en combat (Athlétisme, Acrobaties…), maîtrise comprise ; absent : le modificateur seul. */
  competences?: Record<string, number>;
  bonusInitiative: number;
  bonusMaitrise: number;
  resistances: string[];
  immunites: string[];
  vulnerabilites: string[];
  immunitesEtats: Etat[];
  /** Objets confiés au héros pour ce combat (potions…), par identifiant : leur nombre est dans `ressources['objet:<id>']`. */
  objetsEmbarques?: Record<string, import('./objets').ObjetEmbarque>;
  etats: EtatActif[];
  modificateurs: Modificateur[];
  attaques: AttaqueArme[];
  actionsMonstre: ActionMonstre[];
  traits: string[]; // ids de traits et d'aptitudes de combat (« attaque-sournoise », « tactique-de-groupe »…)
  sorts: string[];
  incantation?: { dd: number; bonusAttaque: number; modificateur: number; emplacements: number[]; emplacementsMax: number[] };
  ressources: Record<string, number>;
  concentration?: { sort: string; cibles: string[] };
  rage: boolean;
  initiative: number;
  mort: boolean;
  jetsMort: { succes: number; echecs: number };
  stable: boolean;
  enFuite: boolean;
  tour: TourCourant;
  elan?: { pioche: string[]; main: string[]; defausse: string[] };
  px: number;
  /**
   * L'autre jeu d'armes d'un héros (celui qui n'est pas en main) : ses attaques, sa CA (le bouclier suit le jeu) et le manque de
   * formation qu'il entraîne. La carte « Changer d'armes » l'échange avec `attaques` et `caBase`. Le numéro du jeu en main est
   * gardé dans `ressources.jeuArmes` (1 ou 2), qui revient à l'histoire avec les autres ressources à la fin du combat.
   */
  autreJeu?: { attaques: AttaqueArme[]; caBase: number; sansFormation?: boolean; nom: string; image?: string };
  /** Armure ou bouclier porté sans formation : désavantage aux attaques et aux jets de Force et de Dextérité, pas d'incantation. */
  sansFormation?: boolean;
  /** Ce qui distingue sa conduite au combat de celle de son camp (absent : il suit la doctrine de son camp). */
  doctrine?: Partial<Doctrine>;
}

export interface Evenement {
  round: number;
  type: 'info' | 'tour' | 'deplacement' | 'attaque' | 'degats' | 'soins' | 'sort' | 'etat' | 'mort' | 'fin';
  texte: string;
  acteur?: string;
  cible?: string;
  valeur?: number;
  /** Détails structurés pour l'animation et, plus tard, la narration. */
  details?: DetailsEvenement;
}

export interface DetailsEvenement {
  /** Déplacement : cases traversées, départ exclu. */
  chemin?: Position[];
  /** Jet d'attaque. */
  resultat?: 'touche' | 'critique' | 'rate';
  de?: number;
  total?: number;
  ca?: number;
  avantage?: boolean;
  desavantage?: boolean;
  /** L'attaque part à distance (projectile à animer). */
  distance?: boolean;
  /** Sort lancé ou à l'origine de l'attaque. */
  sort?: string;
  /**
   * Attaque d'arme : identifiant de l'arme du héros (`epee-longue`, `javeline-lancer` pour une arme lancée) ou de
   * l'action du monstre (`morsure`). Sert à la mise en scène (bruitages) sans relire le texte du journal.
   */
  arme?: string;
  /** Cases touchées par une zone d'effet. */
  cases?: Position[];
  /** Point visé (sort de zone). */
  point?: Position;
  /** Sauvegarde : réussie ou ratée. */
  sauvegarde?: 'reussie' | 'ratee';
  critique?: boolean;
  types?: string[];
  /** Attaque : la cible est à couvert derrière un obstacle bas (+2 à sa CA, déjà compris dans `ca`). */
  couvert?: number;
  /** Dégâts : la cible résiste, est vulnérable ou immunisée (affiché par l'animation). */
  reaction?: 'resiste' | 'vulnerable' | 'immunise';
}

/**
 * Zone qui reste sur le plateau tant que le sort dure (Sphère de feu, Rayon de lune, Invocation d'animaux, Appel de la foudre).
 * Elle disparaît quand le lanceur perd sa concentration.
 */
export interface ZonePersistante {
  id: string;
  sort: string;
  lanceur: string;
  centre: Position;
  rayon: number; // en cases (distance de Chebyshev depuis le centre)
  /** Ce qu'elle inflige à qui la déclenche ; ses dés viennent du sort et du niveau d'emplacement. */
  degats?: { des: string; type: string; caracteristique: Caracteristique; dd: number; moitie: boolean };
  /** Quand une créature la déclenche : en finissant son tour dedans, ou en y entrant. Vide : elle ne sert que de repère (nuage d'orage). */
  declencheurs: ('fin_tour' | 'entree')[];
  /** Créature → round du dernier déclenchement (au plus une fois par tour de table). */
  declenches: Record<string, number>;
  niveau: number;
}

export interface EtatCombat {
  grille: Grille;
  combattants: Combattant[];
  ordre: string[];
  actif: number; // index dans `ordre`
  round: number;
  rng: number; // état du générateur (mulberry32)
  journal: Evenement[];
  vainqueur?: Camp;
  options: { elan: boolean };
  /** Résultats de dés imposés, consommés avant le générateur (tests, scènes scriptées). */
  desImposes?: number[];
  /** Zones de sorts qui durent (absent : aucune). */
  zones?: ZonePersistante[];
}

export function combattant(etat: EtatCombat, id: string): Combattant {
  const c = etat.combattants.find((x) => x.id === id);
  if (!c) throw new Error(`Combattant inconnu : ${id}`);
  return c;
}

export function actif(etat: EtatCombat): Combattant {
  return combattant(etat, etat.ordre[etat.actif]!);
}

export function aEtat(c: Combattant, e: Etat): boolean {
  return c.etats.some((x) => x.etat === e);
}

/** Hors de combat : mort, inconscient (0 PV) ou en fuite. */
export function horsCombat(c: Combattant): boolean {
  return c.mort || c.enFuite || (c.pv <= 0 && c.camp === 'heros');
}

/** Peut agir à son tour (ni hors de combat, ni neutralisé). */
export function peutAgir(c: Combattant): boolean {
  return !horsCombat(c) && !c.etats.some((e) => ['inconscient', 'neutralise', 'paralyse', 'etourdi'].includes(e.etat));
}

export function ennemis(etat: EtatCombat, c: Combattant): Combattant[] {
  return etat.combattants.filter((x) => x.camp !== c.camp && !horsCombat(x));
}

/**
 * Ce qu'on peut viser d'une attaque : les ennemis encore debout, plus un héros tombé à 0 PV (ni mort, ni en fuite). Le frapper lui
 * coûte un échec au jet contre la mort, deux sur un critique (SRD 5.2.1) ; l'IA ne le vise qu'à défaut d'autre cible.
 */
export function adversairesCiblables(etat: EtatCombat, c: Combattant): Combattant[] {
  return etat.combattants.filter((x) => x.camp !== c.camp && !x.mort && !x.enFuite && (!horsCombat(x) || (x.camp === 'heros' && x.pv <= 0)));
}

export function allies(etat: EtatCombat, c: Combattant): Combattant[] {
  return etat.combattants.filter((x) => x.camp === c.camp && x.id !== c.id && !horsCombat(x));
}

/** Copie d'un combattant : seuls les champs qui changent en combat sont dupliqués ; le reste (profil, attaques) est partagé. */
function clonerCombattant(c: Combattant): Combattant {
  return {
    ...c,
    position: { ...c.position },
    etats: c.etats.map((e) => ({ ...e })),
    modificateurs: c.modificateurs.map((m) => ({ ...m })),
    ressources: { ...c.ressources },
    incantation: c.incantation && { ...c.incantation, emplacements: [...c.incantation.emplacements] },
    concentration: c.concentration && { ...c.concentration, cibles: [...c.concentration.cibles] },
    jetsMort: { ...c.jetsMort },
    tour: { ...c.tour },
    elan: c.elan && { pioche: [...c.elan.pioche], main: [...c.elan.main], defausse: [...c.elan.defausse] },
  };
}

/** Copie pour simulation : la grille est partagée (immuable) et le journal repart vide. */
export function cloner(etat: EtatCombat): EtatCombat {
  return { ...etat, combattants: etat.combattants.map(clonerCombattant), ordre: [...etat.ordre], journal: [], desImposes: undefined, zones: etat.zones ? structuredClone(etat.zones) : undefined };
}

/** Tirage déterministe à partir de l'état (mulberry32), pour que les clones rejouent à l'identique. */
export function aleatoire(etat: EtatCombat): number {
  etat.rng = (etat.rng + 0x6d2b79f5) >>> 0;
  let t = etat.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function de(etat: EtatCombat, faces: number): number {
  const impose = etat.desImposes?.shift();
  if (impose !== undefined) return Math.min(faces, Math.max(1, impose));
  return Math.floor(aleatoire(etat) * faces) + 1;
}

/** Lance « 2d6 », « -1d4 » ou « 3 » ; `multiplier` double les dés pour un critique. */
export function lancerDes(etat: EtatCombat, expression: string, multiplier = 1): number {
  const negatif = expression.startsWith('-');
  const expr = negatif ? expression.slice(1) : expression;
  const m = /^(\d*)d(\d+)$/.exec(expr);
  let total: number;
  if (!m) total = Number(expr);
  else {
    total = 0;
    const n = (m[1] ? Number(m[1]) : 1) * multiplier;
    for (let i = 0; i < n; i++) total += de(etat, Number(m[2]));
  }
  return negatif ? -total : total;
}

export function journaliser(etat: EtatCombat, ev: Omit<Evenement, 'round'>): void {
  etat.journal.push({ round: etat.round, ...ev });
}
