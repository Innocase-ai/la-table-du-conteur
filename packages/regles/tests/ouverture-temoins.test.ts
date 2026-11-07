// Crocheter et forcer devant témoins : un jet de Discrétion contre un DD secret, une baisse d'attitude si le groupe est
// repéré, le héros équipé de préférence, et le silence quand personne ne regarde. Dés imposés : 0,999 donne un 20, 0 donne un 1.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  creerGenerateur,
  etatInitial,
  herosPreTires,
  nouvellePartie,
  ouvrir,
  personnageDepuisFiche,
  pnjPresents,
  type Generateur,
  type Personnage,
  type PartieMonde,
} from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const charger = (id: string) => {
  const r = chargerMonde(join(RACINE_MONDES, id));
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
const SALLE = 'ta-salle';

describe('la salle de la taverne : des témoins', () => {
  it('Maëva et Gaspard sont bien là, ce sont les témoins du tiroir de la caisse', () => {
    const p = partieDe(port, SALLE, SUCCES);
    expect(pnjPresents(p).map((n) => n.id).sort()).toEqual(['gaspard-vent', 'maeva-brisant']);
    expect(port.tresors.get('z1-t-tiroir-de-la-caisse')?.acces.verrou?.dd).toBe(13);
  });

  it('crocheter : un jet de Discrétion secret d’abord, puis l’ouverture ; vus, les témoins perdent 10 d’attitude', () => {
    const p = partieDe(port, SALLE, ECHEC);
    const avant = ['maeva-brisant', 'gaspard-vent'].map((id) => p.etat.attitudes[id] ?? 0);
    const res = ouvrir(p, TIROIR, 'crocheter');
    expect(res.ok).toBe(true);
    expect(res.jets.map((j) => j.test)).toEqual(['discretion', 'escamotage']);
    const guet = res.jets[0]!;
    expect(guet.ddSecret).toBe(true);
    expect(guet.dd).toBe(12); // 10 + 2 pour le deuxième témoin
    expect(guet.reussite).toBe(false);
    expect(res.constats.join(' ')).toMatch(/Maëva Brisant et Gaspard Vent vous ont vus crocheter le tiroir de la caisse/i);
    ['maeva-brisant', 'gaspard-vent'].forEach((id, i) => expect(p.etat.attitudes[id], id).toBe(avant[i]! - 10));
  });

  it('crocheter sans être vu : aucun message, attitude inchangée, et le tiroir s’ouvre', () => {
    const p = partieDe(port, SALLE, SUCCES);
    const avant = p.etat.attitudes['maeva-brisant'] ?? 0;
    const res = ouvrir(p, TIROIR, 'crocheter');
    expect(res.jets[0]!.test).toBe('discretion');
    expect(res.jets[0]!.reussite).toBe(true);
    expect(res.constats.join(' ')).not.toMatch(/vous (a|ont) vus/);
    expect(p.etat.attitudes['maeva-brisant'] ?? 0).toBe(avant);
    expect(p.etat.exploration.ouverts).toContain('tresor:z1-t-tiroir-de-la-caisse');
  });

  it('forcer fait du bruit : DD de repérage +5 et −15 d’attitude quand on est vu', () => {
    const p = partieDe(port, SALLE, ECHEC);
    const avant = p.etat.attitudes['maeva-brisant'] ?? 0;
    const res = ouvrir(p, TIROIR, 'forcer');
    const guet = res.jets[0]!;
    expect(guet.test).toBe('discretion');
    expect(guet.dd).toBe(17);
    expect(res.jets[1]!.test).toBe('athletisme');
    expect(res.constats.join(' ')).toMatch(/vous ont vus forcer/);
    expect(p.etat.attitudes['maeva-brisant'] ?? 0).toBe(avant - 15);
  });

  it('un seul témoin : DD de base 10, accord au singulier', () => {
    const p = partieDe(port, SALLE, ECHEC);
    p.etat.pnjEtats['gaspard-vent'] = 'mort';
    const res = ouvrir(p, TIROIR, 'crocheter');
    expect(res.jets[0]!.dd).toBe(10);
    expect(res.constats.join(' ')).toMatch(/Maëva Brisant vous a vus crocheter/);
  });

  it('avec la clé, personne ne regarde : ni jet de repérage ni baisse d’attitude', () => {
    const p = partieDe(val, val.tresors.get('vei-t-reserve-de-bertille')!.lieu, ECHEC);
    p.etat.inventaire['vei-cle-de-la-cave'] = 1;
    const res = ouvrir(p, { tresor: 'vei-t-reserve-de-bertille' }, 'cle');
    expect(res.jets).toEqual([]);
    expect(res.constats.join(' ')).toMatch(/La clé ouvre/);
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
