// Les types du moteur de terres : ce que l'auteur déclare (`DefTerres`), ce qu'on en génère (`CarteTerres`) et ce qui
// change quand le groupe se promène (`EtatVoyage`). Rien ici ne dépend du moteur de jeu.

export type Terrain = 'eau' | 'marais' | 'plaine' | 'foret' | 'colline' | 'montagne' | 'gue';

export type BiomeId = 'prairie' | 'marais' | 'collines' | 'montagne' | 'neige' | 'desert';

export interface Case {
  x: number;
  y: number;
}

/** Un lieu écrit posé sur la carte (case d'entrée) : le moteur de jeu le relie à son lieu par `id`. */
export interface DefAncre {
  id: string;
  nom: string;
  /** Position sur la carte peinte du parent, en pourcentage (0-100) : comme `Lieu.position` du moteur de jeu. */
  position: { x: number; y: number };
  /** Case imposée : court-circuite la mise en page automatique. */
  case?: Case;
  /** Visible de loin (cases) : une tour, un moulin sur une crête. Absent : on ne le voit que de près. */
  rayonRepere?: number;
}

/** Un trajet écrit entre deux ancres : le moteur creuse une route et vérifie que sa durée reste proche. */
export interface DefLien {
  de: string;
  vers: string;
  /** Durée de l'auteur, en heures. */
  heures: number;
}

/** Une sorte de point d'intérêt hors route (puits, cairn, tour de guet, fumée au loin…). */
export interface TypePoi {
  id: string;
  nom: string;
  terrains: Terrain[];
  /** Poids du tirage parmi les types possibles. */
  poids: number;
  /** Visible de loin : rayon (cases), et reste-t-il visible la nuit (un feu) ou seulement le jour. */
  repere?: { rayon: number; nuit: boolean };
}

export interface DefTerres {
  id: string;
  /** Graine de la carte, fixée une fois par l'auteur : tous les joueurs voient la même. */
  graine: number;
  largeur: number;
  hauteur: number;
  biome: BiomeId;
  ancres: DefAncre[];
  liens: DefLien[];
  /** Multiplie le temps de chaque case (1 = plaine 5 min, route 3 min). Plus grand = un monde plus vaste en durée. */
  echelle?: number;
  /** Points d'intérêt par case de carte (défaut : un pour 220 cases). 0 : aucun. */
  densitePoi?: number;
  typesPoi?: TypePoi[];
  /** Danger de la région : multiplie la probabilité de rencontre (défaut 1). */
  danger?: number;
}

export interface Ancre {
  id: string;
  nom: string;
  x: number;
  y: number;
  rayonRepere?: number;
}

export interface PointInteret {
  id: string;
  type: string;
  nom: string;
  x: number;
  y: number;
  repere?: { rayon: number; nuit: boolean };
}

export interface CarteTerres {
  id: string;
  graine: number;
  largeur: number;
  hauteur: number;
  biome: BiomeId;
  echelle: number;
  danger: number;
  /** Version de l'algorithme de génération : une sauvegarde la garde pour détecter une carte qui aurait changé. */
  versionGenerateur: number;
  /** Terrain de chaque case, ligne par ligne (index = y * largeur + x). */
  tuiles: Terrain[];
  /** 1 = route (ou chemin) sur cette case. */
  route: Uint8Array;
  /** 1 = case bloquée par un décor (arbre dense, rocher, éboulis). */
  blocage: Uint8Array;
  ancres: Ancre[];
  liens: DefLien[];
  pois: PointInteret[];
}

export type Moment = 'nuit' | 'aube' | 'jour' | 'crepuscule';

/** État du groupe sur la carte : de quoi reprendre exactement où l'on s'est arrêté. */
export interface EtatVoyage {
  /** Version du format de cet état. */
  version: number;
  carte: string;
  graineCarte: number;
  versionGenerateur: number;
  x: number;
  y: number;
  /** Minutes écoulées depuis minuit du jour 1. */
  minutes: number;
  /** 1 = case déjà vue (même indexation que la carte). */
  explore: Uint8Array;
  /** Points d'intérêt : vu de loin, ou déjà visité. */
  pois: Record<string, 'vu' | 'visite'>;
  /** Ancres aperçues pendant la marche. */
  ancresVues: string[];
  /** Graine des tirages de rencontre et nombre de tirages déjà faits : tout le hasard du voyage tient dans ces deux nombres. */
  graine: number;
  tirages: number;
  /** Minutes de marche depuis le dernier tirage de rencontre. */
  minutesDepuisTirage: number;
  /** Cases parcourues depuis le début. */
  pas: number;
  /** Dernier terrain annoncé (pour ne raconter que les changements). */
  terrainAnnonce?: Terrain | 'route';
  /** Numéro du pas de la dernière annonce de terrain : on ne raconte pas chaque lisière. */
  pasAnnonce?: number;
  momentAnnonce?: Moment;
}

/** Ce que le moteur de jeu sait et passe au moteur de terres à chaque appel. */
export interface ContexteVoyage {
  /** Niveau du groupe (filtre les tables de rencontres). */
  niveauGroupe: number;
  tailleGroupe: number;
  /** Cases de vision en plus (Perception, vision dans le noir…). */
  bonusVision?: number;
  /** Le groupe a la vision dans le noir : la nuit ne réduit pas la vue. */
  visionNocturne?: boolean;
  /** Ancres que le groupe connaît déjà (carte de l'auteur, quête) : elles se voient de loin comme des repères. */
  ancresConnues?: string[];
  /** Multiplie la probabilité de rencontre (discrétion, escorte, éclaireur : < 1 ; bruit, richesse : > 1). */
  facteurRencontre?: number;
}

/** Une ligne de la table de rencontres de la région. Le moteur de terres tire ; le moteur de jeu compose. */
export interface EntreeTable {
  id: string;
  poids: number;
  /** Terrains où elle peut survenir (`route` : sur une route). Vide ou absent : partout. */
  terrains?: (Terrain | 'route')[];
  moments?: Moment[];
  niveauMin?: number;
  niveauMax?: number;
  /** Étiquettes libres, lues par le moteur de jeu (`combat`, `social`, `obstacle`, un thème d'escarmouche…). */
  genre: string;
  tags?: string[];
}

export interface RencontreErrante {
  entree: EntreeTable;
  x: number;
  y: number;
  terrain: Terrain;
  surRoute: boolean;
  moment: Moment;
  minutes: number;
  /** Graine propre à cette rencontre (composition, plateau, dés du combat). */
  graine: number;
}

export type RaisonArret = 'rencontre' | 'poi' | 'ancre' | 'bloque' | 'termine' | 'limite';

export type EvenementTerres =
  | { type: 'terrain'; terrain: Terrain | 'route'; texte: string }
  | { type: 'moment'; moment: Moment; texte: string }
  | { type: 'jour'; jour: number }
  | { type: 'repere'; cible: { genre: 'poi' | 'ancre'; id: string }; nom: string; direction: string; distance: number }
  | { type: 'poi'; poi: PointInteret }
  | { type: 'ancre'; ancre: Ancre }
  | { type: 'signe'; texte: string }
  | { type: 'rencontre'; rencontre: RencontreErrante }
  | { type: 'bloque'; raison: 'bord' | 'eau' | 'obstacle' };

export interface ResultatVoyage {
  etat: EtatVoyage;
  evenements: EvenementTerres[];
  /** Cases réellement parcourues dans cet appel. */
  pas: number;
  /** Minutes écoulées dans cet appel. */
  minutes: number;
  arret: RaisonArret;
  /** Le chemin qu'il reste à parcourir (vide si arrivé). */
  restant: Case[];
}
