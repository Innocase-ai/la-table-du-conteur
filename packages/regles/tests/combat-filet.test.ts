// Filet de sécurité du combat (14/11/2026) : invariants de l'état tout au long de parties jouées par l'IA, vue sans triche, IA normale,
// quelques règles sans test (mort massive, Ralentissement, Enchaînement, Poussée), et la fin d'un combat d'histoire jusqu'au récit.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, heroCombatDe, MODULES_STANDARD, personnageDepuisFiche, resultatDeCombat, type Partie, type Rencontre } from '../src';
import { heroDepuisFiche, monstreDepuisProfil } from '../src/combat/creation';
import { aEtat, combattant, horsCombat, type AttaqueArme, type Combattant, type EtatCombat } from '../src/combat/etat';
import { grilleDepuisTexte } from '../src/combat/grille';
import { IA_NORMALE, IA_RAPIDE, jouerTourIA, vueDe, type OptionsIA } from '../src/combat/ia';
import { adapterRencontre } from '../src/combat/echelle';
import { attaqueArme, creerCombat, finTour, infligerDegats, vitesse } from '../src/combat/moteur';
import { HEROS_PRE_TIRES, preparerRencontre, RENCONTRES } from '../src/combat/prototype';
import { chargerDonneesSrd } from '../src/donnees-node';
import { calculerFiche } from '../src/fiche';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };
const ARENE = grilleDepuisTexte(Array.from({ length: 5 }, () => '..............'));

function fiche(nom: string) {
  const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === nom)!;
  const r = calculerFiche(h.choix, donnees);
  if (!r.ok) throw new Error(r.erreurs.join());
  return r.fiche;
}
const bran = (x: number, y: number): Combattant => {
  const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === 'Bran')!;
  return heroDepuisFiche(fiche('Bran'), h.kit, donnees, { x, y });
};
const gobelin = (id: string, x: number, y: number): Combattant => monstreDepuisProfil(donnees.monstres.get('combattant-gobelin')!, id, { x, y });
/** Le premier combattant joue en premier. */
const combat = (combattants: Combattant[], des: number[] = []): EtatCombat => {
  const etat = creerCombat(ARENE, combattants.map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), 1, { elan: false });
  etat.desImposes = [...des];
  return etat;
};

// ---------------------------------------------------------------------------
// Invariants
// ---------------------------------------------------------------------------

/** Ce qui doit rester vrai de l'état d'un combat, à tout moment. Renvoie les écarts trouvés. */
function ecarts(etat: EtatCombat): string[] {
  const res: string[] = [];
  const ids = etat.combattants.map((c) => c.id);
  if (new Set(ids).size !== ids.length) res.push('identifiants en double');
  if ([...etat.ordre].sort().join() !== [...ids].sort().join()) res.push("l'ordre d'initiative ne reprend pas les combattants");
  if (etat.actif < 0 || etat.actif >= etat.ordre.length) res.push(`actif hors de l'ordre (${etat.actif})`);
  for (const c of etat.combattants) {
    const qui = `${c.id} (${c.nom})`;
    if (!(c.pv >= 0 && c.pv <= c.pvMax)) res.push(`${qui} : PV ${c.pv} hors de 0..${c.pvMax}`);
    if (c.pvTemp < 0) res.push(`${qui} : PV temporaires négatifs`);
    if (c.mort && c.pv !== 0) res.push(`${qui} : mort avec ${c.pv} PV`);
    if (c.tour.mouvement < 0) res.push(`${qui} : mouvement négatif (${c.tour.mouvement})`);
    if (c.jetsMort.echecs > 3 || c.jetsMort.succes > 3) res.push(`${qui} : jets contre la mort hors limites`);
    if (c.incantation?.emplacements.some((n) => n < 0)) res.push(`${qui} : emplacement de sort négatif`);
    if (c.camp === 'monstres' && c.pv === 0 && !c.mort) res.push(`${qui} : monstre à 0 PV non mort`);
    if (!c.mort && !c.enFuite && etat.combattants.some((o) => o !== c && o.id !== c.id && !o.mort && !o.enFuite && o.position.x === c.position.x && o.position.y === c.position.y)) {
      res.push(`${qui} : deux créatures sur la même case`);
    }
  }
  const actifs = (camp: string) => etat.combattants.filter((c) => c.camp === camp && !horsCombat(c) && !aEtat(c, 'inconscient')).length;
  if (etat.vainqueur) {
    const perdant = etat.vainqueur === 'heros' ? 'monstres' : 'heros';
    if (actifs(perdant)) res.push(`vainqueur ${etat.vainqueur} alors que le camp adverse a encore des combattants`);
  } else if (!actifs('heros') || !actifs('monstres')) res.push('un camp est à terre mais le combat continue');
  return res;
}

