import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chargerMonde } from '../src/monde/chargeur';
import { RencontreMonde } from '../src/monde/schemas';
import { validerMonde } from '../src/monde/validation';
import { chargerDonneesSrd } from '../src/donnees-node';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(MONDES_ESSAI, 'port-sillage'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const monde = r.monde;

const voie = (id: string, competence: string) => ({ id, nom: id, resume: 'une façon de s’en sortir', jet: { competence, dd: 12 } });
function avecRencontre(alternatives: unknown[]): string[] {
  const dm = structuredClone(monde);
  const lieu = [...dm.lieux.keys()][0]!;
  dm.rencontres.set('test-voie', RencontreMonde.parse({ id: 'test-voie', nom: 'Un garde obstiné', type: 'social', lieu, difficulte: 'faible', intro: 'Un garde barre la route.', alternatives }));
  return validerMonde(dm, srd).avertissements.filter((a) => a.includes('test-voie') && a.includes('voie unique'));
}

describe('chemin critique : une rencontre sans combat a au moins deux voies', () => {
  it('une seule issue : avertissement', () => {
    expect(avecRencontre([voie('parler', 'persuasion')])).toHaveLength(1);
    expect(avecRencontre([])).toHaveLength(1);
  });
  it('plusieurs issues sur la même compétence : avertissement', () => {
    const av = avecRencontre([voie('parler', 'persuasion'), voie('supplier', 'persuasion')]);
    expect(av).toHaveLength(1);
    expect(av[0]).toContain('persuasion');
  });
  it('deux compétences différentes : rien à signaler', () => {
    expect(avecRencontre([voie('parler', 'persuasion'), voie('intimider', 'intimidation')])).toEqual([]);
  });
  it('une issue sans jet (une parole, un objet) compte comme une autre voie', () => {
    expect(avecRencontre([voie('parler', 'persuasion'), { id: 'payer', nom: 'Payer', resume: 'une bourse suffit' }])).toEqual([]);
  });
  it('un combat n’est pas concerné', () => {
    const dm = structuredClone(monde);
    dm.rencontres.set('test-combat', RencontreMonde.parse({ id: 'test-combat', nom: 'Bagarre', type: 'combat', lieu: [...dm.lieux.keys()][0], difficulte: 'faible', intro: 'Ça cogne.', monstres: [{ profil: 'bandit', nombre: 1 }] }));
    expect(validerMonde(dm, srd).avertissements.filter((a) => a.includes('test-combat') && a.includes('voie unique'))).toEqual([]);
  });
});
