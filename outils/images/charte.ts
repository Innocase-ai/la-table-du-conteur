// Charte graphique et fiches visuelles : données (packages/donnees/visuel/charte.json) et construction des prompts.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

export const Format = z.enum(['carre', 'paysage']);
export type Format = z.infer<typeof Format>;

const Fiche = z.object({ id: z.string(), nom: z.string(), apparence: z.string() });

export const Charte = z.object({
  style: z.string(),
  contraintes: z.string(),
  heros: z.array(Fiche.extend({ resume: z.string() })),
  monstres: z.array(Fiche),
  scenes: z.array(
    z.object({
      id: z.string(),
      nom: z.string(),
      format: Format,
      references: z.array(z.string()),
      monstre: z.string().optional(),
      description: z.string(),
    }),
  ),
});
export type Charte = z.infer<typeof Charte>;

export const RACINE = join(import.meta.dirname, '../..');

export function chargerCharte(chemin = join(RACINE, 'packages/donnees/visuel/charte.json')): Charte {
  return Charte.parse(JSON.parse(readFileSync(chemin, 'utf8')));
}

export interface Element {
  /** Identifiant du fichier produit : `portrait-bran`, `scene-crypte`. */
  id: string;
  groupe: 'portraits' | 'scenes' | 'lieux' | 'pnj' | 'monstres' | 'objets';
  nom: string;
  format: Format;
  prompt: string;
  /** Ids d'éléments dont l'image sert de référence (les portraits des héros présents). */
  references: string[];
}

export function construireElements(charte: Charte): Element[] {
  const portraits: Element[] = charte.heros.map((h) => ({
    id: `portrait-${h.id}`,
    groupe: 'portraits',
    nom: `Portrait de ${h.nom}`,
    format: 'carre',
    references: [],
    prompt: [
      charte.style,
      `Character portrait of ${h.nom}, ${h.apparence}.`,
      'Waist-up, three-quarter view, looking toward the viewer, neutral dark background with a soft warm rim light. Highly detailed face with a distinctive, memorable design.',
      charte.contraintes,
    ].join('\n'),
  }));

  const scenes: Element[] = charte.scenes.map((s) => {
    const refs = s.references.map((id) => {
      const h = charte.heros.find((x) => x.id === id);
      if (!h) throw new Error(`Scène « ${s.id} » : héros inconnu « ${id} ».`);
      return h;
    });
    const monstre = s.monstre ? charte.monstres.find((m) => m.id === s.monstre) : undefined;
    if (s.monstre && !monstre) throw new Error(`Scène « ${s.id} » : monstre inconnu « ${s.monstre} ».`);
    const lignes = [charte.style];
    if (monstre) lignes.push(`Subject: ${monstre.nom}, ${monstre.apparence}.`);
    if (refs.length) {
      lignes.push(
        'The characters must look exactly like the attached reference portraits (same faces, hair, skin, clothing, gear and colours):',
        ...refs.map((h, i) => `- reference image ${i + 1} is ${h.nom}, ${h.apparence}.`),
      );
    }
    lignes.push(s.description, charte.contraintes);
    return {
      id: `scene-${s.id}`,
      groupe: 'scenes',
      nom: s.nom,
      format: s.format,
      references: refs.map((h) => `portrait-${h.id}`),
      prompt: lignes.join('\n'),
    };
  });

  return [...portraits, ...scenes];
}
