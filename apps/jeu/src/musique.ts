// Lecture des musiques d'ambiance de combat : une boucle sans blanc (Web Audio), avec fondu à l'entrée et à la sortie, sur
// un canal de volume à part des bruitages (réglage mémorisé dans le navigateur). Le choix de l'ambiance est dans
// `musique-regles.ts`.
import { useSyncExternalStore } from 'react';
import { audio, deverrouiller } from './sons';
import { AMBIANCES_MUSIQUE, choisirAmbiance, type AmbianceMusique } from './musique-regles';

export interface ReglagesMusique {
  actif: boolean;
  /** Entre 0 et 1. Les fichiers sont déjà à −26 dB (fond sonore) : à 50 %, la musique reste bien sous les bruitages. */
  volume: number;
}

const CLE = 'crpg.musique';
const PAR_DEFAUT: ReglagesMusique = { actif: true, volume: 0.5 };
/** Durée du fondu à l'entrée, en secondes. */
const FONDU_ENTREE = 2;

const FICHIERS = Object.fromEntries(
  Object.entries(import.meta.glob<string>('./musique/*.mp3', { eager: true, query: '?url', import: 'default' })).map(([chemin, url]) => [
    chemin.replace(/^.*\/(.+)\.mp3$/, '$1'),
    url,
  ]),
) as Partial<Record<AmbianceMusique, string>>;

function lire(): ReglagesMusique {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE) ?? 'null') as Partial<ReglagesMusique> | null;
    return {
      actif: typeof brut?.actif === 'boolean' ? brut.actif : PAR_DEFAUT.actif,
      volume: typeof brut?.volume === 'number' ? Math.min(1, Math.max(0, brut.volume)) : PAR_DEFAUT.volume,
    };
  } catch {
    return PAR_DEFAUT;
  }
}

let reglages: ReglagesMusique = lire();
const abonnes = new Set<() => void>();

export function reglagesMusique(): ReglagesMusique {
  return reglages;
}

/** Change le réglage de la musique : le volume suit en douceur, la sourdine éteint ou rallume la musique du combat en cours. */
export function reglerMusique(changement: Partial<ReglagesMusique>): void {
  reglages = { ...reglages, ...changement, volume: Math.min(1, Math.max(0, changement.volume ?? reglages.volume)) };
  try {
    localStorage.setItem(CLE, JSON.stringify(reglages));
  } catch {
    // Stockage indisponible (navigation privée…) : le réglage vaut pour cette visite seulement.
  }
  appliquer();
  for (const a of abonnes) a();
}

/** Les réglages de la musique, pour un composant React. */
export function useReglagesMusique(): ReglagesMusique {
  return useSyncExternalStore(
    (rappel) => {
      abonnes.add(rappel);
      return () => abonnes.delete(rappel);
    },
    reglagesMusique,
  );
}

// --- Lecture ---------------------------------------------------------------------------------------------------------

const tampons = new Map<AmbianceMusique, AudioBuffer>();
const chargements = new Map<AmbianceMusique, Promise<AudioBuffer | undefined>>();

/** Télécharge et décode une boucle (une seule fois). Seule l'ambiance tirée est chargée : le jeu démarre vite. */
function charger(id: AmbianceMusique): Promise<AudioBuffer | undefined> {
  const deja = chargements.get(id);
  if (deja) return deja;
  const url = FICHIERS[id];
  const ctx = audio();
  if (!url || !ctx) return Promise.resolve(undefined);
  const p = fetch(url)
    .then((r) => r.arrayBuffer())
    .then((octets) => ctx.decodeAudioData(octets))
    .then((tampon) => {
      tampons.set(id, tampon);
      return tampon;
    })
    .catch(() => {
      chargements.delete(id);
      return undefined;
    });
  chargements.set(id, p);
  return p;
}

interface Lecture {
  id: AmbianceMusique;
  source: AudioBufferSourceNode;
  gain: GainNode;
}

let lecture: Lecture | undefined;
/** L'ambiance voulue pour le combat en cours (même quand la musique est coupée : on la rallume au bon endroit). */
let voulue: AmbianceMusique | undefined;
let derniere: AmbianceMusique | undefined;

function niveau(): number {
  return reglages.actif ? reglages.volume : 0;
}

/** Éteint la lecture en cours avec un fondu, puis libère ses nœuds. */
function eteindre(l: Lecture, fondu: number): void {
  const ctx = audio();
  if (!ctx) return;
  const t = ctx.currentTime;
  l.gain.gain.cancelScheduledValues(t);
  l.gain.gain.setValueAtTime(l.gain.gain.value, t);
  l.gain.gain.linearRampToValueAtTime(0, t + Math.max(0.02, fondu));
  try {
    l.source.stop(t + Math.max(0.02, fondu) + 0.05);
  } catch {
    // Déjà arrêtée.
  }
  l.source.onended = () => {
    l.source.disconnect();
    l.gain.disconnect();
  };
}

/** Applique les réglages à la lecture en cours : volume, sourdine, ou reprise après une sourdine. */
function appliquer(): void {
  const ctx = audio();
  if (!ctx) return;
  if (lecture) {
    if (!reglages.actif) {
      eteindre(lecture, 0.4);
      lecture = undefined;
    } else {
      lecture.gain.gain.cancelScheduledValues(ctx.currentTime);
      lecture.gain.gain.setTargetAtTime(niveau(), ctx.currentTime, 0.15);
    }
  } else if (reglages.actif && voulue) {
    void lancer(voulue);
  }
}

async function lancer(id: AmbianceMusique): Promise<void> {
  const ctx = audio();
  if (!ctx) return;
  const tampon = await charger(id);
  // Pendant le chargement, le combat a pu finir, ou une autre ambiance être demandée : on n'écrase rien.
  if (!tampon || voulue !== id || lecture || !reglages.actif) return;
  if (ctx.state === 'suspended') void ctx.resume();
  const source = ctx.createBufferSource();
  source.buffer = tampon;
  // La boucle est montée pour se raccorder à elle-même (fondu enchaîné fin → début, voir `pnpm musique boucler`) :
  // on la lit en entier, sans blanc.
  source.loop = true;
  source.loopStart = 0;
  source.loopEnd = tampon.duration;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(niveau(), ctx.currentTime + FONDU_ENTREE);
  source.connect(gain).connect(ctx.destination);
  source.start();
  lecture = { id, source, gain };
}

/**
 * Lance la musique d'un combat : l'ambiance donnée, ou une au hasard (jamais la même que le combat précédent). Renvoie
 * l'ambiance choisie. Sans geste préalable du joueur le navigateur garde l'audio en veille : il se réveille au premier clic.
 */
export function demarrerMusique(ambiance?: AmbianceMusique): AmbianceMusique {
  deverrouiller();
  if (lecture) {
    eteindre(lecture, 0.5);
    lecture = undefined;
  }
  const id = ambiance ?? choisirAmbiance(derniere, Math.random());
  voulue = id;
  derniere = id;
  void lancer(id);
  return id;
}

/** Arrête la musique en cours avec un fondu de sortie (fin du combat, retour au menu). */
export function arreterMusique(fondu = 1.5): void {
  voulue = undefined;
  if (lecture) {
    eteindre(lecture, fondu);
    lecture = undefined;
  }
}

/** L'ambiance qui joue (ou qui va jouer) en ce moment. */
export function ambianceEnCours(): AmbianceMusique | undefined {
  return voulue;
}

/** Charge d'avance les cinq boucles (utile au banc d'essai, pas au jeu). */
export function precharger(): void {
  for (const id of AMBIANCES_MUSIQUE) void charger(id);
}
