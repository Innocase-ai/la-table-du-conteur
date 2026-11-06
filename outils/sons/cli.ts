// Bruitages : couper les « blancs » (silences) et égaliser le volume.
//
//   pnpm sons rogner <dossier-entrée> <dossier-sortie> [--simuler] [--correspondance noms.json]
//                    [--seuil -45] [--queue 0.15] [--moyenne -20] [--format mp3|ogg]
//
// Pour chaque son du dossier d'entrée (mp3, wav, ogg, flac, m4a) : cherche le silence du début et de la fin, garde la
// partie utile avec une courte queue, égalise le volume moyen, écrit le résultat dans le dossier de sortie.
// --simuler : affiche ce qui serait fait, sans rien écrire.
// --correspondance : fichier JSON { "Nom d'origine.mp3": "nom-de-sortie" } ; sans lui, le nom de sortie est le nom
// d'origine nettoyé (minuscules, sans accents, tirets).
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { analyser, ecrire, OPTIONS_PAR_DEFAUT, slug, type OptionsRognage } from './rogner';

const EXTENSIONS = new Set(['.mp3', '.wav', '.ogg', '.flac', '.m4a']);

function option(args: string[], nom: string): string | undefined {
  const i = args.indexOf(`--${nom}`);
  return i >= 0 ? args[i + 1] : undefined;
}

function main(args: string[]): number {
  const [commande, ...reste] = args;
  if (commande !== 'rogner') {
    console.log('Usage : pnpm sons rogner <dossier-entrée> <dossier-sortie> [--simuler] [--correspondance noms.json] [--seuil -45] [--queue 0.15] [--moyenne -20] [--format mp3|ogg]');
    return commande ? 1 : 0;
  }
  const positionnels = reste.filter((a, i) => !a.startsWith('--') && !(i > 0 && reste[i - 1]!.startsWith('--') && reste[i - 1] !== '--simuler'));
  const [entree, sortie] = positionnels;
  if (!entree || !sortie) {
    console.error('Il faut un dossier d’entrée et un dossier de sortie.');
    return 1;
  }
  if (!existsSync(entree) || !statSync(entree).isDirectory()) {
    console.error(`Dossier introuvable : ${entree}`);
    return 1;
  }
  const simuler = reste.includes('--simuler');
  const opt: OptionsRognage = {
    ...OPTIONS_PAR_DEFAUT,
    seuilDb: Number(option(reste, 'seuil') ?? OPTIONS_PAR_DEFAUT.seuilDb),
    queue: Number(option(reste, 'queue') ?? OPTIONS_PAR_DEFAUT.queue),
    moyenneCible: Number(option(reste, 'moyenne') ?? OPTIONS_PAR_DEFAUT.moyenneCible),
    format: option(reste, 'format') === 'ogg' ? 'ogg' : 'mp3',
  };
  const fichierNoms = option(reste, 'correspondance');
  const noms: Record<string, string> = fichierNoms ? JSON.parse(readFileSync(resolve(fichierNoms), 'utf8')) : {};
  if (!simuler) mkdirSync(sortie, { recursive: true });

  const sons = readdirSync(entree)
    .filter((f) => EXTENSIONS.has(extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));
  if (!sons.length) {
    console.error('Aucun son dans ce dossier.');
    return 1;
  }
  console.log(`${sons.length} son(s) — ${simuler ? 'simulation' : 'écriture dans ' + sortie}\n`);
  console.log('entrée'.padEnd(28), 'sortie'.padEnd(22), 'durée', '    garde', '       gain');
  let erreurs = 0;
  for (const f of sons) {
    const nomSortie = `${noms[f] ?? slug(f)}.${opt.format}`;
    try {
      const r = analyser(join(entree, f), opt);
      if (!r) {
        console.log(f.padEnd(28), nomSortie.padEnd(22), 'silence complet, ignoré');
        erreurs++;
        continue;
      }
      console.log(
        f.padEnd(28),
        nomSortie.padEnd(22),
        `${r.duree.toFixed(2)} s`.padStart(7),
        `${r.debut.toFixed(2)}–${r.fin.toFixed(2)} s`.padStart(13),
        `${r.gain >= 0 ? '+' : ''}${r.gain.toFixed(1)} dB`.padStart(10),
      );
      if (!simuler) ecrire(join(entree, f), join(sortie, nomSortie), r, opt);
    } catch (e) {
      console.error(`${f} : ${(e as Error).message}`);
      erreurs++;
    }
  }
  return erreurs ? 1 : 0;
}

process.exitCode = main(process.argv.slice(2));
