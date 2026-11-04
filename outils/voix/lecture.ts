// Lecture d'un texte par un modèle audio d'OpenRouter (sortie audio en streaming), commune aux voix des scènes
// (`cli.ts`) et aux répliques des compagnons (`repliques.ts`).
//
// Documentation lue le 03/11/2026 : https://openrouter.ai/docs/features/multimodal/audio
// (chat/completions, modalities ["text", "audio"], audio { voice, format }, stream obligatoire, base64 dans delta.audio.data).
import { execFileSync, spawnSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { gainPour, lireVolumes } from '../sons/rogner';

export const MODELES = { mini: 'openai/gpt-audio-mini', complet: 'openai/gpt-audio' } as const;
export const VOIX = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;
export type Voix = (typeof VOIX)[number];

/** Part des mots du texte retrouvés dans l'ordre dans la transcription, et part de mots en trop. */
export function fidelite(texte: string, lu: string): { retrouves: number; enTrop: number } {
  const mots = (t: string) =>
    t
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  const a = mots(texte);
  // Les annotations de la transcription (« [silence] », « [rire] ») ne sont pas des mots dits.
  const b = mots(lu.replace(/\[[^\]]*\]/g, ' '));
  // Plus longue sous-suite commune, mot à mot.
  const l = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) l[i]![j] = a[i - 1] === b[j - 1] ? l[i - 1]![j - 1]! + 1 : Math.max(l[i - 1]![j]!, l[i]![j - 1]!);
  const commun = l[a.length]![b.length]!;
  return { retrouves: commun / Math.max(1, a.length), enTrop: (b.length - commun) / Math.max(1, a.length) };
}

/** Octets de PCM par seconde : 16 bits, 24 kHz, mono. */
export const OCTETS_SECONDE = 48_000;

/**
 * Durée attendue d'une lecture posée (≈ 2,8 mots par seconde) et durée au-delà de laquelle on coupe. Un essai à
 * `temperature: 0` a montré que l'audio peut boucler : 11 s de lecture fidèle, puis 13 minutes de silence et de bruit,
 * avec une transcription parfaite. La transcription ne suffit donc pas : on surveille aussi la durée.
 */
export function durees(texte: string): { attendue: number; max: number } {
  const attendue = texte.split(/\s+/).filter(Boolean).length / 2.8;
  return { attendue, max: 2 * attendue + 6 };
}

