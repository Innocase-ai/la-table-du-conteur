import { describe, expect, it } from 'vitest';
import { bornesStables, dureeBoucle, ecartAPosition, filtreBoucle, filtreNiveau, FONDU_PAR_DEFAUT, mesurerJonction, NIVEAU_AMBIANCE } from './boucle';

describe('bornesStables', () => {
  const stable = Array.from({ length: 24 }, (_, i) => -12 + (i % 3 === 0 ? -2 : 1));

  it('ne coupe rien dans une musique régulière', () => {
    expect(bornesStables(stable, 0.25)).toEqual({ debut: 0, fin: 6 });
  });

  it('écarte la résonance qui s’éteint à la fin', () => {
    // 20 fenêtres stables, puis une extinction : −29, −38, −49, −50 dB.
    const s = [...stable.slice(0, 20), -29, -38, -49, -50];
    expect(bornesStables(s, 0.25)).toEqual({ debut: 0, fin: 5 });
  });

  it('écarte l’entrée très douce du début', () => {
    const s = [-45, -40, ...stable.slice(0, 22)];
    expect(bornesStables(s, 0.25)).toEqual({ debut: 0.5, fin: 6 });
  });

  it('ne coupe pas un simple silence entre deux coups (une seule fenêtre faible)', () => {
    const s = [...stable.slice(0, 23), -40];
    expect(bornesStables(s, 0.25)).toEqual({ debut: 0, fin: 6 });
  });

  it('laisse en l’état une musique trop courte pour en juger', () => {
    expect(bornesStables([-12, -50, -50], 0.25)).toEqual({ debut: 0, fin: 0.75 });
  });
});
import { OPTIONS_PAR_DEFAUT } from '../sons/rogner';

describe('niveau d’une musique d’ambiance', () => {
  it('est plus bas que celui des bruitages, qui ne doivent jamais être couverts', () => {
    expect(NIVEAU_AMBIANCE.moyenneDb).toBeLessThan(OPTIONS_PAR_DEFAUT.moyenneCible);
    expect(OPTIONS_PAR_DEFAUT.moyenneCible - NIVEAU_AMBIANCE.moyenneDb).toBeGreaterThanOrEqual(5);
  });

  it('applique le gain à la sortie du montage', () => {
    expect(filtreNiveau(-11.7)).toBe('[boucle]volume=-11.70dB[sortie]');
  });
});

const SR = 8000;

/** Un signal modulé : une porteuse dont le volume ondule lentement, `tours` fois sur la durée (donc bouclable pile). */
function signal(secondes: number, f: (t: number) => number): Float32Array {
  const n = Math.round(secondes * SR);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) s[i] = f(i / SR);
  return s;
}

describe('filtreBoucle', () => {
  it('monte la boucle : début fondu, corps, fin raccordée', () => {
    const f = filtreBoucle(30.772, 1.5);
    expect(f).toContain('atrim=0:1.500');
    expect(f).toContain('atrim=29.272:30.772');
    expect(f).toContain('atrim=1.500:29.272');
    expect(f).toContain('afade=t=in:d=1.500:curve=qsin');
    expect(f).toContain('afade=t=out:d=1.500:curve=qsin');
    expect(f).toContain('amix=inputs=2:normalize=0');
    expect(f.endsWith('concat=n=2:v=0:a=1[boucle]')).toBe(true);
  });

  it('refuse un fondu trop long ou invalide', () => {
    expect(() => filtreBoucle(10, 5)).toThrow('trop long');
    expect(() => filtreBoucle(10, 0)).toThrow();
    expect(() => filtreBoucle(Number.NaN, 1)).toThrow();
  });

  it('la boucle est plus courte du fondu', () => {
    expect(dureeBoucle(30.772, FONDU_PAR_DEFAUT)).toBeCloseTo(29.272, 3);
  });
});

describe('mesurerJonction', () => {
  it('une musique au volume régulier boucle proprement', () => {
    // 10 s, onde de 220 Hz dont le volume ondule : 4 tours pile, donc la fin rejoint exactement le début.
    const s = signal(10, (t) => Math.sin(2 * Math.PI * 220 * t) * (0.6 + 0.2 * Math.sin(2 * Math.PI * 0.4 * t)));
    const j = mesurerJonction(s, SR);
    expect(j.propre).toBe(true);
    // Le raccord ne change pas plus le volume que n'importe quel autre endroit de la musique.
    expect(j.ecartDb).toBeLessThanOrEqual(j.typiqueDb + 1);
  });

  it('une musique qui démarre doucement et finit fort a une jonction creusée', () => {
    // Entrée en fondu sur 0,5 s, puis volume constant : à la boucle, le fort retombe d'un coup sur le silence.
    const s = signal(10, (t) => Math.sin(2 * Math.PI * 220 * t) * 0.6 * Math.min(1, t / 0.5));
    // La fin reste forte (pas de fondu de sortie) : fenêtre finale à pleine énergie, fenêtre initiale en montée.
    const j = mesurerJonction(s, SR, 0.25);
    expect(j.ecartDb).toBeGreaterThan(5);
    expect(j.propre).toBe(false);
  });

  it('détecte un saut net d’amplitude à la jonction (clic)', () => {
    const s = signal(10, (t) => 0.5 * Math.sin(2 * Math.PI * 100 * t));
    s[s.length - 1] = 0.9; // le dernier échantillon saute loin du premier
    s[0] = -0.9;
    expect(mesurerJonction(s, SR).saut).toBeGreaterThan(6);
  });

  it('refuse une musique trop courte', () => {
    expect(() => mesurerJonction(new Float32Array(100), SR)).toThrow('trop courte');
  });
});

describe('ecartAPosition', () => {
  // Une musique qui double de volume à 5 s (6 dB de plus).
  const marche = signal(10, (t) => Math.sin(2 * Math.PI * 220 * t) * (t < 5 ? 0.25 : 0.5));

  it('mesure le changement de volume à l’endroit demandé', () => {
    expect(ecartAPosition(marche, SR, 5, 0.5)).toBeCloseTo(6.02, 1);
  });

  it('ne voit rien là où le volume est constant', () => {
    expect(ecartAPosition(marche, SR, 2.5, 0.5)).toBeLessThan(0.1);
  });

  it('refuse une position trop près d’un bord', () => {
    expect(() => ecartAPosition(marche, SR, 0.2, 0.5)).toThrow('trop près');
  });
});
