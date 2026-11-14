// Se promener : l'état du groupe sur la carte et les verbes qui le font bouger. Toutes les fonctions sont pures (elles renvoient un
// nouvel état, l'ancien n'est jamais modifié) et déterministes. Elles ne disent pas ce qu'une rencontre ou un point d'intérêt
// DEVIENT : elles le signalent par un événement et s'arrêtent, c'est le moteur de jeu qui prend la main (combat, événement à choix).
import { direction, phraseMoment, phraseSigne, phraseTerrain } from './ambiance';
import { trouverChemin } from './chemin';
import { ancreEn, coutDeplacement, dansCarte } from './generation';
import { entreesPossibles, INTERVALLE_RENCONTRE, terrainDe, tirerRencontre } from './rencontres';
import { COUT_ROUTE, coutCase, DEBUT_PARTIE, moment as momentDe, numeroJour } from './terrain';
import { nouvelleExploration, reperesVisibles, reveler } from './vision';
import type { Ancre, CarteTerres, Case, ContexteVoyage, EntreeTable, EtatVoyage, EvenementTerres, RaisonArret, ResultatVoyage, Terrain } from './types';

export const VERSION_VOYAGE = 1;

/** Une annonce de terrain au plus tous les 8 pas : on ne raconte pas chaque lisière. */
const PAS_ENTRE_ANNONCES = 8;

export interface OptionsCreation {
  /** Minutes depuis minuit du jour 1 (défaut : 8 h du matin). */
  minutes?: number;
  /** Graine du voyage (tirages de rencontre). Défaut : dérivée de la graine de la carte. */
  graine?: number;
}

/** Commence un voyage sur une ancre (son id) ou une case : la case d'arrivée est révélée, les repères en vue aussi. */
export function creerVoyage(carte: CarteTerres, depart: string | Case, ctx: ContexteVoyage, opts: OptionsCreation = {}): EtatVoyage {
  const case0 = typeof depart === 'string' ? carte.ancres.find((a) => a.id === depart) : depart;
  if (!case0) throw new Error(`Voyage : départ inconnu « ${String(depart)} ».`);
  const minutes = opts.minutes ?? DEBUT_PARTIE;
  let etat: EtatVoyage = {
    version: VERSION_VOYAGE,
    carte: carte.id,
    graineCarte: carte.graine,
    versionGenerateur: carte.versionGenerateur,
    x: case0.x,
    y: case0.y,
    minutes,
    explore: nouvelleExploration(carte),
    pois: {},
    ancresVues: [],
    graine: opts.graine ?? (carte.graine ^ 0x5bd1e995) >>> 0,
    tirages: 0,
    minutesDepuisTirage: 0,
    pas: 0,
    momentAnnonce: momentDe(minutes),
  };
  etat = { ...etat, explore: reveler(carte, etat.explore, etat, ctx) };
  const ev: EvenementTerres[] = [];
  etat = reperer(carte, etat, ev);
  const ici = ancreEn(carte, etat.x, etat.y);
  if (ici && !etat.ancresVues.includes(ici.id)) etat = { ...etat, ancresVues: [...etat.ancresVues, ici.id] };
  return etat;
}

/** Les repères tout juste apparus : on les marque vus (et leur case explorée) et on dit où ils sont. */
function reperer(carte: CarteTerres, etat: EtatVoyage, ev: EvenementTerres[]): EtatVoyage {
  let e = etat;
  for (const r of reperesVisibles(carte, etat)) {
    const nouveau = r.genre === 'poi' ? !e.pois[r.id] : !e.ancresVues.includes(r.id);
    if (!nouveau) continue;
    const explore = e.explore.slice();
    explore[r.y * carte.largeur + r.x] = 1;
    e = r.genre === 'poi' ? { ...e, explore, pois: { ...e.pois, [r.id]: 'vu' } } : { ...e, explore, ancresVues: [...e.ancresVues, r.id] };
    ev.push({ type: 'repere', cible: { genre: r.genre, id: r.id }, nom: r.nom, direction: direction(r.x - e.x, r.y - e.y), distance: r.distance });
  }
  return e;
}

export const ancreIci = (etat: EtatVoyage, carte: CarteTerres): Ancre | undefined => ancreEn(carte, etat.x, etat.y);

/**
 * Le chemin du groupe vers `but`. Le groupe ne connaît que ce qu'il a vu : une case inconnue est supposée de la plaine franchissable
 * (on ne triche pas avec l'eau ou les décors qu'il n'a pas encore aperçus). Il se peut donc que la marche s'arrête sur un obstacle
 * (`bloque`) : on replanifie alors depuis la nouvelle position.
 */
