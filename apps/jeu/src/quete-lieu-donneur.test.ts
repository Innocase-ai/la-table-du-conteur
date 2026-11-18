// Lot 1, fiche C2 (décision D2 du 18/11/2026) : le parchemin d'une quête annonce d'où elle vient (le lieu du donneur), pas où elle mène.
// Les 18 quêtes dont le `lieu` annonçait la destination ou une origine fausse (Marche 4, Dîme 4, Tombe 10) : ancien et nouveau lieu.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chargerMonde, RACINE_MONDES } from '../../../packages/regles/src/monde/chargeur';
import { chargerDonneesSrd } from '../../../packages/regles/src/donnees-node';
import { validerMonde } from '../../../packages/regles/src/monde/validation';
import { parcheminDeQuete } from './quete-regles';

const srd = chargerDonneesSrd();
/** [monde, quête, ancien lieu, nouveau lieu (celui du donneur)]. */
const CORRIGEES: [string, string, string, string][] = [
  ['marche-d-ombrefiel', 'q-la-prime-sur-demi-dent', 'ald-carriere-huttes-et-poste-de-commandement', 'ald-auberge-comptoir-et-cellier'],
  ['marche-d-ombrefiel', 'q-le-cor-du-moulin', 'ald-moulin-plateforme-du-cor', 'ald-auberge-comptoir-et-cellier'],
  ['marche-d-ombrefiel', 'q-le-luth-de-finbar', 'ald-combe-antre-du-vieux-bourru', 'ald-auberge-cour-et-ecuries'],
  ['marche-d-ombrefiel', 'q-le-testament-du-chariot', 'ald-pont-carcasse-du-chariot', 'ald-auberge-cour-et-ecuries'],
  ['dime-des-roseaux', 'q-la-dime', 'mireval', 'mir-place-du-marche'],
  ['dime-des-roseaux', 'q-mireval-le-grenier', 'mireval', 'mir-place-du-marche'],
  ['dime-des-roseaux', 'q-huguette-les-comptes', 'mir-halle-du-conseil', 'mir-place-du-marche'],
  ['dime-des-roseaux', 'q-celestin-la-contrebande', 'mir-cave-de-l-auberge', 'mir-place-du-marche'],
  ['tombe-des-rois-serpents', 'q-contrat-eau-du-fort', 'fort-du-reflet-beni', 'fort-auberge'],
  ['tombe-des-rois-serpents', 'q-contrat-deserteurs', 'bivouac-entree', 'fort-du-reflet-beni'],
  ['tombe-des-rois-serpents', 'q-tombe-des-rois-serpents', 'fort-du-reflet-beni', 'bivouac-entree'],
  ['tombe-des-rois-serpents', 'q-pactes-de-xiximantre', 'n3-reserve-et-oubliettes', 'n3-ferme-champignons'],
  ['tombe-des-rois-serpents', 'q-statues-petrifiees', 'n3-vestibule-garde', 'fort-infirmerie'],
  ['tombe-des-rois-serpents', 'q-boucliers-de-l-arene', 'n2-arene-gardien', 'fort-forge'],
  ['tombe-des-rois-serpents', 'q-barre-de-granit', 'n1-couloir-entree', 'tombe-des-rois'],
  ['tombe-des-rois-serpents', 'q-varnac-frere-d-armes', 'fort-du-reflet-beni', 'fort-auberge'],
  ['tombe-des-rois-serpents', 'q-lysandre-sceau-brise', 'fort-du-reflet-beni', 'fort-chapelle'],
  ['tombe-des-rois-serpents', 'q-mireille-plan-trois-paliers', 'fort-du-reflet-beni', 'fort-scriptorium'],
];

const charge = (id: string) => {
  const r = chargerMonde(join(RACINE_MONDES, id));
  if (!r.ok) throw new Error(id);
  return r.monde;
};

describe('C2 (données) : le `lieu` d’une quête est celui où elle est confiée', () => {
  it('18 quêtes corrigées : Marche 4, Dîme 4, Tombe 10', () => {
    expect(CORRIGEES).toHaveLength(18);
    expect(CORRIGEES.filter(([m]) => m === 'marche-d-ombrefiel')).toHaveLength(4);
    expect(CORRIGEES.filter(([m]) => m === 'dime-des-roseaux')).toHaveLength(4);
    expect(CORRIGEES.filter(([m]) => m === 'tombe-des-rois-serpents')).toHaveLength(10);
  });

  it.each(CORRIGEES)('%s / %s : le lieu est celui du donneur, et le parchemin le nomme', (monde, id, ancien, nouveau) => {
    const dm = charge(monde);
    const q = dm.quetes.get(id)!;
    const donneur = dm.pnj.get(q.donneur!)!;
    expect(q.lieu).toBe(nouveau);
    expect(q.lieu).not.toBe(ancien);
    expect(donneur.lieu).toBe(nouveau);
    const parchemin = parcheminDeQuete(dm, id);
    expect(parchemin?.origine).toContain(donneur.nom);
    // « Donneur, métier — Lieu » : la fin de la phrase est le lieu du donneur, plus la destination d'avant.
    const lieuAnnonce = parchemin?.origine?.split(' — ').at(-1);
    expect(lieuAnnonce).toBe(dm.lieux.get(nouveau)!.nom);
    expect(lieuAnnonce).not.toBe(dm.lieux.get(ancien)!.nom);
  });

  it('plus aucun avis « pas le lieu du donneur » sur les trois histoires publiées', () => {
    for (const monde of ['marche-d-ombrefiel', 'dime-des-roseaux', 'tombe-des-rois-serpents']) {
      expect(validerMonde(charge(monde), srd).avertissements.filter((a) => /pas le lieu du donneur/.test(a)), monde).toEqual([]);
    }
  });
});
