// Module Scènes narrées : les « cinématiques » d'une histoire. Une scène est une suite de plans (une image du monde
// avec un léger mouvement, un texte, une voix) jouée quand quelque chose arrive : le début de l'histoire, la première
// entrée dans un lieu, une quête qui change, un fait appris, une fin. Les voix sont générées une fois et livrées
// avec le monde (`voix/<scene>-<plan>.mp3`), comme les images : gratuites pour le joueur.
import { z } from 'zod';
import { SceneNarree } from '../monde/scenes-donnees';
import type { DonneesMonde } from '../monde/schemas';
import { commande, type ContexteJeu, type EvenementJeu, type Module, type Partie, type Transaction } from '../noyau/types';

// Les schémas (PlanScene, DeclencheurScene, SceneNarree) vivent dans monde/scenes-donnees.ts ; on les réexporte pour ceux qui les importaient d'ici.
export { PlanScene, DeclencheurScene, SceneNarree } from '../monde/scenes-donnees';

declare module '../noyau/types' {
  interface CarteEvenements {
    sceneNarree: { scene: string };
  }
}

export interface EtatScenes {
  /** Scènes déjà jouées. */
  vues: string[];
  /** Scènes à jouer, dans l'ordre. */
  file: string[];
}

const cache = new WeakMap<DonneesMonde, { scenes: SceneNarree[]; erreurs: string[] }>();

/** Les scènes d'un monde (dossier `scenes/`), validées une fois. */
export function scenesDu(dm: DonneesMonde): { scenes: SceneNarree[]; erreurs: string[] } {
  let r = cache.get(dm);
  if (!r) {
    r = { scenes: [], erreurs: [] };
    for (const [i, brut] of (dm.extensions?.['scenes'] ?? []).entries()) {
      const s = SceneNarree.safeParse(brut);
      if (s.success) r.scenes.push(s.data);
      else r.erreurs.push(`Scène « ${(brut as { id?: string })?.id ?? `#${i}`} » : ${s.error.issues[0]?.path.join('.')} — ${s.error.issues[0]?.message}`);
    }
    cache.set(dm, r);
  }
  return r;
}

const etat = (p: Partie): EtatScenes => ((p.modules['scenes'] ??= { vues: [], file: [] }) as EtatScenes);

/** La scène à jouer maintenant, s'il y en a une. */
export function sceneEnCours(ctx: ContexteJeu, p: Partie): SceneNarree | undefined {
  const id = (p.modules['scenes'] as EtatScenes | undefined)?.file[0];
  return id ? scenesDu(ctx.dm).scenes.find((s) => s.id === id) : undefined;
}

/** Les scènes qu'un événement déclenche. */
function declenchees(ctx: ContexteJeu, e: EvenementJeu): SceneNarree[] {
  return scenesDu(ctx.dm).scenes.filter(({ declencheur: d }) => {
    if ('debut' in d) return e.type === 'arrivee';
    if ('lieu' in d) return (e.type === 'deplacement' && e.vers === d.lieu) || (e.type === 'arrivee' && e.lieu === d.lieu);
    if ('quete' in d) return e.type === 'queteMiseAJour' && e.quete === d.quete && e.statut === d.statut;
    if ('fait' in d) return e.type === 'faitAppris' && e.fait === d.fait;
    return e.type === 'fin' && e.fin === d.fin;
  });
}

function reagir(t: Transaction, e: EvenementJeu): void {
  const es = etat(t.partie);
  for (const s of declenchees(t.ctx, e)) {
    if (es.file.includes(s.id) || (s.unique && es.vues.includes(s.id))) continue;
    es.file.push(s.id);
    t.emettre({ type: 'sceneNarree', scene: s.id });
  }
}

export const moduleScenes: Module = {
  id: 'scenes',
  etatInitial: (): EtatScenes => ({ vues: [], file: [] }),
  reactions: {
    arrivee: reagir,
    deplacement: reagir,
    queteMiseAJour: reagir,
    faitAppris: reagir,
    fin: reagir,
  },
  commandes: {
    terminerScene: commande({
      description: 'La scène narrée en cours est finie (vue ou passée).',
      entree: z.object({ scene: z.string() }),
      executer: (t, e) => {
        const es = etat(t.partie);
        if (!es.file.includes(e.scene)) return { refus: "Cette scène n'est pas en cours." };
        es.file = es.file.filter((x) => x !== e.scene);
        if (!es.vues.includes(e.scene)) es.vues.push(e.scene);
      },
    }),
    revoirScene: commande({
      description: 'Revoir une scène narrée déjà vue.',
      entree: z.object({ scene: z.string() }),
      executer: (t, e) => {
        const es = etat(t.partie);
        if (!es.vues.includes(e.scene)) return { refus: "Cette scène n'a pas encore été vue." };
        if (!es.file.includes(e.scene)) es.file.push(e.scene);
      },
      propositions: (ctx, p) => {
        const vues = (p.modules['scenes'] as EtatScenes | undefined)?.vues ?? [];
        return scenesDu(ctx.dm)
          .scenes.filter((s) => vues.includes(s.id))
          .map((s) => ({ groupe: { id: 'scenes', titre: 'Scènes', ordre: 30, onglet: 'Journal' }, libelle: `Revoir : ${s.nom}`, icone: 'base:revoir', style: 'discret' as const, ordre: { type: 'revoirScene', scene: s.id } }));
      },
    }),
  },
  vues: {
    sceneEnCours,
  },
  valider: (ctx) => {
    const { scenes, erreurs } = scenesDu(ctx.dm);
    const dm = ctx.dm;
    const groupes = { lieux: dm.lieux, pnj: dm.pnj, objets: dm.objets } as Record<string, Map<string, unknown>>;
    const monstres = new Set([...dm.rencontres.values()].flatMap((r) => r.monstres.map((m) => m.profil)));
    for (const s of scenes) {
      const d = s.declencheur;
      if ('lieu' in d && !dm.lieux.has(d.lieu)) erreurs.push(`Scène « ${s.id} » : lieu inconnu « ${d.lieu} ».`);
      if ('quete' in d && !dm.quetes.has(d.quete)) erreurs.push(`Scène « ${s.id} » : quête inconnue « ${d.quete} ».`);
      if ('fait' in d && !dm.faits.has(d.fait)) erreurs.push(`Scène « ${s.id} » : fait inconnu « ${d.fait} ».`);
      if ('fin' in d && !dm.fins.has(d.fin)) erreurs.push(`Scène « ${s.id} » : fin inconnue « ${d.fin} ».`);
      for (const [i, plan] of s.plans.entries()) {
        if (!plan.image) continue;
        const connu = plan.image.groupe === 'monstres' ? monstres.has(plan.image.id) : groupes[plan.image.groupe]?.has(plan.image.id);
        if (!connu) erreurs.push(`Scène « ${s.id} », plan ${i + 1} : image inconnue « ${plan.image.groupe}/${plan.image.id} ».`);
      }
    }
    const ids = scenes.map((s) => s.id);
    for (const id of ids.filter((x, i) => ids.indexOf(x) !== i)) erreurs.push(`Scène « ${id} » : identifiant en double.`);
    return erreurs;
  },
};
