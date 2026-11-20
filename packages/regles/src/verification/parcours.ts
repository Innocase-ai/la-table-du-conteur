// Le simulateur de parcours : un joueur automatique qui joue le VRAI moteur (propositions, ordres) pour répondre à la question
// que le validateur ne peut pas trancher : « cette fin peut-elle vraiment arriver ? ». Il explore l'espace des états du jeu,
// guidé vers les fins, et rend pour chaque fin atteinte un parcours rejouable (la liste des ordres, avec la graine).
//
// Ce n'est PAS une preuve d'impossibilité : une fin non trouvée l'est « avec ces hypothèses et ce budget » (voir `arret` et
// `hypotheses` du rapport). Hypothèses : les combats sont gagnés, les achats et l'équipement ne sont pas simulés, la saisie
// libre n'est pas jouée, les repos courts sont ignorés, les points de vie ne comptent pas dans l'identité d'un état.
//
// La recherche : d'abord guidée (meilleur score d'abord : progression, avancement des fins, ancêtres des fins) ; si une première tranche d'états n'a pas
// trouvé toutes les fins, un « squelette » (voir `squelette`) trace des paliers vers le progrès le plus proche, et la recherche guidée repart de tous.
// Un état déjà vu se reconnaît par `cleRecherche` (sans le bruit des conversations), pas par `cleEtat` (l'identité complète).
import { evaluerCondition, momentDe, type EtatMonde } from '../monde/etat';
import { grapheDependancesFin } from '../monde/graphes';
import { indexerReferences, refsCondition } from '../monde/references';
import type { Condition, DonneesMonde } from '../monde/schemas';
import { creerMoteur, type Moteur } from '../noyau/moteur';
import type { ContexteJeu, Ordre, Partie, Proposition } from '../noyau/types';
import { MODULES_STANDARD } from '../modules';
import type { Personnage } from '../personnage';
import { bonneReponse, groupeDeTest } from './enigmes';

export interface OptionsParcours {
  /** Les graines essayées, une après l'autre, tant qu'il reste des fins à trouver. */
  graines?: number[];
  /**
   * Le poids du guidage par « ancêtres » (ce dont dépend une fin) pour chaque graine, dans le même ordre. Par défaut : 0 pour la
   * première (recherche large, guidée seulement par la condition des fins), 4 pour les suivantes (suit les prérequis des fins).
   * Deux stratégies valent mieux qu'une : chacune trouve des fins que l'autre manque (Citadelle d'un côté, Val de l'autre).
   */
  poidsAncetres?: number[];
  niveau?: number;
  /** Nombre d'états explorés au plus, par graine. */
  budgetEtats?: number;
  /** Durée totale au plus, en millisecondes. */
  budgetMs?: number;
  /** Nombre d'ordres au plus dans un parcours. */
  profondeurMax?: number;
  /** Continuer d'explorer quand toutes les fins sont trouvées, pour voir ce que le joueur automatique atteint (couverture). */
  couvrir?: boolean;
  /**
   * Nombre d'états en attente d'exploration au plus : au-delà, on élague les moins prometteurs (le score le plus bas). Sans ce plafond,
   * la file garde une copie de partie par état généré et la mémoire explose sur les grands mondes (couverture). 40 000 par défaut, 4 000 avec `couvrir`.
   */
  frontiereMax?: number;
  /** Le groupe joué (par défaut : le groupe conseillé du créateur). */
  groupe?: Personnage[];
  /** Le carnet de campagne injecté au départ (F5) : pour jouer et prouver les échos qu'un épisode lit. Sans lui, un groupe sans carnet. */
  campagne?: readonly string[];
  /**
   * Chercher d'abord un « squelette » (défaut : oui) : un chemin par paliers, en largeur, qui va à chaque fois vers le plus proche progrès
   * (un lieu jamais vu, un fait, un drapeau, un objet, une quête dont une fin dépend), puis seulement la recherche guidée, à partir de tous
   * les paliers. Sans lui, la recherche guidée s'épuise à faire tout ce qui est faisable près du départ avant de descendre (la Tombe, 540 s
   * sans une fin) ; `false` redonne l'ancienne recherche.
   */
  squelette?: boolean;
  /** Nombre d'états que la recherche guidée explore seule avant de lancer le squelette (1 000 par défaut ; 0 : le squelette d'abord). */
  trancheAvantSquelette?: number;
  /**
   * Jouer aussi chaque QUÊTE (F3, 20/11/2026) : la recherche ne s'arrête que quand toutes les fins ET toutes les quêtes ont un parcours qui les termine (ou que le
   * budget est épuisé). Le rapport donne alors `quetes` : un parcours rejouable par quête prouvée, et celles qu'il n'a pas pu terminer (avec ce budget : pas une preuve
   * d'impossibilité). Absent : le comportement d'avant, qui ne cherche que les fins.
   */
  quetes?: boolean | string[];
  /** Avec `quetes` : ne chercher que les quêtes (les fins ne guident ni n'arrêtent la recherche). Le jeu s'arrête toujours à une fin : un parcours de quête ne la dépasse pas. */
  sansFins?: boolean;
  /** Appelé de temps en temps (états explorés, fins trouvées) ; renvoyer `true` pour arrêter. */
  progres?: (p: { etats: number; fins: string[]; ms: number }) => boolean | void;
}

export interface EtapeParcours {
  /** Ce que le joueur a cliqué. */
  libelle: string;
  ordre: Ordre;
  /** Où le groupe se trouve après. */
  lieu: string;
}

