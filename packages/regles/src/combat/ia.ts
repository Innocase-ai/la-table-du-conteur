// IA tactique : choisit les actions d'un combattant par simulation.
// 1. On génère des étapes candidates (se déplacer et/ou jouer une carte, ou finir le tour).
// 2. Chaque candidate est jouée sur une copie de l'état et notée ; les meilleures sont
//    départagées en simulant la suite du round plusieurs fois (politique simple pour tous).
// L'IA ne triche pas : elle raisonne sur une copie où les PV adverses sont estimés
// d'après leur état apparent (intact, blessé, en sang).
import { cartesDisponibles, executer, type Carte, type Commande, type Contexte } from './cartes';
import { actif, aEtat, cloner, combattant, ennemis, horsCombat, journaliser, peutAgir, type Camp, type Combattant, type EtatCombat } from './etat';
import { cle, couvert, distanceCases, distanceMetres, ligneDeVue, type Position } from './grille';
import { deplacementsPossibles, deplacer, etatApparent, finTour } from './moteur';

export interface Doctrine {
  /** Poids des dégâts infligés à l'adversaire. */
  agressivite: number;
  /** Poids des dégâts subis et de l'exposition. */
  prudence: number;
  /** Cibles prioritaires. */
  focus: 'aucun' | 'lanceurs' | 'soigneurs' | 'blesses';
  /** Part des PX du groupe perdue au-delà de laquelle le groupe fuit (1 = jamais). */
  seuilFuite: number;
}

export const DOCTRINE_PAR_DEFAUT: Doctrine = { agressivite: 1, prudence: 0.6, focus: 'aucun', seuilFuite: 0.7 };

export interface OptionsIA {
  /** Nombre de candidates départagées par simulation. */
  finalistes: number;
  /** Simulations par finaliste. */
  simulations: number;
  doctrines?: Partial<Record<Camp, Doctrine>>;
}

export const IA_NORMALE: OptionsIA = { finalistes: 4, simulations: 4 };
export const IA_RAPIDE: OptionsIA = { finalistes: 0, simulations: 0 };

// ---------------------------------------------------------------------------
// Évaluation
// ---------------------------------------------------------------------------

function poids(c: Combattant): number {
  if (c.camp === 'heros') return 1;
  return Math.max(0.3, Math.sqrt(c.px / 100));
}

function bonusFocus(c: Combattant, d: Doctrine): number {
  if (d.focus === 'lanceurs' && c.incantation) return 1.5;
  if (d.focus === 'soigneurs' && c.sorts.some((s) => s === 'soins' || s === 'mot-de-guerison')) return 1.5;
  return 1;
}

/** Bonus durables (rage, protections, bénédictions…) : leur effet ne se voit qu'aux tours suivants. */
function valeurRenforcements(c: Combattant): number {
  let v = c.rage ? 0.3 : 0;
  if (c.concentration) v += 0.1;
  for (const m of c.modificateurs) {
    if (m.type === 'bonus_ca' && !m.expire) v += 0.08 * (m.valeur ?? 0);
    if ((m.type === 'de_attaque' || m.type === 'de_sauvegarde') && m.de) v += m.de.startsWith('-') ? -0.12 : 0.12;
  }
  return v;
}

/** Ressources restantes : dépenser un emplacement ou une rage doit rapporter plus que ça ne coûte. */
function valeurRessources(c: Combattant): number {
  const emplacements = c.incantation?.emplacements.reduce((s, n, i) => s + n * (i + 1), 0) ?? 0;
  const r = c.ressources;
  return 0.03 * emplacements + 0.04 * ((r.rages ?? 0) + (r.secondSouffle ?? 0) + (r.fougue ?? 0) + (r.conduit ?? 0) + (r.potions ?? 0));
}

/** Note de l'état du point de vue d'un camp (plus haut = mieux). */
export function evaluer(etat: EtatCombat, camp: Camp, d: Doctrine): number {
  if (etat.vainqueur) return etat.vainqueur === camp ? 1000 : -1000;
  let score = 0;
  for (const c of etat.combattants) {
    const w = poids(c);
    const hors = c.mort || c.pv <= 0 || c.enFuite;
    const neutralise = !hors && !peutAgir(c);
    const fraction = hors ? 0 : c.pv / c.pvMax;
    if (c.camp === camp) {
      score -= d.prudence * w * ((1 - fraction) + (hors ? 1.5 : 0) + (neutralise ? 0.7 : 0));
      if (!hors) score += w * (valeurRenforcements(c) + valeurRessources(c));
    } else {
      const f = w * bonusFocus(c, d) * (d.focus === 'blesses' ? 1.3 : 1);
      score += d.agressivite * f * ((1 - fraction) + (hors ? 1.5 : 0) + (neutralise ? 0.7 : 0));
    }
  }
  return score;
}

