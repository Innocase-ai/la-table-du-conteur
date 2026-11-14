// Faire coûter l'échec sans tuer (effets `blessure` et `temps`) et l'horloge de La Marche d'Ombrefiel (jauge « L'Échéance »).
// Décision du 14/11/2026 après l'audit de rythme et d'enjeux (`docs/AUDIT-RYTHME-ET-ENJEUX.md`).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, etatInitial, groupeConseille, nouvellePartie, personnageDepuisFiche, validerMonde, type DonneesMonde, type Personnage } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { EffetMonde } from '../src/monde/schemas';
import { avancerHeures, issueRencontre, jouerEffets, type PartieMonde } from '../src/monde/exploration';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();

function marche(): DonneesMonde {
  const r = chargerMonde(join(RACINE_MONDES, 'marche-d-ombrefiel'));
  if (!r.ok) throw new Error('monde illisible');
  return r.monde;
}

function groupe(): Personnage[] {
  return groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
}

/** Une partie de la Marche ; `gen` donne les dés (0 = toujours le plus bas : tous les jets ratent, les dégâts valent 1). */
function partie(gen: () => number = () => 0.5): PartieMonde {
  const dm = marche();
  return nouvellePartie(dm, etatInitial(dm), groupe(), gen);
}

describe('effet blessure', () => {
  it('blesse un seul héros vivant, d’au plus la valeur des dés', () => {
    for (const graine of [0.05, 0.3, 0.6, 0.95]) {
      const p = partie(() => graine);
      const avant = p.groupe.map((h) => h.pv);
      const r = jouerEffets(p, [], [{ blessure: { des: '1d4', cible: 'un' } }]);
      const pertes = p.groupe.map((h, i) => avant[i]! - h.pv);
      expect(pertes.filter((x) => x > 0)).toHaveLength(1);
      expect(Math.max(...pertes)).toBeGreaterThanOrEqual(1);
      expect(Math.max(...pertes)).toBeLessThanOrEqual(4);
      expect(r.constats.some((c) => c.includes('est blessé : −'))).toBe(true);
    }
  });

  it('blesse tout le groupe avec « tous »', () => {
    const p = partie();
    const avant = p.groupe.map((h) => h.pv);
    jouerEffets(p, [], [{ blessure: { des: '1d4', cible: 'tous' } }]);
    p.groupe.forEach((h, i) => expect(h.pv).toBeLessThan(avant[i]!));
  });

  it('ne tue jamais : les PV s’arrêtent à 1', () => {
    const p = partie();
    for (const h of p.groupe) h.pv = 2;
    const r = jouerEffets(p, [], [{ blessure: { des: '10d10', cible: 'tous' } }]);
    for (const h of p.groupe) expect(h.pv).toBe(1);
    expect(r.constats.filter((c) => c.includes('est blessé : −1 PV')).length).toBe(p.groupe.length);
    // Un héros déjà à 1 PV est « secoué » : aucun point de plus perdu.
    const r2 = jouerEffets(p, [], [{ blessure: { des: '1d6', cible: 'tous' } }]);
    for (const h of p.groupe) expect(h.pv).toBe(1);
    expect(r2.constats.every((c) => c.includes('secoué'))).toBe(true);
  });

  it('épargne un héros déjà à terre', () => {
    const p = partie();
    p.groupe[0]!.pv = 0;
    jouerEffets(p, [], [{ blessure: { des: '1d4', cible: 'tous' } }]);
    expect(p.groupe[0]!.pv).toBe(0);
  });

  it('est déterministe : mêmes dés, même blessé', () => {
    const a = partie(() => 0.42);
    const b = partie(() => 0.42);
    jouerEffets(a, [], [{ blessure: { des: '2d6', cible: 'un' } }]);
    jouerEffets(b, [], [{ blessure: { des: '2d6', cible: 'un' } }]);
    expect(a.groupe.map((h) => h.pv)).toEqual(b.groupe.map((h) => h.pv));
  });
});

describe('effet temps', () => {
  it('fait avancer l’heure, et passer minuit fait changer le jour', () => {
    const p = partie();
    jouerEffets(p, [], [{ temps: 0.5 }]);
    expect(p.etat.heure).toBe(8.5);
    expect(p.etat.jour).toBe(1);
    const r = jouerEffets(p, [], [{ temps: 20 }]);
    expect(p.etat.jour).toBe(2);
    expect(p.etat.heure).toBeCloseTo(4.5, 5);
    expect(r.constats.some((c) => c.includes('Le temps passe : 20 h'))).toBe(true);
  });

  it('raconte une durée courte en minutes', () => {
    const r = jouerEffets(partie(), [], [{ temps: 0.25 }]);
    expect(r.constats).toContain('Le temps passe : 15 minutes.');
  });
});

