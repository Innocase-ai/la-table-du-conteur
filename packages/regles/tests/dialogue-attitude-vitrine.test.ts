// Dialogue lisible (attitude en degrés, jets d'influence annoncés avec le meilleur orateur) et vitrine d'un marchand
// (image, résumé, prix, ordres du moteur) : ce que l'écran affiche vient du moteur, ici on vérifie ces données.
import { describe, expect, it } from 'vitest';
import {
  articles,
  bilanPersonnage,
  creerMoteur,
  groupeConseille,
  LIBELLES_ATTITUDE,
  lieuxDuPnjMaintenant,
  meilleurOrateur,
  MODULES_STANDARD,
  niveauAttitude,
  personnageDepuisFiche,
  resumeObjet,
  vitrineDe,
  type DonneesMonde,
  type Interlocuteur,
  type Partie,
  type Vitrine,
} from '../src';
import { chargerMonde } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { dossierMonde } from './mondes-essai';

const srd = chargerDonneesSrd();
const mondes: Record<string, DonneesMonde> = {};
function monde(id: string): DonneesMonde {
  if (!mondes[id]) {
    const r = chargerMonde(dossierMonde(id));
    if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
    mondes[id] = r.monde;
  }
  return mondes[id]!;
}
function partie(id: string, niveau = 3) {
  const dm = monde(id);
  const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
  const groupe = groupeConseille(niveau, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  const p = moteur.executer(moteur.nouvellePartie(groupe, { graine: 1, niveau }), { type: 'commencer' }).partie;
  return { dm, moteur, p };
}
const chez = (dm: DonneesMonde, p: Partie, id: string): string => lieuxDuPnjMaintenant(p, dm.pnj.get(id)!)[0]!;
function enConversation(m: ReturnType<typeof partie>, pnj: string, attitude?: number, pieces?: number): Partie {
  const q: Partie = { ...m.p, scene: { type: 'exploration' }, etat: { ...m.p.etat, lieu: chez(m.dm, m.p, pnj), attitudes: { ...m.p.etat.attitudes, ...(attitude === undefined ? {} : { [pnj]: attitude }) }, ...(pieces === undefined ? {} : { pieces }) } };
  return m.moteur.executer(q, { type: 'parler', pnj }).partie;
}

describe('degré d’attitude', () => {
  it('suit les seuils du moteur : hostile jusqu’à −30, amical dès 30, neutre de −10 à 10', () => {
    expect(niveauAttitude(-100)).toBe('hostile');
    expect(niveauAttitude(-30)).toBe('hostile');
    expect(niveauAttitude(-29)).toBe('mefiant');
    expect(niveauAttitude(-11)).toBe('mefiant');
    expect(niveauAttitude(-10)).toBe('neutre');
    expect(niveauAttitude(0)).toBe('neutre');
    expect(niveauAttitude(10)).toBe('neutre');
    expect(niveauAttitude(11)).toBe('bienveillant');
    expect(niveauAttitude(29)).toBe('bienveillant');
    expect(niveauAttitude(30)).toBe('amical');
    expect(LIBELLES_ATTITUDE.mefiant).toBe('Méfiant');
    expect(LIBELLES_ATTITUDE.amical).toBe('Amical');
  });
});

describe('conversation : attitude et jets d’influence annoncés', () => {
  const m = partie('val-des-cendres');
  const PNJ = 'vei-nerio-braisemolle';
  const vue = (p: Partie) => m.moteur.vue<Interlocuteur>('interlocuteur', p);

  it('l’interlocuteur porte son degré d’attitude et l’Avantage ou le Désavantage qu’il donne', () => {
    const amical = vue(enConversation(m, PNJ, 50));
    expect(amical).toMatchObject({ niveauAttitude: 'amical', libelleAttitude: 'Amical', modeInfluence: 'avantage' });
    const hostile = vue(enConversation(m, PNJ, -60));
    expect(hostile).toMatchObject({ niveauAttitude: 'hostile', libelleAttitude: 'Hostile', modeInfluence: 'desavantage' });
    const neutre = vue(enConversation(m, PNJ, 0));
    expect(neutre.libelleAttitude).toBe('Neutre');
    expect(neutre.modeInfluence).toBeUndefined();
  });

  it('chaque bouton d’influence annonce la compétence, le DD, le meilleur orateur et son bonus', () => {
    const p = enConversation(m, PNJ, 0);
    const boutons = m.moteur.propositions(p).filter((x) => x.element?.id === 'influence');
    expect(boutons).toHaveLength(3);
    for (const b of boutons) {
      const maniere = b.ordre!.maniere as 'persuasion' | 'intimidation' | 'tromperie';
      const attendu = meilleurOrateur(p, maniere)!;
      expect(b.jet).toEqual({ test: maniere, dd: 15, qui: attendu.nom, bonus: attendu.bonus });
    }
    // Le meilleur orateur est bien le plus fort du groupe debout dans la manière choisie.
    const bonusMax = Math.max(...p.groupe.filter((h) => h.pv > 0).map((h) => h.fiche.competences.persuasion.bonus));
    expect(boutons.find((b) => b.ordre!.maniere === 'persuasion')!.jet!.bonus).toBe(bonusMax);
  });

  it('l’attitude amicale annonce l’Avantage, l’hostile le Désavantage', () => {
    const jets = (a: number) => m.moteur.propositions(enConversation(m, PNJ, a)).filter((x) => x.element?.id === 'influence').map((b) => b.jet!.mode);
    expect(jets(50)).toEqual(['avantage', 'avantage', 'avantage']);
    expect(jets(-50)).toEqual(['desavantage', 'desavantage', 'desavantage']);
    expect(jets(5)).toEqual([undefined, undefined, undefined]);
  });

  it('un héros à terre n’est jamais annoncé comme orateur', () => {
    const p = enConversation(m, PNJ, 0);
    const meilleur = meilleurOrateur(p, 'persuasion')!;
    const blesse: Partie = { ...p, groupe: p.groupe.map((h) => (h.id === meilleur.id ? { ...h, pv: 0 } : h)) };
    expect(meilleurOrateur(blesse, 'persuasion')!.id).not.toBe(meilleur.id);
  });

  it('l’orateur annoncé est celui qui tente vraiment le jet', () => {
    const p = enConversation(m, PNJ, 0);
    const bouton = m.moteur.propositions(p).find((x) => x.element?.id === 'influence' && x.ordre!.maniere === 'persuasion')!;
    const r = m.moteur.executer(p, bouton.ordre!);
    const jet = r.evenements.find((e) => e.type === 'jet');
    expect(jet && jet.type === 'jet' && jet.jet.nom).toBe(bouton.jet!.qui);
    expect(jet && jet.type === 'jet' && jet.jet.bonus).toBe(bouton.jet!.bonus);
  });
});

describe('vitrine d’un marchand', () => {
  const m = partie('citadelle-des-marees');
  const marchand = [...m.dm.pnj.values()].find((n) => n.boutique && articles(m.moteur.ctx, m.p, n).length > 0)!;
  const vitrine = (pieces: number) => m.moteur.vue<Vitrine | undefined>('vitrine', enConversation(m, marchand.id, undefined, pieces))!;

  it('montre chaque article avec son résumé, son prix et l’ordre d’achat du moteur', () => {
    const v = vitrine(500);
    expect(v.nom).toBe(marchand.nom);
    expect(v.bourse).toBe(500);
    const attendus = articles(m.moteur.ctx, enConversation(m, marchand.id, undefined, 500), marchand);
    expect(v.articles.map((a) => a.objet)).toEqual(attendus.map((a) => a.objet));
    for (const [i, a] of v.articles.entries()) {
      expect(a.prix).toBe(attendus[i]!.prix);
      expect(a.prixTexte).toMatch(/ (po|pa|pc)$/);
      expect(a.quantite).toBe(attendus[i]!.reste);
      expect(a.ordre).toEqual({ type: 'acheter', pnj: marchand.id, objet: a.objet });
      expect(a.imageCommune.groupe).toBe('equipement');
      expect(a.image).toEqual({ groupe: 'objets', id: a.objet });
      expect(a.desactivee).toBeUndefined();
    }
  });

  it('les ordres de la vitrine sont exactement ceux des boutons du moteur', () => {
    const p = enConversation(m, marchand.id, undefined, 500);
    const v = vitrineDe(m.moteur.ctx, p)!;
    const boutons = m.moteur.propositions(p);
    for (const a of v.articles) expect(boutons.some((b) => JSON.stringify(b.ordre) === JSON.stringify(a.ordre))).toBe(true);
    for (const r of v.rachats) expect(boutons.some((b) => JSON.stringify(b.ordre) === JSON.stringify(r.ordre))).toBe(true);
    for (const s of v.services) expect(boutons.some((b) => JSON.stringify(b.ordre) === JSON.stringify(s.ordre))).toBe(true);
  });

  it('un article trop cher est grisé avec la raison ; acheter par l’ordre de la vitrine fonctionne', () => {
    const pauvre = vitrine(0);
    const cher = pauvre.articles.find((a) => a.prix > 0);
    if (cher) expect(cher.desactivee).toMatch(/or/);
    const p = enConversation(m, marchand.id, undefined, 500);
    const a = vitrineDe(m.moteur.ctx, p)!.articles[0]!;
    const avant = p.etat.inventaire[a.objet] ?? 0;
    const apres = m.moteur.executer(p, a.ordre).partie;
    expect(apres.etat.inventaire[a.objet]).toBe(avant + 1);
    expect(apres.etat.pieces).toBeCloseTo(500 - a.prix, 2);
  });

  it('les rachats portent le prix de rachat et demandent une confirmation', () => {
    const p = enConversation(m, marchand.id, undefined, 500);
    const sac: Partie = { ...p, etat: { ...p.etat, inventaire: { ...p.etat.inventaire, dague: 2 } } };
    const v = vitrineDe(m.moteur.ctx, sac)!;
    for (const r of v.rachats) {
      expect(r.ordre.type).toBe('vendre');
      expect(r.confirmer).toBe(true);
    }
  });

  it('rien à montrer hors conversation', () => {
    expect(vitrineDe(m.moteur.ctx, m.p)).toBeUndefined();
  });
});

describe('résumé d’un objet du catalogue', () => {
  const m = partie('citadelle-des-marees');
  const ctx = m.moteur.ctx;

  it('une arme dit ses dégâts et ses propriétés', () => {
    const r = resumeObjet(ctx, 'epee-longue');
    expect(r.proprietes[0]).toEqual({ libelle: 'Dégâts', valeur: expect.stringMatching(/^1d8 /) });
    expect(r.inconnu).toBe(false);
  });

  it('une armure dit sa CA, un bouclier son bonus', () => {
    expect(resumeObjet(ctx, 'cotte-de-mailles').proprietes[0]).toMatchObject({ libelle: 'CA de base', valeur: '16' });
    expect(resumeObjet(ctx, 'bouclier').proprietes[0]).toEqual({ libelle: 'CA', valeur: '+2' });
  });

  it('un objet inconnu du catalogue n’invente rien', () => {
    const r = resumeObjet(ctx, 'objet-qui-n-existe-pas');
    expect(r.proprietes).toEqual([]);
    expect(r.inconnu).toBe(false);
  });
});
