import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

/** Les boutons d'une conversation : le libellé dit ce que le joueur dit (`question`), « Influencer » s'explique. */
const srd = chargerDonneesSrd();
const r = chargerMonde(join(RACINE_MONDES, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde;
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
const PNJ = 'vei-nerio-braisemolle';

function enConversation() {
  const groupe = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  const depart = moteur.executer(moteur.nouvellePartie(groupe, { graine: 5, niveau: 3 }), { type: 'commencer' }).partie;
  const p = { ...depart, etat: { ...depart.etat, lieu: dm.pnj.get(PNJ)!.lieu } };
  return moteur.executer(p, { type: 'parler', pnj: PNJ }).partie;
}

describe('boutons de conversation', () => {
  it('un sujet avec une « question » s’affiche tel quel ; sans elle, ses mots-clés précédés de « À propos de »', () => {
    const [premier, second] = dm.pnj.get(PNJ)!.sujets;
    premier!.question = 'Que mettez-vous dans cette soupe ?';
    delete second!.question;
    const boutons = moteur.propositions(enConversation()).filter((x) => x.ordre?.type === 'parler' && x.ordre.sujet);
    expect(boutons.find((b) => b.ordre?.type === 'parler' && b.ordre.sujet === premier!.id)?.libelle).toBe('Que mettez-vous dans cette soupe ?');
    const b2 = boutons.find((b) => b.ordre?.type === 'parler' && b.ordre.sujet === second!.id);
    expect(b2?.libelle).toMatch(/^À propos de : /);
    expect(b2?.aide).toContain(second!.mots[0]);
    delete premier!.question;
  });

  it('un sujet abordé est marqué « déjà abordé » ; un sujet unique disparaît', () => {
    let p = enConversation();
    const nonUnique = (x: { ordre?: { type: string; sujet?: string } }) => !!x.ordre?.sujet && !dm.pnj.get(PNJ)!.sujets.find((s) => s.id === x.ordre!.sujet)!.unique;
    const sujet = moteur.propositions(p).find((x) => x.ordre?.type === 'parler' && nonUnique(x as never))!;
    expect(sujet.detail).toBeUndefined();
    p = moteur.executer(p, sujet.ordre!).partie;
    const apres = moteur.propositions(p).find((x) => x.libelle === sujet.libelle);
    expect(apres?.detail).toBe('déjà abordé');
  });

  it('« Influencer » dit ce que fait chaque bouton, avec le DD, et porte un pictogramme', () => {
    const boutons = moteur.propositions(enConversation()).filter((x) => x.element?.id === 'influence');
    expect(boutons.map((b) => b.libelle)).toEqual(['Persuader', 'Intimider', 'Tromper']);
    for (const b of boutons) {
      expect(b.icone, b.libelle).toMatch(/^base:/);
      expect(b.aide, b.libelle).toMatch(/DD \d+/);
    }
    expect(boutons[0]!.element?.titre).toBe('Peser sur son attitude');
  });
});
