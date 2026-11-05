// Correctifs de l'audit des règles de combat et des sorts (05/11/2026).
import { describe, expect, it } from 'vitest';
import { heroDepuisFiche, monstreDepuisProfil } from '../src/combat/creation';
import { type Combattant, type EtatCombat } from '../src/combat/etat';
import { casesZone, grilleDepuisTexte } from '../src/combat/grille';
import { creerCombat, infligerDegats, jetAttaque } from '../src/combat/moteur';
import { lancerSort } from '../src/combat/sorts';
import { HEROS_PRE_TIRES } from '../src/combat/prototype';
import { chargerDonneesSrd } from '../src/donnees-node';
import { calculerFiche } from '../src/fiche';

const donnees = chargerDonneesSrd();
const ARENE = grilleDepuisTexte(['..........', '..........', '..........', '..........', '..........']);

function hero(nom: string, x: number, y: number, id?: string): Combattant {
  const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === nom)!;
  const r = calculerFiche(h.choix, donnees);
  if (!r.ok) throw new Error(r.erreurs.join());
  const c = heroDepuisFiche(r.fiche, h.kit, donnees, { x, y });
  return id ? { ...c, id } : c;
}
const monstre = (profil: string, x: number, y: number, id = profil): Combattant => monstreDepuisProfil(donnees.monstres.get(profil)!, id, { x, y });
function combat(combattants: Combattant[], des: number[] = []): EtatCombat {
  const etat = creerCombat(ARENE, combattants.map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), 1, { elan: false });
  etat.desImposes = [...des];
  return etat;
}

describe('audit combat', () => {
  it('résistance : les dégâts d’un même type s’additionnent, puis sont divisés une seule fois', () => {
    const cible = monstre('bandit', 5, 2);
    const etat = combat([hero('Bran', 4, 2), cible]);
    const c = etat.combattants.find((x) => x.id === cible.id)!;
    c.resistances = ['tranchant'];
    const avant = c.pv;
    infligerDegats(etat, c, [{ montant: 3, type: 'tranchant' }, { montant: 3, type: 'tranchant' }], undefined);
    expect(avant - c.pv).toBe(3); // et non 1 + 1
  });

  it('critique automatique contre une cible paralysée à 1,5 m, même avec une attaque à distance', () => {
    const etat = combat([hero('Sylvaine', 4, 2), monstre('bandit', 5, 2)], [10]);
    const [a, c] = etat.combattants;
    c!.etats.push({ etat: 'paralyse' });
    const jet = jetAttaque(etat, a!, c!, 5, 'distance');
    expect(jet.touche && jet.critique).toBe(true);
  });

  it('Restauration partielle met fin à la paralysie', () => {
    const etat = combat([hero('Hilda', 4, 2), hero('Bran', 5, 2)]);
    const [lanceur, cible] = etat.combattants;
    cible!.etats.push({ etat: 'paralyse' });
    lancerSort(etat, lanceur!, donnees.sorts.get('restauration-partielle')!, 2, { cibles: [cible!] });
    expect(cible!.etats.some((e) => e.etat === 'paralyse')).toBe(false);
  });

  it('Bouclier annule les dards de Projectile magique', () => {
    const etat = combat([hero('Ambrine', 2, 2), hero('Ambrine', 6, 2, 'cible')]);
    const [lanceur, cible] = etat.combattants;
    const pv = cible!.pv;
    lancerSort(etat, lanceur!, donnees.sorts.get('projectile-magique')!, 1, { cibles: [cible!] });
    expect(cible!.pv).toBe(pv);
    expect(cible!.modificateurs.some((m) => m.id === 'bouclier')).toBe(true);
  });

  it('Vague tonnante : le cube part de la case du lanceur, du côté visé', () => {
    const cases = casesZone(ARENE, 'cube', 4.5, { x: 4, y: 2 }, { x: 5, y: 2 });
    expect(cases.every((p) => p.x >= 5 && p.x <= 7 && p.y >= 1 && p.y <= 3)).toBe(true);
    expect(cases).toHaveLength(9);
  });
});
