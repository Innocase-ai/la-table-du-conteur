// Dialogue avec les PNJ : le conteur choisit un sujet d'après ce que dit le joueur ; le moteur vérifie que le PNJ
// est là, qu'il accepte d'en parler (condition, attitude), révèle les faits et applique les effets. Les tentatives
// d'influence (persuader, intimider, tromper) passent par un jet.
import { arrondirPieces, estCumulatif, evaluerCondition } from './etat';
import { appliquer, consignerParole, suites, VERBES_OUVRIR, type CompteRendu, type PartieMonde } from './exploration';
import { lieuDuPnj, lieuxDuPnjMaintenant, pnjPresents } from './presence';
import type { Personnage } from '../personnage';
import type { Pnj } from './schemas';
import { testD20 } from '../tests-d20';

/** Seuils d'attitude : en dessous de -30, hostile ; au-dessus de 30, amical. */
export const SEUIL_HOSTILE = -30;
export const SEUIL_AMICAL = 30;

// La présence des PNJ vit dans `presence.ts` (partagée avec l'ouverture des serrures) ; réexportée ici pour les appelants.
export { lieuDuPnj, lieuxDuPnjMaintenant, pnjPresents };

export function attitude(p: PartieMonde, pnj: Pnj): number {
  return p.etat.attitudes[pnj.id] ?? pnj.attitude;
}

/** Les degrés d'attitude que le joueur voit (badge de la boîte de dialogue) : les seuils du moteur, plus deux degrés intermédiaires. */
export type NiveauAttitude = 'hostile' | 'mefiant' | 'neutre' | 'bienveillant' | 'amical';

/** Le degré d'une attitude : hostile (≤ −30, Désavantage aux jets d'influence), méfiant, neutre (−10 à 10), bienveillant, amical (≥ 30, Avantage). */
export function niveauAttitude(valeur: number): NiveauAttitude {
  if (valeur <= SEUIL_HOSTILE) return 'hostile';
  if (valeur >= SEUIL_AMICAL) return 'amical';
  if (valeur < -10) return 'mefiant';
  if (valeur > 10) return 'bienveillant';
  return 'neutre';
}

export const LIBELLES_ATTITUDE: Record<NiveauAttitude, string> = { hostile: 'Hostile', mefiant: 'Méfiant', neutre: 'Neutre', bienveillant: 'Bienveillant', amical: 'Amical' };

// `estCumulatif` vit dans `etat.ts` (l'exploration s'en sert aussi : énigmes) ; réexporté ici pour les appelants.
export { estCumulatif };

/** Sujets que le PNJ accepte d'aborder maintenant. */
export function sujetsDisponibles(p: PartieMonde, pnj: Pnj): Pnj['sujets'] {
  const a = attitude(p, pnj);
  return pnj.sujets.filter(
    (s) =>
      (!s.condition || evaluerCondition(s.condition, p.etat)) &&
      (s.attitudeMin === undefined || a >= s.attitudeMin) &&
      !(s.unique && p.etat.exploration.sujetsVus.includes(`${pnj.id}:${s.id}`)),
  );
}

/** Ce que le joueur lit pour désigner un PNJ : son titre (« Aubergiste de l'Éperon »), jamais le `role`, qui peut contenir un secret (il n'est donné qu'au conteur). Sans titre, le `role` sert de repli. */
export const libelleDuPnj = (pnj: Pick<Pnj, 'titre' | 'role'>): string => pnj.titre ?? pnj.role;

/** Ce que le PNJ répond sur ce sujet maintenant : la première variante dont la condition est vraie, sinon la réponse de base. */
export function reponseDuSujet(p: Pick<PartieMonde, 'etat'>, sujet: Pnj['sujets'][number]): string {
  return sujet.variantes.find((v) => evaluerCondition(v.condition, p.etat))?.reponse ?? sujet.reponse;
}

function vide(): CompteRendu {
  return { ok: true, jets: [], constats: [], revele: [], narrations: [] };
}

function present(p: PartieMonde, id: string): Pnj | CompteRendu {
  const pnj = p.dm.pnj.get(id);
  if (!pnj) return { ...vide(), ok: false, refus: `PNJ inconnu : ${id}.` };
  if (!pnjPresents(p).some((x) => x.id === id)) return { ...vide(), ok: false, refus: `${pnj.nom} n'est pas ici.` };
  return pnj;
}

