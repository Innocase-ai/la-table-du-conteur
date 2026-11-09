// Module Savoirs : un PNJ parle librement, d'après sa fiche de savoir, et le jeu vérifie chaque réplique. Le LLM du jeu
// propose (le texte, les éléments de la fiche qu'il a utilisés, les faits qu'il révèle) ; le jeu décide : un élément
// qui n'est pas dans la fiche, un fait dont l'accès est fermé, un mot qui trahit un secret que le groupe ne connaît pas
// encore font refuser la réplique, et le LLM la reformule. C'est la règle « n'invente rien », rendue mécanique.
import { z } from 'zod';
import { attitude, pnjPresents } from '../monde/dialogue';
import { evaluerCondition } from '../monde/etat';
import { jouerEffets } from '../monde/exploration';
import type { Pnj } from '../monde/schemas';
import { nbMots, normaliser, savoirDe, savoirsDe, type Sait, type Savoir } from '../monde/savoirs-donnees';
import { commande, type Module, type Partie, type Transaction } from '../noyau/types';
import { libre, partieMonde, verser } from './commun';

export interface EtatSavoirs {
  /** Ce que chaque PNJ a déjà dit au groupe (ids de couleur et de savoir) : il ne se répète pas. */
  dits: Record<string, string[]>;
}

const etat = (p: Partie): EtatSavoirs => ((p.modules['savoirs'] ??= { dits: {} }) as EtatSavoirs);

/** Longueur maximale d'une réplique (mots). */
export const MOTS_MAX = 130;

/** Pourquoi un élément de savoir n'est pas accessible maintenant, ou `undefined` s'il l'est. */
export function accesFerme(t: { partie: Partie; ctx: Transaction['ctx'] }, pnj: Pnj, s: { acces: Sait['acces'] }): string | undefined {
  const pm = partieMonde(t as Transaction);
  if (s.acces.attitudeMin !== undefined && attitude(pm, pnj) < s.acces.attitudeMin) return 'il ne fait pas assez confiance au groupe';
  if (s.acces.condition && !evaluerCondition(s.acces.condition, t.partie.etat)) return 'les circonstances ne s’y prêtent pas encore';
  return undefined;
}

/** Les mots interdits maintenant : ceux des faits que le groupe ne connaît pas et qui ne sont pas révélés par cette réplique. */
export function motsTabous(t: { partie: Partie; ctx: Transaction['ctx'] }, revele: Set<string>): { mot: string; fait: string }[] {
  const res: { mot: string; fait: string }[] = [];
  for (const sv of savoirsDe(t.ctx.dm).savoirs)
    for (const s of sv.sait) {
      if (t.partie.etat.faits.includes(s.fait) || revele.has(s.fait)) continue;
      for (const mot of s.tabou) res.push({ mot, fait: s.fait });
    }
  return res;
}

export function contient(texte: string, mot: string): boolean {
  const m = normaliser(mot).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${m}([^a-z0-9]|$)`).test(normaliser(texte));
}

/** Vérifie une réplique : la liste de ses défauts (vide si elle est valide). */
export function verifierReplique(t: { partie: Partie; ctx: Transaction['ctx'] }, pnj: Pnj, sv: Savoir, e: { texte: string; utilise: string[]; revele: string[] }): string[] {
  const defauts: string[] = [];
  const connus = new Set([...sv.couleur.map((c) => c.id), ...sv.sait.map((s) => s.id)]);
  for (const id of e.utilise) if (!connus.has(id)) defauts.push(`« ${id} » n’est pas dans la fiche de ${pnj.nom} : ne le cite pas, ne l’invente pas`);
  const faitsPossibles = new Map(sv.sait.map((s) => [s.fait, s]));
  const reveles = new Set<string>();
  for (const f of e.revele) {
    const s = faitsPossibles.get(f);
    if (!s) {
      const element = sv.sait.find((x) => x.id === f);
      defauts.push(
        element
          ? `« ${f} » est l’identifiant d’un élément de sa fiche, pas d’un fait : dans \`revele\`, mets l’identifiant du fait (« ${element.fait} »), dans \`utilise\` celui de l’élément`
          : `${pnj.nom} ne connaît pas le fait « ${f} » : il ne peut pas le révéler`,
      );
      continue;
    }
    const ferme = accesFerme(t, pnj, s);
    if (ferme) defauts.push(`${pnj.nom} ne peut pas encore révéler « ${f} » : ${ferme} (reste évasif${s.evasif ? ` : ${s.evasif}` : ''})`);
    else reveles.add(f);
  }
  // Un élément (fait ou confidence) dont l'accès est fermé ne peut pas non plus être « utilisé » sans être révélé : il serait dit.
  for (const id of e.utilise) {
    const s = sv.sait.find((x) => x.id === id);
    const c = sv.couleur.find((x) => x.id === id);
    const ferme = s ? accesFerme(t, pnj, s) : c ? accesFerme(t, pnj, c) : undefined;
    if (ferme && !(s && t.partie.etat.faits.includes(s.fait))) defauts.push(`« ${id} » est verrouillé : ${ferme}${(s ?? c)?.evasif ? ` (reste évasif : ${(s ?? c)!.evasif})` : ''}`);
  }
  const mots = nbMots(e.texte);
  if (mots > MOTS_MAX) defauts.push(`la réplique fait ${mots} mots : ${MOTS_MAX} au plus`);
  for (const { mot, fait } of motsTabous(t, reveles)) if (contient(e.texte, mot)) defauts.push(`le mot « ${mot} » trahit un secret (${fait}) que le groupe ne connaît pas encore : reformule sans lui`);
  return defauts;
}

