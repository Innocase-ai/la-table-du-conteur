// Module Dilemmes : les choix difficiles d'une histoire. Un dilemme s'ouvre quand sa condition devient vraie ; le joueur
// voit ce que chaque option coûte et rapporte avant de trancher, et l'abstention a elle aussi un prix. Un choix pose des
// drapeaux (`choix-<dilemme>`, `choix-<dilemme>-<option>`) que le reste du monde peut lire (PNJ, rencontres, fins), laisse
// des échos plusieurs jours plus tard, et s'inscrit dans la « Chronique des choix » du journal et dans les épilogues.
import { z } from 'zod';
import { dilemmesDe, drapeauxChoix, type Dilemme, type OptionDilemme } from '../monde/dilemmes-donnees';
import { evaluerCondition } from '../monde/etat';
import { jouerEffets, testLibre, type CompteRendu } from '../monde/exploration';
import type { EffetMonde } from '../monde/schemas';
import { commande, type Encart, type Module, type Partie, type Proposition, type Transaction } from '../noyau/types';
import { enExploration, partieMonde, verser } from './commun';

declare module '../noyau/types' {
  interface CarteEvenements {
    dilemmeOuvert: { dilemme: string };
    dilemmeTranche: { dilemme: string; option: string; automatique: boolean };
  }
}

export interface EtatDilemmes {
  /** Dilemmes ouverts (pas encore tranchés) : le jour de leur ouverture. */
  ouverts: Record<string, number>;
  /** Dilemmes tranchés : l'option choisie (`abstention` si le joueur n'a pas tranché), le jour, le résultat du jet s'il y en a un. */
  choix: Record<string, { option: string; jour: number; reussite?: boolean; automatique?: boolean }>;
  /** Échos à jouer : le dilemme, l'indice de l'écho dans ses `echos`, le jour où il survient. */
  echos: { dilemme: string; echo: number; jour: number }[];
}

const vide = (): EtatDilemmes => ({ ouverts: {}, choix: {}, echos: [] });
const etat = (p: Partie): EtatDilemmes => ((p.modules['dilemmes'] ??= vide()) as EtatDilemmes);

const PANNEAU = (d: Dilemme, delai: number | undefined) => ({
  id: `dilemme:${d.id}`,
  titre: `Un choix s'impose : ${d.titre}`,
  ordre: 5,
  description: delai !== undefined ? `${d.situation}\n\nIl faut décider avant le jour ${delai}.` : d.situation,
  danger: delai !== undefined,
});

const ligne = (prefixe: string, l: string[]) => `${prefixe} ${l.join(' · ')}`;

/** Le texte « coût / gain » montré sous un bouton, avant que le joueur ne tranche. */
const apercu = (couts: string[], gains?: string[]) => [ligne('Coût :', couts), ...(gains ? [ligne('Gain :', gains)] : [])].join('\n');

/** Les dilemmes que le joueur peut trancher maintenant (ouverts, pas tranchés, bon lieu). */
function actifs(ctx: { dm: Parameters<typeof dilemmesDe>[0] }, p: Partie): Dilemme[] {
  const es = p.modules['dilemmes'] as EtatDilemmes | undefined;
  return dilemmesDe(ctx.dm).dilemmes.filter((d) => es?.ouverts[d.id] !== undefined && !es.choix[d.id] && (!d.lieu || d.lieu === p.etat.lieu));
}