export interface Parcours {
  fin: string;
  graine: number;
  niveau: number;
  /** Le carnet avec lequel ce parcours a été joué (absent : sans carnet) ; `rejouer` le reçoit pour refaire le même chemin. */
  campagne?: string[];
  etapes: EtapeParcours[];
}

export type CategorieCouverture = 'lieux' | 'pnj' | 'rencontres' | 'evenements' | 'faits' | 'enigmes' | 'quetes' | 'fins';

export interface RapportExploration {
  /** Le plus court parcours trouvé pour chaque fin atteinte. */
  parcours: Parcours[];
  finsNonAtteintes: string[];
  /** Avec l'option `quetes` : un parcours par quête terminée (`fin` = l'identifiant de la quête) et les quêtes que la recherche n'a pas terminées. */
  quetes?: { prouvees: Parcours[]; nonProuvees: string[] };
  /** Pourquoi la recherche s'est arrêtée : `toutes-atteintes`, `epuise` (plus d'état à explorer), `budget`, `temps`, `arret` (demandé). */
  arret: 'toutes-atteintes' | 'epuise' | 'budget' | 'temps' | 'arret';
  etats: number;
  ms: number;
  /** Ce que l'exploration a vu et n'a jamais vu (sur les états explorés : partiel si le budget est épuisé). */
  couverture: Record<CategorieCouverture, { vus: string[]; jamais: string[] }>;
  hypotheses: string[];
}

export const HYPOTHESES = [
  'Les combats sont supposés gagnés (la rencontre se règle en victoire).',
  'Les achats, ventes et changements d’équipement ne sont pas simulés.',
  'La saisie libre (le conteur) n’est pas jouée ; les énigmes sont résolues avec la bonne réponse.',
  'Les repos courts sont ignorés ; les points de vie et ressources ne comptent pas dans l’identité d’un état.',
  'Un jet raté est retenté (jusqu’à 4 fois) ; la première issue qui change l’état est gardée.',
];

/** Les états que la recherche guidée explore seule avant de lancer le squelette (un monde qu'elle résout en moins de cet effort n'en a pas besoin). */
const TRANCHE_AVANT_SQUELETTE = 1_000;

/** Les commandes qui ne font pas avancer l'histoire : l'explorateur ne les joue pas. */
const BRUIT = new Set([
  'commencer', 'retirerEquipement', 'equiper', 'lancerSort', 'imposerLesMains', 'utiliserObjet', 'confierPotion', 'rendrePotion', 'regarder', 'identifierObjet', 'voirObjet',
  'jeterObjet', 'acheter', 'vendre', 'revoirScene', 'saisie', 'raconter', 'testLibre', 'indiceEnigme', 'repondreEnPersonnage',
]);

/** Événements qui peuvent changer le groupe lui-même (points de vie, ressources, niveau) : on le copie alors, sinon on le partage. */
const CHANGE_LE_GROUPE = new Set(['pvChange', 'ressourceChange', 'xp']);

// ---------------------------------------------------------------------------
// Identité d'un état
// ---------------------------------------------------------------------------

/**
 * JSON canonique : deux états logiquement égaux donnent le même texte, quel que soit l'ordre d'insertion des clés ou l'ordre
 * dans lequel on a appris les faits (un tableau de textes ou de nombres est un ensemble : il est trié).
 */
