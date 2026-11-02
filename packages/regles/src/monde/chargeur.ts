// Chargement d'un monde depuis son dossier (Node : outils, tests, serveur). Le client web importe les JSON avec Vite.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ZodType } from 'zod';
import { Enigme, EvenementMonde, Faction, Fait, Fin, Jauge, Lieu, Monde, Objet, Piege, Pnj, Quete, RencontreMonde, TableButin, Tresor, type DonneesMonde } from './schemas';

export const RACINE_MONDES = join(import.meta.dirname, '../../../mondes');

export interface ErreurChargement {
  fichier: string;
  message: string;
}

/** Lit tous les .json d'un sous-dossier (un tableau ou un objet par fichier) et signale ce qui ne respecte pas le schéma. */
function lire<T extends { id: string }>(dossier: string, nom: string, schema: ZodType<T, any, any>, erreurs: ErreurChargement[]): Map<string, T> {
  const index = new Map<string, T>();
  const chemin = join(dossier, nom);
  if (!existsSync(chemin)) return index;
  for (const f of readdirSync(chemin).filter((x) => x.endsWith('.json')).sort()) {
    const fichier = `${nom}/${f}`;
    let brut: unknown;
    try {
      brut = JSON.parse(readFileSync(join(chemin, f), 'utf8'));
    } catch (e) {
      erreurs.push({ fichier, message: `JSON illisible : ${(e as Error).message}` });
      continue;
    }
    for (const [i, element] of (Array.isArray(brut) ? brut : [brut]).entries()) {
      const r = schema.safeParse(element);
      if (!r.success) {
        const issue = r.error.issues[0];
        const id = (element as { id?: string })?.id ?? `#${i}`;
        erreurs.push({ fichier, message: `« ${id} » : ${issue?.path.join('.') || 'racine'} — ${issue?.message}` });
        continue;
      }
      if (index.has(r.data.id)) erreurs.push({ fichier, message: `identifiant en double : « ${r.data.id} »` });
      else index.set(r.data.id, r.data);
    }
  }
  return index;
}

export type ResultatChargement = { ok: true; monde: DonneesMonde } | { ok: false; erreurs: ErreurChargement[] };

export function chargerMonde(dossier: string): ResultatChargement {
  const erreurs: ErreurChargement[] = [];
  let brut: unknown;
  try {
    brut = JSON.parse(readFileSync(join(dossier, 'monde.json'), 'utf8'));
  } catch (e) {
    return { ok: false, erreurs: [{ fichier: 'monde.json', message: `introuvable ou illisible : ${(e as Error).message}` }] };
  }
  const m = Monde.safeParse(brut);
  if (!m.success) return { ok: false, erreurs: [{ fichier: 'monde.json', message: `${m.error.issues[0]?.path.join('.')} — ${m.error.issues[0]?.message}` }] };
  const dm: DonneesMonde = {
    monde: m.data,
    lieux: lire(dossier, 'lieux', Lieu, erreurs),
    pnj: lire(dossier, 'pnj', Pnj, erreurs),
    objets: lire(dossier, 'objets', Objet, erreurs),
    tresors: lire(dossier, 'tresors', Tresor, erreurs),
    tables: lire(dossier, 'tables', TableButin, erreurs),
    rencontres: lire(dossier, 'rencontres', RencontreMonde, erreurs),
    pieges: lire(dossier, 'pieges', Piege, erreurs),
    enigmes: lire(dossier, 'enigmes', Enigme, erreurs),
    quetes: lire(dossier, 'quetes', Quete, erreurs),
    factions: lire(dossier, 'factions', Faction, erreurs),
    jauges: lire(dossier, 'jauges', Jauge, erreurs),
    evenements: lire(dossier, 'evenements', EvenementMonde, erreurs),
    fins: lire(dossier, 'fins', Fin, erreurs),
    faits: lire(dossier, 'faits', Fait, erreurs),
  };
  return erreurs.length ? { ok: false, erreurs } : { ok: true, monde: dm };
}

/** Dossiers de mondes disponibles dans packages/mondes. */
export function listerMondes(racine = RACINE_MONDES): string[] {
  if (!existsSync(racine)) return [];
  return readdirSync(racine, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(racine, d.name, 'monde.json')))
    .map((d) => d.name)
    .sort();
}
