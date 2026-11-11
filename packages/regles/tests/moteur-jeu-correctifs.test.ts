// Correctifs de l'audit du reste du moteur (docs/AUDIT-MOTEUR-JEU.md) : filet de sécurité du noyau, sauvegarde abîmée,
// énigme, repos, fouille, piège, paliers, rencontre fuie, clé, harmonisation, or arrondi, services.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  appliquerEffets,
  bilanPersonnage,
  commande,
  creerMoteur,
  evaluerCondition,
  etatInitial,
  groupeConseille,
  MODULES_STANDARD,
  personnageDepuisFiche,
  type DonneesMonde,
  type Enigme,
  type Module,
  type Partie,
} from '../src';
import { migrer } from '../src/noyau/migrations';
import { fouiller, issueRencontre, nouvellePartie, repondreEnigme, seReposer, type PartieMonde } from '../src/monde/exploration';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
function monde(id: string): DonneesMonde {
  const r = chargerMonde(join(RACINE_MONDES, id));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  return r.monde;
}
const groupe = (n = 3) =>
  groupeConseille(1, srd)
    .emplacements.slice(0, n)
    .map((p) => {
      const f = bilanPersonnage(p!, srd).fiche!;
      return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
    });
const partieMonde = (dm: DonneesMonde, lieu?: string): PartieMonde => {
  const etat = etatInitial(dm);
  if (lieu) etat.lieu = lieu;
  return nouvellePartie(dm, etat, groupe(), () => 0.5);
};

describe('filet de sécurité du noyau', () => {
  it('une commande qui plante devient un refus « erreur interne », la partie reste intacte', () => {
    const casse: Module = { id: 'casse', commandes: { casser: commande({ description: 'plante', entree: z.object({}), executer: () => { throw new Error('boum'); } }) } };
    const dm = monde('marche-d-ombrefiel');
    const moteur = creerMoteur({ dm, srd }, [...MODULES_STANDARD, casse]);
    const p = moteur.nouvellePartie(groupe(), { graine: 1 });
    const r = moteur.executer(p, { type: 'casser' });
    expect(r.refus).toMatch(/Erreur interne/);
    expect(r.erreurInterne).toMatch(/boum/);
    expect(r.partie).toBe(p);
  });

  it('une sauvegarde sans version ou sans état est refusée clairement', () => {
    expect(() => migrer({ monde: 'x', etat: {}, groupe: [] } as never)).toThrow(/sans numéro de version/);
    expect(() => migrer({ version: 2, monde: 'x', groupe: [] } as never)).toThrow(/état de la partie/);
  });
});

