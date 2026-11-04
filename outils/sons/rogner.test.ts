import { describe, expect, it } from 'vitest';
import { bornesUtiles, extraireSilences, filtreFinal, gainPour, lireVolumes, slug } from './rogner';

/** Sortie réelle de ffmpeg (silencedetect) pour un son de 8,04 s dont seule la première seconde et demie est utile. */
const SORTIE_SOIN = `
[silencedetect @ 0000] silence_start: 1.546854
[silencedetect @ 0000] silence_end: 8.04 | silence_duration: 6.493146
`;

/** Un son qui commence par un silence et finit par un autre. */
const SORTIE_HACHE = `
[silencedetect @ 0000] silence_start: 0
[silencedetect @ 0000] silence_end: 0.1845 | silence_duration: 0.1845
[silencedetect @ 0000] silence_start: 1.352042
[silencedetect @ 0000] silence_end: 3.432 | silence_duration: 2.079958
`;

describe('extraireSilences', () => {
  it('relève le début et la fin de chaque silence', () => {
    expect(extraireSilences(SORTIE_HACHE)).toEqual([
      { debut: 0, fin: 0.1845 },
      { debut: 1.352042, fin: 3.432 },
    ]);
  });

  it('accepte un silence sans fin (le fichier s’arrête dedans)', () => {
    expect(extraireSilences('silence_start: 2.5')).toEqual([{ debut: 2.5 }]);
  });

  it('ne trouve rien dans un son sans silence', () => {
    expect(extraireSilences('mean_volume: -10 dB')).toEqual([]);
  });
});

describe('bornesUtiles', () => {
  it('coupe le long silence de la fin et garde une courte queue', () => {
    const b = bornesUtiles(extraireSilences(SORTIE_SOIN), 8.04, { queue: 0.15, marge: 0.02 })!;
    expect(b.debut).toBe(0);
    expect(b.fin).toBeCloseTo(1.696854, 5);
  });

  it('coupe aussi le silence du début, avec une petite marge', () => {
    const b = bornesUtiles(extraireSilences(SORTIE_HACHE), 3.432, { queue: 0.15, marge: 0.02 })!;
    expect(b.debut).toBeCloseTo(0.1645, 4);
    expect(b.fin).toBeCloseTo(1.502042, 5);
  });

  it('ne touche pas un son sans silence', () => {
    expect(bornesUtiles([], 1.5)).toEqual({ debut: 0, fin: 1.5 });
  });

  it('garde un silence au milieu du son', () => {
    const b = bornesUtiles([{ debut: 0.5, fin: 0.9 }], 2)!;
    expect(b).toEqual({ debut: 0, fin: 2 });
  });

  it('ne dépasse jamais la durée du fichier', () => {
    const b = bornesUtiles([{ debut: 1.95 }], 2, { queue: 0.5, marge: 0.02 })!;
    expect(b.fin).toBe(2);
  });

  it('renvoie null quand tout est silence', () => {
    expect(bornesUtiles([{ debut: 0, fin: 3 }], 3)).toBeNull();
    expect(bornesUtiles([{ debut: 0 }], 3)).toBeNull();
  });
});

describe('volume', () => {
  it('lit le volume moyen et le pic', () => {
    expect(lireVolumes('mean_volume: -27.2 dB\nmax_volume: -4.7 dB')).toEqual({ moyenne: -27.2, pic: -4.7 });
    expect(lireVolumes('rien')).toBeNull();
  });

  it('amène un son faible à la cible', () => {
    expect(gainPour({ moyenne: -27, pic: -10 }, { moyenneCible: -20, picMax: -1.5 })).toBe(7);
  });

  it('baisse un son fort', () => {
    expect(gainPour({ moyenne: -10.7, pic: 0 }, { moyenneCible: -20, picMax: -1.5 })).toBe(-9.3);
  });

  it('ne laisse pas le pic dépasser la limite, même si la moyenne est loin de la cible', () => {
    // Moyenne très basse mais pic déjà à −2 dB : on ne peut monter que de 0,5 dB.
    expect(gainPour({ moyenne: -40, pic: -2 }, { moyenneCible: -20, picMax: -1.5 })).toBe(0.5);
  });
});

describe('slug', () => {
  it('nettoie un nom de fichier', () => {
    expect(slug('Coup-épée.mp3')).toBe('coup-epee');
    expect(slug('sort de feux 2.mp3')).toBe('sort-de-feux-2');
    expect(slug('Sort X1.mp3')).toBe('sort-x1');
  });
});

describe('filtreFinal', () => {
  it('enchaîne fondu d’entrée, fondu de sortie et gain', () => {
    expect(filtreFinal(1.5, -9.3)).toBe('afade=t=in:d=0.005,afade=t=out:st=1.320:d=0.180,volume=-9.30dB');
  });

  it('réduit le fondu de sortie sur un son très court', () => {
    expect(filtreFinal(0.2, 0)).toContain('afade=t=out:st=0.100:d=0.100');
  });
});
