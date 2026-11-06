// Migrations des sauvegardes : une fonction par version, qui amène une partie de la version N à N + 1.
// Une vieille sauvegarde passe par toutes les migrations dans l'ordre.
import { etatDurableMax } from '../combat/creation';
import type { Fiche } from '../fiche';
import { VERSION_PARTIE } from './types';

type Brute = Record<string, unknown> & { version: number };

const MIGRATIONS: Record<number, (p: Brute) => void> = {
  // 1 → 2 : le personnage unifié garde ses ressources durables (potions, usages, emplacements de sorts).
  1: (p) => {
    for (const a of p.groupe as { fiche: Fiche; ressources?: unknown; emplacements?: unknown }[]) {
      const max = etatDurableMax(a.fiche, 1);
      a.ressources ??= max.ressources;
      a.emplacements ??= max.emplacements;
    }
  },
};

export function migrer(p: Brute): Brute {
  if (p.version > VERSION_PARTIE) throw new Error(`Sauvegarde de version ${p.version}, plus récente que ce jeu (version ${VERSION_PARTIE}).`);
  while (p.version < VERSION_PARTIE) {
    const m = MIGRATIONS[p.version];
    if (!m) throw new Error(`Aucune migration depuis la version ${p.version}.`);
    m(p);
    p.version += 1;
  }
  return p;
}
