// Les emplacements d'équipement : classement de chaque objet du SRD, règles des mains (Deux mains, bouclier, arme Légère à gauche),
// jeux d'armes, conversion des anciennes sauvegardes.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bouclierActif, caAvecEquipement, creerMoteur, equipementDe, familleDe, groupeConseille, infoEquipement, MODULES_STANDARD, bilanPersonnage, personnageDepuisFiche, placer, rangerEquipement, type Partie, type Personnage } from '../src';
import { chargerMonde } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const moteur = creerMoteur({ dm: r.monde, srd }, MODULES_STANDARD);

const groupe = () =>
  groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
const depart = (): Partie => moteur.nouvellePartie(groupe(), { graine: 1, niveau: 3 });

/** Un héros avec un équipement donné (sans passer par le sac) : pour essayer `placer` à sec. */
function heros(emplacements: Record<string, string>, jeuActif: 1 | 2 = 1): Personnage {
  const h = depart().groupe[0]!;
  h.equipe = { emplacements, jeuActif } as never;
  return h;
}
const place = (h: Personnage, objet: string, s?: Parameters<typeof placer>[3]) => placer(moteur.ctx, h, objet, s);

describe('classement des objets du SRD par emplacement', () => {
  const NON_EQUIPABLES = new Set(['beaux-habits', 'costume', 'robe', 'tenue-de-voyage']);
  const equipables = [...srd.objets.values()].filter((o) => ['arme', 'armure', 'bouclier', 'anneau', 'vetement', 'bijou'].includes(o.categorie));

  it('chaque arme, armure, bouclier, anneau et bijou a une famille ; les vêtements aussi sauf les habits civils', () => {
    const sans = equipables.filter((o) => !familleDe(o)).map((o) => o.id);
    const civils = equipables.filter((o) => o.categorie === 'vetement' && !familleDe(o)).map((o) => o.id);
    expect(sans.filter((id) => !NON_EQUIPABLES.has(id)), 'objets sans emplacement').toEqual([]);
    expect(new Set(civils).size).toBe(civils.length);
    for (const id of NON_EQUIPABLES) expect(srd.objets.get(id) === undefined || !familleDe(srd.objets.get(id)!)).toBe(true);
  });

  it('les familles attendues pour quelques objets', () => {
    const f = (id: string) => infoEquipement(moteur.ctx, id)?.famille;
    expect(f('epee-longue')).toBe('main');
    expect(f('bouclier')).toBe('main');
    expect(f('cotte-de-mailles')).toBe('torse');
    expect(f('bottes-ailees')).toBe('pieds');
    expect(f('bandeau-d-intelligence')).toBe('tete');
  });

  it("chaque arme, armure et bouclier du SRD s'équipe", () => {
    for (const id of [...srd.armes.keys(), ...srd.armures.keys()]) expect(infoEquipement(moteur.ctx, id), id).toBeDefined();
  });
});

describe('les mains', () => {
  it('une arme à Deux mains prend les deux mains : le bouclier retourne au sac', () => {
    const h = heros({ 'j1.droite': 'epee-courte', 'j1.gauche': 'bouclier' });
    const res = place(h, 'epee-a-deux-mains', 'j1.droite');
    expect('refus' in res).toBe(false);
    if ('equipe' in res) {
      expect(res.equipe.emplacements['j1.droite']).toBe('epee-a-deux-mains');
      expect(res.equipe.emplacements['j1.gauche']).toBeUndefined();
      expect(res.remis.sort()).toEqual(['bouclier', 'epee-courte']);
    }
  });

  it('un bouclier ne se tient pas de la main droite, ni avec une arme à Deux mains', () => {
    const h = heros({ 'j1.droite': 'epee-a-deux-mains' });
    expect(place(h, 'bouclier', 'j1.droite')).toHaveProperty('refus');
    expect(place(h, 'bouclier', 'j1.gauche')).toHaveProperty('refus');
    const libre = heros({ 'j1.droite': 'epee-longue' });
    const res = place(libre, 'bouclier');
    expect('equipe' in res && res.emplacement).toBe('j1.gauche');
  });

  it('la main gauche tient une arme Légère seulement si la droite en tient une aussi', () => {
    const deux = heros({ 'j1.droite': 'dague' });
    expect('equipe' in place(deux, 'dague', 'j1.gauche')).toBe(true);
    expect(place(deux, 'epee-longue', 'j1.gauche')).toHaveProperty('refus');
    const lourde = heros({ 'j1.droite': 'epee-longue' });
    expect(place(lourde, 'dague', 'j1.gauche')).toHaveProperty('refus');
    expect(place(heros({}), 'dague', 'j1.gauche')).toHaveProperty('refus');
  });

  it('on ne porte pas deux boucliers : le second remplace le premier', () => {
    const h = heros({ 'j1.droite': 'epee-courte', 'j1.gauche': 'bouclier' });
    const res = place(h, 'bouclier', 'j1.gauche');
    expect('remis' in res && res.remis).toEqual(['bouclier']);
  });

  it('la CA ne compte que le bouclier du jeu en main', () => {
    const base = depart().groupe[0]!;
    const sans = heros({ 'j1.droite': 'epee-longue', 'j2.droite': 'arc-court' }, 1);
    const avec = heros({ 'j1.droite': 'epee-longue', 'j1.gauche': 'bouclier', 'j2.droite': 'arc-court' }, 1);
    expect(bouclierActif(moteur.ctx, equipementDe(avec))).toBe('bouclier');
    const j2 = { ...avec, equipe: { ...equipementDe(avec), jeuActif: 2 as const } } as Personnage;
    expect(bouclierActif(moteur.ctx, equipementDe(j2))).toBeUndefined();
    expect(caAvecEquipement(moteur.ctx, avec, equipementDe(avec))).toBeGreaterThanOrEqual(caAvecEquipement(moteur.ctx, sans, equipementDe(sans)));
    void base;
  });
});

describe('anciennes sauvegardes', () => {
  const annuaire = { proprietes: (id: string) => srd.armes.get(id)?.proprietes, objet: (id: string) => srd.objets.get(id) && { id, categorie: srd.objets.get(id)!.categorie } };

  it('six armes : deux jeux, le reste dans le surplus', () => {
    const { equipement, surplus } = rangerEquipement({ armes: ['epee-longue', 'arc-court', 'dague', 'hache', 'masse-d-armes', 'javeline'], portes: [] }, annuaire);
    expect(equipement.emplacements['j1.droite']).toBe('epee-longue');
    expect(equipement.emplacements['j2.droite']).toBe('arc-court');
    expect(surplus.sort()).toEqual(['dague', 'hache', 'javeline', 'masse-d-armes'].sort());
  });

  it('un bouclier avec une arme à Deux mains : le bouclier va au jeu où il y a de la place, sinon au surplus', () => {
    const { equipement, surplus } = rangerEquipement({ bouclier: 'bouclier', armes: ['epee-a-deux-mains'], portes: [] }, annuaire);
    expect(equipement.emplacements['j1.droite']).toBe('epee-a-deux-mains');
    expect(equipement.emplacements['j1.gauche']).toBeUndefined();
    expect([equipement.emplacements['j2.gauche'], ...surplus]).toContain('bouclier');
  });

  it('une partie ancienne se charge : les bonus et la CA suivent', () => {
    const p = depart();
    const json = JSON.stringify({ ...p, version: 2 });
    const rechargee = moteur.charger(json);
    expect(rechargee.version).toBeGreaterThanOrEqual(3);
    for (const h of rechargee.groupe) expect(h.fiche.ca).toBeGreaterThan(0);
  });
});