/**
 * Parler à un PNJ. Sans sujet : sa salutation (selon son attitude) et la liste des sujets qu'il accepte d'aborder.
 * Avec un sujet : sa réponse (à reformuler dans sa voix), les faits qu'il révèle et ses effets.
 */
export function parler(p: PartieMonde, id: string, sujet?: string): CompteRendu {
  const pnj = present(p, id);
  if (!('sujets' in pnj)) return pnj;
  const r = vide();
  const a = attitude(p, pnj);
  if (!sujet) {
    const variante = pnj.salutations.variantes.find((v) => evaluerCondition(v.condition, p.etat));
    // Un PNJ qui a surpris le groupe à crocheter ou à forcer le lui dit d'abord, une seule fois, avant toute autre salutation.
    const vu = p.etat.exploration.vus?.[pnj.id];
    const confrontation = vu && !vu.confronte ? `« Je vous ai vus ${VERBES_OUVRIR[vu.methode]} ${vu.objet}. Vous croyez que je n'ai rien vu ? Expliquez-vous, et vite. »` : undefined;
    if (vu && confrontation) vu.confronte = true;
    const salut = confrontation ?? (variante ? variante.texte : a <= SEUIL_HOSTILE ? (pnj.salutations.hostile ?? pnj.salutations.neutre) : a >= SEUIL_AMICAL ? (pnj.salutations.amical ?? pnj.salutations.neutre) : pnj.salutations.neutre);
    r.narrations.push(salut);
    r.paroles = 1;
    consignerParole(p, pnj.id);
    const dispo = sujetsDisponibles(p, pnj);
    r.constats.push(
      `${pnj.nom} (${pnj.role}, attitude ${a}). Sujets qu'il accepte d'aborder : ${dispo.map((s) => `${s.id} [${s.mots.join(', ')}]`).join(' ; ') || 'aucun pour l\'instant'}.`,
    );
    return r;
  }
  const s = sujetsDisponibles(p, pnj).find((x) => x.id === sujet);
  if (!s) {
    const existe = pnj.sujets.some((x) => x.id === sujet);
    return { ...vide(), ok: false, refus: existe ? `${pnj.nom} ne veut pas (ou plus) parler de cela pour l'instant.` : `${pnj.nom} n'a rien à dire là-dessus.` };
  }
  // Tous les sujets abordés sont notés (un sujet unique disparaît ; les autres restent, marqués « déjà abordé »).
  const deja = p.etat.exploration.sujetsVus.includes(`${pnj.id}:${s.id}`);
  if (!deja) p.etat.exploration.sujetsVus.push(`${pnj.id}:${s.id}`);
  r.narrations.push(reponseDuSujet(p, s));
  r.paroles = 1;
  consignerParole(p, pnj.id);
  // Les effets d'un sujet passent par le même chemin qu'une action : paliers de jauge, événements, quêtes, rencontres, fin.
  // Un sujet qu'on repose ne rapporte qu'une fois : ses gains et pertes (attitude, objets, or, PX, jauge, réputation) ne se
  // rejouent pas, sinon cliquer cinq fois sur « Rejoindre » donnerait la confiance maximale.
  const effets = deja ? s.effets.filter((x) => !estCumulatif(x)) : s.effets;
  appliquer(p, r, [...s.revele.map((f) => ({ fait: f })), ...effets]);
  suites(p, r);
  return r;
}

export type Influence = 'persuasion' | 'intimidation' | 'tromperie';

/** DD d'une tentative d'influence (SRD 5.2.1 : 15 par défaut). L'attitude ne le change pas : elle donne Avantage ou Désavantage. */
export const DD_INFLUENCE = 15;
export function ddInfluence(): number {
  return DD_INFLUENCE;
}

/** Attitude amicale : Avantage au test d'Influence ; hostile : Désavantage ; indifférente : rien (SRD 5.2.1, action Influence). */
export function modeInfluence(attitudePnj: number): 'avantage' | 'desavantage' | undefined {
  return attitudePnj >= SEUIL_AMICAL ? 'avantage' : attitudePnj <= SEUIL_HOSTILE ? 'desavantage' : undefined;
}

