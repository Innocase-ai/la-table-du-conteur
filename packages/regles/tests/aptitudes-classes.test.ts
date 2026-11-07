// Aptitudes de classe jouables en combat (audit des règles du 07/11/2026) : Barde, Paladin, Moine. Le moteur réel, des dés imposés.
import { describe, expect, it } from 'vitest';
import { cartesDisponibles, executer } from '../src/combat/cartes';
import { heroDepuisFiche, monstreDepuisProfil } from '../src/combat/creation';
import { aEtat, combattant, peutAgir, type Combattant, type EtatCombat } from '../src/combat/etat';
import { jouerTourSimple } from '../src/combat/ia';
import { grilleDepuisTexte } from '../src/combat/grille';
import { ca, creerCombat, finTour, sauvegarde, vitesse } from '../src/combat/moteur';
import { creationRapide, kitDepuisFiche, personnageDepuisFiche, recuperer } from '../src';
import { chargerDonneesSrd } from '../src/donnees-node';
import { calculerFiche } from '../src/fiche';

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };
const ARENE = grilleDepuisTexte(['..........', '..........', '..........', '..........', '..........']);

function fiche(classe: string, niveau: number, nom: string) {
  const choix = creationRapide({ classe, espece: 'humain', niveau, nom }, donnees);
  const r = calculerFiche(choix, donnees);
  if (!r.ok) throw new Error(r.erreurs.join('\n'));
  return r.fiche;
}

/** Un héros de cette classe, créé comme à la création rapide. */
function heroClasse(classe: string, niveau: number, nom: string, x: number, y: number): Combattant {
  const f = fiche(classe, niveau, nom);
  return heroDepuisFiche(f, kitDepuisFiche(f), donnees, { x, y });
}

function monstre(profil: string, x: number, y: number, id = profil): Combattant {
  return monstreDepuisProfil(donnees.monstres.get(profil)!, id, { x, y });
}

/** Les combattants jouent dans l'ordre de la liste (écarts d'initiative énormes). */
function combat(combattants: Combattant[]): EtatCombat {
  return creerCombat(ARENE, combattants.map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), 1, { elan: false });
}

const carte = (etat: EtatCombat, id: string, carteId: string) => cartesDisponibles(etat, ctx, id).find((k) => k.id === carteId);
const jouer = (etat: EtatCombat, carteId: string, cibles: string[] = []) => executer(etat, ctx, { type: 'jouer', carte: carteId, cibles });

