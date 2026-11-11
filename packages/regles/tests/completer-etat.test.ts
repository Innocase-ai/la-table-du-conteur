import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { creerMoteur, herosPreTires, MODULES_STANDARD, personnageDepuisFiche, type Partie } from '../src';
import { chargerMonde } from '../src/monde/chargeur';
import { completerEtat } from '../src/monde/etat';
import { chargerDonneesSrd } from '../src/donnees-node';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde;
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
const groupe = () => herosPreTires(srd).map((h) => personnageDepuisFiche(h.fiche, { id: h.fiche.nom.toLowerCase() }));
const depart = (): Partie => moteur.executer(moteur.nouvellePartie(groupe(), { graine: 7, niveau: 3 }), { type: 'commencer' }).partie;

describe('un pack ajouté après la sauvegarde', () => {
  it("complète jauges, réputations et attitudes inconnues sans toucher à ce que la partie connaît", () => {
    const p = depart();
    const jauge = [...dm.jauges.keys()][0]!;
    const pnj = [...dm.pnj.keys()][0]!;
    p.etat.jauges[jauge] = 3; // une valeur déjà jouée
    delete p.etat.attitudes[pnj]; // un PNJ « arrivé avec le pack »
    const ajoutees = completerEtat(p.etat, dm);
    expect(ajoutees).toBe(1);
    expect(p.etat.attitudes[pnj]).toBe(dm.pnj.get(pnj)!.attitude);
    expect(p.etat.jauges[jauge]).toBe(3);
    expect(completerEtat(p.etat, dm)).toBe(0); // idempotent
  });

  it("charger : une sauvegarde sans l'état d'une entité du monde la retrouve", () => {
    const p = depart();
    const pnj = [...dm.pnj.keys()][0]!;
    delete p.etat.attitudes[pnj];
    const rechargee = moteur.charger(JSON.stringify(p));
    expect(rechargee.etat.attitudes[pnj]).toBe(dm.pnj.get(pnj)!.attitude);
  });
});
