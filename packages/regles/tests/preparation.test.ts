// Préparer ses sorts (SRD 5.2.1) : le repos ou le niveau donne le droit de changer sa liste, la commande `changerSortsPrepares`
// le dépense, le conteur n'y touche pas, la sauvegarde reste compatible (champ facultatif, pas de nouvelle version).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  calculerFiche,
  creationRapide,
  creerGenerateur,
  creerMoteur,
  descriptionDroits,
  MODULES_STANDARD,
  outilsDuConteur,
  personnageDepuisFiche,
  prochainChangement,
  recuperer,
  REGLES_PREPARATION,
  sortsEligibles,
  verifierPreparation,
  VERSION_PARTIE,
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
const gen = creerGenerateur(3);

function heros(classe: string, niveau: number, nom = classe): Personnage {
  const choix = creationRapide({ classe, espece: 'humain', niveau, nom }, srd);
  const f = calculerFiche(choix, srd);
  if (!f.ok) throw new Error(f.erreurs.join('\n'));
  return personnageDepuisFiche(f.fiche, { id: nom.toLowerCase(), choix });
}

/** Une partie à l'exploration avec ce groupe, dans un lieu où l'on dort. */
function partieAvec(groupe: Personnage[], graine = 1): Partie {
  const sur = [...dm.lieux.values()].find((l) => l.repos === 'sur')!;
  const p = moteur.executer(moteur.nouvellePartie(groupe, { graine, niveau: groupe[0]!.fiche.niveau }), { type: 'commencer' }).partie;
  return { ...p, scene: { type: 'exploration' }, etat: { ...p.etat, lieu: sur.id } };
}

/** Des sorts de niveau 1 et plus de la liste de la classe que ce héros n'a pas encore. */
const autresSorts = (h: Personnage, n: number) =>
  sortsEligibles(h.fiche.classe, h.fiche.incantation!.emplacements.length, srd)
    .filter((s) => s.niveau > 0 && !h.choix!.sortsPrepares!.includes(s.id) && !h.fiche.sortsAccordes.includes(s.id))
    .slice(0, n)
    .map((s) => s.id);
const autresMineurs = (h: Personnage, n: number) =>
  sortsEligibles(h.fiche.classe, 0, srd)
    .filter((s) => s.niveau === 0 && !h.choix!.sortsMineurs!.includes(s.id))
    .slice(0, n)
    .map((s) => s.id);

describe('la table des règles', () => {
  it('couvre toutes les classes qui lancent des sorts, et elles seules', () => {
    const lanceuses = [...srd.classes.values()].filter((c) => c.incantation).map((c) => c.id).sort();
    expect(Object.keys(REGLES_PREPARATION).sort()).toEqual(lanceuses);
  });
});

describe('le repos donne le droit de changer ses sorts', () => {
  it('Clerc : toute la liste après un Repos long, rien après un Repos court', () => {
    const h = heros('clerc', 3);
    expect(recuperer(h, 'court', gen).join(' ')).not.toMatch(/changer/);
    expect(h.preparation).toBeUndefined();
    const changes = recuperer(h, 'long', gen);
    expect(h.preparation).toEqual({ prepares: 'tous', mineurs: 0 });
    expect(changes.join(' ')).toMatch(/peut changer toute sa liste de sorts préparés/);
  });

  it('Paladin et Rôdeur : un seul sort après un Repos long ; le droit ne se cumule pas d’un repos à l’autre', () => {
    for (const classe of ['paladin', 'rodeur']) {
      const h = heros(classe, 5);
      recuperer(h, 'long', gen);
      expect(h.preparation).toEqual({ prepares: 1, mineurs: 0 });
      // Un second repos sans avoir changé : toujours un sort, et plus de phrase (rien de nouveau à dire).
      expect(recuperer(h, 'long', gen).join(' ')).not.toMatch(/changer/);
      expect(h.preparation).toEqual({ prepares: 1, mineurs: 0 });
    }
  });

  it('Barde, Ensorceleur, Occultiste : rien au repos (c’est le niveau qui le donne)', () => {
    for (const classe of ['barde', 'ensorceleur', 'occultiste']) {
      const h = heros(classe, 3);
      recuperer(h, 'long', gen);
      expect(h.preparation, classe).toBeUndefined();
    }
  });

  it('Magicien : Repos court seulement dès l’aptitude Mémorisation de sort (niveau 5) ; le « tous » du Repos long n’est pas diminué', () => {
    const m1 = heros('magicien', 1);
    recuperer(m1, 'court', gen);
    expect(m1.preparation).toBeUndefined();
    const m5 = heros('magicien', 5);
    recuperer(m5, 'court', gen);
    expect(m5.preparation).toEqual({ prepares: 1, mineurs: 0 });
    recuperer(m5, 'long', gen);
    expect(m5.preparation).toEqual({ prepares: 'tous', mineurs: 0 });
    recuperer(m5, 'court', gen);
    expect(m5.preparation).toEqual({ prepares: 'tous', mineurs: 0 });
  });

  it('les classes sans sorts et les héros sans choix de création ne reçoivent rien', () => {
    const g = heros('guerrier', 3);
    recuperer(g, 'long', gen);
    expect(g.preparation).toBeUndefined();
    const sansChoix = heros('clerc', 3);
    delete sansChoix.choix;
    recuperer(sansChoix, 'long', gen);
    expect(sansChoix.preparation).toBeUndefined();
  });

  it('une nuit complète par le moteur donne le droit ; une halte, non', () => {
    for (let graine = 1; graine < 40; graine++) {
      const p = partieAvec([heros('clerc', 3)], graine);
      const jour = p.etat.jour;
      const halte = moteur.executer(p, { type: 'seReposer', duree: 'court' });
      expect(halte.partie.groupe[0]!.preparation).toBeUndefined();
      const nuit = moteur.executer(p, { type: 'seReposer', duree: 'long' });
      if (nuit.partie.etat.jour === jour) continue; // nuit interrompue : une autre graine
      expect(nuit.partie.groupe[0]!.preparation).toEqual({ prepares: 'tous', mineurs: 0 });
      expect(nuit.evenements.some((e) => e.type === 'constat' && /peut changer toute sa liste/.test(e.texte))).toBe(true);
      return;
    }
    throw new Error('aucune nuit complète en 40 essais');
  });
});

