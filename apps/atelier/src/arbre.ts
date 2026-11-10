// La vue en arbre de l'atelier : les lieux rangés par parent, et sous chacun ce qui s'y trouve (PNJ, rencontres, trésors, pièges,
// énigmes, événements, quêtes, et les dossiers des modules qui ont un champ `lieu` : dilemmes, événements à choix, examens…).
// Fonctions pures, sans React, pour être testées sur les vrais mondes.
import type { DonneesMonde } from '@crpg/regles';

/** Une fiche rattachée à un lieu : son dossier (pour ouvrir la fiche), son identifiant, son nom et un détail (« le soir », « au repos »). */
export interface EntiteDuLieu {
  dossier: string;
  id: string;
  nom: string;
  detail?: string;
}

export interface NoeudLieu {
  id: string;
  nom: string;
  type: string;
  enfants: NoeudLieu[];
  entites: EntiteDuLieu[];
}

export interface ArbreDuMonde {
  racines: NoeudLieu[];
  /** Les fiches dont le `lieu` ne désigne aucun lieu du monde (le validateur les signale aussi). */
  egarees: (EntiteDuLieu & { lieu: string })[];
}

/** L'ordre d'affichage des dossiers sous un lieu. */
export const ORDRE_DOSSIERS = ['pnj', 'rencontres', 'tresors', 'pieges', 'enigmes', 'evenements', 'quetes', 'dilemmes', 'evenements-choix', 'examens'];

export const LIBELLES_DOSSIERS: Record<string, string> = {
  pnj: 'PNJ',
  rencontres: 'Rencontres',
  tresors: 'Trésors',
  pieges: 'Pièges',
  enigmes: 'Énigmes',
  evenements: 'Événements',
  quetes: 'Quêtes',
  dilemmes: 'Dilemmes',
  'evenements-choix': 'Événements à choix',
  examens: 'Examens',
};

const MOMENTS: Record<string, string> = { jour: 'le jour', soir: 'le soir', nuit: 'la nuit' };
const DECLENCHEURS: Record<string, string> = { entree: 'à l’entrée', exploration: 'en explorant', repos: 'au repos', aleatoire: 'aléatoire' };

const rang = (dossier: string) => {
  const i = ORDRE_DOSSIERS.indexOf(dossier);
  return i < 0 ? ORDRE_DOSSIERS.length : i;
};

