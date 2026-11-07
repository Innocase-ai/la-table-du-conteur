// Lecture des musiques du jeu (Web Audio), sur un canal de volume à part des bruitages (réglage mémorisé dans le navigateur).
// Trois usages : l'ambiance d'un combat (une boucle sans blanc), la musique des menus (une boucle) et les musiques de fond des
// histoires (enchaînées dans un ordre aléatoire, avec un fondu entre deux). Le choix de ce qui joue est dans `musique-regles.ts`.
//
// Le lecteur ne « reçoit pas d'ordres » : il tient trois informations (la scène du jeu, le combat en cours, les réglages),
// calcule ce qui doit jouer (`musiqueVoulue`) et ajuste. Un combat prend la place de la musique de la scène, qui reprend
// ensuite à l'endroit où elle s'était arrêtée.
import { useSyncExternalStore } from 'react';
import { audio, deverrouiller } from './sons';
import {
  AMBIANCES_MUSIQUE,
  choisirAmbiance,
  choisirParmi,
  DUREE_FONDU_ENTRE_FONDS,
  melangerFond,
  MUSIQUES_ACCUEIL,
  musiqueVoulue,
  type AmbianceMusique,
  type MusiqueAccueil,
  type MusiqueFond,
  type NomMusique,
  type SceneMusique,
  type Voulue,
} from './musique-regles';

export interface ReglagesMusique {
  actif: boolean;
  /** Entre 0 et 1. Les fichiers sont déjà bas (−26 dB, −30 dB pour le fond des histoires) : à 50 %, la musique reste bien sous les bruitages. */
  volume: number;
}

const CLE = 'crpg.musique';
const PAR_DEFAUT: ReglagesMusique = { actif: true, volume: 0.5 };
/** Durée du fondu à l'entrée, en secondes. */
const FONDU_ENTREE = 2;
/** Fondu quand un combat prend la place de la musique de la scène. */
const FONDU_COMBAT = 0.8;

const FICHIERS = Object.fromEntries(
  Object.entries(import.meta.glob<string>('./musique/**/*.mp3', { eager: true, query: '?url', import: 'default' })).map(([chemin, url]) => [
    chemin.replace(/^.*\/(.+)\.mp3$/, '$1'),
    url,
  ]),
) as Partial<Record<NomMusique, string>>;

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
const abonnesPiste = new Set<() => void>();

export function reglagesMusique(): ReglagesMusique {
  return reglages;
}

