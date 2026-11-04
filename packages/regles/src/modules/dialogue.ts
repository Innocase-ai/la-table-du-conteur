// Module Dialogue : parler aux PNJ présents (sujets), les influencer (persuader, intimider, tromper).
import { z } from 'zod';
import { ddInfluence, influencer, parler, pnjPresents, sujetsDisponibles, attitude } from '../monde/dialogue';
import { commande, type Module } from '../noyau/types';
import { enExploration, libre, PANNEAUX, partieMonde, verser } from './commun';
import type { ContexteJeu, Partie } from '../noyau/types';

export interface Interlocuteur {
  id: string;
  nom: string;
  role: string;
  attitude: number;
  sujets: { id: string; mots: string[]; question?: string; vu: boolean }[];
}

const pm = (ctx: ContexteJeu, p: Partie) => ({ dm: ctx.dm, etat: p.etat, groupe: p.groupe, gen: () => 0 });

/** Le PNJ à qui l'on parle, avec les sujets qu'il accepte d'aborder maintenant. */
function interlocuteur(ctx: ContexteJeu, p: Partie): Interlocuteur | undefined {
  if (p.scene.type !== 'dialogue') return undefined;
  const id = p.scene.pnj;
  const pnj = pnjPresents(pm(ctx, p)).find((n) => n.id === id);
  if (!pnj) return undefined;
  return { id: pnj.id, nom: pnj.nom, role: pnj.role, attitude: attitude(pm(ctx, p), pnj), sujets: sujetsDisponibles(pm(ctx, p), pnj).map((s) => ({ id: s.id, mots: s.mots, question: s.question, vu: p.etat.exploration.sujetsVus.includes(`${pnj.id}:${s.id}`) })) };
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
      propositions: (ctx, p) => {
        // En exploration : les personnes présentes ; en conversation : les sujets que le PNJ accepte d'aborder.
        if (enExploration(p)) {
          return pnjPresents(pm(ctx, p)).map((n) => ({ groupe: PANNEAUX.personnes, libelle: `Parler à ${n.nom}`, detail: n.role, image: { groupe: 'pnj' as const, id: n.id }, ordre: { type: 'parler', pnj: n.id } }));
        }
        const i = interlocuteur(ctx, p);
        // Le libellé dit ce que le joueur dit ou fait (`question`) ; sans lui, les mots-clés. Les mots restent en infobulle.
        return i
          ? i.sujets.map((s) => ({
              groupe: PANNEAUX.dialogue(i.nom),
              libelle: s.question ?? `À propos de : ${s.mots.slice(0, 3).join(' · ')}`,
              detail: s.vu ? 'déjà abordé' : undefined,
              aide: s.mots.join(' · '),
              ordre: { type: 'parler', pnj: i.id, sujet: s.id },
            }))
          : [];
      },
    }),
    influencer: commande({
      description: "Persuader, intimider ou tromper un PNJ présent, éventuellement pour lui arracher un secret (id d'un fait).",
      entree: z.object({ pnj: z.string(), maniere: z.enum(['persuasion', 'intimidation', 'tromperie']), secret: z.string().optional(), personnage: z.string().optional() }),
      disponible: libre,
      executer: (t, e) => verser(t, influencer(partieMonde(t), e.pnj, e.maniere, { secret: e.secret, personnage: e.personnage }), { voix: t.ctx.dm.pnj.get(e.pnj)?.nom }),
      propositions: (ctx, p) => {
        const i = interlocuteur(ctx, p);
        if (!i) return [];
        const dd = ddInfluence(i.attitude);
        const libelles = { persuasion: 'Persuader', intimidation: 'Intimider', tromperie: 'Tromper' } as const;
        const icones = { persuasion: 'base:persuader', intimidation: 'base:intimider', tromperie: 'base:tromper' } as const;
        const aides = {
          persuasion: `Gagner sa confiance par les mots (Persuasion, DD ${dd}). Réussi, il vous apprécie davantage ; raté, il se refroidit un peu.`,
          intimidation: `Le faire plier par la menace (Intimidation, DD ${dd}). Il cède, mais vous apprécie moins ; raté, il s’en souvient.`,
          tromperie: `Le mener en bateau (Tromperie, DD ${dd}). Réussi, il vous croit ; découvert, il vous en veut beaucoup.`,
        } as const;
        return (Object.keys(libelles) as (keyof typeof libelles)[]).map((m) => ({
          groupe: PANNEAUX.dialogue(i.nom),
          element: { id: 'influence', titre: 'Peser sur son attitude' },
          libelle: libelles[m],
          icone: icones[m],
          aide: aides[m],
          style: 'discret' as const,
          ordre: { type: 'influencer', pnj: i.id, maniere: m },
        }));
      },
    }),
    quitterDialogue: commande({
      description: 'Terminer la conversation.',
      entree: z.object({}),
      disponible: (_c, p) => (p.scene.type === 'dialogue' ? true : 'Personne ne vous parle.'),
      executer: (t) => {
        t.partie.scene = { type: 'exploration' };
      },
      propositions: (ctx, p) => {
        const i = interlocuteur(ctx, p);
        return i ? [{ groupe: PANNEAUX.dialogue(i.nom), libelle: '‹ Terminer la conversation', style: 'discret' as const, ordre: { type: 'quitterDialogue' } }] : [];
      },
    }),
  },
  vues: {
    interlocuteur,
  },
};
