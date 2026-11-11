// Crocheter et forcer devant témoins : un jet de Discrétion contre un DD secret ; vu, le groupe est arrêté net (pas d'ouverture,
// pas de piège), les témoins perdent de l'attitude, restent en alerte la journée et le disent au prochain dialogue ; calmés par
// une persuasion réussie, ils cessent de surveiller. Aussi : le héros équipé de préférence et le silence quand personne ne regarde.
// Dés imposés : 0,999 donne un 20, 0 donne un 1.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  creerGenerateur,
  etatInitial,
  herosPreTires,
  influencer,
  nouvellePartie,
  ouvrir,
  parler,
  personnageDepuisFiche,
  pnjPresents,
  type Generateur,
  type Personnage,
  type PartieMonde,
} from '../src';
import { chargerMonde } from '../src/monde/chargeur';
import { dossierMonde } from './mondes-essai';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const charger = (id: string) => {
  const r = chargerMonde(dossierMonde(id));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  return r.monde;
};
const port = charger('port-sillage');
const val = charger('val-des-cendres');

const SUCCES: Generateur = () => 0.999;
const ECHEC: Generateur = () => 0;

/** Le groupe des héros pré-tirés ; `outils` donne les outils de voleur aux héros nommés (Pip par défaut). */
function groupe(outils: string[] = ['Pip']): Personnage[] {
  return herosPreTires(srd).map((h) => personnageDepuisFiche(h.fiche, { id: h.fiche.nom.toLowerCase(), outils: outils.includes(h.fiche.nom) ? ['outils-de-voleur'] : [] }));
}

function partieDe(dm: typeof port, lieu: string, gen: Generateur, heros = groupe()): PartieMonde {
  const p = nouvellePartie(dm, etatInitial(dm, dm.monde.niveaux.min), heros, gen);
  p.etat.lieu = lieu;
  return p;
}

const TIROIR = { tresor: 'z1-t-tiroir-de-la-caisse' };
const CLE_TIROIR = 'tresor:z1-t-tiroir-de-la-caisse';
const SALLE = 'ta-salle';
const attitudeDe = (p: PartieMonde, id: string) => p.etat.attitudes[id] ?? 0;

describe('la salle de la taverne : des témoins', () => {
  it('Maëva et Gaspard sont bien là, ce sont les témoins du tiroir de la caisse', () => {
    const p = partieDe(port, SALLE, SUCCES);
    expect(pnjPresents(p).map((n) => n.id).sort()).toEqual(['gaspard-vent', 'maeva-brisant']);
    expect(port.tresors.get('z1-t-tiroir-de-la-caisse')?.acces.verrou?.dd).toBe(13);
  });

  it('pas vu : un jet de Discrétion secret, puis l’ouverture ; aucun message, attitude inchangée', () => {
    const p = partieDe(port, SALLE, SUCCES);
    const avant = attitudeDe(p, 'maeva-brisant');
    const res = ouvrir(p, TIROIR, 'crocheter');
    expect(res.jets.map((j) => j.test)).toEqual(['discretion', 'escamotage']);
    expect(res.jets[0]!.ddSecret).toBe(true);
    expect(res.jets[0]!.dd).toBe(12); // 10 + 2 pour le deuxième témoin
    expect(res.jets[0]!.reussite).toBe(true);
    expect(res.constats.join(' ')).not.toMatch(/arrêtent? net/);
    expect(attitudeDe(p, 'maeva-brisant')).toBe(avant);
    expect(p.etat.exploration.ouverts).toContain(CLE_TIROIR);
    expect(p.etat.exploration.vus).toBeUndefined();
  });

  it('vu : le groupe est arrêté net, sans jet d’ouverture ; le tiroir reste fermé', () => {
    const p = partieDe(port, SALLE, ECHEC);
    const avant = ['maeva-brisant', 'gaspard-vent'].map((id) => attitudeDe(p, id));
    const res = ouvrir(p, TIROIR, 'crocheter');
    expect(res.ok).toBe(true);
    expect(res.jets.map((j) => j.test)).toEqual(['discretion']);
    expect(res.jets[0]!.reussite).toBe(false);
    expect(res.constats.join(' ')).toMatch(/Maëva Brisant et Gaspard Vent vous ont vus crocheter le tiroir de la caisse et vous arrêtent net/);
    expect(p.etat.exploration.ouverts).not.toContain(CLE_TIROIR);
    ['maeva-brisant', 'gaspard-vent'].forEach((id, i) => expect(attitudeDe(p, id), id).toBe(avant[i]! - 10));
    expect(p.etat.exploration.vus?.['maeva-brisant']).toMatchObject({ jour: p.etat.jour, methode: 'crocheter', objet: 'le tiroir de la caisse' });
  });

  it('vu en forçant : DD de repérage +5, −15 d’attitude, et le coffre résiste quand même', () => {
    const p = partieDe(port, SALLE, ECHEC);
    const avant = attitudeDe(p, 'maeva-brisant');
    const res = ouvrir(p, TIROIR, 'forcer');
    expect(res.jets).toHaveLength(1);
    expect(res.jets[0]!.dd).toBe(17);
    expect(res.constats.join(' ')).toMatch(/vous ont vus forcer .* et vous arrêtent net/);
    expect(attitudeDe(p, 'maeva-brisant')).toBe(avant - 15);
    expect(p.etat.exploration.ouverts).not.toContain(CLE_TIROIR);
  });

  it('un seul témoin : DD de base 10, accord au singulier', () => {
    const p = partieDe(port, SALLE, ECHEC);
    p.etat.pnjEtats['gaspard-vent'] = 'mort';
    const res = ouvrir(p, TIROIR, 'crocheter');
    expect(res.jets[0]!.dd).toBe(10);
    expect(res.constats.join(' ')).toMatch(/Maëva Brisant vous a vus crocheter .* et vous arrête net/);
  });

  it('arrêté, le piège du coffre ne se déclenche pas : on n’a pas touché à la serrure', () => {
    const val2 = partieDe(val, 'vei-cellier-du-bailli', ECHEC);
    // On met un témoin dans le cellier désert : il voit le groupe, le coffret piégé reste intact.
    const temoin = [...val.pnj.values()].find((n) => n.id !== undefined)!;
    val2.etat.pnjLieux[temoin.id] = 'vei-cellier-du-bailli';
    const res = ouvrir(val2, { tresor: 'vei-t-plancher-du-bailli' }, 'crocheter');
    expect(res.constats.join(' ')).toMatch(/vous arrête(?:nt)? net/);
    expect(res.jets.map((j) => j.test)).toEqual(['discretion']);
    expect(val2.etat.exploration.pieges['vei-p-aiguille-du-coffret']).toBeUndefined();
    expect(val2.etat.exploration.ouverts).not.toContain('tresor:vei-t-plancher-du-bailli');
  });

  it('avec la clé, personne ne regarde : ni jet de repérage ni arrêt', () => {
    const p = partieDe(val, val.tresors.get('vei-t-reserve-de-bertille')!.lieu, ECHEC);
    p.etat.inventaire['vei-cle-de-la-cave'] = 1;
    const res = ouvrir(p, { tresor: 'vei-t-reserve-de-bertille' }, 'cle');
    expect(res.jets).toEqual([]);
    expect(res.constats.join(' ')).toMatch(/La clé ouvre/);
  });
});

