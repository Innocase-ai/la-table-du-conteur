// Module Exploration : se déplacer, fouiller, ouvrir, désamorcer, prendre, résoudre les énigmes, se reposer,
// régler les rencontres. Les règles sont dans monde/exploration.ts ; ce module les expose en commandes.
import { z } from 'zod';
import { Competence, Caracteristique } from '../schemas';
import {
  aller,
  commencer,
  desarmer,
  fouiller,
  regarder,
  indiceEnigme,
  issueRencontre,
  ouvrir,
  prendre,
  repondreEnigme,
  seReposer,
  testLibre,
} from '../monde/exploration';
import { evaluerCondition } from '../monde/etat';
import { formulaireEnigme } from '../monde/reponses';
import { presentationMonstres } from '../monde/presentation';
import { ficheDeScene } from '../monde/scene';
import { commande, type Module } from '../noyau/types';
import { appliquerEtat } from '../personnage';
import { enExploration, libre, PANNEAUX, partieMonde, verser } from './commun';
import type { ContexteJeu, Partie, Proposition } from '../noyau/types';

/** Pourquoi on ne peut pas dormir ici (sinon rien) : « impossible » = aucun repos ; « dangereux » = une halte seulement. */
const raisonPasDeNuit = (lieu: { repos: string } | undefined): string | undefined =>
  !lieu || lieu.repos === 'sur'
    ? undefined
    : lieu.repos === 'impossible'
      ? 'Impossible de se reposer ici.'
      : 'On ne dort pas ici : trop exposé. Une halte est possible ; pour une nuit, cherchez un abri sûr (auberge, camp, refuge).';

/** La fiche de scène du moment (sorties, trésors, pièges, énigmes visibles). */
const scene = (ctx: ContexteJeu, p: Partie) => ficheDeScene({ dm: ctx.dm, etat: p.etat, groupe: p.groupe, gen: () => 0 });

