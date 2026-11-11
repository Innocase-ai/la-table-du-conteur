// Sauvegarde automatique du groupe dans le navigateur (localStorage, tolérante aux erreurs).
import { bilanPersonnage, groupeVide, kitDepuisFiche, lireGroupe, personnageComplet, serialiser, type Donnees, type Groupe, type HeroCombat } from '@crpg/regles';

export const CLE_GROUPE = 'crpg.groupe.v1';
export const NIVEAU_PAR_DEFAUT = 1;

/** Où l'on met de côté un groupe sauvegardé qui ne se lit plus, pour ne jamais l'écraser (le joueur peut l'exporter, on peut le réparer). */
export const CLE_GROUPE_ILLISIBLE = 'crpg.groupe.illisible';

/** Le motif du dernier groupe illisible mis de côté à ce chargement (pour prévenir le joueur), ou rien. */
let illisible: string | undefined;
export function groupeMisDeCote(): string | undefined {
  return illisible;
}

export function chargerGroupe(): Groupe {
  try {
    const texte = window.localStorage.getItem(CLE_GROUPE);
    if (!texte) return groupeVide(NIVEAU_PAR_DEFAUT);
    const r = lireGroupe(texte);
    if (r.ok) return r.groupe;
    // Illisible (format changé, héros abîmé) : on le garde de côté AVANT que la sauvegarde automatique n'écrive le groupe vide.
    window.localStorage.setItem(CLE_GROUPE_ILLISIBLE, JSON.stringify({ date: new Date().toISOString(), erreur: r.erreur, texte }));
    illisible = r.erreur;
    return groupeVide(NIVEAU_PAR_DEFAUT);
  } catch {
    return groupeVide(NIVEAU_PAR_DEFAUT);
  }
}

/** Le texte du groupe mis de côté (pour l'enregistrer dans un fichier), ou rien. */
export function texteGroupeMisDeCote(): string | undefined {
  try {
    const brut = window.localStorage.getItem(CLE_GROUPE_ILLISIBLE);
    return brut ? (JSON.parse(brut) as { texte: string }).texte : undefined;
  } catch {
    return undefined;
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
    if (personnageComplet(bilan) && bilan.fiche) res.push({ fiche: bilan.fiche, kit: kitDepuisFiche(bilan.fiche), portrait: p.portrait });
  }
  return res;
}
