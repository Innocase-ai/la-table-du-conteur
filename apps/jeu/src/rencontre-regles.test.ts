// L'écran de rencontre, avec le vrai moteur sur La Marche : la vue `rencontre` (lieu, danger, créatures, chef), les jets
// annoncés sur les autres issues, l'ordre des choix et ce que l'écran dit d'une issue ratée.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type Partie, type PresentationRencontre } from '@crpg/regles';
import { chargerDonneesSrd } from '../../../packages/regles/src/donnees-node';
import { chargerMonde, RACINE_MONDES } from '../../../packages/regles/src/monde/chargeur';
import { DANGERS, libelleJetAnnonce, ordreDesChoix, suitesDeRencontre } from './rencontre-regles';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(RACINE_MONDES, 'marche-d-ombrefiel'));
if (!r.ok) throw new Error('monde illisible');
const dm = r.monde;
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
const groupe = groupeConseille(1, srd).emplacements.map((p) => {
  const f = bilanPersonnage(p!, srd).fiche!;
  return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
});

/** Le groupe face à une rencontre (scène de rencontre posée, comme quand elle se déclenche). */
function face(id: string): Partie {
  const p = moteur.executer(moteur.nouvellePartie(groupe, { graine: 4 }), { type: 'commencer' }).partie;
  const def = dm.rencontres.get(id)!;
  return { ...p, scene: { type: 'rencontre', rencontre: id }, etat: { ...p.etat, lieu: def.lieu ?? p.etat.lieu } };
}

describe('la vue « rencontre »', () => {
  it('donne le lieu, le danger, l’introduction et les créatures, le chef nommé mis en avant', () => {
    const p = face('ald-r-demi-dent-et-sa-bande');
    const v = moteur.vue<PresentationRencontre | undefined>('rencontre', p)!;
    expect(v.nom).toBe(dm.rencontres.get('ald-r-demi-dent-et-sa-bande')!.nom);
    expect(v.lieu.nom).toBe(dm.lieux.get(p.etat.lieu)!.nom);
    expect(DANGERS[v.difficulte].libelle).toMatch(/^Danger /);
    expect(v.monstres.some((m) => m.chef)).toBe(true);
    expect(v.monstres.some((m) => !m.chef)).toBe(true);
  });

  it('rien hors d’une scène de rencontre', () => {
    const p = { ...face('ald-r-chariot-enlise'), scene: { type: 'exploration' as const } };
    expect(moteur.vue('rencontre', p)).toBeUndefined();
  });
});

describe('les choix de l’écran', () => {
  it('une issue à jet annonce la compétence, le DD et le meilleur du groupe', () => {
    const p = face('ald-r-bourru-et-kobolds');
    const choix = moteur.propositions(p).filter((x) => x.groupe.id === 'rencontre');
    const avecJet = choix.filter((x) => x.jet);
    expect(avecJet.length).toBeGreaterThan(0);
    for (const c of avecJet) {
      expect(c.jet!.dd).toBeGreaterThan(0);
      expect(groupe.map((h) => h.nom)).toContain(c.jet!.qui);
      expect(libelleJetAnnonce(c.jet!)).toMatch(/ DD \d+ · .+ [+-]\d+$/);
    }
    const ordre = ordreDesChoix(choix);
    expect(ordre[0]!.intention).toBe('combattre');
    expect(ordre.at(-1)!.libelle).toBe('Se replier');
  });

  it('après une issue ratée, l’écran montre le jet et ce qui s’est passé', () => {
    let p = face('ald-r-bourru-et-kobolds');
    p = { ...p, journal: [...p.journal, { type: 'constat', texte: `Rencontre : ${dm.rencontres.get('ald-r-bourru-et-kobolds')!.nom}.` }] };
    const alt = moteur.propositions(p).find((x) => x.groupe.id === 'rencontre' && x.jet)!;
    let rate: Partie | undefined;
    for (let g = 1; g < 60 && !rate; g++) {
      const res = moteur.executer({ ...p, graine: g }, alt.ordre!);
      if (res.partie.scene.type === 'rencontre' && res.evenements.some((e) => e.type === 'jet' && !e.jet.reussite)) rate = res.partie;
    }
    expect(rate, 'un jet raté qui laisse la rencontre en attente').toBeDefined();
    const suites = suitesDeRencontre(rate!.journal, dm.rencontres.get('ald-r-bourru-et-kobolds')!.nom);
    expect(suites.some((s) => / raté$/.test(s))).toBe(true);
  });

  it('au premier regard, rien n’est encore arrivé', () => {
    expect(suitesDeRencontre([{ type: 'constat', texte: 'Rencontre : X.' }], 'X')).toEqual([]);
  });
});
