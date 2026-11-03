// Noms et portraits de la galerie, communs à toutes les campagnes (moteur, pas monde). Les images sont dans
// `src/portraits/<id>.(png|jpg|jpeg|webp)` (générées par `pnpm images galerie`, voir docs/M2-IMAGES.md) ;
// si un fichier manque, une tuile d'attente est dessinée.
import noms from '../../../../packages/donnees/visuel/noms.json';
import portraitsJson from '../../../../packages/donnees/visuel/portraits.json';

export type Sexe = 'F' | 'M';

export interface EntreePortrait {
  id: string;
  espece: string;
  sexe: Sexe;
  numero: number;
}

export const PORTRAITS = portraitsJson as EntreePortrait[];
const NOMS = noms as Record<string, Record<Sexe, string[]>>;

const IMAGES = import.meta.glob<string>('../portraits/*.{png,jpg,jpeg,webp}', { eager: true, query: '?url', import: 'default' });

const PAR_ID = new Map<string, string>(
  Object.entries(IMAGES).map(([chemin, url]) => [chemin.replace(/^.*\/(.+)\.[a-z]+$/, '$1'), url]),
);

export function imagePortrait(id: string): string | undefined {
  return PAR_ID.get(id);
}

export function portraitsPour(espece: string, sexe: Sexe): EntreePortrait[] {
  return PORTRAITS.filter((p) => p.espece === espece && p.sexe === sexe).sort((a, b) => a.numero - b.numero);
}

export function infoPortrait(id: string): EntreePortrait | undefined {
  return PORTRAITS.find((p) => p.id === id);
}

export function idPortrait(espece: string, sexe: Sexe, numero: number): string {
  return `${espece}-${sexe.toLowerCase()}-${numero}`;
}

/** Même numéro de portrait pour un autre sexe ou une autre espèce, s'il existe. */
export function portraitEquivalent(id: string | undefined, espece: string, sexe: Sexe): string | undefined {
  const numero = (id && infoPortrait(id)?.numero) || 1;
  const candidat = idPortrait(espece, sexe, numero);
  return PORTRAITS.some((p) => p.id === candidat) ? candidat : portraitsPour(espece, sexe)[0]?.id;
}

export function nomAuHasard(espece: string, sexe: Sexe, exclu?: string): string {
  const liste = NOMS[espece]?.[sexe] ?? NOMS.humain?.[sexe] ?? ['Voyageur'];
  const possibles = liste.length > 1 ? liste.filter((n) => n !== exclu) : liste;
  return possibles[Math.floor(Math.random() * possibles.length)]!;
}

/** Couleur de fond de la tuile d'attente, propre à chaque espèce. */
export const COULEURS_ESPECES: Record<string, string> = {
  drakeide: '#7a3b2a',
  elfe: '#2f5d4a',
  gnome: '#6b4a7a',
  goliath: '#5f6670',
  halfelin: '#7a6a2c',
  humain: '#3b5878',
  nain: '#7a4a24',
  orc: '#44602b',
  tieffelin: '#6e2a48',
};
