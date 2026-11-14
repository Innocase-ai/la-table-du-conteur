// Une aventure dans le client : le moteur (monde chargé + modules) et la partie en cours, sauvegardée telle quelle.
import { bilanPersonnage, creerMoteur, MODULES_STANDARD, personnageComplet, personnageDepuisFiche, type Personnage, type DonneesMonde, type Donnees, type Groupe, type Moteur, type Partie, type Rencontre, type Terrain, sauvegarderPartie } from '@crpg/regles';
import { herosDuGroupe } from '../groupe/stockage';

export interface Aventure {
  moteur: Moteur;
  partie: Partie;
}

/** Même identifiant que le combat (`preparerRencontre`) : le nom en minuscules, sans accents ni espaces. */
export function idAventurier(nom: string, i: number, pris: Set<string>): string {
  let id = nom.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `heros-${i + 1}`;
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
  // Les choix de création suivent chaque héros (même ordre que `herosDuGroupe`) : ils servent à la montée de niveau.
  const crees = groupe.emplacements.filter((p): p is NonNullable<typeof p> => !!p && personnageComplet(bilanPersonnage(p, donnees)));
  const aventuriers: Personnage[] = herosDuGroupe(groupe, donnees).map((h, i) =>
    personnageDepuisFiche(h.fiche, { id: idAventurier(h.fiche.nom, i, pris), outils: (h.fiche.equipement?.autres ?? []).map(slug), portrait: h.portrait, choix: crees[i]?.choix }),
  );
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
    ...(r.surprise ? { surprise: r.surprise } : {}),
  };
}

// ---------------------------------------------------------------------------
// Sauvegarde : la partie du noyau, telle quelle (JSON versionné).
// ---------------------------------------------------------------------------

export const CLE_SAUVEGARDE = 'table-du-conteur:partie';
/** La partie d'avant, gardée quand une nouvelle histoire commence (on ne perd jamais une campagne en un clic). */
export const CLE_PRECEDENTE = 'table-du-conteur:partie-precedente';
/** Une sauvegarde qui n'a pas pu se charger, mise de côté telle quelle. */
export const CLE_ILLISIBLE = 'table-du-conteur:partie-illisible';

/** Faux tant que la dernière écriture a réussi ; vrai si elle a échoué (stockage plein ou indisponible). */
let echecEcriture = false;
export function sauvegardeEnEchec(): boolean {
  return echecEcriture;
}

/** Une partie différente de celle sauvegardée (autre histoire, ou nouvelle partie de la même : graine différente). */
function autrePartie(json: string | null, p: Partie): boolean {
  if (!json) return false;
  try {
    const ancienne = JSON.parse(json) as { monde?: string; graine?: number };
    return ancienne.monde !== p.monde || ancienne.graine !== p.graine;
  } catch {
    return true;
  }
}

/**
 * Écrit la partie (journal borné, réduit encore si le stockage est plein). Renvoie `false` si rien n'a pu être écrit
 * (navigation privée, stockage plein) : l'écran le signale et propose d'enregistrer la partie dans un fichier.
 * Une partie qui en remplace une autre (nouvelle histoire) garde l'ancienne de côté, restaurable depuis l'écran titre.
 */
export function sauverPartie(p: Partie): boolean {
  try {
    const actuelle = localStorage.getItem(CLE_SAUVEGARDE);
    if (autrePartie(actuelle, p)) localStorage.setItem(CLE_PRECEDENTE, actuelle!);
  } catch {
    // stockage indisponible : l'écriture ci-dessous échouera et le dira
  }
  const ok = sauvegarderPartie(p, (json) => localStorage.setItem(CLE_SAUVEGARDE, json));
  echecEcriture = !ok;
  return ok;
}

/** Résumé lisible d'une sauvegarde (monde, jour), ou rien si elle n'existe pas ou ne se lit pas. */
export function resumeSauvegarde(cle: string): { monde: string; jour: number; texte: string } | undefined {
  try {
    const texte = localStorage.getItem(cle);
    if (!texte) return undefined;
    const p = JSON.parse(texte) as Partial<Partie>;
    if (!p.monde || !p.etat) return undefined;
    return { monde: p.monde, jour: p.etat.jour ?? 1, texte };
  } catch {
    return undefined;
  }
}

/** Échange la partie courante et la précédente (la courante devient « précédente » : rien n'est perdu). */
export function restaurerPartiePrecedente(): boolean {
  try {
    const precedente = localStorage.getItem(CLE_PRECEDENTE);
    if (!precedente) return false;
    const actuelle = localStorage.getItem(CLE_SAUVEGARDE);
    localStorage.setItem(CLE_SAUVEGARDE, precedente);
    if (actuelle) localStorage.setItem(CLE_PRECEDENTE, actuelle);
    else localStorage.removeItem(CLE_PRECEDENTE);
    return true;
  } catch {
    return false;
  }
}

/**
 * Charge une partie depuis le texte d'un fichier exporté : vérifie que c'est bien une partie, met la courante de côté
 * (« précédente »), puis l'écrit. Renvoie un message d'erreur, ou rien si c'est fait.
 */
export function importerPartie(texte: string): string | undefined {
  let p: Partial<Partie>;
  try {
    p = JSON.parse(texte) as Partial<Partie>;
  } catch {
    return 'Ce fichier n’est pas une partie (JSON illisible).';
  }
  if (typeof p !== 'object' || !p || typeof p.version !== 'number' || !p.monde || !p.etat || !Array.isArray(p.groupe)) return 'Ce fichier n’a pas le format d’une partie de La Table du Conteur.';
  try {
    const actuelle = localStorage.getItem(CLE_SAUVEGARDE);
    if (actuelle) localStorage.setItem(CLE_PRECEDENTE, actuelle);
    localStorage.setItem(CLE_SAUVEGARDE, texte);
    return undefined;
  } catch {
    return 'Le stockage du navigateur est plein ou indisponible : impossible de charger cette partie.';
  }
}

/** Télécharge un texte dans un fichier (sauvegarde exportée, rapport de plantage). */
export function telechargerTexte(texte: string, nom: string): void {
  const url = URL.createObjectURL(new Blob([texte], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Le nom de fichier d'une partie exportée : « partie-<monde>-jour-<n>.json ». */
export function nomFichierPartie(monde: string, jour: number): string {
  return `partie-${monde}-jour-${jour}.json`;
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
  try {
    return { moteur, partie: moteur.charger(json) };
  } catch (e) {
    // Illisible : on la met de côté telle quelle (l'écran titre permet de l'enregistrer dans un fichier), puis on le dit.
    try {
      localStorage.setItem(CLE_ILLISIBLE, json);
    } catch {
      // stockage plein : la sauvegarde reste à sa place
    }
    throw new Error(`${e instanceof Error ? e.message : String(e)} La sauvegarde n’a pas été effacée : elle est gardée de côté (écran titre, « Sauvegardes »).`);
  }
}