describe('Barde : Inspiration bardique', () => {
  const trio = () => combat([heroClasse('barde', 1, 'Lyra', 1, 1), heroClasse('guerrier', 1, 'Bran', 2, 1), monstre('ogre', 3, 1)]);

  it('la carte n’existe que pour le Barde, en action Bonus, avec Charisme utilisations', () => {
    const etat = trio();
    const k = carte(etat, 'lyra', 'aptitude:inspiration-bardique')!;
    expect(k).toBeDefined();
    expect(k.cout).toBe('bonus');
    expect(k.jouable).toBe(true);
    expect(k.cibles).toEqual(['bran']); // « une autre créature » : pas elle-même
    const cha = fiche('barde', 1, 'Lyra').caracteristiques.cha.modificateur;
    expect(combattant(etat, 'lyra').ressources.inspiration).toBe(Math.max(1, cha));
    expect(combattant(etat, 'lyra').ressources.deInspiration).toBe(6);
    expect(carte(etat, 'bran', 'aptitude:inspiration-bardique')).toBeUndefined();
  });

  it('donner l’inspiration dépense une utilisation et l’action Bonus ; pas deux dés à la même créature', () => {
    const etat = trio();
    const avant = combattant(etat, 'lyra').ressources.inspiration!;
    expect(jouer(etat, 'aptitude:inspiration-bardique', ['bran']).ok).toBe(true);
    expect(combattant(etat, 'lyra').ressources.inspiration).toBe(avant - 1);
    expect(combattant(etat, 'lyra').tour.bonus).toBe(false);
    expect(combattant(etat, 'bran').modificateurs.some((m) => m.type === 'de_inspiration')).toBe(true);
    const k = carte(etat, 'lyra', 'aptitude:inspiration-bardique')!;
    expect(k.jouable).toBe(false); // plus d'action Bonus (et plus de cible sans dé)
  });

  it('sans utilisation, la carte est refusée', () => {
    const etat = trio();
    combattant(etat, 'lyra').ressources.inspiration = 0;
    expect(carte(etat, 'lyra', 'aptitude:inspiration-bardique')!.jouable).toBe(false);
  });

  /** Bran, inspiré, attaque l'ogre ; le d20 donne `manque` de moins que la CA. Renvoie l'état après l'attaque. */
  function attaqueInspiree(manque: number, d: number | undefined, deInspiration: number) {
    const etat = combat([heroClasse('barde', 1, 'Lyra', 1, 1), heroClasse('guerrier', 1, 'Bran', 2, 1), monstre('ogre', 3, 1)]);
    jouer(etat, 'aptitude:inspiration-bardique', ['bran']);
    finTour(etat); // tour de Bran
    const bran = combattant(etat, 'bran');
    const arme = bran.attaques[0]!;
    const cible = combattant(etat, 'ogre');
    cible.caBase = 22; // une CA haute laisse de la marge pour rater de loin comme de peu
    const lance = d ?? ca(cible) - arme.bonusAttaque - manque; // le d20 qui laisse `manque` points de moins que la CA
    expect(lance).toBeGreaterThan(1);
    expect(lance).toBeLessThan(20);
    etat.desImposes = [lance, deInspiration];
    jouer(etat, `attaque:${arme.id}`, ['ogre']);
    return { etat, bran, cible };
  }

  it('un coup raté de peu est rattrapé par le dé, qui est dépensé', () => {
    const { etat, bran } = attaqueInspiree(2, undefined, 3);
    expect(etat.journal.some((e) => /Inspiration bardique : \+3/.test(e.texte))).toBe(true);
    const attaque = etat.journal.filter((e) => e.type === 'attaque').at(-1)!;
    expect(attaque.details?.resultat).toBe('touche');
    expect(bran.modificateurs.some((m) => m.type === 'de_inspiration')).toBe(false);
  });

  it('un coup trop loin de la CA ne dépense pas le dé', () => {
    const { etat, bran } = attaqueInspiree(7, undefined, 6);
    expect(etat.journal.some((e) => /Inspiration bardique : \+/.test(e.texte))).toBe(false);
    expect(etat.journal.filter((e) => e.type === 'attaque').at(-1)!.details?.resultat).toBe('rate');
    expect(bran.modificateurs.some((m) => m.type === 'de_inspiration')).toBe(true);
  });

  it('un 1 naturel reste un échec : le dé n’est pas dépensé', () => {
    const etat = combat([heroClasse('barde', 1, 'Lyra', 1, 1), heroClasse('guerrier', 1, 'Bran', 2, 1), monstre('ogre', 3, 1)]);
    jouer(etat, 'aptitude:inspiration-bardique', ['bran']);
    finTour(etat);
    const arme = combattant(etat, 'bran').attaques[0]!;
    etat.desImposes = [1, 6];
    jouer(etat, `attaque:${arme.id}`, ['ogre']);
    expect(combattant(etat, 'bran').modificateurs.some((m) => m.type === 'de_inspiration')).toBe(true);
  });

  it('un jet de sauvegarde raté de peu est rattrapé', () => {
    const etat = combat([heroClasse('barde', 1, 'Lyra', 1, 1), heroClasse('guerrier', 1, 'Bran', 2, 1), monstre('ogre', 3, 1)]);
    jouer(etat, 'aptitude:inspiration-bardique', ['bran']);
    const bran = combattant(etat, 'bran');
    const bonus = bran.sauvegardes.dex;
    etat.desImposes = [10, 2]; // d20 : 10 ; dé d'Inspiration : 2
    expect(sauvegarde(etat, bran, 'dex', 10 + bonus + 2)).toBe(true);
    expect(bran.modificateurs.some((m) => m.type === 'de_inspiration')).toBe(false);
  });

  it('récupération : repos long ; repos court dès le niveau 5 (Source d’inspiration) ; dé d8 au niveau 5', () => {
    const f1 = fiche('barde', 1, 'Lyra');
    const p1 = personnageDepuisFiche(f1, { id: 'lyra' });
    const max = p1.ressources.inspiration!;
    p1.ressources.inspiration = 0;
    recuperer(p1, 'court', () => 0.5);
    expect(p1.ressources.inspiration).toBe(0);
    recuperer(p1, 'long', () => 0.5);
    expect(p1.ressources.inspiration).toBe(max);

    const f5 = fiche('barde', 5, 'Lyra');
    const p5 = personnageDepuisFiche(f5, { id: 'lyra5' });
    p5.ressources.inspiration = 0;
    recuperer(p5, 'court', () => 0.5);
    expect(p5.ressources.inspiration).toBe(Math.max(1, f5.caracteristiques.cha.modificateur));
    expect(heroClasse('barde', 5, 'Lyra', 1, 1).ressources.deInspiration).toBe(8);
  });
});

