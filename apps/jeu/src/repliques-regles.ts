// Répliques des compagnons, à la manière de Baldur's Gate : chaque portrait a ses propres phrases, dites dans des
// situations précises (gravement blessé, relevé, allié tombé…). On lit le journal du moteur après chaque commande,
// on y repère les situations, puis on choisit au plus une réplique, sans saturer l'écran ni se répéter.
// Tout est pur : le hasard est passé en paramètre (le tirage du moteur n'est jamais touché).
import { z } from 'zod';
import type { Combattant, EtatCombat } from '@crpg/regles';

export const SITUATIONS = [
  'debut-combat',
  'blesse',
  'grievement-blesse',
  'releve',
  'soigne',
  'critique-donne',
  'critique-recu',
  'ennemi-abattu',
  'allie-tombe',
  'victoire',
] as const;
export type Situation = (typeof SITUATIONS)[number];

export const LIBELLES_SITUATIONS: Record<Situation, string> = {
  'debut-combat': 'Début du combat',
  blesse: 'Blessé (moitié des PV ou moins)',
  'grievement-blesse': 'Gravement blessé (un quart des PV ou moins)',
  releve: 'Relevé après être tombé à 0 PV',
  soigne: 'Soigné par un allié',
  'critique-donne': 'Porte un coup critique',
  'critique-recu': 'Reçoit un coup critique',
  'ennemi-abattu': 'Abat un ennemi',
  'allie-tombe': 'Un allié tombe',
  victoire: 'Victoire',
};

const Lignes = z.array(z.string().min(2)).min(1);
/** Un fichier `packages/donnees/repliques/<portrait>.json`. */
export const FichierRepliques = z
  .object({
    portrait: z.string().regex(/^[a-z]+-[fm]-\d+$/),
    /** Le caractère que portent les phrases (tiré de la description du portrait) : sert à les écrire, et au conteur. */
    caractere: z.string().min(3),
    situations: z.object(Object.fromEntries(SITUATIONS.map((s) => [s, Lignes])) as Record<Situation, typeof Lignes>).strict(),
  })
  .strict();
export type FichierRepliques = z.infer<typeof FichierRepliques>;

/** Une situation repérée dans le journal. */
export interface Declencheur {
  situation: Situation;
  /** Qui parle ; absent quand n'importe quel héros debout peut parler (allié tombé, victoire, début du combat). */
  locuteur?: string;
  /** De qui on parle (l'allié tombé) : son nom et son genre remplissent la phrase. */
  cible?: string;
  /** La réplique se dit une fois que le journal affiche ce nombre d'entrées. */
  apres: number;
}

export interface Replique {
  locuteur: string;
  nom: string;
  texte: string;
  situation: Situation;
  apres: number;
}

/** Ce dont le repérage a besoin de l'état d'avant la commande (l'instantané des animations convient). */
export interface Avant {
  journal: number;
  surcharges: ReadonlyMap<string, { pv: number; mort: boolean }>;
}

const SEUIL_BLESSE = 0.5;
const SEUIL_GRAVE = 0.25;

/** Le héros peut parler : debout, conscient, encore là. */
export function peutParler(c: Combattant): boolean {
  return c.camp === 'heros' && !c.mort && !c.enFuite && c.pv > 0 && !c.etats.some((e) => e.etat === 'inconscient');
}

