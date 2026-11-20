// Le profil « épisode » du validateur (18/11/2026, docs/AUDIT-CREATION-HISTOIRE.md rang 1) : un monde qui déclare `"format": "episode"`
// dans `monde.json` est jugé sur les règles du cap du 15/11/2026 (docs/PRD-SAGA.md) et sur les règles de RPG du 16/11/2026, au lieu des
// objectifs de « Richesse » d'un chapitre de 30 lieux. Tous ces contrôles sont des AVIS (barème indicatif, PRD-SAGA F2) : un épisode qui
// ne les suit pas reste jouable. Opt-in (PRD-SAGA P2) : sans le champ, le validateur dit exactement ce qu'il disait avant.
import type { Donnees } from '../donnees';
import { tableDe } from './butin-commun';
import { conseilsButinEpisode } from './butin-niveau';
import { examensDe } from './examens-donnees';
import { evenementsChoixDe } from './evenements-choix-donnees';
import type { DonneesMonde, Lieu } from './schemas';

/** Les cibles d'un épisode (PRD-SAGA §2 et F2-F4, CLAUDE.md « Règles de RPG du 16/11/2026 », textes riches du 10/11/2026). */
export const EPISODE = {
  pieces: { min: 10, max: 13 },
  quetes: { min: 3, max: 8 },
  sujetsParPnj: 4,
  arrivee: { min: 130, max: 170 },
} as const;

/** Niveau de groupe à partir duquel une rareté est attendue (même barème que les objets propres au monde, `validation.ts`). */
export const RARETE_NIVEAU_MIN: Record<string, number> = { commun: 1, 'peu-commun': 1, rare: 5, 'tres-rare': 11, legendaire: 17 };

/** Premier niveau d'un palier de table de butin (`TableButin.palier` : 1 = niveaux 1-4, 2 = 5-10, 3 = 11-16, 4 = 17-20). */
const PALIER_NIVEAU_MIN: Record<number, number> = { 1: 1, 2: 5, 3: 11, 4: 17 };

const TYPES_HORS_PIECE = new Set(['region', 'route']);
const mots = (t: string | undefined) => (t ?? '').trim().split(/\s+/).filter(Boolean).length;
const liste = (xs: string[], n = 8) => `${xs.slice(0, n).join(', ')}${xs.length > n ? `… (${xs.length} en tout)` : ''}`;

/** Le lieu de départ d'un épisode : le lieu `depart.lieu` s'il contient des pièces, sinon son parent (on démarre dans une pièce du hub). */
export function lieuDeDepart(dm: DonneesMonde): Lieu | undefined {
  const depart = dm.lieux.get(dm.monde.depart.lieu);
  if (!depart) return undefined;
  const aDesEnfants = [...dm.lieux.values()].some((l) => l.parent === depart.id);
  return !aDesEnfants && depart.parent ? (dm.lieux.get(depart.parent) ?? depart) : depart;
}

/** Les pièces visitables du lieu de départ : lui-même et tous ses descendants (régions et routes exceptées). */
export function piecesDuDepart(dm: DonneesMonde): Lieu[] {
  const hub = lieuDeDepart(dm);
  if (!hub) return [];
  const res: Lieu[] = [];
  const visiter = (l: Lieu) => {
    if (!TYPES_HORS_PIECE.has(l.type)) res.push(l);
    for (const e of dm.lieux.values()) if (e.parent === l.id && res.length < 500) visiter(e);
  };
  visiter(hub);
  return res;
}

