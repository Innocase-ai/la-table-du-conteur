// Lancer un sort : résolution générique d'après les données (attaque, sauvegarde, soins)
// et gestionnaires dédiés pour les sorts marqués `special`.
import type { Sort } from '../schemas';
import { aEtat, ennemis, journaliser, lancerDes, peutAgir, type Combattant, type EtatCombat, type ZonePersistante } from './etat';
import { casesZone, cle, distanceCases, distanceMetres, ligneDeVue, typeCase, type Position } from './grille';
import { ajouterEtat, couvertSauvegarde, detailsJet, finConcentration, infligerDegats, jetAttaque, occupation, retirerEtat, sauvegarde, soigner, emplacementDisponible, vitesse, declencherZone, dansZone } from './moteur';
import { franchissable, TAILLE_CASE } from './grille';

/** Sorts que le moteur de combat sait jouer fidèlement (les autres figurent sur la fiche, marqués « non jouable en combat »). */
export const SORTS_JOUABLES_EN_COMBAT: ReadonlySet<string> = new Set([
  'trait-de-feu', 'rayon-de-givre', 'poigne-electrique', 'flamme-sacree', 'aspersion-acide', 'bouffee-de-poison', 'contact-glacial',
  'projectile-magique', 'bouclier', 'mains-brulantes', 'sommeil', 'soins', 'mot-de-guerison', 'benediction', 'fleau', 'eclair-tracant',
  'bouclier-de-la-foi', 'marque-du-chasseur', 'blessure', 'vague-tonnante',
  'rayon-ardent', 'arme-spirituelle', 'aide', 'immobilisation-de-personne', 'restauration-partielle',
  // Sorts de dégâts jusqu'au niveau 3 (08/11/2026)
  'boule-de-feu', 'eclair', 'fracassement', 'epine-mentale', 'poussiere-d-etoile', 'rayon-empoisonne', 'moquerie-cruelle', 'murmures-dissonants',
  'decharge-occulte', 'couteau-de-glace', 'fleche-acide',
  // Effets qui durent (zones et attaques répétées)
  'sphere-de-feu', 'rayon-de-lune', 'appel-de-la-foudre', 'invocation-d-animaux', 'lame-de-feu', 'caresse-du-vampire',
]);

/** Sorts qui se visent sur un point alors que leurs données n'ont pas de zone (la zone posée dure ensuite). */
export const ZONES_SUPPLEMENTAIRES: Record<string, { forme: string; taille: number }> = {
  'sphere-de-feu': { forme: 'sphere', taille: 1.5 },
  'invocation-d-animaux': { forme: 'sphere', taille: 3 },
};

/** Sorts de portée « personnel » qui visent pourtant une créature à portée d'allonge. */
export const SORTS_AU_CONTACT: ReadonlySet<string> = new Set(['caresse-du-vampire']);

/** Ce que le lanceur peut faire d'une zone qui dure, à ses tours (carte `aptitude:zone-<sort>`). */
export const SUIVI_ZONES: Record<
  string,
  { nom: string; description: string; cout: 'action' | 'bonus' | 'gratuit'; cases: number; effet: 'deplacer' | 'frapper'; zone: { forme: string; taille: number } }
> = {
  'sphere-de-feu': {
    nom: 'Faire rouler la sphère',
    description: "Déplace la sphère de 9 m ; elle s'arrête sur la première créature qu'elle rencontre, qui fait le jet.",
    cout: 'bonus',
    cases: 6,
    effet: 'deplacer',
    zone: { forme: 'sphere', taille: 1.5 },
  },
  'rayon-de-lune': {
    nom: 'Déplacer le rayon',
    description: "Déplace le rayon de 18 m ; les créatures qu'il rejoint font le jet.",
    cout: 'action',
    cases: 12,
    effet: 'deplacer',
    zone: { forme: 'cylindre', taille: 1.5 },
  },
  'invocation-d-animaux': {
    nom: 'Déplacer la meute',
    description: "Déplace la meute de 9 m ; les créatures qu'elle approche à moins de 3 m font le jet.",
    cout: 'gratuit',
    cases: 6,
    effet: 'deplacer',
    zone: { forme: 'sphere', taille: 3 },
  },
  'appel-de-la-foudre': {
    nom: 'Faire tomber la foudre',
    description: 'Un éclair frappe un point sous le nuage (18 m de rayon).',
    cout: 'action',
    cases: 12,
    effet: 'frapper',
    zone: { forme: 'sphere', taille: 1.5 },
  },
};

export interface CibleSort {
  cibles?: Combattant[];
  point?: Position;
}

/** Nombre de dés d'un sort mineur selon le niveau du lanceur (niveaux 5, 11, 17). */
function desSortMineur(sort: Sort, lanceur: Combattant, des: string): string {
  if (sort.niveau !== 0 || !sort.evolutionSortMineur) return des;
  const n = lanceur.niveau >= 17 ? sort.evolutionSortMineur[2] : lanceur.niveau >= 11 ? sort.evolutionSortMineur[1] : lanceur.niveau >= 5 ? sort.evolutionSortMineur[0] : 1;
  const m = /^(\d+)d(\d+)$/.exec(des);
  return m ? `${Number(m[1]) * n}d${m[2]}` : des;
}

