// Outil de bruitages : coupe le silence au début et à la fin d'un son, puis égalise son volume.
// Logique pure (analyse de la sortie de ffmpeg, calcul des bornes et du gain) ici ; l'appel à ffmpeg est en bas.
// Nécessite ffmpeg et ffprobe dans le PATH.
import { spawnSync } from 'node:child_process';

export interface Silence {
  debut: number;
  /** Absente quand le silence dure jusqu'à la fin du fichier. */
  fin?: number;
}

export interface OptionsRognage {
  /** Seuil de silence en dB (un son plus faible que ça compte comme du silence). */
  seuilDb: number;
  /** Durée minimale d'un silence, en secondes. */
  dureeMin: number;
  /** Ce qu'on garde après le dernier son utile (la « queue » naturelle du son), en secondes. */
  queue: number;
  /** Ce qu'on garde avant le premier son utile, en secondes. */
  marge: number;
  /** Volume moyen visé après égalisation, en dB. */
  moyenneCible: number;
  /** Pic maximal autorisé après égalisation, en dB. */
  picMax: number;
  /** Format de sortie. */
  format: 'mp3' | 'ogg';
}

export const OPTIONS_PAR_DEFAUT: OptionsRognage = {
  seuilDb: -45,
  dureeMin: 0.1,
  queue: 0.15,
  marge: 0.02,
  moyenneCible: -20,
  picMax: -1.5,
  format: 'mp3',
};

/** Les silences relevés par le filtre `silencedetect` de ffmpeg. */
export function extraireSilences(sortie: string): Silence[] {
  const silences: Silence[] = [];
  for (const ligne of sortie.split(/\r?\n/)) {
    const d = /silence_start:\s*(-?[\d.]+)/.exec(ligne);
    if (d) silences.push({ debut: Math.max(0, Number(d[1])) });
    const f = /silence_end:\s*(-?[\d.]+)/.exec(ligne);
    if (f && silences.length) silences[silences.length - 1]!.fin = Number(f[1]);
  }
  return silences;
}

/** Les bornes à garder : on coupe le silence du début et celui de la fin, pas ceux du milieu. `null` si tout est silence. */
export function bornesUtiles(silences: Silence[], duree: number, opt: Pick<OptionsRognage, 'queue' | 'marge'> = OPTIONS_PAR_DEFAUT): { debut: number; fin: number } | null {
  const TOLERANCE = 0.03;
  let debut = 0;
  let fin = duree;
  const premier = silences[0];
  if (premier && premier.debut <= TOLERANCE) {
    // Silence qui commence avec le fichier : tout silence jusqu'au bout = fichier vide.
    if (premier.fin === undefined || premier.fin >= duree - TOLERANCE) return null;
    debut = Math.max(0, premier.fin - opt.marge);
  }
  const dernier = silences[silences.length - 1];
  if (dernier && (dernier.fin === undefined || dernier.fin >= duree - TOLERANCE) && dernier.debut > TOLERANCE) {
    fin = Math.min(duree, dernier.debut + opt.queue);
  }
  return fin - debut > 0.05 ? { debut, fin } : null;
}

/** Volume moyen et pic d'un son, lus dans la sortie du filtre `volumedetect`. */
export function lireVolumes(sortie: string): { moyenne: number; pic: number } | null {
  const m = /mean_volume:\s*(-?[\d.]+) dB/.exec(sortie);
  const p = /max_volume:\s*(-?[\d.]+) dB/.exec(sortie);
  return m && p ? { moyenne: Number(m[1]), pic: Number(p[1]) } : null;
}

/** Gain (en dB) qui amène le volume moyen à la cible sans dépasser le pic maximal. */
export function gainPour(v: { moyenne: number; pic: number }, opt: Pick<OptionsRognage, 'moyenneCible' | 'picMax'> = OPTIONS_PAR_DEFAUT): number {
  return Math.min(opt.moyenneCible - v.moyenne, opt.picMax - v.pic);
}

/** Nom de fichier propre : minuscules, sans accents, tirets. « Coup-épée.mp3 » → « coup-epee ». */
export function slug(nomFichier: string): string {
  return nomFichier
    .replace(/\.[A-Za-z0-9]+$/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Filtre audio final : fondu d'entrée très court, fondu de sortie sur la queue, puis gain. */
export function filtreFinal(longueur: number, gainDb: number): string {
  const fondSortie = Math.min(0.18, longueur / 2);
  return [`afade=t=in:d=0.005`, `afade=t=out:st=${(longueur - fondSortie).toFixed(3)}:d=${fondSortie.toFixed(3)}`, `volume=${gainDb.toFixed(2)}dB`].join(',');
}

// ---------------------------------------------------------------------------
// Appels à ffmpeg
// ---------------------------------------------------------------------------

function ffmpeg(args: string[]): string {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...args], { encoding: 'utf8' });
  if (r.error) throw new Error(`ffmpeg introuvable ou en échec : ${r.error.message}`);
  return `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
}

export function dureeDe(fichier: string): number {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', fichier], { encoding: 'utf8' });
  const d = Number(r.stdout.trim());
  if (!Number.isFinite(d)) throw new Error(`Durée illisible : ${fichier}`);
  return d;
}

export interface ResultatRognage {
  duree: number;
  debut: number;
  fin: number;
  volumes: { moyenne: number; pic: number };
  gain: number;
}

/** Analyse un son : où commence et où finit la partie utile, quel gain l'égalise. Ne crée aucun fichier. */
export function analyser(fichier: string, opt: OptionsRognage = OPTIONS_PAR_DEFAUT): ResultatRognage | null {
  const duree = dureeDe(fichier);
  const sortie = ffmpeg(['-i', fichier, '-af', `silencedetect=noise=${opt.seuilDb}dB:d=${opt.dureeMin}`, '-f', 'null', '-']);
  const bornes = bornesUtiles(extraireSilences(sortie), duree, opt);
  if (!bornes) return null;
  const mesure = ffmpeg(['-ss', String(bornes.debut), '-to', String(bornes.fin), '-i', fichier, '-af', 'volumedetect', '-f', 'null', '-']);
  const volumes = lireVolumes(mesure);
  if (!volumes) return null;
  return { duree, ...bornes, volumes, gain: gainPour(volumes, opt) };
}

/** Écrit le son rogné et égalisé. */
export function ecrire(entree: string, sortie: string, r: ResultatRognage, opt: OptionsRognage = OPTIONS_PAR_DEFAUT): void {
  const codec = opt.format === 'ogg' ? ['-c:a', 'libvorbis', '-q:a', '4'] : ['-c:a', 'libmp3lame', '-b:a', '128k'];
  ffmpeg(['-y', '-ss', String(r.debut), '-to', String(r.fin), '-i', entree, '-af', filtreFinal(r.fin - r.debut, r.gain), '-ac', '2', '-ar', '44100', ...codec, sortie]);
}
