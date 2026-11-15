// L'en-tête de l'écran d'aventure : l'heure lisible, la boussole de quête (l'objectif de la quête suivie) et les petits badges qui
// annoncent ce qu'une action vient de changer (or, PX, objets, jauges, temps). Sans React : testé dans `boussole-regles.test.ts`.
import type { DonneesMonde, EtatMonde } from '@crpg/regles';

type Quetes = EtatMonde['quetes'];

/** Le moment de la journée (les présences des PNJ, elles, ne distinguent que jour, soir et nuit). */
export function momentLisible(heure: number): 'matin' | 'après-midi' | 'soir' | 'nuit' {
  return heure >= 6 && heure < 12 ? 'matin' : heure >= 12 && heure < 18 ? 'après-midi' : heure >= 18 && heure < 22 ? 'soir' : 'nuit';
}

/** « 14 h · après-midi » : l'heure de la scène et son moment, pour que le joueur sache quand les gens sont là. */
export function heureLisible(heure: number): string {
  const h = Math.floor(((heure % 24) + 24) % 24);
  return `${h} h · ${momentLisible(h)}`;
}

// ---------------------------------------------------------------------------
// La boussole de quête
// ---------------------------------------------------------------------------

export interface Boussole {
  id: string;
  nom: string;
  type: 'principale' | 'secondaire' | 'personnelle' | 'faction';
  /** L'étape à faire : son texte d'auteur, côté joueur. */
  objectif: string;
  /** Où l'étape se joue (nom du lieu), si l'auteur l'a dit. */
  lieu?: string;
  /** Combien d'autres étapes sont actives en même temps dans cette quête. */
  etapesEnPlus: number;
  /** Les quêtes en cours, de la plus récente à la plus ancienne : le joueur peut en suivre une autre. */
  enCours: { id: string; nom: string }[];
}

/**
 * La règle de la quête suivie : celle que le joueur a choisie tant qu'elle est en cours ; sinon la dernière quête entrée au
 * journal parmi les quêtes en cours (le journal garde l'ordre d'arrivée des quêtes). Les quêtes proposées, accomplies ou
 * échouées ne se suivent pas.
 */
export function queteSuivie(dm: DonneesMonde, quetes: Quetes, choisie?: string): string | undefined {
  const enCours = Object.entries(quetes)
    .filter(([id, q]) => q.statut === 'active' && dm.quetes.has(id))
    .map(([id]) => id);
  if (choisie && enCours.includes(choisie)) return choisie;
  return enCours[enCours.length - 1];
}

/** Ce que la boussole montre : la quête suivie et son objectif du moment ; rien quand aucune quête n'est en cours. */
export function boussoleDeQuete(dm: DonneesMonde, quetes: Quetes, choisie?: string): Boussole | undefined {
  const id = queteSuivie(dm, quetes, choisie);
  const def = id ? dm.quetes.get(id) : undefined;
  const q = id ? quetes[id] : undefined;
  if (!id || !def || !q) return undefined;
  const etapes = q.actives.map((e) => def.etapes.find((x) => x.id === e)).filter((x): x is NonNullable<typeof x> => !!x);
  const premiere = etapes[0];
  const enCours = Object.entries(quetes)
    .filter(([x, y]) => y.statut === 'active' && dm.quetes.has(x))
    .map(([x]) => ({ id: x, nom: dm.quetes.get(x)!.nom }))
    .reverse();
  return {
    id,
    nom: def.nom,
    type: def.type,
    objectif: premiere?.texte ?? def.resume,
    ...(premiere?.lieu && dm.lieux.get(premiere.lieu) ? { lieu: dm.lieux.get(premiere.lieu)!.nom } : {}),
    etapesEnPlus: Math.max(0, etapes.length - 1),
    enCours,
  };
}

// ---------------------------------------------------------------------------
// Les badges de changement d'état
// ---------------------------------------------------------------------------

export type GenreBadge = 'gain' | 'perte' | 'temps' | 'jauge';

