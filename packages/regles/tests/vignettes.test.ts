import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche } from '../src';
import { chargerMonde } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { MONDES_ESSAI } from './mondes-essai';

/** « Parler à… » montre le portrait du PNJ : la proposition porte l'image du manifeste (`pnj` + identifiant). */
const srd = chargerDonneesSrd();
const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde;
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);

describe('vignettes des PNJ', () => {
  it('chaque PNJ avec qui on peut parler a son portrait sur le bouton', () => {
    const groupe = groupeConseille(3, srd).emplacements.map((p) => {
      const f = bilanPersonnage(p!, srd).fiche!;
      return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
    });
    const depart = moteur.executer(moteur.nouvellePartie(groupe, { graine: 5, niveau: 3 }), { type: 'commencer' }).partie;
    const p = { ...depart, etat: { ...depart.etat, lieu: 'vei-auberge-dernier-feu' } };
    const boutons = moteur.propositions(p).filter((x) => x.ordre?.type === 'parler');
    expect(boutons.length).toBeGreaterThan(0);
    for (const b of boutons) {
      const id = b.ordre?.type === 'parler' ? b.ordre.pnj : undefined;
      expect(b.image, b.libelle).toEqual({ groupe: 'pnj', id });
      expect(b.detail, b.libelle).toBeTruthy();
    }
  });
});

/** Les boutons de l'onglet « Ici » : la loupe de « Fouiller », et « Dormir » seulement dans un lieu sûr. */
describe('boutons Fouiller, Halte et Dormir', () => {
  const boutonsA = (lieu: string) => {
    const groupe = groupeConseille(3, srd).emplacements.map((p) => {
      const f = bilanPersonnage(p!, srd).fiche!;
      return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
    });
    const depart = moteur.executer(moteur.nouvellePartie(groupe, { graine: 5, niveau: 3 }), { type: 'commencer' }).partie;
    const p = { ...depart, etat: { ...depart.etat, lieu } };
    const tous = moteur.propositions(p);
    return { fouiller: tous.find((x) => x.libelle === 'Fouiller')!, halte: tous.find((x) => x.libelle === 'Halte')!, dormir: tous.find((x) => x.libelle === 'Dormir')! };
  };

  it('« Fouiller » porte une loupe', () => {
    expect(boutonsA('veillecendre').fouiller.icone).toBe('base:fouiller');
  });

  it('on peut dormir à l’auberge ; dans la rue, seulement faire une halte ; au repaire, rien', () => {
    const auberge = boutonsA('vei-auberge-dernier-feu');
    expect(auberge.dormir.desactivee).toBeUndefined();
    const rue = boutonsA('veillecendre');
    expect(rue.halte.desactivee).toBeUndefined();
    expect(rue.dormir.desactivee).toMatch(/On ne dort pas ici/);
    const repaire = boutonsA('gue-repaire');
    expect(repaire.halte.desactivee).toMatch(/Impossible/);
    expect(repaire.dormir.desactivee).toMatch(/Impossible/);
  });
});
