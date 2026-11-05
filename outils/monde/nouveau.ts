// Échafaudage d'un nouveau monde : `pnpm monde nouveau <id> "<Nom>"` (voir .claude/skills/creer-monde).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const DOSSIERS_MONDE = ['lieux', 'pnj', 'objets', 'tresors', 'tables', 'rencontres', 'pieges', 'enigmes', 'quetes', 'factions', 'jauges', 'evenements', 'fins', 'faits'] as const;

export interface Modeles {
  /** Dossier des modèles (assets du skill creer-monde). */
  dossier: string;
}

function remplacer(texte: string, id: string, nom: string): string {
  return texte.replaceAll('{{ID}}', id).replaceAll('{{NOM}}', nom);
}

/** Crée packages/mondes/<id>/ avec un monde en brouillon, la bible à remplir et le guide des zones. */
export function creerSquelette(racineMondes: string, id: string, nom: string, modeles: Modeles): string {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error(`Identifiant invalide « ${id} » : kebab-case ASCII sans accents (ex. val-des-cendres).`);
  if (!nom.trim()) throw new Error('Donne un nom au monde.');
  const dossier = join(racineMondes, id);
  if (existsSync(dossier)) throw new Error(`Le monde « ${id} » existe déjà (${dossier}).`);
  mkdirSync(dossier, { recursive: true });
  for (const d of DOSSIERS_MONDE) {
    mkdirSync(join(dossier, d));
    writeFileSync(join(dossier, d, '.gitkeep'), '');
  }
  // Le dossier des dilemmes (module Dilemmes) : des choix dont chaque option annonce son coût et son gain.
  mkdirSync(join(dossier, 'dilemmes'));
  writeFileSync(join(dossier, 'dilemmes', '.gitkeep'), '');
  const monde = {
    id,
    version: 1,
    statut: 'brouillon',
    nom,
    resume: 'À écrire : le décor, la situation, le conflit central (2 à 3 phrases).',
    accroche: 'À écrire : la phrase qui donne envie de jouer.',
    ton: ['à définir'],
    niveaux: { min: 1, max: 5 },
    depart: { lieu: `${id}-hub`, intro: "À écrire : l'arrivée du groupe, en quelques phrases concrètes." },
    direction: { style: 'À écrire : le style visuel (matières, lumière, ambiance).', palette: ['à définir', 'à définir'], motsCles: [], interdits: [] },
    chapitres: [{ id: 'ch1', nom: 'Chapitre 1', niveaux: { min: 1, max: 5 }, resume: 'À écrire.', lieux: [id], quetes: [] }],
    regles: [],
    auteurs: [],
  };
  writeFileSync(join(dossier, 'monde.json'), JSON.stringify(monde, null, 2) + '\n');
  writeFileSync(join(dossier, 'BIBLE.md'), remplacer(readFileSync(join(modeles.dossier, 'BIBLE.modele.md'), 'utf8'), id, nom));
  writeFileSync(join(dossier, 'GUIDE-ZONE.md'), remplacer(readFileSync(join(modeles.dossier, 'GUIDE-ZONE.modele.md'), 'utf8'), id, nom));
  return dossier;
}

