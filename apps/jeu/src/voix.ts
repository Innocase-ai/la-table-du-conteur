// Voix des répliques des compagnons : un MP3 par cri et par voix (`voix/<race>-<genre>/<situation>-<n>.mp3`, faits par
// `pnpm repliques voix --livrer`). Une phrase sans fichier reste en bulle seulement. Elles jouent sur le canal des
// bruitages (bouton 🔊 : sourdine et volume du joueur).
import { reglagesSon } from './sons';
import { cheminParole } from './paroles-regles';
import type { Replique } from './repliques-regles';

const FICHIERS: Record<string, string> = Object.fromEntries(
  Object.entries(import.meta.glob<string>('./voix/*/*.mp3', { eager: true, query: '?url', import: 'default' })).map(([chemin, url]) => [
    chemin.replace(/^\.\/voix\/(.+)\.mp3$/, '$1'),
    url,
  ]),
);

const FICHIERS_OUVERTURES: Record<string, string> = Object.fromEntries(
  Object.entries(import.meta.glob<string>('./voix/ouvertures/*/*.mp3', { eager: true, query: '?url', import: 'default' })).map(([chemin, url]) => [
    chemin.replace(/^\.\/voix\/ouvertures\/(.+)\.mp3$/, '$1'),
    url,
  ]),
);

// Les paroles des PNJ (leur salutation, leurs réponses) : `voix/dialogues/<voix>/<clé du texte>.mp3`, faits par `pnpm salutations generer --livrer`.
const FICHIERS_DIALOGUES: Record<string, string> = Object.fromEntries(
  Object.entries(import.meta.glob<string>('./voix/dialogues/*/*.mp3', { eager: true, query: '?url', import: 'default' })).map(([chemin, url]) => [
    chemin.replace(/^\.\/voix\/dialogues\/(.+)\.mp3$/, '$1'),
    url,
  ]),
);

/** Tous les fichiers de paroles déclarés (pour les tests). */
export const CLES_DIALOGUES: readonly string[] = Object.keys(FICHIERS_DIALOGUES);

/** Cette parole (la voix du PNJ, le texte affiché) a-t-elle un fichier audio ? */
export const aUneParole = (voix: string, texte: string): boolean => cheminParole(voix, texte) in FICHIERS_DIALOGUES;

/** Le nom du fichier d'une ouverture de conversation (`m-charon/neutre-1`). */
export const cleOuverture = (voix: string, ouverture: string) => `${voix}/${ouverture}`;

/** Tous les fichiers d'ouverture déclarés (pour les tests). */
export const CLES_OUVERTURES: readonly string[] = Object.keys(FICHIERS_OUVERTURES);

/** Le nom du fichier d'une réplique (`nain-m/grievement-blesse-1`). */
export const cleVoix = (r: Pick<Replique, 'voix' | 'situation' | 'numero'>) => `${r.voix}/${r.situation}-${r.numero}`;

export const aUneVoix = (r: Pick<Replique, 'voix' | 'situation' | 'numero'>) => cleVoix(r) in FICHIERS;

/** Tous les fichiers de voix déclarés (pour les tests). */
export const CLES_VOIX: readonly string[] = Object.keys(FICHIERS);

let enCours: HTMLAudioElement | undefined;
/** Les voix qui attendent la fin de la voix en cours (la parole d'un PNJ vient après son ouverture). */
let suite: string[] = [];

/** Dit la réplique à voix haute, si elle a une voix et que le joueur n'a pas coupé le son. Une seule voix à la fois. */
export function direReplique(r: Pick<Replique, 'voix' | 'situation' | 'numero'>): void {
  jouerVoix(FICHIERS[cleVoix(r)]);
}

/**
 * Dit la parole d'un PNJ (sa salutation…) avec sa voix, s'il y a un fichier pour ce texte exact. Elle vient **après** la voix en cours (son
 * ouverture de conversation) au lieu de la couper : c'est la même voix, les deux phrases s'enchaînent.
 */
export function direParole(voix: string, texte: string): void {
  jouerVoix(FICHIERS_DIALOGUES[cheminParole(voix, texte)], true);
}

/** Coupe la voix en cours et celles qui attendent (fin de la conversation). */
export function taireVoix(): void {
  suite = [];
  enCours?.pause();
}

/** Dit l'ouverture d'un PNJ (la voix `m-charon`, l'ouverture `neutre-1`), si elle a un fichier et que le joueur n'a pas coupé le son. */
export function direOuverture(voix: string, ouverture: string): void {
  jouerVoix(FICHIERS_OUVERTURES[cleOuverture(voix, ouverture)]);
}

function jouerVoix(url: string | undefined, apres = false): void {
  const reglages = reglagesSon();
  if (!url || !reglages.actif || reglages.volume <= 0 || typeof Audio === 'undefined') return;
  if (apres && enCours && !enCours.ended && !enCours.paused) {
    suite.push(url);
    return;
  }
  if (!apres) suite = [];
  enCours?.pause();
  const lecture = new Audio(url);
  // Une voix se comprend au-dessus des bruitages : un peu plus fort que leur niveau, sans dépasser le maximum.
  lecture.volume = Math.min(1, reglages.volume * 1.15);
  enCours = lecture;
  lecture.addEventListener('ended', () => {
    const prochaine = suite.shift();
    if (prochaine && enCours === lecture) jouerVoix(prochaine, true);
  });
  // Le navigateur refuse de jouer avant tout geste du joueur : sans conséquence, la bulle reste affichée.
  void lecture.play().catch(() => {});
}

/** Demande au navigateur de télécharger d'avance les voix (`nain-m`…) des héros du combat, pour qu'aucune ne se fasse attendre. */
export function prechargerVoix(voix: readonly string[]): void {
  if (typeof Audio === 'undefined') return;
  for (const [cle, url] of Object.entries(FICHIERS)) {
    if (!voix.some((v) => cle.startsWith(`${v}/`))) continue;
    const a = new Audio();
    a.preload = 'auto';
    a.src = url;
  }
}
