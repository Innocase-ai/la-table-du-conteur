// F6 (PRD-SAGA), lot 3 — les actions légendaires : un monstre qui porte le trait `actions-legendaires` dépense une utilisation de sa réserve, aussitôt
// après le tour d'un adversaire, pour une de ses actions légendaires jouables (résolution d'attaque ou de sauvegarde, une cible ou une zone). Opt-in par
// les données : un monstre sans le trait est inchangé (ses « actions légendaires » restent, comme avant, des cartes de son propre tour).
import { describe, expect, it } from 'vitest';
import { cartesDisponibles } from '../src/combat/cartes';
import { monstreDepuisProfil } from '../src/combat/creation';
import { ACTIONS_LEGENDAIRES, ACTIONS_LEGENDAIRES_MAX, estActionLegendaire, type Combattant, type EtatCombat } from '../src/combat/etat';
import { IA_RAPIDE, jouerTourIA } from '../src/combat/ia';
import { actionsLegendairesApres, actionsLegendairesJouables, rendreActionsLegendaires, VERROU_LEGENDAIRE } from '../src/combat/legendaire';
import { distanceCases } from '../src/combat/grille';
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
    expect(actionsLegendairesJouables(monstre).map((a) => a.id).sort()).toEqual(['assaut-incisif', 'decharge-de-gel']);
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

/** Pose `h` sur une case libre à `cases` cases de `autour` (la première trouvée). */
function placer(etat: EtatCombat, h: Combattant, autour: Combattant, cases: number | 'loin'): void {
  if (cases === 'loin') {
    let meilleure = { x: 0, y: 0 };
    let d = -1;
    for (let y = 0; y < etat.grille.hauteur; y++) for (let x = 0; x < etat.grille.largeur; x++) {
      if (etat.grille.cases[y * etat.grille.largeur + x] !== 'sol' || etat.combattants.some((c) => c !== h && c.position.x === x && c.position.y === y)) continue;
      if (distanceCases({ x, y }, autour.position) > d) (d = distanceCases({ x, y }, autour.position), (meilleure = { x, y }));
    }
    h.position = meilleure;
    return;
  }
  for (let y = 0; y < etat.grille.hauteur; y++) {
    for (let x = 0; x < etat.grille.largeur; x++) {
      const p = { x, y };
      if (etat.grille.cases[y * etat.grille.largeur + x] !== 'sol' || distanceCases(p, autour.position) !== cases) continue;
      if (etat.combattants.some((c) => c !== h && c.position.x === x && c.position.y === y)) continue;
      h.position = p;
      return;
    }
  }
  throw new Error(`aucune case libre à ${cases} case(s)`);
}

describe('lot 3b : se déplacer puis attaquer (Assaut incisif, Balayage caudal, Offensive…)', () => {
  it('les 24 actions légendaires « effectue une attaque de X » portent leurs données : des attaques du profil, une part de Vitesse', () => {
    let n = 0;
    for (const m of donnees.monstres.values()) {
      for (const a of m.actions) {
        if (!a.legendaire) continue;
        n++;
        expect(estActionLegendaire(a), `${m.id}/${a.id}`).toBe(true);
        for (const id of a.legendaire.attaque) expect(m.actions.find((x) => x.id === id)?.resolution?.type, `${m.id}/${a.id} → ${id}`).toBe('attaque');
        expect(a.legendaire.deplacement ?? 0).toBeGreaterThanOrEqual(0);
        expect(a.legendaire.deplacement ?? 0).toBeLessThanOrEqual(1);
      }
    }
    expect(n).toBe(24);
  });

  it('un adversaire déjà à portée : il ne bouge pas, il frappe (Saignée)', () => {
    const { etat, monstre, heros } = combat('dragon-blanc-adulte');
    monstre.ressources[`${VERROU_LEGENDAIRE}decharge-de-gel`] = 1;
    placer(etat, heros[0]!, monstre, 1);
    const depart = { ...monstre.position };
    actionsLegendairesApres(etat, heros[1]!);
    expect(monstre.position).toEqual(depart);
    expect(monstre.ressources[ACTIONS_LEGENDAIRES]).toBe(2);
    expect(dit(etat, /dépense une action légendaire : Assaut incisif/)).toHaveLength(1);
    expect(dit(etat, /attaque .* \(Sai/).length).toBe(1);
  });

  it('un adversaire à quelques cases : il s’approche (moitié de sa Vitesse), frappe, et son propre mouvement du tour n’est pas entamé', () => {
    const { etat, monstre, heros } = combat('dragon-blanc-adulte');
    monstre.ressources[`${VERROU_LEGENDAIRE}decharge-de-gel`] = 1;
    for (const h of heros.slice(1)) placer(etat, h, monstre, 'loin');
    placer(etat, heros[0]!, monstre, 5);
    const avant = distanceCases(monstre.position, heros[0]!.position);
    const tour = { mouvement: monstre.tour.mouvement, aBouge: monstre.tour.aBouge };
    actionsLegendairesApres(etat, heros[1]!);
    expect(distanceCases(monstre.position, heros[0]!.position)).toBeLessThan(avant);
    expect(distanceCases(monstre.position, heros[0]!.position)).toBeLessThanOrEqual(2);
    expect(dit(etat, /Dragon blanc adulte attaque .* \(Sai/).length).toBeGreaterThanOrEqual(1);
    expect(monstre.tour.mouvement).toBe(tour.mouvement);
    expect(monstre.tour.aBouge).toBe(tour.aBouge);
    expect(monstre.ressources[ACTIONS_LEGENDAIRES]).toBe(2);
  });

  it('un adversaire trop loin pour la moitié de la Vitesse : rien n’est dépensé', () => {
    const { etat, monstre, heros } = combat('dragon-blanc-adulte');
    monstre.ressources[`${VERROU_LEGENDAIRE}decharge-de-gel`] = 1;
    for (const h of heros) placer(etat, h, monstre, 'loin');
    actionsLegendairesApres(etat, heros[0]!);
    expect(monstre.ressources[ACTIONS_LEGENDAIRES]).toBe(3);
  });

  it('sans déplacement (Balayage caudal du dragon bleu) : seulement un adversaire déjà au contact', () => {
    const { etat, monstre, heros } = combat('dragon-bleu-adulte');
    for (const h of heros) placer(etat, h, monstre, 8);
    // Ses autres actions légendaires jouables (Fracas, etc.) n'en sont pas : seule l'attaque est possible, et personne n'est au contact.
    for (const a of actionsLegendairesJouables(monstre)) monstre.ressources[`${VERROU_LEGENDAIRE}${a.id}`] = 1;
    actionsLegendairesApres(etat, heros[0]!);
    expect(monstre.ressources[ACTIONS_LEGENDAIRES]).toBe(3);
    for (const k of Object.keys(monstre.ressources)) if (k.startsWith(VERROU_LEGENDAIRE)) delete monstre.ressources[k];
    monstre.ressources[`${VERROU_LEGENDAIRE}fracas-tonitruant`] = 1;
    placer(etat, heros[0]!, monstre, 1);
    actionsLegendairesApres(etat, heros[1]!);
    expect(dit(etat, /dépense une action légendaire : Balayage caudal/)).toHaveLength(1);
  });
});
