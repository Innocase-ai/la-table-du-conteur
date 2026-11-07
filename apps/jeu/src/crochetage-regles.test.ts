// L'écran de crochetage : la durée (entière, selon le bonus du héros) et le repérage d'une ouverture dans le journal du vrai
// moteur (taverne de Port-Sillage avec ses témoins, cellier désert du Val des Cendres).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type DonneesMonde, type EvenementJeu, type Partie } from '@crpg/regles';
import { chargerDonneesSrd } from '../../../packages/regles/src/donnees-node';
import { chargerMonde, RACINE_MONDES } from '../../../packages/regles/src/monde/chargeur';
import { detecterOuverture, dureeCrochetage, messageFinal, sonDuResultat } from './crochetage-regles';

describe('la durée du crochetage', () => {
  it('est toujours un nombre entier de secondes, dans les bornes de chaque méthode', () => {
    for (let bonus = -2; bonus <= 15; bonus++) {
      for (let dd = 5; dd <= 30; dd++) {
        const c = dureeCrochetage(bonus, dd, 'crocheter');
        const f = dureeCrochetage(bonus, dd, 'forcer');
        expect(Number.isInteger(c), `crocheter ${bonus}/${dd}`).toBe(true);
        expect(Number.isInteger(f), `forcer ${bonus}/${dd}`).toBe(true);
        expect(c).toBeGreaterThanOrEqual(3);
        expect(c).toBeLessThanOrEqual(15);
        expect(f).toBeGreaterThanOrEqual(2);
        expect(f).toBeLessThanOrEqual(6);
      }
    }
  });

  it('un héros plus fort (bonus plus haut) est plus rapide, une serrure plus dure prend plus de temps', () => {
    expect(dureeCrochetage(11, 15, 'crocheter')).toBeLessThan(dureeCrochetage(2, 15, 'crocheter'));
    expect(dureeCrochetage(5, 12, 'crocheter')).toBeLessThan(dureeCrochetage(5, 20, 'crocheter'));
    expect(dureeCrochetage(8, 15, 'forcer')).toBeLessThanOrEqual(dureeCrochetage(1, 15, 'forcer'));
  });

  it('forcer est plus court que crocheter pour la même marge', () => {
    expect(dureeCrochetage(2, 15, 'forcer')).toBeLessThan(dureeCrochetage(2, 15, 'crocheter'));
  });
});

describe('les messages de fin', () => {
  it('disent si le verrou cède ou résiste, selon la méthode', () => {
    expect(messageFinal({ methode: 'crocheter', reussie: true })).toMatch(/déclic/);
    expect(messageFinal({ methode: 'forcer', reussie: true })).toMatch(/craquement/);
    expect(messageFinal({ methode: 'crocheter', reussie: false })).toMatch(/crochet glisse/);
    expect(messageFinal({ methode: 'forcer', reussie: false })).toMatch(/tient bon/);
    expect(messageFinal({ methode: 'crocheter', reussie: false, interrompue: true })).toMatch(/On vous a vus/);
  });
});

describe('le bruitage du résultat', () => {
  it('une serrure crochetée s’ouvre, un verrou forcé cède, un échec ne fait pas de bruit de plus', () => {
    expect(sonDuResultat({ methode: 'crocheter', reussie: true })).toBe('serrure-ouverte');
    expect(sonDuResultat({ methode: 'forcer', reussie: true })).toBe('porte-forcee');
    expect(sonDuResultat({ methode: 'crocheter', reussie: false })).toBeUndefined();
    expect(sonDuResultat({ methode: 'forcer', reussie: false })).toBeUndefined();
    expect(sonDuResultat({ methode: 'forcer', reussie: true, interrompue: true })).toBeUndefined();
  });
});

