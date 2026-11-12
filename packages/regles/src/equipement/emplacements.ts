// Les emplacements d'un héros (tête, cou, torse, dos, gants, ceinture, pieds, deux anneaux, et les mains de deux jeux d'armes) et
// la famille d'emplacements de chaque objet. Fichier pur, sans dépendance : le modèle (`personnage.ts`), les règles
// (`modules/equipement-regles.ts`) et l'écran s'appuient dessus.

/** Les 13 emplacements. `j1.*` et `j2.*` : les deux mains du jeu d'armes I et du jeu II (un seul jeu est en main). */
export const EMPLACEMENTS = ['tete', 'cou', 'torse', 'dos', 'gants', 'ceinture', 'pieds', 'anneau1', 'anneau2', 'j1.droite', 'j1.gauche', 'j2.droite', 'j2.gauche'] as const;
export type Emplacement = (typeof EMPLACEMENTS)[number];

/** Ce qu'un objet peut occuper : un emplacement de vêtement ou de bijou, un anneau (deux places), ou une main (arme, bouclier). */
export const FAMILLES = ['tete', 'cou', 'torse', 'dos', 'gants', 'ceinture', 'pieds', 'anneau', 'main'] as const;
export type Famille = (typeof FAMILLES)[number];

export const NOMS_EMPLACEMENTS: Record<Emplacement, string> = {
  tete: 'Tête',
  cou: 'Cou',
  torse: 'Torse',
  dos: 'Dos',
  gants: 'Gants',
  ceinture: 'Ceinture',
  pieds: 'Pieds',
  anneau1: 'Anneau',
  anneau2: 'Anneau',
  'j1.droite': 'Main droite (jeu I)',
  'j1.gauche': 'Main gauche (jeu I)',
  'j2.droite': 'Main droite (jeu II)',
  'j2.gauche': 'Main gauche (jeu II)',
};

export const NOMS_FAMILLES: Record<Famille, string> = { tete: 'la tête', cou: 'le cou', torse: 'le torse', dos: 'le dos', gants: 'les mains (gants)', ceinture: 'la ceinture', pieds: 'les pieds', anneau: 'un doigt', main: 'une main' };

/** Les emplacements d'une famille, dans l'ordre où on les remplit. Les mains dépendent du jeu (voir `mainsDuJeu`). */
export const EMPLACEMENTS_DE: Record<Exclude<Famille, 'main'>, Emplacement[]> = {
  tete: ['tete'],
  cou: ['cou'],
  torse: ['torse'],
  dos: ['dos'],
  gants: ['gants'],
  ceinture: ['ceinture'],
  pieds: ['pieds'],
  anneau: ['anneau1', 'anneau2'],
};

export type Jeu = 1 | 2;

/** Les deux mains d'un jeu d'armes. */
export const mainsDuJeu = (jeu: Jeu): { droite: Emplacement; gauche: Emplacement } => (jeu === 1 ? { droite: 'j1.droite', gauche: 'j1.gauche' } : { droite: 'j2.droite', gauche: 'j2.gauche' });
export const autreJeu = (jeu: Jeu): Jeu => (jeu === 1 ? 2 : 1);

/** Le jeu auquel appartient une main (`j2.gauche` → 2), ou rien pour un autre emplacement. */
export function jeuDe(e: Emplacement): Jeu | undefined {
  return e.startsWith('j1.') ? 1 : e.startsWith('j2.') ? 2 : undefined;
}

export const estMain = (e: Emplacement): boolean => jeuDe(e) !== undefined;
export const estMainGauche = (e: Emplacement): boolean => e === 'j1.gauche' || e === 'j2.gauche';
export const estMainDroite = (e: Emplacement): boolean => e === 'j1.droite' || e === 'j2.droite';
/** La main de l'autre côté du même jeu. */
export const mainOpposee = (e: Emplacement): Emplacement | undefined => (e === 'j1.droite' ? 'j1.gauche' : e === 'j1.gauche' ? 'j1.droite' : e === 'j2.droite' ? 'j2.gauche' : e === 'j2.gauche' ? 'j2.droite' : undefined);

/** Les parties d'un objet dont dépend sa famille (un objet du catalogue ou d'un monde). */
export interface ObjetPourEmplacement {
  id: string;
  categorie: string;
  base?: string;
  /** Famille imposée par l'auteur du monde (objets propres) ; elle l'emporte sur le classement automatique. */
  emplacement?: Famille;
}

/**
 * Par un mot de l'identifiant (les objets du SRD et ceux des mondes sont classés ainsi, sans toucher à leurs fichiers) : on cherche le
 * mot n'importe où (`ald-o-torque-d-electrum` est un torque), le premier motif qui convient l'emporte.
 */
const mot = (...mots: string[]) => new RegExp(`(^|-)(${mots.join('|')})(-|$)`);
const PAR_MOT: [RegExp, Famille][] = [
  [mot('bague', 'bagues', 'alliance'), 'anneau'],
  [mot('heaume', 'chapeau', 'bandeau', 'lunettes', 'diademe', 'lentilles', 'casque', 'couronne', 'capuche', 'masque', 'lorgnon', 'monocle', 'coiffe'), 'tete'],
  [mot('amulette', 'collier', 'medaillon', 'talisman', 'chapelet', 'scarabee', 'broche', 'pierre-porte-bonheur', 'pendentif', 'torque'), 'cou'],
  [mot('cape', 'manteau'), 'dos'],
  [mot('gants', 'gantelets', 'bracelets', 'brassards', 'brassard', 'bracelet'), 'gants'],
  [mot('ceinturon', 'ceinture'), 'ceinture'],
  [mot('bottes', 'chaussons', 'sandales', 'souliers', 'bottines'), 'pieds'],
  // Les robes magiques se portent à la place d'une armure ; la robe, le costume, les beaux habits et la tenue de voyage n'ont pas de place.
  [/^robe-/, 'torse'],
];

/**
 * La famille d'emplacements d'un objet, ou rien s'il ne s'équipe pas (potion, clé, vêtement civil sans place…). Une arme ou un
 * bouclier va dans une main ; une armure, au torse ; un anneau, à un doigt ; le reste se range par un mot de son identifiant, et un
 * bijou sans mot connu se porte au cou.
 */
export function familleDe(o: ObjetPourEmplacement): Famille | undefined {
  if (o.emplacement) return o.emplacement;
  if (o.categorie === 'arme' || o.categorie === 'bouclier') return 'main';
  if (o.categorie === 'armure') return 'torse';
  if (o.categorie === 'anneau') return 'anneau';
  if (o.categorie === 'vetement' || o.categorie === 'bijou') {
    const id = o.base ?? o.id;
    const trouve = (PAR_MOT.find(([motif]) => motif.test(id)) ?? PAR_MOT.find(([motif]) => motif.test(o.id)))?.[1];
    return trouve ?? (o.categorie === 'bijou' ? 'cou' : undefined);
  }
  return undefined;
}

/** Les emplacements où un objet peut aller (hors règles des mains : voir `placer` dans `modules/equipement-regles.ts`). */
export function emplacementsDeFamille(f: Famille, jeuActif: Jeu): Emplacement[] {
  if (f !== 'main') return EMPLACEMENTS_DE[f];
  const a = mainsDuJeu(jeuActif);
  const b = mainsDuJeu(autreJeu(jeuActif));
  return [a.droite, a.gauche, b.droite, b.gauche];
}
