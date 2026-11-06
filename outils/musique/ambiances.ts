// Les musiques d'ambiance de combat : une par terrain du plateau (forêt, souterrain, caverne, camp) et une pour le
// combat intense. Chaque ambiance a sa consigne pour le modèle de musique (Lyria 3 via OpenRouter).
// Les consignes sont en anglais, langue où ces modèles sont le plus fiables ; la musique est toujours instrumentale.

export const MODELES = {
  /** Un clip de 30 s : 0,04 $ (tarif relevé le 04/11/2026). Idéal pour juger une consigne ou faire une boucle. */
  clip: { id: 'google/lyria-3-clip-preview', coutParMorceau: 0.04, libelle: 'Lyria 3 Clip (30 s)' },
  /** Un morceau complet d'environ 2 minutes : 0,08 $. */
  pro: { id: 'google/lyria-3-pro-preview', coutParMorceau: 0.08, libelle: 'Lyria 3 Pro (morceau complet)' },
} as const;

export type NomModele = keyof typeof MODELES;

export interface Ambiance {
  id: string;
  titre: string;
  /** Le terrain du plateau auquel elle va (voir `Terrain` dans le moteur), ou « intense » pour les combats difficiles. */
  terrain: string;
  /** Ce qu'on veut entendre, en une phrase. */
  idee: string;
  /** La description musicale donnée au modèle. */
  musique: string;
}

export const AMBIANCES: Ambiance[] = [
  {
    id: 'foret',
    titre: 'Embuscade en forêt',
    terrain: 'foret',
    idee: 'Une tension sourde sous les arbres : on se bat pour sa vie, mais la forêt reste vivante.',
    musique:
      'dark fantasy RPG battle music, forest ambush. Low pulsing cellos and double basses, hand percussion with wooden ' +
      'frame drums, a sparse tremolo violin line, distant low flute. Tense and urgent but restrained, moderate tempo ' +
      'around 100 BPM, minor key, no big melody, steady rhythmic drive that is easy to listen to for a long time.',
  },
  {
    id: 'souterrain',
    titre: 'Crypte et souterrain',
    terrain: 'souterrain',
    idee: 'Une menace froide et résonnante : pierre, écho, morts qui se relèvent.',
    musique:
      'dark fantasy RPG battle music, cold crypt and underground catacombs. Deep drone, bowed metal, low church organ ' +
      'pedal, slow heavy taiko hits with long reverb, whispering string clusters. Ominous, cold and dread-filled, slow ' +
      'to moderate tempo around 80 BPM, minor key, no memorable melody, strong sense of echo and stone.',
  },
  {
    id: 'caverne',
    titre: 'Caverne',
    terrain: 'caverne',
    idee: 'Un grondement lointain, des gouttes, des créatures qui rôdent dans le noir.',
    musique:
      'dark fantasy RPG battle music, deep cave. Rumbling sub-bass, resonant metallic percussion, ' +
      'dripping water textures, low brass swells, tense low strings playing short repeated ostinato notes. Claustrophobic ' +
      'and dangerous, tempo around 90 BPM, minor key, no singing melody, constant low pressure.',
  },
  {
    id: 'camp',
    titre: 'Camp de guerre',
    terrain: 'camp',
    idee: 'Une troupe disciplinée : tambours, cuivres graves, une marche qui avance.',
    musique:
      'dark fantasy RPG battle music, disciplined enemy war camp. Marching snare and large war drums, low brass ' +
      'horns playing short martial phrases, taiko, gritty low strings. Martial, aggressive and rhythmic, tempo around ' +
      '110 BPM, minor key, strong steady march rhythm with a short horn motif repeating.',
  },
  {
    id: 'intense',
    titre: 'Combat intense',
    terrain: 'intense',
    idee: 'Le grand affrontement : urgence, puissance, tout est en jeu.',
    musique:
      'epic dark fantasy RPG boss battle music. Driving fast ostinato strings, powerful taiko and orchestral percussion, ' +
      'brass stabs, urgent low choir pads without words, rising tension. Intense, heroic and dangerous, fast tempo ' +
      'around 140 BPM, minor key, relentless forward momentum.',
  },
];

/** Ce qui est demandé à chaque morceau, quelle que soit l'ambiance : instrumental, sans fin marquée, pensé pour boucler. */
const CONTRAINTES =
  'Instrumental only, no vocals, no spoken voice, no sung words. It is background music for a video game combat that ' +
  'will play on a loop: keep the energy constant from start to finish, no long intro, no build to a finale, and end ' +
  'on a sustained texture similar to the beginning, without a fade-out or a final stinger.';

/** La consigne complète envoyée au modèle pour une ambiance. */
export function consigne(a: Ambiance, modele: NomModele): string {
  const duree = modele === 'clip' ? 'A 30-second clip. ' : 'A full track of about 2 minutes. ';
  return `${duree}${a.musique} ${CONTRAINTES}`;
}

/** Coût annoncé pour `n` morceaux avec ce modèle, en dollars. */
export function coutEstime(modele: NomModele, n: number): number {
  return Math.round(MODELES[modele].coutParMorceau * n * 1000) / 1000;
}