/** Dés d'un sort lancé à un niveau supérieur (« 1d6 » par niveau au-dessus). */
function desAmeliores(sort: Sort, des: string, niveauEmplacement: number): string {
  const sup = niveauEmplacement - sort.niveau;
  const am = sort.ameliorationParNiveau && /^(\d+)d(\d+)$/.exec(sort.ameliorationParNiveau);
  const base = /^(\d+)d(\d+)$/.exec(des);
  if (sup <= 0 || !am || !base || am[2] !== base[2]) return des;
  return `${Number(base[1]) + sup * Number(am[1])}d${base[2]}`;
}

/** Nombre de projectiles, rayons ou cibles en plus par niveau d'emplacement (« 1 rayon », « 1 cible »). */
function bonusParNiveau(sort: Sort, niveauEmplacement: number): number {
  const m = sort.ameliorationParNiveau && /^(\d+) /.exec(sort.ameliorationParNiveau);
  return m ? Number(m[1]) * (niveauEmplacement - sort.niveau) : 0;
}

export function porteeSort(sort: Sort): number {
  if (sort.portee.type === 'contact') return 1.5;
  if (sort.portee.type === 'personnel') return 0;
  return sort.portee.normale ?? 0;
}

export function nombreCibles(sort: Sort, niveauEmplacement: number): number {
  return (sort.cibles ?? 1) + (sort.cibles ? bonusParNiveau(sort, niveauEmplacement) : 0);
}

/** Vérifie et consomme les ressources ; renvoie le niveau d'emplacement utilisé (0 pour un sort mineur). */
export function preparerIncantation(lanceur: Combattant, sort: Sort): number | string {
  if (!lanceur.sorts.includes(sort.id)) return `${lanceur.nom} ne connaît pas ${sort.nom}.`;
  if (sort.niveau === 0) return 0;
  const niveau = emplacementDisponible(lanceur, sort.niveau);
  if (!niveau) return `Plus d'emplacement de niveau ${sort.niveau} ou plus.`;
  return niveau;
}

export function lancerSort(etat: EtatCombat, lanceur: Combattant, sort: Sort, niveau: number, cible: CibleSort): void {
  if (niveau > 0) lanceur.incantation!.emplacements[niveau - 1]! -= 1;
  const cases = sort.zone && cible.point ? casesDeZone(etat, lanceur, sort, cible.point) : undefined;
  journaliser(etat, {
    type: 'sort',
    texte: `${lanceur.nom} lance ${sort.nom}${niveau > sort.niveau ? ` (niveau ${niveau})` : ''}.`,
    acteur: lanceur.id,
    cible: cible.cibles?.length === 1 ? cible.cibles[0]!.id : undefined,
    details: { sort: sort.id, point: cible.point, cases },
  });
  if (sort.concentration) {
    if (lanceur.concentration) finConcentration(etat, lanceur);
    lanceur.concentration = { sort: sort.id, cibles: (cible.cibles ?? []).map((c) => c.id) };
  }
  const gestionnaire = sort.special ? SPECIAUX[sort.special] : SPECIAUX[sort.id];
  if (gestionnaire) gestionnaire(etat, lanceur, sort, niveau, cible);
  else resolutionGenerique(etat, lanceur, sort, niveau, cible);
}

function casesDeZone(etat: EtatCombat, lanceur: Combattant, sort: Sort, point: Position): Position[] {
  const zone = sort.zone!;
  const origine = sort.portee.type === 'personnel' ? lanceur.position : point;
  return casesZone(etat.grille, zone.forme, zone.taille, origine, point);
}

function ciblesDeZone(etat: EtatCombat, lanceur: Combattant, sort: Sort, point: Position): Combattant[] {
  const cases = new Set(casesDeZone(etat, lanceur, sort, point).map(cle));
  return etat.combattants.filter((c) => !c.mort && !c.enFuite && c.id !== lanceur.id && cases.has(cle(c.position)));
}

