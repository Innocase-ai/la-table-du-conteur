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
  type EtatActif,
  type EtatCombat,
  type Modificateur,
  TAILLES,
} from './etat';
import {
  cheminsAtteignables,
  cle,
  distanceMetres,
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
    temeraire: false,
    elanJoue: false,
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
  debutTour(etat);
  return etat;
}

function expirer(etat: EtatCombat, moment: 'debut_tour' | 'fin_tour', de: string): void {
  for (const c of etat.combattants) {
    c.modificateurs = c.modificateurs.filter((m) => !(m.expire?.moment === moment && m.expire.de === de));
  }
}

function debutTour(etat: EtatCombat): void {
  const c = actif(etat);
  expirer(etat, 'debut_tour', c.id);
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
  for (const x of etat.combattants) x.etats = x.etats.filter((e) => e.finTourDe !== c.id);
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
  if (e.etat === 'inconscient' || e.etat === 'paralyse' || e.etat === 'neutralise') {
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
};

export function libelleEtat(e: Etat): string {
  return LIBELLES_ETATS[e];
}

export function finConcentration(etat: EtatCombat, c: Combattant): void {
  const conc = c.concentration;
  if (!conc) return;
  c.concentration = undefined;
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

export function sauvegarde(etat: EtatCombat, c: Combattant, carac: Caracteristique, dd: number): boolean {
  if ((carac === 'for' || carac === 'dex') && c.etats.some((e) => ['paralyse', 'inconscient'].includes(e.etat))) return false;
  const avantage =
    carac === 'dex' && (c.tour.esquive || (aTrait(c, 'sens-du-danger') && !aEtat(c, 'neutralise')));
  const d1 = de(etat, 20);
  const d = avantage ? Math.max(d1, de(etat, 20)) : d1;
  const total = d + c.sauvegardes[carac] + desModificateurs(etat, c, 'de_sauvegarde');
  return total >= dd;
}

export interface JetAttaque {
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
  if (cible.etats.some((e) => ['paralyse', 'inconscient', 'entrave', 'aveugle'].includes(e.etat))) avantage = true;
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
  const total = d + bonus + bonusTemp + desModificateurs(etat, attaquant, 'de_attaque');
  const seuilCritique = aTrait(attaquant, 'critique-ameliore') ? 19 : 20;
  // Une attaque de corps à corps à 1,5 m contre une cible paralysée ou inconsciente est un critique.
  const critiqueAuto =
    mode === 'corps-a-corps' &&
    distanceMetres(attaquant.position, cible.position) <= TAILLE_CASE &&
    cible.etats.some((e) => e.etat === 'paralyse' || e.etat === 'inconscient');
  let caCible = ca(cible);
  let touche = d !== 1 && (d >= seuilCritique || total >= caCible);
  // Réaction Bouclier : +5 CA si cela transforme le coup en échec.
  if (touche && d < seuilCritique && cible.sorts.includes('bouclier') && cible.ressources.reaction && total < caCible + 5) {
    const niveau = emplacementDisponible(cible, 1);
    if (niveau && peutAgir(cible)) {
      cible.incantation!.emplacements[niveau - 1]! -= 1;
      cible.ressources.reaction = 0;
      cible.modificateurs.push({ id: 'bouclier', type: 'bonus_ca', valeur: 5, source: cible.id, expire: { moment: 'debut_tour', de: cible.id } });
      caCible += 5;
      touche = false;
      journaliser(etat, { type: 'sort', texte: `${cible.nom} lance Bouclier (+5 CA).`, acteur: cible.id });
    }
  }
  const critique = touche && (d >= seuilCritique || critiqueAuto);
  return { touche, critique, avantage, desavantage, total, de: d };
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
  for (const d of degats) total += Math.floor(Math.max(0, d.montant) * multiplicateurDegats(cible, d.type));
  if (total <= 0) {
    journaliser(etat, { type: 'degats', texte: `${cible.nom} ne subit aucun dégât.`, cible: cible.id, valeur: 0 });
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
          attaqueDOpportunite(etat, e, c);
          if (horsCombat(c) || aEtat(c, 'inconscient') || etat.vainqueur) {
            c.tour.mouvement = 0;
            return true;
          }
        }
      }
    }
    c.position = etape;
  }
  c.tour.mouvement -= chemin.cout;
  c.tour.aBouge = true;
  journaliser(etat, { type: 'deplacement', texte: `${c.nom} se déplace de ${chemin.cout} m.`, acteur: c.id });
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
    texte: `${attaquant.nom} attaque ${cible.nom} (${arme.nom}) : ${jet.de}${jet.avantage ? ' avec avantage' : jet.desavantage ? ' avec désavantage' : ''} → ${jet.total}, ${jet.touche ? (jet.critique ? 'critique !' : 'touché') : 'raté'}.`,
    acteur: attaquant.id,
    cible: cible.id,
  });
  const mult = jet.critique ? 2 : 1;
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
  // Frénésie (Berserker) : Témérité pendant la rage, dés supplémentaires sur la première cible touchée.
  if (attaquant.rage && attaquant.tour.temeraire && aTrait(attaquant, 'frenesie') && !attaquant.tour.enchainementUtilise && !options.opportunite) {
    degats.push({ montant: lancerDes(etat, `${attaquant.ressources.degatsRage ?? 2}d6`, mult), type: physique });
  }
  // Attaque sournoise : une fois par tour, arme de finesse ou à distance, avec avantage ou un allié au contact de la cible.
  const s = situationAttaque(etat, attaquant, cible, arme.mode);
  if (
    aTrait(attaquant, 'attaque-sournoise') &&
    !attaquant.tour.sournoiseUtilisee &&
    (arme.finesse || arme.mode === 'distance') &&
    !(s.desavantage && !jet.avantage) &&
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
      attaquant.modificateurs.push({ id: 'ouverture', type: 'avantage_attaque', source: attaquant.id, contre: cible.id, usageUnique: true, expire: { moment: 'fin_tour', de: attaquant.id } });
      // L'avantage vaut jusqu'à la fin du prochain tour de l'attaquant : on retire l'expiration de ce tour.
      attaquant.modificateurs[attaquant.modificateurs.length - 1]!.expire = undefined;
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
      const dx = Math.sign(cible.position.x - attaquant.position.x);
      const dy = Math.sign(cible.position.y - attaquant.position.y);
      const occ = occupation(etat, cible);
      for (let i = 0; i < 2; i++) {
        const p = { x: cible.position.x + dx, y: cible.position.y + dy };
        if (etat.grille.cases[p.y * etat.grille.largeur + p.x] === 'mur' || occ.occupees.has(cle(p))) break;
        cible.position = p;
      }
      break;
    }
    case 'enchainement': {
      if (options.enchainement || options.opportunite || attaquant.tour.enchainementUtilise) break;
      const seconde = ennemis(etat, attaquant).find(
        (e) => e.id !== cible.id && distanceMetres(e.position, cible.position) <= TAILLE_CASE && distanceMetres(e.position, attaquant.position) <= arme.allonge,
      );
      attaquant.tour.enchainementUtilise = true;
      if (seconde) attaqueArme(etat, attaquant, seconde, arme, { enchainement: true });
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
      texte: `${attaquant.nom} attaque ${cible.nom} (${action.nom}) : ${jet.de}${jet.avantage ? ' avec avantage' : jet.desavantage ? ' avec désavantage' : ''} → ${jet.total}, ${jet.touche ? (jet.critique ? 'critique !' : 'touché') : 'raté'}.`,
      acteur: attaquant.id,
      cible: cible.id,
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
    const reussite = sauvegarde(etat, cible, r.caracteristique, r.dd ?? 10);
    journaliser(etat, { type: 'attaque', texte: `${attaquant.nom} utilise ${action.nom} sur ${cible.nom} : sauvegarde ${reussite ? 'réussie' : 'ratée'}.`, acteur: attaquant.id, cible: cible.id });
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
