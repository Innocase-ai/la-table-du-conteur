// L'écran de crochetage : quand le groupe crochète ou force un contenant ou un passage verrouillé, une animation plein écran et
// un compte à rebours dont la durée dépend du bonus du héros (compétence et maîtrise, donc son niveau). Tout est pur : le
// moteur a déjà tout réglé (jet de repérage des témoins, jet d'ouverture, attitude des témoins) ; ces règles disent seulement
// quoi montrer, à partir des nouvelles entrées du journal.
import type { EvenementJeu, Jet } from '@crpg/regles';

export type MethodeOuverture = 'crocheter' | 'forcer';

/** Ce que le journal raconte d'une ouverture tentée. */
export interface Ouverture {
  methode: MethodeOuverture;
  /** Le héros qui a agi. */
  heros: string;
  /** Le jet d'ouverture (Escamotage pour crocheter, Athlétisme pour forcer) ; absent quand des témoins ont arrêté le groupe avant. */
  jet?: Jet;
  reussie: boolean;
  /** Des témoins ont vu le groupe et l'ont arrêté net : pas d'ouverture. */
  interrompue: boolean;
  /** L'objet ou le passage visé, tel que le moteur le nomme (« Le tiroir de la caisse », « le passage vers … »). */
  objet: string;
  /** Le jet de Discrétion contre les témoins, s'il y en avait. */
  guet?: Jet;
  /** Le constat des témoins qui ont arrêté le groupe (« X vous a vus forcer … et vous arrête net. »). */
  repere?: string;
}

/** Une seconde d'écran = une seconde de compte à rebours, jamais de fraction. */
export const MS_PAR_SECONDE = 1000;

/**
 * Le temps du crochetage affiché, en secondes entières : plus le bonus du héros est haut (compétence, maîtrise, expertise,
 * donc son niveau) par rapport au DD, plus c'est court. Crocheter : de 3 à 15 s. Forcer, brutal et vite fait : de 2 à 6 s.
 */
export function dureeCrochetage(bonus: number, dd: number, methode: MethodeOuverture): number {
  const marge = dd - bonus;
  return methode === 'crocheter' ? Math.min(15, Math.max(3, Math.round(3 + marge * 0.9))) : Math.min(6, Math.max(2, Math.round(2 + marge * 0.35)));
}

const VERBES: Record<MethodeOuverture, { reussi: string; rate: string }> = {
  crocheter: { reussi: 'crochète', rate: 'ne parvient pas à crocheter' },
  forcer: { reussi: 'force', rate: 'ne parvient pas à forcer' },
};

/** Le constat du moteur d'après un jet d'ouverture : « {nom} crochète {objet}. » ou « {nom} ne parvient pas à forcer {objet}. » */
function lireConstat(nom: string, texte: string): { methode: MethodeOuverture; reussie: boolean; objet: string } | undefined {
  for (const methode of ['crocheter', 'forcer'] as const) {
    for (const reussie of [true, false]) {
      const debut = `${nom} ${reussie ? VERBES[methode].reussi : VERBES[methode].rate} `;
      if (texte.startsWith(debut) && texte.endsWith('.')) return { methode, reussie, objet: texte.slice(debut.length, -1) };
    }
  }
  return undefined;
}

/** Les témoins qui arrêtent le groupe : « X vous a vus forcer … et vous arrête net. » ou, déjà en alerte, « X vous surveille de près : impossible de … ». */
const ARRET = /^(.+?) vous (?:a|ont) vus (crocheter|forcer) (.+) et vous arrête(?:nt)? net\.$/;
const ALERTE = /^(.+?) vous surveille(?:nt)? de près : impossible de (crocheter|forcer) (.+) sous (?:son|leur) nez\.$/;

/** Une ouverture vient-elle d'être tentée (ou arrêtée) dans ces nouvelles entrées du journal ? (La dernière, s'il y en a plusieurs.) */
export function detecterOuverture(nouvelles: readonly EvenementJeu[]): Ouverture | undefined {
  const constats = nouvelles.flatMap((e) => (e.type === 'constat' ? [e.texte] : []));
  const jets = nouvelles.flatMap((e) => (e.type === 'jet' ? [e.jet] : []));
  let trouvee: Ouverture | undefined;
  for (const jet of jets) {
    if (jet.test !== 'escamotage' && jet.test !== 'athletisme') continue;
    for (const texte of constats) {
      const c = lireConstat(jet.nom, texte);
      if (c) trouvee = { ...c, heros: jet.qui, jet, interrompue: false, guet: jets.find((x) => x.test === 'discretion' && x.qui === jet.qui) };
    }
  }
  if (trouvee) return trouvee;
  // Pas d'ouverture : des témoins ont arrêté le groupe (jet de Discrétion raté) ou le surveillaient déjà (aucun jet).
  for (const texte of constats) {
    const m = ARRET.exec(texte) ?? ALERTE.exec(texte);
    if (!m) continue;
    const guet = jets.find((x) => x.test === 'discretion');
    trouvee = { methode: m[2] as MethodeOuverture, heros: guet?.qui ?? '', reussie: false, interrompue: true, objet: m[3]!, guet, repere: texte };
  }
  return trouvee;
}

/** Le temps du compte à rebours avant que des témoins n'arrêtent le groupe : il est interrompu à la moitié. */
export function dureeInterrompue(methode: MethodeOuverture): number {
  return methode === 'crocheter' ? 6 : 4;
}

/** Le message qui conclut l'écran : le verrou cède ou résiste (le crochet glisse, le bois tient). */
export function messageFinal(o: Pick<Ouverture, 'methode' | 'reussie'> & { interrompue?: boolean }): string {
  if (o.interrompue) return 'Stop ! On vous a vus : l’action est interrompue.';
  if (o.reussie) return o.methode === 'crocheter' ? 'Le verrou cède dans un déclic.' : 'Le verrou cède dans un craquement.';
  return o.methode === 'crocheter' ? 'Le crochet glisse : la serrure résiste.' : 'Le verrou tient bon.';
}

/**
 * Le bruitage du résultat : le déclic de la serrure qui s'ouvre (crocheter) ou le craquement du verrou qui cède (forcer).
 * Un échec ne fait pas de bruit de plus : le récit et l'encadré des témoins parlent d'eux-mêmes.
 */
export function sonDuResultat(o: Pick<Ouverture, 'methode' | 'reussie'> & { interrompue?: boolean }): 'serrure-ouverte' | 'porte-forcee' | undefined {
  if (!o.reussie || o.interrompue) return undefined;
  return o.methode === 'crocheter' ? 'serrure-ouverte' : 'porte-forcee';
}
