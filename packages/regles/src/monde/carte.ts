// La carte du monde : pour chaque lieu qui en contient d'autres (région, ville, donjon, niveau…), la liste de ses enfants
// directs tels que le groupe peut les voir. Fonction pure sur l'état de la partie : elle ne stocke rien (le brouillard se
// déduit de `lieuxVisites` et des passages découverts), donc aucune migration de sauvegarde.
//
// Règle de brouillard : on ne montre un lieu que si le groupe y est allé (ou dedans), ou si un passage connu y mène depuis un
// lieu visité (les mêmes passages que le panneau « Partir »). Un passage caché non découvert ne montre rien. Ni résumé, ni
// description, ni visuel d'un lieu : seulement son nom, son type et sa place sur la carte.
import { sortiesDe, type PartieMonde } from './exploration';
import { lieuxObjectifs } from './objectifs';
import type { Lieu } from './schemas';

export type EtatMarqueur = 'ici' | 'visite' | 'connu';

export interface MarqueurCarte {
  id: string;
  nom: string;
  type: string;
  /** Position sur l'image de la carte, en pourcentage (0 à 100). Posée par l'auteur, sinon calculée (`auto`). */
  x: number;
  y: number;
  auto: boolean;
  /** `ici` : le groupe s'y trouve (ou dedans) ; `visite` : déjà visité ; `connu` : un passage y mène, pas encore visité. */
  etat: EtatMarqueur;
  /** Ce lieu en contient d'autres, et sa propre carte est consultable. */
  aCarte: boolean;
  /** On peut y aller directement depuis le lieu où se trouve le groupe (un passage libre, ou verrouillé / bloqué). */
  acces?: { heures: number; verrouille: boolean; bloque: boolean };
  /** Les quêtes en cours dont une étape active se joue ici (ou dans un lieu qu'il contient). */
  objectifs?: string[];
}

export interface VueCarte {
  conteneur: { id: string; nom: string; type: string; parent?: string };
  marqueurs: MarqueurCarte[];
}

export interface CarteMonde {
  /** La carte à montrer en premier : celle du parent du lieu courant (ou du lieu lui-même s'il est une racine). */
  courant: string;
  lieu: { id: string; nom: string };
  /** Les cartes consultables, par id du lieu conteneur. */
  vues: Record<string, VueCarte>;
}

/** Disposition de repli quand l'auteur n'a pas posé un lieu : un anneau (deux au-delà de 9), centré sur la carte. */
export function positionAuto(n: number, i: number): { x: number; y: number } {
  if (n <= 1) return { x: 50, y: 50 };
  const interieur = n > 9 ? Math.floor(n / 3) : 0;
  const [dansAnneau, rang, rayonX, rayonY] = i < interieur ? [interieur, i, 17, 15] : [n - interieur, i - interieur, 36, 33];
  const angle = -Math.PI / 2 + (2 * Math.PI * rang) / dansAnneau + (i < interieur ? Math.PI / dansAnneau : 0);
  return { x: Math.round((50 + rayonX * Math.cos(angle)) * 10) / 10, y: Math.round((50 + rayonY * Math.sin(angle)) * 10) / 10 };
}

/** Les ancêtres d'un lieu (lui compris), du plus proche au plus lointain. */
function chaine(lieux: Map<string, Lieu>, id: string): string[] {
  const res: string[] = [];
  for (let c: string | undefined = id; c && lieux.has(c) && res.length < 30; c = lieux.get(c)!.parent) res.push(c);
  return res;
}

export function carteDuMonde(p: PartieMonde): CarteMonde {
  const { dm, etat } = p;
  const lieux = dm.lieux;
  const courantId = lieux.has(etat.lieu) ? etat.lieu : [...lieux.keys()][0]!;

  // 1. Ce que le groupe a vu : lieux visités (et leurs ancêtres), puis les lieux où un passage connu mène depuis un lieu visité.
  const visites = new Set<string>(chaine(lieux, courantId));
  for (const id of etat.lieuxVisites) for (const a of chaine(lieux, id)) visites.add(a);
  const connus = new Set<string>();
  for (const id of new Set([courantId, ...etat.lieuxVisites])) {
    if (!lieux.has(id)) continue;
    for (const s of sortiesDe(p, id)) if (!s.cache && lieux.has(s.vers) && !visites.has(s.vers)) connus.add(s.vers);
  }

  // 2. Où le groupe se trouve, et par où il peut aller d'ici.
  const ici = new Set(chaine(lieux, courantId));
  const acces = new Map(sortiesDe(p, courantId).filter((s) => !s.cache).map((s) => [s.vers, s]));
  const objectifs = lieuxObjectifs(p);

  // 3. Les enfants de chaque lieu conteneur (dans l'ordre du monde : les positions automatiques restent stables).
  const enfants = new Map<string, Lieu[]>();
  for (const l of lieux.values()) if (l.parent && lieux.has(l.parent)) enfants.set(l.parent, [...(enfants.get(l.parent) ?? []), l]);

  const vues: Record<string, VueCarte> = {};
  for (const [parentId, fils] of enfants) {
    const parent = lieux.get(parentId)!;
    if (!visites.has(parentId) && !connus.has(parentId)) continue;
    const marqueurs: MarqueurCarte[] = [];
    fils.forEach((l, i) => {
      const etatM: EtatMarqueur | undefined = ici.has(l.id) ? 'ici' : visites.has(l.id) ? 'visite' : connus.has(l.id) ? 'connu' : undefined;
      if (!etatM) return;
      const pos = l.position ?? positionAuto(fils.length, i);
      const s = ici.has(l.id) ? undefined : acces.get(l.id);
      marqueurs.push({
        id: l.id,
        nom: l.nom,
        type: l.type,
        x: pos.x,
        y: pos.y,
        auto: !l.position,
        etat: etatM,
        aCarte: enfants.has(l.id) && visites.has(l.id),
        ...(s ? { acces: { heures: s.heures, verrouille: !!s.verrou && !s.verrou.ouvert, bloque: s.bloque } } : {}),
        ...(objectifs.has(l.id) ? { objectifs: objectifs.get(l.id)! } : {}),
      });
    });
    if (!marqueurs.length) continue;
    vues[parentId] = { conteneur: { id: parent.id, nom: parent.nom, type: parent.type, ...(parent.parent ? { parent: parent.parent } : {}) }, marqueurs };
  }

  const lieu = lieux.get(courantId)!;
  const courant = lieu.parent && vues[lieu.parent] ? lieu.parent : vues[lieu.id] ? lieu.id : (Object.keys(vues)[0] ?? lieu.id);
  return { courant, lieu: { id: lieu.id, nom: lieu.nom }, vues };
}
