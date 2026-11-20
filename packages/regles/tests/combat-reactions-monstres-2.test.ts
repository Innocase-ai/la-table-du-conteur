// F6 (PRD-SAGA), lot 7 — d'autres réactions de monstres : Bouclier de la liche et du mage (+5 CA jusqu'au prochain tour), Attaque redirigée du chef gobelin,
// Parade de projectile du géant des pierres, Accès d'ingéniosité du sphinx. Suite de `combat-reactions-monstres.test.ts` (lot 5).
import { describe, expect, it } from 'vitest';
import { attaqueArme, creerCombat, jetAttaque, sauvegarde } from '../src/combat/moteur';
import { preparerRencontre, RENCONTRES, type Rencontre } from '../src/combat/prototype';
import { RESISTANCE_LEGENDAIRE, type Combattant, type EtatCombat } from '../src/combat/etat';
import { chargerDonneesSrd } from '../src/donnees-node';

const donnees = chargerDonneesSrd();

/** Un combat entre les six héros et des monstres (un de chaque profil donné). */
function groupe(...profils: string[]): { etat: EtatCombat; monstres: Combattant[]; heros: Combattant[] } {
  const r: Rencontre = { ...RENCONTRES[0]!, id: 'reaction-essai', nom: 'Réaction (essai)', monstres: profils.map((profil) => ({ profil, nombre: 1 })) };
  const { grille, combattants } = preparerRencontre(r, donnees);
  const etat = creerCombat(grille, combattants, 3);
  return { etat, monstres: etat.combattants.filter((c) => c.camp === 'monstres'), heros: etat.combattants.filter((c) => c.camp === 'heros') };
}
const duel = (profil: string) => {
  const g = groupe(profil);
  return { etat: g.etat, monstre: g.monstres[0]!, heros: g.heros };
};

/** Une attaque dont le d20 est imposé et dont le total vaut la CA nue du monstre plus `ecart`. */
function attaquer(etat: EtatCombat, h: Combattant, monstre: Combattant, d: number, ecart: number) {
  etat.desImposes = [d, d];
  const ca = monstre.caBase + monstre.modificateurs.filter((m) => m.type === 'bonus_ca').reduce((s, m) => s + (m.valeur ?? 0), 0);
  return jetAttaque(etat, h, monstre, ca + ecart - d, 'corps-a-corps');
}

describe('Bouclier de la liche et du mage (+5 CA jusqu’à son prochain tour)', () => {
  it('une attaque qui touche de justesse rate, et le bonus reste pour les attaques suivantes', () => {
    const { etat, monstre, heros } = duel('liche');
    expect(attaquer(etat, heros[0]!, monstre, 12, 3).touche).toBe(false);
    expect(monstre.ressources.reaction).toBe(0);
    const bonus = monstre.modificateurs.find((m) => m.id === 'reaction-ca');
    expect(bonus?.valeur).toBe(5);
    expect(bonus?.expire).toEqual({ moment: 'debut_tour', de: monstre.id });
    // Un coup qui aurait touché la CA de base (5 sous la CA bonus comprise) rate maintenant : sa CA vaut +5.
    expect(attaquer(etat, heros[0]!, monstre, 12, -5).touche).toBe(false);
    expect(etat.journal.some((e) => /jusqu’à son prochain tour/.test(e.texte))).toBe(true);
  });

  it('le mage a la même réaction', () => {
    const { etat, monstre, heros } = duel('mage');
    expect(attaquer(etat, heros[0]!, monstre, 12, 0).touche).toBe(false);
    expect(monstre.modificateurs.some((m) => m.id === 'reaction-ca')).toBe(true);
  });
});

