// Réglages du joueur (écran Options) : taille du texte et réduction des animations, mémorisés dans `localStorage`.
// Tout est tolérant : un stockage indisponible ou une valeur abîmée donne les réglages par défaut, jamais une erreur.
// Ce module ne touche ni à la clé d'API du joueur ni à rien de secret : il ne garde que des préférences d'affichage.
import type { EtatConteur } from '../aventure/conteur';

/** Tailles du texte proposées, en pourcentage de la taille d'origine. */
export const ECHELLES_TEXTE = [100, 115, 130] as const;
export type EchelleTexte = (typeof ECHELLES_TEXTE)[number];

export interface Options {
  echelleTexte: EchelleTexte;
  /** `undefined` : le joueur n'a rien réglé, on suit le réglage du système (`prefers-reduced-motion`). */
  reduireAnimations?: boolean;
}

export const CLE_OPTIONS = 'crpg.options.v1';

export const OPTIONS_PAR_DEFAUT: Options = { echelleTexte: 100 };

/** Lit des réglages enregistrés (texte JSON) ; ce qui est invalide retombe sur le défaut, champ par champ. */
export function lireOptionsDepuisTexte(texte: string | null | undefined): Options {
  const res: Options = { ...OPTIONS_PAR_DEFAUT };
  if (!texte) return res;
  let brut: unknown;
  try {
    brut = JSON.parse(texte);
  } catch {
    return res;
  }
  if (!brut || typeof brut !== 'object') return res;
  const o = brut as Record<string, unknown>;
  if (typeof o['echelleTexte'] === 'number' && (ECHELLES_TEXTE as readonly number[]).includes(o['echelleTexte'])) res.echelleTexte = o['echelleTexte'] as EchelleTexte;
  if (typeof o['reduireAnimations'] === 'boolean') res.reduireAnimations = o['reduireAnimations'];
  return res;
}

export function lireOptions(): Options {
  try {
    return lireOptionsDepuisTexte(window.localStorage.getItem(CLE_OPTIONS));
  } catch {
    return { ...OPTIONS_PAR_DEFAUT };
  }
}

/** Enregistre les réglages ; rend faux si le stockage refuse (les réglages restent valables pour la session). */
export function sauverOptions(o: Options): boolean {
  try {
    window.localStorage.setItem(CLE_OPTIONS, JSON.stringify(o));
    return true;
  } catch {
    return false;
  }
}

/** Le système demande-t-il de réduire les animations ? */
export function systemeReduitLesMouvements(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Les animations sont-elles réduites ? Le choix du joueur prime, à défaut le réglage du système. */
export function animationsReduites(o: Options, systeme: boolean): boolean {
  return o.reduireAnimations ?? systeme;
}

/** Le facteur appliqué à tout le texte (1, 1,15 ou 1,3). */
export function facteurTexte(o: Options): number {
  return o.echelleTexte / 100;
}

/**
 * Applique les réglages à la page : `data-texte` (taille) et `data-mouvement` sur `<html>`, lus par les règles CSS de
 * `options.css`, et `--echelle-texte` pour les mises en page qui doivent la connaître.
 */
export function appliquerOptions(o: Options, racine: HTMLElement = document.documentElement, systeme = systemeReduitLesMouvements()): void {
  racine.dataset['texte'] = String(o.echelleTexte);
  racine.style.setProperty('--echelle-texte', String(facteurTexte(o)));
  racine.dataset['mouvement'] = animationsReduites(o, systeme) ? 'reduit' : 'normal';
}

/** Ce que la page applique en ce moment (`data-mouvement`) ; `undefined` avant que les réglages ne soient appliqués. */
export function mouvementApplique(racine: HTMLElement = document.documentElement): 'reduit' | 'normal' | undefined {
  const v = racine.dataset['mouvement'];
  return v === 'reduit' || v === 'normal' ? v : undefined;
}

// ---------------------------------------------------------------------------
// Le conteur : ce que l'écran en dit, d'après l'état que le relais du jeu publie (jamais la clé)
// ---------------------------------------------------------------------------

export interface ResumeConteur {
  /** `ok` : branché ; `absent` : pas de clé ou pas de relais. */
  etat: 'ok' | 'absent';
  libelle: string;
  modele?: string;
  depense?: number;
  plafond?: number;
  /** Part du plafond déjà dépensée, entre 0 et 1. */
  part?: number;
}

export function resumerConteur(e: EtatConteur | undefined): ResumeConteur | undefined {
  if (!e) return undefined;
  if (!e.disponible) return { etat: 'absent', libelle: 'Pas de conteur branché : le jeu se joue avec les actions proposées, sans saisie libre.' };
  const plafond = typeof e.plafond === 'number' && e.plafond >= 0 ? e.plafond : undefined;
  const depense = typeof e.depense === 'number' && e.depense >= 0 ? e.depense : undefined;
  return {
    etat: 'ok',
    libelle: 'Le conteur est branché : vous pouvez lui écrire librement.',
    modele: e.modele,
    depense,
    plafond,
    part: plafond && depense !== undefined ? Math.min(1, depense / plafond) : plafond === 0 ? 1 : undefined,
  };
}
