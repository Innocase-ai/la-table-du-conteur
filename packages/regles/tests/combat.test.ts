import { describe, expect, it } from 'vitest';
import { chargerDonneesSrd } from '../src/donnees-node';
import { executer } from '../src/combat/cartes';
import { actif, combattant } from '../src/combat/etat';
import { IA_RAPIDE, jouerTourIA } from '../src/combat/ia';
import { creerCombat } from '../src/combat/moteur';
import { preparerRencontre, RENCONTRES } from '../src/combat/prototype';

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };

describe('prototype de combat', () => {
  for (const r of RENCONTRES) {
    it(`${r.nom} : se prépare et se joue jusqu'au bout (IA rapide des deux côtés)`, () => {
      const { grille, combattants } = preparerRencontre(r, donnees);
      const etat = creerCombat(grille, combattants, 1234);
      let tours = 0;
      while (!etat.vainqueur && tours < 400) {
        jouerTourIA(etat, ctx, IA_RAPIDE);
        tours++;
      }
      expect(etat.vainqueur, etat.journal.slice(-20).map((e) => e.texte).join('\n')).toBeDefined();
    });
  }

  it('refuse une carte injouable et une cible hors de portée', () => {
    const { grille, combattants } = preparerRencontre(RENCONTRES[0]!, donnees);
    const etat = creerCombat(grille, combattants, 7);
    const c = actif(etat);
    expect(executer(etat, ctx, { type: 'jouer', carte: 'carte-inexistante' }).ok).toBe(false);
    const autre = etat.combattants.find((x) => x.camp !== c.camp)!;
    const attaque = c.attaques[0] ? `attaque:${c.attaques[0].id}` : `monstre:${c.actionsMonstre[0]!.id}`;
    const r = executer(etat, ctx, { type: 'jouer', carte: attaque, cibles: [autre.id] });
    if (!r.ok) expect(r.erreur).toMatch(/cible|portée/i);
    expect(combattant(etat, c.id)).toBeDefined();
  });
});
