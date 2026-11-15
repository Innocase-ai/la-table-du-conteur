// Les monstres lancent leurs sorts (15/11/2026) : sans emplacement, à volonté ou N fois par jour, au niveau fixé par leur profil (SRD 5.2.1).
import { describe, expect, it } from 'vitest';
import { cartesDisponibles, executer } from '../src/combat/cartes';
import { heroDepuisFiche, monstreDepuisProfil } from '../src/combat/creation';
import { actif, combattant, type Combattant, type EtatCombat } from '../src/combat/etat';
import { grilleDepuisTexte } from '../src/combat/grille';
import { IA_RAPIDE, jouerTourIA } from '../src/combat/ia';
import { creerCombat, finTour } from '../src/combat/moteur';
import { HEROS_PRE_TIRES } from '../src/combat/prototype';
import { chargerDonneesSrd } from '../src/donnees-node';
import { calculerFiche } from '../src/fiche';
import { SORTS_JOUABLES_EN_COMBAT } from '../src/combat/sorts';

const srd = chargerDonneesSrd();
const ctx = { sorts: srd.sorts };
const ARENE = grilleDepuisTexte(Array.from({ length: 5 }, () => '..............'));

function hero(nom: string, x: number, y: number): Combattant {
  const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === nom)!;
  const f = calculerFiche(h.choix, srd);
  if (!f.ok) throw new Error(f.erreurs.join());
  return heroDepuisFiche(f.fiche, h.kit, srd, { x, y });
}
const monstre = (profil: string, id: string, x: number, y: number): Combattant => monstreDepuisProfil(srd.monstres.get(profil)!, id, { x, y });

/** Le premier combattant joue en premier, et ainsi de suite. */
function combat(combattants: Combattant[], graine = 1): EtatCombat {
  return creerCombat(ARENE, combattants.map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), graine, { elan: false });
}
/** Passe au prochain tour du combattant (même s'il joue déjà). */
const tourSuivant = (etat: EtatCombat, id: string) => {
  do finTour(etat);
  while (actif(etat).id !== id && !etat.vainqueur);
};
const carteSort = (etat: EtatCombat, id: string, sort: string) => cartesDisponibles(etat, ctx, id).find((k) => k.id === `sort:${sort}`);

describe('les profils des monstres lanceurs', () => {
  it('ne listent que des sorts que le moteur sait jouer, qui existent dans le SRD, sans réaction', () => {
    let n = 0;
    for (const m of srd.monstres.values()) {
      if (!m.sorts) continue;
      n++;
      expect(m.sorts.liste.length, m.id).toBeGreaterThan(0);
      for (const l of m.sorts.liste) {
        const s = srd.sorts.get(l.sort);
        expect(s, `${m.id} : ${l.sort}`).toBeDefined();
        expect(SORTS_JOUABLES_EN_COMBAT.has(l.sort), `${m.id} : ${l.sort} jouable`).toBe(true);
        expect(s!.tempsIncantation, `${m.id} : ${l.sort}`).not.toBe('reaction');
        if (l.niveau) expect(l.niveau, `${m.id} : ${l.sort}`).toBeGreaterThanOrEqual(s!.niveau);
      }
    }
    expect(n).toBeGreaterThanOrEqual(30);
  });

  it('un monstre lanceur reçoit ses sorts, son DD, son bonus d’attaque et ses réserves du jour', () => {
    const mage = monstre('mage', 'mage', 8, 2);
    expect(mage.sorts).toEqual(['boule-de-feu']);
    expect(mage.incantation).toMatchObject({ dd: 14, bonusAttaque: 6, emplacements: [] });
    expect(mage.sortsMonstre!['boule-de-feu']).toEqual({ niveau: 4, cout: 'action', reserve: 'sort:boule-de-feu' });
    expect(mage.ressources['sort:boule-de-feu']).toBe(2);
    // Un monstre sans sorts n'en reçoit pas.
    const gob = monstre('combattant-gobelin', 'g', 8, 1);
    expect(gob.sorts).toEqual([]);
    expect(gob.incantation).toBeUndefined();
    expect(gob.sortsMonstre).toBeUndefined();
  });
});

