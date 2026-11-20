// `pnpm monde quete` et `pnpm monde quetes` (F3 du 20/11/2026) : la fiche de quête qui produit le JSON des étapes, et le bilan des quêtes d'un monde
// (avis de la fiche F3, nombre de quêtes, preuve par le parcours automatique). Séparé de `cli.ts` pour être testé.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Donnees } from '../../packages/regles/src/donnees';
import { conseilsQuetes } from '../../packages/regles/src/monde/episode';
import { genererQuete, lireFiches } from '../../packages/regles/src/monde/quete-fiche';
import { avisQuetes } from '../../packages/regles/src/monde/quetes-avis';
import type { DonneesMonde } from '../../packages/regles/src/monde/schemas';
import { explorerParcours } from '../../packages/regles/src/verification/parcours';

export interface ResultatCli {
  lignes: string[];
  /** Code de sortie 1 : une fiche inutilisable, une quête que le parcours n'a pas terminée. */
  echec: boolean;
}

/** Les fiches d'un fichier JSON (une fiche, ou une liste) : la quête, ses sujets, ses drapeaux, ses avis. Avec `ecrire`, la quête est écrite dans `quetes/<id>.json` du monde. */
export function genererDepuisFichier(fichier: string, opts: { dm?: DonneesMonde; srd?: Donnees; dossierMonde?: string; ecrire?: boolean }): ResultatCli {
  const lignes: string[] = [];
  let echec = false;
  let json: unknown;
  try {
    json = JSON.parse(readFileSync(fichier, 'utf8'));
  } catch (e) {
    return { lignes: [`❌ Fiche illisible : ${fichier} (${(e as Error).message})`], echec: true };
  }
  const { fiches, erreurs } = lireFiches(json);
  for (const e of erreurs) lignes.push(`❌ ${e}`);
  if (erreurs.length) echec = true;
  for (const fiche of fiches) {
    const r = genererQuete(fiche, opts.dm, opts.srd);
    lignes.push(`\n${r.erreurs.length ? '❌' : '✅'} Quête « ${fiche.id} » (${fiche.but}, ${fiche.type}) — fiche de ${fiche.donneur}${opts.dm ? ` dans « ${opts.dm.monde.id} »` : ' (sans monde : structure seule)'}`);
    for (const e of r.erreurs) lignes.push(`  ERREUR  ${e}`);
    if (r.erreurs.length || !r.quete) {
      echec = true;
      continue;
    }
    lignes.push('  Quête (à écrire dans quetes/, puis à retoucher à la main) :', JSON.stringify([r.quete], null, 2).split('\n').map((l) => `    ${l}`).join('\n'));
    lignes.push('  Sujets à ajouter aux PNJ (pnj/) :', JSON.stringify(r.sujets, null, 2).split('\n').map((l) => `    ${l}`).join('\n'));
    lignes.push(`  Drapeaux posés : ${r.drapeaux.join(', ') || '—'}`);
    for (const a of r.avis) lignes.push(`  avis    ${a}`);
    if (opts.ecrire) {
      if (!opts.dossierMonde) {
        lignes.push('  ❌ --ecrire demande un monde : pnpm monde quete <fiche.json> <monde> --ecrire');
        echec = true;
        continue;
      }
      const dossier = join(opts.dossierMonde, 'quetes');
      const chemin = join(dossier, `${fiche.id}.json`);
      if (existsSync(chemin)) {
        lignes.push(`  ❌ ${chemin} existe déjà : rien n'est écrasé.`);
        echec = true;
        continue;
      }
      mkdirSync(dossier, { recursive: true });
      writeFileSync(chemin, `${JSON.stringify([r.quete], null, 2)}\n`);
      lignes.push(`  📝 Quête écrite : ${chemin} (les sujets restent à coller dans pnj/ : le générateur ne modifie pas les fiches de PNJ).`);
    }
  }
  return { lignes, echec };
}

/** Le bilan des quêtes d'un monde : nombre, avis de la fiche F3, et (option) une preuve par le parcours automatique pour chaque quête. */
export function bilanDesQuetes(id: string, dm: DonneesMonde, srd: Donnees, opts: { parcours?: boolean; etats?: number; ms?: number; graines?: number[] } = {}): ResultatCli {
  const lignes: string[] = [];
  let echec = false;
  const parType: Record<string, number> = {};
  for (const q of dm.quetes.values()) parType[q.type] = (parType[q.type] ?? 0) + 1;
  const avis = [...conseilsQuetes(dm), ...avisQuetes(dm, srd).map((a) => a.message)];
  lignes.push(`\n${avis.length ? '⚠️ ' : '✅'} ${id} — ${dm.quetes.size} quête(s) ${JSON.stringify(parType)}, ${avis.length} avis (jamais bloquants)`);
  for (const a of avis) lignes.push(`  avis    ${a}`);
  if (opts.parcours) {
    const t0 = Date.now();
    const rap = explorerParcours(
      { dm, srd },
      { quetes: true, budgetEtats: opts.etats ?? 6000, budgetMs: opts.ms ?? 120_000, ...(opts.graines ? { graines: opts.graines } : {}) },
    );
    const q = rap.quetes!;
    // Les quêtes que la passe d'ensemble n'a pas terminées sont reprises une à une, la recherche tout entière tournée vers elles (les fins ne la guident plus) :
    // un quart du temps de la passe d'ensemble chacune.
    const prouvees = [...q.prouvees];
    let restantes = [...q.nonProuvees];
    for (const id of q.nonProuvees) {
      const r1 = explorerParcours({ dm, srd }, { quetes: [id], sansFins: true, budgetEtats: opts.etats ?? 6000, budgetMs: Math.max(5_000, Math.round((opts.ms ?? 120_000) / 4)), ...(opts.graines ? { graines: opts.graines } : {}) });
      prouvees.push(...(r1.quetes?.prouvees ?? []));
      if (r1.quetes?.prouvees.length) restantes = restantes.filter((x) => x !== id);
    }
    lignes.push(`
${restantes.length ? '⚠️ ' : '✅'} ${id} — ${prouvees.length}/${dm.quetes.size} quêtes terminées par le parcours automatique (${((Date.now() - t0) / 1000).toFixed(1)} s ; passe d'ensemble : ${rap.etats} états, arrêt : ${rap.arret}${q.nonProuvees.length ? `, puis ${q.nonProuvees.length} passe(s) ciblée(s)` : ''})`);
    for (const p of prouvees) lignes.push(`  ✅ ${p.fin} — ${p.etapes.length} pas (graine ${p.graine})`);
    for (const n of restantes) lignes.push(`  ❌ ${n} — non terminée (avec ce budget : ce n'est pas une preuve d'impossibilité ; relancer avec --etats ou --ms plus grand)`);
    lignes.push(`  hypothèses : ${rap.hypotheses.join(' ')}`);
    if (restantes.length) echec = true;
  }
  return { lignes, echec };
}