export const moduleSavoirs: Module = {
  id: 'savoirs',
  etatInitial: (): EtatSavoirs => ({ dits: {} }),
  commandes: {
    repondreEnPersonnage: commande({
      description:
        'Fait parler librement un personnage présent, dans sa voix, à la première personne (1 à 4 phrases), d’après sa fiche de savoir : passé, liens, souvenirs et opinions, faits qu’il connaît. Donne le texte de sa réplique, les ids des éléments de la fiche utilisés, et les ids des faits qu’il révèle au groupe (seulement ceux dont l’accès est ouvert). Une réplique qui cite autre chose est refusée.',
      entree: z.object({
        pnj: z.string(),
        texte: z.string().trim().min(1),
        utilise: z.array(z.string()).default([]),
        revele: z.array(z.string()).default([]),
      }),
      disponible: libre,
      executer: (t, e) => {
        const pnj = t.ctx.dm.pnj.get(e.pnj);
        if (!pnj) return { refus: `Personne ne s’appelle « ${e.pnj} ».` };
        if (!pnjPresents(partieMonde(t)).some((x) => x.id === pnj.id)) return { refus: `${pnj.nom} n’est pas ici.` };
        const sv = savoirDe(t.ctx.dm, pnj.id);
        if (!sv) return { refus: `${pnj.nom} n’a pas de fiche de savoir : ne le fais pas parler librement (utilise un de ses sujets).` };
        const defauts = verifierReplique(t, pnj, sv, e);
        if (defauts.length) return { refus: `Réplique refusée : ${defauts.join(' ; ')}.` };
        // Acceptée : la réplique est dite, les faits révélés sont appris, le PNJ s'en souvient.
        const dits = (etat(t.partie).dits[pnj.id] ??= []);
        for (const id of [...e.utilise, ...e.revele.map((f) => sv.sait.find((s) => s.fait === f)!.id)]) if (!dits.includes(id)) dits.push(id);
        const cr = jouerEffets(partieMonde(t), [], e.revele.map((fait) => ({ fait })));
        cr.narrations.unshift(e.texte);
        cr.paroles = 1;
        return verser(t, cr, { voix: pnj.nom });
      },
    }),
  },
  valider: (ctx) => {
    const dm = ctx.dm;
    const { savoirs, erreurs } = savoirsDe(dm);
    const vus = new Set<string>();
    for (const sv of savoirs) {
      const pnj = dm.pnj.get(sv.pnj);
      const ou = `Savoir « ${sv.pnj} »`;
      if (!pnj) erreurs.push(`${ou} : PNJ inconnu.`);
      if (vus.has(sv.pnj)) erreurs.push(`${ou} : deux fiches pour le même PNJ.`);
      vus.add(sv.pnj);
      const ids = [...sv.couleur.map((c) => c.id), ...sv.sait.map((s) => s.id)];
      for (const id of ids.filter((x, i) => ids.indexOf(x) !== i)) erreurs.push(`${ou} : identifiant « ${id} » en double.`);
      for (const l of sv.liens) if (l.pnj && !dm.pnj.has(l.pnj)) erreurs.push(`${ou} : lien vers un PNJ inconnu « ${l.pnj} ».`);
      for (const s of sv.sait) {
        if (!dm.faits.has(s.fait)) erreurs.push(`${ou}, « ${s.id} » : fait inconnu « ${s.fait} ».`);
        // Cohérence avec la fiche de dialogue : un secret verrouillé là ne peut pas être plus ouvert ici (la fuite serait voulue par erreur).
        for (const sec of pnj?.secrets ?? []) {
          if (sec.fait !== s.fait) continue;
          if (sec.attitudeMin !== undefined && (s.acces.attitudeMin ?? -Infinity) < sec.attitudeMin && !sec.jet)
            erreurs.push(`${ou}, « ${s.id} » : accès (${s.acces.attitudeMin ?? 'libre'}) plus ouvert que le secret de la fiche (attitude ${sec.attitudeMin}).`);
        }
      }
    }
    return erreurs;
  },
  conseils: (ctx) => {
    const avis: string[] = [];
    for (const sv of savoirsDe(ctx.dm).savoirs) {
      const ou = `Savoir « ${sv.pnj} »`;
      if (nbMots(sv.passe) < 70) avis.push(`${ou} : passé de ${nbMots(sv.passe)} mots ; visez 80 à 150, avec des noms, des dates et des lieux.`);
      if (sv.liens.length < 2) avis.push(`${ou} : ${sv.liens.length} lien(s) ; au moins 2 (qui il aime, craint, méprise).`);
      if (sv.couleur.length < 6) avis.push(`${ou} : ${sv.couleur.length} souvenir(s) ou opinion(s) ; au moins 6.`);
      if (sv.sait.length < 4) avis.push(`${ou} : ${sv.sait.length} fait(s) connu(s) ; au moins 4.`);
      for (const c of sv.couleur) if ((c.acces.attitudeMin !== undefined || c.acces.condition) && !c.evasif) avis.push(`${ou}, « ${c.id} » : confidence verrouillée sans \`evasif\`.`);
      if (!sv.sait.some((s) => s.acces.attitudeMin !== undefined || s.acces.condition)) avis.push(`${ou} : aucun fait verrouillé ; un personnage a au moins un secret, avec la condition qui le révèle.`);
      for (const s of sv.sait) if ((s.acces.attitudeMin !== undefined || s.acces.condition) && !s.evasif) avis.push(`${ou}, « ${s.id} » : verrouillé sans \`evasif\` (que laisse-t-il entendre ?).`);
      for (const s of sv.sait) if (!s.tabou.length && ctx.dm.faits.get(s.fait)?.categorie === 'secret') avis.push(`${ou}, « ${s.id} » : fait secret sans mot \`tabou\` (un mot suffit à trahir).`);
    }
    return avis;
  },
};
