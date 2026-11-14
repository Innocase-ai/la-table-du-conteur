// Le simulateur de parcours : un joueur automatique qui joue le VRAI moteur (propositions, ordres) pour répondre à la question
// que le validateur ne peut pas trancher : « cette fin peut-elle vraiment arriver ? ». Il explore l'espace des états du jeu,
// guidé vers les fins, et rend pour chaque fin atteinte un parcours rejouable (la liste des ordres, avec la graine).
//
// Ce n'est PAS une preuve d'impossibilité : une fin non trouvée l'est « avec ces hypothèses et ce budget » (voir `arret` et
// `hypotheses` du rapport). Hypothèses : les combats sont gagnés, les achats et l'équipement ne sont pas simulés, la saisie
// libre n'est pas jouée, les repos courts sont ignorés, les points de vie ne comptent pas dans l'identité d'un état.
import { evaluerCondition, type EtatMonde } from '../monde/etat';
import { grapheDependancesFin } from '../monde/graphes';
import { indexerReferences } from '../monde/references';
import type { Condition } from '../monde/schemas';
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
  /** Le groupe joué (par défaut : le groupe conseillé du créateur). */
  groupe?: Personnage[];
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
  etapes: EtapeParcours[];
}

export type CategorieCouverture = 'lieux' | 'pnj' | 'rencontres' | 'evenements' | 'faits' | 'enigmes' | 'quetes' | 'fins';

export interface RapportExploration {
  /** Le plus court parcours trouvé pour chaque fin atteinte. */
  parcours: Parcours[];
  finsNonAtteintes: string[];
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
 * à chaque pas sans rien décider (journal, points de vie, XP, narrations, heure exacte : seulement la tranche du jour).
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
    (e.heure ?? 8) < 18 ? 'j' : (e.heure ?? 8) < 22 ? 's' : 'n',
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

// ---------------------------------------------------------------------------
// Guidage : l'avancement vers les fins
// ---------------------------------------------------------------------------

/** Avancement d'une condition, de 0 à 1 : `et` fait la moyenne de ses parties, `ou` prend la meilleure. */
export function avancement(c: Condition, p: Partie): number {
  if ('et' in c) return c.et.reduce((s, x) => s + avancement(x, p), 0) / c.et.length;
  if ('ou' in c) return Math.max(...c.ou.map((x) => avancement(x, p)));
  return evaluerCondition(c, p.etat) ? 1 : 0;
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
  partie: Partie;
  parent: Noeud | null;
  /** Ce qui a été joué pour arriver ici : l'action, et chaque nouvel essai d'un jet raté (le parcours doit les rejouer tous : les dés avancent). */
  actions: Action[];
  profondeur: number;
  score: number;
  ordreArrivee: number;
}

/** File de priorité : meilleur score d'abord ; à score égal, le moins profond (on explore un plateau en largeur) ; puis le plus ancien. */
class File {
  private tas: Noeud[] = [];
  get taille() {
    return this.tas.length;
  }
  private avant(a: Noeud, b: Noeud) {
    return a.score !== b.score ? a.score > b.score : a.profondeur !== b.profondeur ? a.profondeur < b.profondeur : a.ordreArrivee < b.ordreArrivee;
  }
  pousser(n: Noeud) {
    const t = this.tas;
    t.push(n);
    for (let i = t.length - 1; i > 0; ) {
      const p = (i - 1) >> 1;
      if (!this.avant(t[i]!, t[p]!)) break;
      [t[i], t[p]] = [t[p]!, t[i]!];
      i = p;
    }
  }
  prendre(): Noeud | undefined {
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
  for (let c: Noeud | null = n; c?.parent; c = c.parent) for (let i = c.actions.length - 1; i >= 0; i--) etapes.push({ libelle: c.actions[i]!.libelle, ordre: c.actions[i]!.ordre, lieu: c.partie.etat.lieu });
  return etapes.reverse();
}

/** Rejoue des ordres depuis le début d'une partie ; sert à vérifier un parcours et à l'afficher pas à pas. */
export function rejouer(moteur: Moteur, groupe: Personnage[], graine: number, niveau: number, ordres: Ordre[]): { partie: Partie; refus?: string } {
  let partie = moteur.executer(moteur.nouvellePartie(groupe, { graine, niveau }), { type: 'commencer' }).partie;
  for (const o of ordres) {
    const r = moteur.executer(partie, o);
    if (r.refus) return { partie, refus: `${o.type} : ${r.refus}` };
    partie = r.partie;
  }
  return { partie };
}

const maintenant = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export function explorerParcours(ctx: ContexteJeu, opts: OptionsParcours = {}): RapportExploration {
  const moteur = creerMoteur(ctx, MODULES_STANDARD);
  const { dm } = ctx;
  if (!opts.groupe && !ctx.srd) throw new Error('explorerParcours : il faut le SRD (ctx.srd) ou un groupe.');
  const groupe = opts.groupe ?? groupeDeTest(ctx.srd!);
  const niveau = opts.niveau ?? dm.monde.niveaux.min;
  const graines = opts.graines ?? [21, 7];
  const poidsAncetres = opts.poidsAncetres ?? graines.map((_, i) => (i === 0 ? 0 : 4));
  const budgetEtats = opts.budgetEtats ?? 6000;
  const budgetMs = opts.budgetMs ?? 60_000;
  const profondeurMax = opts.profondeurMax ?? 400;
  const depart = maintenant();
  const couvrir = opts.couvrir ?? false;

  const fins = [...dm.fins.values()];
  const trouvees = new Map<string, Parcours>();
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
    if ((!couvrir && trouvees.size === fins.length) || arretGlobal) break;
    const file = new File();
    const connus = new Set<string>();
    let ordreArrivee = 0;
    // Les ancêtres des fins pas encore trouvées : chaque ancêtre atteint vaut quelques points (on suit les conditions de ce qui produit la fin).
    const indexRefs = indexerReferences(dm);
    const ancetresParFin = new Map(fins.map((f) => [f.id, ancetresDe(moteur, f.id, indexRefs)]));
    const initiale = moteur.executer(moteur.nouvellePartie(groupe, { graine, niveau }), { type: 'commencer' }).partie;
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
      return s;
    };
    const racine: Noeud = { partie: initiale, parent: null, actions: [], profondeur: 0, score: evaluer(initiale), ordreArrivee: ordreArrivee++ };
    connus.add(cleEtat(initiale));
    file.pousser(racine);
    let etatsGraine = 0;

