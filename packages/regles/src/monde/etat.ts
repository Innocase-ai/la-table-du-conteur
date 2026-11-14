// État d'une partie dans un monde : tout ce qui change (drapeaux, faits connus, jauges, réputations, quêtes…).
// C'est un objet JSON simple, sauvegardable tel quel. Les conditions et effets du format de monde s'évaluent ici.
import { SEUILS_PX } from '../caracteristiques';
import type { Condition, DonneesMonde, EffetMonde, Enigme, Quete, TypeIssue } from './schemas';

export type StatutQuete = 'proposee' | 'active' | 'terminee' | 'echouee';
export type EtatPnj = 'vivant' | 'mort' | 'parti';

/** L'ordre des statuts d'une quête : elle ne fait qu'avancer (proposée, en cours, close). */
const RANG_STATUT: Record<StatutQuete, number> = { proposee: 0, active: 1, terminee: 2, echouee: 2 };

/** Le moment de la journée : jour de 6 h à 17 h, soir de 18 h à 21 h, nuit ensuite (présences des PNJ, condition `moment`). */
export function momentDe(heure = 8): 'jour' | 'soir' | 'nuit' {
  return heure >= 6 && heure < 18 ? 'jour' : heure >= 18 && heure < 22 ? 'soir' : 'nuit';
}

// La mémoire du groupe (ce qu'il a fait), lue par les conditions `rencontre`, `parle` et `temoin` et par le dossier du conteur.
// Elle vit dans l'état d'exploration de la partie ; toujours facultative (les anciennes sauvegardes n'en ont pas).

/** Comment une rencontre s'est dénouée, où et quand. */
export interface IssueRencontre {
  type: TypeIssue;
  /** L'issue choisie quand `type` vaut `alternative`. */
  alternative?: string;
  jour: number;
  lieu: string;
}

/** Un PNJ à qui le groupe a parlé : premier et dernier jour, nombre de prises de parole. */
export interface PnjVu {
  premierJour: number;
  dernierJour: number;
  paroles: number;
}

/** Ce qui s'est passé sous les yeux de certains PNJ : une rencontre dénouée, avec les PNJ présents à ce moment. */
export interface Temoignage {
  genre: TypeIssue;
  /** La rencontre. */
  ref: string;
  lieu: string;
  jour: number;
  presents: string[];
}

/** Le plafond des témoignages gardés (les plus récents). */
export const TEMOIGNAGES_MAX = 60;

export interface MemoireGroupe {
  issues?: Record<string, IssueRencontre>;
  pnjVus?: Record<string, PnjVu>;
  temoignages?: Temoignage[];
  sujetsVus?: string[];
}

/** La mémoire d'un état (celle de l'exploration ; vide pour un état sans exploration ou une ancienne sauvegarde). */
export const memoireDe = (e: EtatMonde): MemoireGroupe => (e as EtatMonde & { exploration?: MemoireGroupe }).exploration ?? {};

export interface EtatQuete {
  statut: StatutQuete;
  /** Étapes actuellement actives. */
  actives: string[];
  accomplies: string[];
}

export interface EtatMonde {
  monde: string;
  lieu: string;
  jour: number;
  /** Heure du jour (0 à 23) : les trajets la font avancer ; absente des sauvegardes anciennes (8 h). */
  heure?: number;
  niveauGroupe: number;
  /** Les origines des héros du groupe (classe, espèce, historique), pour les conditions `heros` ; absent des anciennes sauvegardes. */
  heros?: { classe: string; espece: string; historique: string }[];
  flags: Record<string, boolean>;
  faits: string[];
  jauges: Record<string, number>;
  reputations: Record<string, number>;
  attitudes: Record<string, number>;
  pnjEtats: Record<string, EtatPnj>;
  pnjLieux: Record<string, string>;
  /** PNJ escortés : ils suivent le groupe et sont présents partout où il va (absent des anciennes sauvegardes). */
  escortes?: string[];
  inventaire: Record<string, number>;
  pieces: number;
  xp: number;
  quetes: Record<string, EtatQuete>;
  lieuxVisites: string[];
  debloques: string[];
  rencontresFaites: string[];
  /** Rencontres déclenchées par un effet (échec d'une énigme, piège…) : elles se jouent à la fin de l'action en cours. */
  rencontresEnAttente?: string[];
  /** Effets qui touchent le groupe (blessure) ou l'horloge (temps) : le moteur d'exploration les applique à la fin de l'action en cours. */
  effetsEnAttente?: EffetMonde[];
  evenementsJoues: string[];
  fin?: string;
  /** Narrations produites par les effets, à raconter par le MJ. */
  narrations: string[];
}

