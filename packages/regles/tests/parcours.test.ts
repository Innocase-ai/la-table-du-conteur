import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { avancement, cleEtat, creerMoteur, explorerParcours, groupeDeTest, MODULES_STANDARD, rejouer, type DonneesMonde, type Partie } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const MINI = join(import.meta.dirname, 'fixtures/mini-monde');

function charger(dossier: string): DonneesMonde {
  const r = chargerMonde(dossier);
  if (!r.ok) throw new Error(r.erreurs.map((e) => `${e.fichier}: ${e.message}`).join('\n'));
  return r.monde;
}

/** Le mini-monde avec une façon d'obtenir le croc et de le remettre : la fin « paix » devient possible. */
function miniJouable(): DonneesMonde {
  const dm = charger(MINI);
  dm.pnj.get('bertrand')!.sujets[0]!.effets.push({ objet: { id: 'croc-de-loup' } }, { flag: 'croc-remis' });
  return dm;
}

function partieDeDepart(dm: DonneesMonde): { partie: Partie; moteur: ReturnType<typeof creerMoteur> } {
  const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
  const partie = moteur.executer(moteur.nouvellePartie(groupeDeTest(srd), { graine: 21, niveau: 1 }), { type: 'commencer' }).partie;
  return { partie, moteur };
}

describe('identité d’un état', () => {
  it('ne dépend ni de l’ordre des clés, ni du journal, ni des points de vie', () => {
    const { partie } = partieDeDepart(charger(MINI));
    const a = structuredClone(partie);
    a.etat.flags = { x: true, y: true };
    const b = structuredClone(partie);
    b.etat.flags = { y: true, x: true };
    b.journal = [{ type: 'constat', texte: 'bruit' }];
    b.groupe[0]!.pv = 1;
    b.etat.xp = 999;
    b.etat.narrations = ['quelque chose'];
    expect(cleEtat(a)).toBe(cleEtat(b));
  });

  it('change quand un fait, un objet, un lieu ou un drapeau change', () => {
    const { partie } = partieDeDepart(charger(MINI));
    const cle = cleEtat(partie);
    const modifier = (f: (p: Partie) => void) => {
      const p = structuredClone(partie);
      f(p);
      return cleEtat(p);
    };
    expect(modifier((p) => p.etat.faits.push('f-x'))).not.toBe(cle);
    expect(modifier((p) => (p.etat.inventaire['croc'] = 1))).not.toBe(cle);
    expect(modifier((p) => (p.etat.lieu = 'sentier'))).not.toBe(cle);
    expect(modifier((p) => (p.etat.flags['x'] = true))).not.toBe(cle);
    // Un drapeau remis à faux vaut un drapeau absent.
    expect(modifier((p) => (p.etat.flags['x'] = false))).toBe(cle);
  });
});

describe('avancement vers une condition', () => {
  it('« et » fait la moyenne, « ou » prend la meilleure, une feuille vaut 0 ou 1', () => {
    const { partie } = partieDeDepart(charger(MINI));
    partie.etat.flags['a'] = true;
    expect(avancement({ flag: 'a' }, partie)).toBe(1);
    expect(avancement({ flag: 'b' }, partie)).toBe(0);
    expect(avancement({ et: [{ flag: 'a' }, { flag: 'b' }] }, partie)).toBe(0.5);
    expect(avancement({ ou: [{ flag: 'a' }, { flag: 'b' }] }, partie)).toBe(1);
  });
});

