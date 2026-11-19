// Le butin par difficulté et par niveau (F4 de docs/PRD-SAGA.md, 19/11/2026).
//
// Trois choses, toutes additives (P1, P2) :
//   1. la DIFFICULTÉ d'un contenant ou d'une rencontre (max du DD du verrou, du DD du piège et du FP du gardien, ramenés à un même
//      barème) ;
//   2. le PLAFOND lu au tirage, seulement dans un monde qui déclare `"butinPlafonne": true` : une entrée ne sort que si son palier ne
//      dépasse pas celui du niveau réel du groupe, jamais un objet de quête, une clé ni un objet `unique`, et la difficulté pousse vers
//      les entrées les plus rares du palier permis ;
//   3. les AVIS du validateur sur les écarts (trésor riche sans obstacle, obstacle sérieux sans rien dedans, objets uniques d'un épisode).
// Sans le drapeau, `tirerTable` (monde/exploration.ts) ne passe pas ici : les tirages d'avant sont inchangés à graine égale.
import type { Donnees } from '../donnees';
import { tableDe } from './butin-commun';
import { valeurFp } from './depouilles';
import type { DonneesMonde, Objet, RencontreMonde, TableButin, Tresor } from './schemas';

type EntreeButin = TableButin['entrees'][number];

export type Palier = 1 | 2 | 3 | 4;

/** Ordre des raretés, de la plus courante à la plus rare. */
const ORDRE_RARETE = ['commun', 'peu-commun', 'rare', 'tres-rare', 'legendaire'] as const;

/** Le palier de butin à partir duquel une rareté se trouve (1 = niveaux 1-4, 2 = 5-10, 3 = 11-16, 4 = 17-20 : le barème des tables communes). */
export const PALIER_DE_RARETE: Record<string, Palier> = { commun: 1, 'peu-commun': 1, rare: 2, 'tres-rare': 3, legendaire: 4 };

/** Les catégories qu'aucun tirage ne donne jamais : ce qui sert à une quête ou ouvre quelque chose s'écrit à la main. */
export const CATEGORIES_JAMAIS_TIREES: readonly string[] = ['quete', 'cle'];

/** Le palier de butin d'un niveau de groupe. */
export const palierDeNiveau = (niveau: number): Palier => (niveau <= 4 ? 1 : niveau <= 10 ? 2 : niveau <= 16 ? 3 : 4);

/** Ce que le moteur sait d'un objet pour décider de le tirer : celui du monde d'abord, sinon celui du catalogue SRD (armes et armures : communes). */
export function infosObjet(dm: Pick<DonneesMonde, 'objets'>, srd: Donnees | undefined, id: string): { rarete: string; categorie?: string; degre?: Objet['degre']; valeurPo: number } {
  const o = dm.objets.get(id);
  if (o) return { rarete: o.rarete, categorie: o.categorie, degre: o.degre, valeurPo: o.valeurPo };
  const s = srd?.objets.get(id);
  if (s) return { rarete: s.rarete, categorie: s.categorie, valeurPo: s.valeurPo };
  return { rarete: 'commun', valeurPo: srd?.armes.get(id)?.prixPo ?? srd?.armures.get(id)?.prixPo ?? 0 };
}

// ---------------------------------------------------------------------------
// 1. La difficulté
// ---------------------------------------------------------------------------

/** Un FP ramené au barème des DD (FP 1/4 → 10,5 ; FP 1 → 12 ; FP 3 → 16 ; FP 5 → 20). */
export const ddDeFp = (fp: number): number => 10 + 2 * fp;

/** Le DD équivalent de la difficulté déclarée d'une rencontre (faible ≈ un verrou facile, élevée ≈ un piège sérieux). */
const DD_DE_DIFFICULTE: Record<RencontreMonde['difficulte'], number> = { faible: 11, moderee: 14, elevee: 17 };

/** De 0 (DD 10 ou moins) à 1 (DD 20 ou plus) : ce que la difficulté pousse vers le haut du palier. */
export const degreDeDd = (dd: number): number => Math.max(0, Math.min(1, (dd - 10) / 10));

export interface Difficulte {
  /** Le plus haut DD du verrou et du piège (détection ou désamorçage), s'il y en a. */
  dd?: number;
  /** Le FP le plus haut des monstres du gardien, s'il y en a un. */
  fp?: number;
  /** Le maximum de tout cela, au barème des DD ; 0 s'il n'y a aucun obstacle. */
  equivalentDd: number;
  /** De 0 à 1, pour le tirage. */
  degre: number;
}

const fpMax = (srd: Donnees | undefined, monstres: { profil: string }[]): number | undefined => {
  const fps = monstres.map((m) => srd?.monstres.get(m.profil)?.fp).filter((f): f is string => !!f).map(valeurFp);
  return fps.length ? Math.max(...fps) : undefined;
};

