// Rendre une musique bouclable sans à-coup : un fondu enchaîné de la fin sur le début (technique classique des
// boucles de musique de jeu), et la mesure de la jonction pour vérifier le résultat. Logique pure, testée ; les
// appels à ffmpeg sont dans cli.ts.

/** Durée du fondu par défaut, en secondes : assez long pour masquer la jonction, assez court pour garder la phrase. */
export const FONDU_PAR_DEFAUT = 1.5;

/**
 * Niveau des musiques d'ambiance : c'est un fond sonore, il ne doit jamais couvrir les bruitages ni la voix. Les bruitages
 * sont égalisés à −20 dB de volume moyen (`pnpm sons rogner`) ; la musique l'est 6 dB plus bas, avec de la marge sous le pic.
 * Le joueur la règle ensuite avec son propre curseur de musique.
 */
export const NIVEAU_AMBIANCE = { moyenneDb: -26, picMaxDb: -3 } as const;

/** Le filtre qui applique un gain (en dB) à la sortie `[boucle]` du montage. */
export function filtreNiveau(gainDb: number): string {
  return `[boucle]volume=${gainDb.toFixed(2)}dB[sortie]`;
}

/**
 * Le montage : pour une musique de durée L et un fondu N, la boucle dure L − N. Elle commence par le mélange de la
 * dernière seconde et demie (qui s'éteint) avec les premières (qui s'allument), puis suit le corps de la musique jusqu'à
 * L − N. Au tour suivant, on retrouve donc exactement, après L − N, la musique d'origine à L − N : aucune coupure.
 * Les deux fondus sont en « puissance égale » (sinus / cosinus), le volume ne creuse pas au milieu du mélange.
 */
export function filtreBoucle(duree: number, fondu: number): string {
  if (!Number.isFinite(duree) || !Number.isFinite(fondu) || fondu <= 0) throw new Error('Durée et fondu doivent être positifs.');
  if (fondu * 2 >= duree) throw new Error(`Le fondu (${fondu} s) est trop long pour une musique de ${duree.toFixed(1)} s : il doit rester sous la moitié.`);
  const n = fondu.toFixed(3);
  const debutQueue = (duree - fondu).toFixed(3);
  const fin = (duree - fondu).toFixed(3);
  return [
    `[0:a]atrim=0:${n},asetpts=PTS-STARTPTS,afade=t=in:d=${n}:curve=qsin[tete]`,
    `[0:a]atrim=${debutQueue}:${duree.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=out:d=${n}:curve=qsin[queue]`,
    `[tete][queue]amix=inputs=2:normalize=0:duration=longest[fondu]`,
    `[0:a]atrim=${n}:${fin},asetpts=PTS-STARTPTS[corps]`,
    `[fondu][corps]concat=n=2:v=0:a=1[boucle]`,
  ].join(';');
}

/**
 * La partie stable d'une musique : certains morceaux se terminent malgré tout par une résonance qui s'éteint (ou
 * débutent très doucement). Bouclés tels quels, ils laisseraient un creux de silence à chaque tour. On repère les
 * fenêtres de début et de fin nettement plus faibles que le reste (de plus de `marge` dB sous le volume médian, au moins
 * deux de suite pour ne pas confondre avec un simple silence entre deux coups de percussion) et on les écarte.
 * `niveauxDb` : le volume (en dB) de chaque fenêtre consécutive de `pas` secondes.
 */
export function bornesStables(niveauxDb: readonly number[], pas: number, marge = 8): { debut: number; fin: number } {
  const n = niveauxDb.length;
  if (n < 6) return { debut: 0, fin: n * pas };
  const median = [...niveauxDb].sort((a, b) => a - b)[Math.floor(n / 2)]!;
  const seuil = median - marge;
  let debut = 0;
  while (debut < n && niveauxDb[debut]! < seuil) debut++;
  let fin = n;
  while (fin > debut && niveauxDb[fin - 1]! < seuil) fin--;
  // Une seule fenêtre faible aux extrémités n'est qu'un silence entre deux coups : on ne la coupe pas.
  if (debut < 2) debut = 0;
  if (n - fin < 2) fin = n;
  return { debut: debut * pas, fin: fin * pas };
}