describe('explorer les parcours', () => {
  it('trouve une fin atteignable et rend un parcours qui se rejoue à l’identique', () => {
    const dm = miniJouable();
    const rap = explorerParcours({ dm, srd }, { budgetEtats: 400, graines: [21] });
    expect(rap.arret).toBe('toutes-atteintes');
    expect(rap.finsNonAtteintes).toEqual([]);
    const p = rap.parcours.find((x) => x.fin === 'fin-paix')!;
    expect(p.etapes.length).toBeGreaterThan(0);
    expect(p.etapes.length).toBeLessThan(10);
    // Rejouer les ordres depuis le début mène à la même fin.
    const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
    const r = rejouer(moteur, groupeDeTest(srd), p.graine, p.niveau, p.etapes.map((e) => e.ordre));
    expect(r.refus).toBeUndefined();
    expect(r.partie.etat.fin).toBe('fin-paix');
  });

  it('une fin que rien ne produit n’est pas atteinte, et le rapport le dit', () => {
    const dm = charger(MINI); // le croc et le drapeau de remise ne sont donnés par personne
    const rap = explorerParcours({ dm, srd }, { budgetEtats: 300, graines: [21] });
    expect(rap.finsNonAtteintes).toEqual(['fin-paix']);
    expect(rap.parcours).toEqual([]);
    expect(['epuise', 'budget']).toContain(rap.arret);
    expect(rap.couverture.fins).toEqual({ vus: [], jamais: ['fin-paix'] });
    expect(rap.hypotheses.length).toBeGreaterThan(0);
  });

  it('couvre les lieux, les PNJ et les faits que le joueur automatique a vus', () => {
    const rap = explorerParcours({ dm: miniJouable(), srd }, { budgetEtats: 200, graines: [21] });
    expect(rap.couverture.lieux.vus).toEqual(expect.arrayContaining(['village', 'auberge', 'sentier']));
    expect(rap.couverture.pnj.vus).toEqual(['bertrand']);
    expect(rap.couverture.faits.vus).toContain('f-loups');
  });

  it('respecte ses budgets : temps nul, ou un petit nombre d’états', () => {
    const dm = charger(MINI);
    expect(explorerParcours({ dm, srd }, { budgetMs: 0, graines: [21] }).arret).toBe('temps');
    const rap = explorerParcours({ dm, srd }, { budgetEtats: 5, graines: [21] });
    expect(rap.etats).toBeLessThanOrEqual(5);
    expect(rap.arret).toBe('budget');
  });

  it('avec « couvrir », la recherche continue après avoir trouvé toutes les fins', () => {
    const dm = miniJouable();
    const court = explorerParcours({ dm, srd }, { budgetEtats: 300, graines: [21] });
    const long = explorerParcours({ dm, srd }, { budgetEtats: 300, graines: [21], couvrir: true });
    expect(court.arret).toBe('toutes-atteintes');
    expect(long.arret).not.toBe('toutes-atteintes');
    expect(long.etats).toBeGreaterThan(court.etats);
    expect(long.parcours.map((p) => p.fin)).toEqual(['fin-paix']);
  });

  it('une demande d’arrêt est suivie', () => {
    const rap = explorerParcours({ dm: charger(MINI), srd }, { budgetEtats: 5000, graines: [21], progres: () => true });
    expect(rap.arret).toBe('arret');
    expect(rap.etats).toBeLessThanOrEqual(200);
  });

  it('un parcours trouvé reste le même d’une exécution à l’autre (déterminisme)', () => {
    const a = explorerParcours({ dm: miniJouable(), srd }, { budgetEtats: 400, graines: [21] });
    const b = explorerParcours({ dm: miniJouable(), srd }, { budgetEtats: 400, graines: [21] });
    expect(b.parcours).toEqual(a.parcours);
  });
});

// Les mondes réels : lent (des dizaines de secondes), donc seulement sur demande : PARCOURS_LENTS=1 pnpm test parcours
// Chaque parcours trouvé est REJOUÉ depuis le début avec un groupe neuf : il doit mener à la même fin (le simulateur ne doit rien inventer).
describe.skipIf(!process.env['PARCOURS_LENTS'])('les mondes réels', () => {
  const MONDES: { id: string; fins: string[]; etats: number }[] = [
    { id: 'dime-des-roseaux', fins: ['fin-echec', 'fin-marche', 'fin-guerre', 'fin-exode'], etats: 3000 },
    { id: 'citadelle-des-marees', fins: ['fin-maree-haute', 'fin-livrer', 'fin-renouer', 'fin-briser', 'fin-relever'], etats: 6000 },
    { id: 'val-des-cendres', fins: ['fin-la-cendre-submerge'], etats: 3000 },
  ];
  it.each(MONDES)('« $id » : les fins attendues sont atteintes et leurs parcours se rejouent', ({ id, fins, etats }) => {
    const dm = charger(join(RACINE_MONDES, id));
    const rap = explorerParcours({ dm, srd }, { budgetEtats: etats, budgetMs: 150_000, graines: [21] });
    const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
    for (const fin of fins) {
      const p = rap.parcours.find((x) => x.fin === fin);
      expect(p, `fin « ${fin} » non atteinte`).toBeDefined();
      const r = rejouer(moteur, groupeDeTest(srd), p!.graine, p!.niveau, p!.etapes.map((e) => e.ordre));
      expect(r.refus, `rejeu de « ${fin} »`).toBeUndefined();
      expect(r.partie.etat.fin, `rejeu de « ${fin} »`).toBe(fin);
    }
  }, 200_000);
});
