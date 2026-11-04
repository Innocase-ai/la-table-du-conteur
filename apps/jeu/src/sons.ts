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

// Lecture par Web Audio : chaque son est téléchargé et décodé une fois, puis joué instantanément (un élément <audio>
// met, lui, plusieurs dizaines de millisecondes à démarrer, ce qui décale le bruit d'un coup par rapport à l'image).
// Deux coups rapprochés se recouvrent sans se couper.
let contexteAudio: AudioContext | undefined;
const tampons = new Map<Son, AudioBuffer>();
const chargements = new Map<Son, Promise<void>>();

function audio(): AudioContext | undefined {
  if (contexteAudio) return contexteAudio;
  if (typeof window === 'undefined') return undefined;
  const Contexte = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Contexte) return undefined;
  contexteAudio = new Contexte({ latencyHint: 'interactive' });
  return contexteAudio;
}

function charger(nom: Son): Promise<void> {
  const deja = chargements.get(nom);
  if (deja) return deja;
  const url = FICHIERS[nom];
  const ctx = audio();
  if (!url || !ctx) return Promise.resolve();
  const p = fetch(url)
    .then((r) => r.arrayBuffer())
    .then((octets) => ctx.decodeAudioData(octets))
    .then((tampon) => {
      tampons.set(nom, tampon);
    })
    .catch(() => {
      // Son illisible : on retentera au prochain appel, et l'élément <audio> sert de repli d'ici là.
      chargements.delete(nom);
    });
  chargements.set(nom, p);
  return p;
}

// Le navigateur garde le contexte audio en veille tant que le joueur n'a ni cliqué ni tapé : on le réveille au premier geste.
let deverrouille = false;
function deverrouiller(): void {
  if (deverrouille || typeof window === 'undefined') return;
  deverrouille = true;
  const reveil = () => {
    void audio()?.resume();
    window.removeEventListener('pointerdown', reveil);
    window.removeEventListener('keydown', reveil);
  };
  window.addEventListener('pointerdown', reveil);
  window.addEventListener('keydown', reveil);
}

/** Télécharge et décode tous les sons d'avance, pour qu'aucun ne se fasse attendre au premier coup. */
export function precharger(): void {
  deverrouiller();
  for (const nom of SONS) void charger(nom);
}

/** Repli quand Web Audio n'est pas disponible, ou que le son n'est pas encore décodé : un élément <audio>. */
function jouerParElement(nom: Son, volume: number): void {
  const url = FICHIERS[nom];
  if (!url || typeof Audio === 'undefined') return;
  const lecture = new Audio(url);
  lecture.volume = volume;
  // Le navigateur refuse de jouer avant tout geste du joueur : sans conséquence, le prochain coup passera.
  void lecture.play().catch(() => {});
}

/** Joue un bruitage, sauf si le joueur a coupé le son. `volume` (0 à 1) ajuste ce son seul. */
export function jouerSon(nom: Son, volume = 1): void {
  if (!reglages.actif || reglages.volume <= 0) return;
  const niveau = Math.min(1, Math.max(0, reglages.volume * volume));
  const ctx = audio();
  const tampon = tampons.get(nom);
  if (!ctx || !tampon) {
    void charger(nom);
    jouerParElement(nom, niveau);
    return;
  }
  if (ctx.state === 'suspended') {
    // Contexte encore en veille (aucun geste depuis son ouverture) : on le réveille, et ce son-ci passe par un élément <audio>.
    void ctx.resume();
    jouerParElement(nom, niveau);
    return;
  }
  const source = ctx.createBufferSource();
  source.buffer = tampon;
  const gain = ctx.createGain();
  gain.gain.value = niveau;
  source.connect(gain).connect(ctx.destination);
  source.start();
}
