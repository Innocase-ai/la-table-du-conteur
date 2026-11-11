// Les cartes : la main d'un combattant à son tour, et l'exécution des commandes.
// Une carte est une option de jeu réelle du SRD (attaque, sort, aptitude…) ou une carte d'élan.
import type { Sort } from '../schemas';
import { actif, adversairesCiblables, allies, combattant, ennemis, horsCombat, journaliser, lancerDes, peutAgir, type Combattant, type EtatCombat } from './etat';
import { distanceMetres, type Position } from './grille';
import {
  aPortee,
  aTrait,
  ajouterEtat,
  sauvegarde,
  attaqueArme,
  attaqueMonstre,
  deplacer,
  emplacementDisponible,
  finConcentration,
  finTour,
  infligerDegats,
  portee,
  soigner,
  verifierFin,
  vitesse,
} from './moteur';
import { attaqueArmeSpirituelle, attaqueCaresse, attaqueLameDeFeu, ciblesPossibles, lancerSort, nombreCibles, porteeSort, preparerIncantation, SORTS_AU_CONTACT, SUIVI_ZONES, suiviZone, ZONES_SUPPLEMENTAIRES } from './sorts';

export type CoutCarte = 'action' | 'bonus' | 'reaction' | 'gratuit' | 'elan';
export type Ciblage = 'aucun' | 'ennemi' | 'allie' | 'creature' | 'point' | 'soi';

export interface Carte {
  id: string;
  nom: string;
  description: string;
  categorie: 'attaque' | 'sort' | 'aptitude' | 'base' | 'elan' | 'monstre';
  cout: CoutCarte;
  ciblage: Ciblage;
  nbCibles: number;
  portee?: number; // mètres
  zone?: { forme: string; taille: number };
  /** D'où se mesure la portée (par défaut, le lanceur) : le centre d'une zone qui dure. */
  origine?: Position;
  ressource?: string; // texte : « 2/3 rages », « emplacement niv. 1 »
  jouable: boolean;
  raison?: string;
  /** Ids des cibles valides en ce moment (pour l'interface et l'IA). */
  cibles: string[];
}

export type Commande =
  | { type: 'deplacer'; vers: Position }
  | { type: 'jouer'; carte: string; cibles?: string[]; point?: Position }
  | { type: 'finTour' };

export interface Contexte {
  sorts: Map<string, Sort>;
}

// ---------------------------------------------------------------------------
// Cartes d'élan
// ---------------------------------------------------------------------------

export const CARTES_ELAN: Record<string, { nom: string; description: string; ciblage: Ciblage }> = {
  'ouverture-tactique': { nom: 'Ouverture tactique', description: '+2 à votre prochain jet d\'attaque ce tour-ci.', ciblage: 'aucun' },
  'coup-appuye': { nom: 'Coup appuyé', description: '+1d4 dégâts à votre prochaine attaque d\'arme qui touche ce tour-ci.', ciblage: 'aucun' },
  'garde-haute': { nom: 'Garde haute', description: '+1 CA jusqu\'au début de votre prochain tour.', ciblage: 'aucun' },
  'pas-de-cote': { nom: 'Pas de côté', description: 'Vos déplacements ne provoquent pas d\'attaque d\'opportunité ce tour-ci.', ciblage: 'aucun' },
  'second-vent': { nom: 'Second vent', description: '+3 m de déplacement ce tour-ci.', ciblage: 'aucun' },
  coordination: { nom: 'Coordination', description: 'Un allié a l\'avantage à sa prochaine attaque.', ciblage: 'allie' },
  sursaut: { nom: 'Sursaut', description: 'Vous gagnez 1d6 + 2 PV temporaires.', ciblage: 'aucun' },
};

export const DECK_ELAN_MARTIAL = [
  'ouverture-tactique', 'ouverture-tactique', 'ouverture-tactique', 'coup-appuye', 'coup-appuye',
  'garde-haute', 'garde-haute', 'pas-de-cote', 'second-vent', 'coordination',
];
export const DECK_ELAN_LANCEUR = [
  'garde-haute', 'garde-haute', 'pas-de-cote', 'pas-de-cote', 'sursaut', 'sursaut',
  'coordination', 'coordination', 'second-vent', 'ouverture-tactique',
];

// ---------------------------------------------------------------------------
// Construction de la main
// ---------------------------------------------------------------------------

function peutAttaquer(c: Combattant): boolean {
  return c.tour.attaquesRestantes > 0 || c.tour.action;
}

const SORTS_CIBLES_REPETABLES = new Set(['sort:projectile-magique', 'sort:rayon-ardent', 'sort:decharge-occulte']);

function carte(partiel: Omit<Carte, 'jouable' | 'cibles' | 'nbCibles'> & Partial<Pick<Carte, 'jouable' | 'cibles' | 'nbCibles'>>): Carte {
  return { jouable: true, cibles: [], nbCibles: partiel.ciblage === 'aucun' || partiel.ciblage === 'soi' ? 0 : 1, ...partiel };
}

function ciblesAttaque(etat: EtatCombat, c: Combattant, metres: number): string[] {
  return adversairesCiblables(etat, c).filter((e) => aPortee(etat, c, e, metres)).map((e) => e.id);
}

