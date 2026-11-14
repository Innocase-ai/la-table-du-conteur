// Les vivres : une ressource qui descend (levier 2 de l'audit de rythme, 14/11/2026). Règle facultative d'un monde (`monde.vivres`) :
// chaque nouveau jour, chaque héros vivant mange une ration du sac, sauf à table ; sans ration, la faim blesse (jamais sous 1 PV).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, etatInitial, ficheDeScene, groupeConseille, MODULES_STANDARD, nouvellePartie, personnageDepuisFiche, type DonneesMonde, type Personnage } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { Monde } from '../src/monde/schemas';
import { jouerEffets, type PartieMonde } from '../src/monde/exploration';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();

function charger(id: string): DonneesMonde {
  const r = chargerMonde(join(RACINE_MONDES, id));
  if (!r.ok) throw new Error('monde illisible');
  return r.monde;
}

function groupe(n = 4): Personnage[] {
  return groupeConseille(3, srd)
    .emplacements.slice(0, n)
    .map((p) => {
      const f = bilanPersonnage(p!, srd).fiche!;
      return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
    });
}

/** Une partie de la Marche en pleine nature (le vieux pont), avec `rations` rations dans le sac. */
function dehors(rations: number, n = 4, dm = charger('marche-d-ombrefiel')): PartieMonde {
  const p = nouvellePartie(dm, etatInitial(dm), groupe(n), () => 0);
  p.etat.lieu = 'ald-vieux-pont';
  if (rations > 0) p.etat.inventaire['rations'] = rations;
  return p;
}

describe('vivres : le départ', () => {
  it('le groupe commence avec des rations pour 3 jours (par héros)', () => {
    const dm = charger('marche-d-ombrefiel');
    const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
    const p = moteur.executer(moteur.nouvellePartie(groupe(4), { graine: 3, niveau: 1 }), { type: 'commencer' }).partie;
    expect(p.etat.inventaire['rations']).toBe(12);
    const sc = moteur.vue<ReturnType<typeof ficheDeScene>>('scene', p);
    expect(sc.vivres).toMatchObject({ rations: 12, jours: 3, nom: 'Rations' });
  });

  it('un groupe de six héros a six rations par jour', () => {
    const dm = charger('marche-d-ombrefiel');
    const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
    const p = moteur.executer(moteur.nouvellePartie(groupe(6), { graine: 3, niveau: 1 }), { type: 'commencer' }).partie;
    expect(p.etat.inventaire['rations']).toBe(18);
  });
});

