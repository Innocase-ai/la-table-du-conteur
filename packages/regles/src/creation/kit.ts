// Du personnage créé au combattant : armes, bottes d'arme, sorts jouables et potion de soins.
import { SORTS_JOUABLES_EN_COMBAT } from '../combat/sorts';
import type { ArmeKit, Kit } from '../combat/creation';
import type { Fiche } from '../fiche';

export function kitDepuisFiche(fiche: Fiche): Kit {
  const sorts = [...fiche.sortsMineurs, ...fiche.sortsPrepares, ...fiche.sortsAccordes].filter((id, i, tous) => tous.indexOf(id) === i && SORTS_JOUABLES_EN_COMBAT.has(id));
  return {
    armes: armesDuKit(fiche, fiche.equipement?.armes ?? [], fiche.equipement?.gauche),
    ...(fiche.equipement?.autreJeu ? { autreJeu: { armes: armesDuKit(fiche, fiche.equipement.autreJeu.armes, fiche.equipement.autreJeu.gauche), ca: fiche.equipement.autreJeu.ca, sansFormation: fiche.equipement.autreJeu.sansFormation } } : {}),
    ...(fiche.equipement?.jeu ? { jeu: fiche.equipement.jeu } : {}),
    sorts,
    potions: 1,
  };
}

/** Les armes d'un jeu pour le combat ; avec `gauche`, la dernière est tenue de la main gauche. */
function armesDuKit(fiche: Fiche, ids: string[], gauche?: boolean): ArmeKit[] {
  return ids.map((id, i) => ({ id, botte: fiche.bottes.includes(id), ...(gauche && i === ids.length - 1 && ids.length > 1 ? { main: 'gauche' as const } : {}) }));
}
