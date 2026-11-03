// Démarrer une aventure : le monde chargé, le groupe du joueur, une partie du moteur d'exploration.
import {
  commencer,
  creerGenerateur,
  etatInitial,
  nouvellePartie,
  type Aventurier,
  type DonneesMonde,
  type Donnees,
  type CompteRendu,
  type Groupe,
  type Jet,
  type Partie,
  type Rencontre,
  type Terrain,
} from '@crpg/regles';
import { herosDuGroupe } from '../groupe/stockage';

/** Une ligne du récit affiché au joueur. */
export type Entree =
  | { type: 'lieu'; titre: string; texte: string; ambiance?: string }
  | { type: 'texte'; texte: string }
  | { type: 'parole'; qui: string; texte: string }
  | { type: 'constat'; texte: string }
  | { type: 'fait'; texte: string; rumeur: boolean }
  | { type: 'jet'; jet: Jet }
  | { type: 'refus'; texte: string };

export interface Aventure {
  dm: DonneesMonde;
  partie: Partie;
  /** Portrait de galerie de chaque aventurier (id → portrait). */
  portraits: Record<string, string | undefined>;
  journal: Entree[];
  /** Rencontre déclenchée qui attend : combattre, une alternative, ou se replier. */
  combatEnAttente?: string;
}

/** Verse un compte rendu du moteur dans le journal (utilisé au démarrage et après un combat). */
export function journaliser(a: Aventure, cr: CompteRendu): void {
  if (!cr.ok && cr.refus) a.journal.push({ type: 'refus', texte: cr.refus });
  // Ordre de lecture : les dés, le texte de l'auteur, ce que le groupe constate, puis ce qu'il apprend.
  for (const j of cr.jets) a.journal.push({ type: 'jet', jet: j });
  for (const n of cr.narrations) a.journal.push({ type: 'texte', texte: n });
  for (const t of cr.constats) a.journal.push({ type: 'constat', texte: t });
  for (const f of cr.revele) {
    const fait = a.dm.faits.get(f);
    // Une rumeur porte la vérité pour le conteur : le joueur ne l'apprend que par les PNJ.
    if (fait?.fiable) a.journal.push({ type: 'fait', texte: fait.texte, rumeur: false });
  }
  if (cr.combat) a.combatEnAttente = cr.combat;
}

/** Même identifiant que le combat (`preparerRencontre`) : le nom en minuscules, sans accents ni espaces. */
export function idAventurier(nom: string, i: number, pris: Set<string>): string {
  let id = nom.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `heros-${i + 1}`;
  if (pris.has(id)) id = `${id}-${i + 1}`;
  pris.add(id);
  return id;
}

const slug = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function demarrerAventure(dm: DonneesMonde, groupe: Groupe, donnees: Donnees): Aventure {
  const heros = herosDuGroupe(groupe, donnees);
  const pris = new Set<string>();
  const portraits: Record<string, string | undefined> = {};
  const aventuriers: Aventurier[] = heros.map((h, i) => {
    const id = idAventurier(h.fiche.nom, i, pris);
    portraits[id] = h.portrait;
    return { id, nom: h.fiche.nom, fiche: h.fiche, pv: h.fiche.pvMax, outils: (h.fiche.equipement?.autres ?? []).map(slug) };
  });
  const niveau = Math.max(dm.monde.niveaux.min, Math.min(dm.monde.niveaux.max, groupe.niveau));
  const partie = nouvellePartie(dm, etatInitial(dm, niveau), aventuriers, creerGenerateur(Math.floor(Math.random() * 2 ** 31)));
  const depart = dm.lieux.get(dm.monde.depart.lieu)!;
  const a: Aventure = { dm, partie, portraits, journal: [{ type: 'texte', texte: dm.monde.depart.intro }, { type: 'lieu', titre: depart.nom, texte: depart.resume, ambiance: depart.ambiance }] };
  journaliser(a, commencer(partie));
  return a;
}

