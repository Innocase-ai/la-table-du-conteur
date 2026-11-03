// Module Exploration : se déplacer, fouiller, ouvrir, désarmer, prendre, résoudre les énigmes, se reposer,
// régler les rencontres. Les règles sont dans monde/exploration.ts ; ce module les expose en commandes.
import { z } from 'zod';
import { Competence, Caracteristique } from '../schemas';
import {
  aller,
  commencer,
  desarmer,
  fouiller,
  indiceEnigme,
  issueRencontre,
  ouvrir,
  prendre,
  repondreEnigme,
  seReposer,
  testLibre,
} from '../monde/exploration';
import { ficheDeScene } from '../monde/scene';
import { commande, type Module } from '../noyau/types';
import { appliquerEtat } from '../personnage';
import { libre, partieMonde, verser } from './commun';

const Personnage = z.string().optional().describe("Id du personnage qui agit ; sans lui, le meilleur du groupe pour l'action.");

export const moduleExploration: Module = {
  id: 'exploration',
  commandes: {
    commencer: commande({
      description: "Ouvre l'histoire : le groupe arrive au lieu de départ.",
      entree: z.object({}),
      disponible: (_c, p) => (p.journal.length ? "L'histoire a déjà commencé." : true),
      executer: (t) => {
        t.emettre({ type: 'texte', texte: t.ctx.dm.monde.depart.intro });
        t.emettre({ type: 'arrivee', lieu: t.ctx.dm.monde.depart.lieu });
        return verser(t, commencer(partieMonde(t)));
      },
    }),
    aller: commande({
      description: 'Aller vers un lieu voisin (sortie, porte, escalier, entrée ou sortie d’un bâtiment).',
      entree: z.object({ vers: z.string().describe('Id du lieu de destination') }),
      disponible: libre,
      executer: (t, e) => {
        const r = verser(t, aller(partieMonde(t), e.vers));
        if (r) return r;
        if (t.partie.scene.type === 'dialogue') t.partie.scene = { type: 'exploration' };
      },
    }),
    fouiller: commande({
      description: 'Fouiller le lieu (passages secrets, trésors cachés, pièges, indices). Une fois par lieu et par jour.',
      entree: z.object({ personnage: Personnage }),
      disponible: libre,
      executer: (t, e) => verser(t, fouiller(partieMonde(t), e.personnage)),
    }),
    ouvrir: commande({
      description: 'Ouvrir un passage ou un trésor verrouillé : avec la clé, en crochetant (outils de voleur) ou en forçant.',
      entree: z.object({
        cible: z.union([z.object({ lien: z.string() }), z.object({ tresor: z.string() })]),
        methode: z.enum(['cle', 'crocheter', 'forcer']),
        personnage: Personnage,
      }),
      disponible: libre,
      executer: (t, e) => verser(t, ouvrir(partieMonde(t), e.cible, e.methode, e.personnage)),
    }),
    desarmer: commande({
      description: 'Désarmer un piège repéré.',
      entree: z.object({ piege: z.string(), personnage: Personnage }),
      disponible: libre,
      executer: (t, e) => verser(t, desarmer(partieMonde(t), e.piege, e.personnage)),
    }),
    prendre: commande({
      description: "Prendre le contenu d'un trésor visible et ouvert.",
      entree: z.object({ tresor: z.string() }),
      disponible: libre,
      executer: (t, e) => verser(t, prendre(partieMonde(t), e.tresor)),
    }),
    repondreEnigme: commande({
      description: 'Proposer une réponse à une énigme du lieu (le moteur la vérifie).',
      entree: z.object({ enigme: z.string(), reponse: z.union([z.string(), z.array(z.union([z.string(), z.number(), z.boolean()])), z.record(z.string())]) }),
      disponible: libre,
      executer: (t, e) => verser(t, repondreEnigme(partieMonde(t), e.enigme, e.reponse)),
    }),
    indiceEnigme: commande({
      description: "Chercher un indice sur une énigme (niveau 1 : vague, 3 : clair).",
      entree: z.object({ enigme: z.string(), niveau: z.number().int().min(1).max(3), personnage: Personnage }),
      disponible: libre,
      executer: (t, e) => verser(t, indiceEnigme(partieMonde(t), e.enigme, e.niveau, e.personnage)),
    }),
    seReposer: commande({
      description: 'Se reposer : une halte (court) ou une nuit (long), selon ce que permet le lieu.',
      entree: z.object({ duree: z.enum(['court', 'long']) }),
      disponible: libre,
      executer: (t, e) => verser(t, seReposer(partieMonde(t), e.duree)),
    }),
    testLibre: commande({
      description: 'Un test que les données ne prévoient pas (escalader, nager, se souvenir) : jet contre un DD de 5 à 30, sans effet sur le monde.',
      entree: z.object({ test: z.union([Competence, Caracteristique]), dd: z.number().int().min(5).max(30), personnage: Personnage }),
      disponible: libre,
      executer: (t, e) => verser(t, testLibre(partieMonde(t), e.test, e.dd, e.personnage)),
    }),
    reglerRencontre: commande({
      description: "Régler la rencontre en cours : victoire (après le combat), autre issue (négocier, ruser…) ou repli.",
      entree: z.object({
        issue: z.enum(['victoire', 'alternative', 'fuite']),
        alternative: z.string().optional(),
        personnage: Personnage,
        px: z.number().int().min(0).optional(),
        /** État des héros à la fin du combat : PV, ressources durables (potions, usages), emplacements de sorts. */
        heros: z
          .record(z.object({ pv: z.number().int().min(0), ressources: z.record(z.number().int()).optional(), emplacements: z.array(z.number().int().min(0)).optional() }))
          .optional(),
      }),
      disponible: (_c, p) => (p.scene.type === 'rencontre' ? true : "Aucune rencontre n'attend."),
      executer: (t, e) => {
        const scene = t.partie.scene;
        if (scene.type !== 'rencontre') return { refus: "Aucune rencontre n'attend." };
        for (const a of t.partie.groupe) if (e.heros?.[a.id]) appliquerEtat(a, e.heros[a.id]!);
        const issue =
          e.issue === 'victoire'
            ? { type: 'victoire' as const, px: e.px }
            : e.issue === 'fuite'
              ? { type: 'fuite' as const }
              : { type: 'alternative' as const, id: e.alternative ?? '', personnage: e.personnage };
        const cr = issueRencontre(partieMonde(t), scene.rencontre, issue);
        if (!cr.ok && !cr.jets.length) return { refus: cr.refus ?? 'Impossible.' };
        // La rencontre est réglée, sauf si une autre issue a échoué : le combat attend toujours.
        t.partie.scene = { type: 'exploration' };
        return verser(t, cr);
      },
    }),
  },
  vues: {
    scene: (ctx, p) => ficheDeScene({ dm: ctx.dm, etat: p.etat, groupe: p.groupe, gen: () => 0 }),
  },
};
