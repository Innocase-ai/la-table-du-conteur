// Module Commerce : les boutiques et les services des PNJ (acheter, vendre, payer un service). Pendant une conversation
// avec un marchand, ses articles, ce qu'il rachète et ses services s'affichent à côté de la boîte de dialogue.
//
// - Stock : `boutique.stock` (quantités limitées, prix donné ou valeur de l'objet) plus les objets des tables de butin de
//   la boutique (un de chaque). Ce qui a été acheté est retenu dans `partie.modules.commerce.achats`.
// - Rachat : un objet du sac, au prix `valeur × boutique.rachat` (arrondi à l'inférieur, au moins 1 pc ; gemmes et objets
//   d'art à pleine valeur, comme le SRD), si la boutique
//   rachète ce genre d'objet (`types` ; vide = tout) et jamais un objet de quête. `rachat` à 0 : la boutique n'achète rien.
// - Services : le prix est payé, le résumé raconté, les effets appliqués. Quelques services ont un sens dans les règles,
//   d'après leur identifiant : soins (les PV du groupe au maximum), chambre ou abri (une nuit de repos, même là où l'on ne
//   pourrait pas dormir), identification (les objets du sac à étudier sont identifiés).
import { z } from 'zod';
import { arrondirPieces, evaluerCondition } from '../monde/etat';
import { pnjPresents } from '../monde/dialogue';
import { appliquer, seReposer, suites, type CompteRendu, type PartieMonde } from '../monde/exploration';
import type { Pnj } from '../monde/schemas';
import { commande, type ContexteJeu, type Module, type Partie, type Proposition } from '../noyau/types';
import { objetDe } from './catalogue';
import { libre, partieMonde, verser } from './commun';

export interface EtatCommerce {
  /** Quantités déjà achetées : `<pnj>:<objet>`. */
  achats: Record<string, number>;
}

const etatDe = (p: Partie): EtatCommerce => (p.modules['commerce'] as EtatCommerce | undefined) ?? { achats: {} };
const etatPourModifier = (p: Partie): EtatCommerce => (p.modules['commerce'] ??= { achats: {} }) as EtatCommerce;

const SOINS = /soin|guerison|purge|veillee-des-malades/;
const NUIT = /chambre|dortoir|hospitalite|abri|refuge/;
const IDENTIFICATION = /identification/;

/** Le prix en pièces d'or, lisible (« 2,5 po », « 5 pa »). */
export function prixLisible(po: number): string {
  if (po >= 1 || po === 0) return `${po.toLocaleString('fr-FR')} po`;
  if (po * 10 >= 1 && Number.isInteger(Math.round(po * 100) / 10)) return `${Math.round(po * 10)} pa`;
  return `${Math.max(1, Math.round(po * 100))} pc`;
}

/** Ce que propose une boutique maintenant : objet, prix, quantité restante. */
export function articles(ctx: ContexteJeu, p: Partie, pnj: Pnj): { objet: string; nom: string; prix: number; reste: number }[] {
  const b = pnj.boutique;
  if (!b) return [];
  const achats = etatDe(p).achats;
  const lignes = new Map<string, { quantite: number; prix?: number }>();
  for (const s of b.stock) lignes.set(s.objet, { quantite: (lignes.get(s.objet)?.quantite ?? 0) + s.quantite, prix: s.prix });
  for (const t of b.tables) for (const e of ctx.dm.tables.get(t)?.entrees ?? []) if (e.objet && !lignes.has(e.objet)) lignes.set(e.objet, { quantite: 1 });
  return [...lignes].flatMap(([objet, l]) => {
    const o = objetDe(ctx, objet);
    const reste = l.quantite - (achats[`${pnj.id}:${objet}`] ?? 0);
    const prix = l.prix ?? o.valeurPo ?? 0;
    return reste > 0 ? [{ objet, nom: o.nom, prix, reste }] : [];
  });
}

/** Ce que la boutique rachète dans le sac, et à quel prix. */
export function rachats(ctx: ContexteJeu, p: Partie, pnj: Pnj): { objet: string; nom: string; prix: number; quantite: number }[] {
  const b = pnj.boutique;
  if (!b || b.rachat <= 0) return [];
  return Object.entries(p.etat.inventaire).flatMap(([objet, quantite]) => {
    const o = objetDe(ctx, objet);
    if (o.categorie === 'quete' || !o.valeurPo) return [];
    if (b.types.length && !b.types.includes(o.categorie as never)) return [];
    // Pierres précieuses et objets d'art gardent toute leur valeur sur le marché (SRD 5.2.1, « Vente d'équipement »).
    const taux = o.categorie === 'gemme' || o.categorie === 'objet-d-art' ? 1 : b.rachat;
    return [{ objet, nom: o.nom, prix: Math.max(0.01, Math.floor(o.valeurPo * taux * 100) / 100), quantite }];
  });
}