function refuser(cartes: Carte, raison: string): Carte {
  return { ...cartes, jouable: false, raison };
}

export function cartesDisponibles(etat: EtatCombat, ctx: Contexte, id: string): Carte[] {
  const c = combattant(etat, id);
  const res: Carte[] = [];
  if (!peutAgir(c)) return res;
  const t = c.tour;
  const verifier = (k: Carte, cout: CoutCarte): Carte => {
    if (cout === 'action' && !t.action) return refuser(k, 'Action déjà utilisée.');
    if (cout === 'bonus' && !t.bonus) return refuser(k, 'Action bonus déjà utilisée.');
    if (k.ciblage !== 'aucun' && k.ciblage !== 'soi' && k.ciblage !== 'point' && !k.cibles.length) return refuser(k, 'Aucune cible à portée.');
    return k;
  };

  // Attaques d'arme (héros)
  for (const a of c.attaques) {
    const p = portee(a);
    let k = carte({
      id: `attaque:${a.id}`,
      nom: a.nom,
      description: `${a.mode === 'distance' ? 'Attaque à distance' : 'Attaque au corps à corps'} : +${a.bonusAttaque}, ${a.degats.map((d) => `${d.des}${d.bonus ? (d.bonus > 0 ? '+' : '') + d.bonus : ''} ${d.type}`).join(' + ')}${a.botte ? ` — botte : ${a.botte}` : ''}.`,
      categorie: 'attaque',
      cout: 'action',
      ciblage: 'ennemi',
      portee: p.longue,
      cibles: ciblesAttaque(etat, c, p.longue),
      ressource: t.attaquesRestantes > 0 ? `${t.attaquesRestantes} attaque(s) restante(s)` : undefined,
    });
    if (!peutAttaquer(c)) k = refuser(k, 'Action déjà utilisée.');
    else if (!k.cibles.length) k = refuser(k, 'Aucune cible à portée.');
    res.push(k);
  }

  // Actions de monstre
  for (const a of c.actionsMonstre) {
    const cout: CoutCarte = a.cout === 'bonus' ? 'bonus' : a.cout === 'reaction' ? 'reaction' : 'action';
    if (cout === 'reaction') continue;
    let cibles: string[] = [];
    let ciblage: Ciblage = 'ennemi';
    let porteeAction: number | undefined;
    let nbCibles = 1;
    if (a.multiattaque) {
      const sous = c.actionsMonstre.find((x) => x.id === a.multiattaque![0]!.action);
      porteeAction = sous?.portee?.type === 'distance' ? sous.portee.longue ?? sous.portee.normale : sous?.portee?.allonge ?? 1.5;
      nbCibles = a.multiattaque.reduce((s, m) => s + m.nombre, 0);
    } else if (a.resolution) {
      porteeAction = a.portee?.type === 'distance' ? a.portee.longue ?? a.portee.normale : a.portee?.allonge ?? 1.5;
    } else {
      ciblage = 'aucun';
    }
    if (porteeAction !== undefined) cibles = ciblesAttaque(etat, c, porteeAction);
    let k = carte({ id: `monstre:${a.id}`, nom: a.nom, description: a.resume, categorie: 'monstre', cout, ciblage, cibles, portee: porteeAction, nbCibles: ciblage === 'aucun' ? 0 : nbCibles });
    if (a.recharge && (c.ressources[`recharge:${a.id}`] ?? 1) <= 0) k = refuser(k, 'En recharge.');
    else if (a.utilisations && (c.ressources[`util:${a.id}`] ?? a.utilisations.nombre) <= 0) k = refuser(k, 'Plus d\'utilisation.');
    else k = verifier(k, cout);
    res.push(k);
  }

  // Sorts
  for (const sid of c.sorts) {
    const sort = ctx.sorts.get(sid);
    if (!sort || sort.tempsIncantation === 'reaction') continue;
    const cout: CoutCarte = sort.tempsIncantation === 'bonus' ? 'bonus' : 'action';
    const zone = sort.zone ? { forme: sort.zone.forme, taille: sort.zone.taille } : ZONES_SUPPLEMENTAIRES[sid];
    const ciblage: Ciblage = zone ? 'point' : sort.portee.type === 'personnel' && !SORTS_AU_CONTACT.has(sid) ? 'soi' : sort.resolution || sort.special === 'marque-du-chasseur' || sort.degats.length ? 'ennemi' : 'allie';
    const niveau = sort.niveau === 0 ? 0 : emplacementDisponible(c, sort.niveau);
    let k = carte({
      id: `sort:${sid}`,
      nom: sort.nom,
      description: sort.resume,
      categorie: 'sort',
      cout,
      ciblage,
      portee: porteeSort(sort),
      zone,
      nbCibles: ciblage === 'point' || ciblage === 'soi' ? 0 : sort.special === 'projectile-magique' || sort.special === 'rayon-ardent' ? 3 : nombreCibles(sort, niveau ?? sort.niveau),
      cibles: ciblage === 'point' || ciblage === 'soi' ? [] : ciblesPossibles(etat, c, sort).map((x) => x.id),
      ressource: sort.niveau === 0 ? 'sort mineur' : `emplacement niv. ${sort.niveau}+ (${c.incantation?.emplacements.slice(sort.niveau - 1).reduce((s, n) => s + n, 0) ?? 0} restant(s))`,
    });
    if (sort.niveau > 0 && !niveau) k = refuser(k, 'Plus d\'emplacement.');
    else if (sort.niveau > 0 && t.sortEmplacementLance) k = refuser(k, 'Un seul sort à emplacement par tour.');
    else if (c.rage) k = refuser(k, 'Impossible en rage.');
    else k = verifier(k, cout);
    res.push(k);
  }
  // Effets qui durent : déplacer une zone, faire tomber la foudre, frapper de nouveau avec la lame ou la caresse.
  for (const z of etat.zones ?? []) {
    const def = SUIVI_ZONES[z.sort];
    if (!def || z.lanceur !== c.id || c.concentration?.sort !== z.sort) continue;
    const k = carte({ id: `aptitude:zone-${z.sort}`, nom: def.nom, description: def.description, categorie: 'aptitude', cout: def.cout, ciblage: 'point', nbCibles: 0, portee: def.cases * 1.5, origine: z.centre, zone: def.zone });
    res.push(def.cout === 'gratuit' ? k : verifier(k, def.cout));
  }
  if (c.ressources.lameDeFeu && c.concentration?.sort === 'lame-de-feu') {
    res.push(verifier(carte({ id: 'aptitude:lame-de-feu', nom: 'Lame de feu', description: 'Attaque de sort au corps à corps avec la lame ardente : 3d6 dégâts de feu.', categorie: 'aptitude', cout: 'action', ciblage: 'ennemi', portee: 1.5, cibles: ciblesAttaque(etat, c, 1.5) }), 'action'));
  }
  if (c.ressources.caresse && c.concentration?.sort === 'caresse-du-vampire') {
    res.push(verifier(carte({ id: 'aptitude:caresse-du-vampire', nom: 'Caresse du vampire', description: 'Attaque de sort au corps à corps : 3d6 nécrotiques, vous récupérez la moitié en PV.', categorie: 'aptitude', cout: 'action', ciblage: 'ennemi', portee: 1.5, cibles: ciblesAttaque(etat, c, 1.5) }), 'action'));
  }
  if (c.ressources.armeSpirituelle && c.concentration?.sort === 'arme-spirituelle') {
    res.push(verifier(carte({ id: 'aptitude:arme-spirituelle', nom: 'Arme spirituelle', description: 'L\'arme spectrale frappe une cible à 18 m.', categorie: 'aptitude', cout: 'bonus', ciblage: 'ennemi', portee: 18, cibles: ciblesAttaque(etat, c, 18) }), 'bonus'));
  }

  // Aptitudes de classe
  const r = c.ressources;
  if (aTrait(c, 'rage') && !c.rage) {
    res.push(verifier(carte({ id: 'aptitude:rage', nom: 'Rage', description: '+dégâts au corps à corps (For), résistance aux dégâts physiques.', categorie: 'aptitude', cout: 'bonus', ciblage: 'soi', ressource: `${r.rages ?? 0} rage(s)` }), 'bonus'));
    if (!r.rages) res[res.length - 1] = refuser(res[res.length - 1]!, 'Plus de rage.');
  }
  if (aTrait(c, 'temerite') && !t.temeraire) {
    res.push(carte({ id: 'aptitude:temerite', nom: 'Témérité', description: 'Avantage à vos attaques de corps à corps (For) ce tour-ci ; les attaques contre vous ont l\'avantage jusqu\'à votre prochain tour.', categorie: 'aptitude', cout: 'gratuit', ciblage: 'soi', jouable: peutAttaquer(c) }));
  }
  if (aTrait(c, 'second-souffle')) {
    const k = carte({ id: 'aptitude:second-souffle', nom: 'Second souffle', description: `Récupérez 1d10 + ${c.niveau} PV.`, categorie: 'aptitude', cout: 'bonus', ciblage: 'soi', ressource: `${r.secondSouffle ?? 0} utilisation(s)` });
    res.push(r.secondSouffle ? verifier(k, 'bonus') : refuser(k, 'Plus d\'utilisation.'));
  }
  if (aTrait(c, 'fougue')) {
    const k = carte({ id: 'aptitude:fougue', nom: 'Fougue', description: 'Gagnez une action supplémentaire ce tour-ci.', categorie: 'aptitude', cout: 'gratuit', ciblage: 'soi', ressource: `${r.fougue ?? 0} utilisation(s)` });
    res.push(r.fougue && !t.action ? k : refuser(k, r.fougue ? 'Utilisez d\'abord votre action.' : 'Plus d\'utilisation.'));
  }
  if (aTrait(c, 'ruse')) {
    res.push(verifier(carte({ id: 'aptitude:ruse-foncer', nom: 'Ruse : foncer', description: 'Foncer en action bonus.', categorie: 'aptitude', cout: 'bonus', ciblage: 'soi' }), 'bonus'));
    res.push(verifier(carte({ id: 'aptitude:ruse-desengager', nom: 'Ruse : se désengager', description: 'Se désengager en action bonus.', categorie: 'aptitude', cout: 'bonus', ciblage: 'soi' }), 'bonus'));
  }
  if (aTrait(c, 'visee-appliquee')) {
    const k = carte({ id: 'aptitude:visee-appliquee', nom: 'Visée appliquée', description: 'Si vous n\'avez pas bougé : avantage à votre prochaine attaque, mais Vitesse 0 ce tour-ci.', categorie: 'aptitude', cout: 'bonus', ciblage: 'soi' });
    res.push(t.aBouge ? refuser(k, 'Vous avez déjà bougé.') : verifier(k, 'bonus'));
  }
  if (aTrait(c, 'inspiration-bardique')) {
    const faces = r.deInspiration ?? 6;
    const cibles = allies(etat, c)
      .filter((x) => distanceMetres(x.position, c.position) <= 18 && !x.modificateurs.some((m) => m.type === 'de_inspiration'))
      .map((x) => x.id);
    const k = carte({ id: 'aptitude:inspiration-bardique', nom: 'Inspiration bardique', description: `Un allié à 18 m reçoit un d${faces} : une fois, il l'ajoute à un jet d'attaque ou de sauvegarde raté, ce qui peut le transformer en réussite.`, categorie: 'aptitude', cout: 'bonus', ciblage: 'allie', portee: 18, cibles, ressource: `${r.inspiration ?? 0} utilisation(s)` });
    res.push(r.inspiration ? verifier(k, 'bonus') : refuser(k, "Plus d'inspiration."));
  }
  if (aTrait(c, 'chatiment-de-paladin')) {
    // Châtiment divin : action Bonus juste après avoir touché au corps à corps ; 2d8 radiants (+1d8 par niveau d'emplacement
    // au-dessus du 1er, +1d8 contre un Fiélon ou un Mort-vivant). Un lancer par repos long sans emplacement.
    const coup = t.dernierCoup;
    const cible = coup?.corpsACorps ? etat.combattants.find((x) => x.id === coup.cible && !horsCombat(x)) : undefined;
    const emplacement = emplacementDisponible(c, 1);
    const k = carte({
      id: 'aptitude:chatiment-divin',
      nom: 'Châtiment divin',
      description: "Juste après avoir touché au corps à corps : 2d8 dégâts radiants en plus (+1d8 par niveau d'emplacement au-dessus du 1er ; +1d8 contre un Fiélon ou un Mort-vivant).",
      categorie: 'aptitude',
      cout: 'bonus',
      ciblage: 'ennemi',
      portee: 1.5,
      cibles: cible ? [cible.id] : [],
      ressource: `${r.chatimentGratuit ? '1 gratuit' : 'sans lancer gratuit'} · ${c.incantation?.emplacements.reduce((s, n) => s + n, 0) ?? 0} emplacement(s)`,
    });
    if (!cible) res.push(refuser(k, 'Il faut avoir touché au corps à corps ce tour-ci.'));
    else if (!r.chatimentGratuit && !emplacement) res.push(refuser(k, "Plus de lancer gratuit ni d'emplacement."));
    else if (!r.chatimentGratuit && t.sortEmplacementLance) res.push(refuser(k, 'Un seul sort à emplacement par tour.'));
    else res.push(verifier(k, 'bonus'));
  }
  // Moine : Arts martiaux (Frappe bonus), Credo (Déluge de coups, Patience défensive, Porté par le vent), Frappe étourdissante.
  const mainsNues = c.attaques.find((a) => a.id === 'arts-martiaux');
  if (aTrait(c, 'arts-martiaux') && mainsNues) {
    const k = carte({ id: 'aptitude:frappe-bonus', nom: 'Frappe bonus', description: "Après l'action Attaque : une attaque à mains nues (Arts martiaux) en action Bonus.", categorie: 'aptitude', cout: 'bonus', ciblage: 'ennemi', portee: 1.5, cibles: ciblesAttaque(etat, c, 1.5) });
    res.push(t.attaqueEntreprise ? verifier(k, 'bonus') : refuser(k, "Il faut d'abord entreprendre l'action Attaque."));
  }
  if (aTrait(c, 'credo-du-moine')) {
    const credo = `${r.credo ?? 0}/${r.credoMax ?? 0} point(s) de Credo`;
    const avecCredo = (k: Carte): Carte => (r.credo ? verifier(k, 'bonus') : refuser(k, 'Plus de point de Credo.'));
    if (mainsNues) {
      res.push(avecCredo(carte({ id: 'aptitude:deluge-de-coups', nom: 'Déluge de coups', description: '1 point de Credo : deux attaques à mains nues en action Bonus (sur une ou deux cibles).', categorie: 'aptitude', cout: 'bonus', ciblage: 'ennemi', portee: 1.5, nbCibles: 2, cibles: ciblesAttaque(etat, c, 1.5), ressource: credo })));
    }
    res.push(verifier(carte({ id: 'aptitude:patience-defensive', nom: 'Patience défensive', description: 'Se désengager en action Bonus.', categorie: 'aptitude', cout: 'bonus', ciblage: 'soi' }), 'bonus'));
    res.push(avecCredo(carte({ id: 'aptitude:patience-defensive-credo', nom: 'Patience défensive (Credo)', description: '1 point de Credo : se désengager et esquiver, en action Bonus.', categorie: 'aptitude', cout: 'bonus', ciblage: 'soi', ressource: credo })));
    res.push(verifier(carte({ id: 'aptitude:porte-par-le-vent', nom: 'Porté par le vent', description: 'Foncer en action Bonus.', categorie: 'aptitude', cout: 'bonus', ciblage: 'soi' }), 'bonus'));
    res.push(avecCredo(carte({ id: 'aptitude:porte-par-le-vent-credo', nom: 'Porté par le vent (Credo)', description: '1 point de Credo : se désengager et foncer, en action Bonus.', categorie: 'aptitude', cout: 'bonus', ciblage: 'soi', ressource: credo })));
  }
  if (aTrait(c, 'frappe-etourdissante')) {
    const coup = t.dernierCoup;
    const cible = coup?.corpsACorps ? etat.combattants.find((x) => x.id === coup.cible && !horsCombat(x)) : undefined;
    const k = carte({
      id: 'aptitude:frappe-etourdissante',
      nom: 'Frappe étourdissante',
      description: `Après avoir touché : 1 point de Credo. Sauvegarde de Constitution (DD ${8 + c.mods.sag + c.bonusMaitrise}) : raté, Étourdi jusqu'au début de votre prochain tour ; réussi, Vitesse réduite de moitié et prochaine attaque contre lui avec Avantage.`,
      categorie: 'aptitude',
      cout: 'gratuit',
      ciblage: 'ennemi',
      portee: 1.5,
      cibles: cible ? [cible.id] : [],
      ressource: `${r.credo ?? 0}/${r.credoMax ?? 0} point(s) de Credo`,
    });
    if (t.etourdissanteUtilisee) res.push(refuser(k, 'Une fois par tour.'));
    else if (!cible) res.push(refuser(k, 'Il faut avoir touché au corps à corps ce tour-ci.'));
    else res.push(r.credo ? k : refuser(k, 'Plus de point de Credo.'));
  }
  if (aTrait(c, 'survivance')) {
    const k = carte({ id: 'aptitude:preservation', nom: 'Préservation de la vie', description: `Répartissez ${5 * c.niveau} PV entre les alliés à 9 m (jusqu'à la moitié de leurs PV max).`, categorie: 'aptitude', cout: 'action', ciblage: 'soi', ressource: `${r.conduit ?? 0} conduit(s) divin(s)` });
    res.push(r.conduit ? verifier(k, 'action') : refuser(k, 'Plus de conduit divin.'));
  }

  // Actions de base
  res.push(verifier(carte({ id: 'base:foncer', nom: 'Foncer', description: 'Déplacement supplémentaire égal à votre Vitesse.', categorie: 'base', cout: 'action', ciblage: 'soi' }), 'action'));
  res.push(verifier(carte({ id: 'base:desengager', nom: 'Se désengager', description: 'Pas d\'attaque d\'opportunité ce tour-ci.', categorie: 'base', cout: 'action', ciblage: 'soi' }), 'action'));
  res.push(verifier(carte({ id: 'base:esquiver', nom: 'Esquiver', description: 'Les attaques contre vous ont le désavantage ; avantage aux sauvegardes de Dex.', categorie: 'base', cout: 'action', ciblage: 'soi' }), 'action'));
  if ((r.potions ?? 0) > 0) {
    // Boire une potion ou l'administrer à un allié au contact : une action Bonus (SRD 5.2.1, potion de guérison).
    const cout: CoutCarte = 'bonus';
    const cibles = [c, ...allies(etat, c)].filter((x) => distanceMetres(x.position, c.position) <= 1.5 && x.pv < x.pvMax).map((x) => x.id);
    res.push(verifier(carte({ id: 'base:potion', nom: 'Potion de soins', description: 'Rend 2d4 + 2 PV à vous ou à un allié au contact.', categorie: 'base', cout, ciblage: 'allie', cibles, ressource: `${r.potions} potion(s)` }), cout));
  }
  const prise = c.etats.find((e) => (e.etat === 'empoigne' || e.etat === 'entrave') && e.evasion);
  if (prise) {
    res.push(verifier(carte({ id: 'base:echapper', nom: 'S\'échapper', description: `Test d'Athlétisme ou d'Acrobaties DD ${prise.evasion} pour vous libérer.`, categorie: 'base', cout: 'action', ciblage: 'soi' }), 'action'));
  }

  // Cartes d'élan
  if (etat.options.elan && c.elan) {
    for (const [i, eid] of c.elan.main.entries()) {
      const def = CARTES_ELAN[eid]!;
      const cibles = def.ciblage === 'allie' ? allies(etat, c).map((x) => x.id) : [];
      let k = carte({ id: `elan:${i}:${eid}`, nom: def.nom, description: def.description, categorie: 'elan', cout: 'elan', ciblage: def.ciblage, cibles });
      if (t.elanJoue) k = refuser(k, 'Une seule carte d\'élan par tour.');
      else if (def.ciblage === 'allie' && !cibles.length) k = refuser(k, 'Aucun allié.');
      res.push(k);
    }
  }
  return res;
}

