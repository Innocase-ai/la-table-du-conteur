// La carte du monde, côté présentation : qui peut être rejoint d'un double-clic, les trajets à tracer depuis le lieu du groupe, et le
// double-clic lui-même (qui sert aussi au double-tape sur un écran tactile). Aucune règle de déplacement ici : le moteur dit ce qui est
// accessible (`MarqueurCarte.acces`), et se déplacer reste la commande `aller`. Fichier pur, testé à part.
import type { MarqueurCarte, VueCarte } from '@crpg/regles';

/** Le délai (ms) entre deux clics ou deux tapes sur le même lieu pour que ce soit un « double ». */
export const DELAI_DOUBLE = 450;

/** Peut-on s'y rendre tout de suite d'un clic ? (un passage libre depuis le lieu du groupe : ni verrouillé, ni bloqué, et pas déjà ici) */
export const peutAller = (m: MarqueurCarte | undefined): boolean => !!m && m.etat !== 'ici' && !!m.acces && !m.acces.bloque && !m.acces.verrouille;

/** « 2 h », « 0,5 h », ou rien pour un passage sans durée. */
export function libelleHeures(heures: number | undefined): string {
  if (!heures) return '';
  return `${String(Math.round(heures * 10) / 10).replace('.', ',')} h`;
}

/** Pourquoi on ne peut pas s'y rendre d'un clic (vide : on peut, ou on y est déjà). */
export function motifInaccessible(m: MarqueurCarte): string | undefined {
  if (m.etat === 'ici') return undefined;
  if (m.acces?.bloque) return 'Ce passage est infranchissable pour l’instant.';
  if (m.acces?.verrouille) return 'Le passage est verrouillé : voyez « Partir » dans l’onglet Actions.';
  if (!m.acces) return 'Pas de passage direct d’ici.';
  return undefined;
}

export type StatutTrajet = 'libre' | 'verrouille' | 'bloque';

export interface Trajet {
  vers: string;
  nom: string;
  /** Les deux bouts, en pourcentage de la carte (comme les marqueurs). */
  de: { x: number; y: number };
  a: { x: number; y: number };
  /** Le milieu du trait, où se pose la durée. */
  milieu: { x: number; y: number };
  heures: number;
  /** « 2 h », ou vide. */
  duree: string;
  statut: StatutTrajet;
}

/** Les chemins à tracer depuis le lieu du groupe (le marqueur « ici » de cette carte) vers chaque sortie connue qui y figure. Aucun s'il n'est pas sur cette carte. */
export function trajetsDepuisIci(vue: Pick<VueCarte, 'marqueurs'>): Trajet[] {
  const ici = vue.marqueurs.find((m) => m.etat === 'ici');
  if (!ici) return [];
  return vue.marqueurs
    .filter((m) => m.id !== ici.id && m.acces)
    .map((m) => ({
      vers: m.id,
      nom: m.nom,
      de: { x: ici.x, y: ici.y },
      a: { x: m.x, y: m.y },
      milieu: { x: (ici.x + m.x) / 2, y: (ici.y + m.y) / 2 },
      heures: m.acces!.heures,
      duree: libelleHeures(m.acces!.heures),
      statut: m.acces!.bloque ? ('bloque' as const) : m.acces!.verrouille ? ('verrouille' as const) : ('libre' as const),
    }));
}

/** Ce que fait une activation (clic, Entrée) sur un lieu : le choisir, ou, s'il l'est déjà et qu'on peut s'y rendre, y aller. */
export function activation(m: MarqueurCarte, choisi: string | undefined): 'choisir' | 'aller' {
  return choisi === m.id && peutAller(m) ? 'aller' : 'choisir';
}

export interface DernierClic {
  id: string;
  instant: number;
}

/** Ce clic ou cette tape est-il le second sur le même lieu, assez vite après le premier ? (le double-clic comme le double-tape : le navigateur n'envoie pas `dblclick` partout) */
export const estDouble = (dernier: DernierClic | undefined, id: string, instant: number): boolean => !!dernier && dernier.id === id && instant - dernier.instant <= DELAI_DOUBLE;
