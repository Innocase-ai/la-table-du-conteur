// Lot 2, étape A : le parcours automatique re-prouve les fins de la Tombe avec le passage des racines à sens unique (D4). Il cherche d'abord par
// la recherche guidée, puis, si elle ne suffit pas, par un « squelette » (des paliers vers le progrès le plus proche) dont la recherche repart ;
// et sa clé d'état ne compte plus le bruit des conversations. Avant : 540 s, 7 530 états, aucune des 4 fins ; 30 000 états : 4 Go de mémoire saturés.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cleRecherche, creerMoteur, explorerParcours, groupeDeTest, MODULES_STANDARD, pertinenceDe, atomesAEviter, rejouer, type DonneesMonde, type Partie } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const MINI = join(import.meta.dirname, 'fixtures/mini-monde');

function charger(dossier: string): DonneesMonde {
  const r = chargerMonde(dossier);
  if (!r.ok) throw new Error(r.erreurs.map((e) => `${e.fichier}: ${e.message}`).join('\n'));
  return r.monde;
}
function miniJouable(): DonneesMonde {
  const dm = charger(MINI);
  dm.pnj.get('bertrand')!.sujets[0]!.effets.push({ objet: { id: 'croc-de-loup' } }, { flag: 'croc-remis' });
  return dm;
}
function depart(dm: DonneesMonde): Partie {
  const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
  return moteur.executer(moteur.nouvellePartie(groupeDeTest(srd), { graine: 21, niveau: 1 }), { type: 'commencer' }).partie;
}

describe('la clé de recherche ne compte pas le bruit', () => {
  const dm = miniJouable();
  // Un sujet sans effet ni fait, et un sujet qui a un effet : seul le second change l'état.
  dm.pnj.get('bertrand')!.sujets.push({ id: 'bavardage', mots: ['temps'], reponse: 'Il neige.', variantes: [], revele: [], effets: [], unique: false });
  const pert = pertinenceDe(dm);
  const base = depart(dm);
  const cle = (modif: (p: Partie) => void) => {
    const p = structuredClone(base);
    modif(p);
    return cleRecherche(p, pert);
  };

  it('un sujet sans effet ne fait pas un état de plus ; un sujet qui a un effet, oui', () => {
    expect(cle((p) => p.etat.exploration.sujetsVus.push('bertrand:bavardage'))).toBe(cle(() => {}));
    expect(cle((p) => p.etat.exploration.sujetsVus.push('bertrand:loups'))).not.toBe(cle(() => {}));
  });

  it('la mémoire du tirage d’arrivée, les interjections et les dates d’influence ne comptent pas ; qui a été influencé, si', () => {
    expect(cle((p) => ((p.etat.exploration as { hasard?: unknown }).hasard = { grotte: { vecu: [1, 2] } }))).toBe(cle(() => {}));
    expect(cle((p) => ((p.modules['interjections'] as unknown) = { dites: ['a', 'b'] }))).toBe(cle(() => {}));
    expect(cle((p) => (p.etat.exploration.influenceRatee = { 'bertrand:persuasion': 100 }))).toBe(cle((p) => (p.etat.exploration.influenceRatee = { 'bertrand:persuasion': 131 })));
    expect(cle((p) => (p.etat.exploration.influenceRatee = { 'bertrand:persuasion': 100 }))).not.toBe(cle(() => {}));
  });

  it('une attitude est rangée par tranche entre les seuils que le monde lit : 12 et 15 se valent, 12 et 25 non', () => {
    const lit = miniJouable();
    lit.pnj.get('bertrand')!.sujets[0]!.attitudeMin = 20;
    const p2 = pertinenceDe(lit);
    const avec = (v: number) => {
      const p = structuredClone(base);
      p.etat.attitudes['bertrand'] = v;
      return cleRecherche(p, p2);
    };
    expect(avec(12)).toBe(avec(15));
    expect(avec(12)).not.toBe(avec(25));
    // Sans aucun seuil, l'attitude ne change rien.
    const sans = (v: number) => cle((p) => (p.etat.attitudes['bertrand'] = v));
    expect(sans(-40)).toBe(sans(60));
  });

  it('`cleEtat` (l’identité complète) n’a pas changé : elle distingue encore ces états', async () => {
    const { cleEtat } = await import('../src');
    const a = structuredClone(base);
    a.etat.exploration.sujetsVus.push('bertrand:bavardage');
    expect(cleEtat(a)).not.toBe(cleEtat(base));
  });
});

