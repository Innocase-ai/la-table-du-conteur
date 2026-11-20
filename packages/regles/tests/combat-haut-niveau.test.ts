// F6 (PRD-SAGA) — le combat de haut niveau, par petits lots. P3 est levé pour cette fiche seulement : les branches nouvelles ne s'exécutent que
// pour les monstres porteurs des données nouvelles (ici : le trait `resistance-legendaire`) ; la simulation de référence (`pnpm simuler 10 rapide`)
// reste identique sur tous les profils existants. Lot 1 : un filet d'invariants (test de propriété) sur des parties entières ; lot 2 : la Résistance légendaire.
import { describe, expect, it } from 'vitest';
import { chargerDonneesSrd } from '../src/donnees-node';
import { IA_RAPIDE, jouerTourIA } from '../src/combat/ia';
import { horsCombat, RESISTANCE_LEGENDAIRE, type EtatCombat } from '../src/combat/etat';
import { casesOccupees } from '../src/combat/grille';
import { creerCombat, sauvegarde } from '../src/combat/moteur';
import { preparerRencontre, RENCONTRES, type Rencontre } from '../src/combat/prototype';
import { groupeDeTest, heroCombatDe } from '../src';

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };

/** Les invariants qui doivent tenir à tout moment d'un combat, quoi qu'il arrive. Renvoie les violations (vide : tout va bien). */
function violations(etat: EtatCombat): string[] {
  const v: string[] = [];
  const ids = etat.combattants.map((c) => c.id);
  if (new Set(ids).size !== ids.length) v.push('deux combattants ont le même identifiant');
  if (!Number.isInteger(etat.round) || etat.round < 1) v.push(`round invalide : ${etat.round}`);
  if ([...etat.ordre].sort().join() !== [...ids].sort().join()) v.push('l’ordre d’initiative ne contient pas exactement les combattants');
  if (etat.actif < 0 || etat.actif >= etat.ordre.length) v.push(`combattant actif hors de l’ordre : ${etat.actif}`);
  const occupees = new Map<string, string>();
  for (const c of etat.combattants) {
    const ou = `${c.nom} (${c.id})`;
    if (![c.pv, c.pvMax, c.pvTemp].every(Number.isFinite)) v.push(`${ou} : PV non numériques`);
    if (c.pv < 0 || c.pv > c.pvMax) v.push(`${ou} : PV ${c.pv}/${c.pvMax}`);
    if (c.pvTemp < 0) v.push(`${ou} : PV temporaires négatifs`);
    if (c.mort && c.pv !== 0) v.push(`${ou} : mort avec ${c.pv} PV`);
    for (const [k, n] of Object.entries(c.ressources)) if (!Number.isFinite(n) || n < 0) v.push(`${ou} : ressource « ${k} » = ${n}`);
    if (c.position.x < 0 || c.position.y < 0 || c.position.x >= etat.grille.largeur || c.position.y >= etat.grille.hauteur) v.push(`${ou} : hors de la grille`);
    else if (etat.grille.cases[c.position.y * etat.grille.largeur + c.position.x] === 'mur') v.push(`${ou} : dans un mur`);
    // Deux combattants encore dans le combat ne partagent pas une case (un fuyard, hors de combat, peut s'arrêter sur la case d'un autre).
    // Une grande créature occupe toute son empreinte (F6) : aucune de ses cases n'est dans un mur ni partagée.
    if (c.pv > 0 && !horsCombat(c)) {
      for (const p of casesOccupees(c)) {
        const cle = `${p.x},${p.y}`;
        if (etat.grille.cases[p.y * etat.grille.largeur + p.x] === 'mur') v.push(`${ou} : empreinte dans un mur en ${cle}`);
        if (occupees.has(cle)) v.push(`${ou} et ${occupees.get(cle)} sur la même case ${cle}`);
        occupees.set(cle, ou);
      }
    }
  }
  return v;
}

/** Joue un combat entier (IA rapide des deux côtés) en vérifiant les invariants après chaque tour. */
function jouer(r: Rencontre, graine: number, heros?: ReturnType<typeof heroCombatDe>[], maxRounds = 30): EtatCombat {
  const { grille, combattants } = preparerRencontre(r, donnees, heros);
  const etat = creerCombat(grille, combattants, graine);
  expect(violations(etat), 'au départ').toEqual([]);
  let tours = 0;
  let roundPrecedent = etat.round;
  while (!etat.vainqueur && etat.round < maxRounds && tours++ < 600) {
    jouerTourIA(etat, ctx, IA_RAPIDE);
    const v = violations(etat);
    expect(v, `${r.nom}, graine ${graine}, après ${tours} tours (round ${etat.round}) :\n${etat.journal.slice(-6).map((e) => e.texte).join('\n')}`).toEqual([]);
    expect(etat.round).toBeGreaterThanOrEqual(roundPrecedent);
    roundPrecedent = etat.round;
  }
  return etat;
}

