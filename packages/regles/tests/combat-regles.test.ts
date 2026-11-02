// Règles de combat, avec des dés imposés pour des situations précises.
import { beforeEach, describe, expect, it } from 'vitest';
import { cartesDisponibles, executer } from '../src/combat/cartes';
import { heroDepuisFiche, monstreDepuisProfil } from '../src/combat/creation';
import { actif, aEtat, combattant, type Combattant, type EtatCombat } from '../src/combat/etat';
import { cheminsAtteignables, distanceMetres, grilleDepuisTexte, ligneDeVue } from '../src/combat/grille';
import { creerCombat, finTour, infligerDegats } from '../src/combat/moteur';
import { HEROS_PRE_TIRES } from '../src/combat/prototype';
import { chargerDonneesSrd } from '../src/donnees-node';
import { calculerFiche } from '../src/fiche';

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };

function hero(nom: string, x: number, y: number): Combattant {
  const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === nom)!;
  const r = calculerFiche(h.choix, donnees);
  if (!r.ok) throw new Error(r.erreurs.join());
  return heroDepuisFiche(r.fiche, h.kit, donnees, { x, y });
}

function monstre(profil: string, x: number, y: number, id = profil): Combattant {
  return monstreDepuisProfil(donnees.monstres.get(profil)!, id, { x, y });
}

const ARENE = grilleDepuisTexte(['..........', '..........', '..........', '..........', '..........']);

/** Combat où les combattants jouent dans l'ordre de la liste (écarts d'initiative énormes). */
function creerCombatImpose(combattants: Combattant[]): EtatCombat {
  return creerCombat(ARENE, combattants.map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), 1, { elan: false });
}

function combat(combattants: Combattant[], des: number[] = []): EtatCombat {
  const etat = creerCombatImpose(combattants);
  etat.desImposes = [...des];
  return etat;
}

describe('grille', () => {
  it('distance : une diagonale vaut une case de 1,5 m', () => {
    expect(distanceMetres({ x: 0, y: 0 }, { x: 3, y: 2 })).toBe(4.5);
  });

  it('les murs bloquent la ligne de vue', () => {
    const g = grilleDepuisTexte(['.....', '..#..', '.....']);
    expect(ligneDeVue(g, { x: 0, y: 1 }, { x: 4, y: 1 })).toBe(false);
    expect(ligneDeVue(g, { x: 0, y: 0 }, { x: 4, y: 0 })).toBe(true);
  });

  it('le terrain difficile coûte double et les ennemis bloquent le passage', () => {
    const g = grilleDepuisTexte(['.~.', '...']);
    const libre = cheminsAtteignables(g, { x: 0, y: 0 }, 3, { bloquees: new Set(), occupees: new Set() });
    expect(libre.get('1,0')!.cout).toBe(3);
    const couloir = grilleDepuisTexte(['#####', '.....', '#####']);
    const bloque = cheminsAtteignables(couloir, { x: 0, y: 1 }, 9, { bloquees: new Set(['2,1']), occupees: new Set(['2,1']) });
    expect(bloque.has('3,1')).toBe(false);
  });
});