describe('le niveau donne le droit de remplacer un sort', () => {
  /** Un héros de niveau `niveau` que le moteur fait monter d'un niveau avec l'XP du groupe. */
  function monter(classe: string, niveau: number) {
    let p = partieAvec([heros(classe, niveau)]);
    p = { ...p, scene: { type: 'rencontre', rencontre: [...dm.rencontres.keys()][0]! } };
    const seuils = [0, 300, 900, 2700, 6500];
    return moteur.executer(p, { type: 'reglerRencontre', issue: 'victoire', px: seuils[niveau]! - p.etat.xp });
  }

  it('Barde, Ensorceleur, Occultiste : un sort préparé et un sort mineur ; Clerc : un sort mineur seulement', () => {
    for (const classe of ['barde', 'ensorceleur', 'occultiste']) {
      const res = monter(classe, 1);
      expect(res.partie.groupe[0]!.fiche.niveau, classe).toBe(2);
      expect(res.partie.groupe[0]!.preparation, classe).toEqual({ prepares: 1, mineurs: 1 });
      expect(res.evenements.some((e) => e.type === 'constat' && /peut changer 1 sort préparé et 1 sort mineur/.test(e.texte)), classe).toBe(true);
    }
    expect(monter('clerc', 1).partie.groupe[0]!.preparation).toEqual({ prepares: 0, mineurs: 1 });
  });

  it('Paladin : le niveau ne donne rien (c’est le Repos long)', () => {
    expect(monter('paladin', 1).partie.groupe[0]!.preparation).toBeUndefined();
  });
});

