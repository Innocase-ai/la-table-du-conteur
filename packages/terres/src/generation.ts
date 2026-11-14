// Génération d'une carte de terres à partir de ce que l'auteur a écrit : des ancres (les lieux), des trajets (les liens, avec
// leur durée) et une graine. Déterministe : même définition, même carte, sur toutes les machines.
//
// Étapes : mise en page des ancres (disposition.ts) → relief par bruit fractal (biomes.ts) → zones dégagées autour des ancres
// → décors qui bloquent des cases → routes creusées entre les ancres liées (un gué si une eau les coupe) → points d'intérêt.
import { BIOMES } from './biomes';
import { atteignables, trouverChemin } from './chemin';
import { disposerAncres } from './disposition';
import { semerPoi, TYPES_POI_DEFAUT } from './poi';
import { bruitFractal, hash2 } from './rng';
import { COUT_ROUTE, coutCase, TERRAINS } from './terrain';
import type { Ancre, Case, CarteTerres, DefTerres, Terrain } from './types';

/** À incrémenter à chaque changement de l'algorithme qui modifie les cartes produites. */
export const VERSION_GENERATEUR = 1;

/** Zone dégagée autour d'une ancre : les cases dont la distance en losange est au plus de ce nombre. */
const RAYON_DEGAGE = 3;

export const indexDe = (c: { largeur: number }, x: number, y: number): number => y * c.largeur + x;
export const dansCarte = (c: { largeur: number; hauteur: number }, x: number, y: number): boolean => x >= 0 && y >= 0 && x < c.largeur && y < c.hauteur;

export function terrainEn(c: CarteTerres, x: number, y: number): Terrain | undefined {
  return dansCarte(c, x, y) ? c.tuiles[y * c.largeur + x] : undefined;
}

/** Fonction de coût du déplacement du groupe, selon la vraie carte (eau et décors bloquent). */
export function coutDeplacement(c: CarteTerres): (i: number) => number {
  return (i) => coutCase(c.tuiles[i]!, c.route[i] === 1, c.blocage[i] === 1, c.echelle);
}

export function ancreEn(c: CarteTerres, x: number, y: number): Ancre | undefined {
  return c.ancres.find((a) => a.x === x && a.y === y);
}

function verifier(def: DefTerres): void {
  if (def.largeur < 24 || def.hauteur < 16) throw new Error(`Carte « ${def.id} » : trop petite (24 × 16 cases au moins).`);
  if (!def.ancres.length) throw new Error(`Carte « ${def.id} » : aucune ancre.`);
  const ids = new Set<string>();
  for (const a of def.ancres) {
    if (ids.has(a.id)) throw new Error(`Carte « ${def.id} » : ancre « ${a.id} » en double.`);
    ids.add(a.id);
  }
  for (const l of def.liens) {
    if (!ids.has(l.de) || !ids.has(l.vers)) throw new Error(`Carte « ${def.id} » : le trajet ${l.de} → ${l.vers} cite une ancre inconnue.`);
    if (!(l.heures > 0)) throw new Error(`Carte « ${def.id} » : le trajet ${l.de} → ${l.vers} doit durer plus de 0 heure.`);
  }
}