/** Les situations nées d'une commande : les nouvelles entrées du journal, comparées à l'état d'avant. */
export function declencheurs(etat: EtatCombat, avant: Avant): Declencheur[] {
  const trouves: Declencheur[] = [];
  const par = new Map(etat.combattants.map((c) => [c.id, c]));
  const heros = (id: string | undefined) => (id ? par.get(id)?.camp === 'heros' : false);
  const aTerre = new Set(
    etat.combattants.filter((c) => c.camp === 'heros' && !c.mort && (avant.surcharges.get(c.id)?.pv ?? c.pv) <= 0).map((c) => c.id),
  );
  const releves = new Set<string>();
  const derniersDegats = new Map<string, number>();
  let dernierActeur: string | undefined;

  etat.journal.slice(avant.journal).forEach((ev, i) => {
    const apres = avant.journal + i + 1;
    switch (ev.type) {
      case 'attaque':
      case 'sort':
        if (ev.acteur) dernierActeur = ev.acteur;
        if (ev.type === 'attaque' && ev.details?.resultat === 'critique') {
          if (heros(ev.acteur)) trouves.push({ situation: 'critique-donne', locuteur: ev.acteur, apres });
          if (heros(ev.cible)) trouves.push({ situation: 'critique-recu', locuteur: ev.cible, apres });
        }
        break;
      case 'degats':
        if (ev.cible) derniersDegats.set(ev.cible, apres);
        break;
      case 'mort':
        if (!ev.cible) break;
        if (heros(ev.cible)) {
          aTerre.add(ev.cible);
          releves.delete(ev.cible);
          trouves.push({ situation: 'allie-tombe', cible: ev.cible, apres });
        } else if (heros(dernierActeur)) trouves.push({ situation: 'ennemi-abattu', locuteur: dernierActeur, apres });
        break;
      case 'soins':
        if (!ev.cible || !heros(ev.cible)) break;
        if (aTerre.has(ev.cible)) {
          aTerre.delete(ev.cible);
          releves.add(ev.cible);
          trouves.push({ situation: 'releve', locuteur: ev.cible, apres });
        } else if (!releves.has(ev.cible) && (ev.valeur ?? 0) > 0 && ev.acteur && ev.acteur !== ev.cible) {
          trouves.push({ situation: 'soigne', locuteur: ev.cible, apres });
        }
        break;
      case 'fin':
        if (etat.vainqueur === 'heros') trouves.push({ situation: 'victoire', apres });
        break;
      default:
        break;
    }
  });

  // Les seuils de blessure : franchis par cette commande, et toujours debout à la fin.
  for (const c of etat.combattants) {
    if (c.camp !== 'heros' || c.pv <= 0 || c.pvMax <= 0) continue;
    const pvAvant = avant.surcharges.get(c.id)?.pv ?? c.pv;
    if (pvAvant <= 0) continue;
    const r0 = pvAvant / c.pvMax;
    const r1 = c.pv / c.pvMax;
    const apres = derniersDegats.get(c.id) ?? etat.journal.length;
    if (r1 <= SEUIL_GRAVE && r0 > SEUIL_GRAVE) trouves.push({ situation: 'grievement-blesse', locuteur: c.id, apres });
    else if (r1 <= SEUIL_BLESSE && r0 > SEUIL_BLESSE) trouves.push({ situation: 'blesse', locuteur: c.id, apres });
  }
  return trouves;
}

/** Plus haut d'abord : quand deux choses arrivent ensemble, on entend la plus importante. */
const PRIORITE: Situation[] = [
  'allie-tombe',
  'grievement-blesse',
  'releve',
  'victoire',
  'debut-combat',
  'critique-recu',
  'critique-donne',
  'ennemi-abattu',
  'blesse',
  'soigne',
];

/** Chance qu'une situation soit commentée : les courantes ne le sont pas à chaque fois. */
export const CHANCES: Record<Situation, number> = {
  'debut-combat': 1,
  'allie-tombe': 0.9,
  'grievement-blesse': 0.9,
  releve: 0.9,
  victoire: 1,
  'critique-recu': 0.6,
  'critique-donne': 0.5,
  'ennemi-abattu': 0.35,
  blesse: 0.5,
  soigne: 0.4,
};

/** Les situations graves ou rares passent outre les silences imposés. */
const URGENTES = new Set<Situation>(['allie-tombe', 'grievement-blesse', 'releve', 'victoire', 'debut-combat']);
/** Rounds de silence d'un même personnage après une réplique ordinaire. */
export const SILENCE_PERSONNEL = 2;
/** Rounds de silence du groupe après une réplique ordinaire (une par round au plus). */
export const SILENCE_GROUPE = 1;