/** Change le réglage de la musique : le volume suit en douceur, la sourdine éteint ou rallume la musique en cours. */
export function reglerMusique(changement: Partial<ReglagesMusique>): void {
  reglages = { ...reglages, ...changement, volume: Math.min(1, Math.max(0, changement.volume ?? reglages.volume)) };
  try {
    localStorage.setItem(CLE, JSON.stringify(reglages));
  } catch {
    // Stockage indisponible (navigation privée…) : le réglage vaut pour cette visite seulement.
  }
  synchroniser();
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

const tampons = new Map<NomMusique, AudioBuffer>();
const chargements = new Map<NomMusique, Promise<AudioBuffer | undefined>>();

/** Télécharge et décode une musique (une seule fois). Seule la musique voulue est chargée : le jeu démarre vite. */
function charger(id: NomMusique): Promise<AudioBuffer | undefined> {
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

type Famille = 'combat' | 'accueil' | 'fond';

interface Lecture {
  id: NomMusique;
  famille: Famille;
  source: AudioBufferSourceNode;
  gain: GainNode;
  /** Heure du contexte audio où la lecture a commencé, et position (en secondes) du fichier à ce moment. */
  debut: number;
  decalage: number;
  duree: number;
  minuteur?: ReturnType<typeof setTimeout>;
}

let lecture: Lecture | undefined;
/** La scène du jeu (menus, histoire en cours), et l'ambiance du combat en cours s'il y en a un. */
let scene: SceneMusique;
let combat: AmbianceMusique | undefined;
let derniereAmbiance: AmbianceMusique | undefined;
/** Le choix de la musique d'accueil, gardé tant qu'on reste dans les menus. */
let choixAccueil: MusiqueAccueil | undefined;
let derniereAccueil: MusiqueAccueil | undefined;
/** Le fond en cours, ceux qui restent à jouer dans ce tour, et le dernier joué (pour ne pas le rejouer en premier). */
let fondCourant: MusiqueFond | undefined;
let resteFond: MusiqueFond[] = [];
let dernierFond: MusiqueFond | undefined;
/** Où reprendre une musique que le combat a interrompue (secondes). */
const reprises = new Map<NomMusique, number>();
/** Baisse temporaire (voix du Maître de jeu) : le volume est multiplié par ce facteur. */
let facteurBaisse = 1;
const BAISSE_VOIX = 0.3;

function niveau(): number {
  return reglages.actif ? reglages.volume * facteurBaisse : 0;
}

function prevenirPiste(): void {
  for (const a of abonnesPiste) a();
}

/** Éteint la lecture donnée avec un fondu, puis libère ses nœuds. */
function eteindre(l: Lecture, fondu: number): void {
  const ctx = audio();
  if (!ctx) return;
  if (l.minuteur) clearTimeout(l.minuteur);
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

/** Où en est la lecture dans son fichier (secondes). */
function position(l: Lecture): number {
  const ctx = audio();
  if (!ctx) return 0;
  return (l.decalage + Math.max(0, ctx.currentTime - l.debut)) % l.duree;
}

function famille(v: NonNullable<Voulue>): Famille {
  return v.type;
}

/** Cette lecture est-elle déjà celle qu'on veut ? */
function correspond(l: Lecture, v: NonNullable<Voulue>): boolean {
  if (v.type === 'combat') return l.famille === 'combat' && l.id === v.id;
  return l.famille === famille(v);
}

/** Amène la lecture à ce qui doit jouer : rien ne change si c'est déjà bon, sinon un fondu vers la nouvelle musique. */
function synchroniser(fondu = FONDU_COMBAT): void {
  const ctx = audio();
  if (!ctx) return;
  const v = reglages.actif ? musiqueVoulue(scene, combat) : undefined;
  if (lecture && v && correspond(lecture, v)) {
    lecture.gain.gain.cancelScheduledValues(ctx.currentTime);
    lecture.gain.gain.setTargetAtTime(niveau(), ctx.currentTime, 0.15);
    return;
  }
  if (lecture) {
    // La musique de la scène (accueil, fond) qu'un combat ou la sourdine interrompt reprendra là où elle était.
    if (lecture.famille !== 'combat') reprises.set(lecture.id, position(lecture));
    eteindre(lecture, fondu);
    lecture = undefined;
    prevenirPiste();
  }
  if (v) void lancer(v);
}

/** Le fichier à jouer pour ce qui est voulu (en le choisissant au hasard s'il n'est pas encore choisi). */
function choisir(v: NonNullable<Voulue>): NomMusique {
  if (v.type === 'combat') return v.id;
  if (v.type === 'accueil') {
    choixAccueil ??= choisirParmi(MUSIQUES_ACCUEIL, derniereAccueil, Math.random());
    return choixAccueil;
  }
  if (!fondCourant) {
    if (!resteFond.length) resteFond = melangerFond(dernierFond, Math.random);
    fondCourant = resteFond.shift();
  }
  return fondCourant!;
}

async function lancer(v: NonNullable<Voulue>): Promise<void> {
  const ctx = audio();
  if (!ctx) return;
  const id = choisir(v);
  const tampon = await charger(id);
  // Pendant le chargement, la scène ou le combat a pu changer : on n'écrase rien.
  const encore = reglages.actif ? musiqueVoulue(scene, combat) : undefined;
  if (!tampon || lecture || !encore || encore.type !== v.type || (encore.type === 'combat' && v.type === 'combat' && encore.id !== v.id)) return;
  demarrer(id, v.type, tampon, FONDU_ENTREE);
}

/** Lance la lecture d'un fichier, avec un fondu d'entrée, et arme l'enchaînement s'il s'agit d'un fond. */
function demarrer(id: NomMusique, fam: Famille, tampon: AudioBuffer, fondu: number): void {
  const ctx = audio();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
  const source = ctx.createBufferSource();
  source.buffer = tampon;
  if (fam === 'fond') {
    // Un fond se joue une fois, puis le suivant prend le relais (fondu enchaîné).
    source.loop = false;
  } else {
    // La boucle est montée pour se raccorder à elle-même (fondu enchaîné fin → début, voir `pnpm musique boucler`) :
    // on la lit en entier, sans blanc.
    source.loop = true;
    source.loopStart = 0;
    source.loopEnd = tampon.duration;
  }
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(niveau(), ctx.currentTime + fondu);
  source.connect(gain).connect(ctx.destination);
  const decalage = (reprises.get(id) ?? 0) % tampon.duration;
  reprises.delete(id);
  source.start(0, decalage);
  const l: Lecture = { id, famille: fam, source, gain, debut: ctx.currentTime, decalage, duree: tampon.duration };
  lecture = l;
  if (fam === 'fond') armerSuite(l);
  prevenirPiste();
}

/** Programme le passage au fond suivant un peu avant la fin de celui-ci (se recale si le son était en veille). */
function armerSuite(l: Lecture): void {
  const ctx = audio();
  if (!ctx) return;
  const restant = l.duree - position(l) - DUREE_FONDU_ENTRE_FONDS;
  l.minuteur = setTimeout(() => {
    if (lecture !== l) return;
    // Le contexte peut être resté en veille (pas encore de geste du joueur) : le temps du fichier n'a alors pas avancé.
    if (l.duree - position(l) - DUREE_FONDU_ENTRE_FONDS > 0.5) armerSuite(l);
    else void suivant();
  }, Math.max(1, restant) * 1000);
}

/** Passe au fond suivant (fin du morceau, ou bouton « suivante »). Sans effet hors d'une histoire. */
export async function suivant(): Promise<void> {
  const actuelle = lecture;
  if (!actuelle || actuelle.famille !== 'fond' || scene !== 'histoire' || combat) return;
  dernierFond = actuelle.id as MusiqueFond;
  if (!resteFond.length) resteFond = melangerFond(dernierFond, Math.random);
  const prochain = resteFond.shift()!;
  fondCourant = prochain;
  const tampon = await charger(prochain);
  if (!tampon || lecture !== actuelle || scene !== 'histoire' || combat) return;
  eteindre(actuelle, DUREE_FONDU_ENTRE_FONDS);
  lecture = undefined;
  demarrer(prochain, 'fond', tampon, DUREE_FONDU_ENTRE_FONDS);
}

/**
 * Dit au lecteur dans quelle scène on est : les menus (musique d'accueil), une histoire en cours (musiques de fond), ou
 * aucune (silence). Un combat en cours garde la main jusqu'à sa fin.
 */
export function definirSceneMusique(s: SceneMusique): void {
  if (s === scene) return;
  deverrouiller();
  const avant = scene;
  scene = s;
  if (avant === 'accueil') {
    derniereAccueil = choixAccueil;
    choixAccueil = undefined;
  }
  if (avant === 'histoire') {
    // Une nouvelle partie commence par un autre fond, tiré au hasard.
    dernierFond = fondCourant ?? dernierFond;
    fondCourant = undefined;
    resteFond = [];
    for (const f of [...reprises.keys()]) if (f.startsWith('fond-')) reprises.delete(f);
  }
  synchroniser(avant ? 1.5 : 0.5);
}

/**
 * Lance la musique d'un combat : l'ambiance donnée, ou une au hasard (jamais la même que le combat précédent). Renvoie
 * l'ambiance choisie. Sans geste préalable du joueur le navigateur garde l'audio en veille : il se réveille au premier clic.
 */
export function demarrerMusique(ambiance?: AmbianceMusique): AmbianceMusique {
  deverrouiller();
  const id = ambiance ?? choisirAmbiance(derniereAmbiance, Math.random());
  combat = id;
  derniereAmbiance = id;
  synchroniser();
  return id;
}

/** Arrête la musique du combat avec un fondu de sortie ; la musique de la scène (fond, accueil) reprend. */
export function arreterMusique(fondu = 1.5): void {
  combat = undefined;
  synchroniser(fondu);
}

/** Baisse la musique pendant que le Maître de jeu parle (voix, scène narrée), puis la rend. */
export function baisserMusique(baisse: boolean): void {
  facteurBaisse = baisse ? BAISSE_VOIX : 1;
  const ctx = audio();
  if (lecture && ctx) {
    lecture.gain.gain.cancelScheduledValues(ctx.currentTime);
    lecture.gain.gain.setTargetAtTime(niveau(), ctx.currentTime, 0.4);
  }
}

/** L'ambiance de combat qui joue (ou va jouer) en ce moment. */
export function ambianceEnCours(): AmbianceMusique | undefined {
  return combat;
}

/** La musique qui joue en ce moment (pour afficher son nom), ou rien. */
export function pisteEnCours(): NomMusique | undefined {
  return lecture?.id;
}

/** La musique qui joue, pour un composant React. */
export function usePisteEnCours(): NomMusique | undefined {
  return useSyncExternalStore((rappel) => {
    abonnesPiste.add(rappel);
    return () => abonnesPiste.delete(rappel);
  }, pisteEnCours);
}

/** Charge d'avance les ambiances de combat (utile au banc d'essai, pas au jeu). */
export function precharger(): void {
  for (const id of AMBIANCES_MUSIQUE) void charger(id);
}