/** La difficulté d'une rencontre : sa difficulté déclarée ou le FP de son plus fort monstre, le plus haut des deux. */
export function difficulteDeRencontre(srd: Donnees | undefined, r: RencontreMonde): Difficulte {
  const fp = fpMax(srd, r.monstres);
  const equivalentDd = Math.max(DD_DE_DIFFICULTE[r.difficulte], fp === undefined ? 0 : ddDeFp(fp));
  return { ...(fp === undefined ? {} : { fp }), equivalentDd, degre: degreDeDd(equivalentDd) };
}

/** La difficulté d'un contenant : max(DD du verrou, DD du piège, FP du gardien). Le DD d'une cachette ne compte pas (c'est l'affaire de la fouille). */
export function difficulteDeTresor(dm: DonneesMonde, srd: Donnees | undefined, t: Tresor): Difficulte {
  const piege = t.acces.piege ? dm.pieges.get(t.acces.piege) : undefined;
  const dds = [t.acces.verrou?.dd, piege?.detection.dd, piege?.desarmement.dd].filter((d): d is number => typeof d === 'number');
  const gardien = t.gardien ? dm.rencontres.get(t.gardien) : undefined;
  const fp = gardien ? fpMax(srd, gardien.monstres) : undefined;
  const dd = dds.length ? Math.max(...dds) : undefined;
  const equivalentDd = Math.max(dd ?? 0, fp === undefined ? 0 : ddDeFp(fp));
  return { ...(dd === undefined ? {} : { dd }), ...(fp === undefined ? {} : { fp }), equivalentDd, degre: degreDeDd(equivalentDd) };
}

// ---------------------------------------------------------------------------
// 2. Le plafond lu au tirage
// ---------------------------------------------------------------------------

/** Ce qu'un tirage plafonné sait : le palier permis, la difficulté (0 à 1), et de quoi juger un objet. */
export interface ContexteButin {
  palier: Palier;
  degre: number;
  dm: Pick<DonneesMonde, 'objets' | 'tables'>;
  srd?: Donnees;
}

/** Le palier d'une entrée : le plus haut de celui de sa table, de celui de sa sous-table et de la rareté de son objet. */
function palierDeLEntree(e: EntreeButin, table: TableButin, ctx: ContexteButin): Palier {
  let pal: number = table.palier;
  if (e.objet) pal = Math.max(pal, PALIER_DE_RARETE[infosObjet(ctx.dm, ctx.srd, e.objet).rarete] ?? 1);
  if (e.table) pal = Math.max(pal, tableDe(ctx.dm, e.table)?.palier ?? 1);
  return Math.min(4, pal) as Palier;
}

/** Une entrée peut-elle sortir ? Palier permis, et jamais un objet de quête, une clé ou un objet unique. */
function permise(e: EntreeButin, table: TableButin, ctx: ContexteButin): boolean {
  if (palierDeLEntree(e, table, ctx) > ctx.palier) return false;
  if (e.objet) {
    const o = infosObjet(ctx.dm, ctx.srd, e.objet);
    if ((o.categorie && CATEGORIES_JAMAIS_TIREES.includes(o.categorie)) || o.degre === 'unique') return false;
  }
  return true;
}

/** Le rang d'une entrée dans le palier : 0 (courante) et plus (rare, ou sous-table d'un palier supérieur). */
function rangDeLEntree(e: EntreeButin, ctx: ContexteButin): number {
  if (e.objet) return Math.max(0, ORDRE_RARETE.indexOf((infosObjet(ctx.dm, ctx.srd, e.objet).rarete as (typeof ORDRE_RARETE)[number]) ?? 'commun'));
  if (e.table) return Math.max(0, (tableDe(ctx.dm, e.table)?.palier ?? 1) - 1);
  return 0;
}

/**
 * Les entrées qu'un tirage plafonné retient, avec leur poids après poussée de la difficulté : « rien » pèse moins quand c'est difficile
 * (jusqu'à un quart de son poids), une entrée de rang r pèse (1 + 2 × degré × r) fois plus. Sans entrée permise, la liste est vide.
 */
export function entreesRetenues(table: TableButin, ctx: ContexteButin): { entree: EntreeButin; poids: number }[] {
  return table.entrees
    .filter((e) => permise(e, table, ctx))
    .map((e) => ({ entree: e, poids: e.rien ? e.poids * (1 - 0.75 * ctx.degre) : e.poids * (1 + 2 * ctx.degre * rangDeLEntree(e, ctx)) }));
}

// ---------------------------------------------------------------------------
// 3. Les avis du validateur
// ---------------------------------------------------------------------------

