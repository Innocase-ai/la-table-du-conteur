// Assemblage d'un monde à partir de ses fichiers JSON déjà lus : commun au chargeur Node (outils, tests) et au
// navigateur (le client importe les fichiers avec Vite). Chaque entité est validée par son schéma.
import type { ZodType } from 'zod';
import { Enigme, EvenementMonde, Faction, Fait, Fin, Jauge, Lieu, Monde, Objet, Piege, Pnj, Quete, RencontreMonde, TableButin, Tresor, type DonneesMonde } from './schemas';

export interface ErreurChargement {
  fichier: string;
  message: string;
}

export type ResultatChargement = { ok: true; monde: DonneesMonde } | { ok: false; erreurs: ErreurChargement[] };

/** Un fichier d'un monde : son chemin relatif au dossier du monde (`lieux/z1.json`) et son contenu JSON. */
export interface FichierMonde {
  chemin: string;
  contenu: unknown;
}

export const DOSSIERS_MONDE = ['lieux', 'pnj', 'objets', 'tresors', 'tables', 'rencontres', 'pieges', 'enigmes', 'quetes', 'factions', 'jauges', 'evenements', 'fins', 'faits'] as const;

function lire<T extends { id: string }>(fichiers: FichierMonde[], nom: string, schema: ZodType<T, any, any>, erreurs: ErreurChargement[]): Map<string, T> {
  const index = new Map<string, T>();
  const duDossier = fichiers.filter((f) => f.chemin.startsWith(`${nom}/`) && f.chemin.endsWith('.json')).sort((a, b) => a.chemin.localeCompare(b.chemin));
  for (const { chemin: fichier, contenu } of duDossier) {
    for (const [i, element] of (Array.isArray(contenu) ? contenu : [contenu]).entries()) {
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

/** Les dossiers que le format de base ne connaît pas (`scenes/`…) : laissés aux modules, sans validation ici. */
function extensions(fichiers: FichierMonde[]): Record<string, unknown[]> {
  const res: Record<string, unknown[]> = {};
  for (const f of [...fichiers].sort((a, b) => a.chemin.localeCompare(b.chemin))) {
    const dossier = f.chemin.split('/')[0]!;
    if (!f.chemin.includes('/') || (DOSSIERS_MONDE as readonly string[]).includes(dossier) || dossier === 'images') continue;
    (res[dossier] ??= []).push(...(Array.isArray(f.contenu) ? f.contenu : [f.contenu]));
  }
  return res;
}

/** Assemble un monde : `monde.json` et les fichiers de ses sous-dossiers. */
export function assemblerMonde(mondeBrut: unknown, fichiers: FichierMonde[], erreursLecture: ErreurChargement[] = []): ResultatChargement {
  const m = Monde.safeParse(mondeBrut);
  if (!m.success) return { ok: false, erreurs: [{ fichier: 'monde.json', message: `${m.error.issues[0]?.path.join('.')} — ${m.error.issues[0]?.message}` }] };
  const erreurs = [...erreursLecture];
  const dm: DonneesMonde = {
    monde: m.data,
    lieux: lire(fichiers, 'lieux', Lieu, erreurs),
    pnj: lire(fichiers, 'pnj', Pnj, erreurs),
    objets: lire(fichiers, 'objets', Objet, erreurs),
    tresors: lire(fichiers, 'tresors', Tresor, erreurs),
    tables: lire(fichiers, 'tables', TableButin, erreurs),
    rencontres: lire(fichiers, 'rencontres', RencontreMonde, erreurs),
    pieges: lire(fichiers, 'pieges', Piege, erreurs),
    enigmes: lire(fichiers, 'enigmes', Enigme, erreurs),
    quetes: lire(fichiers, 'quetes', Quete, erreurs),
    factions: lire(fichiers, 'factions', Faction, erreurs),
    jauges: lire(fichiers, 'jauges', Jauge, erreurs),
    evenements: lire(fichiers, 'evenements', EvenementMonde, erreurs),
    fins: lire(fichiers, 'fins', Fin, erreurs),
    faits: lire(fichiers, 'faits', Fait, erreurs),
    extensions: extensions(fichiers),
  };
  return erreurs.length ? { ok: false, erreurs } : { ok: true, monde: dm };
}
