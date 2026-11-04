// Images du moteur, communes à tous les mondes : le bestiaire (une image en pied par profil de monstre du SRD),
// les textures de terrain (packages/donnees/visuel/terrains.json) et les illustrations de l'interface (écran titre).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { RACINE, type Charte, type Element } from './charte';

const Terrains = z.object({
  terrains: z.record(z.object({ nom: z.string(), sol: z.string(), difficile: z.string(), mur: z.string() })),
  /** Plaques posées sur les cases de n'importe quelle ambiance (eau, boue, neige). */
  reliefs: z.record(z.string()),
});

/** Profils de monstres du SRD livrés (packages/donnees/srd/monstres/<profil>.json). */
export function profilsSrd(racine = join(RACINE, 'packages/donnees/srd/monstres')): string[] {
  return readdirSync(racine).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();
}

/** Une image par profil : le monstre en pied, centré, sur fond neutre (illustration de la fiche en combat). */
export function elementsBestiaire(charte: Charte, profils = profilsSrd()): Element[] {
  return profils.map((id) => {
    const fiche = charte.monstres.find((m) => m.id === id);
    if (!fiche) throw new Error(`Bestiaire : aucune fiche « ${id} » dans charte.json.`);
    return {
      id,
      groupe: 'monstres',
      nom: fiche.nom,
      format: 'carre',
      references: [],
      prompt: [
        charte.style,
        `Full-body figure of ${fiche.nom}: ${fiche.apparence}.`,
        'The whole creature is visible from head to feet, standing in a ready combat stance, centred in the frame, seen from the front at a slight three-quarter angle. Plain dark neutral background with a soft warm rim light, no scenery, no ground clutter, like a painted tabletop miniature.',
        charte.contraintes,
      ].join('\n'),
    };
  });
}

export function chargerTerrains(chemin = join(RACINE, 'packages/donnees/visuel/terrains.json')) {
  return Terrains.parse(JSON.parse(readFileSync(chemin, 'utf8'))).terrains;
}

export function chargerReliefs(chemin = join(RACINE, 'packages/donnees/visuel/terrains.json')) {
  return Terrains.parse(JSON.parse(readFileSync(chemin, 'utf8'))).reliefs;
}

/**
 * Trois textures par ambiance (`foret-sol`, `foret-difficile`, `foret-mur`…), et une par plaque (`relief-eau`,
 * `relief-boue`, `relief-neige`), vues exactement de dessus.
 */
export function elementsTerrains(charte: Charte): Element[] {
  const consigne = (sujet: string) =>
    [
      'Seamless tileable texture for a tabletop battle map, painted in a refined painterly dark fantasy style with visible brushwork, muted earthy palette.',
      `Subject: ${sujet}.`,
      'Strictly top-down orthographic view, perfectly flat, no perspective, no horizon, no shadows cast from one side, even soft lighting. The pattern fills the whole square evenly to the edges, with no central focal object, no frame, no grid lines.',
      charte.contraintes,
    ].join('\n');
  const plaques = Object.entries(chargerReliefs()).map(([id, sujet]) => ({
    id: `relief-${id}`,
    groupe: 'scenes' as const,
    nom: `Plaque : ${id}`,
    format: 'carre' as const,
    references: [],
    prompt: consigne(sujet),
  }));
  return [...elementsAmbiances(charte), ...plaques];
}

function elementsAmbiances(charte: Charte): Element[] {
  return Object.entries(chargerTerrains()).flatMap(([id, t]) =>
    (['sol', 'difficile', 'mur'] as const).map((type) => ({
      id: `${id}-${type}`,
      groupe: 'scenes' as const,
      nom: `${t.nom} : ${type}`,
      format: 'carre' as const,
      references: [],
      prompt: [
        'Seamless tileable texture for a tabletop battle map, painted in a refined painterly dark fantasy style with visible brushwork, muted earthy palette.',
        `Subject: ${t[type]}.`,
        'Strictly top-down orthographic view, perfectly flat, no perspective, no horizon, no shadows cast from one side, even soft lighting. The pattern fills the whole square evenly to the edges, with no central focal object, no frame, no grid lines.',
        charte.contraintes,
      ].join('\n'),
    })),
  );
}

