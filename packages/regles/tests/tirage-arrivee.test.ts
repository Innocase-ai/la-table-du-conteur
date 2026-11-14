// Le tirage d'arrivée : un dé à chaque arrivée dans un lieu (2 combat, 3 rencontre de PNJ, 4 trouvaille à fouiller, le reste rien). Un lieu
// n'est jamais vide, et il n'offre que 2 à 4 interactions en tout. Jeu d'essai : `carriere-essai` (le tirage y est actif).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { creerMoteur, groupeDeTest, MODULES_STANDARD, type DonneesMonde, type EvenementJeu, type Partie } from '../src';
import { chargerDonneesSrd } from '../src/donnees-node';
import { chargerMonde } from '../src/monde/chargeur';
import { budgetDuLieu, lieuSur, palierDuGroupe } from '../src/monde/hasard-arrivee';
import { restaurerRencontresAuto } from '../src/monde/exploration';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();

function charger(): DonneesMonde {
  const r = chargerMonde(join(MONDES_ESSAI, 'carriere-essai'));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  return r.monde;
}

type Tirage = Extract<EvenementJeu, { type: 'tirageArrivee' }>;

/** Une partie qui va et vient entre deux lieux voisins : chaque arrivée lance le dé. */
function jeu(dm: DonneesMonde, graine: number) {
  const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
  let partie: Partie = moteur.executer(moteur.nouvellePartie(groupeDeTest(srd), { graine, niveau: 1 }), { type: 'commencer' }).partie;
  const depart = dm.monde.depart.lieu;
  const voisin = dm.lieux.get(depart)!.liens.map((l) => l.vers).find((v) => dm.lieux.has(v) && dm.lieux.get(v)!.type !== 'region')!;
  const tirages: { lieu: string; tirage: Tirage; scene: string; evenements: EvenementJeu[] }[] = [];
  const aller = (vers: string) => {
    const r = moteur.executer(partie, { type: 'aller', vers });
    if (r.refus) throw new Error(r.refus);
    partie = r.partie;
    const t = r.evenements.find((e): e is Tirage => e.type === 'tirageArrivee');
    if (t) tirages.push({ lieu: vers, tirage: t, scene: partie.scene.type, evenements: r.evenements });
    // Un combat qui attend : on se replie (la rencontre fortuite se dénoue sans combattre).
    if (partie.scene.type === 'rencontre') partie = moteur.executer(partie, { type: 'reglerRencontre', issue: 'fuite' }).partie;
    return t;
  };
  return { moteur, get partie() { return partie; }, set partie(p: Partie) { partie = p; }, tirages, aller, depart, voisin };
}

