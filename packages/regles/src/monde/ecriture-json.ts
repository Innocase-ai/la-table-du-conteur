// Écrire dans un fichier JSON d'un monde SANS le reformater : seule l'entité modifiée change, le reste du fichier reste
// identique à l'octet près. Les fichiers des mondes ont des styles variés (listes courtes sur une ligne, indentation à 2 ou
// 4 espaces) : réécrire un fichier entier avec `JSON.stringify` ferait des diffs énormes et se battrait avec les éditions de
// Claude Code. Fonctions pures, testées dans ecriture-json.test.ts.

export interface Element {
  /** Position du premier caractère de l'élément dans le texte. */
  debut: number;
  /** Position juste après le dernier caractère. */
  fin: number;
}

/** Les éléments de premier niveau d'un fichier : ceux du tableau, ou l'objet seul. `null` si le texte n'est pas un tableau ni un objet. */
export function elementsDuFichier(texte: string): { tableau: boolean; elements: Element[]; ouvrante: number; fermante: number } | null {
  const i0 = texte.search(/\S/);
  if (i0 < 0) return null;
  const c0 = texte[i0];
  if (c0 === '{') {
    let fin = i0;
    // L'objet seul : on trouve son accolade fermante.
    const spans = scanner(texte, i0);
    fin = spans.fermante + 1;
    return { tableau: false, elements: [{ debut: i0, fin }], ouvrante: i0, fermante: spans.fermante };
  }
  if (c0 !== '[') return null;
  const { fermante, separateurs, debuts } = scanner(texte, i0);
  const elements: Element[] = [];
  for (let k = 0; k < debuts.length; k++) {
    const debut = debuts[k]!;
    const limite = k < separateurs.length ? separateurs[k]! : fermante;
    let fin = limite;
    while (fin > debut && /\s/.test(texte[fin - 1]!)) fin--;
    elements.push({ debut, fin });
  }
  return { tableau: true, elements, ouvrante: i0, fermante };
}

/** Parcourt un tableau ou un objet à partir de son ouvrante : où il se ferme, où sont ses virgules de premier niveau et où commence chaque élément. */
function scanner(texte: string, ouvrante: number): { fermante: number; separateurs: number[]; debuts: number[] } {
  let profondeur = 0;
  let dansTexte = false;
  const separateurs: number[] = [];
  const debuts: number[] = [];
  let attendDebut = true;
  for (let i = ouvrante; i < texte.length; i++) {
    const c = texte[i]!;
    if (dansTexte) {
      if (c === '\\') i++;
      else if (c === '"') dansTexte = false;
      continue;
    }
    if (c === '"') {
      dansTexte = true;
      if (profondeur === 1 && attendDebut) (debuts.push(i), (attendDebut = false));
      continue;
    }
    if (c === '[' || c === '{') {
      profondeur++;
      if (profondeur === 2 && attendDebut) (debuts.push(i), (attendDebut = false));
      continue;
    }
    if (c === ']' || c === '}') {
      profondeur--;
      if (profondeur === 0) return { fermante: i, separateurs, debuts };
      continue;
    }
    if (profondeur === 1) {
      if (c === ',') (separateurs.push(i), (attendDebut = true));
      else if (attendDebut && !/\s/.test(c)) (debuts.push(i), (attendDebut = false));
    }
  }
  throw new Error('JSON non terminé.');
}

// ---------------------------------------------------------------------------
// Mise en forme : le style des fichiers de monde (listes et petits objets sur une ligne quand ils tiennent)
// ---------------------------------------------------------------------------

export interface StyleJson {
  /** Un niveau d'indentation (`'  '` ou `'    '`). */
  unite: string;
  /** Longueur maximale d'une ligne pour garder une liste ou un petit objet « en ligne ». */
  largeur: number;
  /** Tout développer, comme `JSON.stringify(valeur, null, 2)` (style des fichiers écrits par des scripts). */
  etendu?: boolean;
  /** Tout mettre sur une ligne, quel que soit le nombre de clés ou le contenu des listes. */
  toutEnLigne?: boolean;
}

const STYLE_PAR_DEFAUT: StyleJson = { unite: '  ', largeur: 110 };
/** Un élément qui tient sur une ligne reste sur une ligne, quelle que soit sa taille. */
const EN_LIGNE: Partial<StyleJson> & { largeur: number; etendu: false; toutEnLigne: true } = { largeur: Infinity, etendu: false, toutEnLigne: true };

/** Met une valeur en forme dans le style des fichiers de monde : `{ "a": 1 }` et `["x", "y"]` en ligne s'ils tiennent, sinon développés. */
export function formater(valeur: unknown, indent = '', style: StyleJson = STYLE_PAR_DEFAUT): string {
  if (Array.isArray(valeur)) {
    if (!valeur.length) return '[]';
    const interne = indent + style.unite;
    const parts = valeur.map((x) => formater(x, interne, style));
    if (style.etendu) return `[\n${parts.map((p) => interne + p).join(',\n')}\n${indent}]`;
    const enLigne = `[${parts.join(', ')}]`;
    if (parts.every((p) => !p.includes('\n')) && indent.length + enLigne.length <= style.largeur && (style.toutEnLigne || valeur.every((x) => x === null || typeof x !== 'object') || valeur.length === 1)) return enLigne;
    return `[\n${parts.map((p) => interne + p).join(',\n')}\n${indent}]`;
  }
  if (valeur && typeof valeur === 'object') {
    const entrees = Object.entries(valeur as Record<string, unknown>).filter(([, v]) => v !== undefined);
    if (!entrees.length) return '{}';
    const interne = indent + style.unite;
    const parts = entrees.map(([k, v]) => `${JSON.stringify(k)}: ${formater(v, interne, style)}`);
    if (style.etendu) return `{\n${parts.map((p) => interne + p).join(',\n')}\n${indent}}`;
    const enLigne = `{ ${parts.join(', ')} }`;
    if ((style.toutEnLigne || entrees.length <= 3) && parts.every((p) => !p.includes('\n')) && indent.length + enLigne.length <= style.largeur) return enLigne;
    return `{\n${parts.map((p) => interne + p).join(',\n')}\n${indent}}`;
  }
  return JSON.stringify(valeur) ?? 'null';
}