/**
 * Complète l'état d'une partie existante avec les entités que le monde a gagnées depuis (un pack de région ajouté après coup) :
 * jauges, réputations de factions et attitudes de PNJ inconnues reçoivent leur valeur de départ ; rien de ce que la partie connaît
 * déjà n'est touché. Renvoie le nombre d'entrées ajoutées.
 */
/**
 * Le niveau que le groupe peut atteindre : celui du palier le plus avancé parmi les chapitres où il est déjà allé (un lieu appartient
 * à un chapitre si lui ou l'un de ses ancêtres figure dans `chapitre.lieux`). L'XP en trop reste en réserve et se convertit en
 * niveaux en entrant dans un chapitre plus avancé. Sans chapitre correspondant : le niveau maximal du monde.
 */
export function plafondDeNiveau(e: EtatMonde, dm: DonneesMonde): number {
  const appartient = (lieu: string, racines: string[]): boolean => {
    for (let id: string | undefined = lieu, i = 0; id && i < 30; i++, id = dm.lieux.get(id)?.parent) if (racines.includes(id)) return true;
    return false;
  };
  const visites = [...new Set([...e.lieuxVisites, e.lieu])];
  let plafond = 0;
  for (const c of dm.monde.chapitres) if (visites.some((l) => appartient(l, c.lieux))) plafond = Math.max(plafond, c.niveaux.max);
  return plafond > 0 ? Math.min(plafond, dm.monde.niveaux.max) : dm.monde.niveaux.max;
}

export function completerEtat(e: EtatMonde, dm: DonneesMonde): number {
  let ajoutees = 0;
  for (const j of dm.jauges.values()) if (!(j.id in e.jauges)) { e.jauges[j.id] = j.initial; ajoutees++; }
  for (const f of dm.factions.values()) if (!(f.id in e.reputations)) { e.reputations[f.id] = f.reputation; ajoutees++; }
  for (const p of dm.pnj.values()) if (!(p.id in e.attitudes)) { e.attitudes[p.id] = p.attitude; ajoutees++; }
  return ajoutees;
}

export function etatInitial(dm: DonneesMonde, niveauGroupe = dm.monde.niveaux.min): EtatMonde {
  return {
    monde: dm.monde.id,
    lieu: dm.monde.depart.lieu,
    jour: 1,
    heure: 8,
    niveauGroupe,
    flags: {},
    faits: [],
    jauges: Object.fromEntries([...dm.jauges.values()].map((j) => [j.id, j.initial])),
    reputations: Object.fromEntries([...dm.factions.values()].map((f) => [f.id, f.reputation])),
    attitudes: Object.fromEntries([...dm.pnj.values()].map((p) => [p.id, p.attitude])),
    pnjEtats: {},
    pnjLieux: {},
    inventaire: {},
    pieces: 0,
    // Un groupe qui commence au niveau N a déjà les PX de ce niveau (SRD 5.2.1) : le suivant demande l'écart, pas le total.
    xp: SEUILS_PX[Math.min(Math.max(niveauGroupe, 1), SEUILS_PX.length) - 1] ?? 0,
    quetes: {},
    lieuxVisites: [dm.monde.depart.lieu],
    debloques: [],
    rencontresFaites: [],
    evenementsJoues: [],
    narrations: [],
  };
}

