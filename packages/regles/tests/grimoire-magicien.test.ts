// Le grimoire du Magicien (SRD 5.2.1) : six sorts du 1er niveau au départ, deux de plus par niveau gagné ; les sorts préparés se
// choisissent dans ce livre. Une ancienne partie sans grimoire reçoit le sien sans rien perdre.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  calculerFiche,
  choixDeMontee,
  creationRapide,
  creerGenerateur,
  creerMoteur,
  exigences,
  manquants,
  MODULES_STANDARD,
  monterAuNiveau,
  personnageDepuisFiche,
  recuperer,
  reviserChoixDeMontee,
  sortsEligibles,
  tailleGrimoire,
  type ChoixPersonnage,
  type Partie,
  type Personnage,
} from '../src';
import { chargerDonneesSrd } from '../src/donnees-node';
import { chargerMonde } from '../src/monde/chargeur';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(MONDES_ESSAI, 'citadelle-des-marees'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde;
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);

const magicien = (niveau = 1, nom = 'Mage'): ChoixPersonnage => creationRapide({ classe: 'magicien', espece: 'humain', niveau, nom }, srd);
const heros = (choix: ChoixPersonnage): Personnage => {
  const f = calculerFiche(choix, srd);
  if (!f.ok) throw new Error(f.erreurs.join('\n'));
  return personnageDepuisFiche(f.fiche, { id: choix.nom.toLowerCase(), choix });
};
const partieAvec = (h: Personnage): Partie => {
  const p = moteur.executer(moteur.nouvellePartie([h], { graine: 1, niveau: h.fiche.niveau }), { type: 'commencer' }).partie;
  return { ...p, scene: { type: 'exploration' } };
};
/** Des sorts du Magicien du 1er niveau qui ne sont pas dans la liste donnée. */
const autres = (hors: string[], n: number) => sortsEligibles('magicien', 1, srd).filter((s) => s.niveau === 1 && !hors.includes(s.id)).slice(0, n).map((s) => s.id);

