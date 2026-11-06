// Images d'un monde, lieu par lieu : le lieu, ses PNJ, les monstres de ses rencontres et ses objets notables.
// Un élément n'est attaché qu'au premier lieu (dans l'ordre du parcours de l'arbre) qui l'utilise.
// Rien ici ne montre les personnages du joueur : seuls le monde et ses habitants sont illustrés.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DonneesMonde, Lieu } from '../../packages/regles/src/monde/schemas';
import type { Charte, Element } from './charte';

const SEXES: Record<string, string> = { F: 'woman', M: 'man' };
// Les fiches sont en français : « halfelin » donnait une oreille d'elfe, d'où la traduction des espèces.
const ESPECES: Record<string, string> = {
  humain: 'human', nain: 'dwarf', elfe: 'elf', halfelin: 'halfling (a small human-like person with ordinary rounded ears, not an elf, no pointed ears)', gnome: 'gnome', tieffelin: 'tiefling', orc: 'orc',
  goliath: 'goliath', gobelin: 'goblin', hobgobelin: 'hobgoblin', ogre: 'ogre', drakeide: 'dragonborn',
};

/** Lieux dans l'ordre du parcours de l'arbre : un lieu, puis ses enfants, dans l'ordre des fichiers. */
export function ordreLieux(dm: DonneesMonde): Lieu[] {
  const enfants = new Map<string | undefined, Lieu[]>();
  for (const l of dm.lieux.values()) enfants.set(l.parent, [...(enfants.get(l.parent) ?? []), l]);
  const ordre: Lieu[] = [];
  const visiter = (l: Lieu) => {
    ordre.push(l);
    for (const e of enfants.get(l.id) ?? []) visiter(e);
  };
  for (const racine of enfants.get(undefined) ?? []) visiter(racine);
  return ordre;
}

interface MonstreSrd {
  nom: string;
  taille?: string;
  type?: string;
}

function lireMonstre(racineSrd: string, profil: string): MonstreSrd | undefined {
  const chemin = join(racineSrd, 'monstres', `${profil}.json`);
  return existsSync(chemin) ? (JSON.parse(readFileSync(chemin, 'utf8')) as MonstreSrd) : undefined;
}

export interface OptionsMonde {
  charte: Charte;
  racineSrd: string;
  /** Remplace le texte descriptif d'un élément (`pnj-<id>`, `lieu-<id>`, `objet-<id>`, `monstre-<profil>`) quand le service refuse la fiche d'origine. */
  retouches?: Record<string, string>;
}

/** Tous les éléments à illustrer, rangés par lieu (clé = id du lieu), dans l'ordre du parcours. */
export function elementsParLieu(dm: DonneesMonde, { charte, racineSrd, retouches = {} }: OptionsMonde): Map<string, Element[]> {
  const resultat = new Map<string, Element[]>();
  const vus = new Set<string>();
  const ajouter = (lieu: string, e: Element) => {
    if (vus.has(e.id)) return;
    vus.add(e.id);
    resultat.get(lieu)!.push(e);
  };
  const pnjParLieu = new Map<string, string[]>();
  for (const p of dm.pnj.values()) pnjParLieu.set(p.lieu, [...(pnjParLieu.get(p.lieu) ?? []), p.id]);

  for (const l of ordreLieux(dm)) {
    resultat.set(l.id, []);
    ajouter(l.id, {
      id: `lieu-${l.id}`,
      groupe: 'lieux',
      nom: l.nom,
      format: 'paysage',
      references: [],
      prompt: [
        charte.style,
        `Environment illustration of a location (the description is in French): ${retouches[`lieu-${l.id}`] ?? l.visuel}${l.ambiance ? ` Mood: ${l.ambiance}` : ''}`,
        'Wide cinematic establishing shot. No people and no creatures in the image: only the place itself.',
        charte.contraintes,
      ].join('\n'),
    });

    for (const id of pnjParLieu.get(l.id) ?? []) {
      const p = dm.pnj.get(id)!;
      ajouter(l.id, {
        id: `pnj-${p.id}`,
        groupe: 'pnj',
        nom: `${p.nom}${p.titre ? `, ${p.titre}` : ''}`,
        format: 'carre',
        references: [],
        prompt: [
          charte.style,
          `Character portrait of ${p.nom}, ${ESPECES[p.espece] ? `a ${SEXES[p.sexe] ?? 'person'} of species "${ESPECES[p.espece]}"` : 'a fantastical non-human being'}${/^(environ )?\d+ ans$/.test(p.age ?? '') ? `, ${p.age}` : ''}. Appearance (in French): ${retouches[`pnj-${p.id}`] ?? p.apparence}`,
          'Waist-up, three-quarter view, looking toward the viewer, neutral dark background with a soft warm rim light. Highly detailed face with a distinctive, memorable design.',
          charte.contraintes,
        ].join('\n'),
      });
    }

    // Les monstres ne sont PAS illustrés par histoire : toutes les histoires puisent dans le catalogue du moteur et utilisent
    // les illustrations communes du bestiaire (`pnpm images bestiaire`, apps/jeu/src/bestiaire/).

    for (const t of [...dm.tresors.values()].filter((x) => x.lieu === l.id)) {
      for (const { objet } of t.contenu.objets) {
        const o = dm.objets.get(objet);
        // Les objets de quête et les clés sont toujours illustrés, même communs : le joueur les voit dans son sac.
        if (!o || (o.rarete === 'commun' && !o.magique && o.categorie !== 'quete' && o.categorie !== 'cle')) continue;
        ajouter(l.id, {
          id: `objet-${o.id}`,
          groupe: 'objets',
          nom: o.nom,
          format: 'carre',
          references: [],
          prompt: [
            charte.style,
            `Item illustration: ${o.nom}. Appearance (in French): ${retouches[`objet-${o.id}`] ?? o.visuel ?? o.resume}`,
            'A single object centred in the frame, resting on a dark worn surface, soft warm side light, fine detail, shallow depth of field.',
            charte.contraintes,
          ].join('\n'),
        });
      }
    }
  }
  return resultat;
}
