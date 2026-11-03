// Voix des scènes narrées : chaque plan de chaque scène est lu par un modèle audio (OpenRouter, sortie audio en
// streaming), une fois, et livré avec le monde (`packages/mondes/<monde>/voix/<scene>-<plan>.mp3`), gratuit pour le joueur.
//
//   pnpm voix lister <monde>                                      plans, longueur des textes, voix déjà faites
//   pnpm voix generer <monde> [--scene id] [--modele mini|complet] [--voix onyx] [--go]
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

/** La consigne du narrateur : lire le texte tel quel, en français, comme un conteur. */
const CONSIGNE =
  "Tu es le narrateur d'un jeu de rôle en français. Lis à voix haute le texte que l'on te donne, mot pour mot, sans rien ajouter ni retrancher, " +
  "en français, d'une voix grave, posée et chaleureuse de conteur, au rythme d'une histoire racontée au coin du feu.";

/** Lit un texte : renvoie l'audio PCM 16 bits (24 kHz, mono), la transcription et le coût annoncé. */
async function lire(texte: string, modele: string, voix: string, cle: string): Promise<{ pcm: Buffer; transcription: string; cout?: number }> {
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
        { role: 'user', content: texte },
      ],
    }),
    signal: AbortSignal.timeout(180_000),
  });
  if (!rep.ok || !rep.body) throw new Error(`HTTP ${rep.status} — ${(await rep.text()).slice(0, 500)}`);
  const morceaux: Buffer[] = [];
  let transcription = '';
  let cout: number | undefined;
  let reste = '';
  const decodeur = new TextDecoder();
  for await (const bloc of rep.body as unknown as AsyncIterable<Uint8Array>) {
    reste += decodeur.decode(bloc, { stream: true });
    const lignes = reste.split('\n');
    reste = lignes.pop() ?? '';
    for (const ligne of lignes) {
      if (!ligne.startsWith('data: ') || ligne === 'data: [DONE]') continue;
      const json = JSON.parse(ligne.slice(6)) as { choices?: { delta?: { audio?: { data?: string; transcript?: string } } }[]; usage?: { cost?: number } };
      const audio = json.choices?.[0]?.delta?.audio;
      if (audio?.data) morceaux.push(Buffer.from(audio.data, 'base64'));
      if (audio?.transcript) transcription += audio.transcript;
      if (json.usage?.cost !== undefined) cout = json.usage.cost;
    }
  }
  return { pcm: Buffer.concat(morceaux), transcription, cout };
}

/** PCM 16 bits 24 kHz mono → MP3 (ffmpeg), 96 kb/s : une voix parlée tient dans quelques dizaines de Ko. */
function enMp3(pcm: Buffer, chemin: string): void {
  const brut = `${chemin}.pcm`;
  writeFileSync(brut, pcm);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', brut, '-b:a', '96k', chemin]);
  rmSync(brut);
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
    console.log(`\n${plans.filter((p) => !fait(p.nom)).length} voix à faire sur ${plans.length} (${plans.reduce((s, p) => s + p.texte.length, 0)} caractères en tout).`);
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
  for (const p of aFaire) {
    process.stdout.write(`  ${p.nom} … `);
    const res = await lire(p.texte, modele, voix, cle);
    if (!res.pcm.length) throw new Error(`aucun audio reçu (transcription : « ${res.transcription.slice(0, 120)} »)`);
    enMp3(res.pcm, join(dossier, `${p.nom}.mp3`));
    annonce += res.cout ?? 0;
    // Le modèle doit lire le texte tel quel : on signale un écart notable entre le texte et ce qu'il a dit.
    const mots = (t: string) => t.toLowerCase().replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(Boolean);
    const ecart = Math.abs(mots(res.transcription).length - mots(p.texte).length) / mots(p.texte).length;
    console.log(`ok (${(res.pcm.length / 48000).toFixed(1)} s${res.cout === undefined ? '' : `, ${res.cout.toFixed(4)} $`})${ecart > 0.15 ? ` — à réécouter : « ${res.transcription.slice(0, 80)}… »` : ''}`);
  }
  await new Promise((r2) => setTimeout(r2, 30_000));
  const fin = await utilisationCle(cle);
  console.log(`Bilan : ${aFaire.length} voix, ${annonce.toFixed(4)} $ annoncés${depart !== undefined && fin !== undefined ? `, ${(fin - depart).toFixed(4)} $ au compteur de la clé` : ''}.`);
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