export function genererCarte(def: DefTerres): CarteTerres {
  verifier(def);
  const { largeur, hauteur, graine } = def;
  const echelle = def.echelle ?? 1;
  const b = BIOMES[def.biome];
  const n = largeur * hauteur;

  const cases = disposerAncres(def.ancres, def.liens, largeur, hauteur, echelle);
  const ancres: Ancre[] = def.ancres.map((a) => ({ id: a.id, nom: a.nom, x: cases.get(a.id)!.x, y: cases.get(a.id)!.y, ...(a.rayonRepere ? { rayonRepere: a.rayonRepere } : {}) }));

  // Le relief.
  const tuiles: Terrain[] = new Array<Terrain>(n);
  for (let y = 0; y < hauteur; y++) {
    for (let x = 0; x < largeur; x++) {
      const elevation = bruitFractal(graine, x / b.echelleRelief, y / b.echelleRelief, 4);
      const humidite = bruitFractal(graine + 99, x / (b.echelleRelief * 0.8), y / (b.echelleRelief * 0.8), 3);
      let t: Terrain;
      if (elevation < b.seuilEau) t = 'eau';
      else if (elevation < b.seuilEau + 0.04 && humidite > b.humiditeMarais) t = 'marais';
      else if (elevation > b.seuilMontagne) t = 'montagne';
      else if (elevation > b.seuilColline) t = 'colline';
      else t = humidite > b.seuilForet ? 'foret' : 'plaine';
      tuiles[y * largeur + x] = t;
    }
  }

  // Une zone dégagée autour de chaque ancre : on peut toujours s'y tenir, y entrer et en sortir.
  const degage = new Uint8Array(n);
  for (const a of ancres) {
    for (let dy = -RAYON_DEGAGE; dy <= RAYON_DEGAGE; dy++) {
      for (let dx = -RAYON_DEGAGE; dx <= RAYON_DEGAGE; dx++) {
        const x = a.x + dx;
        const y = a.y + dy;
        if (!dansCarte({ largeur, hauteur }, x, y) || Math.abs(dx) + Math.abs(dy) > RAYON_DEGAGE) continue;
        tuiles[y * largeur + x] = 'plaine';
        degage[y * largeur + x] = 1;
      }
    }
  }

  // Les décors qui bloquent : arbres serrés, rochers, éboulis. Des cases bloquées donnent des sentiers et des détours.
  const blocage = new Uint8Array(n);
  for (let y = 0; y < hauteur; y++) {
    for (let x = 0; x < largeur; x++) {
      const i = y * largeur + x;
      if (degage[i]) continue;
      const t = tuiles[i]!;
      const p = t === 'foret' ? b.blocage.foret : t === 'colline' ? b.blocage.colline : t === 'montagne' ? b.blocage.montagne : 0;
      if (p > 0 && hash2(graine + 31, x, y) < p) blocage[i] = 1;
    }
  }

  // Les routes : A* entre les ancres liées, des plus courts trajets aux plus longs (les routes se réutilisent). Un peu de bruit sur les
  // coûts les fait serpenter au lieu de suivre des escaliers. Une eau traversée devient un gué ; un décor sur la route est retiré.
  const route = new Uint8Array(n);
  const coutCreuser = (i: number): number => {
    const x = i % largeur;
    const y = (i - x) / largeur;
    const bruit = 0.85 + 0.3 * hash2(graine + 7, x, y);
    if (route[i]) return COUT_ROUTE * 0.85;
    const t = tuiles[i]!;
    const base = t === 'eau' ? 14 : TERRAINS[t].cout;
    return (base + (blocage[i] ? 8 : 0)) * bruit;
  };
  const liens = [...def.liens].sort((p, q) => p.heures - q.heures || p.de.localeCompare(q.de) || p.vers.localeCompare(q.vers));
  for (const l of liens) {
    const A = ancres.find((a) => a.id === l.de)!;
    const B = ancres.find((a) => a.id === l.vers)!;
    const chemin = trouverChemin(largeur, hauteur, A, B, coutCreuser, COUT_ROUTE * 0.85);
    if (!chemin) throw new Error(`Carte « ${def.id} » : impossible de relier ${l.de} et ${l.vers}.`);
    for (const c of chemin.cases) {
      const i = c.y * largeur + c.x;
      if (tuiles[i] === 'eau') tuiles[i] = 'gue';
      route[i] = 1;
      blocage[i] = 0;
    }
  }

  const carte: CarteTerres = {
    id: def.id,
    graine,
    largeur,
    hauteur,
    biome: def.biome,
    echelle,
    danger: def.danger ?? 1,
    versionGenerateur: VERSION_GENERATEUR,
    tuiles,
    route,
    blocage,
    ancres,
    liens: def.liens,
    pois: [],
  };

  // Tout doit être joignable depuis la première ancre : c'est la garantie de la carte.
  const cout = coutDeplacement(carte);
  const joignable = atteignables(largeur, hauteur, ancres[0]!, cout);
  for (const a of ancres) if (!joignable[a.y * largeur + a.x]) throw new Error(`Carte « ${def.id} » : l'ancre « ${a.id} » est injoignable.`);

  // Les points d'intérêt, seulement là où le groupe peut aller, hors route.
  const interdit = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (route[i] || blocage[i] || !joignable[i] || !Number.isFinite(TERRAINS[tuiles[i]!].cout)) interdit[i] = 1;
  carte.pois = semerPoi({ graine, largeur, hauteur, tuiles, interdit, ancres, densite: def.densitePoi ?? 1 / 220, types: def.typesPoi ?? TYPES_POI_DEFAUT });
  return carte;
}

