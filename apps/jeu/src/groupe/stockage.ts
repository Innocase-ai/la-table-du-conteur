// Sauvegarde automatique du groupe dans le navigateur (localStorage, tolérante aux erreurs).
import { bilanPersonnage, groupeVide, kitDepuisFiche, lireGroupe, personnageComplet, serialiser, type Donnees, type Groupe, type HeroCombat } from '@crpg/regles';

export const CLE_GROUPE = 'crpg.groupe.v1';
export const NIVEAU_PAR_DEFAUT = 3;

export function chargerGroupe(): Groupe {
  try {
    const texte = window.localStorage.getItem(CLE_GROUPE);
    if (!texte) return groupeVide(NIVEAU_PAR_DEFAUT);
    const r = lireGroupe(texte);
    return r.ok ? r.groupe : groupeVide(NIVEAU_PAR_DEFAUT);
  } catch {
    return groupeVide(NIVEAU_PAR_DEFAUT);
  }
}

export function sauverGroupe(groupe: Groupe): void {
  try {
    window.localStorage.setItem(CLE_GROUPE, serialiser(groupe));
  } catch {
    // stockage indisponible (navigation privée, quota) : le groupe reste en mémoire
  }
}

/** Les personnages complets du groupe (1 à 6), prêts pour `preparerRencontre`. */
export function herosDuGroupe(groupe: Groupe, donnees: Donnees): HeroCombat[] {
  const res: HeroCombat[] = [];
  for (const p of groupe.emplacements) {
    if (!p) continue;
    const bilan = bilanPersonnage(p, donnees);
    if (personnageComplet(bilan) && bilan.fiche) res.push({ fiche: bilan.fiche, kit: kitDepuisFiche(bilan.fiche) });
  }
  return res;
}
