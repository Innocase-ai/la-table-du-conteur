// Voix des scènes narrées : chaque plan de chaque scène est lu par un modèle audio (OpenRouter, sortie audio en
// streaming), une fois, et livré avec le monde (`packages/mondes/<monde>/voix/<scene>-<plan>.mp3`), gratuit pour le joueur.
//
//   pnpm voix lister <monde>                                      plans, longueur des textes, voix déjà faites
//   pnpm voix generer <monde> [--scene id] [--modele mini|complet] [--voix onyx] [--plafond 0.25] [--go]
//                                                                  sans --go : simulation (aucun appel, aucun coût)
//
// Documentation lue le 03/11/2026 : https://openrouter.ai/docs/features/multimodal/audio
// (chat/completions, modalities ["text", "audio"], audio { voice, format }, stream obligatoire, base64 dans delta.audio.data).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chargerMonde, RACINE_MONDES } from '../../packages/regles/src/monde/chargeur';
import { scenesDu } from '../../packages/regles/src/modules/scenes';
import { lireEnv } from '../images/cli';
import { CLE_OPENROUTER, utilisationCle } from '../images/services';

const MODELES = { mini: 'openai/gpt-audio-mini', complet: 'openai/gpt-audio' } as const;
const VOIX = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;

/**
 * La consigne : une voix de lecture, pas un conteur qui improvise. Un premier essai a montré que le modèle, laissé
 * « narrateur », lisait le texte puis inventait une suite (« …en cherchant le passage secret ») : d'où les balises,
 * l'arrêt explicite et la vérification de la transcription.
 */
const CONSIGNE =
  'Tu es une voix de lecture française pour un jeu. On te donne un texte entre les balises <texte> et </texte>. ' +
  'Tu le lis à voix haute exactement, mot pour mot, puis tu te tais. Tu n’ajoutes rien avant ni après : pas de suite, pas de commentaire, ' +
  'pas de description, pas de question. Ton : voix grave, posée et chaleureuse de conteur, rythme calme, en français.';

/** Part des mots du texte retrouvés dans l'ordre dans la transcription, et part de mots en trop. */
function fidelite(texte: string, lu: string): { retrouves: number; enTrop: number } {
  const mots = (t: string) =>
    t
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  const a = mots(texte);
  const b = mots(lu);
  // Plus longue sous-suite commune, mot à mot.
  const l = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) l[i]![j] = a[i - 1] === b[j - 1] ? l[i - 1]![j - 1]! + 1 : Math.max(l[i - 1]![j]!, l[i]![j - 1]!);
  const commun = l[a.length]![b.length]!;
  return { retrouves: commun / Math.max(1, a.length), enTrop: (b.length - commun) / Math.max(1, a.length) };
}

/** Octets de PCM par seconde : 16 bits, 24 kHz, mono. */
const OCTETS_SECONDE = 48_000;

/**
 * Durée attendue d'une lecture posée (≈ 2,8 mots par seconde) et durée au-delà de laquelle on coupe. Un essai à
 * `temperature: 0` a montré que l'audio peut boucler : 11 s de lecture fidèle, puis 13 minutes de silence et de bruit,
 * avec une transcription parfaite. La transcription ne suffit donc pas : on surveille aussi la durée.
 */
function durees(texte: string): { attendue: number; max: number } {
  const attendue = texte.split(/\s+/).filter(Boolean).length / 2.8;
  return { attendue, max: 2 * attendue + 6 };
}

