// Qui sait parler ? (F3 du 20/11/2026, docs/PRD-SAGA.md) — le critère des avis « quête qui tue un adversaire qui parle, sans alternative » et
// « négociation contre un adversaire qui ne parle pas ».
//
// Le critère se lit dans le champ `langues` des profils de monstres du SRD, JAMAIS dans leur type de créature : les gobelins sont de type
// « Fée (Gobelinoïde) » et parlent, les dragons parlent, un fantôme du SRD « comprend sans parler ». Trois réponses :
//   - `parle`    : au moins une langue parlée (« commun, gobelin »), ou, faute de langue parlée, la télépathie (« comprend… mais ne parle pas ;
//                  télépathie 36 m » : le kraken se fait comprendre) ; « toutes » aussi ;
//   - `comprend` : « comprend le commun, mais ne parle pas » (golems, squelettes, spectre…), sans télépathie : il entend un ordre, une menace,
//                  mais ne répond pas. C'est une ZONE GRISE : aucun des deux avis ne le vise (on ne dit pas qu'une négociation est impossible,
//                  ni qu'une quête qui le tue sans alternative est une faute) ;
//   - `muet`     : « aucune » (bêtes, plantes, vases, morts-vivants simples…).
// Une remarque entre parenthèses (« commun (ne parle pas sous forme de loup) », « télépathie 36 m (ne permet pas de répondre) ») est ignorée :
// le loup-garou parle sous sa forme humanoïde, c'est celle qu'on rencontre d'abord. Un texte qu'on ne sait pas lire donne `inconnu` (aucun avis).
import type { Donnees } from '../donnees';
import type { DonneesMonde, RencontreMonde } from './schemas';

export type Parole = 'parle' | 'comprend' | 'muet' | 'inconnu';

const sansAccents = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** La parole d'une créature d'après le champ `langues` de son profil. */
export function paroleDeLangues(langues: string | undefined): Parole {
  const texte = sansAccents(langues ?? '').replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  if (!texte) return 'inconnu';
  if (texte === 'aucune') return 'muet';
  const segments = texte.split(';').map((s) => s.trim()).filter(Boolean);
  const telepathie = (s: string) => s.startsWith('telepathie');
  const comprend = (s: string) => s.startsWith('comprend') || /\bne (les )?parle pas\b/.test(s);
  if (segments.some((s) => !telepathie(s) && !comprend(s))) return 'parle';
  if (segments.some(telepathie)) return 'parle';
  if (segments.some(comprend)) return 'comprend';
  return 'inconnu';
}

/** La parole d'un profil de monstre du SRD (`inconnu` si le profil n'existe pas). */
export function paroleDeProfil(srd: Donnees, profil: string): Parole {
  return paroleDeLangues(srd.monstres.get(profil)?.langues);
}

export interface ParolesRencontre {
  /** Un adversaire au moins parle : un PNJ nommé, ou un profil qui parle. */
  parle: boolean;
  /** Tous les adversaires sont muets (ni un PNJ, ni un profil qui parle ou qui comprend) : une parole ne les atteint pas. */
  muette: boolean;
  adversaires: { profil: string; parole: Parole }[];
}

/** Ce que parlent les adversaires d'une rencontre. Un adversaire qui est un PNJ du monde (`pnj`) parle toujours : il a des sujets. */
export function parolesDeRencontre(srd: Donnees, r: RencontreMonde): ParolesRencontre {
  const adversaires = r.monstres.map((m) => ({ profil: m.profil, parole: (m.pnj ? 'parle' : paroleDeProfil(srd, m.profil)) as Parole }));
  return {
    parle: adversaires.some((a) => a.parole === 'parle'),
    muette: adversaires.length > 0 && adversaires.every((a) => a.parole === 'muet'),
    adversaires,
  };
}

/**
 * Une alternative qui passe par la parole. Deux sens, parce que les deux avis n'ont pas la même prudence :
 *  - strict (`large: false`, avis « négociation contre un adversaire muet ») : un jet de Persuasion ou de Tromperie, ou un nom qui parle de parler,
 *    de marchander, de négocier, de convaincre, de supplier, de promettre, de corrompre. Intimider peut se faire par un geste (des torches contre des
 *    loups), s'incliner devant une armure animée est un rite : ni l'un ni l'autre ne sont jugés ;
 *  - large (`large: true`, avis « on tue un adversaire qui parle sans issue ») : en plus, Intimidation, payer, acheter, offrir, montrer une lettre, se
 *    faire passer pour quelqu'un, écouter, rançon, tribut : tout ce qui offre à un adversaire qui parle une autre issue que le combat.
 */
export function estAlternativeDeParole(a: RencontreMonde['alternatives'][number], large = false): boolean {
  const competence = a.jet?.competence;
  if (competence === 'persuasion' || competence === 'tromperie') return true;
  const nom = sansAccents(`${a.id} ${a.nom}`);
  if (/\b(parl|marchand|negoci|convain|supplie|promett|corromp|soudoi|discut)/.test(nom)) return true;
  if (!large) return false;
  if (competence === 'intimidation') return true;
  return /\b(pay|achet|offr|montr|ranc|tribut|se faire passer|lui dire|ecout)/.test(nom);
}

/** Les alternatives d'une rencontre qui passent par la parole (sens strict par défaut, large pour l'avis « tue sans issue »). */
export const alternativesDeParole = (r: RencontreMonde, large = false) => r.alternatives.filter((a) => estAlternativeDeParole(a, large));

/** Dit si le monde contient la rencontre (utile aux avis qui lisent un identifiant de condition). */
export const rencontreDe = (dm: DonneesMonde, id: string): RencontreMonde | undefined => dm.rencontres.get(id);
