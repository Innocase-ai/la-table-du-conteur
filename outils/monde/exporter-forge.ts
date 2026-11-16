// Import inverse : un monde existant (packages/mondes/<id>/) devient une conception de la Forge d'Histoires, pour le VOIR sur son canevas
// (lieux imbriqués, PNJ, contenants avec leurs obstacles, objets, quêtes reliées). LECTURE SEULE : rien n'est jamais renvoyé dans le monde ;
// c'est une vue, avec perte (le moteur est plus riche que la Forge), pas un aller-retour. Voir docs/FORGE.md.
//
// Entrée : les fichiers JSON bruts du monde (comme les lit le serveur de l'atelier). Aucun schéma, aucun accès disque : fonction pure.
import { CATEGORIES } from './importer-forge';

/* eslint-disable @typescript-eslint/no-explicit-any */
type J = Record<string, any>;

export interface MondeBrut {
  monde: J;
  fichiers: { chemin: string; contenu: unknown }[];
}

export interface ActifExporte {
  id: string;
  type: string;
  nom: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  parent: string | null;
  props: Record<string, unknown>;
}

export interface ConceptionForge {
  version: 1;
  monde: { nom: string; desc: string };
  histoire: { titre: string; intro: string; niveaux: { min: number; max: number }; assets: ActifExporte[]; liens: { id: string; from: string; to: string; type: string }[] };
}

/** Les liens que la Forge accepte (de quelles catégories ou types vers lesquels), comme `LINKS` de la Forge : on n'en émet pas d'autres. */
const REGLES: Record<string, { de: string[]; vers: string[] }> = {
  mene_a: { de: ['@lieu'], vers: ['@lieu'] },
  donne: { de: ['@pnj', '@lieu'], vers: ['@quete'] },
  deroule: { de: ['@quete'], vers: ['@lieu'] },
  termine: { de: ['@quete'], vers: ['@lieu'] },
  requiert: { de: ['@quete'], vers: ['@objet', 'adversaire', 'monstre'] },
  donne_obj: { de: ['@quete'], vers: ['@objet'] },
  garde: { de: ['adversaire', 'monstre'], vers: ['@quete', '@lieu', '@contenant'] },
  vend: { de: ['marchand'], vers: ['@objet'] },
};
const accepte = (liste: string[], type: string) => liste.some((x) => x === type || (x.startsWith('@') && x.slice(1) === CATEGORIES[type]));
export const lienValide = (type: string, de: string, vers: string): boolean => !!REGLES[type] && accepte(REGLES[type]!.de, de) && accepte(REGLES[type]!.vers, vers);

const CARTE = { feuille: { w: 78, h: 86 }, contenant: { w: 84, h: 96 }, quete: { w: 142, h: 100 } };
const PAS = { x: 94, y: 108 };
const MARGE = 10;
const ENTETE = 36;
const MAX_STOCK = 12;

const joli = (id: string) => (id.charAt(0).toUpperCase() + id.slice(1)).replace(/-/g, ' ');
const poLisible = (v: unknown) => (typeof v === 'number' ? `${Math.round(v * 100) / 100} po` : '');

