// La quête des rats de Port-Sillage : le groupe nettoie la cave, puis RENVOIE la quête en parlant à Maëva (étape « rendre ») ;
// une quête close ne se rouvre jamais quand on reparle du même sujet, et une quête restée « en cours » sans étape active (sauvegarde
// d'avant la correction) reprend à l'étape qui suit.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { aller, creerGenerateur, etatInitial, herosPreTires, issueRencontre, nouvellePartie, parler, personnageDepuisFiche, jouerEffets, validerMonde, type PartieMonde } from '../src';
import { chargerMonde } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(MONDES_ESSAI, 'port-sillage'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde;
const QUETE = 'q-maeva-la-cave';

function partie(): PartieMonde {
  const p = nouvellePartie(dm, etatInitial(dm), herosPreTires(srd).map((h) => personnageDepuisFiche(h.fiche, { id: h.fiche.nom.toLowerCase() })), creerGenerateur(1));
  p.etat.lieu = 'ta-salle';
  return p;
}

/** Accepte la quête, nettoie la cave, revient à la salle. */
function nettoyer(p: PartieMonde): void {
  parler(p, 'maeva-brisant', 'la-cave-aux-rats');
  aller(p, 'ta-cave');
  issueRencontre(p, 'z1-r-rats-de-la-cave', { type: 'victoire', px: 100 });
  p.etat.lieu = 'ta-salle';
}

describe('la quête des rats de la cave : on la rend à Maëva', () => {
  it('nettoyer la cave ne termine pas la quête : il reste à la rendre, et l’étape le dit', () => {
    const p = partie();
    nettoyer(p);
    const q = p.etat.quetes[QUETE]!;
    expect(q.statut).toBe('active');
    expect(q.actives).toEqual(['rendre']);
    expect(p.etat.pieces).toBe(0);
    const texte = dm.quetes.get(QUETE)!.etapes.find((e) => e.id === 'rendre')!.texte;
    expect(texte).toMatch(/Maëva/);
    expect(texte).toMatch(/Hareng Rouillé/);
  });

  it('parler de la cave à Maëva rend la quête : récompense versée, quête accomplie', () => {
    const p = partie();
    nettoyer(p);
    parler(p, 'maeva-brisant', 'la-cave-est-propre');
    expect(p.etat.quetes[QUETE]!.statut).toBe('terminee');
    expect(p.etat.pieces).toBe(40);
  });

  it('Maëva le rappelle dans sa salutation, et ne propose plus l’ancien sujet de la cave', () => {
    const p = partie();
    nettoyer(p);
    expect(parler(p, 'maeva-brisant').narrations.join(' ')).toMatch(/ma cave/);
    parler(p, 'maeva-brisant', 'la-cave-est-propre');
    expect(parler(p, 'maeva-brisant').narrations.join(' ')).not.toMatch(/Alors, ma cave/);
  });

  it('une quête close ne se rouvre pas quand on reparle du sujet de départ', () => {
    const p = partie();
    nettoyer(p);
    parler(p, 'maeva-brisant', 'la-cave-est-propre');
    parler(p, 'maeva-brisant', 'la-cave-aux-rats');
    expect(p.etat.quetes[QUETE]!.statut).toBe('terminee');
    expect(p.etat.pieces).toBe(40);
  });

  it('une quête « en cours » sans étape active (ancienne sauvegarde) reprend à l’étape « rendre »', () => {
    const p = partie();
    p.etat.quetes[QUETE] = { statut: 'active', actives: [], accomplies: ['descendre', 'chasser'] };
    p.etat.flags['z1-cave-nettoyee'] = true;
    jouerEffets(p, [], []);
    expect(p.etat.quetes[QUETE]!.actives).toEqual(['rendre']);
    parler(p, 'maeva-brisant', 'la-cave-est-propre');
    expect(p.etat.quetes[QUETE]!.statut).toBe('terminee');
  });

  it('le validateur avertit d’une quête à donneur sans étape de retour, et plus quand la dernière étape renvoie au donneur', () => {
    const avis = () => validerMonde(dm, srd).avertissements.join('\n');
    const quete = dm.quetes.get(QUETE)!;
    expect(avis()).not.toMatch(new RegExp(`n'ont pas d'étape de retour[^\n]*${QUETE}`));
    const rendre = quete.etapes.find((e) => e.id === 'rendre')!;
    const texte = rendre.texte;
    try {
      rendre.texte = 'Terminez le travail.';
      expect(avis()).toMatch(new RegExp(`n'ont pas d'étape de retour[^\n]*${QUETE}`));
    } finally {
      rendre.texte = texte;
    }
  });
});
