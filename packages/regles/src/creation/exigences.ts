// Ce que le créateur doit encore demander au joueur, d'après la classe, l'espèce, l'historique et le niveau.
// Le moteur de fiche (calculerFiche) refuse un personnage invalide ; ce module dit ce qui manque,
// écran par écran, pour que l'assistant sache quand « Suivant » est permis.
import type { Donnees } from '../donnees';
import type { ChoixPersonnage } from '../fiche';
import type { ChoixCreation, Competence, Effet } from '../schemas';
import { optionsEquipement } from './equipement';
import { bottesPossibles, choixRequis, niveauSortMax, regleInitie, tailleGrimoire, type RegleInitie } from './regles-creation';

export const ETAPES = ['espece', 'classe', 'historique', 'caracteristiques', 'competences', 'alignement', 'identite', 'recapitulatif'] as const;
export type Etape = (typeof ETAPES)[number];

export const NOMS_ETAPES: Record<Etape, string> = {
  espece: 'Espèce',
  classe: 'Classe',
  historique: 'Historique',
  caracteristiques: 'Caractéristiques',
  competences: 'Choix de classe',
  alignement: 'Alignement',
  identite: 'Nom et portrait',
  recapitulatif: 'Récapitulatif',
};

export type ChoixPartiel = Partial<ChoixPersonnage> & { classe?: string; espece?: string; historique?: string };

export interface Exigences {
  niveau: number;
  competencesClasse: { nombre: number; parmi: Competence[] };
  /** Compétences accordées par l'espèce, les dons ou la classe : chaque entrée est une restriction (ou `undefined` = libre). */
  competencesSupplementaires: { nombre: number; restrictions: (Competence[] | undefined)[] };
  expertises: { nombre: number; libres: number; restreintes: Competence[][] };
  ameliorations: number;
  /** Faveurs épiques à choisir (une au niveau 19), chacune avec la caractéristique qu'elle relève. */
  faveursEpiques: number;
  donsStyle: number;
  donsOrigine: number;
  tailles: ('P' | 'M')[];
  choixEspece: { choix: ChoixCreation; nombre: number }[];
  choixClasse: { choix: ChoixCreation; nombre: number }[];
  /** `grimoire` : sorts du livre du Magicien (les sorts préparés se choisissent dedans) ; absent pour les autres classes. */
  sorts?: { mineurs: number; prepares: number; niveauMax: number; grimoire?: number };
  initie?: RegleInitie;
  bottes?: { nombre: number; parmi: string[] };
  equipementClasse: { id: string; objets: string[]; po: number }[];
  equipementHistorique: { id: string; objets: string[]; po: number }[];
}

/** Effets des traits, aptitudes, dons et options déjà choisies ; sert à dénombrer les choix restants. */
export function effetsAcquis(c: Required<Pick<ChoixPartiel, 'classe' | 'espece' | 'historique'>> & { niveau: number; dons?: string[]; choix?: Record<string, string[]> }, donnees: Donnees): Effet[] {
  const classe = donnees.classes.get(c.classe);
  const espece = donnees.especes.get(c.espece);
  const historique = donnees.historiques.get(c.historique);
  if (!classe || !espece || !historique) return [];
  const effets: Effet[] = [];
  for (const t of espece.traits) if (t.niveau <= c.niveau) effets.push(...t.effets);
  for (const a of classe.aptitudes) if (a.niveau <= c.niveau) effets.push(...a.effets);
  if (c.niveau >= 3) for (const a of classe.sousClasse.aptitudes) if (a.niveau <= c.niveau) effets.push(...a.effets);
  for (const id of [historique.don, ...(c.dons ?? [])]) effets.push(...(donnees.dons.get(id)?.effets ?? []));
  for (const [idChoix, ids] of Object.entries(c.choix ?? {})) {
    const def = donnees.choix.get(idChoix);
    for (const id of ids) effets.push(...(def?.options.find((o) => o.id === id)?.effets ?? []));
  }
  return effets;
}

