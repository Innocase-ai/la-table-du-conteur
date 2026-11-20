// F6 (PRD-SAGA), lot 6 — les grandes créatures sur plusieurs cases : Très grande (3 × 3) et Gigantesque (4 × 4). Les créatures Grandes (2 × 2) tiennent encore sur
// une case (elles changeraient toutes les rencontres déjà jouées) ; les autres tailles n'ont pas bougé.
import { describe, expect, it } from 'vitest';
import { casesDeTaille, casesOccupees, cheminsAtteignables, distanceCases, distanceMetres, grilleDepuisTexte } from '../src/combat/grille';
import { creerCombat, aPortee, opportunitesSurChemin, deplacementsPossibles, occupation } from '../src/combat/moteur';
import { horsCombat, type Combattant, type EtatCombat } from '../src/combat/etat';
import { IA_RAPIDE, jouerTourIA } from '../src/combat/ia';
import { preparerRencontre, RENCONTRES, type Rencontre } from '../src/combat/prototype';
import { chargerDonneesSrd } from '../src/donnees-node';

const donnees = chargerDonneesSrd();

function combat(profil: string, graine = 3): { etat: EtatCombat; monstre: Combattant; heros: Combattant[] } {
  const r: Rencontre = { ...RENCONTRES[0]!, id: 'grande-essai', nom: 'Grande créature (essai)', monstres: [{ profil, nombre: 1 }] };
  const { grille, combattants } = preparerRencontre(r, donnees);
  const etat = creerCombat(grille, combattants, graine);
  return { etat, monstre: etat.combattants.find((c) => c.camp === 'monstres')!, heros: etat.combattants.filter((c) => c.camp === 'heros') };
}