describe('format des effets', () => {
  it('accepte des dés et des heures valides', () => {
    expect(EffetMonde.safeParse({ blessure: { des: '1d4' } }).success).toBe(true);
    expect(EffetMonde.safeParse({ blessure: { des: '2d6+1', cible: 'tous' } }).success).toBe(true);
    expect(EffetMonde.safeParse({ temps: 0.5 }).success).toBe(true);
  });
  it('refuse des dés mal écrits, une cible inconnue, un temps nul ou de plus d’un jour', () => {
    expect(EffetMonde.safeParse({ blessure: { des: 'beaucoup' } }).success).toBe(false);
    expect(EffetMonde.safeParse({ blessure: { des: '1d4', cible: 'deux' } }).success).toBe(false);
    expect(EffetMonde.safeParse({ temps: 0 }).success).toBe(false);
    expect(EffetMonde.safeParse({ temps: 30 }).success).toBe(false);
  });
});

describe('La Marche : l’échec coûte', () => {
  it('rater la palissade fait mal (une blessure), en plus du combat qui s’engage', () => {
    const p = partie(() => 0);
    const avant = p.groupe.map((h) => h.pv);
    const r = issueRencontre(p, 'ald-r-keldan-au-perron', { type: 'alternative', id: 'contourner-par-la-palissade' });
    expect(r.ok).toBe(false);
    expect(r.combat).toBe('ald-r-keldan-au-perron');
    expect(p.groupe.map((h, i) => avant[i]! - h.pv).reduce((s, x) => s + x, 0)).toBe(1);
    expect(r.constats.some((c) => c.includes('est blessé'))).toBe(true);
  });

  it('écouter un bavard sans le convaincre fait perdre une demi-heure', () => {
    const p = partie(() => 0);
    issueRencontre(p, 'ald-r-barnabe', { type: 'alternative', id: 'econduire' });
    expect(p.etat.heure).toBe(8.5);
  });

  it('une réussite ne coûte rien', () => {
    const p = partie(() => 0.99);
    const avant = p.groupe.map((h) => h.pv);
    issueRencontre(p, 'ald-r-keldan-au-perron', { type: 'alternative', id: 'contourner-par-la-palissade' });
    expect(p.groupe.map((h) => h.pv)).toEqual(avant);
    expect(p.etat.heure).toBe(8);
  });
});

describe('La Marche : l’Échéance', () => {
  it('le monde reste valide, avec une jauge qui monte et deux moyens de la freiner', () => {
    const dm = marche();
    const j = dm.jauges.get('echeance')!;
    expect(j).toMatchObject({ min: 0, max: 10, initial: 0 });
    expect(j.paliers.map((x) => x.seuil)).toEqual([2, 4, 7, 10]);
    expect(validerMonde(dm, srd).erreurs).toEqual([]);
    const freins = [...dm.quetes.values()].filter((q) => q.recompenses.effets.some((e) => 'jauge' in e && e.jauge.id === 'echeance' && e.jauge.delta < 0));
    expect(freins.map((q) => q.id).sort()).toEqual(['q-l-ombre-de-la-griffe', 'q-la-securite-du-relais']);
  });

  it('monte d’un point par jour et déclenche ses paliers dans l’ordre, chacun une fois', () => {
    const p = partie();
    const r1 = jouerEffets(p, [], [{ temps: 24 }]);
    expect(p.etat.jauges['echeance']).toBe(1);
    expect(r1.narrations.some((n) => n.includes('premiers') || n.includes('barrages'))).toBe(false);
    const r2 = jouerEffets(p, [], [{ temps: 24 }]);
    expect(p.etat.jauges['echeance']).toBe(2);
    expect(r2.narrations.some((n) => n.includes('Le Conseil des Pairs doit siéger'))).toBe(true);
    expect(p.etat.flags['echeance-2']).toBe(true);
    jouerEffets(p, [], [{ temps: 48 }]);
    expect(p.etat.jauges['echeance']).toBe(4);
    expect(p.etat.flags['echeance-4']).toBe(true);
    // Un palier ne se rejoue pas.
    const avantOr = p.etat.pieces;
    jouerEffets(p, [], [{ jauge: { id: 'echeance', delta: -1 } }, { jauge: { id: 'echeance', delta: 1 } }]);
    expect(p.etat.pieces).toBe(avantOr);
  });

  it('l’alerte orange coûte un péage, jamais plus que la bourse', () => {
    const p = partie();
    p.etat.pieces = 12;
    jouerEffets(p, [], [{ temps: 96 }]);
    expect(p.etat.pieces).toBe(7);
    p.etat.pieces = 3;
    jouerEffets(p, [], [{ temps: 72 }]);
    expect(p.etat.pieces).toBe(0);
  });

  it('une nuit de repos fait avancer la jauge comme un jour qui passe', () => {
    const p = partie();
    avancerHeures(p, { ok: true, jets: [], constats: [], revele: [], narrations: [] }, 30);
    expect(p.etat.jauges['echeance']).toBe(1);
  });

  it('un joueur qui libère le relais gagne un jour', () => {
    const p = partie();
    jouerEffets(p, [], [{ temps: 72 }]);
    expect(p.etat.jauges['echeance']).toBe(3);
    jouerEffets(p, [], [{ jauge: { id: 'echeance', delta: -1 } }]);
    expect(p.etat.jauges['echeance']).toBe(2);
  });
});
