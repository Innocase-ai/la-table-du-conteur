// Les salutations des PNJ sont dites à voix haute avec LA voix du PNJ (celle de son ouverture de conversation). Ce test garde la chaîne :
// chaque salutation d'Ombresang a son fichier, rangé sous la voix que le jeu calcule pour ce PNJ ; aucun fichier ne reste orphelin quand un
// texte est modifié (sa clé change : l'ancien audio ne dirait plus rien de juste) ; et tout fichier déclaré existe vraiment.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chargerMonde, listerMondes } from '../../../packages/regles/src/monde/chargeur';
import { dossierMonde, IDS_MONDES_ESSAI } from '../../../packages/regles/tests/mondes-essai';
import { SALUTATIONS_COMMUNES, TONS_SALUTATION } from '../../../packages/regles/src/monde/salutations-communes';
import { OUVERTURES } from './ouvertures';
import { ageApproximatif, voixDuPnj } from './ouvertures-regles';
import { cheminParole } from './paroles-regles';

const DOSSIER = join(import.meta.dirname, 'voix', 'dialogues');
const VOIX = ['f-commere', 'f-erinome', 'f-matrone', 'f-guerisseuse', 'f-despina', 'f-callirrhoe', 'm-charon', 'm-umbriel', 'm-sadaltager', 'm-aubergiste', 'm-bonhomme', 'm-sage'];
const LIGNES_COMMUNES = SALUTATIONS_COMMUNES.registres.flatMap((r) => TONS_SALUTATION.flatMap((ton) => r.lignes[ton]));

function textesDuMonde(id: string): { pnj: string; voix: string; texte: string }[] {
  const r = chargerMonde(dossierMonde(id));
  if (!r.ok || !OUVERTURES?.voix) return [];
  const res: { pnj: string; voix: string; texte: string }[] = [];
  for (const p of r.monde.pnj.values()) {
    const voix = voixDuPnj(OUVERTURES.voix, p.sexe, p.id, ageApproximatif(p.age)).id;
    const s = p.salutations;
    for (const texte of [s.neutre, s.amical, s.hostile, ...s.variantes.map((v) => v.texte)]) if (texte) res.push({ pnj: p.id, voix, texte });
  }
  return res;
}

describe('la voix des salutations des PNJ', () => {
  it('chaque salutation d’Ombresang (neutre, amicale, hostile, variables) a son fichier, sous la voix de son PNJ', () => {
    const textes = textesDuMonde('ombresang');
    expect(textes.length).toBeGreaterThanOrEqual(50);
    const manquants = textes.filter((t) => !existsSync(join(DOSSIER, `${cheminParole(t.voix, t.texte)}.mp3`)));
    expect(manquants.map((t) => `${t.pnj} : ${t.texte.slice(0, 40)}…`)).toEqual([]);
  });

  it('un PNJ garde la même voix pour toutes ses salutations, et cette voix est celle de son ouverture', () => {
    const textes = textesDuMonde('ombresang');
    for (const pnj of new Set(textes.map((t) => t.pnj))) expect(new Set(textes.filter((t) => t.pnj === pnj).map((t) => t.voix)).size, pnj).toBe(1);
  });

  it('aucun fichier orphelin : chaque fichier livré correspond à une salutation actuelle de l’un des mondes', () => {
    const connus = new Set([
      ...[...listerMondes(), ...IDS_MONDES_ESSAI].flatMap((id) => textesDuMonde(id).map((t) => cheminParole(t.voix, t.texte))),
      ...VOIX.flatMap((voix) => LIGNES_COMMUNES.map((texte) => cheminParole(voix, texte))),
    ]);
    const livres = [...new Set(textesDuMonde('ombresang').map((t) => cheminParole(t.voix, t.texte)))];
    expect(livres.length).toBeGreaterThan(0);
    const orphelins: string[] = [];
    for (const voix of VOIX) {
      const dossier = join(DOSSIER, voix);
      if (!existsSync(dossier)) continue;
      for (const f of readdirSync(dossier)) if (f.endsWith('.mp3') && !connus.has(`${voix}/${f.replace(/\.mp3$/, '')}`)) orphelins.push(`${voix}/${f}`);
    }
    expect(orphelins).toEqual([]);
  });

  it('la bibliothèque commune est entièrement dite : chaque ligne a son fichier pour chacune des 12 voix', () => {
    expect(LIGNES_COMMUNES.length).toBeGreaterThanOrEqual(54);
    const manquants = VOIX.flatMap((voix) => LIGNES_COMMUNES.filter((texte) => !existsSync(join(DOSSIER, `${cheminParole(voix, texte)}.mp3`))).map((texte) => `${voix} : ${texte.slice(0, 40)}…`));
    expect(manquants).toEqual([]);
  });
});