describe('changerSortsPrepares', () => {
  it('Clerc après un Repos long : toute la liste change, fiche et choix suivent, le droit s’éteint', () => {
    const h = heros('clerc', 3);
    recuperer(h, 'long', gen);
    const nouveaux = autresSorts(h, h.choix!.sortsPrepares!.length);
    const p = partieAvec([h]);
    const res = moteur.executer(p, { type: 'changerSortsPrepares', personnage: h.id, prepares: nouveaux });
    expect(res.refus).toBeUndefined();
    const apres = res.partie.groupe[0]!;
    expect(apres.fiche.sortsPrepares).toEqual(nouveaux);
    expect(apres.choix!.sortsPrepares).toEqual(nouveaux);
    expect(apres.preparation).toBeUndefined();
    expect(apres.fiche.ca).toBe(h.fiche.ca);
    expect(res.evenements.some((e) => e.type === 'constat' && /change ses sorts — sorts préparés/.test(e.texte))).toBe(true);
    // Plus de droit : un second changement est refusé.
    expect(moteur.executer(res.partie, { type: 'changerSortsPrepares', personnage: h.id, prepares: h.choix!.sortsPrepares! }).refus).toMatch(/ne peut pas changer ses sorts maintenant/);
  });

  it('Paladin : un seul sort remplacé ; deux sont refusés ; le droit restant est dépensé', () => {
    const h = heros('paladin', 5);
    recuperer(h, 'long', gen);
    const actuels = h.choix!.sortsPrepares!;
    const [a, b] = autresSorts(h, 2);
    const deux = [a!, b!, ...actuels.slice(2)];
    const refus = verifierPreparation(h, { prepares: deux }, srd);
    expect(refus.ok).toBe(false);
    if (!refus.ok) expect(refus.erreur).toMatch(/ne peut remplacer que 1 sort préparé/);
    const un = [a!, ...actuels.slice(1)];
    const ok = verifierPreparation(h, { prepares: un }, srd);
    expect(ok.ok).toBe(true);
    const res = moteur.executer(partieAvec([h]), { type: 'changerSortsPrepares', personnage: h.id, prepares: un });
    expect(res.refus).toBeUndefined();
    expect(res.partie.groupe[0]!.preparation).toBeUndefined();
    expect(res.partie.groupe[0]!.fiche.sortsPrepares).toContain(a);
  });

  it('Barde au niveau 2 : un sort préparé et un sort mineur remplacés ; deux sorts mineurs refusés', () => {
    const h = heros('barde', 2);
    h.preparation = { prepares: 1, mineurs: 1 };
    const [neuf] = autresSorts(h, 1);
    const mineurs = autresMineurs(h, 2);
    const prepares = [neuf!, ...h.choix!.sortsPrepares!.slice(1)];
    const m1 = [mineurs[0]!, ...h.choix!.sortsMineurs!.slice(1)];
    const ok = moteur.executer(partieAvec([h]), { type: 'changerSortsPrepares', personnage: h.id, prepares, mineurs: m1 });
    expect(ok.refus).toBeUndefined();
    expect(ok.partie.groupe[0]!.fiche.sortsMineurs).toEqual(m1);
    expect(ok.partie.groupe[0]!.preparation).toBeUndefined();
    const m2 = [mineurs[0]!, mineurs[1]!, ...h.choix!.sortsMineurs!.slice(2)];
    const refus = verifierPreparation(h, { prepares: h.choix!.sortsPrepares!, mineurs: m2 }, srd);
    expect(refus.ok).toBe(false);
  });

  it('les refus : sans droit, rien de changé, sort hors de la liste, trop de sorts, doublon, héros sans choix', () => {
    const h = heros('clerc', 3);
    const actuels = h.choix!.sortsPrepares!;
    const [neuf] = autresSorts(h, 1);
    expect(verifierPreparation(h, { prepares: [neuf!, ...actuels.slice(1)] }, srd)).toMatchObject({ ok: false });
    h.preparation = { prepares: 'tous', mineurs: 0 };
    expect(verifierPreparation(h, { prepares: actuels }, srd)).toMatchObject({ ok: false, erreur: 'Rien n’a changé.' });
    // Un sort de Magicien qui n'est pas dans la liste du Clerc.
    const horsListe = sortsEligibles('magicien', 2, srd).find((s) => s.niveau === 1 && !s.classes.includes('clerc'))!;
    expect(verifierPreparation(h, { prepares: [horsListe.id, ...actuels.slice(1)] }, srd)).toMatchObject({ ok: false });
    // Un de plus que la place en mémoire.
    expect(verifierPreparation(h, { prepares: [...actuels, neuf!] }, srd)).toMatchObject({ ok: false });
    // Un sort de niveau trop élevé (pas d'emplacement).
    const trop = sortsEligibles('clerc', 9, srd).find((s) => s.niveau === 5)!;
    expect(verifierPreparation(h, { prepares: [trop.id, ...actuels.slice(1)] }, srd)).toMatchObject({ ok: false });
    // Sans choix de création : refus clair.
    const sans = { ...h, choix: undefined };
    expect(verifierPreparation(sans, { prepares: [neuf!] }, srd)).toMatchObject({ ok: false });
    // Un doublon dans la proposition compte pour un seul sort (la liste est dédoublonnée).
    const dedoublonne = verifierPreparation(h, { prepares: [neuf!, neuf!, ...actuels.slice(2)] }, srd);
    expect(dedoublonne.ok && dedoublonne.sortsPrepares.length).toBe(actuels.length - 1);
  });

  it('refusée pendant une rencontre et pour un héros inconnu ; un héros sans choix ne peut rien changer', () => {
    const h = heros('clerc', 3);
    h.preparation = { prepares: 'tous', mineurs: 0 };
    const [neuf] = autresSorts(h, 1);
    const ordre = { type: 'changerSortsPrepares', personnage: h.id, prepares: [neuf!, ...h.choix!.sortsPrepares!.slice(1)] };
    const p = partieAvec([h]);
    const enCombat = { ...p, scene: { type: 'rencontre' as const, rencontre: [...dm.rencontres.keys()][0]! } };
    expect(moteur.executer(enCombat, ordre).refus).toMatch(/hors rencontre/);
    expect(moteur.executer(p, { ...ordre, personnage: 'inconnu' }).refus).toMatch(/Aucun héros/);
    expect(moteur.executer(p, ordre).refus).toBeUndefined();
  });
});

