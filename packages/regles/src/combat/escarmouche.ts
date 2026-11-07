// Les escarmouches s'adaptent au groupe : un thème (une carte, un camp de monstres) et une difficulté deviennent une
// rencontre dont les PX suivent le budget du SRD (5.2.1) pour CE groupe : son niveau et son nombre de héros. Les PX ne
// disent pas tout (des goules paralysent, des ogres sont lents) : chaque thème porte un coefficient de danger, calé par
// simulation (`pnpm simuler escarmouches`), qui dit combien « pèse » vraiment une troupe de ce thème.
import { BUDGET_PX } from '../budget';
import type { Donnees } from '../donnees';
import { RENCONTRES, type Rencontre } from './prototype';

export type Difficulte = Rencontre['difficulte'];
export const DIFFICULTES: Difficulte[] = ['faible', 'moderee', 'elevee'];

export interface ThemeEscarmouche {
  id: string;
  nom: string;
  description: string;
  terrain: Rencontre['terrain'];
  carte: string[];
  /** Les chefs possibles du thème, du plus faible au plus fort. */
  chefs: string[];
  /** Les troupes : `poids` (part relative dans la troupe) et `max` (nombre au plus). */
  troupes: { profil: string; poids: number; max: number }[];
  /**
   * Le danger réel du thème rapporté à ses PX (1 : les PX disent vrai ; plus : la troupe est plus dangereuse que ses PX).
   * Calé sur la simulation d'équilibre (niveaux 1 à 5, six héros).
   */
  danger: number;
}

/** Le décor d'un thème : celui de la rencontre du prototype qui porte son identifiant. */
function base(id: string): Pick<ThemeEscarmouche, 'id' | 'nom' | 'description' | 'terrain' | 'carte'> {
  const { nom, description, terrain, carte } = RENCONTRES.find((r) => r.id === id)!;
  return { id, nom, description, terrain, carte };
}

/** Les thèmes : les cartes et le décor des rencontres du prototype, avec leurs troupes. */
export const THEMES: ThemeEscarmouche[] = [
  {
    ...base('embuscade-gobeline'),
    chefs: ['chef-gobelin', 'traqueur-gobelours'],
    troupes: [
      { profil: 'combattant-gobelin', poids: 6, max: 10 },
      { profil: 'sbire-gobelin', poids: 3, max: 8 },
      { profil: 'loup', poids: 2, max: 4 },
      { profil: 'loup-sanguinaire', poids: 2, max: 4 },
      { profil: 'combattant-gobelours', poids: 1, max: 2 },
    ],
    danger: 1,
  },
  {
    ...base('crypte'),
    chefs: ['momie', 'fantome', 'ame-en-peine'],
    troupes: [
      { profil: 'squelette', poids: 4, max: 8 },
      { profil: 'zombi', poids: 3, max: 6 },
      { profil: 'goule', poids: 2, max: 4 },
      { profil: 'ombre', poids: 1, max: 3 },
      { profil: 'spectre', poids: 1, max: 2 },
      { profil: 'ogre-zombi', poids: 1, max: 2 },
    ],
    danger: 0.8,
  },
  {
    ...base('bande-et-ogres'),
    chefs: ['chef-de-bande'],
    troupes: [
      { profil: 'bandit', poids: 5, max: 10 },
      { profil: 'eclaireur', poids: 2, max: 4 },
      { profil: 'ogre', poids: 2, max: 3 },
    ],
    danger: 0.85,
  },
  {
    ...base('camp-hobgobelin'),
    chefs: ['capitaine-hobgobelin', 'traqueur-gobelours'],
    troupes: [
      { profil: 'combattant-hobgobelin', poids: 4, max: 8 },
      { profil: 'combattant-gobelin', poids: 4, max: 6 },
      { profil: 'combattant-gobelours', poids: 1, max: 2 },
      { profil: 'sbire-gobelin', poids: 2, max: 4 },
    ],
    danger: 1.1,
  },
  {
    ...base('gue-des-brigands'),
    chefs: ['chef-de-bande'],
    troupes: [
      { profil: 'bandit', poids: 5, max: 10 },
      { profil: 'eclaireur', poids: 2, max: 6 },
      { profil: 'loup', poids: 2, max: 6 },
    ],
    // Calé par simulation le 04/11/2026 (16 parties, niveaux 2 à 4) : faible 100 %, modérée 88 à 100 %, élevée 56 à 63 %.
    danger: 1.4,
  },
  {
    ...base('col-gele'),
    chefs: ['traqueur-gobelours', 'combattant-gobelours'],
    troupes: [
      { profil: 'loup', poids: 4, max: 6 },
      { profil: 'loup-sanguinaire', poids: 3, max: 5 },
      { profil: 'combattant-gobelours', poids: 2, max: 3 },
      { profil: 'combattant-gobelin', poids: 3, max: 6 },
    ],
    // Calé par simulation le 04/11/2026 (16 parties, niveaux 2 à 4) : faible 100 %, modérée 88 à 100 %, élevée 31 à 81 %.
    danger: 1.25,
  },
];

/** Une rencontre composée pour un groupe : ce qui doit être joué, et ce qu'on en dit au joueur. */
export interface RencontreComposee extends Rencontre {
  /** Budget de PX pour ce groupe et cette difficulté. */
  budget: number;
  /** Ce que la rencontre pouvait dépenser : le budget, ramené au danger du thème. */
  depense: number;
  /** PX réels de la rencontre. */
  px: number;
}

