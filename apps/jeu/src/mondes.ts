// Les histoires jouables : chaque dossier de packages/mondes avec un monde.json publié. Le client ne lit ici que la
// présentation (nom, accroche, résumé, ton, niveaux, chapitres) et l'image de couverture ; le monde complet sera
// chargé quand l'aventure commencera.
import { assemblerMonde, Estimation, Monde, type DonneesMonde, type ManifesteImages } from '@crpg/regles';

const FICHIERS = import.meta.glob('../../../packages/mondes/*/monde.json', { eager: true, import: 'default' }) as Record<string, unknown>;
const ESTIMATIONS = import.meta.glob('../../../packages/mondes/*/estimation.json', { eager: true, import: 'default' }) as Record<string, unknown>;
const MANIFESTES = import.meta.glob('../../../packages/mondes/*/images/manifeste.json', { eager: true, import: 'default' }) as Record<string, ManifesteImages>;
// Chargement paresseux : les données complètes et les images ne sont téléchargées qu'au début de l'aventure.
const VOIX = import.meta.glob<string>('../../../packages/mondes/*/voix/*.{mp3,ogg,wav}', { query: '?url', import: 'default' });
// Les données de jeu seulement : ni le manifeste des images ni les fiches des voix (texte lu, coût), qui n'ont rien à
// faire dans le jeu livré.
const DONNEES = import.meta.glob(['../../../packages/mondes/*/*/*.json', '!../../../packages/mondes/*/images/*.json', '!../../../packages/mondes/*/voix/*.json'], {
  import: 'default',
});
const IMAGES = import.meta.glob<string>('../../../packages/mondes/*/images/*.webp', { query: '?url', import: 'default' });

export interface Histoire {
  monde: Monde;
  /** Charge l'URL de l'image de couverture, s'il y en a une. */
  couverture?: () => Promise<string>;
  /** Durée et coût d'API estimés (`pnpm monde estimer`). */
  estimation?: Estimation;
}

const dossier = (chemin: string) => chemin.replace(/^.*\/mondes\/([^/]+)\/.*$/, '$1');

export function histoires(): Histoire[] {
  return Object.entries(FICHIERS)
    .flatMap(([chemin, brut]) => {
      const r = Monde.safeParse(brut);
      if (!r.success || r.data.statut !== 'publie') return [];
      const id = dossier(chemin);
      const manifeste = Object.entries(MANIFESTES).find(([c]) => dossier(c) === id)?.[1];
      // Couverture : l'image du lieu qui porte le nom du monde, sinon celle du lieu de départ.
      const fichier = manifeste?.lieux[r.data.id] ?? manifeste?.lieux[r.data.depart.lieu];
      const chargeur = fichier ? IMAGES[`../../../packages/mondes/${id}/images/${fichier}`] : undefined;
      const brute = Object.entries(ESTIMATIONS).find(([c]) => dossier(c) === id)?.[1];
      const estimation = brute ? Estimation.safeParse(brute) : undefined;
      return [{ monde: r.data, couverture: chargeur, estimation: estimation?.success ? estimation.data : undefined }];
    })
    .sort((a, b) => a.monde.nom.localeCompare(b.monde.nom));
}

/** Charge toutes les données d'un monde (lieux, PNJ, quêtes…) pour jouer. */
export async function chargerHistoire(id: string): Promise<DonneesMonde> {
  const brut = Object.entries(FICHIERS).find(([c]) => dossier(c) === id)?.[1];
  const prefixe = `../../../packages/mondes/${id}/`;
  const entrees = Object.entries(DONNEES).filter(([c]) => c.startsWith(prefixe));
  const fichiers = await Promise.all(entrees.map(async ([c, charger]) => ({ chemin: c.slice(prefixe.length), contenu: await charger() })));
  const r = assemblerMonde(brut, fichiers);
  if (!r.ok) throw new Error(`Histoire « ${id} » invalide : ${r.erreurs.map((e) => `${e.fichier} — ${e.message}`).join(' ; ')}`);
  return r.monde;
}

/** Manifeste des images d'un monde (lieux, PNJ, monstres, objets). */
export function manifesteDe(id: string): ManifesteImages | undefined {
  return Object.entries(MANIFESTES).find(([c]) => dossier(c) === id)?.[1];
}

/** URL d'une image du monde (chargée à la demande). */
export function urlImage(id: string, fichier: string): Promise<string> | undefined {
  return IMAGES[`../../../packages/mondes/${id}/images/${fichier}`]?.();
}

/** URL de la voix enregistrée d'un plan de scène (`voix/<scene>-<plan>.mp3`), si elle existe. */
export function urlVoix(id: string, nom: string): Promise<string> | undefined {
  const cle = Object.keys(VOIX).find((c) => c.startsWith(`../../../packages/mondes/${id}/voix/${nom}.`));
  return cle ? VOIX[cle]!() : undefined;
}
