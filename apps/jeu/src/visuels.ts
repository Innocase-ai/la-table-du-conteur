// Images du plateau de combat, communes à tous les mondes : illustrations (portrait de galerie d'un héros, bestiaire pour
// un monstre) et textures de terrain. Générées par `pnpm images bestiaire|terrains`, installées par
// `python3 outils/images/installer.py bestiaire|terrains` (voir docs/M2-IMAGES.md). Une image absente n'empêche rien :
// l'illustration montre alors le jeton à pictogramme.
import type { Combattant, Relief, Terrain, TypeCase } from '@crpg/regles';
import { imagePortrait } from './createur/portraits';

const parNom = (fichiers: Record<string, string>) =>
  new Map(Object.entries(fichiers).map(([chemin, url]) => [chemin.replace(/^.*\/(.+)\.[a-z]+$/, '$1'), url]));

const BESTIAIRE = parNom(import.meta.glob<string>('./bestiaire/*.webp', { eager: true, query: '?url', import: 'default' }));
const INTERFACE = parNom(import.meta.glob<string>('./interface/*.webp', { eager: true, query: '?url', import: 'default' }));
const TERRAINS = parNom(import.meta.glob<string>('./terrains/*.webp', { eager: true, query: '?url', import: 'default' }));

/** Image d'un combattant : le portrait choisi par le joueur, ou le monstre du bestiaire. */
export function imageCombattant(c: Combattant): string | undefined {
  if (c.camp === 'heros') return c.portrait ? imagePortrait(c.portrait) : undefined;
  return BESTIAIRE.get(c.modele);
}

export function textureTerrain(terrain: Terrain | undefined, type: TypeCase): string | undefined {
  return terrain ? TERRAINS.get(`${terrain}-${type}`) : undefined;
}

/** Texture peinte d'un élément en plaque (`relief-eau`, `relief-boue`, `relief-neige`) ; sans elle, un dégradé en tient lieu. */
export function textureRelief(relief: Relief): string | undefined {
  return TERRAINS.get(`relief-${relief}`);
}

/** Illustration de l'interface (`ecran-titre`…), générée par `pnpm images interface`. */
export function imageInterface(id: string): string | undefined {
  return INTERFACE.get(id);
}