export interface RapportDuree {
  de: string;
  vers: string;
  heuresEcrites: number;
  minutesReelles: number;
  /** minutesReelles / (heuresEcrites × 60) : 1 = pile la durée de l'auteur. */
  rapport: number;
}

/** Compare, pour chaque trajet écrit, la durée réelle du meilleur chemin à celle de l'auteur : le contrôle que ferait un validateur. */
export function rapportDurees(carte: CarteTerres): RapportDuree[] {
  const cout = coutDeplacement(carte);
  return carte.liens.map((l) => {
    const A = carte.ancres.find((a) => a.id === l.de)!;
    const B = carte.ancres.find((a) => a.id === l.vers)!;
    const ch = trouverChemin(carte.largeur, carte.hauteur, A, B, cout, COUT_ROUTE * carte.echelle) as { cout: number };
    return { de: l.de, vers: l.vers, heuresEcrites: l.heures, minutesReelles: Math.round(ch.cout), rapport: ch.cout / (l.heures * 60) };
  });
}

/** L'écart le plus grand entre la durée réelle et la durée écrite, en facteur (1 = parfait, 1,5 = un trajet 50 % trop long ou trop court). */
export function pireEcart(carte: CarteTerres): number {
  return Math.max(1, ...rapportDurees(carte).map((r) => Math.max(r.rapport, 1 / r.rapport)));
}

/**
 * Cherche une graine qui donne une carte fidèle aux durées de l'auteur (un lac ou un massif mal placé peut doubler un trajet).
 * L'auteur lance cet outil une fois, puis fixe la graine trouvée dans sa définition : tous les joueurs voient la même carte.
 * S'arrête à la première graine dont le pire écart est sous `tolerance` ; sinon rend la meilleure des `essais`.
 */
export function chercherGraine(def: DefTerres, opts: { essais?: number; depuis?: number; tolerance?: number } = {}): { graine: number; ecart: number } | undefined {
  const essais = opts.essais ?? 100;
  const depuis = opts.depuis ?? 1;
  const tolerance = opts.tolerance ?? 1.3;
  let meilleur: { graine: number; ecart: number } | undefined;
  for (let k = 0; k < essais; k++) {
    const graine = depuis + k;
    let ecart: number;
    try {
      ecart = pireEcart(genererCarte({ ...def, graine }));
    } catch {
      continue;
    }
    if (!meilleur || ecart < meilleur.ecart) meilleur = { graine, ecart };
    if (ecart <= tolerance) break;
  }
  return meilleur;
}

/** Les cases autour de (x, y) dans une fenêtre, pour tirer un plateau de combat du terrain local (un autre module s'en sert). */
export function voisinage(carte: CarteTerres, centre: Case, demiLargeur: number, demiHauteur: number): { terrain: Terrain; route: boolean; bloquee: boolean }[][] {
  const lignes: { terrain: Terrain; route: boolean; bloquee: boolean }[][] = [];
  for (let y = centre.y - demiHauteur; y <= centre.y + demiHauteur; y++) {
    const ligne: { terrain: Terrain; route: boolean; bloquee: boolean }[] = [];
    for (let x = centre.x - demiLargeur; x <= centre.x + demiLargeur; x++) {
      if (!dansCarte(carte, x, y)) ligne.push({ terrain: 'plaine', route: false, bloquee: true });
      else {
        const i = y * carte.largeur + x;
        ligne.push({ terrain: carte.tuiles[i]!, route: carte.route[i] === 1, bloquee: carte.blocage[i] === 1 });
      }
    }
    lignes.push(ligne);
  }
  return lignes;
}
