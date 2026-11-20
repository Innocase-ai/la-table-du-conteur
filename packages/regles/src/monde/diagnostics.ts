// Diagnostics structurés : ce que l'atelier d'auteur affiche, trie et rend cliquable.
// Le validateur historique (`validerMonde`, modules, audit des énigmes) produit des phrases ; ce fichier les range
// en `Diagnostic` (code stable, gravité, entité visée) sans en changer le texte, qui reste la référence du CLI.

export type Gravite = 'erreur' | 'avis' | 'conseil';

/** Une entité du monde : `type` est le nom de son dossier (`lieux`, `pnj`, `quetes`, `dilemmes`…). */
export interface RefEntite {
  type: string;
  id: string;
}

export interface Diagnostic {
  /** Code stable, par famille : `ref.inconnue`, `fin.inatteignable`, `module.savoirs`, `enigme.jouable`… */
  code: string;
  gravite: Gravite;
  /** Le texte historique, tel que le CLI l'affiche (sans le préfixe `[module]`). */
  message: string;
  entite?: RefEntite;
  /** Où, dans l'entité (`['liens', 2, 'condition']`), quand on le sait. */
  chemin?: (string | number)[];
  source: 'validation' | `module:${string}` | 'enigmes' | 'references' | 'controles' | 'revue';
  /** Ce que la revue a trouvé, pour l'afficher et le corriger : le mot, l'extrait, le champ, la valeur attendue… */
  donnees?: Record<string, unknown>;
}

/** Les préfixes de message du validateur (« Lieu « x » », « PNJ « x »… ») et le dossier de l'entité. */
const PREFIXES: [RegExp, string][] = [
  [/^Lieu « ([^»]+) »/, 'lieux'],
  [/^PNJ « ([^»]+) »/, 'pnj'],
  [/^Objet « ([^»]+) »/, 'objets'],
  [/^Table « ([^»]+) »/, 'tables'],
  [/^Trésor « ([^»]+) »/, 'tresors'],
  [/^Piège « ([^»]+) »/, 'pieges'],
  [/^Énigme « ([^»]+) »/, 'enigmes'],
  [/^Rencontre « ([^»]+) »/, 'rencontres'],
  [/^Quête « ([^»]+) »/, 'quetes'],
  [/^Faction « ([^»]+) »/, 'factions'],
  [/^Jauge « ([^»]+) »/, 'jauges'],
  [/^Événement « ([^»]+) »/, 'evenements'],
  [/^Fin « ([^»]+) »/, 'fins'],
  [/^Fait(?: clé)? « ([^»]+) »/, 'faits'],
  [/^Chapitre « ([^»]+) »/, 'chapitres'],
  [/^Dilemme « ([^»]+) »/, 'dilemmes'],
  [/^Événement à choix « ([^»]+) »/, 'evenements-choix'],
  [/^Interjection « ([^»]+) »/, 'interjections'],
  [/^Question « ([^»]+) »/, 'codex'],
  [/^Examen « ([^»]+) »/, 'examens'],
  [/^Scène « ([^»]+) »/, 'scenes'],
  [/^Savoir « ([^»]+) »/, 'savoirs'],
];

/** L'entité visée par un message du validateur, d'après son préfixe (« Quête « q-x », étape… »). */
export function entiteDuMessage(message: string): RefEntite | undefined {
  for (const [re, type] of PREFIXES) {
    const m = re.exec(message);
    if (m) return { type, id: m[1]! };
  }
  return undefined;
}

