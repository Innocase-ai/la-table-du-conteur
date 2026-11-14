// Ce que le joueur lit pour désigner un PNJ : son titre, jamais le `role` (qui peut contenir un secret et n'est donné qu'au conteur).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, etatInitial, groupeConseille, personnageDepuisFiche } from '../src';
import { libelleDuPnj } from '../src/monde/dialogue';
import { nouvellePartie } from '../src/monde/exploration';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { ficheDeScene } from '../src/monde/scene';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();

describe('libelleDuPnj', () => {
  it('donne le titre quand il existe, sinon le rôle', () => {
    expect(libelleDuPnj({ titre: 'Aubergiste', role: 'Ancien sergent, secret' })).toBe('Aubergiste');
    expect(libelleDuPnj({ role: 'Meunier du village' })).toBe('Meunier du village');
  });

  it('la fiche de scène de la Marche n’expose pas « ancien sergent » ni la Griffe Noire', () => {
    const r = chargerMonde(join(RACINE_MONDES, 'marche-d-ombrefiel'));
    if (!r.ok) throw new Error('monde illisible');
    const groupe = groupeConseille(3, srd).emplacements.map((p) => {
      const f = bilanPersonnage(p!, srd).fiche!;
      return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
    });
    const etat = etatInitial(r.monde);
    etat.lieu = 'ald-auberge-comptoir-et-cellier';
    etat.heure = 10;
    const fiche = ficheDeScene(nouvellePartie(r.monde, etat, groupe, () => 0.999));
    const brégor = fiche.pnj.find((n) => n.id === 'bregor-le-borgne');
    expect(brégor?.role).toBe("Aubergiste de l'Éperon d'Aldric");
    for (const n of fiche.pnj) expect(n.role).not.toMatch(/sergent|Griffe/i);
  });
});
