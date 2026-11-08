// Les graphes d'un monde, comme données pures (nœuds et arêtes) : la mise en page et le dessin sont dans l'atelier.
// Quatre vues : la carte des lieux (liens, verrous, sens uniques), les dépendances d'une fin (ce qu'il faut pour l'atteindre),
// les drapeaux (qui les pose, qui les lit) et les étapes d'une quête.
import type { RefEntite } from './diagnostics';
import { cleRef, type IndexReferences } from './references';
import type { DonneesMonde } from './schemas';

/** `externe` : un lieu hors de la vue, rappelé parce qu'un lien y mène. `orphelin` : rien ne le produit. */
export type EtatNoeud = 'ok' | 'orphelin' | 'inaccessible' | 'externe';
export type MarqueArete = 'verrou' | 'sens-unique' | 'cache' | 'condition' | 'heures';

export interface NoeudGraphe {
  id: string;
  genre: string;
  libelle: string;
  etat?: EtatNoeud;
  /** L'entité du monde que ce nœud représente (pour ouvrir sa fiche). */
  entite?: RefEntite;
  /** Importance (faits : 1 à 3) : sert à l'épaisseur du nœud. */
  poids?: number;
  /** Pour un nœud de référence (« fait:f-x ») : ce qu'il désigne, pour lister qui le produit et qui le lit. */
  ref?: { genre: string; id: string };
}

export interface AreteGraphe {
  de: string;
  vers: string;
  genre: string;
  marques?: MarqueArete[];
}

export interface Graphe {
  noeuds: NoeudGraphe[];
  aretes: AreteGraphe[];
  /** La vue a été coupée (trop de nœuds) : l'afficher à l'utilisateur. */
  tronque?: boolean;
}

// ---------------------------------------------------------------------------
// Lieux
// ---------------------------------------------------------------------------

/** Les lieux qu'on peut atteindre depuis le départ (les conditions sont supposées satisfiables, comme dans le validateur). */
export function lieuxAtteints(dm: DonneesMonde): Set<string> {
  const voisins = new Map<string, Set<string>>();
  const relier = (a: string, b: string) => (voisins.get(a) ?? voisins.set(a, new Set()).get(a)!).add(b);
  for (const l of dm.lieux.values()) {
    if (l.parent) (relier(l.id, l.parent), relier(l.parent, l.id));
    for (const k of l.liens) {
      if (k.absent && !dm.lieux.has(k.vers)) continue;
      relier(l.id, k.vers);
      if (k.sens === 'double') relier(k.vers, l.id);
    }
  }
  const atteints = new Set([dm.monde.depart.lieu]);
  const file = [dm.monde.depart.lieu];
  while (file.length) for (const v of voisins.get(file.shift()!) ?? []) if (!atteints.has(v) && dm.lieux.has(v)) (atteints.add(v), file.push(v));
  return atteints;
}

/** Les lieux qui en contiennent d'autres (régions, villes, donjons…), du plus fourni au moins fourni, avec leur nombre de descendants. */
export function lieuxParents(dm: DonneesMonde): { id: string; nom: string; descendants: number }[] {
  const enfants = new Map<string, string[]>();
  for (const l of dm.lieux.values()) if (l.parent) (enfants.get(l.parent) ?? enfants.set(l.parent, []).get(l.parent)!).push(l.id);
  const compte = (id: string, vus = new Set<string>()): number => {
    let n = 0;
    for (const e of enfants.get(id) ?? []) if (!vus.has(e)) (vus.add(e), (n += 1 + compte(e, vus)));
    return n;
  };
  return [...enfants.keys()]
    .filter((id) => dm.lieux.has(id))
    .map((id) => ({ id, nom: dm.lieux.get(id)!.nom, descendants: compte(id) }))
    .sort((a, b) => b.descendants - a.descendants || a.nom.localeCompare(b.nom));
}