describe('règles de combat', () => {
  let etat: EtatCombat;

  describe("attaque d'opportunité", () => {
    beforeEach(() => {
      etat = combat([hero('Bran', 1, 1), monstre('combattant-gobelin', 2, 1, 'gob')]);
    });

    it('quitter l\'allonge d\'un ennemi provoque une attaque', () => {
      expect(actif(etat).id).toBe('bran');
      etat.desImposes = [2]; // le gobelin rate
      expect(executer(etat, ctx, { type: 'deplacer', vers: { x: 0, y: 4 } }).ok).toBe(true);
      expect(etat.journal.some((e) => e.texte.includes("attaque d'opportunité"))).toBe(true);
    });

    it('se désengager évite l\'attaque', () => {
      executer(etat, ctx, { type: 'jouer', carte: 'base:desengager' });
      executer(etat, ctx, { type: 'deplacer', vers: { x: 0, y: 4 } });
      expect(etat.journal.some((e) => e.texte.includes("attaque d'opportunité"))).toBe(false);
    });
  });

  it('un critique double les dés de dégâts', () => {
    etat = combat([hero('Bran', 1, 1), monstre('ogre', 2, 1, 'ogre')]);
    // d20 = 20, puis 2d8 d'épée longue : 8 et 8.
    etat.desImposes = [20, 8, 8];
    executer(etat, ctx, { type: 'jouer', carte: 'attaque:epee-longue', cibles: ['ogre'] });
    const ogre = combattant(etat, 'ogre');
    expect(ogre.pvMax - ogre.pv).toBe(16 + 3);
  });

  it('la rage divise par deux les dégâts physiques', () => {
    etat = combat([hero('Grukk', 1, 1), monstre('ogre', 2, 1, 'ogre')]);
    executer(etat, ctx, { type: 'jouer', carte: 'aptitude:rage' });
    const grukk = combattant(etat, 'grukk');
    infligerDegats(etat, grukk, [{ montant: 11, type: 'contondant' }], combattant(etat, 'ogre'));
    expect(grukk.pvMax - grukk.pv).toBe(5);
  });

  it('un héros à 0 PV tombe inconscient, subit des échecs contre la mort et se relève avec des soins', () => {
    etat = combat([hero('Hilda', 1, 1), hero('Ambrine', 2, 1), monstre('ogre', 5, 1, 'ogre')]);
    const ambrine = combattant(etat, 'ambrine');
    infligerDegats(etat, ambrine, [{ montant: ambrine.pv + 1, type: 'contondant' }], undefined);
    expect(aEtat(ambrine, 'inconscient')).toBe(true);
    infligerDegats(etat, ambrine, [{ montant: 2, type: 'contondant' }], undefined);
    expect(ambrine.jetsMort.echecs).toBe(1);
    etat.desImposes = [4, 4];
    executer(etat, ctx, { type: 'jouer', carte: 'sort:mot-de-guerison', cibles: ['ambrine'] });
    expect(ambrine.pv).toBeGreaterThan(0);
    expect(aEtat(ambrine, 'inconscient')).toBe(false);
  });

  it('la concentration se perd sur une sauvegarde de Constitution ratée', () => {
    etat = combat([hero('Hilda', 1, 1), hero('Bran', 2, 1), monstre('ogre', 6, 1, 'ogre')]);
    executer(etat, ctx, { type: 'jouer', carte: 'sort:benediction', cibles: ['hilda', 'bran'] });
    expect(combattant(etat, 'bran').modificateurs.some((m) => m.id === 'benediction-a')).toBe(true);
    etat.desImposes = [1, 1]; // sauvegarde de Con : 1, puis 1d4 de Bénédiction : 1
    infligerDegats(etat, combattant(etat, 'hilda'), [{ montant: 5, type: 'contondant' }], undefined);
    expect(combattant(etat, 'hilda').concentration).toBeUndefined();
    expect(combattant(etat, 'bran').modificateurs.some((m) => m.id === 'benediction-a')).toBe(false);
  });

  it('Bouclier transforme un coup de justesse en échec', () => {
    etat = combat([monstre('ogre', 2, 1, 'ogre'), hero('Ambrine', 1, 1)]);
    const ambrine = combattant(etat, 'ambrine');
    const caAvant = ambrine.caBase;
    // L'ogre (+6) fait 9 : 15 touche la CA de base mais pas CA + 5.
    etat.desImposes = [caAvant - 6];
    executer(etat, ctx, { type: 'jouer', carte: 'monstre:massue', cibles: ['ambrine'] });
    expect(ambrine.pv).toBe(ambrine.pvMax);
    expect(ambrine.incantation!.emplacements[0]).toBe(ambrine.incantation!.emplacementsMax[0]! - 1);
  });

  it("l'attaque sournoise demande l'avantage ou un allié au contact de la cible", () => {
    etat = combat([hero('Pip', 1, 1), monstre('ogre', 2, 1, 'ogre'), hero('Bran', 3, 1)]);
    etat.desImposes = [15, 4, 3, 3];
    executer(etat, ctx, { type: 'jouer', carte: 'attaque:rapiere', cibles: ['ogre'] });
    expect(etat.journal.some((e) => e.texte === 'Attaque sournoise !')).toBe(true);
  });

  it('Sommeil : neutralisé, puis endormi sur un second échec, réveillé par des dégâts', () => {
    etat = combat([hero('Ambrine', 1, 1), monstre('combattant-gobelin', 6, 1, 'gob')]);
    etat.desImposes = [1];
    executer(etat, ctx, { type: 'jouer', carte: 'sort:sommeil', point: { x: 6, y: 1 } });
    const gob = combattant(etat, 'gob');
    expect(aEtat(gob, 'neutralise')).toBe(true);
    // Tour du gobelin : il ne peut pas agir et rate sa sauvegarde de fin de tour.
    etat.desImposes = [1];
    finTour(etat);
    expect(aEtat(gob, 'inconscient')).toBe(true);
    infligerDegats(etat, gob, [{ montant: 1, type: 'perforant' }], undefined);
    expect(aEtat(gob, 'inconscient')).toBe(false);
  });

  it('la griffe de la goule paralyse sur une sauvegarde ratée, jusqu\'à la fin du tour suivant de la cible', () => {
    etat = combat([monstre('goule', 2, 1, 'goule'), hero('Bran', 1, 1)]);
    // Attaque 15 (touche), dégâts 1d4 = 2, sauvegarde de Con 1 (ratée).
    etat.desImposes = [15, 2, 1];
    executer(etat, ctx, { type: 'jouer', carte: 'monstre:griffe', cibles: ['bran'] });
    const bran = combattant(etat, 'bran');
    expect(aEtat(bran, 'paralyse')).toBe(true);
    finTour(etat); // tour de Bran, paralysé : il passe, l'état prend fin à la fin de son tour
    expect(aEtat(bran, 'paralyse')).toBe(false);
  });

  it("les cartes respectent le budget d'actions et l'élan se joue une fois par tour", () => {
    const e = creerCombatImpose([hero('Bran', 1, 1), monstre('ogre', 2, 1, 'ogre')]);
    e.options.elan = true;
    e.combattants[0]!.elan!.main = ['garde-haute', 'second-vent'];
    executer(e, ctx, { type: 'jouer', carte: 'attaque:epee-longue', cibles: ['ogre'] });
    const apres = cartesDisponibles(e, ctx, 'bran');
    expect(apres.find((k) => k.id === 'attaque:epee-longue')!.jouable).toBe(false);
    expect(executer(e, ctx, { type: 'jouer', carte: 'elan:0:garde-haute' }).ok).toBe(true);
    expect(cartesDisponibles(e, ctx, 'bran').find((k) => k.id.startsWith('elan:'))!.jouable).toBe(false);
  });
});
