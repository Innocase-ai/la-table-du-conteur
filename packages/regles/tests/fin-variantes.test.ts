// Les épilogues des fins se souviennent de ce que le joueur a fait : la première variante dont la condition est vraie remplace
// l'épilogue de base ; les conditions des variantes sont validées comme celles des fins.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, etatInitial, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, validerMonde, type DonneesMonde } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { epilogueDeFin } from '../src/monde/etat';

const srd = chargerDonneesSrd();
function dime(): DonneesMonde {
  const r = chargerMonde(join(RACINE_MONDES, 'dime-des-roseaux'));
  if (!r.ok) throw new Error('monde illisible');
  return r.monde as DonneesMonde;
}
const epilogue = (dm: DonneesMonde, fin: string, flags: string[]) => {
  const etat = etatInitial(dm);
  for (const f of flags) etat.flags[f] = true;
  return epilogueDeFin(dm.fins.get(fin)!, etat);
};

describe("épilogues variables d'une fin", () => {
  const dm = dime();

  it("sans variante vraie, l'épilogue de base ; sinon la première variante dont la condition est vraie", () => {
    expect(epilogue(dm, 'fin-marche', [])).toMatch(/Anselme garde son moulin/);
    expect(epilogue(dm, 'fin-marche', [])).not.toMatch(/démasqué/);
    expect(epilogue(dm, 'fin-marche', ['pacte-revele'])).toMatch(/Anselme est démasqué/);
    expect(epilogue(dm, 'fin-marche', ['pacte-couvert'])).toMatch(/taire le pacte/);
    // la première variante gagne quand plusieurs conditions sont vraies
    expect(epilogue(dm, 'fin-marche', ['pacte-revele', 'pacte-couvert'])).toMatch(/démasqué/);
  });

  it("la fin d'échec dit ce qu'il est advenu de Lina et de Colin", () => {
    expect(epilogue(dm, 'fin-echec', [])).toMatch(/Lina reste en gage chez les gobelins, Colin reste à la mine/);
    expect(epilogue(dm, 'fin-echec', ['colin-libere'])).toMatch(/Colin est libre et rentré à Mireval, mais Lina reste/);
    expect(epilogue(dm, 'fin-echec', ['lina-retrouvee'])).toMatch(/Lina est rentrée à Mireval, mais Colin reste à la mine/);
    expect(epilogue(dm, 'fin-echec', ['lina-retrouvee', 'colin-libere'])).toMatch(/Lina et Colin, libérés avant l’assaut/);
  });

  it("l'anonymat de l'épilogue : « Anselme démasqué » ne s'affiche que si le pacte a été révélé", () => {
    for (const fin of ['fin-marche', 'fin-guerre', 'fin-exode']) {
      expect(epilogue(dm, fin, []), fin).not.toMatch(/démasqué|plus personne ne l’écoute|quitte le village/);
    }
  });

  it("la vue « epilogue » du moteur donne la variante retenue, et rien hors d'une fin", () => {
    const groupe = groupeConseille(1, srd)
      .emplacements.slice(0, 3)
      .map((e) => {
        const f = bilanPersonnage(e!, srd).fiche!;
        return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
      });
    const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
    const p = moteur.nouvellePartie(groupe, { graine: 1 });
    expect(moteur.vue('epilogue', p)).toBeUndefined();
    p.etat.flags['pacte-revele'] = true;
    p.scene = { type: 'fin', fin: 'fin-marche' };
    expect(moteur.vue('epilogue', p)).toMatch(/Anselme est démasqué/);
  });

  it("une condition de variante qui cite un fait inconnu est une erreur du validateur", () => {
    const copie = dime();
    copie.fins.get('fin-marche')!.variantes.push({ condition: { fait: 'f-n-existe-pas' }, epilogue: 'x' });
    const bilan = validerMonde(copie, srd);
    expect(bilan.erreurs.join('\n')).toMatch(/f-n-existe-pas/);
  });
});
