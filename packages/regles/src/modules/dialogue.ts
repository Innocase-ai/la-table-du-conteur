// Module Dialogue : parler aux PNJ présents (sujets), les influencer (persuader, intimider, tromper).
import { z } from 'zod';
import { attenteInfluence, ddInfluence, influencer, modeInfluence, parler, pnjPresents, sujetsDisponibles, attitude } from '../monde/dialogue';
import { evaluerCondition } from '../monde/etat';
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

/** Le texte d'un bouton d'influence qui doit attendre (SRD : 24 h après un échec), ou rien si c'est possible. */
const attenteTexte = (heures: number): string | undefined => (heures > 0 ? `Il ne vous écoutera pas de nouveau avant ${heures} h.` : undefined);

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
        // Une fin ou une rencontre déclenchée par la conversation l'emporte sur la conversation.
        if (t.partie.scene.type !== 'fin' && t.partie.scene.type !== 'rencontre') t.partie.scene = { type: 'dialogue', pnj: e.pnj };
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
        const dd = ddInfluence();
        const mode = modeInfluence(i.attitude);
        const avec = mode === 'avantage' ? ', Avantage : il vous apprécie' : mode === 'desavantage' ? ', Désavantage : il vous méprise' : '';
        // Le joueur dit une vraie phrase, dans un ton : l'étiquette dit comment elle pèse (jet de Persuasion, d'Intimidation ou de Tromperie).
        const etiquettes = { persuasion: 'Persuader', intimidation: 'Intimider', tromperie: 'Tromper' } as const;
        const repliques = { persuasion: 'Vous pouvez compter sur nous. Aidez-nous, et vous n’y perdrez rien.', intimidation: 'Parlez, et vite. Nous ne sommes pas venus pour perdre notre temps.', tromperie: 'Un ami commun nous envoie. Il vous salue, et vous savez pourquoi.' } as const;
        const icones = { persuasion: 'base:persuader', intimidation: 'base:intimider', tromperie: 'base:tromper' } as const;
        const aides = {
          persuasion: `Gagner sa confiance par les mots (Persuasion, DD ${dd}${avec}). Réussi, il vous apprécie davantage ; raté, il se refroidit un peu.`,
          intimidation: `Le faire plier par la menace (Intimidation, DD ${dd}${avec}). Il cède, mais vous apprécie moins ; raté, il s’en souvient.`,
          tromperie: `Le mener en bateau (Tromperie, DD ${dd}${avec}). Réussi, il vous croit ; découvert, il vous en veut beaucoup.`,
        } as const;
        const base = (Object.keys(etiquettes) as (keyof typeof etiquettes)[]).map((m) => ({
          groupe: PANNEAUX.dialogue(i.nom),
          element: { id: 'influence', titre: 'Peser sur son attitude' },
          libelle: repliques[m],
          etiquette: etiquettes[m],
          icone: icones[m],
          aide: aides[m],
          style: 'discret' as const,
          ordre: { type: 'influencer', pnj: i.id, maniere: m },
          desactivee: attenteTexte(attenteInfluence(p, i.id, m)),
        }));
        // Un secret qu'il pourrait lâcher : une réplique pour insister, sans rien dire de ce qu'il cache.
        const pnj = ctx.dm.pnj.get(i.id);
        const sec = pnj?.secrets.find((s) => !p.etat.faits.includes(s.fait) && (!s.condition || evaluerCondition(s.condition, p.etat)));
        if (!sec) return base;
        const competence = sec.jet?.competence;
        const maniere = competence === 'intimidation' || competence === 'tromperie' ? competence : 'persuasion';
        const etiquette = sec.prix ? `Payer ${sec.prix} po` : competence === 'intimidation' ? 'Intimider' : competence === 'tromperie' ? 'Tromper' : competence && competence !== 'persuasion' ? 'Insister' : 'Persuader';
        const libelle = sec.prix
          ? 'Glisser quelques pièces : il en sait plus qu’il ne le dit.'
          : maniere === 'intimidation'
            ? 'Assez de détours. Ce que vous cachez, maintenant.'
            : maniere === 'tromperie'
              ? 'On nous a déjà tout raconté ; confirmez seulement.'
              : 'Vous en savez plus que vous ne le dites. Faites-nous confiance.';
        const trop = sec.attitudeMin !== undefined && i.attitude < sec.attitudeMin && !sec.jet;
        return [
          ...base,
          {
            groupe: PANNEAUX.dialogue(i.nom),
            libelle,
            etiquette,
            icone: icones[maniere],
            aide: sec.prix ? `Payer ${sec.prix} po pour qu'il parle.` : `Tenter de lui faire dire ce qu'il cache (${competence ?? maniere}${sec.jet ? `, DD ${sec.jet.dd}` : `, DD ${dd}`}).`,
            ordre: { type: 'influencer', pnj: i.id, maniere, secret: sec.fait },
            desactivee: trop ? 'Il ne vous fait pas encore assez confiance.' : attenteTexte(attenteInfluence(p, i.id, maniere)) ?? (sec.prix && p.etat.pieces < sec.prix ? 'Pas assez d’or.' : undefined),
          },
        ];
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
        return i ? [{ groupe: PANNEAUX.dialogue(i.nom), libelle: 'Fin du dialogue', style: 'discret' as const, ordre: { type: 'quitterDialogue' } }] : [];
      },
    }),
  },
  vues: {
    interlocuteur,
  },
};
