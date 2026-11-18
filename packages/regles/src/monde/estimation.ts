// Estimation de la durée d'une campagne et de son coût d'API pour le joueur (qui utilise sa propre clé).
// Le calcul part du contenu du monde (lieux, PNJ, rencontres, énigmes…) et d'hypothèses sur un tour de jeu.
// Principe (docs/M4-CONTEUR.md) : le moteur et les textes écrits portent le jeu ; le conteur (l'IA) n'est appelé que
// là où il apporte quelque chose (saisie libre, dialogues, imprévus, moments forts). Les actions mécaniques (aller,
// fouiller, ouvrir, prendre…) et les combats ne coûtent rien en API.
// Ces hypothèses sont PROVISOIRES : elles seront remplacées par les mesures du journal de partie (M4b).
import { z } from 'zod';
import { savoirsDe } from './savoirs-donnees';
import type { DonneesMonde } from './schemas';

/** Tarifs des modèles du conteur, en dollars par million de tokens (relevés le 03/11/2026). */
export const TARIFS_CONTEUR = [
  { modele: 'claude-opus-5-5', nom: 'Claude Opus 5.5', entree: 4, sortie: 20, cache: 0.2 },
  { modele: 'claude-sonnet-5-5', nom: 'Claude Sonnet 5.5', entree: 2, sortie: 10, cache: 0.2 },
  // Prix de lecture du cache non relevé pour Haiku 5.5 : compté au plein tarif d'entrée (majorant).
  { modele: 'claude-haiku-5-5', nom: 'Claude Haiku 5.5', entree: 0.1, sortie: 0.5, cache: 0.1 },
] as const;

/** Une image de scène avec le groupe (FLUX 3 Image Klein via OpenRouter), générée en cours de partie. */
export const PRIX_IMAGE_USD = 0.009;

/** Hypothèses sur un tour de conteur : le moteur a déjà résolu l'action, le conteur raconte en un appel le plus souvent. */
export const TOUR = {
  /** Appels au modèle par tour (un seul, sauf quand il consulte une fiche ou enchaîne une action). */
  appels: 1.3,
  /** Tokens relus depuis le cache à chaque appel : règles, bible, monde, outils, début de l'historique. */
  enCache: 12_000,
  /** Tokens nouveaux à chaque appel : fiche de scène compacte, action, compte rendu du moteur. */
  nouveaux: 2_000,
  /** Tokens produits par tour : récit court, réflexion minimale. */
  sortie: 500,
};

/**
 * Tours de jeu attendus par élément du monde, et part de ces tours qui passe par le conteur. Le reste est mécanique :
 * le moteur résout et le jeu affiche les textes écrits par l'auteur (descriptions, narrations, réponses des PNJ).
 */
export const RYTHME = {
  lieu: { tours: 1.5, conteur: 0 },
  /** Part des lieux que visite un groupe qui finit l'histoire. */
  lieuxVisites: 0.85,
  pnj: { tours: 3, conteur: 2 / 3 }, // la salutation et un sujet s'affichent ; les vraies conversations passent par le conteur
  combat: { tours: 2, conteur: 0.25 }, // mise en scène écrite, issue racontée pour les combats importants ; le combat lui-même est local
  rencontreAutre: { tours: 4, conteur: 0.75 }, // négocier, ruser
  enigme: { tours: 4, conteur: 0.25 }, // la réponse est vérifiée par le moteur
  piege: { tours: 1.5, conteur: 0 },
  tresor: { tours: 0.5, conteur: 0 },
  quete: { tours: 3, conteur: 1 / 3 },
  evenement: { tours: 1, conteur: 0 },
  /**
   * Un PNJ qui a une fiche de savoir (dossier `savoirs/`) se prête à la conversation libre : des tours en plus, tous racontés par le
   * conteur (donc payants). Hypothèse provisoire, à calibrer sur les mesures (audit du 18/11/2026, S8).
   */
  savoir: { tours: 2, conteur: 1 },
  /** Imprévus, saisie libre, errance, repos, commerce : tours en plus, tous racontés par le conteur. */
  marge: 0.15,
  /**
   * Temps par tour de jeu HORS lecture : choisir, cliquer, hésiter, consulter la fiche ou le sac. La lecture des textes est
   * comptée à part (voir `motsParMinute`) : une histoire aux textes riches dure plus qu'une histoire aux textes secs.
   */
  secondesParAction: 60,
  /** Vitesse de lecture dans le jeu, en mots par minute : plus lente qu'une lecture courante (200 à 250), on lit pour jouer. */
  motsParMinute: 150,
  /** Part des mots de chaque sorte de texte qu'un groupe qui finit l'histoire lit vraiment. */
  lecture: { reponsesPnj: 0.6, extensions: 0.5 },
  minutesParCombat: 12,
  /** Une image de groupe tous les N tours de conteur (les moments forts). */
  toursParImage: 8,
  /** Fourchette autour de l'estimation centrale. */
  incertitude: 0.3,
};