describe('tirage d\'arrivée : le dé et ses issues', () => {
  it('chaque arrivée donne un dé de 1 à 6 et une issue qui suit la table : 2 combat, 3 rencontre, 4 trouvaille, le reste rien', () => {
    const dm = charger();
    const vus = new Set<number>();
    let combats = 0;
    for (let graine = 1; graine <= 12; graine++) {
      const j = jeu(dm, graine);
      for (let i = 0; i < 10; i++) j.aller(i % 2 === 0 ? j.voisin : j.depart);
      for (const { lieu, tirage: t } of j.tirages) {
        vus.add(t.de);
        expect(t.de).toBeGreaterThanOrEqual(1);
        expect(t.de).toBeLessThanOrEqual(6);
        expect(t.texte.length).toBeGreaterThan(5);
        const sur = lieuSur(dm.lieux.get(lieu)!);
        if ([1, 5, 6].includes(t.de)) expect(t.issue).toBe('rien');
        if (t.de === 2) expect(['combat', sur ? 'pnj' : 'combat', 'calme', 'rien']).toContain(t.issue);
        if (t.de === 3) expect(['pnj', 'calme']).toContain(t.issue);
        if (t.de === 4) expect(['decouverte', 'calme', 'rien']).toContain(t.issue);
        if (t.issue === 'combat') combats += 1;
        if (sur) expect(t.issue).not.toBe('combat'); // un lieu sûr n'a pas de combat à l'arrivée
      }
    }
    expect([...vus].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    expect(combats).toBeGreaterThan(0);
  });

  it('un lieu n\'offre que 2 à 4 interactions : le budget épuisé, il ne reste que le calme', () => {
    const dm = charger();
    for (const id of dm.lieux.keys()) expect([2, 3, 4]).toContain(budgetDuLieu({ id }));
    expect(new Set([...dm.lieux.keys()].map((id) => budgetDuLieu({ id }))).size).toBeGreaterThan(1); // pas le même partout
    const j = jeu(dm, 5);
    for (let i = 0; i < 80; i++) j.aller(i % 2 === 0 ? j.voisin : j.depart);
    for (const lieu of [j.depart, j.voisin]) {
      const vecues = j.tirages.filter((x) => x.lieu === lieu && ['combat', 'pnj', 'decouverte'].includes(x.tirage.issue)).length;
      expect(vecues).toBeLessThanOrEqual(budgetDuLieu({ id: lieu }));
      expect(j.partie.etat.exploration.hasard?.[lieu]?.vecues ?? 0).toBeLessThanOrEqual(budgetDuLieu({ id: lieu }));
    }
    // Après une quarantaine d'allers-retours, au moins un lieu est épuisé : le dé dit « calme » quand il aurait donné quelque chose.
    expect(j.tirages.some((x) => x.tirage.issue === 'calme')).toBe(true);
    // Un lieu épuisé ne déclenche plus rien d'autre que « rien » ou « calme ».
    const dernier = j.tirages.slice(-10);
    expect(dernier.every((x) => x.tirage.issue === 'rien' || x.tirage.issue === 'calme')).toBe(true);
  });

  it('`tirageArrivee: false` coupe le tirage du monde', () => {
    const dm = charger();
    dm.monde.tirageArrivee = false;
    const j = jeu(dm, 3);
    for (let i = 0; i < 6; i++) j.aller(i % 2 === 0 ? j.voisin : j.depart);
    expect(j.tirages).toEqual([]);
  });
});

describe('tirage d\'arrivée : un combat au hasard', () => {
  it('compose une rencontre pour ce groupe, la met en scène, et la partie la garde', () => {
    const dm = charger();
    let trouve: { partie: Partie; id: string } | undefined;
    for (let graine = 1; graine <= 40 && !trouve; graine++) {
      const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
      let partie = moteur.executer(moteur.nouvellePartie(groupeDeTest(srd), { graine, niveau: 1 }), { type: 'commencer' }).partie;
      const voisin = dm.lieux.get(dm.monde.depart.lieu)!.liens.map((l) => l.vers).find((v) => dm.lieux.has(v))!;
      for (let i = 0; i < 12 && !trouve; i++) {
        const r = moteur.executer(partie, { type: 'aller', vers: i % 2 === 0 ? voisin : dm.monde.depart.lieu });
        partie = r.partie;
        if (partie.scene.type === 'rencontre' && partie.scene.rencontre.startsWith('auto-')) trouve = { partie, id: partie.scene.rencontre };
        else if (partie.scene.type === 'rencontre') partie = moteur.executer(partie, { type: 'reglerRencontre', issue: 'fuite' }).partie;
      }
    }
    expect(trouve, 'un combat fortuit doit tomber en quelques dizaines d\'arrivées').toBeDefined();
    const def = dm.rencontres.get(trouve!.id)!;
    expect(def.type).toBe('combat');
    expect(def.monstres.length).toBeGreaterThan(0);
    for (const m of def.monstres) expect(srd.monstres.has(m.profil), m.profil).toBe(true);
    expect(def.carte?.length).toBeGreaterThan(5);
    // Le monde ne la liste pas (ses statistiques ne changent pas) mais la sait retrouver…
    expect([...dm.rencontres.values()].filter((x) => x.id.startsWith('auto-')).length).toBeGreaterThan(0);
    // …et une partie rechargée avec un monde neuf la retrouve (`apresChargement`).
    const neuf = charger();
    expect(neuf.rencontres.get(trouve!.id)).toBeUndefined();
    restaurerRencontresAuto(neuf, trouve!.partie.etat);
    expect(neuf.rencontres.get(trouve!.id)?.monstres).toEqual(def.monstres);
  });
});

describe('tirage d\'arrivée : une trouvaille à fouiller', () => {
  it('le 4 amorce la trouvaille : le bouton Fouiller se met en avant, puis un bon jet donne un objet du butin commun', () => {
    const dm = charger();
    let reussi = false;
    for (let graine = 1; graine <= 60 && !reussi; graine++) {
      const j = jeu(dm, graine);
      for (let i = 0; i < 10 && !reussi; i++) {
        const t = j.aller(i % 2 === 0 ? j.voisin : j.depart);
        if (t?.issue !== 'decouverte') continue;
        const ici = j.partie.etat.lieu;
        const amorcee = j.partie.etat.exploration.hasard![ici]!.decouverte!;
        expect(amorcee.table).toBe(`commun-decouverte-p${palierDuGroupe(j.partie.groupe)}`);
        expect(srd.monstres.size).toBeGreaterThan(0);
        // Le bouton « Fouiller » est mis en avant (et disponible même si le lieu a déjà été fouillé aujourd'hui).
        const fouille = j.moteur.propositions(j.partie).find((x) => x.libelle === 'Fouiller')!;
        expect(fouille.style).toBe('principal');
        expect(fouille.desactivee).toBeUndefined();
        const avant = { ...j.partie.etat.inventaire };
        const r = j.moteur.executer(j.partie, { type: 'fouiller' });
        expect(r.refus).toBeUndefined();
        j.partie = r.partie;
        // Une seule tentative : la trouvaille est consommée, réussie ou non.
        expect(j.partie.etat.exploration.hasard![ici]!.decouverte).toBeUndefined();
        const nouveaux = Object.entries(j.partie.etat.inventaire).filter(([id, n]) => n > (avant[id] ?? 0));
        if (nouveaux.length) {
          reussi = true;
          const obtenu = r.evenements.filter((e) => e.type === 'objetObtenu');
          expect(obtenu.length).toBeGreaterThan(0);
          expect(r.evenements.some((e) => e.type === 'constat' && /\w/.test(e.texte) && !/ne donne rien/.test(e.texte))).toBe(true);
        } else {
          expect(r.evenements.some((e) => e.type === 'constat' && /ne donne rien/.test(e.texte))).toBe(true);
        }
      }
    }
    expect(reussi).toBe(true);
  });
});

describe('tirage d\'arrivée : les rencontres que l\'auteur écrit', () => {
  it('une rencontre `aleatoire` du lieu est tirée par le 2 avant tout adversaire au hasard', () => {
    const dm = charger();
    const depart = dm.monde.depart.lieu;
    const voisin = dm.lieux.get(depart)!.liens.map((l) => l.vers).find((v) => dm.lieux.has(v) && dm.lieux.get(v)!.type !== 'region')!;
    const ecrite = [...dm.rencontres.values()].find((r) => r.type === 'combat')!;
    dm.lieux.get(voisin)!.rencontres = [{ id: ecrite.id, declencheur: 'aleatoire', unique: false }];
    let vue = false;
    for (let graine = 1; graine <= 60 && !vue; graine++) {
      const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
      let partie = moteur.executer(moteur.nouvellePartie(groupeDeTest(srd), { graine, niveau: 1 }), { type: 'commencer' }).partie;
      for (let i = 0; i < 8 && !vue; i++) {
        const r = moteur.executer(partie, { type: 'aller', vers: i % 2 === 0 ? voisin : depart });
        partie = r.partie;
        const t = r.evenements.find((e): e is Tirage => e.type === 'tirageArrivee');
        if (partie.scene.type === 'rencontre' && t?.issue === 'combat' && partie.etat.lieu === voisin) {
          expect(partie.scene.rencontre).toBe(ecrite.id); // la rencontre écrite, pas `auto-…`
          vue = true;
        }
        if (partie.scene.type === 'rencontre') partie = moteur.executer(partie, { type: 'reglerRencontre', issue: 'fuite' }).partie;
      }
    }
    expect(vue).toBe(true);
  });
});
