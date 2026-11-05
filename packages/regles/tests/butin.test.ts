import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, groupeConseille, personnageDepuisFiche } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { etatInitial } from '../src/monde/etat';
import { issueRencontre, nouvellePartie } from '../src/monde/exploration';
import { validerMonde } from '../src/monde/validation';
import type { DonneesMonde } from '../src/monde/schemas';

const srd = chargerDonneesSrd();
const lire = (id: string): DonneesMonde => {
  const r = chargerMonde(join(RACINE_MONDES, id));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  return r.monde;
};
const val = lire('val-des-cendres');
const groupe = () =>
  groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });

/** Le lieu où une rencontre se joue (le lieu qui la déclare). */
const lieuDe = (dm: DonneesMonde, rencontre: string) => [...dm.lieux.values()].find((l) => l.rencontres.some((x) => x.id === rencontre))?.id;

function gagner(dm: DonneesMonde, rencontre: string) {
  const p = nouvellePartie(dm, etatInitial(dm), groupe(), () => 0.5);
  p.etat.lieu = lieuDe(dm, rencontre)!;
  const r = issueRencontre(p, rencontre, { type: 'victoire', px: 100 });
  return { p, r };
}

describe('butin fixe d’une victoire (butin.tresors)', () => {
  it('la réserve de l’ennemi, ici même et sans verrou ni piège, est prise aussitôt', () => {
    const paire = [...val.rencontres.values()].flatMap((r) =>
      r.butin.tresors.map((t) => ({ r, t: val.tresors.get(t)! })).filter(({ t }) => t && !t.acces.verrou && !t.acces.piege && t.lieu === lieuDe(val, r.id) && (!t.gardien || t.gardien === r.id) && !t.condition),
    )[0];
    expect(paire, 'une rencontre à réserve libre existe').toBeDefined();
    const { p, r } = gagner(val, paire!.r.id);
    expect(p.etat.exploration.tresorsPris).toContain(paire!.t.id);
    expect(r.constats.some((c) => c.startsWith(`Dans ${paire!.t.nom}`))).toBe(true);
  });

  it('une réserve fermée ou piégée est seulement révélée, pas ouverte', () => {
    const paire = [...val.rencontres.values()].flatMap((r) =>
      r.butin.tresors.map((t) => ({ r, t: val.tresors.get(t)! })).filter(({ t }) => t && (t.acces.verrou || t.acces.piege) && t.lieu === lieuDe(val, r.id) && (!t.gardien || t.gardien === r.id) && !t.condition),
    )[0];
    expect(paire, 'une rencontre à réserve fermée existe').toBeDefined();
    const { p, r } = gagner(val, paire!.r.id);
    expect(p.etat.exploration.tresorsPris).not.toContain(paire!.t.id);
    expect(r.constats).toContain(`Vous remarquez : ${paire!.t.nom}.`);
    if (paire!.t.acces.cache) expect(p.etat.exploration.decouverts).toContain(`tresor:${paire!.t.id}`);
  });

  it('une victoire tire aussi la table de butin et la verse au sac', () => {
    const rc = [...val.rencontres.values()].find((x) => x.id === 'gue-rixe-de-la-taverne')!;
    expect(rc.butin.tables.length).toBeGreaterThan(0);
    const { p, r } = gagner(val, rc.id);
    expect(r.constats.some((c) => c.startsWith('Butin :'))).toBe(true);
    expect(p.etat.rencontresFaites).toContain(rc.id);
  });
});

describe('avis « Butin » du validateur', () => {
  it('signale un combat qui ne rapporte que des PX, pas un combat qui a une table ou une réserve', () => {
    const vide = new Map(val.rencontres);
    const cible = [...val.rencontres.values()].find((r) => r.type === 'combat' && r.butin.tables.length)!;
    vide.set(cible.id, { ...cible, butin: { tables: [], tresors: [] } });
    const gardes = new Map([...val.tresors].map(([id, t]) => [id, t.gardien === cible.id ? { ...t, gardien: undefined } : t]));
    const avis = validerMonde({ ...val, rencontres: vide, tresors: gardes }, srd).avertissements.join('\n');
    expect(avis).toMatch(new RegExp(`Butin : \\d+ combat\\(s\\) ne rapportent que des PX \\(.*${cible.id}`));
    expect(validerMonde(val, srd).avertissements.join('\n')).not.toMatch(/Butin : /);
  });

  it('les deux mondes livrés n’ont plus de combat sans butin', () => {
    for (const id of ['val-des-cendres', 'citadelle-des-marees']) {
      const dm = lire(id);
      const avis = validerMonde(dm, srd).avertissements.filter((a) => a.startsWith('Butin :'));
      expect(avis, id).toEqual([]);
    }
  });
});