export function exigences(c: ChoixPartiel & { niveau: number }, donnees: Donnees): Exigences | undefined {
  if (!c.classe || !c.espece || !c.historique) return undefined;
  const classe = donnees.classes.get(c.classe);
  const espece = donnees.especes.get(c.espece);
  const historique = donnees.historiques.get(c.historique);
  if (!classe || !espece || !historique) return undefined;
  const niveau = c.niveau;
  const effets = effetsAcquis({ classe: c.classe, espece: c.espece, historique: c.historique, niveau, dons: c.dons, choix: c.choix }, donnees);
  const de = <T extends Effet['type']>(type: T) => effets.filter((e): e is Extract<Effet, { type: T }> => e.type === type);

  const toutes = Object.keys(
    // l'ordre des compétences du SRD sert d'ordre d'affichage
    (donnees.classes.get(c.classe)!.competences.parmi === 'toutes' ? Object.fromEntries(COMPETENCES_ORDRE.map((k) => [k, 1])) : {}),
  ) as Competence[];
  const parmi = classe.competences.parmi === 'toutes' ? toutes : classe.competences.parmi;

  const supp = de('maitrise_competences');
  const exp = de('expertise');
  const styles = classe.aptitudes.filter((a) => a.id === 'style-de-combat' && a.niveau <= niveau).length;
  const allClasse = classe.incantation;
  const maxNiveau = niveauSortMax(classe, niveau);
  const mineursExtra = de('sorts_mineurs_supplementaires').reduce((s, e) => s + e.nombre, 0);

  return {
    niveau,
    competencesClasse: { nombre: classe.competences.nombre, parmi },
    competencesSupplementaires: {
      nombre: supp.reduce((s, e) => s + e.nombre, 0),
      restrictions: supp.flatMap((e) => Array.from({ length: e.nombre }, () => e.parmi)),
    },
    expertises: {
      nombre: exp.reduce((s, e) => s + e.nombre, 0),
      libres: exp.filter((e) => !e.parmi).reduce((s, e) => s + e.nombre, 0),
      restreintes: exp.filter((e) => e.parmi).map((e) => e.parmi!),
    },
    ameliorations: de('amelioration_caracteristique').length,
    faveursEpiques: de('faveur_epique').length,
    donsStyle: Math.min(1, styles),
    donsOrigine: espece.traits.some((t) => t.id === 'polyvalent') ? 1 : 0,
    tailles: espece.tailles,
    choixEspece: choixRequis('', espece.id, niveau, donnees).filter((x) => x.choix.source.type === 'espece'),
    choixClasse: choixRequis(classe.id, '', niveau, donnees).filter((x) => x.choix.source.type === 'classe'),
    sorts: allClasse
      ? { mineurs: allClasse.sortsMineurs[niveau - 1]! + mineursExtra, prepares: allClasse.sortsPrepares[niveau - 1]!, niveauMax: maxNiveau, ...(tailleGrimoire(classe.id, niveau) !== undefined ? { grimoire: tailleGrimoire(classe.id, niveau)! } : {}) }
      : undefined,
    initie: regleInitie(historique.id, [historique.don, ...(c.dons ?? [])]),
    bottes: bottesPossibles(classe, niveau, donnees),
    equipementClasse: optionsEquipement(classe.equipementDepart, 'classe', donnees),
    equipementHistorique: optionsEquipement(historique.equipementDepart, 'historique', donnees),
  };
}

const COMPETENCES_ORDRE: Competence[] = [
  'acrobaties', 'arcanes', 'athletisme', 'discretion', 'dressage', 'escamotage', 'histoire', 'intimidation', 'intuition',
  'investigation', 'medecine', 'nature', 'perception', 'persuasion', 'religion', 'representation', 'survie', 'tromperie',
];

export interface Manquant {
  etape: Etape;
  message: string;
}

