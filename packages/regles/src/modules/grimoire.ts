// Module Grimoire : le livre de sorts des héros qui en lancent (sorts mineurs, sorts préparés, emplacements restants)
// et les sorts de soins lancés hors combat. Les autres sorts se lancent en combat, ou se racontent avec le conteur.
import { z } from 'zod';
import { lancer } from '../des';
import { commande, type ContexteJeu, type Encart, type Module, type Partie, type Proposition } from '../noyau/types';
import { inscrireGrimoireManquant } from '../creation/grimoire';
import { descriptionDroits, prochainChangement, verifierPreparation } from '../creation/preparation';
import type { Personnage } from '../personnage';
import type { Sort } from '../schemas';
import { libre } from './commun';
import { ficheDeSort } from './fiche-sort';
import { plusBlesse } from './inventaire';

declare module '../noyau/types' {
  interface CarteEvenements {
    sortLance: { lanceur: string; sort: string; niveau: number; cibles: string[] };
  }
}

const lanceurs = (p: Partie) => p.groupe.filter((a) => a.fiche.incantation);

/** Les sorts que connaît un héros (mineurs, préparés, accordés), dans l'ordre : mineurs, puis par niveau. */
export function sortsConnus(ctx: ContexteJeu, a: Personnage): Sort[] {
  const f = a.fiche;
  const ids = [...new Set([...f.sortsMineurs, ...f.sortsPrepares, ...f.sortsAccordes])];
  return ids
    .map((id) => ctx.srd?.sorts.get(id))
    .filter((s): s is Sort => !!s)
    .sort((x, y) => x.niveau - y.niveau || x.nom.localeCompare(y.nom));
}

/** Le plus petit emplacement disponible d'un niveau au moins égal à celui du sort (index dans `emplacements`). */
function emplacementPour(a: Personnage, niveau: number): number | undefined {
  for (let i = niveau - 1; i < a.emplacements.length; i++) if ((a.emplacements[i] ?? 0) > 0) return i;
  return undefined;
}

/** Un sort de soins à plusieurs cibles soigne tout le groupe (jusqu'à son nombre de cibles). */
const soinsDeGroupe = (s: Sort) => (s.cibles ?? 1) > 1;

const PANNEAU_SOINS = { id: 'soins', titre: 'Soigner', ordre: 10, onglet: 'Grimoire' };

/** Les paladins qui ont encore des points d'Imposition des mains. */
const paladins = (p: Partie) => p.groupe.filter((a) => (a.ressources.impositionDesMains ?? 0) > 0);

const PANNEAU_PREPARATION = { id: 'preparation', titre: 'Préparer ses sorts', ordre: 5, onglet: 'Grimoire' };

/** Les héros qui ont gagné, par un repos ou un niveau, le droit de changer leurs sorts (et qui le peuvent : ils ont leurs choix de création). */
const preparateurs = (p: Partie) => p.groupe.filter((a) => a.choix && a.preparation && descriptionDroits(a.preparation));

/** Les héros d'une classe à grimoire sans livre (groupe ou partie d'avant le grimoire) reçoivent le leur. */
function inscrireLesGrimoires(ctx: ContexteJeu, p: Partie): void {
  if (ctx.srd) for (const h of p.groupe) inscrireGrimoireManquant(h, ctx.srd);
}