function resolutionGenerique(etat: EtatCombat, lanceur: Combattant, sort: Sort, niveau: number, cible: CibleSort): void {
  const cibles = sort.zone && cible.point ? ciblesDeZone(etat, lanceur, sort, cible.point) : (cible.cibles ?? []);
  const inc = lanceur.incantation!;
  const des = sort.degats.map((d) => ({ des: desAmeliores(sort, desSortMineur(sort, lanceur, d.des), niveau), bonus: d.bonus, type: d.type }));
  // Une zone d'effet ne jette ses dés qu'une fois pour toutes les cibles (SRD 5.2.1) : chacune fait sa sauvegarde, mais le
  // montant est le même (la moitié pour qui réussit). Sans zone, chaque cible a son propre jet.
  const tirageZone = sort.zone && sort.resolution?.type === 'sauvegarde' ? des.map((d) => lancerDes(etat, d.des)) : undefined;
  for (const c of cibles) {
    const r = sort.resolution;
    if (r?.type === 'attaque') {
      const jet = jetAttaque(etat, lanceur, c, inc.bonusAttaque, r.mode);
      journaliser(etat, { type: 'attaque', texte: `${sort.nom} contre ${c.nom} : ${jet.de} → ${jet.total}, ${jet.touche ? (jet.critique ? 'critique !' : 'touché') : 'raté'}${jet.couvert ? ' (cible à couvert, +2 CA)' : ''}.`, acteur: lanceur.id, cible: c.id, details: detailsJet(jet, r.mode === 'distance', sort.id) });
      if (jet.touche) {
        infligerDegats(etat, c, des.map((d) => ({ montant: lancerDes(etat, d.des, jet.critique ? 2 : 1) + d.bonus, type: d.type })), lanceur, jet.critique);
        effetsSecondaires(etat, lanceur, sort, c, niveau);
        if (sort.id === 'poigne-electrique') c.ressources.reaction = 0;
      } else if (sort.id === 'fleche-acide') {
        // Flèche acide : un raté asperge quand même la cible, pour la moitié des dégâts initiaux, sans dégâts consécutifs.
        infligerDegats(etat, c, des.map((d) => ({ montant: Math.floor((lancerDes(etat, d.des) + d.bonus) / 2), type: d.type })), lanceur);
      } else if (sort.niveau === 0 && lanceur.traits.includes('sort-mineur-appuye')) {
        // Sort mineur appuyé (Évocateur) : moitié des dégâts en cas d'échec.
        infligerDegats(etat, c, des.map((d) => ({ montant: Math.floor(lancerDes(etat, d.des) / 2), type: d.type })), lanceur);
      }
    } else if (r?.type === 'sauvegarde') {
      // Le demi-couvert aide à la sauvegarde de Dextérité contre l'effet, depuis son origine (le point visé d'une zone, sinon le lanceur).
      const origine = sort.zone && cible.point && sort.portee.type !== 'personnel' ? cible.point : lanceur.position;
      // Flamme sacrée ignore les abris (SRD 5.2.1).
      const bonusCouvert = sort.id === 'flamme-sacree' ? 0 : couvertSauvegarde(etat, c, r.caracteristique, origine);
      const reussite = sauvegarde(etat, c, r.caracteristique, inc.dd, bonusCouvert);
      journaliser(etat, { type: 'sort', texte: `${c.nom} : sauvegarde ${reussite ? 'réussie' : 'ratée'}${bonusCouvert ? ' (à couvert, +2)' : ''}.`, acteur: lanceur.id, cible: c.id, details: { sort: sort.id, sauvegarde: reussite ? 'reussie' : 'ratee', distance: !sort.zone && sort.portee.type === 'distance' } });
      const appuye = sort.niveau === 0 && lanceur.traits.includes('sort-mineur-appuye');
      const facteur = reussite ? (r.moitieSiReussite || appuye ? 0.5 : 0) : 1;
      if (facteur > 0 && des.length) {
        infligerDegats(etat, c, des.map((d, i) => ({ montant: Math.floor(((tirageZone?.[i] ?? lancerDes(etat, d.des)) + d.bonus) * facteur), type: d.type })), lanceur);
      }
      if (!reussite && sort.id === 'vague-tonnante') repousser(etat, lanceur.position, c, 2);
      if (!reussite && sort.id === 'moquerie-cruelle') {
        // Désavantage au prochain jet d'attaque, avant la fin de son prochain tour.
        c.modificateurs.push({ id: 'moquerie-cruelle', type: 'desavantage_attaque', source: lanceur.id, usageUnique: true, expire: { moment: 'fin_tour', de: c.id } });
      }
      if (!reussite && sort.id === 'murmures-dissonants' && c.ressources.reaction && !c.mort) {
        // La cible doit employer sa Réaction pour s'éloigner du lanceur autant que sa Vitesse le permet.
        c.ressources.reaction = 0;
        repousser(etat, lanceur.position, c, Math.floor(vitesse(c) / TAILLE_CASE));
      }
      if (!reussite) {
        for (const e of sort.etats) {
          ajouterEtat(etat, c, {
            etat: e.etat,
            source: lanceur.id,
            sort: sort.concentration ? sort.id : undefined,
            sauvegarde: e.sauvegardeFinDeTour ? { caracteristique: r.caracteristique, dd: inc.dd } : undefined,
          });
        }
      }
    } else if (sort.soins) {
      const disciple = lanceur.traits.includes('disciple-de-la-vie') && niveau > 0 ? 2 + niveau : 0;
      const montant = lancerDes(etat, desAmeliores(sort, sort.soins.des, niveau)) + (sort.soins.ajouterModificateur ? inc.modificateur : 0) + disciple;
      soigner(etat, c, montant, lanceur);
    } else if (r?.type === 'automatique' && des.length) {
      infligerDegats(etat, c, des.map((d) => ({ montant: lancerDes(etat, d.des) + d.bonus, type: d.type })), lanceur);
    }
  }
}

