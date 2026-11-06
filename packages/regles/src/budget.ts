// Budget de PX des rencontres de combat (SRD 5.2.1), commun à la validation des mondes et aux escarmouches.

/** Budget de PX par personnage (SRD 5.2.1, « Rencontres de combat »), niveaux 1 à 10 : faible, modérée, élevée. */
export const BUDGET_PX: Record<number, [number, number, number]> = {
  1: [50, 75, 100], 2: [100, 150, 200], 3: [150, 225, 400], 4: [250, 375, 500], 5: [500, 750, 1100],
  6: [600, 1000, 1400], 7: [750, 1300, 1700], 8: [1000, 1700, 2100], 9: [1300, 2000, 2600], 10: [1600, 2300, 3100],
};
