// Valeurs de caractéristique, modificateurs, bonus de maîtrise et progression (SRD 5.2.1, « Création de personnage »).
import { lancerDe, type Generateur } from './des';
import { CARACTERISTIQUES, type Caracteristique } from './schemas';

export type Valeurs = Record<Caracteristique, number>;

export const VALEURS_STANDARD = [15, 14, 13, 12, 10, 8] as const;
export const BUDGET_ACHAT = 27;
export const COUT_ACHAT: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
export const VALEUR_MAX = 20;

/** Seuils de PX des niveaux 1 à 20 (table « Progression des personnages »). */
export const SEUILS_PX = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000,
  225000, 265000, 305000, 355000,
] as const;

export function modificateur(valeur: number): number {
  return Math.floor((valeur - 10) / 2);
}

export function bonusMaitrise(niveau: number): number {
  return Math.ceil(niveau / 4) + 1;
}

export function niveauPourPx(px: number): number {
  let niveau = 1;
  SEUILS_PX.forEach((seuil, i) => {
    if (px >= seuil) niveau = i + 1;
  });
  return niveau;
}

export function coutAchat(valeurs: Valeurs): number | undefined {
  let total = 0;
  for (const c of CARACTERISTIQUES) {
    const cout = COUT_ACHAT[valeurs[c]];
    if (cout === undefined) return undefined;
    total += cout;
  }
  return total;
}

/** Génération aléatoire : 4d6 en gardant les trois meilleurs, six fois. */
export function tirerValeurs(gen: Generateur): number[] {
  return Array.from({ length: 6 }, () => {
    const des = Array.from({ length: 4 }, () => lancerDe(6, gen)).sort((a, b) => b - a);
    return des[0]! + des[1]! + des[2]!;
  });
}
