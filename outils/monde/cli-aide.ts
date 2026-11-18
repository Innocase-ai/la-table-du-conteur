// Les petites règles du CLI `pnpm monde`, hors de `cli.ts` pour qu'on puisse les tester : la liste des commandes, la lecture stricte des
// options (une valeur mal écrite est refusée, jamais ignorée en silence) et ce que dit `parcours` (audit du 18/11/2026, O1, O7, O8, O9).

export const COMMANDES = ['lister', 'valider', 'verifier', 'manque', 'parcours', 'enigmes', 'doc', 'estimer', 'nouveau', 'importer-forge', 'calibrer'] as const;

export const USAGE = `Usage : pnpm monde ${COMMANDES.join(' | ')} [monde]
  nouveau <id> "<Nom>" · importer-forge <fichier.forge.json> <id> [--niveaux 1-2] [--heures 1] · calibrer <temps-de-jeu.json>
  parcours et verifier : [--etats N] [--ms N] [--graines a,b] ; parcours : [--chemin] [--couvrir] [--frontiere N] ; verifier : [--sans-parcours]`;

export interface OptionsCli {
  etats?: number;
  frontiere?: number;
  ms?: number;
  graines?: number[];
  niveaux?: { min: number; max: number };
  heures?: number;
  chemin: boolean;
  sansParcours: boolean;
  couvrir: boolean;
}

const BOOLEENNES = new Set(['chemin', 'sans-parcours', 'couvrir']);
const AVEC_VALEUR = new Set(['etats', 'frontiere', 'ms', 'graines', 'niveaux', 'heures']);

/** Un nombre strictement positif écrit en entier ou en décimal (pas « abc », pas « 12x », pas « -5 »). */
function nombrePositif(nom: string, v: string | undefined): number {
  const n = v !== undefined && /^\d+(\.\d+)?$/.test(v) ? Number(v) : NaN;
  if (!(n > 0)) throw new Error(`L'option --${nom} attend un nombre positif (reçu : ${v === undefined ? 'rien' : `« ${v} »`}).`);
  return n;
}

/**
 * Lit les options de la ligne de commande (tout ce qui commence par `--`) et rend les arguments restants (commande, monde…).
 * Une valeur absente, non numérique, négative ou nulle, des niveaux qui ne sont pas « 1-2 » et une option inconnue lèvent une erreur.
 */
export function lireOptions(args: string[]): { options: OptionsCli; positionnels: string[] } {
  const options: OptionsCli = { chemin: false, sansParcours: false, couvrir: false };
  const positionnels: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (!a.startsWith('--')) {
      positionnels.push(a);
      continue;
    }
    const nom = a.slice(2);
    if (BOOLEENNES.has(nom)) {
      if (nom === 'chemin') options.chemin = true;
      else if (nom === 'couvrir') options.couvrir = true;
      else options.sansParcours = true;
      continue;
    }
    if (!AVEC_VALEUR.has(nom)) throw new Error(`Option inconnue « ${a} ».`);
    const suivante = args[i + 1];
    const v = suivante !== undefined && !suivante.startsWith('--') ? suivante : undefined;
    if (v !== undefined) i++;
    switch (nom) {
      case 'etats':
        options.etats = nombrePositif(nom, v);
        break;
      case 'frontiere':
        options.frontiere = nombrePositif(nom, v);
        break;
      case 'ms':
        options.ms = nombrePositif(nom, v);
        break;
      case 'heures':
        options.heures = nombrePositif(nom, v);
        break;
      case 'graines': {
        const g = (v ?? '').split(',');
        if (!v || g.some((x) => !/^\d+$/.test(x))) throw new Error(`L'option --graines attend des entiers séparés par des virgules (reçu : ${v === undefined ? 'rien' : `« ${v} »`}).`);
        options.graines = g.map(Number);
        break;
      }
      case 'niveaux': {
        const m = /^(\d+)-(\d+)$/.exec(v ?? '');
        if (!m || Number(m[1]) < 1 || Number(m[2]) < Number(m[1])) throw new Error(`L'option --niveaux attend « min-max », par exemple 1-2 (reçu : ${v === undefined ? 'rien' : `« ${v} »`}).`);
        options.niveaux = { min: Number(m[1]), max: Number(m[2]) };
        break;
      }
    }
  }
  return { options, positionnels };
}

/** Le conseil à donner quand un parcours s'arrête sans avoir atteint toutes les fins, selon la cause de l'arrêt (O7). */
export function conseilArret(arret: string): string | undefined {
  if (arret === 'temps') return 'temps épuisé : relancer avec --ms plus grand';
  if (arret === 'budget') return 'budget épuisé : relancer avec --etats plus grand';
  if (arret === 'epuise') return 'tous les états ont été explorés';
  return undefined;
}

export interface RapportParcoursLu {
  parcours: unknown[];
  finsNonAtteintes: string[];
  etats: number;
  arret: string;
}

/**
 * Ce que dit `pnpm monde parcours` : l'en-tête, une ligne par fin non atteinte, et l'échec éventuel. Un monde sans aucune fin n'est pas
 * « 0/0 fins atteintes » : c'est un avis, comme dans `verifier` (O9), sans échec.
 */
export function lignesParcours(id: string, nbFins: number, rap: RapportParcoursLu, secondes: number): { entete: string; manquantes: string[]; echec: boolean } {
  if (nbFins === 0) return { entete: `\n⚠️  ${id} — aucune fin définie : rien à prouver`, manquantes: [], echec: false };
  const manque = rap.finsNonAtteintes.length > 0;
  const conseil = conseilArret(rap.arret);
  return {
    entete: `\n${manque ? '⚠️ ' : '✅'} ${id} — ${rap.parcours.length}/${nbFins} fins atteintes (${rap.etats} états en ${secondes.toFixed(1)} s ; arrêt : ${rap.arret})`,
    manquantes: rap.finsNonAtteintes.map((f) => `  ❌ ${f} — non atteinte${conseil ? ` (${conseil}${rap.arret === 'epuise' ? '' : ' ; ce n’est pas une preuve d’impossibilité'})` : ''}`),
    echec: manque,
  };
}
