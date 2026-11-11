import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type Partie } from '../src';
import { chargerMonde } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(MONDES_ESSAI, 'citadelle-des-marees'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const moteur = creerMoteur({ dm: r.monde, srd }, MODULES_STANDARD);

function depart(): Partie {
  const g = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  let p = moteur.executer(moteur.nouvellePartie(g, { graine: 5, niveau: 3 }), { type: 'commencer' }).partie;
  p = moteur.executer(p, { type: 'terminerScene', scene: 'ouverture' }).partie;
  return p;
}
const ici = (p: Partie, lieu: string, flags: Record<string, boolean> = {}): Partie => ({ ...p, scene: { type: 'exploration' } as Partie['scene'], etat: { ...p.etat, lieu, flags: { ...p.etat.flags, ...flags } } });
const textes = (evs: { type: string }[]) => evs.filter((e) => e.type === 'texte').map((e) => (e as unknown as { texte: string }).texte);

describe('L’homme au manteau sec : l’antagoniste hante le début de l’histoire', () => {
  it('première apparition dans la cour des vents, avant la nuit du départ, une seule fois', () => {
    const p0 = ici(depart(), 'citadelle-des-marees');
    const res = moteur.executer(p0, { type: 'aller', vers: 'cit-cour-des-vents' });
    expect(res.refus).toBeUndefined();
    expect(res.partie.etat.faits).toContain('f-cit-homme-bleme-vu');
    expect(res.evenements.some((e) => e.type === 'texte' && /manteau est sec/.test((e as { texte: string }).texte))).toBe(true);
    // Une seconde visite ne le ramène pas.
    const hors = moteur.executer(res.partie, { type: 'aller', vers: 'citadelle-des-marees' }).partie;
    const encore = moteur.executer(hors, { type: 'aller', vers: 'cit-cour-des-vents' });
    expect(textes(encore.evenements).some((t) => /manteau est sec/.test(t))).toBe(false);
  });

  it('il n’apparaît plus dans la cour une fois la nuit du départ passée', () => {
    const p0 = ici(depart(), 'citadelle-des-marees', { 'cit-nuit-du-depart': true });
    const res = moteur.executer(p0, { type: 'aller', vers: 'cit-cour-des-vents' });
    expect(res.partie.etat.faits).not.toContain('f-cit-homme-bleme-vu');
  });

  it('le frère portier en parle une fois que le groupe l’a vu, et en apprend la question posée à la porte', () => {
    let p = ici(depart(), 'cit-porte-de-terre');
    expect(moteur.executer(p, { type: 'parler', pnj: 'cit-frere-halvard', sujet: 'l-homme-au-manteau-sec' }).refus).toBeTruthy();
    p = { ...p, etat: { ...p.etat, faits: [...p.etat.faits, 'f-cit-homme-bleme-vu'] } };
    p = moteur.executer(p, { type: 'parler', pnj: 'cit-frere-halvard' }).partie;
    const res = moteur.executer(p, { type: 'parler', pnj: 'cit-frere-halvard', sujet: 'l-homme-au-manteau-sec' });
    expect(res.refus).toBeUndefined();
    expect(res.partie.etat.faits).toContain('f-cit-homme-bleme-question');
  });

  it('sur la digue du marais, après la nuit du départ, il regarde Nolwen, et Nolwen le reconnaît', () => {
    const p0 = ici(depart(), 'route-des-falaises', { 'cit-nuit-du-depart': true, 'nolwen-avec-le-groupe': true });
    const p1 = { ...p0, etat: { ...p0.etat, escortes: ['nolwen-brevemer'] } };
    const res = moteur.executer(p1, { type: 'aller', vers: 'marais-de-sel' });
    expect(res.refus).toBeUndefined();
    expect(res.partie.etat.faits).toContain('f-fal-homme-bleme-marais');
    const t = textes(res.evenements);
    expect(t.some((x) => /à vingt pas/.test(x))).toBe(true);
    expect(t.some((x) => /il regardait ma fenêtre/.test(x))).toBe(true);
  });
});