describe('Attaque redirigée du chef gobelin', () => {
  const mise = () => {
    const g = groupe('chef-gobelin', 'combattant-gobelin');
    const chef = g.monstres[0]!;
    const gobelin = g.monstres[1]!;
    gobelin.position = { x: chef.position.x, y: chef.position.y + 1 };
    chef.ressources.reaction = 1;
    return { ...g, chef, gobelin };
  };

  it('l’attaque contre lui est reportée sur l’allié adjacent, avec qui il change de place', () => {
    const { etat, heros, chef, gobelin } = mise();
    const avant = { chef: { ...chef.position }, gobelin: { ...gobelin.position } };
    etat.desImposes = [20, 20];
    attaqueArme(etat, heros[0]!, chef, heros[0]!.attaques[0]!);
    expect(chef.ressources.reaction).toBe(0);
    expect(chef.position).toEqual(avant.gobelin);
    expect(gobelin.position).toEqual(avant.chef);
    expect(etat.journal.some((e) => /change de place avec .*reçoit/.test(e.texte))).toBe(true);
    expect(gobelin.pv).toBeLessThan(gobelin.pvMax);
    expect(chef.pv).toBe(chef.pvMax);
  });

  it('une fois par round : la deuxième attaque touche le chef', () => {
    const { etat, heros, chef } = mise();
    etat.desImposes = [20, 20, 20, 20];
    attaqueArme(etat, heros[0]!, chef, heros[0]!.attaques[0]!);
    attaqueArme(etat, heros[0]!, chef, heros[0]!.attaques[0]!);
    expect(chef.pv).toBeLessThan(chef.pvMax);
  });

  it('sans allié adjacent de taille Petite ou Moyenne, rien ne se passe', () => {
    const { etat, heros, chef, gobelin } = mise();
    gobelin.position = { x: chef.position.x + 4, y: chef.position.y };
    etat.desImposes = [20, 20];
    attaqueArme(etat, heros[0]!, chef, heros[0]!.attaques[0]!);
    expect(chef.ressources.reaction).toBe(1);
    expect(chef.pv).toBeLessThan(chef.pvMax);
    // Un allié Grand (ogre) est trop gros.
    const g = groupe('chef-gobelin', 'ogre');
    const c2 = g.monstres[0]!;
    const ogre = g.monstres[1]!;
    ogre.position = { x: c2.position.x, y: c2.position.y + 1 };
    g.etat.desImposes = [20, 20];
    attaqueArme(g.etat, g.heros[0]!, c2, g.heros[0]!.attaques[0]!);
    expect(c2.ressources.reaction).toBe(1);
  });
});

describe('Parade de projectile du géant des pierres (dégâts réduits contre une attaque à distance)', () => {
  it('une attaque à distance qui touche voit ses dégâts physiques baisser ; au corps à corps, non', () => {
    const { etat, monstre, heros } = duel('geant-des-pierres');
    const archer = heros.find((h) => h.attaques.some((a) => a.mode === 'distance'))!;
    const arc = archer.attaques.find((a) => a.mode === 'distance')!;
    etat.desImposes = [20, 20];
    attaqueArme(etat, archer, monstre, arc);
    expect(monstre.ressources.reaction).toBe(0);
    expect(etat.journal.some((e) => /réagit \(Parade de projectile\) : les dégâts baissent de \d+/.test(e.texte))).toBe(true);
    const d = duel('geant-des-pierres');
    const mele = d.heros.find((h) => h.attaques.some((a) => a.mode === 'corps-a-corps'))!;
    d.etat.desImposes = [20, 20];
    attaqueArme(d.etat, mele, d.monstre, mele.attaques.find((a) => a.mode === 'corps-a-corps')!);
    expect(d.monstre.ressources.reaction).toBe(1);
  });
});

describe('Accès d’ingéniosité du sphinx (+2 à un jet de sauvegarde raté de lui ou d’un allié à 9 m)', () => {
  it('un jet raté de 2 est réussi ; la réaction est dépensée, le suivant échoue', () => {
    const { etat, monstre } = duel('sphinx-erudit');
    // Le sphinx a aussi une Résistance légendaire : on la met de côté pour ne juger que l'Accès d'ingéniosité.
    monstre.ressources[RESISTANCE_LEGENDAIRE] = 0;
    etat.desImposes = [10, 10];
    const dd = 10 + monstre.sauvegardes.con + 2;
    expect(sauvegarde(etat, monstre, 'con', dd)).toBe(true);
    expect(monstre.ressources.reaction).toBe(0);
    expect(sauvegarde(etat, monstre, 'con', dd)).toBe(false);
  });

  it('un jet raté de 3 ou plus n’est pas rattrapé et la réaction est gardée', () => {
    const { etat, monstre } = duel('sphinx-erudit');
    // Le sphinx a aussi une Résistance légendaire : on la met de côté pour ne juger que l'Accès d'ingéniosité.
    monstre.ressources[RESISTANCE_LEGENDAIRE] = 0;
    etat.desImposes = [10];
    expect(sauvegarde(etat, monstre, 'con', 10 + monstre.sauvegardes.con + 3)).toBe(false);
    expect(monstre.ressources.reaction).toBe(1);
  });

  it('aide aussi un allié à 9 m ou moins, pas plus loin', () => {
    const g = groupe('sphinx-erudit', 'combattant-gobelin');
    const sphinx = g.monstres[0]!;
    sphinx.ressources[RESISTANCE_LEGENDAIRE] = 0;
    const gobelin = g.monstres[1]!;
    gobelin.position = { x: sphinx.position.x + 4, y: sphinx.position.y };
    g.etat.desImposes = [10, 10];
    const dd = 10 + gobelin.sauvegardes.dex + 2;
    expect(sauvegarde(g.etat, gobelin, 'dex', dd)).toBe(true);
    sphinx.ressources.reaction = 1;
    gobelin.position = { x: sphinx.position.x + 8, y: sphinx.position.y };
    g.etat.desImposes = [10];
    expect(sauvegarde(g.etat, gobelin, 'dex', dd)).toBe(false);
  });
});
