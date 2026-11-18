// La Tombe des Rois Serpents : le Fort du Reflet Béni est découpé en pièces (18/11/2026). La cour garde l'identifiant du Fort et mène
// aux six pièces ; chaque personnage se trouve dans sa pièce, pas dans la cour ; les services sont répartis.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type DonneesMonde, type Partie } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(RACINE_MONDES, 'tombe-des-rois-serpents'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde as DonneesMonde;
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);

const COUR = 'fort-du-reflet-beni';
/** Pièce → personnages qui s'y tiennent. */
const PIECES: Record<string, string[]> = {
  'fort-auberge': ['marta-aubergiste', 'varnac-le-borgne'],
  'fort-forge': ['commandeur-garin', 'torin-armurier'],
  'fort-infirmerie': ['elara-herboriste'],
  'fort-chapelle': ['frere-balthazar', 'soeur-lysandre'],
  'fort-scriptorium': ['corvin-le-scribe', 'mireille-cartographe'],
  'fort-ecuries': ['nolan-palefrenier'],
};
const DANS_LA_COUR = ['solene-caravaniere', 'sergent-rodrigue'];

function auFort(): Partie {
  const g = groupeConseille(3, srd).emplacements.map((e) => {
    const f = bilanPersonnage(e!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  let p = moteur.executer(moteur.nouvellePartie(g, { graine: 11, niveau: 3 }), { type: 'commencer' }).partie;
  p = moteur.executer(p, { type: 'terminerScene', scene: 'ouverture' }).partie;
  expect(p.etat.lieu).toBe(COUR);
  return p;
}

describe('Le Fort du Reflet Béni en pièces', () => {
  it('la cour garde l\'identifiant du Fort ; les six pièces en sont les enfants, avec image, position et accroche', () => {
    expect(dm.lieux.get(COUR)?.type).toBe('camp');
    for (const id of Object.keys(PIECES)) {
      const l = dm.lieux.get(id)!;
      expect(l.parent, id).toBe(COUR);
      expect(l.accroche, `${id} : accroche`).toBeTruthy();
      expect(l.position, `${id} : position sur la carte du Fort`).toBeDefined();
      expect(l.arrivee!.split(/\s+/).length, `${id} : arrivée`).toBeGreaterThanOrEqual(130);
    }
  });

  it('chaque personnage est dans sa pièce (et les deux autres dans la cour)', () => {
    for (const [piece, ids] of Object.entries(PIECES)) for (const id of ids) expect(dm.pnj.get(id)?.lieu, id).toBe(piece);
    for (const id of DANS_LA_COUR) expect(dm.pnj.get(id)?.lieu, id).toBe(COUR);
  });

  it('on entre dans chaque pièce depuis la cour, on y parle à ses personnages, et on en ressort', () => {
    for (const [piece, ids] of Object.entries(PIECES)) {
      const dedans = moteur.executer(auFort(), { type: 'aller', vers: piece });
      expect(dedans.refus, `entrer dans ${piece}`).toBeUndefined();
      expect(dedans.partie.etat.lieu).toBe(piece);
      for (const id of ids) expect(moteur.executer(dedans.partie, { type: 'parler', pnj: id }).refus, `parler à ${id} dans ${piece}`).toBeUndefined();
      const dehors = moteur.executer(dedans.partie, { type: 'aller', vers: COUR });
      expect(dehors.refus, `ressortir de ${piece}`).toBeUndefined();
      expect(dehors.partie.etat.lieu).toBe(COUR);
    }
  });

  it('depuis la cour, on ne parle qu\'aux deux personnages qui y sont', () => {
    const p = auFort();
    for (const id of DANS_LA_COUR) expect(moteur.executer(p, { type: 'parler', pnj: id }).refus, id).toBeUndefined();
    for (const id of Object.values(PIECES).flat()) expect(moteur.executer(p, { type: 'parler', pnj: id }).refus, `${id} n'est pas dans la cour`).toBeDefined();
  });

  it('les services sont répartis : marché dans la cour, repas et auberge au réfectoire, forge, soins', () => {
    expect(dm.lieux.get(COUR)!.services).toEqual(['marche']);
    expect(dm.lieux.get('fort-auberge')!.services).toEqual(['auberge', 'repas']);
    expect(dm.lieux.get('fort-forge')!.services).toEqual(['forge']);
    expect(dm.lieux.get('fort-infirmerie')!.services).toEqual(['soins']);
    // Le Fort reste un refuge : on s'y repose partout.
    for (const id of [COUR, ...Object.keys(PIECES)]) expect(dm.lieux.get(id)!.repos, id).toBe('sur');
  });
});
