import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { presentationMonstres, type DonneesMonde, type RencontreMonde } from '../src';
import { chargerDonneesSrd } from '../src/donnees-node';
import { chargerMonde } from '../src/monde/chargeur';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(MONDES_ESSAI, 'citadelle-des-marees'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm: DonneesMonde = r.monde;
const RACINE_BESTIAIRE = join(import.meta.dirname, '../../../apps/jeu/src/bestiaire');

const rencontre = (monstres: RencontreMonde['monstres']): RencontreMonde => ({ ...dm.rencontres.get('fal-r-noyes-du-marais')!, monstres });

describe('présentation des monstres d’une rencontre', () => {
  it('une ligne par type de monstre, dans l’ordre, avec nom, nombre et description du catalogue', () => {
    const p = presentationMonstres(dm.rencontres.get('fal-r-noyes-du-marais')!, dm, srd);
    expect(p.map((m) => [m.profil, m.nom, m.nombre])).toEqual([
      ['squelette', 'Squelette', 3],
      ['zombi', 'Zombi', 2],
    ]);
    for (const m of p) expect(m.description, m.profil).toBeTruthy();
  });

  it('les doublons d’un même type s’additionnent', () => {
    const p = presentationMonstres(rencontre([{ profil: 'zombi', nombre: 1 }, { profil: 'squelette', nombre: 2 }, { profil: 'zombi', nombre: 2 }]), dm, srd);
    expect(p.map((m) => [m.profil, m.nombre])).toEqual([['zombi', 3], ['squelette', 2]]);
  });

  it('un monstre au nom propre n’affiche pas la description de l’espèce, sauf si la rencontre en donne une', () => {
    const [sans] = presentationMonstres(rencontre([{ profil: 'zombi', nombre: 1, nom: 'Le Noyé-Roi' }]), dm, srd);
    expect(sans).toMatchObject({ profil: 'zombi', nom: 'Le Noyé-Roi', nombre: 1 });
    expect(sans!.description).toBeUndefined();
    const [avec] = presentationMonstres(rencontre([{ profil: 'zombi', nombre: 1, nom: 'Le Noyé-Roi', description: 'Une couronne de varech coiffe son crâne.' }]), dm, srd);
    expect(avec!.description).toBe('Une couronne de varech coiffe son crâne.');
  });

  it('un profil inconnu ou sans description ne casse rien', () => {
    const p = presentationMonstres(rencontre([{ profil: 'inconnu-total', nombre: 2 }]), dm, undefined);
    expect(p).toEqual([{ profil: 'inconnu-total', nom: 'inconnu-total', nombre: 2 }]);
  });

  it('une rencontre sans monstre ne présente rien', () => {
    expect(presentationMonstres(rencontre([]), dm, srd)).toEqual([]);
  });
});

describe('catalogue : image et description de chacun des monstres du SRD', () => {
  const profils = [...srd.monstres.values()];

  it('chacun a son image dans le bestiaire commun', () => {
    expect(profils.filter((m) => !existsSync(join(RACINE_BESTIAIRE, `${m.id}.webp`))).map((m) => m.id)).toEqual([]);
  });

  it('chacun a une description française courte, sans chiffre ni règle', () => {
    expect(profils.filter((m) => !m.description).map((m) => m.id)).toEqual([]);
    for (const m of profils) {
      const d = m.description!;
      const mots = d.split(/\s+/).length;
      expect(mots, m.id).toBeGreaterThanOrEqual(15);
      expect(mots, m.id).toBeLessThanOrEqual(70);
      expect(d, m.id).not.toMatch(/\d/);
      expect(d, m.id).not.toMatch(/[—!"«»]/);
      expect(d, m.id).not.toMatch(/\b(vous|DD|PV|points? de vie|dégâts|jet de)\b/i);
    }
  });
});
