// Module Grimoire : le livre de sorts des héros qui en lancent (sorts mineurs, sorts préparés, emplacements restants)
// et les sorts de soins lancés hors combat. Les autres sorts se lancent en combat, ou se racontent avec le conteur.
import { z } from 'zod';
import { lancer } from '../des';
import { commande, type ContexteJeu, type Encart, type Module, type Partie, type Proposition } from '../noyau/types';
import type { Personnage } from '../personnage';
import type { Sort } from '../schemas';
import { libre } from './commun';
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

export const moduleGrimoire: Module = {
  id: 'grimoire',
  commandes: {
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
      const max = a.fiche.incantation!.emplacements;
      return {
        onglet: 'Grimoire',
        id: `grimoire:${a.id}`,
        titre: `${a.nom}`,
        ordre: n,
        texte: `DD des sorts ${a.fiche.incantation!.ddSauvegarde}, attaque +${a.fiche.incantation!.bonusAttaque}.`,
        lignes: [
          ...a.emplacements.map((v, i) => ({ libelle: `Emplacements de niveau ${i + 1}`, valeur: `${v} / ${a.fiche.incantation!.niveauEmplacementPacte ? v : (max[i] ?? v)}`, ton: v ? ('fort' as const) : ('faible' as const) })).filter((_, i) => (max[i] ?? 0) > 0 || a.fiche.incantation!.niveauEmplacementPacte),
          ...sorts.map((s) => ({ libelle: s.nom, valeur: s.niveau ? `niveau ${s.niveau}` : 'mineur', detail: s.resume, ton: s.soins ? ('succes' as const) : undefined })),
        ],
      };
    }),
};
