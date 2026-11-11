// Le récit d'arrivée : ce que le joueur lit en entrant dans un lieu (première visite, variante Avant / Après, relecture).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  aller,
  ARRIVEE_MOTS,
  arriveeDe,
  creerMoteur,
  etatInitial,
  herosPreTires,
  MODULES_STANDARD,
  nouvellePartie,
  personnageDepuisFiche,
  regarder,
  validerMonde,
  type DonneesMonde,
  type Generateur,
  type PartieMonde,
} from '../src';
import { champsLibres } from '../src';
import { commencer } from '../src/monde/exploration';
import { chargerMonde } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
const SUCCES: Generateur = () => 0.999;

/** Un monde neuf à chaque test (les textes d'arrivée s'ajoutent en mémoire). */
function monde(): DonneesMonde {
  const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  // Le Val a désormais ses récits : on les retire pour tester un monde qui n'en a pas (chaque test ajoute les siens).
  for (const l of r.monde.lieux.values()) {
    l.arrivee = undefined;
    l.arriveeVariantes = [];
  }
  return r.monde;
}
const groupe = () => herosPreTires(srd).map((h) => personnageDepuisFiche(h.fiche, { id: h.fiche.nom.toLowerCase() }));
const partieDe = (dm: DonneesMonde): PartieMonde => nouvellePartie(dm, etatInitial(dm, 3), groupe(), SUCCES);

const AUBERGE = 'vei-auberge-dernier-feu';
const TEXTE = 'Une chaleur de braise vous prend au visage. Le bois noirci des poutres craque quand le vent pousse la porte, et l’air sent la soupe d’orge, le suif et la laine mouillée. Au fond, derrière les tables, un feu large et bas tient la salle entière dans une lumière de cuivre.';

describe('le récit d’arrivée', () => {
  it('est raconté à la première arrivée, avant le reste, puis plus jamais tel quel', () => {
    const dm = monde();
    dm.lieux.get(AUBERGE)!.arrivee = TEXTE;
    const p = partieDe(dm);
    const premiere = aller(p, AUBERGE);
    expect(premiere.ok).toBe(true);
    expect(premiere.narrations[0]).toBe(TEXTE);
    // On sort et on revient : le texte n'est pas relu.
    aller(p, 'veillecendre');
    const retour = aller(p, AUBERGE);
    expect(retour.narrations).not.toContain(TEXTE);
  });

  it('un lieu sans récit d’arrivée ne raconte rien de plus (aucune régression)', () => {
    const dm = monde();
    const p = partieDe(dm);
    const r = aller(p, AUBERGE);
    expect(r.narrations).not.toContain(TEXTE);
    expect(arriveeDe(p, dm.lieux.get(AUBERGE)!)).toBeUndefined();
  });

  it('à l’arrivée de l’histoire, le lieu de départ raconte le sien', () => {
    const dm = monde();
    const depart = dm.lieux.get(dm.monde.depart.lieu)!;
    depart.arrivee = TEXTE;
    const p = partieDe(dm);
    const r = commencer(p);
    expect(r.narrations[0]).toBe(TEXTE);
  });

  it('Avant / Après : une variante dont la condition devient vraie remplace le récit, relu une seule fois', () => {
    const dm = monde();
    const lieu = dm.lieux.get(AUBERGE)!;
    lieu.arrivee = TEXTE;
    lieu.arriveeVariantes = [{ condition: { flag: 'crise-finie' }, texte: 'La salle est vide et silencieuse : le feu n’est plus qu’un lit de cendres tièdes, et des chaises sont renversées dans la poussière.' }];
    const p = partieDe(dm);
    expect(aller(p, AUBERGE).narrations[0]).toBe(TEXTE); // avant
    aller(p, 'veillecendre');
    expect(aller(p, AUBERGE).narrations).not.toContain(TEXTE);
    aller(p, 'veillecendre');
    p.etat.flags['crise-finie'] = true; // après
    const apres = aller(p, AUBERGE);
    expect(apres.narrations[0]).toMatch(/cendres tièdes/);
    expect(arriveeDe(p, lieu)).toMatchObject({ cle: 'v0' });
    aller(p, 'veillecendre');
    expect(aller(p, AUBERGE).narrations.join(' ')).not.toMatch(/cendres tièdes/); // une seule fois
  });

  it('« Regarder autour de soi » relit le récit en vigueur (ou le résumé), sans coût', () => {
    const dm = monde();
    const lieu = dm.lieux.get(AUBERGE)!;
    const p = partieDe(dm);
    aller(p, AUBERGE);
    expect(regarder(p).narrations).toEqual([lieu.resume]); // pas de récit : le résumé
    lieu.arrivee = TEXTE;
    expect(regarder(p).narrations).toEqual([TEXTE]);
  });

  it('dans le vrai moteur : le texte arrive comme un texte de l’auteur juste après l’annonce du lieu ; le bouton n’existe que si le lieu a un récit', () => {
    const dm = monde();
    dm.lieux.get(AUBERGE)!.arrivee = TEXTE;
    const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
    const heros = groupe();
    let partie = moteur.executer(moteur.nouvellePartie(heros, { graine: 5, niveau: 3 }), { type: 'commencer' }).partie;
    const avant = moteur.propositions(partie).filter((x) => x.ordre?.type === 'regarder');
    expect(avant).toEqual([]); // le lieu de départ n'a pas de récit
    const res = moteur.executer(partie, { type: 'aller', vers: AUBERGE });
    expect(res.refus).toBeUndefined();
    const types = res.evenements.map((e) => e.type);
    expect(types.indexOf('deplacement')).toBeLessThan(res.evenements.findIndex((e) => e.type === 'texte' && e.texte === TEXTE));
    partie = res.partie;
    expect(moteur.propositions(partie).some((x) => x.ordre?.type === 'regarder')).toBe(true);
    const relu = moteur.executer(partie, { type: 'regarder' });
    expect(relu.evenements.some((e) => e.type === 'texte' && e.texte === TEXTE)).toBe(true);
  });
});

