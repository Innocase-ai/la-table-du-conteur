// Du personnage créé au combattant : armes, bottes d'arme, sorts jouables et potion de soins.
import { SORTS_JOUABLES_EN_COMBAT } from '../combat/sorts';
import type { Kit } from '../combat/creation';
import type { Fiche } from '../fiche';

export function kitDepuisFiche(fiche: Fiche): Kit {
  const sorts = [...fiche.sortsMineurs, ...fiche.sortsPrepares, ...fiche.sortsAccordes].filter((id, i, tous) => tous.indexOf(id) === i && SORTS_JOUABLES_EN_COMBAT.has(id));
  return {
    armes: (fiche.equipement?.armes ?? []).map((id) => ({ id, botte: fiche.bottes.includes(id) })),
    sorts,
    potions: 1,
  };
}