export function evaluerCondition(c: Condition, e: EtatMonde): boolean {
  if ('flag' in c) return !!e.flags[c.flag];
  if ('fait' in c) return e.faits.includes(c.fait);
  if ('quete' in c) return (e.quetes[c.quete.id]?.statut ?? undefined) === c.quete.statut;
  if ('etape' in c) {
    const q = e.quetes[c.etape.quete];
    return !!q && (q.actives.includes(c.etape.etape) || q.accomplies.includes(c.etape.etape));
  }
  if ('faction' in c) {
    const r = e.reputations[c.faction.id] ?? 0;
    return (c.faction.min === undefined || r >= c.faction.min) && (c.faction.max === undefined || r <= c.faction.max);
  }
  if ('jauge' in c) {
    const v = e.jauges[c.jauge.id] ?? 0;
    return (c.jauge.min === undefined || v >= c.jauge.min) && (c.jauge.max === undefined || v <= c.jauge.max);
  }
  if ('objet' in c) return (e.inventaire[c.objet] ?? 0) > 0;
  if ('pnj' in c) {
    const a = e.attitudes[c.pnj.id] ?? 0;
    const etat = e.pnjEtats[c.pnj.id] ?? 'vivant';
    return (c.pnj.etat === undefined || etat === c.pnj.etat) && (c.pnj.attitudeMin === undefined || a >= c.pnj.attitudeMin) && (c.pnj.attitudeMax === undefined || a <= c.pnj.attitudeMax);
  }
  if ('lieu' in c) return e.lieuxVisites.includes(c.lieu);
  if ('rencontre' in c) {
    const i = memoireDe(e).issues?.[c.rencontre.id];
    // « Rencontre X faite » sans issue précisée : réglée (victoire ou autre issue réussie), pas fuie ni perdue. Une porte ou une
    // quête conditionnée par la rencontre ne s'ouvre plus quand le groupe a fui ; `{ issue: 'fuite' }` reste possible.
    if (c.rencontre.issue === undefined && c.rencontre.alternative === undefined) return (!!i && i.type !== 'fuite' && i.type !== 'defaite') || e.rencontresFaites.includes(c.rencontre.id);
    return !!i && (c.rencontre.issue === undefined || i.type === c.rencontre.issue) && (c.rencontre.alternative === undefined || i.alternative === c.rencontre.alternative);
  }
  if ('parle' in c) {
    const m = memoireDe(e);
    // Les sauvegardes d'avant la mémoire n'ont que les sujets abordés : on s'en sert faute de mieux.
    return (m.pnjVus?.[c.parle]?.paroles ?? 0) > 0 || (m.sujetsVus ?? []).some((s) => s.startsWith(`${c.parle}:`));
  }
  if ('temoin' in c) return (memoireDe(e).temoignages ?? []).some((t) => t.presents.includes(c.temoin.pnj) && (c.temoin.genre === undefined || t.genre === c.temoin.genre));
  if ('moment' in c) return momentDe(e.heure) === c.moment;
  if ('pieces' in c) return (c.pieces.min === undefined || e.pieces >= c.pieces.min) && (c.pieces.max === undefined || e.pieces <= c.pieces.max);
  if ('niveauGroupe' in c) return (c.niveauGroupe.min === undefined || e.niveauGroupe >= c.niveauGroupe.min) && (c.niveauGroupe.max === undefined || e.niveauGroupe <= c.niveauGroupe.max);
  if ('heros' in c) return (e.heros ?? []).some((h) => (!c.heros.classe || h.classe === c.heros.classe) && (!c.heros.espece || h.espece === c.heros.espece) && (!c.heros.historique || h.historique === c.heros.historique));
  if ('non' in c) return !evaluerCondition(c.non, e);
  if ('et' in c) return c.et.every((x) => evaluerCondition(x, e));
  return c.ou.some((x) => evaluerCondition(x, e));
}

const borner = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** L'or au cuivre près (1 pc = 0,01 po) : sans arrondi, trois repas à 1 pa laissaient 0,0999… po et le quatrième était refusé. */
export const arrondirPieces = (po: number) => Math.round(po * 100) / 100;