// ---------------------------------------------------------------------------
// Vue sans triche
// ---------------------------------------------------------------------------

/** Copie de l'état où les PV des adversaires sont remplacés par une estimation. */
export function vueDe(etat: EtatCombat, camp: Camp): EtatCombat {
  const vue = cloner(etat);
  for (const c of vue.combattants) {
    if (c.camp === camp || horsCombat(c)) continue;
    const apparent = etatApparent(c);
    c.pv = apparent === 'intact' ? c.pvMax : apparent === 'blesse' ? Math.round(c.pvMax * 0.75) : apparent === 'en-sang' ? Math.max(1, Math.round(c.pvMax * 0.3)) : 0;
  }
  return vue;
}

// ---------------------------------------------------------------------------
// Politique simple (pour les simulations et l'IA rapide)
// ---------------------------------------------------------------------------

function plusProche(etat: EtatCombat, c: Combattant): Combattant | undefined {
  return ennemis(etat, c).sort((a, b) => distanceCases(a.position, c.position) - distanceCases(b.position, c.position))[0];
}

function meilleureCarteOffensive(cartes: Carte[]): Carte | undefined {
  const offensives = cartes.filter((k) => k.jouable && k.ciblage === 'ennemi' && k.cibles.length && k.cout !== 'elan');
  // Attaques et actions de monstre d'abord, puis sorts ; les multiattaques avant les attaques simples.
  return offensives.sort((a, b) => b.nbCibles - a.nbCibles || Number(a.categorie === 'sort') - Number(b.categorie === 'sort'))[0];
}

function cibleFaible(etat: EtatCombat, ids: string[]): string {
  return [...ids].sort((a, b) => combattant(etat, a).pv - combattant(etat, b).pv)[0]!;
}

/** Joue le tour du combattant actif avec des règles simples (avancer, frapper, soigner un allié à terre). */
export function jouerTourSimple(etat: EtatCombat, ctx: Contexte): void {
  const c = actif(etat);
  const id = c.id;
  if (peutAgir(c)) {
    // Soigner un allié tombé si possible.
    const soin = cartesDisponibles(etat, ctx, id).find(
      (k) => k.jouable && k.ciblage === 'allie' && (k.id === 'sort:mot-de-guerison' || k.id === 'sort:soins' || k.id === 'base:potion') && k.cibles.some((x) => combattant(etat, x).pv <= 0),
    );
    if (soin) executer(etat, ctx, { type: 'jouer', carte: soin.id, cibles: [soin.cibles.find((x) => combattant(etat, x).pv <= 0)!] });
    for (let i = 0; i < 4 && !etat.vainqueur && actif(etat).id === id; i++) {
      const k = meilleureCarteOffensive(cartesDisponibles(etat, ctx, id));
      if (k) {
        executer(etat, ctx, { type: 'jouer', carte: k.id, cibles: [cibleFaible(etat, k.cibles)] });
        continue;
      }
      if (c.tour.mouvement <= 0 || i > 1) break;
      const cible = plusProche(etat, c);
      if (!cible) break;
      let meilleure: Position | undefined;
      let dist = distanceCases(c.position, cible.position);
      for (const ch of deplacementsPossibles(etat, c).values()) {
        const d = distanceCases(ch.arrivee, cible.position);
        if (d < dist) {
          dist = d;
          meilleure = ch.arrivee;
        }
      }
      if (!meilleure) break;
      deplacer(etat, c, meilleure);
    }
  }
  if (!etat.vainqueur && actif(etat).id === id) finTour(etat);
}

// ---------------------------------------------------------------------------
// Génération des étapes candidates
// ---------------------------------------------------------------------------

interface Etape {
  commandes: Commande[];
  libelle: string;
}

