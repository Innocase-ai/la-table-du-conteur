import { describe, expect, it } from 'vitest';
import { aurasDe } from './effets-visuels';

const base = { concentration: undefined, pvTemp: 0 };

describe('aurasDe', () => {
  it("montre l'aura de renfort tant que le sort Aide agit", () => {
    const c = { ...base, modificateurs: [{ id: 'aide-a', type: 'repere' as const, source: 'x' }] };
    expect(aurasDe(c)).toEqual(['renfort']);
  });
  it('ne montre rien sans modificateur', () => {
    expect(aurasDe({ ...base, modificateurs: [] })).toEqual([]);
  });
});
