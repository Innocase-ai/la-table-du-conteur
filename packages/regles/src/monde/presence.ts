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
  // Un PNJ déplacé par l'histoire (effet `deplacer`) n'est plus que là où on l'a mis.
  // Ses présences du moment (jour, soir, nuit) REMPLACENT son lieu habituel : on n'est pas au comptoir et dans la salle à la fois.
  // Sans présence pour ce moment, il est chez lui ; déplacé par l'histoire (effet `deplacer`), il n'est plus que là.
  return lieuxDuPnjMaintenant(p, n).includes(lieu);
}

/** Où se tient ce PNJ maintenant (hors escorte) : le lieu où l'histoire l'a mis, ses présences du moment, ou son lieu habituel. */
export function lieuxDuPnjMaintenant(p: Pick<PartieMonde, 'etat'>, n: Pnj): string[] {
  if (p.etat.pnjLieux[n.id]) return [p.etat.pnjLieux[n.id]!];
  const ici = presencesDuMoment(p, n);
  return ici.length ? ici : [n.lieu];
}

/** Les lieux où ce PNJ se tient à ce moment de la journée, d'après ses `presences` (vide : il est dans son lieu habituel). */
function presencesDuMoment(p: Pick<PartieMonde, 'etat'>, n: Pnj): string[] {
  const moment = momentDe(p.etat.heure);
  return n.presences.filter((x) => x.moment === moment && (!x.condition || evaluerCondition(x.condition, p.etat))).map((x) => x.lieu);
}

/** PNJ qu'on trouverait dans un autre lieu (la salle d'à côté, la forge de la cour) : pour le signaler avant d'y entrer. */
export function pnjDansLieu(p: PartieMonde, lieu: string): Pnj[] {
  return [...p.dm.pnj.values()].filter((n) => !p.etat.escortes?.includes(n.id) && pnjSurPlace(p, n, lieu));
}
