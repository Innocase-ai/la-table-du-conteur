// Assemblage d'un monde à partir de ses fichiers JSON déjà lus : commun au chargeur Node (outils, tests) et au
// navigateur (le client importe les fichiers avec Vite). Chaque entité est validée par son schéma.
import type { ZodType } from 'zod';
import { DOSSIERS_EXTENSIONS, schemaExtension } from './extensions';
import { champsDuSchema, schemaDuDossier } from './schemas-par-dossier';
import { Enigme, EvenementMonde, Faction, Fait, Fin, Jauge, Lieu, Monde, Objet, Piege, Pnj, Quete, RencontreMonde, TableButin, Tresor, type DonneesMonde } from './schemas';

export interface ErreurChargement {
  fichier: string;
  message: string;
}

export type ResultatChargement = { ok: true; monde: DonneesMonde } | { ok: false; erreurs: ErreurChargement[] };

/** Un fichier d'un monde : son chemin relatif au dossier du monde (`lieux/z1.json`) et son contenu JSON. */
export interface FichierMonde {
  chemin: string;
  contenu: unknown;
}

export const DOSSIERS_MONDE = ['lieux', 'pnj', 'objets', 'tresors', 'tables', 'rencontres', 'pieges', 'enigmes', 'quetes', 'factions', 'jauges', 'evenements', 'fins', 'faits'] as const;

function lire<T extends { id: string }>(fichiers: FichierMonde[], nom: string, schema: ZodType<T, any, any>, erreurs: ErreurChargement[]): Map<string, T> {
  const index = new Map<string, T>();
  const duDossier = fichiers.filter((f) => f.chemin.startsWith(`${nom}/`) && f.chemin.endsWith('.json')).sort((a, b) => a.chemin.localeCompare(b.chemin));
  for (const { chemin: fichier, contenu } of duDossier) {
    for (const [i, element] of (Array.isArray(contenu) ? contenu : [contenu]).entries()) {
      const r = schema.safeParse(element);
      if (!r.success) {
        const issue = r.error.issues[0];
        const id = (element as { id?: string })?.id ?? `#${i}`;
        erreurs.push({ fichier, message: `« ${id} » : ${issue?.path.join('.') || 'racine'} — ${issue?.message}` });
        continue;
      }
      if (index.has(r.data.id)) erreurs.push({ fichier, message: `identifiant en double : « ${r.data.id} »` });
      else index.set(r.data.id, r.data);
    }
  }
  return index;
}

/** Les dossiers de fichiers livrés avec le monde (images, voix et leurs fiches), qui ne sont pas des données de jeu. */
export const DOSSIERS_MEDIAS = ['images', 'voix'] as const;

/** Les dossiers que le format de base ne connaît pas (`scenes/`…) : laissés aux modules, sans validation ici. */
function extensions(fichiers: FichierMonde[]): Record<string, unknown[]> {
  const res: Record<string, unknown[]> = {};
  for (const f of [...fichiers].sort((a, b) => a.chemin.localeCompare(b.chemin))) {
    const dossier = f.chemin.split('/')[0]!;
    if (!f.chemin.includes('/') || (DOSSIERS_MONDE as readonly string[]).includes(dossier) || (DOSSIERS_MEDIAS as readonly string[]).includes(dossier)) continue;
    (res[dossier] ??= []).push(...(Array.isArray(f.contenu) ? f.contenu : [f.contenu]));
  }
  return res;
}

/** Assemble un monde : `monde.json` et les fichiers de ses sous-dossiers. */
export function assemblerMonde(mondeBrut: unknown, fichiers: FichierMonde[], erreursLecture: ErreurChargement[] = []): ResultatChargement {
  const m = Monde.safeParse(mondeBrut);
  if (!m.success) return { ok: false, erreurs: [{ fichier: 'monde.json', message: `${m.error.issues[0]?.path.join('.')} — ${m.error.issues[0]?.message}` }] };
  const erreurs = [...erreursLecture];
  const dm: DonneesMonde = {
    monde: m.data,
    lieux: lire(fichiers, 'lieux', Lieu, erreurs),
    pnj: lire(fichiers, 'pnj', Pnj, erreurs),
    objets: lire(fichiers, 'objets', Objet, erreurs),
    tresors: lire(fichiers, 'tresors', Tresor, erreurs),
    tables: lire(fichiers, 'tables', TableButin, erreurs),
    rencontres: lire(fichiers, 'rencontres', RencontreMonde, erreurs),
    pieges: lire(fichiers, 'pieges', Piege, erreurs),
    enigmes: lire(fichiers, 'enigmes', Enigme, erreurs),
    quetes: lire(fichiers, 'quetes', Quete, erreurs),
    factions: lire(fichiers, 'factions', Faction, erreurs),
    jauges: lire(fichiers, 'jauges', Jauge, erreurs),
    evenements: lire(fichiers, 'evenements', EvenementMonde, erreurs),
    fins: lire(fichiers, 'fins', Fin, erreurs),
    faits: lire(fichiers, 'faits', Fait, erreurs),
    extensions: extensions(fichiers),
  };
  if (erreurs.length) return { ok: false, erreurs };
  FICHIERS_BRUTS.set(dm, fichiers);
  return { ok: true, monde: dm };
}

// ---------------------------------------------------------------------------
// Ce que le chargement laisse passer sans rien dire, et que `problemesDeChargement` rattrape
// ---------------------------------------------------------------------------