describe('la taille du grimoire et les choix', () => {
  it('six sorts au niveau 1, deux de plus par niveau ; seul le Magicien en a un', () => {
    expect([1, 2, 5, 20].map((n) => tailleGrimoire('magicien', n))).toEqual([6, 8, 14, 44]);
    expect(tailleGrimoire('clerc', 5)).toBeUndefined();
  });

  it('la création rapide inscrit le grimoire complet, et les préparés en viennent', () => {
    for (const niveau of [1, 3, 5, 9, 20]) {
      const c = magicien(niveau);
      const f = calculerFiche(c, srd);
      expect(f.ok, `niveau ${niveau}`).toBe(true);
      if (!f.ok) continue;
      expect(c.sortsGrimoire).toHaveLength(tailleGrimoire('magicien', niveau)!);
      expect(f.fiche.grimoire).toEqual(c.sortsGrimoire);
      expect(f.fiche.sortsPrepares.every((id) => c.sortsGrimoire!.includes(id))).toBe(true);
      expect(f.fiche.sortsPrepares).toHaveLength(f.fiche.incantation!.sortsPrepares);
    }
  });

  it('les autres classes n’ont pas de grimoire', () => {
    const c = creationRapide({ classe: 'clerc', espece: 'humain', niveau: 3, nom: 'C' }, srd);
    expect(c.sortsGrimoire).toBeUndefined();
    const f = calculerFiche(c, srd);
    expect(f.ok && f.fiche.grimoire).toBeFalsy();
    expect(exigences({ ...c, niveau: 3 }, srd)!.sorts!.grimoire).toBeUndefined();
    const refus = calculerFiche({ ...c, sortsGrimoire: autres([], 1) }, srd);
    expect(refus.ok).toBe(false);
  });

  it('le créateur réclame le grimoire (6 sorts) avant les préparés', () => {
    const c = magicien(1);
    expect(exigences({ ...c, niveau: 1 }, srd)!.sorts!.grimoire).toBe(6);
    expect(manquants(c, srd)).toEqual([]);
    const sans = { ...c, sortsGrimoire: c.sortsGrimoire!.slice(0, 4) };
    expect(manquants(sans, srd).map((m) => m.message).join(' ')).toMatch(/2 sort\(s\) à inscrire dans le grimoire/);
  });

  it('refus : un préparé hors du grimoire, un sort mineur au grimoire, un doublon, trop de sorts', () => {
    const c = magicien(1);
    const hors = autres(c.sortsGrimoire!, 1)[0]!;
    const f1 = calculerFiche({ ...c, sortsPrepares: [hors, ...c.sortsPrepares!.slice(1)] }, srd);
    expect(f1.ok).toBe(false);
    if (!f1.ok) expect(f1.erreurs.join(' ')).toMatch(/n'est pas dans le grimoire/);
    const mineur = sortsEligibles('magicien', 0, srd).find((s) => s.niveau === 0)!.id;
    expect(calculerFiche({ ...c, sortsGrimoire: [mineur, ...c.sortsGrimoire!.slice(1)] }, srd).ok).toBe(false);
    expect(calculerFiche({ ...c, sortsGrimoire: [c.sortsGrimoire![0]!, ...c.sortsGrimoire!] }, srd).ok).toBe(false);
    expect(calculerFiche({ ...c, sortsGrimoire: [...c.sortsGrimoire!, hors] }, srd).ok).toBe(false);
  });

  it('un choix sans grimoire (ancienne partie) reste valide : son grimoire est sa liste préparée', () => {
    const c = { ...magicien(3), sortsGrimoire: undefined };
    const f = calculerFiche(c, srd);
    expect(f.ok && f.fiche.grimoire).toEqual(c.sortsPrepares);
  });
});

describe('la montée de niveau', () => {
  it('deux sorts de plus au grimoire à chaque niveau ; les anciens et les préparés restent', () => {
    let c = magicien(1);
    for (let niveau = 2; niveau <= 20; niveau++) {
      const m = monterAuNiveau(c, niveau, srd);
      expect(m, `niveau ${niveau}`).toBeDefined();
      expect(m!.choix.sortsGrimoire).toHaveLength(tailleGrimoire('magicien', niveau)!);
      expect(m!.choix.sortsGrimoire!.slice(0, c.sortsGrimoire!.length)).toEqual(c.sortsGrimoire);
      expect(m!.choix.sortsPrepares!.slice(0, c.sortsPrepares!.length)).toEqual(c.sortsPrepares);
      expect(m!.fiche.sortsPrepares.every((id) => m!.fiche.grimoire!.includes(id))).toBe(true);
      c = m!.choix;
    }
  });

  it('une ancienne partie sans grimoire reçoit celui du niveau, ses sorts préparés d’abord', () => {
    const ancien = { ...magicien(2), sortsGrimoire: undefined };
    const m = monterAuNiveau(ancien, 3, srd)!;
    expect(m.choix.sortsGrimoire).toHaveLength(10);
    expect(m.choix.sortsGrimoire!.slice(0, ancien.sortsPrepares!.length)).toEqual(ancien.sortsPrepares);
  });

  it('ce qui est nouveau : deux sorts au grimoire ; réviser change ces deux-là, jamais les anciens, et un préparé reste dans le livre', () => {
    const c = monterAuNiveau(magicien(1), 2, srd)!.choix;
    const n = choixDeMontee(c, srd)!;
    expect(n.sortsGrimoire).toEqual({ total: 8, figes: 6 });
    expect(n.aucun).toBe(false);
    const neufs = autres(c.sortsGrimoire!, 2);
    const nouveauLivre = [...c.sortsGrimoire!.slice(0, 6), ...neufs];
    const ok = reviserChoixDeMontee(c, { ...c, sortsGrimoire: nouveauLivre }, srd);
    expect(ok.ok).toBe(true);
    // Un sort ancien du grimoire ne se change pas.
    const touche = reviserChoixDeMontee(c, { ...c, sortsGrimoire: [neufs[0]!, ...c.sortsGrimoire!.slice(1, 6), ...neufs.slice(0, 1), ...neufs.slice(1)] }, srd);
    expect(touche.ok).toBe(false);
    // Un préparé nouveau qui sort du grimoire est refusé.
    const prepare = c.sortsPrepares![c.sortsPrepares!.length - 1]!;
    const sorti = reviserChoixDeMontee(c, { ...c, sortsGrimoire: [...c.sortsGrimoire!.filter((id) => id !== prepare), neufs[0]!] }, srd);
    expect(sorti.ok).toBe(false);
  });

  it('les autres classes : rien de nouveau côté grimoire', () => {
    const c = monterAuNiveau(creationRapide({ classe: 'clerc', espece: 'humain', niveau: 1, nom: 'C' }, srd), 2, srd)!.choix;
    expect(choixDeMontee(c, srd)!.sortsGrimoire).toBeUndefined();
  });
});

describe('en jeu', () => {
  it('un héros sans grimoire (groupe créé avant) en reçoit un au début de l’histoire, sans perdre ses sorts', () => {
    const ancien = { ...magicien(1, 'Vieux'), sortsGrimoire: undefined };
    const h = heros(ancien);
    expect(h.fiche.grimoire).toEqual(ancien.sortsPrepares);
    const p = partieAvec(h);
    const apres = p.groupe[0]!;
    expect(apres.choix!.sortsGrimoire).toHaveLength(6);
    expect(apres.fiche.grimoire).toEqual(apres.choix!.sortsGrimoire);
    expect(apres.choix!.sortsGrimoire!.slice(0, 4)).toEqual(ancien.sortsPrepares);
    expect(apres.fiche.sortsPrepares).toEqual(ancien.sortsPrepares);
  });

  it('une sauvegarde sans grimoire est complétée au chargement', () => {
    const p = partieAvec(heros(magicien(1, 'Mage')));
    const ancienne = JSON.parse(JSON.stringify(p)) as Partie;
    delete ancienne.groupe[0]!.choix!.sortsGrimoire;
    delete ancienne.groupe[0]!.fiche.grimoire;
    const rechargee = moteur.charger(JSON.stringify(ancienne));
    expect(rechargee.groupe[0]!.choix!.sortsGrimoire).toHaveLength(6);
    expect(rechargee.groupe[0]!.fiche.grimoire).toHaveLength(6);
  });

  it('après un Repos long, le Magicien prépare dans son grimoire, pas ailleurs', () => {
    const h = heros(magicien(3));
    recuperer(h, 'long', creerGenerateur(1));
    expect(h.preparation).toEqual({ prepares: 'tous', mineurs: 0 });
    const p = partieAvec(h);
    const livre = h.choix!.sortsGrimoire!;
    const prepares = h.choix!.sortsPrepares!;
    const nonPrepare = livre.find((id) => !prepares.includes(id))!;
    // Un sort du grimoire pas encore préparé : accepté.
    const ok = moteur.executer(p, { type: 'changerSortsPrepares', personnage: h.id, prepares: [nonPrepare, ...prepares.slice(1)] });
    expect(ok.refus).toBeUndefined();
    expect(ok.partie.groupe[0]!.fiche.sortsPrepares).toContain(nonPrepare);
    expect(ok.partie.groupe[0]!.fiche.grimoire).toEqual(livre);
    // Un sort du Magicien qui n'est pas dans son grimoire : refusé.
    const hors = autres(livre, 1)[0]!;
    const refus = moteur.executer(p, { type: 'changerSortsPrepares', personnage: h.id, prepares: [hors, ...prepares.slice(1)] });
    expect(refus.refus).toMatch(/n'est pas dans le grimoire/);
  });

  it('l’onglet Grimoire montre les sorts du livre non préparés, marqués « grimoire »', () => {
    const h = heros(magicien(1));
    const p = partieAvec(h);
    const lignes = moteur.encarts(p).find((e) => e.id === `grimoire:${h.id}`)!.lignes!;
    const duLivre = lignes.filter((l) => l.valeur?.includes('grimoire'));
    expect(duLivre).toHaveLength(2); // 6 dans le grimoire, 4 préparés
    expect(duLivre.every((l) => l.ton === 'faible')).toBe(true);
    const ids = duLivre.map((l) => l.sort);
    expect(ids.every((id) => !h.fiche.sortsPrepares.includes(id!))).toBe(true);
    // Un sort non préparé ne se lance pas : pas de ligne de soin, et la liste des sorts connus ne le compte pas.
    expect(lignes.find((l) => l.libelle === 'Sorts préparés')!.valeur).toBe('4 / 4');
  });
});
