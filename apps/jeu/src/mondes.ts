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
      // Les brouillons n'existent qu'en développement (`pnpm jeu`), pour qu'un auteur joue son histoire pendant qu'il l'écrit :
      // le build de production (`import.meta.env.DEV` vaut `false`) ne propose que les histoires publiées.
      if (!r.success || (r.data.statut !== 'publie' && !import.meta.env.DEV)) return [];
      const id = dossier(chemin);
      const manifeste = Object.entries(MANIFESTES).find(([c]) => dossier(c) === id)?.[1];
      // Couverture : l'image du lieu qui porte le nom du monde, sinon celle du lieu de départ.
      const fichier = manifeste?.lieux[r.data.id] ?? manifeste?.lieux[r.data.depart.lieu];
      const chargeur = fichier ? IMAGES[`../../../packages/mondes/${id}/images/${fichier}`] : undefined;
      const brute = Object.entries(ESTIMATIONS).find(([c]) => dossier(c) === id)?.[1];
      const estimation = brute ? Estimation.safeParse(brute) : undefined;
      const monde = r.data.statut === 'publie' ? r.data : { ...r.data, nom: `${r.data.nom} (brouillon)` };
      return [{ monde, couverture: chargeur, estimation: estimation?.success ? estimation.data : undefined }];
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

// Bibliothèque commune venue des histoires (portraits de PNJ et objets propres) : `communs/pnj|objets/<id>.webp`, citée par un manifeste
// sous la forme `commun:pnj/<id>` ou `commun:objets/<id>` (`pnpm images communs`).
const COMMUNS_HISTOIRES = import.meta.glob<string>('./communs/*/*.webp', { query: '?url', import: 'default' });

/** URL d'une image du monde (chargée à la demande), ou de l'asset commun qu'il cite. */
export function urlImage(id: string, fichier: string): Promise<string> | undefined {
  const commun = /^commun:(pnj|objets)\/([a-z0-9-]+)$/.exec(fichier);
  if (commun) return COMMUNS_HISTOIRES[`./communs/${commun[1]}/${commun[2]}.webp`]?.();
  return IMAGES[`../../../packages/mondes/${id}/images/${fichier}`]?.();
}

/** URL de la voix enregistrée d'un plan de scène (`voix/<scene>-<plan>.mp3`), si elle existe. */
export function urlVoix(id: string, nom: string): Promise<string> | undefined {
  const cle = Object.keys(VOIX).find((c) => c.startsWith(`../../../packages/mondes/${id}/voix/${nom}.`));
  return cle ? VOIX[cle]!() : undefined;
}

// Les images communes à tous les mondes (équipement du SRD : armes et armures), livrées avec le moteur et non avec
// chaque histoire : un monde qui cite `epee-longue` n'a pas à la faire dessiner. Dossier `equipement/<id>.webp`.
const COMMUNES = import.meta.glob<string>('./equipement/*.webp', { query: '?url', import: 'default' });

/** URL d'une image commune du moteur (`groupe` : pour l'instant `equipement`), si elle existe. */
export function urlImageCommune(groupe: string, id: string): Promise<string> | undefined {
  return groupe === 'equipement' ? COMMUNES[`./equipement/${id}.webp`]?.() : undefined;
}

// La bible d'un monde (canon et secrets, réservés au conteur) : chargée à la demande.
const BIBLES = import.meta.glob<string>('../../../packages/mondes/*/BIBLE.md', { query: '?raw', import: 'default' });

export async function bibleDe(id: string): Promise<string> {
  const cle = Object.keys(BIBLES).find((c) => dossier(c) === id);
  return cle ? BIBLES[cle]!() : '';
}