/**
 * Un effet qui s'additionne à chaque application (attitude, objet, or, PX, jauge, réputation). Le reste — fait, drapeau, quête,
 * état d'un PNJ, rencontre — ne change plus rien la deuxième fois, ou doit se rejouer (une rencontre qui revient).
 */
export function estCumulatif(e: EffetMonde): boolean {
  return 'attitude' in e || 'objet' in e || 'pieces' in e || 'xp' in e || 'jauge' in e || 'reputation' in e || 'blessure' in e || 'temps' in e;
}

export function appliquerEffet(effet: EffetMonde, e: EtatMonde, dm: DonneesMonde): void {
  if ('flag' in effet) e.flags[effet.flag] = effet.valeur ?? true;
  else if ('fait' in effet) {
    if (!e.faits.includes(effet.fait)) e.faits.push(effet.fait);
  } else if ('jauge' in effet) {
    const j = dm.jauges.get(effet.jauge.id);
    e.jauges[effet.jauge.id] = borner((e.jauges[effet.jauge.id] ?? 0) + effet.jauge.delta, j?.min ?? -Infinity, j?.max ?? Infinity);
  } else if ('reputation' in effet) e.reputations[effet.reputation.faction] = borner((e.reputations[effet.reputation.faction] ?? 0) + effet.reputation.delta, -100, 100);
  else if ('attitude' in effet) e.attitudes[effet.attitude.pnj] = borner((e.attitudes[effet.attitude.pnj] ?? 0) + effet.attitude.delta, -100, 100);
  else if ('objet' in effet) {
    const n = (e.inventaire[effet.objet.id] ?? 0) + (effet.objet.retirer ? -1 : 1) * (effet.objet.quantite ?? 1);
    if (n > 0) e.inventaire[effet.objet.id] = n;
    else delete e.inventaire[effet.objet.id];
  } else if ('pieces' in effet) e.pieces = arrondirPieces(Math.max(0, e.pieces + effet.pieces));
  else if ('xp' in effet) e.xp += effet.xp;
  else if ('quete' in effet) {
    const def = dm.quetes.get(effet.quete.id);
    if (effet.quete.statut === 'terminee' && def) terminerQuete(effet.quete.id, e, dm);
    else if (effet.quete.statut === 'echouee' && def) echouerQuete(effet.quete.id, e, dm);
    else {
      const q = (e.quetes[effet.quete.id] ??= { statut: effet.quete.statut, actives: [], accomplies: [] });
      // Une quête ne recule jamais : close (accomplie ou échouée), elle ne se rouvre pas ; en cours, la reproposer (un sujet de PNJ répété,
      // une scène qui l'a déjà lancée) ne la remet pas « proposée » (le joueur devait alors l'accepter une seconde fois).
      if (RANG_STATUT[effet.quete.statut] < RANG_STATUT[q.statut]) return;
      q.statut = effet.quete.statut;
      if (effet.quete.statut === 'active' && def && !q.actives.length && !q.accomplies.length) q.actives.push(def.debut);
    }
  } else if ('etape' in effet) {
    const q = (e.quetes[effet.etape.quete] ??= { statut: 'active', actives: [], accomplies: [] });
    // Une quête close ne reçoit plus d'étape ; une quête seulement proposée qu'on force à une étape est en cours.
    if (q.statut === 'terminee' || q.statut === 'echouee') return;
    q.statut = 'active';
    if (!q.actives.includes(effet.etape.etape) && !q.accomplies.includes(effet.etape.etape)) q.actives.push(effet.etape.etape);
  } else if ('pnjEtat' in effet) e.pnjEtats[effet.pnjEtat.pnj] = effet.pnjEtat.etat;
  else if ('deplacer' in effet) e.pnjLieux[effet.deplacer.pnj] = effet.deplacer.lieu;
  else if ('escorte' in effet) {
    const liste = (e.escortes ??= []);
    const i = liste.indexOf(effet.escorte.pnj);
    if (effet.escorte.actif !== false && i < 0) liste.push(effet.escorte.pnj);
    else if (effet.escorte.actif === false && i >= 0) liste.splice(i, 1);
  }
  else if ('debloquer' in effet) {
    if (!e.debloques.includes(effet.debloquer)) e.debloques.push(effet.debloquer);
  } else if ('rencontre' in effet) {
    // L'effet déclenche la rencontre ; le moteur d'exploration la lance à la fin de l'action (`suites`).
    const attente = (e.rencontresEnAttente ??= []);
    if (!attente.includes(effet.rencontre)) attente.push(effet.rencontre);
  } else if ('fin' in effet) e.fin = effet.fin;
  // Blessure et temps touchent le groupe et l'horloge, que l'état du monde ne tient pas : ils attendent la fin de l'action (`suites`).
  else if ('blessure' in effet || 'temps' in effet) (e.effetsEnAttente ??= []).push(effet);
  else e.narrations.push(effet.narration);
}

