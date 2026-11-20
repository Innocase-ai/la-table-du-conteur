// Les suites proposées à la fin d'un épisode (F5 d de docs/PRD-SAGA.md) : une fonction pure, testable sans le chargement des mondes.
import type { Monde } from '@crpg/regles';

/** Un épisode que le groupe peut aborder après celui qui vient de finir. */
export interface SuiteSaga {
  id: string;
  nom: string;
  accroche: string;
  min: number;
  max: number;
}

/** Combien de niveaux séparent le groupe de la plage de l'épisode (0 : dans la plage). */
const ecart = (niveau: number, s: Pick<SuiteSaga, 'min' | 'max'>): number => (niveau < s.min ? s.min - niveau : niveau > s.max ? niveau - s.max : 0);

/** Les autres histoires proposées, les mieux adaptées au niveau du groupe d'abord (puis par nom) : le joueur choisit, rien n'est imposé. */
export function suitesPossibles(mondes: readonly Pick<Monde, 'id' | 'nom' | 'accroche' | 'niveaux'>[], actuel: string, niveau: number): SuiteSaga[] {
  return mondes
    .filter((m) => m.id !== actuel)
    .map((m) => ({ id: m.id, nom: m.nom, accroche: m.accroche, min: m.niveaux.min, max: m.niveaux.max }))
    .sort((a, b) => ecart(niveau, a) - ecart(niveau, b) || a.nom.localeCompare(b.nom));
}
