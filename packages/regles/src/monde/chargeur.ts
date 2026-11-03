// Chargement d'un monde depuis son dossier (Node : outils, tests, serveur). Le client web importe les JSON avec Vite.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ManifesteImages } from './images';
import { assemblerMonde, DOSSIERS_MEDIAS, DOSSIERS_MONDE, type ErreurChargement, type FichierMonde, type ResultatChargement } from './assemblage';

export const RACINE_MONDES = join(import.meta.dirname, '../../../mondes');

export type { ErreurChargement, ResultatChargement } from './assemblage';

/** Charge un monde depuis son dossier : lit les fichiers JSON, puis les assemble et les valide. */
export function chargerMonde(dossier: string): ResultatChargement {
  let brut: unknown;
  try {
    brut = JSON.parse(readFileSync(join(dossier, 'monde.json'), 'utf8'));
  } catch (e) {
    return { ok: false, erreurs: [{ fichier: 'monde.json', message: `introuvable ou illisible : ${(e as Error).message}` }] };
  }
  const fichiers: FichierMonde[] = [];
  const erreurs: ErreurChargement[] = [];
  // Les dossiers du format de base et ceux des modules (`scenes/`…) ; pas les images ni les voix.
  const sousDossiers = readdirSync(dossier, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !(DOSSIERS_MEDIAS as readonly string[]).includes(d.name))
    .map((d) => d.name);
  for (const nom of new Set([...DOSSIERS_MONDE, ...sousDossiers])) {
    const chemin = join(dossier, nom);
    if (!existsSync(chemin)) continue;
    for (const f of readdirSync(chemin).filter((x) => x.endsWith('.json'))) {
      try {
        fichiers.push({ chemin: `${nom}/${f}`, contenu: JSON.parse(readFileSync(join(chemin, f), 'utf8')) });
      } catch (e) {
        erreurs.push({ fichier: `${nom}/${f}`, message: `JSON illisible : ${(e as Error).message}` });
      }
    }
  }
  return assemblerMonde(brut, fichiers, erreurs);
}

/** Manifeste des images du monde (`images/manifeste.json`), ou undefined si le monde n'a pas encore d'images. */
export function chargerManifesteImages(dossier: string): ManifesteImages | undefined {
  const chemin = join(dossier, 'images', 'manifeste.json');
  if (!existsSync(chemin)) return undefined;
  return ManifesteImages.parse(JSON.parse(readFileSync(chemin, 'utf8')));
}

/** Dossiers de mondes disponibles dans packages/mondes. */
export function listerMondes(racine = RACINE_MONDES): string[] {
  if (!existsSync(racine)) return [];
  return readdirSync(racine, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(racine, d.name, 'monde.json')))
    .map((d) => d.name)
    .sort();
}
