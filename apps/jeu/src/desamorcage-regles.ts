// L'écran de désamorçage : quand le groupe désamorce un piège repéré, une animation plein écran du mécanisme (aiguille, fil,
// plaque, sol qui cède, chute, gaz, glyphe, rouages), un compte à rebours dont la durée dépend du bonus du héros, puis le
// résultat : neutralisé, raté sans suite, ou déclenché (avec ce que le moteur a déjà calculé : sauvegarde, dégâts, états).
// Tout est pur : le moteur a déjà tout réglé ; ces règles disent seulement quoi montrer, à partir des nouvelles entrées du
// journal. Rien de caché n'y passe : le mécanisme se déduit du nom et du résumé du piège (le joueur les a lus à la découverte),
// jamais du DD de détection ; le texte de déclenchement n'est transmis que si le piège s'est déclenché.
import type { EvenementJeu, Jet } from '@crpg/regles';
import type { Son } from './sons-regles';

export type MecanismePiege = 'aiguille' | 'fil' | 'plaque' | 'sol' | 'chute' | 'gaz' | 'glyphe' | 'rouages';
export type IssueDesamorcage = 'reussi' | 'rate' | 'declenche';

/** Ce que l'écran sait d'un piège du monde : seulement ce que le joueur a pu lire (nom, résumé) et le texte de déclenchement. */
export interface PiegeConnu {
  nom: string;
  resume: string;
  declenchement: string;
}

/** Ce que le journal raconte d'un désamorçage tenté. */
export interface Desamorcage {
  /** Le héros qui a agi (identifiant et nom). */
  heros: string;
  nomHeros: string;
  /** Le nom du piège, tel que le moteur le dit. */
  piege: string;
  mecanisme: MecanismePiege;
  issue: IssueDesamorcage;
  /** Le jet de désamorçage (le DD du désamorçage est connu du joueur, sauf s'il est marqué secret). */
  jet: Jet;
  /** Seulement si le piège s'est déclenché : son texte, la sauvegarde de la victime, ce qu'elle subit. */
  declenchement?: string;
  sauvegarde?: Jet;
  consequences: string[];
  /** Les types de dégâts subis (« perforant », « poison »…), pour le bruitage. */
  typesDegats: string[];
}

/** Une seconde d'écran = une seconde de compte à rebours, jamais de fraction. */
export const MS_PAR_SECONDE = 1000;

/** Le temps du travail affiché, en secondes entières : de 3 à 7 s, plus long quand le DD dépasse le bonus du héros. */
export function dureeDesamorcage(bonus: number, dd: number): number {
  return Math.min(7, Math.max(3, Math.round(3 + (dd - bonus) * 0.4)));
}

/** Combien de temps le résultat reste affiché (en ms) : plus long quand il y a des conséquences à lire. */
export function dureeResultat(issue: IssueDesamorcage): number {
  return issue === 'declenche' ? 7000 : 3800;
}

const sansAccent = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[’‘]/g, "'")
    .toLowerCase();

