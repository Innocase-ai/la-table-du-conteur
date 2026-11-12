// La main de cartes du combat, avec le vrai moteur : sections, touches 1 à 9, pastilles de chiffres, phrase d'aperçu, et les
// illustrations d'armes (chaque arme d'une carte d'attaque a son image dans `equipement/`, sinon le pictogramme sert de repli).
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { apercuCarte, calculerFiche, cartesDisponibles, creerCombat, grilleDepuisTexte, heroDepuisFiche, HEROS_PRE_TIRES, monstreDepuisProfil, type Carte, type Combattant } from '@crpg/regles';
import { chargerDonneesSrd } from '../../../packages/regles/src/donnees-node';
import { carteDeTouche, horsDePortee, pastillesDeCarte, sectionsDeMain, texteApercu, toutEstJoue, touchesDeCartes } from './main-cartes-regles';
import { cleDegats, imageDeCarte } from './pictogrammes-regles';

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };
const ICI = import.meta.dirname;

function hero(nom: string, x: number, y: number): Combattant {
  const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === nom)!;
  const r = calculerFiche(h.choix, donnees);
  if (!r.ok) throw new Error(r.erreurs.join());
  return heroDepuisFiche(r.fiche, h.kit, donnees, { x, y });
}
const gob = (x: number, y: number) => monstreDepuisProfil(donnees.monstres.get('combattant-gobelin')!, 'gob', { x, y });
const ARENE = grilleDepuisTexte(['..........', '..........', '..........', '..........', '..........']);
const combat = (cs: Combattant[]) => creerCombat(ARENE, cs.map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), 1, { elan: true });

describe('sections de la main', () => {
  it('range par catégorie dans l’ordre, les cartes sans cible à portée restent en place, le reste va dans « Indisponibles »', () => {
    // Le gobelin est loin : l'attaque au corps à corps est « hors de portée » ; une fois l'action dépensée, tout est indisponible.
    const etat = combat([hero('Bran', 0, 0), gob(9, 4)]);
    const cartes = cartesDisponibles(etat, ctx, 'bran');
    const sections = sectionsDeMain(cartes);
    expect(sections.map((s) => s.id)).toEqual(expect.arrayContaining(['elan', 'attaque']));
    const ordre = ['elan', 'attaque', 'monstre', 'sort', 'aptitude', 'base', 'indisponibles'];
    expect(sections.map((s) => ordre.indexOf(s.id))).toEqual([...sections.map((s) => ordre.indexOf(s.id))].sort((a, b) => a - b));
    const attaques = sections.find((s) => s.id === 'attaque')!.cartes;
    expect(attaques.some(horsDePortee)).toBe(true);
    etat.combattants.find((c) => c.id === 'bran')!.tour.action = false;
    etat.combattants.find((c) => c.id === 'bran')!.tour.attaquesRestantes = 0;
    const apres = sectionsDeMain(cartesDisponibles(etat, ctx, 'bran'));
    const indispo = apres.find((s) => s.id === 'indisponibles')!;
    expect(indispo.cartes.length).toBeGreaterThan(0);
    expect(indispo.cartes.every((k) => !k.jouable && !horsDePortee(k))).toBe(true);
  });

  it('les touches 1 à 9 : les cartes jouables visibles, dans l’ordre affiché ; une section repliée n’en prend pas', () => {
    const etat = combat([hero('Bran', 0, 0), gob(1, 0)]);
    const sections = sectionsDeMain(cartesDisponibles(etat, ctx, 'bran'));
    const touches = touchesDeCartes(sections, new Set());
    expect(touches.size).toBeGreaterThan(3);
    expect([...touches.values()]).toEqual([...touches.values()].map((_, i) => i + 1));
    expect(carteDeTouche('1', touches)).toBe([...touches.keys()][0]);
    expect(carteDeTouche('0', touches)).toBeUndefined();
    expect(carteDeTouche('a', touches)).toBeUndefined();
    const sans = touchesDeCartes(sections, new Set(['elan']));
    expect([...sans.keys()].some((id) => sections.find((s) => s.id === 'elan')!.cartes.some((k) => k.id === id))).toBe(false);
    expect(sans.size).toBe(touches.size - sections.find((s) => s.id === 'elan')!.cartes.filter((k) => k.jouable).length);
  });

  it('« tout est joué » : plus d’action ni de bonus utiles (l’élan et le gratuit ne comptent pas)', () => {
    const etat = combat([hero('Bran', 0, 0), gob(1, 0)]);
    const bran = etat.combattants.find((c) => c.id === 'bran')!;
    expect(toutEstJoue(cartesDisponibles(etat, ctx, 'bran'))).toBe(false);
    bran.tour.action = false;
    bran.tour.attaquesRestantes = 0;
    bran.tour.bonus = false;
    expect(toutEstJoue(cartesDisponibles(etat, ctx, 'bran'))).toBe(true);
  });
});