/** Durée de la boucle obtenue. */
export function dureeBoucle(duree: number, fondu: number): number {
  return duree - fondu;
}

export interface Jonction {
  /** Écart de volume entre la fin et le début de la boucle (fenêtres voisines de part et d'autre), en dB. */
  ecartDb: number;
  /** Écart de volume typique entre deux fenêtres voisines ailleurs dans la musique : 90 % des écarts sont plus petits. */
  typiqueDb: number;
  /** Saut d'amplitude entre le dernier et le premier échantillon, rapporté à la pente moyenne d'un échantillon à l'autre. */
  saut: number;
  /** Verdict : la jonction se confond avec le reste de la musique. */
  propre: boolean;
}

const db = (x: number) => 20 * Math.log10(Math.max(x, 1e-6));

function rms(pcm: ArrayLike<number>, debut: number, fin: number): number {
  let s = 0;
  const n = Math.max(1, fin - debut);
  for (let i = debut; i < fin; i++) s += (pcm[i] ?? 0) ** 2;
  return Math.sqrt(s / n);
}

/** Changement de volume (en dB) entre la fenêtre qui précède une position et celle qui la suit, dans une musique mono. */
export function ecartAPosition(pcm: ArrayLike<number>, frequence: number, position: number, fenetre = 0.5): number {
  const w = Math.max(1, Math.round(fenetre * frequence));
  const p = Math.round(position * frequence);
  if (p - w < 0 || p + w > pcm.length) throw new Error('Position trop près d’un bord pour cette fenêtre.');
  return Math.abs(db(rms(pcm, p, p + w)) - db(rms(pcm, p - w, p)));
}

/**
 * Mesure la jonction fin → début d'une musique mono (échantillons flottants) : la musique est lue comme un cercle, et on
 * compare le changement de volume au point de raccord avec les changements de volume partout ailleurs. Une jonction
 * « propre » ne se distingue pas du reste.
 */
export function mesurerJonction(pcm: ArrayLike<number>, frequence: number, fenetre = 0.25): Jonction {
  const n = pcm.length;
  const w = Math.max(1, Math.round(fenetre * frequence));
  if (n < w * 8) throw new Error('Musique trop courte pour mesurer sa jonction.');
  // La fin juste avant le raccord contre le début juste après.
  const ecartDb = Math.abs(db(rms(pcm, n - w, n)) - db(rms(pcm, 0, w)));
  // Les écarts entre fenêtres voisines, à tous les endroits sauf le raccord (pas de 1/4 de fenêtre).
  const ecarts: number[] = [];
  for (let p = w; p + w <= n; p += Math.max(1, Math.floor(w / 4))) ecarts.push(Math.abs(db(rms(pcm, p, p + w)) - db(rms(pcm, p - w, p))));
  ecarts.sort((a, b) => a - b);
  const typiqueDb = ecarts[Math.floor(ecarts.length * 0.9)] ?? 0;
  let pente = 0;
  const m = Math.min(n - 1, 20_000);
  for (let i = 1; i <= m; i++) pente += Math.abs((pcm[i] ?? 0) - (pcm[i - 1] ?? 0));
  pente /= m;
  const saut = Math.abs((pcm[n - 1] ?? 0) - (pcm[0] ?? 0)) / Math.max(pente, 1e-9);
  // Tolérance : un peu plus que l'écart typique (1 dB de marge), et pas de saut net d'un échantillon à l'autre.
  return { ecartDb, typiqueDb, saut, propre: ecartDb <= typiqueDb + 1 && saut < 6 };
}
