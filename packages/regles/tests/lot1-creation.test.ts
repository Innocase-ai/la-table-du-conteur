// Lot 1 des corrections de fond (docs/FICHES-LOT-1.md, 18/11/2026), partie création d'histoire du côté du moteur de monde.
// Groupe 2 : C2 (avis sur le `lieu` d'une quête), C4 (estimation à l'échelle d'un épisode, longueur des arrivées).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chargerDonneesSrd } from '../src/donnees-node';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { estimerCampagne, RYTHME } from '../src/monde/estimation';
import type { DonneesMonde } from '../src/monde/schemas';
import { savoirsDe } from '../src/monde/savoirs-donnees';
import { validerMonde, ARRIVEE_MOTS } from '../src/monde/validation';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
function monde(id: string, racine = RACINE_MONDES): DonneesMonde {
  const r = chargerMonde(join(racine, id));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  return r.monde;
}
const avis = (dm: DonneesMonde) => validerMonde(dm, srd).avertissements;
const mots = (n: number) => Array.from({ length: n }, (_, i) => `mot${i}`).join(' ');

describe('C2 : le `lieu` d’une quête est le lieu où elle est confiée', () => {
  const dm = () => monde('dime-des-roseaux');
  const avisLieu = (d: DonneesMonde, quete: string) => avis(d).filter((a) => a.includes(`Quête « ${quete} »`) && a.includes('lieu du donneur'));
  const quete = (d: DonneesMonde) => [...d.quetes.values()].find((q) => q.donneur && d.pnj.get(q.donneur)?.presences.length)!;

  it('un lieu qui n’est ni celui du donneur ni une de ses présences est signalé', () => {
    const d = dm();
    const q = quete(d);
    const donneur = d.pnj.get(q.donneur!)!;
    q.lieu = donneur.lieu;
    expect(avisLieu(d, q.id)).toEqual([]);
    q.lieu = [...d.lieux.keys()].find((id) => id !== donneur.lieu && !donneur.presences.some((p) => p.lieu === id))!;
    const a = avisLieu(d, q.id);
    expect(a).toHaveLength(1);
    expect(a[0]).toContain(`« ${q.lieu} »`);
    expect(a[0]).toContain(`« ${donneur.lieu} »`);
  });

  it('une présence du donneur convient', () => {
    const d = dm();
    const q = quete(d);
    q.lieu = d.pnj.get(q.donneur!)!.presences[0]!.lieu;
    expect(avisLieu(d, q.id)).toEqual([]);
  });

  it('sans `lieu` ou sans donneur, aucun avis', () => {
    const d = dm();
    const q = quete(d);
    delete q.lieu;
    expect(avisLieu(d, q.id)).toEqual([]);
    q.lieu = [...d.lieux.keys()][0]!;
    delete q.donneur;
    expect(avisLieu(d, q.id)).toEqual([]);
  });
});

describe('C4 : l’estimation à l’échelle d’un épisode', () => {
  const reels = ['marche-d-ombrefiel', 'dime-des-roseaux', 'tombe-des-rois-serpents', 'le-medaillon-de-la-soeur-endormie'];

  it('le total est la somme de ses parties, à la demi-heure (au quart d’heure sous 2 h)', () => {
    for (const id of reels) {
      const h = estimerCampagne(monde(id)).heures;
      expect(h.total, id).toBe(Number((h.recit + h.combats).toFixed(2)));
      const pas = h.total < 2 ? 0.25 : 0.5;
      expect((h.total / pas) % 1, id).toBe(0);
    }
  });

  it('un monde minuscule : le total est au quart d’heure, jamais 0 quand il y a de quoi jouer', () => {
    const d = monde('le-medaillon-de-la-soeur-endormie');
    for (const k of ['pnj', 'rencontres', 'enigmes', 'pieges', 'tresors', 'quetes', 'evenements'] as const) (d[k] as Map<string, unknown>).clear();
    delete d.extensions;
    const h = estimerCampagne(d).heures;
    expect(h.total).toBeLessThan(2);
    expect(h.total).toBeGreaterThan(0);
    expect(h.total).toBe(Number((h.recit + h.combats).toFixed(2)));
    expect((h.total / 0.25) % 1).toBe(0);
  });

  it('chaque PNJ qui a une fiche de savoir ajoute des tours de conteur (la conversation libre est payante)', () => {
    const avec = monde('tombe-des-rois-serpents');
    const fiches = new Set(savoirsDe(avec).savoirs.map((s) => s.pnj).filter((p) => avec.pnj.has(p))).size;
    expect(fiches).toBeGreaterThan(10);
    const sans = monde('tombe-des-rois-serpents');
    delete sans.extensions!['savoirs'];
    const [a, s] = [estimerCampagne(avec), estimerCampagne(sans)];
    expect(a.toursConteur - s.toursConteur).toBe(Math.round(fiches * RYTHME.savoir.tours * RYTHME.savoir.conteur * (1 + RYTHME.marge)));
    expect(a.tours).toBeGreaterThan(s.tours);
    expect(a.couts[0]!.usd).toBeGreaterThan(s.couts[0]!.usd);
  });
});

describe('C4 : une seule cible de longueur pour les arrivées (130 à 170 mots, décision D6)', () => {
  const dm = () => monde('port-sillage', MONDES_ESSAI);
  const horsLongueur = (d: DonneesMonde) => avis(d).filter((a) => a.startsWith('Arrivée :') && a.includes('hors de'));

  it('l’avis « hors de » dit la même fourchette que celle qu’il applique, autour de la cible', () => {
    expect(ARRIVEE_MOTS).toEqual({ min: 40, max: 200 });
    const d = dm();
    const l = [...d.lieux.values()].find((x) => x.arrivee)!;
    l.arrivee = mots(150);
    expect(horsLongueur(d).some((a) => a.includes(l.id))).toBe(false);
    l.arrivee = mots(210);
    expect(horsLongueur(d).some((a) => a.includes(l.id))).toBe(true);
  });
});