// ---------------------------------------------------------------------------
// Exécution
// ---------------------------------------------------------------------------

export type Resultat = { ok: true } | { ok: false; erreur: string };

function depenser(c: Combattant, cout: CoutCarte): void {
  if (cout === 'action') c.tour.action = false;
  if (cout === 'bonus') c.tour.bonus = false;
  if (cout === 'elan') c.tour.elanJoue = true;
}

/** Joue une commande du combattant actif. Le combat s'arrête dès que le dernier adversaire tombe, sans attendre la fin du tour. */
export function executer(etat: EtatCombat, ctx: Contexte, cmd: Commande): Resultat {
  const r = executerCommande(etat, ctx, cmd);
  if (r.ok) verifierFin(etat);
  return r;
}

function executerCommande(etat: EtatCombat, ctx: Contexte, cmd: Commande): Resultat {
  if (etat.vainqueur) return { ok: false, erreur: 'Le combat est terminé.' };
  const c = actif(etat);
  if (cmd.type === 'finTour') {
    finTour(etat);
    return { ok: true };
  }
  if (cmd.type === 'deplacer') {
    if (!peutAgir(c)) return { ok: false, erreur: `${c.nom} ne peut pas agir.` };
    return deplacer(etat, c, cmd.vers) ? { ok: true } : { ok: false, erreur: 'Case hors d\'atteinte.' };
  }
  const k = cartesDisponibles(etat, ctx, c.id).find((x) => x.id === cmd.carte);
  if (!k) return { ok: false, erreur: `Carte inconnue : ${cmd.carte}.` };
  if (!k.jouable) return { ok: false, erreur: k.raison ?? 'Carte injouable.' };
  const ids = cmd.cibles ?? [];
  if (k.nbCibles > 0 && (!ids.length || ids.length > k.nbCibles || ids.some((x) => !k.cibles.includes(x)))) {
    return { ok: false, erreur: 'Cible invalide.' };
  }
  if (k.ciblage === 'point' && !cmd.point) return { ok: false, erreur: 'Choisissez un point.' };
  if (k.ciblage === 'point' && cmd.point && k.portee && distanceMetres(k.origine ?? c.position, cmd.point) > Math.max(k.portee, 1.5)) {
    return { ok: false, erreur: 'Point hors de portée.' };
  }
  // Seuls les projectiles et les rayons peuvent viser plusieurs fois la même créature.
  if (cmd.carte.startsWith('sort:') && !SORTS_CIBLES_REPETABLES.has(cmd.carte) && new Set(ids).size < ids.length) {
    return { ok: false, erreur: 'Une même créature ne peut pas être visée deux fois.' };
  }
  const cibles = ids.map((x) => combattant(etat, x));
  const [famille, sid] = cmd.carte.split(':') as [string, string];

  switch (famille) {
    case 'attaque': {
      const arme = c.attaques.find((a) => a.id === sid)!;
      if (c.tour.attaquesRestantes <= 0) {
        c.tour.action = false;
        c.tour.attaquesRestantes = c.ressources.attaquesParAction ?? 1;
      }
      c.tour.attaquesRestantes -= 1;
      c.tour.attaqueEntreprise = true;
      attaqueArme(etat, c, cibles[0]!, arme);
      break;
    }
    case 'monstre': {
      const action = c.actionsMonstre.find((a) => a.id === sid)!;
      depenser(c, k.cout);
      if (action.recharge) c.ressources[`recharge:${action.id}`] = 0;
      if (action.utilisations) c.ressources[`util:${action.id}`] = (c.ressources[`util:${action.id}`] ?? action.utilisations.nombre) - 1;
      if (action.multiattaque) {
        let i = 0;
        for (const m of action.multiattaque) {
          for (let n = 0; n < m.nombre; n++) {
            const cible = cibles[Math.min(i++, cibles.length - 1)]!;
            if (cible.mort || cible.pv <= 0) continue;
            attaqueMonstre(etat, c, cible, m.action);
          }
        }
      } else if (action.resolution) attaqueMonstre(etat, c, cibles[0]!, action.id);
      else if (action.id === 'fuite-agile') {
        c.tour.desengage = true;
        journaliser(etat, { type: 'info', texte: `${c.nom} se désengage.`, acteur: c.id });
      }
      break;
    }
    case 'sort': {
      const sort = ctx.sorts.get(sid)!;
      const niveau = preparerIncantation(c, sort);
      if (typeof niveau === 'string') return { ok: false, erreur: niveau };
      depenser(c, k.cout);
      if (niveau > 0) c.tour.sortEmplacementLance = true;
      lancerSort(etat, c, sort, niveau, { cibles, point: cmd.point });
      break;
    }
    case 'aptitude':
      depenser(c, k.cout);
      if (sid.startsWith('zone-')) {
        if (!suiviZone(etat, c, sid.slice(5), cmd.point!)) return { ok: false, erreur: 'Point invalide.' };
      } else executerAptitude(etat, ctx, c, sid, cibles);
      break;
    case 'base':
      depenser(c, k.cout);
      executerBase(etat, c, sid, cibles);
      break;
    case 'elan': {
      const [, index, eid] = cmd.carte.split(':') as [string, string, string];
      depenser(c, 'elan');
      c.elan!.main.splice(Number(index), 1);
      c.elan!.defausse.push(eid);
      executerElan(etat, c, eid, cibles);
      break;
    }
    default:
      return { ok: false, erreur: `Carte inconnue : ${cmd.carte}.` };
  }
  return { ok: true };
}

