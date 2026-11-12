// La poupée d'équipement avec le vrai moteur : cases, mains bloquées, objets du sac par case, refus et CA.
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type Moteur, type Partie } from '@crpg/regles';
import { chargerDonneesSrd } from '../../../packages/regles/src/donnees-node';
import { chargerMonde } from '../../../packages/regles/src/monde/chargeur';
import { MONDES_ESSAI } from '../../../packages/regles/tests/mondes-essai';
import { join } from 'node:path';
import { attaquesEnMain, candidatsPour, casesPour, poupeeDe, texteCa } from './equipement-regles';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const moteur: Moteur = creerMoteur({ dm: r.monde, srd }, MODULES_STANDARD);

const depart = (): Partie => {
  const groupe = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  return moteur.nouvellePartie(groupe, { graine: 1, niveau: 3 });
};

describe('poupée d’équipement', () => {
  it('neuf cases de corps, deux jeux, le jeu en main est marqué', () => {
    const p = depart();
    const poupee = poupeeDe(moteur.ctx, p.groupe[0]!);
    expect(poupee.corps.map((c) => c.emplacement)).toEqual(['tete', 'cou', 'dos', 'torse', 'gants', 'anneau1', 'ceinture', 'anneau2', 'pieds']);
    expect(poupee.jeux.map((j) => j.actif)).toEqual([true, false]);
    expect(poupee.jeux[0].droite.objet).toBeDefined();
  });

  it('la main gauche est bloquée par une arme à deux mains, avec son motif', () => {
    const p = depart();
    const bran = p.groupe.find((h) => h.id === 'bran')!;
    const poupee = poupeeDe(moteur.ctx, bran);
    const j1 = poupee.jeux[0];
    if (j1.droite.objet?.id === 'epee-a-deux-mains') expect(j1.gauche.bloquee).toMatch(/deux mains/);
    else expect(j1.gauche.bloquee).toBeUndefined();
  });

  it('les objets du sac par case : la bonne famille, la CA avant et après, et les refus motivés', () => {
    const p = depart();
    p.etat.inventaire['cotte-de-mailles'] = 1;
    p.etat.inventaire['bouclier'] = 1;
    p.etat.inventaire['bottes-ailees'] = 1;
    const h = p.groupe.find((x) => x.id === 'pip')!;
    const torse = candidatsPour(moteur.ctx, h, 'torse', p.etat.inventaire);
    expect(torse.map((c) => c.objet)).toEqual(['cotte-de-mailles']);
    expect(torse[0]!.ca.apres).toBeGreaterThan(torse[0]!.ca.avant);
    expect(texteCa(torse[0]!.ca)).toMatch(/^CA \d+ → \d+$/);
    expect(candidatsPour(moteur.ctx, h, 'pieds', p.etat.inventaire).map((c) => c.objet)).toEqual(['bottes-ailees']);
    // Le bouclier va à gauche seulement, jamais à droite ni au corps.
    expect(candidatsPour(moteur.ctx, h, 'tete', p.etat.inventaire)).toEqual([]);
    const droite = candidatsPour(moteur.ctx, h, 'j1.droite', p.etat.inventaire);
    expect(droite.find((c) => c.objet === 'bouclier')?.refus).toMatch(/main gauche/);
  });

  it('les cases où va un objet du sac (celles qui s’allument), avec leur refus', () => {
    const h = depart().groupe.find((x) => x.id === 'pip')!;
    expect(Object.keys(casesPour(moteur.ctx, h, 'cotte-de-mailles'))).toEqual(['torse']);
    expect(Object.keys(casesPour(moteur.ctx, h, 'bottes-ailees'))).toEqual(['pieds']);
    // Un bouclier : les quatre mains sont proposées, seules les gauches l'acceptent (si la droite le permet).
    const bouclier = casesPour(moteur.ctx, h, 'bouclier');
    expect(Object.keys(bouclier).sort()).toEqual(['j1.droite', 'j1.gauche', 'j2.droite', 'j2.gauche']);
    expect(bouclier['j1.droite']!.refus).toMatch(/main gauche/);
    expect(casesPour(moteur.ctx, h, 'rations')).toEqual({});
  });

  it('les attaques du jeu en main suivent la bascule des jeux', () => {
    let p = depart();
    const bran = () => p.groupe.find((x) => x.id === 'bran')!;
    const avant = attaquesEnMain(moteur.ctx, bran()).map((a) => a.id);
    expect(avant.length).toBeGreaterThan(0);
    p = moteur.executer(p, { type: 'changerJeuArmes', personnage: 'bran' }).partie;
    const apres = attaquesEnMain(moteur.ctx, bran()).map((a) => a.id);
    expect(apres).not.toEqual(avant);
  });
});
