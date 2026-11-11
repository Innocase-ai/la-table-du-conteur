import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { creerMoteur, herosPreTires, MODULES_STANDARD, personnageDepuisFiche } from '../src';
import { chargerMonde } from '../src/monde/chargeur';
import { Lien } from '../src/monde/schemas';
import { validerMonde } from '../src/monde/validation';
import { chargerDonneesSrd } from '../src/donnees-node';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = structuredClone(r.monde);
const depart = dm.lieux.get(dm.monde.depart.lieu)!;
const ABSENT = { nom: 'La Route des Scories', motif: 'bientot' as const, texte: 'La route est fermée : les gardiens de la Cuirasse n’ont pas encore ouvert leurs portes.' };
depart.liens.push(Lien.parse({ vers: 'lieu-pas-encore-ecrit', type: 'route', heures: 8, absent: ABSENT }));
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
const groupe = herosPreTires(srd).map((h) => personnageDepuisFiche(h.fiche, { id: h.fiche.nom.toLowerCase() }));
const partie = moteur.executer(moteur.nouvellePartie(groupe, { graine: 5, niveau: 3 }), { type: 'commencer' }).partie;
const calme = partie.scene.type === 'rencontre' ? moteur.executer(partie, { type: 'reglerRencontre', issue: 'fuite' }).partie : partie;

describe('passage vers une suite absente', () => {
  it('le schéma exige un nom, un motif et un texte', () => {
    expect(() => Lien.parse({ vers: 'x', type: 'route', absent: { nom: 'X', motif: 'bientot' } })).toThrow();
    expect(() => Lien.parse({ vers: 'x', type: 'route', absent: { nom: 'X', motif: 'jamais', texte: 't' } })).toThrow();
  });

  it('le validateur accepte le lieu inconnu quand le lien porte « absent »', () => {
    const erreurs = validerMonde(dm, srd).erreurs.filter((e) => e.includes('lieu-pas-encore-ecrit'));
    expect(erreurs).toEqual([]);
  });

  it('le validateur refuse toujours un lien vers un lieu inconnu sans « absent »', () => {
    const autre = structuredClone(r.monde);
    autre.lieux.get(autre.monde.depart.lieu)!.liens.push(Lien.parse({ vers: 'lieu-pas-encore-ecrit', type: 'route', heures: 8 }));
    expect(validerMonde(autre, srd).erreurs.some((e) => e.includes('lieu-pas-encore-ecrit'))).toBe(true);
  });

  it('le passage est proposé, grisé, avec son texte ; y aller est refusé avec ce texte', () => {
    const bouton = moteur.propositions(calme).find((p) => p.libelle === ABSENT.nom);
    expect(bouton).toBeDefined();
    expect(bouton!.desactivee).toBe('Bientôt disponible.');
    expect(bouton!.apercu).toBe(ABSENT.texte);
    const essai = moteur.executer(calme, { type: 'aller', vers: 'lieu-pas-encore-ecrit' });
    expect(essai.refus).toBe(ABSENT.texte);
    expect(essai.partie.etat.lieu).toBe(calme.etat.lieu);
  });

  it('un motif « pack » le dit', () => {
    const l = depart.liens.at(-1)!;
    l.absent = { ...ABSENT, motif: 'pack' };
    const bouton = moteur.propositions(calme).find((p) => p.libelle === ABSENT.nom);
    expect(bouton!.desactivee).toBe('Fait partie d’un autre pack.');
    l.absent = ABSENT;
  });
});