function effetsSecondaires(etat: EtatCombat, lanceur: Combattant, sort: Sort, c: Combattant, niveau = sort.niveau): void {
  if (sort.id === 'rayon-empoisonne') {
    ajouterEtat(etat, c, { etat: 'empoisonne', source: lanceur.id, finTourDe: lanceur.id, passerFin: true });
  }
  if (sort.id === 'fleche-acide') {
    // 2d4 de plus à la fin de son tour suivant (+1d4 par niveau d'emplacement au-delà du 2e).
    const sup = Math.max(0, niveau - sort.niveau);
    c.modificateurs.push({ id: 'fleche-acide', type: 'degats_differes', de: `${2 + sup}d4`, typeDegats: 'acide', source: lanceur.id, sort: sort.id });
  }
  if (sort.id === 'rayon-de-givre') {
    c.modificateurs.push({ id: 'rayon-de-givre', type: 'vitesse', valeur: -3, source: lanceur.id, expire: { moment: 'debut_tour', de: lanceur.id } });
  }
  if (sort.id === 'eclair-tracant') {
    // Jusqu'à la fin du prochain tour du lanceur (on laisse passer la fin de ce tour-ci).
    c.modificateurs.push({ id: 'eclair-tracant', type: 'avantage_contre', source: lanceur.id, usageUnique: true, expire: { moment: 'fin_tour', de: lanceur.id, apres: 1 } });
  }
}

/** Déplacement forcé : la cible s'éloigne de `depuis` de `cases` cases au plus, arrêtée par un mur ou une créature. */
function repousser(etat: EtatCombat, depuis: Position, c: Combattant, cases: number): void {
  if (c.mort) return;
  const dx = Math.sign(c.position.x - depuis.x);
  const dy = Math.sign(c.position.y - depuis.y);
  const occ = occupation(etat, c);
  const chemin: Position[] = [];
  for (let i = 0; i < cases; i++) {
    const p = { x: c.position.x + dx, y: c.position.y + dy };
    if (p.x < 0 || p.y < 0 || p.x >= etat.grille.largeur || p.y >= etat.grille.hauteur) break;
    if (!franchissable(etat.grille.cases[p.y * etat.grille.largeur + p.x] ?? 'mur') || occ.occupees.has(cle(p))) break;
    c.position = p;
    chemin.push(p);
  }
  if (chemin.length) journaliser(etat, { type: 'deplacement', texte: `${c.nom} est repoussé.`, acteur: c.id, details: { chemin } });
}

/** Bouclier en réaction contre Projectile magique : il annule les dards (SRD 5.2.1). */
function bouclierContreProjectiles(etat: EtatCombat, c: Combattant): boolean {
  if (c.modificateurs.some((m) => m.id === 'bouclier')) return true;
  if (!c.sorts.includes('bouclier') || !c.ressources.reaction || !peutAgir(c)) return false;
  const niveau = emplacementDisponible(c, 1);
  if (!niveau) return false;
  c.incantation!.emplacements[niveau - 1]! -= 1;
  c.ressources.reaction = 0;
  c.modificateurs.push({ id: 'bouclier', type: 'bonus_ca', valeur: 5, source: c.id, expire: { moment: 'debut_tour', de: c.id } });
  journaliser(etat, { type: 'sort', texte: `${c.nom} lance Bouclier : les projectiles magiques s'y brisent.`, acteur: c.id, details: { sort: 'bouclier' } });
  return true;
}

// « Assourdi » n'est pas un état du moteur : les trois autres le sont.
const ETATS_RESTAURATION = ['aveugle', 'empoisonne', 'paralyse'] as const;

type Gestionnaire = (etat: EtatCombat, lanceur: Combattant, sort: Sort, niveau: number, cible: CibleSort) => void;

