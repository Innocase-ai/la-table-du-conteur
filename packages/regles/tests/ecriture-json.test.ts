import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ajouterElement, elementsDuFichier, formater, indexDeElement, remplacerElement, styleDuFichier } from '../src/monde/ecriture-json';
import { RACINE_MONDES } from '../src/monde/chargeur';

/** Tous les fichiers JSON de données des mondes livrés (hors images, voix, estimation). */
function fichiersDesMondes(): { chemin: string; texte: string }[] {
  const res: { chemin: string; texte: string }[] = [];
  const parcourir = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) {
        if (!['images', 'voix', 'node_modules'].includes(f)) parcourir(p);
      } else if (p.endsWith('.json') && !p.endsWith('estimation.json')) res.push({ chemin: p.slice(RACINE_MONDES.length + 1), texte: readFileSync(p, 'utf8') });
    }
  };
  parcourir(RACINE_MONDES);
  return res;
}

const ETENDU = `[
  {
    "id": "a",
    "liste": [
      "x",
      "y"
    ]
  },
  {
    "id": "b",
    "n": 2
  }
]
`;

const COMPACT = `[
  { "id": "a", "effets": [{ "flag": "f" }], "mots": ["x", "y"] },
  { "id": "b", "n": 2 }
]
`;

describe('éléments d’un fichier', () => {
  it('trouve les éléments d’un tableau, d’un objet seul, et rien dans un texte sans structure', () => {
    const f = elementsDuFichier(ETENDU)!;
    expect(f.tableau).toBe(true);
    expect(f.elements).toHaveLength(2);
    expect(JSON.parse(ETENDU.slice(f.elements[1]!.debut, f.elements[1]!.fin))).toEqual({ id: 'b', n: 2 });
    const seul = elementsDuFichier('{ "id": "x", "a": [1, 2] }\n')!;
    expect(seul.tableau).toBe(false);
    expect(seul.elements).toHaveLength(1);
    expect(elementsDuFichier('   ')).toBeNull();
    expect(elementsDuFichier('"texte"')).toBeNull();
    expect(elementsDuFichier('[]')!.elements).toEqual([]);
  });

  it('ne se laisse pas tromper par des crochets, virgules et guillemets dans les textes', () => {
    const t = '[\n  { "id": "a", "texte": "un ] et un , et un \\" et un {" },\n  { "id": "b" }\n]\n';
    const f = elementsDuFichier(t)!;
    expect(f.elements).toHaveLength(2);
    expect(JSON.parse(t.slice(f.elements[0]!.debut, f.elements[0]!.fin)).texte).toBe('un ] et un , et un " et un {');
    expect(indexDeElement(t, 'b')).toBe(1);
    expect(indexDeElement(t, 'zzz')).toBe(-1);
  });
});

describe('mise en forme', () => {
  it('met en ligne ce qui tient, développe le reste, et sait tout développer', () => {
    expect(formater({ a: 1, b: ['x', 'y'] })).toBe('{ "a": 1, "b": ["x", "y"] }');
    expect(formater({ a: 1, b: 2, c: 3, d: 4 })).toBe('{\n  "a": 1,\n  "b": 2,\n  "c": 3,\n  "d": 4\n}');
    expect(formater({ a: { b: [1] } }, '', { unite: '  ', largeur: 110, etendu: true })).toBe('{\n  "a": {\n    "b": [\n      1\n    ]\n  }\n}');
    expect(formater([], '')).toBe('[]');
    expect(formater({ a: undefined, b: 1 })).toBe('{ "b": 1 }');
  });

  it('reconnaît le style d’un fichier : développé comme un script, ou en ligne, et l’indentation à 4 espaces', () => {
    expect(styleDuFichier(ETENDU).etendu).toBe(true);
    expect(styleDuFichier(COMPACT).etendu).toBeFalsy();
    const quatre = '[\n    {\n        "id": "a",\n        "n": 1\n    }\n]\n';
    expect(styleDuFichier(quatre).unite).toBe('    ');
  });
});

