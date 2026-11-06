import { describe, expect, it } from 'vitest';
import { appliquerEtat, creerGenerateur, heroCombatDe, herosPreTires, personnageDepuisFiche, preparerRencontre, recuperer, RENCONTRES, type Personnage } from '../src';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const fiches = new Map(herosPreTires(srd).map((h) => [h.fiche.nom, h.fiche]));
const perso = (nom: string): Personnage => personnageDepuisFiche(fiches.get(nom)!, { id: nom.toLowerCase() });
const gen = creerGenerateur(5);

describe('personnage unifié', () => {
  it('naît au maximum : PV, une potion, usages de ses aptitudes, emplacements de sorts', () => {
    const bran = perso('Bran');
    expect(bran.pv).toBe(bran.fiche.pvMax);
    expect(bran.ressources).toMatchObject({ potions: 1, secondSouffle: 2, fougue: 1 });
    expect(bran.emplacements).toEqual([]);
    const ambrine = perso('Ambrine');
    expect(ambrine.emplacements.reduce((s, n) => s + n, 0)).toBeGreaterThan(0);
    expect(perso('Grukk').ressources.rages).toBeGreaterThan(0);
  });

  it('le combat part de son état du moment et le rend : une potion bue reste bue, un sort lancé use son emplacement', () => {
    const ambrine = perso('Ambrine');
    ambrine.pv = 9;
    ambrine.ressources.potions = 0;
    ambrine.emplacements = ambrine.emplacements.map(() => 0);
    const { combattants } = preparerRencontre(RENCONTRES[0]!, srd, [heroCombatDe(ambrine)]);
    const c = combattants.find((x) => x.camp === 'heros')!;
    expect(c.pv).toBe(9);
    expect(c.ressources.potions).toBe(0);
    expect(c.incantation!.emplacements.every((n) => n === 0)).toBe(true);
    expect(c.ressources.reaction).toBe(1); // ce qui ne sert qu'en combat repart à neuf

    // Retour du combat : on ne garde que les ressources durables, bornées par la fiche.
    appliquerEtat(ambrine, { pv: 999, ressources: { potions: 2, reaction: 0, inconnue: 5 }, emplacements: [1, 9] });
    expect(ambrine.pv).toBe(ambrine.fiche.pvMax);
    expect(ambrine.ressources).not.toHaveProperty('reaction');
    expect(ambrine.ressources).not.toHaveProperty('inconnue');
    expect(ambrine.ressources.potions).toBe(2);
    expect(ambrine.emplacements[0]).toBe(1);
    expect(ambrine.emplacements[1]).toBeLessThanOrEqual(personnageDepuisFiche(ambrine.fiche, { id: 'x' }).emplacements[1] ?? 0);
  });

  it('repos court : un usage de second souffle regagné, la fougue entière, pas les sorts du magicien ni les potions', () => {
    const bran = perso('Bran');
    bran.ressources = { potions: 0, secondSouffle: 0, fougue: 0 };
    recuperer(bran, 'court', gen);
    expect(bran.ressources).toMatchObject({ potions: 0, secondSouffle: 1, fougue: 1 });
    const ambrine = perso('Ambrine');
    const max = [...ambrine.emplacements];
    ambrine.emplacements = max.map(() => 0);
    recuperer(ambrine, 'court', gen);
    expect(ambrine.emplacements.every((n) => n === 0)).toBe(true);
    recuperer(ambrine, 'long', gen);
    expect(ambrine.emplacements).toEqual(max);
  });

  it('repos court : les dés de vie se dépensent pour soigner, et s’épuisent ; le repos long les rend tous', () => {
    const grukk = perso('Grukk');
    grukk.pv = 1;
    grukk.ressources.desVie = 1;
    recuperer(grukk, 'court', gen);
    expect(grukk.ressources.desVie).toBe(0);
    const apres = grukk.pv;
    expect(apres).toBeLessThanOrEqual(1 + grukk.fiche.deVie + grukk.fiche.caracteristiques.con.modificateur);
    recuperer(grukk, 'court', gen);
    expect(grukk.pv).toBe(apres); // plus de dé : une halte ne soigne plus
    recuperer(grukk, 'long', gen);
    expect(grukk.ressources.desVie).toBe(grukk.fiche.niveau);
  });

  it('repos long : PV et usages au maximum ; les potions ne reviennent pas', () => {
    const grukk = perso('Grukk');
    const rages = grukk.ressources.rages!;
    grukk.pv = 1;
    grukk.ressources = { potions: 0, rages: 0 };
    const changes = recuperer(grukk, 'long', gen);
    expect(grukk.pv).toBe(grukk.fiche.pvMax);
    expect(grukk.ressources).toEqual({ potions: 0, rages, desVie: grukk.fiche.niveau });
    expect(changes.join(' ')).toMatch(/PV/);
  });
});