/** Ouvrir avec la clé (si le groupe l'a), crocheter, forcer : les propositions d'un élément fermé. */
function propositionsOuvrir(p: Partie, cible: { lien: string } | { tresor: string }, element: Proposition['element'], groupe: Proposition['groupe'], cle?: string): Proposition[] {
  const res: Proposition[] = [];
  if (cle && (p.etat.inventaire[cle] ?? 0) > 0) res.push({ groupe, element, libelle: 'Clé', icone: 'base:cle', ordre: { type: 'ouvrir', cible, methode: 'cle' } });
  const outils = (p.etat.inventaire['outils-de-voleur'] ?? 0) > 0 || p.groupe.some((h) => h.pv > 0 && h.outils.includes('outils-de-voleur'));
  res.push({
    groupe,
    element,
    libelle: 'Crocheter',
    icone: 'base:crocheter',
    style: 'discret',
    aide: 'Escamotage, avec des outils de voleur. Silencieux : seuls des témoins attentifs vous verraient.',
    desactivee: outils ? undefined : 'Il faut des outils de voleur (aucun héros n’en a).',
    ordre: { type: 'ouvrir', cible, methode: 'crocheter' },
  });
  res.push({ groupe, element, libelle: 'Forcer', icone: 'base:forcer', style: 'discret', aide: 'Athlétisme. Bruyant : les témoins vous repèrent plus facilement.', ordre: { type: 'ouvrir', cible, methode: 'forcer' } });
  return res;
}

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
        // L'or de départ des fiches (kits de classe et d'historique, plus le prix des armes retirées du kit allégé) forme la bourse du groupe.
        const orDeDepart = t.partie.groupe.reduce((s, h) => s + (h.fiche.equipement?.po ?? 0), 0);
        t.partie.etat.pieces += Math.round(orDeDepart * 100) / 100;
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
      propositions: (ctx, p) => {
        if (!enExploration(p)) return [];
        const sc = scene(ctx, p);
        return sc.sorties
          .filter((x) => x.etat !== 'verrouille')
          .map((x) => ({
            groupe: PANNEAUX.partir,
            libelle: `${x.vers === sc.lieu.parent ? '↑ ' : ''}${x.nom}`,
            // Le joueur doit savoir où il va avant de cliquer : une phrase sous le bouton, et ce qu'il ignore encore.
            detail: [x.visite ? undefined : 'inexploré', x.heures > 0 ? `${x.heures} h` : undefined].filter(Boolean).join(', ') || undefined,
            apercu: x.apercu,
            ordre: { type: 'aller', vers: x.vers },
            desactivee: x.etat === 'absent' ? (x.absent === 'pack' ? 'Fait partie d’un autre pack.' : 'Bientôt disponible.') : x.etat === 'bloque' ? 'Infranchissable pour l’instant.' : undefined,
          }));
      },
    }),
    regarder: commande({
      description: "Regarder autour de soi : relire la description du lieu où est le groupe (sans coût ni jet).",
      entree: z.object({}),
      disponible: libre,
      executer: (t) => verser(t, regarder(partieMonde(t))),
      propositions: (ctx, p) =>
        enExploration(p) && (ctx.dm.lieux.get(p.etat.lieu)?.arrivee || ctx.dm.lieux.get(p.etat.lieu)?.arriveeVariantes.length)
          ? [{ groupe: PANNEAUX.ici, libelle: 'Regarder autour de soi', icone: 'base:revoir', style: 'discret' as const, aide: 'Relire la description du lieu.', ordre: { type: 'regarder' } }]
          : [],
    }),
    fouiller: commande({
      description: 'Fouiller le lieu (passages secrets, trésors cachés, pièges, indices). Une fois par lieu et par jour.',
      entree: z.object({ personnage: Personnage }),
      disponible: libre,
      executer: (t, e) => verser(t, fouiller(partieMonde(t), e.personnage)),
      propositions: (_ctx, p) =>
        enExploration(p)
          ? [
              {
                groupe: PANNEAUX.ici,
                libelle: 'Fouiller',
                icone: 'base:fouiller',
                desactivee: p.etat.exploration.fouilles.includes(`${p.etat.lieu}:${p.etat.jour}`) ? 'Déjà fouillé aujourd’hui.' : undefined,
                ordre: { type: 'fouiller' },
              },
            ]
          : [],
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
      propositions: (ctx, p) => {
        if (!enExploration(p)) return [];
        const sc = scene(ctx, p);
        const res: Proposition[] = [];
        for (const x of sc.sorties.filter((y) => y.etat === 'verrouille')) {
          const lien = ctx.dm.lieux.get(p.etat.lieu)?.liens.find((l) => l.vers === x.vers) ?? ctx.dm.lieux.get(x.vers)?.liens.find((l) => l.vers === p.etat.lieu);
          res.push(...propositionsOuvrir(p, { lien: x.vers }, { id: `sortie:${x.vers}`, titre: `${x.nom} (verrouillé, DD ${x.dd})${x.description ? ` : ${x.description}` : ''}` }, PANNEAUX.partir, lien?.verrou?.cle));
        }
        for (const t of sc.tresors.filter((y) => y.etat === 'ferme')) {
          res.push(...propositionsOuvrir(p, { tresor: t.id }, { id: `tresor:${t.id}`, titre: t.nom }, PANNEAUX.objets, ctx.dm.tresors.get(t.id)?.acces.verrou?.cle));
        }
        return res;
      },
    }),
    desarmer: commande({
      description: 'Désamorcer un piège repéré (neutraliser son mécanisme).',
      entree: z.object({ piege: z.string(), personnage: Personnage }),
      disponible: libre,
      executer: (t, e) => verser(t, desarmer(partieMonde(t), e.piege, e.personnage)),
      propositions: (ctx, p) =>
        enExploration(p)
          ? scene(ctx, p)
              .pieges.filter((x) => x.etat === 'repere')
              .map((x) => ({ groupe: PANNEAUX.objets, element: { id: `piege:${x.id}`, titre: `⚠ ${x.nom}`, danger: true }, libelle: 'Désamorcer', icone: 'base:desamorcer', aide: x.resume, ordre: { type: 'desarmer', piege: x.id } }))
          : [],
    }),
    prendre: commande({
      description: "Prendre le contenu d'un trésor visible et ouvert.",
      entree: z.object({ tresor: z.string() }),
      disponible: libre,
      executer: (t, e) => verser(t, prendre(partieMonde(t), e.tresor)),
      propositions: (ctx, p) =>
        enExploration(p)
          ? scene(ctx, p)
              .tresors.filter((x) => x.etat !== 'ferme')
              .map((x) => ({
                groupe: PANNEAUX.objets,
                element: { id: `tresor:${x.id}`, titre: x.nom },
                libelle: 'Prendre',
                icone: 'base:prendre',
                aide: x.description,
                ordre: { type: 'prendre', tresor: x.id },
                desactivee: x.etat === 'garde' ? 'Gardé.' : undefined,
              }))
          : [],
    }),
    repondreEnigme: commande({
      description: 'Proposer une réponse à une énigme du lieu (le moteur la vérifie).',
      entree: z.object({ enigme: z.string(), reponse: z.union([z.string(), z.array(z.union([z.string(), z.number(), z.boolean()])), z.record(z.string())]) }),
      disponible: libre,
      executer: (t, e) => verser(t, repondreEnigme(partieMonde(t), e.enigme, e.reponse)),
      propositions: (ctx, p) =>
        enExploration(p)
          ? scene(ctx, p)
              .enigmes.filter((x) => x.etat !== 'resolue')
              .map((x) => {
                // Un mot de passe ou une déduction se répondent par un texte ; les autres énigmes par un formulaire adapté.
                const formulaire = formulaireEnigme(ctx.dm.enigmes.get(x.id)!, (id) => ctx.dm.objets.get(id)?.nom ?? ctx.srd?.objets.get(id)?.nom);
                return {
                  groupe: PANNEAUX.enigme(x.id, x.nom, x.enonce),
                  libelle: 'Répondre',
                  icone: 'base:repondre',
                  ...(formulaire ? { formulaire } : { saisie: { champ: 'reponse', indication: 'Votre réponse' } }),
                  ordre: { type: 'repondreEnigme', enigme: x.id },
                };
              })
          : [],
    }),
    indiceEnigme: commande({
      description: "Chercher un indice sur une énigme (niveau 1 : vague, 3 : clair).",
      entree: z.object({ enigme: z.string(), niveau: z.number().int().min(1).max(3), personnage: Personnage }),
      disponible: libre,
      executer: (t, e) => verser(t, indiceEnigme(partieMonde(t), e.enigme, e.niveau, e.personnage)),
      propositions: (ctx, p) =>
        enExploration(p)
          ? scene(ctx, p)
              .enigmes.filter((x) => x.etat !== 'resolue')
              .map((x) => {
                const niveau = (p.etat.exploration.indices?.[x.id] ?? 0) + 1;
                return {
                  groupe: PANNEAUX.enigme(x.id, x.nom, x.enonce),
                  libelle: 'Chercher un indice',
                  icone: 'base:indice',
                  style: 'discret' as const,
                  ordre: { type: 'indiceEnigme', enigme: x.id, niveau: Math.min(3, niveau) },
                  desactivee: niveau > 3 ? 'Plus d’indice.' : undefined,
                };
              })
          : [],
    }),
    seReposer: commande({
      description: 'Se reposer : une halte (court) presque partout, ou une nuit (long) seulement dans un lieu sûr (auberge, camp, refuge ; la fiche de scène dit « Repos : sûr »).',
      entree: z.object({ duree: z.enum(['court', 'long']) }),
      disponible: libre,
      executer: (t, e) => verser(t, seReposer(partieMonde(t), e.duree)),
      propositions: (ctx, p) =>
        enExploration(p)
          ? [
              {
                groupe: PANNEAUX.ici,
                libelle: 'Halte',
                icone: 'base:halte',
                style: 'discret' as const,
                aide: 'Repos court : un dé de vie de PV, certains usages reviennent.',
                ordre: { type: 'seReposer', duree: 'court' },
                desactivee: ctx.dm.lieux.get(p.etat.lieu)?.repos === 'impossible' ? 'Impossible de se reposer ici.' : undefined,
              },
              {
                groupe: PANNEAUX.ici,
                libelle: 'Dormir',
                icone: 'base:dormir',
                style: 'discret' as const,
                aide: 'Repos long : PV, usages et sorts au maximum ; le temps passe. Seulement dans un abri sûr (auberge, camp, refuge).',
                ordre: { type: 'seReposer', duree: 'long' },
                desactivee: raisonPasDeNuit(ctx.dm.lieux.get(p.etat.lieu)),
              },
            ]
          : [],
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
        issue: z.enum(['victoire', 'alternative', 'fuite', 'defaite']),
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
              : e.issue === 'defaite'
                ? { type: 'defaite' as const }
                : { type: 'alternative' as const, id: e.alternative ?? '', personnage: e.personnage };
        const cr = issueRencontre(partieMonde(t), scene.rencontre, issue);
        if (!cr.ok && !cr.jets.length) return { refus: cr.refus ?? 'Impossible.' };
        // La rencontre est réglée, sauf si une autre issue a échoué : le combat attend toujours.
        t.partie.scene = { type: 'exploration' };
        return verser(t, cr);
      },
      propositions: (ctx, p) => {
        if (p.scene.type !== 'rencontre') return [];
        const r = ctx.dm.rencontres.get(p.scene.rencontre);
        if (!r) return [];
        const monstres = presentationMonstres(r, ctx.dm, ctx.srd);
        const groupe = { id: 'rencontre', titre: r.nom, ordre: 0, danger: true, ...(monstres.length ? { monstres } : {}) };
        return [
          ...(r.type === 'combat' || r.type === 'mixte' ? [{ groupe, libelle: 'Combattre', icone: 'base:combattre', style: 'principal' as const, intention: 'combattre' as const }] : []),
          ...r.alternatives
            .filter((a) => !a.condition || evaluerCondition(a.condition, p.etat))
            .map((a) => ({
              groupe,
              libelle: a.nom,
              detail: a.jet ? `${a.jet.competence}` : undefined,
              aide: a.resume,
              ordre: { type: 'reglerRencontre', issue: 'alternative', alternative: a.id },
              desactivee: p.etat.exploration.essais?.includes(`${r.id}:${a.id}`) ? 'Déjà tenté, sans succès.' : undefined,
            })),
          {
            groupe,
            libelle: r.type === 'combat' || r.type === 'mixte' ? 'Se replier' : 'Passer son chemin',
            icone: 'base:desengager',
            style: 'discret' as const,
            ordre: { type: 'reglerRencontre', issue: 'fuite' },
          },
        ];
      },
    }),
  },
  vues: {
    scene: (ctx, p) => ficheDeScene({ dm: ctx.dm, etat: p.etat, groupe: p.groupe, gen: () => 0 }),
  },
};
