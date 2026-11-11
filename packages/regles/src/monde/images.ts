// Images d'un monde : chaque monde peut livrer `images/manifeste.json` et ses fichiers WebP à côté de ses données.
// Le moteur ne connaît aucun monde en particulier : il lit le manifeste, vérifie qu'il colle aux données et
// répond « quelle image pour ce lieu / ce PNJ / ce monstre / cet objet ? ». Un élément sans image est permis
// (le client dessine alors une tuile d'attente).
import { z } from 'zod';
import type { DonneesMonde } from './schemas';

const Fichiers = z.record(z.string().regex(/^[a-z0-9-]+\.(webp|png|jpg)$/));
// Un PNJ ou un objet peut aussi prendre l'image d'un asset commun (`commun:pnj/<id>`, `commun:objets/<id>` : bibliothèque commune venue
// des histoires, voir `communs.ts`) au lieu d'un fichier du monde.
const FichiersOuCommuns = z.record(z.string().regex(/^([a-z0-9-]+\.(webp|png|jpg)|commun:(pnj|objets)\/[a-z0-9-]+)$/));

export const ManifesteImages = z.object({
  lieux: Fichiers.default({}),
  pnj: FichiersOuCommuns.default({}),
  /** Clé : profil de monstre (SRD), partagé par toutes les rencontres qui l'utilisent. */
  monstres: Fichiers.default({}),
  objets: FichiersOuCommuns.default({}),
  /** Clé : id du lieu parent (région, ville, donjon, niveau…) dont l'image est la carte ; les positions sont sur les lieux enfants. */
  cartes: Fichiers.default({}),
});
export type ManifesteImages = z.infer<typeof ManifesteImages>;
export type GroupeImage = keyof ManifesteImages;

/** Fichier de l'image d'un élément du monde (relatif au dossier `images/` du monde), ou undefined. */
export function imageDe(manifeste: ManifesteImages | undefined, groupe: GroupeImage, id: string): string | undefined {
  return manifeste?.[groupe][id];
}

export interface BilanImages {
  /** Entrées du manifeste qui ne correspondent à rien dans le monde (erreur). */
  inconnues: string[];
  /** Lieux et PNJ du monde sans image (avertissement : le jeu reste jouable). */
  manquantes: string[];
  /** Enfants directs d'un lieu qui a une carte illustrée mais qu'on n'a pas encore posés dessus (avertissement). */
  sansPosition: string[];
}

/** Les ids de la bibliothèque commune (tables `packages/donnees/visuel/pnj-communs.json` et `objets-histoires.json`), pour vérifier les références. */
export interface IdsCommuns {
  pnj: ReadonlySet<string>;
  objets: ReadonlySet<string>;
}

export function verifierImages(dm: DonneesMonde, manifeste: ManifesteImages, communs?: IdsCommuns): BilanImages {
  const connus: Record<GroupeImage, Set<string>> = {
    lieux: new Set(dm.lieux.keys()),
    pnj: new Set(dm.pnj.keys()),
    // Aucune image de monstre propre à une histoire : le bestiaire commun du moteur les illustre (règle du 06/11/2026).
    monstres: new Set<string>(),
    objets: new Set(dm.objets.keys()),
    cartes: new Set([...dm.lieux.values()].flatMap((l) => (l.parent ? [l.parent] : []))),
  };
  const inconnues: string[] = [];
  for (const groupe of Object.keys(connus) as GroupeImage[]) {
    for (const id of Object.keys(manifeste[groupe])) if (!connus[groupe].has(id)) inconnues.push(`${groupe}/${id}`);
  }
  if (communs) {
    for (const groupe of ['pnj', 'objets'] as const) {
      for (const [id, f] of Object.entries(manifeste[groupe])) {
        const ref = /^commun:(pnj|objets)\/(.+)$/.exec(f);
        if (ref && (ref[1] !== groupe || !communs[groupe].has(ref[2]!))) inconnues.push(`${groupe}/${id} → ${f} (asset commun inconnu)`);
      }
    }
  }
  const manquantes = [
    ...[...dm.lieux.keys()].filter((id) => !manifeste.lieux[id]).map((id) => `lieux/${id}`),
    ...[...dm.pnj.keys()].filter((id) => !manifeste.pnj[id]).map((id) => `pnj/${id}`),
  ];
  const sansPosition = [...dm.lieux.values()].filter((l) => l.parent && manifeste.cartes[l.parent] && !l.position).map((l) => l.id);
  return { inconnues, manquantes, sansPosition };
}