/** Lit un texte : renvoie l'audio PCM 16 bits (24 kHz, mono), la transcription et le coût annoncé ; coupe un audio qui s'emballe. */
async function lire(texte: string, modele: string, voix: string, cle: string): Promise<{ pcm: Buffer; transcription: string; cout?: number; coupe?: boolean }> {
  const arret = new AbortController();
  const rep = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modele,
      modalities: ['text', 'audio'],
      audio: { voice: voix, format: 'pcm16' },
      stream: true,
      usage: { include: true },
      messages: [
        { role: 'system', content: CONSIGNE },
        { role: 'user', content: `<texte>${texte}</texte>` },
      ],
    }),
    signal: AbortSignal.any([arret.signal, AbortSignal.timeout(90_000)]),
  });
  if (!rep.ok || !rep.body) throw new Error(`HTTP ${rep.status} — ${(await rep.text()).slice(0, 500)}`);
  const morceaux: Buffer[] = [];
  let transcription = '';
  let cout: number | undefined;
  let reste = '';
  let octets = 0;
  const plafond = durees(texte).max * OCTETS_SECONDE;
  const decodeur = new TextDecoder();
  try {
    for await (const bloc of rep.body as unknown as AsyncIterable<Uint8Array>) {
      reste += decodeur.decode(bloc, { stream: true });
      const lignes = reste.split('\n');
      reste = lignes.pop() ?? '';
      for (const ligne of lignes) {
        if (!ligne.startsWith('data: ') || ligne === 'data: [DONE]') continue;
        const json = JSON.parse(ligne.slice(6)) as { choices?: { delta?: { audio?: { data?: string; transcript?: string } } }[]; usage?: { cost?: number } };
        const audio = json.choices?.[0]?.delta?.audio;
        if (audio?.data) {
          const b = Buffer.from(audio.data, 'base64');
          morceaux.push(b);
          octets += b.length;
        }
        if (audio?.transcript) transcription += audio.transcript;
        if (json.usage?.cost !== undefined) cout = json.usage.cost;
      }
      if (octets > plafond) {
        arret.abort();
        return { pcm: Buffer.concat(morceaux), transcription, cout, coupe: true };
      }
    }
  } catch (e) {
    if (!arret.signal.aborted) throw e;
  }
  return { pcm: Buffer.concat(morceaux), transcription, cout, coupe: arret.signal.aborted || undefined };
}

/** Les silences de début et de fin sont retirés (une demi-seconde de marge à la fin). */
const SANS_SILENCES =
  'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.5';

/** PCM 16 bits 24 kHz mono → MP3 (ffmpeg), 96 kb/s, sans silences autour ; renvoie la durée finale en secondes. */
function enMp3(pcm: Buffer, chemin: string): number {
  const brut = `${chemin}.pcm`;
  writeFileSync(brut, pcm);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', brut, '-af', SANS_SILENCES, '-b:a', '96k', chemin]);
  rmSync(brut);
  return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', chemin]).toString().trim());
}