function executerAptitude(etat: EtatCombat, ctx: Contexte, c: Combattant, id: string, cibles: Combattant[]): void {
  const r = c.ressources;
  switch (id) {
    case 'rage':
      r.rages! -= 1;
      c.rage = true;
      finConcentration(etat, c);
      journaliser(etat, { type: 'info', texte: `${c.nom} entre en rage !`, acteur: c.id });
      break;
    case 'temerite':
      c.tour.temeraire = true;
      journaliser(etat, { type: 'info', texte: `${c.nom} attaque avec témérité.`, acteur: c.id });
      break;
    case 'second-souffle':
      r.secondSouffle! -= 1;
      soigner(etat, c, lancerDes(etat, '1d10') + c.niveau, c);
      break;
    case 'fougue':
      r.fougue! -= 1;
      c.tour.action = true;
      c.tour.attaquesRestantes = 0;
      journaliser(etat, { type: 'info', texte: `${c.nom} puise dans sa fougue : action supplémentaire !`, acteur: c.id });
      break;
    case 'ruse-foncer':
      c.tour.mouvement += vitesse(c);
      break;
    case 'ruse-desengager':
      c.tour.desengage = true;
      break;
    case 'visee-appliquee':
      c.modificateurs.push({ id: 'visee-appliquee', type: 'avantage_attaque', source: c.id, usageUnique: true, expire: { moment: 'fin_tour', de: c.id } });
      c.tour.mouvement = 0;
      break;
    case 'preservation': {
      r.conduit! -= 1;
      let reserve = 5 * c.niveau;
      const blesses = [c, ...allies(etat, c)]
        .filter((x) => distanceMetres(x.position, c.position) <= 9 && x.pv < x.pvMax / 2)
        .sort((a, b) => a.pv / a.pvMax - b.pv / b.pvMax);
      for (const x of blesses) {
        const don = Math.min(reserve, Math.floor(x.pvMax / 2) - x.pv);
        if (don > 0) {
          soigner(etat, x, don, c);
          reserve -= don;
        }
      }
      break;
    }
    case 'inspiration-bardique': {
      r.inspiration! -= 1;
      const faces = r.deInspiration ?? 6;
      const allie = cibles[0]!;
      allie.modificateurs.push({ id: 'inspiration-bardique', type: 'de_inspiration', de: `1d${faces}`, source: c.id });
      journaliser(etat, { type: 'info', texte: `${c.nom} inspire ${allie.nom} (dé d'Inspiration bardique : d${faces}).`, acteur: c.id, cible: allie.id });
      break;
    }
    case 'chatiment-divin': {
      const coup = c.tour.dernierCoup!;
      const cible = cibles[0]!;
      let niveau = 1;
      if (r.chatimentGratuit) r.chatimentGratuit -= 1;
      else {
        niveau = emplacementDisponible(c, 1)!;
        c.incantation!.emplacements[niveau - 1]! -= 1;
        c.tour.sortEmplacementLance = true;
      }
      c.tour.sortBonusLance = true;
      const impie = /Fiélon|Mort-vivant/i.test(cible.type);
      const nbDes = 2 + (niveau - 1) + (impie ? 1 : 0);
      const montant = lancerDes(etat, `${nbDes}d8`, coup.critique ? 2 : 1);
      journaliser(etat, { type: 'sort', texte: `${c.nom} lance Châtiment divin${niveau > 1 ? ` (emplacement du niveau ${niveau})` : ''} sur ${cible.nom} : ${nbDes}d8 dégâts radiants.`, acteur: c.id, cible: cible.id, details: { sort: 'chatiment-divin' } });
      infligerDegats(etat, cible, [{ montant, type: 'radiant' }], c, coup.critique);
      break;
    }
    case 'frappe-bonus': {
      const arme = c.attaques.find((a) => a.id === 'arts-martiaux')!;
      attaqueArme(etat, c, cibles[0]!, arme);
      break;
    }
    case 'deluge-de-coups': {
      r.credo! -= 1;
      const arme = c.attaques.find((a) => a.id === 'arts-martiaux')!;
      journaliser(etat, { type: 'info', texte: `${c.nom} déchaîne un Déluge de coups.`, acteur: c.id });
      for (let i = 0; i < 2; i++) {
        const cible = cibles[Math.min(i, cibles.length - 1)]!;
        if (cible.mort || cible.pv <= 0) continue;
        attaqueArme(etat, c, cible, arme);
      }
      break;
    }
    case 'patience-defensive':
      c.tour.desengage = true;
      journaliser(etat, { type: 'info', texte: `${c.nom} se désengage (Patience défensive).`, acteur: c.id });
      break;
    case 'patience-defensive-credo':
      r.credo! -= 1;
      c.tour.desengage = true;
      c.tour.esquive = true;
      journaliser(etat, { type: 'info', texte: `${c.nom} se désengage et esquive (Patience défensive, 1 point de Credo).`, acteur: c.id });
      break;
    case 'porte-par-le-vent':
      c.tour.mouvement += vitesse(c);
      journaliser(etat, { type: 'info', texte: `${c.nom} fonce, porté par le vent.`, acteur: c.id });
      break;
    case 'porte-par-le-vent-credo':
      r.credo! -= 1;
      c.tour.desengage = true;
      c.tour.mouvement += vitesse(c);
      journaliser(etat, { type: 'info', texte: `${c.nom} se désengage et fonce, porté par le vent (1 point de Credo).`, acteur: c.id });
      break;
    case 'frappe-etourdissante': {
      r.credo! -= 1;
      c.tour.etourdissanteUtilisee = true;
      const cible = cibles[0]!;
      const dd = 8 + c.mods.sag + c.bonusMaitrise;
      if (!sauvegarde(etat, cible, 'con', dd)) {
        journaliser(etat, { type: 'info', texte: `${cible.nom} rate sa sauvegarde de Constitution (DD ${dd}) contre la Frappe étourdissante de ${c.nom}.`, acteur: c.id, cible: cible.id });
        ajouterEtat(etat, cible, { etat: 'etourdi', source: c.id, jusquAuDebutDe: c.id });
      } else {
        const fin = { moment: 'debut_tour' as const, de: c.id };
        cible.modificateurs.push({ id: 'frappe-etourdissante-vitesse', type: 'vitesse', valeur: -Math.floor(vitesse(cible) / 2), source: c.id, expire: fin });
        cible.modificateurs.push({ id: 'frappe-etourdissante-avantage', type: 'avantage_contre', source: c.id, usageUnique: true, expire: fin });
        journaliser(etat, { type: 'info', texte: `${cible.nom} réussit sa sauvegarde (DD ${dd}) : Vitesse réduite de moitié, la prochaine attaque contre lui a l'Avantage.`, acteur: c.id, cible: cible.id });
      }
      break;
    }
    case 'arme-spirituelle':
      attaqueArmeSpirituelle(etat, c, ctx.sorts.get('arme-spirituelle')!, cibles[0]);
      break;
    case 'lame-de-feu':
      attaqueLameDeFeu(etat, c, ctx.sorts.get('lame-de-feu')!, cibles[0]);
      break;
    case 'caresse-du-vampire':
      attaqueCaresse(etat, c, ctx.sorts.get('caresse-du-vampire')!, cibles[0]);
      break;
  }
}

