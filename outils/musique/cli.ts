// Musiques d'ambiance de combat : générées une fois par nous (modèle de musique Lyria 3 via OpenRouter), puis livrées avec
// le jeu, gratuites pour le joueur.
//
//   pnpm musique lister                                                  les ambiances et le coût annoncé
//   pnpm musique generer [--ambiance id] [--modele clip|pro] [--plafond 0.10] [--go]
//                                                                         sans --go : simulation (aucun appel, aucun coût)
//   pnpm musique boucler <fichier> [--fondu 1.5] [--format mp3|ogg] [--moyenne -26]
//                                                                         rend une musique bouclable sans à-coup et la ramène
//                                                                         au niveau d'une musique d'ambiance : volume moyen
//                                                                         −26 dB (les bruitages sont à −20 dB), pic ≤ −3 dB (gratuit)
//   pnpm musique verifier <fichier>                                      mesure la jonction fin → début (gratuit)
//
// Les brouillons vont dans `sorties/musique/` (hors git) : <ambiance>-<modele>-<n>.mp3, avec à côté un .json (consigne,
// durée, coût). On choisit ensuite ceux qu'on garde et on les place dans le jeu.
// Tarifs relevés le 04/11/2026 sur https://openrouter.ai/google/lyria-3-clip-preview (0,04 $ le clip de 30 s) et
// https://openrouter.ai/google/lyria-3-pro-preview (0,08 $ le morceau complet). Sortie audio : chat/completions,
// modalities ["text", "audio"], stream obligatoire (https://openrouter.ai/docs/features/multimodal/audio).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { CLE_OPENROUTER, cleOpenRouter, empreinte, lireMontant } from '../cle';
import { utilisationCle } from '../images/services';
import { AMBIANCES, consigne, coutEstime, MODELES, type NomModele } from './ambiances';
import { gainPour, lireVolumes } from '../sons/rogner';
import { bornesStables, dureeBoucle, ecartAPosition, filtreBoucle, filtreNiveau, FONDU_PAR_DEFAUT, mesurerJonction, NIVEAU_AMBIANCE, type Jonction } from './boucle';
import { formatAudio, lireFlux, type Reponse } from './flux';

const RACINE = join(import.meta.dirname, '..', '..');
const DOSSIER = join(RACINE, 'sorties', 'musique');

/**
 * Les réglages audio à essayer, dans l'ordre : certains modèles refusent un paramètre de voix, d'autres l'exigent.
 * Une erreur 400 (requête mal formée) n'est pas facturée : on peut donc passer au suivant sans risque.
 */
const REGLAGES_AUDIO: Record<string, string>[] = [{ format: 'mp3' }, { format: 'mp3', voice: 'alloy' }];

async function demander(modele: NomModele, texte: string, cle: string, audio: Record<string, string>): Promise<{ http: number; corps: string }> {
  const rep = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODELES[modele].id,
      modalities: ['text', 'audio'],
      audio,
      stream: true,
      usage: { include: true },
      messages: [{ role: 'user', content: texte }],
    }),
    signal: AbortSignal.timeout(modele === 'pro' ? 360_000 : 180_000),
  });
  return { http: rep.status, corps: await rep.text() };
}

function dureeDe(fichier: string): number {
  return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', fichier]).toString().trim());
}

const FREQUENCE_ANALYSE = 8000;
/** Fenêtre de mesure du raccord : un peu plus qu'un temps de la musique (environ 0,6 s), pour ne pas mesurer un seul coup de tambour. */
const FENETRE_RACCORD = 0.5;
/** Pas, en secondes, du relevé de volume qui sert à repérer l'entrée douce et la résonance finale. */
const PAS_NIVEAU = 0.25;

/** Le volume (en dB) de chaque fenêtre consécutive de `pas` secondes d'une musique mono. */
function niveauxParFenetre(pcm: Float32Array, pas: number): number[] {
  const w = Math.round(pas * FREQUENCE_ANALYSE);
  const niveaux: number[] = [];
  for (let i = 0; i + w <= pcm.length; i += w) {
    let s = 0;
    for (let j = 0; j < w; j++) s += pcm[i + j]! ** 2;
    niveaux.push(20 * Math.log10(Math.max(Math.sqrt(s / w), 1e-6)));
  }
  return niveaux;
}

