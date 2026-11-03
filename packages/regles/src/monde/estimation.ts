// Estimation de la durée d'une campagne et de son coût d'API pour le joueur (qui utilise sa propre clé).
// Le calcul part du contenu du monde (lieux, PNJ, rencontres, énigmes…) et d'hypothèses sur un tour de jeu.
// Ces hypothèses sont PROVISOIRES : elles seront remplacées par les mesures du journal de partie (M4b, voir
// docs/M4-CONTEUR.md). Les combats ne coûtent rien en API : le moteur et l'IA tactique tournent en local.
import { z } from 'zod';
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

/** Hypothèses sur un tour de conteur (une action du joueur et sa réponse). */
export const TOUR = {
  /** Appels au modèle par tour (le récit plus les outils). */
  appels: 2.5,
  /** Tokens relus depuis le cache à chaque appel : règles, bible, monde, outils, début de l'historique. */
  enCache: 15_000,
  /** Tokens nouveaux à chaque appel : fiche de scène, action, résultats d'outils. */
  nouveaux: 3_000,
  /** Tokens produits par tour : réflexion, appels d'outils, récit. */
  sortie: 900,
};

/** Tours de jeu attendus par élément du monde, et rythme. */
export const RYTHME = {
  parLieu: 1.5,
  /** Part des lieux que visite un groupe qui finit l'histoire. */
  lieuxVisites: 0.85,
  parPnj: 3,
  parCombat: 2, // mise en scène et issue ; le combat lui-même est local
  parRencontreAutre: 4,
  parEnigme: 4,
  parPiege: 1.5,
  parTresor: 0.5,
  parQuete: 3,
  parEvenement: 1,
  /** Repos, commerce, errance, retours en arrière. */
  marge: 0.15,
  toursParHeure: 45,
  minutesParCombat: 12,
  /** Une image de groupe tous les N tours. */
  toursParImage: 12,
  /** Fourchette autour de l'estimation centrale. */
  incertitude: 0.3,
};

export const Estimation = z.object({
  monde: z.string(),
  tours: z.number(),
  heures: z.object({ recit: z.number(), combats: z.number(), total: z.number() }),
  couts: z.array(z.object({ modele: z.string(), nom: z.string(), usd: z.number(), min: z.number(), max: z.number() })),
  imagesUsd: z.number(),
});
export type Estimation = z.infer<typeof Estimation>;

const arrondi = (x: number, pas: number) => Number((Math.round(x / pas) * pas).toFixed(2));

export function coutTourUsd(t: (typeof TARIFS_CONTEUR)[number]): number {
  const parAppel = (TOUR.enCache * t.cache + TOUR.nouveaux * t.entree) / 1e6;
  return TOUR.appels * parAppel + (TOUR.sortie * t.sortie) / 1e6;
}

export function estimerCampagne(dm: DonneesMonde): Estimation {
  const rencontres = [...dm.rencontres.values()];
  const combats = rencontres.filter((r) => r.type === 'combat' || r.type === 'mixte').length;
  const base =
    dm.lieux.size * RYTHME.parLieu * RYTHME.lieuxVisites +
    dm.pnj.size * RYTHME.parPnj +
    combats * RYTHME.parCombat +
    (rencontres.length - combats) * RYTHME.parRencontreAutre +
    dm.enigmes.size * RYTHME.parEnigme +
    dm.pieges.size * RYTHME.parPiege +
    dm.tresors.size * RYTHME.parTresor +
    dm.quetes.size * RYTHME.parQuete +
    dm.evenements.size * RYTHME.parEvenement;
  const tours = Math.round(base * (1 + RYTHME.marge));
  const recit = tours / RYTHME.toursParHeure;
  const enCombat = (combats * RYTHME.minutesParCombat) / 60;
  const i = RYTHME.incertitude;
  return {
    monde: dm.monde.id,
    tours,
    heures: { recit: arrondi(recit, 0.5), combats: arrondi(enCombat, 0.5), total: Math.round(recit + enCombat) },
    couts: TARIFS_CONTEUR.map((t) => {
      const usd = tours * coutTourUsd(t);
      const pas = usd < 5 ? 0.1 : 0.5;
      return { modele: t.modele, nom: t.nom, usd: arrondi(usd, pas), min: arrondi(usd * (1 - i), pas), max: arrondi(usd * (1 + i), pas) };
    }),
    imagesUsd: arrondi((tours / RYTHME.toursParImage) * PRIX_IMAGE_USD, 0.1),
  };
}
