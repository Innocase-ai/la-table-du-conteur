// Préparer ses sorts (SRD 5.2.1) : quand un héros peut changer sa liste de sorts préparés (et un sort mineur), et ce qu'il peut
// changer. Le SRD fixe le moment par classe : Clerc, Druide et Magicien refont leur liste à chaque Repos long ; Paladin et
// Rôdeur remplacent un sort après un Repos long ; Barde, Ensorceleur et Occultiste remplacent un sort chaque fois qu'ils gagnent
// un niveau ; le Magicien de niveau 5 remplace un sort à la fin d'un Repos court (Mémorisation de sort). Les six lanceurs de sorts
// complets remplacent aussi un sort mineur à chaque niveau gagné.
//
// Le moteur garde ce que le héros PEUT changer (`Personnage.preparation`), donné par un repos ou un niveau et dépensé quand le
// joueur valide sa nouvelle liste (commande `changerSortsPrepares`). Fonctions pures, partagées avec l'écran de préparation.
import type { Donnees } from '../donnees';
import { calculerFiche, type ChoixPersonnage } from '../fiche';
import type { DroitsPreparation, Personnage } from '../personnage';

/** Ce que le SRD permet à une classe, par moment. */
export interface ReglePreparation {
  /** Après un Repos long : toute la liste (`'tous'`), un nombre de sorts à remplacer, ou rien. */
  reposLong: 'tous' | number;
  /** Après un Repos court : un nombre de remplacements, si l'aptitude qui l'accorde est acquise. */
  reposCourt?: { aptitude: string; nombre: number };
  /** Sorts préparés remplaçables à chaque niveau de classe gagné. */
  parNiveau: number;
  /** Sorts mineurs remplaçables à chaque niveau de classe gagné. */
  mineursParNiveau: number;
}

export const REGLES_PREPARATION: Record<string, ReglePreparation> = {
  clerc: { reposLong: 'tous', parNiveau: 0, mineursParNiveau: 1 },
  druide: { reposLong: 'tous', parNiveau: 0, mineursParNiveau: 1 },
  magicien: { reposLong: 'tous', reposCourt: { aptitude: 'memorisation-de-sort', nombre: 1 }, parNiveau: 0, mineursParNiveau: 1 },
  paladin: { reposLong: 1, parNiveau: 0, mineursParNiveau: 0 },
  rodeur: { reposLong: 1, parNiveau: 0, mineursParNiveau: 0 },
  barde: { reposLong: 0, parNiveau: 1, mineursParNiveau: 1 },
  ensorceleur: { reposLong: 0, parNiveau: 1, mineursParNiveau: 1 },
  occultiste: { reposLong: 0, parNiveau: 1, mineursParNiveau: 1 },
};

/** La règle de la classe d'un héros qui lance des sorts ; `undefined` sinon. */
export function reglePreparation(p: Pick<Personnage, 'fiche'>): ReglePreparation | undefined {
  return p.fiche.incantation ? REGLES_PREPARATION[p.fiche.classe] : undefined;
}

/** Le droit est-il vide (rien à changer) ? */
const vide = (d: DroitsPreparation | undefined): boolean => !d || (!d.prepares && !d.mineurs);

/** Réunit deux droits : « tous » l'emporte ; les nombres s'ajoutent (niveaux) ou se recouvrent (repos), selon `mode`. */
function reunir(a: DroitsPreparation | undefined, b: DroitsPreparation, mode: 'ajouter' | 'recouvrir'): DroitsPreparation {
  const n = (x: number | 'tous', y: number | 'tous') => (x === 'tous' || y === 'tous' ? ('tous' as const) : mode === 'ajouter' ? x + y : Math.max(x, y));
  return { prepares: n(a?.prepares ?? 0, b.prepares), mineurs: (mode === 'ajouter' ? (a?.mineurs ?? 0) + b.mineurs : Math.max(a?.mineurs ?? 0, b.mineurs)) };
}