export const moduleGrimoire: Module = {
  id: 'grimoire',
  demarrer: inscrireLesGrimoires,
  apresChargement: inscrireLesGrimoires,
  commandes: {
    changerSortsPrepares: commande({
      description:
        "Préparer ses sorts (SRD 5.2.1) : le joueur change la liste de sorts préparés (et un sort mineur) d'un héros, quand un repos ou un niveau gagné le permet (selon la classe). Choix du joueur, fait dans l'écran de préparation.",
      entree: z.object({ personnage: z.string(), prepares: z.array(z.string()), mineurs: z.array(z.string()).optional() }),
      disponible: (_c, p) => (p.scene.type === 'exploration' ? true : 'On prépare ses sorts à tête reposée, hors rencontre et hors conversation.'),
      executer: (t, e) => {
        const h = t.partie.groupe.find((x) => x.id === e.personnage);
        if (!h) return { refus: 'Aucun héros de ce nom.' };
        if (!t.ctx.srd) return { refus: 'Les règles ne sont pas chargées.' };
        const r = verifierPreparation(h, { prepares: e.prepares, mineurs: e.mineurs }, t.ctx.srd);
        if (!r.ok) return { refus: r.erreur };
        h.choix = r.choix;
        h.fiche = { ...h.fiche, sortsPrepares: r.sortsPrepares, sortsMineurs: r.sortsMineurs };
        if (r.reste) h.preparation = r.reste;
        else delete h.preparation;
        const nom = (id: string) => t.ctx.srd?.sorts.get(id)?.nom ?? id;
        const liste = (ids: string[]) => ids.map(nom).join(', ');
        const phrases = [
          r.ajoutes.prepares.length || r.retires.prepares.length ? `sorts préparés : ${[r.retires.prepares.length ? `− ${liste(r.retires.prepares)}` : '', r.ajoutes.prepares.length ? `+ ${liste(r.ajoutes.prepares)}` : ''].filter(Boolean).join(', ')} (${h.fiche.sortsPrepares.length} / ${h.fiche.incantation?.sortsPrepares ?? h.fiche.sortsPrepares.length})` : '',
          r.ajoutes.mineurs.length || r.retires.mineurs.length ? `sorts mineurs : ${[r.retires.mineurs.length ? `− ${liste(r.retires.mineurs)}` : '', r.ajoutes.mineurs.length ? `+ ${liste(r.ajoutes.mineurs)}` : ''].filter(Boolean).join(', ')}` : '',
        ].filter(Boolean);
        t.emettre({ type: 'constat', texte: `${h.nom} change ses sorts — ${phrases.join(' ; ')}.` });
      },
      propositions: (_ctx, p): Proposition[] =>
        p.scene.type !== 'exploration'
          ? []
          : preparateurs(p).map((a) => ({
              groupe: PANNEAU_PREPARATION,
              element: { id: `${a.id}:preparer`, titre: `${a.nom} — ${descriptionDroits(a.preparation)} à changer` },
              icone: 'base:revoir',
              libelle: 'Préparer ses sorts',
              aide: `Choisir ses sorts préparés (${a.fiche.sortsPrepares.length} / ${a.fiche.incantation?.sortsPrepares ?? 0}).`,
              ordre: { type: 'changerSortsPrepares', personnage: a.id },
              intention: 'preparer' as const,
            })),
    }),
    imposerLesMains: commande({
      description: "Imposition des mains (paladin) : puiser dans sa réserve pour rendre des PV à un héros (le plus blessé par défaut), hors combat.",
      entree: z.object({ paladin: z.string(), cible: z.string().optional() }),
      disponible: libre,
      executer: (t, e) => {
        const a = t.partie.groupe.find((x) => x.id === e.paladin);
        if (!a || a.pv <= 0) return { refus: 'Ce héros ne peut pas imposer les mains.' };
        const reserve = a.ressources.impositionDesMains ?? 0;
        if (reserve <= 0) return { refus: `${a.nom} n'a plus de réserve d'Imposition des mains (elle revient au repos long).` };
        const c = e.cible ? t.partie.groupe.find((x) => x.id === e.cible) : plusBlesse(t.partie);
        if (!c || c.pv >= c.fiche.pvMax) return { refus: 'Personne n’a besoin de soins.' };
        const soin = Math.min(reserve, c.fiche.pvMax - c.pv);
        c.pv += soin;
        a.ressources.impositionDesMains = reserve - soin;
        t.emettre({ type: 'constat', texte: `${a.nom} impose les mains à ${c.nom} : +${soin} PV (${c.pv}/${c.fiche.pvMax}) ; réserve ${reserve - soin}.` });
      },
      propositions: (_ctx, p): Proposition[] => {
        const blesse = plusBlesse(p);
        return paladins(p).map((a) => ({
          groupe: PANNEAU_SOINS,
          element: { id: `${a.id}:imposition`, titre: `${a.nom} — Imposition des mains (${a.ressources.impositionDesMains} PV)` },
          icone: 'sort:soins',
          libelle: blesse ? `Soigner ${blesse.nom}` : 'Soigner',
          ordre: { type: 'imposerLesMains', paladin: a.id },
          desactivee: a.pv <= 0 ? `${a.nom} est hors de combat.` : !blesse ? 'Personne n’est blessé.' : undefined,
        }));
      },
    }),
    lancerSort: commande({
      description: 'Lancer hors combat un sort de soins connu, en dépensant un emplacement ; sans cible, sur le héros le plus blessé (ou tout le groupe pour un sort à plusieurs cibles).',
      entree: z.object({ lanceur: z.string(), sort: z.string(), cible: z.string().optional() }),
      disponible: libre,
      executer: (t, e) => {
        const a = t.partie.groupe.find((x) => x.id === e.lanceur);
        if (!a || a.pv <= 0) return { refus: 'Ce héros ne peut pas lancer de sort.' };
        const s = sortsConnus(t.ctx, a).find((x) => x.id === e.sort);
        if (!s) return { refus: `${a.nom} ne connaît pas ce sort.` };
        if (!s.soins) return { refus: `${s.nom} se lance en combat, ou se raconte avec le conteur.` };
        const i = s.niveau > 0 ? emplacementPour(a, s.niveau) : undefined;
        if (s.niveau > 0 && i === undefined) return { refus: `${a.nom} n'a plus d'emplacement de niveau ${s.niveau} ou plus.` };
        const cibles = soinsDeGroupe(s)
          ? t.partie.groupe.filter((x) => x.pv < x.fiche.pvMax).slice(0, s.cibles ?? 6)
          : [e.cible ? t.partie.groupe.find((x) => x.id === e.cible) : plusBlesse(t.partie)].filter((x): x is Personnage => !!x && x.pv < x.fiche.pvMax);
        if (!cibles.length) return { refus: 'Personne n’a besoin de soins.' };
        if (i !== undefined) a.emplacements[i] = (a.emplacements[i] ?? 0) - 1;
        const bonus = s.soins.ajouterModificateur ? (a.fiche.caracteristiques[a.fiche.incantation!.caracteristique]?.modificateur ?? 0) : 0;
        const effets = cibles.map((c) => {
          const avant = c.pv;
          c.pv = Math.min(c.fiche.pvMax, c.pv + Math.max(1, lancer(s.soins!.des, t.hasard).total + bonus));
          return `${c.nom} +${c.pv - avant} PV (${c.pv}/${c.fiche.pvMax})`;
        });
        t.emettre({ type: 'constat', texte: `${a.nom} lance ${s.nom}${i !== undefined ? ` (emplacement de niveau ${i + 1})` : ''} : ${effets.join(', ')}.` });
        t.emettre({ type: 'sortLance', lanceur: a.id, sort: s.id, niveau: i === undefined ? 0 : i + 1, cibles: cibles.map((c) => c.id) });
      },
      propositions: (ctx, p): Proposition[] => {
        const blesse = plusBlesse(p);
        return lanceurs(p).flatMap((a) =>
          sortsConnus(ctx, a)
            .filter((s) => s.soins)
            .map((s) => {
              const sansEmplacement = s.niveau > 0 && emplacementPour(a, s.niveau) === undefined;
              return {
                groupe: PANNEAU_SOINS,
                element: { id: `${a.id}:${s.id}`, titre: `${a.nom} — ${s.nom}` },
                icone: 'sort:soins',
                libelle: soinsDeGroupe(s) ? 'Soigner le groupe' : blesse ? `Soigner ${blesse.nom}` : 'Soigner',
                aide: s.resume,
                ordre: { type: 'lancerSort', lanceur: a.id, sort: s.id },
                desactivee: a.pv <= 0 ? `${a.nom} est hors de combat.` : sansEmplacement ? 'Plus d’emplacement.' : !blesse ? 'Personne n’est blessé.' : undefined,
              };
            }),
        );
      },
    }),
  },
  encarts: (ctx, p): Encart[] =>
    lanceurs(p).map((a, n) => {
      const sorts = sortsConnus(ctx, a);
      const ids = new Set(sorts.map((s) => s.id));
      const max = a.fiche.incantation!.emplacements;
      return {
        onglet: 'Grimoire',
        id: `grimoire:${a.id}`,
        titre: `${a.nom}`,
        ordre: n,
        texte: `DD des sorts ${a.fiche.incantation!.ddSauvegarde}, attaque +${a.fiche.incantation!.bonusAttaque}.`,
        lignes: [
          // La « place en mémoire » : combien de sorts préparés sur combien permis, et quand les changer.
          ...(a.fiche.incantation!.sortsPrepares > 0
            ? [
                { libelle: 'Sorts préparés', valeur: `${a.fiche.sortsPrepares.length} / ${a.fiche.incantation!.sortsPrepares}`, detail: a.preparation && descriptionDroits(a.preparation) ? `Peut changer : ${descriptionDroits(a.preparation)}.` : a.choix && prochainChangement(a) ? `Changement possible : ${prochainChangement(a)}.` : undefined, ton: a.preparation ? ('succes' as const) : undefined },
              ]
            : []),
          ...a.emplacements.map((v, i) => ({ libelle: `Emplacements de niveau ${i + 1}`, valeur: `${v} / ${a.fiche.incantation!.niveauEmplacementPacte ? v : (max[i] ?? v)}`, ton: v ? ('fort' as const) : ('faible' as const) })).filter((_, i) => (max[i] ?? 0) > 0 || a.fiche.incantation!.niveauEmplacementPacte),
          ...sorts.map((s) => ({ libelle: s.nom, valeur: s.niveau ? `niveau ${s.niveau}` : 'mineur', detail: s.resume, ton: s.soins ? ('succes' as const) : undefined, fiche: ficheDeSort(s), sort: s.id })),
          // Le grimoire du Magicien : les sorts qu'il connaît sans les avoir préparés (on ne les lance pas avant de les préparer).
          ...(a.fiche.grimoire ?? [])
            .filter((id) => !ids.has(id))
            .map((id) => ctx.srd?.sorts.get(id))
            .filter((s): s is Sort => !!s)
            .sort((x, y) => x.niveau - y.niveau || x.nom.localeCompare(y.nom))
            .map((s) => ({ libelle: s.nom, valeur: `niveau ${s.niveau} · grimoire`, detail: `${s.resume} (dans le grimoire : à préparer avant de le lancer)`, ton: 'faible' as const, fiche: ficheDeSort(s), sort: s.id })),
        ],
      };
    }),
};
