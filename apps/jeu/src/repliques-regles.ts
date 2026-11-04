// Répliques des compagnons, à la manière de Baldur's Gate : chaque portrait a ses propres phrases, dites dans des
// situations précises (gravement blessé, relevé, allié tombé…). On lit le journal du moteur après chaque commande,
// on y repère les situations, puis on choisit au plus une réplique, sans saturer l'écran ni se répéter.
// Tout est pur : le hasard est passé en paramètre (le tirage du moteur n'est jamais touché).
import { z } from 'zod';
import type { Combattant, EtatCombat, Evenement } from '@crpg/regles';

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
  'rate',
  'rate-encore',
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
  rate: 'Rate une attaque',
  'rate-encore': 'Rate encore (sa précédente attaque avait déjà raté)',
  victoire: 'Victoire',
};

const Lignes = z.array(z.string().min(2)).min(1);
/**
 * `packages/donnees/repliques/cris.json` : les cris de combat, les mêmes pour tous les personnages (de 10 à 15 en tout).
 * L'accord de genre s'écrit `{blessé|blessée}` : chaque voix dit sa forme.
 */
export const FichierCris = z
  .object({ situations: z.object(Object.fromEntries(SITUATIONS.map((s) => [s, Lignes])) as Record<Situation, typeof Lignes>).strict() })
  .strict();
export type FichierCris = z.infer<typeof FichierCris>;

/**
 * `packages/donnees/repliques/voix.json` : une voix par race et par genre (`nain-f`), gardée pour tous les cris :
 * le timbre (une des 30 voix de Gemini) et le personnage à jouer. Tous les portraits d'une race et d'un genre la partagent.
 */
export const FichierVoix = z.record(z.string().regex(/^[a-z]+-[fm]$/), z.object({ timbre: z.string().min(2), jeu: z.string().min(10) }).strict());
export type FichierVoix = z.infer<typeof FichierVoix>;

/** Les cris et les voix, réunis : ce que le jeu charge. */
export interface Repliques {
  situations: FichierCris['situations'];
  voix: FichierVoix;
}

/** La voix d'un portrait (`elfe-f-2` → `elfe-f`), ou rien si ce n'est pas un portrait de la galerie. */
export function voixDuPortrait(portrait: string | undefined): string | undefined {
  const m = /^([a-z]+)-([fm])-\d+$/.exec(portrait ?? '');
  return m ? `${m[1]}-${m[2]}` : undefined;
}

/** Les accords `{masculin|féminin}` d'un cri, pour une voix féminine ou masculine. */
export function accorder(texte: string, feminin: boolean): string {
  return texte.replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (_, m: string, f: string) => (feminin ? f : m));
}

/** Une situation repérée dans le journal. */
export interface Declencheur {
  situation: Situation;
  /** Qui parle ; absent quand n'importe quel héros debout peut parler (allié tombé, victoire, début du combat). */
  locuteur?: string;
  /** Le héros dont il s'agit (l'allié tombé) : il ne se commente pas lui-même. */
  cible?: string;
  /** La réplique se dit une fois que le journal affiche ce nombre d'entrées. */
  apres: number;
}

export interface Replique {
  locuteur: string;
  nom: string;
  texte: string;
  situation: Situation;
  /** La voix qui parle (`nain-f`) et le numéro du cri dans sa situation (à partir de 1) : ils nomment son fichier. */
  voix: string;
  numero: number;
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
        if (ev.type === 'attaque' && ev.details?.resultat === 'rate' && heros(ev.acteur)) {
          // « Encore raté » quand la précédente attaque du même héros, plus tôt dans le combat, avait déjà raté.
          let precedente: Evenement | undefined;
          for (let k = apres - 2; k >= 0 && !precedente; k--) {
            const e = etat.journal[k]!;
            if (e.type === 'attaque' && e.acteur === ev.acteur) precedente = e;
          }
          trouves.push({ situation: precedente?.details?.resultat === 'rate' ? 'rate-encore' : 'rate', locuteur: ev.acteur, apres });
        }
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
  'rate-encore',
  'blesse',
  'soigne',
  'rate',
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
  // Les ratés sont fréquents : on n'en commente qu'une partie, davantage quand ils s'enchaînent.
  rate: 0.25,
  'rate-encore': 0.6,
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
  /** Cris déjà dits, par personnage et situation (`id:situation`, indices) : pas de redite avant d'avoir tout dit. */
  dites: Map<string, number[]>;
}

export function nouvelleMemoire(): Memoire {
  return { parPersonnage: new Map(), dites: new Map() };
}

/** Le héros est une voix féminine (d'après son portrait, `elfe-f-2`). */
export function estFeminin(c: Combattant | undefined): boolean {
  return /-f-\d+$/.test(c?.portrait ?? '');
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
function tirerPhrase(lignes: string[], cle: string, memoire: Memoire, hasard: () => number): { indice: number; texte: string } {
  let dites = memoire.dites.get(cle) ?? [];
  let libres = lignes.map((_, i) => i).filter((i) => !dites.includes(i));
  if (!libres.length) {
    const derniere = dites[dites.length - 1];
    dites = [];
    libres = lignes.map((_, i) => i).filter((i) => i !== derniere || lignes.length === 1);
  }
  const choix = libres[Math.floor(hasard() * libres.length)]!;
  memoire.dites.set(cle, [...dites, choix]);
  return { indice: choix, texte: lignes[choix]! };
}

/**
 * Au plus une réplique pour ces situations : la plus importante qui trouve quelqu'un pour parler, qui a une voix,
 * qui n'est pas tenu au silence et dont le tirage réussit. Met la mémoire à jour.
 */
export function choisirReplique(trouves: Declencheur[], etat: EtatCombat, repliques: Repliques, memoire: Memoire, hasard: () => number): Replique | undefined {
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
        (voixDuPortrait(c.portrait) ?? '') in repliques.voix &&
        (urgente || round - (memoire.parPersonnage.get(c.id) ?? -Infinity) >= SILENCE_PERSONNEL),
    );
    const c = candidats[0];
    if (!c) continue;
    if (hasard() >= CHANCES[d.situation]) continue;
    const phrase = tirerPhrase(repliques.situations[d.situation], `${c.id}:${d.situation}`, memoire, hasard);
    memoire.parPersonnage.set(c.id, round);
    memoire.groupe = round;
    return {
      locuteur: c.id,
      nom: c.nom,
      texte: accorder(phrase.texte, estFeminin(c)),
      situation: d.situation,
      voix: voixDuPortrait(c.portrait)!,
      numero: phrase.indice + 1,
      apres: d.apres,
    };
  }
  return undefined;
}
