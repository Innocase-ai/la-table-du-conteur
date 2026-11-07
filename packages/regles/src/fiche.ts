// Calcul d'une fiche de personnage (niveaux 1 à 5) à partir des choix du joueur
// et des données SRD. Valide les choix et signale chaque erreur en français.
import {
  BUDGET_ACHAT,
  bonusMaitrise,
  coutAchat,
  modificateur,
  VALEUR_MAX,
  VALEURS_STANDARD,
  type Valeurs,
} from './caracteristiques';
import { bottesPossibles, choixRequis, niveauSortMax, nombreDeChoix, regleInitie, sortsEligibles } from './creation/regles-creation';
import { equipementChoisi, type EquipementResolu } from './creation/equipement';
import type { Donnees } from './donnees';
import {
  CARACTERISTIQUES,
  COMPETENCES,
  type Armure,
  type Caracteristique,
  type CategorieArmure,
  type Classe,
  type Competence,
  type Effet,
} from './schemas';

export const NIVEAU_MAX = 20;

/** « +4,50 m » → 4,5 ; une colonne vide ou « — » → rien. */
export function metresDeColonne(valeur: string | number | undefined): number | undefined {
  if (typeof valeur === 'number') return valeur;
  const m = /([\d]+(?:[.,]\d+)?)\s*m/.exec(valeur ?? '');
  return m ? Number(m[1]!.replace(',', '.')) : undefined;
}

export interface ChoixPersonnage {
  nom: string;
  classe: string;
  niveau: number;
  espece: string;
  historique: string;
  taille?: 'P' | 'M';
  methode: 'standard' | 'achat' | 'tirage';
  valeursBase: Valeurs;
  /** +2/+1 ou +1/+1/+1 réparti sur les trois caractéristiques de l'historique. */
  bonusHistorique: Partial<Valeurs>;
  /** Une entrée par Amélioration de caractéristique obtenue : +2 à une, ou +1 à deux. */
  ameliorations?: Partial<Valeurs>[];
  /** Dons choisis en plus de celui de l'historique (Style de combat, etc.). */
  dons?: string[];
  competencesClasse: Competence[];
  /** Compétences accordées par l'espèce ou un don (Sens aiguisés, Doué…). */
  competencesSupplementaires?: Competence[];
  expertises?: Competence[];
  armure?: string;
  bouclier?: boolean;
  /** Options choisies pour les choix de création (lignage, ordre divin, métamagie…), par id de choix. */
  choix?: Record<string, string[]>;
  sortsMineurs?: string[];
  sortsPrepares?: string[];
  /** Sorts du don Initié à la magie, quand l'historique l'accorde. */
  sortsInitie?: { mineurs: string[]; niveau1: string[] };
  /** Armes dont le personnage maîtrise la botte (aptitude Bottes d'arme). */
  bottes?: string[];
  /** Options d'équipement de départ (A, B…) ; l'armure et le bouclier en découlent si `armure` n'est pas imposée. */
  equipementClasse?: string;
  equipementHistorique?: string;
}

export type NiveauMaitrise = 'aucune' | 'demi' | 'maitrise' | 'expertise';

export interface AptitudeAcquise {
  source: string;
  id: string;
  nom: string;
  niveau: number;
  resume: string;
}

export interface Fiche {
  nom: string;
  classe: string;
  sousClasse?: string;
  niveau: number;
  espece: string;
  historique: string;
  taille: 'P' | 'M';
  caracteristiques: Record<Caracteristique, { valeur: number; modificateur: number }>;
  bonusMaitrise: number;
  pvMax: number;
  deVie: number;
  ca: number;
  /** De quoi recalculer `ca` quand l'équipement change ; absent des fiches enregistrées avant l'équipement. */
  defense?: DefenseFiche;
  initiative: number;
  vitesse: number;
  perceptionPassive: number;
  visionDansLeNoir: number;
  resistances: string[];
  sauvegardes: Record<Caracteristique, { bonus: number; maitrise: boolean }>;
  competences: Record<Competence, { bonus: number; maitrise: NiveauMaitrise }>;
  formationArmures: CategorieArmure[];
  maitrisesArmes: string[];
  incantation?: {
    caracteristique: Caracteristique;
    ddSauvegarde: number;
    bonusAttaque: number;
    sortsMineurs: number;
    sortsPrepares: number;
    emplacements: number[];
    niveauEmplacementPacte?: number;
  };
  colonnes: Record<string, number | string>;
  dons: string[];
  aptitudes: AptitudeAcquise[];
  choix: Record<string, string[]>;
  sortsMineurs: string[];
  sortsPrepares: string[];
  /** Sorts toujours connus, accordés par l'espèce ou une option. */
  sortsAccordes: string[];
  sortsInitie?: { mineurs: string[]; niveau1: string[] };
  bottes: string[];
  equipement?: EquipementResolu;
  avertissements: string[];
}

