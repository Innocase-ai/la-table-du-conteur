// Cœur du combat : tours, déplacement, attaques, dégâts, sauvegardes, états, mort.
// Règles du SRD 5.2.1 (« Combat », « Dégâts et soins », « Glossaire de règles »).
import type { Caracteristique, Etat } from '../schemas';
import {
  aEtat,
  actif,
  allies,
  combattant,
  de,
  ennemis,
  horsCombat,
  journaliser,
  lancerDes,
  peutAgir,
  type AttaqueArme,
  type Combattant,
  type DetailsEvenement,
  type EtatActif,
  type EtatCombat,
  type Modificateur,
  type ZonePersistante,
  TAILLES,
} from './etat';
import {
  cheminsAtteignables,
  cle,
  couvert,
  distanceCases,
  distanceMetres,
  franchissable,
  ligneDeVue,
  TAILLE_CASE,
  type Chemin,
  type Grille,
  type Position,
} from './grille';

export const DEGATS_PHYSIQUES = ['contondant', 'perforant', 'tranchant'];

// ---------------------------------------------------------------------------
// Valeurs dérivées
// ---------------------------------------------------------------------------

export function ca(c: Combattant): number {
  return c.caBase + c.modificateurs.filter((m) => m.type === 'bonus_ca').reduce((s, m) => s + (m.valeur ?? 0), 0);
}

export function vitesse(c: Combattant): number {
  if (c.etats.some((e) => ['empoigne', 'entrave', 'paralyse', 'inconscient'].includes(e.etat))) return 0;
  const v = c.vitesse + c.modificateurs.filter((m) => m.type === 'vitesse').reduce((s, m) => s + (m.valeur ?? 0), 0);
  return Math.max(0, v);
}

export function aTrait(c: Combattant, trait: string): boolean {
  return c.traits.includes(trait);
}

/** État apparent pour l'adversaire : l'IA ne voit pas les PV exacts. */
export function etatApparent(c: Combattant): 'intact' | 'blesse' | 'en-sang' | 'hors-combat' {
  if (horsCombat(c) || c.pv <= 0) return 'hors-combat';
  if (c.pv >= c.pvMax) return 'intact';
  return c.pv > c.pvMax / 2 ? 'blesse' : 'en-sang';
}

// ---------------------------------------------------------------------------
// Création et déroulement
// ---------------------------------------------------------------------------

function tourVierge(c: Combattant): Combattant['tour'] {
  return {
    mouvement: vitesse(c),
    action: true,
    bonus: true,
    attaquesRestantes: 0,
    desengage: false,
    esquive: false,
    aBouge: false,
    sortEmplacementLance: false,
    sortBonusLance: false,
    sournoiseUtilisee: false,
    proieUtilisee: false,
    enchainementUtilise: false,
    frenesieUtilisee: false,
    temeraire: false,
    elanJoue: false,
    attaqueEntreprise: false,
    etourdissanteUtilisee: false,
  };
}

export function creerCombat(
  grille: Grille,
  combattants: Combattant[],
  graine: number,
  options: EtatCombat['options'] = { elan: true },
): EtatCombat {
  const etat: EtatCombat = {
    grille,
    combattants: structuredClone(combattants),
    ordre: [],
    actif: 0,
    round: 1,
    rng: graine >>> 0,
    journal: [],
    options,
  };
  for (const c of etat.combattants) {
    c.initiative = de(etat, 20) + c.bonusInitiative;
    if (c.elan) melanger(etat, c.elan.pioche);
  }
  etat.ordre = [...etat.combattants]
    .sort(
      (a, b) =>
        b.initiative - a.initiative || b.mods.dex - a.mods.dex || (a.camp === 'heros' ? -1 : 1) - (b.camp === 'heros' ? -1 : 1),
    )
    .map((c) => c.id);
  journaliser(etat, {
    type: 'info',
    texte: `Initiative : ${etat.ordre.map((id) => `${combattant(etat, id).nom} (${combattant(etat, id).initiative})`).join(', ')}.`,
  });
  // Métabolisme surnaturel (Moine) : à l'Initiative, il récupère son Credo dépensé et des PV, une fois par repos long.
  for (const c of etat.combattants) {
    const r = c.ressources;
    if (!aTrait(c, 'metabolisme-surnaturel') || !r.metabolisme || c.pv <= 0) continue;
    if ((r.credo ?? 0) >= (r.credoMax ?? 0) && c.pv >= c.pvMax) continue;
    r.metabolisme -= 1;
    r.credo = r.credoMax ?? r.credo ?? 0;
    const soins = c.niveau + lancerDes(etat, `1d${r.deArtsMartiaux ?? 6}`);
    journaliser(etat, { type: 'info', texte: `${c.nom} puise dans son Métabolisme surnaturel : Credo rendu, ${soins} PV.`, acteur: c.id });
    soigner(etat, c, soins, c);
  }
  debutTour(etat);
  return etat;
}

function expirer(etat: EtatCombat, moment: 'debut_tour' | 'fin_tour', de: string): void {
  for (const c of etat.combattants) {
    c.modificateurs = c.modificateurs.filter((m) => {
      if (!(m.expire?.moment === moment && m.expire.de === de)) return true;
      if (m.expire.apres) {
        m.expire.apres -= 1;
        return true;
      }
      return false;
    });
  }
}

