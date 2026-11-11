// Le parchemin d'une quête acceptée : repérage des quêtes qui passent « en cours » et texte du parchemin, avec le vrai moteur.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, recompensesDeQuete } from '@crpg/regles';
import { chargerDonneesSrd } from '../../../packages/regles/src/donnees-node';
import { chargerMonde } from '../../../packages/regles/src/monde/chargeur';
import { changementsDeQuetes, nouvellesQuetes, parcheminDeQuete } from './quete-regles';
import { dossierMonde, MONDES_ESSAI } from '../../../packages/regles/tests/mondes-essai';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(MONDES_ESSAI, 'port-sillage'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde;
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
const groupe = groupeConseille(1, srd).emplacements.slice(0, 4).map((p) => {
  const f = bilanPersonnage(p!, srd).fiche!;
  return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
});
const depart = moteur.executer(moteur.nouvellePartie(groupe, { graine: 1, niveau: 1 }), { type: 'commencer' }).partie;

describe('repérer les quêtes qui commencent', () => {
  it('une quête proposée puis acceptée est repérée une fois ; une quête déjà en cours ne l’est pas', () => {
    const id = [...dm.quetes.values()].find((q) => !q.prerequis)!.id;
    const propose = { ...depart, etat: { ...depart.etat, quetes: { ...depart.etat.quetes, [id]: { statut: 'proposee' as const, actives: [], accomplies: [] } } } };
    expect(nouvellesQuetes(depart.etat.quetes, propose.etat.quetes)).toEqual([]); // proposée : rien encore
    const res = moteur.executer(propose, { type: 'accepterQuete', quete: id });
    expect(res.refus).toBeUndefined();
    expect(nouvellesQuetes(propose.etat.quetes, res.partie.etat.quetes)).toEqual([id]);
    expect(nouvellesQuetes(res.partie.etat.quetes, res.partie.etat.quetes)).toEqual([]);
  });

  it('une quête lancée directement (sans passer par « proposée ») est repérée aussi ; une quête terminée ne l’est pas', () => {
    const avant = {};
    const apres = { a: { statut: 'active' as const, actives: ['x'], accomplies: [] }, b: { statut: 'terminee' as const, actives: [], accomplies: ['y'] }, c: { statut: 'proposee' as const, actives: [], accomplies: [] } };
    expect(nouvellesQuetes(avant, apres)).toEqual(['a']);
  });
});

describe('le texte du parchemin', () => {
  it('chaque quête de chaque monde a un parchemin complet, sans rien de secret', () => {
    for (const id of ['port-sillage', 'val-des-cendres', 'citadelle-des-marees', 'dime-des-roseaux']) {
      const m = chargerMonde(dossierMonde(id));
      if (!m.ok) throw new Error(id);
      for (const q of m.monde.quetes.values()) {
        const p = parcheminDeQuete(m.monde, q.id)!;
        expect(p, q.id).toBeDefined();
        expect(p.nom).toBe(q.nom);
        expect(p.explication.length, q.id).toBeGreaterThan(10);
        expect(p.rubrique, q.id).toMatch(/^Quête/);
        expect(JSON.stringify(p), q.id).not.toContain(q.ramifications ?? '\u0000');
        if (q.donneur && m.monde.pnj.has(q.donneur)) expect(p.origine, q.id).toContain(m.monde.pnj.get(q.donneur)!.nom);
      }
    }
  });

  it('les récompenses sont en clair : PX, or et objets nommés', () => {
    const q = [...dm.quetes.values()].find((x) => x.recompenses.xp > 0 && x.recompenses.pieces > 0)!;
    const p = parcheminDeQuete(dm, q.id)!;
    // Le total : récompenses de la quête plus ce que donnent ses étapes.
    const total = recompensesDeQuete(q);
    expect(total.xp).toBeGreaterThanOrEqual(q.recompenses.xp);
    expect(p.recompenses).toContain(`${total.xp} PX`);
    expect(p.recompenses).toContain(`${total.pieces} po`);
  });
});

describe('la fin et l’échec d’une quête', () => {
  const etat = (statut: 'proposee' | 'active' | 'terminee' | 'echouee') => ({ statut, actives: [], accomplies: [] });

  it('active → terminée = fin ; active → échouée = échec ; une quête déjà close ne se répète pas', () => {
    expect(changementsDeQuetes({ a: etat('active') }, { a: etat('terminee') })).toEqual([{ id: 'a', genre: 'fin' }]);
    expect(changementsDeQuetes({ a: etat('active') }, { a: etat('echouee') })).toEqual([{ id: 'a', genre: 'echec' }]);
    expect(changementsDeQuetes({ a: etat('terminee') }, { a: etat('terminee') })).toEqual([]);
    expect(changementsDeQuetes({ a: etat('echouee') }, { a: etat('echouee') })).toEqual([]);
    expect(changementsDeQuetes({ a: etat('active') }, { a: etat('active') })).toEqual([]);
  });

  it('une quête lancée et finie dans la même action n’est annoncée que comme terminée', () => {
    expect(changementsDeQuetes({}, { a: etat('terminee') })).toEqual([{ id: 'a', genre: 'fin' }]);
    expect(changementsDeQuetes({ a: etat('proposee') }, { a: etat('terminee') })).toEqual([{ id: 'a', genre: 'fin' }]);
  });

  it('une quête menée à son terme dans le vrai moteur est repérée comme finie, avec ses récompenses', () => {
    const q = [...dm.quetes.values()].find((x) => !x.prerequis && x.recompenses.xp > 0)!;
    const actif = { ...depart, etat: { ...depart.etat, quetes: { ...depart.etat.quetes, [q.id]: { statut: 'active' as const, actives: [q.debut], accomplies: [] } } } };
    const fini = moteur.executer({ ...actif, scene: { type: 'exploration' } }, { type: 'accepterQuete', quete: q.id }); // sans effet : la quête est déjà en cours
    expect(fini.refus).toBeDefined();
    const termine = { ...actif, etat: { ...actif.etat, quetes: { ...actif.etat.quetes, [q.id]: { statut: 'terminee' as const, actives: [], accomplies: [q.debut] } } } };
    expect(changementsDeQuetes(actif.etat.quetes, termine.etat.quetes)).toEqual([{ id: q.id, genre: 'fin' }]);
    const p = parcheminDeQuete(dm, q.id, 'fin')!;
    expect(p.rubrique).toBe('Quête accomplie');
    expect(p.recompenses).toContain(`${recompensesDeQuete(q).xp} PX`);
    expect(p.objectif).toBeUndefined(); // le premier objectif n'a plus de sens à la fin
    const echec = parcheminDeQuete(dm, q.id, 'echec')!;
    expect(echec.rubrique).toBe('Quête échouée');
    expect(echec.recompenses).toEqual([]);
  });
});
