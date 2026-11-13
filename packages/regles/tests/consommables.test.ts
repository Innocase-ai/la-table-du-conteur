// Les consommables à effet (lot 1, 13/11/2026) : les potions et l'antidote décrits dans les données (`usage.agit`), pris hors combat
// (soins, potion toxique), confiés à un héros, puis pris en combat par une carte (états retirés, PV temporaires, résistance, dés, Force).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, heroCombatDe, MODULES_STANDARD, personnageDepuisFiche, type Partie } from '../src';
import { cartesDisponibles, executer } from '../src/combat/cartes';
import { heroDepuisFiche, monstreDepuisProfil, type Kit } from '../src/combat/creation';
import { combattant, type Combattant, type EtatCombat } from '../src/combat/etat';
import { grilleDepuisTexte } from '../src/combat/grille';
import { creerCombat, infligerDegats, jetAttaque, situationAttaque } from '../src/combat/moteur';
import { actionsDeUsage, PREFIXE_OBJET, type ObjetEmbarque } from '../src/combat/objets';
import { HEROS_PRE_TIRES } from '../src/combat/prototype';
import { chargerDonneesSrd } from '../src/donnees-node';
import { calculerFiche } from '../src/fiche';
import { chargerMonde } from '../src/monde/chargeur';
import { appliquerEtat } from '../src/personnage';
import { poidsPorte } from '../src/modules/equipement-regles';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
const ctx = { sorts: srd.sorts };
const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const moteur = creerMoteur({ dm: r.monde, srd }, MODULES_STANDARD);

const depart = (): Partie => {
  const groupe = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  return moteur.executer(moteur.nouvellePartie(groupe, { graine: 5, niveau: 3 }), { type: 'commencer' }).partie;
};

/** Ce qu'un héros emporte de l'objet : tiré des données, comme le fait la commande « confierObjet ». */
function embarque(id: string): ObjetEmbarque {
  const o = srd.objets.get(id)!;
  return { nom: o.nom, actions: actionsDeUsage(o.usage), ...(o.usage?.rounds ? { rounds: o.usage.rounds } : {}) };
}

describe('les données : quels consommables agissent', () => {
  const avecEffets = [...srd.objets.values()].filter((o) => o.usage?.agit?.length).map((o) => o.id);

  it('les potions de force de géant, d’héroïsme, d’invulnérabilité, de résistance, de vitalité, de vitesse, d’invisibilité, l’élixir de santé, la potion toxique, l’antidote et les trois objets de jet agissent', () => {
    expect(avecEffets.sort()).toEqual(
      [
        'acide',
        'antidote',
        'eau-benite',
        'elixir-de-sante',
        'feu-gregeois',
        'potion-d-invisibilite',
        'potion-de-vitesse',
        'potion-d-heroisme',
        'potion-d-invulnerabilite',
        'potion-de-force-de-geant-collines',
        'potion-de-force-de-geant-feu',
        'potion-de-force-de-geant-givre-ou-pierres',
        'potion-de-force-de-geant-nuages',
        'potion-de-force-de-geant-tempetes',
        'potion-de-resistance',
        'potion-de-vitalite',
        'potion-toxique',
      ].sort(),
    );
  });

  it('les quatre potions de guérison soignent (usage.soins), et comptent comme des actions', () => {
    for (const id of ['potion-de-guerison', 'potion-de-guerison-importante', 'potion-de-guerison-superieure', 'potion-de-guerison-supreme']) expect(actionsDeUsage(srd.objets.get(id)!.usage)).toEqual([{ soins: expect.any(String) }]);
  });
});