/** La carte des lieux : tout le monde, ou un lieu et ses descendants (avec les lieux voisins en `externe`). */
export function grapheLieux(dm: DonneesMonde, racine?: string): Graphe {
  const enfants = new Map<string, string[]>();
  for (const l of dm.lieux.values()) if (l.parent) (enfants.get(l.parent) ?? enfants.set(l.parent, []).get(l.parent)!).push(l.id);
  const dedans = new Set<string>();
  if (racine && dm.lieux.has(racine)) {
    const pile = [racine];
    while (pile.length) {
      const id = pile.pop()!;
      if (dedans.has(id)) continue;
      dedans.add(id);
      pile.push(...(enfants.get(id) ?? []));
    }
  } else for (const id of dm.lieux.keys()) dedans.add(id);

  const atteints = lieuxAtteints(dm);
  const noeuds = new Map<string, NoeudGraphe>();
  const noeud = (id: string, externe: boolean) => {
    if (noeuds.has(id)) return;
    const l = dm.lieux.get(id);
    noeuds.set(id, { id, genre: l?.type ?? 'lieu', libelle: l?.nom ?? id, etat: externe ? 'externe' : atteints.has(id) ? 'ok' : 'inaccessible', entite: { type: 'lieux', id } });
  };
  for (const id of dedans) noeud(id, false);

  const aretes = new Map<string, AreteGraphe>();
  const arete = (de: string, vers: string, genre: string, marques: MarqueArete[] = []) => {
    if (!dm.lieux.has(de) || !dm.lieux.has(vers) || de === vers) return;
    if (!dedans.has(de) && !dedans.has(vers)) return;
    noeud(de, !dedans.has(de));
    noeud(vers, !dedans.has(vers));
    // Un passage à double sens déclaré des deux côtés ne se dessine qu'une fois.
    const double = genre === 'lien' && !marques.includes('sens-unique');
    const cle = double ? `double|${[de, vers].sort().join('|')}` : `${genre}|${de}|${vers}`;
    const existante = aretes.get(cle);
    if (existante) existante.marques = [...new Set([...(existante.marques ?? []), ...marques])];
    else aretes.set(cle, { de, vers, genre, marques });
  };
  for (const l of dm.lieux.values()) {
    for (const k of l.liens) {
      if (k.absent && !dm.lieux.has(k.vers)) continue;
      const marques: MarqueArete[] = [];
      if (k.sens === 'simple') marques.push('sens-unique');
      if (k.verrou) marques.push('verrou');
      if (k.cache) marques.push('cache');
      if (k.condition) marques.push('condition');
      if (k.heures > 0) marques.push('heures');
      arete(l.id, k.vers, 'lien', marques);
    }
  }
  // Le lien parent / enfant : tracé seulement quand aucun passage n'existe déjà entre les deux.
  for (const l of dm.lieux.values()) {
    if (!l.parent) continue;
    const direct = [...aretes.values()].some((a) => a.genre === 'lien' && ((a.de === l.parent && a.vers === l.id) || (a.de === l.id && a.vers === l.parent)));
    if (!direct) arete(l.parent, l.id, 'parent');
  }
  return { noeuds: [...noeuds.values()], aretes: [...aretes.values()] };
}

// ---------------------------------------------------------------------------
// Dépendances : ce qu'il faut pour atteindre une fin
// ---------------------------------------------------------------------------

const cleEntite = (e: RefEntite) => `${e.type}:${e.id}`;

/** Pour chaque entité, les références qu'elle exige (conditions, clés de verrou). */
function consommeParEntite(idx: IndexReferences): Map<string, string[]> {
  const res = new Map<string, string[]>();
  for (const [ref, sites] of idx.consomme) for (const s of sites) {
    const k = cleEntite(s.entite);
    const l = res.get(k) ?? res.set(k, []).get(k)!;
    if (!l.includes(ref)) l.push(ref);
  }
  return res;
}

