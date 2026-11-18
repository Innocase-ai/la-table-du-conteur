// Trois contrôles des PNJ et de leurs lieux (18/11/2026, docs/AUDIT-CREATION-HISTOIRE.md rang 4), nés de défauts trouvés à la main dans
// La Tombe des Rois Serpents : douze personnages sur un seul écran au Fort, « (Compagnon) » écrit dans des titres, des répliques qui
// plaçaient un personnage ailleurs que là où il est. Ce sont des AVIS pour tous les mondes (pas seulement les épisodes) : une heuristique
// sur du texte peut se tromper, l'auteur relit et décide.
import type { DonneesMonde, Lieu, Pnj } from './schemas';

/** Au-delà, la liste « Parler à… » d'un lieu n'a plus de repère : découper le lieu en pièces. */
export const PNJ_PAR_LIEU_MAX = 6;

/** Ce qu'un titre ou un nom (lus par le joueur) ne doit pas dire : un rôle de jeu, une parenthèse d'auteur. */
export const TITRE_QUI_TRAHIT = /[()[\]]|\b(compagnons?|recrutables?|boss|pnj|qu[êe]tes?|antagonistes?|tra[îi]tres?|donneur)\b/i;

/**
 * Les tournures où un personnage dit où on le trouve (texte normalisé : minuscules, sans accents, apostrophe droite) : un verbe de
 * séjour, au plus deux mots (« toujours », « le soir »), puis une préposition de lieu. « Je suis Sélénie, archiviste… » n'en est pas une.
 */
const SE_SITUE = /\b(?:je (?:suis|serai|reste|resterai|travaille|dors|vis|loge)|j'habite|vous me (?:trouverez|verrez|retrouverez)|on me trouve)(?:\s+[a-z']+){0,2}?\s+(?:a|au|aux|dans|sur|chez|pres d(?:e|u|es|')|devant|sous)\b/g;
const FENETRE = 40;

const normaliser = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘]/g, "'");
const ARTICLES = /^(le|la|les|l'|un|une|des|du|de la|de l')\s*/;
const MOTS_VIDES = new Set(['dans', 'pres', 'sous', 'avec', 'pour', 'chez', 'vers', 'entre', 'grand', 'grande', 'petit', 'petite', 'vieux', 'vieille', 'vieil', 'saint', 'sainte']);

/** Les PNJ qui parlent : un sujet au moins, ou un compagnon. */
const parle = (p: Pnj) => p.sujets.length > 0 || !!p.compagnon;

export function avisLieuxEtPnj(dm: DonneesMonde): string[] {
  const avis: string[] = [];
  const pnjs = [...dm.pnj.values()];

  // 1. Lieux surpeuplés : tous ceux qu'on peut y croiser (lieu ou présence), parmi les PNJ qui parlent.
  const parLieu = new Map<string, Set<string>>();
  for (const p of pnjs.filter(parle)) for (const l of [p.lieu, ...p.presences.map((x) => x.lieu)]) parLieu.set(l, (parLieu.get(l) ?? new Set()).add(p.id));
  const surpeuples = [...parLieu].filter(([, s]) => s.size > PNJ_PAR_LIEU_MAX).map(([l, s]) => `${l} (${s.size})`);
  if (surpeuples.length) avis.push(`Lieux surpeuplés (plus de ${PNJ_PAR_LIEU_MAX} personnages qui parlent peuvent s'y trouver : la liste « Parler à… » n'a plus de repère, découpez le lieu en pièces) : ${surpeuples.join(', ')}.`);

  // 2. Titres et noms qui trahissent un rôle de jeu.
  const trahissent = pnjs.filter((p) => TITRE_QUI_TRAHIT.test(`${p.nom} ${p.titre ?? ''}`)).map((p) => `${p.id} « ${p.titre ?? p.nom} »`);
  if (trahissent.length) avis.push(`Titres qui trahissent un rôle de jeu (le joueur lit le nom et le titre : ni parenthèse ni « compagnon », « boss », « quête »…) : ${trahissent.join(', ')}.`);

  // 3. Répliques qui placent le PNJ ailleurs : « vous me trouverez à <lieu> » alors qu'il n'y est jamais (ni son lieu, ni une présence,
  // ni un lieu qui les contient). Les clés d'un lieu : son nom sans article, et le premier mot distinctif de son nom s'il n'appartient
  // qu'à lui (« écuries » pour « Écuries du Fort »).
  const lieux = [...dm.lieux.values()];
  const premierMot = (l: Lieu) => normaliser(l.nom).replace(ARTICLES, '').split(/[^a-z0-9']+/).find((m) => m.length >= 4 && !MOTS_VIDES.has(m));
  const compte = new Map<string, number>();
  for (const l of lieux) {
    const m = premierMot(l);
    if (m) compte.set(m, (compte.get(m) ?? 0) + 1);
  }
  const cles = new Map<string, string[]>();
  for (const l of lieux) {
    const c = [normaliser(l.nom).replace(ARTICLES, '')];
    const m = premierMot(l);
    if (m && compte.get(m) === 1) c.push(m);
    cles.set(l.id, c);
  }
  const ancetres = (id: string): string[] => {
    const res: string[] = [];
    for (let c: string | undefined = id, n = 0; c && n < 30; c = dm.lieux.get(c)?.parent, n++) res.push(c);
    return res;
  };
  const malPlaces: string[] = [];
  for (const p of pnjs) {
    const permis = new Set([p.lieu, ...p.presences.map((x) => x.lieu)].flatMap(ancetres));
    const clesPermises = new Set([...permis].flatMap((id) => cles.get(id) ?? []));
    const textes: [string, string][] = [
      ...p.sujets.flatMap((s) => [[s.id, s.reponse] as [string, string], ...s.variantes.map((v, i) => [`${s.id}#${i + 1}`, v.reponse] as [string, string])]),
      ...(['neutre', 'amical', 'hostile'] as const).flatMap((k) => (p.salutations[k] ? [[`salutation ${k}`, p.salutations[k]!] as [string, string]] : [])),
      ...p.salutations.variantes.map((v, i) => [`salutation #${i + 1}`, v.texte] as [string, string]),
    ];
    for (const [ou, texte] of textes) {
      const t = normaliser(texte);
      for (const m of t.matchAll(SE_SITUE)) {
        // La suite de la même phrase seulement.
        const suite = t.slice(m.index! + m[0].length, m.index! + m[0].length + FENETRE).split(/[.!?;»]/)[0]!;
        const cite = lieux.find((l) => !permis.has(l.id) && (cles.get(l.id) ?? []).some((c) => !clesPermises.has(c) && new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(suite)));
        if (cite) {
          malPlaces.push(`${p.id} (${ou}) → ${cite.id}`);
          break;
        }
      }
    }
  }
  if (malPlaces.length) avis.push(`Répliques qui placent un PNJ ailleurs (« vous me trouverez à… » un lieu qui n'est ni le sien, ni une de ses présences) : ${malPlaces.slice(0, 8).join(', ')}${malPlaces.length > 8 ? `… (${malPlaces.length} en tout)` : ''}.`);
  return avis;
}
