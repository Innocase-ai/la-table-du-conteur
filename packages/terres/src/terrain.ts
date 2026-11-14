import type { Case, Moment, Terrain } from './types';

export interface DefTerrain {
  libelle: string;
  /** Minutes pour entrer sur la case (avant l'échelle de la carte). Infinity : infranchissable. */
  cout: number;
  /** Hauteur du point de vue (cases de vision gagnées en s'y tenant). */
  hauteur: number;
  /** Bloque la ligne de vue vers un repère lointain. */
  coupeLaVue: boolean;
}

export const TERRAINS: Record<Terrain, DefTerrain> = {
  eau: { libelle: 'eau profonde', cout: Infinity, hauteur: 0, coupeLaVue: false },
  marais: { libelle: 'marais', cout: 15, hauteur: 0, coupeLaVue: false },
  plaine: { libelle: 'plaine', cout: 5, hauteur: 0, coupeLaVue: false },
  foret: { libelle: 'forêt', cout: 10, hauteur: 0, coupeLaVue: false },
  colline: { libelle: 'colline', cout: 10, hauteur: 1, coupeLaVue: false },
  montagne: { libelle: 'montagne', cout: 20, hauteur: 2, coupeLaVue: true },
  gue: { libelle: 'gué', cout: 12, hauteur: 0, coupeLaVue: false },
};

/** Minutes pour parcourir une case de route (6 sur un gué : on y passe plus lentement). */
export const COUT_ROUTE = 3;
export const COUT_GUE_ROUTE = 6;

export const MINUTES_PAR_JOUR = 1440;
/** La partie commence à 8 h. */
export const DEBUT_PARTIE = 8 * 60;

export const estFranchissable = (t: Terrain): boolean => Number.isFinite(TERRAINS[t].cout);

/** Minutes pour entrer sur une case, échelle de la carte comprise (Infinity : infranchissable). */
export function coutCase(terrain: Terrain, surRoute: boolean, bloquee: boolean, echelle: number): number {
  if (bloquee) return Infinity;
  const base = surRoute ? (terrain === 'gue' ? COUT_GUE_ROUTE : COUT_ROUTE) : TERRAINS[terrain].cout;
  return base * echelle;
}

// Le temps.

export function heureDuJour(minutes: number): number {
  return (((minutes % MINUTES_PAR_JOUR) + MINUTES_PAR_JOUR) % MINUTES_PAR_JOUR) / 60;
}

export const numeroJour = (minutes: number): number => Math.floor(minutes / MINUTES_PAR_JOUR) + 1;

/** Luminosité de 0 (nuit noire) à 1 (plein jour) : aube 5-7 h, jour 7-19 h, crépuscule 19-21 h, nuit 21-5 h. */
export function luminosite(minutes: number): number {
  const h = heureDuJour(minutes);
  if (h >= 7 && h < 19) return 1;
  if (h >= 5 && h < 7) return (h - 5) / 2;
  if (h >= 19 && h < 21) return (21 - h) / 2;
  return 0;
}

export function moment(minutes: number): Moment {
  const h = heureDuJour(minutes);
  if (h >= 7 && h < 19) return 'jour';
  if (h >= 5 && h < 7) return 'aube';
  if (h >= 19 && h < 21) return 'crepuscule';
  return 'nuit';
}

export const estNuit = (minutes: number): boolean => luminosite(minutes) < 0.5;

/** « 08h30 » */
export function formatHeure(minutes: number): string {
  const total = Math.floor(minutes);
  const h = Math.floor(heureDuJour(total));
  const m = ((total % 60) + 60) % 60;
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
}

/** Passerelle vers l'horloge du moteur de jeu (jour 1…, heure 0-23 éventuellement décimale). */
export const minutesDepuisHorloge = (jour: number, heure: number): number => (jour - 1) * MINUTES_PAR_JOUR + Math.round(heure * 60);
export const horlogeDepuisMinutes = (minutes: number): { jour: number; heure: number } => ({ jour: numeroJour(minutes), heure: heureDuJour(minutes) });

export const distanceLosange = (a: Case, b: Case): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