function noeudRef(dm: DonneesMonde, idx: IndexReferences, cle: string): NoeudGraphe {
  const i = cle.indexOf(':');
  const genre = cle.slice(0, i);
  const id = cle.slice(i + 1);
  const produit = (idx.produit.get(cle)?.length ?? 0) > 0;
  // Seuls un drapeau, un fait ou un objet propre au monde peuvent « n'être produits par rien » : le reste a d'autres sources.
  const doitEtreProduit = genre === 'flag' || genre === 'fait' || (genre === 'objet' && dm.objets.has(id));
  return { id: cle, genre, libelle: id, etat: doitEtreProduit && !produit ? 'orphelin' : 'ok', ref: { genre, id }, ...(genre === 'fait' && dm.faits.get(id) ? { poids: dm.faits.get(id)!.importance } : {}) };
}

/**
 * Ce qu'il faut pour atteindre une fin : la fin exige des références (faits, drapeaux, objets, quêtes…), chaque référence est
 * produite par des entités (événement, PNJ, quête…), qui exigent elles-mêmes d'autres références. `profondeur` limite le nombre
 * de niveaux d'entités ; `max` coupe la vue au-delà d'un nombre de nœuds.
 */
export function grapheDependancesFin(dm: DonneesMonde, idx: IndexReferences, finId: string, opts: { profondeur?: number; max?: number } = {}): Graphe {
  const profondeur = opts.profondeur ?? 3;
  const max = opts.max ?? 90;
  const exige = consommeParEntite(idx);
  const noeuds = new Map<string, NoeudGraphe>();
  const aretes: AreteGraphe[] = [];
  const dejaArete = new Set<string>();
  const relier = (de: string, vers: string, genre: string) => {
    const k = `${de}>${vers}`;
    if (!dejaArete.has(k)) (dejaArete.add(k), aretes.push({ de, vers, genre }));
  };
  let tronque = false;
  const entite = (e: RefEntite): string => {
    const k = cleEntite(e);
    if (!noeuds.has(k)) noeuds.set(k, { id: k, genre: e.type, libelle: e.id, etat: 'ok', entite: e });
    return k;
  };
  const racine = entite({ type: 'fins', id: finId });
  const vus = new Set<string>();
  let courants: { cle: string; entite: string }[] = [{ cle: racine, entite: racine }];
  // La fin elle-même : ce qui la déclenche par un effet « fin ».
  const refs = (k: string) => exige.get(k) ?? [];
  for (let niveau = 0; niveau <= profondeur && courants.length; niveau++) {
    const suivants: { cle: string; entite: string }[] = [];
    for (const { cle } of courants) {
      if (vus.has(cle)) continue;
      vus.add(cle);
      const sources = [...refs(cle), ...(cle === racine ? [cleRef('fin', finId)] : [])];
      for (const ref of sources) {
        if (noeuds.size >= max) {
          tronque = true;
          break;
        }
        const nr = noeuds.get(ref) ?? noeudRef(dm, idx, ref);
        noeuds.set(ref, nr);
        relier(cle, ref, ref.startsWith('fin:') ? 'declenche' : 'exige');
        for (const s of idx.produit.get(ref) ?? []) {
          if (noeuds.size >= max) {
            tronque = true;
            break;
          }
          const ek = entite(s.entite);
          relier(ref, ek, 'produit-par');
          if (niveau < profondeur) suivants.push({ cle: ek, entite: ek });
        }
      }
    }
    courants = suivants;
  }
  return { noeuds: [...noeuds.values()], aretes, ...(tronque ? { tronque } : {}) };
}

// ---------------------------------------------------------------------------
// Drapeaux
// ---------------------------------------------------------------------------

export interface StatutDrapeau {
  id: string;
  produit: number;
  consomme: number;
  /**
   * `lu-jamais-pose` : exigé mais que rien ne pose (il ne sera jamais vrai) ; `pose-jamais-lu` : posé mais que rien ne lit ;
   * `choix` : posé automatiquement par un dilemme (`choix-<dilemme>-<option>`), que rien ne lit : normal, ce n'est pas un défaut.
   */
  etat: 'ok' | 'lu-jamais-pose' | 'pose-jamais-lu' | 'choix';
}

