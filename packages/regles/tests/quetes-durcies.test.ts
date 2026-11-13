// Quêtes durcies (13/11/2026) : une quête ne recule jamais, l'effet `etape` respecte les quêtes closes, une étape que le monde ne
// connaît plus est réparée, et la condition `moment` (jour, soir, nuit) permet à une scène de ne s'ouvrir que quand son PNJ est là.
// Sur le vrai monde publié (La Marche d'Ombrefiel), modifié en mémoire.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  appliquerEffets,
  avancerQuetes,
  bilanPersonnage,
  Condition,
  creerMoteur,
  etatInitial,
  evaluerCondition,
  groupeConseille,
  MODULES_STANDARD,
  momentDe,
  personnageDepuisFiche,
  type DonneesMonde,
  type Partie,
} from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const QUETE = 'q-baume-de-l-aube';

function marche(): DonneesMonde {
  const r = chargerMonde(join(RACINE_MONDES, 'marche-d-ombrefiel'));
  if (!r.ok) throw new Error('monde illisible');
  return r.monde;
}

describe('une quête ne recule jamais', () => {
  it('reproposer une quête déjà en cours ne la remet pas « proposée » ; une quête proposée devient bien en cours', () => {
    const dm = marche();
    const e = etatInitial(dm);
    appliquerEffets([{ quete: { id: QUETE, statut: 'proposee' } }], e, dm);
    expect(e.quetes[QUETE]!.statut).toBe('proposee');
    appliquerEffets([{ quete: { id: QUETE, statut: 'active' } }], e, dm);
    expect(e.quetes[QUETE]).toMatchObject({ statut: 'active', actives: ['la-mousse'] });
    appliquerEffets([{ quete: { id: QUETE, statut: 'proposee' } }], e, dm);
    expect(e.quetes[QUETE]).toMatchObject({ statut: 'active', actives: ['la-mousse'] });
  });

  it('une quête accomplie ne se rouvre pas, ni par « proposée » ni par « en cours »', () => {
    const dm = marche();
    const e = etatInitial(dm);
    appliquerEffets([{ quete: { id: QUETE, statut: 'active' } }, { quete: { id: QUETE, statut: 'terminee' } }], e, dm);
    expect(e.quetes[QUETE]!.statut).toBe('terminee');
    appliquerEffets([{ quete: { id: QUETE, statut: 'proposee' } }], e, dm);
    appliquerEffets([{ quete: { id: QUETE, statut: 'active' } }], e, dm);
    expect(e.quetes[QUETE]!.statut).toBe('terminee');
    expect(e.quetes[QUETE]!.actives).toEqual([]);
  });
});

describe('l’effet « étape »', () => {
  it('ne rouvre pas une quête close, et met en cours une quête seulement proposée', () => {
    const dm = marche();
    const e = etatInitial(dm);
    appliquerEffets([{ quete: { id: QUETE, statut: 'proposee' } }], e, dm);
    appliquerEffets([{ etape: { quete: QUETE, etape: 'retour-chez-mireille' } }], e, dm);
    expect(e.quetes[QUETE]!.statut).toBe('active');
    expect(e.quetes[QUETE]!.actives).toContain('retour-chez-mireille');
    appliquerEffets([{ quete: { id: QUETE, statut: 'terminee' } }], e, dm);
    appliquerEffets([{ etape: { quete: QUETE, etape: 'la-mousse' } }], e, dm);
    expect(e.quetes[QUETE]!.statut).toBe('terminee');
    expect(e.quetes[QUETE]!.actives).toEqual([]);
  });
});

