// Dépouilles : ce que les adversaires vaincus ont sur eux, selon leur nature (type SRD) et leur puissance (FP), sans que
// l'auteur du monde ait à l'écrire. Un humanoïde a une bourse et du matériel ; une bête presque rien ; un mort-vivant de
// vieilles pièces et des restes d'offrandes ; une créature artificielle presque rien. Les tables de butin d'une rencontre
// (`butin.tables`) s'y ajoutent pour la saveur propre à l'histoire.
import type { Donnees } from '../donnees';
import { lancer, type Generateur } from '../des';

type Unite = 'pc' | 'pa' | 'po';
interface Pieces {
  des: string;
  unite: Unite;
}

/** La famille de dépouille d'un type SRD (« Humanoïde », « Fée (Gobelinoïde) », « Mort-vivant »…). */
export type Famille = 'porteur' | 'geant' | 'mort-vivant' | 'bete' | 'artificiel' | 'autre';

export function familleDe(type: string): Famille {
  const t = type
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
  if (t.includes('humanoide') || t.includes('gobelinoide') || t.includes('fielon')) return 'porteur';
  if (t.includes('geant')) return 'geant';
  if (t.includes('mort-vivant')) return 'mort-vivant';
  if (t.includes('bete')) return 'bete';
  if (t.includes('artificiel')) return 'artificiel';
  return 'autre';
}

/** Valeur numérique d'un FP du SRD (« 1/8 », « 2 »). */
export function valeurFp(fp: string): number {
  if (fp.includes('/')) {
    const [a, b] = fp.split('/').map(Number);
    return (a ?? 0) / (b ?? 1);
  }
  return Number(fp) || 0;
}

/** Les pièces d'une bourse selon la puissance de celui qui la porte. */
export function bourseSelonFp(fp: number): Pieces {
  if (fp <= 1 / 8) return { des: '1d4', unite: 'pa' };
  if (fp <= 1 / 4) return { des: '1d6', unite: 'pa' };
  if (fp <= 1 / 2) return { des: '2d6', unite: 'pa' };
  if (fp <= 1) return { des: '1d6', unite: 'po' };
  if (fp <= 2) return { des: '2d6', unite: 'po' };
  if (fp <= 3) return { des: '3d6', unite: 'po' };
  if (fp <= 5) return { des: '4d6', unite: 'po' };
  return { des: '6d6', unite: 'po' };
}

interface Regle {
  /** Chance (0 à 1) que la créature porte une bourse. */
  bourse: number;
  /** Multiplicateur de la bourse (une vieille pièce de noyé vaut moins qu'une bourse de bandit). */
  facteur?: number;
  /** Objets possibles : chacun avec sa chance, tirée indépendamment. */
  objets: { objet: string; chance: number; quantite?: number }[];
}

const REGLES: Record<Famille, Regle> = {
  // Humanoïdes, gobelinoïdes, gnolls : une bourse, du matériel de voyage, parfois une potion ou un parchemin.
  porteur: { bourse: 0.7, objets: [{ objet: 'rations', chance: 0.15 }, { objet: 'torche', chance: 0.12 }, { objet: 'potion-de-guerison', chance: 0.05 }, { objet: 'parchemin-de-sort-niveau-1', chance: 0.02 }] },
  // Géants : de quoi voler, beaucoup de matériel.
  geant: { bourse: 0.5, objets: [{ objet: 'corde', chance: 0.2 }, { objet: 'rations', chance: 0.2, quantite: 2 }] },
  // Morts-vivants : de vieilles pièces, des restes d'offrandes.
  'mort-vivant': { bourse: 0.3, facteur: 0.5, objets: [{ objet: 'bougie', chance: 0.08 }, { objet: 'fiole', chance: 0.06 }, { objet: 'eau-benite', chance: 0.04 }] },
  // Bêtes : presque rien (un peu de viande pour la route).
  bete: { bourse: 0, objets: [{ objet: 'rations', chance: 0.08 }] },
  // Créatures artificielles : rien, sauf ce qu'une garde ancienne a laissé dans ses entrailles.
  artificiel: { bourse: 0.1, objets: [] },
  autre: { bourse: 0, objets: [] },
};

export interface Depouilles {
  pieces: number;
  objets: Record<string, number>;
}

/**
 * Tire les dépouilles d'une liste d'adversaires vaincus. Un tirage par créature (indépendant) : le groupe lit un résumé
 * unique, pas une ligne par rat. `srd` fournit le type et le FP de chaque profil ; un profil inconnu est ignoré.
 */
export function tirerDepouilles(srd: Donnees, monstres: { profil: string; nombre: number }[], gen: Generateur): Depouilles {
  const total: Depouilles = { pieces: 0, objets: {} };
  for (const m of monstres) {
    const profil = srd.monstres.get(m.profil);
    if (!profil) continue;
    const regle = REGLES[familleDe(profil.type)];
    const fp = valeurFp(profil.fp);
    for (let i = 0; i < m.nombre; i++) {
      if (regle.bourse > 0 && gen() < regle.bourse) {
        const b = bourseSelonFp(fp);
        const n = lancer(b.des, gen).total * (regle.facteur ?? 1);
        total.pieces += b.unite === 'po' ? n : b.unite === 'pa' ? n / 10 : n / 100;
      }
      for (const o of regle.objets) if (gen() < o.chance) total.objets[o.objet] = (total.objets[o.objet] ?? 0) + (o.quantite ?? 1);
    }
  }
  total.pieces = Number(total.pieces.toFixed(2));
  return total;
}
