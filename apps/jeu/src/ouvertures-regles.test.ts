// Les ouvertures de conversation des PNJ : le fonds commun (30 phrases, trois tons), la voix d'homme ou de femme selon le genre
// du PNJ, le ton selon son attitude, et un fichier audio pour chaque phrase et chaque voix.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SEUIL_AMICAL, SEUIL_HOSTILE } from '@crpg/regles';
import {
  ageApproximatif,
  choisirOuverture,
  empreinteTexte,
  FichierOuvertures,
  genreDeVoix,
  texteOuverture,
  TONS_OUVERTURE,
  tonDeLAttitude,
  voixDuPnj,
} from './ouvertures-regles';

const brut = JSON.parse(readFileSync(join(import.meta.dirname, '..', '..', '..', 'packages', 'donnees', 'repliques', 'ouvertures.json'), 'utf8')) as unknown;
const fichier = FichierOuvertures.parse(brut);
const voix = fichier.voix!;

describe('le fonds d’ouvertures', () => {
  it('compte 30 ouvertures, au moins 10 de chaque ton, aux identifiants uniques', () => {
    expect(fichier.ouvertures).toHaveLength(30);
    for (const ton of TONS_OUVERTURE) expect(fichier.ouvertures.filter((o) => o.ton === ton).length, ton).toBeGreaterThanOrEqual(10);
    expect(new Set(fichier.ouvertures.map((o) => o.id)).size).toBe(30);
  });

  it('les accords de genre sont bien formés ({masculin|féminin}) et la phrase s’accorde à la voix', () => {
    for (const o of fichier.ouvertures) {
      expect(o.texte.match(/[{}]/g)?.length ?? 0, o.id).toBe((o.texte.match(/\{[^{}|]+\|[^{}|]+\}/g)?.length ?? 0) * 2);
      expect(texteOuverture(o, 'm'), o.id).not.toMatch(/[{}|]/);
      expect(texteOuverture(o, 'f'), o.id).not.toMatch(/[{}|]/);
    }
    const ravie = fichier.ouvertures.find((o) => o.id === 'amical-2')!;
    expect(texteOuverture(ravie, 'm')).toContain('ravi de vous voir');
    expect(texteOuverture(ravie, 'f')).toContain('ravie de vous voir');
  });

  it('chaque phrase est courte (une ou deux phrases, pas de dialogue)', () => {
    for (const o of fichier.ouvertures) expect(o.texte.split(/\s+/).length, o.id).toBeLessThanOrEqual(16);
  });
});

describe('la voix d’un PNJ', () => {
  it('suit son genre : une femme a une voix de femme, un homme une voix d’homme', () => {
    for (const id of ['osric', 'nolwen', 'basile', 'hesta', 'tobias']) {
      expect(voixDuPnj(voix, 'F', id).id).toMatch(/^f-/);
      expect(voixDuPnj(voix, 'M', id).id).toMatch(/^m-/);
    }
  });

  it('est toujours la même pour un même PNJ, et varie d’un PNJ à l’autre', () => {
    for (let i = 0; i < 20; i++) expect(voixDuPnj(voix, 'M', 'osric')).toBe(voixDuPnj(voix, 'M', 'osric'));
    const ids = Array.from({ length: 60 }, (_, i) => `pnj-${i}`);
    expect(new Set(ids.map((id) => voixDuPnj(voix, 'M', id).id)).size).toBe(voix.m.length);
    expect(new Set(ids.map((id) => voixDuPnj(voix, 'F', id).id)).size).toBe(voix.f.length);
  });

  it('un PNJ de genre N garde toujours le même genre de voix, et les deux genres se rencontrent', () => {
    for (let i = 0; i < 20; i++) expect(genreDeVoix('N', 'golem')).toBe(genreDeVoix('N', 'golem'));
    const genres = new Set(Array.from({ length: 40 }, (_, i) => genreDeVoix('N', `creature-${i}`)));
    expect(genres).toEqual(new Set(['m', 'f']));
  });

  it('l’empreinte d’un texte est stable', () => {
    expect(empreinteTexte('osric')).toBe(empreinteTexte('osric'));
    expect(empreinteTexte('osric')).not.toBe(empreinteTexte('nolwen'));
  });
});