/** Le marchand à qui l'on parle et qui est là. */
function marchand(pm: PartieMonde, id: string): Pnj | string {
  const pnj = pnjPresents(pm).find((n) => n.id === id);
  return pnj ?? "Ce personnage n'est pas là.";
}

const vide = (): CompteRendu => ({ ok: true, jets: [], constats: [], revele: [], narrations: [] });

export const moduleCommerce: Module = {
  id: 'commerce',
  dependances: ['dialogue', 'inventaire'],
  etatInitial: (): EtatCommerce => ({ achats: {} }),
  commandes: {
    acheter: commande({
      description: "Acheter un objet à un marchand présent (boutique d'un PNJ) : le prix est payé avec l'or du groupe.",
      entree: z.object({ pnj: z.string(), objet: z.string(), quantite: z.number().int().positive().default(1) }),
      disponible: libre,
      executer: (t, e) => {
        const pm = partieMonde(t);
        const pnj = marchand(pm, e.pnj);
        if (typeof pnj === 'string') return { refus: pnj };
        const a = articles(t.ctx, t.partie, pnj).find((x) => x.objet === e.objet);
        if (!a) return { refus: `${pnj.nom} n'a pas (ou plus) cet objet à vendre.` };
        const n = Math.min(e.quantite, a.reste);
        const total = Math.round(a.prix * n * 100) / 100;
        if (t.partie.etat.pieces < total) return { refus: `Il faut ${prixLisible(total)} : le groupe n'a que ${prixLisible(t.partie.etat.pieces)}.` };
        const r = vide();
        appliquer(pm, r, [{ pieces: -total }, { objet: { id: e.objet, quantite: n } }]);
        const etat = etatPourModifier(t.partie);
        etat.achats[`${pnj.id}:${e.objet}`] = (etat.achats[`${pnj.id}:${e.objet}`] ?? 0) + n;
        r.constats.push(`Achat à ${pnj.nom} : ${n > 1 ? `${n} × ` : ''}${a.nom}, pour ${prixLisible(total)}.`);
        suites(pm, r);
        return verser(t, r);
      },
      // Tous les boutons de la boutique (achats, rachats, services) : un seul point d'entrée pour l'écran.
      propositions: (ctx, p) => propositionsCommerce(ctx, p),
    }),
    vendre: commande({
      description: 'Vendre à un marchand présent un objet du sac (s’il rachète ce genre d’objet) : le prix est ajouté à l’or du groupe.',
      entree: z.object({ pnj: z.string(), objet: z.string(), quantite: z.number().int().positive().default(1) }),
      disponible: libre,
      executer: (t, e) => {
        const pm = partieMonde(t);
        const pnj = marchand(pm, e.pnj);
        if (typeof pnj === 'string') return { refus: pnj };
        const v = rachats(t.ctx, t.partie, pnj).find((x) => x.objet === e.objet);
        if (!v) return { refus: `${pnj.nom} ne rachète pas cela.` };
        const n = Math.min(e.quantite, v.quantite);
        const total = Math.round(v.prix * n * 100) / 100;
        const r = vide();
        appliquer(pm, r, [{ objet: { id: e.objet, quantite: n, retirer: true } }, { pieces: total }]);
        r.constats.push(`Vente à ${pnj.nom} : ${n > 1 ? `${n} × ` : ''}${v.nom}, pour ${prixLisible(total)}.`);
        suites(pm, r);
        return verser(t, r);
      },
    }),
    payerService: commande({
      description: "Payer un service d'un PNJ présent (soins, chambre, identification, renseignements…).",
      entree: z.object({ pnj: z.string(), service: z.string() }),
      disponible: libre,
      executer: (t, e) => {
        const pm = partieMonde(t);
        const pnj = marchand(pm, e.pnj);
        if (typeof pnj === 'string') return { refus: pnj };
        const s = pnj.services.find((x) => x.id === e.service);
        if (!s) return { refus: `${pnj.nom} ne propose pas ce service.` };
        if (s.condition && !evaluerCondition(s.condition, t.partie.etat)) return { refus: `${pnj.nom} ne peut pas rendre ce service pour l'instant.` };
        if (t.partie.etat.pieces < s.prix) return { refus: `${s.nom} coûte ${prixLisible(s.prix)} : le groupe n'a que ${prixLisible(t.partie.etat.pieces)}.` };
        // Une nuit payée : le repos se fait là, même si le lieu ne permet pas de dormir.
        if (NUIT.test(s.id)) {
          const r = seReposer(pm, 'long', { abri: true });
          if (!r.ok) return verser(t, r);
          if (s.prix) t.partie.etat.pieces = arrondirPieces(Math.max(0, t.partie.etat.pieces - s.prix));
          r.constats.unshift(`${s.nom} : ${prixLisible(s.prix)} payés à ${pnj.nom}.`);
          appliquer(pm, r, s.effets);
          suites(pm, r);
          return verser(t, r);
        }
        // Un service qui ne changerait rien n'est pas vendu : soins à un groupe en pleine forme, identification d'un sac sans
        // objet inconnu (sauf si le service a d'autres effets, écrits par l'auteur).
        const inventaire = (t.partie.modules['inventaire'] ?? { identifies: [] }) as { identifies: string[] };
        const aIdentifier = Object.keys(t.partie.etat.inventaire).filter((id) => objetDe(t.ctx, id).identification && !inventaire.identifies.includes(id));
        if (!s.effets.length && SOINS.test(s.id) && t.partie.groupe.every((h) => h.pv >= h.fiche.pvMax)) return { refus: `Personne n'a besoin de soins : ${s.nom} ne servirait à rien.` };
        if (!s.effets.length && IDENTIFICATION.test(s.id) && !aIdentifier.length) return { refus: "Il n'y a rien à identifier dans le sac." };
        const r = vide();
        if (s.prix) appliquer(pm, r, [{ pieces: -s.prix }]);
        r.constats.push(`${s.nom}${s.prix ? ` (${prixLisible(s.prix)})` : ''} : ${s.resume}`);
        if (SOINS.test(s.id)) {
          for (const h of t.partie.groupe) h.pv = h.fiche.pvMax;
          r.constats.push('Le groupe est soigné : chacun retrouve tous ses points de vie.');
        }
        if (IDENTIFICATION.test(s.id)) {
          const inv = (t.partie.modules['inventaire'] ??= { identifies: [] }) as { identifies: string[] };
          const a = Object.keys(t.partie.etat.inventaire).filter((id) => objetDe(t.ctx, id).identification && !inv.identifies.includes(id));
          inv.identifies.push(...a);
          r.constats.push(a.length ? `Objets identifiés : ${a.map((id) => objetDe(t.ctx, id).nom).join(', ')}.` : "Il n'y a rien à identifier dans le sac.");
        }
        appliquer(pm, r, s.effets);
        suites(pm, r);
        return verser(t, r);
      },
    }),
  },
  vues: {
    /** La boutique du PNJ à qui l'on parle (pour l'interface et le conteur). */
    boutique: (ctx, p) => {
      if (p.scene.type !== 'dialogue') return undefined;
      const pnj = ctx.dm.pnj.get(p.scene.pnj);
      if (!pnj) return undefined;
      return { pnj: pnj.id, articles: articles(ctx, p, pnj), rachats: rachats(ctx, p, pnj), services: pnj.services.map((s) => ({ id: s.id, nom: s.nom, prix: s.prix })) };
    },
  },
};

