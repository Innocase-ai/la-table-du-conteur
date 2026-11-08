import { describe, expect, it } from 'vitest';
import { JOURNAL_MAX, partieBornee, sauvegarderPartie, type EvenementJeu, type Partie } from '../src';

const evenement = (i: number): EvenementJeu => ({ type: 'constat', texte: `événement ${i}` }) as EvenementJeu;
const partie = (n: number): Partie => ({ version: 2, monde: 'ombresang', graine: 1, scene: { type: 'exploration' }, groupe: [], etat: {} as Partie['etat'], modules: {}, journal: Array.from({ length: n }, (_, i) => evenement(i)) });

describe('sauvegarde bornée', () => {
  it('laisse intacte une partie dont le journal est court', () => {
    const p = partie(10);
    expect(partieBornee(p)).toBe(p);
  });
  it('garde les derniers événements sans modifier la partie en cours', () => {
    const p = partie(JOURNAL_MAX + 100);
    const b = partieBornee(p);
    expect(b.journal).toHaveLength(JOURNAL_MAX);
    expect(b.journal.at(-1)).toEqual(evenement(JOURNAL_MAX + 99));
    expect(p.journal).toHaveLength(JOURNAL_MAX + 100);
  });
  it('réessaie avec un journal plus court quand le stockage est plein', () => {
    const tailles: number[] = [];
    const ok = sauvegarderPartie(partie(JOURNAL_MAX + 100), (json) => {
      const n = (JSON.parse(json) as Partie).journal.length;
      tailles.push(n);
      if (n > 200) throw new Error('quota');
    });
    expect(ok).toBe(true);
    expect(tailles).toEqual([JOURNAL_MAX, 200]);
  });
  it('renvoie false si rien ne peut être écrit', () => {
    expect(sauvegarderPartie(partie(5), () => { throw new Error('indisponible'); })).toBe(false);
  });
});