function debutTour(etat: EtatCombat): void {
  const c = actif(etat);
  expirer(etat, 'debut_tour', c.id);
  for (const x of etat.combattants) x.etats = x.etats.filter((e) => e.jusquAuDebutDe !== c.id);
  c.tour = tourVierge(c);
  c.ressources.reaction = 1;
  journaliser(etat, { type: 'tour', texte: `Tour de ${c.nom}.`, acteur: c.id });
  // Recharge des actions de monstre (« 5-6 » : récupérée sur 5 ou 6 au d6).
  for (const a of c.actionsMonstre) {
    if (!a.recharge || (c.ressources[`recharge:${a.id}`] ?? 1) > 0) continue;
    if (de(etat, 6) >= Number(a.recharge.split('-')[0])) c.ressources[`recharge:${a.id}`] = 1;
  }

  for (const e of [...c.etats]) {
    if (e.etat !== 'empoigne' || !e.source) continue;
    const source = etat.combattants.find((x) => x.id === e.source);
    if (!source || !peutAgir(source) || distanceMetres(source.position, c.position) > 3) c.etats = c.etats.filter((x) => x !== e);
  }
  if (c.camp === 'heros' && c.pv <= 0 && !c.mort && !c.stable) {
    jetContreLaMort(etat, c);
    return;
  }
  // Se relever coûte la moitié de la Vitesse.
  if (aEtat(c, 'a-terre') && peutAgir(c) && vitesse(c) > 0) {
    retirerEtat(c, 'a-terre');
    c.tour.mouvement -= Math.ceil(vitesse(c) / 2 / TAILLE_CASE) * TAILLE_CASE;
    journaliser(etat, { type: 'etat', texte: `${c.nom} se relève.`, acteur: c.id });
  }
  if (etat.options.elan && c.elan) piocherElan(etat, c, 2);
}

/** Mélange de Fisher-Yates avec le générateur du combat. */
function melanger(etat: EtatCombat, cartes: string[]): void {
  for (let j = cartes.length - 1; j > 0; j--) {
    const k = de(etat, j + 1) - 1;
    [cartes[j], cartes[k]] = [cartes[k]!, cartes[j]!];
  }
}

function piocherElan(etat: EtatCombat, c: Combattant, n: number): void {
  const elan = c.elan!;
  for (let i = 0; i < n; i++) {
    if (!elan.pioche.length) {
      elan.pioche = elan.defausse;
      elan.defausse = [];
      melanger(etat, elan.pioche);
    }
    const carte = elan.pioche.shift();
    if (carte) elan.main.push(carte);
  }
}

/** Cette case est-elle dans la zone ? */
export function dansZone(z: ZonePersistante, p: Position): boolean {
  return distanceCases(p, z.centre) <= z.rayon;
}

/**
 * Une créature déclenche une zone persistante : sauvegarde, puis dégâts (la moitié si elle réussit et que le sort le permet).
 * Au plus une fois par tour de table pour une même zone.
 */
export function declencherZone(etat: EtatCombat, z: ZonePersistante, c: Combattant): void {
  const d = z.degats;
  if (!d || c.mort || c.enFuite || z.declenches[c.id] === etat.round) return;
  z.declenches[c.id] = etat.round;
  const lanceur = etat.combattants.find((x) => x.id === z.lanceur);
  const reussite = sauvegarde(etat, c, d.caracteristique, d.dd);
  journaliser(etat, { type: 'sort', texte: `${c.nom} : sauvegarde ${reussite ? 'réussie' : 'ratée'}.`, acteur: z.lanceur, cible: c.id, details: { sort: z.sort, sauvegarde: reussite ? 'reussie' : 'ratee', distance: false } });
  const facteur = reussite ? (d.moitie ? 0.5 : 0) : 1;
  if (facteur > 0) infligerDegats(etat, c, [{ montant: Math.floor(lancerDes(etat, d.des) * facteur), type: d.type }], lanceur);
}

export function finTour(etat: EtatCombat): void {
  const c = actif(etat);
  // Sauvegardes de fin de tour contre les états.
  for (const e of [...c.etats]) {
    if (e.sauvegarde && !horsCombat(c)) {
      if (sauvegarde(etat, c, e.sauvegarde.caracteristique, e.sauvegarde.dd)) {
        c.etats = c.etats.filter((x) => x !== e);
        journaliser(etat, { type: 'etat', texte: `${c.nom} se libère (${e.etat}).`, acteur: c.id });
      } else if (e.sort === 'sommeil' && e.etat === 'neutralise') {
        // Sommeil : second échec, la cible s'endort.
        c.etats = c.etats.filter((x) => x !== e);
        ajouterEtat(etat, c, { etat: 'inconscient', source: e.source, sort: 'sommeil', finSurDegats: true });
      }
    }
  }
  // Zones qui durent : qui finit son tour dedans en subit l'effet.
  for (const z of etat.zones ?? []) {
    if (z.declencheurs.includes('fin_tour') && !c.mort && dansZone(z, c.position)) declencherZone(etat, z, c);
  }
  for (const x of etat.combattants) {
    x.etats = x.etats.filter((e) => {
      if (e.finTourDe !== c.id) return true;
      if (e.passerFin) {
        e.passerFin = false;
        return true;
      }
      return false;
    });
  }
  // Dégâts différés (Flèche acide) : au moment où le porteur finit son tour.
  for (const m of c.modificateurs.filter((x) => x.type === 'degats_differes')) {
    c.modificateurs = c.modificateurs.filter((x) => x !== m);
    if (c.mort || !m.de) continue;
    const source = etat.combattants.find((x) => x.id === m.source) ?? c;
    journaliser(etat, { type: 'sort', texte: `${c.nom} est de nouveau rongé (${m.typeDegats}).`, cible: c.id, details: { sort: m.sort } });
    infligerDegats(etat, c, [{ montant: lancerDes(etat, m.de), type: m.typeDegats ?? 'acide' }], source);
  }
  expirer(etat, 'fin_tour', c.id);
  if (c.elan) {
    c.elan.defausse.push(...c.elan.main);
    c.elan.main = [];
  }
  if (verifierFin(etat)) return;
  // Combattant suivant (on saute les morts et les fuyards).
  for (let i = 0; i < etat.ordre.length; i++) {
    etat.actif = (etat.actif + 1) % etat.ordre.length;
    if (etat.actif === 0) {
      etat.round += 1;
      journaliser(etat, { type: 'info', texte: `Round ${etat.round}.` });
    }
    const suivant = actif(etat);
    if (!suivant.mort && !suivant.enFuite) break;
  }
  debutTour(etat);
  const nouveau = actif(etat);
  // Un combattant qui ne peut pas agir passe son tour.
  if (!peutAgir(nouveau) && !etat.vainqueur) finTour(etat);
}