/** Les lieux du monde en arbre (par `parent`), avec les fiches rattachées à chacun. Un parent inconnu ou un cycle fait du lieu une racine. */
export function arbreDuMonde(dm: DonneesMonde): ArbreDuMonde {
  const entites = new Map<string, EntiteDuLieu[]>();
  const egarees: ArbreDuMonde['egarees'] = [];
  const vus = new Set<string>();
  const rattacher = (lieu: string | undefined, e: EntiteDuLieu) => {
    if (!lieu) return;
    const cle = `${lieu}|${e.dossier}|${e.id}`;
    if (vus.has(cle)) return;
    vus.add(cle);
    if (!dm.lieux.has(lieu)) return void egarees.push({ ...e, lieu });
    const liste = entites.get(lieu) ?? [];
    liste.push(e);
    entites.set(lieu, liste);
  };

  for (const p of dm.pnj.values()) {
    rattacher(p.lieu, { dossier: 'pnj', id: p.id, nom: p.nom });
    for (const pr of p.presences) if (pr.lieu !== p.lieu) rattacher(pr.lieu, { dossier: 'pnj', id: p.id, nom: p.nom, detail: `présent ${MOMENTS[pr.moment] ?? pr.moment}` });
  }
  // Une rencontre se rattache par la liste du lieu (avec son déclencheur) ou, à défaut, par son propre champ `lieu`.
  for (const l of dm.lieux.values())
    for (const r of l.rencontres) rattacher(l.id, { dossier: 'rencontres', id: r.id, nom: dm.rencontres.get(r.id)?.nom ?? r.id, detail: DECLENCHEURS[r.declencheur] ?? r.declencheur });
  for (const r of dm.rencontres.values()) rattacher(r.lieu, { dossier: 'rencontres', id: r.id, nom: r.nom });
  for (const t of dm.tresors.values()) rattacher(t.lieu, { dossier: 'tresors', id: t.id, nom: t.nom });
  for (const p of dm.pieges.values()) rattacher(p.lieu, { dossier: 'pieges', id: p.id, nom: p.nom });
  for (const e of dm.enigmes.values()) rattacher(e.lieu, { dossier: 'enigmes', id: e.id, nom: e.nom });
  for (const l of dm.lieux.values()) for (const id of l.evenements) rattacher(l.id, { dossier: 'evenements', id, nom: id });
  for (const e of dm.evenements.values()) rattacher(e.lieu, { dossier: 'evenements', id: e.id, nom: e.id });
  for (const q of dm.quetes.values()) rattacher(q.lieu, { dossier: 'quetes', id: q.id, nom: q.nom, detail: q.type });
  // Les dossiers des modules : tout élément qui a un `id` et un `lieu`.
  for (const [dossier, liste] of Object.entries(dm.extensions ?? {})) {
    for (const brut of liste) {
      const x = brut as Record<string, unknown> | null;
      if (!x || typeof x['id'] !== 'string' || typeof x['lieu'] !== 'string') continue;
      rattacher(x['lieu'], { dossier, id: x['id'], nom: typeof x['nom'] === 'string' ? x['nom'] : typeof x['titre'] === 'string' ? x['titre'] : x['id'] });
    }
  }

  // Les lieux : un parent inconnu, ou une boucle de parents, fait du lieu une racine (le validateur le signale déjà).
  const parentSur = (id: string): string | undefined => {
    const p = dm.lieux.get(id)?.parent;
    if (!p || !dm.lieux.has(p)) return undefined;
    const chaine = new Set([id]);
    for (let c: string | undefined = p; c; c = dm.lieux.get(c)?.parent) {
      if (chaine.has(c)) return undefined;
      chaine.add(c);
    }
    return p;
  };
  const noeuds = new Map<string, NoeudLieu>();
  for (const l of dm.lieux.values())
    noeuds.set(l.id, { id: l.id, nom: l.nom, type: l.type, enfants: [], entites: (entites.get(l.id) ?? []).sort((a, b) => rang(a.dossier) - rang(b.dossier)) });
  const racines: NoeudLieu[] = [];
  for (const l of dm.lieux.values()) {
    const p = parentSur(l.id);
    (p ? noeuds.get(p)!.enfants : racines).push(noeuds.get(l.id)!);
  }
  return { racines, egarees };
}

/** Le nombre de lieux d'un sous-arbre (lui compris). */
export const tailleDuNoeud = (n: NoeudLieu): number => 1 + n.enfants.reduce((s, e) => s + tailleDuNoeud(e), 0);

/** L'arbre réduit aux lieux qui correspondent à la recherche (nom, id, ou une fiche rattachée), avec leurs ancêtres. */
export function filtrerArbre(racines: NoeudLieu[], recherche: string): NoeudLieu[] {
  const q = recherche.trim().toLowerCase();
  if (!q) return racines;
  const correspond = (s: string) => s.toLowerCase().includes(q);
  const filtrer = (n: NoeudLieu): NoeudLieu | null => {
    const enfants = n.enfants.map(filtrer).filter((x): x is NoeudLieu => !!x);
    const lui = correspond(n.nom) || correspond(n.id);
    const entites = lui ? n.entites : n.entites.filter((e) => correspond(e.nom) || correspond(e.id));
    return lui || entites.length || enfants.length ? { ...n, enfants, entites } : null;
  };
  return racines.map(filtrer).filter((x): x is NoeudLieu => !!x);
}
