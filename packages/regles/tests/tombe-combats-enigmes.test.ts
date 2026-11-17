// La Tombe des Rois Serpents : énigmes, contrats de combat, pièges liés aux énigmes, jouées de bout en bout avec les fonctions du moteur.
// Les jets sont favorables (le hasard rend toujours le plus haut).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { appliquerEffets, bilanPersonnage, etatInitial, groupeConseille, personnageDepuisFiche, type DonneesMonde } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { avancerQuetes, evaluerCondition } from '../src/monde/etat';
import { aller, fouiller, issueRencontre, nouvellePartie, repondreEnigme, seReposer, type PartieMonde } from '../src/monde/exploration';

const srd = chargerDonneesSrd();
const dm: DonneesMonde = (() => {
  const r = chargerMonde(join(RACINE_MONDES, 'tombe-des-rois-serpents'));
  if (!r.ok) throw new Error('monde illisible');
  return r.monde as DonneesMonde;
})();
const groupe = () =>
  groupeConseille(2, srd)
    .emplacements.slice(0, 3)
    .map((e) => {
      const f = bilanPersonnage(e!, srd).fiche!;
      return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
    });
function partie(lieu: string): PartieMonde {
  const etat = etatInitial(dm, 2);
  etat.lieu = lieu;
  etat.lieuxVisites.push(lieu);
  return nouvellePartie(dm, etat, groupe(), () => 0.999);
}
const accepter = (p: PartieMonde, id: string) => {
  appliquerEffets([{ quete: { id, statut: 'active' } }], p.etat, dm);
  avancerQuetes(p.etat, dm);
};
const vrai = (p: PartieMonde, flag: string) => evaluerCondition({ flag }, p.etat);
const statut = (p: PartieMonde, id: string) => p.etat.quetes[id]?.statut;

describe('énigmes de la Tombe', () => {
  it('le cobra : une mauvaise réponse déclenche les buses de vapeur, la bonne ouvre la cassette', () => {
    const p = partie('n3-autel-et-couloir-lames');
    const faux = repondreEnigme(p, 'e-autel-du-cobra', 'gauche');
    expect(faux.refus).toBeUndefined();
    expect(p.etat.exploration.enigmes['e-autel-du-cobra']).toBe('echouee');
    expect(p.etat.exploration.pieges['p-buses-du-cobra']).toBeDefined();
    const bon = repondreEnigme(p, 'e-autel-du-cobra', 'vers la droite');
    expect(p.etat.exploration.enigmes['e-autel-du-cobra']).toBe('resolue');
    expect(vrai(p, 'autel-cobra-ouvert')).toBe(true);
    expect(p.etat.exploration.ouverts).toContain('tresor:t-offrandes-autel-cobra');
    expect(bon.constats.join(' ')).toContain('Bonne réponse');
  });

  it('le cercle de Baltoplate : le vrai nom la démasque', () => {
    const p = partie('n3-salle-invocation');
    repondreEnigme(p, 'e-cercle-baltoplate', 'Zalthar');
    expect(p.etat.exploration.enigmes['e-cercle-baltoplate']).toBe('echouee');
    repondreEnigme(p, 'e-cercle-baltoplate', 'baltoplate');
    expect(vrai(p, 'baltoplate-demasquee')).toBe(true);
  });

  it('les miroirs du trône : un mauvais ordre réveille les reflets, le bon ouvre le compartiment', () => {
    const p = partie('n3-salle-du-trone');
    const faux = repondreEnigme(p, 'e-miroirs-du-trone', ['la flamme', 'le soleil', 'la lune', 'le serpent']);
    expect(faux.refus).toBeUndefined();
    expect(faux.combat).toBe('r-reflets-du-trone');
    const bon = repondreEnigme(p, 'e-miroirs-du-trone', ['la lune', 'le serpent', 'le soleil', 'la flamme']);
    expect(bon.refus).toBeUndefined();
    expect(vrai(p, 'trone-ouvert')).toBe(true);
    expect(p.etat.exploration.ouverts).toContain('tresor:t-compartiment-du-trone');
  });
});

