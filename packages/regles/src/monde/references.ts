// Les références d'un monde : qui PRODUIT et qui CONSOMME chaque fait, drapeau, objet, quête, fin… C'est le socle commun de
// l'atelier d'auteur (santé, graphes, simulateur, registre d'identifiants) : le validateur y répond par des phrases, ici on
// garde les sites eux-mêmes, avec l'entité et le chemin dans l'entité.
import { dilemmesDe, drapeauxChoix } from './dilemmes-donnees';
import { questionsDe } from './codex-donnees';
import { drapeauxEvenement, evenementsChoixDe } from './evenements-choix-donnees';
import { examensDe } from './examens-donnees';
import { interjectionsDe } from './interjections-donnees';
import { savoirsDe } from './savoirs-donnees';
import type { RefEntite } from './diagnostics';
import type { Condition, DonneesMonde, EffetMonde } from './schemas';

/** Parcourt toutes les références d'une condition (`flag` compris : il porte l'id du drapeau). */
export function refsCondition(c: Condition, f: (genre: string, id: string, extra?: string) => void): void {
  if ('flag' in c) f('flag', c.flag);
  else if ('fait' in c) f('fait', c.fait);
  else if ('quete' in c) f('quete', c.quete.id);
  else if ('etape' in c) f('etape', c.etape.quete, c.etape.etape);
  else if ('faction' in c) f('faction', c.faction.id);
  else if ('jauge' in c) f('jauge', c.jauge.id);
  else if ('objet' in c) f('objet', c.objet);
  else if ('pnj' in c) f('pnj', c.pnj.id);
  else if ('lieu' in c) f('lieu', c.lieu);
  else if ('rencontre' in c) f('rencontre', c.rencontre.id);
  else if ('parle' in c) f('pnj', c.parle);
  else if ('temoin' in c) f('pnj', c.temoin.pnj);
  else if ('heros' in c) {
    if (c.heros.classe) f('classe', c.heros.classe);
    if (c.heros.espece) f('espece', c.heros.espece);
    if (c.heros.historique) f('historique', c.heros.historique);
  } else if ('niveauGroupe' in c || 'pieces' in c || 'moment' in c) return;
  else if ('non' in c) refsCondition(c.non, f);
  else if ('et' in c) c.et.forEach((x) => refsCondition(x, f));
  else c.ou.forEach((x) => refsCondition(x, f));
}

/** Parcourt toutes les références d'un effet (`flag` compris). */
export function refsEffet(e: EffetMonde, f: (genre: string, id: string, extra?: string) => void): void {
  if ('flag' in e) f('flag', e.flag);
  else if ('fait' in e) f('fait', e.fait);
  else if ('jauge' in e) f('jauge', e.jauge.id);
  else if ('reputation' in e) f('faction', e.reputation.faction);
  else if ('attitude' in e) f('pnj', e.attitude.pnj);
  else if ('objet' in e) f('objet', e.objet.id);
  else if ('quete' in e) f('quete', e.quete.id);
  else if ('etape' in e) f('etape', e.etape.quete, e.etape.etape);
  else if ('pnjEtat' in e) f('pnj', e.pnjEtat.pnj);
  else if ('escorte' in e) f('pnj', e.escorte.pnj);
  else if ('deplacer' in e) {
    f('pnj', e.deplacer.pnj);
    f('lieu', e.deplacer.lieu);
  } else if ('rencontre' in e) f('rencontre', e.rencontre);
  else if ('fin' in e) f('fin', e.fin);
}

export type GenreRef = 'fait' | 'flag' | 'objet' | 'quete' | 'etape' | 'pnj' | 'lieu' | 'rencontre' | 'fin' | 'jauge' | 'faction';

/** Où une référence apparaît : l'entité, le chemin dans l'entité, et le rôle (condition, effet, ou structure : `pnj.inventaire`, `lieu.faits`…). */
export interface Site {
  entite: RefEntite;
  chemin: (string | number)[];
  role: 'condition' | 'effet' | 'structure';
}

