import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

/** « Parler à… » montre le portrait du PNJ : la proposition porte l'image du manifeste (`pnj` + identifiant). */
const srd = chargerDonneesSrd();
const r = chargerMonde(join(RACINE_MONDES, 'val-des-cendres'));
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
