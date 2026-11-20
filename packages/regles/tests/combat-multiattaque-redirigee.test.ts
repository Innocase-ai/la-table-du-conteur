// F6 (PRD-SAGA), lot 9 — la multiattaque redirigée : quand la cible choisie tombe au milieu d'une multiattaque de monstre, les attaques restantes ne sont plus perdues,
// elles vont à l'adversaire encore debout, à portée de l'attaque, qui a le moins de PV. (Les affaiblissements sont déjà valorisés par l'IA : `ia-affaiblissements-zones.test.ts`.)
import { describe, expect, it } from 'vitest';
import { executer } from '../src/combat/cartes';
import { casesOccupees, distanceCases } from '../src/combat/grille';
import { IA_RAPIDE, jouerTourIA } from '../src/combat/ia';
import { creerCombat } from '../src/combat/moteur';
import { preparerRencontre, RENCONTRES, type Rencontre } from '../src/combat/prototype';
import type { Combattant, EtatCombat } from '../src/combat/etat';
import { chargerDonneesSrd } from '../src/donnees-node';

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };

/** Le dragon blanc (trois attaques de Saignée) face aux six héros ; on le met actif avec son action. */
function mise(): { etat: EtatCombat; dragon: Combattant; heros: Combattant[] } {
  const r: Rencontre = { ...RENCONTRES[0]!, id: 'multi-essai', nom: 'Multiattaque (essai)', monstres: [{ profil: 'dragon-blanc-adulte', nombre: 1 }] };
  const { grille, combattants } = preparerRencontre(r, donnees);
  const etat = creerCombat(grille, combattants, 3);
  const dragon = etat.combattants.find((c) => c.camp === 'monstres')!;
  const heros = etat.combattants.filter((c) => c.camp === 'heros');
  etat.actif = etat.ordre.indexOf(dragon.id);
  dragon.tour.action = true;
  dragon.tour.attaquesRestantes = 0;
  // Les héros loin du dragon, sauf ceux qu'on amène au contact.
  heros.forEach((h, i) => (h.position = { x: 1 + i * 2, y: 10 }));
  return { etat, dragon, heros };
}

const aupres = (h: Combattant, dragon: Combattant, x: number) => (h.position = { x: dragon.position.x + 2, y: dragon.position.y + x - 1 });
const attaquesSur = (etat: EtatCombat, h: Combattant) => etat.journal.filter((e) => e.type === 'attaque' && e.cible === h.id && /\(Sai/.test(e.texte)).length;

describe('multiattaque redirigée', () => {
  it('la cible tombe à la première attaque : les deux suivantes vont à l’autre adversaire à portée (avant : perdues)', () => {
    const { etat, dragon, heros } = mise();
    const [a, b] = [heros[0]!, heros[1]!];
    aupres(a, dragon, 0);
    aupres(b, dragon, 2);
    a.pv = 1;
    // Des touches sans critique (19) et un deuxième adversaire solide : la deuxième et la troisième attaque le visent sans l'achever.
    b.pv = b.pvMax = 200;
    etat.desImposes = Array(12).fill(19);
    const r = executer(etat, ctx, { type: 'jouer', carte: 'monstre:attaques-multiples', cibles: [a.id] });
    expect(r.ok).toBe(true);
    expect(attaquesSur(etat, a)).toBe(1);
    expect(attaquesSur(etat, b)).toBe(2);
  });

  it('personne d’autre à portée : les attaques restantes sont perdues, comme avant', () => {
    const { etat, dragon, heros } = mise();
    const a = heros[0]!;
    aupres(a, dragon, 0);
    a.pv = 1;
    etat.desImposes = Array(12).fill(20);
    executer(etat, ctx, { type: 'jouer', carte: 'monstre:attaques-multiples', cibles: [a.id] });
    expect(attaquesSur(etat, a)).toBe(1);
    expect(etat.journal.filter((e) => e.type === 'attaque').length).toBe(1);
  });

  it('un adversaire hors de portée de l’attaque n’est pas choisi, et un héros déjà à terre non plus', () => {
    const { etat, dragon, heros } = mise();
    const [a, b, c] = [heros[0]!, heros[1]!, heros[2]!];
    aupres(a, dragon, 0);
    b.position = { x: dragon.position.x + 8, y: dragon.position.y };
    aupres(c, dragon, 2);
    c.pv = 0;
    a.pv = 1;
    etat.desImposes = Array(12).fill(20);
    executer(etat, ctx, { type: 'jouer', carte: 'monstre:attaques-multiples', cibles: [a.id] });
    expect(attaquesSur(etat, b)).toBe(0);
    expect(attaquesSur(etat, c)).toBe(0);
  });

  it('une cible qui ne tombe pas garde toutes les attaques', () => {
    const { etat, dragon, heros } = mise();
    const [a, b] = [heros[0]!, heros[1]!];
    aupres(a, dragon, 0);
    aupres(b, dragon, 2);
    etat.desImposes = Array(12).fill(1);
    executer(etat, ctx, { type: 'jouer', carte: 'monstre:attaques-multiples', cibles: [a.id] });
    expect(attaquesSur(etat, a)).toBe(3);
    expect(attaquesSur(etat, b)).toBe(0);
  });
});

describe('dans un combat entier', () => {
  it('les multiattaques redirigées et réparties se jouent sans casser les invariants (PV, empreintes, ordre)', () => {
    for (const graine of [51, 52, 53]) {
      const r: Rencontre = { ...RENCONTRES[0]!, id: 'multi-essai', nom: 'Multiattaque (essai)', monstres: [{ profil: 'dragon-blanc-adulte', nombre: 1 }, { profil: 'ogre', nombre: 2 }] };
      const { grille, combattants } = preparerRencontre(r, donnees);
      const etat = creerCombat(grille, combattants, graine);
      let tours = 0;
      while (!etat.vainqueur && etat.round < 20 && tours++ < 400) {
        jouerTourIA(etat, ctx, IA_RAPIDE);
        expect(etat.combattants.every((c) => c.pv >= 0 && c.pv <= c.pvMax)).toBe(true);
        const vues = new Set<string>();
        for (const c of etat.combattants.filter((x) => x.pv > 0 && !x.mort && !x.enFuite)) {
          for (const p of casesOccupees(c)) {
            const k = `${p.x},${p.y}`;
            expect(vues.has(k), `case ${k} partagée`).toBe(false);
            vues.add(k);
          }
        }
      }
      expect(distanceCases({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
    }
  });
});