export interface Memoire {
  /** Round de la dernière réplique de chacun. */
  parPersonnage: Map<string, number>;
  /** Round de la dernière réplique du groupe. */
  groupe?: number;
  /** Phrases déjà dites, par `portrait:situation` (indices) : pas de redite avant d'avoir tout dit. */
  dites: Map<string, number[]>;
}

export function nouvelleMemoire(): Memoire {
  return { parPersonnage: new Map(), dites: new Map() };
}

/** Genre d'un héros d'après son portrait (`elfe-f-2`). */
export function estFeminin(c: Combattant | undefined): boolean {
  return /-f-\d+$/.test(c?.portrait ?? '');
}

/** Remplit `{nom}` et les accords `{masculin|féminin}` d'après la personne dont on parle. */
export function remplir(texte: string, cible: Combattant | undefined): string {
  const f = estFeminin(cible);
  return texte.replace(/\{nom\}/g, cible?.nom ?? '').replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (_, m: string, fe: string) => (f ? fe : m));
}

function melanger<T>(liste: T[], hasard: () => number): T[] {
  const l = [...liste];
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1));
    [l[i], l[j]] = [l[j]!, l[i]!];
  }
  return l;
}

/** Tire une phrase pas encore dite (et jamais celle d'avant quand on recommence le tour des phrases). */
function tirerPhrase(lignes: string[], cle: string, memoire: Memoire, hasard: () => number): string {
  let dites = memoire.dites.get(cle) ?? [];
  let libres = lignes.map((_, i) => i).filter((i) => !dites.includes(i));
  if (!libres.length) {
    const derniere = dites[dites.length - 1];
    dites = [];
    libres = lignes.map((_, i) => i).filter((i) => i !== derniere || lignes.length === 1);
  }
  const choix = libres[Math.floor(hasard() * libres.length)]!;
  memoire.dites.set(cle, [...dites, choix]);
  return lignes[choix]!;
}

/**
 * Au plus une réplique pour ces situations : la plus importante qui trouve quelqu'un pour parler, qui a des phrases,
 * qui n'est pas tenu au silence et dont le tirage réussit. Met la mémoire à jour.
 */
export function choisirReplique(
  trouves: Declencheur[],
  etat: EtatCombat,
  repliques: ReadonlyMap<string, FichierRepliques>,
  memoire: Memoire,
  hasard: () => number,
): Replique | undefined {
  const par = new Map(etat.combattants.map((c) => [c.id, c]));
  const round = etat.round;
  const tries = [...trouves].sort((a, b) => PRIORITE.indexOf(a.situation) - PRIORITE.indexOf(b.situation));
  for (const d of tries) {
    const urgente = URGENTES.has(d.situation);
    if (!urgente && memoire.groupe !== undefined && round - memoire.groupe < SILENCE_GROUPE) continue;
    const candidats = (d.locuteur ? [par.get(d.locuteur)] : melanger(etat.combattants, hasard)).filter(
      (c): c is Combattant =>
        !!c &&
        peutParler(c) &&
        c.id !== d.cible &&
        !!c.portrait &&
        repliques.has(c.portrait) &&
        (urgente || round - (memoire.parPersonnage.get(c.id) ?? -Infinity) >= SILENCE_PERSONNEL),
    );
    const c = candidats[0];
    if (!c) continue;
    if (hasard() >= CHANCES[d.situation]) continue;
    const fichier = repliques.get(c.portrait!)!;
    const phrase = tirerPhrase(fichier.situations[d.situation], `${c.portrait}:${d.situation}`, memoire, hasard);
    memoire.parPersonnage.set(c.id, round);
    memoire.groupe = round;
    return { locuteur: c.id, nom: c.nom, texte: remplir(phrase, d.cible ? par.get(d.cible) : undefined), situation: d.situation, apres: d.apres };
  }
  return undefined;
}