describe('hors combat', () => {
  it('une potion de guérison plus forte soigne le plus blessé', () => {
    let p = depart();
    p.groupe[0]!.pv = 1;
    p.etat.inventaire = { 'potion-de-guerison-superieure': 1 };
    p = moteur.executer(p, { type: 'utiliserObjet', objet: 'potion-de-guerison-superieure', personnage: p.groupe[0]!.id }).partie;
    expect(p.groupe[0]!.pv).toBeGreaterThan(8);
    expect(p.etat.inventaire['potion-de-guerison-superieure']).toBeUndefined();
  });

  it('un objet qui n’agit qu’en combat ne se gaspille pas : il faut le confier à un héros', () => {
    const p = depart();
    p.etat.inventaire = { 'potion-d-invulnerabilite': 1, 'elixir-de-sante': 1, antidote: 1 };
    for (const objet of ['potion-d-invulnerabilite', 'elixir-de-sante', 'antidote']) {
      const res = moteur.executer(p, { type: 'utiliserObjet', objet });
      expect(res.refus, objet).toMatch(/se prend en combat/);
      expect(res.partie.etat.inventaire[objet], `${objet} reste dans le sac`).toBe(1);
    }
  });

  it('la potion toxique fait mal à qui la boit (jamais sous 1 PV) ; il faut dire qui', () => {
    let p = depart();
    p.etat.inventaire = { 'potion-toxique': 2 };
    expect(moteur.executer(p, { type: 'utiliserObjet', objet: 'potion-toxique' }).refus).toMatch(/Qui prend/);
    const id = p.groupe[0]!.id;
    const avant = p.groupe[0]!.pv;
    p = moteur.executer(p, { type: 'utiliserObjet', objet: 'potion-toxique', personnage: id }).partie;
    expect(p.groupe[0]!.pv).toBeLessThan(avant);
    expect(p.groupe[0]!.pv).toBeGreaterThanOrEqual(1);
    expect(p.etat.inventaire['potion-toxique']).toBe(1);
  });
});

