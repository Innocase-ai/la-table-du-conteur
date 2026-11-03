// Module Dialogue : parler aux PNJ présents (sujets), les influencer (persuader, intimider, tromper).
import { z } from 'zod';
import { influencer, parler, pnjPresents, sujetsDisponibles, attitude } from '../monde/dialogue';
import { commande, type Module } from '../noyau/types';
import { libre, partieMonde, verser } from './commun';

export interface Interlocuteur {
  id: string;
  nom: string;
  role: string;
  attitude: number;
  sujets: { id: string; mots: string[] }[];
}

export const moduleDialogue: Module = {
  id: 'dialogue',
  dependances: ['exploration'],
  commandes: {
    parler: commande({
      description: "Parler à un PNJ présent. Sans sujet : il salue et la conversation s'ouvre. Avec un sujet (id) : sa réponse et ce qu'il révèle.",
      entree: z.object({ pnj: z.string(), sujet: z.string().optional() }),
      disponible: libre,
      executer: (t, e) => {
        const nom = t.ctx.dm.pnj.get(e.pnj)?.nom;
        // Sans sujet, la liste technique des sujets est pour le conteur (vue « interlocuteur »), pas pour le récit.
        const r = verser(t, parler(partieMonde(t), e.pnj, e.sujet), { voix: nom, sansConstats: !e.sujet });
        if (r) return r;
        t.partie.scene = { type: 'dialogue', pnj: e.pnj };
      },
    }),
    influencer: commande({
      description: "Persuader, intimider ou tromper un PNJ présent, éventuellement pour lui arracher un secret (id d'un fait).",
      entree: z.object({ pnj: z.string(), maniere: z.enum(['persuasion', 'intimidation', 'tromperie']), secret: z.string().optional(), personnage: z.string().optional() }),
      disponible: libre,
      executer: (t, e) => verser(t, influencer(partieMonde(t), e.pnj, e.maniere, { secret: e.secret, personnage: e.personnage }), { voix: t.ctx.dm.pnj.get(e.pnj)?.nom }),
    }),
    quitterDialogue: commande({
      description: 'Terminer la conversation.',
      entree: z.object({}),
      disponible: (_c, p) => (p.scene.type === 'dialogue' ? true : 'Personne ne vous parle.'),
      executer: (t) => {
        t.partie.scene = { type: 'exploration' };
      },
    }),
  },
  vues: {
    /** Le PNJ à qui l'on parle, avec les sujets qu'il accepte d'aborder maintenant. */
    interlocuteur: (ctx, p): Interlocuteur | undefined => {
      if (p.scene.type !== 'dialogue') return undefined;
      const pm = { dm: ctx.dm, etat: p.etat, groupe: p.groupe, gen: () => 0 };
      const pnj = pnjPresents(pm).find((n) => n.id === (p.scene as { pnj: string }).pnj);
      if (!pnj) return undefined;
      return { id: pnj.id, nom: pnj.nom, role: pnj.role, attitude: attitude(pm, pnj), sujets: sujetsDisponibles(pm, pnj).map((s) => ({ id: s.id, mots: s.mots })) };
    },
  },
};