describe('lancer un sort de monstre', () => {
  it('Boule de feu du mage : au 4e niveau, 2 fois par jour, sans emplacement, puis plus de lancer', () => {
    const etat = combat([monstre('mage', 'mage', 5, 2), hero('Bran', 1, 1), hero('Hilda', 1, 3)]);
    const k = carteSort(etat, 'mage', 'boule-de-feu')!;
    expect(k).toBeDefined();
    expect(k.jouable).toBe(true);
    expect(k.ressource).toBe('2 lancer(s) restant(s)');
    expect(k.zone).toEqual({ forme: 'sphere', taille: 6 });

    const r1 = executer(etat, ctx, { type: 'jouer', carte: 'sort:boule-de-feu', point: { x: 1, y: 2 } });
    expect(r1.ok).toBe(true);
    const texte = etat.journal.map((e) => e.texte).join('\n');
    expect(texte).toContain('Mage lance Boule de feu (niveau 4)');
    // Les deux héros sont dans les 6 m du point visé : ils font tous deux leur sauvegarde.
    expect(texte.match(/sauvegarde (réussie|ratée)/g)?.length).toBe(2);
    const mage = combattant(etat, 'mage');
    expect(mage.ressources['sort:boule-de-feu']).toBe(1);
    expect(mage.incantation!.emplacements).toEqual([]);

    // Deuxième lancer au tour suivant du mage, puis la réserve est vide.
    tourSuivant(etat, 'mage');
    expect(executer(etat, ctx, { type: 'jouer', carte: 'sort:boule-de-feu', point: { x: 1, y: 2 } }).ok).toBe(true);
    expect(mage.ressources['sort:boule-de-feu']).toBe(0);
    tourSuivant(etat, 'mage');
    const vide = carteSort(etat, 'mage', 'boule-de-feu')!;
    expect(vide.jouable).toBe(false);
    expect(vide.raison).toMatch(/Plus de lancer/);
    expect(executer(etat, ctx, { type: 'jouer', carte: 'sort:boule-de-feu', point: { x: 1, y: 2 } }).ok).toBe(false);
  });

  it('le niveau du profil compte : la Boule de feu au 4e niveau fait 9d6 (une zone, un seul tirage)', () => {
    const etat = combat([monstre('mage', 'mage', 5, 2), hero('Bran', 1, 1)]);
    const bran = combattant(etat, hero('Bran', 1, 1).id);
    const avant = bran.pv;
    executer(etat, ctx, { type: 'jouer', carte: 'sort:boule-de-feu', point: { x: 1, y: 1 } });
    const subis = avant - bran.pv;
    // 9d6 : de 9 à 54, la moitié (arrondie à l'inférieur) si Bran réussit : au moins 4 ; une sauvegarde réussie ou ratée est toujours journalisée.
    expect(subis).toBeGreaterThanOrEqual(4);
    expect(subis).toBeLessThanOrEqual(54);
  });

  it('un sort à volonté (dragon bleu : Fracassement) ne s’épuise jamais', () => {
    const etat = combat([monstre('dragon-bleu-adulte', 'dragon', 6, 2), hero('Bran', 1, 1), hero('Hilda', 1, 3)]);
    for (let i = 0; i < 4; i++) {
      if (i > 0) tourSuivant(etat, 'dragon');
      const k = carteSort(etat, 'dragon', 'fracassement')!;
      expect(k.ressource).toBe('à volonté');
      expect(k.jouable, `lancer ${i}`).toBe(true);
      expect(executer(etat, ctx, { type: 'jouer', carte: 'sort:fracassement', point: { x: 1, y: 2 } }).ok).toBe(true);
    }
  });

  it('une réserve partagée : le Soutien divin du prêtre (3 par jour) se partage entre ses trois sorts, en action bonus', () => {
    const etat = combat([monstre('pretre', 'pretre', 5, 2), monstre('combattant-gobelin', 'gob', 6, 2), hero('Bran', 1, 1)]);
    const pretre = combattant(etat, 'pretre');
    const k = carteSort(etat, 'pretre', 'benediction')!;
    expect(k.cout).toBe('bonus');
    expect(k.ressource).toBe('3 lancer(s) restant(s)');
    // Mot de guérison sur lui-même (blessé), Bénédiction, Restauration partielle : trois lancers, une seule réserve.
    pretre.pv = 10;
    for (const [i, sid] of ['mot-de-guerison', 'benediction', 'restauration-partielle'].entries()) {
      if (i > 0) tourSuivant(etat, 'pretre');
      expect(pretre.ressources['sort:soutien-divin'], `avant ${sid}`).toBe(3 - i);
      const carte = carteSort(etat, 'pretre', sid)!;
      expect(carte.jouable, `${sid} jouable`).toBe(true);
      const cibles = carte.nbCibles ? [carte.cibles.includes('pretre') ? 'pretre' : carte.cibles[0]!] : [];
      expect(executer(etat, ctx, { type: 'jouer', carte: `sort:${sid}`, cibles }).ok, sid).toBe(true);
    }
    expect(pretre.ressources['sort:soutien-divin']).toBe(0);
    tourSuivant(etat, 'pretre');
    for (const sid of ['mot-de-guerison', 'benediction', 'restauration-partielle']) expect(carteSort(etat, 'pretre', sid)!.jouable, sid).toBe(false);
  });

  it('un monstre qui ne lance pas de sort n’a aucune carte de sort ; les héros gardent leurs emplacements', () => {
    const etat = combat([monstre('combattant-gobelin', 'gob', 6, 2), hero('Bran', 1, 1)]);
    expect(cartesDisponibles(etat, ctx, 'gob').some((k) => k.categorie === 'sort')).toBe(false);
    const bran = etat.combattants.find((c) => c.camp === 'heros')!;
    expect(bran.incantation).toBeUndefined();
    const ambrine = combat([monstre('mage', 'mage', 6, 2), hero('Ambrine', 1, 1)]);
    const h = ambrine.combattants.find((c) => c.camp === 'heros')!;
    const avant = [...h.incantation!.emplacements];
    // Le mage lance : l'emplacement du héros n'est pas touché, et le sien n'existe pas.
    executer(ambrine, ctx, { type: 'jouer', carte: 'sort:boule-de-feu', point: { x: 1, y: 1 } });
    expect(h.incantation!.emplacements).toEqual(avant);
  });
});