export type ResultatFiche = { ok: true; fiche: Fiche } | { ok: false; erreurs: string[] };

interface EffetSource {
  source: string;
  effet: Effet;
}

function verifierValeursBase(choix: ChoixPersonnage, erreurs: string[]): void {
  const valeurs = CARACTERISTIQUES.map((c) => choix.valeursBase[c]);
  if (valeurs.some((v) => !Number.isInteger(v))) {
    erreurs.push('Les six valeurs de caractéristique doivent être des entiers.');
    return;
  }
  if (choix.methode === 'standard') {
    const triees = [...valeurs].sort((a, b) => b - a);
    if (triees.join() !== VALEURS_STANDARD.join()) {
      erreurs.push(`Valeurs standard : il faut répartir exactement ${VALEURS_STANDARD.join(', ')}.`);
    }
  } else if (choix.methode === 'achat') {
    const cout = coutAchat(choix.valeursBase);
    if (cout === undefined) erreurs.push('Acquisition par points : chaque valeur doit être comprise entre 8 et 15.');
    else if (cout > BUDGET_ACHAT) erreurs.push(`Acquisition par points : ${cout} points dépensés pour ${BUDGET_ACHAT} disponibles.`);
  } else if (valeurs.some((v) => v < 3 || v > 18)) {
    erreurs.push('Génération aléatoire : chaque valeur doit être comprise entre 3 et 18.');
  }
}

function verifierBonusHistorique(choix: ChoixPersonnage, autorisees: readonly Caracteristique[], erreurs: string[]): void {
  const entrees = Object.entries(choix.bonusHistorique).filter(([, v]) => v !== 0) as [Caracteristique, number][];
  if (entrees.some(([c]) => !autorisees.includes(c))) {
    erreurs.push(`Le bonus d'historique ne peut porter que sur : ${autorisees.join(', ')}.`);
  }
  const motif = entrees
    .map(([, v]) => v)
    .sort((a, b) => b - a)
    .join();
  if (motif !== '2,1' && motif !== '1,1,1') {
    erreurs.push("Le bonus d'historique doit être +2 et +1, ou +1 aux trois caractéristiques.");
  }
}

function verifierAmelioration(amelioration: Partial<Valeurs>, erreurs: string[]): void {
  const motif = Object.values(amelioration)
    .filter((v) => v !== 0)
    .sort((a, b) => b - a)
    .join();
  if (motif !== '2' && motif !== '1,1') {
    erreurs.push('Une Amélioration de caractéristique donne +2 à une caractéristique, ou +1 à deux.');
  }
}

/**
 * Ce qui, dans une fiche, fait la Classe d'Armure en dehors de l'équipement : les modificateurs et les effets de classe,
 * d'espèce et de dons. Avec elle, on recalcule la CA de n'importe quelle armure ou bouclier sans refaire la fiche (équiper,
 * retirer) : voir `caAvec`.
 */
export interface DefenseFiche {
  mods: Record<Caracteristique, number>;
  /** Bonus de CA « toujours » et « en armure » (styles de combat, aptitudes). */
  bonusToujours: number;
  bonusEnArmure: number;
  /** Formules sans armure (Défense sans armure du barbare et du moine…). */
  sansArmure: { base: number; caracteristiques: Caracteristique[]; bouclierAutorise: boolean }[];
}

