// Les jeux d'essai du moteur : les données (JSON et textes, sans images ni voix) de quatre histoires retirées du jeu le 11/11/2026
// (Le Val des Cendres, Port-Sillage, La Citadelle des Marées, Ombresang). Ce ne sont plus des histoires : elles ne sont ni dans
// `packages/mondes/`, ni dans le menu du jeu, ni livrées. Les tests du moteur s'en servent comme de mondes complets et variés
// (dilemmes, escortes, énigmes, pièges, contrats, conteur…). Les versions complètes sont dans l'historique git (avant le 11/11/2026).
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { RACINE_MONDES } from '../src/monde/chargeur';

export const MONDES_ESSAI = join(import.meta.dirname, 'fixtures', 'mondes');

/** Les ids des jeux d'essai. */
export const IDS_MONDES_ESSAI: string[] = existsSync(MONDES_ESSAI) ? readdirSync(MONDES_ESSAI).filter((n) => existsSync(join(MONDES_ESSAI, n, 'monde.json'))) : [];

/** Le dossier d'un monde : un jeu d'essai s'il porte ce nom, sinon une histoire livrée (`packages/mondes/`). */
export const dossierMonde = (id: string): string => (IDS_MONDES_ESSAI.includes(id) ? join(MONDES_ESSAI, id) : join(RACINE_MONDES, id));