describe('atomes à éviter : ce qu’une condition exige absent', () => {
  it('un drapeau lu sous un « non » n’est pas un progrès à chercher', () => {
    const dm = miniJouable();
    dm.fins.get('fin-paix')!.condition = { et: [dm.fins.get('fin-paix')!.condition, { non: { flag: 'martin-informe' } }, { non: { fait: 'f-secret' } }] };
    const e = atomesAEviter(dm);
    expect(e.has('flag:martin-informe')).toBe(true);
    expect(e.has('fait:f-secret')).toBe(true);
    expect(e.has('flag:croc-remis')).toBe(false);
  });
});

describe('le squelette', () => {
  it('lancé d’emblée sur le mini-monde, il trouve la fin et le parcours se rejoue à l’identique', () => {
    const dm = miniJouable();
    const rap = explorerParcours({ dm, srd }, { trancheAvantSquelette: 0 });
    expect(rap.finsNonAtteintes).toEqual([]);
    const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
    for (const p of rap.parcours) {
      const rejeu = rejouer(moteur, groupeDeTest(srd, p.niveau), p.graine, p.niveau, p.etapes.map((e) => e.ordre));
      expect(rejeu.refus, p.fin).toBeUndefined();
      expect(rejeu.partie.etat.fin ?? (rejeu.partie.scene.type === 'fin' ? rejeu.partie.scene.fin : undefined), p.fin).toBe(p.fin);
    }
  });

  it('sans lui (`squelette: false`), la recherche trouve la même fin : il n’enlève rien', () => {
    const dm = miniJouable();
    const [avec, sans] = [explorerParcours({ dm, srd }, {}), explorerParcours({ dm, srd }, { squelette: false })];
    expect(sans.parcours.map((p) => p.fin).sort()).toEqual(avec.parcours.map((p) => p.fin).sort());
  });

  it('il respecte le budget d’états de la graine', () => {
    const dm = miniJouable();
    for (const budget of [3, 12, 40]) {
      const rap = explorerParcours({ dm, srd }, { budgetEtats: budget, trancheAvantSquelette: 0, graines: [7] });
      expect(rap.etats, `budget ${budget}`).toBeLessThanOrEqual(budget + 1);
    }
  });
});

describe('les histoires publiées : toutes les fins prouvées avec le budget par défaut de `verifier`', () => {
  // Lent (une minute pour la Tombe) : `PARCOURS_LENTS=1`, comme les autres parcours des mondes réels.
  const lent = !process.env['PARCOURS_LENTS'];
  it.skipIf(lent).each([
    ['tombe-des-rois-serpents', 5],
    ['marche-d-ombrefiel', 2],
    ['dime-des-roseaux', 4],
  ] as const)('%s : %i fins', (id, nombre) => {
    const dm = charger(join(RACINE_MONDES, id));
    const rap = explorerParcours({ dm, srd }, { budgetEtats: 6000, budgetMs: 120_000 });
    expect(rap.finsNonAtteintes, `${id} : ${rap.arret}, ${rap.etats} états`).toEqual([]);
    expect(rap.parcours).toHaveLength(nombre);
    const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
    for (const p of rap.parcours) {
      const rejeu = rejouer(moteur, groupeDeTest(srd, p.niveau), p.graine, p.niveau, p.etapes.map((e) => e.ordre));
      expect(rejeu.refus, `${id} / ${p.fin}`).toBeUndefined();
      expect(rejeu.partie.etat.fin ?? (rejeu.partie.scene.type === 'fin' ? rejeu.partie.scene.fin : undefined), `${id} / ${p.fin}`).toBe(p.fin);
    }
  }, 200_000);
});
