// Chaque son et chaque musique déclarés ont leur fichier, et aucun fichier n'est oublié : une faute de frappe rendait un
// bruitage muet sans que rien ne le signale.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AMBIANCES } from '../../../outils/musique/ambiances';
import { AMBIANCES_MUSIQUE } from './musique-regles';
import { SONS } from './sons-regles';

const ICI = import.meta.dirname;
const mp3 = (dossier: string) =>
  readdirSync(join(ICI, dossier))
    .filter((f) => f.endsWith('.mp3'))
    .map((f) => f.replace(/\.mp3$/, ''))
    .sort();

describe('fichiers audio', () => {
  it('chaque bruitage déclaré a son fichier, et chaque fichier est déclaré', () => {
    expect(mp3('sons')).toEqual([...SONS].sort());
  });

  it('chaque musique d’ambiance a son fichier, et chaque fichier est déclaré', () => {
    expect(mp3('musique')).toEqual([...AMBIANCES_MUSIQUE].sort());
  });

  it('l’outil de génération et le jeu ont les mêmes ambiances', () => {
    expect(AMBIANCES.map((a) => a.id).sort()).toEqual([...AMBIANCES_MUSIQUE].sort());
  });
});
