// Images du plateau de combat, communes à tous les mondes : le bestiaire (une image en pied par profil de monstre du SRD)
// et les textures de terrain (packages/donnees/visuel/terrains.json).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { RACINE, type Charte, type Element } from './charte';

const Terrains = z.object({ terrains: z.record(z.object({ nom: z.string(), sol: z.string(), difficile: z.string(), mur: z.string() })) });

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

/** Trois textures par ambiance (`foret-sol`, `foret-difficile`, `foret-mur`…), vues exactement de dessus. */
export function elementsTerrains(charte: Charte): Element[] {
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