export function exporterVersForge(src: MondeBrut): { forge: ConceptionForge; notes: string[] } {
  const notes: string[] = [];
  const dossier = (d: string): J[] =>
    src.fichiers
      .filter((f) => f.chemin.startsWith(`${d}/`))
      .flatMap((f) => (Array.isArray(f.contenu) ? f.contenu : [f.contenu]))
      .filter((x): x is J => !!x && typeof x === 'object' && !Array.isArray(x));
  const lieuxM = dossier('lieux');
  const lieuxParId = new Map(lieuxM.map((l) => [String(l['id']), l]));
  const objetsM = new Map(dossier('objets').map((o) => [String(o['id']), o]));
  const piegesM = new Map(dossier('pieges').map((p) => [String(p['id']), p]));
  const pnjM = dossier('pnj');
  const quetesM = dossier('quetes');
  const rencontresM = dossier('rencontres');

  const assets: ActifExporte[] = [];
  const liens: ConceptionForge['histoire']['liens'] = [];
  let n = 0;
  const ajouter = (type: string, nom: string, parent: string | null, props: Record<string, unknown> = {}): ActifExporte => {
    const a: ActifExporte = { id: `m${++n}`, type, nom, x: 0, y: 0, parent, props };
    assets.push(a);
    return a;
  };
  const lier = (type: string, de: ActifExporte | undefined, vers: ActifExporte | undefined) => {
    if (!de || !vers || de.id === vers.id || !lienValide(type, de.type, vers.type)) return;
    if (liens.some((l) => l.type === type && l.from === de.id && l.to === vers.id)) return;
    liens.push({ id: `k${liens.length + 1}`, from: de.id, to: vers.id, type });
  };

  // --- Lieux : les régions et les routes n'ont pas de type dans la Forge ; leurs enfants deviennent des lieux de plus haut niveau ---
  const IGNORES = new Set(['region', 'route']);
  const typeLieu = (l: J): string => {
    const nom = `${l['nom']}`;
    const services: string[] = Array.isArray(l['services']) ? l['services'] : [];
    switch (l['type']) {
      case 'village': case 'ville': case 'hameau': case 'camp': case 'quartier': return 'village';
      case 'batiment':
        if (services.includes('auberge') || /taverne|auberge/i.test(nom)) return 'taverne';
        if (services.includes('soins') || /sanctuaire|temple|chapelle|église/i.test(nom)) return 'sanctuaire';
        return 'maison';
      case 'salle': return 'maison';
      case 'grotte': case 'donjon': case 'niveau': return 'grotte';
      case 'ruine': return 'ruines';
      default: return 'lieu_quete';
    }
  };
  const lieuA = new Map<string, ActifExporte>();
  /** L'actif de lieu le plus proche en remontant les parents (un parent ignoré se saute). */
  const ancetre = (id: unknown): ActifExporte | null => {
    let c: string | undefined = typeof id === 'string' ? id : undefined;
    for (let i = 0; c && i < 30; i++) {
      const a = lieuA.get(c);
      if (a) return a;
      c = lieuxParId.get(c)?.['parent'];
    }
    return null;
  };
  // Les parents avant les enfants : on ajoute par profondeur croissante.
  const profondeur = (l: J): number => {
    let d = 0;
    for (let c = l['parent'] as string | undefined; c && d < 30; c = lieuxParId.get(c)?.['parent']) d++;
    return d;
  };
  const regions = lieuxM.filter((l) => IGNORES.has(l['type'])).length;
  if (regions) notes.push(`${regions} région(s) ou route(s) sans équivalent dans la Forge : leurs lieux sont posés au premier niveau.`);
  for (const l of [...lieuxM].sort((a, b) => profondeur(a) - profondeur(b))) {
    if (IGNORES.has(l['type'])) continue;
    const parent = ancetre(l['parent']);
    lieuA.set(String(l['id']), ajouter(typeLieu(l), String(l['nom']), parent?.id ?? null, { desc: String(l['resume'] ?? '') }));
  }
  const parentEnfant = (a: ActifExporte, b: ActifExporte) => a.parent === b.id || b.parent === a.id;
  for (const l of lieuxM) {
    const de = lieuA.get(String(l['id']));
    for (const lien of Array.isArray(l['liens']) ? l['liens'] : []) {
      const vers = lieuA.get(String(lien['vers']));
      if (!de || !vers || parentEnfant(de, vers) || liens.some((k) => k.type === 'mene_a' && ((k.from === de.id && k.to === vers.id) || (k.from === vers.id && k.to === de.id)))) continue;
      lier('mene_a', de, vers);
    }
  }

  // --- Rencontres de combat : un adversaire (qui peut parler) ou un monstre ---
  const rencontreA = new Map<string, ActifExporte>();
  const lieuDeRencontre = (r: J): ActifExporte | null => {
    if (r['lieu']) return ancetre(r['lieu']);
    const l = lieuxM.find((x) => (x['rencontres'] ?? []).some((e: J) => e['id'] === r['id']));
    return l ? ancetre(l['id']) : null;
  };
  const DANGER: Record<string, string> = { faible: 'Facile', moderee: 'Modéré', elevee: 'Difficile' };
  let nonCombat = 0;
  for (const r of rencontresM) {
    if (!['combat', 'mixte'].includes(r['type']) || !(r['monstres'] ?? []).length) {
      nonCombat++;
      continue;
    }
    const profil = String(r['monstres'][0]['profil'] ?? '');
    const a = ajouter((r['alternatives'] ?? []).length ? 'adversaire' : 'monstre', String(r['nom']), lieuDeRencontre(r)?.id ?? null, {
      danger: DANGER[r['difficulte']] ?? 'Modéré',
      profil,
      role: String(r['intro'] ?? '').slice(0, 140),
    });
    rencontreA.set(String(r['id']), a);
  }
  if (nonCombat) notes.push(`${nonCombat} rencontre(s) sociale(s), d'exploration ou sans monstre : non reprises.`);

  // --- Objets : créés à la demande, à chaque endroit où on les trouve ---
  const objetsAssets = new Map<string, ActifExporte[]>();
  const objet = (id: string, parent: string | null): ActifExporte => {
    const m = objetsM.get(id);
    const type = m ? ({ arme: 'arme', potion: 'potion', quete: 'objet_quete' } as Record<string, string>)[m['categorie']] ?? 'objet_divers' : 'objet_divers';
    const props: Record<string, unknown> = { valeur: m ? poLisible(m['valeurPo']) : '', desc: String(m?.['resume'] ?? '') };
    if (m && m['rarete'] && m['rarete'] !== 'commun') props['rarete'] = m['rarete'];
    const a = ajouter(type, String(m?.['nom'] ?? joli(id)), parent, props);
    objetsAssets.set(id, [...(objetsAssets.get(id) ?? []), a]);
    return a;
  };
  const bourse = (pieces: J, parent: string | null) => {
    const unite = pieces['po'] ? 'po' : pieces['pa'] ? 'pa' : 'pc';
    const v = pieces[unite];
    if (v) ajouter('bourse_or', `Bourse (${v} ${unite})`, parent, { valeur: `${v} ${unite}` });
  };

  // --- Trésors : un contenant (coffre, sac, cercueil…) avec ses obstacles, ou des objets posés au sol ---
  const CONTENANT: Record<string, string> = { coffre: 'coffre', cache: 'coffre', autel: 'coffre', cadavre: 'sac', sac: 'sac', tombe: 'cercueil', sarcophage: 'cercueil' };
  for (const t of dossier('tresors')) {
    const lieu = ancetre(t['lieu']);
    const contenu: J = t['contenu'] ?? {};
    if (t['contenant'] === 'sol') {
      for (const o of contenu['objets'] ?? []) objet(String(o['objet']), lieu?.id ?? null);
      if (contenu['pieces']) bourse(contenu['pieces'], lieu?.id ?? null);
      continue;
    }
    const acces: J = t['acces'] ?? {};
    const props: Record<string, unknown> = { desc: String(t['description'] ?? '') };
    if (acces['verrou']?.['dd']) props['verrou'] = acces['verrou']['dd'];
    if (acces['cache']?.['dd']) props['cache'] = acces['cache']['dd'];
    const piege = acces['piege'] ? piegesM.get(String(acces['piege'])) : undefined;
    if (piege) {
      props['piege'] = true;
      props['piegeDetection'] = piege['detection']?.['dd'];
      props['piegeDesarmement'] = piege['desarmement']?.['dd'];
      const degats = (piege['degats'] ?? []).map((d: J) => `${d['des']} ${d['type']}`).join(' + ');
      if (degats) props['piegeDegats'] = degats;
    }
    if ((contenu['tables'] ?? []).length) props['desc'] = `${props['desc']} (tirages au hasard : ${contenu['tables'].map((x: J) => x['table']).join(', ')})`.trim();
    const c = ajouter(CONTENANT[t['contenant']] ?? 'armoire', String(t['nom']), lieu?.id ?? null, props);
    for (const o of contenu['objets'] ?? []) objet(String(o['objet']), c.id);
    if (contenu['pieces']) bourse(contenu['pieces'], c.id);
    if (t['gardien']) lier('garde', rencontreA.get(String(t['gardien'])), c);
  }

  // --- PNJ ---
  const donneurs = new Set(quetesM.map((q) => q['donneur']).filter(Boolean));
  const pnjA = new Map<string, ActifExporte>();
  let tronque = 0;
  for (const p of pnjM) {
    const lieu = ancetre(p['lieu']);
    const soins = (p['services'] ?? []).find((s: J) => /soin|guér/i.test(`${s['id']} ${s['nom']}`));
    const role = String(p['role'] ?? '');
    const type = p['profilCombat'] ? 'adversaire'
      : p['boutique'] ? 'marchand'
      : soins || /prêtre|prêtresse|clerc|moine|soigneu/i.test(role) ? 'pretre'
      : p['compagnon'] ? 'allie'
      : donneurs.has(p['id']) ? 'queteur'
      : p['titre'] || /chef|maire|duc|sire|seigneur|châtelain|capitaine|bourgmestre/i.test(role) ? 'notable'
      : 'allie';
    const lignes = [p['salutations']?.['neutre'], ...(p['sujets'] ?? []).slice(0, 4).map((s: J) => s['reponse'])].filter((x) => typeof x === 'string' && x);
    const props: Record<string, unknown> = { role, dialogue: lignes };
    if (type === 'pretre' && soins) props['soins'] = String(soins['resume'] ?? '');
    if (type === 'adversaire') Object.assign(props, { profil: p['profilCombat'], danger: '' });
    const a = ajouter(type, String(p['nom']), lieu?.id ?? null, props);
    pnjA.set(String(p['id']), a);
    for (const s of ((p['boutique']?.['stock'] ?? []) as J[]).slice(0, MAX_STOCK)) lier('vend', a, objet(String(s['objet']), lieu?.id ?? null));
    if ((p['boutique']?.['stock'] ?? []).length > MAX_STOCK) tronque += (p['boutique']['stock'].length as number) - MAX_STOCK;
  }
  if (tronque) notes.push(`${tronque} article(s) de boutique au-delà de ${MAX_STOCK} par marchand : non repris.`);

  // --- Quêtes : cartes reliées au donneur, aux lieux d'étape, aux cibles et aux récompenses ---
  const conditions = (c: any, acc: J[] = []): J[] => {
    if (c && typeof c === 'object') {
      acc.push(c);
      for (const v of Object.values(c)) if (Array.isArray(v)) v.forEach((x) => conditions(x, acc));
      else if (v && typeof v === 'object') conditions(v, acc);
    }
    return acc;
  };
  for (const q of quetesM) {
    const xp = (q['recompenses']?.['xp'] ?? 0) + (q['etapes'] ?? []).reduce((s: number, e: J) => s + (e['effets'] ?? []).reduce((t: number, ef: J) => t + (typeof ef['xp'] === 'number' ? ef['xp'] : 0), 0), 0);
    const pieces = q['recompenses']?.['pieces'];
    const a = ajouter(q['type'] === 'principale' ? 'quete_principale' : 'quete_annexe', String(q['nom']), null, {
      texte: String(q['resume'] ?? ''),
      recompense: String(q['recompenses']?.['annonce'] ?? (pieces ? `${pieces} po` : '')),
      xp: xp ? `${xp} XP` : '',
    });
    const donneur = q['donneur'] ? pnjA.get(String(q['donneur'])) : undefined;
    lier('donne', donneur ?? ancetre(q['lieu']) ?? undefined, a);
    const etapes: J[] = q['etapes'] ?? [];
    const lieuxEtapes: ActifExporte[] = [];
    for (const e of etapes) {
      const l = ancetre(e['lieu']) ?? ancetre(conditions(e['completion']).find((c) => typeof c['lieu'] === 'string')?.['lieu']);
      if (l && !lieuxEtapes.includes(l)) lieuxEtapes.push(l);
      for (const c of conditions(e['completion'])) {
        if (c['rencontre']?.['id']) lier('requiert', a, rencontreA.get(String(c['rencontre']['id'])));
        if (typeof c['objet'] === 'string') lier('requiert', a, (objetsAssets.get(c['objet']) ?? [])[0] ?? objet(c['objet'], l?.id ?? null));
      }
    }
    // L'arrivée est le dernier lieu d'étape qui n'est pas celui du donneur (la dernière étape est souvent le retour chez lui) ; les autres lieux (sauf celui du donneur) sont des étapes.
    const lieuDonneur = (donneur && ancetre(pnjM.find((x) => x['id'] === q['donneur'])?.['lieu'])) || ancetre(q['lieu']);
    const loin = lieuxEtapes.filter((l) => l !== lieuDonneur);
    const arrivee = loin[loin.length - 1] ?? lieuxEtapes[lieuxEtapes.length - 1];
    if (arrivee) lier('termine', a, arrivee);
    for (const l of loin) if (l !== arrivee) lier('deroule', a, l);
    for (const id of q['recompenses']?.['objets'] ?? []) lier('donne_obj', a, (objetsAssets.get(id) ?? [])[0] ?? objet(String(id), ancetre(q['lieu'])?.id ?? null));
  }
  const autres = ['enigmes', 'dilemmes', 'evenements', 'jauges', 'factions', 'fins'].map((d) => `${dossier(d).length} ${d}`).filter((s) => !s.startsWith('0 '));
  if (autres.length) notes.push(`Non représentés dans la Forge : ${autres.join(', ')}.`);

  placer(assets);

  const m = src.monde;
  return {
    forge: {
      version: 1,
      monde: { nom: String(m['nom'] ?? ''), desc: String(m['resume'] ?? '') },
      histoire: {
        titre: String(m['nom'] ?? ''),
        intro: String(m['accroche'] ?? m['resume'] ?? ''),
        niveaux: m['niveaux'] && Number.isInteger(m['niveaux']['min']) && Number.isInteger(m['niveaux']['max']) ? { min: m['niveaux']['min'], max: m['niveaux']['max'] } : { min: 1, max: 2 },
        assets,
        liens,
      },
    },
    notes,
  };
}

