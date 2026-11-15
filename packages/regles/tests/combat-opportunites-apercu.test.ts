// Aperçu des attaques d'opportunité sur un chemin (audit UX du 15/11/2026, proposition 2a) : `opportunitesSurChemin` ne mute rien
// et dit, étape par étape, quels ennemis feraient une attaque d'opportunité. Il partage sa règle avec `deplacer` : on vérifie
// qu'ils s'accordent.
import { describe, expect, it } from 'vitest';
import { combattant, type Combattant, type EtatCombat } from '../src/combat/etat';
import { grilleDepuisTexte } from '../src/combat/grille';
import { creerCombat, deplacementsPossibles, deplacer, opportunitesSurChemin } from '../src/combat/moteur';
import { HEROS_PRE_TIRES } from '../src/combat/prototype';
import { heroDepuisFiche, monstreDepuisProfil } from '../src/combat/creation';
import { chargerDonneesSrd } from '../src/donnees-node';
import { calculerFiche } from '../src/fiche';

const donnees = chargerDonneesSrd();

function hero(nom: string, x: number, y: number): Combattant {
  const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === nom)!;
  const r = calculerFiche(h.choix, donnees);
  if (!r.ok) throw new Error(r.erreurs.join());
  return heroDepuisFiche(r.fiche, h.kit, donnees, { x, y });
}
const gobelin = (id: string, x: number, y: number): Combattant => monstreDepuisProfil(donnees.monstres.get('combattant-gobelin')!, id, { x, y });

// Couloir d'une case de large (rangée 1) ; un gobelin dans l'alcôve (1,0), un autre en (4,0).
const COULOIR = ['#.##.#########', '..............', '##############'];

function nouveau(): { etat: EtatCombat; marcheur: Combattant } {
  const marcheur = hero('Bran', 0, 1);
  const g1 = gobelin('g1', 1, 0);
  const g2 = gobelin('g2', 4, 0);
  const etat = creerCombat(grilleDepuisTexte(COULOIR), [marcheur, g1, g2].map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), 1, { elan: false });
  return { etat, marcheur: combattant(etat, 'bran') };
}

const chemin = (etat: EtatCombat, c: Combattant, vers: { x: number; y: number }) => deplacementsPossibles(etat, c).get(`${vers.x},${vers.y}`)!.etapes;

describe('opportunitesSurChemin : aperçu des attaques d’opportunité', () => {
  it('marque l’étape où le héros sort de l’allonge du gobelin, et l’ennemi qui frapperait', () => {
    const { etat, marcheur } = nouveau();
    const res = opportunitesSurChemin(etat, marcheur, chemin(etat, marcheur, { x: 3, y: 1 }));
    expect([...res.keys()]).toEqual(['3,1']); // (1,1) et (2,1) sont encore à 1,5 m de (1,0)
    expect(res.get('3,1')).toEqual(['g1']);
  });

  it('ne mute rien : position, réactions et journal restent intacts', () => {
    const { etat, marcheur } = nouveau();
    const avant = JSON.stringify(etat);
    opportunitesSurChemin(etat, marcheur, chemin(etat, marcheur, { x: 5, y: 1 }));
    expect(JSON.stringify(etat)).toBe(avant);
  });

  it('un héros déjà désengagé ne provoque rien', () => {
    const { etat, marcheur } = nouveau();
    marcheur.tour.desengage = true;
    expect(opportunitesSurChemin(etat, marcheur, chemin(etat, marcheur, { x: 4, y: 1 })).size).toBe(0);
  });

  it('un ennemi sans réaction (ou hors d’état d’agir) ne menace pas', () => {
    const { etat, marcheur } = nouveau();
    combattant(etat, 'g1').ressources.reaction = 0;
    expect(opportunitesSurChemin(etat, marcheur, chemin(etat, marcheur, { x: 4, y: 1 })).size).toBe(0);
  });

  it('un ennemi mort ne menace pas', () => {
    const { etat, marcheur } = nouveau();
    const g1 = combattant(etat, 'g1');
    g1.pv = 0;
    g1.mort = true;
    expect(opportunitesSurChemin(etat, marcheur, chemin(etat, marcheur, { x: 4, y: 1 })).size).toBe(0);
  });

  it('plusieurs ennemis sur le trajet : chacun apparaît une seule fois, à l’étape où il est quitté', () => {
    const { etat, marcheur } = nouveau();
    const res = opportunitesSurChemin(etat, marcheur, chemin(etat, marcheur, { x: 6, y: 1 }));
    expect(res.get('3,1')).toEqual(['g1']);
    // g2 est en (4,0) : on entre dans son allonge en (3,1), on la quitte en (6,1) ; l'entrée ne provoque rien.
    expect(res.get('6,1')).toEqual(['g2']);
    expect(res.size).toBe(2);
  });

  it('un héros qui part hors de toute allonge ne provoque rien', () => {
    const etat = creerCombat(grilleDepuisTexte(COULOIR), [hero('Bran', 10, 1), gobelin('g1', 1, 0)].map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), 1, { elan: false });
    const m = combattant(etat, 'bran');
    expect(opportunitesSurChemin(etat, m, chemin(etat, m, { x: 12, y: 1 })).size).toBe(0);
  });

  it('s’accorde avec deplacer : l’aperçu prédit exactement la réaction consommée', () => {
    const { etat, marcheur } = nouveau();
    const etapes = chemin(etat, marcheur, { x: 6, y: 1 });
    const prevus = new Set([...opportunitesSurChemin(etat, marcheur, etapes).values()].flat());
    marcheur.pv = marcheur.pvMax = 500; // le marcheur ne tombe pas : on veut le trajet entier
    expect(deplacer(etat, marcheur, { x: 6, y: 1 })).toBe(true);
    const aFrappe = new Set(etat.journal.filter((e) => e.type === 'attaque' && e.texte.includes('opportunité')).map((e) => e.acteur));
    expect(aFrappe).toEqual(prevus);
    for (const id of prevus) expect(combattant(etat, id!).ressources.reaction).toBe(0);
  });
});