/** Ambiance du plateau d'une rencontre de l'histoire : la sienne, sinon celle du type de lieu. */
function terrainDuLieu(type: string | undefined): Terrain {
  if (type === 'grotte') return 'caverne';
  if (type && ['donjon', 'niveau', 'salle', 'ruine', 'batiment'].includes(type)) return 'souterrain';
  if (type === 'camp') return 'camp';
  return 'foret';
}

/** Carte par défaut quand l'auteur n'en a pas dessiné : une clairière de 16 × 10. */
function carteParDefaut(nombreMonstres: number): string[] {
  const largeur = 16;
  const lignes = Array.from({ length: 10 }, (_, y) => (y === 0 || y === 9 ? '#'.repeat(largeur) : `#${'.'.repeat(largeur - 2)}#`));
  const placer = (y: number, n: number, marque: string) => {
    const l = [...lignes[y]!];
    for (let i = 0; i < n; i++) l[2 + i] = marque;
    lignes[y] = l.join('');
  };
  placer(1, Math.min(12, nombreMonstres), 'm');
  placer(2, Math.max(0, Math.min(12, nombreMonstres - 12)), 'm');
  placer(7, 6, 'H');
  return lignes;
}

/** Une rencontre de l'histoire, au format du combat. */
export function rencontreDeMonde(dm: DonneesMonde, id: string): Rencontre {
  const r = dm.rencontres.get(id)!;
  const lieu = r.lieu ? dm.lieux.get(r.lieu) : undefined;
  const nombre = r.monstres.reduce((s, m) => s + m.nombre, 0);
  return {
    id: r.id,
    nom: r.nom,
    description: r.intro,
    difficulte: r.difficulte,
    terrain: r.terrain ?? terrainDuLieu(lieu?.type),
    carte: r.carte ?? carteParDefaut(nombre),
    monstres: r.monstres.map((m) => ({ profil: m.profil, nombre: m.nombre })),
  };
}

// ---------------------------------------------------------------------------
// Sauvegarde automatique (navigateur) — en attendant la vraie sauvegarde de M4d
// ---------------------------------------------------------------------------

const CLE_SAUVEGARDE = 'table-du-conteur:aventure:v1';

interface Sauvegarde {
  monde: string;
  etat: Partie['etat'];
  pv: Record<string, number>;
  journal: Entree[];
  combatEnAttente?: string;
}

export function sauverAventure(a: Aventure): void {
  const s: Sauvegarde = {
    monde: a.dm.monde.id,
    etat: a.partie.etat,
    pv: Object.fromEntries(a.partie.groupe.map((x) => [x.id, x.pv])),
    journal: a.journal.slice(-300),
    combatEnAttente: a.combatEnAttente,
  };
  try {
    localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(s));
  } catch {
    // Stockage indisponible (navigation privée…) : la partie continue sans sauvegarde.
  }
}

/** Monde et lieu de l'aventure sauvegardée, s'il y en a une. */
export function aventureSauvegardee(): { monde: string; lieu: string } | undefined {
  try {
    const s = JSON.parse(localStorage.getItem(CLE_SAUVEGARDE) ?? 'null') as Sauvegarde | null;
    return s ? { monde: s.monde, lieu: s.etat.lieu } : undefined;
  } catch {
    return undefined;
  }
}

export function restaurerAventure(dm: DonneesMonde, groupe: Groupe, donnees: Donnees): Aventure | undefined {
  let s: Sauvegarde | null;
  try {
    s = JSON.parse(localStorage.getItem(CLE_SAUVEGARDE) ?? 'null') as Sauvegarde | null;
  } catch {
    return undefined;
  }
  if (!s || s.monde !== dm.monde.id) return undefined;
  const a = demarrerAventure(dm, groupe, donnees);
  a.partie.etat = { ...s.etat, exploration: { ...a.partie.etat.exploration, ...s.etat.exploration } };
  for (const x of a.partie.groupe) if (s.pv[x.id] !== undefined) x.pv = s.pv[x.id]!;
  a.journal = [...s.journal, { type: 'constat', texte: 'Partie reprise.' }];
  a.combatEnAttente = s.combatEnAttente;
  return a;
}