describe('remplacer et ajouter un élément', () => {
  it('ne change que l’élément visé, le reste du fichier reste identique', () => {
    const neuf = remplacerElement(ETENDU, 1, { id: 'b', n: 3 });
    expect(neuf).toBe(ETENDU.replace('"n": 2', '"n": 3'));
    const compact = remplacerElement(COMPACT, 0, { id: 'a', effets: [{ flag: 'g' }], mots: ['x', 'y'] });
    expect(compact).toBe(COMPACT.replace('"flag": "f"', '"flag": "g"'));
  });

  it('garde le style développé quand le fichier est développé', () => {
    const neuf = remplacerElement(ETENDU, 0, { id: 'a', liste: ['x', 'y', 'z'] });
    expect(neuf).toContain('"liste": [\n      "x",\n      "y",\n      "z"\n    ]');
    expect(JSON.parse(neuf)).toEqual([{ id: 'a', liste: ['x', 'y', 'z'] }, { id: 'b', n: 2 }]);
  });

  it('un objet seul est remplacé en entier ; un élément inconnu est refusé', () => {
    const t = '{ "id": "x", "n": 1 }\n';
    expect(remplacerElement(t, 0, { id: 'x', n: 2 })).toBe('{ "id": "x", "n": 2 }\n');
    expect(() => remplacerElement(ETENDU, 5, {})).toThrow(/introuvable/);
  });

  it('ajoute à la fin du tableau, dans le style du fichier, et dans un tableau vide', () => {
    const a = ajouterElement(COMPACT, { id: 'c', n: 3 });
    expect(a).toBe(COMPACT.replace('{ "id": "b", "n": 2 }', '{ "id": "b", "n": 2 },\n  { "id": "c", "n": 3 }'));
    const b = ajouterElement(ETENDU, { id: 'c' });
    expect(JSON.parse(b)).toHaveLength(3);
    expect(b.startsWith(ETENDU.slice(0, ETENDU.lastIndexOf('}') ))).toBe(true);
    expect(JSON.parse(ajouterElement('[]\n', { id: 'z' }))).toEqual([{ id: 'z' }]);
    expect(JSON.parse(ajouterElement('', { id: 'z' }))).toEqual([{ id: 'z' }]);
    expect(() => ajouterElement('{ "id": "x" }', { id: 'y' })).toThrow(/objet seul/);
  });
});

describe('sur les fichiers réels des mondes', () => {
  const fichiers = fichiersDesMondes();

  it('remplacer chaque élément par lui-même laisse le reste du fichier identique et le JSON inchangé', () => {
    let elements = 0;
    let identiques = 0;
    for (const { chemin, texte } of fichiers) {
      const f = elementsDuFichier(texte);
      if (!f) continue;
      const avant = JSON.parse(texte);
      // Un seul élément à la fois (tous serait long) : le premier, le dernier et un du milieu.
      const choisis = [...new Set([0, Math.floor(f.elements.length / 2), f.elements.length - 1])].filter((i) => i >= 0 && i < f.elements.length);
      for (const i of choisis) {
        const e = f.elements[i]!;
        const valeur = JSON.parse(texte.slice(e.debut, e.fin));
        const neuf = remplacerElement(texte, i, valeur);
        // Ce qui est avant et après l'élément n'a pas bougé d'un octet.
        expect(neuf.slice(0, e.debut), chemin).toBe(texte.slice(0, e.debut));
        expect(neuf.endsWith(texte.slice(e.fin)), chemin).toBe(true);
        expect(JSON.parse(neuf), chemin).toEqual(avant);
        elements++;
        if (neuf === texte) identiques++;
      }
    }
    expect(elements).toBeGreaterThan(300);
    // Le style est retrouvé pour l'essentiel des éléments (le reste est un détail de mise en forme de l'élément édité seul).
    expect(identiques / elements).toBeGreaterThan(0.8);
  });

  it('ajouter un élément à un tableau réel garde le JSON valide et le début du fichier intact', () => {
    for (const { chemin, texte } of fichiers.slice(0, 120)) {
      const f = elementsDuFichier(texte);
      if (!f?.tableau || !f.elements.length) continue;
      const neuf = ajouterElement(texte, { id: 'nouveau-test', nom: 'Test' });
      const json = JSON.parse(neuf) as { id: string }[];
      expect(json[json.length - 1]!.id, chemin).toBe('nouveau-test');
      expect(json).toHaveLength((JSON.parse(texte) as unknown[]).length + 1);
      const dernier = f.elements[f.elements.length - 1]!;
      expect(neuf.startsWith(texte.slice(0, dernier.fin)), chemin).toBe(true);
    }
  });
});