describe('ce que le joueur voit', () => {
  it('l’onglet Grimoire dit « n / max » et quand changer ; le bouton n’apparaît qu’avec le droit', () => {
    const h = heros('clerc', 3);
    let p = partieAvec([h]);
    const ligne = () => moteur.encarts(p).find((e) => e.id === `grimoire:${h.id}`)!.lignes!.find((l) => l.libelle === 'Sorts préparés')!;
    const max = h.fiche.incantation!.sortsPrepares;
    expect(ligne().valeur).toBe(`${h.fiche.sortsPrepares.length} / ${max}`);
    expect(ligne().detail).toMatch(/Changement possible : toute la liste après un Repos long/);
    expect(moteur.propositions(p).some((x) => x.intention === 'preparer')).toBe(false);
    p.groupe[0]!.preparation = { prepares: 'tous', mineurs: 1 };
    expect(ligne().detail).toMatch(/Peut changer : toute sa liste de sorts préparés et 1 sort mineur/);
    const bouton = moteur.propositions(p).find((x) => x.intention === 'preparer')!;
    expect(bouton.groupe.onglet).toBe('Grimoire');
    expect(bouton.ordre).toEqual({ type: 'changerSortsPrepares', personnage: h.id });
    // Pendant une rencontre, le bouton disparaît.
    p = { ...p, scene: { type: 'rencontre', rencontre: [...dm.rencontres.keys()][0]! } };
    expect(moteur.propositions(p).some((x) => x.intention === 'preparer')).toBe(false);
  });

  it('les phrases : droits en mots, moment du prochain changement', () => {
    expect(descriptionDroits(undefined)).toBe('');
    expect(descriptionDroits({ prepares: 0, mineurs: 0 })).toBe('');
    expect(descriptionDroits({ prepares: 2, mineurs: 1 })).toBe('2 sorts préparés et 1 sort mineur');
    expect(prochainChangement(heros('barde', 3))).toBe('1 sort à chaque niveau gagné');
    expect(prochainChangement(heros('paladin', 5))).toBe('1 sort après un Repos long');
    expect(prochainChangement(heros('magicien', 5))).toMatch(/Repos court/);
    expect(prochainChangement(heros('guerrier', 3))).toBe('');
  });
});

describe('le conteur et la sauvegarde', () => {
  it('la commande est réservée au joueur : la liste d’outils du conteur ne change pas', () => {
    const noms = outilsDuConteur(moteur).map((o) => o.function.name);
    expect(noms).not.toContain('changerSortsPrepares');
    expect(moteur.commandes().map((c) => c.type)).toContain('changerSortsPrepares');
    expect(JSON.stringify(outilsDuConteur(moteur))).toBe(JSON.stringify(outilsDuConteur(moteur)));
  });

  it('pas de nouvelle version : le droit est un champ facultatif qui passe par la sauvegarde', () => {
    expect(VERSION_PARTIE).toBe(4);
    const h = heros('clerc', 3);
    h.preparation = { prepares: 'tous', mineurs: 0 };
    const p = partieAvec([h]);
    const relue = JSON.parse(JSON.stringify(p)) as Partie;
    expect(relue.groupe[0]!.preparation).toEqual({ prepares: 'tous', mineurs: 0 });
    const [neuf] = autresSorts(h, 1);
    expect(moteur.executer(relue, { type: 'changerSortsPrepares', personnage: h.id, prepares: [neuf!, ...h.choix!.sortsPrepares!.slice(1)] }).refus).toBeUndefined();
    // Une vieille sauvegarde (sans le champ) se joue comme avant.
    const ancienne = JSON.parse(JSON.stringify(partieAvec([heros('clerc', 3)]))) as Partie;
    expect(ancienne.groupe[0]!.preparation).toBeUndefined();
    expect(moteur.executer(ancienne, { type: 'seReposer', duree: 'court' }).refus).toBeUndefined();
  });
});