/** Le code d'un message historique, d'après sa forme. Ce qu'on ne reconnaît pas reste `validation.autre`. */
export function codeDuMessage(message: string, gravite: Gravite): string {
  if (/inconnu(e)? « /.test(message)) return 'ref.inconnue';
  if (/inaccessible depuis le départ/.test(message)) return 'lieu.inaccessible';
  if (/personne ne le révèle/.test(message)) return 'fait.sans-source';
  if (/est lu mais jamais posé/.test(message)) return 'flag.lu-jamais-pose';
  if (/ sautable : son objectif/.test(message) || /^Sujet « [^»]+ » : il débloque/.test(message)) return 'quete.sautable';
  if (/ : sans chemin de retour vers un lieu sûr/.test(message)) return 'lieu.sans-retour';
  if (/ : renvoie vers « /.test(message)) return 'texte.renvoi-pnj';
  if (/ sans condition de présence \(/.test(message)) return 'texte.compagnon-nomme';
  if (/ : texte mort \(/.test(message) || /: texte mort \(/.test(message)) return 'texte.variante-morte';
  if (/ : condition impossible \(/.test(message) || / : verrou DD \d+ sans clé/.test(message)) return 'condition.impossible';
  if (/est exigé mais ne se trouve nulle part/.test(message)) return 'objet.introuvable';
  if (/est exigé mais n'est révélé nulle part/.test(message)) return 'fait.introuvable';
  if (/rien ne la propose ni ne l'active/.test(message)) return 'quete.jamais-proposee';
  if (/^Fait clé/.test(message)) return 'fait.cle-source-unique';
  // Avis de quêtes de la fiche F3 (`quetes-avis.ts`).
  if (/^Quête « [^»]+ », étape « [^»]+ » : elle exige la rencontre/.test(message)) return 'quete.tue-qui-parle';
  if (/^Rencontre « [^»]+ », alternative « [^»]+ » : une négociation contre des adversaires/.test(message)) return 'rencontre.parole-muette';
  if (/^Quête « [^»]+ » : pas d'`annonce` de récompense/.test(message)) return 'quete.sans-annonce';
  if (/^Quête « [^»]+ » : la dernière étape ne se rend pas à son donneur/.test(message)) return 'quete.sans-retour';
  if (/^Quête « [^»]+ » : (l'accomplissement de l'étape|son prérequis ne peut jamais)/.test(message)) return 'quete.etape-impossible';
  const debut = /^(Richesse|Rythme|Tension|Enjeu|PX|Butin|Choix|Pertes|Réactivité|Repos|Passages|Dialogues|Accroches) ?:/.exec(message);
  if (debut) return `conseil.${debut[1]!.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}`;
  return gravite === 'erreur' ? 'validation.erreur' : 'validation.autre';
}

/**
 * Les défauts de jeu : ce qui casse ou trompe le joueur (fiche C1 du lot 1). Un objet ou un fait exigé que rien ne donne, un drapeau jamais posé,
 * une quête sautable, un lieu sans retour, une condition impossible, un texte mort, un fait détenu hors du canon. `pnpm monde verifier` les range à
 * part (rubrique « Défauts de jeu ») et un monde publié qui en a n'est pas prêt, sauf défaut accepté dans `revue.json`. Tout le reste (richesse,
 * longueurs, renvois, services…) est un conseil d'écriture : il ne bloque jamais.
 */
export const DEFAUTS_DE_JEU: ReadonlySet<string> = new Set([
  'objet.introuvable',
  'fait.introuvable',
  'flag.lu-jamais-pose',
  'quete.sautable',
  'lieu.sans-retour',
  'condition.impossible',
  'texte.variante-morte',
  'revue.fait-non-autorise',
]);
export const estDefautDeJeu = (code: string): boolean => DEFAUTS_DE_JEU.has(code);

/** Ce qui distingue deux défauts de même code dans la même entité (l'objet, le fait ou le drapeau cité) : il entre dans la clé de revue. */
function motDuMessage(code: string, message: string): string | undefined {
  if (code === 'objet.introuvable' || code === 'fait.introuvable' || code === 'flag.lu-jamais-pose') return /(?:l'objet|le fait|le drapeau) « ([^»]+) »/.exec(message)?.[1];
  if (code === 'condition.impossible') return /\((.{1,80})/.exec(message)?.[1];
  return undefined;
}

/** Range une phrase du validateur en diagnostic, sans toucher à son texte. */
export function diagnosticDeMessage(message: string, gravite: Gravite, source: Diagnostic['source'] = 'validation'): Diagnostic {
  const entite = entiteDuMessage(message);
  const code = codeDuMessage(message, gravite);
  const mot = motDuMessage(code, message);
  return { code, gravite, message, ...(entite ? { entite } : {}), source, ...(mot ? { donnees: { mot } } : {}) };
}

/** Les phrases d'un module (`valider` : erreurs, `conseils` : avis) en diagnostics `module.<id>`. */
export function diagnosticsDeModule(idModule: string, messages: string[], gravite: Gravite): Diagnostic[] {
  return messages.map((m) => {
    const entite = entiteDuMessage(m);
    return { code: `module.${idModule}`, gravite, message: m, ...(entite ? { entite } : {}), source: `module:${idModule}` as const };
  });
}

/** Le texte du CLI pour un diagnostic : avec le préfixe `[module]` ou `[énigmes]` quand il vient de là. */
export function versTexte(d: Diagnostic): string {
  if (d.source.startsWith('module:')) return `[${d.source.slice('module:'.length)}] ${d.message}`;
  if (d.source === 'enigmes') return `[énigmes] ${d.message}`;
  return d.message;
}
