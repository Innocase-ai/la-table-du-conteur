// Les correctifs rapides sur les objets (13/11/2026) et l'intégrité du catalogue SRD : ce que le conteur lit du sac, ce qui ne se
// vend ni ne se jette, et les ids ou bases du catalogue qui doivent exister.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, ficheDeTour, groupeConseille, infoEquipement, MODULES_STANDARD, personnageDepuisFiche, type Partie } from '../src';
import { chargerMonde } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { familleDe, tirerDepouilles } from '../src/monde/depouilles';
import { rachats } from '../src/modules/commerce';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const moteur = creerMoteur({ dm: r.monde, srd }, MODULES_STANDARD);

const depart = (): Partie => {
  const groupe = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  return moteur.executer(moteur.nouvellePartie(groupe, { graine: 3, niveau: 3 }), { type: 'commencer' }).partie;
};

describe('le conteur lit le sac avec les vrais noms', () => {
  it('un objet du catalogue SRD a son nom, pas son identifiant ; un objet magique le dit', () => {
    const p = depart();
    p.etat.inventaire = { 'potion-de-guerison': 2, 'anneau-de-protection': 1, 'epee-longue': 1 };
    const sac = ficheDeTour(moteur, p)
      .split('\n')
      .find((l) => l.startsWith('Sac :'))!;
    expect(sac).toContain('Potion de guérison');
    expect(sac).toContain('×2');
    expect(sac).toContain('Épée longue');
    expect(sac).toMatch(/Anneau de protection \(magique, rare, \+1 CA, harmonisation\)/);
    expect(sac).not.toContain('potion-de-guerison');
    expect(sac).not.toContain('epee-longue');
  });

  it('un objet encore à identifier ne révèle pas ses pouvoirs', () => {
    const cache = [...r.monde.objets.values()].find((o) => o.identification && o.magique);
    expect(cache, 'le monde d’essai doit avoir un objet magique à identifier').toBeDefined();
    const p = depart();
    p.etat.inventaire = { [cache!.id]: 1 };
    const sac = ficheDeTour(moteur, p)
      .split('\n')
      .find((l) => l.startsWith('Sac :'))!;
    expect(sac).toContain(cache!.nom);
    expect(sac).not.toContain('magique');
  });
});

describe('ce qui est indispensable ne se vend ni ne se jette', () => {
  const marchand = { boutique: { rachat: 0.5, types: [], stock: [], tables: [] } } as unknown as Parameters<typeof rachats>[2];
  const cle = [...r.monde.objets.values()].find((o) => o.categorie === 'cle' && o.valeurPo > 0);

  it('une clé qui a une valeur n’est pas rachetée par le marchand', () => {
    expect(cle, 'le monde d’essai doit avoir une clé de valeur > 0').toBeDefined();
    const p = depart();
    p.etat.inventaire = { [cle!.id]: 1, corde: 1 };
    const vendables = rachats(moteur.ctx, p, marchand).map((x) => x.objet);
    expect(vendables).toContain('corde');
    expect(vendables).not.toContain(cle!.id);
  });

  it('le sac ne propose pas « Jeter » sur une clé, et le propose sur une corde', () => {
    const p = depart();
    p.etat.inventaire = { [cle!.id]: 1, corde: 1 };
    const jeter = moteur.propositions(p).filter((x) => x.ordre?.type === 'jeterObjet');
    const objets = jeter.map((x) => (x.ordre as unknown as { objet: string }).objet);
    expect(objets).toContain('corde');
    expect(objets).not.toContain(cle!.id);
  });
});

describe('intégrité du catalogue SRD des objets', () => {
  it('les dépouilles automatiques ne citent que des objets du catalogue', () => {
    const profils = [...srd.monstres.values()];
    const ids = new Set<string>();
    // Un tirage où tout réussit (le générateur rend toujours 0) : tous les objets possibles de chaque famille sortent.
    for (const famille of ['porteur', 'geant', 'mort-vivant', 'bete', 'artificiel'] as const) {
      const profil = profils.find((m) => familleDe(m.type) === famille);
      if (!profil) continue;
      for (const id of Object.keys(tirerDepouilles(srd, [{ profil: profil.id, nombre: 1 }], () => 0).objets)) ids.add(id);
    }
    expect(ids.size).toBeGreaterThan(5);
    for (const id of ids) expect(srd.objets.has(id), `objet de dépouille « ${id} » absent du catalogue`).toBe(true);
  });

  it('chaque `base` d’un objet est une arme ou une armure du SRD', () => {
    for (const o of srd.objets.values()) if (o.base) expect(srd.armes.has(o.base) || srd.armures.has(o.base), `${o.id} → ${o.base}`).toBe(true);
  });

  // DETTE CONNUE (état des lieux du 13/11/2026) : ces armes et armures magiques n'ont pas de `base` : les armes ne s'équipent pas du
  // tout, les armures s'équipent comme des parures (seul leur bonus de CA compte). La liste ne doit pas grandir ; quand on en répare,
  // on les retire d'ici.
  const ARMES_SANS_BASE = [
    'arc-a-energie', 'arc-du-serment', 'arme-ardente', 'arme-brutale', 'arme-magique-plus-1', 'arme-magique-plus-2', 'arme-magique-plus-3', 'arme-vigilante',
    'epee-aceree', 'epee-dansante', 'epee-mordante', 'epee-voleuse-de-vie', 'epee-vorpale', 'fer-gele', 'gardienne', 'hache-du-berserker', 'lame-porte-bonheur',
    'marteau-de-tonnerre', 'projectile-plus-1', 'projectile-plus-2', 'projectile-plus-3', 'projectile-tueur', 'tueuse-de-dragons', 'tueuse-de-geants',
    'vengeresse-sacree', 'voleuse-de-vie',
  ];
  const ARMURES_SANS_BASE = [
    'armure-de-mithral', 'armure-de-resistance', 'armure-de-vulnerabilite', 'armure-demoniaque', 'armure-en-adamantium', 'armure-magique-plus-1',
    'armure-magique-plus-2', 'armure-magique-plus-3', 'harnois-ethere', 'harnois-nain',
  ];

  it('les armes magiques sans base sont exactement celles de la dette connue (et ne s’équipent pas)', () => {
    const sans = [...srd.objets.values()].filter((o) => o.categorie === 'arme' && !(o.base && srd.armes.has(o.base))).map((o) => o.id);
    expect(sans.sort()).toEqual([...ARMES_SANS_BASE].sort());
    for (const id of sans) expect(infoEquipement(moteur.ctx, id), id).toBeUndefined();
  });

  it('les armures magiques sans base sont exactement celles de la dette connue', () => {
    const sans = [...srd.objets.values()].filter((o) => o.categorie === 'armure' && !(o.base && srd.armures.has(o.base))).map((o) => o.id);
    expect(sans.sort()).toEqual([...ARMURES_SANS_BASE].sort());
  });
});
