// Les rencontres en chemin. Le moteur de terres décide SI quelque chose survient et QUOI (une ligne de la table de la région) ;
// il ne compose ni monstres ni combat : le moteur de jeu le fait à partir de la ligne tirée, du niveau et de la taille du
// groupe. Le hasard vient de la graine du voyage et d'un compteur sauvegardé : même état, même tirage.
import { alea } from './rng';
import type { CarteTerres, ContexteVoyage, EntreeTable, EtatVoyage, Moment, Terrain } from './types';
import { moment } from './terrain';

/** Une vérification toutes les 30 minutes de marche, quelle que soit la taille des cases. */
export const INTERVALLE_RENCONTRE = 30;
/** Probabilité de base par vérification, de jour sur un terrain ordinaire. */
export const PROBABILITE_BASE = 0.2;
export const PROBABILITE_MAX = 0.85;
/** À moins de ce nombre de cases (losange) d'une ancre, on est « chez soi » : la probabilité est réduite. */
export const RAYON_SUR = 5;
export const FACTEUR_PRES_D_UNE_ANCRE = 0.25;

const FACTEUR_TERRAIN: Record<Terrain | 'route', number> = { route: 0.5, plaine: 1, foret: 1.2, colline: 1.1, montagne: 1.3, marais: 1.3, gue: 1.2, eau: 1 };
const FACTEUR_MOMENT: Record<Moment, number> = { jour: 1, aube: 1.3, crepuscule: 1.3, nuit: 2 };

type Position = Pick<EtatVoyage, 'x' | 'y' | 'minutes'>;

export const terrainDe = (carte: CarteTerres, x: number, y: number): { terrain: Terrain; surRoute: boolean } => {
  const i = y * carte.largeur + x;
  return { terrain: carte.tuiles[i]!, surRoute: carte.route[i] === 1 };
};

/** Probabilité qu'une rencontre survienne pendant une vérification, là où l'on se tient et à cette heure. */
export function probabiliteRencontre(carte: CarteTerres, p: Position, ctx: Pick<ContexteVoyage, 'facteurRencontre'> = {}, facteurExtra = 1): number {
  const { terrain, surRoute } = terrainDe(carte, p.x, p.y);
  let q = PROBABILITE_BASE * FACTEUR_TERRAIN[surRoute ? 'route' : terrain] * FACTEUR_MOMENT[moment(p.minutes)] * carte.danger * (ctx.facteurRencontre ?? 1) * facteurExtra;
  if (carte.ancres.some((a) => Math.abs(a.x - p.x) + Math.abs(a.y - p.y) <= RAYON_SUR)) q *= FACTEUR_PRES_D_UNE_ANCRE;
  return Math.min(PROBABILITE_MAX, Math.max(0, q));
}

/** Les lignes de la table qui conviennent ici et maintenant. */
export function entreesPossibles(table: readonly EntreeTable[], carte: CarteTerres, p: Position, ctx: Pick<ContexteVoyage, 'niveauGroupe'>): EntreeTable[] {
  const { terrain, surRoute } = terrainDe(carte, p.x, p.y);
  const m = moment(p.minutes);
  return table.filter((e) => {
    if (e.poids <= 0) return false;
    if (e.terrains?.length && !e.terrains.includes(terrain) && !(surRoute && e.terrains.includes('route'))) return false;
    if (e.moments?.length && !e.moments.includes(m)) return false;
    if (e.niveauMin !== undefined && ctx.niveauGroupe < e.niveauMin) return false;
    if (e.niveauMax !== undefined && ctx.niveauGroupe > e.niveauMax) return false;
    return true;
  });
}

/** Tire une ligne parmi les possibles, avec `r` dans [0, 1). Rien si aucune ne convient. */
export function choisirEntree(possibles: readonly EntreeTable[], r: number): EntreeTable | undefined {
  if (!possibles.length) return undefined;
  const total = possibles.reduce((s, e) => s + e.poids, 0);
  let reste = r * total;
  for (const e of possibles) {
    reste -= e.poids;
    if (reste < 0) return e;
  }
  return possibles[possibles.length - 1];
}

export type ResultatTirage = { genre: 'rien' } | { genre: 'signe' } | { genre: 'rencontre'; entree: EntreeTable; graine: number };

/**
 * Un tirage complet : consomme 2 tirages de l'état (le compteur avance, que quelque chose survienne ou non, pour que le déroulé
 * ne dépende pas de la table). Un « signe » (traces, cri) annonce parfois, sans rien déclencher, que des choses rôdent.
 */
export function tirerRencontre(etat: EtatVoyage, carte: CarteTerres, p: Position, table: readonly EntreeTable[], ctx: ContexteVoyage, facteurExtra = 1): { etat: EtatVoyage; resultat: ResultatTirage } {
  const q = probabiliteRencontre(carte, p, ctx, facteurExtra);
  const r = alea(etat.graine, etat.tirages);
  const choix = alea(etat.graine, etat.tirages + 1);
  const graineCombat = Math.floor(alea(etat.graine, etat.tirages + 2) * 4294967296);
  const suivant: EtatVoyage = { ...etat, tirages: etat.tirages + 3 };
  if (r < q) {
    const entree = choisirEntree(entreesPossibles(table, carte, p, ctx), choix);
    if (entree) return { etat: suivant, resultat: { genre: 'rencontre', entree, graine: graineCombat } };
  } else if (r < Math.min(PROBABILITE_MAX, q * 2) && q > 0.05) {
    return { etat: suivant, resultat: { genre: 'signe' } };
  }
  return { etat: suivant, resultat: { genre: 'rien' } };
}