/** Illustrations de l'interface du jeu (écran titre…), sans personnage ni lien avec un monde. */
export function elementsInterface(charte: Charte): Element[] {
  return [
    {
      id: 'ecran-titre',
      groupe: 'scenes',
      nom: 'Écran titre : la table du conteur',
      format: 'paysage',
      references: [],
      prompt: [
        charte.style,
        "A storyteller's table in a dim candle-lit stone study at night: a heavy old oak table covered with an open leather-bound book of tales with illuminated pages, hand-drawn parchment maps of unknown lands, scattered polyhedral dice, carved wooden game tokens, a brass lantern, a quill and an inkwell, melted candles. Warm golden candlelight on the right, deep shadow on the left third of the image (empty dark space for a title). No people, no hands, no creatures.",
        charte.contraintes,
      ].join('\n'),
    },
  ];
}

/** Armes et armures du SRD en anglais, pour le prompt (le catalogue du SRD est commun à tous les mondes). */
const EQUIPEMENT_EN: Record<string, string> = {
  'baton-de-combat': 'a wooden quarterstaff', dague: 'a steel dagger', gourdin: 'a plain wooden club', hachette: 'a small throwing hatchet', javeline: 'a javelin with an iron head',
  lance: 'a spear with a leaf-shaped iron head', 'marteau-leger': 'a light war hammer', "masse-d-armes": 'a flanged iron mace', massue: 'a great knobbed wooden club', serpe: 'a curved sickle with a wooden handle',
  'arbalete-legere': 'a light crossbow', 'arc-court': 'a short wooden bow with a string', flechette: 'a bundle of throwing darts', fronde: 'a leather sling with a stone', cimeterre: 'a curved scimitar',
  coutille: 'a glaive, a long pole with a single-edged blade', 'epee-a-deux-mains': 'a great two-handed greatsword', 'epee-courte': 'a short sword', 'epee-longue': 'a longsword with a cross guard',
  "fleau-d-armes": 'a spiked flail with a chain', fouet: 'a coiled leather whip', 'hache-a-deux-mains': 'a heavy two-handed great axe', "hache-d-armes": 'a single-bladed battleaxe',
  hallebarde: 'a halberd with axe blade and spike', "lance-d-arcon": 'a long jousting lance', "maillet-d-armes": 'a heavy iron maul', 'marteau-de-guerre': 'a war hammer', morgenstern: 'a spiked morningstar',
  'pic-de-guerre': 'a war pick', pique: 'a very long pike', rapiere: 'a slender rapier with a swept hilt', trident: 'a three-pronged trident', 'arbalete-de-poing': 'a small hand crossbow',
  'arbalete-lourde': 'a heavy crossbow with a stirrup', 'arc-long': 'a tall longbow', mousquet: 'an old flintlock musket', pistolet: 'an old flintlock pistol', sarbacane: 'a long wooden blowgun with a few darts',
  'armure-matelassee': 'a padded quilted gambeson armor', 'armure-de-cuir': 'a leather armor cuirass', 'armure-de-cuir-cloute': 'a studded leather armor', 'armure-de-peaux': 'a hide armor made of thick furs',
  'chemise-de-mailles': 'a chain shirt', "armure-d-ecailles": 'a scale mail armor', cuirasse: 'a steel breastplate', 'demi-plate': 'a half plate armor', broigne: 'a ring mail armor with iron rings',
  'cotte-de-mailles': 'a full chain mail hauberk', clibanion: 'a splint armor with vertical iron strips', harnois: 'a full suit of plate armor', bouclier: 'a round wooden shield with an iron boss',
};

/** Une image par arme et par armure du SRD : l'équipement commun, dessiné une fois pour tous les mondes. */
export function elementsEquipement(charte: Charte, ids = Object.keys(EQUIPEMENT_EN)): Element[] {
  return ids.map((id) => {
    const sujet = EQUIPEMENT_EN[id];
    if (!sujet) throw new Error(`Équipement : aucune description de « ${id} » (outils/images/plateau.ts).`);
    return {
      id,
      groupe: 'objets' as const,
      nom: id,
      format: 'carre' as const,
      references: [],
      prompt: [
        charte.style,
        `A single item: ${sujet}.`,
        'Isolated object centred in the frame, seen at a slight three-quarter angle, fully visible, like an inventory icon of a painted tabletop RPG. Plain dark neutral background with a soft warm rim light and a subtle shadow under the object. No hands, no character wearing it, no scenery, no text.',
        charte.contraintes,
      ].join('\n'),
    };
  });
}