/** La valeur d'un trésor, en po : ce qu'il contient d'écrit, plus l'espérance de ses tirages (pondérée, sous-tables comprises). */
export function valeurDeTresor(dm: DonneesMonde, srd: Donnees | undefined, t: Tresor): number {
  const p = t.contenu.pieces;
  let v = (p?.po ?? 0) + (p?.pa ?? 0) / 10 + (p?.pc ?? 0) / 100;
  for (const o of t.contenu.objets) v += infosObjet(dm, srd, o.objet).valeurPo * o.quantite;
  for (const tb of t.contenu.tables) v += valeurDeTable(dm, srd, tb.table, 0) * tb.jets;
  return v;
}

/** L'espérance en po d'un tirage sur une table (les pièces tirées aux dés : leur moyenne). */
function valeurDeTable(dm: DonneesMonde, srd: Donnees | undefined, id: string, profondeur: number): number {
  const t = tableDe(dm, id);
  if (!t || profondeur > 5) return 0;
  const total = t.entrees.reduce((s, e) => s + e.poids, 0);
  let v = 0;
  for (const e of t.entrees) {
    let x = 0;
    if (e.objet) x = infosObjet(dm, srd, e.objet).valeurPo * (e.quantite ?? 1);
    else if (e.table) x = valeurDeTable(dm, srd, e.table, profondeur + 1);
    else if (e.pieces) {
      const m = /^(\d+)d(\d+)([+-]\d+)?$/.exec(e.pieces.des);
      const moyenne = m ? Number(m[1]) * ((Number(m[2]) + 1) / 2) + Number(m[3] ?? 0) : 0;
      x = e.pieces.unite === 'po' ? moyenne : e.pieces.unite === 'pa' ? moyenne / 10 : moyenne / 100;
    }
    v += (x * e.poids) / total;
  }
  return v;
}

/** Ce qu'un trésor est « riche » au niveau d'un monde : 60 po par niveau du palier haut (≈ 120 po aux niveaux 1-2, 240 po aux niveaux 3-4). */
export const SEUIL_RICHE_PAR_NIVEAU = 60;
/** Au-dessous de 10 po par niveau, un contenant est « vide » de valeur (s'il ne porte ni objet de quête, ni clé, ni indice, ni objet nommé). */
export const SEUIL_PAUVRE_PAR_NIVEAU = 10;
/** Un obstacle est « sérieux » à partir de ce DD équivalent (un DD 15 ; un FP 2,5). */
export const SEUIL_OBSTACLE_SERIEUX = 15;
/** Une cachette de ce DD ou plus compte comme un obstacle pour l'avis « riche sans obstacle ». */
const DD_CACHE_QUI_COMPTE = 15;

const liste = (xs: string[], n = 6) => `${xs.slice(0, n).join(', ')}${xs.length > n ? `… (${xs.length} en tout)` : ''}`;

/**
 * Les avis de butin (tous les mondes ; jamais une erreur, P1) : un trésor riche sans obstacle, un obstacle sérieux sans rien dedans, une
 * table qui cite un objet qu'un tirage plafonné ne donnerait jamais (quête, clé, unique), et, dans un monde plafonné, une table d'un palier
 * au-dessus du monde (elle ne donnera rien).
 */
