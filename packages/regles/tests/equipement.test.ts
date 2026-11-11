import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  bilanPersonnage,
  caAvec,
  calculerFiche,
  commande,
  creerMoteur,
  equipementDe,
  groupeConseille,
  heroCombatDe,
  MODULES_STANDARD,
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
  it('l’équipement de départ est celui de la fiche ; équiper une armure du sac recalcule la CA et rend l’ancienne', () => {
    let p = depart();
    const pip = heros(p, 'pip');
    const avant = pip.fiche.ca;
    expect(equipementDe(pip).armes.length).toBeGreaterThan(0);
    p = donner(p, 'cotte-de-mailles');
    const res = moteur.executer(p, { type: 'equiper', objet: 'cotte-de-mailles', personnage: 'pip' });
    expect(res.refus).toBeUndefined();
    p = res.partie;
    expect(heros(p, 'pip').fiche.ca).toBeGreaterThan(avant);
    expect(heros(p, 'pip').fiche.equipement?.armure).toBe('cotte-de-mailles');
    expect(heros(p, 'pip').equipe?.armure).toBe('cotte-de-mailles');
    expect(p.etat.inventaire['cotte-de-mailles']).toBeUndefined();
    // L'armure de cuir de départ revient dans le sac.
    const ancienne = equipementDe(pip).armure!;
    expect(p.etat.inventaire[ancienne]).toBe(1);
    expect(res.evenements).toContainEqual({ type: 'equipementChange', personnage: 'pip', objet: 'cotte-de-mailles', ancien: ancienne });
    // Et la fiche d'origine n'a pas été touchée.
    expect(pip.fiche.ca).toBe(avant);
  });

  it('retirer rend l’objet au sac et recalcule la CA ; le bouclier ajoute son bonus', () => {
    let p = depart();
    const bran = heros(p, 'bran');
    const avant = bran.fiche.ca;
    const bouclier = equipementDe(bran).bouclier;
    if (bouclier) {
      p = moteur.executer(p, { type: 'retirerEquipement', objet: bouclier, personnage: 'bran' }).partie;
      expect(heros(p, 'bran').fiche.ca).toBe(avant - 2);
      expect(p.etat.inventaire[bouclier]).toBe(1);
      p = moteur.executer(p, { type: 'equiper', objet: bouclier, personnage: 'bran' }).partie;
      expect(heros(p, 'bran').fiche.ca).toBe(avant);
    } else {
      p = donner(p, 'bouclier');
      p = moteur.executer(p, { type: 'equiper', objet: 'bouclier', personnage: 'bran' }).partie;
      expect(heros(p, 'bran').fiche.ca).toBe(avant + 2);
    }
  });

  it('une arme magique du monde repose sur une arme du SRD, garde son nom et ses bonus en combat', () => {
    let p = depart();
    // Bran a déjà son compte d'armes : il en range une.
    const gardee = equipementDe(heros(p, 'bran')).armes;
    if (gardee.length >= 3) p = moteur.executer(p, { type: 'retirerEquipement', objet: gardee[0]!, personnage: 'bran' }).partie;
    const sansLame = heroCombatDe(heros(p, 'bran'));
    p = donner(p, 'pdf-lame-de-fer-gris');
    const res = moteur.executer(p, { type: 'equiper', objet: 'pdf-lame-de-fer-gris', personnage: 'bran' });
    expect(res.refus).toBeUndefined();
    p = res.partie;
    const bran = heros(p, 'bran');
    expect(bran.equipe?.armes).toContain('pdf-lame-de-fer-gris');
    expect(bran.fiche.equipement?.armes).toContain('epee-longue');
    expect(bran.equipe?.bonusArmes?.['epee-longue']).toMatchObject({ attaque: 1, degats: 1, nom: dm.objets.get('pdf-lame-de-fer-gris')!.nom });
    const lame = heroDepuisFiche(bran.fiche, heroCombatDe(bran).kit, srd, { x: 1, y: 1 }).attaques.find((a) => a.id === 'epee-longue')!;
    const ordinaire = heroDepuisFiche(sansLame.fiche, { armes: [{ id: 'epee-longue' }] }, srd, { x: 1, y: 1 }).attaques.find((a) => a.id === 'epee-longue')!;
    expect(lame.nom).toContain(dm.objets.get('pdf-lame-de-fer-gris')!.nom);
    // Lame magique et épée ordinaire de même base : chacune garde ses propres valeurs.
    const deux = heroCombatDe({ ...bran, fiche: { ...bran.fiche, equipement: { ...bran.fiche.equipement!, armes: ['epee-longue', 'epee-longue'] } }, equipe: { ...bran.equipe!, bonusEmplacements: [bran.equipe!.bonusArmes!['epee-longue']!, null] } });
    const attaques = heroDepuisFiche(bran.fiche, deux.kit, srd, { x: 1, y: 1 }).attaques.filter((a) => a.id.startsWith('epee-longue'));
    expect(attaques.map((a) => a.id)).toEqual(['epee-longue', 'epee-longue-2']);
    expect(attaques[0]!.bonusAttaque).toBe(attaques[1]!.bonusAttaque + 1);
    expect(lame.bonusAttaque).toBe(ordinaire.bonusAttaque + 1);
    expect(lame.degats[0]!.bonus).toBe(ordinaire.degats[0]!.bonus + 1);
  });

  it('les limites : six armes au plus, un objet qui ne s’équipe pas, un héros inconnu, un héros hors de combat', () => {
    let p = depart();
    const armesDeDepart = equipementDe(heros(p, 'pip')).armes.length;
    const armes = ['epee-longue', 'javeline', 'hachette', 'lance', 'arbalete-legere'];
    for (const a of armes) p = donner(p, a);
    p = donner(p, 'rations');
    let refus = '';
    for (const a of armes) {
      const res = moteur.executer(p, { type: 'equiper', objet: a, personnage: 'pip' });
      if (res.refus) refus = res.refus;
      else p = res.partie;
    }
    // Pip part avec peu d'armes (kit allégé) : on en équipe jusqu'à six, le reste demeure dans le sac.
    expect(armesDeDepart).toBeLessThan(6);
    expect(equipementDe(heros(p, 'pip')).armes).toHaveLength(6);
    expect(refus).toMatch(/6 armes/);
    const restantes = Object.keys(p.etat.inventaire).filter((id) => armes.includes(id));
    expect(restantes).toHaveLength(armes.length - (6 - armesDeDepart));
    expect(moteur.executer(p, { type: 'equiper', objet: 'rations', personnage: 'pip' }).refus).toMatch(/ne s'équipe pas/);
    expect(moteur.executer(p, { type: 'equiper', objet: restantes[0]!, personnage: 'personne' }).refus).toMatch(/Aucun héros/);
    const blesse = donner(depart(), 'cotte-de-mailles');
    heros(blesse, 'pip').pv = 0;
    expect(moteur.executer(blesse, { type: 'equiper', objet: 'cotte-de-mailles', personnage: 'pip' }).refus).toMatch(/hors de combat/);
  });

  it('trois objets magiques harmonisés au plus, cinq parures au plus ; les parures du Val se portent', () => {
    const anneau = (id: string, attunement: boolean) => ({
      id,
      nom: `Anneau ${id}`,
      categorie: 'anneau' as const,
      rarete: 'rare' as const,
      valeurPo: 100,
      resume: 'Un anneau.',
      magique: true,
      effets: [],
      attunement,
    });
    const objets = new Map(dm.objets);
    for (let i = 1; i <= 4; i++) objets.set(`test-anneau-${i}`, anneau(`test-anneau-${i}`, true));
    objets.set('test-anneau-libre', anneau('test-anneau-libre', false));
    const m = creerMoteur({ dm: { ...dm, objets }, srd }, [...MODULES_STANDARD, don]);
    let p = m.executer(m.nouvellePartie(groupe(), { graine: 5, niveau: 3 }), { type: 'commencer' }).partie;
    for (const id of ['test-anneau-1', 'test-anneau-2', 'test-anneau-3', 'test-anneau-4', 'test-anneau-libre'])
      p = m.executer(p, { type: 'donner', objet: id, quantite: 1 }).partie;
    for (const i of [1, 2, 3]) {
      const res = m.executer(p, { type: 'equiper', objet: `test-anneau-${i}`, personnage: 'hilda' });
      expect(res.refus).toBeUndefined();
      p = res.partie;
    }
    expect(m.executer(p, { type: 'equiper', objet: 'test-anneau-4', personnage: 'hilda' }).refus).toMatch(/harmonisé/);
    // Un objet sans harmonisation se porte encore ; un autre héros peut prendre le quatrième.
    expect(m.executer(p, { type: 'equiper', objet: 'test-anneau-libre', personnage: 'hilda' }).refus).toBeUndefined();
    expect(m.executer(p, { type: 'equiper', objet: 'test-anneau-4', personnage: 'pip' }).refus).toBeUndefined();
    // Les parures du Val : le lorgnon de l'archiviste (harmonisé) se porte, la CA ne change pas.
    let q = donner(depart(), 'cry-lorgnon-de-l-archiviste');
    const ca = heros(q, 'pip').fiche.ca;
    q = moteur.executer(q, { type: 'equiper', objet: 'cry-lorgnon-de-l-archiviste', personnage: 'pip' }).partie;
    expect(equipementDe(heros(q, 'pip')).portes).toEqual(['cry-lorgnon-de-l-archiviste']);
    expect(heros(q, 'pip').fiche.ca).toBe(ca);
  });

  it('une cuirasse magique du monde donne la CA de son armure du SRD plus son bonus', () => {
    let p = donner(depart(), 'hf-cuirasse-de-fonte-grise');
    const base = caAvec(
      heros(p, 'bran').fiche.defense!,
      srd.armures.get('cuirasse'),
      !!equipementDe(heros(p, 'bran')).bouclier && heros(p, 'bran').fiche.formationArmures.includes('bouclier'),
    );
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
    let p = donner(depart(), 'cotte-de-mailles');
    const porte = grille(p).elements.filter((e) => e.porteur);
    expect(porte.length).toBeGreaterThan(6);
    expect(new Set(porte.map((e) => e.porteur!.id))).toEqual(new Set(p.groupe.map((a) => a.id)));
    expect(porte.every((e) => e.groupe.id.startsWith('porte:'))).toBe(true);
    const unePorte = porte.find((e) => e.porteur!.id === 'bran')!;
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

  it('équiper et retirer en boucle ne perd ni ne crée aucun objet, et la CA suit toujours l’équipement', () => {
    let p = depart();
    for (const o of ['cotte-de-mailles', 'bouclier', 'epee-longue', 'dague', 'arc-court']) p = donner(p, o);
    const total = (x: Partie) =>
      Object.values(x.etat.inventaire).reduce((n, q) => n + q, 0) +
      x.groupe.reduce(
        (n, h) => n + (equipementDe(h).armure ? 1 : 0) + (equipementDe(h).bouclier ? 1 : 0) + equipementDe(h).armes.length + equipementDe(h).portes.length,
        0,
      );
    const initial = total(p);
    for (let i = 0; i < 80; i++) {
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
      const armure = e.armure ? srd.armures.get(e.armure) : undefined;
      const attendu = caAvec(h.fiche.defense!, armure, !!e.bouclier && h.fiche.formationArmures.includes('bouclier'), 0);
      expect(h.fiche.ca, h.nom).toBe(attendu);
      expect(e.armes.length).toBeLessThanOrEqual(6);
    }
  });
});
