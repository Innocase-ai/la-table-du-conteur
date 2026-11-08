// Cartes régionales d'un grand monde (Ombresang) construites depuis son atlas : `atlas-visuel/0N-region-*.md`, section « Prompt cartographique de référence » (repères visuels de chaque sous-région)
// et titres `### SR n.m — Nom` (noms exacts à écrire sur la carte). Essais dans `sorties/images/mondes/<monde>/cartes-regions/`, rien n'écrase `packages/mondes/<monde>/cartes/`.
// La dépense cumulée des fichiers .json du dossier est plafonnée (défaut 0,50 $).
//
//   pnpm exec tsx outils/images/cartes-regions.ts <monde> <service> --ref image.png [--regions 1,2] [--version b] [--plafond 0.5] [--afficher] [--go]    sans --go : simulation
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { genererLot, lireEnv, SORTIES, type Meta } from './cli';
import { RACINE, type Element } from './charte';
import { trouverService } from './services';

const COUT_PAR_DEFAUT = 0.07;

const STYLE =
  'The attached image is the STYLE REFERENCE: reproduce its art style exactly. Flat 2D orthographic top-down hand-inked fantasy atlas map on warm aged parchment, fine black pen linework, cross-hatched relief, soft desaturated watercolor washes, dotted ink trails for roads, every building, tree, ship and mountain drawn as a small flat ink symbol seen from directly above (no perspective, no 3D), calligraphic serif place-name labels, a title banner, a compass rose and a scale bar. Copy ONLY its art style, lettering and decorations. Do NOT copy its content, its layout or any of its place names: this is a different map of a different region.';

export interface RegionAtlas {
  numero: string;
  id: string;
  titre: string;
  noms: Map<string, string>;
  prompt: string;
}

/** Nom à écrire sur la carte : avant le « & », sans précision entre parenthèses. */
export function nomCarte(nom: string): string {
  return nom.replace(/\s*\([^)]*\)\s*/g, ' ').split(' & ')[0]!.trim();
}

