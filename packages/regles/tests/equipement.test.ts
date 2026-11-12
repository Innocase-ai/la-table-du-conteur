import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  bilanPersonnage,
  bouclierActif,
  caAvec,
  calculerFiche,
  commande,
  creerMoteur,
  EMPLACEMENTS,
  equipementDe,
  estDeuxMains,
  groupeConseille,
  heroCombatDe,
  MODULES_STANDARD,
  objetsPortes,
  personnageDepuisFiche,
  heroDepuisFiche,
  type ElementGrille,
  type Module,
  type Partie,
  type Personnage,
} from '../src';
import { chargerMonde } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde;

/** Un module de test qui met des objets dans le sac. */
const don: Module = {
  id: 'don',
  commandes: {
    donner: commande({
      description: 'Met un objet dans le sac (test).',
      entree: z.object({ objet: z.string(), quantite: z.number().default(1) }),
      executer: (t, e) => {
        t.partie.etat.inventaire[e.objet] = (t.partie.etat.inventaire[e.objet] ?? 0) + e.quantite;
      },
    }),
  },
};
const moteur = creerMoteur({ dm, srd }, [...MODULES_STANDARD, don]);

const creations = groupeConseille(3, srd).emplacements;
const groupe = () =>
  creations.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
const depart = (): Partie => moteur.executer(moteur.nouvellePartie(groupe(), { graine: 3, niveau: 3 }), { type: 'commencer' }).partie;
const donner = (p: Partie, objet: string, quantite = 1) => moteur.executer(p, { type: 'donner', objet, quantite }).partie;
const heros = (p: Partie, id: string) => p.groupe.find((a) => a.id === id) as Personnage;
const grille = (p: Partie) => moteur.encarts(p).find((e) => e.id === 'sac-objets')!.grille!;
const element = (p: Partie, id: string) => grille(p).elements.find((e) => e.id === id) as ElementGrille;
const porte = (p: Partie, id: string) => equipementDe(heros(p, id)).emplacements;

describe('fiche : la CA se recalcule à partir de sa défense', () => {
  const armures = [undefined, ...[...srd.armures.values()].filter((a) => a.categorie !== 'bouclier')];
  it.each(creations.map((c) => [c!.choix.nom, c!] as const))('%s : caAvec redonne la CA de calculerFiche pour chaque armure et bouclier', (_nom, c) => {
    const fiche = bilanPersonnage(c, srd).fiche!;
    expect(fiche.defense).toBeDefined();
    for (const armure of armures) {
      for (const bouclier of [false, true]) {
        const attendu = calculerFiche({ ...c.choix, armure: armure?.id ?? '', bouclier }, srd);
        if (!attendu.ok) continue;
        const formeBouclier = bouclier && fiche.formationArmures.includes('bouclier');
        expect(caAvec(fiche.defense!, armure, formeBouclier), `${armure?.id ?? 'sans armure'}${bouclier ? ' + bouclier' : ''}`).toBe(attendu.fiche.ca);
      }
    }
  });
});