describe('l’IA des monstres lanceurs', () => {
  it('le mage lance sa Boule de feu sur un groupe serré, et la sauvegarde du combat garde ses lancers', () => {
    // Deux héros côte à côte, le mage à distance : la zone rapporte plus que le Jaillissement arcanique.
    const etat = combat([monstre('mage', 'mage', 9, 2), hero('Bran', 1, 1), hero('Hilda', 1, 2), hero('Sylvaine', 2, 2)], 7);
    let lance = false;
    for (let i = 0; i < 30 && !etat.vainqueur && !lance; i++) {
      jouerTourIA(etat, ctx, IA_RAPIDE);
      lance = etat.journal.some((e) => e.texte.includes('Boule de feu'));
    }
    expect(lance, 'le mage a lancé Boule de feu').toBe(true);
    const copie = structuredClone(etat);
    expect(combattant(copie, 'mage').ressources['sort:boule-de-feu']).toBe(combattant(etat, 'mage').ressources['sort:boule-de-feu']);
    expect(combattant(copie, 'mage').sortsMonstre).toEqual(combattant(etat, 'mage').sortsMonstre);
  });

  it('le prêtre soigne ou bénit : un combat entier se joue sans erreur ni réserve négative', () => {
    for (const graine of [1, 2, 3]) {
      const etat = combat([monstre('pretre', 'pretre', 8, 2), monstre('combattant-gobelin', 'gob', 8, 1), hero('Bran', 1, 1), hero('Hilda', 1, 3)], graine);
      for (let i = 0; i < 200 && !etat.vainqueur; i++) jouerTourIA(etat, ctx, IA_RAPIDE);
      expect(etat.vainqueur, `graine ${graine}`).toBeDefined();
      const pretre = combattant(etat, 'pretre');
      expect(pretre.ressources['sort:soutien-divin']).toBeGreaterThanOrEqual(0);
      expect(pretre.ressources['sort:soutien-divin']).toBeLessThanOrEqual(3);
    }
  });
});
