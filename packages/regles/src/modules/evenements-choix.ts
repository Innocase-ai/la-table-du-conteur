// Module Événements à choix : un tableau illustré (image, narration, choix, résultat). Il s'ouvre tout seul quand le groupe est
// dans le lieu et que sa condition est vraie (ou par un bouton), propose des choix généraux et des choix réservés à l'origine
// d'un héros du groupe (condition `heros`, libellé préfixé « (Nain) »), applique les effets du choix, et montre le résultat.
// Le conteur ne tranche jamais : le choix est celui du joueur. Un choix pose les drapeaux `evt-<id>` et `evt-<id>-<choix>`.
import { z } from 'zod';
import { evaluerCondition } from '../monde/etat';
import { drapeauxEvenement, evenementsChoixDe, herosDeCondition, type ChoixEvenement, type EvenementChoix } from '../monde/evenements-choix-donnees';
import { jouerEffets, testLibre, type Jet } from '../monde/exploration';
import { nbMots } from '../monde/savoirs-donnees';
import type { EffetMonde } from '../monde/schemas';
import { commande, type ContexteJeu, type Encart, type Module, type Partie, type Proposition, type Transaction } from '../noyau/types';
import { enExploration, partieMonde, PANNEAUX, verser } from './commun';

declare module '../noyau/types' {
  interface CarteEvenements {
    evenementOuvert: { evenement: string };
    evenementTranche: { evenement: string; choix: string };
  }
}

/** Ce que le joueur lit après son choix. */
export interface ResultatEvenement {
  choix: string;
  /** Le libellé du choix tel qu'il était affiché (avec son préfixe d'origine). */
  libelle: string;
  /** Le héros qui a agi (choix d'origine). */
  heros?: string;
  reussite?: boolean;
  texte: string;
  jets: Jet[];
  /** Ce que le jeu constate (« Vous gagnez 40 po », rencontre déclenchée…) et les faits appris. */
  constats: string[];
  faits: string[];
  /** Les narrations des effets (texte d'un palier, d'une narration d'auteur). */
  narrations: string[];
}

export interface EtatEvenementsChoix {
  /** Les événements résolus : le choix, le jour, qui a agi, le résultat du jet. */
  resolus: Record<string, { choix: string; jour: number; heros?: string; reussite?: boolean; texte: string; libelle: string }>;
  /** L'événement affiché en ce moment, avec son résultat une fois le choix fait. */
  courant?: { id: string; resultat?: ResultatEvenement };
}

/** Un choix tel que l'écran l'affiche. */
export interface ChoixAffiche {
  id: string;
  /** Le préfixe d'origine, sans parenthèses : « Nain », « Magicien ». */
  origine?: string;
  libelle: string;
  /** Pour un choix à jet : « Médecine, DD 12 » (le joueur sait que c'est incertain). */
  jet?: { competence: string; dd: number };
  desactivee?: string;
}

/** Ce que la vue `evenementEnCours` donne à l'écran. */
export interface FicheEvenement {
  id: string;
  titre: string;
  lieu: string;
  image?: { groupe: 'lieux' | 'pnj' | 'monstres' | 'objets'; id: string };
  narration: string;
  choix: ChoixAffiche[];
  partir: string;
  resultat?: ResultatEvenement;
}

const vide = (): EtatEvenementsChoix => ({ resolus: {} });
const etat = (p: Partie): EtatEvenementsChoix => ((p.modules['evenementsChoix'] ??= vide()) as EtatEvenementsChoix);
const lu = (p: Partie): EtatEvenementsChoix | undefined => p.modules['evenementsChoix'] as EtatEvenementsChoix | undefined;

/** La narration qu'on lit maintenant : la dernière variante dont la condition est vraie, sinon la narration de base. */
export const narrationActuelle = (e: EvenementChoix, p: Partie): string => [...e.variantes].reverse().find((v) => evaluerCondition(v.condition, p.etat))?.narration ?? e.narration;

/** Le premier héros vivant du groupe qui correspond à l'origine exigée par une condition (les origines suivent le groupe, dans l'ordre). */
export function herosQuiAgit(p: Partie, condition: ChoixEvenement['condition']): string | undefined {
  const h = herosDeCondition(condition);
  if (!h) return undefined;
  const i = (p.etat.heros ?? []).findIndex((o, k) => (!h.classe || o.classe === h.classe) && (!h.espece || o.espece === h.espece) && (!h.historique || o.historique === h.historique) && (p.groupe[k]?.pv ?? 0) > 0);
  return i >= 0 ? p.groupe[i]?.id : undefined;
}

