// Règles de création partagées entre le calcul de la fiche et l'assistant :
// sorts disponibles, bottes d'arme, choix requis. Ne dépend pas de fiche.ts.
import type { Donnees } from '../donnees';
import type { Arme, ChoixCreation, Classe, Sort } from '../schemas';

/** Niveau de sort le plus élevé que la classe peut lancer à ce niveau de personnage (0 si aucun). */
export function niveauSortMax(classe: Classe, niveau: number): number {
  const inc = classe.incantation;
  if (!inc) return 0;
  if (inc.niveauEmplacementPacte) return inc.niveauEmplacementPacte[niveau - 1] ?? 0;
  const emplacements = inc.emplacements[niveau - 1] ?? [];
  return emplacements.length;
}

/** Sorts de la liste de la classe, du niveau 0 au niveau maximal accessible. */
export function sortsEligibles(classeId: string, niveauMax: number, donnees: Donnees): Sort[] {
  return [...donnees.sorts.values()]
    .filter((s) => s.niveau <= niveauMax && s.classes.includes(classeId))
    .sort((a, b) => a.niveau - b.niveau || a.nom.localeCompare(b.nom, 'fr'));
}

/** Liste de sorts du don Initié à la magie selon l'historique qui l'accorde. */
export const LISTE_INITIE: Record<string, 'clerc' | 'magicien'> = { acolyte: 'clerc', sage: 'magicien' };

export interface RegleInitie {
  liste: 'clerc' | 'magicien';
  mineurs: number;
  niveau1: number;
}

export function regleInitie(historiqueId: string, donsIds: string[]): RegleInitie | undefined {
  const liste = LISTE_INITIE[historiqueId];
  return liste && donsIds.includes('initie-a-la-magie') ? { liste, mineurs: 2, niveau1: 1 } : undefined;
}

const COLONNE_BOTTES = 'Bottes d’arme';

const FILTRES_BOTTES: Record<string, (a: Arme) => boolean> = {
  barbare: (a) => a.portee === 'corps-a-corps',
  guerrier: () => true,
  paladin: () => true,
  rodeur: () => true,
  roublard: (a) => a.categorie === 'courante' || a.proprietes.some((p) => p === 'Finesse' || p === 'Légère'),
};

/** Bottes d'arme : nombre d'armes à choisir et armes possibles (undefined si la classe n'a pas l'aptitude). */
export function bottesPossibles(classe: Classe, niveau: number, donnees: Donnees): { nombre: number; parmi: string[] } | undefined {
  const filtre = FILTRES_BOTTES[classe.id];
  if (!filtre || !classe.aptitudes.some((a) => a.id === 'bottes-d-arme' && a.niveau <= niveau)) return undefined;
  const colonne = classe.progression[niveau - 1]?.colonnes[COLONNE_BOTTES];
  const nombre = typeof colonne === 'number' ? colonne : 2;
  const parmi = [...donnees.armes.values()].filter(filtre).map((a) => a.id);
  return { nombre, parmi };
}

/** Choix de création applicables à une classe et une espèce, avec le nombre d'options à prendre à ce niveau. */
export function choixRequis(classeId: string, especeId: string, niveau: number, donnees: Donnees): { choix: ChoixCreation; nombre: number }[] {
  return [...donnees.choix.values()]
    .filter((c) => (c.source.type === 'classe' ? c.source.id === classeId : c.source.id === especeId))
    .map((choix) => ({ choix, nombre: choix.nombres[niveau - 1] ?? 0 }))
    .filter((c) => c.nombre > 0);
}
