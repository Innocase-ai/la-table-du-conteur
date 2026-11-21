// Décors peints vus de dessus (21/11/2026) : chaque image `decors/<élément>-<n>.webp` désigne un élément du moteur posé sur
// une case (pas une plaque, peinte par la case elle-même), et chaque élément peint a une taille d'affichage.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { INFO_RELIEFS, RELIEFS, type Relief } from '@crpg/regles';
import { TAILLE_PEINT } from './composants/Reliefs';

describe('décors peints', () => {
  const fichiers = readdirSync(join(__dirname, 'decors')).filter((f) => f.endsWith('.webp'));

  it('chaque image s’appelle <élément>-<n> et désigne un élément posé sur une case', () => {
    expect(fichiers.length).toBeGreaterThan(0);
    for (const f of fichiers) {
      const m = /^(.+)-\d+\.webp$/.exec(f);
      expect(m, f).not.toBeNull();
      const relief = m![1] as Relief;
      expect(RELIEFS, f).toContain(relief);
      expect(INFO_RELIEFS[relief].type, f).not.toBe('difficile');
      expect(TAILLE_PEINT[relief], f).toBeGreaterThan(0);
    }
  });

  it('les éléments posés sur une case ont tous au moins une image peinte', () => {
    const peints = new Set(fichiers.map((f) => f.replace(/-\d+\.webp$/, '')));
    for (const r of RELIEFS.filter((r) => INFO_RELIEFS[r].type !== 'difficile')) expect(peints.has(r), r).toBe(true);
  });
});
