// Galerie de portraits du créateur de personnages : 54 visages génériques (9 espèces × 2 sexes × 3), communs à
// tous les mondes. Les descriptions sont dans packages/donnees/visuel/galerie.json ; les ids viennent de portraits.json.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { RACINE, type Charte, type Element } from './charte';

const Galerie = z.object({ especes: z.record(z.string()), portraits: z.record(z.string()) });
const Entrees = z.array(z.object({ id: z.string(), espece: z.string(), sexe: z.enum(['F', 'M']), numero: z.number() }));

const SEXES = { F: 'woman', M: 'man' } as const;

export function chargerGalerie(dossier = join(RACINE, 'packages/donnees/visuel')) {
  return {
    galerie: Galerie.parse(JSON.parse(readFileSync(join(dossier, 'galerie.json'), 'utf8'))),
    entrees: Entrees.parse(JSON.parse(readFileSync(join(dossier, 'portraits.json'), 'utf8'))),
  };
}

/** Un portrait par entrée de portraits.json : visage seul, tenue de voyage neutre (aucun équipement de classe). */
export function elementsGalerie(charte: Charte, dossier?: string): Element[] {
  const { galerie, entrees } = chargerGalerie(dossier);
  return entrees.map((e) => {
    const espece = galerie.especes[e.espece];
    const variante = galerie.portraits[e.id];
    if (!espece || !variante) throw new Error(`Galerie : description manquante pour « ${e.id} ».`);
    return {
      id: e.id,
      groupe: 'portraits',
      nom: `Portrait ${e.id}`,
      format: 'carre',
      references: [],
      prompt: [
        charte.style,
        `Character portrait of a ${SEXES[e.sexe]} of species ${espece}. This character: ${variante}.`,
        'Plain simple travelling clothes in muted colours, no armour, no weapons, no holy symbol, no spellbook, no tools: a blank-slate adventurer who could be of any profession.',
        'Head and shoulders, three-quarter view, looking toward the viewer, neutral dark background with a soft warm rim light. Highly detailed face with a distinctive, memorable design.',
        charte.contraintes,
      ].join('\n'),
    };
  });
}