describe('contrats de combat du Fort et du Bivouac', () => {
  it("l'eau du fort : la fouille descend à la citerne, une voie sans sang règle le contrat, le retour clôt", () => {
    const p = partie('fort-du-reflet-beni');
    p.etat.pieces = 50;
    const avant = fouiller(p);
    expect(avant.combat).toBeUndefined();
    p.etat.exploration.fouilles = [];
    accepter(p, 'q-contrat-eau-du-fort');
    const r = fouiller(p);
    expect(r.combat).toBe('r-contrat-citerne');
    const fin = issueRencontre(p, 'r-contrat-citerne', { type: 'alternative', id: 'purger-la-citerne' });
    expect(fin.refus).toBeUndefined();
    expect(vrai(p, 'contrat-eau-fait')).toBe(true);
    expect(p.etat.pieces).toBe(40);
    avancerQuetes(p.etat, dm);
    appliquerEffets([{ flag: 'contrat-eau-rapporte' }], p.etat, dm);
    avancerQuetes(p.etat, dm);
    expect(statut(p, 'q-contrat-eau-du-fort')).toBe('terminee');
  });

  it("les déserteurs : l'arrivée au bivouac les déclenche, payer leur solde règle le contrat", () => {
    const p = partie('tombe-des-rois');
    p.etat.pieces = 100;
    accepter(p, 'q-contrat-deserteurs');
    const r = aller(p, 'bivouac-entree');
    expect(r.refus).toBeUndefined();
    expect(r.combat).toBe('r-contrat-deserteurs');
    issueRencontre(p, 'r-contrat-deserteurs', { type: 'alternative', id: 'payer-leur-solde' });
    expect(vrai(p, 'contrat-deserteurs-fait')).toBe(true);
    expect(vrai(p, 'deserteurs-impayes')).toBe(true);
    expect(p.etat.pieces).toBe(40);
  });

  it("la bête des mules : une nuit au bivouac la fait sortir, l'embuscade se règle sans combat", () => {
    const p = partie('bivouac-entree');
    accepter(p, 'q-contrat-bete-des-mules');
    const r = seReposer(p, 'long');
    expect(r.combat).toBe('r-contrat-ankheg');
    const fin = issueRencontre(p, 'r-contrat-ankheg', { type: 'alternative', id: 'effondrer-ses-galeries' });
    expect(fin.refus).toBeUndefined();
    expect(vrai(p, 'contrat-bete-fait')).toBe(true);
  });

  it('la crête : deux vagues, la victoire de la première lance la seconde ; un bluff règle tout', () => {
    const p = partie('bivouac-entree');
    accepter(p, 'q-contrat-crete-du-seuil');
    const r = fouiller(p);
    expect(r.combat).toBe('r-contrat-pillards-crete');
    const vague1 = issueRencontre(p, 'r-contrat-pillards-crete', { type: 'victoire', px: 300 });
    expect(vague1.combat).toBe('r-contrat-pillards-bande');
    const vague2 = issueRencontre(p, 'r-contrat-pillards-bande', { type: 'victoire', px: 650 });
    expect(vague2.refus).toBeUndefined();
    expect(vrai(p, 'contrat-crete-fait')).toBe(true);

    const q = partie('bivouac-entree');
    accepter(q, 'q-contrat-crete-du-seuil');
    expect(fouiller(q).combat).toBe('r-contrat-pillards-crete');
    issueRencontre(q, 'r-contrat-pillards-crete', { type: 'alternative', id: 'simuler-la-garnison' });
    expect(vrai(q, 'contrat-crete-fait')).toBe(true);
    expect(q.etat.rencontresFaites).not.toContain('r-contrat-pillards-bande');
  });
});

describe('rencontres sans combat de la Tombe', () => {
  it("l'éboulement de l'entrée se règle par deux voies, un échec dénoue quand même", () => {
    const p = partie('bivouac-entree');
    const r = aller(p, 'tombe-des-rois');
    expect(r.combat).toBe('r-chantier-sable');
    issueRencontre(p, 'r-chantier-sable', { type: 'alternative', id: 'etayer-le-linteau' });
    expect(vrai(p, 'chantier-etaye')).toBe(true);
  });

  it('les grilles des oubliettes : racheter les prisonniers libère les gobelins', () => {
    const p = partie('n3-reserve-et-oubliettes');
    p.etat.pieces = 150;
    issueRencontre(p, 'r-grilles-des-oubliettes', { type: 'alternative', id: 'racheter-les-prisonniers' });
    expect(vrai(p, 'gobelins-sauves')).toBe(true);
    expect(p.etat.pieces).toBe(50);
  });
});