/** La CA d'un personnage avec cette armure et ce bouclier (`bonus` : objets magiques portés). */
export function caAvec(d: DefenseFiche, armure: Armure | undefined, bouclier: boolean, bonus = 0): number {
  const bonusBouclier = bouclier ? 2 : 0;
  const dex = d.mods.dex;
  if (armure) {
    const partDex = armure.dex === 'complet' ? dex : armure.dex === 'max2' ? Math.min(dex, 2) : 0;
    return armure.ca + partDex + bonusBouclier + d.bonusToujours + d.bonusEnArmure + bonus;
  }
  // Sans armure : la meilleure formule disponible (10 + Dex par défaut, ou Défense sans armure…).
  let base = 10 + dex;
  for (const f of d.sansArmure) {
    if (bouclier && !f.bouclierAutorise) continue;
    base = Math.max(base, f.base + f.caracteristiques.reduce((s, c) => s + d.mods[c], 0));
  }
  return base + bonusBouclier + d.bonusToujours + bonus;
}

function defenseDepuis(mods: Record<Caracteristique, number>, effets: Effet[]): DefenseFiche {
  let bonusToujours = 0;
  let bonusEnArmure = 0;
  const sansArmure: DefenseFiche['sansArmure'] = [];
  for (const e of effets) {
    if (e.type === 'bonus_ca') {
      if (e.condition === 'toujours') bonusToujours += e.valeur;
      else bonusEnArmure += e.valeur;
    } else if (e.type === 'ca_sans_armure') sansArmure.push({ base: e.base, caracteristiques: e.caracteristiques, bouclierAutorise: e.bouclierAutorise ?? false });
  }
  return { mods, bonusToujours, bonusEnArmure, sansArmure };
}