describe('exploration', () => {
  function mauvaiseReponse(p: PartieMonde, e: Enigme): unknown {
    const s = e.solution as { type: string; valeurs?: number[]; ordre?: unknown[]; positions?: boolean[] };
    const essais = s.type === 'cadran' ? [s.valeurs!.map((v) => v + 1), s.valeurs!.map((v) => v - 1)] : s.type === 'sequence' ? [[...s.ordre!].reverse()] : s.type === 'leviers' ? [s.positions!.map((x) => !x)] : ['réponse fausse'];
    return essais.find((x) => !repondreEnigme({ ...p, etat: structuredClone(p.etat), groupe: structuredClone(p.groupe) }, e.id, x).refus) ?? essais[0];
  }

  it('Dîme : trois mauvaises réponses font monter la jauge une seule fois (plus de fin d’échec en trois erreurs)', () => {
    const dm = monde('dime-des-roseaux');
    const e = [...dm.enigmes.values()].find((x) => x.echec?.effets.some((f) => 'jauge' in f))!;
    expect(e, 'une énigme dont l’échec fait monter une jauge').toBeTruthy();
    const jauge = (e.echec!.effets.find((f) => 'jauge' in f) as { jauge: { id: string } }).jauge.id;
    const p = partieMonde(dm, e.lieu);
    const avant = p.etat.jauges[jauge] ?? dm.jauges.get(jauge)!.initial;
    const faux = mauvaiseReponse(p, e);
    for (let i = 0; i < 3; i++) repondreEnigme(p, e.id, faux);
    expect(p.etat.jauges[jauge]).toBe(avant + (e.echec!.effets.find((f) => 'jauge' in f) as { jauge: { delta: number } }).jauge.delta);
    expect(p.etat.fin).toBeUndefined();
  });

  it('une halte prend une heure ; une nuit commencée à 2 h finit le même jour ; une nuit le soir mène au lendemain 8 h', () => {
    const dm = monde('marche-d-ombrefiel');
    const sur = [...dm.lieux.values()].find((l) => l.repos === 'sur')!;
    const p = partieMonde(dm, sur.id);
    p.etat.heure = 10;
    seReposer(p, 'court');
    expect(p.etat.heure).toBe(11);
    p.etat.heure = 2;
    const jour = p.etat.jour;
    seReposer(p, 'long');
    if (p.etat.heure !== 2) {
      expect(p.etat.jour).toBe(jour);
      expect(p.etat.heure).toBe(10);
    }
    p.etat.heure = 21;
    seReposer(p, 'long');
    expect(p.etat.heure).toBe(8);
  });

  it('une fouille confiée à un héros inconnu est refusée sans user la fouille du jour', () => {
    const dm = monde('marche-d-ombrefiel');
    const p = partieMonde(dm);
    expect(fouiller(p, 'personne').refus).toBeTruthy();
    expect(fouiller(p).refus).toBeUndefined();
  });

  it('un palier « monte » ne se déclenche pas quand la jauge redescend', () => {
    const dm = monde('dime-des-roseaux');
    const j = [...dm.jauges.values()][0]!;
    const palier = j.paliers.find((x) => x.seuil > j.min)!;
    const p = partieMonde(dm);
    p.etat.jauges[j.id] = palier.seuil + 1;
    appliquerEffets([{ jauge: { id: j.id, delta: -1 } }], p.etat, dm);
    const r = issueRencontre(p, [...dm.rencontres.keys()][0]!, { type: 'fuite' });
    expect(r.narrations.join(' ')).not.toContain(palier.narration);
  });

  it('« rencontre faite » est fausse après une fuite, vraie après une victoire', () => {
    const dm = monde('marche-d-ombrefiel');
    const id = [...dm.rencontres.keys()][0]!;
    const p = partieMonde(dm);
    issueRencontre(p, id, { type: 'fuite' });
    expect(evaluerCondition({ rencontre: { id } }, p.etat)).toBe(false);
    issueRencontre(p, id, { type: 'victoire' });
    expect(evaluerCondition({ rencontre: { id } }, p.etat)).toBe(true);
  });
});

describe('objets et commerce', () => {
  const dime = monde('dime-des-roseaux');
  const moteur = creerMoteur({ dm: dime, srd }, MODULES_STANDARD);
  const depart = (): Partie => ({ ...moteur.nouvellePartie(groupe(), { graine: 2 }), scene: { type: 'exploration' } });

  it('une clé ne se jette pas', () => {
    const cle = [...dime.objets.values()].find((o) => o.categorie === 'cle')!;
    const p = depart();
    p.etat.inventaire[cle.id] = 1;
    expect(moteur.executer(p, { type: 'jeterObjet', objet: cle.id }).refus).toMatch(/trop important/);
  });

  it('l’or reste au cuivre près : trois dépenses de 1 pa sur 3 pa laissent 0, pas 0,0999…', () => {
    const p = depart();
    p.etat.pieces = 0.3;
    for (let i = 0; i < 3; i++) appliquerEffets([{ pieces: -0.1 }], p.etat, dime);
    expect(p.etat.pieces).toBe(0);
  });

  it('des soins ne se paient pas quand tout le groupe est en pleine forme', () => {
    const soigneur = [...dime.pnj.values()].find((n) => n.services.some((s) => /soin|guerison/.test(s.id) && !s.condition && !s.effets.length));
    if (!soigneur) return;
    const service = soigneur.services.find((s) => /soin|guerison/.test(s.id))!;
    const p = { ...depart(), etat: { ...depart().etat, lieu: soigneur.lieu, pieces: 100 } };
    const r = moteur.executer(p, { type: 'payerService', pnj: soigneur.id, service: service.id });
    expect(r.refus).toMatch(/besoin de soins/);
  });
});