describe('Paladin : Châtiment divin', () => {
  /** Le Paladin (niveau 2) au contact d'un monstre sans défense : ses coups touchent. */
  function duel(profil = 'ogre') {
    const etat = combat([heroClasse('paladin', 2, 'Aldric', 1, 1), monstre(profil, 2, 1)]);
    combattant(etat, profil).caBase = 1;
    const paladin = combattant(etat, 'aldric');
    const arme = paladin.attaques.find((a) => a.mode === 'corps-a-corps')!;
    return { etat, paladin, cible: combattant(etat, profil), arme };
  }
  const frapper = (etat: EtatCombat, armeId: string, cible: string, d20 = 15) => {
    etat.desImposes = [d20];
    return jouer(etat, `attaque:${armeId}`, [cible]);
  };

  it('absent au niveau 1 ; au niveau 2, il faut d’abord avoir touché au corps à corps', () => {
    const niveau1 = combat([heroClasse('paladin', 1, 'Aldric', 1, 1), monstre('ogre', 2, 1)]);
    expect(carte(niveau1, 'aldric', 'aptitude:chatiment-divin')).toBeUndefined();
    const { etat, arme } = duel();
    const avant = carte(etat, 'aldric', 'aptitude:chatiment-divin')!;
    expect(avant.jouable).toBe(false);
    expect(avant.raison).toMatch(/touché au corps à corps/);
    frapper(etat, arme.id, 'ogre');
    const apres = carte(etat, 'aldric', 'aptitude:chatiment-divin')!;
    expect(apres.jouable).toBe(true);
    expect(apres.cout).toBe('bonus');
    expect(apres.cibles).toEqual(['ogre']);
  });

  it('un coup raté ne le permet pas', () => {
    const { etat, arme } = duel();
    combattant(etat, 'ogre').caBase = 30;
    frapper(etat, arme.id, 'ogre', 2);
    expect(carte(etat, 'aldric', 'aptitude:chatiment-divin')!.jouable).toBe(false);
  });

  it('le lancer gratuit d’abord (2d8 radiants), sans emplacement ; l’action Bonus est dépensée', () => {
    const { etat, paladin, cible, arme } = duel();
    frapper(etat, arme.id, 'ogre');
    const pv = cible.pv;
    const emplacements = [...paladin.incantation!.emplacements];
    etat.desImposes = [4, 5];
    expect(jouer(etat, 'aptitude:chatiment-divin', ['ogre']).ok).toBe(true);
    expect(pv - cible.pv).toBe(9);
    expect(paladin.ressources.chatimentGratuit).toBe(0);
    expect(paladin.incantation!.emplacements).toEqual(emplacements);
    expect(paladin.tour.bonus).toBe(false);
  });

  it('sans lancer gratuit, il dépense un emplacement', () => {
    const { etat, paladin, cible, arme } = duel();
    paladin.ressources.chatimentGratuit = 0;
    frapper(etat, arme.id, 'ogre');
    const pv = cible.pv;
    const avant = paladin.incantation!.emplacements[0]!;
    etat.desImposes = [3, 3];
    jouer(etat, 'aptitude:chatiment-divin', ['ogre']);
    expect(pv - cible.pv).toBe(6);
    expect(paladin.incantation!.emplacements[0]).toBe(avant - 1);
    expect(paladin.tour.sortEmplacementLance).toBe(true);
  });

  it('sans lancer gratuit ni emplacement : refusé', () => {
    const { etat, paladin, arme } = duel();
    paladin.ressources.chatimentGratuit = 0;
    paladin.incantation!.emplacements.fill(0);
    frapper(etat, arme.id, 'ogre');
    expect(carte(etat, 'aldric', 'aptitude:chatiment-divin')!.jouable).toBe(false);
  });

  it('un coup critique double les dés du Châtiment', () => {
    const { etat, cible, arme } = duel();
    frapper(etat, arme.id, 'ogre', 20);
    const pv = cible.pv;
    etat.desImposes = [2, 2, 2, 2];
    jouer(etat, 'aptitude:chatiment-divin', ['ogre']);
    expect(pv - cible.pv).toBe(8);
  });

  it('+1d8 contre un Mort-vivant', () => {
    const { etat, cible, arme } = duel('squelette');
    frapper(etat, arme.id, 'squelette');
    const pv = cible.pv;
    etat.desImposes = [1, 1, 1];
    jouer(etat, 'aptitude:chatiment-divin', ['squelette']);
    expect(pv - cible.pv).toBe(3);
  });

  it('le lancer gratuit revient au repos long seulement', () => {
    const p = personnageDepuisFiche(fiche('paladin', 2, 'Aldric'), { id: 'aldric' });
    expect(p.ressources.chatimentGratuit).toBe(1);
    p.ressources.chatimentGratuit = 0;
    recuperer(p, 'court', () => 0.5);
    expect(p.ressources.chatimentGratuit).toBe(0);
    recuperer(p, 'long', () => 0.5);
    expect(p.ressources.chatimentGratuit).toBe(1);
  });
});