/** Lit un texte : renvoie l'audio PCM 16 bits (24 kHz, mono), la transcription et le coût annoncé ; coupe un audio qui s'emballe. */
export async function lire(
  texte: string,
  options: { modele: string; voix: string; cle: string; consigne: string; message: string },
): Promise<{ pcm: Buffer; transcription: string; cout?: number; coupe?: boolean }> {
  const arret = new AbortController();
  const rep = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${options.cle}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options.modele,
      modalities: ['text', 'audio'],
      audio: { voice: options.voix, format: 'pcm16' },
      stream: true,
      usage: { include: true },
      messages: [
        { role: 'system', content: options.consigne },
        { role: 'user', content: options.message },
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

/**
 * Filtre d'une réplique de combat : silences de début et de fin retirés, pauses internes de plus de 0,2 s ramenées à
 * 0,12 s, débit accéléré sans changer la hauteur (`atempo`), courte marge à la fin. Le 04/11/2026, l'utilisateur a
 * jugé les prises de Gemini « molles » et choisi ×1,25 en écoutant ×1,15 et ×1,25.
 */
export function filtreReplique(tempo = 1.25, marge = 0.15): string {
  return (
    'silenceremove=start_periods=1:start_threshold=-50dB,' +
    'silenceremove=stop_periods=-1:stop_duration=0.2:stop_threshold=-40dB:stop_silence=0.12,' +
    `atempo=${tempo},areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=${marge}`
  );
}

/**
 * Filtre d'une phrase libre (histoire, dialogue) : seulement les silences de début et de fin sont retirés ; les pauses du
 * milieu, qui font respirer une phrase longue, sont gardées (contrairement aux cris), et le débit reste naturel par défaut.
 */
export function filtreLong(tempo = 1, marge = 0.3): string {
  const tempoFiltre = tempo === 1 ? '' : `atempo=${tempo},`;
  return `silenceremove=start_periods=1:start_threshold=-50dB,${tempoFiltre}areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=${marge}`;
}

/**
 * Niveau des cris de combat : un peu au-dessus des bruitages (−20 dB de moyenne, `outils/sons`) pour qu'une voix se
 * comprenne par-dessus un coup. Sans égalisation, deux cris d'une même voix pouvaient avoir 15 dB d'écart.
 */
export const NIVEAU_CRI = { moyenneCible: -17, picMax: -1 };

/**
 * Comme `enMp3`, puis égalise le volume : mesure la prise, et la refait depuis l'audio brut avec le gain qui amène sa
 * moyenne à `NIVEAU_CRI` sans dépasser le pic (un seul encodage dans le fichier final). Renvoie la durée et le gain.
 */
export function enMp3Egalise(pcm: Buffer, chemin: string, options: { frequence?: number; filtre: string }): { duree: number; gain: number } {
  enMp3(pcm, chemin, options);
  const v = lireVolumes(volumesDe(chemin));
  if (!v) return { duree: enMp3(pcm, chemin, options), gain: 0 };
  const gain = gainPour(v, NIVEAU_CRI);
  return { duree: enMp3(pcm, chemin, { ...options, filtre: `${options.filtre},volume=${gain.toFixed(2)}dB` }), gain };
}

/** La sortie du filtre `volumedetect` de ffmpeg pour un fichier (ffmpeg l'écrit sur sa sortie d'erreur). */
function volumesDe(chemin: string): string {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', chemin, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
  return `${r.stdout ?? ''}${r.stderr ?? ''}`;
}

/** PCM 16 bits mono (24 kHz par défaut) → MP3 (ffmpeg), sans silences autour ; renvoie la durée finale en secondes. */
export function enMp3(pcm: Buffer, chemin: string, options: { debit?: string; marge?: string; frequence?: number; filtre?: string } = {}): number {
  const brut = `${chemin}.pcm`;
  writeFileSync(brut, pcm);
  const filtre = options.filtre ?? (options.marge ? SANS_SILENCES.replace('pad_dur=0.5', `pad_dur=${options.marge}`) : SANS_SILENCES);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 's16le', '-ar', String(options.frequence ?? 24000), '-ac', '1', '-i', brut, '-af', filtre, '-b:a', options.debit ?? '96k', chemin]);
  rmSync(brut);
  return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', chemin]).toString().trim());
}

// ---------------------------------------------------------------------------------------------------------------------
// Gemini Flash TTS (Google, via OpenRouter) : un vrai moteur de synthèse vocale, commun aux répliques de combat
// (`repliques.ts`) et aux voix des scènes (`cli.ts`). On lui donne le texte exact et, à part, le style.
// ---------------------------------------------------------------------------------------------------------------------

export const MODELES_GEMINI = { flash: 'google/gemini-3.8-flash-tts', lite: 'google/gemini-3.8-flash-lite-tts' } as const;

/** Une phrase dite par Gemini : l'audio PCM (16 bits, mono) tel que reçu, son débit, et l'identifiant de la génération. */
export async function direGemini(texte: string, options: { modele: string; voix: string; style: string; cle: string }): Promise<{ pcm: Buffer; frequence: number; generation?: string }> {
  const rep = await fetch('https://openrouter.ai/api/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${options.cle}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: options.modele, input: texte, voice: options.voix, instructions: options.style, response_format: 'pcm' }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!rep.ok) throw new Error(`HTTP ${rep.status} — ${(await rep.text()).slice(0, 500)}`);
  const type = rep.headers.get('content-type') ?? '';
  const frequence = Number(/rate=(\d+)/.exec(type)?.[1] ?? 24000);
  return { pcm: Buffer.from(await rep.arrayBuffer()), frequence, generation: rep.headers.get('x-generation-id') ?? undefined };
}

/** Le coût d'une génération, lu après coup (appel gratuit ; la fiche met quelques secondes à apparaître). */
export async function coutGeneration(generation: string | undefined, cle: string): Promise<number | undefined> {
  if (!generation) return undefined;
  for (let i = 0; i < 4; i++) {
    await new Promise((r) => setTimeout(r, 2500));
    const rep = await fetch(`https://openrouter.ai/api/v1/generation?id=${encodeURIComponent(generation)}`, { headers: { Authorization: `Bearer ${cle}` } });
    if (rep.ok) return ((await rep.json()) as { data?: { total_cost?: number } }).data?.total_cost;
  }
  return undefined;
}