export function planifier(etat: EtatVoyage, carte: CarteTerres, but: Case): Case[] | null {
  if (!dansCarte(carte, but.x, but.y)) return null;
  const reel = coutDeplacement(carte);
  const cout = (i: number) => (etat.explore[i] ? reel(i) : coutCase('plaine', false, false, carte.echelle));
  const ch = trouverChemin(carte.largeur, carte.hauteur, etat, but, cout, COUT_ROUTE * carte.echelle);
  return ch ? ch.cases.slice(1) : null;
}

interface PasFait {
  etat: EtatVoyage;
  evenements: EvenementTerres[];
  arret?: RaisonArret;
  minutes: number;
}

/** L'ordre des vérifications d'un pas : coût, jour, moment, terrain, repères, point d'intérêt, ancre, rencontre. */
function unPas(etat: EtatVoyage, carte: CarteTerres, vers: Case, ctx: ContexteVoyage, table: readonly EntreeTable[]): PasFait {
  const ev: EvenementTerres[] = [];
  if (Math.abs(vers.x - etat.x) + Math.abs(vers.y - etat.y) !== 1) {
    ev.push({ type: 'bloque', raison: 'obstacle' });
    return { etat, evenements: ev, arret: 'bloque', minutes: 0 };
  }
  if (!dansCarte(carte, vers.x, vers.y)) {
    ev.push({ type: 'bloque', raison: 'bord' });
    return { etat, evenements: ev, arret: 'bloque', minutes: 0 };
  }
  const i = vers.y * carte.largeur + vers.x;
  if (carte.tuiles[i] === 'eau') {
    ev.push({ type: 'bloque', raison: 'eau' });
    return { etat, evenements: ev, arret: 'bloque', minutes: 0 };
  }
  if (carte.blocage[i]) {
    ev.push({ type: 'bloque', raison: 'obstacle' });
    return { etat, evenements: ev, arret: 'bloque', minutes: 0 };
  }

  const cout = coutDeplacement(carte)(i);
  const jourAvant = numeroJour(etat.minutes);
  let e: EtatVoyage = { ...etat, x: vers.x, y: vers.y, minutes: etat.minutes + cout, pas: etat.pas + 1, minutesDepuisTirage: etat.minutesDepuisTirage + cout };
  if (numeroJour(e.minutes) !== jourAvant) ev.push({ type: 'jour', jour: numeroJour(e.minutes) });
  const m = momentDe(e.minutes);
  if (m !== e.momentAnnonce) {
    e = { ...e, momentAnnonce: m };
    ev.push({ type: 'moment', moment: m, texte: phraseMoment(m, carte.graine, e.pas) });
  }
  const { terrain, surRoute } = terrainDe(carte, e.x, e.y);
  const cle: Terrain | 'route' = surRoute && terrain !== 'gue' ? 'route' : terrain;
  if (cle !== e.terrainAnnonce && (e.pasAnnonce === undefined || e.pas - e.pasAnnonce >= PAS_ENTRE_ANNONCES || cle === 'gue')) {
    e = { ...e, terrainAnnonce: cle, pasAnnonce: e.pas };
    ev.push({ type: 'terrain', terrain: cle, texte: phraseTerrain(cle, carte.graine, e.pas) });
  }

  e = { ...e, explore: reveler(carte, e.explore, e, ctx) };
  e = reperer(carte, e, ev);

  let arret: RaisonArret | undefined;
  const poi = carte.pois.find((p) => p.x === e.x && p.y === e.y);
  if (poi && e.pois[poi.id] !== 'visite') {
    e = { ...e, pois: { ...e.pois, [poi.id]: 'visite' } };
    ev.push({ type: 'poi', poi });
    arret = 'poi';
  }
  const ancre = ancreEn(carte, e.x, e.y);
  if (ancre) {
    if (!e.ancresVues.includes(ancre.id)) e = { ...e, ancresVues: [...e.ancresVues, ancre.id] };
    ev.push({ type: 'ancre', ancre });
  }

  while (!arret && e.minutesDepuisTirage >= INTERVALLE_RENCONTRE) {
    e = { ...e, minutesDepuisTirage: e.minutesDepuisTirage - INTERVALLE_RENCONTRE };
    const t = tirerRencontre(e, carte, e, table, ctx);
    e = t.etat;
    if (t.resultat.genre === 'signe') ev.push({ type: 'signe', texte: phraseSigne(carte.graine, e.tirages) });
    else if (t.resultat.genre === 'rencontre') {
      ev.push({ type: 'rencontre', rencontre: { entree: t.resultat.entree, x: e.x, y: e.y, terrain, surRoute, moment: m, minutes: e.minutes, graine: t.resultat.graine } });
      arret = 'rencontre';
    }
  }
  return { etat: e, evenements: ev, arret, minutes: cout };
}

export interface OptionsDeplacement {
  /** Nombre de cases au plus dans cet appel (une interface qui anime la marche passe 1). */
  maxPas?: number;
}