describe('module Équipement', () => {
  it('l’équipement de départ est rangé dans les emplacements ; équiper une armure du sac recalcule la CA et rend l’ancienne', () => {
    let p = depart();
    const pip = heros(p, 'pip');
    const avant = pip.fiche.ca;
    expect(porte(p, 'pip')['j1.droite']).toBeDefined();
    p = donner(p, 'cotte-de-mailles');
    const res = moteur.executer(p, { type: 'equiper', objet: 'cotte-de-mailles', personnage: 'pip' });
    expect(res.refus).toBeUndefined();
    p = res.partie;
    expect(heros(p, 'pip').fiche.ca).toBeGreaterThan(avant);
    expect(heros(p, 'pip').fiche.equipement?.armure).toBe('cotte-de-mailles');
    expect(porte(p, 'pip').torse).toBe('cotte-de-mailles');
    expect(p.etat.inventaire['cotte-de-mailles']).toBeUndefined();
    // L'armure de cuir de départ revient dans le sac.
    const ancienne = equipementDe(heros(depart(), 'pip')).emplacements.torse!;
    expect(p.etat.inventaire[ancienne]).toBe(1);
    expect(res.evenements).toContainEqual({ type: 'equipementChange', personnage: 'pip', objet: 'cotte-de-mailles', ancien: ancienne });
    // Et la fiche d'origine n'a pas été touchée.
    expect(pip.fiche.ca).toBe(avant);
  });

  it('retirer rend l’objet au sac et recalcule la CA ; le bouclier ajoute son bonus', () => {
    let p = depart();
    const bran = heros(p, 'bran');
    const avant = bran.fiche.ca;
    const bouclier = bouclierActif(moteur.ctx, equipementDe(bran));
    if (bouclier) {
      p = moteur.executer(p, { type: 'retirerEquipement', objet: bouclier, personnage: 'bran' }).partie;
      expect(heros(p, 'bran').fiche.ca).toBe(avant - 2);
      expect(p.etat.inventaire[bouclier]).toBe(1);
      p = moteur.executer(p, { type: 'equiper', objet: bouclier, personnage: 'bran' }).partie;
      expect(heros(p, 'bran').fiche.ca).toBe(avant);
    } else {
      // Bran porte une arme à deux mains : il range d'abord celle du jeu en main pour libérer la main gauche.
      p = donner(p, 'bouclier');
      const droite = porte(p, 'bran')['j1.droite'];
      if (droite && estDeuxMains(moteur.ctx, droite)) p = moteur.executer(p, { type: 'retirerEquipement', personnage: 'bran', emplacement: 'j1.droite' }).partie;
      p = moteur.executer(p, { type: 'equiper', objet: 'bouclier', personnage: 'bran' }).partie;
      expect(heros(p, 'bran').fiche.ca).toBe(avant + 2);
    }
  });

  it('une arme magique du monde repose sur une arme du SRD, garde son nom et ses bonus en combat', () => {
    let p = donner(depart(), 'pdf-lame-de-fer-gris');
    const sansLame = heroCombatDe(heros(p, 'bran'));
    const res = moteur.executer(p, { type: 'equiper', objet: 'pdf-lame-de-fer-gris', personnage: 'bran', emplacement: 'j1.droite' });
    expect(res.refus).toBeUndefined();
    p = res.partie;
    const bran = heros(p, 'bran');
    const eq = equipementDe(bran);
    expect(eq.emplacements['j1.droite']).toBe('pdf-lame-de-fer-gris');
    expect(bran.fiche.equipement?.armes).toContain('epee-longue');
    expect(eq.bonus?.['j1.droite']).toMatchObject({ attaque: 1, degats: 1, nom: dm.objets.get('pdf-lame-de-fer-gris')!.nom });
    const kit = heroCombatDe(bran).kit;
    const lame = heroDepuisFiche(bran.fiche, kit, srd, { x: 1, y: 1 }).attaques.find((a) => a.id === 'epee-longue')!;
    const ordinaire = heroDepuisFiche(sansLame.fiche, { armes: [{ id: 'epee-longue' }] }, srd, { x: 1, y: 1 }).attaques.find((a) => a.id === 'epee-longue')!;
    expect(lame.nom).toContain(dm.objets.get('pdf-lame-de-fer-gris')!.nom);
    expect(lame.bonusAttaque).toBe(ordinaire.bonusAttaque + 1);
    expect(lame.degats[0]!.bonus).toBe(ordinaire.degats[0]!.bonus + 1);
  });

  it('deux armes de même base, l’une magique : chacune garde ses valeurs (main droite et main gauche Légères)', () => {
    const objets = new Map(dm.objets);
    objets.set('test-dague-magique', { id: 'test-dague-magique', nom: 'Dague aiguë', categorie: 'arme', rarete: 'peu-commun', valeurPo: 100, resume: 'Une dague +1.', base: 'dague', bonus: { attaque: 1, degats: 1 }, magique: true, effets: [], attunement: false });
    const m = creerMoteur({ dm: { ...dm, objets }, srd }, [...MODULES_STANDARD, don]);
    let p = m.executer(m.nouvellePartie(groupe(), { graine: 4, niveau: 3 }), { type: 'commencer' }).partie;
    for (const o of ['dague', 'test-dague-magique']) p = m.executer(p, { type: 'donner', objet: o, quantite: 1 }).partie;
    p = m.executer(p, { type: 'equiper', objet: 'dague', personnage: 'pip', emplacement: 'j1.droite' }).partie;
    const res = m.executer(p, { type: 'equiper', objet: 'test-dague-magique', personnage: 'pip', emplacement: 'j1.gauche' });
    expect(res.refus).toBeUndefined();
    const pip = heros(res.partie, 'pip');
    expect(equipementDe(pip).armesActives).toEqual(['j1.droite', 'j1.gauche']);
    const attaques = heroDepuisFiche(pip.fiche, heroCombatDe(pip).kit, srd, { x: 1, y: 1 }).attaques.filter((a) => a.id.startsWith('dague') && !a.id.includes('lancer'));
    expect(attaques.map((a) => a.id)).toEqual(['dague', 'dague-2']);
    expect(attaques[1]!.bonusAttaque).toBe(attaques[0]!.bonusAttaque + 1);
  });

  it('un objet qui ne s’équipe pas, un héros inconnu, un héros hors de combat', () => {
    let p = donner(depart(), 'rations');
    expect(moteur.executer(p, { type: 'equiper', objet: 'rations', personnage: 'pip' }).refus).toMatch(/ne s'équipe pas/);
    p = donner(p, 'epee-longue');
    expect(moteur.executer(p, { type: 'equiper', objet: 'epee-longue', personnage: 'personne' }).refus).toMatch(/Aucun héros/);
    const blesse = donner(depart(), 'cotte-de-mailles');
    heros(blesse, 'pip').pv = 0;
    expect(moteur.executer(blesse, { type: 'equiper', objet: 'cotte-de-mailles', personnage: 'pip' }).refus).toMatch(/hors de combat/);
  });

  it('trois objets magiques harmonisés au plus, tous emplacements confondus ; deux anneaux, pas trois ; les parures du Val se portent', () => {
    const objet = (id: string, categorie: 'anneau' | 'bijou' | 'vetement', attunement: boolean, emplacement?: 'cou' | 'tete') => ({
      id,
      nom: `Objet ${id}`,
      categorie,
      rarete: 'rare' as const,
      valeurPo: 100,
      resume: 'Un objet.',
      magique: true,
      effets: [],
      attunement,
      ...(emplacement ? { emplacement } : {}),
    });
    const objets = new Map(dm.objets);
    for (const o of [objet('test-anneau-1', 'anneau', true), objet('test-anneau-2', 'anneau', true), objet('test-anneau-3', 'anneau', false), objet('test-collier', 'bijou', true, 'cou'), objet('test-casque', 'vetement', true, 'tete')]) objets.set(o.id, o);
    const m = creerMoteur({ dm: { ...dm, objets }, srd }, [...MODULES_STANDARD, don]);
    let p = m.executer(m.nouvellePartie(groupe(), { graine: 5, niveau: 3 }), { type: 'commencer' }).partie;
    for (const id of ['test-anneau-1', 'test-anneau-2', 'test-anneau-3', 'test-collier', 'test-casque']) p = m.executer(p, { type: 'donner', objet: id, quantite: 1 }).partie;
    for (const id of ['test-anneau-1', 'test-anneau-2', 'test-collier']) {
      const res = m.executer(p, { type: 'equiper', objet: id, personnage: 'hilda' });
      expect(res.refus, id).toBeUndefined();
      p = res.partie;
    }
    // Un quatrième objet harmonisé (le casque) est refusé ; celui qui ne l'est pas remplace un anneau (deux doigts seulement).
    expect(m.executer(p, { type: 'equiper', objet: 'test-casque', personnage: 'hilda' }).refus).toMatch(/harmonisé/);
    const remplace = m.executer(p, { type: 'equiper', objet: 'test-anneau-3', personnage: 'hilda' });
    expect(remplace.refus).toBeUndefined();
    expect(Object.values(equipementDe(heros(remplace.partie, 'hilda')).emplacements).filter((id) => id?.startsWith('test-anneau'))).toHaveLength(2);
    // Un autre héros peut prendre le casque.
    expect(m.executer(p, { type: 'equiper', objet: 'test-casque', personnage: 'pip' }).refus).toBeUndefined();
    // Les parures du Val : le lorgnon de l'archiviste (harmonisé) se porte à la tête, la CA ne change pas.
    let q = donner(depart(), 'cry-lorgnon-de-l-archiviste');
    const ca = heros(q, 'pip').fiche.ca;
    q = moteur.executer(q, { type: 'equiper', objet: 'cry-lorgnon-de-l-archiviste', personnage: 'pip' }).partie;
    expect(porte(q, 'pip').tete).toBe('cry-lorgnon-de-l-archiviste');
    expect(heros(q, 'pip').fiche.ca).toBe(ca);
  });

  it('une cuirasse magique du monde donne la CA de son armure du SRD plus son bonus', () => {
    let p = donner(depart(), 'hf-cuirasse-de-fonte-grise');
    const base = caAvec(heros(p, 'bran').fiche.defense!, srd.armures.get('cuirasse'), !!bouclierActif(moteur.ctx, equipementDe(heros(p, 'bran'))) && heros(p, 'bran').fiche.formationArmures.includes('bouclier'));
    p = moteur.executer(p, { type: 'equiper', objet: 'hf-cuirasse-de-fonte-grise', personnage: 'bran' }).partie;
    expect(heros(p, 'bran').fiche.ca).toBe(base + 1);
    expect(heros(p, 'bran').fiche.equipement?.armure).toBe('cuirasse');
  });

  it('un objet qu’on ne possède pas ne s’équipe pas', () => {
    expect(moteur.executer(depart(), { type: 'equiper', objet: 'cotte-de-mailles', personnage: 'bran' }).refus).toMatch(/pas cet objet/);
  });

  it('la formation manquante et la Force sont signalées sans empêcher d’équiper', () => {
    const p = donner(depart(), 'harnois');
    const res = moteur.executer(p, { type: 'equiper', objet: 'harnois', personnage: 'ambrine' });
    expect(res.refus).toBeUndefined();
    const textes = res.evenements
      .filter((e) => e.type === 'constat')
      .map((e) => (e as { texte: string }).texte)
      .join('\n');
    expect(textes).toMatch(/formation/);
    expect(heros(res.partie, 'ambrine').fiche.ca).toBeGreaterThan(0);
  });

  it('la grille montre ce que porte chaque héros, avec ses actions ; la charge du groupe est affichée', () => {
    const p = donner(depart(), 'cotte-de-mailles');
    const portes = grille(p).elements.filter((e) => e.porteur);
    expect(portes.length).toBeGreaterThan(6);
    expect(new Set(portes.map((e) => e.porteur!.id))).toEqual(new Set(p.groupe.map((a) => a.id)));
    expect(portes.every((e) => e.groupe.id.startsWith('porte:'))).toBe(true);
    const unePorte = portes.find((e) => e.porteur!.id === 'bran')!;
    const actions = moteur.propositions(p).filter((x) => x.element?.id === unePorte.id);
    expect(actions.map((x) => x.libelle)).toEqual(['Retirer']);
    // Dans le sac : « Équiper… » avec le choix du héros et ce que devient sa CA.
    const equiper = moteur.propositions(p).find((x) => x.element?.id === 'cotte-de-mailles' && x.choix)!;
    expect(equiper.choix!.options).toHaveLength(6);
    expect(equiper.choix!.options.find((o) => o.valeur === 'pip')!.detail).toMatch(/^CA \d+ → \d+$/);
    expect(element(p, 'cotte-de-mailles')).toMatchObject({ imageCommune: { groupe: 'equipement', id: 'cotte-de-mailles' } });
    expect(element(p, 'cotte-de-mailles').proprietes!.map((x) => x.libelle)).toEqual(expect.arrayContaining(['CA de base']));
    const charge = grille(p).resume!.find((l) => l.libelle === 'Charge du groupe')!;
    expect(charge.valeur).toMatch(/\d.* \/ \d/);
  });

  it('équiper et retirer en boucle ne perd ni ne crée aucun objet, la CA suit l’équipement, et les mains restent cohérentes', () => {
    let p = depart();
    for (const o of ['cotte-de-mailles', 'bouclier', 'epee-longue', 'dague', 'arc-court', 'epee-a-deux-mains', 'dague', 'cry-lorgnon-de-l-archiviste']) p = donner(p, o);
    const total = (x: Partie) => Object.values(x.etat.inventaire).reduce((n, q) => n + q, 0) + x.groupe.reduce((n, h) => n + objetsPortes(equipementDe(h)).length, 0);
    const initial = total(p);
    for (let i = 0; i < 120; i++) {
      const jouables = moteur.propositions(p).filter((x) => x.ordre && (x.ordre.type === 'equiper' || x.ordre.type === 'retirerEquipement') && !x.desactivee);
      if (!jouables.length) break;
      const x = jouables[(i * 7 + 3) % jouables.length]!;
      const options = x.choix?.options.filter((o) => !o.desactivee) ?? [];
      if (x.choix && !options.length) continue;
      const ordre = x.choix ? { ...x.ordre!, [x.choix.champ]: options[i % options.length]!.valeur } : x.ordre!;
      const res = moteur.executer(p, ordre);
      expect(res.refus, JSON.stringify(ordre)).toBeUndefined();
      p = res.partie;
      expect(total(p)).toBe(initial);
    }
    for (const h of p.groupe) {
      const e = equipementDe(h);
      const torse = e.emplacements.torse;
      const armure = torse ? srd.armures.get(torse) : undefined;
      const attendu = caAvec(h.fiche.defense!, armure, !!bouclierActif(moteur.ctx, e) && h.fiche.formationArmures.includes('bouclier'), 0);
      expect(h.fiche.ca, h.nom).toBe(attendu);
      // Un objet par emplacement, jamais de bouclier avec une arme à deux mains, jamais de main gauche sans main droite Légère.
      for (const jeu of ['j1', 'j2'] as const) {
        const [d, g] = [e.emplacements[`${jeu}.droite`], e.emplacements[`${jeu}.gauche`]];
        if (estDeuxMains(moteur.ctx, d)) expect(g, `${h.nom} : arme à deux mains et main gauche pleine`).toBeUndefined();
      }
      expect(Object.keys(e.emplacements).every((s) => (EMPLACEMENTS as readonly string[]).includes(s))).toBe(true);
    }
  });
});
