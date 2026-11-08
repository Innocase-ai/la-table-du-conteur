// Complétude d'un monde : ce qui MANQUE pour qu'une histoire soit livrable (images, cartes, scènes, voix, positions, estimation).
// Le validateur (`validation.ts`) vérifie que ce qui existe est juste ; ce module cherche ce qui n'existe pas encore.
// Pur : les fichiers (images communes, voix, manifeste) sont lus par l'appelant (`outils/monde/cli.ts`).
import type { ManifesteImages } from './images';
import type { DonneesMonde } from './schemas';

export type Gravite = 'manque' | 'avis';

export interface Ecart {
  gravite: Gravite;
  /** Rubrique : images, cartes, positions, scenes, voix, publication, textes. */
  categorie: string;
  /** Ce qui manque (un id, un nom de fichier…). */
  cible: string;
  detail: string;
}

/** Les scènes narrées, dans la forme minimale dont on a besoin (voir `modules/scenes.ts`). */
export interface SceneMinimale {
  id: string;
  declencheur: Record<string, unknown>;
  plans: { image?: { groupe: string; id: string } }[];
}

export interface EntreesCompletude {
  dm: DonneesMonde;
  manifeste?: ManifesteImages;
  /** Ids des images communes à tous les mondes (`apps/jeu/src/equipement/<id>.webp`). */
  imagesCommunes: Set<string>;
  /** Id d'image commune d'un objet du catalogue (`idImageCommune`). */
  idImageCommune: (id: string) => string;
  scenes: SceneMinimale[];
  /** Noms (sans extension) des voix livrées : `<scene>-<plan>`. */
  voix: Set<string>;
  estimationPresente: boolean;
}

/** Nombre d'enfants à partir duquel un lieu mérite une carte illustrée (`outils/images/cartes.ts`). */
export const SEUIL_CARTE = 5;

