// Mise en page des ancres : les lieux écrits ont une position sur l'image peinte (en pourcentage) et des durées de trajet qui
// ne s'accordent pas toujours (sur les histoires actuelles, de 209 à 454 px par heure). Pour que la carte tuilée respecte les
// durées de l'auteur, on part des positions peintes (qui donnent les directions) puis on relâche des ressorts : chaque trajet
// écrit tire ou pousse ses deux extrémités vers la longueur que sa durée demande. Déterministe, sans hasard.
import { creerRng } from './rng';
import type { Case, DefAncre, DefLien } from './types';

/** Cases de route (distance en losange) que l'on parcourt en une heure : une case de route coûte 3 minutes, plus des détours. */
export const CASES_PAR_HEURE = 17;

/** Longueur visée (en cases, distance en losange) d'un trajet écrit. */
export const longueurCible = (heures: number, echelle: number): number => Math.max(3, Math.round((heures * CASES_PAR_HEURE) / echelle));

export function disposerAncres(ancres: DefAncre[], liens: DefLien[], largeur: number, hauteur: number, echelle: number): Map<string, Case> {
  const rng = creerRng(ancres.length * 7919 + largeur * 31 + hauteur);
  const marge = 6;
  const pos = new Map<string, { x: number; y: number; x0: number; y0: number; fixe: boolean }>();
  for (const a of ancres) {
    if (a.case) pos.set(a.id, { x: a.case.x, y: a.case.y, x0: a.case.x, y0: a.case.y, fixe: true });
    else {
      // Départ : la position peinte, ramenée sur la carte (avec un léger écart déterministe pour que deux ancres ne se confondent pas).
      const x = marge + (a.position.x / 100) * (largeur - 2 * marge) + (rng() - 0.5) * 0.5;
      const y = marge + (a.position.y / 100) * (hauteur - 2 * marge) + (rng() - 0.5) * 0.5;
      pos.set(a.id, { x, y, x0: x, y0: y, fixe: false });
    }
  }
  for (let tour = 0; tour < 400; tour++) {
    for (const l of liens) {
      const A = pos.get(l.de);
      const B = pos.get(l.vers);
      if (!A || !B) continue;
      const dx = B.x - A.x;
      const dy = B.y - A.y;
      // Distance en losange, et le gradient qui va avec : on rapproche ou éloigne sur l'axe qui domine.
      const d = Math.abs(dx) + Math.abs(dy) || 1;
      const cible = longueurCible(l.heures, echelle);
      const k = ((d - cible) / d) * 0.1;
      const fa = A.fixe ? 0 : 1;
      const fb = B.fixe ? 0 : 1;
      A.x += dx * k * fa;
      A.y += dy * k * fa;
      B.x -= dx * k * fb;
      B.y -= dy * k * fb;
    }
    // Un très léger rappel vers la position peinte garde la forme générale de la carte de l'auteur.
    for (const p of pos.values()) {
      if (p.fixe) continue;
      p.x += (p.x0 - p.x) * 0.004;
      p.y += (p.y0 - p.y) * 0.004;
    }
  }
  // Recentrer le paquet d'ancres au milieu de la carte, sans sortir des marges.
  const libres = [...pos.values()].filter((p) => !p.fixe);
  if (libres.length) {
    const xs = libres.map((p) => p.x);
    const ys = libres.map((p) => p.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const decalageX = largeur / 2 - cx;
    const decalageY = hauteur / 2 - cy;
    for (const p of libres) {
      p.x += decalageX;
      p.y += decalageY;
    }
  }
  const res = new Map<string, Case>();
  for (const [id, p] of pos) {
    res.set(id, { x: Math.max(marge / 2, Math.min(largeur - 1 - marge / 2, Math.round(p.x))), y: Math.max(marge / 2, Math.min(hauteur - 1 - marge / 2, Math.round(p.y))) });
  }
  // Deux ancres sur la même case : la seconde est décalée.
  const prises = new Set<string>();
  for (const [id, c] of res) {
    while (prises.has(`${c.x},${c.y}`)) c.x += 2;
    prises.add(`${c.x},${c.y}`);
    res.set(id, c);
  }
  return res;
}
