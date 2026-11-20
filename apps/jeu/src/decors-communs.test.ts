// F8 (20/11/2026) : le client résout `commun:lieux/<id>` dans un manifeste (comme `commun:pnj/…` et `commun:objets/…`).
import { describe, expect, it } from 'vitest';
import { urlImage } from './mondes';

describe('urlImage : décors communs', () => {
  it('résout un décor de la réserve (`commun:lieux/<id>`)', async () => {
    const url = urlImage('un-episode-quelconque', 'commun:lieux/taverne-foyer-et-chopes');
    expect(url).toBeDefined();
    expect(typeof (await url)).toBe('string');
  });

  it('un décor inconnu ne résout rien (la tuile d\'attente s\'affiche), sans erreur', () => {
    expect(urlImage('un-episode-quelconque', 'commun:lieux/decor-qui-n-existe-pas')).toBeUndefined();
  });

  it('les autres références communes et les fichiers du monde se résolvent comme avant', () => {
    expect(urlImage('un-episode-quelconque', 'commun:pnj/inconnu-x')).toBeUndefined();
    expect(urlImage('dime-des-roseaux', 'lieu-mireval.webp')).toBeDefined();
  });
});