describe('pastilles et aperçu', () => {
  it('une attaque d’arme : +bonus, dégâts (avec le motif du type), portée', () => {
    const etat = combat([hero('Bran', 0, 0), gob(1, 0)]);
    const k = cartesDisponibles(etat, ctx, 'bran').find((x) => x.stats?.attaque !== undefined)!;
    const p = pastillesDeCarte(k);
    expect(p[0]).toMatchObject({ genre: 'attaque', texte: `+${k.stats!.attaque}` });
    const degats = p.find((x) => x.genre === 'degats')!;
    expect(degats.texte).toMatch(/^\d+d\d+(\+\d+)?$/);
    expect(degats.cle).toBe(cleDegats(k.stats!.degats![0]!.type));
    expect(p.some((x) => x.genre === 'portee')).toBe(true);
  });

  it('un sort à sauvegarde : « DD 13 Dex » ; la phrase d’aperçu dit le % d’échec', () => {
    const etat = combat([hero('Ambrine', 0, 0), gob(1, 0)]);
    const k = cartesDisponibles(etat, ctx, 'ambrine').find((x) => x.stats?.sauvegarde);
    if (!k) return;
    expect(pastillesDeCarte(k).some((x) => x.genre === 'dd' && /^DD \d+ [A-Z][a-zé]{2}$/.test(x.texte))).toBe(true);
    const phrase = texteApercu(apercuCarte(etat, 'ambrine', k, 'gob'), k, 'Gobelin');
    expect(phrase).toMatch(/sauvegarde de .+ DD \d+, \d+ % d'échec/);
  });

  it('la phrase d’aperçu d’une attaque : % de toucher, avantage, dégâts moyens', () => {
    expect(texteApercu({ pourcentToucher: 65, degatsMoyens: 7.5, avantage: true }, { nom: 'Arc long' }, 'Loup')).toBe('Arc long → Loup : 65 % de toucher (avantage), ≈ 7,5 dégâts.');
    expect(texteApercu({ pourcentToucher: 30, desavantage: true, couvert: true }, { nom: 'Arc' }, 'Loup')).toBe('Arc → Loup : 30 % de toucher (désavantage), cible à couvert.');
    expect(texteApercu(undefined, { nom: 'x' }, 'y')).toBeUndefined();
  });
});

describe('illustrations d’armes', () => {
  const images = new Set(readdirSync(join(ICI, 'equipement')).map((f) => f.replace(/\.webp$/, '')));

  it('l’arme d’une carte (et la version lancée) est son fichier ; la potion de soins a le sien ; sorts et aptitudes n’en ont pas', () => {
    expect(imageDeCarte({ id: 'attaque:epee-longue', categorie: 'attaque' })).toEqual({ groupe: 'equipement', id: 'epee-longue' });
    expect(imageDeCarte({ id: 'attaque:javeline-lancer', categorie: 'attaque' })).toEqual({ groupe: 'equipement', id: 'javeline' });
    expect(imageDeCarte({ id: 'base:potion', categorie: 'base' })).toEqual({ groupe: 'equipement', id: 'potion-de-guerison' });
    expect(imageDeCarte({ id: 'sort:soins', categorie: 'sort' })).toBeUndefined();
    expect(imageDeCarte({ id: 'aptitude:rage', categorie: 'aptitude' })).toBeUndefined();
    expect(images.has('potion-de-guerison')).toBe(true);
  });

  it('chaque arme des héros pré-tirés (cartes d’attaque et de lancer) a son illustration dans equipement/', () => {
    const manquantes: string[] = [];
    for (const h of HEROS_PRE_TIRES) {
      const etat = combat([hero(h.choix.nom, 0, 0), gob(1, 0)]);
      const cartes: Carte[] = cartesDisponibles(etat, ctx, h.choix.nom.toLowerCase()).filter((k) => k.categorie === 'attaque');
      for (const k of cartes) {
        const ref = imageDeCarte(k);
        if (ref && !images.has(ref.id)) manquantes.push(`${h.choix.nom} : ${k.id}`);
      }
    }
    expect(manquantes).toEqual([]);
  });
});