export const Estimation = z.object({
  monde: z.string(),
  tours: z.number(),
  /** Tours qui passent par le conteur (les seuls qui coûtent). */
  toursConteur: z.number(),
  heures: z.object({ recit: z.number(), combats: z.number(), total: z.number() }),
  couts: z.array(z.object({ modele: z.string(), nom: z.string(), usd: z.number(), min: z.number(), max: z.number() })),
  imagesUsd: z.number(),
  /** Mots que le joueur lit en finissant l'histoire (arrivées, réponses, mises en scène, scènes, dilemmes), selon `RYTHME.lecture`. */
  motsLus: z.number().default(0),
});
export type Estimation = z.infer<typeof Estimation>;

const arrondi = (x: number, pas: number) => Number((Math.round(x / pas) * pas).toFixed(2));

export function coutTourUsd(t: (typeof TARIFS_CONTEUR)[number]): number {
  const parAppel = (TOUR.enCache * t.cache + TOUR.nouveaux * t.entree) / 1e6;
  return TOUR.appels * parAppel + (TOUR.sortie * t.sortie) / 1e6;
}

const nombreDeMots = (t: unknown): number => (typeof t === 'string' ? t.split(/\s+/).filter(Boolean).length : 0);
/** Les mots d'un arbre de données qui sont de vraies phrases (5 mots au moins) : on laisse de côté les identifiants et les étiquettes. */
const motsDePhrases = (v: unknown): number => {
  if (typeof v === 'string') return nombreDeMots(v) >= 5 ? nombreDeMots(v) : 0;
  if (Array.isArray(v)) return v.reduce((s: number, x) => s + motsDePhrases(x), 0);
  if (v && typeof v === 'object') return Object.values(v as object).reduce((s: number, x) => s + motsDePhrases(x), 0);
  return 0;
};

/**
 * Mots que lit un groupe qui finit l'histoire : l'arrivée dans les lieux visités, les réponses des PNJ qu'on interroge, les mises
 * en scène des rencontres, les événements, et les textes des modules (dilemmes, événements à choix, scènes, examens).
 */
export function motsLusDuMonde(dm: DonneesMonde): number {
  const R = RYTHME;
  const arrivees = [...dm.lieux.values()].reduce((s, l) => s + nombreDeMots(l.arrivee), 0) * R.lieuxVisites;
  const reponses = [...dm.pnj.values()].reduce((s, p) => s + p.sujets.reduce((t, x) => t + nombreDeMots(x.reponse), 0), 0) * R.lecture.reponsesPnj;
  const mises = [...dm.rencontres.values()].reduce((s, r) => s + nombreDeMots(r.intro), 0);
  const evenements = [...dm.evenements.values()].reduce((s, e) => s + nombreDeMots(e.narration), 0);
  const modules = Object.entries(dm.extensions ?? {})
    .filter(([dossier]) => ['dilemmes', 'evenements-choix', 'scenes', 'examens'].includes(dossier))
    .reduce((s, [, v]) => s + motsDePhrases(v), 0) * R.lecture.extensions;
  return Math.round(arrivees + reponses + mises + evenements + modules);
}

export function estimerCampagne(dm: DonneesMonde): Estimation {
  const rencontres = [...dm.rencontres.values()];
  const combats = rencontres.filter((r) => r.type === 'combat' || r.type === 'mixte').length;
  const R = RYTHME;
  const elements: [number, { tours: number; conteur: number }][] = [
    [dm.lieux.size * R.lieuxVisites, R.lieu],
    [dm.pnj.size, R.pnj],
    [combats, R.combat],
    [rencontres.length - combats, R.rencontreAutre],
    [dm.enigmes.size, R.enigme],
    [dm.pieges.size, R.piege],
    [dm.tresors.size, R.tresor],
    [dm.quetes.size, R.quete],
    [dm.evenements.size, R.evenement],
    [new Set(savoirsDe(dm).savoirs.map((x) => x.pnj).filter((id) => dm.pnj.has(id))).size, R.savoir],
  ];
  const base = elements.reduce((s, [n, e]) => s + n * e.tours, 0);
  const marge = base * R.marge;
  const tours = Math.round(base + marge);
  const toursConteur = Math.round(elements.reduce((s, [n, e]) => s + n * e.tours * e.conteur, 0) + marge);
  const motsLus = motsLusDuMonde(dm);
  const recit = (tours * R.secondesParAction) / 3600 + motsLus / (R.motsParMinute * 60);
  const enCombat = (combats * R.minutesParCombat) / 60;
  const i = R.incertitude;
  // Le total est la somme de ses parties, arrondies à la demi-heure, ou au quart d'heure pour un épisode de moins de 2 h (audit du 18/11/2026, S8).
  const pasHeures = recit + enCombat < 2 ? 0.25 : 0.5;
  const recitArrondi = arrondi(recit, pasHeures);
  const combatsArrondis = arrondi(enCombat, pasHeures);
  return {
    monde: dm.monde.id,
    tours,
    toursConteur,
    heures: { recit: recitArrondi, combats: combatsArrondis, total: arrondi(recitArrondi + combatsArrondis, pasHeures) },
    couts: TARIFS_CONTEUR.map((t) => {
      const usd = toursConteur * coutTourUsd(t);
      const pas = usd < 5 ? 0.1 : 0.5;
      return { modele: t.modele, nom: t.nom, usd: arrondi(usd, pas), min: arrondi(usd * (1 - i), pas), max: arrondi(usd * (1 + i), pas) };
    }),
    imagesUsd: arrondi((toursConteur / R.toursParImage) * PRIX_IMAGE_USD, 0.1),
    motsLus,
  };
}
