// Le parchemin d'une quête acceptée : repérage des quêtes qui passent « en cours » et texte du parchemin, avec le vrai moteur.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche } from '@crpg/regles';
import { chargerDonneesSrd } from '../../../packages/regles/src/donnees-node';
import { chargerMonde, RACINE_MONDES } from '../../../packages/regles/src/monde/chargeur';
import { nouvellesQuetes, parcheminDeQuete } from './quete-regles';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(RACINE_MONDES, 'port-sillage'));
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
      const m = chargerMonde(join(RACINE_MONDES, id));
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
    expect(p.recompenses).toContain(`${q.recompenses.xp} PX`);
    expect(p.recompenses).toContain(`${q.recompenses.pieces} po`);
  });
});
