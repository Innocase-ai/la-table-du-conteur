import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type Partie } from '../src';
import { chargerMonde } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
const c = chargerMonde(join(MONDES_ESSAI, 'citadelle-des-marees'));
if (!c.ok) throw new Error(c.erreurs.map((e) => e.message).join('\n'));
const moteur = creerMoteur({ dm: c.monde, srd }, MODULES_STANDARD);
const QUETE = 'q-cit-les-rats-des-reserves';
const RENCONTRE = 'cit-r-rats-des-reserves';

function depart(): Partie {
  const g = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  return moteur.executer(moteur.nouvellePartie(g, { graine: 7, niveau: 1 }), { type: 'commencer' }).partie;
}

/** Le groupe est au réfectoire, Bertrane lui a parlé de ses réserves et la quête est acceptée. */
function quetAcceptee(): Partie {
  let p = depart();
  p = { ...p, etat: { ...p.etat, lieu: 'cit-refectoire', lieuxVisites: [...p.etat.lieuxVisites, 'cit-refectoire'] } };
  p = moteur.executer(p, { type: 'parler', pnj: 'bertrane-mijotee', sujet: 'rats-des-reserves' }).partie;
  expect(p.etat.quetes[QUETE]?.statut, 'la quête est proposée').toBe('proposee');
  p = moteur.executer(p, { type: 'accepterQuete', quete: QUETE }).partie;
  expect(p.etat.quetes[QUETE]?.statut).toBe('active');
  p = moteur.executer(p, { type: 'quitterDialogue' }).partie;
  return p;
}

/** Descend aux caveaux : la rencontre se déclenche à l'entrée (scène de rencontre). */
function auxCaveaux(p: Partie): Partie {
  const q = moteur.executer({ ...p, etat: { ...p.etat, lieu: 'cit-cour-des-vents', lieuxVisites: [...p.etat.lieuxVisites, 'cit-cour-des-vents'] } }, { type: 'aller', vers: 'cit-intendance' }).partie;
  expect(q.scene).toEqual({ type: 'rencontre', rencontre: RENCONTRE });
  return q;
}

const retour = (p: Partie, sujet: string) => moteur.executer({ ...p, etat: { ...p.etat, lieu: 'cit-refectoire' } }, { type: 'parler', pnj: 'bertrane-mijotee', sujet }).partie;

describe('contrat « Ce qui ronge les réserves » (nid à nettoyer, trois issues)', () => {
  it("la rencontre n'existe qu'une fois la quête acceptée", () => {
    const p = depart();
    const q = moteur.executer({ ...p, etat: { ...p.etat, lieu: 'cit-cour-des-vents', lieuxVisites: [...p.etat.lieuxVisites, 'cit-cour-des-vents'] } }, { type: 'aller', vers: 'cit-intendance' }).partie;
    expect(q.scene.type).toBe('exploration');
  });

  it('issue 1 : le combat réussit, le drapeau est posé, le retour de Bertrane accomplit la quête', () => {
    let p = auxCaveaux(quetAcceptee());
    const rencontre = c.monde.rencontres.get(RENCONTRE)!;
    expect(rencontre.type).toBe('mixte');
    p = moteur.executer(p, { type: 'reglerRencontre', issue: 'victoire', px: 75 }).partie;
    expect(p.etat.flags['cit-rats-regles']).toBe(true);
    expect(p.etat.quetes[QUETE]!.actives).toContain('retour');
    const avant = p.etat.attitudes['bertrane-mijotee'] ?? 0;
    p = retour(p, 'rats-regles-simple');
    expect(p.etat.attitudes['bertrane-mijotee']).toBe(avant + 15);
    expect(p.etat.quetes[QUETE]!.statut).toBe('terminee');
    expect(p.etat.pieces).toBeGreaterThanOrEqual(25);
  });

  it("issue 2 : colmater la brèche révèle le fait ; un échec ne règle rien (le groupe peut encore combattre)", () => {
    const base = auxCaveaux(quetAcceptee());
    let rate;
    let reussi;
    for (let g = 1; g < 60 && !(rate && reussi); g++) {
      const r = moteur.executer({ ...base, graine: g }, { type: 'reglerRencontre', issue: 'alternative', alternative: 'colmater-la-breche' });
      const jet = r.evenements.find((e) => e.type === 'jet') as { jet: { reussite: boolean } } | undefined;
      if (jet?.jet.reussite) reussi ??= r;
      else rate ??= r;
    }
    expect(rate, 'un échec existe').toBeDefined();
    expect(rate!.partie.etat.flags['cit-rats-regles']).toBeUndefined();
    expect(rate!.partie.scene.type).toBe('rencontre');
    expect(reussi!.partie.etat.flags['cit-rats-regles']).toBe(true);
    expect(reussi!.partie.etat.faits).toContain('f-cit-fissure-de-l-intendance');
    const fin = retour(reussi!.partie, 'rats-regles-breche');
    expect(fin.etat.quetes[QUETE]!.statut).toBe('terminee');
  });

  it("issue 3 : chasser les rats au grain coûte une ration et la confiance de Bertrane, sans combat ni fait", () => {
    let p = auxCaveaux(quetAcceptee());
    expect(moteur.propositions(p).some((x) => (x.ordre as { alternative?: string } | undefined)?.alternative === 'chasser-au-grain')).toBe(false); // sans ration, l'issue est cachée
    p.etat.inventaire['rations'] = 2;
    const avant = p.etat.attitudes['bertrane-mijotee'] ?? 0;
    const r = moteur.executer(p, { type: 'reglerRencontre', issue: 'alternative', alternative: 'chasser-au-grain' });
    expect(r.refus).toBeUndefined();
    expect(r.partie.etat.inventaire['rations']).toBe(1);
    expect(r.partie.etat.attitudes['bertrane-mijotee']).toBe(avant - 5);
    expect(r.partie.etat.flags['cit-rats-regles']).toBe(true);
    expect(r.partie.etat.faits).not.toContain('f-cit-fissure-de-l-intendance');
    expect(r.partie.scene.type).toBe('exploration');
  });

  it('si on refuse, la marée monte et les réserves sont ravagées', () => {
    let p = quetAcceptee();
    p.etat.jauges['maree'] = 2;
    const r = moteur.executer(p, { type: 'aller', vers: 'cit-cour-des-vents' });
    p = r.partie;
    expect(p.etat.flags['cit-reserves-ravagees']).toBe(true);
    expect(p.etat.quetes[QUETE]!.statut).toBe('echouee');
  });
});
