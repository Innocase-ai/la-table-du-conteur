import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche } from '../src';
import { chargerMonde } from '../src/monde/chargeur';
import { allegerKit, optionsEquipement } from '../src/creation/equipement';
import { resoudreObjets } from '../src/creation/equipement';
import { chargerDonneesSrd } from '../src/donnees-node';
import { MONDES_ESSAI } from './mondes-essai';

const d = chargerDonneesSrd();
const armesDe = (objets: string[]) => resoudreObjets(objets, d).armes;
const minuscules = (objets: string[]) => objets.map((o) => o.toLowerCase());

describe('kit de départ allégé', () => {
  it('le guerrier garde son arme principale et ses javelines, pas le fléau ; le prix du fléau s’ajoute à son or', () => {
    const a = d.classes.get('guerrier')!.equipementDepart.find((o) => o.id === 'A')!;
    const k = allegerKit(a.objets, a.po, 'classe', d);
    expect(k.objets).toEqual(['Cotte de mailles', 'Épée à deux mains', '8 javelines', 'Paquetage d’exploration souterraine']);
    expect(k.po).toBe(a.po + 10);
  });

  it('le rôdeur garde l’arc long avec ses flèches et son carquois ; le roublard sans épée courte garde l’arc court', () => {
    const rodeur = optionsEquipement(d.classes.get('rodeur')!.equipementDepart, 'classe', d)[0]!;
    expect(armesDe(rodeur.objets)).toEqual(['cimeterre', 'arc-long']);
    expect(minuscules(rodeur.objets)).toEqual(expect.arrayContaining(['20 flèches', 'carquois']));
    const roublard = optionsEquipement(d.classes.get('roublard')!.equipementDepart, 'classe', d)[0]!;
    expect(armesDe(roublard.objets)).toContain('arc-court');
    expect(minuscules(roublard.objets)).toEqual(expect.arrayContaining(['20 flèches', 'carquois']));
  });

  it('l’historique ne donne plus d’armes ni de munitions (la lance et l’arc court du Soldat), mais leur prix en or', () => {
    const soldat = d.historiques.get('soldat')!.equipementDepart.find((o) => o.id === 'A')!;
    const k = allegerKit(soldat.objets, soldat.po, 'historique', d);
    expect(armesDe(k.objets)).toEqual([]);
    expect(k.objets.join(' ')).not.toMatch(/flèche|carquois|lance|arc court/i);
    expect(minuscules(k.objets)).toEqual(expect.arrayContaining(['trousse de soins']));
    expect(k.po).toBeGreaterThan(soldat.po);
  });

  it('chaque classe garde 1 ou 2 armes (jamais zéro, jamais plus de deux), son armure et son bouclier ; l’or ne baisse jamais', () => {
    for (const c of d.classes.values()) {
      for (const o of c.equipementDepart.filter((x) => x.objets.length)) {
        const avant = resoudreObjets(o.objets, d);
        const k = allegerKit(o.objets, o.po, 'classe', d);
        const apres = resoudreObjets(k.objets, d);
        expect(apres.armes.length, `${c.nom} ${o.id}`).toBeLessThanOrEqual(2);
        if (avant.armes.length) expect(apres.armes.length, `${c.nom} ${o.id}`).toBeGreaterThanOrEqual(1);
        expect(apres.armure, `${c.nom} ${o.id}`).toBe(avant.armure);
        expect(apres.bouclier, `${c.nom} ${o.id}`).toBe(avant.bouclier);
        expect(k.po, `${c.nom} ${o.id}`).toBeGreaterThanOrEqual(o.po);
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
});
