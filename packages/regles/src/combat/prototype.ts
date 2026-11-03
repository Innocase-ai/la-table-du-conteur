// Contenu du prototype M1 : 6 héros pré-tirés de niveau 3 et quelques rencontres.
import type { Donnees } from '../donnees';
import { calculerFiche, type ChoixPersonnage, type Fiche } from '../fiche';
import { heroDepuisFiche, monstreDepuisProfil, type Kit } from './creation';
import type { Combattant } from './etat';
import { grilleDepuisTexte, type Grille, type Position, type Terrain } from './grille';

export interface HeroPreTire {
  choix: ChoixPersonnage;
  /** Portrait de la galerie qui sert de figurine (aucune image propre aux pré-tirés). */
  portrait: string;
  kit: Kit;
}

export const HEROS_PRE_TIRES: HeroPreTire[] = [
  {
    choix: {
      nom: 'Bran', classe: 'guerrier', niveau: 3, espece: 'humain', taille: 'M', historique: 'soldat', methode: 'standard',
      valeursBase: { for: 15, dex: 13, con: 14, int: 8, sag: 12, cha: 10 }, bonusHistorique: { for: 2, con: 1 },
      dons: ['defense'], competencesClasse: ['perception', 'survie'], competencesSupplementaires: ['intuition'],
      armure: 'cotte-de-mailles', bouclier: true,
    },
    portrait: 'humain-m-1',
    kit: { armes: [{ id: 'epee-longue', botte: true }, { id: 'javeline', botte: true }], potions: 1 },
  },
  {
    choix: {
      nom: 'Grukk', classe: 'barbare', niveau: 3, espece: 'orc', historique: 'soldat', methode: 'standard',
      valeursBase: { for: 15, dex: 13, con: 14, int: 8, sag: 12, cha: 10 }, bonusHistorique: { for: 2, con: 1 },
      competencesClasse: ['perception', 'survie'], competencesSupplementaires: ['nature'],
    },
    portrait: 'orc-m-1',
    kit: { armes: [{ id: 'hache-a-deux-mains', botte: true }, { id: 'hachette', botte: true }], potions: 1 },
  },
  {
    choix: {
      nom: 'Pip', classe: 'roublard', niveau: 3, espece: 'halfelin', historique: 'criminel', methode: 'standard',
      valeursBase: { for: 8, dex: 15, con: 14, int: 12, sag: 13, cha: 10 }, bonusHistorique: { dex: 2, con: 1 },
      competencesClasse: ['acrobaties', 'perception', 'investigation', 'tromperie'], expertises: ['discretion', 'perception'],
      armure: 'armure-de-cuir',
    },
    portrait: 'halfelin-m-1',
    kit: { armes: [{ id: 'rapiere', botte: true }, { id: 'arc-court', botte: true }], potions: 1 },
  },
  {
    choix: {
      nom: 'Sylvaine', classe: 'rodeur', niveau: 3, espece: 'elfe', historique: 'soldat', methode: 'standard',
      valeursBase: { for: 12, dex: 15, con: 13, int: 10, sag: 14, cha: 8 }, bonusHistorique: { dex: 2, con: 1 },
      dons: ['archerie'], competencesClasse: ['perception', 'discretion', 'survie'], competencesSupplementaires: ['intuition'],
      expertises: ['perception'], armure: 'armure-de-cuir-cloute',
    },
    portrait: 'elfe-f-1',
    kit: { armes: [{ id: 'arc-long', botte: true }, { id: 'epee-courte', botte: true }], sorts: ['marque-du-chasseur', 'soins'], potions: 1 },
  },
  {
    choix: {
      nom: 'Hilda', classe: 'clerc', niveau: 3, espece: 'nain', historique: 'acolyte', methode: 'standard',
      valeursBase: { for: 13, dex: 10, con: 14, int: 8, sag: 15, cha: 12 }, bonusHistorique: { sag: 2, cha: 1 },
      competencesClasse: ['medecine', 'persuasion'], armure: 'armure-d-ecailles', bouclier: true,
    },
    portrait: 'nain-f-1',
    kit: {
      armes: [{ id: 'masse-d-armes' }],
      sorts: ['flamme-sacree', 'benediction', 'soins', 'mot-de-guerison', 'eclair-tracant', 'bouclier-de-la-foi', 'arme-spirituelle', 'aide', 'immobilisation-de-personne'],
      potions: 1,
    },
  },
  {
    choix: {
      nom: 'Ambrine', classe: 'magicien', niveau: 3, espece: 'gnome', historique: 'sage', methode: 'standard',
      valeursBase: { for: 8, dex: 13, con: 14, int: 15, sag: 12, cha: 10 }, bonusHistorique: { int: 2, con: 1 },
      competencesClasse: ['investigation', 'nature'], expertises: ['arcanes'],
    },
    portrait: 'gnome-f-1',
    kit: {
      armes: [{ id: 'baton-de-combat' }, { id: 'dague' }],
      sorts: ['trait-de-feu', 'rayon-de-givre', 'poigne-electrique', 'projectile-magique', 'bouclier', 'mains-brulantes', 'sommeil', 'rayon-ardent', 'immobilisation-de-personne'],
      potions: 1,
    },
  },
];