describe('lot 1 : les invariants d’un combat (test de propriété sur des parties entières)', () => {
  for (const r of RENCONTRES) {
    it(`${r.nom} : 6 graines, aucun invariant violé à aucun tour`, () => {
      for (const graine of [1, 2, 3, 4, 5, 6]) jouer(r, graine);
    });
  }

  it('un combat de haut niveau (six héros de niveau 8 contre un dragon blanc adulte) tient aussi ses invariants', () => {
    const heros = groupeDeTest(donnees, 8).map(heroCombatDe);
    const r: Rencontre = { ...RENCONTRES[0]!, id: 'dragon-test', nom: 'Dragon (essai)', monstres: [{ profil: 'dragon-blanc-adulte', nombre: 1 }] };
    for (const graine of [11, 12, 13]) jouer(r, graine, heros, 20);
  });
});

describe('lot 2 : la Résistance légendaire', () => {
  const un = (profil: string) => {
    const r: Rencontre = { ...RENCONTRES[0]!, id: 'essai', nom: 'Essai', monstres: [{ profil, nombre: 1 }] };
    const { grille, combattants } = preparerRencontre(r, donnees);
    const etat = creerCombat(grille, combattants, 7);
    return { etat, monstre: etat.combattants.find((c) => c.camp === 'monstres')! };
  };

  it('un monstre légendaire naît avec sa réserve (le nombre écrit avant « /jour »)', () => {
    expect(un('dragon-blanc-adulte').monstre.ressources[RESISTANCE_LEGENDAIRE]).toBe(3);
    expect(un('liche').monstre.ressources[RESISTANCE_LEGENDAIRE]).toBe(3);
  });

  it('les 32 monstres du catalogue qui la portent ont une réserve entre 1 et 6 ; les autres n’en ont pas', () => {
    let avec = 0;
    for (const m of donnees.monstres.values()) {
      const porte = m.traits.some((t) => t.id === 'resistance-legendaire');
      const { monstre } = un(m.id);
      if (porte) {
        avec++;
        const n = monstre.ressources[RESISTANCE_LEGENDAIRE]!;
        expect(n, m.id).toBeGreaterThanOrEqual(1);
        expect(n, m.id).toBeLessThanOrEqual(6);
      } else {
        expect(RESISTANCE_LEGENDAIRE in monstre.ressources, m.id).toBe(false);
      }
    }
    expect(avec).toBe(32);
  });

  it('un jet raté est réussi tant qu’il reste des utilisations, puis le monstre échoue normalement ; le journal le dit', () => {
    const { etat, monstre } = un('dragon-blanc-adulte');
    // Un DD impossible : le jet échoue toujours.
    expect([1, 2, 3].map(() => sauvegarde(etat, monstre, 'dex', 99))).toEqual([true, true, true]);
    expect(monstre.ressources[RESISTANCE_LEGENDAIRE]).toBe(0);
    expect(sauvegarde(etat, monstre, 'dex', 99)).toBe(false);
    expect(monstre.ressources[RESISTANCE_LEGENDAIRE]).toBe(0);
    const dit = etat.journal.filter((e) => /Résistance légendaire/.test(e.texte));
    expect(dit).toHaveLength(3);
    expect(dit[2]!.texte).toMatch(/0 restante/);
  });

  it('un jet réussi ne coûte rien', () => {
    const { etat, monstre } = un('dragon-blanc-adulte');
    expect(sauvegarde(etat, monstre, 'con', -50)).toBe(true);
    expect(monstre.ressources[RESISTANCE_LEGENDAIRE]).toBe(3);
  });

  it('un monstre sans le trait échoue normalement (rien ne change pour lui) ; un héros aussi', () => {
    const { etat, monstre } = un('combattant-gobelin');
    expect(RESISTANCE_LEGENDAIRE in monstre.ressources).toBe(false);
    expect(sauvegarde(etat, monstre, 'dex', 99)).toBe(false);
    const hero = etat.combattants.find((c) => c.camp === 'heros')!;
    expect(sauvegarde(etat, hero, 'dex', 99)).toBe(false);
  });

  it('en combat, le dragon s’en sert (le groupe de niveau 8 lance des sorts à sauvegarde) et la réserve ne dépasse jamais zéro', () => {
    const heros = groupeDeTest(donnees, 8).map(heroCombatDe);
    const r: Rencontre = { ...RENCONTRES[0]!, id: 'dragon-test', nom: 'Dragon (essai)', monstres: [{ profil: 'dragon-blanc-adulte', nombre: 1 }] };
    const etat = jouer(r, 21, heros, 20);
    const dragon = etat.combattants.find((c) => c.camp === 'monstres')!;
    expect(dragon.ressources[RESISTANCE_LEGENDAIRE]).toBeGreaterThanOrEqual(0);
    expect(dragon.ressources[RESISTANCE_LEGENDAIRE]).toBeLessThanOrEqual(3);
    const usages = etat.journal.filter((e) => /Résistance légendaire/.test(e.texte)).length;
    expect(usages).toBe(3 - dragon.ressources[RESISTANCE_LEGENDAIRE]!);
  });
});
