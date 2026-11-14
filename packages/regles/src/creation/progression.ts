// Montée de niveau : les choix du joueur sont gardés tels quels ; seuls les choix nouveaux du niveau atteint (amélioration
// de caractéristique, sorts en plus, options de classe, bottes, expertises, style de combat) sont complétés par les
// recommandations, comme le bouton « Recommandé » de la création.
import type { Donnees } from '../donnees';
import { calculerFiche, NIVEAU_MAX, type ChoixPersonnage, type Fiche } from '../fiche';
import type { ChoixCreation } from '../schemas';
import { exigences, type Exigences } from './exigences';
import { niveauSortMax } from './regles-creation';
import { prioriteCaracteristiques, prioriteCompetences, recommanderCaracteristiques, recommanderCompetences } from './recommandations';
import type { Caracteristique, Competence } from '../schemas';

/** Ajoute à `garde` les éléments de `propose` qui n'y sont pas encore, jusqu'à `n` éléments au total. */
function completer<T>(garde: T[] | undefined, propose: T[] | undefined, n: number): T[] {
  const res = [...(garde ?? [])];
  for (const x of propose ?? []) {
    if (res.length >= n) break;
    if (!res.includes(x)) res.push(x);
  }
  return res;
}

/**
 * Les nouveaux choix de compétences et d'améliorations, complétés à partir de ce que le personnage a VRAIMENT (ses maîtrises et
 * ses valeurs actuelles), pas des recommandations de départ : un joueur qui a pris d'autres compétences que les conseillées ne
 * reçoit pas une compétence en double ni une expertise dans une compétence qu'il ne maîtrise pas, et une amélioration ne
 * dépasse jamais 20 (audit du 11/11/2026).
 */
function nouveauxChoixPersonnels(choix: ChoixPersonnage, base: ChoixPersonnage, donnees: Donnees): Pick<ChoixPersonnage, 'competencesSupplementaires' | 'expertises' | 'ameliorations'> | undefined {
  const actuelle = calculerFiche(choix, donnees);
  const ex = exigences(base, donnees);
  if (!actuelle.ok || !ex) return undefined;
  const fiche = actuelle.fiche;
  const priorite = prioriteCompetences(choix.classe);
  const toutes = Object.keys(fiche.competences) as Competence[];
  const ordre = [...priorite.filter((k) => toutes.includes(k)), ...toutes.filter((k) => !priorite.includes(k))];

  // Compétences supplémentaires : les places nouvelles, avec une compétence pas encore maîtrisée.
  const maitrisees = new Set(toutes.filter((k) => fiche.competences[k].maitrise === 'maitrise' || fiche.competences[k].maitrise === 'expertise'));
  const supp = [...(choix.competencesSupplementaires ?? [])];
  for (const restriction of ex.competencesSupplementaires.restrictions.slice(supp.length)) {
    const k = ordre.find((x) => !maitrisees.has(x) && !supp.includes(x) && (!restriction || restriction.includes(x)));
    if (k) {
      supp.push(k);
      maitrisees.add(k);
    }
  }

  // Expertises : les places nouvelles, parmi les compétences maîtrisées sans expertise.
  const expertises = [...(choix.expertises ?? [])];
  for (let i = expertises.length; i < ex.expertises.nombre; i++) {
    const restreinte = i < ex.expertises.restreintes.length ? ex.expertises.restreintes[i] : undefined;
    const k = ordre.find((x) => maitrisees.has(x) && !expertises.includes(x) && (!restreinte || restreinte.includes(x)));
    if (k) expertises.push(k);
  }

  // Améliorations : depuis les valeurs actuelles, +2 à la première caractéristique utile qui reste à 20, sinon +1 / +1.
  const ameliorations = [...(choix.ameliorations ?? [])];
  const total = Object.fromEntries(Object.entries(fiche.caracteristiques).map(([k, v]) => [k, v.valeur])) as Record<Caracteristique, number>;
  const prioC = prioriteCaracteristiques(choix.classe);
  while (ameliorations.length < ex.ameliorations) {
    const [a, b] = prioC.filter((k) => total[k] < 20);
    if (a && total[a] <= 18) {
      ameliorations.push({ [a]: 2 });
      total[a] += 2;
    } else if (a && b) {
      ameliorations.push({ [a]: 1, [b]: 1 });
      total[a] += 1;
      total[b] += 1;
    } else break;
  }
  return { competencesSupplementaires: supp, expertises, ameliorations };
}

/**
 * Les choix d'un personnage passé au niveau `niveau` (au plus NIVEAU_MAX), avec sa nouvelle fiche ; `undefined` si les
 * choix complétés ne donnent pas une fiche valide (le personnage reste alors à son niveau).
 */