export interface BadgeEtat {
  /** Identifie le badge (même texte, même genre : un seul à la fois). */
  cle: string;
  texte: string;
  genre: GenreBadge;
  /** Une phrase pour les lecteurs d'écran et l'infobulle. */
  details: string;
}

/** Les noms que le client sait donner aux objets et aux jauges (le monde d'abord, le catalogue SRD ensuite). */
export interface NomsBadge {
  objet: (id: string) => string;
  jauge: (id: string) => string;
}

const MAX_BADGES = 5;

const nombre = (n: number): string => (Math.round(n * 100) / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
const signe = (n: number): string => (n > 0 ? '+' : '−');

/** Les heures de jeu écoulées entre deux états (un jour = 24 h). */
const horloge = (e: Pick<EtatMonde, 'jour' | 'heure'>): number => e.jour * 24 + (e.heure ?? 8);

/**
 * Ce qui a changé entre deux états d'une même partie : l'or, les PX, le temps qui passe, les objets du sac et les jauges. Un
 * état identique ne donne rien. Au plus cinq badges ; les objets en trop se regroupent (« +3 objets »).
 */
export function badgesEtat(avant: EtatMonde, apres: EtatMonde, noms: NomsBadge): BadgeEtat[] {
  const res: BadgeEtat[] = [];

  const po = Math.round((apres.pieces - avant.pieces) * 100) / 100;
  if (po !== 0) res.push({ cle: 'po', texte: `${signe(po)}${nombre(Math.abs(po))} po`, genre: po > 0 ? 'gain' : 'perte', details: `${po > 0 ? 'Gagné' : 'Dépensé'} : ${nombre(Math.abs(po))} po` });

  const px = apres.xp - avant.xp;
  if (px !== 0) res.push({ cle: 'px', texte: `${signe(px)}${nombre(Math.abs(px))} PX`, genre: px > 0 ? 'gain' : 'perte', details: `${nombre(Math.abs(px))} points d’expérience` });

  const heures = horloge(apres) - horloge(avant);
  if (heures > 0) res.push({ cle: 'temps', texte: `+${heures} h`, genre: 'temps', details: `${heures} heure${heures > 1 ? 's' : ''} passée${heures > 1 ? 's' : ''}` });

  for (const [id, valeur] of Object.entries(apres.jauges)) {
    const d = valeur - (avant.jauges[id] ?? valeur);
    if (d !== 0) res.push({ cle: `jauge:${id}`, texte: `${noms.jauge(id)} ${signe(d)}${nombre(Math.abs(d))}`, genre: 'jauge', details: `${noms.jauge(id)} : ${nombre(avant.jauges[id] ?? valeur)} → ${nombre(valeur)}` });
  }

  const objets: { texte: string; genre: 'gain' | 'perte'; details: string }[] = [];
  for (const id of new Set([...Object.keys(avant.inventaire), ...Object.keys(apres.inventaire)])) {
    const d = (apres.inventaire[id] ?? 0) - (avant.inventaire[id] ?? 0);
    if (d !== 0) objets.push({ texte: `${signe(d)}${nombre(Math.abs(d))} ${noms.objet(id)}`, genre: d > 0 ? 'gain' : 'perte', details: `${d > 0 ? 'Dans le sac' : 'Sorti du sac'} : ${nombre(Math.abs(d))} × ${noms.objet(id)}` });
  }
  const place = Math.max(0, MAX_BADGES - res.length);
  if (objets.length <= place) objets.forEach((o, i) => res.push({ cle: `objet:${i}:${o.texte}`, ...o }));
  else {
    // Trop d'objets d'un coup : un badge par sens (gain, perte), au nombre d'objets différents.
    for (const genre of ['gain', 'perte'] as const) {
      const groupe = objets.filter((o) => o.genre === genre);
      if (groupe.length === 1) res.push({ cle: `objet:${genre}`, ...groupe[0]! });
      else if (groupe.length > 1) res.push({ cle: `objet:${genre}`, texte: `${genre === 'gain' ? '+' : '−'}${groupe.length} objets`, genre, details: groupe.map((o) => o.details).join(' ; ') });
    }
  }
  return res.slice(0, MAX_BADGES);
}
