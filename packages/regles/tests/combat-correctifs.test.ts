// Correctifs de l'audit du combat (11/11/2026) : un test par écart corrigé, avec des dés imposés.
import { describe, expect, it } from 'vitest';
import { cartesDisponibles, executer } from '../src/combat/cartes';
import { heroDepuisFiche, monstreDepuisProfil } from '../src/combat/creation';
import { adversairesCiblables, aEtat, combattant, type Combattant, type EtatCombat } from '../src/combat/etat';
import { grilleDepuisTexte, type Grille } from '../src/combat/grille';
import { creerCombat, deplacementsPossibles, deplacer, finTour, infligerDegats } from '../src/combat/moteur';
import { herosPreTires, HEROS_PRE_TIRES, preparerRencontre, RENCONTRES } from '../src/combat/prototype';
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
const monstre = (profil: string, x: number, y: number, id = profil): Combattant => monstreDepuisProfil(donnees.monstres.get(profil)!, id, { x, y });

const ARENE = grilleDepuisTexte(['..........', '..........', '..........', '..........', '..........']);

/** Les combattants jouent dans l'ordre de la liste ; dés imposés dans l'ordre où le moteur les lance. */
function combat(combattants: Combattant[], des: number[] = [], grille: Grille = ARENE): EtatCombat {
  const etat = creerCombat(grille, combattants.map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), 1, { elan: false });
  etat.desImposes = [...des];
  return etat;
}

/** Le dernier jet d'attaque du journal. */
const dernierJet = (etat: EtatCombat) => [...etat.journal].reverse().find((e) => e.type === 'attaque' && e.details && 'resultat' in e.details)?.details as { resultat: string; arme?: string } | undefined;

describe('un héros tombé à 0 PV peut être frappé', () => {
  it('il reste une cible ; un coup au contact est un critique et coûte deux échecs au jet contre la mort', () => {
    const etat = combat([monstre('combattant-gobelin', 2, 1, 'gob'), hero('Bran', 1, 1)], [15, 1, 1, 1, 1]);
    const bran = combattant(etat, 'bran');
    infligerDegats(etat, bran, [{ montant: bran.pv, type: 'contondant' }], undefined);
    expect(aEtat(bran, 'inconscient')).toBe(true);
    expect(adversairesCiblables(etat, combattant(etat, 'gob')).map((c) => c.id)).toEqual(['bran']);
    const carte = cartesDisponibles(etat, ctx, 'gob').find((k) => k.jouable && k.cibles.includes('bran'));
    expect(carte, 'une attaque du gobelin vise le héros tombé').toBeDefined();
    expect(executer(etat, ctx, { type: 'jouer', carte: carte!.id, cibles: ['bran'] }).ok).toBe(true);
    expect(dernierJet(etat)?.resultat).toBe('critique');
    expect(bran.jetsMort.echecs).toBe(2);
    expect(bran.mort).toBe(false);
  });

  it('un mort ou un fuyard n’est pas une cible', () => {
    const etat = combat([monstre('combattant-gobelin', 2, 1, 'gob'), hero('Bran', 1, 1)]);
    combattant(etat, 'bran').mort = true;
    expect(adversairesCiblables(etat, combattant(etat, 'gob'))).toEqual([]);
  });
});

describe('la victoire tombe dès que le dernier adversaire tombe', () => {
  it('sans attendre la fin du tour', () => {
    const etat = combat([hero('Bran', 1, 1), monstre('combattant-gobelin', 2, 1, 'gob')], [15, 6, 6, 6]);
    combattant(etat, 'gob').pv = 1;
    const carte = cartesDisponibles(etat, ctx, 'bran').find((k) => k.jouable && k.cibles.includes('gob') && k.id.startsWith('attaque:'))!;
    expect(executer(etat, ctx, { type: 'jouer', carte: carte.id, cibles: ['gob'] }).ok).toBe(true);
    expect(combattant(etat, 'gob').mort).toBe(true);
    expect(etat.vainqueur).toBe('heros');
    expect(executer(etat, ctx, { type: 'finTour' }).ok).toBe(false);
  });
});

describe('critique amélioré : seul le 20 naturel touche toujours', () => {
  it('un 19 rate une CA hors d’atteinte, et fait un critique quand il touche', () => {
    const fort = () => {
      const b = hero('Bran', 1, 1);
      b.traits = [...b.traits, 'critique-ameliore'];
      return b;
    };
    const etat = combat([fort(), monstre('combattant-gobelin', 2, 1, 'gob')], [19, 4, 4, 4, 4]);
    combattant(etat, 'gob').caBase = 40;
    const carte = cartesDisponibles(etat, ctx, 'bran').find((k) => k.jouable && k.cibles.includes('gob') && k.id.startsWith('attaque:'))!;
    executer(etat, ctx, { type: 'jouer', carte: carte.id, cibles: ['gob'] });
    expect(dernierJet(etat)?.resultat).toBe('rate');

    const etat2 = combat([fort(), monstre('combattant-gobelin', 2, 1, 'gob')], [19, 1, 1, 1, 1]);
    combattant(etat2, 'gob').pvMax = combattant(etat2, 'gob').pv = 99;
    executer(etat2, ctx, { type: 'jouer', carte: carte.id, cibles: ['gob'] });
    expect(dernierJet(etat2)?.resultat).toBe('critique');
  });
});