// ---------------------------------------------------------------------------
// Disposition sur le canevas : chaque lieu est assez grand pour ses cartes et ses sous-lieux
// ---------------------------------------------------------------------------

function placer(assets: ActifExporte[]): void {
  const cat = (a: ActifExporte) => CATEGORIES[a.type];
  const enfants = new Map<string, ActifExporte[]>();
  for (const a of assets) if (a.parent) enfants.set(a.parent, [...(enfants.get(a.parent) ?? []), a]);
  const kids = (a: ActifExporte) => enfants.get(a.id) ?? [];

  interface Mesure {
    w: number;
    h: number;
    cols: number;
    rangees: { sous: ActifExporte[]; h: number }[];
    hFeuilles: number;
  }
  const mesures = new Map<string, Mesure>();
  const mesurer = (l: ActifExporte): Mesure => {
    const memo = mesures.get(l.id);
    if (memo) return memo;
    const feuilles = kids(l).filter((k) => cat(k) !== 'lieu');
    const sous = kids(l).filter((k) => cat(k) === 'lieu');
    const cols = Math.min(6, Math.max(1, Math.ceil(Math.sqrt(feuilles.length * 1.6))));
    const wFeuilles = feuilles.length ? Math.min(cols, feuilles.length) * PAS.x : 0;
    const hFeuilles = Math.ceil(feuilles.length / cols) * PAS.y;
    // Les sous-lieux sont rangés en rangées de 900 px au plus.
    const rangees: { sous: ActifExporte[]; h: number }[] = [];
    let courante: ActifExporte[] = [];
    let largeur = 0;
    let wRangeeMax = 0;
    for (const s of sous) {
      const m = mesurer(s);
      if (courante.length && largeur + m.w + MARGE > Math.max(900, wFeuilles)) {
        rangees.push({ sous: courante, h: Math.max(...courante.map((x) => mesurer(x).h)) });
        wRangeeMax = Math.max(wRangeeMax, largeur);
        courante = [];
        largeur = 0;
      }
      courante.push(s);
      largeur += m.w + MARGE;
    }
    if (courante.length) {
      rangees.push({ sous: courante, h: Math.max(...courante.map((x) => mesurer(x).h)) });
      wRangeeMax = Math.max(wRangeeMax, largeur);
    }
    const w = Math.max(220, 2 * MARGE + Math.max(wFeuilles, wRangeeMax));
    const h = Math.max(150, ENTETE + MARGE + hFeuilles + rangees.reduce((s, r) => s + r.h + MARGE, 0) + MARGE);
    const res = { w, h, cols, rangees, hFeuilles };
    mesures.set(l.id, res);
    return res;
  };
  const poser = (l: ActifExporte, x: number, y: number): void => {
    const m = mesurer(l);
    Object.assign(l, { x, y, w: m.w, h: m.h });
    const feuilles = kids(l).filter((k) => cat(k) !== 'lieu');
    feuilles.forEach((f, i) => {
      f.x = x + MARGE + (i % m.cols) * PAS.x;
      f.y = y + ENTETE + Math.floor(i / m.cols) * PAS.y;
      // Les objets d'un contenant sont masqués sur la feuille : ils prennent sa place.
      for (const o of kids(f)) Object.assign(o, { x: f.x, y: f.y });
    });
    let yy = y + ENTETE + MARGE + m.hFeuilles;
    for (const r of m.rangees) {
      let xx = x + MARGE;
      for (const s of r.sous) {
        poser(s, xx, yy);
        xx += mesurer(s).w + MARGE;
      }
      yy += r.h + MARGE;
    }
  };

  // Les quêtes en une rangée en haut, puis les lieux de plus haut niveau (et ce qui traîne hors de tout lieu) en rangées.
  const quetes = assets.filter((a) => cat(a) === 'quete');
  quetes.forEach((q, i) => Object.assign(q, { x: (i % 8) * (CARTE.quete.w + 16), y: Math.floor(i / 8) * (CARTE.quete.h + 16) }));
  const yDepart = quetes.length ? Math.ceil(quetes.length / 8) * (CARTE.quete.h + 16) + 60 : 0;
  const racines = assets.filter((a) => !a.parent && cat(a) === 'lieu');
  let x = 0;
  let y = yDepart;
  let hRangee = 0;
  for (const r of racines) {
    const m = mesurer(r);
    if (x > 0 && x + m.w > 2600) {
      x = 0;
      y += hRangee + 60;
      hRangee = 0;
    }
    poser(r, x, y);
    x += m.w + 60;
    hRangee = Math.max(hRangee, m.h);
  }
  const libres = assets.filter((a) => !a.parent && cat(a) !== 'lieu' && cat(a) !== 'quete');
  y += hRangee + 60;
  libres.forEach((a, i) => {
    a.x = i * PAS.x;
    a.y = y;
    for (const o of kids(a)) Object.assign(o, { x: a.x, y: a.y });
  });
}
