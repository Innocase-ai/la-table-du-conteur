import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { etatInitial, nouvellePartie, aller, parler, creerGenerateur, type DonneesMonde } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';

/**
 * Le conseil des Gardiens (scène écrite à l'« atelier d'écriture ») : il ne se joue que lorsque le groupe sait
 * que le Veilleur se consume, une seule fois, et ouvre ensuite un sujet « le-conseil » chez les quatre PNJ.
 */
const PNJ = ['hesta-cendrebrune', 'aurele-montclar', 'rolf-garde-capitaine', 'fennick-rouage'];

function partie(sait: boolean) {
  const r = chargerMonde(join(RACINE_MONDES, 'val-des-cendres'));
  if (!r.ok) throw new Error('monde illisible');
  const dm = r.monde as DonneesMonde;
  const etat = etatInitial(dm);
  etat.lieu = 'veillecendre';
  if (sait) etat.faits.push('f-veilleur-se-consume');
  return nouvellePartie(dm, etat, [], creerGenerateur(7));
}

describe('conseil des Gardiens', () => {
  it('ne se joue pas tant que le groupe ignore que le Veilleur se consume', () => {
    const p = partie(false);
    const r = aller(p, 'vei-maison-des-gardiens');
    expect(r.narrations.join('\n')).not.toContain("Trois doigts d'huile");
    expect(p.etat.flags['vei-conseil-tenu']).toBeFalsy();
  });

  it('se joue une seule fois quand le fait est connu, pose le drapeau et le fait', () => {
    const p = partie(true);
    const r = aller(p, 'vei-maison-des-gardiens');
    const texte = r.narrations.join('\n');
    expect(texte).toContain("Trois doigts d'huile");
    expect(texte).toContain('que feriez-vous ?');
    expect(p.etat.flags['vei-conseil-tenu']).toBe(true);
    expect(p.etat.faits).toContain('f-vei-conseil-des-gardiens');
    aller(p, 'veillecendre');
    const r2 = aller(p, 'vei-maison-des-gardiens');
    expect(r2.narrations.join('\n')).not.toContain("Trois doigts d'huile");
  });

  it("n'est jamais cité en avance : aucun PNJ ne dit « neuf » avant Hesta, et les interdits restent cachés", () => {
    const p = partie(true);
    const texte = aller(p, 'vei-maison-des-gardiens').narrations.join('\n');
    expect(texte.indexOf('neuf')).toBeGreaterThan(texte.indexOf('Oswin tient la flamme'));
    // « grain de cendre » (le régulateur de Fennick) est permis ; le grain du village, non.
    const sansCendre = texte.replace(/grain de cendre/g, '');
    for (const interdit of ['Fer-Gris', 'tribut', 'grain', 'grenier', 'Cœur-de-Braise', 'Haute-Forge', 'Thalgrin', 'Brunhild', 'Écluse', 'supplié']) {
      expect(sansCendre).not.toContain(interdit);
    }
    for (const mot of texte.split('\n\n')) expect(mot.length).toBeGreaterThan(0);
  });

  it('ouvre le sujet « le-conseil » chez les quatre PNJ (là où on les retrouve), seulement une fois le conseil tenu', () => {
    for (const id of PNJ) {
      const chezLui = partie(true).dm.pnj.get(id)!.lieu;
      const avant = partie(true);
      avant.etat.lieu = chezLui;
      expect(parler(avant, id, 'le-conseil').ok).toBe(false);
      const apres = partie(true);
      aller(apres, 'vei-maison-des-gardiens');
      apres.etat.lieu = chezLui;
      const r = parler(apres, id, 'le-conseil');
      expect(r.ok, `${id} : ${r.refus ?? ''}`).toBe(true);
      expect(r.narrations.length).toBeGreaterThan(0);
    }
  });
});