describe('vivres : manger et avoir faim', () => {
  it('chaque nouveau jour, chaque héros mange une ration', () => {
    const p = dehors(10);
    const r = jouerEffets(p, [], [{ temps: 24 }]);
    expect(p.etat.inventaire['rations']).toBe(6);
    expect(r.constats.some((c) => c.includes('Le groupe mange : 4 rations'))).toBe(true);
    expect(p.groupe.every((h) => h.pv === h.fiche.pvMax)).toBe(true);
  });

  it('une ration épuisée disparaît du sac', () => {
    const p = dehors(4);
    jouerEffets(p, [], [{ temps: 24 }]);
    expect(p.etat.inventaire['rations']).toBeUndefined();
  });

  it('sans vivres, tout le groupe a faim et perd des PV, jamais jusqu’à la mort', () => {
    const p = dehors(0);
    const avant = p.groupe.map((h) => h.pv);
    const r = jouerEffets(p, [], [{ temps: 24 }]);
    p.groupe.forEach((h, i) => expect(h.pv).toBeLessThan(avant[i]!));
    expect(r.constats.filter((c) => c.includes('a faim, sans rien à manger : −')).length).toBe(4);
  });

  it('des jours de jeûne ne tuent personne : les PV s’arrêtent à 1', () => {
    const dm = charger('marche-d-ombrefiel');
    dm.monde.vivres!.faim = '1d4+99';
    const p = dehors(0, 4, dm);
    jouerEffets(p, [], [{ temps: 24 }]);
    for (const h of p.groupe) expect(h.pv).toBe(1);
    const r = jouerEffets(p, [], [{ temps: 24 }]);
    for (const h of p.groupe) expect(h.pv).toBe(1);
    expect(r.constats.every((c) => !c.includes('−') || !c.includes('a faim') || c.includes('tient bon') || c.includes('−0'))).toBe(true);
    expect(r.constats.filter((c) => c.includes('tient bon')).length).toBe(4);
  });

  it('quand il manque des rations, les derniers du groupe restent sur leur faim', () => {
    const p = dehors(2);
    const avant = p.groupe.map((h) => h.pv);
    const r = jouerEffets(p, [], [{ temps: 24 }]);
    expect(p.etat.inventaire['rations']).toBeUndefined();
    expect(p.groupe[0]!.pv).toBe(avant[0]);
    expect(p.groupe[1]!.pv).toBe(avant[1]);
    expect(p.groupe[2]!.pv).toBeLessThan(avant[2]!);
    expect(p.groupe[3]!.pv).toBeLessThan(avant[3]!);
    expect(r.constats.some((c) => c.includes('seuls 2 héros mangent'))).toBe(true);
  });

  it('un héros à terre ne mange pas', () => {
    const p = dehors(10);
    p.groupe[0]!.pv = 0;
    jouerEffets(p, [], [{ temps: 24 }]);
    expect(p.etat.inventaire['rations']).toBe(7);
  });

  it('on mange à table à l’auberge, y compris dans une chambre de l’étage : aucune ration consommée', () => {
    for (const lieu of ['ald-auberge-de-bregor', 'ald-auberge-etage-et-combles', 'ald-auberge-salle-commune']) {
      const p = dehors(0);
      p.etat.lieu = lieu;
      const avant = p.groupe.map((h) => h.pv);
      jouerEffets(p, [], [{ temps: 24 }]);
      expect(p.groupe.map((h) => h.pv), lieu).toEqual(avant);
    }
    const p = dehors(5);
    p.etat.lieu = 'ald-auberge-etage-et-combles';
    jouerEffets(p, [], [{ temps: 24 }]);
    expect(p.etat.inventaire['rations']).toBe(5);
  });

  it('une histoire sans règle de vivres n’est pas touchée', () => {
    const dm = charger('marche-d-ombrefiel');
    delete dm.monde.vivres;
    const p = dehors(0, 4, dm);
    const avant = p.groupe.map((h) => h.pv);
    jouerEffets(p, [], [{ temps: 72 }]);
    expect(p.groupe.map((h) => h.pv)).toEqual(avant);
    expect(ficheDeScene(p).vivres).toBeUndefined();
  });

  it('la fiche de scène dit pour combien de jours il reste à manger', () => {
    const p = dehors(10);
    expect(ficheDeScene(p).vivres).toMatchObject({ rations: 10, jours: 2 });
    p.etat.inventaire['rations'] = 3;
    expect(ficheDeScene(p).vivres?.jours).toBe(0);
  });
});

describe('vivres : le format', () => {
  const base = () => ({ ...charger('marche-d-ombrefiel').monde });
  it('accepte une règle complète ou réduite à ses défauts', () => {
    expect(Monde.safeParse({ ...base(), vivres: { objet: 'rations', depart: 3, faim: '1d4' } }).success).toBe(true);
    const r = Monde.parse({ ...base(), vivres: {} });
    expect(r.vivres).toEqual({ objet: 'rations', depart: 0, faim: '1d4' });
  });
  it('refuse des dés mal écrits ou un départ absurde', () => {
    expect(Monde.safeParse({ ...base(), vivres: { faim: 'beaucoup' } }).success).toBe(false);
    expect(Monde.safeParse({ ...base(), vivres: { depart: 99 } }).success).toBe(false);
  });
  it('la Marche vend des rations et des potions : l’or a un usage', () => {
    const dm = charger('marche-d-ombrefiel');
    expect(dm.pnj.get('bregor-le-borgne')!.boutique?.modele).toBe('magasin-general');
    expect(dm.pnj.get('mireille-de-la-rose')!.boutique?.modele).toBe('apothicaire');
  });
});