const egaux = (a: DroitsPreparation | undefined, b: DroitsPreparation | undefined): boolean => (a?.prepares ?? 0) === (b?.prepares ?? 0) && (a?.mineurs ?? 0) === (b?.mineurs ?? 0);

function poser(p: Personnage, d: DroitsPreparation): boolean {
  const avant = p.preparation;
  if (vide(d)) delete p.preparation;
  else p.preparation = d;
  return !egaux(avant, p.preparation);
}

/**
 * Un repos vient de finir : le héros gagne le droit de changer ses sorts (selon sa classe). Renvoie la phrase à dire si quelque
 * chose a changé. Un héros sans `choix` (jeux d'essai) ne peut rien changer : il ne reçoit rien. Le droit d'un repos ne se
 * cumule pas avec lui-même : on le remet au plus haut.
 */
export function accorderApresRepos(p: Personnage, duree: 'court' | 'long'): string | undefined {
  const regle = reglePreparation(p);
  if (!regle || !p.choix) return undefined;
  let prepares: number | 'tous' = 0;
  if (duree === 'long') prepares = regle.reposLong;
  else if (regle.reposCourt && p.fiche.aptitudes.some((a) => a.id === regle.reposCourt!.aptitude)) prepares = regle.reposCourt.nombre;
  if (!prepares) return undefined;
  return poser(p, reunir(p.preparation, { prepares, mineurs: 0 }, 'recouvrir')) ? phraseDroits(p) : undefined;
}

/** Un niveau de classe vient d'être gagné : remplacements de sorts préparés et de sorts mineurs gagnés. */
export function accorderApresNiveau(p: Personnage): string | undefined {
  const regle = reglePreparation(p);
  if (!regle || !p.choix || (!regle.parNiveau && !regle.mineursParNiveau)) return undefined;
  return poser(p, reunir(p.preparation, { prepares: regle.parNiveau, mineurs: regle.mineursParNiveau }, 'ajouter')) ? phraseDroits(p) : undefined;
}

const sorts = (n: number, mineurs = false) => `${n} sort${n > 1 ? 's' : ''}${mineurs ? ' mineur' + (n > 1 ? 's' : '') : ' préparé' + (n > 1 ? 's' : '')}`;

/** Ce que le héros peut changer maintenant, en mots (« toute sa liste de sorts préparés », « 1 sort préparé et 1 sort mineur »). */
export function descriptionDroits(d: DroitsPreparation | undefined): string {
  if (vide(d)) return '';
  const parties: string[] = [];
  if (d!.prepares === 'tous') parties.push('toute sa liste de sorts préparés');
  else if (d!.prepares) parties.push(sorts(d!.prepares));
  if (d!.mineurs) parties.push(sorts(d!.mineurs, true));
  return parties.join(' et ');
}

function phraseDroits(p: Personnage): string {
  return `${p.nom} peut changer ${descriptionDroits(p.preparation)} (onglet Grimoire)`;
}

/** Quand le héros pourra changer ses sorts, en une phrase (pour ce qu'on lit quand il n'a pas encore le droit). */
export function prochainChangement(p: Pick<Personnage, 'fiche'>): string {
  const r = reglePreparation(p);
  if (!r) return '';
  const quand: string[] = [];
  if (r.reposLong) quand.push(r.reposLong === 'tous' ? 'toute la liste après un Repos long' : `${r.reposLong} sort après un Repos long`);
  if (r.reposCourt && p.fiche.aptitudes.some((a) => a.id === r.reposCourt!.aptitude)) quand.push(`${r.reposCourt.nombre} sort après un Repos court`);
  if (r.parNiveau) quand.push(`${r.parNiveau} sort à chaque niveau gagné`);
  if (!r.reposLong && r.mineursParNiveau && !r.parNiveau) quand.push('un sort mineur à chaque niveau gagné');
  return quand.join(' ; ');
}

