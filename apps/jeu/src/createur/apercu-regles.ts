// Aperçu en direct du héros en construction (PV, CA, attaque, sorts), calculé avec les fonctions du moteur
// (`calculerFiche` par `ficheStricte`/`ficheApercu`, `heroDepuisFiche` pour les attaques) : aucune règle n'est refaite ici.
// Tolérant : un brouillon incomplet donne un aperçu « provisoire » (les choix pas encore faits sont remplacés par les
// valeurs recommandées), et sans classe ni espèce il n'y a rien à montrer.
import {
  SORTS_JOUABLES_EN_COMBAT,
  heroDepuisFiche,
  historiqueRecommande,
  kitDepuisFiche,
  type Caracteristique,
  type Donnees,
  type Fiche,
  type Sort,
} from '@crpg/regles';
import { ficheApercu, ficheStricte, tousLesManquants, type Brouillon, type Choix } from './brouillon';

export interface ApercuAttaque {
  nom: string;
  bonus: number;
  /** « 1d8+3 tranchant », plusieurs types de dégâts séparés par « + ». */
  degats: string;
  mode: 'corps-a-corps' | 'distance';
}

export interface ApercuSorts {
  caracteristique: Caracteristique;
  dd: number;
  bonusAttaque: number;
  /** Ce que la classe permet de prendre, et ce que le joueur a pris. */
  mineurs: { pris: number; max: number };
  prepares: { pris: number; max: number };
  /** Sorts de la fiche (pris + accordés) que le moteur sait jouer en combat. */
  jouables: number;
  total: number;
}

export interface ApercuCreation {
  /** Faux tant que la classe et l'espèce ne sont pas choisies : rien à calculer. */
  disponible: boolean;
  /** Vrai quand les valeurs viennent des choix du joueur seuls ; faux si des choix manquants sont remplacés par les conseillés. */
  exact: boolean;
  pv?: number;
  ca?: number;
  attaque?: ApercuAttaque;
  sorts?: ApercuSorts;
  /** Ce qu'il faut choisir pour que l'aperçu apparaisse. */
  indication?: string;
}

/** Les attaques d'arme d'une fiche, telles que le combat les connaît (vide si le kit ne se construit pas). */
export function attaquesDe(fiche: Fiche, donnees: Donnees): ApercuAttaque[] {
  try {
    return heroDepuisFiche(fiche, kitDepuisFiche(fiche), donnees, { x: 0, y: 0 }).attaques.map((a) => ({
      nom: a.nom,
      bonus: a.bonusAttaque,
      degats: a.degats.map((d) => `${d.des}${d.bonus ? (d.bonus > 0 ? `+${d.bonus}` : String(d.bonus)) : ''} ${d.type}`).join(' + '),
      mode: a.mode,
    }));
  } catch {
    return [];
  }
}

/** La meilleure attaque : le plus gros bonus pour toucher, à égalité la première de la liste. */
export function meilleureAttaque(attaques: ApercuAttaque[]): ApercuAttaque | undefined {
  let meilleure: ApercuAttaque | undefined;
  for (const a of attaques) if (!meilleure || a.bonus > meilleure.bonus) meilleure = a;
  return meilleure;
}

/** Les sorts que le héros aura pris, sans doublon : ses choix, plus ceux que l'espèce ou une option accorde. */
export function sortsDuBrouillon(c: Choix, fiche: Fiche | undefined): string[] {
  const ids = [
    ...(c.sortsMineurs ?? []),
    ...(c.sortsPrepares ?? []),
    ...(c.sortsInitie?.mineurs ?? []),
    ...(c.sortsInitie?.niveau1 ?? []),
    ...(fiche?.sortsAccordes ?? []),
  ];
  return ids.filter((id, i) => ids.indexOf(id) === i);
}

export function estJouableEnCombat(id: string): boolean {
  return SORTS_JOUABLES_EN_COMBAT.has(id);
}

/**
 * L'aperçu du brouillon. La fiche stricte (exacte) est préférée ; à défaut, la fiche d'aperçu complète les choix
 * manquants par les valeurs recommandées (historique compris tant qu'il n'est pas choisi).
 */
export function apercuBrouillon(b: Brouillon, donnees: Donnees): ApercuCreation {
  const c = b.choix;
  if (!c.classe || !c.espece) {
    return { disponible: false, exact: false, indication: c.classe || c.espece ? `Choisissez ${c.classe ? "l'espèce" : 'la classe'} pour voir les chiffres du héros.` : "Choisissez une espèce et une classe pour voir les chiffres du héros." };
  }
  const avecNom = { ...c, nom: b.identite.nom.trim() };
  let fiche: Fiche | undefined;
  let exact = false;
  const stricte = ficheStricte(avecNom, donnees);
  if (stricte.fiche) {
    // La fiche vient bien des choix du joueur ; elle n'est « exacte » que s'il ne reste aucun choix à faire (identité exclue).
    fiche = stricte.fiche;
    exact = tousLesManquants(b, donnees, false).length === 0;
  } else {
    const pourApercu: Choix = c.historique ? avecNom : { ...avecNom, historique: historiqueRecommande(c.classe, donnees) };
    fiche = ficheApercu(pourApercu, donnees);
  }
  if (!fiche) return { disponible: false, exact: false, indication: 'Les choix actuels ne permettent pas encore de calculer la fiche.' };

  const inc = fiche.incantation;
  const pris = sortsDuBrouillon(c, fiche);
  return {
    disponible: true,
    exact,
    pv: fiche.pvMax,
    ca: fiche.ca,
    attaque: meilleureAttaque(attaquesDe(fiche, donnees)),
    sorts: inc
      ? {
          caracteristique: inc.caracteristique,
          dd: inc.ddSauvegarde,
          bonusAttaque: inc.bonusAttaque,
          mineurs: { pris: (c.sortsMineurs ?? []).length, max: inc.sortsMineurs },
          prepares: { pris: (c.sortsPrepares ?? []).length, max: inc.sortsPrepares },
          jouables: pris.filter(estJouableEnCombat).length,
          total: pris.length,
        }
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Filtre des sorts : jouables en combat / utilitaires
// ---------------------------------------------------------------------------

export type UsageSort = 'tous' | 'combat' | 'utilitaire';

export const NOMS_USAGES: Record<UsageSort, string> = {
  tous: 'Tous',
  combat: 'Jouables en combat',
  utilitaire: 'Utilitaires',
};

export const AIDE_USAGES: Record<UsageSort, string> = {
  tous: 'Tous les sorts de la liste.',
  combat: 'Les sorts que le moteur de combat sait jouer : ils deviennent des cartes pendant un combat.',
  utilitaire: "Les sorts que le moteur ne joue pas en combat (exploration, rituels, social, effets à venir) : ils restent sur la fiche.",
};

/** Garde les sorts de l'usage demandé (le moteur décide : `SORTS_JOUABLES_EN_COMBAT`). */
export function filtrerParUsage(sorts: Sort[], usage: UsageSort): Sort[] {
  if (usage === 'tous') return sorts;
  return sorts.filter((s) => estJouableEnCombat(s.id) === (usage === 'combat'));
}

/** Combien de sorts chaque usage garderait : pour afficher les compteurs sur les boutons du filtre. */
export function compterParUsage(sorts: Sort[]): Record<UsageSort, number> {
  const combat = sorts.filter((s) => estJouableEnCombat(s.id)).length;
  return { tous: sorts.length, combat, utilitaire: sorts.length - combat };
}