/** Lit un fichier d'atlas de région et construit le prompt de sa carte (style de référence, repères de l'atlas, noms exacts des sous-régions). */
export function regionDepuisAtlas(fichier: string, texte: string): RegionAtlas {
  const numero = /^0(\d)-/.exec(fichier)?.[1];
  if (!numero) throw new Error(`${fichier} : numéro de région introuvable.`);
  const titre = /^# .*?Région \d : (.+)$/m.exec(texte)?.[1];
  if (!titre) throw new Error(`${fichier} : titre de région introuvable.`);
  const noms = new Map<string, string>();
  for (const m of texte.matchAll(/^### SR (\d\.\d) — (.+?) \(`/gm)) noms.set(m[1]!, nomCarte(m[2]!));
  if (noms.size !== 8) throw new Error(`${fichier} : ${noms.size} sous-régions au lieu de 8.`);
  const bloc = /## 5\.[^\n]*\n+```text\n([\s\S]*?)```/.exec(texte)?.[1];
  if (!bloc) throw new Error(`${fichier} : prompt de référence (§5) introuvable.`);
  const etiquette = (num: string) => `labelled "${noms.get(num)!.toUpperCase()}"`;
  const corps = bloc
    .replace(/Dark fantasy digital painting, top-down regional map of/, 'Regional map of')
    .replace(/\s*No text, no labels, no UI\./, '')
    .replace(/SR (\d\.\d)(?: [A-ZÉ][\w'’-]*(?: [A-ZÉ][\w'’-]*)*)?/g, (_m, n: string) => etiquette(n))
    .trim();
  const titreCarte = nomCarte(titre).toUpperCase();
  const liste = [...noms.values()].map((n) => `"${n.toUpperCase()}"`).join(', ');
  const consigne = `Labels, in the same calligraphy as the reference, spelled exactly: the title banner "${titreCarte}", and the eight sub-region names ${liste}, each written next to its own landmark as indicated above. These are the ONLY labels allowed. Do NOT write any other place name, in particular no other proper name that appears in the descriptions above. Exactly one compass rose and one scale bar. No people. Muted aged-watercolor colours.`;
  const slug = fichier.replace(/^0\d-region-/, '').replace(/\.md$/, '');
  return { numero, id: `carte-region-0${numero}-${slug}`, titre: titreCarte, noms, prompt: `${STYLE}\n${corps}\n${consigne}` };
}

/** Coût estimé de la prochaine image : le plus élevé déjà observé dans le dossier, sinon l'estimation par défaut. */
function coutEstime(dossier: string): number {
  const couts = existsSync(dossier) ? readdirSync(dossier).filter((f) => f.endsWith('.json')).map((f) => (JSON.parse(readFileSync(join(dossier, f), 'utf8')) as Meta).coutUsd ?? 0) : [];
  return Math.max(0, ...couts) || COUT_PAR_DEFAUT;
}

function depenseDejaFaite(dossier: string): number {
  if (!existsSync(dossier)) return 0;
  return readdirSync(dossier)
    .filter((f) => f.endsWith('.json'))
    .reduce((somme, f) => somme + ((JSON.parse(readFileSync(join(dossier, f), 'utf8')) as Meta).coutUsd ?? COUT_PAR_DEFAUT), 0);
}

async function main(): Promise<void> {
  const [monde, nomService, ...args] = process.argv.slice(2);
  if (!monde || !nomService) throw new Error('Usage : cartes-regions.ts <monde> <service> --ref image.png [--regions 1,2] [--plafond 0.5] [--afficher] [--go]');
  const option = (nom: string) => (args.includes(nom) ? args[args.indexOf(nom) + 1] : undefined);
  const go = args.includes('--go');
  const plafond = Number(option('--plafond') ?? 0.5);
  const service = trouverService(nomService);
  if (!service) throw new Error(`Service inconnu : ${nomService}`);
  const ref = option('--ref');
  if (!ref) throw new Error('--ref obligatoire : image de référence de style.');
  const voulues = option('--regions')?.split(',').map((s) => s.trim());
  const version = option('--version');

  const dossierAtlas = join(RACINE, 'packages/mondes', monde, 'atlas-visuel');
  const regions = readdirSync(dossierAtlas)
    .filter((f) => /^0[1-8]-region-.*\.md$/.test(f))
    .sort()
    .map((f) => regionDepuisAtlas(f, readFileSync(join(dossierAtlas, f), 'utf8')))
    .filter((r) => !voulues || voulues.includes(r.numero));

  const dossier = join(SORTIES, 'mondes', monde, 'cartes-regions');
  mkdirSync(dossier, { recursive: true });
  copyFileSync(ref, join(dossier, 'ref-style.png'));
  const env = lireEnv();
  for (const r of regions) {
    const idFichier = version ? `${r.id}-${version}` : r.id;
    if (args.includes('--afficher')) console.log(`\n===== ${idFichier} =====\n${r.prompt}\n`);
    if (existsSync(join(dossier, `${idFichier}.png`))) {
      console.log(`${idFichier} : déjà générée, ignorée.`);
      continue;
    }
    const deja = depenseDejaFaite(dossier);
    if (go && deja + coutEstime(dossier) > plafond) {
      console.log(`Plafond atteint : ${deja.toFixed(3)} $ déjà dépensés sur ${plafond.toFixed(2)} $. Arrêt.`);
      return;
    }
    const element: Element = { id: idFichier, groupe: 'cartes', nom: r.titre, format: 'paysage', prompt: r.prompt, references: ['ref-style'] };
    await genererLot(service, [element], env, go, 1, undefined, dossier);
  }
  console.log(`Dépense cumulée des cartes régionales : ${depenseDejaFaite(dossier).toFixed(3)} $ (plafond ${plafond.toFixed(2)} $).`);
}

if (process.argv[1] && /cartes-regions\.ts$/.test(process.argv[1].replace(/\\/g, '/'))) {
  main().catch((e) => {
    console.error((e as Error).message);
    process.exit(1);
  });
}
