// Le schéma de chaque dossier d'un monde : ce que l'atelier utilise pour valider une fiche pendant qu'on la modifie.
import type { ZodTypeAny } from 'zod';
import { Examen } from './examens-donnees';
import { Dilemme } from './dilemmes-donnees';
import { Interjection } from './interjections-donnees';
import { Question } from './codex-donnees';
import { Savoir } from './savoirs-donnees';
import { Enigme, EvenementMonde, Faction, Fait, Fin, Jauge, Lieu, Objet, Piege, Pnj, Quete, RencontreMonde, TableButin, Tresor } from './schemas';

const SCHEMAS: Record<string, ZodTypeAny> = {
  lieux: Lieu,
  pnj: Pnj,
  objets: Objet,
  tresors: Tresor,
  tables: TableButin,
  rencontres: RencontreMonde,
  pieges: Piege,
  enigmes: Enigme,
  quetes: Quete,
  factions: Faction,
  jauges: Jauge,
  evenements: EvenementMonde,
  fins: Fin,
  faits: Fait,
  dilemmes: Dilemme,
  examens: Examen,
  codex: Question,
  interjections: Interjection,
  savoirs: Savoir,
};

/** Le schéma d'un dossier de monde (`lieux`, `pnj`, `dilemmes`…), ou `undefined` pour un dossier qu'on ne sait pas valider (`scenes`). */
export const schemaDuDossier = (dossier: string): ZodTypeAny | undefined => SCHEMAS[dossier];

/** Les dossiers qu'on sait éditer. */
export const DOSSIERS_EDITABLES: string[] = Object.keys(SCHEMAS);

/** Le champ qui identifie un élément du dossier : `id`, sauf les fiches de savoir (le PNJ). */
export const champIdentifiant = (dossier: string): 'id' | 'pnj' => (dossier === 'savoirs' ? 'pnj' : 'id');

/** Les noms de champs que le schéma d'un dossier connaît (pour proposer ceux qu'une fiche n'a pas encore). */
export function champsDuSchema(dossier: string): string[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let s: any = SCHEMAS[dossier];
  while (s?._def?.typeName === 'ZodEffects') s = s._def.schema;
  return s?._def?.typeName === 'ZodObject' ? Object.keys(s.shape as Record<string, unknown>) : [];
}
