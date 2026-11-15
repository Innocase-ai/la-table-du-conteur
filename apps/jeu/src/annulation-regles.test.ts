// Annuler le dernier pas hors combat : la règle ne laisse défaire que les pas sans dé lancé ni écran déclenché.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type Ordre, type Partie } from '@crpg/regles';
import { chargerDonneesSrd } from '../../../packages/regles/src/donnees-node';
import { chargerMonde } from '../../../packages/regles/src/monde/chargeur';
import { MONDES_ESSAI } from '../../../packages/regles/tests/mondes-essai';
import { annulationPossible, libelleAnnulation, ORDRES_ANNULABLES, pasAnnulable, refusAnnulation } from './annulation-regles';

const srd = chargerDonneesSrd();

function charger(id: string) {
  const r = chargerMonde(join(MONDES_ESSAI, id));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  const moteur = creerMoteur({ dm: r.monde, srd }, MODULES_STANDARD);
  const groupe = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  const depart = moteur.executer(moteur.nouvellePartie(groupe, { graine: 11, niveau: 3 }), { type: 'commencer' }).partie;
  return { dm: r.monde, moteur, depart };
}

/** Le Val des Cendres : le tirage d'arrivée y est coupé (`tirageArrivee: false`), un pas n'y lance aucun dé. */
const val = charger('val-des-cendres');
/** Un monde où chaque arrivée lance le dé d'arrivée. */
const port = charger('port-sillage');

const jouer = (m: typeof val, p: Partie, ordre: Ordre) => {
  const r = m.moteur.executer(p, ordre);
  if (r.refus) throw new Error(`${ordre.type} refusé : ${r.refus}`);
  return r;
};

const VERS_HALLE: Ordre = { type: 'aller', vers: 'vei-halle-du-bailli' };