/** Tous les drapeaux du monde, avec ceux qui posent problème en premier. */
export function statutDrapeaux(idx: IndexReferences): StatutDrapeau[] {
  const ids = new Set<string>();
  for (const k of [...idx.produit.keys(), ...idx.consomme.keys()]) if (k.startsWith('flag:')) ids.add(k.slice(5));
  const ordre = { 'lu-jamais-pose': 0, 'pose-jamais-lu': 1, ok: 2, choix: 3 };
  return [...ids]
    .map((id): StatutDrapeau => {
      const p = idx.produit.get(`flag:${id}`)?.length ?? 0;
      const c = idx.consomme.get(`flag:${id}`)?.length ?? 0;
      const seulementParDilemme = p > 0 && (idx.produit.get(`flag:${id}`) ?? []).every((s) => s.entite.type === 'dilemmes' && s.role === 'structure');
      return { id, produit: p, consomme: c, etat: !p ? 'lu-jamais-pose' : !c ? (seulementParDilemme ? 'choix' : 'pose-jamais-lu') : 'ok' };
    })
    .sort((a, b) => ordre[a.etat] - ordre[b.etat] || a.id.localeCompare(b.id));
}

/** Une référence (drapeau, fait, objet…) au centre, ce qui la produit à gauche, ce qui la lit à droite. */
export function grapheAutour(dm: DonneesMonde, idx: IndexReferences, genre: string, id: string): Graphe {
  const cle = cleRef(genre, id);
  const noeuds = new Map<string, NoeudGraphe>([[cle, noeudRef(dm, idx, cle)]]);
  const aretes: AreteGraphe[] = [];
  const dejaArete = new Set<string>();
  const ajouter = (e: RefEntite, sens: 'produit' | 'lit') => {
    const k = cleEntite(e);
    if (!noeuds.has(k)) noeuds.set(k, { id: k, genre: e.type, libelle: e.id, etat: 'ok', entite: e });
    const [de, vers] = sens === 'produit' ? [k, cle] : [cle, k];
    if (!dejaArete.has(`${de}>${vers}`)) (dejaArete.add(`${de}>${vers}`), aretes.push({ de, vers, genre: sens === 'produit' ? 'produit' : 'lu-par' }));
  };
  for (const s of idx.produit.get(cle) ?? []) ajouter(s.entite, 'produit');
  for (const s of idx.consomme.get(cle) ?? []) ajouter(s.entite, 'lit');
  return { noeuds: [...noeuds.values()], aretes };
}

// ---------------------------------------------------------------------------
// Quêtes
// ---------------------------------------------------------------------------

/** Les étapes d'une quête et leurs suites ; l'étape de départ a le genre `etape-debut`, les étapes finales `etape-finale`. */
export function grapheQuete(dm: DonneesMonde, queteId: string): Graphe {
  const q = dm.quetes.get(queteId);
  if (!q) return { noeuds: [], aretes: [] };
  const atteintes = new Set<string>();
  const pile = [q.debut];
  while (pile.length) {
    const id = pile.pop()!;
    if (atteintes.has(id)) continue;
    atteintes.add(id);
    pile.push(...(q.etapes.find((e) => e.id === id)?.suivantes ?? []));
  }
  return {
    noeuds: q.etapes.map((e) => ({
      id: e.id,
      genre: e.id === q.debut ? 'etape-debut' : e.suivantes.length === 0 ? 'etape-finale' : 'etape',
      libelle: e.id,
      etat: atteintes.has(e.id) ? 'ok' : 'inaccessible',
      entite: { type: 'quetes', id: q.id },
    })),
    aretes: q.etapes.flatMap((e) => e.suivantes.map((s) => ({ de: e.id, vers: s, genre: 'suite' }))),
  };
}
