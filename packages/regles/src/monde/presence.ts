// Qui est où, et quand : le moment de la journée et les PNJ présents dans le lieu courant. Fichier sans dépendance envers
// l'exploration ni le dialogue (qui s'en servent tous les deux, et l'ouverture des serrures pour ses témoins).
import { evaluerCondition } from './etat';
import type { PartieMonde } from './exploration';
import type { Pnj } from './schemas';

/** Le moment de la journée : jour de 6 h à 17 h, soir de 18 h à 21 h, nuit ensuite (présences des PNJ). */
export function momentDe(heure = 8): 'jour' | 'soir' | 'nuit' {
  return heure >= 6 && heure < 18 ? 'jour' : heure >= 18 && heure < 22 ? 'soir' : 'nuit';
}

export function lieuDuPnj(p: PartieMonde, pnj: Pnj): string {
  return p.etat.pnjLieux[pnj.id] ?? pnj.lieu;
}

/** PNJ présents dans le lieu courant, vivants et toujours là. */
export function pnjPresents(p: PartieMonde): Pnj[] {
  return [...p.dm.pnj.values()].filter((n) => {
    // Un PNJ escorté suit le groupe : il est présent partout.
    if ((p.etat.pnjEtats[n.id] ?? 'vivant') === 'vivant' && p.etat.escortes?.includes(n.id)) return true;
    return pnjSurPlace(p, n, p.etat.lieu);
  });
}

/** Ce PNJ, vivant, se tient-il dans ce lieu à cette heure-ci ? (hors escorte : celui qui voyage avec le groupe n'est « nulle part »). */
function pnjSurPlace(p: PartieMonde, n: Pnj, lieu: string): boolean {
  if ((p.etat.pnjEtats[n.id] ?? 'vivant') !== 'vivant') return false;
  if (lieuDuPnj(p, n) === lieu) return true;
  // Une présence ailleurs ne compte que si le PNJ n'a pas été déplacé, et au bon moment de la journée (jour, soir, nuit).
  const moment = momentDe(p.etat.heure);
  return !p.etat.pnjLieux[n.id] && n.presences.some((x) => x.lieu === lieu && x.moment === moment && (!x.condition || evaluerCondition(x.condition, p.etat)));
}

/** PNJ qu'on trouverait dans un autre lieu (la salle d'à côté, la forge de la cour) : pour le signaler avant d'y entrer. */
export function pnjDansLieu(p: PartieMonde, lieu: string): Pnj[] {
  return [...p.dm.pnj.values()].filter((n) => !p.etat.escortes?.includes(n.id) && pnjSurPlace(p, n, lieu));
}