describe('les témoins restent en alerte', () => {
  it('toute la journée : retenter sous leur nez est arrêté sans jet, même avec des dés parfaits', () => {
    const p = partieDe(port, SALLE, ECHEC);
    ouvrir(p, TIROIR, 'crocheter');
    p.gen = SUCCES;
    const res = ouvrir(p, TIROIR, 'forcer');
    expect(res.jets).toEqual([]);
    expect(res.constats.join(' ')).toMatch(/Maëva Brisant et Gaspard Vent vous surveillent de près : impossible de forcer le tiroir de la caisse sous leur nez/);
    expect(p.etat.exploration.ouverts).not.toContain(CLE_TIROIR);
  });

  it('le lendemain, ils ont baissé leur garde : le jet de repérage reprend (l’attitude, elle, reste basse)', () => {
    const p = partieDe(port, SALLE, ECHEC);
    ouvrir(p, TIROIR, 'crocheter');
    const attitude = attitudeDe(p, 'maeva-brisant');
    p.etat.jour += 1;
    p.gen = SUCCES;
    const res = ouvrir(p, TIROIR, 'crocheter');
    expect(res.jets.map((j) => j.test)).toEqual(['discretion', 'escamotage']);
    expect(p.etat.exploration.ouverts).toContain(CLE_TIROIR);
    expect(attitudeDe(p, 'maeva-brisant')).toBe(attitude);
  });

  it('un seul témoin en alerte : le texte est au singulier', () => {
    const p = partieDe(port, SALLE, ECHEC);
    p.etat.pnjEtats['gaspard-vent'] = 'mort';
    ouvrir(p, TIROIR, 'crocheter');
    const res = ouvrir(p, TIROIR, 'crocheter');
    expect(res.constats.join(' ')).toMatch(/Maëva Brisant vous surveille de près .* sous son nez/);
  });
});