/** La musique décodée en mono à 8 kHz (de quoi mesurer le volume et la jonction, pas de quoi l'écouter). */
function decoder(fichier: string, debut = 0, fin?: number): Float32Array {
  const bornes = fin === undefined ? [] : ['-ss', String(debut), '-to', String(fin)];
  const r = spawnSync('ffmpeg', ['-v', 'error', ...bornes, '-i', fichier, '-ac', '1', '-ar', String(FREQUENCE_ANALYSE), '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`ffmpeg n’a pas pu lire ${fichier}`);
  const octets = r.stdout;
  return new Float32Array(octets.buffer.slice(octets.byteOffset, octets.byteOffset + octets.byteLength - (octets.byteLength % 4)));
}

function afficherJonction(titre: string, j: Jonction): void {
  console.log(
    `  ${titre} : écart de volume ${j.ecartDb.toFixed(1)} dB à la jonction (typique ailleurs ${j.typiqueDb.toFixed(1)} dB), saut ${j.saut.toFixed(1)} → ${j.propre ? 'jonction propre ✓' : 'jonction audible ✗'}`,
  );
}

/** Rend une musique bouclable (fondu enchaîné fin → début) et mesure la jonction avant et après. */
function boucler(fichier: string, fondu: number, format: 'mp3' | 'ogg', moyenneCible: number): void {
  const entree = resolve(fichier);
  if (!existsSync(entree)) throw new Error(`Fichier introuvable : ${fichier}`);
  const dureeTotale = dureeDe(entree);
  const sortie = join(dirname(entree), `${basename(entree, extname(entree)).replace(/-boucle$/, '')}-boucle.${format}`);
  // La partie stable : une résonance qui s'éteint à la fin (ou une entrée très douce) laisserait un creux à chaque tour.
  const niveaux = niveauxParFenetre(decoder(entree), PAS_NIVEAU);
  const stable = bornesStables(niveaux, PAS_NIVEAU);
  const debut = stable.debut;
  const fin = Math.min(stable.fin, dureeTotale);
  const duree = fin - debut;
  console.log(`${basename(entree)} : ${dureeTotale.toFixed(2)} s, fondu de ${fondu} s → boucle de ${dureeBoucle(duree, fondu).toFixed(2)} s`);
  if (debut > 0 || fin < dureeTotale - 0.05) {
    console.log(`  partie stable : de ${debut.toFixed(2)} s à ${fin.toFixed(2)} s (écarté : ${debut > 0 ? `entrée douce de ${debut.toFixed(2)} s` : ''}${debut > 0 && fin < dureeTotale - 0.05 ? ', ' : ''}${fin < dureeTotale - 0.05 ? `résonance finale de ${(dureeTotale - fin).toFixed(2)} s` : ''})`);
  }
  const original = decoder(entree, debut, fin);
  const avant = mesurerJonction(original, FREQUENCE_ANALYSE, FENETRE_RACCORD);
  const codec = format === 'ogg' ? ['-c:a', 'libvorbis', '-q:a', '5'] : ['-c:a', 'libmp3lame', '-b:a', '192k'];
  const montage = filtreBoucle(duree, fondu);
  // Un fond sonore : on mesure le niveau de la boucle, puis on la ramène au niveau d'une musique d'ambiance.
  const mesure = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-ss', String(debut), '-to', String(fin), '-i', entree, '-filter_complex', `${montage};[boucle]volumedetect[m]`, '-map', '[m]', '-f', 'null', '-'], { encoding: 'utf8' });
  const volumes = lireVolumes(`${mesure.stdout}\n${mesure.stderr}`);
  if (!volumes) throw new Error('Niveau de la musique illisible.');
  const gain = gainPour(volumes, { moyenneCible, picMax: NIVEAU_AMBIANCE.picMaxDb });
  console.log(`  niveau avant : ${volumes.moyenne.toFixed(1)} dB en moyenne, pic ${volumes.pic.toFixed(1)} dB → gain ${gain >= 0 ? '+' : ''}${gain.toFixed(1)} dB (cible ${moyenneCible} dB, pic ≤ ${NIVEAU_AMBIANCE.picMaxDb} dB)`);
  const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(debut), '-to', String(fin), '-i', entree, '-filter_complex', `${montage};${filtreNiveau(gain)}`, '-map', '[sortie]', '-ac', '2', '-ar', '44100', ...codec, sortie], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg a échoué : ${r.stderr.slice(0, 400)}`);
  const apres = mesurerJonction(decoder(sortie), FREQUENCE_ANALYSE, FENETRE_RACCORD);
  // Par construction, la boucle reprend l'original exactement là où il s'arrêtait (à L − fondu) : le changement de volume
  // au raccord doit donc être celui que l'original a lui-même à cet endroit. C'est la bonne référence (la musique est
  // percussive : son volume varie beaucoup d'une fenêtre à l'autre, un « zéro » serait une mauvaise cible).
  const attendu = ecartAPosition(original, FREQUENCE_ANALYSE, duree - fondu, FENETRE_RACCORD);
  console.log(`  avant (clip brut bouclé tel quel) : ${avant.ecartDb.toFixed(1)} dB de changement de volume au raccord, saut ${avant.saut.toFixed(1)}`);
  console.log(`  après (boucle)                     : ${apres.ecartDb.toFixed(1)} dB, saut ${apres.saut.toFixed(1)} ; l'original a ${attendu.toFixed(1)} dB à cet endroit`);
  const fidele = Math.abs(apres.ecartDb - attendu) <= 2 && apres.saut < 6;
  console.log(`  → ${fidele ? 'raccord fidèle : la musique continue comme dans l’original ✓' : 'raccord à vérifier à l’oreille ✗'}`);
  console.log(`  écrit : ${sortie}`);
}

function prochainNumero(prefixe: string): number {
  if (!existsSync(DOSSIER)) return 1;
  const n = readdirSync(DOSSIER)
    .map((f) => new RegExp(`^${prefixe}-(\\d+)\\.(mp3|json)$`).exec(f)?.[1])
    .filter((x): x is string => !!x)
    .map(Number);
  return (n.length ? Math.max(...n) : 0) + 1;
}

async function main(): Promise<void> {
  const [commande, ...args] = process.argv.slice(2);
  const option = (nom: string) => {
    const i = args.indexOf(nom);
    return i >= 0 ? args[i + 1] : undefined;
  };
  if (commande === 'boucler' || commande === 'verifier') {
    const fichier = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1]?.startsWith('--')));
    if (!fichier) throw new Error(`Usage : pnpm musique ${commande} <fichier>${commande === 'boucler' ? ' [--fondu 1.5] [--format mp3|ogg]' : ''}`);
    if (commande === 'verifier') {
      afficherJonction(basename(fichier), mesurerJonction(decoder(resolve(fichier)), FREQUENCE_ANALYSE));
    } else {
      boucler(fichier, Number(option('--fondu') ?? FONDU_PAR_DEFAUT), option('--format') === 'ogg' ? 'ogg' : 'mp3', Number(option('--moyenne') ?? NIVEAU_AMBIANCE.moyenneDb));
    }
    return;
  }
  if (!['lister', 'generer'].includes(commande ?? '')) {
    console.log('Usage : pnpm musique lister | generer [--ambiance id] [--modele clip|pro] [--plafond 0.10] [--go] | boucler <fichier> [--fondu 1.5] [--format mp3|ogg] | verifier <fichier>');
    return;
  }
  if (commande === 'lister') {
    for (const a of AMBIANCES) console.log(`${a.id.padEnd(11)} ${a.titre.padEnd(24)} terrain « ${a.terrain} » — ${a.idee}`);
    console.log(`\nCoût annoncé pour les ${AMBIANCES.length} ambiances : ${coutEstime('clip', AMBIANCES.length)} $ en clips de 30 s, ${coutEstime('pro', AMBIANCES.length)} $ en morceaux complets.`);
    return;
  }

  const nomModele = (option('--modele') ?? 'clip') as NomModele;
  if (!(nomModele in MODELES)) throw new Error('Modèle : clip ou pro.');
  // --ambiance accepte une liste séparée par des virgules (--ambiance souterrain,caverne).
  const demandees = option('--ambiance')?.split(',').map((x) => x.trim()).filter(Boolean);
  const inconnues = demandees?.filter((id) => !AMBIANCES.some((a) => a.id === id)) ?? [];
  if (inconnues.length) throw new Error(`Ambiance inconnue : ${inconnues.join(', ')}. Choix : ${AMBIANCES.map((a) => a.id).join(', ')}.`);
  const choisies = AMBIANCES.filter((a) => !demandees || demandees.includes(a.id));
  if (!choisies.length) throw new Error(`Ambiance inconnue. Choix : ${AMBIANCES.map((a) => a.id).join(', ')}.`);
  const estime = coutEstime(nomModele, choisies.length);
  const plafond = lireMontant(option('--plafond'), 0.1);
  console.log(`${MODELES[nomModele].libelle} : ${choisies.length} morceau(x) (${choisies.map((a) => a.id).join(', ')}), coût annoncé ${estime} $.`);
  if (!args.includes('--go')) {
    for (const a of choisies) console.log(`\n  [simulation] ${a.id}\n  ${consigne(a, nomModele)}`);
    console.log('\n  Ajoute --go pour générer réellement (service payant).');
    return;
  }
  if (estime > plafond) throw new Error(`Coût annoncé (${estime} $) au-delà du plafond (${plafond} $) : ajoute --plafond ${estime} pour l’accepter.`);
  const cle = cleOpenRouter(RACINE);
  if (!cle) throw new Error(`Variable ${CLE_OPENROUTER} absente (voir .env.example).`);
  console.log(`Clé utilisée : ${empreinte(cle)} (celle du .env du projet).`);
  mkdirSync(DOSSIER, { recursive: true });
  const depart = await utilisationCle(cle);
  let annonce = 0;
  let echecs = 0;
  for (const a of choisies) {
    const texte = consigne(a, nomModele);
    process.stdout.write(`  ${a.id} … `);
    let reponse: Reponse | undefined;
    let derniereErreur = '';
    for (const audio of REGLAGES_AUDIO) {
      const { http, corps } = await demander(nomModele, texte, cle, audio);
      if (http !== 200) {
        derniereErreur = `HTTP ${http} — ${corps.slice(0, 300)}`;
        // 400 : requête refusée, non facturée ; on essaie le réglage suivant. Autre code : on s'arrête là.
        if (http === 400) continue;
        break;
      }
      // La réponse brute est écrite AVANT d'être lue : si la lecture échoue, ce qui a été payé n'est pas perdu.
      const sauvegarde = join(DOSSIER, `${a.id}-${nomModele}-reponse-brute.txt`);
      writeFileSync(sauvegarde, corps);
      const lu = lireFlux(corps.split('\n'));
      annonce += lu.cout ?? 0;
      if (lu.audio.length && !lu.erreur) {
        rmSync(sauvegarde);
        reponse = lu;
        break;
      }
      // Pas d'audio exploitable : la réponse brute reste dans `sorties/musique/` pour comprendre, et on s'arrête pour
      // ne pas payer deux fois.
      derniereErreur = `${lu.erreur ?? `réponse sans audio (${lu.evenements} événements)`} — réponse brute gardée : ${sauvegarde}`;
      break;
    }
    if (!reponse) {
      echecs++;
      console.log(`ÉCHEC : ${derniereErreur}`);
      continue;
    }
    const prefixe = `${a.id}-${nomModele}`;
    const n = prochainNumero(prefixe);
    const brut = join(DOSSIER, `${prefixe}-${n}.${formatAudio(reponse.audio) === 'wav' ? 'wav' : 'mp3'}`);
    writeFileSync(brut, reponse.audio);
    let chemin = brut;
    if (brut.endsWith('.wav')) {
      chemin = join(DOSSIER, `${prefixe}-${n}.mp3`);
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', brut, '-b:a', '192k', chemin]);
      rmSync(brut);
    }
    const duree = dureeDe(chemin);
    writeFileSync(
      join(DOSSIER, `${prefixe}-${n}.json`),
      JSON.stringify({ ambiance: a.id, modele: MODELES[nomModele].id, consigne: texte, duree: Math.round(duree * 10) / 10, cout: reponse.cout, texte: reponse.texte }, null, 2) + '\n',
    );
    console.log(`ok : ${prefixe}-${n}.mp3 (${duree.toFixed(1)} s, ${(reponse.audio.length / 1024).toFixed(0)} Ko${reponse.cout === undefined ? '' : `, ${reponse.cout.toFixed(4)} $`})`);
  }
  // Le compteur de la clé met quelques secondes à se mettre à jour.
  await new Promise((r) => setTimeout(r, 20_000));
  const fin = await utilisationCle(cle);
  console.log(
    `Bilan : ${choisies.length - echecs} morceau(x) fait(s), ${echecs} échec(s), ${annonce.toFixed(4)} $ annoncés${depart !== undefined && fin !== undefined ? `, ${(fin - depart).toFixed(4)} $ au compteur de la clé` : ''}.`,
  );
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