export function conseilsEpisode(dm: DonneesMonde, srd: Donnees): string[] {
  const avis: string[] = [];
  const { min: nivMin, max: nivMax } = dm.monde.niveaux;

  // 1. Le lieu de départ dense (F2) : 10 à 13 pièces, chacune avec quelque chose à faire.
  const hub = lieuDeDepart(dm);
  const pieces = piecesDuDepart(dm);
  if (hub && (pieces.length < EPISODE.pieces.min || pieces.length > EPISODE.pieces.max)) {
    avis.push(`Épisode : le lieu de départ « ${hub.id} » compte ${pieces.length} pièces (visé : ${EPISODE.pieces.min} à ${EPISODE.pieces.max}, lui compris : taverne, chambre, sanctuaire, maison du chef, marchand… ; PRD-SAGA F2).`);
  }
  const occupe = new Set<string>();
  for (const p of dm.pnj.values()) [p.lieu, ...p.presences.map((x) => x.lieu)].forEach((l) => occupe.add(l));
  for (const m of [dm.tresors, dm.pieges, dm.enigmes]) for (const x of m.values()) occupe.add(x.lieu);
  for (const x of examensDe(dm).examens) occupe.add(x.lieu);
  for (const x of evenementsChoixDe(dm).evenements) occupe.add(x.lieu);
  for (const ev of dm.evenements.values()) if (ev.lieu) occupe.add(ev.lieu);
  // Un monde qui déclare le gabarit de lieu de départ (`depart.gabarit`, F2) a un contrôle de densité plus fin (`gabarit-depart.ts`, dans
  // `pnpm monde manque` et `verifier`) : on ne répète pas ici l'avis grossier « pièces vides ».
  const vides = dm.monde.depart.gabarit ? [] : pieces.filter((l) => !occupe.has(l.id) && !l.rencontres.length && !l.services.length && !l.faits.length).map((l) => l.id);
  if (vides.length) avis.push(`Épisode : pièces vides du lieu de départ (ni PNJ, ni contenant, ni service, ni rencontre, ni détail à examiner : visez 2 à 4 « couches » par pièce) : ${liste(vides)}.`);

  // 2. Les quêtes (PRD-SAGA §2.2 et F3) : 3 à 8, dont une seule principale, sans quête personnelle ni de faction autonome.
  const quetes = [...dm.quetes.values()];
  if (quetes.length < EPISODE.quetes.min || quetes.length > EPISODE.quetes.max) avis.push(`Épisode : ${quetes.length} quêtes (visé : ${EPISODE.quetes.min} à ${EPISODE.quetes.max}, dont une principale ; le premier épisode peut en avoir 2 ou 3).`);
  const principales = quetes.filter((q) => q.type === 'principale').map((q) => q.id);
  if (principales.length > 1) avis.push(`Épisode : ${principales.length} quêtes principales (une seule attendue : le fil rouge de l'épisode) : ${liste(principales)}.`);
  const autonomes = quetes.filter((q) => q.type === 'personnelle' || q.type === 'faction').map((q) => q.id);
  if (autonomes.length) avis.push(`Épisode : quêtes personnelles ou de faction (un épisode n'en a pas d'autonomes : en faire des secondaires) : ${liste(autonomes)}.`);
  const reperes = quetes.flatMap((q) => q.etapes.filter((e) => e.lieu).map((e) => `${q.id}/${e.id}`));
  if (reperes.length) avis.push(`Épisode : étapes de quête avec un \`lieu\` (losange sur la carte et « ◆ » sur la sortie : le joueur doit chercher, règle du 16/11/2026) : ${liste(reperes)}.`);

  // 3. Parler vraiment (règle du 16/11/2026) : au moins 4 sujets par PNJ qui parle (qui a un sujet, ou qui se trouve au lieu de départ).
  const dansLeHub = new Set(pieces.map((l) => l.id));
  const muets = [...dm.pnj.values()]
    .filter((p) => (p.sujets.length > 0 || dansLeHub.has(p.lieu)) && p.sujets.length < EPISODE.sujetsParPnj)
    .map((p) => `${p.id} (${p.sujets.length})`);
  if (muets.length) avis.push(`Épisode : PNJ avec moins de ${EPISODE.sujetsParPnj} sujets (règle du 16/11/2026 : objet central, chef, rumeurs, autres PNJ) : ${liste(muets)}.`);

  // 4. Textes riches : un récit d'arrivée de 130 à 170 mots.
  const horsArrivee = [...dm.lieux.values()]
    .filter((l) => !TYPES_HORS_PIECE.has(l.type) && l.arrivee && (mots(l.arrivee) < EPISODE.arrivee.min || mots(l.arrivee) > EPISODE.arrivee.max))
    .map((l) => `${l.id} (${mots(l.arrivee)})`);
  if (horsArrivee.length) avis.push(`Épisode : récits d’arrivée hors de ${EPISODE.arrivee.min} à ${EPISODE.arrivee.max} mots : ${liste(horsArrivee)}.`);

  // 5. Le butin plafonné au niveau (F4, partie statique) : objets du catalogue trop rares, tables d'un palier au-dessus du monde.
  const rarete = (id: string) => dm.objets.get(id)?.rarete ?? srd.objets.get(id)?.rarete;
  const trop: string[] = [];
  const voir = (id: string | undefined, ou: string) => {
    const r = id ? rarete(id) : undefined;
    if (id && r && r !== 'commun' && (RARETE_NIVEAU_MIN[r] ?? 1) > nivMax && !dm.objets.has(id)) trop.push(`${id} (${r}, ${ou})`);
  };
  const tablesCitees = new Set<string>(dm.tables.keys());
  for (const t of dm.tresors.values()) {
    t.contenu.objets.forEach((o) => voir(o.objet, `trésor ${t.id}`));
    t.contenu.tables.forEach((x) => tablesCitees.add(x.table));
  }
  for (const t of dm.tables.values()) for (const e of t.entrees) {
    voir(e.objet, `table ${t.id}`);
    if (e.table) tablesCitees.add(e.table);
  }
  for (const p of dm.pnj.values()) {
    p.boutique?.stock.forEach((s) => voir(s.objet, `boutique de ${p.id}`));
    p.boutique?.tables.forEach((x) => tablesCitees.add(x));
  }
  for (const q of dm.quetes.values()) q.recompenses.objets.forEach((o) => voir(o, `récompense de ${q.id}`));
  if (trop.length) avis.push(`Épisode : butin trop rare pour les niveaux ${nivMin} à ${nivMax} (objets du catalogue ; un objet unique de l'épisode se déclare dans objets/) : ${liste(trop)}.`);
  const hautes = [...tablesCitees]
    .map((id) => tableDe(dm, id))
    .filter((t): t is NonNullable<typeof t> => !!t && (PALIER_NIVEAU_MIN[t.palier] ?? 1) > nivMax)
    .map((t) => `${t.id} (palier ${t.palier})`);
  if (hautes.length) avis.push(`Épisode : tables de butin d’un palier trop haut pour les niveaux ${nivMin} à ${nivMax} : ${liste(hautes)}.`);

  // 6. Les trois degrés de butin (F4) : 1 à 3 objets uniques, rattachés à la quête principale ou au boss ; un objet nommé a son histoire.
  avis.push(...conseilsButinEpisode(dm));

  return avis;
}