describe('l’empreinte d’une créature', () => {
  it('Très grande : 3 × 3 centrée sur son ancrage ; Gigantesque : 4 × 4 de −1 à +2 ; les autres tailles : une case', () => {
    expect(casesDeTaille('TG')).toBe(3);
    expect(casesDeTaille('Gig')).toBe(4);
    for (const t of ['TP', 'P', 'M', 'G']) expect(casesDeTaille(t)).toBe(1);
    const tg = casesOccupees({ position: { x: 5, y: 5 }, taille: 'TG' });
    expect(tg).toHaveLength(9);
    expect(tg.map((p) => `${p.x},${p.y}`).sort()).toEqual(['4,4', '4,5', '4,6', '5,4', '5,5', '5,6', '6,4', '6,5', '6,6']);
    const gig = casesOccupees({ position: { x: 5, y: 5 }, taille: 'Gig' });
    expect(gig).toHaveLength(16);
    expect(Math.min(...gig.map((p) => p.x))).toBe(4);
    expect(Math.max(...gig.map((p) => p.x))).toBe(7);
    expect(casesOccupees({ x: 2, y: 3 })).toEqual([{ x: 2, y: 3 }]);
    expect(casesOccupees({ position: { x: 2, y: 3 }, taille: 'M' })).toEqual([{ x: 2, y: 3 }]);
  });

  it('la distance entre deux créatures est celle de leurs cases les plus proches ; entre deux cases, elle est inchangée', () => {
    expect(distanceCases({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(4);
    expect(distanceMetres({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(6);
    const dragon = { position: { x: 10, y: 5 }, taille: 'TG' };
    expect(distanceCases(dragon, { x: 12, y: 5 })).toBe(1);
    expect(distanceCases(dragon, { x: 13, y: 5 })).toBe(2);
    expect(distanceCases(dragon, { x: 10, y: 5 })).toBe(0);
    expect(distanceCases({ x: 13, y: 8 }, dragon)).toBe(2);
    expect(distanceCases(dragon, { position: { x: 13, y: 5 }, taille: 'TG' })).toBe(1);
  });
});

describe('le déplacement d’une grande créature', () => {
  const salle = grilleDepuisTexte(['##########', '#........#', '#........#', '#........#', '#........#', '#........#', '##########']);
  const libre = { bloquees: new Set<string>(), occupees: new Set<string>() };

  it('son ancrage ne s’approche pas d’un mur : toute son empreinte doit tenir', () => {
    const chemins = cheminsAtteignables(salle, { x: 4, y: 3 }, 30, libre, 'TG');
    const ancrages = [...chemins.values()].map((c) => c.arrivee);
    expect(ancrages.length).toBeGreaterThan(5);
    for (const a of ancrages) {
      expect(a.x).toBeGreaterThanOrEqual(2);
      expect(a.x).toBeLessThanOrEqual(7);
      expect(a.y).toBeGreaterThanOrEqual(2);
      expect(a.y).toBeLessThanOrEqual(4);
    }
    // Une créature d'une case, elle, atteint toute la salle (comportement inchangé).
    const petit = [...cheminsAtteignables(salle, { x: 4, y: 3 }, 30, libre).values()].map((c) => c.arrivee);
    expect(petit.some((a) => a.x === 1)).toBe(true);
  });

  it('un couloir de largeur 2 est fermé à une grande créature', () => {
    const couloir = grilleDepuisTexte(['#########', '#.......#', '#.......#', '####.####', '####.####', '#.......#', '#.......#', '#########']);
    const chemins = cheminsAtteignables(couloir, { x: 3, y: 1 }, 60, libre, 'TG');
    expect([...chemins.values()].some((c) => c.arrivee.y >= 5)).toBe(false);
    const petit = cheminsAtteignables(couloir, { x: 3, y: 1 }, 60, libre);
    expect([...petit.values()].some((c) => c.arrivee.y >= 5)).toBe(true);
  });

  it('elle ne traverse ni ne s’arrête sur l’empreinte d’une autre créature, et personne ne traverse la sienne', () => {
    const { etat, monstre, heros } = combat('dragon-blanc-adulte');
    const prises = new Set(casesOccupees(monstre).map((p) => `${p.x},${p.y}`));
    const occ = occupation(etat, heros[0]!);
    for (const k of prises) {
      expect(occ.occupees.has(k)).toBe(true);
      expect(occ.bloquees.has(k)).toBe(true);
    }
    const chemins = deplacementsPossibles(etat, heros[0]!);
    for (const c of chemins.values()) expect(prises.has(`${c.arrivee.x},${c.arrivee.y}`)).toBe(false);
  });

  it('le terrain difficile sous un seul bord de son empreinte double le coût du pas', () => {
    const g = grilleDepuisTexte(['#########', '#.......#', '#.......#', '#...~...#', '#.......#', '#.......#', '#########']);
    const chemins = cheminsAtteignables(g, { x: 2, y: 2 }, 30, libre, 'TG');
    // Ancrage (3,2) : l'empreinte (cases 2 à 4 × 1 à 3) recouvre la case difficile (4,3) : le pas coûte le double ; ancrage (2,3) : elle ne la touche pas.
    expect(chemins.get('3,2')!.cout).toBe(3);
    expect(chemins.get('2,3')!.cout).toBe(1.5);
  });
});

describe('placement, portée et attaques d’opportunité', () => {
  it('au départ, toute l’empreinte d’un dragon est sur le sol, dans la grille, sans autre combattant', () => {
    for (const profil of ['dragon-blanc-adulte', 'tarasque', 'kraken']) {
      const { etat } = combat(profil);
      const vues = new Set<string>();
      for (const c of etat.combattants) {
        for (const p of casesOccupees(c)) {
          expect(p.x >= 0 && p.y >= 0 && p.x < etat.grille.largeur && p.y < etat.grille.hauteur, `${c.id} dans la grille`).toBe(true);
          expect(etat.grille.cases[p.y * etat.grille.largeur + p.x], `${c.id} sur le sol`).not.toBe('mur');
          const k = `${p.x},${p.y}`;
          expect(vues.has(k), `${c.id} : case ${k} déjà prise`).toBe(false);
          vues.add(k);
        }
      }
    }
  });

  it('un héros au contact d’un bord de l’empreinte atteint le dragon au corps à corps ; à deux cases, non', () => {
    const { etat, monstre, heros } = combat('dragon-blanc-adulte');
    const h = heros[0]!;
    h.position = { x: monstre.position.x + 2, y: monstre.position.y };
    expect(aPortee(etat, h, monstre, 1.5)).toBe(true);
    h.position = { x: monstre.position.x + 3, y: monstre.position.y };
    expect(aPortee(etat, h, monstre, 1.5)).toBe(false);
    expect(aPortee(etat, h, monstre, 3)).toBe(true);
  });

  it('un héros collé au dragon fait une attaque d’opportunité quand il s’éloigne ; s’il reste au contact, non', () => {
    const { etat, monstre, heros } = combat('dragon-blanc-adulte');
    const h = heros[0]!;
    h.position = { x: monstre.position.x + 2, y: monstre.position.y };
    h.ressources.reaction = 1;
    monstre.tour.desengage = false;
    const contre = opportunitesSurChemin(etat, h, [{ x: h.position.x + 1, y: h.position.y }, { x: h.position.x + 2, y: h.position.y }]);
    // Le dragon réagit quand le héros sort de son allonge (3 m = 2 cases depuis le bord de son empreinte).
    expect([...contre.values()].flat()).toContain(monstre.id);
    const reste = opportunitesSurChemin(etat, h, [{ x: h.position.x, y: h.position.y + 1 }]);
    expect([...reste.values()].flat()).not.toContain(monstre.id);
  });
});

describe('les créatures Grandes et plus petites ne changent pas', () => {
  it('un ogre (Grand) tient sur une case : même ancrage, mêmes cases, même distance', () => {
    const { monstre } = combat('ogre');
    expect(monstre.taille).toBe('G');
    expect(casesOccupees(monstre)).toEqual([monstre.position]);
  });

  it('la simulation de référence ne contient aucune créature Très grande ni Gigantesque (sa sortie est inchangée par ce lot)', () => {
    const tailles = new Set(RENCONTRES.flatMap((r) => r.monstres.map((m) => donnees.monstres.get(m.profil)!.taille)));
    expect([...tailles].some((t) => casesDeTaille(t) > 1)).toBe(false);
  });
});

describe('dans un combat', () => {
  it('un dragon se bat jusqu’au bout : à chaque tour, aucune empreinte ne chevauche une autre ni ne mord sur un mur', () => {
    for (const graine of [9, 10, 11]) {
      const { etat } = combat('dragon-blanc-adulte', graine);
      let tours = 0;
      while (!etat.vainqueur && etat.round < 20 && tours++ < 400) {
        jouerTourIA(etat, { sorts: donnees.sorts }, IA_RAPIDE);
        const vues = new Map<string, string>();
        for (const c of etat.combattants.filter((x) => x.pv > 0 && !horsCombat(x))) {
          for (const p of casesOccupees(c)) {
            expect(etat.grille.cases[p.y * etat.grille.largeur + p.x], `${c.id} dans un mur en (${p.x},${p.y})`).not.toBe('mur');
            const k = `${p.x},${p.y}`;
            expect(vues.get(k), `${c.id} et ${vues.get(k)} sur la case ${k} (tour ${tours}, round ${etat.round})`).toBeUndefined();
            vues.set(k, c.id);
          }
        }
      }
    }
  });
});