function stable(x: unknown): string {
  if (Array.isArray(x)) {
    const simples = x.every((v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean');
    return `[${(simples ? [...x].sort() : x).map(stable).join(',')}]`;
  }
  if (x && typeof x === 'object') {
    return `{${Object.keys(x)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable((x as Record<string, unknown>)[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(x) ?? 'null';
}

/**
 * L'identité logique d'un état : où l'on est, ce que l'on sait, ce que l'on porte, ce qui est fait. Elle ignore ce qui change
 * à chaque pas sans rien décider (journal, points de vie, XP, narrations, heure exacte : seulement le moment de la journée, celui que lit le moteur,
 * `momentDe` : jour, soir ou nuit ; avant, 0 h à 5 h comptaient pour du jour).
 */
export function cleEtat(p: Partie): string {
  const e = p.etat;
  const { codex: _codex, ...modules } = p.modules as Record<string, unknown>;
  return stable([
    e.lieu,
    p.scene,
    e.niveauGroupe,
    e.fin ?? '',
    Math.min(e.jour, 8),
    momentDe(e.heure),
    Object.entries(e.flags).filter(([, v]) => v).map(([k]) => k),
    e.faits,
    e.jauges,
    e.reputations,
    e.attitudes,
    e.pnjEtats,
    e.pnjLieux,
    e.escortes ?? [],
    e.inventaire,
    e.pieces,
    e.quetes,
    e.lieuxVisites,
    e.debloques,
    e.rencontresFaites,
    e.rencontresEnAttente ?? [],
    e.evenementsJoues,
    p.etat.exploration,
    modules,
  ]);
}

/**
 * Ce que le monde lit vraiment, pour ne pas compter comme différents deux états qui ne se distinguent que par du bruit : les sujets de
 * conversation qui ne changent rien (ni effet ni fait révélé, hors PNJ cités par une condition « parle »), les seuils d'attitude de chaque PNJ
 * (une attitude de 12 ou de 15 est la même si aucune condition ne sépare 12 de 15).
 */
export interface Pertinence {
  sujetsUtiles: Set<string>;
  seuils: Map<string, number[]>;
}

export function pertinenceDe(dm: DonneesMonde): Pertinence {
  const parle = new Set<string>();
  const seuils = new Map<string, Set<number>>();
  const noter = (pnj: string, n: number) => (seuils.get(pnj) ?? seuils.set(pnj, new Set()).get(pnj)!).add(n);
  // Tout ce qui lit une attitude ou « parle », où que ce soit dans les données : conditions, sujets, secrets, fiches de savoir…
  const marcher = (x: unknown, proprietaire?: string): void => {
    if (!x || typeof x !== 'object') return;
    if (Array.isArray(x)) return x.forEach((y) => marcher(y, proprietaire));
    const o = x as Record<string, unknown>;
    if (typeof o['parle'] === 'string') parle.add(o['parle']);
    const pnj = o['pnj'];
    if (pnj && typeof pnj === 'object') {
      const q = pnj as Record<string, unknown>;
      if (typeof q['id'] === 'string') for (const k of ['attitudeMin', 'attitudeMax']) if (typeof q[k] === 'number') noter(q['id'], q[k] as number);
    }
    if (proprietaire && typeof o['attitudeMin'] === 'number') noter(proprietaire, o['attitudeMin']);
    for (const v of Object.values(o)) marcher(v, proprietaire);
  };
  for (const p of dm.pnj.values()) marcher(p, p.id);
  for (const grande of [dm.lieux, dm.quetes, dm.evenements, dm.fins, dm.rencontres, dm.tresors, dm.pieges, dm.enigmes]) for (const e of grande.values()) marcher(e);
  for (const [dossier, fiches] of Object.entries(dm.extensions ?? {})) for (const f of fiches as unknown[]) marcher(f, dossier === 'savoirs' ? String((f as { pnj?: unknown }).pnj) : undefined);
  const sujetsUtiles = new Set<string>();
  for (const p of dm.pnj.values()) for (const s of p.sujets) if (s.effets.length || s.revele.length || parle.has(p.id)) sujetsUtiles.add(`${p.id}:${s.id}`);
  return { sujetsUtiles, seuils: new Map([...seuils].map(([k, v]) => [k, [...v].sort((a, b) => a - b)])) };
}

/**
 * Les faits, drapeaux, objets, quêtes et étapes qu'une condition du monde exige ABSENTS (sous un « non ») : une option qui n'est ouverte qu'à qui n'a
 * pas informé Martin, par exemple. Le squelette ne les prend pas pour un progrès : sinon il ferait justement ce qui ferme cette voie.
 */
export function atomesAEviter(dm: DonneesMonde): Set<string> {
  const evites = new Set<string>();
  const marcher = (x: unknown): void => {
    if (!x || typeof x !== 'object') return;
    if (Array.isArray(x)) return x.forEach(marcher);
    const o = x as Record<string, unknown>;
    if (o['non'] && typeof o['non'] === 'object') refsCondition(o['non'] as Condition, (genre, id, extra) => evites.add(`${genre}:${id}${extra ? `/${extra}` : ''}`));
    for (const v of Object.values(o)) marcher(v);
  };
  for (const grande of [dm.pnj, dm.lieux, dm.quetes, dm.evenements, dm.fins, dm.rencontres, dm.tresors, dm.pieges, dm.enigmes]) for (const e of grande.values()) marcher(e);
  for (const fiches of Object.values(dm.extensions ?? {})) marcher(fiches);
  return evites;
}

/**
 * La clé que la recherche utilise pour reconnaître un état déjà vu : celle de `cleEtat`, sans ce qui ne décide rien (la mémoire du tirage
 * d'arrivée, les interjections déjà dites, les sujets de conversation sans effet, les dates exactes des tentatives d'influence : on garde seulement
 * lesquelles ont eu lieu) et avec les attitudes rangées par tranche entre les seuils que le monde lit.
 */
export function cleRecherche(p: Partie, pert: Pertinence): string {
  const e = p.etat;
  const { codex: _codex, interjections: _interjections, ...modules } = p.modules as Record<string, unknown>;
  const { hasard: _hasard, influenceRatee, sujetsVus, ...exploration } = e.exploration as typeof e.exploration & { hasard?: unknown };
  const attitudes: Record<string, number> = {};
  for (const [id, v] of Object.entries(e.attitudes)) attitudes[id] = (pert.seuils.get(id) ?? []).filter((t) => t <= v).length;
  return stable([
    e.lieu,
    p.scene,
    e.niveauGroupe,
    e.fin ?? '',
    Math.min(e.jour, 8),
    momentDe(e.heure),
    Object.entries(e.flags).filter(([, v]) => v).map(([k]) => k),
    e.faits,
    e.jauges,
    e.reputations,
    attitudes,
    e.pnjEtats,
    e.pnjLieux,
    e.escortes ?? [],
    e.inventaire,
    e.pieces,
    e.quetes,
    e.lieuxVisites,
    e.debloques,
    e.rencontresFaites,
    e.rencontresEnAttente ?? [],
    e.evenementsJoues,
    exploration,
    sujetsVus.filter((x) => pert.sujetsUtiles.has(x)),
    Object.keys(influenceRatee ?? {}),
    modules,
  ]);
}

// ---------------------------------------------------------------------------
// Guidage : l'avancement vers les fins
// ---------------------------------------------------------------------------

/** Avancement d'une condition, de 0 à 1 : `et` fait la moyenne de ses parties, `ou` prend la meilleure. */
export function avancement(c: Condition, p: Partie): number {
  if ('et' in c) return c.et.reduce((s, x) => s + avancement(x, p), 0) / c.et.length;
  if ('ou' in c) return Math.max(...c.ou.map((x) => avancement(x, p)));
  if (evaluerCondition(c, p.etat)) return 1;
  // Une jauge à atteindre se remplit petit à petit : sans cette pente, le guidage ne distingue pas le jour 1 du jour 9 et ne la monte jamais.
  if ('jauge' in c && c.jauge.min !== undefined && c.jauge.min > 0) return Math.min(0.95, Math.max(0, (p.etat.jauges[c.jauge.id] ?? 0) / c.jauge.min));
  return 0;
}

/** Un maillon des « ancêtres » d'une fin : ce que le monde exige, de proche en proche, pour qu'elle arrive. */
interface Ancetre {
  genre: string;
  id: string;
}

/** Les faits, drapeaux, objets, quêtes et étapes dont dépend une fin, en remontant les conditions de ce qui les produit (jusqu'à 4 niveaux). */
function ancetresDe(moteur: Moteur, finId: string, index: ReturnType<typeof indexerReferences>): Ancetre[] {
  const g = grapheDependancesFin(moteur.ctx.dm, index, finId, { profondeur: 4, max: 400 });
  return g.noeuds.flatMap((n) => (n.ref && ['fait', 'flag', 'objet', 'quete', 'etape'].includes(n.ref.genre) ? [n.ref] : []));
}

/** Ce dont dépend l'accomplissement des étapes d'une quête (faits, drapeaux, objets) : le squelette y va, comme aux ancêtres d'une fin. */
function ancetresDeQuete(dm: DonneesMonde, quete: string): Ancetre[] {
  const res: Ancetre[] = [];
  for (const e of dm.quetes.get(quete)?.etapes ?? []) refsCondition(e.completion, (genre, id) => { if (genre === 'fait' || genre === 'flag' || genre === 'objet') res.push({ genre, id }); });
  return res;
}

function ancetreAtteint(a: Ancetre, e: EtatMonde): boolean {
  switch (a.genre) {
    case 'fait': return e.faits.includes(a.id);
    case 'flag': return !!e.flags[a.id];
    case 'objet': return (e.inventaire[a.id] ?? 0) > 0;
    case 'quete': return !!e.quetes[a.id];
    case 'etape': {
      const [q, et] = a.id.split('/');
      return !!q && !!et && !!e.quetes[q]?.accomplies.includes(et);
    }
    default: return false;
  }
}

/** Tout ce qui compte pour avancer : plus il y en a, mieux c'est (l'histoire ne revient pas en arrière). */
function progression(p: Partie): number {
  const e = p.etat;
  let n = Object.values(e.flags).filter(Boolean).length + e.faits.length + e.lieuxVisites.length + e.evenementsJoues.length + e.rencontresFaites.length + e.debloques.length + Object.keys(e.inventaire).length;
  for (const q of Object.values(e.quetes)) n += q.accomplies.length + (q.statut === 'terminee' ? 2 : 0);
  return n;
}

// ---------------------------------------------------------------------------
// Les actions d'un état
// ---------------------------------------------------------------------------

interface Action {
  ordre: Ordre;
  libelle: string;
}

function actionsDe(moteur: Moteur, p: Partie): Action[] {
  const { dm, srd } = moteur.ctx;
  const res: Action[] = [];
  const vus = new Set<string>();
  const ajouter = (ordre: Ordre, libelle: string) => {
    const k = stable(ordre);
    if (!vus.has(k)) (vus.add(k), res.push({ ordre, libelle }));
  };
  for (const prop of moteur.propositions(p) as Proposition[]) {
    if (prop.desactivee) continue;
    if (prop.intention === 'combattre') {
      // Le client règle le combat lui-même : ici on le suppose gagné, avec les PX de ses monstres.
      if (p.scene.type !== 'rencontre') continue;
      const r = dm.rencontres.get(p.scene.rencontre);
      const px = r ? r.monstres.reduce((n, m) => n + (srd?.monstres.get(m.profil)?.px ?? 0) * m.nombre, 0) : 0;
      ajouter({ type: 'reglerRencontre', issue: 'victoire', px }, prop.libelle);
      continue;
    }
    // Préparer ses sorts se joue dans l'écran du client : le joueur automatique ne s'en occupe pas.
    if (prop.intention === 'preparer') continue;
    const base = prop.ordre;
    if (!base || BRUIT.has(base.type)) continue;
    if (base.type === 'seReposer' && base.duree === 'court') continue;
    // Une énigme : la bonne réponse, par le formulaire (séquence, cadran, leviers, placement) ou par le champ de texte (mot de passe, déduction).
    if (base.type === 'repondreEnigme') {
      const e = dm.enigmes.get(String(base.enigme));
      const r = e ? bonneReponse(prop, e) : undefined;
      const champ = prop.formulaire?.champ ?? prop.saisie?.champ;
      if (r && 'reponse' in r && r.reponse !== undefined && champ) ajouter({ ...base, [champ]: r.reponse }, prop.libelle);
      continue;
    }
    if (prop.saisie || prop.formulaire) continue;
    if (prop.choix) {
      for (const o of prop.choix.options.filter((x) => !x.desactivee).slice(0, 6)) ajouter({ ...base, [prop.choix.champ]: o.valeur }, `${prop.libelle} — ${o.libelle}`);
      continue;
    }
    ajouter(base, prop.libelle);
  }
  return res;
}

// ---------------------------------------------------------------------------
// La recherche
// ---------------------------------------------------------------------------

interface Noeud {
  /** L'état de la partie ; libéré (null) une fois le nœud exploré : seul son lieu reste, pour afficher le chemin. */
  partie: Partie | null;
  /** Le lieu après l'action (le chemin n'a plus besoin de la partie entière). */
  lieu: string;
  parent: Noeud | null;
  /** Ce qui a été joué pour arriver ici : l'action, et chaque nouvel essai d'un jet raté (le parcours doit les rejouer tous : les dés avancent). */
  actions: Action[];
  profondeur: number;
  score: number;
  ordreArrivee: number;
}

/** File de priorité : meilleur score d'abord ; à score égal, le moins profond (on explore un plateau en largeur) ; puis le plus ancien. */
interface Prioritaire {
  score: number;
  profondeur: number;
  ordreArrivee: number;
}

class File<T extends Prioritaire = Noeud> {
  private tas: T[] = [];
  get taille() {
    return this.tas.length;
  }
  private avant(a: T, b: T) {
    return a.score !== b.score ? a.score > b.score : a.profondeur !== b.profondeur ? a.profondeur < b.profondeur : a.ordreArrivee < b.ordreArrivee;
  }
  /** Garde les `max` meilleurs nœuds quand la file dépasse `2 × max` ; renvoie le nombre de nœuds jetés (un tableau trié du meilleur au pire est un tas valide). */
  elaguer(max: number): number {
    if (this.tas.length <= 2 * max) return 0;
    this.tas.sort((a, b) => (this.avant(a, b) ? -1 : this.avant(b, a) ? 1 : 0));
    const jetes = this.tas.length - max;
    this.tas.length = max;
    return jetes;
  }
  pousser(n: T) {
    const t = this.tas;
    t.push(n);
    for (let i = t.length - 1; i > 0; ) {
      const p = (i - 1) >> 1;
      if (!this.avant(t[i]!, t[p]!)) break;
      [t[i], t[p]] = [t[p]!, t[i]!];
      i = p;
    }
  }
  prendre(): T | undefined {
    const t = this.tas;
    const haut = t[0];
    const dernier = t.pop();
    if (t.length && dernier) {
      t[0] = dernier;
      for (let i = 0; ; ) {
        const g = 2 * i + 1;
        const d = g + 1;
        let m = i;
        if (g < t.length && this.avant(t[g]!, t[m]!)) m = g;
        if (d < t.length && this.avant(t[d]!, t[m]!)) m = d;
        if (m === i) break;
        [t[i], t[m]] = [t[m]!, t[i]!];
        i = m;
      }
    }
    return haut;
  }
}

function cheminDe(n: Noeud): EtapeParcours[] {
  const etapes: EtapeParcours[] = [];
  for (let c: Noeud | null = n; c?.parent; c = c.parent) for (let i = c.actions.length - 1; i >= 0; i--) etapes.push({ libelle: c.actions[i]!.libelle, ordre: c.actions[i]!.ordre, lieu: c.lieu });
  return etapes.reverse();
}

/** Joue une action depuis un état : un jet raté ne change rien, on retente (les dés avancent avec la graine) jusqu'à 4 fois. */
function jouerAction(moteur: Moteur, partieN: Partie, action: Action, cle: (p: Partie) => string, avant: string): { enfant: Partie; essais: Action[] } | undefined {
  let res = moteur.executer(partieN, action.ordre);
  if (res.refus) return undefined;
  const essais: Action[] = [action];
  for (let essai = 0; essai < 4 && cle(res.partie) === avant && res.evenements.some((x) => x.type === 'jet'); essai++) {
    const r = moteur.executer(res.partie, action.ordre);
    if (r.refus) break;
    res = r;
    essais.push({ ordre: action.ordre, libelle: `${action.libelle} (nouvel essai)` });
  }
  const enfant = res.partie;
  // Le groupe ne change que si un événement l'annonce : sinon on partage celui du parent (mémoire).
  if (!res.evenements.some((x) => CHANGE_LE_GROUPE.has(x.type))) enfant.groupe = partieN.groupe;
  enfant.journal = [];
  return { enfant, essais };
}

const finDe = (p: Partie): string | undefined => p.etat.fin ?? (p.scene.type === 'fin' ? p.scene.fin : undefined);

/** La carte des lieux comme le moteur la propose (liens, double sens en face, parent, enfants), sans les conditions : pour mesurer des distances. */
function voisinsDesLieux(dm: DonneesMonde): Map<string, string[]> {
  const v = new Map<string, Set<string>>();
  const relier = (de: string, vers: string) => {
    if (dm.lieux.has(de) && dm.lieux.has(vers)) (v.get(de) ?? v.set(de, new Set()).get(de)!).add(vers);
  };
  for (const l of dm.lieux.values()) {
    if (l.parent) (relier(l.id, l.parent), relier(l.parent, l.id));
    for (const k of l.liens) (relier(l.id, k.vers), k.sens === 'double' && relier(k.vers, l.id));
  }
  return new Map([...v].map(([k, x]) => [k, [...x]]));
}

/** Le nombre de passages d'ici au plus proche lieu jamais visité (0 s'il n'y en a aucun à portée : plus rien à guider). */
function distanceAuxInconnus(voisins: Map<string, string[]>, depuis: string, visites: Set<string>): number {
  const dist = new Map<string, number>([[depuis, 0]]);
  const file = [depuis];
  for (let i = 0; i < file.length; i++) {
    const l = file[i]!;
    if (!visites.has(l)) return dist.get(l)!;
    for (const v of voisins.get(l) ?? []) if (!dist.has(v)) (dist.set(v, dist.get(l)! + 1), file.push(v));
  }
  return 0;
}

/** Une action à jouer depuis un état, pas encore jouée : sa priorité est prédite (un déplacement se mesure à sa destination, le reste ne change pas de lieu). */
interface Candidat extends Prioritaire {
  parent: Partie;
  cleParent: string;
  action: Action;
  /** Ce qui a été joué depuis le début du palier jusqu'au parent. */
  avant: Action[];
}

/**
 * Le squelette : à partir de l'état initial, des paliers. Chaque palier est une recherche depuis l'état du palier précédent, qui s'arrête au
 * premier état où le progrès a augmenté (un lieu jamais vu de plus, ou un ancêtre d'une fin de plus : fait, drapeau, objet, quête, étape). Elle va
 * d'abord vers ce qui rapproche d'un lieu jamais vu (à égalité, le moins profond) : elle traverse la carte au lieu de s'étaler sur toutes les façons
 * d'ordonner des conversations, et chaque palier repart d'une table rase. Une action n'est jouée que quand elle est dépilée : sa priorité est
 * prédite d'après sa destination, ce qui évite de jouer toutes les suites de chaque état. Rend les nœuds des paliers (chaînés par `parent`) et appelle
 * `surFin` pour chaque fin rencontrée en chemin (un état de fin n'est pas prolongé).
 */
function squelette(
  moteur: Moteur,
  racine: Noeud,
  ancetres: Ancetre[],
  cle: (p: Partie) => string,
  limites: { etatsParPalier: number; /** Le temps ou le budget d'états est épuisé : le squelette s'arrête. */ enMs: () => boolean },
  surFin: (fin: string, noeud: Noeud) => void,
  compter: () => void,
): Noeud[] {
  const { dm } = moteur.ctx;
  const voisins = voisinsDesLieux(dm);
  const progres = (p: Partie) => p.etat.lieuxVisites.length + ancetres.filter((a) => ancetreAtteint(a, p.etat)).length;
  const paliers: Noeud[] = [];
  let courant = racine;
  let ordre = racine.ordreArrivee + 1;
  const dejaFins = new Set<string>();
  while (!limites.enMs()) {
    const base = courant.partie!;
    const but = progres(base);
    const file = new File<Candidat>();
    const connus = new Set<string>([cle(base)]);
    let numero = 0;
    const developper = (partie: Partie, avant: Action[]) => {
      const cleParent = cle(partie);
      const visites = new Set(partie.etat.lieuxVisites);
      const ici = distanceAuxInconnus(voisins, partie.etat.lieu, visites);
      for (const action of actionsDe(moteur, partie)) {
        const vers = action.ordre.type === 'aller' ? (action.ordre as { vers?: string }).vers : undefined;
        const h = vers ? distanceAuxInconnus(voisins, vers, visites) : ici;
        file.pousser({ parent: partie, cleParent, action, avant, profondeur: avant.length + 1, score: -h, ordreArrivee: numero++ });
      }
    };
    developper(base, []);
    let suivant: Noeud | undefined;
    let explores = 0;
    while (file.taille && explores < limites.etatsParPalier && !suivant && !limites.enMs()) {
      const c = file.prendre()!;
      const j = jouerAction(moteur, c.parent, c.action, cle, c.cleParent);
      if (!j) continue;
      explores++;
      compter();
      const actions = [...c.avant, ...j.essais];
      const fin = finDe(j.enfant);
      if (fin) {
        if (!dejaFins.has(fin)) {
          dejaFins.add(fin);
          surFin(fin, { partie: j.enfant, lieu: j.enfant.etat.lieu, parent: courant, actions, profondeur: courant.profondeur + actions.length, score: 0, ordreArrivee: ordre++ });
        }
        continue;
      }
      const k = cle(j.enfant);
      if (connus.has(k)) continue;
      connus.add(k);
      if (progres(j.enfant) > but) {
        suivant = { partie: j.enfant, lieu: j.enfant.etat.lieu, parent: courant, actions, profondeur: courant.profondeur + actions.length, score: 0, ordreArrivee: ordre++ };
        break;
      }
      developper(j.enfant, actions);
    }
    if (!suivant) break;
    paliers.push(suivant);
    courant = suivant;
  }
  return paliers;
}

/** Rejoue des ordres depuis le début d'une partie ; sert à vérifier un parcours et à l'afficher pas à pas. */
export function rejouer(moteur: Moteur, groupe: Personnage[], graine: number, niveau: number, ordres: Ordre[], campagne?: readonly string[]): { partie: Partie; refus?: string } {
  let partie = moteur.executer(moteur.nouvellePartie(groupe, { graine, niveau, ...(campagne?.length ? { campagne } : {}) }), { type: 'commencer' }).partie;
  for (const o of ordres) {
    const r = moteur.executer(partie, o);
    if (r.refus) return { partie, refus: `${o.type} : ${r.refus}` };
    partie = r.partie;
  }
  return { partie };
}

const maintenant = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/** Le groupe que joue le parcours : celui des options, sinon le groupe conseillé au niveau du monde (ou de l'option `niveau`). */
export function groupeDuParcours(ctx: ContexteJeu, opts: Pick<OptionsParcours, 'groupe' | 'niveau'>): Personnage[] {
  if (opts.groupe) return opts.groupe;
  if (!ctx.srd) throw new Error('explorerParcours : il faut le SRD (ctx.srd) ou un groupe.');
  return groupeDeTest(ctx.srd, opts.niveau ?? ctx.dm.monde.niveaux.min);
}

export function explorerParcours(ctx: ContexteJeu, opts: OptionsParcours = {}): RapportExploration {
  const moteur = creerMoteur(ctx, MODULES_STANDARD);
  const { dm } = ctx;
  const groupe = groupeDuParcours(ctx, opts);
  const niveau = opts.niveau ?? dm.monde.niveaux.min;
  const carnet = opts.campagne?.length ? { campagne: [...opts.campagne] } : {};
  const graines = opts.graines ?? [7, 21];
  const poidsAncetres = opts.poidsAncetres ?? graines.map((_, i) => (i === 0 ? 0 : 4));
  const budgetEtats = opts.budgetEtats ?? 6000;
  const budgetMs = opts.budgetMs ?? 60_000;
  const profondeurMax = opts.profondeurMax ?? 400;
  // Le mode couvrant ne s'arrête pas aux fins : il explore jusqu'au budget, et sur un grand monde la mémoire (3 à 4 Go pour 6 000 nœuds sur la Marche) l'emporte ; plafond plus étroit par défaut.
  const frontiereMax = opts.frontiereMax ?? (opts.couvrir ? 4_000 : 40_000);
  let elagues = 0;
  const depart = maintenant();
  const couvrir = opts.couvrir ?? false;

  const fins = opts.sansFins ? [] : [...dm.fins.values()];
  const pertinence = pertinenceDe(dm);
  const aEviter = atomesAEviter(dm);
  const trouvees = new Map<string, Parcours>();
  // Les quêtes à terminer (option `quetes`) : leur parcours, comme celui des fins.
  const objectifsQuetes = Array.isArray(opts.quetes) ? opts.quetes.filter((id) => dm.quetes.has(id)) : opts.quetes ? [...dm.quetes.keys()] : [];
  const quetesTrouvees = new Map<string, Parcours>();
  const toutTrouve = () => trouvees.size === fins.length && quetesTrouvees.size === objectifsQuetes.length;
  const noterQuetes = (p: Partie, noeud: Noeud, graine: number) => {
    for (const id of objectifsQuetes) if (!quetesTrouvees.has(id) && p.etat.quetes[id]?.statut === 'terminee') quetesTrouvees.set(id, { fin: id, graine, niveau, ...carnet, etapes: cheminDe(noeud) });
  };
  const vus = { lieux: new Set<string>(), pnj: new Set<string>(), rencontres: new Set<string>(), evenements: new Set<string>(), faits: new Set<string>(), enigmes: new Set<string>(), quetes: new Set<string>() };
  let etats = 0;
  let arret: RapportExploration['arret'] = 'epuise';
  let arretGlobal = false;

  const noter = (p: Partie) => {
    for (const l of p.etat.lieuxVisites) vus.lieux.add(l);
    vus.lieux.add(p.etat.lieu);
    if (p.scene.type === 'dialogue') vus.pnj.add(p.scene.pnj);
    for (const r of p.etat.rencontresFaites) vus.rencontres.add(r);
    for (const e of p.etat.evenementsJoues) vus.evenements.add(e);
    for (const f of p.etat.faits) vus.faits.add(f);
    for (const [id, s] of Object.entries(p.etat.exploration.enigmes ?? {})) if (s === 'resolue') vus.enigmes.add(id);
    for (const [id, q] of Object.entries(p.etat.quetes)) if (q.statut === 'terminee') vus.quetes.add(id);
  };

  for (const [numero, graine] of graines.entries()) {
    const poids = poidsAncetres[numero] ?? 4;
    if ((!couvrir && toutTrouve()) || arretGlobal) break;
    const file = new File();
    const connus = new Set<string>();
    let ordreArrivee = 0;
    const cle = (p: Partie) => cleRecherche(p, pertinence);
    // Les ancêtres des fins pas encore trouvées : chaque ancêtre atteint vaut quelques points (on suit les conditions de ce qui produit la fin).
    const indexRefs = indexerReferences(dm);
    const ancetresParFin = new Map(fins.map((f) => [f.id, ancetresDe(moteur, f.id, indexRefs)]));
    const initiale = moteur.executer(moteur.nouvellePartie(groupe, { graine, niveau, ...carnet }), { type: 'commencer' }).partie;
    initiale.journal = [];
    const evaluer = (p: Partie): number => {
      let s = progression(p);
      const ancetres = new Map<string, Ancetre>();
      for (const f of fins) {
        if (trouvees.has(f.id)) continue;
        s += 25 * avancement(f.condition, p);
        for (const a of ancetresParFin.get(f.id) ?? []) ancetres.set(`${a.genre}:${a.id}`, a);
      }
      for (const a of ancetres.values()) if (ancetreAtteint(a, p.etat)) s += poids;
      // Les quêtes pas encore terminées : chaque étape accomplie compte (l'avancement d'une quête n'est pas dans les conditions des fins).
      for (const id of objectifsQuetes) {
        if (quetesTrouvees.has(id)) continue;
        const q = p.etat.quetes[id];
        if (q) s += (q.statut === 'active' ? 16 : q.statut === 'proposee' ? 8 : 0) + 25 * q.accomplies.length;
      }
      return s;
    };
    const racine: Noeud = { partie: initiale, lieu: initiale.etat.lieu, parent: null, actions: [], profondeur: 0, score: evaluer(initiale), ordreArrivee: ordreArrivee++ };
    connus.add(cle(initiale));
    file.pousser(racine);
    let etatsGraine = 0;
    // Le squelette (voir `squelette`) : des paliers vers le progrès le plus proche, dont la recherche guidée repart ensuite (le dernier d'abord, puis, quand
    // il est épuisé, les précédents : on retrouve ainsi une autre branche, une autre fin). Il ne se lance que si la première tranche de la recherche
    // guidée n'a pas suffi : un monde qu'elle résout vite ne paie rien, un monde où elle s'étale (la Tombe : 540 s sans une fin) est sauvé par lui.
    let squeletteFait = opts.squelette === false;
    const tranche = Math.min(budgetEtats, opts.trancheAvantSquelette ?? TRANCHE_AVANT_SQUELETTE);
    const lancerSquelette = () => {
      squeletteFait = true;
      const ancetres = new Map<string, Ancetre>();
      for (const f of fins) if (!trouvees.has(f.id)) for (const a of ancetresParFin.get(f.id) ?? []) if (!aEviter.has(`${a.genre}:${a.id}`)) ancetres.set(`${a.genre}:${a.id}`, a);
      for (const id of objectifsQuetes) if (!quetesTrouvees.has(id)) for (const a of ancetresDeQuete(dm, id)) if (!aEviter.has(`${a.genre}:${a.id}`)) ancetres.set(`${a.genre}:${a.id}`, a);
      // Le nœud de départ du squelette garde sa partie (celui de la recherche l'a libérée en étant exploré).
      const depart0: Noeud = { ...racine, partie: initiale, parent: null };
      const paliers = squelette(
        moteur,
        depart0,
        [...ancetres.values()],
        cle,
        { etatsParPalier: Math.min(budgetEtats, 2_500), enMs: () => maintenant() - depart > budgetMs * 0.6 || etatsGraine >= budgetEtats },
        (fin, noeud) => {
          noter(noeud.partie!);
          noterQuetes(noeud.partie!, noeud, graine);
          if (!trouvees.has(fin)) trouvees.set(fin, { fin, graine, niveau, ...carnet, etapes: cheminDe(noeud) });
        },
        // Les états du squelette comptent dans le budget de la graine et dans le total.
        () => {
          etats++;
          etatsGraine++;
        },
      );
      for (const pal of paliers) {
        const k = cle(pal.partie!);
        if (connus.has(k)) continue;
        connus.add(k);
        pal.score = evaluer(pal.partie!);
        noter(pal.partie!);
        noterQuetes(pal.partie!, pal, graine);
        file.pousser(pal);
      }
    };

    while (file.taille && !(!couvrir && toutTrouve())) {
      if (!squeletteFait && etatsGraine >= tranche) {
        lancerSquelette();
        if (!couvrir && toutTrouve()) break;
      }
      if (maintenant() - depart > budgetMs) {
        arret = 'temps';
        arretGlobal = true;
        break;
      }
      if (etatsGraine >= budgetEtats) {
        arret = 'budget';
        break;
      }
      const n = file.prendre()!;
      const partieN = n.partie!;
      etats++;
      etatsGraine++;
      noter(partieN);
      if (opts.progres && etats % 200 === 0 && opts.progres({ etats, fins: [...trouvees.keys()], ms: maintenant() - depart })) {
        arret = 'arret';
        arretGlobal = true;
        break;
      }
      if (n.profondeur >= profondeurMax) continue;

      const avant = cle(partieN);
      for (const action of actionsDe(moteur, partieN)) {
        const j = jouerAction(moteur, partieN, action, cle, avant);
        if (!j) continue;
        const { enfant, essais } = j;
        const finAtteinte = finDe(enfant);
        const cleEnfant = cle(enfant);
        const noeud: Noeud = { partie: enfant, lieu: enfant.etat.lieu, parent: n, actions: essais, profondeur: n.profondeur + 1, score: 0, ordreArrivee: ordreArrivee++ };
        noterQuetes(enfant, noeud, graine);
        if (finAtteinte) {
          noter(enfant);
          if (!trouvees.has(finAtteinte)) trouvees.set(finAtteinte, { fin: finAtteinte, graine, niveau, ...carnet, etapes: cheminDe(noeud) });
          if (!couvrir && toutTrouve()) break;
          continue;
        }
        if (connus.has(cleEnfant)) continue;
        connus.add(cleEnfant);
        noeud.score = evaluer(enfant);
        file.pousser(noeud);
      }
      if (!couvrir && toutTrouve()) {
        arret = 'toutes-atteintes';
        break;
      }
      // Ce nœud est exploré : sa partie (la plus grosse part de la mémoire) n'a plus d'usage ; la file est tenue sous son plafond.
      n.partie = null;
      elagues += file.elaguer(frontiereMax);
    }
    if (!couvrir && toutTrouve()) arret = 'toutes-atteintes';
    // Des états ont été jetés : « tous les états ont été explorés » ne serait plus vrai.
    if (elagues > 0 && arret === 'epuise') arret = 'budget';
  }

  const vusFins = new Set(trouvees.keys());
  const couvre = (tous: string[], v: Set<string>) => ({ vus: tous.filter((x) => v.has(x)), jamais: tous.filter((x) => !v.has(x)) });
  return {
    parcours: [...trouvees.values()],
    finsNonAtteintes: fins.map((f) => f.id).filter((id) => !trouvees.has(id)),
    ...(opts.quetes ? { quetes: { prouvees: [...quetesTrouvees.values()], nonProuvees: objectifsQuetes.filter((id) => !quetesTrouvees.has(id)) } } : {}),
    arret,
    etats,
    ms: Math.round(maintenant() - depart),
    couverture: {
      lieux: couvre([...dm.lieux.keys()], vus.lieux),
      pnj: couvre([...dm.pnj.keys()], vus.pnj),
      rencontres: couvre([...dm.rencontres.keys()], vus.rencontres),
      evenements: couvre([...dm.evenements.keys()], vus.evenements),
      faits: couvre([...dm.faits.keys()], vus.faits),
      enigmes: couvre([...dm.enigmes.keys()], vus.enigmes),
      quetes: couvre([...dm.quetes.keys()], vus.quetes),
      fins: couvre(fins.map((f) => f.id), vusFins),
    },
    hypotheses: HYPOTHESES,
  };
}
