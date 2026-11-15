// Transparence des jets d'exploration : les boutons Fouiller, Crocheter, Forcer et Désamorcer annoncent le héros qui agit par défaut
// et son bonus, et listent les autres héros qui pourraient le faire à sa place.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { acteursPossibles, bonusTest, creerMoteur, herosPreTires, MODULES_STANDARD, personnageDepuisFiche, type Partie, type Personnage, type Proposition } from '../src';
import { chargerMonde } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const moteur = creerMoteur({ dm: r.monde, srd }, MODULES_STANDARD);

const COFFRET = 'vei-t-plancher-du-bailli';
const PIEGE = 'vei-p-aiguille-du-coffret';

function groupe(outilsChez = 'Pip'): Personnage[] {
  return herosPreTires(srd).map((h) => personnageDepuisFiche(h.fiche, { id: h.fiche.nom.toLowerCase(), outils: h.fiche.nom === outilsChez ? ['outils-de-voleur'] : [] }));
}

/** Le cellier du bailli, coffret et piège repérés : de quoi montrer Fouiller, Crocheter, Forcer et Désamorcer. */
function cellier(g = groupe()): Partie {
  const p = moteur.executer(moteur.nouvellePartie(g, { graine: 5, niveau: 3 }), { type: 'commencer' }).partie;
  p.etat.lieu = 'vei-cellier-du-bailli';
  p.etat.exploration.decouverts.push(`tresor:${COFFRET}`, `piege:${PIEGE}`);
  return p;
}

const bouton = (p: Partie, libelle: string): Proposition => {
  const x = moteur.propositions(p).find((q) => q.libelle === libelle);
  if (!x) throw new Error(`Pas de bouton « ${libelle} »`);
  return x;
};

describe('acteursPossibles', () => {
  it('liste les héros debout, le meilleur d’abord, et désigne celui que le moteur choisirait', () => {
    const p = cellier();
    p.groupe[0]!.pv = 0; // un héros à terre n'agit pas
    const { defaut, liste } = acteursPossibles(p, 'athletisme');
    expect(liste.map((a) => a.id)).not.toContain(p.groupe[0]!.id);
    expect(liste.map((a) => a.bonus)).toEqual([...liste.map((a) => a.bonus)].sort((a, b) => b - a));
    expect(defaut?.id).toBe(liste[0]!.id);
    expect(defaut?.bonus).toBe(bonusTest(p.groupe.find((a) => a.id === defaut!.id)!, 'athletisme'));
  });

  it('un héros sans l’équipement requis figure désactivé et ne passe jamais par défaut', () => {
    const p = cellier();
    const requis = { qualifie: (a: Personnage) => a.id === 'pip', raison: 'Sans outils.' };
    const { defaut, liste } = acteursPossibles(p, 'escamotage', requis);
    expect(defaut?.id).toBe('pip');
    expect(liste.filter((a) => a.desactivee).map((a) => a.id)).not.toContain('pip');
    expect(liste.filter((a) => a.desactivee).length).toBe(liste.length - 1);
  });
});

describe('boutons d’exploration chiffrés', () => {
  it('Crocheter annonce Pip (seul à avoir des outils) et son bonus d’Escamotage, même si un autre a un meilleur bonus', () => {
    const p = cellier();
    const b = bouton(p, 'Crocheter');
    expect(b.jet).toEqual({ test: 'escamotage', qui: 'Pip', bonus: bonusTest(p.groupe.find((a) => a.id === 'pip')!, 'escamotage') });
    expect(b.acteurs?.find((a) => a.id === 'pip')?.desactivee).toBeUndefined();
    expect(b.acteurs?.filter((a) => a.id !== 'pip').every((a) => !!a.desactivee)).toBe(true);
    expect(b.desactivee).toBeUndefined();
  });

  it('avec des outils dans le sac, tout le monde peut crocheter : le meilleur en Escamotage passe par défaut', () => {
    const p = cellier(groupe('personne'));
    p.etat.inventaire['outils-de-voleur'] = 1;
    const b = bouton(p, 'Crocheter');
    expect(b.acteurs?.every((a) => !a.desactivee)).toBe(true);
    expect(b.jet?.qui).toBe(b.acteurs![0]!.nom);
  });

  it('sans outils nulle part, Crocheter reste désactivé', () => {
    const b = bouton(cellier(groupe('personne')), 'Crocheter');
    expect(b.desactivee).toMatch(/outils de voleur/);
  });

  it('Forcer, Désamorcer et Fouiller annoncent un héros et un bonus ; la fouille ne dit pas son DD', () => {
    const p = cellier();
    const forcer = bouton(p, 'Forcer');
    expect(forcer.jet?.test).toBe('athletisme');
    expect(forcer.jet?.bonus).toBe(forcer.acteurs![0]!.bonus);
    const desamorcer = bouton(p, 'Désamorcer');
    expect(desamorcer.jet?.qui).toBeTruthy();
    expect(desamorcer.jet?.dd).toBeUndefined();
    const fouiller = bouton(p, 'Fouiller');
    expect(fouiller.jet).toMatchObject({ test: 'investigation' });
    expect(fouiller.jet?.dd).toBeUndefined();
  });

  it('un héros choisi dans la liste agit à la place du héros par défaut (l’ordre repart avec son id)', () => {
    const p = cellier();
    const forcer = bouton(p, 'Forcer');
    const autre = forcer.acteurs!.find((a) => a.nom !== forcer.jet!.qui)!;
    const res = moteur.executer(p, { ...forcer.ordre!, personnage: autre.id });
    expect(res.refus).toBeUndefined();
    const jet = res.evenements.find((e) => e.type === 'jet');
    expect(jet && jet.type === 'jet' && jet.jet.qui).toBe(autre.id);
    expect(jet && jet.type === 'jet' && jet.jet.bonus).toBe(autre.bonus);
  });

  it('le héros annoncé par défaut est bien celui qui lance le dé', () => {
    const p = cellier();
    const forcer = bouton(p, 'Forcer');
    const res = moteur.executer(p, forcer.ordre!);
    const jet = res.evenements.find((e) => e.type === 'jet');
    expect(jet && jet.type === 'jet' && jet.jet.nom).toBe(forcer.jet!.qui);
    expect(jet && jet.type === 'jet' && jet.jet.bonus).toBe(forcer.jet!.bonus);
  });

  it('un héros à terre n’est ni annoncé ni proposé', () => {
    const p = cellier();
    const avant = bouton(p, 'Forcer').jet!.qui;
    p.groupe.find((a) => a.nom === avant)!.pv = 0;
    const b = bouton(p, 'Forcer');
    expect(b.jet?.qui).not.toBe(avant);
    expect(b.acteurs?.map((a) => a.nom)).not.toContain(avant);
  });
});
