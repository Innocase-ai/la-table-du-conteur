// Libellés français partagés par le créateur de personnage et l'écran du groupe.
import type { Caracteristique, Competence } from '@crpg/regles';

export const NOMS_CARAC: Record<Caracteristique, string> = {
  for: 'Force',
  dex: 'Dextérité',
  con: 'Constitution',
  int: 'Intelligence',
  sag: 'Sagesse',
  cha: 'Charisme',
};

export const ABR_CARAC: Record<Caracteristique, string> = { for: 'For', dex: 'Dex', con: 'Con', int: 'Int', sag: 'Sag', cha: 'Cha' };

export const NOMS_COMPETENCES: Record<Competence, string> = {
  acrobaties: 'Acrobaties',
  arcanes: 'Arcanes',
  athletisme: 'Athlétisme',
  discretion: 'Discrétion',
  dressage: 'Dressage',
  escamotage: 'Escamotage',
  histoire: 'Histoire',
  intimidation: 'Intimidation',
  intuition: 'Intuition',
  investigation: 'Investigation',
  medecine: 'Médecine',
  nature: 'Nature',
  perception: 'Perception',
  persuasion: 'Persuasion',
  religion: 'Religion',
  representation: 'Représentation',
  survie: 'Survie',
  tromperie: 'Tromperie',
};

export const NOMS_CATEGORIES_ARMURE: Record<string, string> = {
  legere: 'légère',
  intermediaire: 'intermédiaire',
  lourde: 'lourde',
  bouclier: 'bouclier',
};

export function signe(n: number): string {
  return n >= 0 ? `+${n}` : `−${-n}`;
}

export function nomTaille(t: 'P' | 'M'): string {
  return t === 'P' ? 'Petite' : 'Moyenne';
}

export function tronquer(texte: string, max: number): string {
  return texte.length <= max ? texte : `${texte.slice(0, max - 1).trimEnd()}…`;
}

export function majuscule(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/** « 1d8 » → « 1d8 », sinon renvoie le texte tel quel ; pour les listes d'équipement. */
export function liste(elements: string[]): string {
  return elements.join(', ');
}