export function monterAuNiveau(choix: ChoixPersonnage, niveau: number, donnees: Donnees): { choix: ChoixPersonnage; fiche: Fiche } | undefined {
  if (niveau <= choix.niveau || niveau > NIVEAU_MAX) return undefined;
  const base: ChoixPersonnage = { ...choix, niveau };
  const carac = recommanderCaracteristiques(base, donnees);
  const comp = recommanderCompetences(base, donnees);
  const personnels = nouveauxChoixPersonnels(choix, base, donnees);
  // Le grimoire du Magicien : les sorts déjà inscrits restent, deux nouveaux s'ajoutent ; les préparés viennent toujours du grimoire.
  // Une ancienne partie sans grimoire part de ses sorts préparés.
  const livre = comp.sortsGrimoire ? completer(choix.sortsGrimoire ?? choix.sortsPrepares, comp.sortsGrimoire, comp.sortsGrimoire.length) : undefined;
  const preparesPossibles = livre ? [...(comp.sortsPrepares ?? []), ...livre].filter((id) => livre.includes(id)) : comp.sortsPrepares;
  const prochain: ChoixPersonnage = {
    ...base,
    // Améliorations : celles déjà faites, puis les recommandées pour les nouveaux paliers (niveau 4).
    ameliorations: personnels?.ameliorations ?? [...(choix.ameliorations ?? []), ...(carac.ameliorations ?? []).slice((choix.ameliorations ?? []).length)],
    expertises: personnels?.expertises ?? completer(choix.expertises, comp.expertises, comp.expertises?.length ?? 0),
    competencesSupplementaires: personnels?.competencesSupplementaires ?? completer(choix.competencesSupplementaires, comp.competencesSupplementaires, comp.competencesSupplementaires?.length ?? 0),
    dons: completer(choix.dons, comp.dons, comp.dons?.length ?? 0),
    faveurCaracteristique: completer(choix.faveurCaracteristique, comp.faveurCaracteristique, comp.faveurCaracteristique?.length ?? 0),
    bottes: completer(choix.bottes, comp.bottes, comp.bottes?.length ?? 0),
    sortsMineurs: completer(choix.sortsMineurs, comp.sortsMineurs, comp.sortsMineurs?.length ?? 0),
    ...(livre ? { sortsGrimoire: livre } : {}),
    sortsPrepares: completer(choix.sortsPrepares, preparesPossibles, comp.sortsPrepares?.length ?? 0),
    choix: Object.fromEntries(
      Object.entries({ ...(comp.choix ?? {}), ...(choix.choix ?? {}) }).map(([id, ids]) => [id, completer(choix.choix?.[id], comp.choix?.[id], comp.choix?.[id]?.length ?? ids.length)]),
    ),
  };
  const r = calculerFiche(prochain, donnees);
  return r.ok ? { choix: prochain, fiche: r.fiche } : undefined;
}

// ---------------------------------------------------------------------------
// Les choix du niveau atteint : ce que le joueur peut revoir après une montée de niveau
// ---------------------------------------------------------------------------

/** Ce qui est nouveau au niveau atteint par rapport au niveau d'avant, et ce qui est donc figé. */
export interface ChoixDeMontee {
  niveau: number;
  /** Nouvelles améliorations de caractéristique (au total : `ameliorations`, dont `figes` existaient déjà). */
  ameliorations: { total: number; figes: number };
  sortsMineurs: { total: number; figes: number };
  sortsPrepares: { total: number; figes: number };
  /** Sorts à inscrire au grimoire (Magicien) ; absent pour les autres classes. */
  sortsGrimoire?: { total: number; figes: number };
  /** Niveau de sort maximal à ce niveau (pour proposer les sorts permis). */
  niveauSortMax: number;
  /** Options de classe (manifestations occultes, Métamagie…) en plus : `total` options, dont `figes` déjà prises. */
  options: { choix: ChoixCreation; total: number; figes: number }[];
  expertises: { total: number; figes: number };
  /** Vrai quand rien n'est nouveau : il n'y a rien à revoir. */
  aucun: boolean;
}

function exigencesDe(choix: ChoixPersonnage, niveau: number, donnees: Donnees): Exigences | undefined {
  return exigences({ ...choix, niveau }, donnees);
}

/**
 * Les choix nouveaux du niveau du personnage, d'après ses choix actuels (déjà remplis par `monterAuNiveau`). Seuls ces choix
 * peuvent être revus ; tout ce qui existait au niveau d'avant reste tel quel.
 */
