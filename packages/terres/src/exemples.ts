// Définitions d'exemple, tirées de lieux réels (La Marche d'Ombrefiel, zone du Carrefour d'Aldric : positions et durées écrites
// dans packages/mondes/marche-d-ombrefiel/lieux). Elles servent aux tests, à la démo et de modèle pour l'auteur.
import type { DefTerres, EntreeTable } from './types';

export const CARREFOUR_D_ALDRIC: DefTerres = {
  id: 'ald-carrefour-d-aldric',
  graine: 21,
  largeur: 120,
  hauteur: 80,
  biome: 'prairie',
  ancres: [
    { id: 'ald-auberge-de-bregor', nom: 'Auberge de Brégor', position: { x: 57, y: 30 } },
    { id: 'ald-vieux-pont', nom: 'Vieux pont', position: { x: 52, y: 84 } },
    { id: 'ald-moulin-d-eldren', nom: 'Moulin d’Eldren', position: { x: 80, y: 15 }, rayonRepere: 9 },
    { id: 'ald-combe-de-l-ours', nom: 'Combe de l’Ours', position: { x: 23, y: 16 } },
    { id: 'ald-carriere-d-argile', nom: 'Carrière d’argile', position: { x: 18, y: 65 } },
    { id: 'ald-tertre-des-sept-lances', nom: 'Tertre des Sept Lances', position: { x: 84, y: 66 }, rayonRepere: 11 },
  ],
  liens: [
    { de: 'ald-vieux-pont', vers: 'ald-auberge-de-bregor', heures: 1 },
    { de: 'ald-vieux-pont', vers: 'ald-carriere-d-argile', heures: 1 },
    { de: 'ald-moulin-d-eldren', vers: 'ald-auberge-de-bregor', heures: 1.5 },
    { de: 'ald-combe-de-l-ours', vers: 'ald-auberge-de-bregor', heures: 1.5 },
    { de: 'ald-carriere-d-argile', vers: 'ald-auberge-de-bregor', heures: 2 },
    { de: 'ald-tertre-des-sept-lances', vers: 'ald-auberge-de-bregor', heures: 2 },
  ],
};

/** Une table de rencontres d'exemple (le moteur de jeu y branche ses propres compositions). */
export const TABLE_EXEMPLE: EntreeTable[] = [
  { id: 'loups', poids: 3, terrains: ['foret', 'colline'], genre: 'combat', tags: ['bete'] },
  { id: 'bandits', poids: 3, terrains: ['plaine', 'route', 'gue'], genre: 'combat', tags: ['humain'] },
  { id: 'rodeurs-nuit', poids: 2, moments: ['nuit', 'crepuscule'], genre: 'combat', tags: ['mort-vivant'] },
  { id: 'gobelins', poids: 2, terrains: ['colline', 'montagne', 'foret'], niveauMin: 2, genre: 'combat', tags: ['gobelinoide'] },
  { id: 'colporteur', poids: 3, terrains: ['route', 'plaine'], moments: ['jour', 'aube', 'crepuscule'], genre: 'social' },
  { id: 'voyageur-egare', poids: 2, terrains: ['foret', 'marais', 'colline'], genre: 'social' },
  { id: 'chariot-embourbe', poids: 2, terrains: ['marais', 'gue', 'route'], genre: 'obstacle' },
  { id: 'eboulis', poids: 1, terrains: ['montagne', 'colline'], genre: 'obstacle' },
];
