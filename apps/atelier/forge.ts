// La Forge d'Histoires servie par l'atelier (apps/atelier/public/forge/index.html) : le bouton « Créer le monde » envoie la
// conception à `POST /api/atelier/forge-importer`, qui appelle le convertisseur de `outils/monde/importer-forge.ts`
// (même code que `pnpm monde importer-forge`). Fonction synchrone, sans dépendance à Vite, testée dans forge.test.ts.
// Imports relatifs (et non `@crpg/regles`) : ce fichier est chargé par la configuration de Vite.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ecrireMondeForge, ErreurForge, messagePourClaude, type ResultatImport } from '../../outils/monde/importer-forge';
import { idMondeValide } from './chemins';

export const TAILLE_MAX_FORGE = 2_000_000;

export type ResultatForge =
  | { ok: true; id: string; dossier: string; rapport: string; avertissements: string[]; aEcrire: number; stats: Record<string, number>; brief: string; message: string }
  | { ok: false; statut: 400 | 409 | 413 | 500; erreur: string };

export interface DepotsForge {
  /** `packages/donnees/srd` : les identifiants des monstres et des armes du SRD. */
  srd: string;
  /** `.claude/skills/creer-monde/assets` et `.claude/skills/decrire-lieux/assets/ATLAS.modele.md`. */
  modeles: { dossier: string; atlas: string };
}

/** Les emplacements par défaut, à partir de la racine des mondes (`packages/mondes`). */
export const depotsParDefaut = (racineMondes: string): DepotsForge => {
  const projet = resolve(racineMondes, '../..');
  return { srd: join(projet, 'packages/donnees/srd'), modeles: { dossier: join(projet, '.claude/skills/creer-monde/assets'), atlas: join(projet, '.claude/skills/decrire-lieux/assets/ATLAS.modele.md') } };
};

/** Les identifiants d'un dossier du SRD : un fichier par élément (monstres) ou un tableau (armes). */
function idsDuDossier(dossier: string): string[] {
  if (!existsSync(dossier)) return [];
  const ids: string[] = [];
  for (const f of readdirSync(dossier).filter((x) => x.endsWith('.json'))) {
    const contenu = JSON.parse(readFileSync(join(dossier, f), 'utf8')) as unknown;
    for (const e of Array.isArray(contenu) ? contenu : [contenu]) if (e && typeof (e as { id?: unknown }).id === 'string') ids.push((e as { id: string }).id);
  }
  return ids;
}

const stats = (r: ResultatImport): Record<string, number> => Object.fromEntries(Object.entries(r.dossiers).map(([d, f]) => [d, f.length]));

/** Crée le monde brouillon `id` dans `racineMondes` à partir d'une conception de la Forge (jamais d'écrasement d'un monde existant). */
export function importerForge(racineMondes: string, demande: { id?: unknown; forge?: unknown; niveaux?: unknown }, depots: DepotsForge = depotsParDefaut(racineMondes)): ResultatForge {
  if (!idMondeValide(demande.id)) return { ok: false, statut: 400, erreur: 'Identifiant de monde invalide : kebab-case ASCII sans accents (ex. marche-d-ombrefiel).' };
  if (!demande.forge || typeof demande.forge !== 'object' || Array.isArray(demande.forge)) return { ok: false, statut: 400, erreur: 'Conception de la Forge manquante.' };
  if (JSON.stringify(demande.forge).length > TAILLE_MAX_FORGE) return { ok: false, statut: 413, erreur: 'Conception trop grande.' };
  const id = demande.id;
  if (existsSync(join(racineMondes, id))) return { ok: false, statut: 409, erreur: `Le monde « ${id} » existe déjà : choisissez un autre identifiant (un import ne remplace jamais un monde).` };
  const n = demande.niveaux as { min?: unknown; max?: unknown } | undefined;
  const niveaux = n && Number.isInteger(n.min) && Number.isInteger(n.max) && (n.min as number) >= 1 && (n.max as number) <= 20 && (n.min as number) <= (n.max as number) ? { min: n.min as number, max: n.max as number } : undefined;
  try {
    const { dossier, resultat, rapport } = ecrireMondeForge(racineMondes, id, 'la Forge', demande.forge, depots.modeles, {
      profils: idsDuDossier(join(depots.srd, 'monstres')),
      armes: idsDuDossier(join(depots.srd, 'armes')),
      ...(niveaux ? { niveaux } : {}),
    });
    return { ok: true, id, dossier, rapport, avertissements: resultat.avertissements, aEcrire: resultat.aEcrire, stats: stats(resultat), brief: `packages/mondes/${id}/BRIEF-ECRITURE.md`, message: messagePourClaude(id) };
  } catch (e) {
    const message = (e as Error).message;
    // Une conception illisible ou vide est une erreur de la demande ; le reste (disque, modèles introuvables) est une panne.
    return { ok: false, statut: e instanceof ErreurForge ? 400 : 500, erreur: message.length > 400 ? `${message.slice(0, 400)}…` : message };
  }
}
