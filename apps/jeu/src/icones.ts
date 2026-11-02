// Pictogrammes de game-icons.net (CC BY 3.0, voir icones/CREDITS.md), affichés en SVG inline.
import type { Combattant } from '@crpg/regles';

const BRUTS = import.meta.glob('./icones/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

/** SVG nettoyés : fond noir retiré, couleur héritée (`currentColor`). */
const SVG: Record<string, string> = Object.fromEntries(
  Object.entries(BRUTS).map(([chemin, brut]) => [
    chemin.replace(/^.*\/(.+)\.svg$/, '$1'),
    brut
      .replace(/<path d="M0 0h512v512H0z"\s*\/>/, '')
      .replace(/fill="#fff"/g, 'fill="currentColor"')
      .replace('<svg ', '<svg aria-hidden="true" focusable="false" '),
  ]),
);

const PAR_MODELE: Record<string, string> = {
  guerrier: 'visored-helm',
  barbare: 'barbarian',
  roublard: 'hood',
  rodeur: 'bowman',
  clerc: 'holy-symbol',
  magicien: 'wizard-face',
  // Classes jouables sans pictogramme propre : on emprunte un voisin.
  paladin: 'holy-symbol',
  ensorceleur: 'wizard-face',
  occultiste: 'hood',
  druide: 'wolf-head',
  moine: 'barbarian',
  barde: 'robber',
  'sbire-gobelin': 'goblin-head',
  'combattant-gobelin': 'goblin-head',
  'chef-gobelin': 'goblin-head',
  'combattant-hobgobelin': 'orc-head',
  'capitaine-hobgobelin': 'warlord-helmet',
  'combattant-gobelours': 'brute',
  'traqueur-gobelours': 'brute',
  loup: 'wolf-head',
  'loup-sanguinaire': 'direwolf',
  squelette: 'skeleton',
  zombi: 'shambling-zombie',
  goule: 'fanged-skull',
  ogre: 'ogre',
  bandit: 'bandit',
  'chef-de-bande': 'robber',
  'combattant-gnoll': 'hyena-head',
  'araignee-geante': 'spider-face',
};

const CHEFS = new Set(['chef-gobelin', 'capitaine-hobgobelin', 'chef-de-bande']);

export function estChef(c: Combattant): boolean {
  return CHEFS.has(c.modele);
}

/** SVG du pictogramme d'un combattant, ou undefined (repli sur les initiales). */
export function svgDe(c: Combattant): string | undefined {
  const nom = PAR_MODELE[c.modele];
  return nom ? SVG[nom] : undefined;
}

/** SVG du pictogramme d'un modèle (classe de héros ou profil de monstre) par son identifiant. */
export function svgModele(modele: string): string | undefined {
  const nom = PAR_MODELE[modele];
  return nom ? SVG[nom] : undefined;
}
