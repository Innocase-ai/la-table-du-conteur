// Les bruitages et le tracé des coups, vérifiés sur un vrai journal du moteur (et non sur des événements écrits à la main) :
// c'est là que se cachaient le coup muet sous la Marque du chasseur et le Bouclier silencieux.
import { describe, expect, it } from 'vitest';
import {
  attaqueMonstre,
  calculerFiche,
  combattant,
  creerCombat,
  executer,
  grilleDepuisTexte,
  heroDepuisFiche,
  HEROS_PRE_TIRES,
  monstreDepuisProfil,
  type Combattant,
  type EtatCombat,
  type Evenement,
} from '@crpg/regles';
import { chargerDonneesSrd } from '../../../packages/regles/src/donnees-node';
import { effetsDeCoup } from './animations';
import { familleDominante, famillePhysique } from './effets-visuels';
import { degatsDeLAttaque, sonAuLancement, sonDeCoup, sonDeTir } from './sons-regles';

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };
const ARENE = grilleDepuisTexte(['..........', '..........', '..........', '..........', '..........']);

function hero(nom: string, x: number, y: number): Combattant {
  const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === nom)!;
  const r = calculerFiche(h.choix, donnees);
  if (!r.ok) throw new Error(r.erreurs.join());
  return heroDepuisFiche(r.fiche, h.kit, donnees, { x, y });
}

function monstre(profil: string, x: number, y: number, id = profil): Combattant {
  return monstreDepuisProfil(donnees.monstres.get(profil)!, id, { x, y });
}

/** Un combat où chacun joue dans l'ordre de la liste, avec des dés imposés. */
function combat(combattants: Combattant[], des: number[]): EtatCombat {
  const etat = creerCombat(ARENE, combattants.map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), 1, { elan: false });
  etat.desImposes = [...des];
  return etat;
}

/** La dernière attaque du journal faite avec cette arme, et les dégâts qu'elle porte. */
function derniereAttaque(journal: Evenement[], arme: string): { attaque: Evenement; degats?: Evenement } {
  const i = journal.map((e) => e.type === 'attaque' && e.details?.arme === arme).lastIndexOf(true);
  expect(i, `aucune attaque avec ${arme} dans le journal`).toBeGreaterThanOrEqual(0);
  return { attaque: journal[i]!, degats: degatsDeLAttaque(journal, i) };
}

describe('bruitages sur un vrai journal du moteur', () => {
  it('le moteur nomme l’arme dans le journal : plus besoin de relire le texte', () => {
    const etat = combat([hero('Bran', 1, 1), monstre('combattant-gobelin', 2, 1, 'gob')], [15, 4]);
    executer(etat, ctx, { type: 'jouer', carte: 'attaque:epee-longue', cibles: ['gob'] });
    const { attaque } = derniereAttaque(etat.journal, 'epee-longue');
    expect(attaque.details?.arme).toBe('epee-longue');
    expect(sonDeCoup({ famille: 'tranchant', arme: attaque.details?.arme })).toBe('epee');
  });

  it('sous la Marque du chasseur, un coup d’épée courte garde son bruit et son tracé (l’impact prend la couleur de la force)', () => {
    // Sylvaine marque le gobelin, puis le frappe à l'épée courte : 15 pour toucher, 3 à l'épée, 4 de force pour la marque.
    const etat = combat([hero('Sylvaine', 1, 1), monstre('combattant-gobelin', 2, 1, 'gob')], [15, 3, 4, 2, 2, 2]);
    executer(etat, ctx, { type: 'jouer', carte: 'sort:marque-du-chasseur', cibles: ['gob'] });
    executer(etat, ctx, { type: 'jouer', carte: 'attaque:epee-courte', cibles: ['gob'] });
    const { attaque, degats } = derniereAttaque(etat.journal, 'epee-courte');
    const types = degats?.details?.types ?? [];
    expect(types).toEqual(expect.arrayContaining(['perforant', 'force']));

    // L'impact se colore de force, mais le bruit et le tracé viennent de l'arme.
    expect(familleDominante(types)).toBe('force');
    expect(famillePhysique(types)).toBe('perforant');
    expect(sonDeCoup({ famille: famillePhysique(types)!, arme: attaque.details?.arme })).toBe('rapiere');
    const effets = effetsDeCoup({ famille: familleDominante(types), physique: famillePhysique(types), position: { x: 2, y: 1 }, angle: 0, valeur: degats?.valeur ?? 0, critique: false }, false);
    expect(effets.some((e) => e.type === 'lame' && e.genre === 'perforant')).toBe(true);
    expect(effets.some((e) => e.type === 'impact' && e.famille === 'force')).toBe(true);
  });

  it('une attaque de monstre nomme son action, et une javeline lancée a son bruit de jet', () => {
    const etat = combat([monstre('ogre', 1, 1, 'ogre'), hero('Bran', 4, 1)], [15, 4]);
    const ogre = combattant(etat, 'ogre');
    attaqueMonstre(etat, ogre, combattant(etat, 'bran'), 'javeline-lancer');
    const { attaque } = derniereAttaque(etat.journal, 'javeline-lancer');
    expect(attaque.details?.distance).toBe(true);
    expect(sonDeTir(attaque.details?.arme)).toBe('lancer');
  });

  it('le Bouclier en réaction porte son sort dans le journal, donc son bruit de protection', () => {
    // L'ogre (+6) fait 6 : 12 touche la CA 11 d'Ambrine, mais pas 16 avec le Bouclier, qu'elle lance en réaction.
    const etat = combat([monstre('ogre', 1, 1, 'ogre'), hero('Ambrine', 2, 1)], [6, 3, 3]);
    attaqueMonstre(etat, combattant(etat, 'ogre'), combattant(etat, 'ambrine'), 'massue');
    const bouclier = etat.journal.find((e) => e.type === 'sort' && e.texte.includes('Bouclier'));
    expect(bouclier, 'Ambrine aurait dû lancer Bouclier').toBeDefined();
    expect(bouclier!.details?.sort).toBe('bouclier');
    expect(sonAuLancement(bouclier!.details?.sort)).toBe('protection');
  });
});