const SPECIAUX: Record<string, Gestionnaire> = {
  'projectile-magique': (etat, lanceur, sort, niveau, cible) => {
    const n = 3 + bonusParNiveau(sort, niveau);
    const cibles = cible.cibles ?? [];
    for (let i = 0; i < n && cibles.length; i++) {
      const c = cibles[i % cibles.length]!;
      if (bouclierContreProjectiles(etat, c)) continue;
      journaliser(etat, { type: 'attaque', texte: `Un projectile file vers ${c.nom}.`, acteur: lanceur.id, cible: c.id, details: { resultat: 'touche', distance: true, sort: sort.id } });
      infligerDegats(etat, c, [{ montant: lancerDes(etat, '1d4') + 1, type: 'force' }], lanceur);
    }
  },
  'rayon-ardent': (etat, lanceur, sort, niveau, cible) => {
    const n = 3 + bonusParNiveau(sort, niveau);
    const cibles = cible.cibles ?? [];
    for (let i = 0; i < n && cibles.length; i++) {
      const c = cibles[i % cibles.length]!;
      if (c.mort) continue;
      const jet = jetAttaque(etat, lanceur, c, lanceur.incantation!.bonusAttaque, 'distance');
      journaliser(etat, { type: 'attaque', texte: `Rayon contre ${c.nom} : ${jet.de} → ${jet.total}, ${jet.touche ? 'touché' : 'raté'}.`, acteur: lanceur.id, cible: c.id, details: detailsJet(jet, true, sort.id) });
      if (jet.touche) infligerDegats(etat, c, [{ montant: lancerDes(etat, '2d6', jet.critique ? 2 : 1), type: 'feu' }], lanceur, jet.critique);
    }
  },
  // Décharge occulte : un rayon de plus aux niveaux 5, 11 et 17, chacun avec son jet d'attaque.
  'decharge-occulte': (etat, lanceur, sort, _niveau, cible) => {
    const rayons = lanceur.niveau >= 17 ? 4 : lanceur.niveau >= 11 ? 3 : lanceur.niveau >= 5 ? 2 : 1;
    const cibles = cible.cibles ?? [];
    for (let i = 0; i < rayons && cibles.length; i++) {
      const c = cibles[i % cibles.length]!;
      if (c.mort) continue;
      const jet = jetAttaque(etat, lanceur, c, lanceur.incantation!.bonusAttaque, 'distance');
      journaliser(etat, { type: 'attaque', texte: `Rayon contre ${c.nom} : ${jet.de} → ${jet.total}, ${jet.touche ? (jet.critique ? 'critique !' : 'touché') : 'raté'}.`, acteur: lanceur.id, cible: c.id, details: detailsJet(jet, true, sort.id) });
      if (jet.touche) infligerDegats(etat, c, [{ montant: lancerDes(etat, '1d10', jet.critique ? 2 : 1), type: 'force' }], lanceur, jet.critique);
    }
  },
  // Couteau de glace : une attaque (1d10 perforants) sur la créature visée, puis une explosion de froid autour d'elle
  // (rayon 1,5 m) que la cible touchée ou ratée subit aussi : Dextérité, rien en cas de réussite.
  'couteau-de-glace': (etat, lanceur, sort, niveau, cible) => {
    const point = cible.point;
    if (!point) return;
    const inc = lanceur.incantation!;
    const visee = etat.combattants.find((c) => !c.mort && !c.enFuite && c.position.x === point.x && c.position.y === point.y);
    if (visee) {
      const jet = jetAttaque(etat, lanceur, visee, inc.bonusAttaque, 'distance');
      journaliser(etat, { type: 'attaque', texte: `${sort.nom} contre ${visee.nom} : ${jet.de} → ${jet.total}, ${jet.touche ? (jet.critique ? 'critique !' : 'touché') : 'raté'}.`, acteur: lanceur.id, cible: visee.id, details: detailsJet(jet, true, sort.id) });
      if (jet.touche) infligerDegats(etat, visee, [{ montant: lancerDes(etat, '1d10', jet.critique ? 2 : 1), type: 'perforant' }], lanceur, jet.critique);
    }
    const cases = new Set(casesZone(etat.grille, 'sphere', TAILLE_CASE, point, point).map(cle));
    const des = desAmeliores(sort, sort.degats[0]!.des, niveau);
    const montant = lancerDes(etat, des);
    for (const c of etat.combattants) {
      if (c.mort || c.enFuite || !cases.has(cle(c.position))) continue;
      const bonusCouvert = couvertSauvegarde(etat, c, 'dex', point);
      const reussite = sauvegarde(etat, c, 'dex', inc.dd, bonusCouvert);
      journaliser(etat, { type: 'sort', texte: `${c.nom} : sauvegarde ${reussite ? 'réussie' : 'ratée'}${bonusCouvert ? ' (à couvert, +2)' : ''}.`, acteur: lanceur.id, cible: c.id, details: { sort: sort.id, sauvegarde: reussite ? 'reussie' : 'ratee', distance: false } });
      if (!reussite) infligerDegats(etat, c, [{ montant, type: 'froid' }], lanceur);
    }
  },
  // --- Effets qui durent -------------------------------------------------------------------------------------------
  'sphere-de-feu': (etat, lanceur, sort, niveau, cible) => {
    if (!cible.point) return;
    poserZone(etat, lanceur, sort, niveau, cible.point, 1, ['fin_tour']);
    journaliser(etat, { type: 'sort', texte: 'Une sphère de flammes apparaît.', acteur: lanceur.id });
  },
  'invocation-d-animaux': (etat, lanceur, sort, niveau, cible) => {
    if (!cible.point) return;
    poserZone(etat, lanceur, sort, niveau, cible.point, 2, ['fin_tour', 'entree']);
    journaliser(etat, { type: 'sort', texte: "Une meute d'esprits animaux apparaît.", acteur: lanceur.id });
  },
  'rayon-de-lune': (etat, lanceur, sort, niveau, cible) => {
    if (!cible.point) return;
    const z = poserZone(etat, lanceur, sort, niveau, cible.point, 1, ['fin_tour', 'entree']);
    // Toute créature présente à l'apparition du rayon fait le jet.
    for (const c of etat.combattants) if (!c.mort && !c.enFuite && dansZone(z, c.position)) declencherZone(etat, z, c);
  },
  'appel-de-la-foudre': (etat, lanceur, sort, niveau, cible) => {
    if (!cible.point) return;
    // Le nuage ne fait rien tout seul : il donne la zone où l'éclair peut tomber, d'abord à l'incantation puis à chaque tour.
    const nuage = poserZone(etat, lanceur, sort, niveau, cible.point, 12, []);
    frapperPoint(etat, lanceur, nuage, cible.point);
  },
  'lame-de-feu': (etat, lanceur, _sort, niveau) => {
    lanceur.ressources.lameDeFeu = niveau;
    journaliser(etat, { type: 'sort', texte: `Une lame de feu apparaît dans la main de ${lanceur.nom}.`, acteur: lanceur.id });
  },
  'caresse-du-vampire': (etat, lanceur, sort, niveau, cible) => {
    lanceur.ressources.caresse = niveau;
    attaqueCaresse(etat, lanceur, sort, cible.cibles?.[0]);
  },
  bouclier: () => {
    // Géré comme réaction dans jetAttaque.
  },
  benediction: (etat, lanceur, sort, niveau, cible) => {
    for (const c of (cible.cibles ?? []).slice(0, nombreCibles(sort, niveau))) {
      c.modificateurs.push({ id: 'benediction-a', type: 'de_attaque', de: '1d4', source: lanceur.id, sort: sort.id });
      c.modificateurs.push({ id: 'benediction-s', type: 'de_sauvegarde', de: '1d4', source: lanceur.id, sort: sort.id });
      journaliser(etat, { type: 'sort', texte: `${c.nom} est béni (+1d4 aux attaques et sauvegardes).`, cible: c.id });
    }
  },
  fleau: (etat, lanceur, sort, niveau, cible) => {
    for (const c of (cible.cibles ?? []).slice(0, nombreCibles(sort, niveau))) {
      if (sauvegarde(etat, c, 'cha', lanceur.incantation!.dd)) {
        journaliser(etat, { type: 'sort', texte: `${c.nom} résiste à ${sort.nom}.`, cible: c.id });
        continue;
      }
      c.modificateurs.push({ id: 'fleau-a', type: 'de_attaque', de: '-1d4', source: lanceur.id, sort: sort.id });
      c.modificateurs.push({ id: 'fleau-s', type: 'de_sauvegarde', de: '-1d4', source: lanceur.id, sort: sort.id });
      journaliser(etat, { type: 'sort', texte: `${c.nom} est maudit (−1d4 aux attaques et sauvegardes).`, cible: c.id });
    }
  },
  'eclair-tracant': (etat, lanceur, sort, niveau, cible) => resolutionGenerique(etat, lanceur, sort, niveau, cible),
  'bouclier-de-la-foi': (etat, lanceur, sort, _niveau, cible) => {
    const c = cible.cibles?.[0] ?? lanceur;
    c.modificateurs.push({ id: 'bouclier-de-la-foi', type: 'bonus_ca', valeur: 2, source: lanceur.id, sort: sort.id });
    journaliser(etat, { type: 'sort', texte: `${c.nom} est protégé (+2 CA).`, cible: c.id });
  },
  'marque-du-chasseur': (etat, lanceur, sort, _niveau, cible) => {
    const c = cible.cibles?.[0];
    if (!c) return;
    c.modificateurs.push({ id: 'marque-du-chasseur', type: 'bonus_attaque', valeur: 0, source: lanceur.id, sort: sort.id });
    journaliser(etat, { type: 'sort', texte: `${c.nom} est marqué.`, cible: c.id });
  },
  'arme-spirituelle': (etat, lanceur, sort, niveau, cible) => {
    lanceur.ressources.armeSpirituelle = niveau;
    attaqueArmeSpirituelle(etat, lanceur, sort, cible.cibles?.[0]);
  },
  aide: (etat, lanceur, sort, niveau, cible) => {
    const bonus = 5 * (niveau - 1);
    for (const c of (cible.cibles ?? []).slice(0, 3)) {
      c.pvMax += bonus;
      if (!c.modificateurs.some((m) => m.id === 'aide-a')) c.modificateurs.push({ id: 'aide-a', type: 'repere', source: lanceur.id, sort: sort.id });
      if (c.pv > 0 || bonus > 0) soigner(etat, c, bonus, lanceur);
    }
  },
  // Restauration partielle : met fin à un état parmi Aveuglé, Assourdi, Empoisonné, Paralysé.
  'restauration-partielle': (etat, lanceur, _sort, _niveau, cible) => {
    const c = cible.cibles?.[0];
    if (!c) return;
    const e = ETATS_RESTAURATION.find((x) => c.etats.some((y) => y.etat === x));
    if (!e) return journaliser(etat, { type: 'sort', texte: `${c.nom} n'a aucun mal que ce sort guérit.`, acteur: lanceur.id, cible: c.id });
    retirerEtat(c, e);
    journaliser(etat, { type: 'sort', texte: `${c.nom} est délivré : il n'est plus ${e === 'empoisonne' ? 'empoisonné' : e === 'paralyse' ? 'paralysé' : 'aveuglé'}.`, acteur: lanceur.id, cible: c.id });
  },
  sommeil: (etat, lanceur, sort, _niveau, cible) => {
    if (!cible.point) return;
    for (const c of ciblesDeZone(etat, lanceur, sort, cible.point)) {
      if (c.camp === lanceur.camp || c.type.toLowerCase().includes('mort-vivant') || c.type.toLowerCase().includes('artificiel')) continue;
      if (sauvegarde(etat, c, 'sag', lanceur.incantation!.dd)) {
        journaliser(etat, { type: 'sort', texte: `${c.nom} résiste au sommeil.`, cible: c.id });
        continue;
      }
      ajouterEtat(etat, c, { etat: 'neutralise', source: lanceur.id, sort: sort.id, sauvegarde: { caracteristique: 'sag', dd: lanceur.incantation!.dd } });
    }
  },
};