describe('Moine : Arts martiaux, Credo, Frappe étourdissante', () => {
  function duel(niveau: number, profil = 'ogre') {
    const etat = combat([heroClasse('moine', niveau, 'Kaï', 1, 1), monstre(profil, 2, 1)]);
    combattant(etat, profil).caBase = 1; // les coups touchent
    return { etat, moine: combattant(etat, 'kaï'), cible: combattant(etat, profil) };
  }
  const nbAttaques = (etat: EtatCombat) => etat.journal.filter((e) => e.type === 'attaque').length;

  it('Frappe bonus : seulement après l’action Attaque, en action Bonus', () => {
    const { etat, moine } = duel(1);
    const avant = carte(etat, 'kaï', 'aptitude:frappe-bonus')!;
    expect(avant.jouable).toBe(false);
    expect(avant.raison).toMatch(/action Attaque/);
    etat.desImposes = [15];
    jouer(etat, 'attaque:arts-martiaux', ['ogre']);
    const apres = carte(etat, 'kaï', 'aptitude:frappe-bonus')!;
    expect(apres.jouable).toBe(true);
    expect(apres.cout).toBe('bonus');
    const n = nbAttaques(etat);
    etat.desImposes = [15];
    expect(jouer(etat, 'aptitude:frappe-bonus', ['ogre']).ok).toBe(true);
    expect(nbAttaques(etat)).toBe(n + 1);
    expect(moine.tour.bonus).toBe(false);
  });

  it('niveau 1 : pas de Credo ; niveau 2 : Credo = colonne de la fiche', () => {
    expect(carte(duel(1).etat, 'kaï', 'aptitude:deluge-de-coups')).toBeUndefined();
    const { etat, moine } = duel(2);
    expect(moine.ressources.credo).toBe(2);
    expect(carte(etat, 'kaï', 'aptitude:deluge-de-coups')!.jouable).toBe(true);
    expect(carte(etat, 'kaï', 'aptitude:frappe-etourdissante')).toBeUndefined(); // niveau 5
  });

  it('Déluge de coups : 1 point de Credo, deux attaques, une ou deux cibles', () => {
    const { etat, moine } = duel(2);
    const n = nbAttaques(etat);
    expect(jouer(etat, 'aptitude:deluge-de-coups', ['ogre']).ok).toBe(true);
    expect(nbAttaques(etat)).toBe(n + 2);
    expect(moine.ressources.credo).toBe(1);
    expect(moine.tour.bonus).toBe(false);

    const deux = combat([heroClasse('moine', 2, 'Kaï', 1, 1), monstre('squelette', 2, 1, 'sq1'), monstre('squelette', 1, 2, 'sq2')]);
    combattant(deux, 'sq1').caBase = 1;
    combattant(deux, 'sq2').caBase = 1;
    jouer(deux, 'aptitude:deluge-de-coups', ['sq1', 'sq2']);
    const cibles = deux.journal.filter((e) => e.type === 'attaque').map((e) => e.cible);
    expect(cibles).toEqual(['sq1', 'sq2']);
  });

  it('sans point de Credo, les cartes de Credo sont refusées mais les versions gratuites restent jouables', () => {
    const { etat, moine } = duel(2);
    moine.ressources.credo = 0;
    for (const id of ['aptitude:deluge-de-coups', 'aptitude:patience-defensive-credo', 'aptitude:porte-par-le-vent-credo']) expect(carte(etat, 'kaï', id)!.jouable, id).toBe(false);
    expect(carte(etat, 'kaï', 'aptitude:patience-defensive')!.jouable).toBe(true);
    expect(carte(etat, 'kaï', 'aptitude:porte-par-le-vent')!.jouable).toBe(true);
  });

  it('Patience défensive et Porté par le vent', () => {
    const a = duel(2);
    jouer(a.etat, 'aptitude:patience-defensive');
    expect(a.moine.tour.desengage).toBe(true);
    expect(a.moine.ressources.credo).toBe(2);

    const b = duel(2);
    jouer(b.etat, 'aptitude:patience-defensive-credo');
    expect(b.moine.tour.desengage && b.moine.tour.esquive).toBe(true);
    expect(b.moine.ressources.credo).toBe(1);

    const c = duel(2);
    const mouvement = c.moine.tour.mouvement;
    jouer(c.etat, 'aptitude:porte-par-le-vent');
    expect(c.moine.tour.mouvement).toBe(mouvement + vitesse(c.moine));
    expect(c.moine.tour.desengage).toBe(false);

    const d = duel(2);
    const mouvementD = d.moine.tour.mouvement;
    jouer(d.etat, 'aptitude:porte-par-le-vent-credo');
    expect(d.moine.tour.desengage).toBe(true);
    expect(d.moine.tour.mouvement).toBeGreaterThan(mouvementD);
    expect(d.moine.ressources.credo).toBe(1);
  });

  it('Frappe étourdissante : après un coup, 1 Credo, une fois par tour ; sauvegarde ratée = Étourdi', () => {
    const { etat, moine, cible } = duel(5);
    expect(carte(etat, 'kaï', 'aptitude:frappe-etourdissante')!.jouable).toBe(false); // pas encore touché
    etat.desImposes = [15];
    jouer(etat, 'attaque:arts-martiaux', ['ogre']);
    const k = carte(etat, 'kaï', 'aptitude:frappe-etourdissante')!;
    expect(k.jouable).toBe(true);
    expect(k.cout).toBe('gratuit');
    cible.sauvegardes.con = -5;
    etat.desImposes = [5];
    expect(jouer(etat, 'aptitude:frappe-etourdissante', ['ogre']).ok).toBe(true);
    expect(moine.ressources.credo).toBe(4);
    expect(aEtat(cible, 'etourdi')).toBe(true);
    expect(carte(etat, 'kaï', 'aptitude:frappe-etourdissante')!.raison).toMatch(/Une fois par tour/);
    // Étourdi : ne peut plus agir, échoue aux sauvegardes de Force et de Dextérité, les attaques contre lui ont l'Avantage.
    expect(sauvegarde(etat, cible, 'dex', 1)).toBe(false);
    etat.desImposes = [3, 18];
    jouer(etat, 'attaque:arts-martiaux', ['ogre']);
    expect(etat.journal.filter((e) => e.type === 'attaque').at(-1)!.details?.avantage).toBe(true);
    // Il passe son tour sans pouvoir agir ; la condition prend fin au début du prochain tour du Moine.
    expect(peutAgir(cible)).toBe(false);
    const pvAvant = moine.pv;
    finTour(etat);
    expect(moine.pv).toBe(pvAvant); // l'ogre étourdi n'a pas frappé
    expect(aEtat(cible, 'etourdi')).toBe(false);
    expect(etat.journal.at(-1)!.texte).toMatch(/Tour de Kaï/);
  });

  it('Frappe étourdissante : sauvegarde réussie = Vitesse réduite de moitié et Avantage à la prochaine attaque', () => {
    const { etat, cible } = duel(5);
    etat.desImposes = [15];
    jouer(etat, 'attaque:arts-martiaux', ['ogre']);
    cible.sauvegardes.con = 30;
    const vitesseAvant = vitesse(cible);
    etat.desImposes = [10];
    jouer(etat, 'aptitude:frappe-etourdissante', ['ogre']);
    expect(aEtat(cible, 'etourdi')).toBe(false);
    expect(cible.modificateurs.some((m) => m.type === 'avantage_contre')).toBe(true);
    expect(vitesse(cible)).toBe(vitesseAvant - Math.floor(vitesseAvant / 2));
  });

  it('Métabolisme surnaturel : à l’Initiative, le Credo dépensé revient (une fois par repos long)', () => {
    const h = heroClasse('moine', 2, 'Kaï', 1, 1);
    h.ressources.credo = 0;
    const etat = combat([h, monstre('ogre', 2, 1)]);
    const moine = combattant(etat, 'kaï');
    expect(moine.ressources.credo).toBe(2);
    expect(moine.ressources.metabolisme).toBe(0);
    expect(etat.journal.some((e) => /Métabolisme surnaturel/.test(e.texte))).toBe(true);
    // Rien à récupérer : l'usage n'est pas gaspillé.
    const plein = combattant(combat([heroClasse('moine', 2, 'Kaï', 1, 1), monstre('ogre', 2, 1)]), 'kaï');
    expect(plein.ressources.metabolisme).toBe(1);
  });

  it('le Credo revient au repos court et au repos long', () => {
    const p = personnageDepuisFiche(fiche('moine', 5, 'Kaï'), { id: 'kai' });
    expect(p.ressources.credo).toBe(5);
    p.ressources.credo = 0;
    recuperer(p, 'court', () => 0.5);
    expect(p.ressources.credo).toBe(5);
  });
});

describe('robustesse : l’IA joue des groupes avec ces classes sans planter', () => {
  for (const classe of ['barde', 'paladin', 'moine']) {
    it(`${classe} niveau 5 avec deux alliés contre des gobelours`, () => {
      const hero = (c: string, nom: string, x: number, y: number) => heroClasse(c, 5, nom, x, y);
      const etat = creerCombat(
        ARENE,
        [hero(classe, 'Test', 1, 1), hero('guerrier', 'Bran', 1, 2), hero('clerc', 'Hilda', 1, 3), monstre('combattant-gobelours', 8, 1, 'g1'), monstre('combattant-gobelours', 8, 3, 'g2')],
        7,
        { elan: false },
      );
      for (let i = 0; i < 200 && !etat.vainqueur; i++) jouerTourSimple(etat, ctx);
      expect(etat.vainqueur).toBeDefined();
    });
  }
});