export function conseilsButin(dm: DonneesMonde, srd: Donnees): string[] {
  const avis: string[] = [];
  const niveau = dm.monde.niveaux.max;
  const riche = SEUIL_RICHE_PAR_NIVEAU * niveau;
  const pauvre = SEUIL_PAUVRE_PAR_NIVEAU * niveau;

  const richesSansObstacle: string[] = [];
  const obstaclesSansRien: string[] = [];
  for (const t of dm.tresors.values()) {
    const d = difficulteDeTresor(dm, srd, t);
    const valeur = valeurDeTresor(dm, srd, t);
    const cacheDure = (t.acces.cache?.dd ?? 0) >= DD_CACHE_QUI_COMPTE;
    if (valeur >= riche && d.equivalentDd === 0 && !cacheDure) richesSansObstacle.push(`${t.id} (≈ ${Math.round(valeur)} po)`);
    // « Rien » de valeur : ni argent notable, ni objet de quête, clé, nommé ou unique, ni indice, ni peu commun ou mieux.
    const sert = !!t.indice || t.contenu.objets.some((o) => {
      const i = infosObjet(dm, srd, o.objet);
      return (i.categorie && CATEGORIES_JAMAIS_TIREES.includes(i.categorie)) || !!i.degre || i.rarete !== 'commun';
    });
    if (d.equivalentDd >= SEUIL_OBSTACLE_SERIEUX && valeur < pauvre && !sert) obstaclesSansRien.push(`${t.id} (difficulté ${Math.round(d.equivalentDd)}, ≈ ${Math.round(valeur)} po)`);
  }
  if (richesSansObstacle.length) avis.push(`Butin et difficulté : trésors riches (≥ ${riche} po pour les niveaux jusqu'à ${niveau}) sans verrou, piège ni gardien (plus c'est riche, plus l'accès doit être difficile ; F4) : ${liste(richesSansObstacle)}.`);
  if (obstaclesSansRien.length) avis.push(`Butin et difficulté : obstacles sérieux (DD ${SEUIL_OBSTACLE_SERIEUX} ou plus, ou FP 2,5 ou plus) pour un contenu sans valeur (moins de ${pauvre} po, ni objet de quête, clé, nommé ou rare, ni indice) : ${liste(obstaclesSansRien)}.`);

  // Des objets qu'un tirage plafonné ne donnerait jamais : quête, clé, unique.
  const mal: string[] = [];
  for (const t of dm.tables.values()) {
    for (const e of t.entrees) {
      if (!e.objet) continue;
      const i = infosObjet(dm, srd, e.objet);
      if ((i.categorie && CATEGORIES_JAMAIS_TIREES.includes(i.categorie)) || i.degre === 'unique') mal.push(`${e.objet} (table ${t.id})`);
    }
  }
  if (mal.length) avis.push(`Butin et difficulté : objets de quête, clés ou objets uniques dans une table de tirage (un monde plafonné ne les donnerait jamais ; écrivez-les dans un trésor ou une récompense) : ${liste(mal)}.`);

  // Un monde plafonné qui cite une table d'un palier trop haut : elle ne donnera rien (le profil « épisode » le dit déjà de son côté).
  if (dm.monde.butinPlafonne && dm.monde.format !== 'episode') {
    const pal = palierDeNiveau(niveau);
    const citees = new Set<string>();
    for (const t of dm.tresors.values()) t.contenu.tables.forEach((x) => citees.add(x.table));
    for (const r of dm.rencontres.values()) r.butin.tables.forEach((x) => citees.add(x));
    const hautes = [...citees].map((id) => tableDe(dm, id)).filter((t): t is TableButin => !!t && t.palier > pal).map((t) => `${t.id} (palier ${t.palier})`);
    if (hautes.length) avis.push(`Butin et difficulté : tables d'un palier au-dessus du niveau ${niveau} dans un monde à butin plafonné (elles ne donneront rien) : ${liste(hautes)}.`);
  }
  return avis;
}

/** Les objets déclarés `unique` d'un monde, et où chacun est rattaché : quête principale (récompense), gardien d'un boss (trésor gardé par une rencontre élevée ou citée par la quête principale). */
export function uniquesDeLEpisode(dm: DonneesMonde): { id: string; rattache: boolean }[] {
  const principale = [...dm.quetes.values()].filter((q) => q.type === 'principale');
  const texteQuete = principale.map((q) => JSON.stringify(q.etapes)).join(' ');
  // Un boss : une rencontre de difficulté élevée, ou une rencontre que la quête principale cite.
  const boss = new Set([...dm.rencontres.values()].filter((r) => r.difficulte === 'elevee' || texteQuete.includes(`"${r.id}"`)).map((r) => r.id));
  const viaBoss = (t: Tresor) => (t.gardien && boss.has(t.gardien)) || [...dm.rencontres.values()].some((r) => boss.has(r.id) && r.butin.tresors.includes(t.id));
  return [...dm.objets.values()]
    .filter((o) => o.degre === 'unique')
    .map((o) => ({
      id: o.id,
      rattache: principale.some((q) => q.recompenses.objets.includes(o.id)) || [...dm.tresors.values()].some((t) => t.contenu.objets.some((x) => x.objet === o.id) && viaBoss(t)),
    }));
}

/** Les avis de butin du profil « épisode » : 1 à 3 objets uniques, rattachés à la quête principale ou au boss ; un objet nommé a son histoire (`lore`). */
export function conseilsButinEpisode(dm: DonneesMonde): string[] {
  const avis: string[] = [];
  const uniques = uniquesDeLEpisode(dm);
  if (uniques.length < 1 || uniques.length > 3) avis.push(`Épisode : ${uniques.length} objet(s) unique(s) déclaré(s) (\`degre: "unique"\` dans objets/ ; visé : 1 à 3, fixes, ceux de la quête principale ou du boss ; PRD-SAGA F4).`);
  const flottants = uniques.filter((u) => !u.rattache).map((u) => u.id);
  if (flottants.length) avis.push(`Épisode : objets uniques sans rattachement à la quête principale (récompense) ni à un boss (trésor gardé par une rencontre élevée ou citée par la quête) : ${liste(flottants)}.`);
  const sansHistoire = [...dm.objets.values()].filter((o) => o.degre === 'nomme' && !o.lore).map((o) => o.id);
  if (sansHistoire.length) avis.push(`Épisode : objets nommés sans \`lore\` (un objet nommé a une histoire que le MJ raconte) : ${liste(sansHistoire)}.`);
  return avis;
}