describe('confier un objet à un héros', () => {
  it('il passe du sac aux mains du héros, pèse sur lui, apparaît dans ce qu’il porte, et revient au sac', () => {
    let p = depart();
    const id = p.groupe[0]!.id;
    p.etat.inventaire = { antidote: 2 };
    const poids = poidsPorte(moteur.ctx, p.groupe[0]!);
    p = moteur.executer(p, { type: 'confierObjet', objet: 'antidote', personnage: id }).partie;
    const h = p.groupe[0]!;
    expect(p.etat.inventaire.antidote).toBe(1);
    expect(h.ressources[PREFIXE_OBJET + 'antidote']).toBe(1);
    expect(h.embarques!.antidote).toMatchObject({ nom: 'Antidote', actions: [{ retirerEtats: ['empoisonne'] }] });
    expect(poidsPorte(moteur.ctx, h)).toBeCloseTo(poids + 0.1);
    const encart = moteur.encarts(p).find((e) => e.id === 'sac-objets')!.grille!;
    expect(encart.elements.find((e) => e.id === `porte:${id}:antidote`)).toMatchObject({ quantite: 1, porteur: { id } });
    // Les boutons : « Rendre au sac » sur l'objet porté.
    expect(moteur.propositions(p).some((x) => x.ordre?.type === 'rendreObjet' && x.element?.id === `porte:${id}:antidote`)).toBe(true);
    p = moteur.executer(p, { type: 'rendreObjet', objet: 'antidote', personnage: id }).partie;
    expect(p.etat.inventaire.antidote).toBe(2);
    expect(p.groupe[0]!.ressources[PREFIXE_OBJET + 'antidote']).toBeUndefined();
    expect(p.groupe[0]!.embarques?.antidote).toBeUndefined();
  });

  it('refus : la potion de guérison simple a sa commande, la corde et la potion toxique ne s’emportent pas, il faut l’avoir', () => {
    const p = depart();
    p.etat.inventaire = { 'potion-de-guerison': 1, corde: 1, 'potion-toxique': 1 };
    expect(moteur.executer(p, { type: 'confierObjet', objet: 'potion-de-guerison' }).refus).toMatch(/Confier une potion/);
    expect(moteur.executer(p, { type: 'confierObjet', objet: 'corde' }).refus).toMatch(/ne se prend pas en combat/);
    expect(moteur.executer(p, { type: 'confierObjet', objet: 'potion-toxique' }).refus).toMatch(/ne se prend pas en combat/);
    expect(moteur.executer(p, { type: 'confierObjet', objet: 'antidote' }).refus).toMatch(/n'a pas cet objet/);
  });

  it('les boutons du sac proposent de confier ce qui s’emporte, et seulement cela', () => {
    const p = depart();
    p.etat.inventaire = { 'elixir-de-sante': 1, corde: 1, 'potion-toxique': 1 };
    const confier = moteur.propositions(p).filter((x) => x.ordre?.type === 'confierObjet').map((x) => x.element?.id);
    expect(new Set(confier)).toEqual(new Set(['elixir-de-sante']));
    expect(moteur.propositions(p).some((x) => x.libelle === 'Boire…' && x.element?.id === 'potion-toxique')).toBe(true);
  });

  it('ce qu’un héros garde après le combat reste dans ses mains, et ce qui est bu disparaît', () => {
    const h = depart().groupe[0]!;
    h.ressources[PREFIXE_OBJET + 'antidote'] = 2;
    h.embarques = { antidote: embarque('antidote') };
    const combat = heroCombatDe(h);
    expect(combat.objets!.antidote).toBeDefined();
    expect(combat.etat!.ressources[PREFIXE_OBJET + 'antidote']).toBe(2);
    appliquerEtat(h, { pv: h.pv, ressources: { [PREFIXE_OBJET + 'antidote']: 1 } });
    expect(h.ressources[PREFIXE_OBJET + 'antidote']).toBe(1);
    appliquerEtat(h, { pv: h.pv, ressources: { [PREFIXE_OBJET + 'antidote']: 0 } });
    expect(h.ressources[PREFIXE_OBJET + 'antidote']).toBeUndefined();
    expect(h.embarques!.antidote).toBeUndefined();
  });
});

describe('en combat : la carte de l’objet', () => {
  const fiche = (nom: string) => {
    const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === nom)!;
    const f = calculerFiche(h.choix, srd);
    if (!f.ok) throw new Error(f.erreurs.join());
    return f.fiche;
  };
  const kit: Kit = { armes: [{ id: 'epee-longue' }] };
  const hero = (nom: string, x: number, y: number): Combattant => heroDepuisFiche(fiche(nom), kit, srd, { x, y });
  const gobelin = (x: number, y: number) => monstreDepuisProfil(srd.monstres.get('combattant-gobelin')!, 'gob', { x, y });
  const arene = grilleDepuisTexte(Array.from({ length: 5 }, () => '..............'));
  /** Un combat où Bran porte ces objets (id → nombre). */
  function combat(objets: Record<string, number>, des: number[] = []): EtatCombat {
    const bran = hero('Bran', 1, 1);
    bran.objetsEmbarques = Object.fromEntries(Object.keys(objets).map((id) => [id, embarque(id)]));
    for (const [id, n] of Object.entries(objets)) bran.ressources[PREFIXE_OBJET + id] = n;
    const allie = hero('Grukk', 2, 1);
    const etat = creerCombat(arene, [bran, allie, gobelin(10, 1)].map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), 1, { elan: false });
    etat.desImposes = [...des];
    return etat;
  }
  const carte = (etat: EtatCombat, id: string) => cartesDisponibles(etat, ctx, 'bran').find((k) => k.id === `base:objet-${id}`);
  const jouer = (etat: EtatCombat, id: string, cibles?: string[]) => executer(etat, ctx, { type: 'jouer', carte: `base:objet-${id}`, cibles });

  it('l’antidote : une action Bonus, utile seulement à qui est empoisonné ; il délivre et la réserve baisse', () => {
    const etat = combat({ antidote: 2 });
    const bran = combattant(etat, 'bran');
    expect(carte(etat, 'antidote')).toMatchObject({ jouable: false, raison: 'Cela ne changerait rien.', cout: 'bonus', image: 'antidote' });
    bran.etats.push({ etat: 'empoisonne' });
    expect(carte(etat, 'antidote')).toMatchObject({ jouable: true, cibles: ['bran'] });
    expect(jouer(etat, 'antidote', ['bran']).ok).toBe(true);
    expect(bran.etats.some((e) => e.etat === 'empoisonne')).toBe(false);
    expect(bran.ressources[PREFIXE_OBJET + 'antidote']).toBe(1);
    expect(bran.tour.bonus, "l’action Bonus est dépensée").toBe(false);
  });

  it('l’élixir de santé se donne à un allié au contact, et lève plusieurs états', () => {
    const etat = combat({ 'elixir-de-sante': 1 });
    const grukk = combattant(etat, 'grukk');
    grukk.etats.push({ etat: 'aveugle' }, { etat: 'paralyse' }, { etat: 'effraye' });
    expect(carte(etat, 'elixir-de-sante')!.cibles).toEqual(['grukk']);
    expect(jouer(etat, 'elixir-de-sante', ['grukk']).ok).toBe(true);
    expect(grukk.etats.map((e) => e.etat)).toEqual(['effraye']);
  });

  it('l’invulnérabilité : résistance à tous les dégâts, pendant 1 minute (10 rounds)', () => {
    const etat = combat({ 'potion-d-invulnerabilite': 1 });
    const bran = combattant(etat, 'bran');
    expect(jouer(etat, 'potion-d-invulnerabilite', ['bran']).ok).toBe(true);
    const m = bran.modificateurs.find((x) => x.type === 'resistance')!;
    expect(m).toMatchObject({ typeDegats: 'tous', expire: { moment: 'debut_tour', de: 'bran', apres: 9 } });
    const pv = bran.pv;
    infligerDegats(etat, bran, [{ montant: 10, type: 'feu' }], undefined);
    expect(pv - bran.pv).toBe(5);
  });

  it('la potion de résistance tire son type au d10 quand on la boit', () => {
    const etat = combat({ 'potion-de-resistance': 1 }, [3]);
    expect(jouer(etat, 'potion-de-resistance', ['bran']).ok).toBe(true);
    const m = combattant(etat, 'bran').modificateurs.find((x) => x.type === 'resistance')!;
    expect(m.typeDegats).toBe('force');
    const bran = combattant(etat, 'bran');
    const pv = bran.pv;
    infligerDegats(etat, bran, [{ montant: 8, type: 'force' }], undefined);
    expect(pv - bran.pv).toBe(4);
  });

  it('l’héroïsme : 10 PV temporaires et 1d4 aux attaques et aux sauvegardes', () => {
    const etat = combat({ 'potion-d-heroisme': 1 });
    const bran = combattant(etat, 'bran');
    expect(jouer(etat, 'potion-d-heroisme', ['bran']).ok).toBe(true);
    expect(bran.pvTemp).toBe(10);
    expect(bran.modificateurs.map((m) => `${m.type}:${m.de}`).sort()).toEqual(['de_attaque:1d4', 'de_sauvegarde:1d4']);
  });

  it('la force de géant donne l’écart de modificateur aux attaques, aux dégâts et à la sauvegarde de Force ; sans effet si on est déjà plus fort', () => {
    const etat = combat({ 'potion-de-force-de-geant-collines': 1, 'potion-de-force-de-geant-tempetes': 1 });
    const bran = combattant(etat, 'bran');
    const avant = { mod: bran.mods.for, atq: bran.attaques[0]!.bonusAttaque, deg: bran.attaques[0]!.degats[0]!.bonus, js: bran.sauvegardes.for };
    expect(carte(etat, 'potion-de-force-de-geant-collines')!.jouable).toBe(true);
    expect(jouer(etat, 'potion-de-force-de-geant-collines', ['bran']).ok).toBe(true);
    const gain = 5 - avant.mod;
    expect(bran.mods.for).toBe(5);
    expect(bran.attaques[0]!.bonusAttaque).toBe(avant.atq + gain);
    expect(bran.attaques[0]!.degats[0]!.bonus).toBe(avant.deg + gain);
    expect(bran.sauvegardes.for).toBe(avant.js + gain);
    // L’action Bonus est rendue au tour suivant, la potion de la tempête (Force 29) fait mieux ; une potion moins forte ne ferait rien.
    bran.tour.bonus = true;
    expect(jouer(etat, 'potion-de-force-de-geant-tempetes', ['bran']).ok).toBe(true);
    expect(bran.mods.for).toBe(9);
  });

  it('une carte de l’objet n’existe que pour le héros qui le porte, et plus quand la réserve est vide', () => {
    const etat = combat({ antidote: 1 });
    expect(cartesDisponibles(etat, ctx, 'grukk').some((k) => k.id.startsWith('base:objet-'))).toBe(false);
    combattant(etat, 'bran').ressources[PREFIXE_OBJET + 'antidote'] = 0;
    expect(carte(etat, 'antidote')).toBeUndefined();
  });
});