/**
 * Fait marcher le groupe le long de `chemin` (cases à suivre, la position actuelle exclue), case par case, jusqu'à ce que quelque
 * chose l'arrête : une rencontre, un point d'intérêt atteint, un obstacle, la fin du chemin (`termine`, ou `ancre` si l'on arrive
 * sur un lieu écrit). Passer sur une ancre en chemin ne s'arrête pas. `restant` est ce qu'il reste à parcourir.
 */
export function deplacer(etat: EtatVoyage, carte: CarteTerres, chemin: readonly Case[], ctx: ContexteVoyage, table: readonly EntreeTable[] = [], opts: OptionsDeplacement = {}): ResultatVoyage {
  let e = etat;
  const evenements: EvenementTerres[] = [];
  let minutes = 0;
  let pas = 0;
  let k = 0;
  let arret: RaisonArret = 'termine';
  while (k < chemin.length) {
    if (opts.maxPas !== undefined && pas >= opts.maxPas) {
      arret = 'limite';
      break;
    }
    const f = unPas(e, carte, chemin[k]!, ctx, table);
    evenements.push(...f.evenements);
    if (f.arret === 'bloque') {
      arret = 'bloque';
      break;
    }
    e = f.etat;
    minutes += f.minutes;
    pas++;
    k++;
    if (f.arret) {
      arret = f.arret;
      break;
    }
  }
  const restant = chemin.slice(k);
  if (arret === 'termine' && ancreEn(carte, e.x, e.y) && chemin.length > 0) arret = 'ancre';
  if (arret === 'limite' && restant.length === 0) arret = ancreEn(carte, e.x, e.y) ? 'ancre' : 'termine';
  return { etat: e, evenements, pas, minutes, arret, restant };
}

/** Un seul pas vers une case voisine (flèches du clavier). */
export const marcher = (etat: EtatVoyage, carte: CarteTerres, vers: Case, ctx: ContexteVoyage, table: readonly EntreeTable[] = []): ResultatVoyage => deplacer(etat, carte, [vers], ctx, table);

/**
 * Camper : le temps passe, une heure à la fois, avec une chance de rencontre par heure (plus faible qu'en marche : on a un tour de
 * garde). S'arrête à la première rencontre. Les règles du repos (PV, sorts) restent au moteur de jeu, qui lit `minutes`.
 */
export function camper(etat: EtatVoyage, carte: CarteTerres, minutesVoulues: number, ctx: ContexteVoyage, table: readonly EntreeTable[] = []): ResultatVoyage {
  let e = etat;
  const evenements: EvenementTerres[] = [];
  let ecoule = 0;
  let arret: RaisonArret = 'termine';
  while (ecoule < minutesVoulues) {
    const part = Math.min(INTERVALLE_RENCONTRE * 2, minutesVoulues - ecoule);
    const jourAvant = numeroJour(e.minutes);
    e = { ...e, minutes: e.minutes + part };
    ecoule += part;
    if (numeroJour(e.minutes) !== jourAvant) evenements.push({ type: 'jour', jour: numeroJour(e.minutes) });
    const m = momentDe(e.minutes);
    if (m !== e.momentAnnonce) {
      e = { ...e, momentAnnonce: m };
      evenements.push({ type: 'moment', moment: m, texte: phraseMoment(m, carte.graine, e.tirages) });
    }
    e = { ...e, explore: reveler(carte, e.explore, e, ctx) };
    // Une vérification par heure de camp (la moitié du risque d'une marche d'une heure : le groupe veille).
    if (part === INTERVALLE_RENCONTRE * 2) {
      const t = tirerRencontre(e, carte, e, table, ctx, 0.5);
      e = t.etat;
      const { terrain, surRoute } = terrainDe(carte, e.x, e.y);
      if (t.resultat.genre === 'signe') evenements.push({ type: 'signe', texte: phraseSigne(carte.graine, e.tirages) });
      else if (t.resultat.genre === 'rencontre') {
        evenements.push({ type: 'rencontre', rencontre: { entree: t.resultat.entree, x: e.x, y: e.y, terrain, surRoute, moment: m, minutes: e.minutes, graine: t.resultat.graine } });
        arret = 'rencontre';
        break;
      }
    }
  }
  return { etat: e, evenements, pas: 0, minutes: ecoule, arret, restant: [] };
}

/** Les lignes de la table qui pourraient survenir ici et maintenant (pour un aperçu, un test ou un panneau de débogage). */
export const rencontresPossibles = (etat: EtatVoyage, carte: CarteTerres, table: readonly EntreeTable[], ctx: Pick<ContexteVoyage, 'niveauGroupe'>): EntreeTable[] => entreesPossibles(table, carte, etat, ctx);
