import { describe, expect, it } from 'vitest';
import { suitesPossibles } from './saga-regles';

const m = (id: string, min: number, max: number) => ({ id, nom: id.toUpperCase(), accroche: `Accroche de ${id}.`, niveaux: { min, max } });

describe('suites proposées à la fin d’un épisode', () => {
  it('exclut l’épisode qui vient de finir', () => {
    expect(suitesPossibles([m('a', 1, 2), m('b', 3, 4)], 'a', 2).map((s) => s.id)).toEqual(['b']);
  });
  it('classe les épisodes dont la plage contient le niveau du groupe d’abord, puis les plus proches', () => {
    const liste = [m('haut', 9, 10), m('juste', 3, 4), m('bas', 1, 1), m('proche', 5, 5)];
    expect(suitesPossibles(liste, 'x', 3).map((s) => s.id)).toEqual(['juste', 'bas', 'proche', 'haut']);
  });
  it('à égalité, l’ordre alphabétique des noms ; une seule histoire : aucune suite', () => {
    expect(suitesPossibles([m('b', 3, 3), m('a', 3, 3)], 'x', 3).map((s) => s.id)).toEqual(['a', 'b']);
    expect(suitesPossibles([m('seule', 1, 4)], 'seule', 2)).toEqual([]);
  });
  it('porte le nom, l’accroche et la plage de niveaux', () => {
    expect(suitesPossibles([m('a', 2, 4)], 'x', 3)[0]).toEqual({ id: 'a', nom: 'A', accroche: 'Accroche de a.', min: 2, max: 4 });
  });
});
