import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { bilanPersonnage, commande, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, POTION_DE_COMBAT, type ElementGrille, type Encart, type Module, type Partie, type Personnage } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(RACINE_MONDES, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const moteur = creerMoteur({ dm: r.monde, srd }, MODULES_STANDARD);

/** Un module de test qui met des objets dans le sac par une commande : le noyau en déduit les événements d'obtention. */
const don: Module = {
  id: 'don',
  commandes: {
    donner: commande({
      description: 'Met un objet dans le sac (test).',
      entree: z.object({ objet: z.string(), quantite: z.number() }),
      executer: (t, e) => {
        t.partie.etat.inventaire[e.objet] = (t.partie.etat.inventaire[e.objet] ?? 0) + e.quantite;
      },
    }),
  },
};
const moteurDon = creerMoteur({ dm: r.monde, srd }, [...MODULES_STANDARD, don]);

/** Le groupe conseillé du créateur : de vrais personnages, avec leurs sorts préparés. */
function groupe(): Personnage[] {
  return groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
}

function depart(): Partie {
  return moteur.executer(moteur.nouvellePartie(groupe(), { graine: 11, niveau: 3 }), { type: 'commencer' }).partie;
}

const perso = (p: Partie, id: string) => p.groupe.find((a) => a.id === id)!;
const encart = (p: Partie, id: string) => moteur.encarts(p).find((e) => e.id === id) as Encart;
const sac = (p: Partie) => encart(p, 'sac-objets').grille!;
const element = (p: Partie, id: string) => sac(p).elements.find((e) => e.id === id) as ElementGrille;

describe('module Inventaire', () => {
  it('une potion du sac soigne le plus blessé ; une potion confiée se boira en combat', () => {
    let p = depart();
    p.etat.inventaire[POTION_DE_COMBAT] = 2;
    perso(p, 'pip').pv = 3;
    const soin = moteur.executer(p, { type: 'utiliserObjet', objet: POTION_DE_COMBAT });
    expect(soin.refus).toBeUndefined();
    p = soin.partie;
    expect(perso(p, 'pip').pv).toBeGreaterThan(3);
    expect(p.etat.inventaire[POTION_DE_COMBAT]).toBe(1);
    expect(soin.evenements).toContainEqual({ type: 'objetUtilise', objet: POTION_DE_COMBAT, personnage: 'pip' });
    expect(soin.evenements).toContainEqual(expect.objectContaining({ type: 'objetPerdu', objet: POTION_DE_COMBAT }));

    const confie = moteur.executer(p, { type: 'confierPotion', personnage: 'grukk' });
    p = confie.partie;
    expect(perso(p, 'grukk').ressources.potions).toBe(2);
    expect(p.etat.inventaire[POTION_DE_COMBAT]).toBeUndefined();
    expect(moteur.executer(p, { type: 'confierPotion' }).refus).toMatch(/plus de potion/);
  });

  it('une potion confiée à un héros se voit dans ce que porte le héros, et peut être rendue au sac', () => {
    let p = depart();
    p.etat.inventaire[POTION_DE_COMBAT] = 1;
    const avant = perso(p, 'grukk').ressources.potions ?? 0;
    const charge = (q: Partie) => (sac(q).resume?.find((l) => l.libelle === 'Charge du groupe')?.valeur ?? '');
    const chargeAvant = charge(p);
    p = moteur.executer(p, { type: 'confierPotion', personnage: 'grukk' }).partie;
    expect(charge(p)).toBe(chargeAvant); // la potion change de main : la charge du groupe ne bouge pas
    const porte = element(p, 'porte:grukk:' + POTION_DE_COMBAT);
    expect(porte).toBeDefined();
    expect(porte.quantite).toBe(avant + 1);
    expect(porte.porteur).toMatchObject({ id: 'grukk' });
    expect(porte.groupe.id).toBe('porte:grukk'); // avec le reste de ce que porte Grukk
    expect(sac(p).elements.find((e) => e.id === POTION_DE_COMBAT)).toBeUndefined(); // plus dans le sac
    // Le bouton « Rendre au sac » est proposé pour cet élément, et le joue.
    const rendre = moteur.propositions(p).find((x) => x.ordre?.type === 'rendrePotion' && x.ordre.personnage === 'grukk');
    expect(rendre?.element?.id).toBe('porte:grukk:' + POTION_DE_COMBAT);
    const retour = moteur.executer(p, rendre!.ordre!);
    expect(retour.refus).toBeUndefined();
    expect(perso(retour.partie, 'grukk').ressources.potions).toBe(avant);
    expect(retour.partie.etat.inventaire[POTION_DE_COMBAT]).toBe(1);
    expect(charge(retour.partie)).toBe(chargeAvant);
    // Sans potion portée : refusé, et plus de ligne dans la grille.
    perso(retour.partie, 'grukk').ressources.potions = 0;
    expect(moteur.executer(retour.partie, { type: 'rendrePotion', personnage: 'grukk' }).refus).toMatch(/aucune potion/);
    expect(sac(retour.partie).elements.find((e) => e.id === 'porte:grukk:' + POTION_DE_COMBAT)).toBeUndefined();
  });

  it("refuse ce qui n'a pas de sens : objet absent, personne blessé, objet de quête jeté", () => {
    const p = depart();
    expect(moteur.executer(p, { type: 'utiliserObjet', objet: POTION_DE_COMBAT }).refus).toMatch(/pas cet objet/);
    p.etat.inventaire[POTION_DE_COMBAT] = 1;
    expect(moteur.executer(p, { type: 'utiliserObjet', objet: POTION_DE_COMBAT }).refus).toMatch(/besoin de soins/);
    const quete = [...r.monde.objets.values()].find((o) => o.categorie === 'quete')!;
    p.etat.inventaire[quete.id] = 1;
    expect(moteur.executer(p, { type: 'jeterObjet', objet: quete.id }).refus).toMatch(/trop important/);
  });

  it("identifier : un jet d'Arcanes ; réussi, l'objet est connu et son histoire racontée", () => {
    const p = depart();
    p.etat.inventaire['braise-de-veille'] = 1;
    let reussi: Partie | undefined;
    // On essaie quelques graines : le résultat dépend des dés, la mécanique non.
    for (let g = 1; g < 40 && !reussi; g++) {
      const res = moteur.executer({ ...p, graine: g }, { type: 'identifierObjet', objet: 'braise-de-veille' });
      expect(res.evenements[0]).toMatchObject({ type: 'jet', jet: { test: 'arcanes', dd: 14 } });
      if (res.evenements.some((e) => e.type === 'objetIdentifie')) reussi = res.partie;
    }
    expect(reussi).toBeDefined();
    expect((reussi!.modules['inventaire'] as { identifies: string[] }).identifies).toContain('braise-de-veille');
    expect(moteur.executer(reussi!, { type: 'identifierObjet', objet: 'braise-de-veille' }).refus).toMatch(/pas de secret/);
  });

  it("l'onglet Sac montre la bourse, les potions portées et le contenu du sac, avec ses boutons", () => {
    const p = depart();
    p.etat.inventaire[POTION_DE_COMBAT] = 1;
    p.etat.inventaire['rations'] = 3;
    expect(sac(p).elements.map((e) => `${e.quantite} × ${e.titre}`)).toEqual(expect.arrayContaining(['1 × Potion de guérison', '3 × Rations']));
    expect(sac(p).resume!.map((l) => l.libelle)).toEqual(['Pièces', 'Charge du groupe']);
    expect(encart(p, 'sac-potions').lignes).toHaveLength(6);
    const boutons = moteur.propositions(p).filter((x) => x.groupe.onglet === 'Sac');
    expect(boutons.some((x) => x.ordre?.type === 'confierPotion')).toBe(true);
    expect(boutons.some((x) => x.ordre?.type === 'utiliserObjet' && x.ordre.objet === 'rations')).toBe(true);
  });

  it('la grille range les objets par groupe, avec rareté, mesures et image ; chaque objet a ses boutons', () => {
    const p = depart();
    p.etat.inventaire[POTION_DE_COMBAT] = 2;
    p.etat.inventaire['rations'] = 3;
    const quete = [...r.monde.objets.values()].find((o) => o.categorie === 'quete')!;
    p.etat.inventaire[quete.id] = 1;
    p.etat.inventaire['marteau-du-premier-forgeron'] = 1;
    expect(element(p, POTION_DE_COMBAT).groupe.id).toBe('consommables');
    expect(element(p, quete.id)).toMatchObject({ groupe: { id: 'quete' }, ton: 'fort' });
    expect(element(p, 'marteau-du-premier-forgeron')).toMatchObject({ groupe: { id: 'armes' }, rarete: 'rare', image: { groupe: 'objets', id: 'marteau-du-premier-forgeron' }, icone: 'arme' });
    expect(element(p, 'marteau-du-premier-forgeron').mesures!.map((m) => m.id)).toContain('valeur');
    const actions = (id: string) => moteur.propositions(p).filter((x) => x.groupe.onglet === 'Sac' && x.element?.id === id);
    expect(actions(quete.id)).toEqual([]);
    expect(actions('rations').some((x) => x.libelle === 'Jeter 1' && x.confirmer)).toBe(true);
    expect(actions('rations').some((x) => x.libelle === 'Jeter les 3' && x.ordre?.quantite === 3)).toBe(true);
    const soin = actions(POTION_DE_COMBAT).find((x) => x.choix);
    expect(soin?.choix?.options).toHaveLength(6);
    expect(soin?.choix?.options.every((o) => o.personnage === o.valeur)).toBe(true);
  });

  it("la pastille « nouveau » : un objet obtenu l'est jusqu'à ce qu'on le regarde, ou qu'il quitte le sac", () => {
    let p = moteurDon.executer(depart(), { type: 'donner', objet: 'rations', quantite: 2 }).partie;
    p = moteurDon.executer(p, { type: 'donner', objet: 'corde', quantite: 1 }).partie;
    expect(element(p, 'rations')).toMatchObject({ nouveau: true, ordreVu: { type: 'voirObjet', objet: 'rations' } });
    p = moteurDon.executer(p, element(p, 'rations').ordreVu!).partie;
    expect(element(p, 'rations').nouveau).toBeUndefined();
    expect(element(p, 'corde').nouveau).toBe(true);
    p = moteurDon.executer(p, { type: 'jeterObjet', objet: 'corde' }).partie;
    expect((p.modules['inventaire'] as { nouveaux: string[] }).nouveaux).not.toContain('corde');
  });

  it('un objet à identifier reste mystérieux (nom, description, histoire) jusqu’à ce qu’il soit étudié', () => {
    let p = depart();
    p.etat.inventaire['braise-de-veille'] = 1;
    const avant = element(p, 'braise-de-veille');
    expect(avant).toMatchObject({ titre: 'Pendentif de bronze', inconnu: true, histoire: undefined });
    expect(avant.proprietes).toEqual([{ libelle: 'À étudier', valeur: 'Arcanes, DD 14' }]);
    expect(moteur.propositions(p).some((x) => x.element?.id === 'braise-de-veille' && x.choix?.options.some((o) => o.detail?.startsWith('Arcanes')))).toBe(true);
    for (let g = 1; g < 40 && element(p, 'braise-de-veille').inconnu; g++) p = moteur.executer({ ...p, graine: g }, { type: 'identifierObjet', objet: 'braise-de-veille' }).partie;
    expect(element(p, 'braise-de-veille')).toMatchObject({ titre: 'Braise de veille', inconnu: undefined });
    expect(element(p, 'braise-de-veille').histoire).toMatch(/étincelle/);
  });

  it('un objet magique reconnu porte un repère (quelle que soit sa rareté) ; un objet ordinaire ou à identifier, non', () => {
    const p = depart();
    p.etat.inventaire['anneau-d-invisibilite'] = 1;
    p.etat.inventaire['rations'] = 1;
    p.etat.inventaire['braise-de-veille'] = 1;
    expect(element(p, 'anneau-d-invisibilite').magique).toBe(true);
    expect(element(p, 'rations').magique).toBeUndefined();
    // Un objet à identifier ne trahit pas sa nature.
    expect(element(p, 'braise-de-veille')).toMatchObject({ inconnu: true, magique: undefined });
  });

  it("soigner un héros précis : refusé s'il n'est pas blessé, sinon c'est lui qui est soigné", () => {
    const p = depart();
    p.etat.inventaire[POTION_DE_COMBAT] = 2;
    perso(p, 'pip').pv = 3;
    expect(moteur.executer(p, { type: 'utiliserObjet', objet: POTION_DE_COMBAT, personnage: 'grukk' }).refus).toMatch(/Grukk n’a pas besoin de soins/);
    const res = moteur.executer(p, { type: 'utiliserObjet', objet: POTION_DE_COMBAT, personnage: 'pip' });
    expect(res.refus).toBeUndefined();
    expect(perso(res.partie, 'pip').pv).toBeGreaterThan(3);
  });
});

describe('module Grimoire', () => {
  it('Hilda lance Soins hors combat : un emplacement dépensé, le plus blessé soigné', () => {
    let p = depart();
    perso(p, 'bran').pv = 2;
    const avant = [...perso(p, 'hilda').emplacements];
    const res = moteur.executer(p, { type: 'lancerSort', lanceur: 'hilda', sort: 'soins' });
    expect(res.refus).toBeUndefined();
    p = res.partie;
    expect(perso(p, 'bran').pv).toBeGreaterThan(2);
    expect(perso(p, 'hilda').emplacements[0]).toBe(avant[0]! - 1);
    expect(res.evenements).toContainEqual(expect.objectContaining({ type: 'sortLance', lanceur: 'hilda', sort: 'soins', niveau: 1, cibles: ['bran'] }));
    expect(res.evenements).toContainEqual({ type: 'ressourceChange', personnage: 'hilda', ressource: 'emplacement-1', avant: avant[0], apres: avant[0]! - 1 });
  });

  it('refuse un sort inconnu, un sort qui n’est pas de soins, ou sans emplacement', () => {
    const p = depart();
    perso(p, 'bran').pv = 2;
    expect(moteur.executer(p, { type: 'lancerSort', lanceur: 'bran', sort: 'soins' }).refus).toMatch(/ne connaît pas/);
    expect(moteur.executer(p, { type: 'lancerSort', lanceur: 'hilda', sort: 'aide' }).refus).toMatch(/en combat/);
    perso(p, 'hilda').emplacements = [0, 0];
    expect(moteur.executer(p, { type: 'lancerSort', lanceur: 'hilda', sort: 'soins' }).refus).toMatch(/plus d'emplacement/);
  });

  it("l'onglet Grimoire : un encart par lanceur, emplacements et sorts ; des boutons de soins", () => {
    const p = depart();
    const ids = moteur.encarts(p).filter((e) => e.onglet === 'Grimoire').map((e) => e.id);
    expect(ids).toEqual(expect.arrayContaining(['grimoire:hilda', 'grimoire:ambrine', 'grimoire:sylvaine']));
    expect(encart(p, 'grimoire:hilda').lignes!.map((l) => l.libelle)).toEqual(expect.arrayContaining(['Emplacements de niveau 1', 'Soins', 'Mot de guérison']));
    const boutons = moteur.propositions(p).filter((x) => x.groupe.onglet === 'Grimoire');
    expect(boutons.every((x) => x.desactivee === 'Personne n’est blessé.')).toBe(true);
  });
});

describe('module Journal', () => {
  it('les quêtes reçues apparaissent avec leurs étapes ; les notes reprennent les faits sûrs', () => {
    let p = depart();
    expect(encart(p, 'quetes-en-cours').texte).toMatch(/Aucune quête/);
    for (const o of [{ type: 'aller', vers: 'vei-maison-des-gardiens' }, { type: 'parler', pnj: 'hesta-cendrebrune' }, { type: 'parler', pnj: 'hesta-cendrebrune', sujet: 'la-lanterne' }]) {
      const res = moteur.executer(p, o);
      expect(res.refus).toBeUndefined();
      p = res.partie;
    }
    const quetes = encart(p, 'quetes-en-cours').lignes!;
    expect(quetes[0]!.libelle).toBe('La Lanterne faiblit');
    expect(quetes[0]!.valeur).toBe('Quête principale');
    expect(quetes[0]!.detail).toMatch(/→/);
    expect(moteur.encarts(p).filter((e) => e.id.startsWith('codex-')).some((e) => (e.lignes ?? []).length > 0)).toBe(true);
  });
});

describe('module Scènes narrées', () => {
  const file = (p: Partie) => (p.modules['scenes'] as { file: string[]; vues: string[] }).file;
  const vues = (p: Partie) => (p.modules['scenes'] as { file: string[]; vues: string[] }).vues;

  it("l'ouverture se joue au début de l'histoire ; une fois terminée, elle se revoit depuis le journal", () => {
    let p = depart();
    expect(file(p)).toEqual(['ouverture']);
    expect(p.journal).toContainEqual({ type: 'sceneNarree', scene: 'ouverture' });
    expect(moteur.vue<{ id: string; plans: unknown[] }>('sceneEnCours', p)).toMatchObject({ id: 'ouverture', presentation: 'film' });
    p = moteur.executer(p, { type: 'terminerScene', scene: 'ouverture' }).partie;
    expect(file(p)).toEqual([]);
    expect(vues(p)).toEqual(['ouverture']);
    expect(moteur.propositions(p).find((x) => x.ordre?.type === 'revoirScene')).toMatchObject({ libelle: 'Revoir : Le Val des Cendres' });
    p = moteur.executer(p, { type: 'revoirScene', scene: 'ouverture' }).partie;
    expect(file(p)).toEqual(['ouverture']);
  });

  it('une quête qui démarre et un lieu atteint déclenchent leur scène, une seule fois', () => {
    let p = depart();
    p = moteur.executer(p, { type: 'terminerScene', scene: 'ouverture' }).partie;
    for (const o of [{ type: 'aller', vers: 'vei-maison-des-gardiens' }, { type: 'parler', pnj: 'hesta-cendrebrune' }, { type: 'parler', pnj: 'hesta-cendrebrune', sujet: 'la-lanterne' }]) p = moteur.executer(p, o).partie;
    expect(file(p)).toEqual(['la-lanterne-faiblit']);
    p = moteur.executer(p, { type: 'terminerScene', scene: 'la-lanterne-faiblit' }).partie;
    // Le hall du sceau : la scène se joue à la première entrée, pas à la seconde.
    p = { ...p, etat: { ...p.etat, lieu: 'haute-forge' } };
    p = moteur.executer(p, { type: 'aller', vers: 'hf-hall-du-sceau' }).partie;
    expect(file(p)).toEqual(['la-haute-forge']);
    p = moteur.executer(p, { type: 'terminerScene', scene: 'la-haute-forge' }).partie;
    p = moteur.executer(moteur.executer(p, { type: 'aller', vers: 'haute-forge' }).partie, { type: 'aller', vers: 'hf-hall-du-sceau' }).partie;
    expect(file(p)).toEqual([]);
  });

  it('les fichiers livrés avec le monde (images, voix et leurs fiches) ne sont pas des données de module', () => {
    for (const dossier of Object.keys(r.monde.extensions ?? {})) expect(['scenes', 'dilemmes', 'savoirs', 'interjections', 'examens', 'codex']).toContain(dossier);
  });

  it('la validation signale une scène qui cite un lieu, une quête ou une image inexistants', () => {
    const faux = { ...r.monde, extensions: { scenes: [{ id: 'x', nom: 'X', declencheur: { lieu: 'nulle-part' }, plans: [{ image: { groupe: 'pnj', id: 'personne' }, texte: 'Rien.' }] }] } };
    const erreurs = MODULES_STANDARD.find((m) => m.id === 'scenes')!.valider!({ dm: faux });
    expect(erreurs.join('\n')).toMatch(/lieu inconnu « nulle-part »/);
    expect(erreurs.join('\n')).toMatch(/image inconnue « pnj\/personne »/);
  });
});