describe('validation et revue des récits d’arrivée', () => {
  it('le validateur signale un récit trop court ou trop long, un vocabulaire de mécanique, et les lieux restés sans récit', () => {
    const dm = monde();
    dm.lieux.get(AUBERGE)!.arrivee = 'Une salle basse.';
    const bilan = validerMonde(dm, srd);
    expect(bilan.erreurs).toEqual([]);
    const a = bilan.avertissements.join('\n');
    expect(a).toMatch(new RegExp(`récit\\(s\\) d'arrivée hors de ${ARRIVEE_MOTS.min} à ${ARRIVEE_MOTS.max} mots[^\\n]*${AUBERGE}`));
    expect(a).toMatch(/lieux sur \d+ n'ont pas de récit d'arrivée/);

    const dm2 = monde();
    dm2.lieux.get(AUBERGE)!.arrivee = `${TEXTE} La jauge de la crise monte et il faut un DD 12 pour le voir.`;
    expect(validerMonde(dm2, srd).avertissements.join('\n')).toMatch(/parlent de mécanique[^\n]*vei-auberge/);
  });

  it('un monde qui n’a aucun récit d’arrivée n’est pas signalé', () => {
    const a = validerMonde(monde(), srd).avertissements.join('\n');
    expect(a).not.toMatch(/Arrivée :/);
  });

  it('la revue surveille le récit et ses variantes', () => {
    const dm = monde();
    const lieu = dm.lieux.get(AUBERGE)!;
    lieu.arrivee = TEXTE;
    lieu.arriveeVariantes = [{ condition: { flag: 'x' }, texte: 'Variante.' }];
    const noms = champsLibres(dm).map((c) => `${c.entite.type}:${c.entite.id}:${c.chemin.join('.')}`);
    expect(noms).toContain(`lieux:${AUBERGE}:arrivee`);
    expect(noms).toContain(`lieux:${AUBERGE}:arriveeVariantes.0.texte`);
  });
});
