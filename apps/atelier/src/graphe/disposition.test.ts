import { describe, expect, it } from 'vitest';
import type { Graphe } from '@crpg/regles';
import { cheminArete, disposer } from './disposition';

const noeud = (id: string) => ({ id, genre: 'x', libelle: id });
const graphe = (ids: string[], aretes: [string, string][]): Graphe => ({ noeuds: ids.map(noeud), aretes: aretes.map(([de, vers]) => ({ de, vers, genre: 'lien' })) });

const seChevauchent = (a: { x: number; y: number; l: number; h: number }, b: { x: number; y: number; l: number; h: number }) => a.x < b.x + b.l && b.x < a.x + a.l && a.y < b.y + b.h && b.y < a.y + a.h;

describe('mise en page des graphes', () => {
  it('place une chaîne en colonnes successives, de la racine vers la droite', () => {
    const d = disposer(graphe(['a', 'b', 'c'], [['a', 'b'], ['b', 'c']]));
    expect(['a', 'b', 'c'].map((id) => d.boites.get(id)!.colonne)).toEqual([0, 1, 2]);
    expect(d.boites.get('a')!.x).toBeLessThan(d.boites.get('b')!.x);
    expect(d.largeur).toBeGreaterThan(d.boites.get('c')!.x);
  });

  it('une racine donnée passe en première colonne, même dans un cycle', () => {
    const d = disposer(graphe(['a', 'b', 'c'], [['a', 'b'], ['b', 'c'], ['c', 'a']]), { racines: ['b'] });
    expect(d.boites.get('b')!.colonne).toBe(0);
    expect(d.boites.get('a')!.colonne).toBe(1);
    expect(d.boites.get('c')!.colonne).toBe(1);
  });

  it('aucune boîte n’en chevauche une autre, et les nœuds isolés sont placés aussi', () => {
    const ids = ['r', ...Array.from({ length: 12 }, (_, i) => `n${i}`), 'seul'];
    const aretes: [string, string][] = ids.slice(1, 13).map((id, i) => [i < 6 ? 'r' : `n${i - 6}`, id]);
    const d = disposer(graphe(ids, aretes));
    expect(d.boites.size).toBe(ids.length);
    const boites = [...d.boites.values()];
    for (let i = 0; i < boites.length; i++) for (let k = i + 1; k < boites.length; k++) expect(seChevauchent(boites[i]!, boites[k]!)).toBe(false);
  });

  it('range les enfants selon leurs parents pour éviter le croisement', () => {
    // a et b ont chacun un enfant : l'ordre des enfants doit suivre celui des parents.
    const d = disposer(graphe(['a', 'b', 'y', 'x'], [['a', 'x'], ['b', 'y']]));
    const ordreParents = d.boites.get('a')!.y < d.boites.get('b')!.y;
    const ordreEnfants = d.boites.get('x')!.y < d.boites.get('y')!.y;
    expect(ordreEnfants).toBe(ordreParents);
  });

  it('ignore les arêtes vers un nœud absent et supporte un graphe vide', () => {
    expect(disposer({ noeuds: [], aretes: [] }).boites.size).toBe(0);
    const d = disposer({ noeuds: [noeud('a')], aretes: [{ de: 'a', vers: 'fantome', genre: 'lien' }] });
    expect(d.boites.size).toBe(1);
  });

  it('trace les arêtes de bord à bord, avec une boucle quand les boîtes sont dans la même colonne', () => {
    const d = disposer(graphe(['a', 'b', 'c'], [['a', 'b'], ['a', 'c']]));
    const a = d.boites.get('a')!;
    const b = d.boites.get('b')!;
    expect(cheminArete(a, b).d.startsWith(`M ${a.x + a.l} `)).toBe(true);
    // Retour : de b vers a part du bord gauche de b.
    expect(cheminArete(b, a).d.startsWith(`M ${b.x} `)).toBe(true);
    expect(cheminArete(b, d.boites.get('c')!).d).toContain('C');
  });
});
