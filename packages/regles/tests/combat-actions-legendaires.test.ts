// F6 (PRD-SAGA), lot 3 — les actions légendaires : un monstre qui porte le trait `actions-legendaires` dépense une utilisation de sa réserve, aussitôt
// après le tour d'un adversaire, pour une de ses actions légendaires jouables (résolution d'attaque ou de sauvegarde, une cible ou une zone). Opt-in par
// les données : un monstre sans le trait est inchangé (ses « actions légendaires » restent, comme avant, des cartes de son propre tour).
import { describe, expect, it } from 'vitest';
import { cartesDisponibles } from '../src/combat/cartes';
import { monstreDepuisProfil } from '../src/combat/creation';
import { ACTIONS_LEGENDAIRES, ACTIONS_LEGENDAIRES_MAX, estActionLegendaire, type Combattant, type EtatCombat } from '../src/combat/etat';
import { IA_RAPIDE, jouerTourIA } from '../src/combat/ia';
import { actionsLegendairesApres, actionsLegendairesJouables, rendreActionsLegendaires, VERROU_LEGENDAIRE } from '../src/combat/legendaire';
import { creerCombat } from '../src/combat/moteur';
import { preparerRencontre, RENCONTRES, type Rencontre } from '../src/combat/prototype';
import { chargerDonneesSrd } from '../src/donnees-node';
import { groupeDeTest, heroCombatDe, type Donnees } from '../src';

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };

/** Un combat contre un seul monstre (le groupe d'essai de niveau 3), avec ou sans les traits légendaires du profil. */
function combat(profil: string, options: { sansTraits?: boolean; graine?: number; niveau?: number } = {}): { etat: EtatCombat; monstre: Combattant; heros: Combattant[] } {
  let d: Donnees = donnees;
  if (options.sansTraits) {
    const m = donnees.monstres.get(profil)!;
    d = { ...donnees, monstres: new Map(donnees.monstres).set(profil, { ...m, traits: m.traits.filter((t) => t.id !== 'actions-legendaires' && t.id !== 'resistance-legendaire') }) };
  }
  const r: Rencontre = { ...RENCONTRES[0]!, id: 'legendaire-essai', nom: 'Légendaire (essai)', monstres: [{ profil, nombre: 1 }] };
  const heros = groupeDeTest(donnees, options.niveau ?? 3).map(heroCombatDe);
  const { grille, combattants } = preparerRencontre(r, d, heros);
  const etat = creerCombat(grille, combattants, options.graine ?? 5);
  return { etat, monstre: etat.combattants.find((c) => c.camp === 'monstres')!, heros: etat.combattants.filter((c) => c.camp === 'heros') };
}

const dit = (etat: EtatCombat, motif: RegExp) => etat.journal.filter((e) => motif.test(e.texte));

describe('la réserve d’actions légendaires', () => {
  it('un monstre légendaire naît avec ses utilisations (le nombre écrit dans le trait) ; les autres n’en ont pas', () => {
    expect(combat('dragon-blanc-adulte').monstre.ressources[ACTIONS_LEGENDAIRES]).toBe(3);
    expect(combat('dragon-blanc-adulte').monstre.ressources[ACTIONS_LEGENDAIRES_MAX]).toBe(3);
    let avec = 0;
    for (const m of donnees.monstres.values()) {
      const porte = m.traits.some((t) => t.id === 'actions-legendaires');
      const c = monstreDepuisProfil(m, 'x', { x: 0, y: 0 });
      if (porte) {
        avec++;
        expect(c.ressources[ACTIONS_LEGENDAIRES], m.id).toBeGreaterThanOrEqual(1);
      } else {
        expect(ACTIONS_LEGENDAIRES in c.ressources, m.id).toBe(false);
      }
    }
    expect(avec).toBe(30);
  });

  it('ses actions légendaires ne sont plus des cartes de son propre tour ; sans le trait, elles le restent (comme avant)', () => {
    const avec = combat('dragon-blanc-adulte');
    const sans = combat('dragon-blanc-adulte', { sansTraits: true });
    const ids = (c: ReturnType<typeof combat>) => cartesDisponibles(c.etat, ctx, c.monstre.id).map((k) => k.id);
    expect(ids(avec)).not.toContain('monstre:decharge-de-gel');
    expect(ids(avec)).toContain('monstre:souffle-glacial');
    expect(ids(sans)).toContain('monstre:decharge-de-gel');
  });

  it('on sait reconnaître une action légendaire et celles qu’on sait jouer (résolution d’attaque ou de sauvegarde)', () => {
    const { monstre } = combat('dragon-blanc-adulte');
    expect(monstre.actionsMonstre.filter(estActionLegendaire).map((a) => a.id).sort()).toEqual(['assaut-incisif', 'decharge-de-gel', 'presence-terrifiante']);
    expect(actionsLegendairesJouables(monstre).map((a) => a.id)).toEqual(['decharge-de-gel']);
  });
});

