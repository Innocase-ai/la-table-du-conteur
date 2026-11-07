// Le climax du Val des Cendres : le Choix du Cœur se présente sans « Fouiller », que la garde soit apaisée ou vaincue,
// avec ou sans le Fer-Gris ; Thalgrin écoute un volontaire même vaincu ; « Achever » se fait aussi sans la braise de veille.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  aller,
  etatInitial,
  herosPreTires,
  issueRencontre,
  nouvellePartie,
  parler,
  personnageDepuisFiche,
  type DonneesMonde,
  type Generateur,
  type PartieMonde,
} from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const SUCCES: Generateur = () => 0.999;

function monde(): DonneesMonde {
  const r = chargerMonde(join(RACINE_MONDES, 'val-des-cendres'));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  return r.monde;
}
const groupe = () => herosPreTires(srd).map((h) => personnageDepuisFiche(h.fiche, { id: h.fiche.nom.toLowerCase() }));

/** Le groupe arrive à la Forge du Cœur par le pont de la Veine ; la garde de Thalgrin se présente. */
function arriverAuCoeur(flags: string[] = []): { p: PartieMonde; garde: ReturnType<typeof aller> } {
  const dm = monde();
  const p = nouvellePartie(dm, etatInitial(dm, 5), groupe(), SUCCES);
  p.etat.lieu = 'hf-pont-de-la-veine';
  for (const f of flags) p.etat.flags[f] = true;
  return { p, garde: aller(p, 'hf-forge-du-coeur') };
}

describe('le climax de la Haute-Forge', () => {
  it('la garde se présente à l’arrivée, et le Choix du Cœur suit aussitôt qu’elle est apaisée (sans fouiller)', () => {
    const { p, garde } = arriverAuCoeur();
    expect(garde.combat).toBe('hf-r-garde-de-thalgrin');
    const r = issueRencontre(p, 'hf-r-garde-de-thalgrin', { type: 'alternative', id: 'parlementer' });
    expect(r.ok).toBe(true);
    expect(r.combat).toBe('hf-r-le-choix-du-coeur');
  });

  it('même si la garde est vaincue au combat, le Choix du Cœur se présente, et Thalgrin écoute encore un volontaire', () => {
    const { p } = arriverAuCoeur();
    const r = issueRencontre(p, 'hf-r-garde-de-thalgrin', { type: 'victoire' });
    expect(r.combat).toBe('hf-r-le-choix-du-coeur');
    expect(p.etat.attitudes['thalgrin-coeur-d-enclume']).toBeLessThan(0);
    const dialogue = parler(p, 'thalgrin-coeur-d-enclume', 'le-volontaire');
    expect(dialogue.ok).toBe(true);
    expect(dialogue.revele).toContain('f-rallumer-par-volontaire');
    // Et la voie « Rallumer » est alors ouverte.
    const rallumer = issueRencontre(p, 'hf-r-le-choix-du-coeur', { type: 'alternative', id: 'rallumer' });
    expect(rallumer.ok).toBe(true);
    expect(p.etat.flags['choix-rallumer']).toBe(true);
  });

  it('allié au Fer-Gris : le capitaine arrive d’abord ; refuser ne coûte pas le Choix du Cœur', () => {
    const { p } = arriverAuCoeur(['fer-gris-allie']);
    const garde = issueRencontre(p, 'hf-r-garde-de-thalgrin', { type: 'alternative', id: 'parlementer' });
    expect(garde.combat).toBe('hf-r-le-fer-gris-arrive');
    const refus = issueRencontre(p, 'hf-r-le-fer-gris-arrive', { type: 'alternative', id: 'refuser' });
    expect(refus.combat).toBe('hf-r-le-choix-du-coeur');
  });

  it('allié au Fer-Gris : le laisser prendre la Forge ne présente pas de choix qui ne mène nulle part', () => {
    const { p } = arriverAuCoeur(['fer-gris-allie']);
    issueRencontre(p, 'hf-r-garde-de-thalgrin', { type: 'alternative', id: 'parlementer' });
    const r = issueRencontre(p, 'hf-r-le-fer-gris-arrive', { type: 'alternative', id: 'laisser-prendre' });
    expect(r.combat).toBeUndefined();
    expect(p.etat.flags['choix-fer-gris']).toBe(true);
    expect(p.etat.fin).toBe('fin-fer-gris');
  });

  it('« Achever » se fait aussi sans la braise de veille, en donnant son souffle, une fois la dernière commande connue', () => {
    const { p } = arriverAuCoeur();
    issueRencontre(p, 'hf-r-garde-de-thalgrin', { type: 'alternative', id: 'parlementer' });
    // Sans connaître la dernière commande ni avoir la braise : refusé.
    expect(issueRencontre(p, 'hf-r-le-choix-du-coeur', { type: 'alternative', id: 'achever-souffle' }).ok).toBe(false);
    expect(issueRencontre(p, 'hf-r-le-choix-du-coeur', { type: 'alternative', id: 'achever' }).ok).toBe(false);
    p.etat.faits.push('f-derniere-commande');
    const r = issueRencontre(p, 'hf-r-le-choix-du-coeur', { type: 'alternative', id: 'achever-souffle' });
    expect(r.ok).toBe(true);
    expect(p.etat.flags['choix-achever']).toBe(true);
    expect(p.etat.fin).toBe('fin-achever');
  });

  it('l’Écluse noire se présente à l’arrivée, sans fouiller', () => {
    const dm = monde();
    const p = nouvellePartie(dm, etatInitial(dm, 5), groupe(), SUCCES);
    p.etat.lieu = 'hf-forge-du-coeur';
    const r = aller(p, 'hf-ecluse-noire');
    expect(r.combat).toBe('hf-r-ecluse-noire');
  });
});