export interface Rencontre {
  id: string;
  nom: string;
  description: string;
  difficulte: 'faible' | 'moderee' | 'elevee';
  /** Ambiance du plateau (textures du sol et des murs, packages/donnees/visuel/terrains.json). */
  terrain: Terrain;
  carte: string[]; // « . » sol, « # » mur, « ~ » terrain difficile, « H » départ des héros, « m » départ des monstres
  monstres: { profil: string; nombre: number }[];
}

export const RENCONTRES: Rencontre[] = [
  {
    id: 'embuscade-gobeline',
    terrain: 'foret',
    nom: 'Embuscade gobeline',
    description: 'Sur la route forestière, des gobelins et leurs loups jaillissent des fourrés.',
    difficulte: 'faible',
    carte: [
      '####################',
      '#..~~~....mmm..~~~.#',
      '#..~~.....m.m...~~.#',
      '#.......#.....#....#',
      '#..m....#.....#..m.#',
      '#.......~~~.~~~....#',
      '#..................#',
      '#...~~........~~...#',
      '#...~~..HHHH..~~...#',
      '#.......HH.........#',
      '#..................#',
      '####################',
    ],
    monstres: [
      { profil: 'chef-gobelin', nombre: 1 },
      { profil: 'combattant-gobelin', nombre: 6 },
      { profil: 'loup-sanguinaire', nombre: 2 },
    ],
  },
  {
    id: 'crypte',
    terrain: 'souterrain',
    nom: 'La crypte',
    description: 'Les morts se lèvent dans une crypte aux piliers effondrés.',
    difficulte: 'moderee',
    carte: [
      '####################',
      '#mm..#..mmm...#..mm#',
      '#....#........#....#',
      '#..m.....##.....m..#',
      '#........##........#',
      '#..##..........##..#',
      '#..##..........##..#',
      '#..................#',
      '#......HHHHHH......#',
      '#..................#',
      '####################',
    ],
    monstres: [
      { profil: 'squelette', nombre: 6 },
      { profil: 'zombi', nombre: 4 },
      { profil: 'goule', nombre: 4 },
    ],
  },
  {
    id: 'bande-et-ogres',
    terrain: 'caverne',
    nom: 'La bande et ses ogres',
    description: 'Une bande de brigands a recruté deux ogres pour garder son repaire.',
    difficulte: 'moderee',
    carte: [
      '####################',
      '#.....mmmmm........#',
      '#..#...m.m....#....#',
      '#..#..........#....#',
      '#.....~~~~~~.......#',
      '#..................#',
      '#....##......##....#',
      '#..................#',
      '#.....HHHHHH.......#',
      '####################',
    ],
    monstres: [
      { profil: 'chef-de-bande', nombre: 1 },
      { profil: 'bandit', nombre: 4 },
      { profil: 'ogre', nombre: 2 },
    ],
  },
  {
    id: 'camp-hobgobelin',
    terrain: 'camp',
    nom: 'Le camp hobgobelin',
    description: 'Un capitaine hobgobelin et ses troupes disciplinées défendent leur camp.',
    difficulte: 'elevee',
    carte: [
      '######################',
      '#....m..mmm..m.......#',
      '#...###......###.....#',
      '#.....m......m.......#',
      '#..m....~~~~.....m...#',
      '#.......~~~~.........#',
      '#....#..........#....#',
      '#....#..........#....#',
      '#....................#',
      '#......HHHHHH........#',
      '######################',
    ],
    monstres: [
      { profil: 'capitaine-hobgobelin', nombre: 1 },
      { profil: 'combattant-hobgobelin', nombre: 4 },
      { profil: 'combattant-gobelours', nombre: 1 },
      { profil: 'combattant-gobelin', nombre: 4 },
    ],
  },
];