/** Tout ce qu'il reste à choisir, rangé par écran du créateur. Vide = le personnage est complet. */
export function manquants(c: ChoixPartiel & { niveau: number }, donnees: Donnees, identite?: { nom?: string; portrait?: string; alignement?: string }): Manquant[] {
  const res: Manquant[] = [];
  const ajouter = (etape: Etape, message: string) => res.push({ etape, message });
  if (!c.espece) ajouter('espece', 'Choisis une espèce.');
  if (!c.classe) ajouter('classe', 'Choisis une classe.');
  if (!c.historique) ajouter('historique', 'Choisis un historique.');
  const ex = exigences(c, donnees);
  // Les choix propres à l'espèce se contrôlent dès qu'elle est choisie, avant la classe et l'historique.
  if (!ex && c.espece && donnees.especes.has(c.espece)) {
    const espece = donnees.especes.get(c.espece)!;
    if (espece.tailles.length > 1 && !c.taille) ajouter('espece', `Choisis une taille (${espece.nom}).`);
    for (const { choix, nombre } of choixRequis('', espece.id, c.niveau, donnees).filter((x) => x.choix.source.type === 'espece')) {
      const n = c.choix?.[choix.id]?.length ?? 0;
      if (n < nombre) ajouter('espece', `${choix.nom} : ${nombre - n} choix restant(s).`);
    }
    const origines = (c.dons ?? []).filter((id) => donnees.dons.get(id)?.categorie === 'origines').length;
    if (espece.traits.some((t) => t.id === 'polyvalent') && origines < 1) ajouter('espece', "Choisis un don d'origine (Polyvalent).");
  }
  if (identite !== undefined) {
    if (!identite.alignement) ajouter('alignement', 'Choisis un alignement.');
    if (!identite.nom?.trim()) ajouter('identite', 'Donne un nom au personnage.');
    if (!identite.portrait) ajouter('identite', 'Choisis un portrait.');
  }
  if (!ex) return res;

  const espece = donnees.especes.get(c.espece!)!;
  if (ex.tailles.length > 1 && !c.taille) ajouter('espece', `Choisis une taille (${espece.nom}).`);
  const compte = (choix: ChoixCreation) => c.choix?.[choix.id]?.length ?? 0;
  for (const { choix, nombre } of ex.choixEspece) if (compte(choix) < nombre) ajouter('espece', `${choix.nom} : ${nombre - compte(choix)} choix restant(s).`);
  const dons = (c.dons ?? []).map((id) => donnees.dons.get(id));
  if (dons.filter((d) => d?.categorie === 'origines').length < ex.donsOrigine) ajouter('espece', "Choisis un don d'origine (Polyvalent).");
  if (ex.initie) {
    const { mineurs = [], niveau1 = [] } = c.sortsInitie ?? {};
    if (mineurs.length < ex.initie.mineurs) ajouter('historique', `Initié à la magie : ${ex.initie.mineurs - mineurs.length} sort(s) mineur(s) à choisir.`);
    if (niveau1.length < ex.initie.niveau1) ajouter('historique', 'Initié à la magie : un sort de niveau 1 à choisir.');
  }

  const bonus = Object.values(c.bonusHistorique ?? {}).filter((v) => v !== 0);
  if (!c.valeursBase) ajouter('caracteristiques', 'Répartis les caractéristiques.');
  if (bonus.length === 0) ajouter('caracteristiques', "Répartis le bonus de l'historique.");
  if ((c.ameliorations?.length ?? 0) < ex.ameliorations) ajouter('caracteristiques', `${ex.ameliorations - (c.ameliorations?.length ?? 0)} amélioration(s) de caractéristique à répartir.`);

  if ((c.competencesClasse?.length ?? 0) < ex.competencesClasse.nombre) ajouter('competences', `Choisis ${ex.competencesClasse.nombre} compétences de classe.`);
  if ((c.competencesSupplementaires?.length ?? 0) < ex.competencesSupplementaires.nombre) ajouter('competences', `${ex.competencesSupplementaires.nombre - (c.competencesSupplementaires?.length ?? 0)} compétence(s) supplémentaire(s) à choisir.`);
  if ((c.expertises?.length ?? 0) < ex.expertises.nombre) ajouter('competences', `${ex.expertises.nombre - (c.expertises?.length ?? 0)} expertise(s) à choisir.`);
  if (dons.filter((d) => d?.categorie === 'style-de-combat').length < ex.donsStyle) ajouter('competences', 'Choisis un style de combat.');
  const faveurs = dons.filter((d) => d?.categorie === 'faveur-epique').length;
  if (faveurs < ex.faveursEpiques) ajouter('competences', 'Choisis une Faveur épique.');
  else if ((c.faveurCaracteristique?.length ?? 0) < ex.faveursEpiques) ajouter('competences', 'Choisis la caractéristique que relève ta Faveur épique.');
  for (const { choix, nombre } of ex.choixClasse) if (compte(choix) < nombre) ajouter('competences', `${choix.nom} : ${nombre - compte(choix)} choix restant(s).`);
  if (ex.bottes && (c.bottes?.length ?? 0) < ex.bottes.nombre) ajouter('competences', `Bottes d'arme : ${ex.bottes.nombre - (c.bottes?.length ?? 0)} arme(s) à choisir.`);
  if (ex.sorts) {
    if ((c.sortsMineurs?.length ?? 0) < ex.sorts.mineurs) ajouter('competences', `${ex.sorts.mineurs - (c.sortsMineurs?.length ?? 0)} sort(s) mineur(s) à choisir.`);
    if (ex.sorts.grimoire !== undefined && (c.sortsGrimoire?.length ?? 0) < ex.sorts.grimoire) ajouter('competences', `${ex.sorts.grimoire - (c.sortsGrimoire?.length ?? 0)} sort(s) à inscrire dans le grimoire.`);
    if ((c.sortsPrepares?.length ?? 0) < ex.sorts.prepares) ajouter('competences', `${ex.sorts.prepares - (c.sortsPrepares?.length ?? 0)} sort(s) préparé(s) à choisir.`);
  }
  if (!c.equipementClasse) ajouter('competences', "Choisis ton équipement de classe.");
  if (ex.equipementHistorique.length && !c.equipementHistorique) ajouter('competences', "Choisis ton équipement d'historique.");
  return res;
}