function executerBase(etat: EtatCombat, c: Combattant, id: string, cibles: Combattant[]): void {
  switch (id) {
    case 'foncer':
      c.tour.mouvement += vitesse(c);
      journaliser(etat, { type: 'info', texte: `${c.nom} fonce.`, acteur: c.id });
      break;
    case 'desengager':
      c.tour.desengage = true;
      journaliser(etat, { type: 'info', texte: `${c.nom} se désengage.`, acteur: c.id });
      break;
    case 'esquiver':
      c.tour.esquive = true;
      journaliser(etat, { type: 'info', texte: `${c.nom} se met en garde (Esquiver).`, acteur: c.id });
      break;
    case 'potion': {
      c.ressources.potions! -= 1;
      const cible = cibles[0] ?? c;
      journaliser(etat, { type: 'soins', texte: cible === c ? `${c.nom} boit une potion de soins.` : `${c.nom} fait boire une potion de soins à ${cible.nom}.`, acteur: c.id, cible: cible.id });
      soigner(etat, cible, lancerDes(etat, '2d4') + 2, c);
      break;
    }
    case 'echapper': {
      const prise = c.etats.find((e) => (e.etat === 'empoigne' || e.etat === 'entrave') && e.evasion)!;
      // Test d'Athlétisme (Force) ou d'Acrobaties (Dextérité) : la maîtrise ne compte que si on l'a.
      const bonus = Math.max(c.competences?.athletisme ?? c.mods.for, c.competences?.acrobaties ?? c.mods.dex);
      const total = lancerDes(etat, '1d20') + bonus;
      const libere = total >= prise.evasion!;
      if (libere) c.etats = c.etats.filter((e) => e !== prise);
      journaliser(etat, { type: 'info', texte: `${c.nom} tente de s'échapper : ${total}, ${libere ? 'libéré' : 'échec'}.`, acteur: c.id });
      break;
    }
  }
}