function destinations(etat: EtatCombat, c: Combattant): Position[] {
  const chemins = [...deplacementsPossibles(etat, c).values()];
  if (!chemins.length) return [];
  const adversaires = ennemis(etat, c);
  const res = new Map<string, Position>();
  const ajouter = (p: Position | undefined) => p && res.set(cle(p), p);
  // Au contact de chacun des ennemis les plus proches.
  for (const e of [...adversaires].sort((a, b) => distanceCases(a.position, c.position) - distanceCases(b.position, c.position)).slice(0, 4)) {
    ajouter(chemins.filter((ch) => distanceCases(ch.arrivee, e.position) === 1).sort((a, b) => a.cout - b.cout)[0]?.arrivee);
  }
  const distMin = (p: Position) => Math.min(99, ...adversaires.map((e) => distanceMetres(p, e.position)));
  // Position de tir : loin du contact, avec une ligne de vue sur un ennemi à moins de 18 m.
  const tirs = chemins.filter((ch) => adversaires.some((e) => distanceMetres(ch.arrivee, e.position) <= 18 && ligneDeVue(etat.grille, ch.arrivee, e.position)));
  ajouter(tirs.sort((a, b) => distMin(b.arrivee) - distMin(a.arrivee))[0]?.arrivee);
  // Tir à couvert : une position de tir où un obstacle bas protège des ennemis qui pourraient tirer en retour.
  // La simulation du round dira si elle vaut mieux que les autres.
  const abrites = (p: Position) => adversaires.filter((e) => couvert(etat.grille, e.position, p) > 0).length;
  ajouter(tirs.filter((ch) => abrites(ch.arrivee) > 0).sort((a, b) => abrites(b.arrivee) - abrites(a.arrivee) || distMin(b.arrivee) - distMin(a.arrivee))[0]?.arrivee);
  // Repli : le plus loin possible des ennemis.
  ajouter(chemins.sort((a, b) => distMin(b.arrivee) - distMin(a.arrivee))[0]?.arrivee);
  // Rapprochement à mi-chemin.
  const proche = plusProche(etat, c);
  if (proche) ajouter(chemins.sort((a, b) => distanceCases(a.arrivee, proche.position) - distanceCases(b.arrivee, proche.position))[0]?.arrivee);
  return [...res.values()];
}

function choixCibles(etat: EtatCombat, c: Combattant, k: Carte): string[][] {
  if (!k.nbCibles) return [[]];
  const allie = k.ciblage === 'allie';
  const tries = [...k.cibles].sort((a, b) => {
    const ca = combattant(etat, a);
    const cb = combattant(etat, b);
    return allie ? ca.pv / ca.pvMax - cb.pv / cb.pvMax : ca.pv - cb.pv || distanceCases(ca.position, c.position) - distanceCases(cb.position, c.position);
  });
  if (k.nbCibles > 1 && k.categorie !== 'monstre') return [tries.slice(0, k.nbCibles)];
  return tries.slice(0, 3).map((x) => [x]);
}

function pointsZone(etat: EtatCombat, c: Combattant, k: Carte): Position[] {
  return ennemis(etat, c)
    .filter((e) => distanceMetres(k.origine ?? c.position, e.position) <= Math.max(k.portee ?? 0, k.zone?.taille ?? 0) && ligneDeVue(etat.grille, c.position, e.position))
    .slice(0, 4)
    .map((e) => e.position);
}

function etapesPour(etat: EtatCombat, ctx: Contexte, c: Combattant, prefixe: Commande[]): Etape[] {
  const res: Etape[] = [];
  for (const k of cartesDisponibles(etat, ctx, c.id)) {
    if (!k.jouable) continue;
    if (k.ciblage === 'point') {
      for (const p of pointsZone(etat, c, k)) res.push({ commandes: [...prefixe, { type: 'jouer', carte: k.id, point: p }], libelle: `${k.nom} sur (${p.x},${p.y})` });
      continue;
    }
    for (const cibles of choixCibles(etat, c, k)) {
      res.push({ commandes: [...prefixe, { type: 'jouer', carte: k.id, cibles }], libelle: `${k.nom}${cibles.length ? ' → ' + cibles.join(', ') : ''}` });
    }
  }
  return res;
}

function genererEtapes(etat: EtatCombat, ctx: Contexte, c: Combattant): Etape[] {
  const res: Etape[] = [{ commandes: [{ type: 'finTour' }], libelle: 'fin du tour' }];
  res.push(...etapesPour(etat, ctx, c, []));
  for (const p of destinations(etat, c)) {
    const essai = cloner(etat);
    if (!deplacer(essai, combattant(essai, c.id), p) || actif(essai).id !== c.id) continue;
    const prefixe: Commande[] = [{ type: 'deplacer', vers: p }];
    res.push({ commandes: prefixe, libelle: `aller en (${p.x},${p.y})` });
    res.push(...etapesPour(essai, ctx, combattant(essai, c.id), prefixe));
  }
  return res;
}

// ---------------------------------------------------------------------------
// Choix
// ---------------------------------------------------------------------------

function appliquerEtape(etat: EtatCombat, ctx: Contexte, e: Etape): boolean {
  for (const cmd of e.commandes) {
    if (etat.vainqueur) return true;
    if (!executer(etat, ctx, cmd).ok) return false;
  }
  return true;
}

function graine(base: number, i: number): number {
  return (Math.imul(base ^ 0x9e3779b9, i + 1) + i * 0x85ebca6b) >>> 0;
}

/** Simule la fin du tour puis le reste du round avec la politique simple. */
function simulerRound(etat: EtatCombat, ctx: Contexte, id: string): void {
  if (!etat.vainqueur && actif(etat).id === id) finTour(etat);
  for (let n = 0; n < etat.ordre.length && !etat.vainqueur && actif(etat).id !== id; n++) jouerTourSimple(etat, ctx);
}