export function calculerFiche(choix: ChoixPersonnage, donnees: Donnees): ResultatFiche {
  const erreurs: string[] = [];
  const avertissements: string[] = [];

  const classe: Classe | undefined = donnees.classes.get(choix.classe);
  const espece = donnees.especes.get(choix.espece);
  const historique = donnees.historiques.get(choix.historique);
  if (!classe) erreurs.push(`Classe inconnue : « ${choix.classe} ».`);
  if (!espece) erreurs.push(`Espèce inconnue : « ${choix.espece} ».`);
  if (!historique) erreurs.push(`Historique inconnu : « ${choix.historique} ».`);
  if (!Number.isInteger(choix.niveau) || choix.niveau < 1 || choix.niveau > NIVEAU_MAX) {
    erreurs.push(`Le niveau doit être compris entre 1 et ${NIVEAU_MAX}.`);
  }
  if (!classe || !espece || !historique || erreurs.length) return { ok: false, erreurs };

  const niveau = choix.niveau;
  const pb = bonusMaitrise(niveau);

  // --- Aptitudes, traits et dons acquis, avec leurs effets ---
  const aptitudes: AptitudeAcquise[] = [];
  const effets: EffetSource[] = [];
  const ajouter = (source: string, a: { id: string; nom: string; niveau: number; resume: string; effets: Effet[] }) => {
    aptitudes.push({ source, id: a.id, nom: a.nom, niveau: a.niveau, resume: a.resume });
    for (const effet of a.effets) effets.push({ source: `${source} — ${a.nom}`, effet });
  };
  for (const t of espece.traits) if (t.niveau <= niveau) ajouter(espece.nom, t);
  for (const a of classe.aptitudes) if (a.niveau <= niveau) ajouter(classe.nom, a);
  if (niveau >= 3) for (const a of classe.sousClasse.aptitudes) if (a.niveau <= niveau) ajouter(classe.sousClasse.nom, a);

  // Les dons choisis : le moteur les vérifie lui-même (pas seulement l'écran de création). Un don d'origine en plus si
  // l'espèce l'accorde (Polyvalent), un style de combat si la classe en donne un, pas de doublon sauf don répétable, ni don
  // général (pas encore à la place d'une amélioration), ni faveur épique. Un don en trop est ignoré, avec un avertissement :
  // un groupe déjà créé reste jouable.
  const donsRetenus: string[] = [];
  {
    const permis: Record<string, number> = {
      origines: espece.traits.some((t) => t.id === 'polyvalent' && t.niveau <= niveau) ? 1 : 0,
      'style-de-combat': Math.min(1, classe.aptitudes.filter((a) => a.id === 'style-de-combat' && a.niveau <= niveau).length),
      general: 0,
      'faveur-epique': 0,
    };
    const pris: Record<string, number> = {};
    for (const id of choix.dons ?? []) {
      const d = donnees.dons.get(id);
      if (!d) {
        donsRetenus.push(id); // l'erreur « don inconnu » est donnée plus bas
        continue;
      }
      if (!d.repetable && (id === historique.don || donsRetenus.includes(id))) {
        avertissements.push(`Don « ${d.nom} » en double : ignoré (il ne se prend qu'une fois).`);
        continue;
      }
      if ((pris[d.categorie] ?? 0) >= (permis[d.categorie] ?? Infinity)) {
        avertissements.push(`Don « ${d.nom} » : pas de place pour un don de cette catégorie à ce niveau, ignoré.`);
        continue;
      }
      pris[d.categorie] = (pris[d.categorie] ?? 0) + 1;
      donsRetenus.push(id);
    }
  }
  const idsDons = [historique.don, ...donsRetenus];
  for (const id of idsDons) {
    const don = donnees.dons.get(id);
    if (!don) {
      erreurs.push(`Don inconnu : « ${id} ».`);
      continue;
    }
    ajouter('Don', { ...don, niveau: 1 });
  }
  // --- Options choisies (lignages, ordres, métamagie…) ---
  for (const [idChoix, ids] of Object.entries(choix.choix ?? {})) {
    const def = donnees.choix.get(idChoix);
    const applicable = def && (def.source.type === 'classe' ? def.source.id === classe.id : def.source.id === espece.id);
    if (!def || !applicable) {
      erreurs.push(`Choix « ${idChoix} » non applicable à ${classe.nom} ${espece.nom}.`);
      continue;
    }
    if (ids.length > nombreDeChoix(def, niveau)) erreurs.push(`${def.nom} : ${nombreDeChoix(def, niveau)} option(s) au plus, ${ids.length} choisie(s).`);
    if (new Set(ids).size !== ids.length) erreurs.push(`${def.nom} : la même option est choisie deux fois.`);
    for (const id of ids) {
      const option = def.options.find((o) => o.id === id);
      if (!option) erreurs.push(`${def.nom} : option inconnue « ${id} ».`);
      else ajouter(def.nom, { id: option.id, nom: option.nom, niveau: 1, resume: option.resume, effets: option.effets });
    }
  }
  const tous = effets.map((e) => e.effet);
  const de = <T extends Effet['type']>(type: T) => tous.filter((e): e is Extract<Effet, { type: T }> => e.type === type);

  // --- Caractéristiques ---
  verifierValeursBase(choix, erreurs);
  verifierBonusHistorique(choix, historique.caracteristiques, erreurs);
  const ameliorations = choix.ameliorations ?? [];
  const nbAmeliorations = de('amelioration_caracteristique').length;
  if (ameliorations.length !== nbAmeliorations) {
    erreurs.push(`${nbAmeliorations} Amélioration(s) de caractéristique à répartir, ${ameliorations.length} fournie(s).`);
  }
  ameliorations.forEach((a) => verifierAmelioration(a, erreurs));

  const valeurs = {} as Valeurs;
  for (const c of CARACTERISTIQUES) {
    valeurs[c] =
      choix.valeursBase[c] + (choix.bonusHistorique[c] ?? 0) + ameliorations.reduce((s, a) => s + (a[c] ?? 0), 0);
    if (valeurs[c] > VALEUR_MAX) erreurs.push(`${c} dépasse ${VALEUR_MAX} (${valeurs[c]}).`);
  }
  const mods = Object.fromEntries(CARACTERISTIQUES.map((c) => [c, modificateur(valeurs[c])])) as Record<
    Caracteristique,
    number
  >;

  // --- Taille ---
  const taille = choix.taille ?? (espece.tailles.length === 1 ? espece.tailles[0]! : undefined);
  if (!taille || !espece.tailles.includes(taille)) {
    erreurs.push(`Taille à choisir parmi : ${espece.tailles.join(', ')}.`);
  }

  // --- Compétences ---
  const maitrises = new Set<Competence>(historique.competences);
  const parmi = classe.competences.parmi;
  if (choix.competencesClasse.length !== classe.competences.nombre) {
    erreurs.push(`${classe.nom} : choisir ${classe.competences.nombre} compétences de classe.`);
  }
  for (const c of choix.competencesClasse) {
    if (parmi !== 'toutes' && !parmi.includes(c)) erreurs.push(`${classe.nom} : « ${c} » n'est pas une compétence de classe.`);
    if (maitrises.has(c)) erreurs.push(`Compétence « ${c} » choisie deux fois.`);
    maitrises.add(c);
  }
  const effetsCompetences = de('maitrise_competences');
  const attendues = effetsCompetences.reduce((s, e) => s + e.nombre, 0);
  const supplementaires = choix.competencesSupplementaires ?? [];
  if (supplementaires.length !== attendues) {
    erreurs.push(`${attendues} compétence(s) supplémentaire(s) à choisir (espèce, dons), ${supplementaires.length} fournie(s).`);
  }
  const restreintes = effetsCompetences.filter((e) => e.parmi);
  for (const c of supplementaires) {
    if (maitrises.has(c)) erreurs.push(`Compétence « ${c} » choisie deux fois.`);
    maitrises.add(c);
  }
  // Chaque choix restreint (ex. Sens aiguisés) doit trouver une compétence de sa liste.
  for (const e of restreintes) {
    if (!supplementaires.some((c) => e.parmi!.includes(c))) {
      erreurs.push(`Une compétence supplémentaire doit être choisie parmi : ${e.parmi!.join(', ')}.`);
    }
  }
  const effetsExpertise = de('expertise');
  const expertisesAttendues = effetsExpertise.reduce((s, e) => s + e.nombre, 0);
  const expertises = choix.expertises ?? [];
  if (expertises.length !== expertisesAttendues) {
    erreurs.push(`${expertisesAttendues} expertise(s) à choisir, ${expertises.length} fournie(s).`);
  }
  // Une expertise restreinte à une liste (Érudition) ne peut porter que sur cette liste.
  const libres = effetsExpertise.filter((e) => !e.parmi).reduce((s, e) => s + e.nombre, 0);
  const restreintesExp = effetsExpertise.filter((e) => e.parmi);
  const horsListes = expertises.filter((c) => !restreintesExp.some((e) => e.parmi!.includes(c)));
  if (restreintesExp.length && horsListes.length > libres) {
    erreurs.push(`Expertise limitée à : ${[...new Set(restreintesExp.flatMap((e) => e.parmi!))].join(', ')}.`);
  }
  if (new Set(expertises).size !== expertises.length) erreurs.push('Expertise choisie deux fois pour la même compétence.');
  for (const c of expertises) if (!maitrises.has(c)) erreurs.push(`Expertise en « ${c} » sans en avoir la maîtrise.`);
  const demiMaitrise = de('demi_maitrise_tests_non_maitrises').length > 0;

  const competences = {} as Fiche['competences'];
  for (const [c, carac] of Object.entries(COMPETENCES) as [Competence, Caracteristique][]) {
    const niveauMaitrise: NiveauMaitrise = expertises.includes(c)
      ? 'expertise'
      : maitrises.has(c)
        ? 'maitrise'
        : demiMaitrise
          ? 'demi'
          : 'aucune';
    const part = { aucune: 0, demi: Math.floor(pb / 2), maitrise: pb, expertise: 2 * pb }[niveauMaitrise];
    competences[c] = { bonus: mods[carac] + part, maitrise: niveauMaitrise };
  }

  // --- Armure, CA, vitesse ---
  const formationArmures = [
    ...new Set([...classe.formationArmures, ...de('formation_armures').flatMap((e) => e.categories)]),
  ];
  const maitrisesArmes = [...new Set([...classe.maitrisesArmes, ...de('maitrise_armes').flatMap((e) => e.armes)])];
  const equipement = equipementChoisi(classe.id, historique.id, choix.equipementClasse, choix.equipementHistorique, donnees);
  if (choix.equipementClasse && !equipement) erreurs.push(`Option d'équipement inconnue : « ${choix.equipementClasse} ».`);
  const armureId = choix.armure ?? equipement?.armure;
  let armure: Armure | undefined;
  if (armureId) {
    armure = donnees.armures.get(armureId);
    if (!armure || armure.categorie === 'bouclier') erreurs.push(`Armure inconnue : « ${choix.armure} ».`);
    else if (!formationArmures.includes(armure.categorie)) {
      avertissements.push(`${armure.nom} : pas de formation à cette armure (désavantage et pas d'incantation).`);
    }
  }
  const bouclier = choix.bouclier ?? equipement?.bouclier ?? false;
  if (bouclier && !formationArmures.includes('bouclier')) {
    avertissements.push("Bouclier : pas de formation, il n'apporte pas de bonus de CA.");
  }
  const defense = defenseDepuis(mods, tous);
  const ca = caAvec(defense, armure, bouclier && formationArmures.includes('bouclier'));

  let vitesse = espece.vitesse;
  const armureLourde = armure?.categorie === 'lourde';
  for (const e of de('bonus_vitesse')) {
    // Un bonus qui grandit avec le niveau (Déplacement sans armure du Moine) se lit dans la colonne de la progression.
    const lu = e.colonne ? metresDeColonne(classe.progression[niveau - 1]?.colonnes[e.colonne]) : undefined;
    const metres = lu ?? e.metres;
    if (e.condition === 'toujours') vitesse += metres;
    else if (e.condition === 'sans_armure_lourde' && !armureLourde) vitesse += metres;
    else if (e.condition === 'sans_armure_ni_bouclier' && !armure && !bouclier) vitesse += metres;
  }
  if (armure?.forceMin && valeurs.for < armure.forceMin) {
    vitesse -= 3;
    avertissements.push(`${armure.nom} : Force inférieure à ${armure.forceMin}, Vitesse réduite de 3 m.`);
  }

  // --- Points de vie ---
  const pvFixesParNiveau = classe.deVie / 2 + 1;
  let pvMax = classe.deVie + mods.con;
  for (let n = 2; n <= niveau; n++) pvMax += Math.max(1, pvFixesParNiveau + mods.con);
  pvMax += de('pv_par_niveau').reduce((s, e) => s + e.valeur, 0) * niveau;

  // --- Incantation ---
  let incantation: Fiche['incantation'];
  if (classe.incantation) {
    const inc = classe.incantation;
    const i = niveau - 1;
    incantation = {
      caracteristique: inc.caracteristique,
      ddSauvegarde: 8 + mods[inc.caracteristique] + pb,
      bonusAttaque: mods[inc.caracteristique] + pb,
      sortsMineurs: inc.sortsMineurs[i]!,
      sortsPrepares: inc.sortsPrepares[i]!,
      emplacements: inc.emplacements[i]!,
      niveauEmplacementPacte: inc.niveauEmplacementPacte?.[i],
    };
  }

  // --- Sorts, bottes d'arme ---
  const sortsAccordes = [...new Set(de('sorts_accordes').flatMap((e) => e.sorts))];
  const mineursPermis = (incantation?.sortsMineurs ?? 0) + de('sorts_mineurs_supplementaires').reduce((s, e) => s + e.nombre, 0);
  if (incantation) incantation.sortsMineurs = mineursPermis;
  const sortsMineurs = choix.sortsMineurs ?? [];
  const sortsPrepares = choix.sortsPrepares ?? [];
  if ((sortsMineurs.length || sortsPrepares.length) && !incantation) erreurs.push(`${classe.nom} n'a pas de sorts à choisir.`);
  if (incantation) {
    const maxNiveau = niveauSortMax(classe, niveau);
    const eligibles = new Map(sortsEligibles(classe.id, maxNiveau, donnees).map((s) => [s.id, s]));
    if (sortsMineurs.length > mineursPermis) erreurs.push(`${sortsMineurs.length} sorts mineurs choisis pour ${mineursPermis} permis.`);
    if (sortsPrepares.length > incantation.sortsPrepares) erreurs.push(`${sortsPrepares.length} sorts préparés choisis pour ${incantation.sortsPrepares} permis.`);
    if (new Set([...sortsMineurs, ...sortsPrepares]).size !== sortsMineurs.length + sortsPrepares.length) erreurs.push('Un sort est choisi deux fois.');
    for (const id of sortsMineurs) {
      const s = eligibles.get(id);
      if (!s || s.niveau !== 0) erreurs.push(`« ${id} » n'est pas un sort mineur de la liste ${classe.nom}.`);
    }
    for (const id of sortsPrepares) {
      const s = eligibles.get(id);
      if (!s || s.niveau === 0) erreurs.push(`« ${id} » n'est pas un sort de niveau 1 à ${maxNiveau} de la liste ${classe.nom}.`);
    }
  }
  const regleInit = regleInitie(historique.id, idsDons);
  if (choix.sortsInitie) {
    if (!regleInit) erreurs.push("Aucun don Initié à la magie : pas de sorts d'initié.");
    else {
      const liste = sortsEligibles(regleInit.liste, 1, donnees);
      const { mineurs, niveau1 } = choix.sortsInitie;
      if (mineurs.length > regleInit.mineurs || niveau1.length > regleInit.niveau1) erreurs.push('Trop de sorts choisis pour le don Initié à la magie.');
      for (const id of mineurs) if (!liste.some((s) => s.id === id && s.niveau === 0)) erreurs.push(`« ${id} » n'est pas un sort mineur de la liste ${regleInit.liste}.`);
      for (const id of niveau1) if (!liste.some((s) => s.id === id && s.niveau === 1)) erreurs.push(`« ${id} » n'est pas un sort de niveau 1 de la liste ${regleInit.liste}.`);
    }
  }
  const bottes = choix.bottes ?? [];
  const reglesBottes = bottesPossibles(classe, niveau, donnees);
  if (bottes.length && !reglesBottes) erreurs.push(`${classe.nom} n'a pas de bottes d'arme.`);
  if (reglesBottes) {
    if (bottes.length > reglesBottes.nombre) erreurs.push(`${bottes.length} bottes d'arme choisies pour ${reglesBottes.nombre} permises.`);
    if (new Set(bottes).size !== bottes.length) erreurs.push("Une botte d'arme est choisie deux fois.");
    for (const id of bottes) if (!reglesBottes.parmi.includes(id)) erreurs.push(`« ${id} » ne convient pas aux bottes d'arme de ${classe.nom}.`);
  }

  if (erreurs.length) return { ok: false, erreurs };

  const sauvegardes = {} as Fiche['sauvegardes'];
  for (const c of CARACTERISTIQUES) {
    const maitrise = classe.sauvegardes.includes(c);
    sauvegardes[c] = { bonus: mods[c] + (maitrise ? pb : 0), maitrise };
  }
  const caracteristiques = {} as Fiche['caracteristiques'];
  for (const c of CARACTERISTIQUES) caracteristiques[c] = { valeur: valeurs[c], modificateur: mods[c] };

  return {
    ok: true,
    fiche: {
      nom: choix.nom,
      classe: classe.id,
      sousClasse: niveau >= 3 ? classe.sousClasse.id : undefined,
      niveau,
      espece: espece.id,
      historique: historique.id,
      taille: taille!,
      caracteristiques,
      bonusMaitrise: pb,
      pvMax,
      deVie: classe.deVie,
      ca,
      defense,
      initiative: mods.dex + (de('maitrise_initiative').length ? pb : 0),
      vitesse,
      perceptionPassive: 10 + competences.perception.bonus,
      visionDansLeNoir: Math.max(0, ...de('vision_dans_le_noir').map((e) => e.metres)),
      resistances: [...new Set(de('resistance').map((e) => e.degats))],
      sauvegardes,
      competences,
      formationArmures,
      maitrisesArmes,
      incantation,
      colonnes: classe.progression[niveau - 1]!.colonnes,
      dons: idsDons,
      aptitudes,
      choix: choix.choix ?? {},
      sortsMineurs,
      sortsPrepares,
      sortsAccordes,
      sortsInitie: choix.sortsInitie,
      bottes,
      equipement,
      avertissements,
    },
  };
}
