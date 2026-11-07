// Valeurs « recommandées » du créateur (bouton Recommandé, Création rapide) : répartitions conseillées par
// le SRD, compétences et sorts usuels de chaque classe. Tout choix recommandé est ensuite validé comme les autres.
import { VALEURS_STANDARD, type Valeurs } from '../caracteristiques';
import { SORTS_JOUABLES_EN_COMBAT } from '../combat/sorts';
import type { Donnees } from '../donnees';
import type { ChoixPersonnage } from '../fiche';
import { CARACTERISTIQUES, type Caracteristique, type Competence } from '../schemas';
import { equipementChoisi } from './equipement';
import { effetsAcquis, exigences, type ChoixPartiel } from './exigences';
import { caracteristiquesDeFaveur, FAVEUR_RECOMMANDEE } from './faveurs';
import { nombreDeChoix, sortsEligibles } from './regles-creation';

/** Valeurs standard par classe, dans l'ordre For, Dex, Con, Int, Sag, Cha (table « Valeurs standard par classe », SRD p. 22). */
export const VALEURS_PAR_CLASSE: Record<string, number[]> = {
  barbare: [15, 13, 14, 10, 12, 8],
  barde: [8, 14, 12, 13, 10, 15],
  clerc: [14, 8, 13, 10, 15, 12],
  druide: [8, 12, 14, 13, 15, 10],
  ensorceleur: [10, 13, 14, 8, 12, 15],
  guerrier: [15, 14, 13, 8, 10, 12],
  magicien: [8, 12, 13, 15, 14, 10],
  moine: [12, 15, 13, 10, 14, 8],
  occultiste: [8, 14, 13, 12, 10, 15],
  paladin: [15, 10, 13, 8, 12, 14],
  rodeur: [12, 15, 13, 8, 14, 10],
  roublard: [12, 15, 13, 14, 10, 8],
};

export function valeursRecommandees(classeId: string): Valeurs {
  const v = VALEURS_PAR_CLASSE[classeId] ?? [...VALEURS_STANDARD];
  return Object.fromEntries(CARACTERISTIQUES.map((c, i) => [c, v[i]!])) as Valeurs;
}

/** Caractéristiques de la plus importante à la moins importante pour la classe. */
export function prioriteCaracteristiques(classeId: string): Caracteristique[] {
  const v = valeursRecommandees(classeId);
  return [...CARACTERISTIQUES].sort((a, b) => v[b] - v[a] || CARACTERISTIQUES.indexOf(a) - CARACTERISTIQUES.indexOf(b));
}

const HISTORIQUE_THEMATIQUE: Record<string, string> = { clerc: 'acolyte', magicien: 'sage', roublard: 'criminel' };

export function historiqueRecommande(classeId: string, donnees: Donnees): string {
  const theme = HISTORIQUE_THEMATIQUE[classeId];
  if (theme && donnees.historiques.has(theme)) return theme;
  const priorite = prioriteCaracteristiques(classeId);
  let meilleur = '';
  let score = -1;
  for (const h of donnees.historiques.values()) {
    const s = h.caracteristiques.reduce((total, c) => total + (6 - priorite.indexOf(c)), 0);
    if (s > score) {
      score = s;
      meilleur = h.id;
    }
  }
  return meilleur;
}

/** +2 à la caractéristique de l'historique la plus utile à la classe, +1 à la suivante. */
export function bonusHistoriqueRecommande(classeId: string, historiqueId: string, donnees: Donnees): Partial<Valeurs> {
  const h = donnees.historiques.get(historiqueId);
  if (!h) return {};
  const priorite = prioriteCaracteristiques(classeId);
  const [premiere, seconde] = [...h.caracteristiques].sort((a, b) => priorite.indexOf(a) - priorite.indexOf(b));
  return { [premiere!]: 2, [seconde!]: 1 };
}

const COMPETENCES_GENERALES: Competence[] = [
  'perception', 'discretion', 'persuasion', 'athletisme', 'intuition', 'investigation', 'survie', 'arcanes', 'acrobaties',
  'medecine', 'nature', 'histoire', 'intimidation', 'tromperie', 'religion', 'representation', 'escamotage', 'dressage',
];