// Dans l'ordre : la première règle qui reconnaît un mot gagne. Le nom du piège passe avant son résumé.
const REGLES: { mecanisme: MecanismePiege; mots: RegExp }[] = [
  { mecanisme: 'plaque', mots: /plaque|pression/ },
  { mecanisme: 'glyphe', mots: /glyphe|rune|sceau/ },
  { mecanisme: 'gaz', mots: /\bgaz\b|vapeur|souffle|brume|nuage|emanation|fumee|petard|poudre/ },
  { mecanisme: 'aiguille', mots: /aiguille|dard|arbalete|fleche|\bpointe/ },
  { mecanisme: 'fil', mots: /\bfils?\b|collet|clochette|cordeau|\bcorde\b/ },
  { mecanisme: 'chute', mots: /chaine|herse|contrepoids|plafond|sac de plomb|boulement|poutre|\betais?\b/ },
  { mecanisme: 'sol', mots: /fosse|planche|passerelle|plancher|vase|sable|pieu|machoire|chausse|pont\b|tablier|creuse|vermoul|trappe/ },
  { mecanisme: 'chute', mots: /effondrement|chute|s'ecrase/ },
  { mecanisme: 'plaque', mots: /dalle/ },
];

function classer(texte: string): MecanismePiege | undefined {
  const t = sansAccent(texte);
  return REGLES.find((r) => r.mots.test(t))?.mecanisme;
}

/** Le mécanisme à dessiner, d'après le nom du piège, puis son résumé (ce que le joueur a lu en le repérant). */
export function mecanismeDuPiege(piege: Pick<PiegeConnu, 'nom' | 'resume'>): MecanismePiege {
  return classer(piege.nom) ?? classer(piege.resume) ?? 'rouages';
}

/** Un nom d'objet dans une phrase : « La dalle aux faucilles » devient « la dalle aux faucilles » ; « L'aiguille… » : « l'aiguille… ». */
export function objetEnPhrase(nom: string): string {
  return nom.replace(/^(Le|La|Les|L’|L') ?/, (m) => m.toLowerCase());
}

/** Les constats du moteur : « X désamorce P. », « X se trompe : P se déclenche. », « X n'arrive pas à désamorcer P, mais ne le déclenche pas. » */
function lireConstat(nom: string, texte: string): { issue: IssueDesamorcage; piege: string } | undefined {
  const reussi = `${nom} désamorce `;
  if (texte.startsWith(reussi) && texte.endsWith('.')) return { issue: 'reussi', piege: texte.slice(reussi.length, -1) };
  const trompe = `${nom} se trompe : `;
  if (texte.startsWith(trompe) && texte.endsWith(' se déclenche.')) return { issue: 'declenche', piege: texte.slice(trompe.length, -' se déclenche.'.length) };
  const rate = `${nom} n'arrive pas à désamorcer `;
  if (texte.startsWith(rate) && texte.endsWith(', mais ne le déclenche pas.')) return { issue: 'rate', piege: texte.slice(rate.length, -', mais ne le déclenche pas.'.length) };
  return undefined;
}

const DEGATS = /\d+ dégâts de ([\p{L}]+)/gu;

/**
 * Un désamorçage vient-il d'être tenté dans ces nouvelles entrées du journal ? (Le dernier, s'il y en a plusieurs.)
 * `pieges` : les pièges du monde, pour retrouver le mécanisme et le texte de déclenchement d'après le nom que le moteur dit.
 */
export function detecterDesamorcage(nouvelles: readonly EvenementJeu[], pieges: Iterable<PiegeConnu>): Desamorcage | undefined {
  const jets = nouvelles.flatMap((e) => (e.type === 'jet' ? [e.jet] : []));
  let trouve: Desamorcage | undefined;
  for (const jet of jets) {
    if (jet.test.startsWith('sauvegarde')) continue;
    nouvelles.forEach((e, i) => {
      if (e.type !== 'constat') return;
      const c = lireConstat(jet.nom, e.texte);
      if (!c) return;
      const connu = [...pieges].find((x) => x.nom === c.piege);
      const d: Desamorcage = {
        heros: jet.qui,
        nomHeros: jet.nom,
        piege: c.piege,
        mecanisme: connu ? mecanismeDuPiege(connu) : 'rouages',
        issue: c.issue,
        jet,
        consequences: [],
        typesDegats: [],
      };
      if (c.issue === 'declenche') {
        // Ce que le piège a fait, déjà décidé par le moteur : sa narration, la sauvegarde, les dégâts et les états de la victime.
        const apres = nouvelles.slice(i + 1);
        if (connu && nouvelles.some((x) => x.type === 'texte' && x.texte === connu.declenchement)) d.declenchement = connu.declenchement;
        d.sauvegarde = jets.find((x) => x.qui === jet.qui && x.test.startsWith('sauvegarde'));
        for (const x of apres) {
          if (x.type !== 'constat' || !(x.texte.startsWith(`${jet.nom} subit `) || x.texte.startsWith(`${jet.nom} est `))) continue;
          d.consequences.push(x.texte);
          for (const m of x.texte.matchAll(DEGATS)) d.typesDegats.push(m[1]!);
        }
      }
      trouve = d;
    });
  }
  return trouve;
}

const PHRASES_TRAVAIL: Record<MecanismePiege, string> = {
  aiguille: 'La pointe de l’outil cherche le ressort…',
  fil: 'Le fil est tendu comme une corde de harpe…',
  plaque: 'Un souffle de trop et la plaque s’enfonce…',
  sol: 'Le sol sonne creux sous les doigts…',
  chute: 'Tout ce poids ne tient que par un seul point…',
  gaz: 'Une odeur âcre s’échappe du joint…',
  glyphe: 'Les runes frémissent sous les doigts…',
  rouages: 'Les rouages grincent, prêts à repartir…',
};

/** La phrase pendant l'effort. */
export function phraseDeTravail(m: MecanismePiege): string {
  return PHRASES_TRAVAIL[m];
}

const PHRASES_REUSSI: Record<MecanismePiege, string> = {
  aiguille: 'Le ressort est bloqué : l’aiguille ne sortira plus.',
  fil: 'Le fil est coupé net, sans une vibration.',
  plaque: 'La plaque est calée : plus rien ne la fera céder.',
  sol: 'Le sol est étayé : il tiendra.',
  chute: 'Le poids est calé : il ne tombera pas.',
  gaz: 'Le joint est refermé : le gaz reste prisonnier.',
  glyphe: 'Le glyphe s’éteint, effacé de l’intérieur.',
  rouages: 'Les rouages sont bloqués dans un dernier cliquetis.',
};

const PHRASES_RATE: Record<MecanismePiege, string> = {
  aiguille: 'L’outil glisse : le ressort tient, mais rien ne part.',
  fil: 'Le fil vibre un instant, puis retrouve son calme.',
  plaque: 'La plaque tressaute sous l’outil, sans s’enfoncer.',
  sol: 'Le sol craque, mais ne cède pas.',
  chute: 'La chaîne grince, mais ne lâche pas.',
  gaz: 'Un filet de gaz s’échappe, puis s’arrête.',
  glyphe: 'Les runes vacillent, puis se rallument.',
  rouages: 'Les rouages sautent d’un cran, sans repartir.',
};

const PHRASES_DECLENCHE: Record<MecanismePiege, string> = {
  aiguille: 'Clac ! L’aiguille jaillit.',
  fil: 'Le fil casse : tout se déclenche !',
  plaque: 'La plaque s’enfonce : trop tard !',
  sol: 'Le sol se dérobe !',
  chute: 'Tout lâche d’un coup !',
  gaz: 'Un sifflement, puis le gaz jaillit !',
  glyphe: 'Les runes s’embrasent !',
  rouages: 'Les rouages s’emballent !',
};

/** Le message qui conclut l'écran (celui du moteur suit : jet, conséquences). */
export function messageFinal(m: MecanismePiege, issue: IssueDesamorcage): string {
  return (issue === 'reussi' ? PHRASES_REUSSI : issue === 'rate' ? PHRASES_RATE : PHRASES_DECLENCHE)[m];
}

/** Le titre de l'écran : « Bran désamorce la dalle aux faucilles ». */
export function titreDesamorcage(nomHeros: string, piege: string): string {
  return `${nomHeros} désamorce ${objetEnPhrase(piege)}`;
}

const SON_DEGATS: Record<string, Son> = {
  perforant: 'perforant',
  tranchant: 'epee',
  contondant: 'contondant',
  poison: 'poison',
  feu: 'feu-1',
  necrotique: 'necrotique',
  acide: 'acide',
  foudre: 'foudre',
  tonnerre: 'tonnerre',
  radiant: 'radiant',
  froid: 'glace',
};

/**
 * Le bruitage du résultat : le déclic d'un piège neutralisé ; au déclenchement, le bruit du premier type de dégâts subi (rien si
 * le piège ne fait pas de dégâts : une alarme). Un échec sans suite ne fait pas de bruit.
 */
export function sonDuResultat(d: Pick<Desamorcage, 'issue' | 'typesDegats'>): Son | undefined {
  if (d.issue === 'reussi') return 'serrure-ouverte';
  if (d.issue !== 'declenche') return undefined;
  for (const t of d.typesDegats) {
    const cle = sansAccent(t).replace(/s$/, '');
    if (SON_DEGATS[cle]) return SON_DEGATS[cle];
  }
  return undefined;
}
