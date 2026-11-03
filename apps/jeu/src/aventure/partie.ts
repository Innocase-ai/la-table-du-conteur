// Une aventure dans le client : le moteur (monde chargé + modules) et la partie en cours, sauvegardée telle quelle.
import { creerMoteur, MODULES_STANDARD, type Aventurier, type DonneesMonde, type Donnees, type Groupe, type Moteur, type Partie, type Rencontre, type Terrain } from '@crpg/regles';
import { herosDuGroupe } from '../groupe/stockage';

export interface Aventure {
  moteur: Moteur;
  partie: Partie;
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

export function creerMoteurHistoire(dm: DonneesMonde, donnees: Donnees): Moteur {
  return creerMoteur({ dm, srd: donnees }, MODULES_STANDARD);
}

export function demarrerAventure(dm: DonneesMonde, groupe: Groupe, donnees: Donnees): Aventure {
  const pris = new Set<string>();
  const aventuriers: Aventurier[] = herosDuGroupe(groupe, donnees).map((h, i) => ({
    id: idAventurier(h.fiche.nom, i, pris),
    nom: h.fiche.nom,
    fiche: h.fiche,
    pv: h.fiche.pvMax,
    outils: (h.fiche.equipement?.autres ?? []).map(slug),
    portrait: h.portrait,
  }));
  const moteur = creerMoteurHistoire(dm, donnees);
  const niveau = Math.max(dm.monde.niveaux.min, Math.min(dm.monde.niveaux.max, groupe.niveau));
  const partie = moteur.executer(moteur.nouvellePartie(aventuriers, { niveau }), { type: 'commencer' }).partie;
  return { moteur, partie };
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
// Sauvegarde : la partie du noyau, telle quelle (JSON versionné).
// ---------------------------------------------------------------------------

const CLE_SAUVEGARDE = 'table-du-conteur:partie';

export function sauverPartie(p: Partie): void {
  try {
    localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(p));
  } catch {
    // Stockage indisponible (navigation privée…) : la partie continue sans sauvegarde.
  }
}

/** Monde et lieu de la partie sauvegardée, s'il y en a une. */
export function partieSauvegardee(): { monde: string; lieu: string } | undefined {
  try {
    const p = JSON.parse(localStorage.getItem(CLE_SAUVEGARDE) ?? 'null') as Partie | null;
    return p ? { monde: p.monde, lieu: p.etat.lieu } : undefined;
  } catch {
    return undefined;
  }
}

export function reprendreAventure(dm: DonneesMonde, donnees: Donnees): Aventure | undefined {
  const json = localStorage.getItem(CLE_SAUVEGARDE);
  if (!json) return undefined;
  const moteur = creerMoteurHistoire(dm, donnees);
  return { moteur, partie: moteur.charger(json) };
}
