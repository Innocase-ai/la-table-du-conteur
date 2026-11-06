// Les identifiants d'un monde : kebab-case ASCII (`mere-sorel-quaibas`). La cause n°1 d'erreurs d'écriture d'un monde (accents,
// majuscules, ids différents du registre) : ce fichier les fabrique, les vérifie et propose le préfixe de zone attendu.

/** Un nom libre en identifiant : sans accents ni majuscules, séparé par des tirets (`Mère Sorel d'Hautecôte` → `mere-sorel-d-hautecote`). */
export function versIdentifiant(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/œ/gi, 'oe')
    .replace(/æ/gi, 'ae')
    .replace(/ß/g, 'ss')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const FORMAT = /^[a-z0-9][a-z0-9-]*$/;

/** `null` si l'identifiant est valide, sinon la raison. */
export function problemeIdentifiant(id: string): string | null {
  if (!id) return 'identifiant vide';
  if (FORMAT.test(id)) return null;
  if (/[A-Z]/.test(id)) return 'les majuscules sont interdites';
  if (/[^\x00-\x7f]/.test(id)) return 'les accents et caractères non ASCII sont interdits';
  if (/\s/.test(id)) return 'les espaces sont interdits (utiliser des tirets)';
  if (/^-/.test(id)) return 'ne peut pas commencer par un tiret';
  return 'seuls les lettres minuscules, chiffres et tirets sont permis';
}

/** Le préfixe de zone que portent la plupart des identifiants d'un dossier (`cit-`, `por-`…), ou `undefined` s'il n'y en a pas de net. */
export function prefixeProbable(ids: string[]): string | undefined {
  if (ids.length < 4) return undefined;
  const compte = new Map<string, number>();
  for (const id of ids) {
    const i = id.indexOf('-');
    if (i > 0 && i <= 5) compte.set(id.slice(0, i + 1), (compte.get(id.slice(0, i + 1)) ?? 0) + 1);
  }
  const [meilleur, n] = [...compte.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
  return meilleur && n! >= Math.max(3, ids.length * 0.3) ? meilleur : undefined;
}

/** Un identifiant libre pour un nom : `prefixe` + nom en kebab-case, avec un numéro (`-2`, `-3`…) en cas de collision. */
export function proposerIdentifiant(nom: string, existants: ReadonlySet<string>, prefixe = ''): string {
  const base = `${prefixe}${versIdentifiant(nom)}`.replace(/^-+/, '');
  if (!base) return '';
  if (!existants.has(base)) return base;
  for (let n = 2; n < 1000; n++) if (!existants.has(`${base}-${n}`)) return `${base}-${n}`;
  return base;
}

/**
 * Les identifiants cités dans la section « Registre des identifiants » (§ 7) d'une BIBLE : en tête d'un élément de liste
 * (`- mireval — village`), dans la première colonne d'un tableau, ou entre accents graves.
 */
export function idsDeLaBible(markdown: string): Set<string> {
  const debut = markdown.search(/^##\s*7[.\s]/m);
  if (debut < 0) return new Set();
  const reste = markdown.slice(debut + 3);
  const fin = reste.search(/^##\s/m);
  const section = fin < 0 ? reste : reste.slice(0, fin);
  const ids = new Set<string>();
  const ajouter = (t: string | undefined) => t && /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(t) && t.includes('-') && ids.add(t);
  for (const ligne of section.split('\n')) {
    ajouter(/^\s*[-*]\s+`?([a-z0-9][a-z0-9-]*)`?(?=\s|$|:)/.exec(ligne)?.[1]);
    ajouter(/^\s*\|\s*`?([a-z0-9][a-z0-9-]*)`?\s*\|/.exec(ligne)?.[1]);
    for (const m of ligne.matchAll(/`([a-z0-9][a-z0-9-]*)`/g)) ajouter(m[1]);
  }
  return ids;
}
