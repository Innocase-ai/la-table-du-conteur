// Montée de niveau avec choix du joueur : les nouveaux choix du niveau atteint peuvent être revus après la montée automatique.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { calculerFiche, choixDeMontee, creationRapide, creerMoteur, MODULES_STANDARD, monterAuNiveau, outilsDuConteur, personnageDepuisFiche, reviserChoixDeMontee, sortsEligibles, type Personnage } from '../src';
import { chargerDonneesSrd } from '../src/donnees-node';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(RACINE_MONDES, 'citadelle-des-marees'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde;
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);

function heros(classe: string, niveau: number, nom: string): Personnage {
  const choix = creationRapide({ classe, espece: 'humain', niveau, nom }, srd);
  const f = calculerFiche(choix, srd);
  if (!f.ok) throw new Error(f.erreurs.join('\n'));
  return personnageDepuisFiche(f.fiche, { id: nom.toLowerCase(), choix });
}

/** Un groupe de niveau `niveau` que `px` fait monter d'un coup à `cible` (XP partagée entre les héros). */
function monter(classes: string[], niveau: number, cible: number) {
  const groupe = classes.map((c, i) => heros(c, niveau, `${c}${i}`));
  let p = moteur.executer(moteur.nouvellePartie(groupe, { graine: 1, niveau }), { type: 'commencer' }).partie;
  p = { ...p, scene: { type: 'rencontre', rencontre: [...dm.rencontres.keys()][0]! } };
  const seuils = [0, 300, 900, 2700, 6500];
  const px = (seuils[cible - 1]! - p.etat.xp) * groupe.length;
  return moteur.executer(p, { type: 'reglerRencontre', issue: 'victoire', px }).partie;
}

describe('ce qui est nouveau à un niveau', () => {
  it('Magicien niveau 2 : un sort préparé de plus ; rien pour le Guerrier ; Barde : expertises ; Ensorceleur : Métamagie', () => {
    const niveau2 = (classe: string) => monterAuNiveau(creationRapide({ classe, espece: 'humain', niveau: 1, nom: 'T' }, srd), 2, srd)!.choix;
    const magicien = choixDeMontee(niveau2('magicien'), srd)!;
    expect(magicien.sortsPrepares.total).toBeGreaterThan(magicien.sortsPrepares.figes);
    expect(magicien.aucun).toBe(false);
    expect(choixDeMontee(niveau2('guerrier'), srd)!.aucun).toBe(true);
    expect(choixDeMontee(niveau2('barde'), srd)!.expertises.total).toBeGreaterThan(choixDeMontee(niveau2('barde'), srd)!.expertises.figes);
    expect(choixDeMontee(niveau2('ensorceleur'), srd)!.options.map((o) => o.choix.id)).toContain('metamagie');
    expect(choixDeMontee(creationRapide({ classe: 'magicien', espece: 'humain', niveau: 1, nom: 'T' }, srd), srd)).toBeUndefined(); // niveau 1 : rien à revoir
  });

  it('niveau 4 : une amélioration de caractéristique pour toutes les classes', () => {
    for (const classe of srd.classes.keys()) {
      const c = monterAuNiveau(creationRapide({ classe, espece: 'humain', niveau: 3, nom: 'T' }, srd), 4, srd)!.choix;
      const m = choixDeMontee(c, srd)!;
      expect(m.ameliorations.total, classe).toBe(m.ameliorations.figes + 1);
    }
  });
});

