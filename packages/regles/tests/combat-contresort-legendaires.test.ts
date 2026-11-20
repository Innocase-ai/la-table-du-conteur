// F6 (PRD-SAGA), lot 10 — le Contresort de la liche et du mage (réaction : un sort de niveau 1 ou plus lancé à 18 m ou moins peut échouer), et deux actions légendaires de plus
// qui reprennent une action ordinaire du profil : Trait d'orage du kraken (Trait de foudre) et Regard de biais de la momie (Regard effroyable).
import { describe, expect, it } from 'vitest';
import { lancerSort } from '../src/combat/sorts';
import { actionsLegendairesApres, actionsLegendairesJouables, VERROU_LEGENDAIRE } from '../src/combat/legendaire';
import { creerCombat } from '../src/combat/moteur';
import { ACTIONS_LEGENDAIRES, RESISTANCE_LEGENDAIRE, type Combattant, type EtatCombat } from '../src/combat/etat';
import { preparerRencontre, RENCONTRES, type Rencontre } from '../src/combat/prototype';
import { chargerDonneesSrd } from '../src/donnees-node';

const donnees = chargerDonneesSrd();

function duel(profil: string): { etat: EtatCombat; monstre: Combattant; heros: Combattant[] } {
  const r: Rencontre = { ...RENCONTRES[0]!, id: 'lot10', nom: 'Lot 10 (essai)', monstres: [{ profil, nombre: 1 }] };
  const { grille, combattants } = preparerRencontre(r, donnees);
  const etat = creerCombat(grille, combattants, 3);
  return { etat, monstre: etat.combattants.find((c) => c.camp === 'monstres')!, heros: etat.combattants.filter((c) => c.camp === 'heros') };
}

/** Un héros qui lance des sorts, et un sort offensif de niveau 1 qu'il connaît. */
function lanceur(heros: Combattant[]): { h: Combattant; sortId: string } {
  const h = heros.find((x) => x.incantation && x.sorts.includes('projectile-magique'))!;
  return { h, sortId: 'projectile-magique' };
}

describe('Contresort (liche, mage)', () => {
  it('un sort de niveau 1 lancé à portée : jet de Constitution raté, le sort échoue ; la réaction est dépensée', () => {
    const { etat, monstre, heros } = duel('liche');
    const { h, sortId } = lanceur(heros);
    h.position = { x: monstre.position.x, y: monstre.position.y + 4 };
    monstre.ressources[RESISTANCE_LEGENDAIRE] = 0;
    const pv = monstre.pv;
    etat.desImposes = [1, 1, 1];
    lancerSort(etat, h, donnees.sorts.get(sortId)!, 1, { cibles: [monstre] });
    expect(monstre.ressources.reaction).toBe(0);
    expect(etat.journal.some((e) => /Contresort.*le sort échoue/.test(e.texte))).toBe(true);
    expect(monstre.pv).toBe(pv);
  });

  it('jet réussi : le sort a lieu (la réaction est dépensée quand même)', () => {
    const { etat, monstre, heros } = duel('liche');
    const { h, sortId } = lanceur(heros);
    h.position = { x: monstre.position.x, y: monstre.position.y + 4 };
    etat.desImposes = [20, 20, 20, 20, 20, 20];
    lancerSort(etat, h, donnees.sorts.get(sortId)!, 1, { cibles: [monstre] });
    expect(monstre.ressources.reaction).toBe(0);
    expect(etat.journal.some((e) => /Contresort.*le sort a lieu/.test(e.texte))).toBe(true);
  });

  it('un sort mineur n’est pas contré ; hors de portée, ou sans réaction, non plus', () => {
    const a = duel('liche');
    const { h } = lanceur(a.heros);
    h.position = { x: a.monstre.position.x, y: a.monstre.position.y + 4 };
    const mineur = [...donnees.sorts.values()].find((s) => s.niveau === 0 && s.resolution && h.sorts.includes(s.id));
    if (mineur) {
      lancerSort(a.etat, h, mineur, 0, { cibles: [a.monstre] });
      expect(a.monstre.ressources.reaction).toBe(1);
    }
    const b = duel('liche');
    const { h: h2 } = lanceur(b.heros);
    // Le monstre dans un coin, le héros dans le coin opposé : plus de 18 m entre eux.
    b.monstre.position = { x: 1, y: 1 };
    h2.position = { x: b.etat.grille.largeur - 2, y: b.etat.grille.hauteur - 2 };
    lancerSort(b.etat, h2, donnees.sorts.get('projectile-magique')!, 1, { cibles: [b.monstre] });
    expect(b.monstre.ressources.reaction).toBe(1);
  });

  it('le mage a le même Contresort ; un monstre sans lui n’en tente aucun', () => {
    const a = duel('mage');
    const { h } = lanceur(a.heros);
    h.position = { x: a.monstre.position.x, y: a.monstre.position.y + 4 };
    lancerSort(a.etat, h, donnees.sorts.get('projectile-magique')!, 1, { cibles: [a.monstre] });
    expect(a.monstre.ressources.reaction).toBe(0);
    const b = duel('ogre');
    const { h: h2 } = lanceur(b.heros);
    lancerSort(b.etat, h2, donnees.sorts.get('projectile-magique')!, 1, { cibles: [b.monstre] });
    expect(b.etat.journal.some((e) => /Contresort/.test(e.texte))).toBe(false);
  });
});

describe('Trait d’orage du kraken et Regard de biais de la momie (une action ordinaire rejouée en action légendaire)', () => {
  it('le kraken lance son Trait de foudre après le tour d’un adversaire, sur le plus blessé à 36 m ou moins', () => {
    const { etat, monstre, heros } = duel('kraken');
    expect(actionsLegendairesJouables(monstre).map((a) => a.id)).toContain('trait-d-orage');
    monstre.ressources[`${VERROU_LEGENDAIRE}encre-toxique`] = 1;
    heros[2]!.pv = 3;
    const avant = heros.map((h) => h.pv);
    etat.desImposes = [1, 1, 1, 1];
    actionsLegendairesApres(etat, heros[0]!, { sorts: donnees.sorts });
    expect(etat.journal.some((e) => /dépense une action légendaire : Trait d'orage/.test(e.texte))).toBe(true);
    expect(monstre.ressources[ACTIONS_LEGENDAIRES]).toBe(2);
    expect(heros.map((h) => h.pv).some((pv, i) => pv < avant[i]!)).toBe(true);
  });

  it('la momie rejoue son Regard effroyable', () => {
    const { etat, monstre, heros } = duel('momie-auguste');
    expect(actionsLegendairesJouables(monstre).map((a) => a.id)).toContain('regard-de-biais');
    for (const a of actionsLegendairesJouables(monstre)) if (a.id !== 'regard-de-biais') monstre.ressources[`${VERROU_LEGENDAIRE}${a.id}`] = 1;
    heros[1]!.position = { x: monstre.position.x, y: monstre.position.y + 6 };
    etat.desImposes = [1, 1, 1, 1];
    actionsLegendairesApres(etat, heros[0]!, { sorts: donnees.sorts });
    expect(etat.journal.some((e) => /dépense une action légendaire : Regard de biais/.test(e.texte))).toBe(true);
    expect(monstre.ressources[ACTIONS_LEGENDAIRES]).toBe(2);
  });
});
