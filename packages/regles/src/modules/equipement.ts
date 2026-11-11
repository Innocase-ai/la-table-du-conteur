// Module Équipement : équiper un héros d'une armure, d'un bouclier, d'armes ou de parures, et les lui retirer. Tout ce que
// ça change se lit ensuite dans sa fiche (CA, armes de combat) : le combat n'a rien de plus à savoir. Le catalogue est
// celui du SRD, commun à tous les mondes (voir `equipement-regles.ts`). Les objets portés s'affichent dans la grille du
// sac (module Inventaire), groupés par héros ; les actions viennent d'ici.
import { z } from 'zod';
import { commande, type ContexteJeu, type Module, type Partie, type Proposition } from '../noyau/types';
import { equipementDe, type Equipement, type Personnage } from '../personnage';
import { objetDe } from './catalogue';
import { libre } from './commun';
import {
  appliquerEquipement,
  ARMES_MAX,
  caAvecEquipement,
  HARMONISES_MAX,
  idElementPorte,
  infoEquipement,
  objetsPortes,
  PORTES_MAX,
} from './equipement-regles';

declare module '../noyau/types' {
  interface CarteEvenements {
    equipementChange: { personnage: string; objet: string; ancien?: string; retire?: boolean };
  }
}

const PANNEAU_SAC = { id: 'sac', titre: 'Objets', ordre: 10, onglet: 'Sac' };

const copie = (e: Equipement): Equipement => ({ armure: e.armure, bouclier: e.bouclier, armes: [...e.armes], portes: [...e.portes], bonusArmes: e.bonusArmes, bonusEmplacements: e.bonusEmplacements });

/** Les objets harmonisés portés : armure, bouclier et armes comptent aussi (SRD : 3 objets harmonisés au plus, de toute sorte). */
const harmonises = (ctx: ContexteJeu, e: Equipement) => [e.armure, e.bouclier, ...e.armes, ...e.portes].filter((id): id is string => !!id && !!objetDe(ctx, id).attunement).length;

/** Ce que donnerait l'équipement du héros avec cet objet en plus, ou la raison de le refuser. */
function avecObjet(ctx: ContexteJeu, h: Personnage, objet: string): { equipe: Equipement; remis?: string } | { refus: string } {
  const r = placer(ctx, h, objet);
  // Harmonisation : compte tout ce qui serait porté (une armure ou une arme harmonisée remplace peut-être une autre).
  if ('equipe' in r && objetDe(ctx, objet).attunement && harmonises(ctx, r.equipe) > HARMONISES_MAX)
    return { refus: `${h.nom} est déjà harmonisé à ${HARMONISES_MAX} objets magiques, le maximum.` };
  return r;
}

function placer(ctx: ContexteJeu, h: Personnage, objet: string): { equipe: Equipement; remis?: string } | { refus: string } {
  const info = infoEquipement(ctx, objet);
  const o = objetDe(ctx, objet);
  if (!info) return { refus: `${o.nom} ne s'équipe pas.` };
  const e = copie(equipementDe(h));
  switch (info.genre) {
    case 'armure': {
      const remis = e.armure;
      e.armure = objet;
      return { equipe: e, remis };
    }
    case 'bouclier': {
      const remis = e.bouclier;
      e.bouclier = objet;
      return { equipe: e, remis };
    }
    case 'arme':
      if (e.armes.includes(objet)) return { refus: `${h.nom} porte déjà ${o.nom}.` };
      if (e.armes.length >= ARMES_MAX) return { refus: `${h.nom} porte déjà ${ARMES_MAX} armes : le reste voyage dans le sac.` };
      e.armes.push(objet);
      return { equipe: e };
    case 'porte':
      if (e.portes.length >= PORTES_MAX) return { refus: `${h.nom} ne peut pas porter plus de ${PORTES_MAX} parures ou objets magiques.` };
      e.portes.push(objet);
      return { equipe: e };
  }
}

/** Les mises en garde des règles (formation, Force) : on équipe quand même, comme à la création. */
function mises(ctx: ContexteJeu, h: Personnage, objet: string): string[] {
  const info = infoEquipement(ctx, objet);
  const res: string[] = [];
  if (info?.genre === 'armure' || info?.genre === 'bouclier') {
    const a = ctx.srd?.armures.get(info.base!);
    if (a && !h.fiche.formationArmures.includes(a.categorie))
      res.push(
        info.genre === 'bouclier'
          ? `${h.nom} n'a pas la formation au bouclier : pas de bonus de CA, désavantage aux attaques et aux jets de Force et de Dextérité, aucun sort possible.`
          : `${h.nom} n'a pas la formation à cette armure : désavantage aux attaques et aux jets de Force et de Dextérité, et il ne pourra lancer aucun sort.`,
      );
    if (a?.forceMin && h.fiche.caracteristiques.for.valeur < a.forceMin)
      res.push(`Force ${a.forceMin} requise pour cette armure : ${h.nom} serait ralenti de 3 m.`);
  }
  return res;
}

function retirerDuSac(sac: Record<string, number>, id: string): void {
  const n = (sac[id] ?? 0) - 1;
  if (n > 0) sac[id] = n;
  else delete sac[id];
}