export type ResultatPreparation =
  | { ok: true; choix: ChoixPersonnage; sortsPrepares: string[]; sortsMineurs: string[]; ajoutes: { prepares: string[]; mineurs: string[] }; retires: { prepares: string[]; mineurs: string[] }; reste: DroitsPreparation | undefined }
  | { ok: false; erreur: string };

/**
 * Valide la liste proposée par le joueur : le héros a-t-il le droit de changer, en remplace-t-il au plus ce que son droit permet,
 * et les choix donnent-ils une fiche valide (nombre de sorts préparés permis, liste de la classe, niveau des emplacements) ?
 * Ne modifie rien : sert à l'écran (bouton « Valider ») comme à la commande.
 */
export function verifierPreparation(h: Personnage, propose: { prepares: string[]; mineurs?: string[] }, donnees: Donnees): ResultatPreparation {
  if (!h.choix || !h.fiche.incantation) return { ok: false, erreur: `${h.nom} ne prépare pas de sorts.` };
  const droit = h.preparation;
  if (vide(droit)) return { ok: false, erreur: `${h.nom} ne peut pas changer ses sorts maintenant (${prochainChangement(h) || 'jamais'}).` };
  const avantP = h.choix.sortsPrepares ?? [];
  const avantM = h.choix.sortsMineurs ?? [];
  const prepares = [...new Set(propose.prepares)];
  const mineurs = [...new Set(propose.mineurs ?? avantM)];
  const nouveauxP = prepares.filter((id) => !avantP.includes(id));
  const nouveauxM = mineurs.filter((id) => !avantM.includes(id));
  const retiresP = avantP.filter((id) => !prepares.includes(id));
  const retiresM = avantM.filter((id) => !mineurs.includes(id));
  if (!nouveauxP.length && !nouveauxM.length && !retiresP.length && !retiresM.length) return { ok: false, erreur: 'Rien n’a changé.' };
  const permisP = droit!.prepares;
  if ((nouveauxP.length || retiresP.length) && permisP !== 'tous' && Math.max(nouveauxP.length, retiresP.length) > permisP) {
    return { ok: false, erreur: permisP ? `${h.nom} ne peut remplacer que ${sorts(permisP)}.` : `${h.nom} ne peut pas changer ses sorts préparés maintenant.` };
  }
  if ((nouveauxM.length || retiresM.length) && Math.max(nouveauxM.length, retiresM.length) > droit!.mineurs) {
    return { ok: false, erreur: droit!.mineurs ? `${h.nom} ne peut remplacer que ${sorts(droit!.mineurs, true)}.` : `${h.nom} ne peut pas changer ses sorts mineurs maintenant.` };
  }
  const choix: ChoixPersonnage = { ...h.choix, sortsPrepares: prepares, sortsMineurs: mineurs };
  const r = calculerFiche(choix, donnees);
  if (!r.ok) return { ok: false, erreur: r.erreurs[0] ?? 'Ces sorts ne donnent pas un personnage valide.' };
  // Le droit dépensé : « tous » s'éteint dès qu'on valide ; un nombre diminue de ce qui a été remplacé.
  const nP = Math.max(nouveauxP.length, retiresP.length);
  const nM = Math.max(nouveauxM.length, retiresM.length);
  const reste: DroitsPreparation = {
    prepares: nouveauxP.length || retiresP.length ? (permisP === 'tous' ? 0 : Math.max(0, permisP - nP)) : permisP,
    mineurs: Math.max(0, droit!.mineurs - nM),
  };
  return { ok: true, choix, sortsPrepares: r.fiche.sortsPrepares, sortsMineurs: r.fiche.sortsMineurs, ajoutes: { prepares: nouveauxP, mineurs: nouveauxM }, retires: { prepares: retiresP, mineurs: retiresM }, reste: vide(reste) ? undefined : reste };
}
