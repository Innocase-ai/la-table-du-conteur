// Ranger un équipement « en liste » (l'ancienne forme : armure, bouclier, armes, parures) dans les emplacements : l'équipement de
// départ d'un héros à la création, et la conversion des anciennes sauvegardes. Pur : les propriétés des armes et la famille des
// objets viennent d'un petit annuaire fourni par l'appelant (le catalogue du SRD ou du monde).
import type { Equipement } from '../personnage';
import { EMPLACEMENTS_DE, familleDe, type Emplacement, type ObjetPourEmplacement } from './emplacements';

/** L'ancienne forme de l'équipement d'un héros : des listes, sans emplacement. */
export interface AncienEquipement {
  armure?: string;
  bouclier?: string;
  armes: string[];
  portes: string[];
}

export interface AnnuaireObjets {
  /** Les propriétés (« Deux mains », « Légère »…) de l'arme du SRD qu'est cet objet ; rien si ce n'est pas une arme. */
  proprietes?: (idObjet: string) => string[] | undefined;
  /** L'objet (pour sa famille d'emplacements) ; sans lui, les parures ne sont pas rangées. */
  objet?: (idObjet: string) => ObjetPourEmplacement | undefined;
}

/** Une forme d'équipement d'avant les emplacements ? (sauvegardes et tests anciens) */
export function estAncienEquipement(e: unknown): e is AncienEquipement {
  return !!e && typeof e === 'object' && Array.isArray((e as AncienEquipement).armes) && !('emplacements' in (e as object));
}

/**
 * Range l'équipement d'un héros : l'armure au torse ; la première arme en main droite du jeu I (avec le bouclier en main gauche si
 * elle ne demande pas les deux mains) ; la deuxième en main droite du jeu II (le bouclier y va s'il n'a pas trouvé place au jeu I) ;
 * les parures sur leur emplacement. Ce qui ne trouve pas de place revient dans `surplus` (le sac).
 */
export function rangerEquipement(ancien: AncienEquipement, annuaire: AnnuaireObjets = {}): { equipement: Equipement; surplus: string[] } {
  const e: Equipement = { emplacements: {}, jeuActif: 1 };
  const surplus: string[] = [];
  const propr = (id: string) => annuaire.proprietes?.(id) ?? [];
  const deuxMains = (id: string) => propr(id).includes('Deux mains');
  const poser = (emplacement: Emplacement, id: string) => {
    e.emplacements[emplacement] = id;
  };

  if (ancien.armure) poser('torse', ancien.armure);

  const [premiere, seconde, ...reste] = ancien.armes;
  if (premiere) poser('j1.droite', premiere);
  if (seconde) poser('j2.droite', seconde);
  surplus.push(...reste);

  if (ancien.bouclier) {
    if (!(premiere && deuxMains(premiere))) poser('j1.gauche', ancien.bouclier);
    else if (!(seconde && deuxMains(seconde))) poser('j2.gauche', ancien.bouclier);
    else surplus.push(ancien.bouclier);
  }

  for (const id of ancien.portes) {
    const objet = annuaire.objet?.(id);
    const famille = objet ? familleDe(objet) : undefined;
    const libre = famille && famille !== 'main' && famille !== 'torse' ? EMPLACEMENTS_DE[famille].find((s) => !e.emplacements[s]) : undefined;
    if (libre) poser(libre, id);
    else surplus.push(id);
  }
  return { equipement: e, surplus };
}