/** Attaque de l'arme spirituelle (au lancement, puis en action bonus les tours suivants). */
/** Pose (ou remplace) la zone qui dure d'un sort ; ses dés viennent du sort, relevés selon l'emplacement. */
function poserZone(etat: EtatCombat, lanceur: Combattant, sort: Sort, niveau: number, centre: Position, rayon: number, declencheurs: ZonePersistante['declencheurs']): ZonePersistante {
  const d = sort.degats[0];
  const r = sort.resolution;
  const zone: ZonePersistante = {
    id: `${sort.id}:${lanceur.id}`,
    sort: sort.id,
    lanceur: lanceur.id,
    centre,
    rayon,
    degats: d && r?.type === 'sauvegarde' ? { des: desAmeliores(sort, d.des, niveau), type: d.type, caracteristique: r.caracteristique, dd: lanceur.incantation!.dd, moitie: r.moitieSiReussite } : undefined,
    declencheurs,
    declenches: {},
    niveau,
  };
  etat.zones = [...(etat.zones ?? []).filter((z) => z.id !== zone.id), zone];
  return zone;
}

/** Un éclair tombe sur un point : les créatures à 1,5 m ou moins font le jet ; le tirage est commun (zone d'effet). */
function frapperPoint(etat: EtatCombat, lanceur: Combattant, nuage: ZonePersistante, point: Position): void {
  const d = nuage.degats;
  if (!d) return;
  journaliser(etat, { type: 'sort', texte: 'Un éclair frappe.', acteur: lanceur.id, details: { sort: nuage.sort, point, cases: casesZone(etat.grille, 'sphere', 1.5, point, point) } });
  const montant = lancerDes(etat, d.des);
  for (const c of etat.combattants) {
    if (c.mort || c.enFuite || distanceCases(c.position, point) > 1) continue;
    const reussite = sauvegarde(etat, c, d.caracteristique, d.dd, couvertSauvegarde(etat, c, d.caracteristique, point));
    journaliser(etat, { type: 'sort', texte: `${c.nom} : sauvegarde ${reussite ? 'réussie' : 'ratée'}.`, acteur: lanceur.id, cible: c.id, details: { sort: nuage.sort, sauvegarde: reussite ? 'reussie' : 'ratee', distance: false } });
    const facteur = reussite ? (d.moitie ? 0.5 : 0) : 1;
    if (facteur > 0) infligerDegats(etat, c, [{ montant: Math.floor(montant * facteur), type: d.type }], lanceur);
  }
}

