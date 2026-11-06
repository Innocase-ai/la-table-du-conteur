import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, groupeConseille, personnageDepuisFiche } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { etatInitial } from '../src/monde/etat';
import { issueRencontre, nouvellePartie } from '../src/monde/exploration';
import { validerMonde } from '../src/monde/validation';
import { bourseSelonFp, familleDe, tirerDepouilles, valeurFp } from '../src/monde/depouilles';
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
  const p = { ...nouvellePartie(dm, etatInitial(dm), groupe(), () => 0.5), srd };
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
    vide.set(cible.id, { ...cible, butin: { tables: [], tresors: [], depouilles: false } });
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

describe('dépouilles automatiques selon la nature des adversaires', () => {
  it('range les types SRD en familles et met la bourse à l’échelle du FP', () => {
    expect(familleDe('Humanoïde')).toBe('porteur');
    expect(familleDe('Fée (Gobelinoïde)')).toBe('porteur');
    expect(familleDe('Fiélon')).toBe('porteur');
    expect(familleDe('Mort-vivant')).toBe('mort-vivant');
    expect(familleDe('Bête')).toBe('bete');
    expect(familleDe('Artificiel')).toBe('artificiel');
    expect(familleDe('Géant')).toBe('geant');
    expect(valeurFp('1/8')).toBe(0.125);
    expect(valeurFp('3')).toBe(3);
    expect(bourseSelonFp(0.125)).toEqual({ des: '1d4', unite: 'pa' });
    expect(bourseSelonFp(2)).toEqual({ des: '2d6', unite: 'po' });
    expect(bourseSelonFp(7)).toEqual({ des: '6d6', unite: 'po' });
  });

  it('un humanoïde porte une bourse, une bête presque rien, un artificiel rien de sûr', () => {
    const toujours = () => 0; // tous les tirages réussissent
    const bandits = tirerDepouilles(srd, [{ profil: 'bandit', nombre: 4 }], toujours);
    expect(bandits.pieces).toBeGreaterThan(0);
    expect(bandits.objets['rations']).toBe(4);
    const rats = tirerDepouilles(srd, [{ profil: 'rat-geant', nombre: 3 }], toujours);
    expect(rats.pieces).toBe(0);
    expect(Object.keys(rats.objets)).toEqual(['rations']);
    const jamais = () => 0.999;
    expect(tirerDepouilles(srd, [{ profil: 'bandit', nombre: 4 }, { profil: 'armure-animee', nombre: 3 }], jamais)).toEqual({ pieces: 0, objets: {} });
    expect(tirerDepouilles(srd, [{ profil: 'inconnu', nombre: 2 }], toujours)).toEqual({ pieces: 0, objets: {} });
  });

  it('un chef porte plus qu’un sbire (bourse selon le FP)', () => {
    const toujours = () => 0.5;
    const sbire = tirerDepouilles(srd, [{ profil: 'sbire-gobelin', nombre: 1 }], toujours).pieces;
    const capitaine = tirerDepouilles(srd, [{ profil: 'capitaine-hobgobelin', nombre: 1 }], toujours).pieces;
    expect(capitaine).toBeGreaterThan(sbire);
  });

  it('une victoire verse les dépouilles au groupe et les annonce ; depouilles: false les supprime', () => {
    const rc = [...val.rencontres.values()].find((x) => x.monstres.some((m) => m.profil === 'bandit'))!;
    const { p, r } = gagner(val, rc.id);
    expect(r.constats.some((c) => c.startsWith('Dépouilles :'))).toBe(true);
    expect(p.etat.pieces).toBeGreaterThan(0);
    const sans = new Map(val.rencontres);
    sans.set(rc.id, { ...rc, butin: { ...rc.butin, depouilles: false } });
    expect(gagner({ ...val, rencontres: sans }, rc.id).r.constats.some((c) => c.startsWith('Dépouilles :'))).toBe(false);
  });
});