describe('dépenser une action légendaire après le tour d’un adversaire', () => {
  it('une utilisation de moins, une ligne de journal, une zone qui touche ceux qui sont dedans', () => {
    const { etat, monstre, heros } = combat('dragon-blanc-adulte');
    const pvAvant = heros.map((h) => h.pv);
    actionsLegendairesApres(etat, heros[0]!);
    expect(monstre.ressources[ACTIONS_LEGENDAIRES]).toBe(2);
    expect(dit(etat, /dépense une action légendaire : Décharge de gel \(2 restante/)).toHaveLength(1);
    // Une sauvegarde par créature touchée, au moins une.
    expect(dit(etat, /utilise Décharge de gel sur/).length).toBeGreaterThanOrEqual(1);
    expect(heros.map((h) => h.pv).some((pv, i) => pv < pvAvant[i]!)).toBe(true);
  });

  it('« ne peut alors plus entreprendre cette action jusqu’au début de son tour » : verrouillée, puis rendue avec la réserve à son tour', () => {
    const { etat, monstre, heros } = combat('dragon-blanc-adulte');
    actionsLegendairesApres(etat, heros[0]!);
    expect(monstre.ressources[`${VERROU_LEGENDAIRE}decharge-de-gel`]).toBe(1);
    // Le tour suivant d'un adversaire : l'action est verrouillée, et c'est la seule jouable : rien de plus n'est dépensé.
    actionsLegendairesApres(etat, heros[1]!);
    expect(monstre.ressources[ACTIONS_LEGENDAIRES]).toBe(2);
    expect(dit(etat, /dépense une action légendaire/)).toHaveLength(1);
    rendreActionsLegendaires(monstre);
    expect(monstre.ressources[ACTIONS_LEGENDAIRES]).toBe(3);
    expect(`${VERROU_LEGENDAIRE}decharge-de-gel` in monstre.ressources).toBe(false);
    actionsLegendairesApres(etat, heros[1]!);
    expect(monstre.ressources[ACTIONS_LEGENDAIRES]).toBe(2);
  });

  it('jamais après le tour d’un allié, jamais sans utilisation, jamais s’il ne peut pas agir', () => {
    const { etat, monstre, heros } = combat('dragon-blanc-adulte');
    actionsLegendairesApres(etat, monstre);
    expect(monstre.ressources[ACTIONS_LEGENDAIRES]).toBe(3);
    monstre.ressources[ACTIONS_LEGENDAIRES] = 0;
    actionsLegendairesApres(etat, heros[0]!);
    expect(dit(etat, /action légendaire/)).toHaveLength(0);
    monstre.ressources[ACTIONS_LEGENDAIRES] = 3;
    monstre.etats.push({ etat: 'paralyse' } as Combattant['etats'][number]);
    actionsLegendairesApres(etat, heros[0]!);
    expect(monstre.ressources[ACTIONS_LEGENDAIRES]).toBe(3);
  });

  it('rien n’est dépensé quand personne n’est à portée (la réserve se garde)', () => {
    const { etat, monstre, heros } = combat('dragon-blanc-adulte');
    // Tous les héros hors de portée : le dragon est loin, sa Décharge se pose à 36 m au plus.
    for (const h of heros) h.position = { x: etat.grille.largeur - 1, y: etat.grille.hauteur - 1 };
    monstre.position = { x: 1, y: 1 };
    actionsLegendairesApres(etat, heros[0]!);
    expect(monstre.ressources[ACTIONS_LEGENDAIRES]).toBe(3);
    expect(dit(etat, /action légendaire/)).toHaveLength(0);
  });

  it('une émanation (kraken, Encre toxique) part du monstre : seuls les adversaires autour de lui sont touchés', () => {
    const { etat, monstre, heros } = combat('kraken');
    const libres = (c: Combattant) => {
      const res: { x: number; y: number }[] = [];
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const p = { x: c.position.x + dx, y: c.position.y + dy };
        if ((dx || dy) && etat.grille.cases[p.y * etat.grille.largeur + p.x] === 'sol' && !etat.combattants.some((x) => x.position.x === p.x && x.position.y === p.y)) res.push(p);
      }
      return res;
    };
    const autour = libres(monstre);
    heros[0]!.position = autour[0]!;
    heros[1]!.position = autour[1]!;
    heros.slice(2).forEach((h, i) => (h.position = { x: 0 + i, y: etat.grille.hauteur - 1 }));
    actionsLegendairesApres(etat, heros[2]!);
    expect(dit(etat, /Encre toxique/).length).toBeGreaterThanOrEqual(2);
    const touches = new Set(etat.journal.filter((e) => /utilise Encre toxique sur/.test(e.texte)).map((e) => e.cible));
    expect([...touches].sort()).toEqual([heros[0]!.id, heros[1]!.id].sort());
  });
});

describe('dans un combat entier', () => {
  it('le dragon blanc s’en sert tout au long du combat, au plus 3 fois entre deux de ses tours, et les invariants tiennent', () => {
    let usages = 0;
    for (const graine of [31, 32, 33]) {
      const { etat, monstre } = combat('dragon-blanc-adulte', { graine, niveau: 8 });
      let rounds = 0;
      while (!etat.vainqueur && etat.round < 20 && rounds++ < 400) {
        jouerTourIA(etat, ctx, IA_RAPIDE);
        expect(monstre.ressources[ACTIONS_LEGENDAIRES]).toBeGreaterThanOrEqual(0);
        expect(monstre.ressources[ACTIONS_LEGENDAIRES]).toBeLessThanOrEqual(3);
      }
      usages += dit(etat, /dépense une action légendaire/).length;
    }
    expect(usages).toBeGreaterThan(0);
  });
});
