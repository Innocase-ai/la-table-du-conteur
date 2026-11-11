// Une rencontre qui répète le même monstre sur deux lignes (le camp hobgobelin du Val des Cendres : « combattant-hobgobelin »
// ×1 puis ×3) ne doit pas donner deux combattants de même identifiant : le moteur retrouve un combattant par son identifiant,
// le second restait alors un « vivant fantôme » (affiché vivant, jamais touché, jamais mort) et la victoire n'arrivait jamais.
import { describe, expect, it } from 'vitest';
import { chargerDonneesSrd } from '../src/donnees-node';
import { actif } from '../src/combat/etat';
import { IA_RAPIDE, jouerTourIA } from '../src/combat/ia';
import { creerCombat } from '../src/combat/moteur';
import { preparerRencontre, RENCONTRES, type Rencontre } from '../src/combat/prototype';

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };

/** La première rencontre du prototype, avec un même monstre réparti sur deux lignes. */
function rencontreRepetee(): Rencontre {
  const base = RENCONTRES.find((r) => r.carte.join('').split('m').length - 1 >= 6)!;
  return { ...base, monstres: [{ profil: 'combattant-gobelin', nombre: 1 }, { profil: 'combattant-gobelin', nombre: 3 }, { profil: 'bandit', nombre: 1 }] };
}

describe('les identifiants des combattants d’une rencontre', () => {
  it('sont tous uniques, même quand un monstre revient sur deux lignes', () => {
    const { combattants } = preparerRencontre(rencontreRepetee(), donnees);
    const ids = combattants.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const gobelins = combattants.filter((c) => c.modele === 'combattant-gobelin');
    expect(gobelins).toHaveLength(4);
    // Les noms se suivent aussi : « Gobelin 1 » à « Gobelin 4 », sans doublon pour le joueur.
    expect(gobelins.map((c) => c.nom)).toEqual(['Combattant gobelin 1', 'Combattant gobelin 2', 'Combattant gobelin 3', 'Combattant gobelin 4']);
  });

  it('un monstre seul garde son nom sans numéro, et la rencontre se joue jusqu’à une victoire ou une défaite franche', () => {
    const { grille, combattants } = preparerRencontre(rencontreRepetee(), donnees);
    expect(combattants.filter((c) => c.modele === 'bandit').map((c) => c.nom)).toEqual(['Bandit']);
    const etat = creerCombat(grille, combattants, 99);
    let tours = 0;
    while (!etat.vainqueur && tours < 400) {
      jouerTourIA(etat, ctx, IA_RAPIDE);
      tours++;
    }
    expect(etat.vainqueur).toBeDefined();
    // Au dénouement, aucun combattant du camp vaincu n'est « vivant fantôme » : tous sont morts, en fuite ou inconscients.
    if (etat.vainqueur === 'heros') {
      for (const m of etat.combattants.filter((c) => c.camp === 'monstres')) expect(m.mort || m.enFuite || m.etats.some((e) => e.etat === 'inconscient'), m.id).toBe(true);
    }
    expect(actif(etat)).toBeDefined();
  });
});
