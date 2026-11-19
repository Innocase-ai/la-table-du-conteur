// Les échos de campagne (F5 de docs/PRD-SAGA.md, pas (c)) : ce qu'un épisode laisse au carnet du groupe, ce que les épisodes suivants en lisent,
// et le contrôle entre épisodes. Un écho est un identifiant (`epi1-village-sauve`) que `monde.json` déclare dans `campagne.emet` avec la condition
// qui le fait naître à la fin de l'épisode et une phrase pour le carnet ; un épisode le lit avec la condition `{ "campagne": "epi1-village-sauve" }`.
// Tout est additif (P1, P2) : un monde sans `campagne` ni condition `campagne` n'est pas concerné.
import type { Donnees } from '../donnees';
import { evaluerCondition, type EtatMonde } from './etat';
import type { DonneesMonde } from './schemas';

/** Un écho déclaré par un épisode. */
export interface Echo {
  id: string;
  monde: string;
  phrase: string;
}

/** Une lecture d'écho : la condition `{ campagne }` d'une entité d'un épisode. */
export interface LectureEcho {
  id: string;
  monde: string;
  /** Où : « quetes:q-principale », « pnj:marta », « monde.json »… */
  ou: string;
}

export interface RegistreCampagne {
  emis: Echo[];
  lus: LectureEcho[];
}

const COLLECTIONS = ['lieux', 'pnj', 'objets', 'tresors', 'tables', 'rencontres', 'pieges', 'enigmes', 'quetes', 'factions', 'jauges', 'evenements', 'fins', 'faits'] as const;

function* lectures(x: unknown, ou: string): Generator<{ id: string; ou: string }> {
  if (Array.isArray(x)) {
    for (const v of x) yield* lectures(v, ou);
  } else if (x && typeof x === 'object') {
    const o = x as Record<string, unknown>;
    const cles = Object.keys(o);
    // Une condition `campagne` est un objet à une seule clé dont la valeur est l'identifiant de l'écho.
    if (cles.length === 1 && cles[0] === 'campagne' && typeof o['campagne'] === 'string') yield { id: o['campagne'], ou };
    else for (const v of Object.values(o)) yield* lectures(v, ou);
  }
}

/** Tous les échos qu'un épisode lit, avec l'entité qui les lit (conditions de toutes les données du monde, modules compris). */
export function echosLus(dm: DonneesMonde): LectureEcho[] {
  const res: LectureEcho[] = [];
  const ajouter = (x: unknown, ou: string) => {
    for (const l of lectures(x, ou)) res.push({ id: l.id, monde: dm.monde.id, ou: l.ou });
  };
  ajouter(dm.monde, 'monde.json');
  for (const nom of COLLECTIONS) for (const [id, e] of (dm[nom] as Map<string, unknown>).entries()) ajouter(e, `${nom}:${id}`);
  for (const [dossier, elements] of Object.entries(dm.extensions ?? {})) elements.forEach((e, i) => ajouter(e, `${dossier}[${(e as { id?: string })?.id ?? i}]`));
  return res;
}

/** Les échos que cet épisode déclare. */
export const echosEmis = (dm: DonneesMonde): Echo[] => (dm.monde.campagne?.emet ?? []).map((e) => ({ id: e.id, monde: dm.monde.id, phrase: e.phrase }));

/** Les échos qui naissent de l'état d'un épisode (à la fin, ou à tout moment) : ceux de `campagne.emet` dont la condition est vraie. */
export function echosDeFin(dm: DonneesMonde, etat: EtatMonde): string[] {
  return (dm.monde.campagne?.emet ?? []).filter((e) => evaluerCondition(e.quand, etat)).map((e) => e.id);
}

/** Le registre des échos émis et lus par un ensemble d'épisodes. */
export function registreDeCampagne(mondes: readonly DonneesMonde[]): RegistreCampagne {
  return { emis: mondes.flatMap(echosEmis), lus: mondes.flatMap(echosLus) };
}

/**
 * Le contrôle entre épisodes : une lecture d'un écho qu'aucun épisode n'émet est une ERREUR (faute de frappe, épisode retiré : la condition ne sera
 * jamais vraie) ; un écho émis par deux épisodes est une erreur (le carnet ne saurait plus d'où il vient) ; un écho émis et jamais lu, ou lu
 * seulement par l'épisode qui l'émet (le carnet ne change pas en cours de partie : il ne sera jamais vrai), sont des avis.
 */
export function validerCampagne(mondes: readonly DonneesMonde[]): { erreurs: string[]; avis: string[] } {
  const { emis, lus } = registreDeCampagne(mondes);
  const erreurs: string[] = [];
  const avis: string[] = [];
  const parId = new Map<string, Echo[]>();
  for (const e of emis) parId.set(e.id, [...(parId.get(e.id) ?? []), e]);
  for (const [id, es] of parId) {
    const lieux = [...new Set(es.map((e) => e.monde))];
    if (es.length > 1) erreurs.push(`Écho « ${id} » émis ${es.length} fois (${lieux.join(', ')}) : un identifiant d'écho ne s'émet qu'une fois, dans un seul épisode.`);
  }
  for (const l of lus) {
    const emetteurs = parId.get(l.id);
    if (!emetteurs) erreurs.push(`Épisode « ${l.monde} » (${l.ou}) : l'écho « ${l.id} » n'est émis par aucun épisode (la condition ne sera jamais vraie).`);
    else if (emetteurs.every((e) => e.monde === l.monde)) avis.push(`Épisode « ${l.monde} » (${l.ou}) : l'écho « ${l.id} » n'est émis que par cet épisode, et le carnet ne change pas en cours de partie : la condition ne sera jamais vraie.`);
  }
  const luIds = new Set(lus.map((l) => l.id));
  for (const [id, es] of parId) if (!luIds.has(id)) avis.push(`Écho « ${id} » (émis par « ${es[0]!.monde} ») : aucun épisode ne le lit.`);
  return { erreurs, avis };
}

/** Les avis d'un épisode seul (validateur) : trop d'échos, quête principale qui lit le carnet, identifiants d'écho en double. */
export function avisCampagneDeLEpisode(dm: DonneesMonde, srd: Donnees): { erreurs: string[]; avis: string[] } {
  void srd;
  const erreurs: string[] = [];
  const avis: string[] = [];
  const emet = dm.monde.campagne?.emet ?? [];
  const vus = new Set<string>();
  for (const e of emet) {
    if (vus.has(e.id)) erreurs.push(`Campagne : l'écho « ${e.id} » est déclaré deux fois dans \`campagne.emet\`.`);
    vus.add(e.id);
  }
  if (dm.monde.format === 'episode' && emet.length > 2) avis.push(`Campagne : ${emet.length} échos émis (visé : 1 à 2 par épisode ; PRD-SAGA F5).`);
  // Un écho est un bonus : la quête principale se joue sans carnet.
  const principale = [...dm.quetes.values()].filter((q) => q.type === 'principale');
  for (const q of principale) for (const l of lectures(q, `quetes:${q.id}`)) avis.push(`Campagne : la quête principale « ${q.id} » lit l'écho « ${l.id} » (un écho est toujours un bonus : la quête principale se joue sans carnet).`);
  return { erreurs, avis };
}