describe('objets de jet, Hâte et Invisible (lot 3)', () => {
  const fiche = (nom: string) => {
    const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === nom)!;
    const f = calculerFiche(h.choix, srd);
    if (!f.ok) throw new Error(f.erreurs.join());
    return f.fiche;
  };
  const arene = grilleDepuisTexte(Array.from({ length: 6 }, () => '................'));
  /** Bran porte l'objet ; un gobelin à 4 m (de type voulu), au besoin plus loin. */
  function combat(id: string, des: number[] = [], typeEnnemi?: string, distance = 4): EtatCombat {
    const bran = heroDepuisFiche(fiche('Bran'), { armes: [{ id: 'epee-longue' }] }, srd, { x: 1, y: 1 });
    bran.objetsEmbarques = { [id]: embarque(id) };
    bran.ressources[PREFIXE_OBJET + id] = 2;
    const gob = monstreDepuisProfil(srd.monstres.get('combattant-gobelin')!, 'gob', { x: 1 + Math.round(distance / 1.5), y: 1 });
    if (typeEnnemi) gob.type = typeEnnemi;
    const etat = creerCombat(arene, [bran, gob].map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), 1, { elan: false });
    etat.desImposes = [...des];
    return etat;
  }
  const carte = (etat: EtatCombat, id: string) => cartesDisponibles(etat, ctx, 'bran').find((k) => k.id === `base:objet-${id}`);
  const jouer = (etat: EtatCombat, id: string, cibles?: string[]) => executer(etat, ctx, { type: 'jouer', carte: `base:objet-${id}`, cibles });

  it('l’acide : jeté sur un ennemi à 6 m au plus, à la place d’une attaque ; sauvegarde ratée, 2d6 d’acide ; réussie, rien', () => {
    const etat = combat('acide', [1, 2, 3]);
    const k = carte(etat, 'acide')!;
    expect(k).toMatchObject({ jouable: true, ciblage: 'ennemi', cout: 'action', cibles: ['gob'], portee: 6, image: 'acide' });
    expect(k.stats!.sauvegarde).toMatchObject({ caracteristique: 'dex' });
    const gob = combattant(etat, 'gob');
    const pv = gob.pv;
    expect(jouer(etat, 'acide', ['gob']).ok).toBe(true);
    expect(pv - gob.pv).toBe(5);
    expect(combattant(etat, 'bran').ressources[PREFIXE_OBJET + 'acide']).toBe(1);
    expect(combattant(etat, 'bran').tour.action).toBe(false);
    const sauve = combat('acide', [20, 3, 4]);
    const g2 = combattant(sauve, 'gob');
    const pv2 = g2.pv;
    jouer(sauve, 'acide', ['gob']);
    expect(g2.pv).toBe(pv2);
  });

  it('hors de portée, pas de cible ; hors du combat, l’objet de jet se confie', () => {
    expect(carte(combat('acide', [], undefined, 9), 'acide')).toMatchObject({ jouable: false, raison: 'Aucune cible à portée.' });
    const p = depart();
    p.etat.inventaire = { 'feu-gregeois': 1 };
    expect(moteur.executer(p, { type: 'utiliserObjet', objet: 'feu-gregeois' }).refus).toMatch(/se lance en combat/);
    expect(moteur.propositions(p).some((x) => x.ordre?.type === 'confierObjet' && x.element?.id === 'feu-gregeois')).toBe(true);
  });

  it('l’eau bénite ne vise que les Fiélons et les Morts-vivants : 2d8 radiants', () => {
    expect(carte(combat('eau-benite'), 'eau-benite')).toMatchObject({ jouable: false, raison: 'Aucune cible à portée.' });
    const etat = combat('eau-benite', [1, 2, 3], 'Mort-vivant');
    expect(carte(etat, 'eau-benite')!.cibles).toEqual(['gob']);
    const gob = combattant(etat, 'gob');
    const pv = gob.pv;
    expect(jouer(etat, 'eau-benite', ['gob']).ok).toBe(true);
    expect(pv - gob.pv).toBe(5);
  });

  it('le feu grégeois : 1d4 de feu et la cible brûle à chaque fin de tour ; « Éteindre les flammes » étouffe le feu', () => {
    const etat = combat('feu-gregeois', [1, 2, 3]);
    const gob = combattant(etat, 'gob');
    const pv = gob.pv;
    expect(jouer(etat, 'feu-gregeois', ['gob']).ok).toBe(true);
    expect(pv - gob.pv).toBe(2);
    expect(gob.modificateurs.some((m) => m.id === 'brule')).toBe(true);
    // Fin du tour de Bran, puis le gobelin finit son tour : il brûle (1d4 = 3).
    executer(etat, ctx, { type: 'finTour' });
    const avant = gob.pv;
    executer(etat, ctx, { type: 'finTour' });
    expect(avant - gob.pv).toBe(3);
    // Éteindre : la carte n'existe que pour qui brûle.
    const bran = combattant(etat, 'bran');
    expect(cartesDisponibles(etat, ctx, 'bran').some((k) => k.id === 'base:eteindre')).toBe(false);
    bran.modificateurs.push({ id: 'brule', type: 'degats_differes', de: '1d4', typeDegats: 'feu', repete: true, source: 'gob' });
    expect(cartesDisponibles(etat, ctx, 'bran').find((k) => k.id === 'base:eteindre')).toMatchObject({ jouable: true, cout: 'action' });
    expect(executer(etat, ctx, { type: 'jouer', carte: 'base:eteindre' }).ok).toBe(true);
    expect(bran.modificateurs.some((m) => m.id === 'brule')).toBe(false);
  });

  it('la potion de vitesse : Hâte (+2 CA, Vitesse doublée, une attaque de plus par tour, avantage aux sauvegardes de Dextérité)', () => {
    const etat = combat('potion-de-vitesse');
    const bran = combattant(etat, 'bran');
    const vitesse = bran.vitesse;
    expect(jouer(etat, 'potion-de-vitesse', ['bran']).ok).toBe(true);
    expect(bran.modificateurs.map((m) => m.type).sort()).toEqual(['bonus_ca', 'hate', 'vitesse']);
    expect(bran.modificateurs.find((m) => m.type === 'vitesse')).toMatchObject({ valeur: vitesse, expire: { apres: 9 } });
    expect(bran.modificateurs.find((m) => m.type === 'bonus_ca')).toMatchObject({ valeur: 2 });
    expect(bran.tour.mouvement).toBeGreaterThanOrEqual(vitesse * 2 - 1);
    // Au tour suivant de Bran : une attaque en réserve avant même l'action Attaque.
    executer(etat, ctx, { type: 'finTour' });
    executer(etat, ctx, { type: 'finTour' });
    expect(combattant(etat, 'bran').tour.attaquesRestantes).toBe(1);
  });

  it('la potion d’invisibilité : avantage à ses attaques, désavantage contre lui ; attaquer ou blesser y met fin', () => {
    const etat = combat('potion-d-invisibilite');
    const bran = combattant(etat, 'bran');
    const gob = combattant(etat, 'gob');
    expect(jouer(etat, 'potion-d-invisibilite', ['bran']).ok).toBe(true);
    expect(bran.etats.map((e) => e.etat)).toEqual(['invisible']);
    expect(situationAttaque(etat, gob, bran, 'corps-a-corps')).toMatchObject({ desavantage: true });
    expect(situationAttaque(etat, bran, gob, 'corps-a-corps')).toMatchObject({ avantage: true });
    jetAttaque(etat, bran, gob, 5, 'corps-a-corps');
    expect(bran.etats).toEqual([]);
    // Infliger des dégâts (un objet de jet, par exemple) y met fin aussi.
    bran.etats.push({ etat: 'invisible' });
    infligerDegats(etat, gob, [{ montant: 1, type: 'feu' }], bran);
    expect(bran.etats).toEqual([]);
  });
});
