// L'annonce de montée de niveau : quand le groupe passe un niveau, un écran le dit (le niveau, chaque héros qui monte, ses PV avant et
// après, et s'il a des choix à revoir). Le moteur a déjà tout fait (module `progression`) : ici on compare l'avant et l'après.
import type { Personnage } from '@crpg/regles';

export interface HerosMonte {
  id: string;
  nom: string;
  portrait?: string;
  espece: string;
  classe: string;
  /** Niveau du héros avant et après. */
  niveauAvant: number;
  niveau: number;
  pvAvant: number;
  pv: number;
  /** Il a de nouveaux choix à revoir (amélioration, sorts, options de classe, expertises). */
  choix: boolean;
}

export interface AnnonceNiveau {
  /** Le niveau que le groupe vient d'atteindre. */
  niveau: number;
  heros: HerosMonte[];
}

export interface InstantGroupe {
  niveau: number;
  groupe: Personnage[];
}

/** L'annonce si le niveau du groupe a monté et qu'au moins un héros est monté avec lui ; sinon rien. */
export function annonceDeNiveau(avant: InstantGroupe, apres: InstantGroupe): AnnonceNiveau | undefined {
  if (apres.niveau <= avant.niveau) return undefined;
  const heros: HerosMonte[] = [];
  for (const h of apres.groupe) {
    const d = avant.groupe.find((x) => x.id === h.id);
    const niveauAvant = d?.choix?.niveau;
    const niveau = h.choix?.niveau;
    if (!d || niveauAvant === undefined || niveau === undefined || niveau <= niveauAvant) continue;
    heros.push({
      id: h.id,
      nom: h.nom,
      portrait: h.portrait,
      espece: h.fiche.espece,
      classe: h.fiche.classe,
      niveauAvant,
      niveau,
      pvAvant: d.fiche.pvMax,
      pv: h.fiche.pvMax,
      choix: !!h.monteeEnAttente,
    });
  }
  return heros.length ? { niveau: apres.niveau, heros } : undefined;
}
