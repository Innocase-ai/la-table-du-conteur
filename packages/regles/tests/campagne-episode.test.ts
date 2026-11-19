// F5 (PRD-SAGA), pas (b) — le bilan de fin d'épisode, l'entrée dans l'épisode suivant, le carnet injecté dans le parcours automatique.
// Deux jeux d'essai servent d'épisodes : Le Val des Cendres (l'épisode quitté) et Port-Sillage (l'épisode d'arrivée).
import { describe, expect, it } from 'vitest';
import { bilanDeFin, creerMoteur, entrerDansEpisode, explorerParcours, groupeDeTest, MODULES_STANDARD, Objet, rejouer, type DonneesMonde, type Moteur, type Partie } from '../src';
import { chargerDonneesSrd } from '../src/donnees-node';
import { chargerMonde } from '../src/monde/chargeur';
import { evaluerCondition } from '../src/monde/etat';
import { dossierMonde } from './mondes-essai';

const srd = chargerDonneesSrd();
const charger = (id: string): DonneesMonde => {
  const r = chargerMonde(dossierMonde(id));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  return r.monde;
};
const moteurDe = (dm: DonneesMonde): Moteur => creerMoteur({ dm, srd }, MODULES_STANDARD);

/** Un épisode joué : le Val, avec un groupe de niveau 3, un peu d'XP, d'or, un sac mêlé et une arme du monde en main. */
function episodeJoue(campagne?: string[]): { dm: DonneesMonde; moteur: Moteur; partie: Partie } {
  const dm = charger('val-des-cendres');
  dm.objets.set('arme-du-val', Objet.parse({ id: 'arme-du-val', nom: 'Lame du Val', categorie: 'arme', base: 'epee-longue', valeurPo: 100, resume: 'Une lame du Val.', rarete: 'peu-commun', bonus: { attaque: 1, degats: 1 } }));
  dm.objets.set('relique-du-val', Objet.parse({ id: 'relique-du-val', nom: 'Relique du Val', categorie: 'divers', valeurPo: 1, resume: 'Une relique.', degre: 'unique' }));
  dm.objets.set('lettre-du-val', Objet.parse({ id: 'lettre-du-val', nom: 'Lettre', categorie: 'quete', valeurPo: 0, resume: 'Une lettre.' }));
  dm.objets.set('bague-du-val', Objet.parse({ id: 'bague-du-val', nom: 'Bague du Val', categorie: 'bijou', valeurPo: 5, resume: 'Une bague.' }));
  const moteur = moteurDe(dm);
  const partie = moteur.executer(moteur.nouvellePartie(groupeDeTest(srd, 3), { graine: 11, niveau: 3, ...(campagne ? { campagne } : {}) }), { type: 'commencer' }).partie;
  partie.etat.xp += 250;
  partie.etat.pieces = 87.5;
  partie.etat.jour = 9;
  partie.etat.inventaire = { rations: 4, 'potion-de-guerison': 2, 'relique-du-val': 1, 'lettre-du-val': 1, 'arme-du-val': 1 };
  partie.etat.flags['drapeau-du-val'] = true;
  partie.etat.faits.push('un-fait-du-val');
  partie.etat.fin = 'une-fin-du-val';
  const heros = partie.groupe[0]!;
  const equipe = heros.equipe as { emplacements: Record<string, string> };
  equipe.emplacements['j1.droite'] = 'arme-du-val';
  equipe.emplacements.anneau1 = 'bague-du-val';
  heros.pv = 1;
  return { dm, moteur, partie };
}

