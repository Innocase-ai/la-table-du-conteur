// Les outils du conteur : les commandes du moteur, décrites au modèle. Le conteur ne change jamais la partie lui-même : il
// demande, le moteur vérifie, lance les dés et applique (ou refuse, et le refus se raconte).
import type { Moteur } from '../noyau/moteur';
import { versSchemaJson, type SchemaJson } from './schema-json';

export interface OutilLLM {
  type: 'function';
  function: { name: string; description: string; parameters: SchemaJson };
}

/**
 * Les commandes que le conteur n'appelle pas : le début de l'histoire, le réglage d'un combat (c'est l'écran de combat),
 * les scènes narrées, la pastille « nouveau », ce qui détruit (jeter) et ses propres commandes de journal.
 */
export const COMMANDES_HORS_CONTEUR = new Set([
  'commencer',
  'reglerRencontre',
  'terminerScene',
  'revoirScene',
  'voirObjet',
  'jeterObjet',
  'saisie',
  'raconter',
]);

/** L'outil qui termine un tour : les actions que le joueur peut tenter ensuite. */
export const PROPOSER_ACTIONS = 'proposer_actions';

/**
 * La liste des outils est la même à chaque tour (c'est ce qui permet de la garder en cache) : le moteur refuse ce qui est
 * impossible maintenant, avec la raison.
 */
export function outilsDuConteur(moteur: Moteur): OutilLLM[] {
  const outils: OutilLLM[] = moteur
    .commandes()
    .filter((c) => !COMMANDES_HORS_CONTEUR.has(c.type))
    .map((c) => ({ type: 'function' as const, function: { name: c.type, description: c.description, parameters: versSchemaJson(c.commande.entree) } }));
  outils.push({
    type: 'function',
    function: {
      name: PROPOSER_ACTIONS,
      description: 'À appeler en dernier, après ta narration : 2 à 4 actions courtes que le groupe pourrait tenter maintenant (elles deviennent des boutons).',
      parameters: {
        type: 'object',
        properties: { actions: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 4 } },
        required: ['actions'],
        additionalProperties: false,
      },
    },
  });
  return outils;
}
