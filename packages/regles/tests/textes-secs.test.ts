// L'avis « Textes secs » du validateur : le jeu se lit comme un RPG textuel, les textes courts sonnent pauvres (cibles du 10/11/2026).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TEXTES_SECS, validerMonde, type DonneesMonde } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const texte = (n: number) => Array.from({ length: n }, (_, i) => `mot${i % 7}`).join(' ');

function monde(): DonneesMonde {
  const r = chargerMonde(join(RACINE_MONDES, 'val-des-cendres'));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  const dm = r.monde;
  // Tous les textes lus au niveau des cibles : l'avis ne doit pas se déclencher.
  for (const l of dm.lieux.values()) if (l.arrivee) l.arrivee = texte(140);
  for (const p of dm.pnj.values()) for (const s of p.sujets) s.reponse = `« ${texte(90)} »`;
  for (const x of dm.rencontres.values()) x.intro = texte(80);
  return dm;
}
const secs = (dm: DonneesMonde) => validerMonde(dm, srd).avertissements.filter((a) => a.startsWith('Textes secs'));

describe('les textes secs', () => {
  it('des textes à la cible ne déclenchent aucun avis', () => {
    expect(secs(monde())).toEqual([]);
  });

  it('un récit d’arrivée, une réponse de PNJ ou une introduction sous le seuil sont signalés, chacun dans son avis', () => {
    const dm = monde();
    const lieu = [...dm.lieux.values()].find((l) => l.arrivee)!;
    lieu.arrivee = texte(TEXTES_SECS.arrivee - 1);
    const pnj = [...dm.pnj.values()].find((p) => p.sujets.length)!;
    pnj.sujets[0]!.reponse = `« ${texte(TEXTES_SECS.reponse - 3)} »`;
    const rencontre = [...dm.rencontres.values()][0]!;
    rencontre.intro = texte(TEXTES_SECS.introRencontre - 1);
    const a = secs(dm).join('\n');
    expect(a).toMatch(new RegExp(`1 récits d'arrivée sur [0-9]+ font moins de ${TEXTES_SECS.arrivee} mots[^\\n]*${lieu.id}`));
    expect(a).toMatch(new RegExp(`1 réponses de PNJ sur [0-9]+ font moins de ${TEXTES_SECS.reponse} mots[^\\n]*${pnj.id}:${pnj.sujets[0]!.id}`));
    expect(a).toMatch(new RegExp(`1 introductions de rencontre sur [0-9]+ font moins de ${TEXTES_SECS.introRencontre} mots[^\\n]*${rencontre.id}`));
  });

  it('un texte tout juste au seuil n’est pas signalé, et jamais en erreur', () => {
    const dm = monde();
    const lieu = [...dm.lieux.values()].find((l) => l.arrivee)!;
    lieu.arrivee = texte(TEXTES_SECS.arrivee);
    expect(secs(dm)).toEqual([]);
    expect(validerMonde(dm, srd).erreurs).toEqual([]);
  });
});