describe('le bilan de fin d’épisode', () => {
  it('garde le groupe, l’XP, l’or, le niveau et la fin ; ne touche pas la partie', () => {
    const { dm, partie } = episodeJoue();
    const avant = JSON.stringify(partie);
    const b = bilanDeFin(partie, { dm, srd });
    expect(JSON.stringify(partie)).toBe(avant);
    expect(b).toMatchObject({ version: 1, monde: 'val-des-cendres', fin: 'une-fin-du-val', niveau: 3, jour: 9, pieces: 87.5, xp: partie.etat.xp });
    expect(b.groupe).toHaveLength(partie.groupe.length);
    expect(b.groupe[0]).not.toBe(partie.groupe[0]);
    // Rien de l'épisode ne voyage : ni drapeau, ni fait, ni lieu dans le bilan.
    expect(JSON.stringify(b)).not.toContain('drapeau-du-val');
    expect(JSON.stringify(b)).not.toContain('un-fait-du-val');
  });

  it('le sac : le catalogue SRD voyage, les objets propres au monde, de quête et les clés restent derrière (nommés)', () => {
    const { dm, partie } = episodeJoue();
    const b = bilanDeFin(partie, { dm, srd });
    expect(b.inventaire).toEqual({ rations: 4, 'potion-de-guerison': 2 });
    expect(b.laisses).toEqual(expect.arrayContaining(['relique-du-val', 'lettre-du-val', 'arme-du-val', 'bague-du-val']));
  });

  it('une arme du monde en main redevient son modèle SRD (la fiche suit), un bijou du monde est laissé', () => {
    const { dm, partie } = episodeJoue();
    const b = bilanDeFin(partie, { dm, srd });
    const e = b.groupe[0]!.equipe as { emplacements: Record<string, string> };
    expect(e.emplacements['j1.droite']).toBe('epee-longue');
    expect(e.emplacements.anneau1).toBeUndefined();
    expect(b.groupe[0]!.fiche.equipement?.armes?.[0]).toBe('epee-longue');
    // La partie, elle, garde son arme du monde.
    expect((partie.groupe[0]!.equipe as { emplacements: Record<string, string> }).emplacements['j1.droite']).toBe('arme-du-val');
  });

  it('le carnet est cumulé : celui de départ, plus les échos de l’épisode, sans doublon', () => {
    const { dm, partie } = episodeJoue(['epi0-sauve']);
    const b = bilanDeFin(partie, { dm, srd }, { echos: ['epi1-allie', 'epi0-sauve'] });
    expect(b.campagne).toEqual(['epi0-sauve', 'epi1-allie']);
  });

  it('survit à un aller-retour JSON (c’est du JSON)', () => {
    const { dm, partie } = episodeJoue(['a']);
    const b = bilanDeFin(partie, { dm, srd });
    expect(JSON.parse(JSON.stringify(b))).toEqual(b);
  });
});

describe('l’entrée dans l’épisode suivant', () => {
  const suite = (campagne: string[] = []) => {
    const { dm, partie } = episodeJoue(campagne);
    const bilan = bilanDeFin(partie, { dm, srd }, { echos: ['epi1-allie'] });
    const dm2 = charger('port-sillage');
    const moteur2 = moteurDe(dm2);
    const { partie: arrivee, avis } = entrerDansEpisode(moteur2, bilan, { graine: 5 });
    return { bilan, dm2, moteur2, partie: arrivee, avis };
  };

  it('une partie neuve du nouveau monde : lieu de départ, jour 1, rien de l’épisode d’avant', () => {
    const { partie: p, dm2 } = suite();
    expect(p.monde).toBe('port-sillage');
    expect(p.etat.monde).toBe('port-sillage');
    expect(p.etat.lieu).toBe(dm2.monde.depart.lieu);
    expect(p.etat.jour).toBe(1);
    expect(p.etat.flags['drapeau-du-val']).toBeUndefined();
    expect(p.etat.faits).not.toContain('un-fait-du-val');
    expect(p.etat.fin).toBeUndefined();
    expect(p.scene.type).toBe('exploration');
  });

  it('le groupe emporte XP, or, sac et niveau ; les héros sont reposés (PV pleins)', () => {
    const { partie: p, bilan } = suite();
    expect(p.etat.xp).toBe(bilan.xp);
    expect(p.etat.pieces).toBe(87.5);
    expect(p.etat.inventaire).toEqual({ rations: 4, 'potion-de-guerison': 2 });
    expect(p.etat.niveauGroupe).toBe(3);
    expect(bilan.groupe[0]!.pv).toBe(1);
    for (const h of p.groupe) expect(h.pv).toBe(h.fiche.pvMax);
    expect(p.groupe.map((h) => h.nom)).toEqual(bilan.groupe.map((h) => h.nom));
    expect(p.etat.heros).toHaveLength(p.groupe.length);
  });

  it('le carnet arrive dans l’état, et le nouveau monde peut le lire', () => {
    const { partie: p } = suite(['epi0-sauve']);
    expect(p.etat.campagne).toEqual(['epi0-sauve', 'epi1-allie']);
    expect(evaluerCondition({ campagne: 'epi1-allie' }, p.etat)).toBe(true);
    expect(evaluerCondition({ campagne: 'jamais' }, p.etat)).toBe(false);
  });

  it('un groupe sans écho entre avec un carnet vide : pas de champ dans l’état', () => {
    const { dm, partie } = episodeJoue();
    const b = bilanDeFin(partie, { dm, srd });
    const { partie: p } = entrerDansEpisode(moteurDe(charger('port-sillage')), b, { graine: 5 });
    expect('campagne' in p.etat).toBe(false);
  });

  it('la partie se sauvegarde et se recharge dans le nouveau monde', () => {
    const { partie: p, moteur2 } = suite(['epi0-sauve']);
    const rechargee = moteur2.charger(JSON.stringify(p));
    expect(rechargee.etat.campagne).toEqual(['epi0-sauve', 'epi1-allie']);
    expect(rechargee.groupe).toHaveLength(p.groupe.length);
    expect(rechargee.etat.inventaire).toEqual(p.etat.inventaire);
  });

  it('le bilan n’est pas modifié par l’entrée (on peut recommencer l’épisode suivant)', () => {
    const { dm, partie } = episodeJoue();
    const b = bilanDeFin(partie, { dm, srd });
    const avant = JSON.stringify(b);
    entrerDansEpisode(moteurDe(charger('port-sillage')), b, { graine: 5 });
    expect(JSON.stringify(b)).toBe(avant);
  });

  it('un groupe trop bas pour l’épisode est averti, ses PX montent au seuil du niveau minimal, et il rattrape à sa première action', () => {
    const dm = charger('val-des-cendres');
    const moteur = moteurDe(dm);
    const p0 = moteur.executer(moteur.nouvellePartie(groupeDeTest(srd, 1), { graine: 3, niveau: 1 }), { type: 'commencer' }).partie;
    const bilan = bilanDeFin(p0, { dm, srd });
    const dm2 = charger('port-sillage');
    dm2.monde.niveaux = { min: 3, max: 3 };
    const moteur2 = moteurDe(dm2);
    const { partie, avis } = entrerDansEpisode(moteur2, bilan, { graine: 5 });
    expect(avis.join(' ')).toMatch(/niveau 1.*3 à 3/);
    expect(partie.etat.niveauGroupe).toBe(1);
    expect(partie.etat.xp).toBeGreaterThanOrEqual(900);
    const aller = moteur2.propositions(partie).find((x) => x.ordre?.type === 'aller');
    expect(aller, 'un déplacement est proposé').toBeDefined();
    const suivante = moteur2.executer(partie, aller!.ordre!).partie;
    expect(suivante.etat.niveauGroupe).toBe(3);
    for (const h of suivante.groupe) expect(h.fiche.niveau).toBe(3);
  });

  it('un groupe trop haut est averti aussi', () => {
    const { dm, partie } = episodeJoue();
    partie.etat.niveauGroupe = 6;
    const b = bilanDeFin(partie, { dm, srd });
    const { avis } = entrerDansEpisode(moteurDe(charger('port-sillage')), b, { graine: 5 });
    expect(avis.join(' ')).toMatch(/niveau 6.*1 à 3/);
  });
});

