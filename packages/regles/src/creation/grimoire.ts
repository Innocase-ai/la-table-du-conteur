// Le grimoire du Magicien (SRD 5.2.1) : six sorts du 1er niveau au départ, deux de plus à chaque niveau gagné ; les sorts préparés
// se choisissent dans ce livre. Une partie ou un groupe créés avant le grimoire n'en ont pas : on leur inscrit leurs sorts
// préparés, complétés par les sorts conseillés jusqu'à la taille du livre (le héros ne perd rien).
import type { Donnees } from '../donnees';
import type { Personnage } from '../personnage';
import type { Groupe, PersonnageCree } from './groupe';
import { recommanderCompetences } from './recommandations';
import { tailleGrimoire } from './regles-creation';

/** Le héros est-il d'une classe à grimoire, sans livre encore choisi ? */
export function grimoireManquant(h: Pick<Personnage, 'choix'>): boolean {
  return !!h.choix && tailleGrimoire(h.choix.classe, h.choix.niveau) !== undefined && !h.choix.sortsGrimoire;
}

/** Inscrit le grimoire d'un héros qui n'en a pas (voir plus haut) ; renvoie vrai si le héros a changé. */
export function inscrireGrimoireManquant(h: Personnage, donnees: Donnees): boolean {
  if (!grimoireManquant(h)) return false;
  const livre = recommanderCompetences({ ...h.choix!, niveau: h.choix!.niveau }, donnees).sortsGrimoire;
  if (!livre?.length) return false;
  h.choix = { ...h.choix!, sortsGrimoire: livre };
  h.fiche = { ...h.fiche, grimoire: livre };
  return true;
}

/**
 * Le groupe du joueur (enregistré ou importé) où chaque héros d'une classe à grimoire a son livre. Un groupe enregistré avant
 * le grimoire (14/11) n'en a pas : son Magicien serait « incomplet » (`manquants` exige le livre) et resterait au camp, le
 * groupe entrant en jeu à 5 au lieu de 6. Le livre part des sorts préparés, complétés par les sorts conseillés : le héros ne
 * perd rien. Rend le même groupe, tel quel, quand personne n'a besoin du livre.
 */
export function completerGrimoireGroupe(groupe: Groupe, donnees: Donnees): Groupe {
  let change = false;
  const emplacements = groupe.emplacements.map((p) => {
    if (!p || !grimoireManquant(p)) return p;
    const livre = recommanderCompetences({ ...p.choix, niveau: p.choix.niveau }, donnees).sortsGrimoire;
    if (!livre?.length) return p;
    change = true;
    const complete: PersonnageCree = { ...p, choix: { ...p.choix, sortsGrimoire: livre } };
    return complete;
  });
  return change ? { ...groupe, emplacements } : groupe;
}