export const moduleEquipement: Module = {
  id: 'equipement',
  dependances: ['inventaire'],
  commandes: {
    equiper: commande({
      description:
        "Équiper un héros d'un objet du sac (armure, bouclier, arme, parure ou objet magique) ; ce qu'il portait à la même place revient dans le sac. Recalcule sa Classe d'Armure et ses armes de combat.",
      entree: z.object({ objet: z.string(), personnage: z.string() }),
      disponible: libre,
      executer: (t, e) => {
        if (!(t.partie.etat.inventaire[e.objet] ?? 0)) return { refus: "Le groupe n'a pas cet objet." };
        const h = t.partie.groupe.find((a) => a.id === e.personnage);
        if (!h) return { refus: 'Aucun héros de ce nom.' };
        if (h.pv <= 0) return { refus: `${h.nom} est hors de combat.` };
        const r = avecObjet(t.ctx, h, e.objet);
        if ('refus' in r) return { refus: r.refus };
        const caAvant = h.fiche.ca;
        const o = objetDe(t.ctx, e.objet);
        retirerDuSac(t.partie.etat.inventaire, e.objet);
        if (r.remis) t.partie.etat.inventaire[r.remis] = (t.partie.etat.inventaire[r.remis] ?? 0) + 1;
        h.equipe = r.equipe;
        appliquerEquipement(t.ctx, h);
        t.emettre({
          type: 'constat',
          texte: `${h.nom} équipe ${o.nom}${r.remis ? ` (à la place de ${objetDe(t.ctx, r.remis).nom})` : ''}${h.fiche.ca !== caAvant ? ` : CA ${caAvant} → ${h.fiche.ca}` : ''}.`,
        });
        for (const m of mises(t.ctx, h, e.objet)) t.emettre({ type: 'constat', texte: m });
        t.emettre({ type: 'equipementChange', personnage: h.id, objet: e.objet, ancien: r.remis });
      },
      propositions: (ctx, p) => propositionsEquiper(ctx, p),
    }),
    retirerEquipement: commande({
      description: 'Retirer un objet porté par un héros : il revient dans le sac. Recalcule sa Classe d’Armure et ses armes de combat.',
      entree: z.object({ objet: z.string(), personnage: z.string() }),
      disponible: libre,
      executer: (t, e) => {
        const h = t.partie.groupe.find((a) => a.id === e.personnage);
        if (!h) return { refus: 'Aucun héros de ce nom.' };
        const eq = copie(equipementDe(h));
        if (eq.armure === e.objet) eq.armure = undefined;
        else if (eq.bouclier === e.objet) eq.bouclier = undefined;
        else if (eq.armes.includes(e.objet)) eq.armes.splice(eq.armes.indexOf(e.objet), 1);
        else if (eq.portes.includes(e.objet)) eq.portes.splice(eq.portes.indexOf(e.objet), 1);
        else return { refus: `${h.nom} ne porte pas cet objet.` };
        const caAvant = h.fiche.ca;
        h.equipe = eq;
        appliquerEquipement(t.ctx, h);
        t.partie.etat.inventaire[e.objet] = (t.partie.etat.inventaire[e.objet] ?? 0) + 1;
        t.emettre({
          type: 'constat',
          texte: `${h.nom} range ${objetDe(t.ctx, e.objet).nom} dans le sac${h.fiche.ca !== caAvant ? ` : CA ${caAvant} → ${h.fiche.ca}` : ''}.`,
        });
        t.emettre({ type: 'equipementChange', personnage: h.id, objet: e.objet, retire: true });
      },
      propositions: (ctx, p) =>
        p.groupe.flatMap((h) =>
          objetsPortes(equipementDe(h)).map((id) => ({
            groupe: PANNEAU_SAC,
            element: { id: idElementPorte(h.id, id), titre: `${objetDe(ctx, id).nom} (${h.nom})` },
            libelle: 'Retirer',
            style: 'discret' as const,
            aide: `Le range dans le sac.`,
            ordre: { type: 'retirerEquipement', objet: id, personnage: h.id },
          })),
        ),
    }),
  },
};

/** Pour chaque objet du sac qui s'équipe : « Équiper… » avec le choix du héros, et ce que ça changerait à sa CA. */
function propositionsEquiper(ctx: ContexteJeu, p: Partie): Proposition[] {
  const res: Proposition[] = [];
  for (const id of Object.keys(p.etat.inventaire)) {
    const info = infoEquipement(ctx, id);
    if (!info) continue;
    const o = objetDe(ctx, id);
    res.push({
      groupe: PANNEAU_SAC,
      element: { id, titre: o.nom },
      libelle: 'Équiper…',
      aide: 'Le héros choisi le porte ; ce qu’il portait à la même place revient dans le sac.',
      ordre: { type: 'equiper', objet: id },
      choix: {
        champ: 'personnage',
        indication: 'Équiper qui ?',
        options: p.groupe.map((h) => {
          const r = avecObjet(ctx, h, id);
          const refus = 'refus' in r ? r.refus : h.pv <= 0 ? `${h.nom} est hors de combat.` : undefined;
          const ca = 'equipe' in r ? caAvecEquipement(ctx, h, r.equipe) : h.fiche.ca;
          return {
            valeur: h.id,
            libelle: h.nom,
            personnage: h.id,
            detail:
              info.genre === 'arme' || info.genre === 'porte'
                ? ca !== h.fiche.ca
                  ? `CA ${h.fiche.ca} → ${ca}`
                  : `CA ${h.fiche.ca}`
                : `CA ${h.fiche.ca} → ${ca}`,
            desactivee: refus,
          };
        }),
      },
    });
  }
  return res;
}
