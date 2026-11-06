// État de brouillon du créateur : un `ChoixPersonnage` partiel + l'identité (nom, sexe, alignement, portrait),
// et les fonctions qui le font évoluer en gardant les choix cohérents entre eux.
import {
  bilanPersonnage,
  calculerFiche,
  creationRapide,
  effetsAcquis,
  manquants,
  nombreDeChoix,
  personnageComplet,
  recommanderCaracteristiques,
  recommanderCompetences,
  valeursRecommandees,
  VALEUR_MAX,
  CARACTERISTIQUES,
  type Alignement,
  type BilanPersonnage,
  type Caracteristique,
  type ChoixPartiel,
  type ChoixPersonnage,
  type Donnees,
  type Etape,
  type Fiche,
  type Manquant,
  type PersonnageCree,
  type Valeurs,
} from '@crpg/regles';
import { idPortrait, nomAuHasard, portraitEquivalent, type Sexe } from './portraits';

export type Choix = ChoixPartiel & { niveau: number };

export interface Identite {
  nom: string;
  sexe: Sexe;
  alignement?: Alignement;
  portrait?: string;
  caractere: string;
}

export interface Brouillon {
  /** Identifiant du personnage s'il existe déjà dans le groupe. */
  id?: string;
  choix: Choix;
  identite: Identite;
  /** Tirage 4d6 : les valeurs lancées sont gardées tant que le joueur ne les a pas validées. */
  tirageValide?: boolean;
}

export function brouillonVide(niveau: number): Brouillon {
  return { choix: { niveau }, identite: { nom: '', sexe: 'F', caractere: '' } };
}

export function brouillonDepuis(p: PersonnageCree): Brouillon {
  return {
    id: p.id,
    choix: { ...p.choix },
    tirageValide: p.choix.methode === 'tirage',
    identite: { nom: p.choix.nom, sexe: p.sexe, alignement: p.alignement, portrait: p.portrait, caractere: p.caractere ?? '' },
  };
}

/** Le brouillon, une fois complet, devient un personnage du groupe. */
export function versPersonnage(b: Brouillon, id: string, donnees: Donnees): PersonnageCree | undefined {
  const { choix, identite } = b;
  if (!identite.alignement || !identite.portrait) return undefined;
  const complet = choixComplet({ ...choix, nom: identite.nom.trim() });
  if (!complet) return undefined;
  const p: PersonnageCree = {
    id,
    sexe: identite.sexe,
    alignement: identite.alignement,
    portrait: identite.portrait,
    caractere: identite.caractere.trim() || undefined,
    choix: complet,
  };
  return personnageComplet(bilanPersonnage(p, donnees)) ? p : undefined;
}

const VALEURS_PAR_DEFAUT: Valeurs = { for: 15, dex: 14, con: 13, int: 12, sag: 10, cha: 8 };

/** Choix complété par des valeurs neutres : permet de lancer `calculerFiche` (qui signalera ce qui manque). */
export function choixComplet(c: Choix): ChoixPersonnage | undefined {
  if (!c.classe || !c.espece || !c.historique) return undefined;
  return {
    ...c,
    nom: c.nom ?? '',
    classe: c.classe,
    espece: c.espece,
    historique: c.historique,
    niveau: c.niveau,
    methode: c.methode ?? 'standard',
    valeursBase: c.valeursBase ?? VALEURS_PAR_DEFAUT,
    bonusHistorique: c.bonusHistorique ?? {},
    competencesClasse: c.competencesClasse ?? [],
  };
}

/** Fiche calculée strictement d'après le brouillon (undefined tant que le personnage est invalide). */
export function ficheStricte(c: Choix, donnees: Donnees): { fiche?: Fiche; erreurs: string[] } {
  const complet = choixComplet(c);
  if (!complet) return { erreurs: [] };
  const r = calculerFiche(complet, donnees);
  return r.ok ? { fiche: r.fiche, erreurs: [] } : { erreurs: r.erreurs };
}

const CLES_SURES: (keyof ChoixPersonnage)[] = ['methode', 'valeursBase', 'bonusHistorique', 'ameliorations', 'taille', 'equipementClasse', 'equipementHistorique', 'armure', 'bouclier'];

/**
 * Fiche d'aperçu : les choix déjà faits sont gardés, les autres sont remplacés par les valeurs recommandées.
 * Sert aux petites métriques (PV, CA…) pendant la création ; elle n'est jamais enregistrée.
 */
