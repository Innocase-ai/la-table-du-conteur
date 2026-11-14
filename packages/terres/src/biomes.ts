import type { BiomeId } from './types';

/** Réglages de génération du relief d'un biome (seuils d'altitude et d'humidité entre 0 et 1). */
export interface DefBiome {
  libelle: string;
  /** Taille des grands reliefs (en cases) : plus grand = des lacs et des massifs plus vastes. */
  echelleRelief: number;
  seuilEau: number;
  humiditeMarais: number;
  seuilForet: number;
  seuilColline: number;
  seuilMontagne: number;
  /** Probabilité qu'une case de forêt, de colline ou de montagne soit bloquée par un décor (arbres serrés, rochers, éboulis). */
  blocage: { foret: number; colline: number; montagne: number };
}

export const BIOMES: Record<BiomeId, DefBiome> = {
  prairie: { libelle: 'prairies', echelleRelief: 14, seuilEau: 0.37, humiditeMarais: 0.52, seuilForet: 0.5, seuilColline: 0.6, seuilMontagne: 0.69, blocage: { foret: 0.14, colline: 0.04, montagne: 0.3 } },
  marais: { libelle: 'marais', echelleRelief: 12, seuilEau: 0.42, humiditeMarais: 0.42, seuilForet: 0.58, seuilColline: 0.64, seuilMontagne: 0.74, blocage: { foret: 0.12, colline: 0.04, montagne: 0.3 } },
  collines: { libelle: 'collines', echelleRelief: 12, seuilEau: 0.33, humiditeMarais: 0.7, seuilForet: 0.54, seuilColline: 0.5, seuilMontagne: 0.66, blocage: { foret: 0.14, colline: 0.06, montagne: 0.3 } },
  montagne: { libelle: 'montagnes', echelleRelief: 10, seuilEau: 0.3, humiditeMarais: 0.8, seuilForet: 0.56, seuilColline: 0.46, seuilMontagne: 0.58, blocage: { foret: 0.12, colline: 0.08, montagne: 0.34 } },
  neige: { libelle: 'étendues glacées', echelleRelief: 14, seuilEau: 0.33, humiditeMarais: 2, seuilForet: 0.6, seuilColline: 0.58, seuilMontagne: 0.67, blocage: { foret: 0.1, colline: 0.04, montagne: 0.3 } },
  desert: { libelle: 'désert', echelleRelief: 16, seuilEau: 0.3, humiditeMarais: 2, seuilForet: 0.78, seuilColline: 0.62, seuilMontagne: 0.72, blocage: { foret: 0.08, colline: 0.05, montagne: 0.3 } },
};