/** L'origine affichée avant un choix réservé : le champ `origine`, sinon les noms SRD de l'espèce, de la classe et de l'historique exigés. */
export function origineAffichee(c: ChoixEvenement, ctx: ContexteJeu): string | undefined {
  if (c.origine) return c.origine;
  const h = herosDeCondition(c.condition);
  if (!h) return undefined;
  const noms = [ctx.srd?.especes.get(h.espece ?? '')?.nom ?? h.espece, ctx.srd?.classes.get(h.classe ?? '')?.nom ?? h.classe, ctx.srd?.historiques.get(h.historique ?? '')?.nom ?? h.historique].filter(Boolean);
  return noms.length ? noms.join(' ') : undefined;
}

/** Le choix est-il ouvert ? Sa condition est vraie et, s'il est réservé à une origine, un héros vivant correspond. */
const choixOuvert = (c: ChoixEvenement, p: Partie): boolean => (!c.condition || evaluerCondition(c.condition, p.etat)) && (!herosDeCondition(c.condition) || herosQuiAgit(p, c.condition) !== undefined);

/** L'événement est-il disponible ici et maintenant (pas résolu, bon lieu, condition vraie) ? */
export function evenementDispo(e: EvenementChoix, p: Partie): boolean {
  return e.lieu === p.etat.lieu && !lu(p)?.resolus[e.id] && (!e.quand || evaluerCondition(e.quand, p.etat));
}

/** Les événements qu'on peut ouvrir maintenant. */
export const evenementsIci = (ctx: ContexteJeu, p: Partie): EvenementChoix[] => evenementsChoixDe(ctx.dm).evenements.filter((e) => evenementDispo(e, p));

function fiche(ctx: ContexteJeu, p: Partie): FicheEvenement | undefined {
  const c = lu(p)?.courant;
  const e = c ? evenementsChoixDe(ctx.dm).evenements.find((x) => x.id === c.id) : undefined;
  if (!c || !e) return undefined;
  return {
    id: e.id,
    titre: e.titre,
    lieu: e.lieu,
    ...(e.image ? { image: e.image } : {}),
    narration: narrationActuelle(e, p),
    choix: c.resultat
      ? []
      : e.choix
          .filter((x) => choixOuvert(x, p))
          .map((x) => {
            const origine = origineAffichee(x, ctx);
            return {
              id: x.id,
              ...(origine ? { origine } : {}),
              libelle: x.libelle,
              ...(x.jet ? { jet: x.jet } : {}),
              ...(x.requis && !evaluerCondition(x.requis, p.etat) ? { desactivee: x.requisTexte ?? 'Il vous manque ce qu’il faut pour tenter cela.' } : {}),
            };
          }),
    partir: e.partir,
    ...(c.resultat ? { resultat: c.resultat } : {}),
  };
}

/** Ouvre le premier événement « à l'entrée » dont les conditions sont vraies, si rien d'autre n'occupe l'écran. */
function reagir(t: Transaction): void {
  const p = t.partie;
  if (!enExploration(p) || etat(p).courant) return;
  const e = evenementsChoixDe(t.ctx.dm).evenements.find((x) => x.ouverture === 'entree' && evenementDispo(x, p));
  if (!e) return;
  etat(p).courant = { id: e.id };
  t.emettre({ type: 'evenementOuvert', evenement: e.id });
}