/** Le suivi d'une zone qui dure : la déplacer, ou y faire tomber un éclair. Renvoie faux si le point n'est pas valide. */
export function suiviZone(etat: EtatCombat, lanceur: Combattant, sortId: string, point: Position): boolean {
  const z = (etat.zones ?? []).find((x) => x.sort === sortId && x.lanceur === lanceur.id);
  const def = SUIVI_ZONES[sortId];
  if (!z || !def) return false;
  if (typeCase(etat.grille, point) === 'mur' || distanceCases(z.centre, point) > def.cases) return false;
  if (def.effet === 'frapper') {
    frapperPoint(etat, lanceur, z, point);
    return true;
  }
  let arrivee = point;
  if (sortId === 'sphere-de-feu') {
    // La sphère roule en ligne droite et s'arrête sur la première créature qu'elle rencontre.
    const n = distanceCases(z.centre, point);
    for (let i = 1; i <= n; i++) {
      const p = { x: Math.round(z.centre.x + ((point.x - z.centre.x) * i) / n), y: Math.round(z.centre.y + ((point.y - z.centre.y) * i) / n) };
      arrivee = p;
      if (etat.combattants.some((c) => !c.mort && !c.enFuite && c.position.x === p.x && c.position.y === p.y)) break;
    }
  }
  z.centre = arrivee;
  journaliser(etat, { type: 'sort', texte: sortId === 'sphere-de-feu' ? 'La sphère roule.' : sortId === 'rayon-de-lune' ? 'Le rayon se déplace.' : 'La meute se déplace.', acteur: lanceur.id, details: { sort: sortId, point: arrivee } });
  for (const c of etat.combattants) {
    if (c.mort || c.enFuite) continue;
    if (sortId === 'sphere-de-feu') {
      if (c.position.x === arrivee.x && c.position.y === arrivee.y) declencherZone(etat, z, c);
    } else if (z.declencheurs.includes('entree') && dansZone(z, c.position)) declencherZone(etat, z, c);
  }
  return true;
}

