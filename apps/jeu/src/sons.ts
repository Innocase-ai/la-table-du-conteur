// Lecture des bruitages (dossier `sons/`) : volume et sourdine du joueur, mémorisés dans le navigateur.
// Le choix du son pour chaque effet est dans `sons-regles.ts`.
import { useSyncExternalStore } from 'react';
import { SONS, type Son } from './sons-regles';

export interface ReglagesSon {
  actif: boolean;
  /** Entre 0 et 1. */
  volume: number;
}

const CLE = 'crpg.son';
const PAR_DEFAUT: ReglagesSon = { actif: true, volume: 0.6 };

const FICHIERS = Object.fromEntries(
  Object.entries(import.meta.glob<string>('./sons/*.mp3', { eager: true, query: '?url', import: 'default' })).map(([chemin, url]) => [
    chemin.replace(/^.*\/(.+)\.mp3$/, '$1'),
    url,
  ]),
) as Partial<Record<Son, string>>;

function lire(): ReglagesSon {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE) ?? 'null') as Partial<ReglagesSon> | null;
    return {
      actif: typeof brut?.actif === 'boolean' ? brut.actif : PAR_DEFAUT.actif,
      volume: typeof brut?.volume === 'number' ? Math.min(1, Math.max(0, brut.volume)) : PAR_DEFAUT.volume,
    };
  } catch {
    return PAR_DEFAUT;
  }
}

let reglages: ReglagesSon = lire();
const abonnes = new Set<() => void>();

export function reglagesSon(): ReglagesSon {
  return reglages;
}

export function regler(changement: Partial<ReglagesSon>): void {
  reglages = { ...reglages, ...changement, volume: Math.min(1, Math.max(0, changement.volume ?? reglages.volume)) };
  try {
    localStorage.setItem(CLE, JSON.stringify(reglages));
  } catch {
    // Stockage indisponible (navigation privée…) : le réglage vaut pour cette visite seulement.
  }
  for (const a of abonnes) a();
}

/** Les réglages de son, pour un composant React. */
export function useReglagesSon(): ReglagesSon {
  return useSyncExternalStore(
    (rappel) => {
      abonnes.add(rappel);
      return () => abonnes.delete(rappel);
    },
    reglagesSon,
  );
}

// Un élément audio par son, chargé une fois ; chaque lecture en clone un, pour que deux coups rapprochés se recouvrent.
const modeles = new Map<Son, HTMLAudioElement>();

function modele(nom: Son): HTMLAudioElement | undefined {
  const url = FICHIERS[nom];
  if (!url || typeof Audio === 'undefined') return undefined;
  let m = modeles.get(nom);
  if (!m) {
    m = new Audio(url);
    m.preload = 'auto';
    modeles.set(nom, m);
  }
  return m;
}

/** Charge tous les sons d'avance, pour qu'aucun ne se fasse attendre au premier coup. */
export function precharger(): void {
  for (const nom of SONS) modele(nom);
}

/** Joue un bruitage, sauf si le joueur a coupé le son. `volume` (0 à 1) ajuste ce son seul. */
export function jouerSon(nom: Son, volume = 1): void {
  if (!reglages.actif || reglages.volume <= 0) return;
  const m = modele(nom);
  if (!m) return;
  const lecture = m.cloneNode(true) as HTMLAudioElement;
  lecture.volume = Math.min(1, Math.max(0, reglages.volume * volume));
  // Le navigateur refuse de jouer avant tout geste du joueur : sans conséquence, le prochain coup passera.
  void lecture.play().catch(() => {});
}