async function main(): Promise<void> {
  const [commande, idMonde, ...args] = process.argv.slice(2);
  const option = (nom: string) => {
    const i = args.indexOf(nom);
    return i >= 0 ? args[i + 1] : undefined;
  };
  if (!idMonde || !['lister', 'generer'].includes(commande ?? '')) {
    console.log('Usage : pnpm voix lister <monde> | generer <monde> [--scene id] [--modele mini|complet] [--voix onyx] [--go]');
    return;
  }
  const r = chargerMonde(join(RACINE_MONDES, idMonde));
  if (!r.ok) throw new Error(`Monde « ${idMonde} » invalide.`);
  const dossier = join(RACINE_MONDES, idMonde, 'voix');
  const scenes = scenesDu(r.monde).scenes.filter((s) => !option('--scene') || s.id === option('--scene'));
  const plans = scenes.flatMap((s) => s.plans.map((p, i) => ({ nom: `${s.id}-${i + 1}`, texte: p.texte })));
  const fait = (nom: string) => existsSync(join(dossier, `${nom}.mp3`));
  if (commande === 'lister') {
    for (const p of plans) console.log(`${fait(p.nom) ? '✓' : ' '} ${p.nom.padEnd(32)} ${p.texte.length} caractères`);
    console.log(
      `\n${plans.filter((p) => !fait(p.nom)).length} voix à faire sur ${plans.length} (${plans.reduce((s, p) => s + p.texte.length, 0)} caractères en tout).`,
    );
    return;
  }
  const modele = MODELES[(option('--modele') ?? 'mini') as keyof typeof MODELES];
  const voix = option('--voix') ?? 'onyx';
  if (!modele) throw new Error('Modèle : mini ou complet.');
  if (!(VOIX as readonly string[]).includes(voix)) throw new Error(`Voix : ${VOIX.join(', ')}.`);
  const aFaire = plans.filter((p) => !fait(p.nom));
  console.log(`${modele}, voix ${voix} : ${aFaire.length} plan(s) à lire sur ${plans.length}.`);
  if (!args.includes('--go')) {
    for (const p of aFaire) console.log(`  [simulation] ${p.nom} (${p.texte.length} caractères)`);
    console.log('  Ajoute --go pour générer réellement (service payant).');
    return;
  }
  const cle = lireEnv()[CLE_OPENROUTER];
  if (!cle) throw new Error(`Variable ${CLE_OPENROUTER} absente (voir .env.example).`);
  mkdirSync(dossier, { recursive: true });
  const depart = await utilisationCle(cle);
  let annonce = 0;
  const plafond = Number(option('--plafond') ?? '0.25');
  let echecs = 0;
  for (const p of aFaire) {
    if (annonce > plafond) {
      console.log(`Arrêt : ${annonce.toFixed(4)} $ annoncés, au-delà du plafond de ${plafond} $ (--plafond pour le changer).`);
      break;
    }
    process.stdout.write(`  ${p.nom} … `);
    const { attendue, max } = durees(p.texte);
    // Jusqu'à trois essais : la lecture doit être fidèle au texte (rien d'inventé, rien d'oublié) et de durée normale.
    let reussi = false;
    for (let essai = 1; essai <= 3 && !reussi; essai++) {
      let res: Awaited<ReturnType<typeof lire>>;
      try {
        res = await lire(p.texte, modele, voix, cle);
      } catch (e) {
        process.stdout.write(`essai ${essai} : ${(e as Error).message.slice(0, 80)} … `);
        continue;
      }
      annonce += res.cout ?? 0;
      const f = fidelite(p.texte, res.transcription);
      const probleme = res.coupe
        ? `audio coupé au-delà de ${max.toFixed(0)} s`
        : !res.pcm.length
          ? 'pas d’audio'
          : f.retrouves < 0.92 || f.enTrop > 0.08
            ? `infidèle (${Math.round(f.retrouves * 100)} % du texte, ${Math.round(f.enTrop * 100)} % en trop)`
            : undefined;
      if (probleme) {
        process.stdout.write(`essai ${essai} ${probleme} … `);
        continue;
      }
      const chemin = join(dossier, `${p.nom}.mp3`);
      const duree = enMp3(res.pcm, chemin);
      if (duree > max || duree < attendue / 2.5) {
        rmSync(chemin);
        process.stdout.write(`essai ${essai} durée anormale (${duree.toFixed(1)} s pour ${attendue.toFixed(0)} s attendues) … `);
        continue;
      }
      // La transcription reste à côté du fichier : on peut relire ce que le modèle a vraiment dit.
      writeFileSync(
        join(dossier, `${p.nom}.json`),
        JSON.stringify({ texte: p.texte, transcription: res.transcription, modele, voix, duree: Math.round(duree * 10) / 10, cout: res.cout }, null, 2) + '\n',
      );
      console.log(`ok (${duree.toFixed(1)} s, fidélité ${Math.round(f.retrouves * 100)} %${res.cout === undefined ? '' : `, ${res.cout.toFixed(4)} $`})`);
      reussi = true;
    }
    if (!reussi) {
      echecs++;
      console.log('ÉCHEC : fichier non écrit.');
    }
  }
  await new Promise((r2) => setTimeout(r2, 30_000));
  const fin = await utilisationCle(cle);
  console.log(
    `Bilan : ${aFaire.length - echecs} voix faites, ${echecs} échec(s), ${annonce.toFixed(4)} $ annoncés${depart !== undefined && fin !== undefined ? `, ${(fin - depart).toFixed(4)} $ au compteur de la clé` : ''}.`,
  );
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