export function ficheApercu(c: Choix, donnees: Donnees, surcharge: Partial<ChoixPersonnage> = {}): Fiche | undefined {
  if (!c.classe || !c.espece || !c.historique) return undefined;
  let base: ChoixPersonnage;
  try {
    base = creationRapide({ classe: c.classe, espece: c.espece, historique: c.historique, niveau: c.niveau }, donnees);
  } catch {
    return undefined;
  }
  const defini = <T extends object>(o: T): Partial<T> => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
  const essais: ChoixPersonnage[] = [
    { ...base, ...defini(c as Partial<ChoixPersonnage>), ...surcharge },
    { ...base, ...defini(Object.fromEntries(CLES_SURES.map((k) => [k, (c as Record<string, unknown>)[k]])) as Partial<ChoixPersonnage>), ...surcharge },
    { ...base, ...surcharge },
    base,
  ];
  for (const e of essais) {
    const r = calculerFiche({ ...e, nom: c.nom ?? e.nom }, donnees);
    if (r.ok) return r.fiche;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Bilan et manquants par écran
// ---------------------------------------------------------------------------

export interface BilanBrouillon {
  fiche?: Fiche;
  erreurs: string[];
  manquants: Manquant[];
  complet: boolean;
}

/** Choix propres à l'espèce, qu'on ne peut vérifier qu'une fois la classe et l'historique connus par `manquants`. */
function manquantsEspece(c: Choix, donnees: Donnees): Manquant[] {
  const res: Manquant[] = [];
  const espece = c.espece ? donnees.especes.get(c.espece) : undefined;
  if (!espece) return res;
  if (espece.tailles.length > 1 && !c.taille) res.push({ etape: 'espece', message: `Choisis une taille (${espece.nom}).` });
  for (const choix of donnees.choix.values()) {
    if (choix.source.type !== 'espece' || choix.source.id !== espece.id) continue;
    const nombre = nombreDeChoix(choix, c.niveau);
    const fait = c.choix?.[choix.id]?.length ?? 0;
    if (fait < nombre) res.push({ etape: 'espece', message: `${choix.nom} : ${nombre - fait} choix restant(s).` });
  }
  if (espece.traits.some((t) => t.id === 'polyvalent')) {
    const origine = (c.dons ?? []).some((id) => donnees.dons.get(id)?.categorie === 'origines');
    if (!origine) res.push({ etape: 'espece', message: "Choisis un don d'origine (Polyvalent)." });
  }
  return res;
}

export function tousLesManquants(b: Brouillon, donnees: Donnees, avecIdentite: boolean): Manquant[] {
  const base = manquants(
    b.choix,
    donnees,
    avecIdentite ? { nom: b.identite.nom, portrait: b.identite.portrait, alignement: b.identite.alignement } : undefined,
  );
  const vus = new Set(base.map((m) => `${m.etape}|${m.message}`));
  const extra = manquantsEspece(b.choix, donnees).filter((m) => !vus.has(`${m.etape}|${m.message}`));
  if (b.choix.methode === 'tirage' && b.choix.valeursBase && !b.tirageValide) extra.push({ etape: 'caracteristiques', message: 'Valide ton tirage de dés (ou relance-le).' });
  return [...base, ...extra];
}

export function bilanBrouillon(b: Brouillon, donnees: Donnees): BilanBrouillon {
  const choix = { ...b.choix, nom: b.identite.nom.trim() };
  const m = tousLesManquants({ ...b, choix }, donnees, true);
  const { fiche, erreurs } = ficheStricte(choix, donnees);
  return { fiche, erreurs, manquants: m, complet: !!fiche && m.length === 0 && erreurs.length === 0 };
}

export function manquantsEtape(b: Brouillon, donnees: Donnees, etape: Etape): Manquant[] {
  return tousLesManquants(b, donnees, true).filter((m) => m.etape === etape);
}

// ---------------------------------------------------------------------------
// Évolution du brouillon : chaque changement d'identité retire les choix qui en dépendaient
// ---------------------------------------------------------------------------

function donsOrigine(c: Choix, donnees: Donnees): string[] {
  return (c.dons ?? []).filter((id) => donnees.dons.get(id)?.categorie === 'origines');
}

function choixEspece(c: Choix, donnees: Donnees): Record<string, string[]> | undefined {
  const garde = Object.entries(c.choix ?? {}).filter(([id]) => donnees.choix.get(id)?.source.type === 'espece');
  return garde.length ? Object.fromEntries(garde) : undefined;
}

/** Retire tout ce que l'écran « Choix de classe » avait rempli. */
function sansChoixDeClasse(c: Choix, donnees: Donnees): Choix {
  return {
    ...c,
    competencesClasse: undefined,
    competencesSupplementaires: undefined,
    expertises: undefined,
    dons: donsOrigine(c, donnees).length ? donsOrigine(c, donnees) : undefined,
    choix: choixEspece(c, donnees),
    bottes: undefined,
    sortsMineurs: undefined,
    sortsPrepares: undefined,
    equipementClasse: undefined,
    equipementHistorique: undefined,
    armure: undefined,
    bouclier: undefined,
  };
}

export function changerEspece(b: Brouillon, espece: string, donnees: Donnees): Brouillon {
  if (b.choix.espece === espece) return b;
  const base = sansChoixDeClasse(b.choix, donnees);
  const identite = b.identite.portrait ? { ...b.identite, portrait: portraitEquivalent(b.identite.portrait, espece, b.identite.sexe) } : b.identite;
  return { ...b, identite, choix: { ...base, espece, taille: undefined, choix: undefined, dons: undefined } };
}

export function changerClasse(b: Brouillon, classe: string, donnees: Donnees): Brouillon {
  if (b.choix.classe === classe) return b;
  return { ...b, choix: { ...sansChoixDeClasse(b.choix, donnees), classe, sortsInitie: b.choix.sortsInitie } };
}

export function changerHistorique(b: Brouillon, historique: string, donnees: Donnees): Brouillon {
  if (b.choix.historique === historique) return b;
  return {
    ...b,
    choix: { ...sansChoixDeClasse(b.choix, donnees), historique, bonusHistorique: undefined, sortsInitie: undefined },
  };
}

export function totaux(c: Choix): Valeurs | undefined {
  if (!c.valeursBase) return undefined;
  const res = {} as Valeurs;
  for (const k of CARACTERISTIQUES) {
    res[k] = c.valeursBase[k] + (c.bonusHistorique?.[k] ?? 0) + (c.ameliorations ?? []).reduce((s, a) => s + (a[k] ?? 0), 0);
  }
  return res;
}

/** Changement de niveau de départ : les améliorations et les choix de classe sont refaits selon les recommandations. */
export function changerNiveau(b: Brouillon, niveau: number, donnees: Donnees): Brouillon {
  if (b.choix.niveau === niveau) return b;
  const avaitChoixClasse = (b.choix.competencesClasse?.length ?? 0) > 0 || !!b.choix.equipementClasse;
  let choix: Choix = { ...sansChoixDeClasse(b.choix, donnees), niveau, ameliorations: undefined };
  if (b.choix.valeursBase && choix.classe && choix.historique) {
    const reco = recommanderCaracteristiques(choix, donnees).ameliorations;
    if (reco) {
      const essai = { ...choix, ameliorations: reco };
      const t = totaux(essai);
      if (t && CARACTERISTIQUES.every((k) => t[k] <= VALEUR_MAX)) choix = essai;
    }
  }
  if (avaitChoixClasse && choix.classe && choix.espece && choix.historique) choix = { ...choix, ...recommanderCompetences(choix, donnees) };
  return { ...b, choix };
}

// ---------------------------------------------------------------------------
// Création rapide
// ---------------------------------------------------------------------------

export function creationRapideBrouillon(b: Brouillon, donnees: Donnees): Brouillon | undefined {
  const { classe, espece, niveau } = b.choix;
  if (!classe || !espece) return undefined;
  const nom = b.identite.nom.trim() || nomAuHasard(espece, b.identite.sexe);
  const choix = creationRapide({ classe, espece, niveau, nom }, donnees);
  return {
    id: b.id,
    choix,
    identite: {
      nom,
      sexe: b.identite.sexe,
      alignement: b.identite.alignement ?? 'NB',
      portrait: idPortrait(espece, b.identite.sexe, 1),
      caractere: b.identite.caractere,
    },
  };
}

export function valeursInitiales(b: Brouillon, methode: 'standard' | 'achat' | 'tirage'): Valeurs | undefined {
  if (methode === 'standard') return b.choix.classe ? valeursRecommandees(b.choix.classe) : { ...VALEURS_PAR_DEFAUT };
  if (methode === 'achat') return { for: 8, dex: 8, con: 8, int: 8, sag: 8, cha: 8 };
  return undefined;
}

export type { Caracteristique, Etape };