describe('repérer une ouverture dans le journal du vrai moteur', () => {
  const srd = chargerDonneesSrd();
  const charger = (id: string): DonneesMonde => {
    const r = chargerMonde(join(RACINE_MONDES, id));
    if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
    return r.monde;
  };

  function jeu(dm: DonneesMonde, graine: number) {
    const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
    const heros = groupeConseille(dm.monde.niveaux.min, srd).emplacements.slice(0, 4).map((p) => {
      const f = bilanPersonnage(p!, srd).fiche!;
      return personnageDepuisFiche(f, { id: f.nom.toLowerCase(), outils: ['outils-de-voleur'] });
    });
    const depart = moteur.executer(moteur.nouvellePartie(heros, { graine, niveau: dm.monde.niveaux.min }), { type: 'commencer' }).partie;
    const ici = (lieu: string): Partie => ({ ...depart, scene: { type: 'exploration' }, etat: { ...depart.etat, lieu } });
    return { moteur, ici };
  }
  const nouvelles = (avant: Partie, apres: Partie): EvenementJeu[] => apres.journal.slice(avant.journal.length);

  it('à la taverne : vu, le groupe est arrêté (aucun jet d’ouverture) ; pas vu, l’ouverture a lieu', () => {
    const port = charger('port-sillage');
    let arretes = 0;
    let passes = 0;
    for (let graine = 1; graine <= 40; graine++) {
      for (const methode of ['crocheter', 'forcer'] as const) {
        const { moteur, ici } = jeu(port, graine);
        const avant = ici('ta-salle');
        const res = moteur.executer(avant, { type: 'ouvrir', cible: { tresor: 'z1-t-tiroir-de-la-caisse' }, methode });
        expect(res.refus, `${methode} ${graine}`).toBeUndefined();
        const o = detecterOuverture(nouvelles(avant, res.partie));
        expect(o, `${methode} ${graine}`).toBeDefined();
        expect(o!.methode).toBe(methode);
        expect(o!.objet).toMatch(/tiroir de la caisse/i);
        expect(o!.guet?.test).toBe('discretion');
        if (o!.interrompue) {
          // Vu : le jet de Discrétion a raté, il n'y a pas de jet d'ouverture, les témoins parlent.
          expect(o!.guet!.reussite).toBe(false);
          expect(o!.jet).toBeUndefined();
          expect(o!.reussie).toBe(false);
          expect(o!.repere).toMatch(/vous ont vus .* et vous arrêtent net/);
          arretes++;
        } else {
          expect(o!.guet!.reussite).toBe(true);
          expect(o!.jet!.test).toBe(methode === 'crocheter' ? 'escamotage' : 'athletisme');
          expect(o!.reussie).toBe(o!.jet!.reussite);
          expect(o!.repere).toBeUndefined();
          passes++;
        }
      }
    }
    // Sur quarante graines, les deux issues se produisent (le repérage n'est ni systématique ni impossible).
    expect(arretes).toBeGreaterThan(0);
    expect(passes).toBeGreaterThan(0);
  });

  it('des témoins déjà en alerte (aucun jet) : le détecteur reconnaît « vous surveillent de près »', () => {
    const port = charger('port-sillage');
    // Une graine où le groupe est vu une première fois, puis une seconde tentative sous leur nez.
    for (let graine = 1; graine <= 40; graine++) {
      const { moteur, ici } = jeu(port, graine);
      const premiere = moteur.executer(ici('ta-salle'), { type: 'ouvrir', cible: { tresor: 'z1-t-tiroir-de-la-caisse' }, methode: 'crocheter' });
      if (!detecterOuverture(nouvelles(ici('ta-salle'), premiere.partie))?.interrompue) continue;
      const seconde = moteur.executer(premiere.partie, { type: 'ouvrir', cible: { tresor: 'z1-t-tiroir-de-la-caisse' }, methode: 'forcer' });
      const o = detecterOuverture(nouvelles(premiere.partie, seconde.partie));
      expect(o?.interrompue).toBe(true);
      expect(o?.methode).toBe('forcer');
      expect(o?.guet).toBeUndefined();
      expect(o?.repere).toMatch(/vous surveillent de près/);
      return;
    }
    throw new Error('aucune graine ne fait repérer le groupe');
  });

  it('dans un lieu désert : pas de jet de Discrétion, donc ni guet ni repérage', () => {
    const val = charger('val-des-cendres');
    const { moteur, ici } = jeu(val, 3);
    const avant = ici('vei-cellier-du-bailli');
    const res = moteur.executer(avant, { type: 'ouvrir', cible: { tresor: 'vei-t-plancher-du-bailli' }, methode: 'crocheter' });
    const o = detecterOuverture(nouvelles(avant, res.partie));
    expect(o).toBeDefined();
    expect(o!.interrompue).toBe(false);
    expect(o!.guet).toBeUndefined();
    expect(o!.repere).toBeUndefined();
  });

  it('un journal sans ouverture (une halte, un jet libre) n’ouvre pas l’écran', () => {
    const val = charger('val-des-cendres');
    const { moteur, ici } = jeu(val, 5);
    const avant = ici('veillecendre');
    const res = moteur.executer(avant, { type: 'seReposer', duree: 'court' });
    expect(detecterOuverture(nouvelles(avant, res.partie))).toBeUndefined();
    expect(detecterOuverture([])).toBeUndefined();
    // Un jet d'Athlétisme libre ne vaut pas une ouverture : son constat n'est pas celui d'une serrure.
    const libre: EvenementJeu[] = [
      { type: 'jet', jet: { qui: 'bran', nom: 'Bran', test: 'athletisme', dd: 12, des: [14], bonus: 5, total: 19, reussite: true } },
      { type: 'constat', texte: 'Bran escalade le mur sans mal.' },
    ];
    expect(detecterOuverture(libre)).toBeUndefined();
  });

  it('un constat de serrure sans jet qui le précède n’est pas pris pour une ouverture', () => {
    expect(detecterOuverture([{ type: 'constat', texte: 'Bran force le coffre.' }])).toBeUndefined();
  });
});