describe('une étape que le monde ne connaît plus (histoire mise à jour après la sauvegarde)', () => {
  it('reprend à l’étape qui suit la dernière étape connue accomplie', () => {
    const dm = marche();
    const e = etatInitial(dm);
    e.quetes[QUETE] = { statut: 'active', actives: ['etape-supprimee'], accomplies: ['la-mousse'] };
    avancerQuetes(e, dm);
    expect(e.quetes[QUETE]).toMatchObject({ statut: 'active', actives: ['retour-chez-mireille'] });
  });

  it('reprend au début quand rien de ce que la partie a accompli n’existe plus', () => {
    const dm = marche();
    const e = etatInitial(dm);
    e.quetes[QUETE] = { statut: 'active', actives: ['etape-supprimee'], accomplies: ['autre-etape-supprimee'] };
    avancerQuetes(e, dm);
    expect(e.quetes[QUETE]).toMatchObject({ statut: 'active', actives: ['la-mousse'] });
  });

  it('ne touche pas une quête saine', () => {
    const dm = marche();
    const e = etatInitial(dm);
    appliquerEffets([{ quete: { id: QUETE, statut: 'active' } }], e, dm);
    avancerQuetes(e, dm);
    expect(e.quetes[QUETE]).toMatchObject({ statut: 'active', actives: ['la-mousse'], accomplies: [] });
  });
});

describe('la condition « moment »', () => {
  it('se lit sur l’heure : jour de 6 h à 17 h, soir de 18 h à 21 h, nuit ensuite ; sans heure, il fait jour', () => {
    const dm = marche();
    const e = etatInitial(dm);
    const a = (heure: number | undefined, m: 'jour' | 'soir' | 'nuit') => evaluerCondition({ moment: m }, { ...e, heure });
    expect(a(8, 'jour')).toBe(true);
    expect(a(17, 'jour')).toBe(true);
    expect(a(18, 'soir')).toBe(true);
    expect(a(21, 'soir')).toBe(true);
    expect(a(22, 'nuit')).toBe(true);
    expect(a(3, 'nuit')).toBe(true);
    expect(a(undefined, 'jour')).toBe(true);
    expect(a(19, 'jour')).toBe(false);
    expect(evaluerCondition({ non: { moment: 'soir' } }, { ...e, heure: 19 })).toBe(false);
    expect(momentDe(23)).toBe('nuit');
  });

  it('est acceptée par le format du monde et refusée si le moment est inconnu', () => {
    expect(Condition.safeParse({ moment: 'soir' }).success).toBe(true);
    expect(Condition.safeParse({ moment: 'midi' }).success).toBe(false);
  });
});

describe('« L’hôpital de paille » : la scène ne s’ouvre que quand Mireille est dans la cour', () => {
  const dm = marche();
  const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
  const groupe = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  function depart(heure: number): Partie {
    const p = moteur.executer(moteur.nouvellePartie(groupe, { graine: 5, niveau: 1 }), { type: 'commencer' }).partie;
    if (p.scene.type === 'rencontre') p.etat.rencontresFaites.push(p.scene.rencontre);
    p.scene = { type: 'exploration' };
    p.etat.heure = heure;
    return p;
  }
  const ouvre = (p: Partie): boolean =>
    moteur.executer(p, { type: 'aller', vers: 'ald-auberge-cour-et-ecuries' }).evenements.some((e) => e.type === 'evenementOuvert' && e.evenement === 'l-hopital-de-paille');

  it('s’ouvre le jour, pas le soir (elle est alors dans la salle commune)', () => {
    expect(ouvre(depart(8))).toBe(true);
    expect(ouvre(depart(19))).toBe(false);
  });

  it('une fois la quête lancée par la scène, parler à Mireille ne la remet pas « proposée »', () => {
    const p = depart(8);
    const a = moteur.executer(p, { type: 'aller', vers: 'ald-auberge-cour-et-ecuries' }).partie;
    const b = moteur.executer(a, { type: 'choisirEvenement', evenement: 'l-hopital-de-paille', choix: 'aider' }).partie;
    expect(b.etat.quetes[QUETE]!.statut).toBe('active');
    const c = moteur.executer(moteur.executer(b, { type: 'quitterEvenement' }).partie, { type: 'parler', pnj: 'mireille-de-la-rose', sujet: 'le-baume-de-l-aube' }).partie;
    expect(c.etat.quetes[QUETE]!.statut).toBe('active');
  });
});