export interface IndexReferences {
  /** Ce qui pose, donne, révèle ou déclenche : clé « fait:f-x », « flag:x », « objet:x », « fin:x », « etape:quete/etape »… */
  produit: Map<string, Site[]>;
  /** Ce qui lit, exige ou teste la même chose (conditions, clés de verrou…). */
  consomme: Map<string, Site[]>;
}

export const cleRef = (genre: GenreRef | string, id: string, extra?: string): string => `${genre}:${id}${extra ? `/${extra}` : ''}`;

/** Les sites qui produisent / consomment une référence (tableau vide si aucun). */
export const produitPar = (idx: IndexReferences, genre: GenreRef, id: string, extra?: string): Site[] => idx.produit.get(cleRef(genre, id, extra)) ?? [];
export const consommePar = (idx: IndexReferences, genre: GenreRef, id: string, extra?: string): Site[] => idx.consomme.get(cleRef(genre, id, extra)) ?? [];

const GENRES_INDEXES = new Set<string>(['fait', 'flag', 'objet', 'quete', 'etape', 'pnj', 'lieu', 'rencontre', 'fin', 'jauge', 'faction']);

/** Ce que chaque effet fait de ce qu'il cite : il le produit, sauf retirer un objet (il le consomme). */
function sensEffet(e: EffetMonde, genre: string): 'produit' | 'consomme' {
  return genre === 'objet' && 'objet' in e && e.objet.retirer ? 'consomme' : 'produit';
}

