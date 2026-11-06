// Tests d20 : tests de caractéristique, jets de sauvegarde et jets d'attaque (SRD 5.2.1, « Comment jouer »).
import { lancerDe, type Generateur } from './des';

export interface OptionsTestD20 {
  bonus: number;
  dd: number;
  avantage?: boolean;
  desavantage?: boolean;
  /** Jet d'attaque : un 20 naturel touche toujours (critique), un 1 naturel rate toujours. */
  attaque?: boolean;
}

export interface ResultatTestD20 {
  des: number[];
  retenu: number;
  total: number;
  reussite: boolean;
  critique: boolean;
}

export function testD20(options: OptionsTestD20, gen: Generateur): ResultatTestD20 {
  // Avantage et désavantage s'annulent, quel que soit leur nombre.
  const avantage = !!options.avantage && !options.desavantage;
  const desavantage = !!options.desavantage && !options.avantage;
  const des = avantage || desavantage ? [lancerDe(20, gen), lancerDe(20, gen)] : [lancerDe(20, gen)];
  const retenu = avantage ? Math.max(...des) : desavantage ? Math.min(...des) : des[0]!;
  const total = retenu + options.bonus;
  if (options.attaque) {
    if (retenu === 20) return { des, retenu, total, reussite: true, critique: true };
    if (retenu === 1) return { des, retenu, total, reussite: false, critique: false };
  }
  return { des, retenu, total, reussite: total >= options.dd, critique: false };
}