/**
 * Un lot d'effets (un sujet, une issue, un choix…). Clore une quête (`terminee`, `echouee`) se fait en dernier : les autres effets du
 * lot (le drapeau « quête rendue ») et l'avancement des étapes passent d'abord. Sinon l'étape de retour au donneur, accomplie par ce
 * même drapeau, ne l'était jamais : la quête était déjà close et les effets de l'étape (ses PX) se perdaient.
 */
export function appliquerEffets(effets: EffetMonde[], e: EtatMonde, dm: DonneesMonde): void {
  const clotures: EffetMonde[] = [];
  for (const effet of effets) {
    if ('quete' in effet && (effet.quete.statut === 'terminee' || effet.quete.statut === 'echouee')) clotures.push(effet);
    else appliquerEffet(effet, e, dm);
  }
  avancerQuetes(e, dm);
  if (!clotures.length) return;
  for (const effet of clotures) appliquerEffet(effet, e, dm);
  avancerQuetes(e, dm);
}

/** Termine une quête une seule fois : récompenses, et plus aucune étape active. */
export function terminerQuete(id: string, e: EtatMonde, dm: DonneesMonde): void {
  const def = dm.quetes.get(id);
  const q = (e.quetes[id] ??= { statut: 'active', actives: [], accomplies: [] });
  if (q.statut === 'terminee' || !def) return;
  q.statut = 'terminee';
  q.actives = [];
  e.xp += def.recompenses.xp;
  e.pieces = arrondirPieces(e.pieces + def.recompenses.pieces);
  for (const o of def.recompenses.objets) e.inventaire[o] = (e.inventaire[o] ?? 0) + 1;
  for (const eff of def.recompenses.effets) appliquerEffet(eff, e, dm);
}

/** Fait échouer une quête une seule fois : plus aucune étape active, le texte d'échec raconté, ses effets appliqués. */
export function echouerQuete(id: string, e: EtatMonde, dm: DonneesMonde): void {
  const def = dm.quetes.get(id);
  const q = (e.quetes[id] ??= { statut: 'active', actives: [], accomplies: [] });
  if (q.statut === 'terminee' || q.statut === 'echouee') return;
  q.statut = 'echouee';
  q.actives = [];
  if (!def?.echec) return;
  if (def.echec.texte) e.narrations.push(def.echec.texte);
  for (const eff of def.echec.effets) appliquerEffet(eff, e, dm);
}

/** Ce qu'une quête rapporte, tout compris : ses récompenses et les PX, l'or et les objets que donnent ses étapes. */
export function recompensesDeQuete(def: Quete): { xp: number; pieces: number; objets: string[]; annonce?: string } {
  const effets = [...def.recompenses.effets, ...def.etapes.flatMap((x) => x.effets)];
  let xp = def.recompenses.xp;
  let pieces = def.recompenses.pieces;
  const objets = [...def.recompenses.objets];
  for (const f of effets) {
    if ('xp' in f) xp += f.xp;
    else if ('pieces' in f && f.pieces > 0) pieces += f.pieces;
    else if ('objet' in f && !f.objet.retirer) objets.push(f.objet.id);
  }
  return { xp, pieces, objets, ...(def.recompenses.annonce ? { annonce: def.recompenses.annonce } : {}) };
}