function jouerEnVerifiant(etat: EtatCombat, options: OptionsIA, tours = 400): void {
  let round = etat.round;
  for (let t = 0; t < tours && !etat.vainqueur && etat.round < 40; t++) {
    jouerTourIA(etat, ctx, options);
    const e = ecarts(etat);
    expect(e, `tour ${t}, round ${etat.round}\n${etat.journal.slice(-8).map((x) => x.texte).join('\n')}`).toEqual([]);
    expect(etat.round).toBeGreaterThanOrEqual(round);
    round = etat.round;
  }
}

describe('invariants de l’état tout au long d’un combat joué par l’IA', () => {
  for (const r of RENCONTRES) {
    for (const graine of [3, 11]) {
      it(`${r.nom}, graine ${graine} : l’état reste cohérent à chaque tour`, () => {
        const { grille, combattants } = preparerRencontre(r, donnees);
        jouerEnVerifiant(creerCombat(grille, combattants, graine), IA_RAPIDE);
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Vue sans triche et IA normale
// ---------------------------------------------------------------------------

describe('la vue sans triche de l’IA', () => {
  it('remplace les PV exacts des adversaires par ce qu’on en voit, sans toucher à l’état réel', () => {
    const etat = combat([gobelin('g1', 8, 2), bran(1, 2)]);
    const hero = combattant(etat, 'bran');
    const pvMax = hero.pvMax;
    const vue = (pv: number) => {
      hero.pv = pv;
      return combattant(vueDe(etat, 'monstres'), 'bran').pv;
    };
    expect(vue(pvMax)).toBe(pvMax); // intact
    expect(vue(pvMax - 1)).toBe(Math.round(pvMax * 0.75)); // blessé : on ne voit pas combien
    expect(vue(Math.floor(pvMax / 2))).toBe(Math.max(1, Math.round(pvMax * 0.3))); // en sang
    // Ses propres PV, eux, restent exacts ; l'état d'origine n'est pas modifié.
    expect(combattant(vueDe(etat, 'monstres'), 'g1').pv).toBe(combattant(etat, 'g1').pv);
    hero.pv = pvMax - 1;
    vueDe(etat, 'monstres');
    expect(hero.pv).toBe(pvMax - 1);
  });
});

describe('l’IA normale (simulation de la suite du round)', () => {
  const petite: OptionsIA = { finalistes: 2, simulations: 2 };
  const duel = () => combat([bran(1, 2), gobelin('g1', 9, 2), gobelin('g2', 10, 3)]);

  it('joue un duel jusqu’au bout sans état incohérent, et deux fois de la même façon à graine égale', () => {
    const jouer = () => {
      const etat = duel();
      jouerEnVerifiant(etat, petite, 80);
      return etat.journal.map((e) => e.texte);
    };
    const a = jouer();
    expect(a.length).toBeGreaterThan(5);
    expect(jouer()).toEqual(a);
  });

  it('exporte des réglages utilisables', () => {
    expect(IA_NORMALE.finalistes).toBeGreaterThan(0);
    expect(IA_RAPIDE.finalistes).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Règles sans test jusqu'ici
// ---------------------------------------------------------------------------

const epee = (botte: AttaqueArme['botte']): AttaqueArme => ({
  id: 'epee-test', nom: 'Épée', mode: 'corps-a-corps', caracteristique: 'for', bonusAttaque: 50, degats: [{ des: '1d4', bonus: 0, type: 'tranchant' }], allonge: 1.5, finesse: false, botte,
});

describe('mort massive (SRD 5.2.1)', () => {
  it('le surplus de dégâts, une fois à 0 PV, qui égale les PV maximum tue sur le coup ; un de moins, non', () => {
    const tuer = (montant: number) => {
      const etat = combat([bran(1, 2), gobelin('g1', 8, 2)]);
      const h = combattant(etat, 'bran');
      h.pvMax = 12;
      h.pv = 5;
      infligerDegats(etat, h, [{ montant, type: 'contondant' }], combattant(etat, 'g1'));
      return h;
    };
    const mort = tuer(5 + 12);
    expect(mort.mort).toBe(true);
    const tombe = tuer(5 + 11);
    expect(tombe.mort).toBe(false);
    expect(aEtat(tombe, 'inconscient')).toBe(true);
  });

  it('un héros déjà à 0 PV meurt si un seul coup égale ses PV maximum', () => {
    const etat = combat([bran(1, 2), gobelin('g1', 2, 2)]);
    const h = combattant(etat, 'bran');
    h.pv = 0;
    h.pvMax = 12;
    infligerDegats(etat, h, [{ montant: 12, type: 'tranchant' }], combattant(etat, 'g1'));
    expect(h.mort).toBe(true);
  });
});

describe('bottes d’arme', () => {
  it('Ralentissement : −3 m de Vitesse à la cible, jusqu’au début du prochain tour de l’attaquant', () => {
    const etat = combat([bran(1, 2), gobelin('g1', 2, 2)], [15, 2]);
    const h = combattant(etat, 'bran');
    const g = combattant(etat, 'g1');
    const base = vitesse(g);
    attaqueArme(etat, h, g, epee('ralentissement'));
    expect(vitesse(g)).toBe(base - 3);
    finTour(etat); // le gobelin joue avec sa Vitesse réduite
    expect(g.tour.mouvement).toBe(base - 3);
    finTour(etat); // retour à Bran : l'effet prend fin
    expect(vitesse(g)).toBe(base);
  });

  it('Enchaînement : une seconde attaque sur un autre ennemi au contact de la première cible, une fois par tour', () => {
    const etat = combat([bran(1, 2), gobelin('g1', 2, 2), gobelin('g2', 3, 2)], [15, 2, 15, 2, 15, 2]);
    const h = combattant(etat, 'bran');
    // Le second ennemi est à 3 m de Bran : on le met à portée de son épée à allonge 3 m.
    const arme: AttaqueArme = { ...epee('enchainement'), allonge: 3 };
    attaqueArme(etat, h, combattant(etat, 'g1'), arme);
    const attaques = etat.journal.filter((e) => e.type === 'attaque');
    expect(attaques.map((e) => e.cible)).toEqual(['g1', 'g2']);
    expect(h.tour.enchainementUtilise).toBe(true);
    // Une seconde attaque dans le même tour ne l'enchaîne pas de nouveau.
    attaqueArme(etat, h, combattant(etat, 'g1'), arme);
    expect(etat.journal.filter((e) => e.type === 'attaque')).toHaveLength(3);
  });

  it('Poussée : la cible recule de deux cases sans provoquer d’attaque d’opportunité', () => {
    const etat = combat([bran(1, 2), gobelin('g1', 2, 2), gobelin('g2', 2, 1)], [15, 2]);
    const h = combattant(etat, 'bran');
    const g = combattant(etat, 'g1');
    attaqueArme(etat, h, g, epee('poussee'));
    expect(g.position).toEqual({ x: 4, y: 2 });
    expect(etat.journal.some((e) => /opportunité/.test(e.texte))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Du combat d'histoire au récit
// ---------------------------------------------------------------------------

describe('fin d’un combat d’histoire : de l’état du combat à la partie', () => {
  const r = chargerMonde(join(RACINE_MONDES, 'marche-d-ombrefiel'));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  const moteur = creerMoteur({ dm: r.monde, srd: donnees }, MODULES_STANDARD);
  const ID = 'ald-r-embuscade-du-pont';
  const def = r.monde.rencontres.get(ID)!;
  const depart = (): Partie => {
    const groupe = groupeConseille(1, donnees).emplacements.map((p) => {
      const f = bilanPersonnage(p!, donnees).fiche!;
      return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
    });
    const p = moteur.nouvellePartie(groupe, { graine: 2, niveau: 1 });
    p.scene = { type: 'rencontre', rencontre: ID };
    return p;
  };
  const rencontre = (n: number): Rencontre =>
    adapterRencontre({ id: ID, nom: def.nom, description: def.intro, difficulte: def.difficulte, terrain: def.terrain ?? 'foret', carte: def.carte!, monstres: def.monstres.map((m) => ({ profil: m.profil, nombre: m.nombre })) }, n);

  function jouer(p: Partie, graine = 5): EtatCombat {
    const { grille, combattants } = preparerRencontre(rencontre(p.groupe.length), donnees, p.groupe.map(heroCombatDe));
    const etat = creerCombat(grille, combattants, graine);
    jouerEnVerifiant(etat, IA_RAPIDE);
    return etat;
  }

  it('la victoire donne les PX partagés entre les héros, une seule fois, et rend l’état des héros', () => {
    let p = depart();
    const etat = jouer(p);
    expect(etat.vainqueur).toBe('heros');
    const res = resultatDeCombat(etat);
    const attendus = etat.combattants.filter((c) => c.camp === 'monstres').reduce((s, c) => s + c.px, 0);
    expect(res).toMatchObject({ issue: 'victoire', px: attendus });
    for (const h of Object.values(res.heros)) expect(h.pv).toBeGreaterThanOrEqual(1);
    const xp0 = p.etat.xp;
    const compte = moteur.executer(p, { type: 'reglerRencontre', issue: res.issue, px: res.px, heros: res.heros });
    expect(compte.refus).toBeUndefined();
    p = compte.partie;
    expect(p.scene.type).toBe('exploration');
    expect(p.etat.rencontresFaites).toContain(ID);
    const gain = p.etat.xp - xp0;
    expect(gain).toBeGreaterThanOrEqual(Math.floor(res.px / p.groupe.length));
    // Les héros reviennent avec les PV du combat (au moins 1), pas ceux d'avant.
    for (const h of p.groupe) expect(h.pv).toBe(Math.max(1, res.heros[h.id]!.pv));
    // La même rencontre rejouée ne rapporte plus de PX de combat (pas de farm).
    p.scene = { type: 'rencontre', rencontre: ID };
    const xp1 = p.etat.xp;
    p = moteur.executer(p, { type: 'reglerRencontre', issue: 'victoire', px: res.px, heros: res.heros }).partie;
    expect(p.etat.xp - xp1).toBe(gain - Math.floor(res.px / p.groupe.length));
  });

  it('la défaite n’achève pas le groupe : 1 PV au moins, la moitié de l’or perdue, la rencontre n’est pas faite', () => {
    const p = depart();
    const etat = jouer(p);
    // On rejoue le même état comme une défaite : tout le groupe à terre.
    for (const c of etat.combattants.filter((x) => x.camp === 'heros')) c.pv = 0;
    etat.vainqueur = 'monstres';
    const res = resultatDeCombat(etat);
    expect(res.issue).toBe('defaite');
    expect(res.px).toBeGreaterThan(0); // des monstres sont tombés, mais rien n'est gagné
    p.etat.pieces = 101;
    const apres = moteur.executer(p, { type: 'reglerRencontre', issue: res.issue, heros: res.heros }).partie;
    expect(apres.etat.pieces).toBe(51);
    expect(apres.etat.rencontresFaites).not.toContain(ID);
    for (const h of apres.groupe) expect(h.pv).toBeGreaterThanOrEqual(1);
  });

  it('un repli (aucun vainqueur) rend l’état des héros et ne rapporte pas de PX', () => {
    const p = depart();
    const etat = jouer(p);
    etat.vainqueur = undefined;
    const res = resultatDeCombat(etat);
    expect(res.issue).toBe('fuite');
    const xp0 = p.etat.xp;
    const apres = moteur.executer(p, { type: 'reglerRencontre', issue: res.issue, heros: res.heros }).partie;
    expect(apres.etat.xp).toBe(xp0);
    expect(apres.scene.type).toBe('exploration');
  });
});
