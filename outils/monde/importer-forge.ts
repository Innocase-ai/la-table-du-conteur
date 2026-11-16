// Import d'une conception de la Forge d'Histoires (RPGMakerStory/index.html, fichier `.forge.json`) en brouillon de monde :
// `pnpm monde importer-forge <fichier.forge.json> <id-monde>` (voir docs/FORGE.md).
//
// La Forge sert à CONCEVOIR (lieux imbriqués, PNJ, contenants, objets, quêtes reliées) ; ce convertisseur en tire un squelette
// qui respecte les schémas du monde (`packages/regles/src/monde/schemas.ts`). Principes :
//   - additif : on ne crée qu'un NOUVEAU monde en brouillon, jamais d'écrasement, aucun impact sur le moteur ;
//   - rien d'inventé qui ressemble à du contenu : tout champ obligatoire que la Forge ne connaît pas reçoit un texte « À écrire : … » ;
//   - tout ce qui est deviné (profil de monstre, difficulté, étapes de quête) est listé dans RAPPORT-FORGE.md pour être relu.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { creerSquelette, type Modeles } from './nouveau';

// ---------------------------------------------------------------------------
// Le format de la Forge
// ---------------------------------------------------------------------------

export const CATEGORIES: Record<string, 'lieu' | 'pnj' | 'contenant' | 'objet' | 'quete'> = {
  village: 'lieu', maison: 'lieu', taverne: 'lieu', sanctuaire: 'lieu', foret: 'lieu', grotte: 'lieu', ruines: 'lieu', lieu_quete: 'lieu',
  queteur: 'pnj', notable: 'pnj', marchand: 'pnj', pretre: 'pnj', allie: 'pnj', adversaire: 'pnj', monstre: 'pnj',
  coffre: 'contenant', armoire: 'contenant', cercueil: 'contenant', sac: 'contenant',
  objet_divers: 'objet', objet_quete: 'objet', arme: 'objet', potion: 'objet', bourse_or: 'objet',
  quete_principale: 'quete', quete_annexe: 'quete',
};

const ActifForge = z.object({
  id: z.string(),
  ref: z.string().optional(),
  type: z.string(),
  nom: z.string().default(''),
  parent: z.string().nullable().optional(),
  props: z.record(z.unknown()).default({}),
});
const LienForge = z.object({ id: z.string().optional(), from: z.string(), to: z.string(), type: z.string() });

export const FichierForge = z.object({
  version: z.literal(1),
  monde: z.object({ nom: z.string().default(''), desc: z.string().default('') }).default({}),
  histoire: z.object({
    titre: z.string().default(''),
    intro: z.string().default(''),
    /** Niveaux du groupe (fiche de l'histoire) ; ignorés s'ils sont invalides. */
    niveaux: z.object({ min: z.number().int().min(1).max(20), max: z.number().int().min(1).max(20) }).refine((n) => n.min <= n.max).optional().catch(undefined),
    assets: z.array(ActifForge),
    liens: z.array(LienForge).default([]),
  }),
});
export type FichierForge = z.infer<typeof FichierForge>;

/** Une conception inutilisable (et non une panne du disque) : l'atelier répond 400. */
export class ErreurForge extends Error {}

export interface OptionsImport {
  /** Niveaux du groupe pour l'épisode (1 à 2 par défaut : l'épisode pilote du PRD-SAGA). */
  niveaux?: { min: number; max: number };
  /** Temps de trajet, en heures, des chemins entre lieux (1 par défaut). */
  heures?: number;
  /** Identifiants des profils de monstres du SRD (pour choisir celui d'un adversaire). */
  profils: string[];
  /** Identifiants des armes du SRD (pour la `base` d'une arme). */
  armes?: string[];
}

export interface ResultatImport {
  /** Fiches par dossier du monde : `lieux`, `pnj`, `objets`, `tresors`, `rencontres`, `quetes`, `evenements`, `fins`. */
  dossiers: Record<string, unknown[]>;
  /** Le contenu de `monde.json` (partiel : complété par `ecrireMondeForge`). */
  monde: Record<string, unknown>;
  /** Ce qui a été deviné, écarté ou laissé à écrire. */
  avertissements: string[];
  /** Référence de la Forge (L1, P3…) → identifiant du monde. */
  table: { ref: string; type: string; nom: string; id: string | null }[];
  /** Nombre de champs « À écrire » laissés dans les fiches. */
  aEcrire: number;
}

// ---------------------------------------------------------------------------
// Petits outils
// ---------------------------------------------------------------------------

const sansAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
export const slug = (s: string): string => sansAccents(s.toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/ß/g, 'ss')).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'sans-nom';
const texte = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const EC = 'À écrire';

/** Première phrase d'un texte (pour un résumé), limitée à 160 caractères. */
function premierePhrase(t: string): string {
  const m = /^.*?[.!?…](?=\s|$)/s.exec(t);
  const p = (m ? m[0] : t).trim();
  return p.length > 160 ? `${p.slice(0, 157).trimEnd()}…` : p;
}

/** Valeur en pièces d'or d'un texte comme « 8 po », « 15 pa », « 3 pc » (0 si aucun nombre). */
export function valeurEnPo(t: string): number {
  const m = /(\d+(?:[.,]\d+)?)\s*(po|pa|pc|pièces? d['’]or|pièces? d['’]argent|pièces? de cuivre)?/i.exec(t);
  if (!m) return 0;
  const n = Number((m[1] ?? '0').replace(',', '.'));
  const u = sansAccents((m[2] ?? 'po').toLowerCase());
  if (u === 'pa' || u.includes('argent')) return n / 10;
  if (u === 'pc' || u.includes('cuivre')) return n / 100;
  return n;
}

/** Les pièces d'une bourse (« 12 po ») : `{po: 12}`, `{pa: 5}`… ou undefined. */
function piecesDeBourse(t: string): { po?: number; pa?: number; pc?: number } | undefined {
  const m = /(\d+)\s*(po|pa|pc|pièces? d['’]or|pièces? d['’]argent|pièces? de cuivre)?/i.exec(t);
  if (!m) return undefined;
  const n = Number(m[1]);
  if (!n) return undefined;
  const u = sansAccents((m[2] ?? 'po').toLowerCase());
  return u === 'pa' || u.includes('argent') ? { pa: n } : u === 'pc' || u.includes('cuivre') ? { pc: n } : { po: n };
}

function difficulte(danger: string): 'faible' | 'moderee' | 'elevee' {
  const d = sansAccents(danger.toLowerCase());
  if (/facile|faible|simple|leger|mineur/.test(d)) return 'faible';
  if (/difficile|eleve|mortel|dangereux|redoutable|boss|fort|puissant|dur/.test(d)) return 'elevee';
  return 'moderee';
}

/** Le profil de monstre du SRD dont l'identifiant est un mot (ou une suite de mots) du nom, le plus long d'abord ; sinon `null`. */
function profilParNom(nom: string, profils: string[]): string | null {
  const s = `-${slug(nom)}-`;
  return [...profils].sort((a, b) => b.length - a.length).find((p) => s.includes(`-${p}-`)) ?? null;
}

