// La vue en arbre de l'atelier, sur un vrai monde : chaque lieu une seule fois, rattaché à son parent, avec ses fiches.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chargerMonde, RACINE_MONDES } from '../../packages/regles/src/monde/chargeur';
import { arbreDuMonde, filtrerArbre, tailleDuNoeud, type NoeudLieu } from './src/arbre';

const r = chargerMonde(join(RACINE_MONDES, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde;
const tous = (ns: NoeudLieu[]): NoeudLieu[] => ns.flatMap((n) => [n, ...tous(n.enfants)]);

describe('l’arbre des lieux', () => {
  const arbre = arbreDuMonde(dm);

  it('contient chaque lieu exactement une fois, sous son parent', () => {
    const liste = tous(arbre.racines);
    expect(liste.length).toBe(dm.lieux.size);
    expect(new Set(liste.map((n) => n.id)).size).toBe(dm.lieux.size);
    expect(arbre.racines.reduce((s, n) => s + tailleDuNoeud(n), 0)).toBe(dm.lieux.size);
    for (const n of liste) for (const e of n.enfants) expect(dm.lieux.get(e.id)!.parent).toBe(n.id);
  });

  it('range chaque PNJ, trésor, piège et énigme sous son lieu', () => {
    const parLieu = new Map(tous(arbre.racines).map((n) => [n.id, n]));
    const a = (dossier: string, id: string, lieu: string) => expect(parLieu.get(lieu)!.entites.some((e) => e.dossier === dossier && e.id === id)).toBe(true);
    for (const p of dm.pnj.values()) a('pnj', p.id, p.lieu);
    for (const t of dm.tresors.values()) a('tresors', t.id, t.lieu);
    for (const p of dm.pieges.values()) a('pieges', p.id, p.lieu);
    for (const e of dm.enigmes.values()) a('enigmes', e.id, e.lieu);
    expect(arbre.egarees).toEqual([]);
  });

  it('ne compte pas deux fois une rencontre listée par le lieu et par son champ lieu', () => {
    for (const n of tous(arbre.racines)) {
      const cles = n.entites.map((e) => `${e.dossier}/${e.id}/${e.detail ?? ''}`);
      const rencontres = n.entites.filter((e) => e.dossier === 'rencontres').map((e) => e.id);
      expect(new Set(rencontres).size).toBe(rencontres.length);
      expect(new Set(cles).size).toBe(cles.length);
    }
  });

  it('rattache les fiches des modules qui ont un lieu (dilemmes, examens…)', () => {
    const modules = tous(arbre.racines).flatMap((n) => n.entites).filter((e) => !['pnj', 'rencontres', 'tresors', 'pieges', 'enigmes', 'evenements', 'quetes'].includes(e.dossier));
    expect(modules.length).toBeGreaterThan(0);
  });

  it('une boucle de parents ou un parent inconnu font du lieu une racine, sans tourner en rond', () => {
    const copie = { ...dm, lieux: new Map([...dm.lieux].map(([k, v]) => [k, { ...v }])) };
    const [a, b] = [...copie.lieux.values()].filter((l) => l.parent);
    a!.parent = b!.id;
    b!.parent = a!.id;
    const x = arbreDuMonde(copie);
    expect(tous(x.racines).length).toBe(copie.lieux.size);
    expect(x.racines.some((n) => n.id === a!.id || n.id === b!.id)).toBe(true);
  });

  it('la recherche garde le lieu trouvé et ses ancêtres', () => {
    const pnj = [...dm.pnj.values()][0]!;
    const res = filtrerArbre(arbre.racines, pnj.nom);
    const trouves = tous(res).flatMap((n) => n.entites);
    expect(trouves.some((e) => e.id === pnj.id)).toBe(true);
    expect(tous(res).length).toBeLessThan(dm.lieux.size);
    expect(filtrerArbre(arbre.racines, '   ')).toBe(arbre.racines);
  });
});