/** Construit l'index « qui produit / qui consomme » de tout le monde, données des modules (dilemmes, examens…) comprises. */
export function indexerReferences(dm: DonneesMonde): IndexReferences {
  const produit = new Map<string, Site[]>();
  const consomme = new Map<string, Site[]>();
  const noter = (table: Map<string, Site[]>, cle: string, site: Site) => {
    const l = table.get(cle);
    if (l) l.push(site);
    else table.set(cle, [site]);
  };
  const condition = (entite: RefEntite, chemin: (string | number)[], c: Condition | undefined) => {
    if (c) refsCondition(c, (g, id, x) => GENRES_INDEXES.has(g) && noter(consomme, cleRef(g, id, x), { entite, chemin, role: 'condition' }));
  };
  const effets = (entite: RefEntite, chemin: (string | number)[], es: EffetMonde[] | undefined) => {
    es?.forEach((e, i) => refsEffet(e, (g, id, x) => GENRES_INDEXES.has(g) && noter(sensEffet(e, g) === 'produit' ? produit : consomme, cleRef(g, id, x), { entite, chemin: [...chemin, i], role: 'effet' })));
  };
  const structure = (table: Map<string, Site[]>, entite: RefEntite, chemin: (string | number)[], genre: GenreRef, id: string) => noter(table, cleRef(genre, id), { entite, chemin, role: 'structure' });

  for (const l of dm.lieux.values()) {
    const e = { type: 'lieux', id: l.id };
    l.liens.forEach((k, i) => {
      condition(e, ['liens', i, 'condition'], k.condition);
      if (k.verrou?.cle) structure(consomme, e, ['liens', i, 'verrou', 'cle'], 'objet', k.verrou.cle);
    });
    l.rencontres.forEach((r, i) => {
      condition(e, ['rencontres', i, 'condition'], r.condition);
      structure(produit, e, ['rencontres', i], 'rencontre', r.id);
    });
    l.faits.forEach((f, i) => {
      condition(e, ['faits', i, 'decouverte', 'condition'], f.decouverte.condition);
      structure(produit, e, ['faits', i], 'fait', f.fait);
    });
  }
  for (const p of dm.pnj.values()) {
    const e = { type: 'pnj', id: p.id };
    p.presences.forEach((x, i) => condition(e, ['presences', i, 'condition'], x.condition));
    p.salutations.variantes.forEach((x, i) => condition(e, ['salutations', 'variantes', i, 'condition'], x.condition));
    p.savoir.forEach((f, i) => structure(produit, e, ['savoir', i], 'fait', f));
    p.secrets.forEach((s, i) => {
      condition(e, ['secrets', i, 'condition'], s.condition);
      structure(produit, e, ['secrets', i], 'fait', s.fait);
    });
    p.sujets.forEach((s, i) => {
      condition(e, ['sujets', i, 'condition'], s.condition);
      s.revele.forEach((f, k) => structure(produit, e, ['sujets', i, 'revele', k], 'fait', f));
      effets(e, ['sujets', i, 'effets'], s.effets);
    });
    p.services.forEach((s, i) => {
      condition(e, ['services', i, 'condition'], s.condition);
      effets(e, ['services', i, 'effets'], s.effets);
    });
    p.inventaire.forEach((o, i) => structure(produit, e, ['inventaire', i], 'objet', o));
    p.boutique?.stock.forEach((s, i) => structure(produit, e, ['boutique', 'stock', i], 'objet', s.objet));
    condition(e, ['compagnon', 'recrutement'], p.compagnon?.recrutement);
    if (p.compagnon?.quetePersonnelle) structure(produit, e, ['compagnon', 'quetePersonnelle'], 'quete', p.compagnon.quetePersonnelle);
  }
  for (const o of dm.objets.values()) effets({ type: 'objets', id: o.id }, ['usage', 'effets'], o.usage?.effets);
  for (const t of dm.tresors.values()) {
    const e = { type: 'tresors', id: t.id };
    condition(e, ['condition'], t.condition);
    t.contenu.objets.forEach((o, i) => structure(produit, e, ['contenu', 'objets', i], 'objet', o.objet));
    if (t.acces.verrou?.cle) structure(consomme, e, ['acces', 'verrou', 'cle'], 'objet', t.acces.verrou.cle);
    if (t.indice) structure(produit, e, ['indice'], 'fait', t.indice);
  }
  for (const t of dm.tables.values()) t.entrees.forEach((en, i) => en.objet && structure(produit, { type: 'tables', id: t.id }, ['entrees', i], 'objet', en.objet));
  for (const p of dm.pieges.values()) effets({ type: 'pieges', id: p.id }, ['effets'], p.effets);
  for (const x of dm.enigmes.values()) {
    const e = { type: 'enigmes', id: x.id };
    effets(e, ['recompense', 'effets'], x.recompense.effets);
    effets(e, ['echec', 'effets'], x.echec?.effets);
  }
  for (const r of dm.rencontres.values()) {
    const e = { type: 'rencontres', id: r.id };
    effets(e, ['effetsVictoire'], r.effetsVictoire);
    r.alternatives.forEach((a, i) => {
      condition(e, ['alternatives', i, 'condition'], a.condition);
      effets(e, ['alternatives', i, 'effets'], a.effets);
      effets(e, ['alternatives', i, 'echec'], a.echec);
    });
  }
  for (const q of dm.quetes.values()) {
    const e = { type: 'quetes', id: q.id };
    condition(e, ['prerequis'], q.prerequis);
    effets(e, ['recompenses', 'effets'], q.recompenses.effets);
    q.recompenses.objets.forEach((o, i) => structure(produit, e, ['recompenses', 'objets', i], 'objet', o));
    q.etapes.forEach((s, i) => {
      condition(e, ['etapes', i, 'completion'], s.completion);
      condition(e, ['etapes', i, 'echec'], s.echec);
      effets(e, ['etapes', i, 'effets'], s.effets);
    });
  }
  for (const j of dm.jauges.values()) {
    const e = { type: 'jauges', id: j.id };
    j.paliers.forEach((p, i) => effets(e, ['paliers', i, 'effets'], p.effets));
    j.evolution.forEach((v, i) => condition(e, ['evolution', i, 'condition'], v.condition));
  }
  for (const ev of dm.evenements.values()) {
    const e = { type: 'evenements', id: ev.id };
    condition(e, ['condition'], ev.condition);
    effets(e, ['effets'], ev.effets);
  }
  for (const f of dm.fins.values()) condition({ type: 'fins', id: f.id }, ['condition'], f.condition);
  // Les vivres (`monde.vivres`) consomment un objet du sac : l'index le sait (un objet jeté, vendu ou perdu coupe la règle).
  if (dm.monde.vivres) structure(consomme, { type: 'monde', id: dm.monde.id }, ['vivres', 'objet'], 'objet', dm.monde.vivres.objet);

  // Données des modules (dossiers d'extension).
  for (const ev of evenementsChoixDe(dm).evenements) {
    const e = { type: 'evenements-choix', id: ev.id };
    condition(e, ['quand'], ev.quand);
    ev.variantes.forEach((va, i) => condition(e, ['variantes', i, 'condition'], va.condition));
    ev.choix.forEach((c, i) => {
      condition(e, ['choix', i, 'condition'], c.condition);
      condition(e, ['choix', i, 'requis'], c.requis);
      effets(e, ['choix', i, 'effets'], c.effets);
      effets(e, ['choix', i, 'echec'], c.echec);
      // Choisir pose `evt-<événement>` et `evt-<événement>-<choix>` (voir drapeauxEvenement).
      drapeauxEvenement(ev.id, c.id).forEach((fl) => structure(produit, e, ['choix', i], 'flag', fl));
    });
  }
  for (const d of dilemmesDe(dm).dilemmes) {
    const e = { type: 'dilemmes', id: d.id };
    condition(e, ['quand'], d.quand);
    d.options.forEach((o, i) => {
      condition(e, ['options', i, 'condition'], o.condition);
      condition(e, ['options', i, 'requis'], o.requis);
      effets(e, ['options', i, 'effets'], o.effets);
      effets(e, ['options', i, 'echec'], o.echec);
    });
    effets(e, ['abstention', 'effets'], d.abstention.effets);
    d.echos.forEach((x, i) => effets(e, ['echos', i, 'effets'], x.effets));
    // Trancher pose `choix-<dilemme>` et `choix-<dilemme>-<option>` (voir drapeauxChoix).
    for (const o of [...d.options.map((x) => x.id), 'abstention']) drapeauxChoix(d.id, o).forEach((fl) => structure(produit, e, ['options'], 'flag', fl));
  }
  for (const i of interjectionsDe(dm).interjections) {
    const e = { type: 'interjections', id: i.id };
    condition(e, ['quand'], i.quand);
    effets(e, ['effets'], i.effets);
  }
  for (const q of questionsDe(dm).questions) {
    const e = { type: 'codex', id: q.id };
    condition(e, ['quand'], q.quand);
    condition(e, ['resolue'], q.resolue);
  }
  for (const x of examensDe(dm).examens) {
    const e = { type: 'examens', id: x.id };
    condition(e, ['visible'], x.visible);
    effets(e, ['effets'], x.effets);
    x.regards.forEach((r, i) => condition(e, ['regards', i, 'condition'], r.condition));
    x.variantes.forEach((v, i) => {
      condition(e, ['variantes', i, 'condition'], v.condition);
      effets(e, ['variantes', i, 'effets'], v.effets);
    });
  }
  for (const s of savoirsDe(dm).savoirs) s.sait.forEach((x, i) => structure(produit, { type: 'savoirs', id: s.pnj }, ['sait', i], 'fait', x.fait));
  return { produit, consomme };
}

/**
 * Une condition peut-elle être vraie un jour, vu ce que le monde produit ? Prudent : ne dit « non » que pour un drapeau, un fait
 * ou un objet du monde que rien ne produit ; tout le reste est supposé possible. `non` est toujours possible.
 */
export function conditionSatisfiable(c: Condition, idx: IndexReferences, dm: DonneesMonde): boolean {
  if ('flag' in c) return (idx.produit.get(cleRef('flag', c.flag))?.length ?? 0) > 0;
  if ('fait' in c) return (idx.produit.get(cleRef('fait', c.fait))?.length ?? 0) > 0;
  // Un objet du catalogue SRD peut s'acheter ou se trouver : on ne juge que les objets propres au monde.
  if ('objet' in c) return !dm.objets.has(c.objet) || (idx.produit.get(cleRef('objet', c.objet))?.length ?? 0) > 0;
  if ('et' in c) return c.et.every((x) => conditionSatisfiable(x, idx, dm));
  if ('ou' in c) return c.ou.some((x) => conditionSatisfiable(x, idx, dm));
  return true;
}