    while (file.taille) {
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
      etats++;
      etatsGraine++;
      noter(n.partie);
      if (opts.progres && etats % 200 === 0 && opts.progres({ etats, fins: [...trouvees.keys()], ms: maintenant() - depart })) {
        arret = 'arret';
        arretGlobal = true;
        break;
      }
      if (n.profondeur >= profondeurMax) continue;

      const avant = cleEtat(n.partie);
      for (const action of actionsDe(moteur, n.partie)) {
        // Un jet raté ne change rien : on retente (les dés avancent avec la graine de la partie) jusqu'à 4 fois.
        let courant = n.partie;
        let res = moteur.executer(courant, action.ordre);
        if (res.refus) continue;
        const essais: Action[] = [action];
        for (let essai = 0; essai < 4 && cleEtat(res.partie) === avant && res.evenements.some((x) => x.type === 'jet'); essai++) {
          courant = res.partie;
          const r = moteur.executer(courant, action.ordre);
          if (r.refus) break;
          res = r;
          essais.push({ ordre: action.ordre, libelle: `${action.libelle} (nouvel essai)` });
        }
        const enfant = res.partie;
        // Le groupe ne change que si un événement l'annonce : sinon on partage celui du parent (mémoire).
        if (!res.evenements.some((x) => CHANGE_LE_GROUPE.has(x.type))) enfant.groupe = n.partie.groupe;
        enfant.journal = [];
        const finAtteinte = enfant.etat.fin ?? (enfant.scene.type === 'fin' ? enfant.scene.fin : undefined);
        const cle = cleEtat(enfant);
        const noeud: Noeud = { partie: enfant, parent: n, actions: essais, profondeur: n.profondeur + 1, score: 0, ordreArrivee: ordreArrivee++ };
        if (finAtteinte) {
          noter(enfant);
          if (!trouvees.has(finAtteinte)) trouvees.set(finAtteinte, { fin: finAtteinte, graine, niveau, etapes: cheminDe(noeud) });
          if (!couvrir && trouvees.size === fins.length) break;
          continue;
        }
        if (connus.has(cle)) continue;
        connus.add(cle);
        noeud.score = evaluer(enfant);
        file.pousser(noeud);
      }
      if (!couvrir && trouvees.size === fins.length) {
        arret = 'toutes-atteintes';
        break;
      }
    }
    if (!couvrir && trouvees.size === fins.length) arret = 'toutes-atteintes';
  }

  const vusFins = new Set(trouvees.keys());
  const couvre = (tous: string[], v: Set<string>) => ({ vus: tous.filter((x) => v.has(x)), jamais: tous.filter((x) => !v.has(x)) });
  return {
    parcours: [...trouvees.values()],
    finsNonAtteintes: fins.map((f) => f.id).filter((id) => !trouvees.has(id)),
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