/** Cases de départ marquées, puis les cases de sol libres les plus proches de ces marques. */
function departs(carte: string[], marque: string): Position[] {
  const marquees: Position[] = [];
  const sols: Position[] = [];
  carte.forEach((ligne, y) =>
    [...ligne].forEach((c, x) => {
      if (c === marque) marquees.push({ x, y });
      else if (c === '.') sols.push({ x, y });
    }),
  );
  const proximite = (p: Position) => Math.min(...marquees.map((m) => Math.max(Math.abs(m.x - p.x), Math.abs(m.y - p.y))));
  return [...marquees, ...sols.sort((a, b) => proximite(a) - proximite(b))];
}

/** Un héros prêt pour le combat : sa fiche calculée et son équipement de combat. */
export interface HeroCombat {
  fiche: Fiche;
  kit: Kit;
  /** Portrait de la galerie choisi par le joueur (`elfe-f-2`) : il sert de figurine sur le plateau. */
  portrait?: string;
  /** Dans une histoire : l'état du moment (PV, potions, usages, emplacements). Sans lui, le héros est au maximum. */
  etat?: { pv: number; ressources: Record<string, number>; emplacements: number[] };
}

export function herosPreTires(donnees: Donnees): HeroCombat[] {
  return HEROS_PRE_TIRES.map((h) => {
    const r = calculerFiche(h.choix, donnees);
    if (!r.ok) throw new Error(`${h.choix.nom} : ${r.erreurs.join(' ')}`);
    return { fiche: r.fiche, kit: h.kit, portrait: h.portrait };
  });
}

/** Prépare une rencontre ; sans `heros`, ce sont les 6 héros pré-tirés (jusqu'à 6 héros, placés sur les cases de départ). */
export function preparerRencontre(rencontre: Rencontre, donnees: Donnees, heros?: HeroCombat[]): { grille: Grille; combattants: Combattant[] } {
  const grille = grilleDepuisTexte(rencontre.carte.map((l) => l.replace(/[Hm]/g, '.')));
  const casesHeros = departs(rencontre.carte, 'H');
  const casesMonstres = departs(rencontre.carte, 'm');
  const ids = new Set<string>();
  const combattants: Combattant[] = (heros ?? herosPreTires(donnees)).map((h, i) => {
    let id = h.fiche.nom.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `heros-${i + 1}`;
    if (ids.has(id)) id = `${id}-${i + 1}`;
    ids.add(id);
    const c = { ...heroDepuisFiche(h.fiche, h.kit, donnees, casesHeros[i]!, id), portrait: h.portrait };
    if (h.etat) {
      c.pv = Math.max(1, h.etat.pv);
      c.ressources = { ...c.ressources, ...h.etat.ressources, reaction: 1 };
      if (c.incantation) c.incantation = { ...c.incantation, emplacements: [...h.etat.emplacements] };
    }
    return c;
  });
  let i = 0;
  for (const { profil, nombre } of rencontre.monstres) {
    const m = donnees.monstres.get(profil);
    if (!m) throw new Error(`Monstre inconnu : ${profil}`);
    for (let n = 1; n <= nombre; n++) {
      const position = casesMonstres[i++];
      if (!position) throw new Error(`${rencontre.id} : pas assez de cases de départ pour les monstres.`);
      combattants.push(monstreDepuisProfil(m, `${profil}-${n}`, position, nombre > 1 ? `${m.nom} ${n}` : m.nom));
    }
  }
  return { grille, combattants };
}