/**
 * On attend 24 h avant d'exhorter de nouveau le même PNJ de la même manière : après un échec (SRD), et aussi après un succès
 * qui n'arrachait pas de secret (sinon persuader en boucle mène l'attitude à 100). Le délai d'un secret est propre à ce secret.
 */
export const ATTENTE_INFLUENCE_HEURES = 24;

const heureAbsolue = (p: Pick<PartieMonde, 'etat'>) => p.etat.jour * 24 + (p.etat.heure ?? 8);

/**
 * La clé du délai : la manière, et le secret visé s'il y en a un (rater un secret ne ferme pas les autres conversations).
 * Un secret qui a son propre jet (`jetPropre`) se joue sur sa compétence, pas sur la manière : le délai est alors propre à ce secret
 * seul, quelle que soit la manière (sinon persuader, intimider puis tromper rejoueraient trois fois le même jet : audit du 18/11/2026, M18).
 */
const cleInfluence = (pnjId: string, maniere: Influence, secret?: string, jetPropre = false) =>
  secret && jetPropre ? `${pnjId}:secret:${secret}` : `${pnjId}:${maniere}${secret ? `:${secret}` : ''}`;

/** Heures (entières, par excès) qu'il reste à attendre avant de retenter cette manière avec ce PNJ ; 0 si c'est possible. `jetPropre` : le secret visé a son propre jet. */
export function attenteInfluence(p: Pick<PartieMonde, 'etat'>, pnjId: string, maniere: Influence, secret?: string, jetPropre = false): number {
  // `influenceRatee` garde son nom (sauvegardes) : il note aussi les succès d'une influence sans secret.
  const ratee = p.etat.exploration.influenceRatee?.[cleInfluence(pnjId, maniere, secret, jetPropre)];
  if (ratee === undefined) return 0;
  return Math.max(0, Math.ceil(ratee + ATTENTE_INFLUENCE_HEURES - heureAbsolue(p)));
}

/**
 * Influencer un PNJ. Avec un secret visé (id de fait) : on tente de le lui faire dire (condition, attitude minimale,
 * prix éventuel, jet propre au secret). Sans secret : on gagne (ou perd) de l'attitude.
 */