/** L'unité d'indentation d'un fichier, d'après son premier élément développé (deux espaces par défaut). */
function uniteDuFichier(texte: string): string {
  const f = elementsDuFichier(texte);
  for (const e of f?.elements.slice(0, 5) ?? []) {
    const ligne = texte.slice(e.debut, e.fin).split('\n')[1];
    if (!ligne) continue;
    const rentre = /^ */.exec(ligne)![0].length;
    const base = f!.tableau ? colonne(texte, e.debut) : 0;
    if (rentre > base) return ' '.repeat(rentre - base);
  }
  return STYLE_PAR_DEFAUT.unite;
}

/**
 * Le style d'un fichier : celui qui refait le plus fidèlement ses éléments EXISTANTS (tout développé, comme un script ; ou « en ligne »
 * quand ça tient, comme les agents, avec plusieurs largeurs). À égalité, le style développé.
 */
export function styleDuFichier(texte: string): StyleJson {
  const unite = uniteDuFichier(texte);
  const candidats: StyleJson[] = [{ unite, largeur: 0, etendu: true }, ...[80, 100, 110, 120, 140].map((largeur) => ({ unite, largeur }))];
  const f = elementsDuFichier(texte);
  if (!f?.tableau || !f.elements.length) return candidats[0]!;
  // Des éléments tous sur une ligne : le style « tout en ligne ».
  if (f.elements.slice(0, 60).every((e) => !texte.slice(e.debut, e.fin).includes('\n'))) return { unite, largeur: Infinity, toutEnLigne: true };
  let meilleur = candidats[0]!;
  let score = -1;
  for (const c of candidats) {
    let n = 0;
    for (const e of f.elements.slice(0, 60)) {
      try {
        const original = texte.slice(e.debut, e.fin);
        const indent = ' '.repeat(colonne(texte, e.debut));
        const s = original.includes('\n') ? c : { ...c, ...EN_LIGNE };
        if (formater(JSON.parse(original), indent, s) === original) n++;
      } catch {
        // élément illisible : ignoré
      }
    }
    if (n > score) (score = n), (meilleur = c);
  }
  return meilleur;
}

/** Le numéro de colonne (nombre d'espaces de tête) de la ligne où se trouve `position`. */
function colonne(texte: string, position: number): number {
  const debutLigne = texte.lastIndexOf('\n', position - 1) + 1;
  return /^ */.exec(texte.slice(debutLigne))![0].length;
}

/** Remplace l'élément `index` du fichier par `valeur`, le reste du texte intact. */
export function remplacerElement(texte: string, index: number, valeur: unknown): string {
  const f = elementsDuFichier(texte);
  const e = f?.elements[index];
  if (!f || !e) throw new Error(`Élément ${index} introuvable.`);
  const indent = f.tableau ? ' '.repeat(colonne(texte, e.debut)) : '';
  const original = texte.slice(e.debut, e.fin);
  // Un élément écrit sur une seule ligne le reste (en ligne) ; sinon on le met en forme dans le style du fichier.
  const neuf = formater(valeur, indent, original.includes('\n') ? styleDuFichier(texte) : { ...styleDuFichier(texte), ...EN_LIGNE });
  return texte.slice(0, e.debut) + neuf + texte.slice(e.fin);
}

/** Ajoute `valeur` à la fin du tableau du fichier ; un fichier vide ou `[]` devient un tableau d'un élément. */
export function ajouterElement(texte: string, valeur: unknown): string {
  const f = elementsDuFichier(texte);
  if (!f) return `[\n  ${formater(valeur, '  ')}\n]\n`;
  if (!f.tableau) throw new Error('Ce fichier contient un objet seul : on ne peut pas y ajouter un élément.');
  const style = styleDuFichier(texte);
  const dernier = f.elements[f.elements.length - 1];
  const indent = dernier ? ' '.repeat(colonne(texte, dernier.debut)) : style.unite;
  const neuf = formater(valeur, indent, dernier && !texte.slice(dernier.debut, dernier.fin).includes('\n') ? { ...style, ...EN_LIGNE } : style);
  if (!dernier) return `${texte.slice(0, f.ouvrante + 1)}\n${indent}${neuf}\n${texte.slice(f.fermante)}`;
  return `${texte.slice(0, dernier.fin)},\n${indent}${neuf}${texte.slice(dernier.fin)}`;
}

/** L'indice de l'élément dont `id` est celui demandé (champ `id`, ou `pnj` pour une fiche de savoir), ou -1. */
export function indexDeElement(texte: string, id: string): number {
  const f = elementsDuFichier(texte);
  if (!f) return -1;
  return f.elements.findIndex((e) => {
    try {
      const v = JSON.parse(texte.slice(e.debut, e.fin)) as { id?: string; pnj?: string };
      return v.id === id || v.pnj === id;
    } catch {
      return false;
    }
  });
}
