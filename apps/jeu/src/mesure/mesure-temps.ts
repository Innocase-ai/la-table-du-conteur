// Mesure du temps de jeu réel, par histoire, pour recaler l'estimation de durée (`packages/regles/src/monde/estimation.ts`).
// Le temps ne compte que quand le joueur est là : onglet visible et une action (clic, touche, défilement) dans les 90 dernières
// secondes. Tout reste dans le navigateur (`localStorage`) ; rien n'est envoyé. Le joueur peut l'exporter ou l'effacer.
// Tolérant : un stockage indisponible ou abîmé ne produit jamais d'erreur.

export const CLE_MESURE = 'crpg.mesure-temps.v1';

/** Sans action depuis plus longtemps que cela, le joueur est parti : le temps ne compte plus. */
export const INACTIVITE_MAX_S = 90;
/** Pas d'échantillonnage du temps actif, en secondes. */
export const PAS_S = 5;

export interface MesureMonde {
  /** Temps actif cumulé, en secondes. */
  secondes: number;
  /** Actions de l'aventure (déplacer, fouiller, parler, acheter… : un changement de la partie hors combat). */
  actions: number;
  /** Nombre de fois où le joueur est entré dans l'histoire (reprises comprises). */
  sessions: number;
  premiere: string;
  derniere: string;
}
export type Mesures = Record<string, MesureMonde>;

const nombreOk = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x >= 0;

/** Lit des mesures enregistrées (texte JSON) ; ce qui est invalide est écarté, entrée par entrée. */
export function lireMesures(texte: string | null | undefined): Mesures {
  const res: Mesures = {};
  if (!texte) return res;
  let brut: unknown;
  try {
    brut = JSON.parse(texte);
  } catch {
    return res;
  }
  if (!brut || typeof brut !== 'object') return res;
  for (const [monde, v] of Object.entries(brut as Record<string, unknown>)) {
    if (!v || typeof v !== 'object') continue;
    const o = v as Record<string, unknown>;
    if (!nombreOk(o['secondes']) || !nombreOk(o['actions']) || !nombreOk(o['sessions'])) continue;
    res[monde] = {
      secondes: o['secondes'],
      actions: o['actions'],
      sessions: o['sessions'],
      premiere: typeof o['premiere'] === 'string' ? o['premiere'] : '',
      derniere: typeof o['derniere'] === 'string' ? o['derniere'] : '',
    };
  }
  return res;
}

const vide = (maintenant: Date): MesureMonde => ({ secondes: 0, actions: 0, sessions: 0, premiere: maintenant.toISOString(), derniere: maintenant.toISOString() });

/** Ajoute du temps actif à une histoire (fonction pure : rend de nouvelles mesures). */
export function ajouterSecondes(m: Mesures, monde: string, secondes: number, maintenant: Date): Mesures {
  const cur = m[monde] ?? vide(maintenant);
  return { ...m, [monde]: { ...cur, secondes: cur.secondes + Math.max(0, secondes), derniere: maintenant.toISOString() } };
}

export function ajouterAction(m: Mesures, monde: string, maintenant: Date): Mesures {
  const cur = m[monde] ?? vide(maintenant);
  return { ...m, [monde]: { ...cur, actions: cur.actions + 1, derniere: maintenant.toISOString() } };
}

export function ajouterSession(m: Mesures, monde: string, maintenant: Date): Mesures {
  const cur = m[monde] ?? vide(maintenant);
  return { ...m, [monde]: { ...cur, sessions: cur.sessions + 1, derniere: maintenant.toISOString() } };
}

/** Secondes à compter pour un échantillon : le pas si le joueur a agi récemment, sinon rien. */
export function tempsActif(derniereActionMs: number, maintenantMs: number, pas = PAS_S): number {
  return maintenantMs - derniereActionMs <= INACTIVITE_MAX_S * 1000 ? pas : 0;
}

export interface Bilan {
  monde: string;
  heures: number;
  actions: number;
  sessions: number;
  /** Secondes de jeu par action (la formule d'estimation en suppose 80). */
  secondesParAction: number | undefined;
  /** Rapport mesuré / estimé (1 = l'estimation était juste), si l'histoire est terminée ou assez avancée pour comparer. */
  rapport: number | undefined;
}

/** Compare la mesure à l'estimation de l'histoire (en heures). Sans action, pas de rapport. */
export function bilan(monde: string, mesure: MesureMonde, heuresEstimees: number | undefined): Bilan {
  const heures = mesure.secondes / 3600;
  return {
    monde,
    heures,
    actions: mesure.actions,
    sessions: mesure.sessions,
    secondesParAction: mesure.actions > 0 ? mesure.secondes / mesure.actions : undefined,
    rapport: heuresEstimees && heuresEstimees > 0 && mesure.actions > 0 ? heures / heuresEstimees : undefined,
  };
}

/** « 2 h 05 », « 12 min », « moins d'une minute ». */
export function dureeLisible(secondes: number): string {
  const minutes = Math.round(secondes / 60);
  if (minutes < 1) return "moins d'une minute";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
}

// --- Stockage ---------------------------------------------------------------------------------------------------------------

export function chargerMesures(): Mesures {
  try {
    return lireMesures(window.localStorage.getItem(CLE_MESURE));
  } catch {
    return {};
  }
}

function enregistrer(m: Mesures): void {
  try {
    window.localStorage.setItem(CLE_MESURE, JSON.stringify(m));
  } catch {
    // stockage indisponible : la mesure de cette session est perdue, le jeu continue
  }
}

export function noterSecondes(monde: string, secondes: number): void {
  enregistrer(ajouterSecondes(chargerMesures(), monde, secondes, new Date()));
}
export function noterAction(monde: string): void {
  enregistrer(ajouterAction(chargerMesures(), monde, new Date()));
}
export function noterSession(monde: string): void {
  enregistrer(ajouterSession(chargerMesures(), monde, new Date()));
}
export function effacerMesures(): void {
  try {
    window.localStorage.removeItem(CLE_MESURE);
  } catch {
    // rien à faire
  }
}

/** Le texte à exporter : les mesures et la version, pour `pnpm monde calibrer`. */
export function exporterMesures(m: Mesures): string {
  return JSON.stringify({ version: 1, exporteLe: new Date().toISOString(), mesures: m }, null, 2);
}