describe('revoir les choix après la montée', () => {
  it('la montée automatique pose le drapeau seulement aux héros qui ont du neuf', () => {
    const p = monter(['magicien', 'guerrier'], 1, 2);
    expect(p.etat.niveauGroupe).toBe(2);
    expect(p.groupe[0]!.monteeEnAttente).toBe(2);
    expect(p.groupe[1]!.monteeEnAttente).toBeUndefined();
  });

  it('un autre sort préparé : accepté, fiche et choix mis à jour, drapeau effacé', () => {
    const p = monter(['magicien'], 1, 2);
    const h = p.groupe[0]!;
    const nouveaux = choixDeMontee(h.choix!, srd)!;
    const connus = new Set([...(h.choix!.sortsMineurs ?? []), ...(h.choix!.sortsPrepares ?? [])]);
    const autre = sortsEligibles('magicien', nouveaux.niveauSortMax, srd).find((s) => s.niveau > 0 && !connus.has(s.id))!;
    const garde = (h.choix!.sortsPrepares ?? []).slice(0, nouveaux.sortsPrepares.figes);
    const propose = { ...h.choix!, sortsPrepares: [...garde, autre.id] };
    const res = moteur.executer(p, { type: 'reviserMontee', personnage: h.id, choix: propose });
    expect(res.refus).toBeUndefined();
    const apres = res.partie.groupe[0]!;
    expect(apres.monteeEnAttente).toBeUndefined();
    expect(apres.choix!.sortsPrepares).toContain(autre.id);
    expect(apres.fiche.sortsPrepares).toContain(autre.id);
    expect(res.evenements.some((e) => e.type === 'constat' && /a choisi ses nouveautés du niveau 2/.test(e.texte))).toBe(true);
  });

  it('refuse de changer un choix ancien, l’espèce, ou un héros sans nouveauté en attente', () => {
    const p = monter(['magicien', 'guerrier'], 1, 2);
    const h = p.groupe[0]!;
    const ancien = { ...h.choix!, sortsMineurs: [...(h.choix!.sortsMineurs ?? [])].reverse(), sortsPrepares: [...(h.choix!.sortsPrepares ?? [])] };
    const autreSort = sortsEligibles('magicien', 1, srd).find((s) => s.niveau === 1 && !(h.choix!.sortsPrepares ?? []).includes(s.id))!;
    const touche = { ...h.choix!, sortsPrepares: [autreSort.id, ...(h.choix!.sortsPrepares ?? []).slice(1)] };
    expect(moteur.executer(p, { type: 'reviserMontee', personnage: h.id, choix: touche }).refus).toMatch(/niveaux précédents/);
    expect(moteur.executer(p, { type: 'reviserMontee', personnage: h.id, choix: { ...ancien, espece: 'nain' } }).refus).toMatch(/Seuls les nouveaux choix/);
    const guerrier = p.groupe[1]!;
    expect(moteur.executer(p, { type: 'reviserMontee', personnage: guerrier.id, choix: guerrier.choix! }).refus).toMatch(/pas de nouveau choix/);
  });

  it('niveau 4 : une autre amélioration change les PV max ; l’équipement et les PV restent cohérents', () => {
    const p = monter(['guerrier'], 3, 4);
    const h = p.groupe[0]!;
    expect(h.monteeEnAttente).toBe(4);
    const nouveaux = choixDeMontee(h.choix!, srd)!;
    const garde = (h.choix!.ameliorations ?? []).slice(0, nouveaux.ameliorations.figes);
    const propose = { ...h.choix!, ameliorations: [...garde, { con: 2 }] };
    const attendu = calculerFiche(propose, srd);
    expect(attendu.ok).toBe(true);
    const res = moteur.executer(p, { type: 'reviserMontee', personnage: h.id, choix: propose });
    expect(res.refus).toBeUndefined();
    const apres = res.partie.groupe[0]!;
    expect(apres.fiche.pvMax).toBe(attendu.ok ? attendu.fiche.pvMax : -1);
    expect(apres.pv).toBeLessThanOrEqual(apres.fiche.pvMax);
    expect(apres.pv).toBeGreaterThan(0);
    expect(apres.fiche.caracteristiques.con.valeur).toBe(h.fiche.caracteristiques.con.valeur + 2 - ((h.choix!.ameliorations ?? [])[nouveaux.ameliorations.figes]?.con ?? 0));
    // Un motif d'amélioration invalide est refusé.
    expect(moteur.executer(p, { type: 'reviserMontee', personnage: h.id, choix: { ...h.choix!, ameliorations: [...garde, { con: 3 }] } }).refus).toBeDefined();
  });

  it('garder les choix conseillés efface le drapeau sans rien changer', () => {
    const p = monter(['magicien'], 1, 2);
    const h = p.groupe[0]!;
    const res = moteur.executer(p, { type: 'garderMontee', personnage: h.id });
    expect(res.partie.groupe[0]!.monteeEnAttente).toBeUndefined();
    expect(res.partie.groupe[0]!.choix).toEqual(h.choix);
  });

  it('reviserChoixDeMontee, sans le moteur : refuse un choix inchangé pour un héros sans nouveauté', () => {
    const choix = monterAuNiveau(creationRapide({ classe: 'guerrier', espece: 'humain', niveau: 1, nom: 'T' }, srd), 2, srd)!.choix;
    expect(reviserChoixDeMontee(choix, choix, srd).ok).toBe(false);
  });

  it('les deux commandes sont réservées au joueur : le conteur ne les voit pas', () => {
    const noms = outilsDuConteur(moteur).map((o) => o.function.name);
    expect(noms).not.toContain('reviserMontee');
    expect(noms).not.toContain('garderMontee');
  });

  it('une sauvegarde sans le champ reste jouable : aucun refus ni plantage', () => {
    const p = monter(['guerrier'], 1, 2);
    expect(p.groupe[0]!.monteeEnAttente).toBeUndefined();
    expect(JSON.parse(JSON.stringify(p)).groupe[0].monteeEnAttente).toBeUndefined();
  });
});