/** Applique un choix : drapeaux, effets (ou échec du jet), échos programmés, mémoire. */
function appliquerChoix(t: Transaction, d: Dilemme, option: OptionDilemme | 'abstention', automatique: boolean): CompteRendu | string {
  const es = etat(t.partie);
  const p = partieMonde(t);
  const id = option === 'abstention' ? 'abstention' : option.id;
  let base: CompteRendu | undefined;
  let effets: EffetMonde[];
  let reussite: boolean | undefined;
  if (option === 'abstention') effets = d.abstention.effets;
  else if (option.jet) {
    base = testLibre(p, option.jet.competence, option.jet.dd);
    if (!base.ok) return base.refus ?? 'Personne ne peut le tenter.';
    reussite = base.jets[0]?.reussite ?? false;
    effets = reussite ? option.effets : (option.echec ?? []);
  } else effets = option.effets;
  const libelle = option === 'abstention' ? d.abstention.libelle : option.libelle;
  const constat = automatique ? `Faute de décision à temps, le choix se fait de lui-même : « ${d.titre} » — ${libelle}` : `Vous tranchez : « ${libelle} »`;
  const marques: EffetMonde[] = drapeauxChoix(d.id, id).map((flag) => ({ flag }));
  const cr = jouerEffets(p, [constat], [...marques, ...effets], base);
  delete es.ouverts[d.id];
  es.choix[d.id] = { option: id, jour: t.partie.etat.jour, ...(reussite !== undefined ? { reussite } : {}), ...(automatique ? { automatique } : {}) };
  d.echos.forEach((e, i) => {
    if (e.si === id) es.echos.push({ dilemme: d.id, echo: i, jour: t.partie.etat.jour + e.apres });
  });
  t.emettre({ type: 'dilemmeTranche', dilemme: d.id, option: id, automatique });
  return cr;
}

/** Ouvre les dilemmes dont la condition est vraie ; applique les délais échus et les échos arrivés à échéance. */
function reagir(t: Transaction): void {
  const es = etat(t.partie);
  const jour = t.partie.etat.jour;
  for (const d of dilemmesDe(t.ctx.dm).dilemmes) {
    if (es.ouverts[d.id] !== undefined || es.choix[d.id]) continue;
    if (!evaluerCondition(d.quand, t.partie.etat)) continue;
    es.ouverts[d.id] = jour;
    t.emettre({ type: 'dilemmeOuvert', dilemme: d.id });
    t.emettre({ type: 'texte', texte: d.situation });
    t.emettre({ type: 'constat', texte: `Un choix s'impose : ${d.titre}.${d.delai ? ` Il faut décider avant le jour ${jour + d.delai}.` : ''}` });
  }
  for (const d of dilemmesDe(t.ctx.dm).dilemmes) {
    const ouvert = es.ouverts[d.id];
    if (ouvert === undefined || d.delai === undefined || jour < ouvert + d.delai) continue;
    const r = appliquerChoix(t, d, 'abstention', true);
    if (typeof r !== 'string') verser(t, r);
  }
  const dus = es.echos.filter((x) => x.jour <= jour);
  if (!dus.length) return;
  es.echos = es.echos.filter((x) => x.jour > jour);
  for (const x of dus) {
    const echo = dilemmesDe(t.ctx.dm).dilemmes.find((d) => d.id === x.dilemme)?.echos[x.echo];
    if (!echo) continue;
    verser(t, jouerEffets(partieMonde(t), [], [...(echo.annonce ? [{ narration: echo.annonce }] : []), ...echo.effets]));
  }
}

/** À la fin de l'histoire : ce que chaque grand choix a laissé derrière lui. */
function epilogues(t: Transaction): void {
  const es = etat(t.partie);
  const lignes = dilemmesDe(t.ctx.dm)
    .dilemmes.filter((d) => es.choix[d.id])
    .sort((a, b) => (es.choix[a.id]?.jour ?? 0) - (es.choix[b.id]?.jour ?? 0))
    .flatMap((d) => {
      const c = es.choix[d.id]!;
      const texte = c.option === 'abstention' ? d.abstention.epilogue : d.options.find((o) => o.id === c.option)?.epilogue;
      return texte ? [texte] : [];
    });
  if (!lignes.length) return;
  t.emettre({ type: 'constat', texte: 'Ce que vos choix ont laissé derrière eux :' });
  for (const texte of lignes) t.emettre({ type: 'texte', texte });
}