describe('le jet contre la mort est un jet de sauvegarde', () => {
  it('Bénédiction transforme un 8 en réussite', () => {
    // Hilda reste debout : sans elle, Bran tombé seul serait une défaite et le combat s'arrêterait.
    const etat = combat([hero('Bran', 1, 1), monstre('combattant-gobelin', 8, 4, 'gob'), hero('Hilda', 1, 3)]);
    const bran = combattant(etat, 'bran');
    infligerDegats(etat, bran, [{ montant: bran.pv, type: 'contondant' }], undefined);
    bran.modificateurs.push({ id: 'benediction-s', type: 'de_sauvegarde', de: '1d4', source: 'bran', sort: 'benediction' });
    finTour(etat); // Bran → gobelin
    finTour(etat); // gobelin → Hilda
    // Le tour de Bran : jet contre la mort (8), puis le d4 de Bénédiction (3) : 11, une réussite.
    etat.desImposes = [8, 3];
    finTour(etat); // Hilda → Bran
    expect(bran.jetsMort).toEqual({ succes: 1, echecs: 0 });
  });
});

describe('s’échapper d’une prise : la maîtrise ne compte que si on l’a', () => {
  it('Athlétisme sans maîtrise : le modificateur seul', () => {
    const etat = combat([hero('Bran', 1, 1), monstre('combattant-gobelin', 2, 1, 'gob')], [11]);
    const bran = combattant(etat, 'bran');
    bran.mods = { ...bran.mods, for: 3, dex: 1 };
    bran.competences = { athletisme: 3, acrobaties: 1 };
    bran.etats.push({ etat: 'empoigne', evasion: 15, source: 'gob' } as never);
    const carte = cartesDisponibles(etat, ctx, 'bran').find((k) => k.id === 'base:echapper');
    expect(carte?.jouable).toBe(true);
    executer(etat, ctx, { type: 'jouer', carte: 'base:echapper', cibles: [] });
    // 11 + 3 = 14 < 15 : toujours empoigné (l'ancien calcul ajoutait la maîtrise et donnait 16).
    expect(aEtat(bran, 'empoigne')).toBe(true);
  });
});

describe('attaque d’opportunité : l’arme qui atteint la cible', () => {
  it('à 3 m, c’est l’arme à allonge qui frappe, pas l’épée', () => {
    const b = hero('Bran', 1, 1);
    const epee = b.attaques.find((a) => a.mode === 'corps-a-corps')!;
    b.attaques = [{ ...epee, allonge: 1.5 }, { ...epee, id: 'coutille', nom: 'Coutille', allonge: 3 }];
    const etat = combat([monstre('combattant-gobelin', 3, 1, 'gob'), b], [15, 1, 1, 1]);
    // Le gobelin, à 3 m (deux cases) de Bran, s'éloigne : il quitte l'allonge de la coutille.
    expect(deplacer(etat, combattant(etat, 'gob'), { x: 6, y: 1 })).toBe(true);
    expect(dernierJet(etat)?.arme).toBe('coutille');
  });
});

describe('une créature hostile bloque le passage, même inconsciente', () => {
  it('un gobelin ne traverse pas la case d’un héros tombé dans un couloir', () => {
    const couloir = grilleDepuisTexte(['#######', '.......', '#######']);
    const etat = combat([monstre('combattant-gobelin', 0, 1, 'gob'), hero('Bran', 2, 1)], [], couloir);
    const bran = combattant(etat, 'bran');
    infligerDegats(etat, bran, [{ montant: bran.pv, type: 'contondant' }], undefined);
    const chemins = deplacementsPossibles(etat, combattant(etat, 'gob'));
    expect(chemins.has('3,1')).toBe(false);
  });
});

describe('préparer une rencontre', () => {
  it('plus de héros que de cases libres sur la carte : une erreur claire, pas un plantage plus loin', () => {
    // Faute de cases « H », les héros prennent les sols libres les plus proches ; ici il n'y en a qu'une.
    const r = { ...RENCONTRES[0]!, carte: ['H#m'] };
    expect(() => preparerRencontre(r, donnees, herosPreTires(donnees))).toThrow(/case\(s\) de départ/);
  });
});

describe('relever un allié à terre avec une potion de soins', () => {
  it('la potion vise un allié à 0 PV au contact : il reprend conscience avec les PV rendus ; hors de portée ou plein de PV, pas de cible', () => {
    const etat = combat([hero('Hilda', 1, 1), hero('Bran', 2, 1), hero('Pip', 7, 1), monstre('ogre', 9, 4, 'ogre')]);
    const [hilda, bran] = [combattant(etat, 'hilda'), combattant(etat, 'bran')];
    hilda.ressources.potions = 1;
    expect(cartesDisponibles(etat, ctx, 'hilda').find((k) => k.id === 'base:potion')!.cibles).toEqual([]); // Hilda est en pleine forme et Bran aussi : personne à soigner
    infligerDegats(etat, bran, [{ montant: bran.pv, type: 'contondant' }], undefined);
    expect(bran.pv).toBe(0);
    expect(aEtat(bran, 'inconscient')).toBe(true);
    const carte = cartesDisponibles(etat, ctx, 'hilda').find((k) => k.id === 'base:potion')!;
    expect(carte.cibles).toContain('bran');
    expect(carte.jouable).toBe(true);
    // Un allié à terre mais loin (Pip, à 7 cases de Bran) n'a pas de potion à portée ; lui seul est visé quand il est au contact.
    combattant(etat, 'pip').pv = 0;
    expect(cartesDisponibles(etat, ctx, 'hilda').find((k) => k.id === 'base:potion')!.cibles).not.toContain('pip');
    etat.desImposes = [4, 4];
    expect(executer(etat, ctx, { type: 'jouer', carte: 'base:potion', cibles: ['bran'] }).ok).toBe(true);
    expect(bran.pv).toBeGreaterThan(0);
    expect(aEtat(bran, 'inconscient')).toBe(false);
    expect(hilda.ressources.potions).toBe(0);
    expect(hilda.tour.bonus).toBe(false);
  });
});
