import { useEffect } from 'react';
import { noterSecondes, noterSession, PAS_S, tempsActif } from './mesure-temps';

/**
 * Compte le temps de jeu actif d'une histoire tant que `monde` est défini (aventure ou combat d'histoire à l'écran) :
 * onglet visible et une action du joueur dans les 90 dernières secondes. Entrer dans l'histoire compte une session.
 */
export function useMesureTemps(monde: string | undefined): void {
  useEffect(() => {
    if (!monde) return;
    noterSession(monde);
    let derniere = Date.now();
    const agir = () => {
      derniere = Date.now();
    };
    const evenements = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    for (const e of evenements) window.addEventListener(e, agir, { passive: true });
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const s = tempsActif(derniere, Date.now());
      if (s > 0) noterSecondes(monde, s);
    }, PAS_S * 1000);
    return () => {
      window.clearInterval(id);
      for (const e of evenements) window.removeEventListener(e, agir);
    };
  }, [monde]);
}