const plafonner = (niveau: number) => Math.min(20, Math.max(1, Math.round(niveau)));

/**
 * Les trois difficultés, en multiples du budget « faible » du SRD. Le SRD donne 1, 1,5 et 2,7 fois ce budget au niveau 3 ;
 * la simulation (l'IA joue les deux camps) montre qu'au-delà de 1,5 fois les héros sont presque toujours battus : la
 * difficulté « élevée » du SRD est une rencontre mortelle, pas une rencontre dure.
 */
const COEFFICIENT_DIFFICULTE: Record<Difficulte, number> = { faible: 1, moderee: 1.45, elevee: 1.8 };

/** Le SRD suppose des héros mieux construits que ceux de la création rapide aux niveaux 1 et 4 : correction calée par simulation. */
const FACTEUR_NIVEAU: Record<number, number> = { 1: 1.4, 4: 0.8 };

/** Budget de PX pour ce groupe (somme de ce que vaut chaque héros selon son niveau) et cette difficulté. */
export function budgetDuGroupe(niveaux: number[], difficulte: Difficulte): number {
  const total = niveaux.reduce((s, n) => s + BUDGET_PX[plafonner(n)]![0] * (FACTEUR_NIVEAU[plafonner(n)] ?? 1), 0);
  return Math.round(total * COEFFICIENT_DIFFICULTE[difficulte]);
}

/** Nombre de monstres au plus : la carte et la lisibilité du combat en dépendent (6 pour un héros seul, 16 pour six). */
export const monstresMax = (heros: number) => Math.min(16, 4 + 2 * heros);

/**
 * Compose la rencontre d'un thème pour ce groupe : d'abord le chef (un, deux si le budget est énorme), puis les
 * troupes, en proportion de leurs poids, tant que le budget le permet. Déterministe. Un thème qui ne peut pas dépenser
 * tout le budget (pas assez de monstres puissants dans le catalogue) reste en dessous : voir `px` et `budget`.
 */
export function composerRencontre(theme: ThemeEscarmouche, niveaux: number[], difficulte: Difficulte, donnees: Donnees): RencontreComposee {
  const budget = budgetDuGroupe(niveaux, difficulte);
  const depense = budget / theme.danger;
  const px = (profil: string) => {
    const m = donnees.monstres.get(profil);
    if (!m) throw new Error(`Thème « ${theme.id} » : monstre inconnu « ${profil} ».`);
    return m.px;
  };
  const nMax = monstresMax(niveaux.length);
  const compte = new Map<string, number>();
  let reste = depense;
  let nombre = 0;
  const ajouter = (profil: string, n = 1) => {
    compte.set(profil, (compte.get(profil) ?? 0) + n);
    reste -= px(profil) * n;
    nombre += n;
  };

  // Le chef : le plus fort qui tient dans 55 % du budget (un camp sans son chef n'en est plus un) ; un second seulement si le budget est énorme devant lui.
  const chef = [...theme.chefs].reverse().find((c) => px(c) <= 0.55 * depense);
  if (chef) ajouter(chef, depense >= 12 * px(chef) ? 2 : 1);

  // Les troupes : pas de monstre seul qui domine (la moitié du budget au plus), un par un vers la proportion voulue.
  const lignes = theme.troupes.filter((t) => px(t.profil) <= Math.max(0.5 * depense, Math.min(...theme.troupes.map((x) => px(x.profil)))));
  for (;;) {
    const candidats = lignes.filter((t) => (compte.get(t.profil) ?? 0) < t.max && px(t.profil) <= reste && nombre < nMax);
    if (!candidats.length) break;
    candidats.sort((a, b) => (compte.get(a.profil) ?? 0) / a.poids - (compte.get(b.profil) ?? 0) / b.poids || px(b.profil) - px(a.profil));
    ajouter(candidats[0]!.profil);
  }
  // La place manque avant le budget (peu de monstres permis) : on remplace un monstre par un plus fort du même thème.
  for (let tour = 0; tour < 40 && reste > 0; tour++) {
    let meilleur: { de: string; vers: string; gain: number } | undefined;
    for (const [de] of compte) {
      if (de === chef) continue;
      for (const t of lignes) {
        const gain = px(t.profil) - px(de);
        if (gain <= 0 || gain > reste || (compte.get(t.profil) ?? 0) >= t.max) continue;
        if (!meilleur || gain > meilleur.gain) meilleur = { de, vers: t.profil, gain };
      }
    }
    if (!meilleur) break;
    compte.set(meilleur.de, compte.get(meilleur.de)! - 1);
    if (!compte.get(meilleur.de)) compte.delete(meilleur.de);
    compte.set(meilleur.vers, (compte.get(meilleur.vers) ?? 0) + 1);
    reste -= meilleur.gain;
  }
  // Un budget minuscule : au moins un monstre, le plus faible du thème.
  if (!nombre) ajouter([...lignes].sort((a, b) => px(a.profil) - px(b.profil))[0]!.profil);

  const ordre = [...(chef ? [chef] : []), ...theme.troupes.map((t) => t.profil)];
  const monstres = ordre.filter((p, i) => compte.has(p) && ordre.indexOf(p) === i).map((profil) => ({ profil, nombre: compte.get(profil)! }));
  return {
    id: theme.id,
    nom: theme.nom,
    description: theme.description,
    difficulte,
    terrain: theme.terrain,
    carte: theme.carte,
    monstres,
    budget,
    depense: Math.round(depense),
    px: monstres.reduce((s, m) => s + px(m.profil) * m.nombre, 0),
  };
}
