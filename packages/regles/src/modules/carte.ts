// Module Carte : la carte du monde, avec le repère « vous êtes ici » et le brouillard (voir monde/carte.ts). Il ne garde aucun
// état propre (tout se déduit de `lieuxVisites` et des passages découverts) et n'ajoute aucune commande : se déplacer sur la
// carte, c'est la commande `aller` du module Exploration, donc la liste d'outils du conteur ne change pas.
import { creerGenerateur } from '../des';
import { carteDuMonde } from '../monde/carte';
import type { Encart, Module, Partie } from '../noyau/types';

export const moduleCarte: Module = {
  id: 'carte',
  encarts: (ctx, p: Partie): Encart[] => {
    const monde = carteDuMonde({ dm: ctx.dm, etat: p.etat, groupe: p.groupe, gen: creerGenerateur(0), srd: ctx.srd });
    return [{ onglet: 'Carte', id: 'carte-monde', titre: 'Carte du monde', ordre: 0, carte: monde }];
  },
};
