// Présentation des monstres d'une rencontre : ce que le joueur voit quand elle se montre (image du bestiaire commun,
// nom, nombre, une courte description). Rien de caché : ni DD, ni points de vie, ni statistiques.
import type { Donnees } from '../donnees';
import type { PresentationMonstre } from '../noyau/types';
import type { DonneesMonde, RencontreMonde } from './schemas';

/**
 * Un élément par type de monstre (profil et nom), dans l'ordre de la rencontre ; les doublons s'additionnent.
 * Le nom est celui de la rencontre ou du PNJ à profil, à défaut celui du catalogue. La description vient de la
 * rencontre (texte propre d'un boss) ; pour un monstre sans nom propre, de celle du profil, juste pour toute l'espèce ;
 * un monstre au nom propre sans description propre n'en affiche pas (celle de l'espèce pourrait le contredire).
 */
export function presentationMonstres(r: RencontreMonde, dm: DonneesMonde, srd: Donnees | undefined): PresentationMonstre[] {
  const vus = new Map<string, PresentationMonstre>();
  for (const m of r.monstres) {
    const profil = srd?.monstres.get(m.profil);
    const nomPropre = m.nom ?? (m.pnj ? dm.pnj.get(m.pnj)?.nom : undefined);
    const nom = nomPropre ?? profil?.nom ?? m.profil;
    const cle = `${m.profil}|${nom}`;
    const existant = vus.get(cle);
    if (existant) {
      existant.nombre += m.nombre;
      continue;
    }
    const description = m.description?.trim() || (nomPropre ? undefined : profil?.description?.trim() || undefined);
    vus.set(cle, { profil: m.profil, nom, nombre: m.nombre, ...(description ? { description } : {}), ...(nomPropre ? { chef: true } : {}) });
  }
  return [...vus.values()];
}
