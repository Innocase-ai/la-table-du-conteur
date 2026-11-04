// Voix des répliques des compagnons : un MP3 par cri et par voix (`voix/<race>-<genre>/<situation>-<n>.mp3`, faits par
// `pnpm repliques voix --livrer`). Une phrase sans fichier reste en bulle seulement. Elles jouent sur le canal des
// bruitages (bouton 🔊 : sourdine et volume du joueur).
import { reglagesSon } from './sons';
import type { Replique } from './repliques-regles';

const FICHIERS: Record<string, string> = Object.fromEntries(
  Object.entries(import.meta.glob<string>('./voix/*/*.mp3', { eager: true, query: '?url', import: 'default' })).map(([chemin, url]) => [
    chemin.replace(/^\.\/voix\/(.+)\.mp3$/, '$1'),
    url,
  ]),
);

/** Le nom du fichier d'une réplique (`nain-m/grievement-blesse-1`). */
export const cleVoix = (r: Pick<Replique, 'voix' | 'situation' | 'numero'>) => `${r.voix}/${r.situation}-${r.numero}`;

export const aUneVoix = (r: Pick<Replique, 'voix' | 'situation' | 'numero'>) => cleVoix(r) in FICHIERS;

/** Tous les fichiers de voix déclarés (pour les tests). */
export const CLES_VOIX: readonly string[] = Object.keys(FICHIERS);

let enCours: HTMLAudioElement | undefined;

/** Dit la réplique à voix haute, si elle a une voix et que le joueur n'a pas coupé le son. Une seule voix à la fois. */
export function direReplique(r: Pick<Replique, 'voix' | 'situation' | 'numero'>): void {
  const url = FICHIERS[cleVoix(r)];
  const reglages = reglagesSon();
  if (!url || !reglages.actif || reglages.volume <= 0 || typeof Audio === 'undefined') return;
  enCours?.pause();
  const lecture = new Audio(url);
  // Une voix se comprend au-dessus des bruitages : un peu plus fort que leur niveau, sans dépasser le maximum.
  lecture.volume = Math.min(1, reglages.volume * 1.15);
  enCours = lecture;
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