/** Les fichiers bruts d'un monde assemblé, gardés pour pouvoir le contrôler plus tard (le calcul n'a lieu que si on le demande). */
const FICHIERS_BRUTS = new WeakMap<DonneesMonde, FichierMonde[]>();
const PROBLEMES = new WeakMap<DonneesMonde, ProblemesChargement>();

/**
 * Les problèmes qu'un monde assemblé cache :
 * - `erreurs` : une fiche d'un dossier d'extension (dilemmes, savoirs, scènes…) qui ne respecte pas son schéma. Le jeu l'écarte en
 *   silence : l'histoire se joue sans elle. Un monde publié ne doit en avoir aucune.
 * - `avis` : un dossier que le moteur ne connaît pas (`dilemme/` au lieu de `dilemmes/` : tout son contenu est ignoré) et les clés d'une
 *   fiche que le schéma ne connaît pas (`salutaions` : ignorées, donc sans effet).
 * Vide pour un monde qui n'a pas été produit par `assemblerMonde`.
 */
export interface ProblemesChargement {
  erreurs: string[];
  avis: string[];
}

/** Le début du message du validateur pour une fiche (« Dilemme « x » », comme `entiteDuMessage` le reconnaît). */
const LIBELLE_DOSSIER: Record<string, string> = {
  lieux: 'Lieu', pnj: 'PNJ', objets: 'Objet', tresors: 'Trésor', tables: 'Table', rencontres: 'Rencontre', pieges: 'Piège', enigmes: 'Énigme', quetes: 'Quête',
  factions: 'Faction', jauges: 'Jauge', evenements: 'Événement', fins: 'Fin', faits: 'Fait', dilemmes: 'Dilemme', 'evenements-choix': 'Événement à choix',
  examens: 'Examen', codex: 'Question', interjections: 'Interjection', savoirs: 'Savoir', scenes: 'Scène',
};

/** Distance d'édition entre deux mots (pour proposer « vouliez-vous dire »). */
function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0]![j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length]![b.length]!;
}

const proche = (mot: string, connus: readonly string[]): string | undefined =>
  connus.filter((c) => c !== mot && distance(mot.toLowerCase(), c.toLowerCase()) <= 2).sort((x, y) => distance(mot, x) - distance(mot, y))[0];

const estObjet = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);

/** Les clés présentes dans la fiche d'origine et absentes de la fiche lue par le schéma (donc ignorées), avec leur chemin. */
function clesIgnorees(brut: unknown, lu: unknown, chemin: string[] = []): string[][] {
  if (Array.isArray(brut) && Array.isArray(lu)) return brut.flatMap((b, i) => clesIgnorees(b, lu[i], [...chemin, String(i)]));
  if (!estObjet(brut) || !estObjet(lu)) return [];
  return Object.keys(brut).flatMap((k) => (k in lu ? clesIgnorees(brut[k], lu[k], [...chemin, k]) : [[...chemin, k]]));
}

export function problemesDeChargement(dm: DonneesMonde): ProblemesChargement {
  const memo = PROBLEMES.get(dm);
  if (memo) return memo;
  const res: ProblemesChargement = { erreurs: [], avis: [] };
  const fichiers = FICHIERS_BRUTS.get(dm);
  if (fichiers) {
    const dossiersBase = DOSSIERS_MONDE as readonly string[];
    const connus = new Set<string>([...DOSSIERS_MONDE, ...DOSSIERS_EXTENSIONS, ...DOSSIERS_MEDIAS]);
    const inconnus = new Map<string, string>();
    for (const f of [...fichiers].sort((a, b) => a.chemin.localeCompare(b.chemin))) {
      if (!f.chemin.includes('/')) continue;
      const dossier = f.chemin.split('/')[0]!;
      const base = dossiersBase.includes(dossier);
      const schema = base ? schemaDuDossier(dossier) : schemaExtension(dossier);
      if (!schema) {
        if (!connus.has(dossier) && !inconnus.has(dossier)) inconnus.set(dossier, f.chemin);
        continue;
      }
      const champs = champsDuSchema(dossier);
      for (const [i, brut] of (Array.isArray(f.contenu) ? f.contenu : [f.contenu]).entries()) {
        const b = brut as { id?: string; pnj?: string } | null;
        const nom = `${LIBELLE_DOSSIER[dossier] ?? dossier} « ${b?.id ?? b?.pnj ?? `#${i}`} » (${f.chemin})`;
        const r = schema.safeParse(brut);
        if (!r.success) {
          // Une fiche de base invalide a déjà fait échouer le chargement : seules les extensions passent ici sans bruit.
          if (!base) res.erreurs.push(`${nom} : ${r.error.issues[0]?.path.join('.') || 'racine'} — ${r.error.issues[0]?.message}`);
          continue;
        }
        const ignorees = clesIgnorees(brut, r.data);
        if (!ignorees.length) continue;
        const liste = ignorees.map((c) => {
          const sug = c.length === 1 ? proche(c[0]!, champs) : undefined;
          return `« ${c.join('.')} »${sug ? ` (vouliez-vous dire « ${sug} » ?)` : ''}`;
        });
        res.avis.push(`${nom} : ${liste.length > 1 ? 'clés inconnues ignorées' : 'clé inconnue ignorée'} : ${liste.join(', ')}.`);
      }
    }
    for (const [dossier, fichier] of inconnus) {
      const sug = proche(dossier, [...DOSSIERS_MONDE, ...DOSSIERS_EXTENSIONS]);
      res.avis.push(`Dossier « ${dossier} » inconnu du moteur (${fichier}) : son contenu est ignoré${sug ? ` — vouliez-vous dire « ${sug} » ?` : ''}.`);
    }
  }
  PROBLEMES.set(dm, res);
  return res;
}
