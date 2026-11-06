import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { idImageCommune } from '../src';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const RACINE = join(import.meta.dirname, '../../..');
const prompts = JSON.parse(readFileSync(join(RACINE, 'packages/donnees/visuel/objets-communs.json'), 'utf8')) as Record<string, string>;

/** Les images communes qu'exige le catalogue : une par arme, armure, et par objet (ou famille de variantes). */
function imagesAttendues(): Set<string> {
  const ids = new Set<string>([...srd.armes.keys(), ...srd.armures.keys()]);
  for (const o of srd.objets.values()) ids.add(idImageCommune(o.base && ids.has(o.base) ? o.base : o.id));
  return ids;
}

describe('images communes du catalogue SRD', () => {
  it('les variantes d’un même objet partagent une image, une arme magique prend celle de sa base', () => {
    expect(idImageCommune('arme-magique-plus-2')).toBe('arme-magique');
    expect(idImageCommune('parchemin-de-sort-niveau-3')).toBe('parchemin-de-sort');
    expect(idImageCommune('potion-de-guerison-superieure')).toBe('potion-de-guerison');
    expect(idImageCommune('potion-de-guerison')).toBe('potion-de-guerison');
    expect(idImageCommune('epee-longue')).toBe('epee-longue');
    expect(idImageCommune('corde')).toBe('corde');
  });

  it('chaque image commune attendue a sa description (prompt), et aucune description n’est orpheline', () => {
    const attendues = imagesAttendues();
    expect([...attendues].filter((id) => !prompts[id])).toEqual([]);
    expect(Object.keys(prompts).filter((id) => !attendues.has(id))).toEqual([]);
  });

  it('les descriptions sont de vrais prompts : un seul objet, en anglais, sans mot refusé par le service', () => {
    for (const [id, texte] of Object.entries(prompts)) {
      expect(texte, id).toMatch(/^an? |^a pair of /i);
      expect(texte, id).not.toMatch(/\b(blood|bloody|corpse|wound|scar|child|baby|naked|nude|suicide|torture|gore|skull|bones?)\b/i);
    }
  });

  it('chaque objet du catalogue a son image installée dans le jeu (apps/jeu/src/equipement)', () => {
    const manquantes = [...imagesAttendues()].filter((id) => !existsSync(join(RACINE, 'apps/jeu/src/equipement', id + '.webp')));
    expect(manquantes).toEqual([]);
  });
});
