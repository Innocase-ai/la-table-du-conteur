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
  source: 'validation' | `module:${string}` | 'enigmes' | 'references' | 'controles';
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
  if (/est exigé mais ne se trouve nulle part/.test(message)) return 'objet.introuvable';
  if (/est exigé mais n'est révélé nulle part/.test(message)) return 'fait.introuvable';
  if (/rien ne la propose ni ne l'active/.test(message)) return 'quete.jamais-proposee';
  if (/^Fait clé/.test(message)) return 'fait.cle-source-unique';
  const debut = /^(Richesse|Rythme|Tension|Enjeu|PX|Butin|Choix|Pertes|Réactivité|Repos|Passages|Dialogues|Accroches) ?:/.exec(message);
  if (debut) return `conseil.${debut[1]!.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}`;
  return gravite === 'erreur' ? 'validation.erreur' : 'validation.autre';
}

/** Range une phrase du validateur en diagnostic, sans toucher à son texte. */
export function diagnosticDeMessage(message: string, gravite: Gravite, source: Diagnostic['source'] = 'validation'): Diagnostic {
  const entite = entiteDuMessage(message);
  return { code: codeDuMessage(message, gravite), gravite, message, ...(entite ? { entite } : {}), source };
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