const PROFIL_PAR_DEFAUT: Record<'faible' | 'moderee' | 'elevee', string[]> = {
  faible: ['bandit', 'sbire-gobelin', 'combattant-gobelin'],
  moderee: ['goule', 'combattant-hobgobelin', 'loup'],
  elevee: ['capitaine-hobgobelin', 'ogre', 'goule'],
};

const CONTENANT_TRESOR: Record<string, string> = { coffre: 'coffre', armoire: 'autre', cercueil: 'sarcophage', sac: 'sac' };

/** Un DD saisi dans la Forge (nombre) ramené à l'échelle du moteur (5 à 30), ou `undefined` s'il est vide ou illisible. */
const dd = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? Math.min(30, Math.max(5, Math.round(v))) : undefined);
const RARETES_OBJET = ['commun', 'peu-commun', 'rare', 'tres-rare', 'legendaire'];
/** DD de la tentative de négociation, selon la difficulté de la rencontre. */
const DD_NEGOCIER = { faible: 12, moderee: 15, elevee: 18 } as const;

// ---------------------------------------------------------------------------
// La conversion
// ---------------------------------------------------------------------------

type Actif = z.infer<typeof ActifForge>;

export function convertirForge(brut: unknown, id: string, options: OptionsImport): ResultatImport {
  const lu = FichierForge.safeParse(brut);
  if (!lu.success) {
    const i = lu.error.issues[0];
    throw new ErreurForge(`Conception illisible : ${i?.path.join('.') || 'racine'} — ${i?.message}`);
  }
  const forge = lu.data;
  const niveaux = options.niveaux ?? forge.histoire.niveaux ?? { min: 1, max: 2 };
  const heures = options.heures ?? 1;
  const avert: string[] = [];
  const A = forge.histoire.assets;
  const L = forge.histoire.liens;

  const cat = (a: Actif) => CATEGORIES[a.type];
  for (const a of A) if (!cat(a)) avert.push(`Asset inconnu ignoré : « ${a.nom} » (type ${a.type}).`);
  const connus = A.filter((a) => cat(a));
  const parId = new Map(connus.map((a) => [a.id, a]));
  const parent = (a: Actif) => (a.parent ? parId.get(a.parent) : undefined);
  const enfants = (a: Actif) => connus.filter((x) => x.parent === a.id);
  const nom = (a: Actif) => a.nom.trim() || `Sans nom (${a.ref ?? a.id})`;
  const ref = (a: Actif) => a.ref ?? a.id;
  const sortants = (a: Actif, type: string) => L.filter((l) => l.from === a.id && l.type === type).map((l) => parId.get(l.to)).filter((x): x is Actif => !!x);
  const entrants = (a: Actif, type: string) => L.filter((l) => l.to === a.id && l.type === type).map((l) => parId.get(l.from)).filter((x): x is Actif => !!x);

  // --- Identifiants : un slug du nom, unique dans tout le monde. ---
  const pris = new Set<string>([id]);
  const ids = new Map<string, string>();
  const unique = (base: string): string => {
    let c = base;
    for (let n = 2; pris.has(c); n++) c = `${base}-${n}`;
    pris.add(c);
    return c;
  };
  for (const a of connus) if (cat(a) !== 'pnj' || (a.type !== 'adversaire' && a.type !== 'monstre')) ids.set(a.id, unique(slug(nom(a))));
  // Un adversaire devient une rencontre : son identifiant ne se confond pas avec celui d'un PNJ.
  for (const a of connus) if (a.type === 'adversaire' || a.type === 'monstre') ids.set(a.id, unique(`r-${slug(nom(a))}`));
  const idDe = (a: Actif): string => ids.get(a.id)!;

  const lieux: Record<string, unknown>[] = [];
  const pnjs: Record<string, unknown>[] = [];
  const objets: Record<string, unknown>[] = [];
  const tresors: Record<string, unknown>[] = [];
  const pieges: Record<string, unknown>[] = [];
  const rencontres: Record<string, unknown>[] = [];
  const quetes: Record<string, unknown>[] = [];
  const evenements: Record<string, unknown>[] = [];
  const fins: Record<string, unknown>[] = [];

  const lieuxForge = connus.filter((a) => cat(a) === 'lieu');
  const estLieu = (a: Actif | undefined): a is Actif => !!a && cat(a) === 'lieu';
  /** Le lieu qui contient l'asset (lui-même s'il en est un). */
  const lieuDe = (a: Actif): Actif | undefined => {
    let c: Actif | undefined = a;
    for (let i = 0; c && i < 20; i++, c = parent(c)) if (estLieu(c)) return c;
    return undefined;
  };

  if (!lieuxForge.length) throw new ErreurForge('La conception ne contient aucun lieu : rien à convertir.');
  const racine = lieuxForge.filter((l) => !l.parent || !estLieu(parent(l)));

  // --- Lieux ---
  const rencontresDuLieu = new Map<string, { id: string }[]>();
  const servicesDuLieu = new Map<string, string[]>();
  const chemins = new Map<string, { vers: string; type: 'chemin'; heures: number; sens: 'double' }[]>();
  const vus = new Set<string>();
  for (const l of L.filter((x) => x.type === 'mene_a')) {
    const de = parId.get(l.from);
    const vers = parId.get(l.to);
    if (!estLieu(de) || !estLieu(vers)) continue;
    const cle = [de.id, vers.id].sort().join('|');
    if (vus.has(cle)) continue;
    vus.add(cle);
    const liste = chemins.get(de.id) ?? [];
    liste.push({ vers: idDe(vers), type: 'chemin', heures, sens: 'double' });
    chemins.set(de.id, liste);
  }
  // Rencontres rattachées à un lieu : par `garde` (lieu) ou, à défaut, le lieu où se tient l'adversaire.
  const gardienDeContenant = new Map<string, string>();
  for (const a of connus.filter((x) => x.type === 'adversaire' || x.type === 'monstre')) {
    const cibles = sortants(a, 'garde');
    const contenant = cibles.find((c) => cat(c) === 'contenant');
    // Le gardien d'un contenant garde sans combattre : c'est la rencontre du LIEU (à l'entrée) qui le fait paraître, comme dans les mondes écrits.
    if (contenant) gardienDeContenant.set(contenant.id, idDe(a));
    const lieuCible = cibles.find((c) => estLieu(c)) ?? (contenant ? lieuDe(contenant) : undefined) ?? lieuDe(a);
    if (!lieuCible) {
      avert.push(`« ${nom(a)} » (${ref(a)}) n'est dans aucun lieu : sa rencontre ne se déclenchera pas. Placez-le dans un lieu.`);
      continue;
    }
    const liste = rencontresDuLieu.get(lieuCible.id) ?? [];
    liste.push({ id: idDe(a) });
    rencontresDuLieu.set(lieuCible.id, liste);
  }
  for (const a of connus.filter((x) => x.type === 'taverne')) servicesDuLieu.set(a.id, ['auberge', 'repas']);
  for (const a of connus.filter((x) => x.type === 'sanctuaire')) servicesDuLieu.set(a.id, ['soins']);

  const racineId = id;
  for (const a of lieuxForge) {
    const p = parent(a);
    const dansBatiment = estLieu(p) && ['maison', 'taverne', 'sanctuaire', 'grotte', 'ruines'].includes(p.type);
    const type = dansBatiment
      ? 'salle'
      : ({ village: 'village', maison: 'batiment', taverne: 'batiment', sanctuaire: 'batiment', foret: 'lieu-dit', grotte: 'grotte', ruines: 'ruine', lieu_quete: 'lieu-dit' } as Record<string, string>)[a.type]!;
    const desc = texte(a.props['desc']);
    const lieu: Record<string, unknown> = {
      id: idDe(a),
      nom: nom(a),
      type,
      parent: estLieu(p) ? idDe(p) : racineId,
      resume: desc ? premierePhrase(desc) : `${EC} : résumé de ${nom(a)}.`,
      description: desc || `${EC} : ce qu'on trouve à ${nom(a)} (factuel, pour le MJ).`,
      visuel: `${EC} : ce qu'on voit de ${nom(a)}, sans nommer de personnage.`,
      liens: chemins.get(a.id) ?? [],
      rencontres: (rencontresDuLieu.get(a.id) ?? []).map((r) => ({ id: r.id, declencheur: 'entree', unique: true })),
      services: servicesDuLieu.get(a.id) ?? [],
      repos: a.type === 'taverne' ? 'sur' : 'dangereux',
    };
    lieux.push(lieu);
  }
  // Les chemins sont posés sur le lieu d'où ils partent, mais Forge les relie parfois à un lieu interne : rien à faire de plus.

  // --- Objets ---
  const objetsForge = connus.filter((a) => cat(a) === 'objet' && a.type !== 'bourse_or');
  for (const o of objetsForge) {
    const desc = texte(o.props['desc']);
    let categorie = ({ arme: 'arme', potion: 'potion', objet_quete: 'quete', objet_divers: 'divers' } as Record<string, string>)[o.type]!;
    // Une arme du monde doit citer l'arme du SRD sur laquelle elle repose (`base`) : on la cherche dans le nom, sinon l'objet reste « divers » en attendant.
    const base = o.type === 'arme' ? profilParNom(nom(o), options.armes ?? []) : null;
    if (o.type === 'arme' && !base) {
      categorie = 'divers';
      avert.push(`Arme « ${nom(o)} » (${ref(o)}) : aucune arme du SRD reconnue dans le nom ; l'objet est « divers ». Choisir l'arme de base (champ « base », catégorie « arme »), ou la remplacer par un objet du catalogue.`);
    }
    objets.push({
      id: idDe(o),
      nom: nom(o),
      categorie,
      ...(base ? { base } : {}),
      rarete: RARETES_OBJET.includes(texte(o.props['rarete'])) ? texte(o.props['rarete']) : 'commun',
      valeurPo: valeurEnPo(texte(o.props['valeur'])),
      resume: desc || `${EC} : ce que le joueur lit en inspectant ${nom(o)}.`,
    });
  }
  for (const o of objetsForge.filter((x) => x.props['unique'] === true)) avert.push(`Objet unique « ${nom(o)} » (${ref(o)}) : le monde n'a pas de marque « unique » ; il reste fixe, à garder pour la quête principale ou le boss (1 à 3 par épisode).`);
  const vendu = new Set(L.filter((l) => l.type === 'vend').map((l) => l.to));
  const recompense = new Set(L.filter((l) => l.type === 'donne_obj').map((l) => l.to));
  const requis = new Set(L.filter((l) => l.type === 'requiert').map((l) => l.to));

  // --- Trésors : les contenants, puis un « sol » par lieu pour les objets posés sur place ---
  const piecesDe = (kids: Actif[]) => {
    const total: { po?: number; pa?: number; pc?: number } = {};
    for (const k of kids.filter((x) => x.type === 'bourse_or')) {
      const p = piecesDeBourse(texte(k.props['valeur']) || nom(k));
      if (!p) avert.push(`Bourse « ${nom(k)} » (${ref(k)}) : aucun montant lisible (écrivez-le dans Valeur, ex. « 12 po »).`);
      if (p) for (const u of ['po', 'pa', 'pc'] as const) if (p[u]) total[u] = (total[u] ?? 0) + p[u]!;
    }
    return Object.keys(total).length ? total : undefined;
  };
  const placees = new Set<string>();
  for (const c of connus.filter((a) => cat(a) === 'contenant')) {
    const p = parent(c);
    if (!estLieu(p)) {
      avert.push(`Contenant « ${nom(c)} » (${ref(c)}) hors d'un lieu : ignoré. Glissez-le dans un lieu.`);
      continue;
    }
    const kids = enfants(c).filter((k) => cat(k) === 'objet');
    kids.forEach((k) => placees.add(k.id));
    const pieces = piecesDe(kids);
    // Les obstacles saisis dans la Forge : verrou, cache, piège (une fiche de piège est créée, DD par défaut 13 signalé).
    const pr = c.props;
    const acces: Record<string, unknown> = {};
    const dVerrou = dd(pr['verrou']);
    const dCache = dd(pr['cache']);
    if (dVerrou) acces['verrou'] = { dd: dVerrou };
    if (dCache) acces['cache'] = { dd: dCache, competence: 'perception' };
    if (pr['piege'] === true) {
      const pid = unique(`piege-${slug(nom(c))}`);
      const det = dd(pr['piegeDetection']);
      const des = dd(pr['piegeDesarmement']);
      const m = /^(\d+d\d+(?:[+-]\d+)?)\s*(.*)$/.exec(texte(pr['piegeDegats']));
      if (!det || !des) avert.push(`Piège de « ${nom(c)} » (${ref(c)}) : DD ${!det ? 'de détection' : ''}${!det && !des ? ' et ' : ''}${!des ? 'de désarmement' : ''} non saisi${!det && !des ? 's' : ''} : 13 par défaut, À CHOISIR.`);
      if (!m) avert.push(`Piège de « ${nom(c)} » (${ref(c)}) : ${texte(pr['piegeDegats']) ? `dégâts « ${texte(pr['piegeDegats'])} » illisibles (attendu : « 2d6 poison »)` : 'aucun dégât saisi'} ; effets du piège à écrire.`);
      pieges.push({
        id: pid,
        nom: `Piège : ${nom(c)}`,
        lieu: idDe(p),
        resume: `${EC} : ce qu'est le piège de ${nom(c)} (pour le MJ).`,
        detection: { dd: det ?? 13, competence: 'perception' },
        desarmement: { dd: des ?? 13, competence: 'escamotage' },
        declenchement: `${EC} : ce qui se passe quand le piège se déclenche.`,
        degats: m ? [{ des: m[1], type: (m[2] ?? '').trim() || 'contondant' }] : [],
        etats: [],
        effets: [],
        reinitialisation: false,
        passage: false,
      });
      acces['piege'] = pid;
    }
    const t: Record<string, unknown> = {
      id: idDe(c),
      nom: nom(c),
      lieu: idDe(p),
      contenant: CONTENANT_TRESOR[c.type]!,
      description: texte(c.props['desc']) || `${EC} : ce qu'on voit du ${nom(c).toLowerCase()} avant de l'ouvrir.`,
      contenu: { ...(pieces ? { pieces } : {}), objets: kids.filter((k) => k.type !== 'bourse_or').map((k) => ({ objet: idDe(k), quantite: 1 })), tables: [] },
      acces,
      ...(gardienDeContenant.has(c.id) ? { gardien: gardienDeContenant.get(c.id) } : {}),
    };
    if (!kids.length) avert.push(`Contenant « ${nom(c)} » (${ref(c)}) vide.`);
    tresors.push(t);
  }
  for (const l of lieuxForge) {
    const sur = enfants(l).filter((k) => cat(k) === 'objet' && !vendu.has(k.id));
    if (!sur.length) continue;
    sur.forEach((k) => placees.add(k.id));
    const pieces = piecesDe(sur);
    tresors.push({
      id: unique(`sol-${slug(nom(l))}`),
      nom: `Sur place à ${nom(l)}`,
      lieu: idDe(l),
      contenant: 'sol',
      description: `${EC} : ce qui traîne ici et que l'œil attrape.`,
      contenu: { ...(pieces ? { pieces } : {}), objets: sur.filter((k) => k.type !== 'bourse_or').map((k) => ({ objet: idDe(k), quantite: 1 })), tables: [] },
      acces: {},
    });
  }
  for (const o of objetsForge) {
    if (placees.has(o.id) || vendu.has(o.id) || recompense.has(o.id)) continue;
    avert.push(`Objet « ${nom(o)} » (${ref(o)}) ${requis.has(o.id) ? 'requis par une quête mais ' : ''}sans emplacement (ni lieu, ni contenant, ni marchand, ni récompense)${requis.has(o.id) ? " : la quête ne peut pas être menée à bien" : ''}.`);
  }

  // --- Rencontres (adversaires et monstres) ---
  for (const a of connus.filter((x) => x.type === 'adversaire' || x.type === 'monstre')) {
    const danger = texte(a.props['danger']);
    const d = difficulte(danger);
    // Le profil saisi dans la Forge d'abord ; à défaut, un mot du nom ; à défaut, un profil par défaut À CHOISIR.
    const saisi = slug(texte(a.props['profil']));
    if (texte(a.props['profil']) && !options.profils.includes(saisi)) avert.push(`Rencontre « ${nom(a)} » (${ref(a)}) : le profil « ${texte(a.props['profil'])} » n'existe pas dans le SRD.`);
    let profil = options.profils.includes(saisi) ? saisi : profilParNom(nom(a), options.profils);
    let devine = '';
    if (!profil) {
      profil = PROFIL_PAR_DEFAUT[d].find((p) => options.profils.includes(p)) ?? options.profils[0] ?? 'bandit';
      devine = ` — profil « ${profil} » mis par défaut, À CHOISIR`;
    }
    const ou = lieuDe(a) ?? sortants(a, 'garde').find((c) => estLieu(c));
    rencontres.push({
      id: idDe(a),
      nom: nom(a),
      type: 'combat',
      ...(ou ? { lieu: idDe(ou) } : {}),
      difficulte: d,
      intro: texte(a.props['role']) || `${EC} : mise en scène de la rencontre avec ${nom(a)}.`,
      monstres: [{ profil, nombre: 1, nom: nom(a) }],
      // Un adversaire humanoïde peut parler : une porte de sortie à écrire (PRD-SAGA F3) ; un monstre n'a que le combat.
      alternatives: a.type === 'adversaire' ? [{ id: 'negocier', nom: 'Négocier', jet: { competence: 'persuasion', dd: DD_NEGOCIER[d] }, resume: `${EC} : comment ${nom(a)} se laisse convaincre de renoncer.`, effets: [], echecResout: false }] : [],
      butin: {},
      effetsVictoire: [],
    });
    avert.push(`Rencontre « ${nom(a)} » (${ref(a)}) : difficulté ${d}${danger ? ` (lue dans « ${danger} »)` : ' (par défaut)'}${devine}.${a.type === 'adversaire' ? ` Adversaire humanoïde : une alternative « Négocier » (Persuasion DD ${DD_NEGOCIER[d]}) est prête, texte et effets à écrire.` : ''}`);
  }

  // --- PNJ et quêtes ---
  const pnjForge = connus.filter((a) => cat(a) === 'pnj' && a.type !== 'adversaire' && a.type !== 'monstre');
  const queteForge = connus.filter((a) => cat(a) === 'quete');
  const sujetsDeQuete = new Map<string, Record<string, unknown>[]>();
  const donneur = new Map<string, Actif>();
  for (const q of queteForge) {
    const donneurs = entrants(q, 'donne');
    const pnjDonneur = donneurs.find((g) => cat(g) === 'pnj' && g.type !== 'adversaire' && g.type !== 'monstre');
    const lieuDonneur = donneurs.find((g) => estLieu(g)) ?? (estLieu(parent(q)) ? parent(q) : undefined);
    if (pnjDonneur) donneur.set(q.id, pnjDonneur);
    else if (lieuDonneur) {
      // Une quête donnée par un lieu : un événement à l'entrée la propose.
      evenements.push({ id: unique(`ev-${slug(nom(q))}`), declencheur: 'entree-lieu', lieu: idDe(lieuDonneur), unique: true, narration: `${EC} : ce qui se passe quand le groupe entre à ${nom(lieuDonneur)} et que « ${nom(q)} » s'offre à lui.`, effets: [{ quete: { id: idDe(q), statut: 'active' } }] });
      avert.push(`Quête « ${nom(q)} » (${ref(q)}) donnée par un lieu : un événement d'entrée la propose (texte à écrire).`);
    } else avert.push(`Quête « ${nom(q)} » (${ref(q)}) : aucun donneur (PNJ ou lieu) : elle ne démarrera pas.`);
  }
  for (const p of pnjForge) {
    const lignes = Array.isArray(p.props['dialogue']) ? (p.props['dialogue'] as unknown[]).map(texte).filter(Boolean) : [];
    const lieuP = lieuDe(p);
    if (!lieuP) {
      avert.push(`PNJ « ${nom(p)} » (${ref(p)}) hors d'un lieu : ignoré. Glissez-le dans un lieu.`);
      ids.delete(p.id);
      continue;
    }
    const sujets: Record<string, unknown>[] = [];
    const sesQuetes = queteForge.filter((q) => donneur.get(q.id)?.id === p.id);
    const reste = lignes.slice(1);
    sesQuetes.forEach((q, i) => {
      sujets.push({
        id: `q-${slug(nom(q))}`.slice(0, 60),
        mots: [nom(q).toLowerCase(), 'quête'],
        question: `Parler de « ${nom(q)} »`,
        reponse: sesQuetes.length === 1 && reste.length ? reste.join(' ') : `${EC} : ce que ${nom(p)} demande au groupe (${nom(q)}).`,
        effets: [{ quete: { id: idDe(q), statut: 'active' } }],
        unique: true,
      });
      if (i === 0 && sesQuetes.length === 1 && reste.length) reste.length = 0;
    });
    reste.forEach((r, i) => sujets.push({ id: `${idDe(p)}-r${i + 1}`.slice(0, 60), mots: ['à définir'], reponse: r, effets: [], unique: false }));
    const pnj: Record<string, unknown> = {
      id: idDe(p),
      nom: nom(p),
      espece: 'humain',
      sexe: 'N',
      role: texte(p.props['role']) || nom(p),
      lieu: idDe(lieuP),
      apparence: `${EC} : le portrait et la tenue de ${nom(p)}.`,
      personnalite: { traits: ['à définir', 'à définir'], voix: 'à définir', desir: `${EC} : ce que ${nom(p)} veut.` },
      salutations: { neutre: lignes[0] ?? `${EC} : la salutation de ${nom(p)}.` },
      sujets,
    };
    if (p.type === 'marchand') {
      const stock = sortants(p, 'vend').filter((o) => ids.has(o.id) && cat(o) === 'objet');
      pnj['boutique'] = { stock: stock.map((o) => ({ objet: idDe(o), quantite: 1, ...(valeurEnPo(texte(o.props['valeur'])) > 0 ? { prix: valeurEnPo(texte(o.props['valeur'])) } : {}) })), tables: [], rachat: 0.5, types: [] };
      if (!stock.length) avert.push(`Marchand « ${nom(p)} » (${ref(p)}) sans marchandise (lien « vend »).`);
    }
    if (p.type === 'pretre') {
      pnj['services'] = [{ id: 'soins', nom: 'Soins', resume: texte(p.props['soins']) || `${EC} : les soins proposés.`, prix: 0, effets: [] }];
      avert.push(`Prêtre « ${nom(p)} » (${ref(p)}) : le service de soins n'a pas d'effet de jeu (effets à écrire).`);
    }
    pnjs.push(pnj);
  }

  // --- Quêtes : étapes tirées des liens (se déroule à, se termine à, requiert) ---
  for (const q of queteForge) {
    const qid = idDe(q);
    const etapes: Record<string, unknown>[] = [];
    const nomsEtape = new Set<string>();
    const idEtape = (base: string) => {
      let c = base;
      for (let n = 2; nomsEtape.has(c); n++) c = `${base}-${n}`;
      nomsEtape.add(c);
      return c;
    };
    const dejaVisites = new Set<string>();
    const aller = (l: Actif) => {
      if (dejaVisites.has(l.id)) return;
      dejaVisites.add(l.id);
      etapes.push({ id: idEtape(`aller-${slug(nom(l))}`), texte: `Rendez-vous à ${nom(l)}.`, completion: { lieu: idDe(l) }, lieu: idDe(l) });
    };
    sortants(q, 'deroule').filter(estLieu).forEach(aller);
    const arrivee = sortants(q, 'termine').find(estLieu);
    if (arrivee) aller(arrivee);
    const cibles = sortants(q, 'requiert');
    const adversaires = connus.filter((x) => x.type === 'adversaire' || x.type === 'monstre');
    // Vaincre un adversaire humanoïde peut aussi se faire en négociant : l'étape s'accomplit par la victoire ou par l'alternative.
    const issuesDe = (c: Actif) => ({ ou: [{ rencontre: { id: idDe(c), issue: 'victoire' } }, { rencontre: { id: idDe(c), issue: 'alternative' } }] });
    const vaincre = (c: Actif) => {
      const ou = lieuDe(c);
      etapes.push({
        id: idEtape(`vaincre-${slug(nom(c))}`),
        texte: `Vainquez ${nom(c)}.`,
        completion: c.type === 'adversaire' ? issuesDe(c) : { rencontre: { id: idDe(c), issue: 'victoire' } },
        ...(ou ? { lieu: idDe(ou) } : {}),
      });
    };
    const vaincus = new Set<string>();
    const poserSujet = (pnj: Actif | undefined, sujet: Record<string, unknown>, pourquoi: string) => {
      const fiche = pnj ? pnjs.find((x) => x['id'] === idDe(pnj)) : undefined;
      if (!fiche) return avert.push(`Quête « ${nom(q)} » (${ref(q)}) : ${pourquoi} n'est pas dans un lieu ; la scène à jouer avec lui est à écrire.`);
      (fiche['sujets'] as Record<string, unknown>[]).push(sujet);
    };
    const verbeChoisi = texte(q.props['verbe']);
    const verbe = ['tuer', 'trouver', 'apporter', 'liberer'].includes(verbeChoisi) ? verbeChoisi : cibles.some((c) => adversaires.includes(c)) ? 'tuer' : cibles.some((c) => cat(c) === 'objet') ? 'trouver' : '';
    const captif = verbe === 'liberer' ? parId.get(texte(q.props['captif'])) : undefined;
    const destinataire = verbe === 'apporter' ? parId.get(texte(q.props['destinataire'])) : undefined;
    if (verbe === 'liberer' && !captif) avert.push(`Quête « ${nom(q)} » (${ref(q)}) « libérer » sans captif choisi : étapes à écrire.`);
    if (verbe === 'apporter' && !destinataire) avert.push(`Quête « ${nom(q)} » (${ref(q)}) « apporter » sans destinataire choisi : traitée comme « trouver ».`);
    if (verbe === 'tuer' && !cibles.some((c) => adversaires.includes(c))) avert.push(`Quête « ${nom(q)} » (${ref(q)}) « tuer » sans cible liée (« requiert » un adversaire ou un monstre).`);
    // Libérer : aller où le captif est retenu, vaincre ceux qui le gardent, puis le délivrer (un sujet du captif pose le drapeau).
    const lieuCaptif = captif ? lieuDe(captif) : undefined;
    const gardiensDuCaptif = lieuCaptif ? adversaires.filter((x) => lieuDe(x)?.id === lieuCaptif.id || sortants(x, 'garde').some((g) => g.id === lieuCaptif.id)) : [];
    if (lieuCaptif) aller(lieuCaptif);
    for (const c of [...cibles.filter((x) => adversaires.includes(x)), ...gardiensDuCaptif]) {
      if (vaincus.has(c.id)) continue;
      vaincus.add(c.id);
      vaincre(c);
    }
    for (const c of cibles.filter((x) => cat(x) === 'objet')) {
      const ou = lieuDe(c);
      etapes.push({ id: idEtape(`trouver-${slug(nom(c))}`), texte: `Trouvez ${nom(c)}.`, completion: { objet: idDe(c) }, ...(ou ? { lieu: idDe(ou) } : {}) });
    }
    if (captif && lieuCaptif) {
      etapes.push({ id: idEtape(`liberer-${slug(nom(captif))}`), texte: `Libérez ${nom(captif)}.`, completion: { flag: `${qid}-libere` }, lieu: idDe(lieuCaptif) });
      poserSujet(captif, {
        id: `delivrer-${slug(nom(q))}`.slice(0, 60),
        mots: ['libérer', 'délivrer', 'détacher'],
        question: `Délivrer ${nom(captif)}`,
        ...(gardiensDuCaptif.length ? { condition: gardiensDuCaptif.length === 1 ? (gardiensDuCaptif[0]!.type === 'adversaire' ? issuesDe(gardiensDuCaptif[0]!) : { rencontre: { id: idDe(gardiensDuCaptif[0]!), issue: 'victoire' } }) : { et: gardiensDuCaptif.map((g) => (g.type === 'adversaire' ? issuesDe(g) : { rencontre: { id: idDe(g), issue: 'victoire' } })) } } : {}),
        reponse: `${EC} : ce que dit ${nom(captif)} quand on le délivre.`,
        effets: [{ flag: `${qid}-libere` }],
        unique: true,
      }, `${nom(captif)} (le captif)`);
    }
    // Apporter : l'objet est trouvé (étape ci-dessus), puis remis au destinataire (un sujet du destinataire retire l'objet et pose le drapeau).
    const objetsApportes = cibles.filter((x) => cat(x) === 'objet');
    if (destinataire && objetsApportes.length) {
      const lieuD = lieuDe(destinataire);
      etapes.push({ id: idEtape(`apporter-${slug(nom(destinataire))}`), texte: `Apportez ${objetsApportes.map(nom).join(', ')} à ${nom(destinataire)}.`, completion: { flag: `${qid}-livre` }, ...(lieuD ? { lieu: idDe(lieuD) } : {}) });
      poserSujet(destinataire, {
        id: `livraison-${slug(nom(q))}`.slice(0, 60),
        mots: ['livrer', 'apporter', ...objetsApportes.map((o) => nom(o).toLowerCase())],
        question: `Remettre ${objetsApportes.map(nom).join(', ')}`,
        condition: objetsApportes.length === 1 ? { objet: idDe(objetsApportes[0]!) } : { et: objetsApportes.map((o) => ({ objet: idDe(o) })) },
        reponse: `${EC} : la réaction de ${nom(destinataire)} quand on lui remet l'objet.`,
        effets: [...objetsApportes.map((o) => ({ objet: { id: idDe(o), retirer: true } })), { flag: `${qid}-livre` }],
        unique: true,
      }, `${nom(destinataire)} (le destinataire)`);
    }
    if (!etapes.length) {
      etapes.push({ id: 'objectif', texte: `${EC} : l'objectif de « ${nom(q)} ».`, completion: { flag: `${qid}-objectif` } });
      avert.push(`Quête « ${nom(q)} » (${ref(q)}) sans lieu ni cible : une seule étape à écrire, impossible à terminer tant qu'elle n'est pas écrite.`);
    }
    // Le retour au donneur (convention des mondes écrits) : une dernière étape, accomplie par un sujet du PNJ qui pose un drapeau.
    const donneurQ = donneur.get(q.id);
    // Quand le destinataire est le donneur, la remise de l'objet est déjà le retour.
    if (donneurQ && ids.has(donneurQ.id) && !(destinataire && destinataire.id === donneurQ.id && objetsApportes.length)) {
      const avantRetour = (etapes[etapes.length - 1] as { id: string }).id;
      const lieuRetour = lieuDe(donneurQ);
      etapes.push({ id: idEtape('retour'), texte: `Retournez voir ${nom(donneurQ)}.`, completion: { flag: `${qid}-rendue` }, ...(lieuRetour ? { lieu: idDe(lieuRetour) } : {}) });
      const pnjDonneur = pnjs.find((x) => x['id'] === idDe(donneurQ));
      (pnjDonneur?.['sujets'] as Record<string, unknown>[] | undefined)?.push({
        id: `rendre-${slug(nom(q))}`.slice(0, 60),
        mots: ['rendre', nom(q).toLowerCase()],
        question: `Rendre compte de « ${nom(q)} »`,
        condition: { etape: { quete: qid, etape: avantRetour } },
        reponse: `${EC} : la réponse de ${nom(donneurQ)} quand le groupe revient (${nom(q)}).`,
        effets: [{ flag: `${qid}-rendue` }],
        unique: true,
      });
    }
    etapes.forEach((e, i) => {
      e['suivantes'] = i < etapes.length - 1 ? [(etapes[i + 1] as { id: string }).id] : [];
      if (i === etapes.length - 1) e['termine'] = true;
    });
    const rec = texte(q.props['recompense']);
    const xp = Number(/(\d+)/.exec(texte(q.props['xp']))?.[1] ?? 0);
    const po = Number(/(\d+)\s*(?:po|pièces? d['’]or)/i.exec(rec)?.[1] ?? 0);
    const g = donneur.get(q.id);
    const lieuQ = (g && lieuDe(g)) ?? lieuDe(q) ?? entrants(q, 'donne').find(estLieu);
    quetes.push({
      id: qid,
      nom: nom(q),
      type: q.type === 'quete_principale' ? 'principale' : 'secondaire',
      ...(g && ids.has(g.id) ? { donneur: idDe(g) } : {}),
      ...(lieuQ ? { lieu: idDe(lieuQ) } : {}),
      resume: texte(q.props['texte']) || `${EC} : le journal de quête, côté joueur.`,
      niveau: niveaux,
      debut: (etapes[0] as { id: string }).id,
      etapes,
      recompenses: { xp, pieces: po, objets: sortants(q, 'donne_obj').filter((o) => cat(o) === 'objet' && o.type !== 'bourse_or').map(idDe), effets: [], ...(rec ? { annonce: rec } : {}) },
    });
    if (!xp) avert.push(`Quête « ${nom(q)} » (${ref(q)}) sans PX (champ XP de la Forge).`);
  }
  const principales = queteForge.filter((q) => q.type === 'quete_principale');
  if (principales.length !== 1) avert.push(`${principales.length} quête(s) principale(s) : il en faut une seule${principales.length ? ' (la première sert pour la fin)' : ''}.`);
  const nbQ = queteForge.length;
  if (nbQ < 3 || nbQ > 8) avert.push(`${nbQ} quête(s) : le cap du 15/11/2026 en veut 3 à 8 (docs/PRD-SAGA.md, F3).`);
  const premiere = principales[0];
  if (premiere) {
    fins.push({
      id: `fin-${idDe(premiere)}`,
      nom: forge.histoire.titre ? `Fin de « ${forge.histoire.titre} »` : 'Fin',
      condition: { quete: { id: idDe(premiere), statut: 'terminee' } },
      epilogue: `${EC} : l'épilogue, une fois « ${nom(premiere)} » terminée.`,
      variantes: [],
      consequences: [],
    });
  }

  // --- Le lieu racine (région) qui réunit tous les lieux de plus haut niveau ---
  const descMonde = forge.monde.desc.trim();
  lieux.unshift({
    id: racineId,
    nom: forge.histoire.titre.trim() || forge.monde.nom.trim() || id,
    type: 'region',
    resume: descMonde ? premierePhrase(descMonde) : `${EC} : le cadre de l'histoire en une phrase.`,
    description: descMonde || `${EC} : la région où se joue l'histoire.`,
    visuel: `${EC} : la région vue de loin.`,
    liens: [],
    rencontres: [],
    services: [],
    repos: 'dangereux',
  });
  const village = racine.find((l) => l.type === 'village') ?? racine[0]!;

  // --- Le monde ---
  const titre = forge.histoire.titre.trim() || forge.monde.nom.trim() || id;
  const intro = forge.histoire.intro.trim();
  const monde: Record<string, unknown> = {
    nom: titre,
    resume: intro ? premierePhrase(intro) : `${EC} : le décor, la situation, le conflit central (2 à 3 phrases).`,
    accroche: intro ? premierePhrase(intro) : `${EC} : la phrase qui donne envie de jouer.`,
    niveaux,
    depart: { lieu: idDe(village), intro: intro || `${EC} : l'arrivée du groupe, en quelques phrases concrètes.` },
    chapitres: [{ id: 'ch1', nom: titre, niveaux, resume: intro ? premierePhrase(intro) : `${EC}.`, lieux: [racineId], quetes: quetes.map((q) => q['id'] as string) }],
  };

  const dossiers: Record<string, unknown[]> = { lieux, pnj: pnjs, objets, tresors, pieges, rencontres, quetes, evenements, fins };

  // --- Compte des « À écrire » et table de correspondance ---
  const aEcrire = (JSON.stringify([monde, dossiers]).match(/À écrire/g) ?? []).length;
  const table = connus.map((a) => ({ ref: ref(a), type: a.type, nom: nom(a), id: ids.get(a.id) ?? null }));
  return { dossiers, monde, avertissements: avert, table, aEcrire };
}

// ---------------------------------------------------------------------------
// Écriture du monde
// ---------------------------------------------------------------------------

export function rapportMarkdown(id: string, r: ResultatImport, source: string): string {
  const n = (d: string) => r.dossiers[d]?.length ?? 0;
  const l = [
    `# Import de la Forge : ${id}`,
    '',
    `Brouillon produit depuis \`${source}\` (copie : \`conception.forge.json\`). **Ne rien relancer par-dessus** : le monde existe, on le complète à la main ou avec les agents d'écriture.`,
    '',
    `- ${n('lieux')} lieux (dont la région racine), ${n('pnj')} PNJ, ${n('objets')} objets, ${n('tresors')} trésors, ${n('rencontres')} rencontres, ${n('quetes')} quêtes, ${n('evenements')} événements, ${n('fins')} fin(s).`,
    `- **${r.aEcrire} champ(s) « À écrire »** à remplir avant toute publication (cherchez « À écrire » dans les fichiers du monde).`,
    '',
    '## Ce qui est deviné ou à relire',
    '',
    ...(r.avertissements.length ? r.avertissements.map((a) => `- ${a}`) : ['- rien']),
    '',
    '## Ce que la Forge ne sait pas dire (à ajouter à la main)',
    '',
    '- Espèce, sexe, apparence, personnalité des PNJ (mis à « humain », « N », « à définir »).',
    '- Indices visibles de richesse d\'un contenant, effets du piège (sauvegarde, états), clé d\'un verrou, énigmes et conversation comme façon de conclure une quête.',
    '- Récit d\'arrivée (`arrivee`), accroche et visuel des lieux ; images, voix, scènes.',
    '- Alternatives de négociation, jauge, factions, dilemmes, fins multiples ; le texte de la réponse du donneur au retour.',
    '- Les objets de la Forge sont créés dans le monde ; à remplacer par ceux du catalogue SRD quand ils existent (armes, potions…).',
    '',
    '## Correspondance Forge → monde',
    '',
    '| Réf. Forge | Type | Nom | Identifiant |',
    '|---|---|---|---|',
    ...r.table.map((t) => `| ${t.ref} | ${t.type} | ${t.nom} | ${t.id ? `\`${t.id}\`` : '— (écarté)'} |`),
    '',
  ];
  return l.join('\n');
}

// ---------------------------------------------------------------------------
// Le brief d'écriture : tout ce qu'il faut à Claude (et à ses agents d'écriture) pour remplir les « À écrire »
// ---------------------------------------------------------------------------

/** Les règles d'écriture du projet. Les nombres sont les mêmes que dans la consigne de l'Export IA de la Forge (un test les compare). */
export const REGLES_ECRITURE = [
  'Deuxième personne du pluriel, présent, phrases courtes. Un détail sensoriel concret par texte et un détail inattendu. Pas de lore déguisé en dialogue. Finir sur une question ou un coût.',
  'Longueurs : récit d\'arrivée d\'un lieu 130 à 170 mots ; accroche d\'une pièce vue du dehors 1 à 2 phrases ; réponse d\'un PNJ 75 à 115 mots ; mise en scène d\'une rencontre 70 à 110 mots ; journal de quête 2 à 3 phrases ; objet ou contenant 1 à 2 phrases.',
  'Interdits dans les textes lus par le joueur : mot de mécanique (DD, jet, jauge, points de vie, niveau), secret, contenu caché. Accents français corrects.',
  'Chaque PNJ veut quelque chose (du groupe aussi), craint quelque chose, cache quelque chose, a une voix (un tic, un rythme).',
];

export interface ChampAEcrire {
  dossier: string;
  /** Le fichier du monde qui contient la fiche. */
  fichier: string;
  id: string;
  nom: string;
  /** Le chemin du champ dans la fiche (`sujets[1].reponse`). */
  champ: string;
  /** Le texte provisoire (« À écrire : … »). */
  consigne: string;
}

/** Tous les champs « À écrire » des fiches produites, avec la fiche et le chemin du champ. */
export function inventaireAEcrire(dossiers: Record<string, unknown[]>, monde: Record<string, unknown>): ChampAEcrire[] {
  const res: ChampAEcrire[] = [];
  const parcourir = (valeur: unknown, chemin: string, base: Omit<ChampAEcrire, 'champ' | 'consigne'>) => {
    if (typeof valeur === 'string') {
      // « À écrire : … » partout ; « à définir » est le provisoire du squelette (ton, palette) : à remplacer aussi.
      if (valeur.startsWith(EC) || valeur === 'à définir') res.push({ ...base, champ: chemin, consigne: valeur });
    } else if (Array.isArray(valeur)) valeur.forEach((v, i) => parcourir(v, `${chemin}[${i}]`, base));
    else if (valeur && typeof valeur === 'object') for (const [k, v] of Object.entries(valeur)) parcourir(v, chemin ? `${chemin}.${k}` : k, base);
  };
  parcourir(monde, '', { dossier: '.', fichier: 'monde.json', id: String(monde['nom'] ?? ''), nom: String(monde['nom'] ?? '') });
  for (const [d, fiches] of Object.entries(dossiers)) {
    for (const f of fiches as Record<string, unknown>[]) parcourir(f, '', { dossier: d, fichier: `${d}/forge-${d}.json`, id: String(f['id'] ?? ''), nom: String(f['nom'] ?? '') });
  }
  return res;
}

/** Le brief d'écriture (`BRIEF-ECRITURE.md`) : le contexte, les règles, la méthode et l'inventaire des champs à écrire. */
export function briefEcriture(id: string, r: ResultatImport, mondeFinal: Record<string, unknown> = r.monde): string {
  // `mondeFinal` : le monde.json tel qu'écrit, qui a en plus la direction artistique et le ton du squelette, à remplir.
  const champs = inventaireAEcrire(r.dossiers, mondeFinal);
  const parDossier = new Map<string, ChampAEcrire[]>();
  for (const c of champs) parDossier.set(c.dossier, [...(parDossier.get(c.dossier) ?? []), c]);
  const niveaux = r.monde['niveaux'] as { min: number; max: number };
  const l: string[] = [
    `# Brief d'écriture : ${String(r.monde['nom'])}`,
    '',
    `Monde brouillon \`${id}\` créé depuis la Forge d'Histoires. Le plan est **validé par l'utilisateur** : lieux, PNJ, objets, contenants, obstacles, quêtes, récompenses, liens. **On n'y change rien** (ni lieu, ni PNJ, ni DD, ni récompense, ni quête) sans son accord. Il reste à écrire les textes marqués « À écrire » : ${champs.length} champ(s) dans ${new Set(champs.map((c) => `${c.dossier}/${c.id}`)).size} fiche(s).`,
    '',
    '## Contexte',
    '',
    `- Niveaux du groupe : ${niveaux.min} à ${niveaux.max}. Épisode court d'une saga (docs/PRD-SAGA.md) : lieu de départ dense, 3 à 8 quêtes dont une principale.`,
    `- Accroche : ${String(r.monde['accroche'])}`,
    '',
    '## À lire avant d\'écrire',
    '',
    `- \`packages/mondes/${id}/RAPPORT-FORGE.md\` : ce qui a été deviné, la table des références de la Forge (L1, P3…) vers les identifiants du monde.`,
    `- \`packages/mondes/${id}/conception.forge.json\` : la conception d'origine (descriptions et répliques saisies dans la Forge : à reprendre et réécrire, pas à jeter).`,
    `- Les fichiers du monde : \`monde.json\`, \`lieux/\`, \`pnj/\`, \`objets/\`, \`tresors/\`, \`pieges/\`, \`rencontres/\`, \`quetes/\`, \`evenements/\`, \`fins/\` (fichiers \`forge-*.json\`).`,
    '- `docs/ECRIRE-UNE-HISTOIRE.md`, `docs/FORGE.md`, `docs/MONDES.md` (format) ; skills `creer-monde`, `decrire-lieux`, `creer-personnages`, `creer-pieges-tresors`, `creer-rencontres`.',
    '',
    '## Règles d\'écriture',
    '',
    ...REGLES_ECRITURE.map((x) => `- ${x}`),
    '',
    '## Méthode (décisions du projet)',
    '',
    '1. **Les textes sont écrits par des agents Haiku** (un par groupe de fiches : lieux, PNJ, rencontres et quêtes, objets et contenants), chacun avec ces règles, les fiches concernées et leur voisinage (lieu, PNJ du lieu, quête liée). Claude relit et arbitre ; il ne réécrit pas à leur place.',
    '2. Chaque agent remplace **uniquement** les valeurs « À écrire : … » (le chemin du champ est donné ci-dessous) et ne touche à rien d\'autre.',
    '3. Avant de présenter quoi que ce soit : `pnpm monde valider ' + id + '`, puis le sous-agent `auditeur-coherence-histoire` (lecture seule) pour la cohérence, et vérifier soi-même ses anomalies.',
    '4. **L\'utilisateur valide chaque groupe de textes** (lieux, puis PNJ, puis quêtes…) avant qu\'on le considère comme gelé.',
    `5. À la fin : \`pnpm monde verifier ${id}\`, \`pnpm monde parcours ${id}\`, aucune occurrence de « À écrire » ne doit rester (\`grep -r "À écrire" packages/mondes/${id}\`), entrée dans \`docs/JOURNAL.md\`. Ne rien commiter sans l'accord de l'utilisateur ; images, voix et appels d'API : annoncer le coût d'abord.`,
    '',
    '## Points laissés à la main par la Forge',
    '',
    ...(r.avertissements.length ? r.avertissements.map((a) => `- ${a}`) : ['- aucun']),
    '- Espèce, sexe, apparence et personnalité des PNJ : valeurs provisoires (`humain`, `N`, `à définir`) à remplacer en même temps que leurs textes.',
    '- `ton` de `monde.json` : `à définir`, à écrire avec l\'utilisateur.',
    '',
    '## Inventaire des champs à écrire',
    '',
  ];
  for (const [d, cs] of parDossier) {
    l.push(`### ${d === '.' ? 'monde.json' : d} (${cs.length})`, '');
    let courant = '';
    for (const c of cs) {
      const cle = `${c.fichier}#${c.id}`;
      if (cle !== courant) {
        l.push(`- **${c.nom || c.id}** (\`${c.id}\`, ${c.fichier})`);
        courant = cle;
      }
      l.push(`  - \`${c.champ || '(racine)'}\` : ${c.consigne}`);
    }
    l.push('');
  }
  return l.join('\n');
}

/** Le message à coller dans la conversation avec Claude : une ligne, qui pointe vers le brief. */
export const messagePourClaude = (id: string): string =>
  `Écris les textes du monde « ${id} » (brouillon créé depuis la Forge, plan validé) : lis packages/mondes/${id}/BRIEF-ECRITURE.md et suis-le (agents Haiku, puis relecture, validation et ma validation à chaque groupe).`;

/** Crée le monde `id` (brouillon) dans `racineMondes` à partir d'une conception de la Forge ; renvoie le dossier, le résultat et le rapport. `source` : le nom du fichier d'origine (pour le rapport). */
export function ecrireMondeForge(racineMondes: string, id: string, source: string, brut: unknown, modeles: Modeles, options: OptionsImport): { dossier: string; resultat: ResultatImport; rapport: string } {
  // On convertit AVANT de créer quoi que ce soit : une conception inutilisable ne laisse pas de dossier à moitié rempli.
  const resultat = convertirForge(brut, id, options);
  const dossier = creerSquelette(racineMondes, id, String(resultat.monde['nom']), modeles);
  const monde = JSON.parse(readFileSync(join(dossier, 'monde.json'), 'utf8')) as Record<string, unknown>;
  const mondeFinal = { ...monde, ...resultat.monde, ton: ['à définir'] };
  writeFileSync(join(dossier, 'monde.json'), `${JSON.stringify(mondeFinal, null, 2)}\n`);
  for (const [d, fiches] of Object.entries(resultat.dossiers)) {
    if (fiches.length) writeFileSync(join(dossier, d, `forge-${d}.json`), `${JSON.stringify(fiches, null, 2)}\n`);
  }
  // La conception est gardée telle qu'elle a été reçue, à côté du monde (traçabilité : on peut la rouvrir dans la Forge).
  writeFileSync(join(dossier, 'conception.forge.json'), `${JSON.stringify(brut, null, 2)}\n`);
  const rapport = rapportMarkdown(id, resultat, source.replaceAll('\\', '/').split('/').pop() || 'la Forge');
  writeFileSync(join(dossier, 'RAPPORT-FORGE.md'), rapport);
  writeFileSync(join(dossier, 'BRIEF-ECRITURE.md'), `${briefEcriture(id, resultat, mondeFinal)}\n`);
  return { dossier, resultat, rapport };
}
