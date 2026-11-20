// La réserve de décors (F8 du 20/11/2026, docs/PRD-SAGA.md, docs/BIBLIOTHEQUE-COMMUNE.md « Réserve de décors ») :
//   - le lot générique encore à générer (`pnpm images decors [--ids a,b] [--max N] [--go]`) : simulation par défaut, payant seulement avec --go ;
//   - le registre des décors (`pnpm images communs registre`) : une partie GÉNÉRÉE (le catalogue, les décors qui servent dans chaque épisode d'après les
//     manifestes) et une partie ÉCRITE (lieux déjà vus, ambiances, à ne pas refaire), que le créateur d'histoires lit avant d'écrire les lieux.
// Les fonctions de ce fichier sont pures (testées) ; les fichiers sont lus et écrits par `cli.ts` et `communs.ts`.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { TableLieuxAGenerer, TableLieuxCommuns, TYPES_DE_DECOR, typesIncomplets, VARIANTES_PAR_TYPE, type EntreeLieuAGenerer, type EntreeLieuCommun } from '../../packages/regles/src/monde/communs';
import type { Charte, Element } from './charte';
import { RACINE } from './charte';

export const CATALOGUE_DECORS = join(RACINE, 'apps', 'jeu', 'src', 'communs', 'lieux', 'catalogue.json');
export const LOT_DECORS = join(RACINE, 'packages', 'donnees', 'visuel', 'lieux-communs-a-generer.json');
export const REGISTRE_DECORS = join(RACINE, 'docs', 'REGISTRE-DECORS.md');

export function lireCatalogueDecors(chemin = CATALOGUE_DECORS): EntreeLieuCommun[] {
  return TableLieuxCommuns.parse(JSON.parse(readFileSync(chemin, 'utf8'))).lieux;
}

export function lireLotDecors(chemin = LOT_DECORS): { lot: string; lieux: EntreeLieuAGenerer[] } {
  const t = TableLieuxAGenerer.parse(JSON.parse(readFileSync(chemin, 'utf8')));
  return { lot: t.lot, lieux: t.lieux };
}

/** Les décors du lot qui ne sont pas encore au catalogue (un lot installé n'a plus rien à générer : ses prompts restent dans le fichier, pour mémoire). */
export function lotRestant<T extends { id: string }>(lot: readonly T[], catalogue: readonly { id: string }[]): T[] {
  const faits = new Set(catalogue.map((e) => e.id));
  return lot.filter((e) => !faits.has(e.id));
}

/** Un élément par décor à générer : la charte visuelle, la scène, « vue large, aucun personnage », les contraintes. Un décor déjà au catalogue n'est pas refait. */
export function elementsDecors(charte: Charte, lot: readonly EntreeLieuAGenerer[], ids?: readonly string[], dejaFaits: ReadonlySet<string> = new Set()): Element[] {
  return lot
    .filter((d) => (!ids || ids.includes(d.id)) && !dejaFaits.has(d.id))
    .map((d) => ({
      id: d.id,
      groupe: 'lieux' as const,
      nom: d.id,
      format: 'paysage' as const,
      references: [],
      prompt: [
        charte.style,
        `Environment illustration of a location: ${d.prompt}`,
        'Wide cinematic establishing shot. No people and no creatures in the image: only the place itself. Generic, anonymous setting: no signature landmark, no heraldry, no symbol, no readable sign.',
        charte.contraintes,
      ].join('\n'),
    }));
}

