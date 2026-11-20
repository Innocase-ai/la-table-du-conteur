// F5 (PRD-SAGA), pas (d) — la saga voyage avec la partie : les objets propres au monde quitté (leurs définitions), le carnet avec ses phrases, la migration 4 → 5.
// Deux jeux d'essai servent d'épisodes : Le Val des Cendres (l'épisode quitté) et Port-Sillage (l'épisode d'arrivée).
import { describe, expect, it } from 'vitest';
import { bilanDeFin, creerMoteur, entrerDansEpisode, groupeDeTest, MODULES_STANDARD, Objet, VERSION_PARTIE, type DonneesMonde, type Moteur, type Partie } from '../src';
import { chargerDonneesSrd } from '../src/donnees-node';
import { chargerMonde } from '../src/monde/chargeur';
import { dossierMonde } from './mondes-essai';

const srd = chargerDonneesSrd();
const charger = (id: string): DonneesMonde => {
  const r = chargerMonde(dossierMonde(id));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  return r.monde;
};
const moteurDe = (dm: DonneesMonde): Moteur => creerMoteur({ dm, srd }, MODULES_STANDARD);

/** L'épisode quitté : le Val, une arme nommée en main, une relique au sac, et un écho émis avec sa phrase. */
function episodeJoue(): { dm: DonneesMonde; partie: Partie } {
  const dm = charger('val-des-cendres');
  dm.objets.set('arme-du-val', Objet.parse({ id: 'arme-du-val', nom: 'Lame du Val', categorie: 'arme', base: 'epee-longue', valeurPo: 100, resume: 'Une lame du Val.', rarete: 'peu-commun', bonus: { attaque: 1, degats: 1 } }));
  dm.objets.set('relique-du-val', Objet.parse({ id: 'relique-du-val', nom: 'Relique du Val', categorie: 'divers', valeurPo: 1, resume: 'Une relique.', degre: 'unique' }));
  dm.monde.campagne = { emet: [{ id: 'val-village-sauve', quand: { flag: 'village-sauve' }, phrase: 'Vous avez sauvé le village du Val.' }, { id: 'val-jamais', quand: { flag: 'jamais' }, phrase: 'Jamais.' }] };
  const moteur = moteurDe(dm);
  const partie = moteur.executer(moteur.nouvellePartie(groupeDeTest(srd, 3), { graine: 11, niveau: 3 }), { type: 'commencer' }).partie;
  partie.etat.inventaire = { rations: 2, 'relique-du-val': 1, 'arme-du-val': 1 };
  partie.etat.flags['village-sauve'] = true;
  (partie.groupe[0]!.equipe as { emplacements: Record<string, string> }).emplacements['j1.droite'] = 'arme-du-val';
  return { dm, partie };
}

describe('le bilan porte le carnet avec ses phrases', () => {
  it('seuls les échos vrais à la fin ont leur phrase, rattachée à l’épisode qui les a émis', () => {
    const { dm, partie } = episodeJoue();
    const b = bilanDeFin(partie, { dm, srd });
    expect(b.campagne).toEqual(['val-village-sauve']);
    expect(b.carnet).toEqual([{ id: 'val-village-sauve', phrase: 'Vous avez sauvé le village du Val.', monde: 'val-des-cendres' }]);
  });

  it('un écho ajouté à la main (sans phrase déclarée) est dans le carnet de campagne mais pas dans les phrases', () => {
    const { dm, partie } = episodeJoue();
    const b = bilanDeFin(partie, { dm, srd }, { echos: ['a-la-main'] });
    expect(b.campagne).toContain('a-la-main');
    expect(b.carnet.map((e) => e.id)).toEqual(['val-village-sauve']);
  });
});

