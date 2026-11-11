// Correctifs de l'audit des conversations (docs/AUDIT-DIALOGUES-PNJ.md) : un sujet reposé ne rapporte qu'une fois (M1), les
// présences d'un PNJ remplacent son lieu habituel (M2), le délai d'influence est propre à chaque secret (M3), un secret à prix
// ne coûte que s'il est obtenu (M4). M5 (délai après un succès) est dans exploration.test.ts.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { attenteInfluence, bilanPersonnage, etatInitial, groupeConseille, influencer, parler, personnageDepuisFiche, pnjPresents, type DonneesMonde } from '../src';
import { nouvellePartie, type PartieMonde } from '../src/monde/exploration';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const BREGOR = 'bregor-le-borgne';
const COMPTOIR = 'ald-auberge-comptoir-et-cellier';
const SALLE = 'ald-auberge-salle-commune';
const SUCCES = () => 0.999;
const ECHEC = () => 0;

function marche(): DonneesMonde {
  const r = chargerMonde(join(RACINE_MONDES, 'marche-d-ombrefiel'));
  if (!r.ok) throw new Error('monde illisible');
  return r.monde;
}

function partie(dm: DonneesMonde, gen = SUCCES, heure = 10): PartieMonde {
  const groupe = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  const etat = etatInitial(dm);
  etat.lieu = COMPTOIR;
  etat.heure = heure;
  etat.pieces = 100;
  return nouvellePartie(dm, etat, groupe, gen);
}

describe('M1 : un sujet reposé ne rapporte qu’une fois', () => {
  it('attitude, or et PX ne se cumulent pas ; drapeaux et faits restent posés', () => {
    const dm = marche();
    const bregor = dm.pnj.get(BREGOR)!;
    const p = partie(dm);
    const sujet = bregor.sujets.find((s) => !s.condition && !s.attitudeMin)!;
    sujet.unique = false;
    sujet.effets = [{ attitude: { pnj: BREGOR, delta: 15 } }, { pieces: 5 }, { xp: 20 }, { flag: 'test-rejoint' }];
    const [att, po, xp] = [p.etat.attitudes[BREGOR] ?? bregor.attitude, p.etat.pieces, p.etat.xp];
    for (let i = 0; i < 4; i++) expect(parler(p, BREGOR, sujet.id).ok).toBe(true);
    expect(p.etat.attitudes[BREGOR]).toBe(att + 15);
    expect(p.etat.pieces).toBe(po + 5);
    expect(p.etat.xp).toBe(xp + 20);
    expect(p.etat.flags['test-rejoint']).toBe(true);
  });
});

describe('M2 : les présences remplacent le lieu habituel', () => {
  it('Brégor est au comptoir le jour, en salle commune le soir, jamais aux deux', () => {
    const dm = marche();
    const ou = (heure: number) => {
      const p = partie(dm, SUCCES, heure);
      const ici = (lieu: string) => ((p.etat.lieu = lieu), pnjPresents(p).some((n) => n.id === BREGOR));
      return { comptoir: ici(COMPTOIR), salle: ici(SALLE) };
    };
    expect(ou(10)).toEqual({ comptoir: true, salle: false });
    expect(ou(19)).toEqual({ comptoir: false, salle: true });
    expect(ou(23)).toEqual({ comptoir: true, salle: false }); // la nuit : pas de présence déclarée, il est chez lui
  });

  it('un PNJ déplacé par l’histoire n’est plus que là où on l’a mis, à toute heure', () => {
    const dm = marche();
    const p = partie(dm, SUCCES, 19);
    p.etat.pnjLieux[BREGOR] = 'ald-carrefour-d-aldric';
    for (const lieu of [COMPTOIR, SALLE]) {
      p.etat.lieu = lieu;
      expect(pnjPresents(p).some((n) => n.id === BREGOR)).toBe(false);
    }
    p.etat.lieu = 'ald-carrefour-d-aldric';
    expect(pnjPresents(p).some((n) => n.id === BREGOR)).toBe(true);
  });
});

describe('M3 et M4 : secrets', () => {
  function avecSecrets(dm: DonneesMonde) {
    const bregor = dm.pnj.get(BREGOR)!;
    bregor.secrets = [
      { fait: 'test-secret-a' },
      { fait: 'test-secret-b' },
      { fait: 'test-secret-paye', prix: 20 },
      { fait: 'test-secret-paye-jet', prix: 20, jet: { competence: 'persuasion', dd: 15 } },
    ];
  }

  it('rater un secret ne ferme ni les autres secrets ni la persuasion simple', () => {
    const dm = marche();
    avecSecrets(dm);
    const p = partie(dm, ECHEC);
    expect(influencer(p, BREGOR, 'persuasion', { secret: 'test-secret-a' }).jets).toHaveLength(1);
    expect(attenteInfluence(p, BREGOR, 'persuasion', 'test-secret-a')).toBe(24);
    expect(influencer(p, BREGOR, 'persuasion', { secret: 'test-secret-a' }).ok).toBe(false);
    expect(attenteInfluence(p, BREGOR, 'persuasion', 'test-secret-b')).toBe(0);
    expect(attenteInfluence(p, BREGOR, 'persuasion')).toBe(0);
    p.gen = SUCCES;
    expect(influencer(p, BREGOR, 'persuasion', { secret: 'test-secret-b' }).ok).toBe(true);
    expect(p.etat.faits).toContain('test-secret-b');
  });

  it('un secret à prix sans jet s’achète : l’or suffit, sans jet', () => {
    const dm = marche();
    avecSecrets(dm);
    const p = partie(dm, ECHEC);
    const r = influencer(p, BREGOR, 'persuasion', { secret: 'test-secret-paye' });
    expect(r.jets).toHaveLength(0);
    expect(p.etat.pieces).toBe(80);
    expect(p.etat.faits).toContain('test-secret-paye');
  });

  it('un secret à prix avec un jet ne coûte rien si le jet rate, et se paie s’il réussit', () => {
    const dm = marche();
    avecSecrets(dm);
    const p = partie(dm, ECHEC);
    influencer(p, BREGOR, 'persuasion', { secret: 'test-secret-paye-jet' });
    expect(p.etat.pieces).toBe(100);
    expect(p.etat.faits).not.toContain('test-secret-paye-jet');
    p.etat.jour += 1;
    p.gen = SUCCES;
    influencer(p, BREGOR, 'persuasion', { secret: 'test-secret-paye-jet' });
    expect(p.etat.pieces).toBe(80);
    expect(p.etat.faits).toContain('test-secret-paye-jet');
  });
});
