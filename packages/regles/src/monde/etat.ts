// État d'une partie dans un monde : tout ce qui change (drapeaux, faits connus, jauges, réputations, quêtes…).
// C'est un objet JSON simple, sauvegardable tel quel. Les conditions et effets du format de monde s'évaluent ici.
import { SEUILS_PX } from '../caracteristiques';
import type { Condition, DonneesMonde, EffetMonde, Enigme } from './schemas';

export type StatutQuete = 'proposee' | 'active' | 'terminee' | 'echouee';
export type EtatPnj = 'vivant' | 'mort' | 'parti';

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
  evenementsJoues: string[];
  fin?: string;
  /** Narrations produites par les effets, à raconter par le MJ. */
  narrations: string[];
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
  if ('pieces' in c) return (c.pieces.min === undefined || e.pieces >= c.pieces.min) && (c.pieces.max === undefined || e.pieces <= c.pieces.max);
  if ('niveauGroupe' in c) return (c.niveauGroupe.min === undefined || e.niveauGroupe >= c.niveauGroupe.min) && (c.niveauGroupe.max === undefined || e.niveauGroupe <= c.niveauGroupe.max);
  if ('heros' in c) return (e.heros ?? []).some((h) => (!c.heros.classe || h.classe === c.heros.classe) && (!c.heros.espece || h.espece === c.heros.espece) && (!c.heros.historique || h.historique === c.heros.historique));
  if ('non' in c) return !evaluerCondition(c.non, e);
  if ('et' in c) return c.et.every((x) => evaluerCondition(x, e));
  return c.ou.some((x) => evaluerCondition(x, e));
}

const borner = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

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
  } else if ('pieces' in effet) e.pieces = Math.max(0, e.pieces + effet.pieces);
  else if ('xp' in effet) e.xp += effet.xp;
  else if ('quete' in effet) {
    const q = (e.quetes[effet.quete.id] ??= { statut: effet.quete.statut, actives: [], accomplies: [] });
    const def = dm.quetes.get(effet.quete.id);
    if (effet.quete.statut === 'terminee' && def) terminerQuete(effet.quete.id, e, dm);
    else {
      q.statut = effet.quete.statut;
      if (effet.quete.statut === 'active' && def && !q.actives.length && !q.accomplies.length) q.actives.push(def.debut);
    }
  } else if ('etape' in effet) {
    const q = (e.quetes[effet.etape.quete] ??= { statut: 'active', actives: [], accomplies: [] });
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
  else e.narrations.push(effet.narration);
}

export function appliquerEffets(effets: EffetMonde[], e: EtatMonde, dm: DonneesMonde): void {
  for (const effet of effets) appliquerEffet(effet, e, dm);
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
  e.pieces += def.recompenses.pieces;
  for (const o of def.recompenses.objets) e.inventaire[o] = (e.inventaire[o] ?? 0) + 1;
  for (const eff of def.recompenses.effets) appliquerEffet(eff, e, dm);
}

/** Fait progresser les quêtes dont une étape active est accomplie (jusqu'à stabilité). */
export function avancerQuetes(e: EtatMonde, dm: DonneesMonde): void {
  for (let tour = 0; tour < 20; tour++) {
    let change = false;
    for (const [id, q] of Object.entries(e.quetes)) {
      const def = dm.quetes.get(id);
      if (!def || q.statut !== 'active') continue;
      for (const idEtape of [...q.actives]) {
        const etape = def.etapes.find((x) => x.id === idEtape);
        if (!etape) continue;
        if (etape.echec && evaluerCondition(etape.echec, e)) {
          q.statut = 'echouee';
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