function executerElan(etat: EtatCombat, c: Combattant, id: string, cibles: Combattant[]): void {
  const fin = { moment: 'fin_tour' as const, de: c.id };
  switch (id) {
    case 'ouverture-tactique':
      c.modificateurs.push({ id, type: 'bonus_attaque', valeur: 2, source: c.id, usageUnique: true, expire: fin });
      break;
    case 'coup-appuye':
      c.modificateurs.push({ id, type: 'de_degats', de: '1d4', source: c.id, usageUnique: true, expire: fin });
      break;
    case 'garde-haute':
      c.modificateurs.push({ id, type: 'bonus_ca', valeur: 1, source: c.id, expire: { moment: 'debut_tour', de: c.id } });
      break;
    case 'pas-de-cote':
      c.tour.desengage = true;
      break;
    case 'second-vent':
      c.tour.mouvement += 3;
      break;
    case 'coordination': {
      const a = cibles[0];
      if (a) a.modificateurs.push({ id, type: 'avantage_attaque', source: c.id, usageUnique: true, expire: { moment: 'fin_tour', de: a.id } });
      break;
    }
    case 'sursaut':
      c.pvTemp = Math.max(c.pvTemp, lancerDes(etat, '1d6') + 2);
      break;
  }
  journaliser(etat, { type: 'info', texte: `${c.nom} joue ${CARTES_ELAN[id]!.nom}.`, acteur: c.id });
}

export { ennemis, peutAgir };