/** Compétences usuelles de chaque classe, de la plus utile à la moins utile. */
export const COMPETENCES_PAR_CLASSE: Record<string, Competence[]> = {
  barbare: ['athletisme', 'perception', 'survie', 'intimidation', 'nature', 'dressage'],
  barde: ['persuasion', 'representation', 'perception', 'tromperie', 'intuition', 'discretion'],
  clerc: ['medecine', 'persuasion', 'intuition', 'religion', 'histoire'],
  druide: ['perception', 'survie', 'nature', 'medecine', 'intuition', 'dressage'],
  ensorceleur: ['persuasion', 'arcanes', 'intimidation', 'intuition', 'tromperie'],
  guerrier: ['perception', 'athletisme', 'intimidation', 'survie', 'acrobaties'],
  magicien: ['arcanes', 'investigation', 'histoire', 'intuition', 'medecine'],
  moine: ['acrobaties', 'discretion', 'athletisme', 'perception', 'intuition'],
  occultiste: ['arcanes', 'intimidation', 'investigation', 'tromperie', 'religion'],
  paladin: ['athletisme', 'persuasion', 'intuition', 'intimidation', 'religion'],
  rodeur: ['perception', 'survie', 'discretion', 'athletisme', 'investigation', 'nature'],
  roublard: ['discretion', 'perception', 'escamotage', 'acrobaties', 'investigation', 'tromperie'],
};

const STYLE_PAR_CLASSE: Record<string, string> = { guerrier: 'defense', paladin: 'defense', rodeur: 'archerie' };
const OPTION_PAR_CHOIX: Record<string, string> = { 'ordre-divin': 'protecteur', 'ordre-primitif': 'gardien' };

/** Sorts préférés de chaque classe (en plus de la priorité aux sorts jouables en combat). */
export const SORTS_PAR_CLASSE: Record<string, string[]> = {
  barde: ['moquerie-cruelle', 'main-du-mage', 'mot-de-guerison', 'sommeil', 'soins', 'vague-tonnante', 'charme-personne'],
  clerc: ['flamme-sacree', 'thaumaturgie', 'benediction', 'soins', 'mot-de-guerison', 'eclair-tracant', 'bouclier-de-la-foi', 'arme-spirituelle'],
  druide: ['druidisme', 'bouffee-de-poison', 'soins', 'vague-tonnante', 'mot-de-guerison', 'enchevetrement'],
  ensorceleur: ['trait-de-feu', 'rayon-de-givre', 'prestidigitation', 'projectile-magique', 'bouclier', 'mains-brulantes', 'sommeil'],
  magicien: ['trait-de-feu', 'rayon-de-givre', 'prestidigitation', 'projectile-magique', 'bouclier', 'sommeil', 'mains-brulantes', 'armure-du-mage'],
  occultiste: ['decharge-occulte', 'contact-glacial', 'bouclier', 'projectile-magique', 'fleau', 'charme-personne'],
  paladin: ['benediction', 'soins', 'bouclier-de-la-foi', 'chatiment-divin'],
  rodeur: ['marque-du-chasseur', 'soins', 'baies-nourricieres'],
};

function ordreSorts(classeId: string, ids: string[]): string[] {
  const pref = SORTS_PAR_CLASSE[classeId] ?? [];
  const rang = (id: string) => {
    const i = pref.indexOf(id);
    return i >= 0 ? i : 100;
  };
  return [...ids].sort((a, b) => {
    const ja = SORTS_JOUABLES_EN_COMBAT.has(a) ? 0 : 1;
    const jb = SORTS_JOUABLES_EN_COMBAT.has(b) ? 0 : 1;
    return ja - jb || rang(a) - rang(b) || a.localeCompare(b);
  });
}

function premiers<T>(liste: T[], n: number, deja: T[] = []): T[] {
  return liste.filter((x) => !deja.includes(x)).slice(0, n);
}

// ---------------------------------------------------------------------------
// Une recommandation par écran du créateur
// ---------------------------------------------------------------------------

export type Recommandation = Partial<ChoixPersonnage>;

/** Écran Espèce : taille, lignage, don d'origine de l'humain. */
export function recommanderEspece(c: ChoixPartiel & { niveau: number }, donnees: Donnees): Recommandation {
  const ex = exigences(c, donnees) ?? (c.espece && c.classe ? undefined : undefined);
  const espece = c.espece ? donnees.especes.get(c.espece) : undefined;
  if (!espece) return {};
  const res: Recommandation = { taille: espece.tailles.includes('M') ? 'M' : espece.tailles[0] };
  const choix: Record<string, string[]> = { ...(c.choix ?? {}) };
  for (const def of donnees.choix.values()) {
    if (def.source.type !== 'espece' || def.source.id !== espece.id) continue;
    choix[def.id] = def.options.slice(0, nombreDeChoix(def, c.niveau) || 1).map((o) => o.id);
  }
  res.choix = choix;
  if (espece.traits.some((t) => t.id === 'polyvalent')) {
    const style = (c.dons ?? []).filter((id) => donnees.dons.get(id)?.categorie !== 'origines');
    // Vigilant, sauf si l'historique le donne déjà (un don non répétable ne se prend qu'une fois) : alors Robuste, ou le premier don d'origine libre.
    const dejaDonne = c.historique ? donnees.historiques.get(c.historique)?.don : undefined;
    const origine = ['vigilant', 'robuste', ...[...donnees.dons.values()].filter((d) => d.categorie === 'origines').map((d) => d.id)].find((id) => id !== dejaDonne && donnees.dons.has(id))!;
    res.dons = [...style, origine];
  }
  void ex;
  return res;
}