export function verifierCompletude(e: EntreesCompletude): Ecart[] {
  const { dm, manifeste } = e;
  const ecarts: Ecart[] = [];
  const manque = (categorie: string, cible: string, detail: string) => ecarts.push({ gravite: 'manque', categorie, cible, detail });
  const avis = (categorie: string, cible: string, detail: string) => ecarts.push({ gravite: 'avis', categorie, cible, detail });
  const lieux = [...dm.lieux.values()];

  // 1. Images propres à l'histoire : un lieu, un PNJ, un objet de l'histoire sans image montre une tuile vide dans le jeu.
  for (const l of lieux) if (!manifeste?.lieux[l.id]) manque('images', l.id, `lieu « ${l.nom} » sans image`);
  for (const p of dm.pnj.values()) if (!manifeste?.pnj[p.id]) manque('images', p.id, `PNJ « ${p.nom} » sans portrait`);
  for (const o of dm.objets.values()) {
    if (!manifeste?.objets[o.id] && !e.imagesCommunes.has(e.idImageCommune(o.id))) manque('images', o.id, `objet « ${o.nom} » sans image (icône par défaut dans le sac)`);
  }

  // 2. Objets du catalogue cités (trésors, boutiques, inventaires, récompenses) : leur image commune existe-t-elle ?
  const cites = new Map<string, string>();
  const citer = (id: string | undefined, ou: string) => { if (id && !dm.objets.has(id) && !cites.has(id)) cites.set(id, ou); };
  for (const t of dm.tresors.values()) for (const o of t.contenu.objets) citer(o.objet, `trésor ${t.id}`);
  for (const p of dm.pnj.values()) {
    for (const s of p.boutique?.stock ?? []) citer(s.objet, `boutique de ${p.id}`);
    for (const i of p.inventaire) citer(i, `inventaire de ${p.id}`);
  }
  for (const q of dm.quetes.values()) for (const o of q.recompenses.objets) citer(o, `récompense de ${q.id}`);
  for (const [id, ou] of cites) if (!e.imagesCommunes.has(e.idImageCommune(id))) manque('images', id, `objet du catalogue sans image commune (cité par ${ou})`);

  // 3. Cartes illustrées : un lieu qui en contient au moins 5 autres, et ses enfants posés dessus.
  const enfants = (id: string) => lieux.filter((l) => l.parent === id);
  for (const l of lieux) {
    const n = enfants(l.id).length;
    if (n < SEUIL_CARTE) continue;
    if (!manifeste?.cartes[l.id]) { manque('cartes', l.id, `« ${l.nom} » contient ${n} lieux et n'a pas de carte illustrée`); continue; }
    for (const c of enfants(l.id)) if (!c.position) avis('positions', c.id, `lieu sans position sur la carte de « ${l.nom} » (le jeu le place en anneau)`);
  }

  // 4. Scènes narrées : ouverture, une par fin, images existantes, une voix par plan.
  if (!e.scenes.some((s) => s.declencheur['debut'] === true)) manque('scenes', 'ouverture', "aucune scène d'ouverture (déclencheur « debut »)");
  for (const f of dm.fins.values()) if (!e.scenes.some((s) => s.declencheur['fin'] === f.id)) avis('scenes', f.id, `fin « ${f.nom} » sans scène narrée`);
  for (const s of e.scenes) {
    s.plans.forEach((p, i) => {
      if (p.image && !manifeste?.[p.image.groupe as keyof ManifesteImages]?.[p.image.id]) manque('scenes', `${s.id}-${i + 1}`, `l'image ${p.image.groupe}/${p.image.id} du plan n'existe pas dans le manifeste`);
      if (!e.voix.has(`${s.id}-${i + 1}`)) manque('voix', `${s.id}-${i + 1}`, 'plan sans voix enregistrée (le jeu lit alors la synthèse du système)');
    });
  }

  // 5. Textes que le joueur lit : le récit d'arrivée et l'accroche des lieux.
  for (const l of lieux) {
    if (!l.arrivee) avis('textes', l.id, `lieu « ${l.nom} » sans récit d'arrivée (le joueur ne lit que le résumé)`);
    if (l.parent && !l.accroche) avis('textes', l.id, `lieu « ${l.nom} » sans accroche (rien sous le bouton qui y mène)`);
  }

  // 6. Promesses non tenues : des lieux ou des PNJ parlent de contrats (mini-quêtes de combat) qu'aucune quête ne porte.
  const parleDeContrats = lieux.filter((l) => /\bcontrats?\b/i.test(`${l.resume} ${l.description}`)).map((l) => l.id);
  // Un contrat se reconnaît à son nom, ou à la forme notée dans ses ramifications (« Forme : traque légère. », voir creer-contrats).
  const aDesContrats = [...dm.quetes.values()].some((q) => /contrat/i.test(`${q.id} ${q.nom}`) || /^\s*forme\s*:/i.test(q.ramifications ?? ''));
  if (parleDeContrats.length && !aDesContrats) avis('contrats', parleDeContrats.join(', '), "ces lieux annoncent des contrats, mais aucune quête de contrat n'existe (skill creer-contrats)");

  // 7. Publication : estimation de durée et de coût, quêtes rangées dans les chapitres.
  if (dm.monde.statut === 'publie' && !e.estimationPresente) manque('publication', 'estimation.json', 'monde publié sans estimation (pnpm monde estimer)');
  if (dm.monde.statut === 'brouillon') avis('publication', dm.monde.id, "monde en brouillon : l'histoire n'apparaît pas dans le jeu");
  if (dm.quetes.size && dm.monde.chapitres.every((c) => c.quetes.length === 0)) avis('publication', dm.monde.id, "aucun chapitre ne liste ses quêtes (`chapitres[].quetes`, à remplir à la publication)");

  return ecarts;
}

/** Résumé par rubrique : « images : 6 manque(nt), cartes : 6 manque(nt)… ». */
export function resumerCompletude(ecarts: Ecart[]): Map<string, { manque: number; avis: number }> {
  const r = new Map<string, { manque: number; avis: number }>();
  for (const e of ecarts) {
    const c = r.get(e.categorie) ?? { manque: 0, avis: 0 };
    c[e.gravite]++;
    r.set(e.categorie, c);
  }
  return r;
}