export function influencer(p: PartieMonde, id: string, maniere: Influence, options: { secret?: string; personnage?: string } = {}): CompteRendu {
  const pnj = present(p, id);
  if (!('sujets' in pnj)) return pnj;
  const r = vide();
  r.paroles = 0;
  const a = attitude(p, pnj);
  // Un secret à jet propre se joue sur sa compétence : c'est dans celle-là qu'on choisit l'orateur, et le délai lui est propre (M18).
  const secretVise = options.secret ? pnj.secrets.find((x) => x.fait === options.secret) : undefined;
  const acteur = choisirOrateur(p, secretVise?.jet?.competence ?? maniere, options.personnage);
  if (!acteur) return { ...vide(), ok: false, refus: 'Personne ne peut le tenter.' };
  const jetPropre = !!secretVise?.jet;
  const attente = attenteInfluence(p, pnj.id, maniere, options.secret, jetPropre);
  if (attente > 0) return { ...vide(), ok: false, refus: `${pnj.nom} n'écoutera pas deux fois les mêmes arguments : réessayez dans ${attente} h, ou autrement.` };
  const mode = modeInfluence(a);
  const noter = () => ((p.etat.exploration.influenceRatee ??= {})[cleInfluence(pnj.id, maniere, options.secret, jetPropre)] = heureAbsolue(p));

  if (options.secret) {
    const sec = secretVise;
    if (!sec || p.etat.faits.includes(sec.fait)) return { ...vide(), ok: false, refus: `${pnj.nom} n'a rien de tel à révéler.` };
    if (sec.condition && !evaluerCondition(sec.condition, p.etat)) return { ...vide(), ok: false, refus: `${pnj.nom} ne lâchera pas cela pour l'instant.` };
    if (sec.attitudeMin !== undefined && a < sec.attitudeMin && !sec.jet) return { ...vide(), ok: false, refus: `${pnj.nom} ne fait pas assez confiance au groupe pour en parler.` };
    if (sec.prix && p.etat.pieces < sec.prix) return { ...vide(), ok: false, refus: `${pnj.nom} veut ${sec.prix} po, que le groupe n'a pas.` };
    // Un secret à prix sans jet propre s'achète : l'or suffit, pas de jet. Avec un jet, on ne paie que s'il réussit.
    const paye = () => {
      if (!sec.prix) return;
      p.etat.pieces = arrondirPieces(p.etat.pieces - sec.prix);
      r.constats.push(`Le groupe paie ${sec.prix} po.`);
    };
    if (sec.prix && !sec.jet) {
      paye();
      appliquer(p, r, [{ fait: sec.fait }]);
      r.constats.push(`${pnj.nom} empoche l'or et parle.`);
      suites(p, r);
      return r;
    }
    const dd = sec.jet?.dd ?? ddInfluence();
    const comp = sec.jet?.competence ?? maniere;
    if (!jet(p, r, acteur, comp, dd, mode)) {
      noter();
      r.ok = true;
      r.constats.push(`${pnj.nom} ne dit rien.`);
      appliquer(p, r, [{ attitude: { pnj: pnj.id, delta: maniere === 'intimidation' ? -10 : -5 } }]);
      suites(p, r);
      return r;
    }
    paye();
    appliquer(p, r, [{ fait: sec.fait }]);
    r.constats.push(`${pnj.nom} finit par parler.`);
    suites(p, r);
    return r;
  }

  const reussi = jet(p, r, acteur, maniere, ddInfluence(), mode);
  noter();
  // L'intimidation fait obéir mais n'attire pas la sympathie ; la tromperie découverte coûte cher.
  const delta = reussi ? (maniere === 'intimidation' ? -5 : 10) : maniere === 'tromperie' ? -15 : maniere === 'intimidation' ? -10 : -5;
  appliquer(p, r, [{ attitude: { pnj: pnj.id, delta } }]);
  r.constats.push(`${acteur.nom} ${reussi ? 'convainc' : 'ne convainc pas'} ${pnj.nom} (attitude ${attitude(p, pnj)}).`);
  // Un PNJ qui avait surpris le groupe et qui se laisse convaincre (ou intimider) cesse de le surveiller.
  if (reussi && p.etat.exploration.vus?.[pnj.id]) {
    delete p.etat.exploration.vus[pnj.id];
    r.constats.push(`${pnj.nom} se calme : ${pnj.sexe === 'F' ? 'elle' : 'il'} ne vous surveille plus.`);
  }
  suites(p, r);
  return r;
}

function choisirOrateur(p: Pick<PartieMonde, 'groupe'>, comp: keyof Personnage['fiche']['competences'], id?: string): Personnage | undefined {
  const vivants = p.groupe.filter((a) => a.pv > 0);
  if (id) return vivants.find((a) => a.id === id);
  return [...vivants].sort((x, y) => y.fiche.competences[comp].bonus - x.fiche.competences[comp].bonus)[0];
}

/**
 * Qui tenterait l'influence et avec quel bonus : pour l'annoncer avant le jet. Comme `influencer`, on prend le meilleur du groupe
 * debout dans la manière choisie ; le bonus est celui de la compétence réellement testée (celle d'un secret peut être une autre).
 */
export function meilleurOrateur(p: Pick<PartieMonde, 'groupe'>, maniere: Influence, competence: keyof Personnage['fiche']['competences'] = maniere): { id: string; nom: string; bonus: number } | undefined {
  // Le meilleur dans la compétence réellement testée (celle d'un secret à jet propre peut différer de la manière).
  const a = choisirOrateur(p, competence);
  return a && { id: a.id, nom: a.nom, bonus: a.fiche.competences[competence].bonus };
}

function jet(p: PartieMonde, r: CompteRendu, a: Personnage, comp: keyof Personnage['fiche']['competences'], dd: number, mode?: 'avantage' | 'desavantage'): boolean {
  const bonus = a.fiche.competences[comp].bonus;
  const t = testD20({ bonus, dd, avantage: mode === 'avantage', desavantage: mode === 'desavantage' }, p.gen);
  r.jets.push({ qui: a.id, nom: a.nom, test: comp, dd, des: t.des, bonus, total: t.total, reussite: t.reussite, ...(mode === 'avantage' ? { avantage: true } : mode === 'desavantage' ? { desavantage: true } : {}) });
  return t.reussite;
}