describe('annulation du dernier pas', () => {
  it('un déplacement sans dé se défait : on retrouve exactement la partie d’avant', () => {
    const r = jouer(val, val.depart, VERS_HALLE);
    expect(r.partie.etat.lieu).toBe('vei-halle-du-bailli');
    const pas = pasAnnulable(val.depart, VERS_HALLE, r);
    expect(pas).toBeDefined();
    expect(annulationPossible(pas, r.partie)).toBe(true);
    // Rendre la partie d'avant : même lieu, même journal, même graine.
    expect(pas!.avant.etat.lieu).toBe(val.depart.etat.lieu);
    expect(pas!.avant.journal).toHaveLength(val.depart.journal.length);
    expect(pas!.avant.graine).toBe(val.depart.graine);
    expect(libelleAnnulation(pas!, { lieu: (id) => val.dm.lieux.get(id)?.nom ?? id, objet: (id) => id })).toBe(`l’arrivée à ${val.dm.lieux.get('vei-halle-du-bailli')!.nom}`);
  });

  it('un déplacement qui lance le dé d’arrivée ne se défait pas (la graine a bougé)', () => {
    const sortie = port.moteur.propositions(port.depart).find((p) => p.ordre?.type === 'aller' && !p.desactivee);
    if (!sortie?.ordre) throw new Error('aucune sortie');
    const r = jouer(port, port.depart, sortie.ordre);
    expect(r.partie.graine).not.toBe(port.depart.graine);
    expect(refusAnnulation(port.depart, r.partie, sortie.ordre, r.evenements)).toMatch(/dé a été lancé/);
    expect(pasAnnulable(port.depart, sortie.ordre, r)).toBeUndefined();
  });

  it('un jet de dé, même seul, bloque l’annulation', () => {
    const r = jouer(val, val.depart, VERS_HALLE);
    const jet = { qui: 'x', nom: 'X', test: 'perception', dd: 10, des: [12], bonus: 0, total: 12, reussite: true };
    const avecJet = { ...r, evenements: [...r.evenements, { type: 'jet' as const, jet }] };
    expect(pasAnnulable(val.depart, VERS_HALLE, avecJet)).toBeUndefined();
  });

  it('un achat se défait : l’or et le sac reviennent', () => {
    // Un marchand présent : on s'y rend (l'état est posé directement) et on lui parle.
    let p = val.depart;
    let achat: ReturnType<typeof val.moteur.propositions>[number] | undefined;
    for (const pnj of val.dm.pnj.values()) {
      if (!pnj.boutique) continue;
      const ici = structuredClone(val.depart);
      ici.etat.lieu = pnj.lieu;
      ici.etat.pieces = 50;
      const conv = val.moteur.executer(ici, { type: 'parler', pnj: pnj.id });
      if (conv.refus) continue;
      achat = val.moteur.propositions(conv.partie).find((x) => x.ordre?.type === 'acheter' && !x.desactivee);
      if (achat) {
        p = conv.partie;
        break;
      }
    }
    expect(achat?.ordre).toBeDefined();
    const r = jouer(val, p, achat!.ordre!);
    expect(r.partie.etat.pieces).toBeLessThan(50);
    const pas = pasAnnulable(p, achat!.ordre!, r);
    expect(pas).toBeDefined();
    expect(pas!.avant.etat.pieces).toBe(50);
    expect(pas!.avant.etat.inventaire).toEqual(p.etat.inventaire);
    expect(libelleAnnulation(pas!, { lieu: (id) => id, objet: () => 'Rations' })).toBe('l’achat de Rations');
  });

  it('seuls un déplacement, un achat ou une vente se défont', () => {
    expect([...ORDRES_ANNULABLES].sort()).toEqual(['acheter', 'aller', 'vendre']);
    const r = jouer(val, val.depart, { type: 'regarder' });
    expect(refusAnnulation(val.depart, r.partie, { type: 'regarder' }, r.evenements)).toMatch(/Seuls/);
  });

  it('une rencontre déclenchée, des héros touchés, un écran ouvert : pas d’annulation', () => {
    const r = jouer(val, val.depart, VERS_HALLE);
    const enRencontre = { ...r.partie, scene: { type: 'rencontre' as const, rencontre: 'x' } };
    expect(refusAnnulation(val.depart, enRencontre, VERS_HALLE, [])).toMatch(/rencontre/i);
    const blesse = structuredClone(r.partie);
    blesse.groupe[0]!.pv = Math.max(0, blesse.groupe[0]!.pv - 1);
    expect(refusAnnulation(val.depart, blesse, VERS_HALLE, [])).toMatch(/groupe/);
    const scene = structuredClone(r.partie);
    scene.modules['scenes'] = { vues: [], file: ['scene-de-test'] };
    expect(refusAnnulation(val.depart, scene, VERS_HALLE, [])).toMatch(/écran/);
    expect(refusAnnulation(val.depart, r.partie, VERS_HALLE, [{ type: 'queteMiseAJour', quete: 'q', statut: 'active', etapesAccomplies: [], nouvelle: true }])).toMatch(/autre chose/);
  });

  it('le bouton disparaît dès que la partie affichée n’est plus celle d’après le pas', () => {
    const r = jouer(val, val.depart, VERS_HALLE);
    const pas = pasAnnulable(val.depart, VERS_HALLE, r);
    expect(annulationPossible(pas, r.partie)).toBe(true);
    const suivante = jouer(val, r.partie, { type: 'regarder' }).partie;
    expect(annulationPossible(pas, suivante)).toBe(false);
    expect(annulationPossible(undefined, r.partie)).toBe(false);
  });

  it('le moteur ne touche pas la partie d’avant : annuler puis rejouer redonne le même résultat', () => {
    const avantJson = JSON.stringify(val.depart);
    const r = jouer(val, val.depart, VERS_HALLE);
    expect(JSON.stringify(val.depart)).toBe(avantJson);
    const encore = jouer(val, val.depart, VERS_HALLE);
    expect(JSON.stringify(encore.partie)).toBe(JSON.stringify(r.partie));
  });
});
