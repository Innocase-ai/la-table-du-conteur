// Répondre à une énigme. Le texte libre ne convient qu'aux mots de passe et aux déductions : une séquence, des leviers,
// un cadran ou un placement se donnent sous une forme structurée. Ce fichier dit quelle forme (le contrôle, qui refuse
// sans aucune conséquence une réponse mal formée) et la décrit à l'écran (le formulaire).
import { normaliserTexte } from './etat';
import type { Enigme } from './schemas';

/** Le formulaire de réponse que l'écran montre pour une énigme structurée. */
export type FormulaireReponse =
  /** Choisir les éléments un à un, dans l'ordre (séquence). La réponse est la liste des `valeur`. */
  | { type: 'ordre'; champ: string; taille: number; options: { valeur: string; libelle: string }[] }
  /** Régler des nombres (cadran). La réponse est la liste des nombres. */
  | { type: 'nombres'; champ: string; libelles: string[]; min?: number; max?: number }
  /** Placer des leviers en haut ou en bas. La réponse est la liste des positions (`true` : en haut). */
  | { type: 'interrupteurs'; champ: string; libelles: string[]; etats: [string, string] }
  /** Mettre chaque élément à son emplacement (placement). La réponse associe la `cle` d'un emplacement à la `valeur` d'un élément. */
  | { type: 'association'; champ: string; emplacements: { cle: string; libelle: string }[]; options: { valeur: string; libelle: string }[] };

/**
 * Une réponse qui n'a pas la forme attendue n'est pas une mauvaise réponse : on la refuse, sans rien changer et sans
 * déclencher l'échec de l'énigme (un texte envoyé à une séquence, un élément qui n'existe pas, un nombre de leviers faux).
 */
export function controlerReponse(e: Enigme, reponse: unknown): string | undefined {
  const s = e.solution;
  switch (s.type) {
    case 'mot-de-passe':
    case 'deduction':
      return typeof reponse === 'string' && reponse.trim() ? undefined : 'Cette énigme attend une réponse écrite.';
    case 'sequence': {
      if (!Array.isArray(reponse)) return `Cette énigme se résout en donnant ses ${s.ordre.length} éléments, dans l'ordre.`;
      if (reponse.length !== s.ordre.length) return `Il faut donner les ${s.ordre.length} éléments, dans l'ordre (${reponse.length} reçus).`;
      const connus = s.ordre.map(normaliserTexte);
      const vus = reponse.map(normaliserTexte);
      const inconnu = reponse.find((_, i) => !connus.includes(vus[i]!));
      if (inconnu !== undefined) return `« ${String(inconnu)} » n'est pas l'un des éléments de cette énigme.`;
      return new Set(vus).size === vus.length ? undefined : 'Chaque élément ne se donne qu’une fois.';
    }
    case 'leviers':
      return Array.isArray(reponse) && reponse.length === s.positions.length && reponse.every((x) => typeof x === 'boolean')
        ? undefined
        : `Il faut donner la position de chacun des ${s.positions.length} leviers (vrai : en haut, faux : en bas).`;
    case 'cadran':
      return Array.isArray(reponse) && reponse.length === s.valeurs.length && reponse.every((x) => x !== '' && Number.isInteger(Number(x)))
        ? undefined
        : `Il faut régler les ${s.valeurs.length} positions du cadran, par des nombres entiers.`;
    case 'placement': {
      const attendu = Object.keys(s.emplacements);
      const elements = Object.values(s.emplacements);
      if (typeof reponse !== 'object' || reponse === null || Array.isArray(reponse))
        return `Il faut dire quel élément va à chacun des ${attendu.length} emplacements.`;
      const donnes = Object.entries(reponse as Record<string, unknown>);
      if (donnes.length !== attendu.length || !attendu.every((k) => k in reponse))
        return `Il faut dire quel élément va à chacun des ${attendu.length} emplacements.`;
      if (donnes.some(([, v]) => typeof v !== 'string' || !elements.includes(v))) return 'Chaque emplacement reçoit l’un des éléments proposés.';
      return new Set(donnes.map(([, v]) => v)).size === donnes.length ? undefined : 'Chaque élément ne se pose qu’une fois.';
    }
  }
}

// ---------------------------------------------------------------------------
// Le formulaire
// ---------------------------------------------------------------------------

/** « wagonnet-de-minerai » → « Wagonnet de minerai » ; un texte qui n'est pas un identifiant reste tel quel. */
export function lisible(id: string): string {
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(id)) return id;
  const t = id.replace(/\b([ld])-(?=[aeiouyhéèêâîôû])/g, "$1'").replace(/[-_]+/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Une empreinte stable d'un texte : le même ordre à chaque affichage, sans hasard. */
function empreinte(t: string): number {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Les éléments dans un ordre qui ne dit rien de la solution : mêlés de façon stable, puis décalés d'un cran si le
 * hasard retombait sur l'ordre de la solution.
 */
function ordreNeutre(enigme: string, valeurs: string[]): string[] {
  const melange = [...valeurs].sort((a, b) => empreinte(`${enigme}|${a}`) - empreinte(`${enigme}|${b}`));
  return melange.length > 1 && melange.every((v, i) => v === valeurs[i]) ? [...melange.slice(1), melange[0]!] : melange;
}

/**
 * Le formulaire de réponse d'une énigme ; rien pour un mot de passe ou une déduction, qui se répondent par un texte.
 * `nomObjet` donne le nom d'un objet du monde ou du SRD (les placements citent souvent des objets).
 */
export function formulaireEnigme(e: Enigme, nomObjet: (id: string) => string | undefined = () => undefined): FormulaireReponse | undefined {
  const s = e.solution;
  const nom = (id: string) => nomObjet(id) ?? lisible(id);
  switch (s.type) {
    case 'sequence':
      return {
        type: 'ordre',
        champ: 'reponse',
        taille: s.ordre.length,
        options: ordreNeutre(e.id, s.ordre).map((valeur) => ({ valeur, libelle: nom(valeur) })),
      };
    case 'cadran':
      return {
        type: 'nombres',
        champ: 'reponse',
        libelles: s.libelles ?? s.valeurs.map((_, i) => `Réglage ${i + 1}`),
        ...(s.plage ? { min: s.plage[0], max: s.plage[1] } : {}),
      };
    case 'leviers':
      return { type: 'interrupteurs', champ: 'reponse', libelles: s.positions.map((_, i) => `Levier ${i + 1}`), etats: ['Bas', 'Haut'] };
    case 'placement':
      return {
        type: 'association',
        champ: 'reponse',
        emplacements: Object.keys(s.emplacements).map((cle) => ({ cle, libelle: lisible(cle) })),
        options: ordreNeutre(e.id, Object.values(s.emplacements)).map((valeur) => ({ valeur, libelle: nom(valeur) })),
      };
    case 'mot-de-passe':
    case 'deduction':
      return undefined;
  }
}