describe('l’entrée dans l’épisode suivant garde la saga', () => {
  const suite = () => {
    const { dm, partie } = episodeJoue();
    const bilan = bilanDeFin(partie, { dm, srd });
    const dm2 = charger('port-sillage');
    const moteur2 = moteurDe(dm2);
    const { partie: arrivee } = entrerDansEpisode(moteur2, bilan, { graine: 5 });
    return { bilan, dm2, moteur2, arrivee };
  };

  it('la partie porte `saga` : le carnet et les définitions des objets propres', () => {
    const { arrivee } = suite();
    expect(arrivee.saga?.carnet.map((e) => e.id)).toEqual(['val-village-sauve']);
    expect(arrivee.saga?.souvenirs.map((o) => o.id).sort()).toEqual(['arme-du-val', 'relique-du-val']);
  });

  it('le nouveau monde connaît ces objets, et l’arme gardée reste portée', () => {
    const { arrivee, dm2 } = suite();
    expect(dm2.objets.get('arme-du-val')?.nom).toBe('Lame du Val');
    expect(dm2.objets.get('relique-du-val')?.nom).toBe('Relique du Val');
    expect((arrivee.groupe[0]!.equipe as { emplacements: Record<string, string> }).emplacements['j1.droite']).toBe('arme-du-val');
    expect(arrivee.etat.inventaire['relique-du-val']).toBe(1);
  });

  it('un objet du nouveau monde qui porte le même identifiant l’emporte (le monde d’arrivée n’est pas écrasé)', () => {
    const { dm, partie } = episodeJoue();
    const bilan = bilanDeFin(partie, { dm, srd });
    const dm2 = charger('port-sillage');
    dm2.objets.set('relique-du-val', Objet.parse({ id: 'relique-du-val', nom: 'Autre relique', categorie: 'divers', valeurPo: 2, resume: 'Une autre.' }));
    entrerDansEpisode(moteurDe(dm2), bilan, { graine: 5 });
    expect(dm2.objets.get('relique-du-val')?.nom).toBe('Autre relique');
  });

  it('après sauvegarde et rechargement dans un moteur NEUF du même monde, les objets gardés sont rétablis', () => {
    const { arrivee } = suite();
    const json = JSON.stringify(arrivee);
    const dm3 = charger('port-sillage');
    expect(dm3.objets.has('arme-du-val')).toBe(false);
    const rechargee = moteurDe(dm3).charger(json);
    expect(dm3.objets.get('arme-du-val')?.nom).toBe('Lame du Val');
    expect(rechargee.saga?.carnet).toEqual(arrivee.saga?.carnet);
    expect(rechargee.etat.inventaire).toEqual(arrivee.etat.inventaire);
  });

  it('le bilan suivant cumule : les objets gardés et leurs phrases repartent dans l’épisode d’après', () => {
    const { arrivee, dm2 } = suite();
    dm2.monde.campagne = { emet: [{ id: 'port-allie', quand: { flag: 'port-allie' }, phrase: 'Le port vous doit une faveur.' }] };
    arrivee.etat.flags['port-allie'] = true;
    const b2 = bilanDeFin(arrivee, { dm: dm2, srd });
    expect(b2.carnet.map((e) => e.id)).toEqual(['val-village-sauve', 'port-allie']);
    expect(b2.carnet.find((e) => e.id === 'val-village-sauve')?.monde).toBe('val-des-cendres');
    expect(b2.souvenirs.map((o) => o.id).sort()).toEqual(['arme-du-val', 'relique-du-val']);
  });

  it('sans objet propre ni écho phrasé, la partie ne porte pas le champ `saga`', () => {
    const dm = charger('val-des-cendres');
    const moteur = moteurDe(dm);
    const p = moteur.executer(moteur.nouvellePartie(groupeDeTest(srd, 3), { graine: 2, niveau: 3 }), { type: 'commencer' }).partie;
    const b = bilanDeFin(p, { dm, srd });
    const { partie } = entrerDansEpisode(moteurDe(charger('port-sillage')), b, { graine: 5 });
    expect('saga' in partie).toBe(false);
  });

  it('une définition abîmée dans `saga` est ignorée au chargement (la partie se charge quand même)', () => {
    const { arrivee } = suite();
    const abimee = JSON.parse(JSON.stringify(arrivee)) as Partie & { saga: { souvenirs: unknown[] } };
    abimee.saga.souvenirs.push({ id: 'pas-un-objet' });
    const dm3 = charger('port-sillage');
    expect(() => moteurDe(dm3).charger(JSON.stringify(abimee))).not.toThrow();
    expect(dm3.objets.has('pas-un-objet')).toBe(false);
    expect(dm3.objets.has('arme-du-val')).toBe(true);
  });
});

describe('migration 4 → 5', () => {
  it('VERSION_PARTIE vaut 5 et une partie neuve est de version 5', () => {
    const moteur = moteurDe(charger('port-sillage'));
    expect(VERSION_PARTIE).toBe(5);
    expect(moteur.nouvellePartie(groupeDeTest(srd, 3), { graine: 1 }).version).toBe(5);
  });

  it.each([1, 2, 3, 4])('une sauvegarde de version %i se charge, passe en version 5, sans `saga`', (v) => {
    const moteur = moteurDe(charger('port-sillage'));
    const p = moteur.executer(moteur.nouvellePartie(groupeDeTest(srd, 3), { graine: 7, niveau: 3 }), { type: 'commencer' }).partie;
    const ancienne = { ...p, version: v };
    const migree = moteur.charger(JSON.stringify(ancienne));
    expect(migree.version).toBe(5);
    expect(migree.saga).toBeUndefined();
    expect(migree.etat.lieu).toBe(p.etat.lieu);
  });
});