export const moduleDilemmes: Module = {
  id: 'dilemmes',
  etatInitial: vide,
  reactions: {
    arrivee: reagir,
    deplacement: reagir,
    queteMiseAJour: reagir,
    faitAppris: reagir,
    jaugeChange: reagir,
    jourSuivant: reagir,
    objetObtenu: reagir,
    texte: reagir,
    fin: epilogues,
  },
  commandes: {
    trancher: commande({
      description: 'Trancher un dilemme ouvert en choisissant une option (ou `abstention` pour ne pas décider) : les coûts et les gains sont annoncés avant.',
      entree: z.object({ dilemme: z.string(), option: z.string() }),
      disponible: (_ctx, p) => (enExploration(p) ? true : 'On ne tranche pas pendant une conversation ou une rencontre.'),
      executer: (t, e) => {
        const d = dilemmesDe(t.ctx.dm).dilemmes.find((x) => x.id === e.dilemme);
        const es = etat(t.partie);
        if (!d) return { refus: 'Aucun choix de ce nom.' };
        if (es.choix[d.id]) return { refus: 'Ce choix est déjà tranché.' };
        if (es.ouverts[d.id] === undefined) return { refus: "Ce choix ne se pose pas encore." };
        if (d.lieu && d.lieu !== t.partie.etat.lieu) return { refus: 'Ce choix se fait ailleurs.' };
        const option = e.option === 'abstention' ? ('abstention' as const) : d.options.find((o) => o.id === e.option);
        if (!option) return { refus: 'Option inconnue.' };
        if (option !== 'abstention' && option.condition && !evaluerCondition(option.condition, t.partie.etat)) return { refus: 'Cette option ne vous est pas ouverte.' };
        if (option !== 'abstention' && option.requis && !evaluerCondition(option.requis, t.partie.etat)) return { refus: option.requisTexte ?? 'Il vous manque ce qu’il faut pour tenter cela.' };
        const r = appliquerChoix(t, d, option, false);
        return typeof r === 'string' ? { refus: r } : verser(t, r);
      },
      propositions: (ctx, p): Proposition[] => {
        const es = p.modules['dilemmes'] as EtatDilemmes | undefined;
        return actifs(ctx, p).flatMap((d) => {
          const limite = d.delai !== undefined && es?.ouverts[d.id] !== undefined ? es.ouverts[d.id]! + d.delai : undefined;
          const groupe = PANNEAU(d, limite);
          const options: Proposition[] = d.options
            .filter((o) => !o.condition || evaluerCondition(o.condition, p.etat))
            .map((o) => ({
              groupe,
              libelle: o.libelle,
              ...(o.ton ? { etiquette: o.ton } : {}),
              apercu: apercu(o.couts, o.gains),
              aide: o.jet ? `Incertain : un jet de ${o.jet.competence} (DD ${o.jet.dd}). Raté, le choix se fait quand même, mais autrement.` : undefined,
              style: 'principal' as const,
              ordre: { type: 'trancher', dilemme: d.id, option: o.id },
              ...(o.requis && !evaluerCondition(o.requis, p.etat) ? { desactivee: o.requisTexte ?? 'Il vous manque ce qu’il faut pour tenter cela.' } : {}),
            }));
          const abstention: Proposition = {
            groupe,
            libelle: d.abstention.libelle,
            etiquette: 'Attendre',
            apercu: apercu(d.abstention.couts),
            style: 'discret',
            ordre: { type: 'trancher', dilemme: d.id, option: 'abstention' },
            confirmer: true,
          };
          return [...options, abstention];
        });
      },
    }),
  },
  encarts: (ctx, p): Encart[] => {
    const es = p.modules['dilemmes'] as EtatDilemmes | undefined;
    const tous = dilemmesDe(ctx.dm).dilemmes;
    const ouverts = tous.filter((d) => es?.ouverts[d.id] !== undefined && !es.choix[d.id]);
    const tranches = tous.filter((d) => es?.choix[d.id]).sort((a, b) => (es!.choix[a.id]!.jour - es!.choix[b.id]!.jour));
    if (!ouverts.length && !tranches.length) return [];
    return [
      ...(ouverts.length
        ? [
            {
              onglet: 'Journal',
              id: 'dilemmes-ouverts',
              titre: 'Choix en suspens',
              ordre: 3,
              lignes: ouverts.map((d) => {
                const limite = d.delai !== undefined ? es!.ouverts[d.id]! + d.delai : undefined;
                return { libelle: d.titre, valeur: limite !== undefined ? `avant le jour ${limite}` : 'à trancher', detail: d.situation, ton: limite !== undefined ? ('danger' as const) : ('fort' as const) };
              }),
            },
          ]
        : []),
      ...(tranches.length
        ? [
            {
              onglet: 'Journal',
              id: 'dilemmes-chronique',
              titre: 'Chronique des choix',
              ordre: 4,
              lignes: tranches.map((d) => {
                const c = es!.choix[d.id]!;
                const o = c.option === 'abstention' ? undefined : d.options.find((x) => x.id === c.option);
                const libelle = o?.libelle ?? d.abstention.libelle;
                const couts = o?.couts ?? d.abstention.couts;
                return {
                  libelle: d.titre,
                  valeur: `jour ${c.jour}`,
                  detail: [`« ${libelle} »`, c.automatique ? '(faute de décision à temps)' : '', c.reussite === false ? '(le jet a échoué)' : '', ligne('Coût :', couts), o ? ligne('Gain :', o.gains) : '']
                    .filter(Boolean)
                    .join('\n'),
                };
              }),
            },
          ]
        : []),
    ];
  },
  valider: (ctx) => {
    const { dilemmes, erreurs } = dilemmesDe(ctx.dm);
    const ids = dilemmes.map((d) => d.id);
    for (const id of ids.filter((x, i) => ids.indexOf(x) !== i)) erreurs.push(`Dilemme « ${id} » : identifiant en double.`);
    for (const d of dilemmes) {
      const options = d.options.map((o) => o.id);
      for (const id of options.filter((x, i) => options.indexOf(x) !== i)) erreurs.push(`Dilemme « ${d.id} » : option « ${id} » en double.`);
      if (options.includes('abstention')) erreurs.push(`Dilemme « ${d.id} » : « abstention » est réservé à l'abstention.`);
      for (const e of d.echos) if (e.si !== 'abstention' && !options.includes(e.si)) erreurs.push(`Dilemme « ${d.id} » : un écho suit l'option inconnue « ${e.si} ».`);
    }
    return erreurs;
  },
  conseils: (ctx) => {
    const avis: string[] = [];
    for (const d of dilemmesDe(ctx.dm).dilemmes) {
      for (const o of d.options) {
        const effets = [...o.effets, ...(o.echec ?? [])];
        if (!effets.length) avis.push(`Dilemme « ${d.id} », option « ${o.id} » : aucun effet, le choix ne changera rien (ajoutez au moins un drapeau lu plus loin).`);
        // Un coût ou un gain « mesurable » se voit dans la suite : jauge, réputation, PNJ, objet, argent, quête, rencontre, fin.
        else if (!effets.some((e) => !('flag' in e || 'narration' in e || 'fait' in e || 'xp' in e)))
          avis.push(`Dilemme « ${d.id} », option « ${o.id} » : ses effets sont seulement narratifs (drapeau, texte, fait) : ajoutez un coût ou un gain que le joueur verra (jauge, réputation, PNJ, objet…).`);
      }
      if (!d.echos.length) avis.push(`Dilemme « ${d.id} » : aucun écho. Un grand choix doit laisser une trace dans la suite (un PNJ qui revient, une rencontre, une jauge).`);
      if (d.options.some((o) => !o.epilogue)) avis.push(`Dilemme « ${d.id} » : toutes les options n'ont pas d'épilogue (une phrase de « ce qu'il est advenu »).`);
      if (new Set(d.options.map((o) => JSON.stringify([o.effets, o.echec]))).size < d.options.length) avis.push(`Dilemme « ${d.id} » : deux options ont exactement les mêmes effets.`);
    }
    return avis;
  },
};
