// Dialogue avec les PNJ : le conteur choisit un sujet d'après ce que dit le joueur ; le moteur vérifie que le PNJ
// est là, qu'il accepte d'en parler (condition, attitude), révèle les faits et applique les effets. Les tentatives
// d'influence (persuader, intimider, tromper) passent par un jet.
import { evaluerCondition } from './etat';
import { appliquer, suites, VERBES_OUVRIR, type CompteRendu, type PartieMonde } from './exploration';
import { lieuDuPnj, pnjPresents } from './presence';
import type { Personnage } from '../personnage';
import type { Pnj } from './schemas';
import { testD20 } from '../tests-d20';

/** Seuils d'attitude : en dessous de -30, hostile ; au-dessus de 30, amical. */
export const SEUIL_HOSTILE = -30;
export const SEUIL_AMICAL = 30;

// La présence des PNJ vit dans `presence.ts` (partagée avec l'ouverture des serrures) ; réexportée ici pour les appelants.
export { lieuDuPnj, pnjPresents };

export function attitude(p: PartieMonde, pnj: Pnj): number {
  return p.etat.attitudes[pnj.id] ?? pnj.attitude;
}

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
  if (!p.etat.exploration.sujetsVus.includes(`${pnj.id}:${s.id}`)) p.etat.exploration.sujetsVus.push(`${pnj.id}:${s.id}`);
  r.narrations.push(s.reponse);
  r.paroles = 1;
  // Les effets d'un sujet passent par le même chemin qu'une action : paliers de jauge, événements, quêtes, rencontres, fin.
  appliquer(p, r, [...s.revele.map((f) => ({ fait: f })), ...s.effets]);
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

/** Après un échec, on attend 24 h avant d'exhorter de nouveau le même PNJ de la même manière. */
export const ATTENTE_INFLUENCE_HEURES = 24;

const heureAbsolue = (p: Pick<PartieMonde, 'etat'>) => p.etat.jour * 24 + (p.etat.heure ?? 8);

/** Heures (entières, par excès) qu'il reste à attendre avant de retenter cette manière avec ce PNJ ; 0 si c'est possible. */
export function attenteInfluence(p: Pick<PartieMonde, 'etat'>, pnjId: string, maniere: Influence): number {
  const ratee = p.etat.exploration.influenceRatee?.[`${pnjId}:${maniere}`];
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
  const acteur = choisirOrateur(p, maniere, options.personnage);
  if (!acteur) return { ...vide(), ok: false, refus: 'Personne ne peut le tenter.' };
  const attente = attenteInfluence(p, pnj.id, maniere);
  if (attente > 0) return { ...vide(), ok: false, refus: `${pnj.nom} n'écoutera pas deux fois les mêmes arguments : réessayez dans ${attente} h, ou autrement.` };
  const mode = modeInfluence(a);
  const rate = () => ((p.etat.exploration.influenceRatee ??= {})[`${pnj.id}:${maniere}`] = heureAbsolue(p));

  if (options.secret) {
    const sec = pnj.secrets.find((x) => x.fait === options.secret);
    if (!sec || p.etat.faits.includes(sec.fait)) return { ...vide(), ok: false, refus: `${pnj.nom} n'a rien de tel à révéler.` };
    if (sec.condition && !evaluerCondition(sec.condition, p.etat)) return { ...vide(), ok: false, refus: `${pnj.nom} ne lâchera pas cela pour l'instant.` };
    if (sec.attitudeMin !== undefined && a < sec.attitudeMin && !sec.jet) return { ...vide(), ok: false, refus: `${pnj.nom} ne fait pas assez confiance au groupe pour en parler.` };
    if (sec.prix) {
      if (p.etat.pieces < sec.prix) return { ...vide(), ok: false, refus: `${pnj.nom} veut ${sec.prix} po, que le groupe n'a pas.` };
      p.etat.pieces -= sec.prix;
      r.constats.push(`Le groupe paie ${sec.prix} po.`);
    }
    const dd = sec.jet?.dd ?? ddInfluence();
    const comp = sec.jet?.competence ?? maniere;
    if (!jet(p, r, acteur, comp, dd, mode)) {
      rate();
      r.ok = true;
      r.constats.push(`${pnj.nom} ne dit rien.`);
      appliquer(p, r, [{ attitude: { pnj: pnj.id, delta: maniere === 'intimidation' ? -10 : -5 } }]);
      suites(p, r);
      return r;
    }
    appliquer(p, r, [{ fait: sec.fait }]);
    r.constats.push(`${pnj.nom} finit par parler.`);
    suites(p, r);
    return r;
  }

  const reussi = jet(p, r, acteur, maniere, ddInfluence(), mode);
  if (!reussi) rate();
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

function choisirOrateur(p: PartieMonde, comp: Influence, id?: string): Personnage | undefined {
  const vivants = p.groupe.filter((a) => a.pv > 0);
  if (id) return vivants.find((a) => a.id === id);
  return [...vivants].sort((x, y) => y.fiche.competences[comp].bonus - x.fiche.competences[comp].bonus)[0];
}

function jet(p: PartieMonde, r: CompteRendu, a: Personnage, comp: keyof Personnage['fiche']['competences'], dd: number, mode?: 'avantage' | 'desavantage'): boolean {
  const bonus = a.fiche.competences[comp].bonus;
  const t = testD20({ bonus, dd, avantage: mode === 'avantage', desavantage: mode === 'desavantage' }, p.gen);
  r.jets.push({ qui: a.id, nom: a.nom, test: comp, dd, des: t.des, bonus, total: t.total, reussite: t.reussite, ...(mode === 'avantage' ? { avantage: true } : mode === 'desavantage' ? { desavantage: true } : {}) });
  return t.reussite;
}