describe('le carnet injecté dans le parcours automatique', () => {
  it('un parcours rejoué avec son carnet refait le même chemin ; sans option, rien ne change', () => {
    const dm = charger('citadelle-des-marees');
    const moteur = moteurDe(dm);
    const base = { graines: [7], budgetEtats: 400, budgetMs: 20_000, squelette: false };
    const sans = explorerParcours({ dm, srd }, base);
    for (const p of sans.parcours) expect('campagne' in p).toBe(false);
    const avec = explorerParcours({ dm, srd }, { ...base, campagne: ['epi0-sauve'] });
    for (const p of avec.parcours) expect(p.campagne).toEqual(['epi0-sauve']);
    // Le rejeu avec le carnet arrive à la même fin.
    const p = avec.parcours[0] ?? sans.parcours[0];
    if (p) {
      const r = rejouer(moteur, groupeDeTest(srd, p.niveau), p.graine, p.niveau, p.etapes.map((e) => e.ordre), p.campagne);
      expect(r.refus).toBeUndefined();
      expect(r.partie.etat.campagne).toEqual(p.campagne);
    }
  });

  it('un monde dont une porte exige un écho n’est ouvrable que par un parcours qui porte cet écho', () => {
    const dm = charger('citadelle-des-marees');
    // Un sujet que seul l'écho ouvre : le parcours sans carnet ne l'aborde jamais, avec carnet il le voit.
    const pnj = [...dm.pnj.values()].find((p) => p.sujets.length > 1 && !p.sujets[0]!.condition && !p.sujets[0]!.attitudeMin)!;
    pnj.sujets[0]!.condition = { campagne: 'epi0-sauve' };
    const moteur = moteurDe(dm);
    const groupe = groupeDeTest(srd, 1);
    const sans = moteur.executer(moteur.nouvellePartie(groupe, { graine: 1, niveau: 1 }), { type: 'commencer' }).partie;
    const avec = moteur.executer(moteur.nouvellePartie(groupe, { graine: 1, niveau: 1, campagne: ['epi0-sauve'] }), { type: 'commencer' }).partie;
    expect(evaluerCondition(pnj.sujets[0]!.condition!, sans.etat)).toBe(false);
    expect(evaluerCondition(pnj.sujets[0]!.condition!, avec.etat)).toBe(true);
  });
});