describe('le dialogue après l’incident', () => {
  it('le PNJ qui a vu le groupe le lui dit d’abord, une seule fois', () => {
    const p = partieDe(port, SALLE, ECHEC);
    ouvrir(p, TIROIR, 'crocheter');
    p.gen = SUCCES;
    const premiere = parler(p, 'maeva-brisant');
    expect(premiere.narrations.join(' ')).toMatch(/Je vous ai vus crocheter le tiroir de la caisse\. Vous croyez que je n'ai rien vu/);
    expect(p.etat.exploration.vus?.['maeva-brisant']?.confronte).toBe(true);
    const seconde = parler(p, 'maeva-brisant');
    expect(seconde.narrations.join(' ')).not.toMatch(/Je vous ai vus/);
  });

  it('un PNJ qui n’a rien vu ne confronte personne', () => {
    const p = partieDe(port, SALLE, SUCCES);
    ouvrir(p, TIROIR, 'crocheter');
    expect(parler(p, 'maeva-brisant').narrations.join(' ')).not.toMatch(/Je vous ai vus/);
  });

  it('une persuasion réussie calme le PNJ : il cesse de surveiller, et on peut réessayer', () => {
    const p = partieDe(port, SALLE, ECHEC);
    ouvrir(p, TIROIR, 'crocheter');
    p.gen = SUCCES;
    const res = influencer(p, 'maeva-brisant', 'persuasion');
    expect(res.constats.join(' ')).toMatch(/Maëva Brisant se calme : elle ne vous surveille plus/);
    expect(p.etat.exploration.vus?.['maeva-brisant']).toBeUndefined();
    // Gaspard, lui, surveille toujours : retenter reste impossible tant qu'un des deux est là.
    expect(ouvrir(p, TIROIR, 'crocheter').constats.join(' ')).toMatch(/Gaspard Vent vous surveille de près/);
  });

  it('une persuasion ratée ne calme pas le PNJ', () => {
    const p = partieDe(port, SALLE, ECHEC);
    ouvrir(p, TIROIR, 'crocheter');
    const res = influencer(p, 'maeva-brisant', 'persuasion');
    expect(res.constats.join(' ')).not.toMatch(/se calme/);
    expect(p.etat.exploration.vus?.['maeva-brisant']).toBeDefined();
  });
});

describe('un lieu sans témoin', () => {
  it('le cellier du bailli est désert : crocheter ou forcer ne demande aucun jet de repérage', () => {
    for (const methode of ['crocheter', 'forcer'] as const) {
      const p = partieDe(val, 'vei-cellier-du-bailli', SUCCES);
      expect(pnjPresents(p).filter((n) => !p.etat.escortes?.includes(n.id))).toEqual([]);
      const res = ouvrir(p, { tresor: 'vei-t-plancher-du-bailli' }, methode);
      // Le coffret est piégé : son piège ajoute un jet de sauvegarde, mais aucun jet de Discrétion (personne ne regarde).
      expect(res.jets.some((j) => j.test === 'discretion'), methode).toBe(false);
      expect(res.jets[0]!.test, methode).toBe(methode === 'crocheter' ? 'escamotage' : 'athletisme');
    }
  });
});

describe('le héros qui crochète', () => {
  it('préfère un héros qui a les outils de voleur, même au bonus d’Escamotage plus faible', () => {
    const heros = groupe(['Bran']); // Pip, le meilleur voleur, n'a plus ses outils ; Bran les a
    const p = partieDe(val, 'vei-cellier-du-bailli', SUCCES, heros);
    const meilleur = [...heros].sort((x, y) => y.fiche.competences.escamotage.bonus - x.fiche.competences.escamotage.bonus)[0]!;
    expect(meilleur.id).not.toBe('bran');
    const res = ouvrir(p, { tresor: 'vei-t-plancher-du-bailli' }, 'crocheter');
    expect(res.ok).toBe(true);
    expect(res.jets[0]!.qui).toBe('bran');
  });

  it('personne n’a d’outils : refus, comme avant', () => {
    const p = partieDe(val, 'vei-cellier-du-bailli', SUCCES, groupe([]));
    const res = ouvrir(p, { tresor: 'vei-t-plancher-du-bailli' }, 'crocheter');
    expect(res.ok).toBe(false);
    expect(res.refus).toMatch(/outils de voleur/);
  });

  it('forcer ne demande aucun outil', () => {
    const p = partieDe(val, 'vei-cellier-du-bailli', SUCCES, groupe([]));
    const res = ouvrir(p, { tresor: 'vei-t-plancher-du-bailli' }, 'forcer');
    expect(res.ok).toBe(true);
    expect(res.jets[0]!.test).toBe('athletisme');
  });
});

describe('les dés du repérage sont ceux de la partie', () => {
  it('une même graine donne le même repérage', () => {
    const a = ouvrir(partieDe(port, SALLE, creerGenerateur(7)), TIROIR, 'crocheter');
    const b = ouvrir(partieDe(port, SALLE, creerGenerateur(7)), TIROIR, 'crocheter');
    expect(a.jets).toEqual(b.jets);
    expect(a.constats).toEqual(b.constats);
  });
});
