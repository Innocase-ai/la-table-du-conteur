// Pont entre les verbes du monde (monde/exploration, monde/dialogue) et le noyau : une commande appelle un verbe
// sur la copie de travail de la partie, puis verse son compte rendu en événements.
import type { CompteRendu, PartieMonde as PartieExploration } from '../monde/exploration';
import type { Transaction } from '../noyau/types';

/** La partie telle que les verbes du monde l'attendent, branchée sur la transaction (état, groupe, hasard). */
export function partieMonde(t: Transaction): PartieExploration {
  return { dm: t.ctx.dm, etat: t.partie.etat, groupe: t.partie.groupe, gen: t.hasard };
}

/**
 * Verse un compte rendu : un refus sans jet annule l'action ; sinon jets, textes de l'auteur (dans la voix d'un PNJ
 * si `voix`), constats ; une rencontre déclenchée ou une fin changent la scène.
 */
export function verser(t: Transaction, cr: CompteRendu, options: { voix?: string; sansConstats?: boolean } = {}): void | { refus: string } {
  if (!cr.ok && !cr.jets.length && cr.refus) return { refus: cr.refus };
  for (const j of cr.jets) t.emettre({ type: 'jet', jet: j });
  for (const n of cr.narrations) t.emettre({ type: 'texte', texte: n, ...(options.voix ? { voix: options.voix } : {}) });
  if (!options.sansConstats) for (const c of cr.constats) t.emettre({ type: 'constat', texte: c });
  if (cr.refus) t.emettre({ type: 'constat', texte: cr.refus });
  if (cr.fin) t.partie.scene = { type: 'fin', fin: cr.fin };
  else if (cr.combat) t.partie.scene = { type: 'rencontre', rencontre: cr.combat };
}

/** Exploration et dialogue ne se jouent pas pendant une rencontre ni après la fin. */
export function libre(_ctx: unknown, p: { scene: { type: string } }): true | string {
  if (p.scene.type === 'rencontre') return 'Une rencontre attend : combattre, tenter une autre issue ou se replier.';
  if (p.scene.type === 'fin') return "L'histoire est terminée.";
  return true;
}

/** Les panneaux de l'écran d'aventure, dans l'ordre d'affichage. Un module peut en ajouter d'autres. */
export const PANNEAUX = {
  dialogue: (titre: string) => ({ id: 'dialogue', titre, ordre: 10 }),
  personnes: { id: 'personnes', titre: 'Personnes', ordre: 20 },
  ici: { id: 'ici', titre: 'Ici', ordre: 30 },
  objets: { id: 'objets', titre: 'À portée de main', ordre: 40 },
  enigme: (id: string, titre: string, enonce: string) => ({ id: `enigme:${id}`, titre, ordre: 50, description: enonce }),
  partir: { id: 'partir', titre: 'Partir', ordre: 90 },
};

/** La scène d'exploration seulement (pas pendant une conversation, une rencontre ni après la fin). */
export function enExploration(p: { scene: { type: string } }): boolean {
  return p.scene.type === 'exploration';
}