/** Ce que le lot coûtera au plus (annonce avant tout accord) : images à faire × coût d'une image du service. */
export function coutAnnonce(nombre: number, usdParImage = 0.009): number {
  return Math.round(nombre * usdParImage * 1000) / 1000;
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Le registre des décors
// ---------------------------------------------------------------------------------------------------------------------------------

export const DEBUT_GENERE = '<!-- DEBUT-GENERE : ne pas modifier à la main, `pnpm images communs registre` le réécrit -->';
export const FIN_GENERE = '<!-- FIN-GENERE -->';

const TITRES_TYPES: Record<string, string> = {
  taverne: 'Taverne',
  chambre: 'Chambre',
  sanctuaire: 'Sanctuaire',
  'maison-du-chef': 'Maison du chef',
  forge: 'Forge',
  marche: 'Marché',
  boutique: 'Boutique',
  'interieur-modeste': 'Intérieur modeste',
  'cave-ou-grenier': 'Cave ou grenier',
  'place-du-village': 'Place du village',
};

/** Un monde et les décors communs que son manifeste cite (`commun:lieux/<id>`), avec le lieu qui les porte. */
export interface UsageDecors {
  monde: string;
  decors: { id: string; lieu: string }[];
}

/** Les décors communs cités par les manifestes d'images (lecture des fichiers : `outils/images/communs.ts`). */
export function usagesDeDecors(racineMondes: string): UsageDecors[] {
  const res: UsageDecors[] = [];
  for (const monde of readdirSync(racineMondes).sort()) {
    const f = join(racineMondes, monde, 'images', 'manifeste.json');
    if (!existsSync(f)) continue;
    const m = JSON.parse(readFileSync(f, 'utf8')) as { lieux?: Record<string, string> };
    const decors = Object.entries(m.lieux ?? {})
      .flatMap(([lieu, fichier]) => {
        const r = /^commun:lieux\/([a-z0-9-]+)$/.exec(fichier);
        return r ? [{ id: r[1]!, lieu }] : [];
      })
      .sort((a, b) => a.lieu.localeCompare(b.lieu));
    if (decors.length) res.push({ monde, decors });
  }
  return res;
}

/** La partie générée du registre : identique à elle-même pour les mêmes entrées (le test la régénère et la compare). */
export function registreGenere(catalogue: readonly EntreeLieuCommun[], aGenerer: readonly EntreeLieuAGenerer[], usages: readonly UsageDecors[], lot = 'à valider'): string {
  const lignes: string[] = [];
  lignes.push('### Catalogue (généré)', '');
  lignes.push(`${catalogue.length} décor(s) en réserve, ${VARIANTES_PAR_TYPE} variantes visées par type. Une image : \`apps/jeu/src/communs/lieux/<id>.webp\` ; une histoire la cite dans son manifeste : \`"lieux": { "<id-du-lieu>": "commun:lieux/<id>" }\`.`, '');
  for (const type of TYPES_DE_DECOR) {
    const dedans = catalogue.filter((e) => e.type === type);
    const prevus = aGenerer.filter((e) => e.type === type);
    lignes.push(`#### ${TITRES_TYPES[type]} (\`${type}\`) — ${dedans.length} en réserve${prevus.length ? `, ${prevus.length} à générer` : ''}`, '');
    if (!dedans.length && !prevus.length) lignes.push('_Aucun décor._', '');
    else {
      lignes.push('| Id | Vu | Ambiance | Origine |', '| --- | --- | --- | --- |');
      for (const e of dedans) lignes.push(`| \`${e.id}\` | ${e.interieur ? 'intérieur' : 'extérieur'} — ${e.description} | ${e.ambiance} | ${'monde' in e.origine ? `${e.origine.monde} / ${e.origine.lieu}` : `lot ${e.origine.lot}`} |`);
      for (const e of prevus) lignes.push(`| \`${e.id}\` _(à générer)_ | ${e.interieur ? 'intérieur' : 'extérieur'} — ${e.description} | ${e.ambiance} | lot ${lot} |`);
      lignes.push('');
    }
  }
  const incomplets = typesIncomplets(catalogue, aGenerer);
  lignes.push('### Types incomplets (généré)', '');
  if (!incomplets.length) lignes.push(`Tous les types ont leurs ${VARIANTES_PAR_TYPE} variantes.`, '');
  else {
    lignes.push('| Type | En réserve | À générer | Manque encore |', '| --- | --- | --- | --- |');
    for (const x of incomplets) lignes.push(`| \`${x.type}\` | ${x.presentes} | ${x.prevues} | ${Math.max(0, x.manque - x.prevues)} |`);
    lignes.push('');
  }
  lignes.push('### Où les décors servent (généré d\'après les manifestes)', '');
  if (!usages.length) lignes.push('Aucun épisode ne cite encore `commun:lieux/…`.', '');
  else {
    lignes.push('| Épisode | Lieu | Décor |', '| --- | --- | --- |');
    for (const u of usages) for (const d of u.decors) lignes.push(`| ${u.monde} | ${d.lieu} | \`${d.id}\` |`);
    lignes.push('');
  }
  return lignes.join('\n');
}

/** Remplace la partie générée d'un registre (entre les repères), le reste est intact ; sans repères, ajoute la partie générée à la fin. */
export function ecrireRegistre(existant: string | undefined, genere: string): string {
  const bloc = `${DEBUT_GENERE}\n\n${genere}\n${FIN_GENERE}`;
  if (!existant) return bloc + '\n';
  const a = existant.indexOf(DEBUT_GENERE);
  const b = existant.indexOf(FIN_GENERE);
  if (a < 0 || b < a) return `${existant.replace(/\n*$/, '\n\n')}${bloc}\n`;
  return existant.slice(0, a) + bloc + existant.slice(b + FIN_GENERE.length);
}

/** Écrit le registre : la partie générée est réécrite, la partie écrite (avant les repères) reste. */
export function mettreAJourRegistre(racineMondes: string, fichier = REGISTRE_DECORS): { ecrit: boolean; changements: boolean } {
  const lot = existsSync(LOT_DECORS) ? lireLotDecors() : undefined;
  const catalogue = lireCatalogueDecors();
  const genere = registreGenere(catalogue, lotRestant(lot?.lieux ?? [], catalogue), usagesDeDecors(racineMondes), lot?.lot);
  const avant = existsSync(fichier) ? readFileSync(fichier, 'utf8') : undefined;
  const apres = ecrireRegistre(avant, genere);
  if (apres === avant) return { ecrit: false, changements: false };
  writeFileSync(fichier, apres);
  return { ecrit: true, changements: true };
}
