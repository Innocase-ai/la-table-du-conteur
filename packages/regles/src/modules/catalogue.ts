// Le catalogue d'objets d'une partie : celui du monde d'abord, puis celui du SRD (équipement, potions, armes, armures),
// commun à tous les mondes. Un monde n'a donc pas à redéfinir les objets communs : il cite leur id.
import type { Objet } from '../monde/schemas';
import type { ContexteJeu } from '../noyau/types';

export function objetDe(ctx: ContexteJeu, id: string): Pick<Objet, 'id' | 'nom' | 'categorie' | 'resume'> & Partial<Objet> {
  const o = ctx.dm.objets.get(id) ?? ctx.srd?.objets.get(id);
  if (o) return o;
  const arme = ctx.srd?.armes.get(id);
  if (arme) return { id, nom: arme.nom, categorie: 'arme', resume: `Arme : ${arme.degats} ${arme.typeDegats}.`, poidsKg: arme.poidsKg, valeurPo: arme.prixPo };
  const armure = ctx.srd?.armures.get(id);
  if (armure) {
    return {
      id,
      nom: armure.nom,
      categorie: armure.id === 'bouclier' ? 'bouclier' : 'armure',
      resume: armure.id === 'bouclier' ? 'Bouclier : +2 à la CA.' : `Armure (CA ${armure.ca}).`,
      poidsKg: armure.poidsKg,
      valeurPo: armure.prixPo,
    };
  }
  return { id, nom: id, categorie: 'divers', resume: '' };
}
