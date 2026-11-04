import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { appliquerEffets, etatInitial, nouvellePartie, pnjPresents, creerGenerateur, validerMonde, type DonneesMonde } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

/** Un PNJ escorté suit le groupe : présent dans tous les lieux, jusqu'à ce qu'on l'arrête. */
const r = chargerMonde(join(RACINE_MONDES, 'val-des-cendres'));
if (!r.ok) throw new Error('monde illisible');
const dm = r.monde as DonneesMonde;

describe('effet escorte', () => {
  it('rend un PNJ présent partout, puis le laisse là où il est', () => {
    const etat = etatInitial(dm);
    etat.lieu = 'veillecendre';
    const p = nouvellePartie(dm, etat, [], creerGenerateur(1));
    const bertille = dm.pnj.get('bertille-dernier-feu')!;
    // Ailleurs que dans son auberge, elle est absente.
    p.etat.lieu = 'vei-marche';
    expect(pnjPresents(p).some((n) => n.id === bertille.id)).toBe(false);
    appliquerEffets([{ escorte: { pnj: bertille.id, actif: true } }], p.etat, dm);
    expect(pnjPresents(p).some((n) => n.id === bertille.id)).toBe(true);
    p.etat.lieu = 'pont-de-fer';
    expect(pnjPresents(p).some((n) => n.id === bertille.id)).toBe(true);
    // Un PNJ mort ne suit plus.
    appliquerEffets([{ pnjEtat: { pnj: bertille.id, etat: 'mort' } }], p.etat, dm);
    expect(pnjPresents(p).some((n) => n.id === bertille.id)).toBe(false);
    appliquerEffets([{ pnjEtat: { pnj: bertille.id, etat: 'vivant' } }, { escorte: { pnj: bertille.id, actif: false } }], p.etat, dm);
    expect(pnjPresents(p).some((n) => n.id === bertille.id)).toBe(false);
  });

  it('le validateur vérifie que le PNJ escorté existe', () => {
    const copie = { ...dm, evenements: new Map(dm.evenements) } as DonneesMonde;
    copie.evenements.set('ev-escorte-fantome', { id: 'ev-escorte-fantome', declencheur: 'condition', unique: true, narration: 'Test.', effets: [{ escorte: { pnj: 'pnj-qui-n-existe-pas', actif: true } }] } as never);
    const v = validerMonde(copie, chargerDonneesSrd());
    expect(v.erreurs.join('\n')).toMatch(/pnj-qui-n-existe-pas/);
  });
});