/** Écran Historique : sorts du don Initié à la magie. */
export function recommanderHistorique(c: ChoixPartiel & { niveau: number }, donnees: Donnees): Recommandation {
  const ex = exigences(c, donnees);
  if (!ex?.initie) return {};
  const liste = sortsEligibles(ex.initie.liste, 1, donnees);
  const classeRef = ex.initie.liste;
  const mineurs = ordreSorts(classeRef, liste.filter((s) => s.niveau === 0).map((s) => s.id));
  const niveau1 = ordreSorts(classeRef, liste.filter((s) => s.niveau === 1).map((s) => s.id));
  return { sortsInitie: { mineurs: mineurs.slice(0, ex.initie.mineurs), niveau1: niveau1.slice(0, ex.initie.niveau1) } };
}

/** Écran Caractéristiques : valeurs standard de la classe, bonus d'historique, améliorations. */
export function recommanderCaracteristiques(c: ChoixPartiel & { niveau: number }, donnees: Donnees): Recommandation {
  if (!c.classe) return {};
  const valeursBase = valeursRecommandees(c.classe);
  const res: Recommandation = { methode: 'standard', valeursBase };
  if (c.historique) res.bonusHistorique = bonusHistoriqueRecommande(c.classe, c.historique, donnees);
  const ex = exigences(c, donnees);
  if (ex && ex.ameliorations > 0) {
    // +2 à la caractéristique principale tant qu'elle reste à 20 ou moins, sinon +1 / +1 aux suivantes.
    const priorite = prioriteCaracteristiques(c.classe);
    const total: Valeurs = { ...valeursBase };
    for (const [k, v] of Object.entries(res.bonusHistorique ?? {})) total[k as Caracteristique] += v ?? 0;
    const ameliorations: Partial<Valeurs>[] = [];
    for (let i = 0; i < ex.ameliorations; i++) {
      const [a, b, d] = priorite.filter((k) => total[k] < 20);
      if (a && total[a] <= 18) {
        ameliorations.push({ [a]: 2 });
        total[a] += 2;
      } else if (a && b) {
        ameliorations.push({ [a]: 1, [b]: 1 });
        total[a] += 1;
        total[b] += 1;
      } else if (b && d) ameliorations.push({ [b]: 1, [d]: 1 });
    }
    res.ameliorations = ameliorations;
  }
  return res;
}

