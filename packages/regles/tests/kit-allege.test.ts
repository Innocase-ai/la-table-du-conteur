import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche } from '../src';
import { chargerMonde } from '../src/monde/chargeur';
import { allegerKit, jeuxDArmes, optionsEquipement } from '../src/creation/equipement';
import { resoudreObjets } from '../src/creation/equipement';
import { chargerDonneesSrd } from '../src/donnees-node';
import { MONDES_ESSAI } from './mondes-essai';

const d = chargerDonneesSrd();
const armesDe = (objets: string[]) => resoudreObjets(objets, d).armes;
const minuscules = (objets: string[]) => objets.map((o) => o.toLowerCase());

describe('kit de départ allégé', () => {
  it('le guerrier ne garde qu’un jeu d’armes : l’épée à deux mains (mêlée) ou les javelines (tir), au choix ; rien du fléau', () => {
    const a = d.classes.get('guerrier')!.equipementDepart.find((o) => o.id === 'A')!;
    const melee = allegerKit(a.objets, a.po, 'classe', d);
    expect(melee.objets).toEqual(['Cotte de mailles', 'Épée à deux mains', 'Paquetage d’exploration souterraine']);
    expect(melee.po).toBe(a.po);
    const tir = allegerKit(a.objets, a.po, 'classe', d, 'tir');
    expect(tir.objets).toEqual(['Cotte de mailles', '8 javelines', 'Paquetage d’exploration souterraine']);
    expect(tir.po).toBe(a.po);
  });

  it('le rôdeur choisit entre le cimeterre (mêlée) et l’arc long avec ses flèches et son carquois ; le roublard entre la dague et l’arc court', () => {
    const rodeur = d.classes.get('rodeur')!.equipementDepart;
    const melee = optionsEquipement(rodeur, 'classe', d)[0]!;
    expect(armesDe(melee.objets)).toEqual(['cimeterre']);
    expect(minuscules(melee.objets)).not.toEqual(expect.arrayContaining(['20 flèches']));
    const tir = optionsEquipement(rodeur, 'classe', d, 'tir')[0]!;
    expect(armesDe(tir.objets)).toEqual(['arc-long']);
    expect(minuscules(tir.objets)).toEqual(expect.arrayContaining(['20 flèches', 'carquois']));
    const roublard = d.classes.get('roublard')!.equipementDepart;
    expect(armesDe(optionsEquipement(roublard, 'classe', d, 'tir')[0]!.objets)).toEqual(['arc-court']);
    expect(minuscules(optionsEquipement(roublard, 'classe', d, 'tir')[0]!.objets)).toEqual(expect.arrayContaining(['20 flèches', 'carquois']));
    expect(minuscules(optionsEquipement(roublard, 'classe', d)[0]!.objets)).not.toEqual(expect.arrayContaining(['20 flèches']));
  });

  it('jeuxDArmes dit les deux jeux d’un kit (mêlée, jet ou tir) avec leurs munitions, et rien quand il n’y en a qu’un', () => {
    expect(jeuxDArmes(d.classes.get('rodeur')!.equipementDepart, d)).toEqual([
      { id: 'melee', armes: ['cimeterre'] },
      { id: 'tir', armes: ['arc long', '20 flèches', 'carquois'] },
    ]);
    for (const c of d.classes.values()) {
      const jeux = jeuxDArmes(c.equipementDepart, d);
      expect(jeux.length === 0 || jeux.length === 2, c.nom).toBe(true);
    }
  });

  it('l’historique ne donne plus d’armes ni de munitions (la lance et l’arc court du Soldat), sans compensation en or', () => {
    const soldat = d.historiques.get('soldat')!.equipementDepart.find((o) => o.id === 'A')!;
    const k = allegerKit(soldat.objets, soldat.po, 'historique', d);
    expect(armesDe(k.objets)).toEqual([]);
    expect(k.objets.join(' ')).not.toMatch(/flèche|carquois|lance|arc court/i);
    expect(minuscules(k.objets)).toEqual(expect.arrayContaining(['trousse de soins']));
    expect(k.po).toBe(soldat.po);
  });

  it('chaque classe garde exactement une arme (un seul jeu), dans les deux jeux, avec son armure et son bouclier ; l’or ne change jamais', () => {
    for (const c of d.classes.values()) {
      for (const o of c.equipementDepart.filter((x) => x.objets.length)) {
        const avant = resoudreObjets(o.objets, d);
        for (const jeu of ['melee', 'tir'] as const) {
          const k = allegerKit(o.objets, o.po, 'classe', d, jeu);
          const apres = resoudreObjets(k.objets, d);
          expect(apres.armes.length, `${c.nom} ${o.id} ${jeu}`).toBe(avant.armes.length ? 1 : 0);
          expect(k.po, `${c.nom} ${o.id} ${jeu}`).toBe(o.po);
        }
        const k = allegerKit(o.objets, o.po, 'classe', d);
        const apres = resoudreObjets(k.objets, d);
        expect(apres.armure, `${c.nom} ${o.id}`).toBe(avant.armure);
        expect(apres.bouclier, `${c.nom} ${o.id}`).toBe(avant.bouclier);
        expect(k.po, `${c.nom} ${o.id}`).toBe(o.po);
      }
    }
  });

  it('aucun historique ne donne d’arme', () => {
    for (const h of d.historiques.values()) for (const o of optionsEquipement(h.equipementDepart, 'historique', d)) expect(armesDe(o.objets), `${h.nom} ${o.id}`).toEqual([]);
  });

  it('au début de l’histoire, l’or de départ des fiches forme la bourse du groupe', () => {
    const r = chargerMonde(join(MONDES_ESSAI, 'citadelle-des-marees'));
    if (!r.ok) throw new Error('monde illisible');
    const moteur = creerMoteur({ dm: r.monde, srd: d }, MODULES_STANDARD);
    const groupe = groupeConseille(1, d).emplacements.map((p) => {
      const f = bilanPersonnage(p!, d).fiche!;
      return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
    });
    const attendu = groupe.reduce((s, h) => s + (h.fiche.equipement?.po ?? 0), 0);
    expect(attendu).toBeGreaterThan(30);
    const p = moteur.executer(moteur.nouvellePartie(groupe, { graine: 1, niveau: 1 }), { type: 'commencer' }).partie;
    expect(p.etat.pieces).toBeCloseTo(attendu, 2);
  });

  it('le plafond d’or de départ du monde (depart.orMax) limite la bourse de chaque héros', () => {
    const r = chargerMonde(join(MONDES_ESSAI, 'citadelle-des-marees'));
    if (!r.ok) throw new Error('monde illisible');
    const dm = structuredClone(r.monde);
    dm.monde.depart.orMax = 10;
    const moteur = creerMoteur({ dm, srd: d }, MODULES_STANDARD);
    const groupe = groupeConseille(1, d).emplacements.map((p) => {
      const f = bilanPersonnage(p!, d).fiche!;
      return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
    });
    const attendu = groupe.reduce((s, h) => s + Math.min(h.fiche.equipement?.po ?? 0, 10), 0);
    const sansPlafond = groupe.reduce((s, h) => s + (h.fiche.equipement?.po ?? 0), 0);
    expect(attendu).toBeLessThan(sansPlafond);
    const p = moteur.executer(moteur.nouvellePartie(groupe, { graine: 1, niveau: 1 }), { type: 'commencer' }).partie;
    expect(p.etat.pieces).toBeCloseTo(attendu, 2);
    expect(p.etat.pieces).toBeLessThanOrEqual(10 * groupe.length);
  });
});