export const moduleEvenementsChoix: Module = {
  id: 'evenementsChoix',
  etatInitial: vide,
  reactions: {
    arrivee: reagir,
    deplacement: reagir,
    faitAppris: reagir,
    queteMiseAJour: reagir,
    objetObtenu: reagir,
    jaugeChange: reagir,
    sceneChange: reagir,
    jourSuivant: reagir,
  },
  commandes: {
    ouvrirEvenement: commande({
      description: 'Ouvrir un événement à choix du lieu (un bouton du panneau « Ici »).',
      entree: z.object({ evenement: z.string() }),
      disponible: (_ctx, p) => (enExploration(p) ? true : 'On ne s’y arrête pas pendant une conversation ou une rencontre.'),
      executer: (t, e) => {
        const ev = evenementsChoixDe(t.ctx.dm).evenements.find((x) => x.id === e.evenement);
        if (!ev || !evenementDispo(ev, t.partie)) return { refus: 'Il n’y a rien de tel à regarder ici.' };
        etat(t.partie).courant = { id: ev.id };
        t.emettre({ type: 'evenementOuvert', evenement: ev.id });
      },
      propositions: (ctx, p): Proposition[] => {
        if (!enExploration(p) || lu(p)?.courant) return [];
        return evenementsIci(ctx, p).map((x) => ({
          groupe: PANNEAUX.ici,
          element: { id: `evenement:${x.id}`, titre: x.titre },
          libelle: x.ouverture === 'bouton' ? 'Regarder de plus près' : 'Revenir à ce moment',
          icone: 'base:indice',
          style: 'normal' as const,
          ordre: { type: 'ouvrirEvenement', evenement: x.id },
        }));
      },
    }),
    choisirEvenement: commande({
      description: 'Choisir ce que fait le groupe dans l’événement ouvert.',
      entree: z.object({ evenement: z.string(), choix: z.string() }),
      disponible: (_ctx, p) => (lu(p)?.courant ? true : 'Aucun événement n’est ouvert.'),
      executer: (t, e) => {
        const es = etat(t.partie);
        const ev = evenementsChoixDe(t.ctx.dm).evenements.find((x) => x.id === e.evenement);
        if (!ev || es.courant?.id !== ev.id) return { refus: 'Cet événement n’est pas ouvert.' };
        if (es.courant.resultat) return { refus: 'Le choix est déjà fait.' };
        const c = ev.choix.find((x) => x.id === e.choix);
        if (!c || !choixOuvert(c, t.partie)) return { refus: 'Ce choix ne vous est pas ouvert.' };
        if (c.requis && !evaluerCondition(c.requis, t.partie.etat)) return { refus: c.requisTexte ?? 'Il vous manque ce qu’il faut pour tenter cela.' };
        const heros = herosQuiAgit(t.partie, c.condition);
        const p = partieMonde(t);
        const libelle = `${origineAffichee(c, t.ctx) ? `(${origineAffichee(c, t.ctx)}) ` : ''}${c.libelle}`;
        let reussite: boolean | undefined;
        let base: ReturnType<typeof testLibre> | undefined;
        let effets: EffetMonde[] = c.effets;
        let texte = c.resultat;
        if (c.jet) {
          base = testLibre(p, c.jet.competence, c.jet.dd, heros);
          if (!base.ok) return { refus: base.refus ?? 'Personne ne peut le tenter.' };
          reussite = base.jets[0]?.reussite ?? false;
          if (!reussite) {
            effets = c.echec ?? [];
            texte = c.resultatEchec ?? c.resultat;
          }
        }
        const marques: EffetMonde[] = drapeauxEvenement(ev.id, c.id).map((flag) => ({ flag }));
        const cr = jouerEffets(p, [], [...marques, ...effets], base);
        const acteur = heros ? t.partie.groupe.find((a) => a.id === heros) : undefined;
        es.resolus[ev.id] = { choix: c.id, jour: t.partie.etat.jour, libelle, texte, ...(acteur ? { heros: acteur.nom } : {}), ...(reussite !== undefined ? { reussite } : {}) };
        es.courant = {
          id: ev.id,
          resultat: { choix: c.id, libelle, ...(acteur ? { heros: acteur.nom } : {}), ...(reussite !== undefined ? { reussite } : {}), texte, jets: [...cr.jets], constats: [...cr.constats], faits: [...cr.revele], narrations: [...cr.narrations] },
        };
        // Le journal garde le tableau : la narration, le choix, le résultat, puis ce que les effets ont produit.
        t.emettre({ type: 'texte', texte: narrationActuelle(ev, t.partie) });
        t.emettre({ type: 'constat', texte: `Vous choisissez : ${libelle}` });
        t.emettre({ type: 'texte', texte });
        t.emettre({ type: 'evenementTranche', evenement: ev.id, choix: c.id });
        return verser(t, cr);
      },
    }),
    quitterEvenement: commande({
      description: 'Quitter l’événement ouvert (le choix fait, ou sans choisir : il reste alors à revoir).',
      entree: z.object({ evenement: z.string() }),
      disponible: (_ctx, p) => (lu(p)?.courant ? true : 'Aucun événement n’est ouvert.'),
      executer: (t, e) => {
        const es = etat(t.partie);
        if (es.courant?.id !== e.evenement) return { refus: 'Cet événement n’est pas ouvert.' };
        delete es.courant;
      },
    }),
  },
  vues: {
    evenementEnCours: (ctx, p) => fiche(ctx, p),
  },
  encarts: (ctx, p): Encart[] => {
    const es = lu(p);
    const vecus = evenementsChoixDe(ctx.dm)
      .evenements.filter((e) => es?.resolus[e.id])
      .sort((a, b) => es!.resolus[a.id]!.jour - es!.resolus[b.id]!.jour);
    if (!vecus.length) return [];
    return [
      {
        onglet: 'Journal',
        id: 'evenements-vecus',
        titre: 'Événements vécus',
        ordre: 5,
        lignes: vecus.map((e) => {
          const r = es!.resolus[e.id]!;
          return { libelle: e.titre, valeur: `jour ${r.jour}`, detail: [`${r.heros ? `${r.heros} : ` : ''}${r.libelle}`, r.reussite === false ? '(le jet a échoué)' : '', r.texte].filter(Boolean).join('\n\n') };
        }),
      },
    ];
  },
  valider: (ctx) => {
    const { evenements, erreurs } = evenementsChoixDe(ctx.dm);
    const dm = ctx.dm;
    const ids = evenements.map((e) => e.id);
    for (const id of ids.filter((x, i) => ids.indexOf(x) !== i)) erreurs.push(`Événement à choix « ${id} » : identifiant en double.`);
    const images = { lieux: dm.lieux, pnj: dm.pnj, objets: dm.objets } as Record<string, Map<string, unknown>>;
    const monstres = new Set([...dm.rencontres.values()].flatMap((r) => r.monstres.map((m) => m.profil)));
    for (const e of evenements) {
      if (!dm.lieux.has(e.lieu)) erreurs.push(`Événement à choix « ${e.id} » : lieu inconnu « ${e.lieu} ».`);
      if (e.image) {
        const connu = e.image.groupe === 'monstres' ? monstres.has(e.image.id) : images[e.image.groupe]?.has(e.image.id);
        if (!connu) erreurs.push(`Événement à choix « ${e.id} » : image inconnue « ${e.image.groupe}/${e.image.id} ».`);
      }
      const cs = e.choix.map((c) => c.id);
      for (const id of cs.filter((x, i) => cs.indexOf(x) !== i)) erreurs.push(`Événement à choix « ${e.id} » : choix « ${id} » en double.`);
      if (e.choix.every((c) => !!herosDeCondition(c.condition))) erreurs.push(`Événement à choix « ${e.id} » : tous les choix sont réservés à une origine ; prévoyez au moins un choix général, ouvert à tout le groupe.`);
    }
    return erreurs;
  },
  conseils: (ctx) => {
    const avis: string[] = [];
    for (const e of evenementsChoixDe(ctx.dm).evenements) {
      const n = nbMots(e.narration);
      if (n < 40 || n > 150) avis.push(`Événement à choix « ${e.id} » : narration de ${n} mots ; visez 70 à 110.`);
      if (!e.choix.some((c) => herosDeCondition(c.condition))) avis.push(`Événement à choix « ${e.id} » : aucun choix réservé à une origine de héros ; ajoutez-en un ou deux (condition \`heros\`) pour que le groupe compte.`);
      for (const c of e.choix) {
        for (const [nom, texte] of [['résultat', c.resultat], ['résultat de l’échec', c.resultatEchec]] as const) {
          if (!texte) continue;
          const m = nbMots(texte);
          if (m < 30 || m > 110) avis.push(`Événement à choix « ${e.id} », choix « ${c.id} » : ${nom} de ${m} mots ; visez 50 à 80.`);
        }
        const effets = [...c.effets, ...(c.echec ?? [])];
        if (!effets.length) avis.push(`Événement à choix « ${e.id} », choix « ${c.id} » : aucun effet ; ajoutez au moins un fait ou un drapeau lu plus loin (les drapeaux evt-… sont posés d'office).`);
      }
    }
    return avis;
  },
};
