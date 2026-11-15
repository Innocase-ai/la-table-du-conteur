// L'estimation de durée tient compte de la longueur des textes que le joueur lit : à contenu égal, une histoire aux textes riches
// dure plus longtemps qu'une histoire aux textes secs.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { DonneesMonde } from '../src';
import { chargerMonde } from '../src/monde/chargeur';
import { estimerCampagne, motsLusDuMonde, RYTHME } from '../src/monde/estimation';
import { MONDES_ESSAI } from './mondes-essai';

function charger(): DonneesMonde {
  const r = chargerMonde(join(MONDES_ESSAI, 'carriere-essai'));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  return r.monde;
}

describe("estimation de durée : la lecture compte", () => {
  it('une arrivée plus longue allonge la durée, à nombre de lieux, de PNJ et de combats égal', () => {
    const court = charger();
    const long = charger();
    for (const l of long.lieux.values()) l.arrivee = `${l.arrivee ?? ''} ${'mot '.repeat(3000)}`;
    const a = estimerCampagne(court);
    const b = estimerCampagne(long);
    expect(b.tours).toBe(a.tours); // même contenu
    expect(b.motsLus).toBeGreaterThan(a.motsLus + 3000 * court.lieux.size * RYTHME.lieuxVisites * 0.9);
    expect(b.heures.recit).toBeGreaterThan(a.heures.recit);
    expect(b.heures.combats).toBe(a.heures.combats); // le temps de combat ne dépend pas des textes
  });

  it('compte les mots des arrivées pour la part des lieux que le groupe visite', () => {
    const dm = charger();
    const regler = (n: number) => {
      for (const l of dm.lieux.values()) l.arrivee = 'mot '.repeat(n).trim();
    };
    regler(10);
    const dix = motsLusDuMonde(dm);
    regler(30);
    const trente = motsLusDuMonde(dm);
    // 20 mots de plus par lieu, lus dans la part des lieux visités (arrondi : un demi-mot au plus par terme).
    expect(Math.abs(trente - dix - 20 * dm.lieux.size * RYTHME.lieuxVisites)).toBeLessThanOrEqual(1);
  });

  it('la formule : temps par action plus temps de lecture, et le résultat est stable', () => {
    const dm = charger();
    const e = estimerCampagne(dm);
    const attendu = (e.tours * RYTHME.secondesParAction) / 3600 + e.motsLus / (RYTHME.motsParMinute * 60);
    expect(Math.abs(e.heures.recit - attendu)).toBeLessThanOrEqual(0.25 + 1e-9); // arrondi à la demi-heure
    expect(estimerCampagne(dm)).toEqual(e);
  });
});