export function choisirEtape(etat: EtatCombat, ctx: Contexte, options: OptionsIA): Etape {
  const c = actif(etat);
  const doctrine = options.doctrines?.[c.camp] ?? DOCTRINE_PAR_DEFAUT;
  const vue = vueDe(etat, c.camp);
  const etapes = genererEtapes(vue, ctx, combattant(vue, c.id));
  // Tri rapide : effet immédiat moyen sur deux tirages.
  const notees = etapes
    .map((e) => {
      let total = 0;
      for (let i = 0; i < 2; i++) {
        const essai = cloner(vue);
        essai.rng = graine(etat.rng, i);
        if (!appliquerEtape(essai, ctx, e)) return { e, note: -Infinity };
        total += evaluer(essai, c.camp, doctrine);
      }
      return { e, note: total / 2 };
    })
    .filter((x) => Number.isFinite(x.note))
    .sort((a, b) => b.note - a.note);
  if (!notees.length) return { commandes: [{ type: 'finTour' }], libelle: 'fin du tour' };
  if (!options.finalistes || !options.simulations) return notees[0]!.e;
  // Départage par simulation du round.
  let meilleure = notees[0]!;
  let meilleureNote = -Infinity;
  for (const cand of notees.slice(0, options.finalistes)) {
    let total = 0;
    for (let i = 0; i < options.simulations; i++) {
      const essai = cloner(vue);
      essai.rng = graine(etat.rng, 100 + i);
      appliquerEtape(essai, ctx, cand.e);
      simulerRound(essai, ctx, c.id);
      total += evaluer(essai, c.camp, doctrine);
    }
    const note = total / options.simulations;
    if (note > meilleureNote) {
      meilleureNote = note;
      meilleure = cand;
    }
  }
  return meilleure.e;
}

// ---------------------------------------------------------------------------
// Moral et fuite
// ---------------------------------------------------------------------------

/** Moral : le groupe de monstres fuit quand il a perdu trop de PX (les morts-vivants ne fuient jamais). */
export function doitFuir(etat: EtatCombat, c: Combattant, d: Doctrine = DOCTRINE_PAR_DEFAUT): boolean {
  if (c.camp !== 'monstres' || d.seuilFuite >= 1 || c.type.toLowerCase().includes('mort-vivant')) return false;
  const groupe = etat.combattants.filter((x) => x.camp === c.camp);
  const total = groupe.reduce((s, x) => s + x.px, 0);
  const perdu = groupe.filter((x) => x.mort || x.enFuite).reduce((s, x) => s + x.px, 0);
  return total > 0 && perdu / total >= d.seuilFuite;
}

function fuir(etat: EtatCombat, ctx: Contexte, c: Combattant): void {
  if (c.tour.action) executer(etat, ctx, { type: 'jouer', carte: 'base:foncer' });
  const adversaires = ennemis(etat, c);
  const distMin = (p: Position) => Math.min(99, ...adversaires.map((e) => distanceMetres(p, e.position)));
  const chemins = [...deplacementsPossibles(etat, c).values()].sort((a, b) => distMin(b.arrivee) - distMin(a.arrivee));
  if (chemins[0]) deplacer(etat, c, chemins[0].arrivee);
  if (!c.mort && distMin(c.position) >= 12) {
    c.enFuite = true;
    journaliser(etat, { type: 'info', texte: `${c.nom} s'enfuit !`, acteur: c.id });
  }
  if (!etat.vainqueur && actif(etat).id === c.id) finTour(etat);
}

/** Joue entièrement le tour du combattant actif ; renvoie les libellés des étapes choisies. */
export function jouerTourIA(etat: EtatCombat, ctx: Contexte, options: OptionsIA = IA_NORMALE): string[] {
  const c = actif(etat);
  const doctrine = options.doctrines?.[c.camp] ?? DOCTRINE_PAR_DEFAUT;
  if (!peutAgir(c)) {
    finTour(etat);
    return ['passe son tour'];
  }
  if (doitFuir(etat, c, doctrine) && !aEtat(c, 'empoigne')) {
    fuir(etat, ctx, c);
    return ['fuite'];
  }
  const libelles: string[] = [];
  for (let i = 0; i < 8 && !etat.vainqueur && actif(etat).id === c.id; i++) {
    const e = choisirEtape(etat, ctx, options);
    libelles.push(e.libelle);
    if (!appliquerEtape(etat, ctx, e)) {
      finTour(etat);
      break;
    }
    if (e.commandes.some((x) => x.type === 'finTour')) break;
  }
  if (!etat.vainqueur && actif(etat).id === c.id) finTour(etat);
  return libelles;
}

