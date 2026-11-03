// Dialogue avec les PNJ : le conteur choisit un sujet d'après ce que dit le joueur ; le moteur vérifie que le PNJ
// est là, qu'il accepte d'en parler (condition, attitude), révèle les faits et applique les effets. Les tentatives
// d'influence (persuader, intimider, tromper) passent par un jet.
import { evaluerCondition } from './etat';
import { type Aventurier, type CompteRendu, type PartieMonde } from './exploration';
import type { Pnj } from './schemas';
import { testD20 } from '../tests-d20';
import { appliquerEffets } from './etat';

/** Seuils d'attitude : en dessous de -30, hostile ; au-dessus de 30, amical. */
export const SEUIL_HOSTILE = -30;
export const SEUIL_AMICAL = 30;

export function lieuDuPnj(p: PartieMonde, pnj: Pnj): string {
  return p.etat.pnjLieux[pnj.id] ?? pnj.lieu;
}

/** PNJ présents dans le lieu courant, vivants et toujours là. */
export function pnjPresents(p: PartieMonde): Pnj[] {
  return [...p.dm.pnj.values()].filter((n) => {
    if ((p.etat.pnjEtats[n.id] ?? 'vivant') !== 'vivant') return false;
    if (lieuDuPnj(p, n) === p.etat.lieu) return true;
    // Une présence ailleurs ne compte que si le PNJ n'a pas été déplacé, de jour (le moment de la journée viendra plus tard).
    return !p.etat.pnjLieux[n.id] && n.presences.some((x) => x.lieu === p.etat.lieu && x.moment === 'jour' && (!x.condition || evaluerCondition(x.condition, p.etat)));
  });
}

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
    const salut = a <= SEUIL_HOSTILE ? (pnj.salutations.hostile ?? pnj.salutations.neutre) : a >= SEUIL_AMICAL ? (pnj.salutations.amical ?? pnj.salutations.neutre) : pnj.salutations.neutre;
    r.narrations.push(salut);
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
  if (s.unique) p.etat.exploration.sujetsVus.push(`${pnj.id}:${s.id}`);
  r.narrations.push(s.reponse);
  const avant = p.etat.faits.length;
  appliquerEffets([...s.revele.map((f) => ({ fait: f })), ...s.effets], p.etat, p.dm);
  r.revele.push(...p.etat.faits.slice(avant));
  return r;
}

export type Influence = 'persuasion' | 'intimidation' | 'tromperie';

/** DD d'une tentative d'influence : 15 pour un PNJ neutre, plus facile s'il vous apprécie, plus dur s'il vous déteste. */
export function ddInfluence(attitudePnj: number): number {
  return Math.max(5, Math.min(25, Math.round(15 - attitudePnj / 10)));
}

/**
 * Influencer un PNJ. Avec un secret visé (id de fait) : on tente de le lui faire dire (condition, attitude minimale,
 * prix éventuel, jet propre au secret). Sans secret : on gagne (ou perd) de l'attitude.
 */
export function influencer(p: PartieMonde, id: string, maniere: Influence, options: { secret?: string; personnage?: string } = {}): CompteRendu {
  const pnj = present(p, id);
  if (!('sujets' in pnj)) return pnj;
  const r = vide();
  const a = attitude(p, pnj);
  const acteur = choisirOrateur(p, maniere, options.personnage);
  if (!acteur) return { ...vide(), ok: false, refus: 'Personne ne peut le tenter.' };

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
    const dd = sec.jet?.dd ?? ddInfluence(a);
    const comp = sec.jet?.competence ?? maniere;
    if (!jet(p, r, acteur, comp, dd)) {
      r.ok = true;
      r.constats.push(`${pnj.nom} ne dit rien.`);
      appliquerEffets([{ attitude: { pnj: pnj.id, delta: maniere === 'intimidation' ? -10 : -5 } }], p.etat, p.dm);
      return r;
    }
    appliquerEffets([{ fait: sec.fait }], p.etat, p.dm);
    r.revele.push(sec.fait);
    r.constats.push(`${pnj.nom} finit par parler.`);
    return r;
  }

  const reussi = jet(p, r, acteur, maniere, ddInfluence(a));
  // L'intimidation fait obéir mais n'attire pas la sympathie ; la tromperie découverte coûte cher.
  const delta = reussi ? (maniere === 'intimidation' ? -5 : 10) : maniere === 'tromperie' ? -15 : maniere === 'intimidation' ? -10 : -5;
  appliquerEffets([{ attitude: { pnj: pnj.id, delta } }], p.etat, p.dm);
  r.constats.push(`${acteur.nom} ${reussi ? 'convainc' : 'ne convainc pas'} ${pnj.nom} (attitude ${attitude(p, pnj)}).`);
  return r;
}

function choisirOrateur(p: PartieMonde, comp: Influence, id?: string): Aventurier | undefined {
  const vivants = p.groupe.filter((a) => a.pv > 0);
  if (id) return vivants.find((a) => a.id === id);
  return [...vivants].sort((x, y) => y.fiche.competences[comp].bonus - x.fiche.competences[comp].bonus)[0];
}

function jet(p: PartieMonde, r: CompteRendu, a: Aventurier, comp: keyof Aventurier['fiche']['competences'], dd: number): boolean {
  const bonus = a.fiche.competences[comp].bonus;
  const t = testD20({ bonus, dd }, p.gen);
  r.jets.push({ qui: a.id, nom: a.nom, test: comp, dd, des: t.des, bonus, total: t.total, reussite: t.reussite });
  return t.reussite;
}
