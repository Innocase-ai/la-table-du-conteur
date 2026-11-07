// Chaque son et chaque musique déclarés ont leur fichier, et aucun fichier n'est oublié : une faute de frappe rendait un
// bruitage muet sans que rien ne le signale.
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AMBIANCES } from '../../../outils/musique/ambiances';
import { AMBIANCES_EXTERNES, AMBIANCES_MUSIQUE, MUSIQUES_ACCUEIL, MUSIQUES_FOND } from './musique-regles';
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
    expect(mp3('musique/combat')).toEqual([...AMBIANCES_MUSIQUE].sort());
  });

  it('chaque musique d’accueil et de fond a son fichier, et chaque fichier est déclaré', () => {
    expect(mp3('musique/accueil')).toEqual([...MUSIQUES_ACCUEIL].sort());
    expect(mp3('musique/fond')).toEqual([...MUSIQUES_FOND].sort());
  });

  it('aucun fichier de musique n’est à la racine de musique/ : tout est rangé par usage', () => {
    expect(mp3('musique')).toEqual([]);
  });

  it('l’outil de génération et le jeu ont les mêmes ambiances', () => {
    // Les ambiances de combat viennent de l’outil de génération, sauf celles de Pixabay (musiques libres de droits).
    expect([...AMBIANCES.map((a) => a.id), ...AMBIANCES_EXTERNES].sort()).toEqual([...AMBIANCES_MUSIQUE].sort());
  });
});

// Les musiques sont des fonds sonores : leur niveau est mesuré (volume moyen et pic), pas supposé. Sans ffmpeg, ce contrôle est sauté.
const ffmpeg = spawnSync('ffmpeg', ['-version']).status === 0;
function mesurer(chemin: string): { moyenne: number; pic: number; duree: number } {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', chemin, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
  const sortie = `${r.stdout}\n${r.stderr}`;
  const nombre = (re: RegExp) => Number(re.exec(sortie)?.[1]);
  const h = /Duration: (\d+):(\d+):([\d.]+)/.exec(sortie);
  return { moyenne: nombre(/mean_volume: (-?[\d.]+) dB/), pic: nombre(/max_volume: (-?[\d.]+) dB/), duree: h ? Number(h[1]) * 3600 + Number(h[2]) * 60 + Number(h[3]) : NaN };
}

describe.skipIf(!ffmpeg)('niveau des musiques (mesuré)', () => {
  const familles: [string, string[], number][] = [
    ['combat', [...AMBIANCES_MUSIQUE], -24],
    ['accueil', [...MUSIQUES_ACCUEIL], -24],
    ['fond', [...MUSIQUES_FOND], -28],
  ];
  for (const [dossier, ids, plafond] of familles) {
    for (const id of ids) {
      it(`${dossier}/${id} : volume moyen ≤ ${plafond} dB, pic ≤ −3 dB`, () => {
        const m = mesurer(join(ICI, 'musique', dossier, `${id}.mp3`));
        expect(m.moyenne).toBeLessThanOrEqual(plafond);
        expect(m.pic).toBeLessThanOrEqual(-3);
      });
    }
  }

  it('les musiques de fond sont de vrais morceaux (au moins une minute), pas de petites boucles', () => {
    for (const id of MUSIQUES_FOND) expect(mesurer(join(ICI, 'musique', 'fond', `${id}.mp3`)).duree, id).toBeGreaterThanOrEqual(60);
  });
});