export function choixDeMontee(choix: ChoixPersonnage, donnees: Donnees): ChoixDeMontee | undefined {
  if (choix.niveau < 2) return undefined;
  const avant = exigencesDe(choix, choix.niveau - 1, donnees);
  const apres = exigencesDe(choix, choix.niveau, donnees);
  if (!avant || !apres) return undefined;
  const classe = donnees.classes.get(choix.classe);
  const plus = (a: number, b: number) => ({ total: b, figes: Math.min(a, b) });
  const options = apres.choixClasse
    .map(({ choix: def, nombre }) => {
      const ancien = avant.choixClasse.find((x) => x.choix.id === def.id)?.nombre ?? 0;
      return { choix: def, total: nombre, figes: Math.min(ancien, nombre) };
    })
    .filter((o) => o.total > o.figes);
  const res: ChoixDeMontee = {
    niveau: choix.niveau,
    ameliorations: plus(avant.ameliorations, apres.ameliorations),
    sortsMineurs: plus(avant.sorts?.mineurs ?? 0, apres.sorts?.mineurs ?? 0),
    sortsPrepares: plus(avant.sorts?.prepares ?? 0, apres.sorts?.prepares ?? 0),
    ...(apres.sorts?.grimoire !== undefined ? { sortsGrimoire: plus(avant.sorts?.grimoire ?? 0, apres.sorts.grimoire) } : {}),
    niveauSortMax: classe ? niveauSortMax(classe, choix.niveau) : 0,
    options,
    expertises: plus(avant.expertises.nombre, apres.expertises.nombre),
    aucun: false,
  };
  res.aucun = res.ameliorations.total === res.ameliorations.figes && res.sortsMineurs.total === res.sortsMineurs.figes && res.sortsPrepares.total === res.sortsPrepares.figes && (res.sortsGrimoire?.total ?? 0) === (res.sortsGrimoire?.figes ?? 0) && !options.length && res.expertises.total === res.expertises.figes;
  return res;
}

const egal = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a).filter((k) => (a as Record<string, unknown>)[k] !== undefined);
  const kb = Object.keys(b).filter((k) => (b as Record<string, unknown>)[k] !== undefined);
  return ka.length === kb.length && ka.every((k) => egal((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
};

/** Les champs que le joueur peut changer à la montée de niveau : les listes dont les derniers éléments sont nouveaux. */
const REVISABLES = ['ameliorations', 'sortsMineurs', 'sortsPrepares', 'sortsGrimoire', 'expertises', 'choix'] as const;

/**
 * Valide les choix revus après une montée de niveau : tout est identique à `actuel` sauf les derniers éléments des listes
 * nouvelles (amélioration, sorts, options de classe, expertises), et la fiche doit se calculer.
 */
export function reviserChoixDeMontee(actuel: ChoixPersonnage, propose: ChoixPersonnage, donnees: Donnees): { ok: true; choix: ChoixPersonnage; fiche: Fiche } | { ok: false; erreur: string } {
  const nouveaux = choixDeMontee(actuel, donnees);
  if (!nouveaux || nouveaux.aucun) return { ok: false, erreur: 'Aucun nouveau choix à ce niveau.' };
  const sans = (c: ChoixPersonnage) => Object.fromEntries(Object.entries(c).filter(([k]) => !(REVISABLES as readonly string[]).includes(k)));
  if (!egal(sans(actuel), sans(propose))) return { ok: false, erreur: 'Seuls les nouveaux choix du niveau peuvent changer (amélioration, sorts, options de classe, expertises).' };
  const figes: Record<string, number> = {
    ameliorations: nouveaux.ameliorations.figes,
    sortsMineurs: nouveaux.sortsMineurs.figes,
    sortsPrepares: nouveaux.sortsPrepares.figes,
    sortsGrimoire: nouveaux.sortsGrimoire?.figes ?? 0,
    expertises: nouveaux.expertises.figes,
  };
  for (const [champ, n] of Object.entries(figes)) {
    const a = ((actuel as unknown as Record<string, unknown[] | undefined>)[champ] ?? []).slice(0, n);
    const p = ((propose as unknown as Record<string, unknown[] | undefined>)[champ] ?? []).slice(0, n);
    if (!egal(a, p)) return { ok: false, erreur: 'Un choix des niveaux précédents ne peut pas être changé.' };
  }
  const ids = new Set([...Object.keys(actuel.choix ?? {}), ...Object.keys(propose.choix ?? {})]);
  for (const id of ids) {
    const nouveau = nouveaux.options.find((o) => o.choix.id === id);
    const n = nouveau ? nouveau.figes : (actuel.choix?.[id] ?? []).length;
    if (!egal((actuel.choix?.[id] ?? []).slice(0, n), (propose.choix?.[id] ?? []).slice(0, n))) return { ok: false, erreur: 'Un choix des niveaux précédents ne peut pas être changé.' };
    if (!nouveau && !egal(actuel.choix?.[id] ?? [], propose.choix?.[id] ?? [])) return { ok: false, erreur: 'Cette option ne change pas à ce niveau.' };
  }
  const r = calculerFiche(propose, donnees);
  if (!r.ok) return { ok: false, erreur: r.erreurs[0] ?? 'Ces choix ne donnent pas un personnage valide.' };
  return { ok: true, choix: propose, fiche: r.fiche };
}
