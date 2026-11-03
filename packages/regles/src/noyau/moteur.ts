// Le moteur : il assemble les modules et exécute les commandes. Chaque action est une transaction sur une copie
// de la partie ; l'ancienne partie n'est jamais modifiée (annuler, comparer, rejouer deviennent simples).
import { generateurSur } from '../des';
import { etatInitial } from '../monde/etat';
import { etatExplorationVide } from '../monde/exploration';
import type { Personnage } from '../personnage';
import { differences } from './differences';
import { migrer } from './migrations';
import { VERSION_PARTIE, type CommandeJeu, type ContexteJeu, type EvenementJeu, type Module, type Ordre, type Partie, type ResultatOrdre, type Transaction } from './types';

export interface Moteur {
  ctx: ContexteJeu;
  modules: Module[];
  nouvellePartie(groupe: Personnage[], options?: { graine?: number; niveau?: number }): Partie;
  executer(partie: Partie, ordre: Ordre): ResultatOrdre;
  /** Les commandes connues, avec leur disponibilité dans la partie (pour les boutons et le conteur). */
  commandes(partie?: Partie): { type: string; module: string; description: string; commande: CommandeJeu; disponible: true | string }[];
  vue<T = unknown>(id: string, partie: Partie): T;
  /** Relit une partie sauvegardée (JSON) ; refuse une version inconnue. */
  charger(json: string): Partie;
}

/** Nombre maximal de vagues de réactions (un module qui réagit à un événement émis par une réaction…). */
const VAGUES_MAX = 10;

export function creerMoteur(ctx: ContexteJeu, modules: Module[]): Moteur {
  const ids = new Set(modules.map((m) => m.id));
  for (const m of modules) for (const d of m.dependances ?? []) if (!ids.has(d)) throw new Error(`Module « ${m.id} » : dépend de « ${d} », absent.`);
  const index = new Map<string, { module: Module; commande: CommandeJeu }>();
  for (const m of modules) {
    for (const [nom, c] of Object.entries(m.commandes ?? {})) {
      if (index.has(nom)) throw new Error(`CommandeJeu « ${nom} » déclarée par « ${index.get(nom)!.module.id} » et « ${m.id} ».`);
      index.set(nom, { module: m, commande: c });
    }
  }
  const vues = new Map<string, (ctx: ContexteJeu, p: Partie) => unknown>();
  for (const m of modules) for (const [nom, v] of Object.entries(m.vues ?? {})) vues.set(nom, v);

  const reagir = (t: Transaction, evenements: EvenementJeu[]) => {
    for (const e of evenements) {
      for (const m of modules) {
        const r = m.reactions?.[e.type] as ((t: Transaction, e: EvenementJeu) => void) | undefined;
        r?.(t, e);
      }
    }
  };

  return {
    ctx,
    modules,

    nouvellePartie(groupe, options = {}) {
      const { dm } = ctx;
      const niveau = options.niveau ?? dm.monde.niveaux.min;
      return {
        version: VERSION_PARTIE,
        monde: dm.monde.id,
        graine: (options.graine ?? Math.floor(Math.random() * 2 ** 31)) >>> 0,
        scene: { type: 'exploration' },
        groupe: structuredClone(groupe),
        etat: { ...etatInitial(dm, niveau), exploration: etatExplorationVide() },
        modules: Object.fromEntries(modules.filter((m) => m.etatInitial).map((m) => [m.id, m.etatInitial!(ctx)])),
        journal: [],
      };
    },

    executer(partie, ordre) {
      const entree = index.get(ordre.type);
      const refuser = (texte: string): ResultatOrdre => ({ partie, evenements: [{ type: 'refus', texte }], refus: texte });
      if (!entree) return refuser(`CommandeJeu inconnue : ${ordre.type}.`);
      const { type: _type, ...parametres } = ordre;
      const valide = entree.commande.entree.safeParse(parametres);
      if (!valide.success) return refuser(`${ordre.type} : ${valide.error.issues.map((i) => `${i.path.join('.') || 'entrée'} — ${i.message}`).join(' ; ')}`);
      const dispo = entree.commande.disponible?.(ctx, partie) ?? true;
      if (dispo !== true) return refuser(dispo);

      const brouillon = structuredClone(partie);
      let emis: EvenementJeu[] = [];
      const t: Transaction = { ctx, partie: brouillon, hasard: generateurSur(brouillon), emettre: (e) => emis.push(e) };
      const r = entree.commande.executer(t, valide.data);
      if (r && 'refus' in r) return refuser(r.refus);

      // Le déplacement d'abord (le récit annonce le lieu), puis ce que la commande a émis, puis les autres changements d'état.
      const tous: EvenementJeu[] = [];
      let reference: Partie = partie;
      for (let vague = 0; vague < VAGUES_MAX; vague++) {
        const diff = differences(reference, brouillon);
        const vagueEv = [...diff.filter((e) => e.type === 'deplacement'), ...emis, ...diff.filter((e) => e.type !== 'deplacement')];
        if (!vagueEv.length) break;
        tous.push(...vagueEv);
        reference = structuredClone(brouillon);
        emis = [];
        reagir(t, vagueEv);
      }
      brouillon.journal.push(...tous);
      return { partie: brouillon, evenements: tous };
    },

    commandes(partie) {
      return [...index.entries()].map(([type, { module, commande }]) => ({
        type,
        module: module.id,
        description: commande.description,
        commande,
        disponible: partie ? (commande.disponible?.(ctx, partie) ?? true) : true,
      }));
    },

    vue<T>(id: string, partie: Partie) {
      const v = vues.get(id);
      if (!v) throw new Error(`Vue inconnue : ${id}.`);
      return v(ctx, partie) as T;
    },

    charger(json) {
      const p = migrer(JSON.parse(json) as Record<string, unknown> & { version: number }) as unknown as Partie;
      if (p.monde !== ctx.dm.monde.id) throw new Error(`Sauvegarde du monde « ${p.monde} », pas « ${ctx.dm.monde.id} ».`);
      return p;
    },
  };
}
