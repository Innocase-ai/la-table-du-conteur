// Le canon structuré d'un monde (`canon.json` à la racine du dossier du monde) : ce que la BIBLE dit en prose et que l'atelier
// peut vérifier à la machine : les secrets et les mots qui les trahissent, les noms admis, les personnages (âge, espèce).
// Et les décisions de revue (`revue.json`) : les alertes qu'on a jugées sans objet. Ni l'un ni l'autre n'est lu par le jeu.
import { z } from 'zod';
import { Id, type DonneesMonde } from './schemas';

export const Secret = z.object({
  id: Id,
  /** Le secret, à plat, pour l'auteur (jamais montré au joueur). */
  texte: z.string().min(1),
  /** Le fait du monde qui le porte, s'il y en a un. */
  fait: Id.optional(),
  /**
   * Les mots qui le trahissent : interdits dans tout texte que le joueur ou le conteur lit librement (passé, liens, couleur, accroches,
   * examens…). Choisis par l'auteur, peu et précis (« pacte », « registre ») : un mot courant (« village ») ferait du bruit. Vide : le secret n'est pas surveillé.
   */
  motsTabou: z.array(z.string().min(2)).default([]),
  /** Les fiches qui ont le droit d'en parler (`pnj:anselme-roux`, ou un type entier : `dilemmes`). */
  autorise: z.array(z.string()).default([]),
});
export type Secret = z.infer<typeof Secret>;

export const Canon = z.object({
  secrets: z.array(Secret).default([]),
  /** Des noms propres admis même s'ils n'apparaissent nulle part ailleurs (un dieu, une ville lointaine). */
  noms: z.object({ lexique: z.array(z.string()).default([]) }).default({}),
  personnages: z.array(z.object({ id: Id, nom: z.string().optional(), age: z.number().int().min(0).optional(), espece: z.string().optional() })).default([]),
});
export type Canon = z.infer<typeof Canon>;

/** Les décisions de revue : une clé par alerte jugée sans objet (voir `cleDeRevue`). */
export const Revue = z.object({ rejets: z.array(z.string()).default([]) });
export type Revue = z.infer<typeof Revue>;

export const CANON_VIDE: Canon = { secrets: [], noms: { lexique: [] }, personnages: [] };

const idSecret = (id: string) => `secret-${id}`.replace(/[^a-z0-9-]/g, '-');

/**
 * Un canon proposé d'après le monde : un secret par fait de catégorie « secret » (à compléter : les mots tabou sont ceux que l'auteur
 * ne veut voir dans aucun texte libre, on ne les devine pas), et les personnages avec leur nom, âge et espèce.
 */
export function canonDepuisMonde(dm: DonneesMonde): Canon {
  const secrets: Secret[] = [...dm.faits.values()]
    .filter((f) => f.categorie === 'secret')
    .map((f) => ({ id: idSecret(f.id), texte: f.texte, fait: f.id, motsTabou: [], autorise: [] }));
  const personnages = [...dm.pnj.values()].map((p) => {
    const age = /\d+/.exec(p.age ?? '')?.[0];
    return { id: p.id, nom: p.nom, ...(age ? { age: Number(age) } : {}), espece: p.espece };
  });
  return { secrets, noms: { lexique: [] }, personnages };
}

/** Complète un canon existant avec ce qu'une proposition apporte de nouveau (par identifiant) : rien de ce que l'auteur a écrit n'est modifié. */
export function fusionnerCanon(existant: Canon, propose: Canon): Canon {
  const ids = new Set(existant.secrets.map((s) => s.id));
  const faits = new Set(existant.secrets.map((s) => s.fait).filter(Boolean));
  const pers = new Set(existant.personnages.map((p) => p.id));
  return {
    secrets: [...existant.secrets, ...propose.secrets.filter((s) => !ids.has(s.id) && !(s.fait && faits.has(s.fait)))],
    noms: existant.noms,
    personnages: [...existant.personnages, ...propose.personnages.filter((p) => !pers.has(p.id))],
  };
}