/** Lame de feu : une attaque de sort au corps à corps avec la lame (3d6 de feu + modificateur d'incantation). */
export function attaqueLameDeFeu(etat: EtatCombat, lanceur: Combattant, sort: Sort, c: Combattant | undefined): void {
  if (!c || c.mort) return;
  const niveau = lanceur.ressources.lameDeFeu ?? sort.niveau;
  const jet = jetAttaque(etat, lanceur, c, lanceur.incantation!.bonusAttaque, 'corps-a-corps');
  journaliser(etat, { type: 'attaque', texte: `La lame de feu frappe ${c.nom} : ${jet.de} → ${jet.total}, ${jet.touche ? (jet.critique ? 'critique !' : 'touché') : 'raté'}.`, acteur: lanceur.id, cible: c.id, details: detailsJet(jet, false, sort.id) });
  if (jet.touche) {
    const des = desAmeliores(sort, '3d6', niveau);
    infligerDegats(etat, c, [{ montant: lancerDes(etat, des, jet.critique ? 2 : 1) + lanceur.incantation!.modificateur, type: 'feu' }], lanceur, jet.critique);
  }
}

/** Caresse du vampire : attaque de sort au corps à corps (3d6 nécrotiques) ; le lanceur récupère la moitié des dégâts infligés. */
export function attaqueCaresse(etat: EtatCombat, lanceur: Combattant, sort: Sort, c: Combattant | undefined): void {
  if (!c || c.mort) return;
  const niveau = lanceur.ressources.caresse ?? sort.niveau;
  const jet = jetAttaque(etat, lanceur, c, lanceur.incantation!.bonusAttaque, 'corps-a-corps');
  journaliser(etat, { type: 'attaque', texte: `La caresse du vampire touche ${c.nom} : ${jet.de} → ${jet.total}, ${jet.touche ? (jet.critique ? 'critique !' : 'touché') : 'raté'}.`, acteur: lanceur.id, cible: c.id, details: detailsJet(jet, false, sort.id) });
  if (!jet.touche) return;
  const des = desAmeliores(sort, '3d6', niveau);
  const infliges = infligerDegats(etat, c, [{ montant: lancerDes(etat, des, jet.critique ? 2 : 1), type: 'nécrotique' }], lanceur, jet.critique);
  if (infliges > 0 && !lanceur.mort) soigner(etat, lanceur, Math.floor(infliges / 2), lanceur);
}

export function attaqueArmeSpirituelle(etat: EtatCombat, lanceur: Combattant, sort: Sort, c: Combattant | undefined): void {
  if (!c || c.mort) return;
  const niveau = lanceur.ressources.armeSpirituelle ?? 2;
  const jet = jetAttaque(etat, lanceur, c, lanceur.incantation!.bonusAttaque, 'corps-a-corps');
  journaliser(etat, { type: 'attaque', texte: `L'arme spirituelle frappe ${c.nom} : ${jet.de} → ${jet.total}, ${jet.touche ? 'touché' : 'raté'}.`, acteur: lanceur.id, cible: c.id, details: detailsJet(jet, true, sort.id) });
  if (jet.touche) {
    const des = desAmeliores(sort, '1d8', niveau);
    infligerDegats(etat, c, [{ montant: lancerDes(etat, des, jet.critique ? 2 : 1) + lanceur.incantation!.modificateur, type: 'force' }], lanceur, jet.critique);
  }
}

/** Cibles valides d'un sort pour le lanceur (portée et ligne de vue). */
export function ciblesPossibles(etat: EtatCombat, lanceur: Combattant, sort: Sort): Combattant[] {
  const portee = porteeSort(sort);
  const offensif = !!sort.resolution || sort.special === 'marque-du-chasseur' || sort.degats.length > 0;
  const pool = offensif ? ennemis(etat, lanceur) : etat.combattants.filter((c) => c.camp === lanceur.camp && !c.mort && !c.enFuite);
  return pool.filter((c) => {
    if (sort.id === 'immobilisation-de-personne' && !c.type.toLowerCase().includes('humanoïde')) return false;
    if (sort.soins && c.pv >= c.pvMax) return false;
    if (sort.portee.type === 'personnel') return SORTS_AU_CONTACT.has(sort.id) ? distanceMetres(lanceur.position, c.position) <= 1.5 : c.id === lanceur.id;
    return distanceMetres(lanceur.position, c.position) <= portee && ligneDeVue(etat.grille, lanceur.position, c.position);
  });
}

export { aEtat, peutAgir };
