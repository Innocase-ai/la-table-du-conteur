// Correctifs de l'audit du moteur du 18/11/2026 (docs/AUDIT-MOTEUR.md), rangs 1 à 3 :
// M1 conversation bloquée après un service de nuit, M2 rencontre fortuite qui garde les trésors pour toujours,
// M3 sauvegarde qui cite une rencontre ou un lieu disparus, filet de sécurité du noyau.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { bilanPersonnage, commande, creerGenerateur, creerMoteur, etatInitial, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type DonneesMonde, type Module, type Partie } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { aller, issueRencontre, nouvellePartie, prendre } from '../src/monde/exploration';
import { pnjPresents } from '../src/monde/dialogue';
import { lieuxDuPnjMaintenant } from '../src/monde/presence';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
function monde(id: string): DonneesMonde {
  const r = chargerMonde(join(RACINE_MONDES, id));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  return r.monde;
}
const groupe = (n = 4) =>
  groupeConseille(n, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
const depart = (m: ReturnType<typeof creerMoteur>, graine = 3): Partie => m.executer(m.nouvellePartie(groupe(), { graine }), { type: 'commencer' }).partie;

describe('M1 : une conversation ne reste jamais sans interlocuteur', () => {
  const dm = monde('dime-des-roseaux');
  const m = creerMoteur({ dm, srd }, MODULES_STANDARD);
  const bastien = dm.pnj.get('bastien')!;

  it('payer la chambre de Bastien le soir : au réveil il est parti, la conversation se ferme', () => {
    let p = depart(m);
    p.etat.heure = 19;
    p.etat.pieces = 100;
    p.etat.lieu = lieuxDuPnjMaintenant({ etat: p.etat }, bastien)[0]!;
    p = m.executer(p, { type: 'parler', pnj: 'bastien' }).partie;
    expect(p.scene).toEqual({ type: 'dialogue', pnj: 'bastien' });
    const r = m.executer(p, { type: 'payerService', pnj: 'bastien', service: 'chambre' });
    expect(r.refus).toBeUndefined();
    expect(r.partie.etat.jour).toBe(2);
    expect(pnjPresents({ dm, etat: r.partie.etat, groupe: r.partie.groupe, gen: () => 0 }).some((n) => n.id === 'bastien')).toBe(false);
    expect(r.partie.scene).toEqual({ type: 'exploration' });
    expect(m.propositions(r.partie).length).toBeGreaterThan(0);
  });

  it('payer la chambre le matin : Bastien est toujours là, la conversation continue', () => {
    let p = depart(m);
    p.etat.heure = 8;
    p.etat.pieces = 100;
    p.etat.lieu = lieuxDuPnjMaintenant({ etat: p.etat }, bastien)[0]!;
    p = m.executer(p, { type: 'parler', pnj: 'bastien' }).partie;
    const r = m.executer(p, { type: 'payerService', pnj: 'bastien', service: 'chambre' });
    expect(r.partie.scene).toEqual({ type: 'dialogue', pnj: 'bastien' });
  });

  it('une conversation dont le PNJ est absent propose toujours « Fin du dialogue »', () => {
    const p = depart(m);
    p.scene = { type: 'dialogue', pnj: 'bastien' };
    p.etat.lieu = dm.monde.depart.lieu;
    p.etat.heure = 3;
    expect(pnjPresents({ dm, etat: p.etat, groupe: p.groupe, gen: () => 0 }).some((n) => n.id === 'bastien')).toBe(false);
    const fin = m.propositions(p).find((x) => x.ordre?.type === 'quitterDialogue');
    expect(fin?.libelle).toBe('Fin du dialogue');
    expect(m.executer(p, { type: 'quitterDialogue' }).partie.scene).toEqual({ type: 'exploration' });
  });

  it('une sauvegarde arrêtée face à un PNJ absent se recharge en exploration', () => {
    const p = depart(m);
    p.scene = { type: 'dialogue', pnj: 'bastien' };
    p.etat.heure = 3;
    expect(m.charger(JSON.stringify(p)).scene).toEqual({ type: 'exploration' });
  });
});

describe('M2 : une rencontre fortuite fuie ne garde pas les trésors du lieu', () => {
  it('Médaillon : fuir le combat fortuit de la chaumière laisse prendre l’armoire de Mahaut', () => {
    const dm = monde('le-medaillon-de-la-soeur-endormie');
    const etat = etatInitial(dm);
    etat.lieu = 'villambrune';
    const p = nouvellePartie(dm, etat, groupe(3), creerGenerateur(9));
    p.srd = srd;
    const r = aller(p, 'chaumiere-de-la-vieille-mahaut');
    expect(r.combat).toMatch(/^auto-/);
    issueRencontre(p, r.combat!, { type: 'fuite' });
    const pr = prendre(p, 'armoire-de-mahaut');
    expect(pr.refus ?? '').not.toMatch(/gardé/);
    expect(pr.ok).toBe(true);
  });

  it('une rencontre écrite fuie garde toujours sa salle (comportement inchangé)', () => {
    const dm = monde('le-medaillon-de-la-soeur-endormie');
    const ecrite = [...dm.rencontres.values()].find((rc) => (rc.type === 'combat' || rc.type === 'mixte') && [...dm.tresors.values()].some((t) => t.lieu === rc.lieu && !t.gardien && !t.acces.cache));
    expect(ecrite).toBeDefined();
    const tresor = [...dm.tresors.values()].find((t) => t.lieu === ecrite!.lieu && !t.gardien && !t.acces.cache)!;
    const etat = etatInitial(dm);
    etat.lieu = ecrite!.lieu!;
    const p = nouvellePartie(dm, etat, groupe(3), creerGenerateur(1));
    p.srd = srd;
    issueRencontre(p, ecrite!.id, { type: 'fuite' });
    expect(prendre(p, tresor.id).refus).toMatch(/gardé/);
  });
});

describe('M3 : une sauvegarde qui cite une entité disparue ne bloque pas la partie', () => {
  const dm = monde('le-medaillon-de-la-soeur-endormie');
  const m = creerMoteur({ dm, srd }, MODULES_STANDARD);
  const brut = () => JSON.parse(JSON.stringify(depart(m))) as Record<string, any>;

  it('une rencontre supprimée du monde : retour en exploration, combat en cours oublié', () => {
    const b = brut();
    b.scene = { type: 'rencontre', rencontre: 'r-supprimee-du-monde' };
    b.combatEnCours = { etat: {}, graine: 1 };
    const c = m.charger(JSON.stringify(b));
    expect(c.scene).toEqual({ type: 'exploration' });
    expect(c.combatEnCours).toBeUndefined();
    expect(m.propositions(c).length).toBeGreaterThan(0);
  });

  it('une rencontre fortuite gardée avec la partie reste valable au chargement', () => {
    const b = brut();
    const id = 'auto-villambrune-1';
    b.etat.exploration.rencontresAuto = { [id]: { ...[...dm.rencontres.values()].find((rc) => rc.type === 'combat'), id, lieu: b.etat.lieu } };
    b.scene = { type: 'rencontre', rencontre: id };
    expect(m.charger(JSON.stringify(b)).scene).toEqual({ type: 'rencontre', rencontre: id });
  });

  it('un PNJ supprimé du monde : la conversation se ferme', () => {
    const b = brut();
    b.scene = { type: 'dialogue', pnj: 'pnj-supprime' };
    expect(m.charger(JSON.stringify(b)).scene).toEqual({ type: 'exploration' });
  });

  it('un lieu courant supprimé : retour au dernier lieu visité qui existe encore, sinon au départ', () => {
    const b = brut();
    const visite = b.etat.lieuxVisites.at(-1);
    b.etat.lieuxVisites.push('lieu-renomme');
    b.etat.lieu = 'lieu-renomme';
    const c = m.charger(JSON.stringify(b));
    expect(c.etat.lieu).toBe(visite);
    expect(() => m.vue('scene', c)).not.toThrow();
    expect(() => m.propositions(c)).not.toThrow();
    expect(m.executer(c, { type: 'fouiller' }).erreurInterne).toBeUndefined();

    const b2 = brut();
    b2.etat.lieuxVisites = ['autre-lieu-renomme'];
    b2.etat.lieu = 'lieu-renomme';
    expect(m.charger(JSON.stringify(b2)).etat.lieu).toBe(dm.monde.depart.lieu);
  });

  it('une sauvegarde sans scène, sans modules ou sans journal se charge avec leurs valeurs par défaut', () => {
    const b = brut();
    delete b.scene;
    delete b.modules;
    delete b.journal;
    delete b.etat.exploration;
    const c = m.charger(JSON.stringify(b));
    expect(c.scene).toEqual({ type: 'exploration' });
    expect(c.journal).toEqual([]);
    expect(c.modules['inventaire']).toBeDefined();
    expect(c.etat.exploration.sujetsVus).toEqual([]);
    expect(() => m.propositions(c)).not.toThrow();
    const r = m.executer(c, { type: 'seReposer', duree: 'court' });
    expect(r.erreurInterne).toBeUndefined();
  });

  it('une disponibilité qui plante devient un refus « erreur interne », pas une exception', () => {
    const casse: Module = { id: 'casse', commandes: { casser: commande({ description: 'plante', entree: z.object({}), disponible: () => { throw new Error('boum'); }, executer: () => undefined }) } };
    const m2 = creerMoteur({ dm, srd }, [...MODULES_STANDARD, casse]);
    const p = m2.nouvellePartie(groupe(), { graine: 1 });
    const r = m2.executer(p, { type: 'casser' });
    expect(r.refus).toMatch(/Erreur interne/);
    expect(r.erreurInterne).toMatch(/boum/);
    expect(r.partie).toBe(p);
  });

  it('des propositions qui plantent dans un module n’empêchent pas celles des autres', () => {
    const casse: Module = { id: 'casse', commandes: { casser: commande({ description: 'plante', entree: z.object({}), executer: () => undefined, propositions: () => { throw new Error('boum'); } }) } };
    const m2 = creerMoteur({ dm, srd }, [...MODULES_STANDARD, casse]);
    const p = depart(m2);
    const avant = console.error;
    console.error = () => undefined;
    try {
      expect(m2.propositions(p).length).toBeGreaterThan(0);
    } finally {
      console.error = avant;
    }
  });
});
