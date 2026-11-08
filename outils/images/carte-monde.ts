// Essais de la carte maîtresse d'un monde à partir de son prompt (`images.json`, clé `cartes.carte-monde-<id>`), pour comparer les services avant de remplacer la carte officielle.
// Les essais vont dans `sorties/images/mondes/<monde>/essais-carte-monde/` : rien n'écrase `packages/mondes/<monde>/cartes/`.
// La dépense cumulée des essais déjà faits est lue dans leurs fichiers .json et plafonnée (défaut 0,50 $).
//
//   pnpm exec tsx outils/images/carte-monde.ts <monde> <service> <nombre> [--plafond 0.5] [--ref image.png] [--prompt fichier.txt] [--prefixe nom] [--go]    sans --go : simulation
//   --ref : image de référence de style (copiée dans le dossier d'essais) ; --prompt : texte du prompt à la place de celui d'images.json (laisse alors le texte tel quel, sans la consigne « sans texte ») ; --prefixe : préfixe des fichiers produits.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { genererLot, lireEnv, SORTIES, type Meta } from './cli';
import { RACINE, type Element } from './charte';
import { trouverService } from './services';

/** Consigne ajoutée : les noms sont posés par le jeu, jamais écrits dans l'image. */
const SANS_TEXTE = ' No text, no letters, no labels, no legend, no compass rose, no scale bar, no title banner, no border, no frame, no watermark.';
/** Estimation prudente quand l'API ne renvoie pas le coût d'une image. */
const COUT_PAR_DEFAUT = 0.07;

function depenseDejaFaite(dossier: string): number {
  if (!existsSync(dossier)) return 0;
  return readdirSync(dossier)
    .filter((f) => f.endsWith('.json'))
    .reduce((somme, f) => somme + ((JSON.parse(readFileSync(join(dossier, f), 'utf8')) as Meta).coutUsd ?? COUT_PAR_DEFAUT), 0);
}

async function main(): Promise<void> {
  const [monde, nomService, nombre, ...args] = process.argv.slice(2);
  if (!monde || !nomService || !nombre) throw new Error('Usage : carte-monde.ts <monde> <service> <nombre> [--plafond 0.5] [--go]');
  const go = args.includes('--go');
  const iPlafond = args.indexOf('--plafond');
  const plafond = iPlafond >= 0 ? Number(args[iPlafond + 1]) : 0.5;
  const service = trouverService(nomService);
  if (!service) throw new Error(`Service inconnu : ${nomService}`);

  const images = JSON.parse(readFileSync(join(RACINE, 'packages/mondes', monde, 'images.json'), 'utf8')) as { cartes: Record<string, string> };
  const option = (nom: string) => (args.includes(nom) ? args[args.indexOf(nom) + 1] : undefined);
  const fichierPrompt = option('--prompt');
  const prompt = fichierPrompt ? readFileSync(fichierPrompt, 'utf8').trim() : images.cartes[`carte-monde-${monde}`];
  if (!prompt) throw new Error(`Pas de prompt « carte-monde-${monde} » dans images.json.`);
  const prefixe = option('--prefixe') ?? service.id;

  const dossier = join(SORTIES, 'mondes', monde, 'essais-carte-monde');
  const env = lireEnv();
  const ref = option('--ref');
  const idRef = ref ? `ref-${prefixe}` : undefined;
  if (ref && idRef) {
    mkdirSync(dossier, { recursive: true });
    copyFileSync(ref, join(dossier, `${idRef}.png`));
  }
  for (let i = 1; i <= Number(nombre); i += 1) {
    const deja = depenseDejaFaite(dossier);
    if (deja + COUT_PAR_DEFAUT > plafond) {
      console.log(`Plafond atteint : ${deja.toFixed(3)} $ déjà dépensés sur ${plafond.toFixed(2)} $. Arrêt.`);
      return;
    }
    let numero = 1;
    while (existsSync(join(dossier, `${prefixe}-${numero}.png`))) numero += 1;
    const element: Element = { id: `${prefixe}-${numero}`, groupe: 'cartes', nom: `Essai ${prefixe} ${numero}`, format: 'paysage', prompt: fichierPrompt ? prompt : prompt + SANS_TEXTE, references: idRef ? [idRef] : [] };
    await genererLot(service, [element], env, go, 1, undefined, dossier);
    if (!go) return;
  }
  console.log(`Dépense cumulée des essais : ${depenseDejaFaite(dossier).toFixed(3)} $ (plafond ${plafond.toFixed(2)} $).`);
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