/** Écran Choix de classe : compétences, expertises, style, options de classe, bottes, sorts, équipement. */
export function recommanderCompetences(c: ChoixPartiel & { niveau: number }, donnees: Donnees): Recommandation {
  const ex = exigences(c, donnees);
  if (!ex || !c.classe || !c.historique) return {};
  const historique = donnees.historiques.get(c.historique)!;
  const priorite = [...(COMPETENCES_PAR_CLASSE[c.classe] ?? []), ...COMPETENCES_GENERALES];
  const pris = new Set<Competence>(historique.competences);

  const competencesClasse = premiers(priorite.filter((k) => ex.competencesClasse.parmi.includes(k)), ex.competencesClasse.nombre, [...pris]);
  competencesClasse.forEach((k) => pris.add(k));

  const competencesSupplementaires: Competence[] = [];
  for (const restriction of ex.competencesSupplementaires.restrictions) {
    const choisie = priorite.find((k) => !pris.has(k) && (!restriction || restriction.includes(k)));
    if (choisie) {
      competencesSupplementaires.push(choisie);
      pris.add(choisie);
    }
  }

  const expertises: Competence[] = [];
  const dispo = [...pris];
  const ordre = (k: Competence) => priorite.indexOf(k);
  const triees = dispo.sort((a, b) => ordre(a) - ordre(b));
  for (let i = 0; i < ex.expertises.nombre; i++) {
    const restreintes = ex.expertises.restreintes;
    const choisie = triees.find((k) => !expertises.includes(k) && (i < restreintes.length ? restreintes[i]!.includes(k) : true));
    if (choisie) expertises.push(choisie);
  }

  const res: Recommandation = { competencesClasse, competencesSupplementaires, expertises };

  // Style de combat : don en plus de ceux déjà choisis (l'humain garde son don d'origine).
  const dons = (c.dons ?? []).filter((id) => donnees.dons.get(id)?.categorie !== 'style-de-combat');
  if (ex.donsStyle) dons.push(STYLE_PAR_CLASSE[c.classe] ?? 'defense');
  // Faveur épique (niveau 19) : celle qui est choisie, sinon la recommandée du SRD pour la classe, et la caractéristique qu'elle relève.
  if (ex.faveursEpiques) {
    let faveur = dons.find((id) => donnees.dons.get(id)?.categorie === 'faveur-epique');
    if (!faveur) {
      faveur = FAVEUR_RECOMMANDEE[c.classe] ?? 'faveur-du-destin';
      if (faveur === 'faveur-de-memoire-magique' && !donnees.classes.get(c.classe)?.incantation) faveur = 'faveur-du-destin';
      dons.push(faveur);
    }
    const permises = caracteristiquesDeFaveur(faveur);
    const gardee = c.faveurCaracteristique?.[0];
    res.faveurCaracteristique = [gardee && permises.includes(gardee) ? gardee : (prioriteCaracteristiques(c.classe).find((k) => permises.includes(k)) ?? permises[0]!)];
  }
  res.dons = dons;

  // Options de classe (ordre divin, manifestations occultes, métamagie).
  const choix: Record<string, string[]> = { ...(c.choix ?? {}) };
  for (const { choix: def, nombre } of ex.choixClasse) {
    const voulu = OPTION_PAR_CHOIX[def.id];
    const utilisables = def.options.filter((o) => {
      const m = /Prérequis : niveau d'[A-Za-zéèêï]+ (\d+)\+/.exec(o.resume);
      const aPrerequis = /Prérequis/.test(o.resume);
      return !aPrerequis || (m && Number(m[1]) <= c.niveau && !/Prérequis : niveau d'[A-Za-zéèêï]+ \d+\+ et /.test(o.resume));
    });
    const ordre2 = voulu ? [...utilisables].sort((a, b) => Number(b.id === voulu) - Number(a.id === voulu)) : utilisables;
    choix[def.id] = ordre2.slice(0, nombre).map((o) => o.id);
  }
  res.choix = choix;

  // Équipement : première option de la classe et de l'historique.
  res.equipementClasse = ex.equipementClasse[0]?.id;
  res.equipementHistorique = ex.equipementHistorique[0]?.id;

  // Bottes d'arme : d'abord les armes de l'équipement choisi.
  if (ex.bottes) {
    const eq = equipementChoisi(c.classe, c.historique, res.equipementClasse, res.equipementHistorique, donnees);
    const portees = (eq?.armes ?? []).filter((id) => ex.bottes!.parmi.includes(id));
    const reste = ex.bottes.parmi.filter((id) => !portees.includes(id));
    res.bottes = [...portees, ...reste].slice(0, ex.bottes.nombre);
  }

  // Sorts : jouables en combat d'abord, puis préférences de la classe.
  if (ex.sorts) {
    // Pas de doublon avec les sorts de l'Initié à la magie ni avec les sorts accordés par l'espèce.
    const accordes = effetsAcquis({ classe: c.classe, espece: c.espece!, historique: c.historique, niveau: c.niveau, dons: c.dons, choix: res.choix }, donnees).flatMap((e) => (e.type === 'sorts_accordes' ? e.sorts : []));
    const exclus = new Set([...(c.sortsInitie?.mineurs ?? []), ...(c.sortsInitie?.niveau1 ?? []), ...accordes]);
    const eligibles = sortsEligibles(c.classe, ex.sorts.niveauMax, donnees).filter((s) => !exclus.has(s.id));
    res.sortsMineurs = ordreSorts(c.classe, eligibles.filter((s) => s.niveau === 0).map((s) => s.id)).slice(0, ex.sorts.mineurs);
    res.sortsPrepares = ordreSorts(c.classe, eligibles.filter((s) => s.niveau > 0).map((s) => s.id)).slice(0, ex.sorts.prepares);
  }
  return res;
}

export interface OptionsCreationRapide {
  classe: string;
  espece: string;
  niveau?: number;
  historique?: string;
  nom?: string;
}

/** Personnage complet et valide à partir de la seule classe et de l'espèce (tous les choix recommandés). */
export function creationRapide(o: OptionsCreationRapide, donnees: Donnees): ChoixPersonnage {
  const niveau = o.niveau ?? 1;
  const historique = o.historique ?? historiqueRecommande(o.classe, donnees);
  let c: ChoixPersonnage = {
    nom: o.nom ?? '',
    classe: o.classe,
    niveau,
    espece: o.espece,
    historique,
    methode: 'standard',
    valeursBase: valeursRecommandees(o.classe),
    bonusHistorique: {},
    competencesClasse: [],
  };
  const etapes = [recommanderEspece, recommanderHistorique, recommanderCaracteristiques, recommanderCompetences];
  for (const etape of etapes) c = { ...c, ...etape(c, donnees) };
  return c;
}