/** Les boutons de la boutique et des services pendant une conversation avec le marchand. */
export function propositionsCommerce(ctx: ContexteJeu, p: Partie): Proposition[] {
  if (p.scene.type !== 'dialogue') return [];
  const pnj = ctx.dm.pnj.get(p.scene.pnj);
  if (!pnj) return [];
  const res: Proposition[] = [];
  const bourse = p.etat.pieces;
  const vente = { id: 'boutique', titre: `Boutique de ${pnj.nom} (bourse : ${prixLisible(bourse)})`, ordre: 12 };
  for (const a of articles(ctx, p, pnj)) {
    res.push({
      groupe: vente,
      element: { id: `achat:${a.objet}`, titre: `${a.nom}${a.reste > 1 ? ` (${a.reste})` : ''}` },
      libelle: `Acheter — ${prixLisible(a.prix)}`,
      style: 'discret',
      ordre: { type: 'acheter', pnj: pnj.id, objet: a.objet },
      desactivee: bourse < a.prix ? 'Pas assez d’or.' : undefined,
    });
  }
  const rachat = { id: 'rachat', titre: `${pnj.nom} rachète`, ordre: 13 };
  for (const v of rachats(ctx, p, pnj)) {
    res.push({
      groupe: rachat,
      element: { id: `vente:${v.objet}`, titre: `${v.nom}${v.quantite > 1 ? ` (${v.quantite})` : ''}` },
      libelle: `Vendre — ${prixLisible(v.prix)}`,
      style: 'discret',
      confirmer: true,
      ordre: { type: 'vendre', pnj: pnj.id, objet: v.objet },
    });
  }
  const services = { id: 'services', titre: `Services de ${pnj.nom}`, ordre: 14 };
  for (const s of pnj.services) {
    const ok = !s.condition || evaluerCondition(s.condition, p.etat);
    res.push({
      groupe: services,
      libelle: `${s.nom} — ${s.prix ? prixLisible(s.prix) : 'gratuit'}`,
      aide: s.resume,
      ordre: { type: 'payerService', pnj: pnj.id, service: s.id },
      desactivee: !ok ? 'Pas pour l’instant.' : bourse < s.prix ? 'Pas assez d’or.' : undefined,
    });
  }
  return res;
}
