// L'écran de sommeil : le décor (chambre ou camp), la durée de la nuit, l'horloge, le réveil brutal, et le repérage d'une nuit
// dans le journal du vrai moteur (bouton « Dormir » et chambre payée).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type Partie } from '@crpg/regles';
import { chargerDonneesSrd } from '../../../packages/regles/src/donnees-node';
import { chargerMonde } from '../../../packages/regles/src/monde/chargeur';
import { decorSommeil, detecterSommeil, heureDuCadran, heureDuReveilBrutal, heuresDormies, obscurite } from './sommeil-regles';
import { MONDES_ESSAI } from '../../../packages/regles/tests/mondes-essai';

describe('le décor de la nuit', () => {
  it('une chambre payée, ou un lieu sous un toit, donne la chambre ; dehors, le camp', () => {
    expect(decorSommeil('lieu-dit', true)).toBe('chambre');
    for (const t of ['batiment', 'salle', 'village', 'ville', 'quartier', 'hameau']) expect(decorSommeil(t, false), t).toBe('chambre');
    for (const t of ['camp', 'route', 'lieu-dit', 'grotte', 'ruine', 'donjon', 'region', undefined]) expect(decorSommeil(t, false), String(t)).toBe('camp');
  });
});

describe('la durée et l’horloge', () => {
  it('compte les heures dormies d’un jour à l’autre', () => {
    expect(heuresDormies({ jour: 1, heure: 22 }, { jour: 2, heure: 8 })).toBe(10);
    expect(heuresDormies({ jour: 1, heure: 14 }, { jour: 2, heure: 8 })).toBe(18);
    expect(heuresDormies({ jour: 3, heure: 8 }, { jour: 4, heure: 8 })).toBe(24);
    expect(heuresDormies({ jour: 2, heure: 8 }, { jour: 2, heure: 8 })).toBe(1);
  });

  it('compte toujours des heures entières, même quand le temps du moteur a des décimales', () => {
    for (const [avant, apres] of [[22.1, 8], [14.6, 8], [20.25, 8], [8.1, 8], [23.9, 8]] as const) {
      const h = heuresDormies({ jour: 1, heure: avant }, { jour: 2, heure: apres });
      expect(Number.isInteger(h), String(avant)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(1);
    }
    expect(heuresDormies({ jour: 1, heure: 22.1 }, { jour: 2, heure: 8 })).toBe(10);
  });

  it('le cadran n’affiche jamais de virgule', () => {
    for (const debut of [22.1, 8.5, 23.99, 0.3]) for (let e = 0; e <= 25; e++) expect(heureDuCadran(debut, e), `${debut}+${e}`).toMatch(/^(minuit|midi|\d{1,2} h)$/);
  });

  it('le cadran passe minuit et midi', () => {
    expect(heureDuCadran(22, 0)).toBe('22 h');
    expect(heureDuCadran(22, 2)).toBe('minuit');
    expect(heureDuCadran(22, 3)).toBe('1 h');
    expect(heureDuCadran(22, 10)).toBe('8 h');
    expect(heureDuCadran(8, 4)).toBe('midi');
  });

  it('une rencontre réveille au milieu de la nuit, jamais à la première ni à la dernière heure', () => {
    for (const heures of [3, 6, 10, 18]) {
      for (let k = 0; k < 20; k++) {
        const h = heureDuReveilBrutal(heures, k / 20);
        expect(h).toBeGreaterThanOrEqual(1);
        expect(h).toBeLessThanOrEqual(heures - 1);
      }
    }
    expect(heureDuReveilBrutal(1, 0.5)).toBe(1);
  });

  it('la nuit est sombre et l’aube l’éclaircit', () => {
    expect(obscurite(0, 10)).toBeGreaterThan(obscurite(9, 10));
    expect(obscurite(9, 10)).toBeGreaterThan(obscurite(10, 10));
  });
});

describe('repérer une nuit dans le journal du vrai moteur', () => {
  const srd = chargerDonneesSrd();
  const r = chargerMonde(join(MONDES_ESSAI, 'citadelle-des-marees'));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  const dm = r.monde;
  const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
  const groupe = groupeConseille(3, srd).emplacements.slice(0, 4).map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  const depart = moteur.executer(moteur.nouvellePartie(groupe, { graine: 1, niveau: 3 }), { type: 'commencer' }).partie;
  const ailleurs = (p: Partie, lieu: string): Partie => ({ ...p, scene: { type: 'exploration' }, etat: { ...p.etat, lieu } });
  const nouvelles = (avant: Partie, apres: Partie) => apres.journal.slice(avant.journal.length);

  it('« Dormir » dans un lieu sûr est repéré, sans chambre payée', () => {
    const sur = [...dm.lieux.values()].find((l) => l.repos === 'sur')!;
    const avant = ailleurs(depart, sur.id);
    const res = moteur.executer(avant, { type: 'seReposer', duree: 'long' });
    expect(res.refus).toBeUndefined();
    expect(res.partie.etat.jour).toBe(avant.etat.jour + 1);
    expect(detecterSommeil(nouvelles(avant, res.partie))).toEqual({ nuitPayee: false, interrompue: false });
  });

  it('une halte (repos court) n’ouvre pas l’écran de sommeil', () => {
    const sur = [...dm.lieux.values()].find((l) => l.repos === 'sur')!;
    const avant = ailleurs(depart, sur.id);
    const res = moteur.executer(avant, { type: 'seReposer', duree: 'court' });
    expect(detecterSommeil(nouvelles(avant, res.partie))).toBeUndefined();
  });

  it('une chambre payée à un aubergiste est repérée comme nuit payée', () => {
    const hote = [...dm.pnj.values()].find((p) => p.services.some((s) => /chambre|dortoir|hospitalite|abri|refuge/.test(s.id)));
    expect(hote, 'la Citadelle a un hôte qui loue une chambre').toBeDefined();
    if (!hote) return;
    const service = hote.services.find((s) => /chambre|dortoir|hospitalite|abri|refuge/.test(s.id))!;
    const avant = ailleurs({ ...depart, etat: { ...depart.etat, pieces: 10_000 } }, hote.lieu);
    const res = moteur.executer(avant, { type: 'payerService', pnj: hote.id, service: service.id });
    expect(res.refus).toBeUndefined();
    expect(detecterSommeil(nouvelles(avant, res.partie))).toEqual({ nuitPayee: true, interrompue: false });
  });

  it('une nuit interrompue par une rencontre est repérée comme interrompue', () => {
    const constats = [{ type: 'constat', texte: 'Le groupe s’endort, mais la nuit est interrompue au bout de 4 h : le repos ne vaut qu’une halte.' }] as unknown as Parameters<typeof detecterSommeil>[0];
    expect(detecterSommeil(constats)).toEqual({ nuitPayee: false, interrompue: true });
  });
});