describe('la voix selon l’âge', () => {
  it('lit l’âge écrit en chiffres, en lettres ou en approximation', () => {
    const cas: [string, number | undefined][] = [
      ['52 ans', 52],
      ['environ 40 ans', 40],
      ['trente-cinq ans', 35],
      ['quarante-cinq ans', 45],
      ['vingt-huit ans', 28],
      ['dix-sept ans', 17],
      ['soixante ans', 60],
      ['soixante-dix ans', 70],
      ['soixante et onze ans', 71],
      ['quatre-vingts ans', 80],
      ['quatre-vingt-dix ans', 90],
      ['une cinquantaine d’années', 50],
      ['mort depuis deux siècles', undefined],
      ['animé depuis deux siècles', undefined],
      ['environ 210 ans', undefined],
      ['', undefined],
    ];
    for (const [texte, attendu] of cas) expect(ageApproximatif(texte), texte).toBe(attendu);
    expect(ageApproximatif(undefined)).toBeUndefined();
  });

  it('un jeune PNJ n’a jamais une voix de vieux sage, de guérisseuse, de matrone ou d’aubergiste', () => {
    const ids = Array.from({ length: 80 }, (_, i) => `jeune-${i}`);
    for (const id of ids) {
      expect(['m-sage', 'm-aubergiste']).not.toContain(voixDuPnj(voix, 'M', id, 19).id);
      expect(['f-guerisseuse', 'f-matrone']).not.toContain(voixDuPnj(voix, 'F', id, 19).id);
    }
  });

  it('un PNJ âgé peut avoir toutes les voix, et sa voix ne change pas', () => {
    const ids = Array.from({ length: 100 }, (_, i) => `age-${i}`);
    expect(new Set(ids.map((id) => voixDuPnj(voix, 'M', id, 60).id)).size).toBe(voix.m.length);
    expect(new Set(ids.map((id) => voixDuPnj(voix, 'F', id, 60).id)).size).toBe(voix.f.length);
    for (const id of ids) expect(voixDuPnj(voix, 'M', id, 60)).toBe(voixDuPnj(voix, 'M', id, 60));
  });

  it('sans âge connu, toutes les voix de son genre restent possibles', () => {
    const ids = Array.from({ length: 100 }, (_, i) => `inconnu-${i}`);
    expect(new Set(ids.map((id) => voixDuPnj(voix, 'F', id).id)).size).toBe(voix.f.length);
  });
});

describe('le ton et le tirage', () => {
  it('un PNJ hostile est méfiant, un PNJ dévoué est amical, entre les deux le plus souvent neutre', () => {
    for (const h of [0, 0.5, 0.99]) {
      expect(tonDeLAttitude(SEUIL_HOSTILE, h)).toBe('mefiant');
      expect(tonDeLAttitude(-100, h)).toBe('mefiant');
      expect(tonDeLAttitude(SEUIL_AMICAL, h)).toBe('amical');
      expect(tonDeLAttitude(100, h)).toBe('amical');
    }
    expect(tonDeLAttitude(0, 0.3)).toBe('neutre');
    expect(tonDeLAttitude(15, 0.9)).toBe('amical');
    expect(tonDeLAttitude(-15, 0.9)).toBe('mefiant');
  });

  it('l’ouverture tirée est du ton demandé et n’est jamais celle de la conversation précédente', () => {
    for (const ton of TONS_OUVERTURE) {
      for (const precedente of fichier.ouvertures.filter((o) => o.ton === ton).map((o) => o.id)) {
        for (let k = 0; k < 20; k++) {
          const o = choisirOuverture(fichier.ouvertures, ton, precedente, k / 20);
          expect(o.ton).toBe(ton);
          expect(o.id).not.toBe(precedente);
        }
      }
    }
  });

  it('chacune des ouvertures d’un ton peut sortir', () => {
    for (const ton of TONS_OUVERTURE) {
      const tirees = new Set(Array.from({ length: 50 }, (_, k) => choisirOuverture(fichier.ouvertures, ton, undefined, k / 50).id));
      expect(tirees.size).toBe(fichier.ouvertures.filter((o) => o.ton === ton).length);
    }
  });
});

describe('les fichiers audio', () => {
  const dossier = join(import.meta.dirname, 'voix', 'ouvertures');
  const toutes = [...voix.m, ...voix.f];

  it('chaque voix a un fichier pour chaque ouverture, et aucun fichier n’est orphelin', () => {
    expect(existsSync(dossier)).toBe(true);
    expect(readdirSync(dossier).sort()).toEqual(toutes.map((v) => v.id).sort());
    for (const v of toutes) {
      expect(readdirSync(join(dossier, v.id)).sort(), v.id).toEqual(fichier.ouvertures.map((o) => `${o.id}.mp3`).sort());
    }
  });

  it('douze voix : six d’homme et six de femme, aux identifiants préfixés par le genre', () => {
    expect(voix.m).toHaveLength(6);
    expect(voix.f).toHaveLength(6);
    for (const v of voix.m) expect(v.id).toMatch(/^m-/);
    for (const v of voix.f) expect(v.id).toMatch(/^f-/);
  });
});
