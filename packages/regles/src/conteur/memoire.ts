// La mémoire du groupe, racontée au conteur : un dossier court de ce que le groupe a vécu (lieux parcourus, rencontres et leur issue,
// personnes rencontrées, compagnons, réputations) et, pour chaque PNJ présent, ce que ce PNJ en sait. Tout est calculé par le moteur
// d'après l'état de la partie (rien n'est écrit par un LLM, rien n'est perdu au rechargement) ; le dossier a une taille plafonnée,
// quel que soit le nombre d'actes passés. Voir docs/PLAN-MEMOIRE-DU-GROUPE.md.
import { memoireDe, type EtatMonde } from '../monde/etat';
import type { DonneesMonde, TypeIssue } from '../monde/schemas';

/** La taille maximale du dossier (en caractères) : les souvenirs les plus anciens sont abandonnés les premiers. */
export const DOSSIER_MAX = 1200;

/** Combien de témoignages d'un PNJ sont rappelés au conteur. */
export const TEMOIGNAGES_PAR_PNJ = 3;

const ISSUE: Record<TypeIssue, string> = { victoire: 'vaincue', alternative: 'réglée sans combat', fuite: 'fuie', defaite: 'perdue' };

/** Ce que pense une faction du groupe, en mots (rien à dire entre -25 et 25). */
export function opinionDeFaction(reputation: number): string | undefined {
  if (reputation >= 60) return 'dévoués au groupe';
  if (reputation >= 25) return 'le tiennent en estime';
  if (reputation <= -60) return 'sont ses ennemis déclarés';
  if (reputation <= -25) return 'se méfient du groupe';
  return undefined;
}

const nomDeRencontre = (dm: DonneesMonde, id: string) => dm.rencontres.get(id)?.nom ?? id;

/** Un item de rencontre : « La garde de Thalgrin (vaincue, jour 3) ». */
function itemRencontre(dm: DonneesMonde, id: string, type: TypeIssue, jour: number, alternative?: string): string {
  const alt = type === 'alternative' && alternative ? dm.rencontres.get(id)?.alternatives.find((a) => a.id === alternative)?.nom : undefined;
  return `${nomDeRencontre(dm, id)} (${ISSUE[type]}${alt ? ` : ${alt.toLowerCase()}` : ''}, jour ${jour})`;
}

/**
 * Le dossier du groupe : quelques lignes, les plus récentes d'abord, plafonnées à `budget` caractères. Vide si le groupe n'a encore
 * rien vécu qui mérite d'être rappelé.
 */
export function dossierDuGroupe(dm: DonneesMonde, etat: EtatMonde, budget = DOSSIER_MAX): string[] {
  const m = memoireDe(etat);
  const nomLieu = (id: string) => dm.lieux.get(id)?.nom ?? id;
  const nomPnj = (id: string) => dm.pnj.get(id)?.nom ?? id;
  const lieux = [...new Set(etat.lieuxVisites)].filter((id) => id !== etat.lieu && dm.lieux.has(id)).reverse();
  // Les plus récentes d'abord (à jour égal, la dernière consignée) : l'ordre d'insertion est chronologique.
  const rencontres = Object.entries(m.issues ?? {})
    .reverse()
    .sort((a, b) => b[1].jour - a[1].jour)
    .filter(([id]) => dm.rencontres.has(id));
  const personnes = Object.entries(m.pnjVus ?? {})
    .reverse()
    .sort((a, b) => b[1].dernierJour - a[1].dernierJour)
    .filter(([id]) => dm.pnj.has(id));
  const compagnons = (etat.escortes ?? []).filter((id) => dm.pnj.has(id));
  const reputations = [...dm.factions.values()]
    .map((f) => ({ f, mot: opinionDeFaction(etat.reputations[f.id] ?? f.reputation), v: Math.abs(etat.reputations[f.id] ?? f.reputation) }))
    .filter((x): x is { f: (typeof x)['f']; mot: string; v: number } => !!x.mot)
    .sort((a, b) => b.v - a.v);

  const construire = (k: number): string[] => {
    const l: string[] = [];
    if (lieux.length) l.push(`Lieux déjà parcourus (${lieux.length + 1} au total ; les plus récents) : ${lieux.slice(0, k).map(nomLieu).join(', ')}.`);
    if (rencontres.length) l.push(`Rencontres jouées (les plus récentes) : ${rencontres.slice(0, k).map(([id, i]) => itemRencontre(dm, id, i.type, i.jour, i.alternative)).join(' ; ')}.`);
    if (personnes.length) l.push(`Personnes à qui le groupe a parlé (les plus récentes) : ${personnes.slice(0, k).map(([id]) => nomPnj(id)).join(', ')}.`);
    if (compagnons.length) l.push(`Voyagent avec le groupe : ${compagnons.map(nomPnj).join(', ')}.`);
    if (reputations.length) l.push(`Réputation : ${reputations.slice(0, Math.max(2, Math.ceil(k / 2))).map((x) => `les ${x.f.nom} ${x.mot}`).join(' ; ')}.`);
    return l;
  };
  for (let k = 8; k > 1; k--) {
    const l = construire(k);
    if (l.join('\n').length <= budget) return l;
  }
  return construire(1);
}

/**
 * Ce qu'un PNJ sait du groupe : s'il lui a déjà parlé, ce dont il a été témoin, ce que sa faction pense du groupe. Tout le reste de
 * ce que le groupe a fait, il l'ignore : le conteur ne doit pas le lui faire évoquer.
 */
export function ceQueSaitLePnj(dm: DonneesMonde, etat: EtatMonde, id: string): string {
  const m = memoireDe(etat);
  const pnj = dm.pnj.get(id);
  const parts: string[] = [];
  const vu = m.pnjVus?.[id];
  // Une ancienne sauvegarde ne connaît que les sujets abordés : cela suffit à dire qu'on lui a parlé.
  const parle = vu ?? ((m.sujetsVus ?? []).some((s) => s.startsWith(`${id}:`)) ? { premierJour: etat.jour, dernierJour: etat.jour, paroles: 1 } : undefined);
  parts.push(parle ? `a déjà parlé au groupe${vu ? ` (la première fois le jour ${vu.premierJour}, ${vu.paroles} fois)` : ''}` : 'ne connaît pas encore le groupe');
  const vus = (m.temoignages ?? []).filter((t) => t.presents.includes(id)).slice(-TEMOIGNAGES_PAR_PNJ).reverse();
  if (vus.length) parts.push(`était présent quand : ${vus.map((t) => itemRencontre(dm, t.ref, t.genre, t.jour, m.issues?.[t.ref]?.alternative)).join(' ; ')}`);
  if (pnj?.faction) {
    const mot = opinionDeFaction(etat.reputations[pnj.faction] ?? dm.factions.get(pnj.faction)?.reputation ?? 0);
    if (mot) parts.push(`sa faction (${dm.factions.get(pnj.faction)?.nom ?? pnj.faction}) : ses membres ${mot}`);
  }
  return `${parts.join(' ; ')}.`;
}