/** Fait progresser les quêtes dont une étape active est accomplie (jusqu'à stabilité). */
export function avancerQuetes(e: EtatMonde, dm: DonneesMonde): void {
  for (let tour = 0; tour < 20; tour++) {
    let change = false;
    for (const [id, q] of Object.entries(e.quetes)) {
      const def = dm.quetes.get(id);
      if (!def || q.statut !== 'active') continue;
      // Réparation : une étape active que le monde ne connaît plus (histoire mise à jour après la sauvegarde) est abandonnée.
      const connue = (s: string) => def.etapes.some((x) => x.id === s);
      if (q.actives.some((s) => !connue(s))) {
        q.actives = q.actives.filter(connue);
        change = true;
      }
      // Réparation : une quête « en cours » sans aucune étape active (sauvegarde d'avant la correction d'une quête rouverte, ou
      // étape ajoutée à la fiche depuis) reprend aux étapes qui suivent celles déjà accomplies.
      if (!q.actives.length) {
        for (const acc of q.accomplies) {
          for (const s of def.etapes.find((x) => x.id === acc)?.suivantes ?? []) {
            if (!q.accomplies.includes(s) && !q.actives.includes(s) && connue(s)) {
              q.actives.push(s);
              change = true;
            }
          }
        }
        // Rien de ce que la partie a accompli n'existe plus : la quête reprend à son début.
        if (!q.actives.length && !q.accomplies.some(connue)) {
          q.actives.push(def.debut);
          change = true;
        }
      }
      for (const idEtape of [...q.actives]) {
        const etape = def.etapes.find((x) => x.id === idEtape);
        if (!etape) continue;
        if (etape.echec && evaluerCondition(etape.echec, e)) {
          echouerQuete(id, e, dm);
          change = true;
          break;
        }
        if (!evaluerCondition(etape.completion, e)) continue;
        q.actives = q.actives.filter((x) => x !== idEtape);
        q.accomplies.push(idEtape);
        for (const eff of etape.effets) appliquerEffet(eff, e, dm);
        for (const s of etape.suivantes) if (!q.actives.includes(s) && !q.accomplies.includes(s)) q.actives.push(s);
        // Une étape finale (`termine`) clôt la quête aussitôt ; sinon la quête se clôt quand plus rien n'est actif.
        if (etape.termine || (!etape.suivantes.length && !q.actives.length)) terminerQuete(id, e, dm);
        change = true;
      }
    }
    if (!change) return;
  }
}

/** Un texte comparé sans casse, sans accents ni ponctuation (réponses d'énigme). */
export const normaliserTexte = (t: unknown) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Vérifie la réponse d'un joueur à une énigme : le moteur tranche, pas le MJ. */
export function verifierEnigme(enigme: Enigme, reponse: unknown): boolean {
  const s = enigme.solution;
  const norme = normaliserTexte;
  switch (s.type) {
    case 'sequence':
      return Array.isArray(reponse) && reponse.length === s.ordre.length && reponse.every((x, i) => norme(x) === norme(s.ordre[i]));
    case 'mot-de-passe':
      return typeof reponse === 'string' && s.mots.some((m) => norme(m) === norme(reponse));
    case 'leviers':
      return Array.isArray(reponse) && reponse.length === s.positions.length && reponse.every((x, i) => !!x === s.positions[i]);
    case 'placement':
      return typeof reponse === 'object' && reponse !== null && Object.entries(s.emplacements).every(([k, v]) => (reponse as Record<string, unknown>)[k] === v) && Object.keys(reponse).length === Object.keys(s.emplacements).length;
    case 'cadran':
      return Array.isArray(reponse) && reponse.length === s.valeurs.length && reponse.every((x, i) => Number(x) === s.valeurs[i]);
    case 'deduction':
      return typeof reponse === 'string' && s.reponses.some((m) => norme(m) === norme(reponse));
  }
}