export function verifierFin(etat: EtatCombat): boolean {
  if (etat.vainqueur) return true;
  for (const camp of ['heros', 'monstres'] as const) {
    const actifs = etat.combattants.filter((c) => c.camp === camp && !horsCombat(c) && !aEtat(c, 'inconscient'));
    if (!actifs.length) {
      etat.vainqueur = camp === 'heros' ? 'monstres' : 'heros';
      journaliser(etat, { type: 'fin', texte: etat.vainqueur === 'heros' ? 'Victoire des héros !' : 'Les héros sont vaincus…' });
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// États
// ---------------------------------------------------------------------------

export function ajouterEtat(etat: EtatCombat, c: Combattant, e: EtatActif): boolean {
  if (c.immunitesEtats.includes(e.etat)) {
    journaliser(etat, { type: 'etat', texte: `${c.nom} est immunisé (${e.etat}).`, cible: c.id });
    return false;
  }
  c.etats.push(e);
  journaliser(etat, { type: 'etat', texte: `${c.nom} : ${libelleEtat(e.etat)}.`, cible: c.id });
  if (e.etat === 'inconscient' || e.etat === 'paralyse' || e.etat === 'neutralise' || e.etat === 'etourdi') {
    if (c.concentration) finConcentration(etat, c);
  }
  return true;
}

export function retirerEtat(c: Combattant, e: Etat): void {
  c.etats = c.etats.filter((x) => x.etat !== e);
}

const LIBELLES_ETATS: Record<Etat, string> = {
  'a-terre': 'à terre',
  aveugle: 'aveuglé',
  charme: 'charmé',
  empoigne: 'empoigné',
  entrave: 'entravé',
  effraye: 'effrayé',
  inconscient: 'inconscient',
  neutralise: 'neutralisé',
  paralyse: 'paralysé',
  empoisonne: 'empoisonné',
  etourdi: 'étourdi',
};

export function libelleEtat(e: Etat): string {
  return LIBELLES_ETATS[e];
}

export function finConcentration(etat: EtatCombat, c: Combattant): void {
  const conc = c.concentration;
  if (!conc) return;
  c.concentration = undefined;
  if (etat.zones) etat.zones = etat.zones.filter((z) => !(z.sort === conc.sort && z.lanceur === c.id));
  for (const x of etat.combattants) {
    x.etats = x.etats.filter((e) => !(e.sort === conc.sort && e.source === c.id));
    x.modificateurs = x.modificateurs.filter((m) => !(m.sort === conc.sort && m.source === c.id));
  }
  journaliser(etat, { type: 'sort', texte: `${c.nom} perd sa concentration (${conc.sort}).`, acteur: c.id });
}

// ---------------------------------------------------------------------------
// Jets
// ---------------------------------------------------------------------------

function desModificateurs(etat: EtatCombat, c: Combattant, type: 'de_attaque' | 'de_sauvegarde'): number {
  return c.modificateurs.filter((m) => m.type === type && m.de).reduce((s, m) => s + lancerDes(etat, m.de!), 0);
}

/** Jet de sauvegarde ; `bonus` s'ajoute au total (le demi-couvert, +2 en Dextérité, voir `couvertSauvegarde`). */
/**
 * Dé d'Inspiration bardique (SRD 5.2.1) : quand le test d'un allié inspiré est raté, il peut lancer le dé et l'ajouter.
 * On ne le dépense que s'il peut vraiment rattraper l'échec (le manque ne dépasse pas la face maximale). Renvoie le dé obtenu.
 */
function inspirationRattrape(etat: EtatCombat, c: Combattant, manque: number): number {
  const m = c.modificateurs.find((x) => x.type === 'de_inspiration' && x.de);
  if (!m) return 0;
  const faces = Number(/d(\d+)$/.exec(m.de!)?.[1] ?? 0);
  if (!faces || manque > faces) return 0;
  c.modificateurs = c.modificateurs.filter((x) => x !== m);
  const jet = lancerDes(etat, m.de!);
  journaliser(etat, { type: 'info', texte: `${c.nom} utilise son dé d'Inspiration bardique : +${jet}.`, acteur: c.id });
  return jet;
}

export function sauvegarde(etat: EtatCombat, c: Combattant, carac: Caracteristique, dd: number, bonus = 0): boolean {
  // Paralysé, inconscient ou étourdi : échec automatique aux jets de Force et de Dextérité.
  if ((carac === 'for' || carac === 'dex') && c.etats.some((e) => ['paralyse', 'inconscient', 'etourdi'].includes(e.etat))) return false;
  const avantage =
    carac === 'dex' && (c.tour.esquive || (aTrait(c, 'sens-du-danger') && !aEtat(c, 'neutralise')));
  const d1 = de(etat, 20);
  const d = avantage ? Math.max(d1, de(etat, 20)) : d1;
  let total = d + c.sauvegardes[carac] + desModificateurs(etat, c, 'de_sauvegarde') + bonus;
  if (total < dd) total += inspirationRattrape(etat, c, dd - total);
  return total >= dd;
}

/** Le demi-couvert compte pour les sauvegardes de Dextérité contre un effet venu de `origine` (SRD 5.2.1). */
export function couvertSauvegarde(etat: EtatCombat, c: Combattant, carac: Caracteristique, origine: Position): number {
  return carac === 'dex' ? couvert(etat.grille, origine, c.position) : 0;
}

export interface JetAttaque {
  ca: number;
  /** Demi-couvert de la cible (+2 à sa CA), déjà compris dans `ca`. */
  couvert: number;
  touche: boolean;
  critique: boolean;
  avantage: boolean;
  desavantage: boolean;
  total: number;
  de: number;
}

/** Avantage et désavantage d'une attaque selon la situation (SRD : états, portée, Esquive, Témérité…). */
export function situationAttaque(
  etat: EtatCombat,
  attaquant: Combattant,
  cible: Combattant,
  mode: 'corps-a-corps' | 'distance',
  porteeNormale?: number,
): { avantage: boolean; desavantage: boolean } {
  let avantage = false;
  let desavantage = false;
  const dist = distanceMetres(attaquant.position, cible.position);
  if (aEtat(cible, 'a-terre')) {
    if (dist <= TAILLE_CASE) avantage = true;
    else desavantage = true;
  }
  if (cible.etats.some((e) => ['paralyse', 'inconscient', 'entrave', 'aveugle', 'etourdi'].includes(e.etat))) avantage = true;
  if (attaquant.etats.some((e) => ['a-terre', 'entrave', 'aveugle', 'effraye', 'empoisonne'].includes(e.etat))) desavantage = true;
  if (cible.tour.esquive && peutAgir(cible)) desavantage = true;
  if (mode === 'distance') {
    if (porteeNormale !== undefined && dist > porteeNormale) desavantage = true;
    if (ennemis(etat, attaquant).some((e) => peutAgir(e) && distanceMetres(e.position, attaquant.position) <= TAILLE_CASE)) {
      desavantage = true;
    }
  }
  if (attaquant.tour.temeraire && mode === 'corps-a-corps') avantage = true;
  if (cible.tour.temeraire) avantage = true;
  if (aTrait(attaquant, 'tactique-de-meute') && allies(etat, attaquant).some((a) => peutAgir(a) && distanceMetres(a.position, cible.position) <= TAILLE_CASE)) {
    avantage = true;
  }
  if (attaquant.modificateurs.some((m) => m.type === 'avantage_attaque' && (!m.contre || m.contre === cible.id))) avantage = true;
  if (attaquant.modificateurs.some((m) => m.type === 'desavantage_attaque')) desavantage = true;
  if (cible.modificateurs.some((m) => m.type === 'avantage_contre')) avantage = true;
  return { avantage, desavantage };
}

/** Consomme les modificateurs à usage unique liés à une attaque. */
function consommerModificateursAttaque(attaquant: Combattant, cible: Combattant): void {
  attaquant.modificateurs = attaquant.modificateurs.filter(
    (m) => !(m.usageUnique && (m.type === 'avantage_attaque' || m.type === 'desavantage_attaque' || m.type === 'bonus_attaque') && (!m.contre || m.contre === cible.id)),
  );
  cible.modificateurs = cible.modificateurs.filter((m) => !(m.usageUnique && m.type === 'avantage_contre'));
}

export function jetAttaque(
  etat: EtatCombat,
  attaquant: Combattant,
  cible: Combattant,
  bonus: number,
  mode: 'corps-a-corps' | 'distance',
  porteeNormale?: number,
): JetAttaque {
  const s = situationAttaque(etat, attaquant, cible, mode, porteeNormale);
  const avantage = s.avantage && !s.desavantage;
  const desavantage = s.desavantage && !s.avantage;
  const d1 = de(etat, 20);
  const d2 = avantage || desavantage ? de(etat, 20) : d1;
  const d = avantage ? Math.max(d1, d2) : desavantage ? Math.min(d1, d2) : d1;
  const bonusTemp = attaquant.modificateurs
    .filter((m) => m.type === 'bonus_attaque' && (!m.contre || m.contre === cible.id))
    .reduce((s2, m) => s2 + (m.valeur ?? 0), 0);
  consommerModificateursAttaque(attaquant, cible);
  let total = d + bonus + bonusTemp + desModificateurs(etat, attaquant, 'de_attaque');
  const seuilCritique = aTrait(attaquant, 'critique-ameliore') ? 19 : 20;
  // Toute attaque qui touche, à 1,5 m ou moins, une cible paralysée ou inconsciente est un critique (SRD 5.2.1).
  const critiqueAuto =
    distanceMetres(attaquant.position, cible.position) <= TAILLE_CASE &&
    cible.etats.some((e) => e.etat === 'paralyse' || e.etat === 'inconscient');
  const bonusCouvert = couvert(etat.grille, attaquant.position, cible.position);
  let caCible = ca(cible) + bonusCouvert;
  let touche = d !== 1 && (d >= seuilCritique || total >= caCible);
  // Inspiration bardique : un coup raté (hors 1 naturel) peut être rattrapé par le dé.
  if (!touche && d !== 1) {
    total += inspirationRattrape(etat, attaquant, caCible - total);
    touche = total >= caCible;
  }
  // Réaction Bouclier : +5 CA si cela transforme le coup en échec.
  if (touche && d < seuilCritique && cible.sorts.includes('bouclier') && cible.ressources.reaction && total < caCible + 5) {
    const niveau = emplacementDisponible(cible, 1);
    if (niveau && peutAgir(cible)) {
      cible.incantation!.emplacements[niveau - 1]! -= 1;
      cible.ressources.reaction = 0;
      cible.modificateurs.push({ id: 'bouclier', type: 'bonus_ca', valeur: 5, source: cible.id, expire: { moment: 'debut_tour', de: cible.id } });
      caCible += 5;
      touche = false;
      journaliser(etat, { type: 'sort', texte: `${cible.nom} lance Bouclier (+5 CA).`, acteur: cible.id, details: { sort: 'bouclier' } });
    }
  }
  const critique = touche && (d >= seuilCritique || critiqueAuto);
  return { ca: caCible, couvert: bonusCouvert, touche, critique, avantage, desavantage, total, de: d };
}

/** Détails d'un jet d'attaque pour le journal. */
export function detailsJet(jet: JetAttaque, distance: boolean, sort?: string, arme?: string): DetailsEvenement {
  return {
    ...(arme ? { arme } : {}),
    resultat: jet.touche ? (jet.critique ? 'critique' : 'touche') : 'rate',
    de: jet.de,
    total: jet.total,
    ca: jet.ca,
    ...(jet.couvert ? { couvert: jet.couvert } : {}),
    avantage: jet.avantage,
    desavantage: jet.desavantage,
    distance,
    sort,
  };
}

export function emplacementDisponible(c: Combattant, niveauMin: number): number | undefined {
  const emp = c.incantation?.emplacements;
  if (!emp) return undefined;
  for (let n = niveauMin; n <= emp.length; n++) if ((emp[n - 1] ?? 0) > 0) return n;
  return undefined;
}

// ---------------------------------------------------------------------------
// Dégâts et soins
// ---------------------------------------------------------------------------

export function multiplicateurDegats(c: Combattant, type: string): number {
  if (c.immunites.includes(type)) return 0;
  let m = 1;
  if (c.resistances.includes(type) || (c.rage && DEGATS_PHYSIQUES.includes(type))) m *= 0.5;
  if (c.vulnerabilites.includes(type)) m *= 2;
  return m;
}

export function infligerDegats(
  etat: EtatCombat,
  cible: Combattant,
  degats: { montant: number; type: string }[],
  source: Combattant | undefined,
  critique = false,
): number {
  if (cible.mort) return 0;
  let total = 0;
  const multiplicateurs = degats.map((d) => multiplicateurDegats(cible, d.type));
  // Les dégâts d'un même type s'additionnent, puis la résistance (ou la vulnérabilité) s'applique une fois, arrondie à l'inférieur.
  const parType = new Map<string, number>();
  for (const d of degats) parType.set(d.type, (parType.get(d.type) ?? 0) + Math.max(0, d.montant));
  for (const [type, montant] of parType) total += Math.floor(montant * multiplicateurDegats(cible, type));
  const reaction: 'resiste' | 'vulnerable' | 'immunise' | undefined = multiplicateurs.every((m) => m === 0)
    ? 'immunise'
    : multiplicateurs.some((m) => m > 1)
      ? 'vulnerable'
      : multiplicateurs.some((m) => m < 1)
        ? 'resiste'
        : undefined;
  const typesDegats = [...new Set(degats.map((d) => d.type))];
  if (total <= 0) {
    journaliser(etat, {
      type: 'degats',
      texte: `${cible.nom} ne subit aucun dégât.`,
      acteur: source?.id,
      cible: cible.id,
      valeur: 0,
      details: { types: typesDegats, ...(reaction ? { reaction } : {}) },
    });
    return 0;
  }
  const absorbe = Math.min(cible.pvTemp, total);
  cible.pvTemp -= absorbe;
  const restant = total - absorbe;
  const types = [...new Set(degats.map((d) => d.type))].join('/');
  journaliser(etat, {
    type: 'degats',
    texte: `${cible.nom} subit ${total} dégâts (${types})${critique ? ' — critique !' : ''}.`,
    acteur: source?.id,
    cible: cible.id,
    valeur: total,
    details: { critique, types: typesDegats, ...(reaction ? { reaction } : {}) },
  });
  // Sommeil : les dégâts réveillent.
  cible.etats = cible.etats.filter((e) => !e.finSurDegats);

  if (cible.pv <= 0 && cible.camp === 'heros') {
    // Dégâts à 0 PV : un échec au jet contre la mort (deux sur un critique), mort si dégâts ≥ PV max.
    if (restant >= cible.pvMax) mourir(etat, cible);
    else {
      cible.stable = false;
      cible.jetsMort.echecs += critique ? 2 : 1;
      if (cible.jetsMort.echecs >= 3) mourir(etat, cible);
    }
    return total;
  }
  cible.pv -= restant;
  if (cible.concentration && cible.pv > 0) {
    const dd = Math.min(30, Math.max(10, Math.floor(total / 2)));
    if (!sauvegarde(etat, cible, 'con', dd)) finConcentration(etat, cible);
  }
  if (cible.pv <= 0) {
    const excedent = -cible.pv;
    cible.pv = 0;
    if (cible.camp === 'monstres') mourir(etat, cible);
    else if (excedent >= cible.pvMax) mourir(etat, cible);
    else {
      ajouterEtat(etat, cible, { etat: 'inconscient' });
      ajouterEtat(etat, cible, { etat: 'a-terre' });
      cible.jetsMort = { succes: 0, echecs: 0 };
      cible.stable = false;
      cible.rage = false;
      journaliser(etat, { type: 'mort', texte: `${cible.nom} tombe, inconscient !`, cible: cible.id });
    }
  }
  return total;
}

function mourir(etat: EtatCombat, c: Combattant): void {
  c.mort = true;
  c.pv = 0;
  if (c.concentration) finConcentration(etat, c);
  journaliser(etat, { type: 'mort', texte: `${c.nom} meurt.`, cible: c.id });
}

export function soigner(etat: EtatCombat, cible: Combattant, montant: number, source?: Combattant): number {
  if (cible.mort) return 0;
  const avant = cible.pv;
  cible.pv = Math.min(cible.pvMax, cible.pv + montant);
  const gain = cible.pv - avant;
  if (avant <= 0 && cible.pv > 0) {
    retirerEtat(cible, 'inconscient');
    cible.jetsMort = { succes: 0, echecs: 0 };
    cible.stable = false;
    journaliser(etat, { type: 'soins', texte: `${cible.nom} reprend conscience.`, cible: cible.id });
  }
  journaliser(etat, { type: 'soins', texte: `${cible.nom} récupère ${gain} PV.`, acteur: source?.id, cible: cible.id, valeur: gain });
  return gain;
}

function jetContreLaMort(etat: EtatCombat, c: Combattant): void {
  const d = de(etat, 20);
  if (d === 20) {
    c.pv = 1;
    retirerEtat(c, 'inconscient');
    c.jetsMort = { succes: 0, echecs: 0 };
    journaliser(etat, { type: 'soins', texte: `${c.nom} obtient un 20 naturel et se relève avec 1 PV !`, cible: c.id });
    return;
  }
  if (d === 1) c.jetsMort.echecs += 2;
  else if (d >= 10) c.jetsMort.succes += 1;
  else c.jetsMort.echecs += 1;
  journaliser(etat, {
    type: 'info',
    texte: `${c.nom} : jet contre la mort ${d} (${c.jetsMort.succes} réussite(s), ${c.jetsMort.echecs} échec(s)).`,
    cible: c.id,
  });
  if (c.jetsMort.echecs >= 3) mourir(etat, c);
  else if (c.jetsMort.succes >= 3) {
    c.stable = true;
    // Stabilisé, la créature remet ses jets contre la mort à zéro (SRD 5.2.1) : un coup suivant repart d'un échec.
    c.jetsMort = { succes: 0, echecs: 0 };
    journaliser(etat, { type: 'info', texte: `${c.nom} est stabilisé.`, cible: c.id });
  }
}

// ---------------------------------------------------------------------------
// Déplacement
// ---------------------------------------------------------------------------

export function occupation(etat: EtatCombat, c: Combattant): { bloquees: Set<string>; occupees: Set<string> } {
  const bloquees = new Set<string>();
  const occupees = new Set<string>();
  for (const x of etat.combattants) {
    if (x.id === c.id || x.mort || x.enFuite) continue;
    occupees.add(cle(x.position));
    if (x.camp !== c.camp && x.pv > 0) bloquees.add(cle(x.position));
  }
  return { bloquees, occupees };
}

export function deplacementsPossibles(etat: EtatCombat, c: Combattant): Map<string, Chemin> {
  return cheminsAtteignables(etat.grille, c.position, c.tour.mouvement, occupation(etat, c));
}

/** Allonge de corps à corps la plus grande du combattant (pour les attaques d'opportunité). */
export function allonge(c: Combattant): number {
  const armes = c.attaques.filter((a) => a.mode === 'corps-a-corps').map((a) => a.allonge);
  const monstres = c.actionsMonstre.filter((a) => a.resolution?.type === 'attaque' && a.resolution.mode === 'corps-a-corps').map((a) => a.portee?.allonge ?? 1.5);
  return Math.max(0, ...armes, ...monstres);
}

/** Déplace le combattant actif le long du chemin le plus court ; les ennemis quittés font une attaque d'opportunité. */
export function deplacer(etat: EtatCombat, c: Combattant, vers: Position): boolean {
  const chemin = deplacementsPossibles(etat, c).get(cle(vers));
  if (!chemin) return false;
  const depart = { ...c.position };
  // Le chemin est journalisé par segments : une attaque d'opportunité s'intercale au bon moment.
  let segment: Position[] = [];
  const publierSegment = () => {
    if (!segment.length) return;
    journaliser(etat, { type: 'deplacement', texte: `${c.nom} se déplace.`, acteur: c.id, details: { chemin: segment } });
    segment = [];
  };
  for (const etape of chemin.etapes) {
    if (!c.tour.desengage) {
      for (const e of ennemis(etat, c)) {
        const portee = allonge(e);
        if (
          portee > 0 &&
          e.ressources.reaction &&
          peutAgir(e) &&
          distanceMetres(e.position, c.position) <= portee &&
          distanceMetres(e.position, etape) > portee
        ) {
          publierSegment();
          attaqueDOpportunite(etat, e, c);
          if (horsCombat(c) || aEtat(c, 'inconscient') || etat.vainqueur) {
            c.tour.mouvement = 0;
            return true;
          }
        }
      }
    }
    c.position = etape;
    segment.push(etape);
  }
  c.tour.mouvement -= chemin.cout;
  c.tour.aBouge = true;
  if (segment.length === chemin.etapes.length) {
    journaliser(etat, { type: 'deplacement', texte: `${c.nom} se déplace de ${chemin.cout} m.`, acteur: c.id, details: { chemin: segment } });
  } else publierSegment();
  // Zones qui durent : qui y entre en subit l'effet.
  for (const z of etat.zones ?? []) {
    if (z.declencheurs.includes('entree') && !c.mort && dansZone(z, c.position) && !dansZone(z, depart)) declencherZone(etat, z, c);
  }
  // Ralentissement : la vitesse réduite ne s'applique qu'au tour suivant ; rien à faire ici.
  return true;
}

function attaqueDOpportunite(etat: EtatCombat, attaquant: Combattant, cible: Combattant): void {
  attaquant.ressources.reaction = 0;
  journaliser(etat, { type: 'attaque', texte: `${attaquant.nom} profite d'une ouverture (attaque d'opportunité).`, acteur: attaquant.id, cible: cible.id });
  const arme = attaquant.attaques.find((a) => a.mode === 'corps-a-corps');
  if (arme) {
    attaqueArme(etat, attaquant, cible, arme, { opportunite: true });
    return;
  }
  const action = attaquant.actionsMonstre.find((a) => a.resolution?.type === 'attaque' && a.resolution.mode === 'corps-a-corps');
  if (action) attaqueMonstre(etat, attaquant, cible, action.id);
}

// ---------------------------------------------------------------------------
// Attaques d'arme (héros) et de monstre
// ---------------------------------------------------------------------------

export function portee(arme: AttaqueArme): { normale: number; longue: number } {
  if (arme.mode === 'corps-a-corps') return { normale: arme.allonge, longue: arme.allonge };
  return { normale: arme.portees![0], longue: arme.portees![1] };
}

export function aPortee(etat: EtatCombat, a: Combattant, cible: Combattant, metres: number): boolean {
  return distanceMetres(a.position, cible.position) <= metres && ligneDeVue(etat.grille, a.position, cible.position);
}

function allieAuContact(etat: EtatCombat, attaquant: Combattant, cible: Combattant): boolean {
  return allies(etat, attaquant).some((a) => peutAgir(a) && distanceMetres(a.position, cible.position) <= TAILLE_CASE);
}

export function attaqueArme(
  etat: EtatCombat,
  attaquant: Combattant,
  cible: Combattant,
  arme: AttaqueArme,
  options: { opportunite?: boolean; enchainement?: boolean } = {},
): JetAttaque {
  const p = portee(arme);
  const jet = jetAttaque(etat, attaquant, cible, arme.bonusAttaque, arme.mode, arme.mode === 'distance' ? p.normale : undefined);
  journaliser(etat, {
    type: 'attaque',
    texte: `${attaquant.nom} attaque ${cible.nom} (${arme.nom}) : ${jet.de}${jet.avantage ? ' avec avantage' : jet.desavantage ? ' avec désavantage' : ''} → ${jet.total}, ${jet.touche ? (jet.critique ? 'critique !' : 'touché') : 'raté'}${jet.couvert ? ' (cible à couvert, +2 CA)' : ''}.`,
    acteur: attaquant.id,
    cible: cible.id,
    details: detailsJet(jet, arme.mode === 'distance', undefined, arme.id),
  });
  const mult = jet.critique ? 2 : 1;
  if (jet.touche && !options.opportunite) {
    attaquant.tour.dernierCoup = { cible: cible.id, corpsACorps: arme.mode === 'corps-a-corps', critique: jet.critique, mainsNues: arme.id === 'arts-martiaux' || arme.id === 'mains-nues' };
  }
  if (!jet.touche) {
    // Écorchure : dégâts égaux au modificateur même en cas d'échec.
    if (arme.botte === 'ecorchure' && attaquant.mods[arme.caracteristique] > 0) {
      infligerDegats(etat, cible, [{ montant: attaquant.mods[arme.caracteristique], type: arme.degats[0]!.type }], attaquant);
    }
    return jet;
  }
  const degats = arme.degats.map((d) => ({
    montant: lancerDes(etat, d.des, mult) + (options.enchainement ? Math.min(0, d.bonus) : d.bonus),
    type: d.type,
  }));
  const physique = arme.degats[0]!.type;
  if (attaquant.rage && arme.caracteristique === 'for') degats.push({ montant: attaquant.ressources.degatsRage ?? 2, type: physique });
  // Frénésie (Berserker) : Témérité pendant la rage, dés supplémentaires une fois par tour, sur la première cible touchée par une attaque de Force.
  if (attaquant.rage && attaquant.tour.temeraire && aTrait(attaquant, 'frenesie') && arme.caracteristique === 'for' && !attaquant.tour.frenesieUtilisee && !options.opportunite) {
    attaquant.tour.frenesieUtilisee = true;
    degats.push({ montant: lancerDes(etat, `${attaquant.ressources.degatsRage ?? 2}d6`, mult), type: physique });
  }
  // Attaque sournoise : une fois par tour, arme de finesse ou à distance, avec avantage ou un allié au contact de la cible.
  const s = situationAttaque(etat, attaquant, cible, arme.mode);
  if (
    aTrait(attaquant, 'attaque-sournoise') &&
    !attaquant.tour.sournoiseUtilisee &&
    // Arme de finesse ou arme à distance (un javelot lancé n'en est pas une) ; jamais avec un désavantage.
    (arme.finesse || (arme.mode === 'distance' && arme.caracteristique === 'dex')) &&
    !jet.desavantage &&
    (jet.avantage || allieAuContact(etat, attaquant, cible))
  ) {
    attaquant.tour.sournoiseUtilisee = true;
    degats.push({ montant: lancerDes(etat, `${Math.ceil(attaquant.niveau / 2)}d6`, mult), type: physique });
    journaliser(etat, { type: 'info', texte: 'Attaque sournoise !', acteur: attaquant.id });
  }
  // Proie du chasseur (Tueur de colosses) : 1d8 une fois par tour contre une cible blessée.
  if (aTrait(attaquant, 'proie-du-chasseur') && !attaquant.tour.proieUtilisee && cible.pv < cible.pvMax) {
    attaquant.tour.proieUtilisee = true;
    degats.push({ montant: lancerDes(etat, '1d8', mult), type: physique });
  }
  // Marque du chasseur : 1d6 de force contre la cible marquée.
  if (cible.modificateurs.some((m) => m.id === 'marque-du-chasseur' && m.source === attaquant.id)) {
    degats.push({ montant: lancerDes(etat, '1d6', mult), type: 'force' });
  }
  for (const m of attaquant.modificateurs.filter((x) => x.type === 'de_degats' && x.de)) {
    degats.push({ montant: lancerDes(etat, m.de!, mult), type: physique });
  }
  attaquant.modificateurs = attaquant.modificateurs.filter((x) => !(x.type === 'de_degats' && x.usageUnique));
  infligerDegats(etat, cible, degats, attaquant, jet.critique);
  appliquerBotte(etat, attaquant, cible, arme, options);
  // Rayon traçant : l'avantage accordé est consommé par cette attaque (déjà retiré dans jetAttaque).
  return jet;
}

function appliquerBotte(
  etat: EtatCombat,
  attaquant: Combattant,
  cible: Combattant,
  arme: AttaqueArme,
  options: { opportunite?: boolean; enchainement?: boolean },
): void {
  if (!arme.botte || cible.mort) return;
  const dd = 8 + attaquant.mods[arme.caracteristique] + attaquant.bonusMaitrise;
  switch (arme.botte) {
    case 'sape':
      cible.modificateurs.push({ id: 'sape', type: 'desavantage_attaque', source: attaquant.id, usageUnique: true, expire: { moment: 'debut_tour', de: attaquant.id } });
      break;
    case 'ouverture':
      // L'avantage vaut jusqu'à la fin du prochain tour de l'attaquant (on laisse passer la fin de ce tour-ci).
      attaquant.modificateurs.push({ id: 'ouverture', type: 'avantage_attaque', source: attaquant.id, contre: cible.id, usageUnique: true, expire: { moment: 'fin_tour', de: attaquant.id, apres: 1 } });
      break;
    case 'renversement':
      if (cible.pv > 0 && !sauvegarde(etat, cible, 'con', dd)) ajouterEtat(etat, cible, { etat: 'a-terre' });
      break;
    case 'ralentissement':
      if (!cible.modificateurs.some((m) => m.id === 'ralentissement')) {
        cible.modificateurs.push({ id: 'ralentissement', type: 'vitesse', valeur: -3, source: attaquant.id, expire: { moment: 'debut_tour', de: attaquant.id } });
      }
      break;
    case 'poussee': {
      // Seule une créature de taille G ou moins peut être repoussée.
      if (TAILLES.indexOf(cible.taille) > TAILLES.indexOf('G')) break;
      const dx = Math.sign(cible.position.x - attaquant.position.x);
      const dy = Math.sign(cible.position.y - attaquant.position.y);
      const occ = occupation(etat, cible);
      const pousse: Position[] = [];
      for (let i = 0; i < 2; i++) {
        const p = { x: cible.position.x + dx, y: cible.position.y + dy };
        if (!franchissable(etat.grille.cases[p.y * etat.grille.largeur + p.x] ?? 'mur') || occ.occupees.has(cle(p))) break;
        cible.position = p;
        pousse.push(p);
      }
      if (pousse.length) journaliser(etat, { type: 'deplacement', texte: `${cible.nom} est repoussé.`, acteur: cible.id, details: { chemin: pousse } });
      break;
    }
    case 'enchainement': {
      if (options.enchainement || options.opportunite || attaquant.tour.enchainementUtilise) break;
      const seconde = ennemis(etat, attaquant).find(
        (e) => e.id !== cible.id && distanceMetres(e.position, cible.position) <= TAILLE_CASE && distanceMetres(e.position, attaquant.position) <= arme.allonge,
      );
      if (!seconde) break;
      attaquant.tour.enchainementUtilise = true;
      attaqueArme(etat, attaquant, seconde, arme, { enchainement: true });
      break;
    }
    default:
      break;
  }
}

export function attaqueMonstre(etat: EtatCombat, attaquant: Combattant, cible: Combattant, actionId: string): void {
  const action = attaquant.actionsMonstre.find((a) => a.id === actionId);
  if (!action) throw new Error(`Action inconnue : ${actionId}`);
  const r = action.resolution;
  if (r?.type === 'attaque') {
    const jet = jetAttaque(etat, attaquant, cible, r.bonus ?? 0, r.mode, action.portee?.normale);
    journaliser(etat, {
      type: 'attaque',
      texte: `${attaquant.nom} attaque ${cible.nom} (${action.nom}) : ${jet.de}${jet.avantage ? ' avec avantage' : jet.desavantage ? ' avec désavantage' : ''} → ${jet.total}, ${jet.touche ? (jet.critique ? 'critique !' : 'touché') : 'raté'}${jet.couvert ? ' (cible à couvert, +2 CA)' : ''}.`,
      acteur: attaquant.id,
      cible: cible.id,
      details: detailsJet(jet, r.mode === 'distance', undefined, action.id),
    });
    if (!jet.touche) return;
    const mult = jet.critique ? 2 : 1;
    infligerDegats(
      etat,
      cible,
      action.degats.map((d) => ({ montant: lancerDes(etat, d.des, mult) + d.bonus, type: d.type })),
      attaquant,
      jet.critique,
    );
    for (const e of action.etats) {
      if (cible.mort || cible.pv <= 0) continue;
      if (e.tailleMax && TAILLES.indexOf(cible.taille) > TAILLES.indexOf(e.tailleMax)) continue;
      if (e.sauvegarde && sauvegarde(etat, cible, e.sauvegarde.caracteristique, e.sauvegarde.dd)) {
        journaliser(etat, { type: 'etat', texte: `${cible.nom} résiste (${libelleEtat(e.etat)}).`, cible: cible.id });
        continue;
      }
      ajouterEtat(etat, cible, { etat: e.etat, source: attaquant.id, evasion: e.evasion, finTourDe: e.dureeRounds ? cible.id : undefined });
    }
  } else if (r?.type === 'sauvegarde') {
    const reussite = sauvegarde(etat, cible, r.caracteristique, r.dd ?? 10, couvertSauvegarde(etat, cible, r.caracteristique, attaquant.position));
    journaliser(etat, {
      type: 'attaque',
      texte: `${attaquant.nom} utilise ${action.nom} sur ${cible.nom} : sauvegarde ${reussite ? 'réussie' : 'ratée'}.`,
      acteur: attaquant.id,
      cible: cible.id,
      details: { sauvegarde: reussite ? 'reussie' : 'ratee', distance: action.portee?.type === 'distance' },
    });
    const facteur = reussite ? (r.moitieSiReussite ? 0.5 : 0) : 1;
    if (facteur > 0 && action.degats.length) {
      infligerDegats(etat, cible, action.degats.map((d) => ({ montant: Math.floor((lancerDes(etat, d.des) + d.bonus) * facteur), type: d.type })), attaquant);
    }
    if (!reussite) {
      for (const e of action.etats) ajouterEtat(etat, cible, { etat: e.etat, source: attaquant.id, evasion: e.evasion, finTourDe: e.dureeRounds ? cible.id : undefined });
    }
  }
}

export type { Modificateur };
