// Les actions légendaires (F6 de docs/PRD-SAGA.md, lot 3). Un monstre qui porte le trait `actions-legendaires` dispose d'une réserve d'utilisations
// (`ressources.actionsLegendaires`, N écrit dans le trait, rendues en entier au début de son tour) : aussitôt après le tour d'un adversaire, il peut en
// dépenser une pour une de ses « actions légendaires » (les actions du profil dont le texte commence par « Action légendaire. »). Une seule par fin de tour.
//
// Ce lot joue celles qui portent une `resolution` (attaque ou sauvegarde) : une cible (portée de l'action) ou une zone (sphère autour d'un point
// visible, émanation autour du monstre). Les autres (déplacement + attaque, sorts, effets sans résolution) n'ont pas encore de règle : le monstre ne
// les joue pas. Opt-in par les données : un monstre sans le trait n'est jamais concerné. Ces actions ne sont plus des cartes de son propre tour.
import { moyenneDes } from '../des';
import type { ActionMonstre, Sort } from '../schemas';
// Cycle d'import voulu (cartes.ts importe moteur.ts, qui appelle ce module) : appelés à l'exécution seulement.
import { cartesDisponibles, executer, type Contexte } from './cartes';
import { ACTIONS_LEGENDAIRES, ACTIONS_LEGENDAIRES_MAX, ennemis, estActionLegendaire, horsCombat, journaliser, peutAgir, type Combattant, type EtatCombat } from './etat';
import { casesOccupees, casesZone, distanceMetres, ligneDeVue, TAILLE_CASE, type Position } from './grille';
// Cycle d'import voulu (moteur.ts appelle ce module à chaque fin de tour) : `attaqueMonstre` n'est appelé qu'à l'exécution.
import { attaqueMonstre, deplacementsPossibles, deplacer, vitesse } from './moteur';

/** Préfixe de la clé de `ressources` qui verrouille une action légendaire jusqu'au début du prochain tour du monstre (« ne peut alors plus entreprendre cette action »). */
export const VERROU_LEGENDAIRE = 'verrouLegendaire:';

/** Une action légendaire qu'on sait jouer : elle porte une résolution d'attaque ou de sauvegarde. */
const jouable = (a: ActionMonstre): boolean => !!a.legendaire || a.resolution?.type === 'attaque' || a.resolution?.type === 'sauvegarde';

/** Les actions légendaires jouables d'un monstre. */
export function actionsLegendairesJouables(c: Combattant): ActionMonstre[] {
  return c.actionsMonstre.filter((a) => estActionLegendaire(a) && jouable(a));
}

/** Rend toutes ses utilisations au monstre et lève les verrous : au début de SON tour. */
export function rendreActionsLegendaires(c: Combattant): void {
  const max = c.ressources[ACTIONS_LEGENDAIRES_MAX];
  if (max === undefined) return;
  c.ressources[ACTIONS_LEGENDAIRES] = max;
  for (const k of Object.keys(c.ressources)) if (k.startsWith(VERROU_LEGENDAIRE)) delete c.ressources[k];
}

interface Plan {
  action: ActionMonstre;
  cibles: Combattant[];
  score: number;
  /** Action « se déplace puis attaque » (`legendaire`) : l'attaque du profil à jouer et la case où aller d'abord (absente : il attaque d'où il est). */
  attaque?: string;
  vers?: Position;
  /** Action qui lance un sort (`legendaire.sort`) : la carte de sort à jouer et, pour un sort de zone, le point visé. */
  sort?: { carte: string; point?: Position };
}

/** Ce qu'une cible touchée rapporte au monstre : ses dégâts moyens (pondérés par la chance de toucher ou de faire rater) et un bonus pour les états infligés. */
const valeurParCible = (a: ActionMonstre): number => a.degats.reduce((s, d) => s + moyenneDes(d.des) + d.bonus, 0) * 0.6 + (a.etats.length ? 3 : 0);

/** Ce qu'une cible touchée par ce sort rapporte : ses dégâts moyens (pondérés), et un bonus fixe quand le sort n'inflige pas de dégâts. */
const valeurDuSort = (s: Sort): number => (s.degats.length ? s.degats.reduce((t, d) => t + moyenneDes(d.des) + (d.bonus ?? 0), 0) * 0.6 : 3);

/**
 * « Recourt à Incantation pour lancer X » (`legendaire.sort`) : le sort X de la liste du monstre, lancé sans action ni réserve. On prend la carte de sort
 * que le moteur offrirait au monstre s'il avait son action (cibles à portée, ou point d'une zone), les adversaires les plus blessés d'abord ; pour un
 * sort de zone on essaie la case de chaque adversaire et l'on garde le centre qui en touche le plus, ses alliés comptant contre lui. Sans `ctx`
 * (les sorts du catalogue), rien : le monstre ne sait pas lancer.
 */
function planSort(etat: EtatCombat, c: Combattant, a: ActionMonstre, ctx: Contexte | undefined): Plan | undefined {
  const sort = ctx?.sorts.get(a.legendaire!.sort!);
  if (!ctx || !sort) return undefined;
  // La carte telle qu'elle serait avec une action disponible (le tour du monstre n'est pas le sien).
  const copie = structuredClone(c.tour);
  c.tour.action = true;
  c.tour.sortEmplacementLance = false;
  const k = cartesDisponibles(etat, ctx, c.id).find((x) => x.id === `sort:${sort.id}`);
  c.tour = copie;
  if (!k || !k.jouable) return undefined;
  const unite = valeurDuSort(sort);
  const adversaires = ennemis(etat, c);
  if (k.ciblage === 'point' && k.zone && (k.zone.forme === 'sphere' || k.zone.forme === 'cube' || k.zone.forme === 'cylindre' || k.zone.forme === 'emanation')) {
    const porteeSort = k.portee ?? 0;
    let meilleur: Plan | undefined;
    for (const e of adversaires) {
      if (distanceMetres(c, e) > porteeSort || !ligneDeVue(etat.grille, c.position, e.position)) continue;
      const cases = casesZone(etat.grille, k.zone.forme as 'sphere' | 'cube' | 'cylindre' | 'emanation', k.zone.taille, c.position, e.position);
      const dedans = (x: Combattant) => casesOccupees(x).some((q) => cases.some((p) => p.x === q.x && p.y === q.y));
      const touches = adversaires.filter(dedans);
      const allies = etat.combattants.filter((x) => x.camp === c.camp && x.id !== c.id && !horsCombat(x) && dedans(x)).length;
      const score = (touches.length - allies) * unite;
      if (touches.length && score > 0 && (!meilleur || score > meilleur.score)) meilleur = { action: a, cibles: touches, score, sort: { carte: k.id, point: { ...e.position } } };
    }
    return meilleur;
  }
  if (k.ciblage !== 'ennemi' || !k.cibles.length) return undefined;
  const cibles = k.cibles
    .map((id) => etat.combattants.find((x) => x.id === id)!)
    .filter((x) => x && !horsCombat(x))
    .sort((x, y) => x.pv - y.pv)
    .slice(0, Math.max(1, k.nbCibles));
  return cibles.length ? { action: a, cibles, score: cibles.length * unite, sort: { carte: k.id } } : undefined;
}

/** Lance le sort du plan hors de son tour : le monstre devient un instant le combattant actif (sa main de cartes, ses coûts), puis son tour et l'ordre sont rétablis. */
function lancerSortHorsTour(etat: EtatCombat, ctx: Contexte, c: Combattant, plan: Plan): void {
  const copie = structuredClone(c.tour);
  const indexActif = etat.actif;
  etat.actif = etat.ordre.indexOf(c.id);
  c.tour.action = true;
  c.tour.sortEmplacementLance = false;
  executer(etat, ctx, { type: 'jouer', carte: plan.sort!.carte, cibles: plan.cibles.map((x) => x.id), ...(plan.sort!.point ? { point: plan.sort!.point } : {}) });
  c.tour = copie;
  etat.actif = indexActif;
}

/** La portée d'une action d'attaque du profil, en mètres. */
const porteeDe = (a: ActionMonstre): number => (a.portee?.type === 'distance' ? (a.portee.longue ?? a.portee.normale ?? 1.5) : (a.portee?.allonge ?? 1.5));

/**
 * « Se déplace d'une part de sa Vitesse et effectue une attaque de X » (`legendaire`) : la meilleure attaque listée (dégâts moyens), contre l'adversaire le
 * plus blessé qu'il peut atteindre, d'où il est ou après s'être approché (chemin le moins cher dans la part de Vitesse permise). Aucun déplacement si une
 * cible est déjà à portée.
 */
function planDeplacerEtAttaquer(etat: EtatCombat, c: Combattant, a: ActionMonstre): Plan | undefined {
  const attaques = (a.legendaire!.attaque ?? []).map((id) => c.actionsMonstre.find((x) => x.id === id)).filter((x): x is ActionMonstre => x?.resolution?.type === 'attaque' || x?.resolution?.type === 'sauvegarde');
  if (!attaques.length) return undefined;
  const moyenne = (x: ActionMonstre) => x.degats.reduce((s, d) => s + moyenneDes(d.des) + d.bonus, 0);
  const attaque = [...attaques].sort((x, y) => moyenne(y) - moyenne(x))[0]!;
  const portee = Math.max(porteeDe(attaque), 1.5);
  const visibles = ennemis(etat, c);
  const unite = moyenne(attaque) * 0.65;
  const dejaLa = visibles.filter((e) => distanceMetres(c, e) <= portee && (attaque.portee?.type !== 'distance' || ligneDeVue(etat.grille, c.position, e.position)));
  if (dejaLa.length) return { action: a, cibles: [[...dejaLa].sort((x, y) => x.pv - y.pv)[0]!], score: unite, attaque: attaque.id };
  const part = a.legendaire!.deplacement ?? 0;
  if (part <= 0) return undefined;
  // Les cases où il peut aller avec la part de Vitesse permise (sans toucher à son mouvement du tour).
  const mouvement = c.tour.mouvement;
  c.tour.mouvement = Math.floor((vitesse(c) * part) / TAILLE_CASE) * TAILLE_CASE;
  const chemins = deplacementsPossibles(etat, c);
  c.tour.mouvement = mouvement;
  let meilleur: { cible: Combattant; vers: Position; cout: number } | undefined;
  for (const [, chemin] of chemins) {
    const arrivee = chemin.etapes[chemin.etapes.length - 1];
    if (!arrivee) continue;
    for (const e of visibles) {
      // La portée se mesure depuis l'empreinte du monstre arrivé là (une grande créature a des cases tout autour de son ancrage).
      if (distanceMetres({ position: arrivee, taille: c.taille }, e) > portee) continue;
      if (!meilleur || chemin.cout < meilleur.cout || (chemin.cout === meilleur.cout && e.pv < meilleur.cible.pv)) meilleur = { cible: e, vers: arrivee, cout: chemin.cout };
    }
  }
  return meilleur ? { action: a, cibles: [meilleur.cible], score: unite - 0.1, attaque: attaque.id, vers: meilleur.vers } : undefined;
}

/** Ce que ferait cette action maintenant : qui serait touché (zone) ou visé (une cible), et ce que ça vaut ; rien si personne n'est à portée. */
function planDe(etat: EtatCombat, c: Combattant, a: ActionMonstre, ctx?: Contexte): Plan | undefined {
  if (a.legendaire?.sort) return planSort(etat, c, a, ctx);
  if (a.legendaire) return planDeplacerEtAttaquer(etat, c, a);
  const visibles = ennemis(etat, c);
  const portee = a.portee?.type === 'distance' ? (a.portee.longue ?? a.portee.normale ?? 1.5) : a.portee?.type === 'contact' ? (a.portee.allonge ?? 1.5) : 0;
  const unite = valeurParCible(a);
  if (a.zone && (a.zone.forme === 'sphere' || a.zone.forme === 'emanation')) {
    const forme = a.zone.forme;
    // Une émanation part du monstre ; une sphère est centrée sur un point qu'il voit à portée : on essaie la case de chaque ennemi.
    const centres = forme === 'emanation' ? [c.position] : visibles.filter((e) => distanceMetres(c, e) <= portee && ligneDeVue(etat.grille, c.position, e.position)).map((e) => e.position);
    let meilleur: Plan | undefined;
    for (const centre of centres) {
      const cases = casesZone(etat.grille, forme, a.zone.taille, c.position, centre);
      const dedans = (x: Combattant) => casesOccupees(x).some((q) => cases.some((p) => p.x === q.x && p.y === q.y));
      const touchesEnnemis = visibles.filter(dedans);
      // Ses alliés pris dans la zone comptent contre ce centre (les actions légendaires les frappent aussi).
      const touchesAllies = etat.combattants.filter((x) => x.camp === c.camp && x.id !== c.id && !horsCombat(x) && dedans(x)).length;
      const score = (touchesEnnemis.length - touchesAllies) * unite;
      if (touchesEnnemis.length && score > 0 && (!meilleur || score > meilleur.score)) meilleur = { action: a, cibles: touchesEnnemis, score };
    }
    return meilleur;
  }
  const atteignables = visibles.filter((e) => distanceMetres(c, e) <= Math.max(portee, 1.5) && (a.portee?.type !== 'distance' || ligneDeVue(etat.grille, c.position, e.position)));
  if (!atteignables.length) return undefined;
  const cible = [...atteignables].sort((x, y) => x.pv - y.pv)[0]!;
  return { action: a, cibles: [cible], score: unite };
}

/**
 * Aussitôt après le tour de `apres` : chaque monstre légendaire de l'autre camp peut dépenser une utilisation. Il choisit l'action jouable qui vaut le
 * plus (le plus de cibles, sans trop toucher ses alliés) ; s'il n'y en a pas, il garde sa réserve. Sans effet pour tout monstre sans la réserve.
 */
export function actionsLegendairesApres(etat: EtatCombat, apres: Combattant, ctx?: Contexte): void {
  for (const c of etat.combattants) {
    if (etat.vainqueur) return;
    if (c.camp === apres.camp || c.id === apres.id) continue;
    if ((c.ressources[ACTIONS_LEGENDAIRES] ?? 0) <= 0 || !peutAgir(c)) continue;
    const plans = actionsLegendairesJouables(c)
      .filter((a) => !c.ressources[`${VERROU_LEGENDAIRE}${a.id}`])
      .map((a) => planDe(etat, c, a, ctx))
      .filter((p): p is Plan => !!p);
    if (!plans.length) continue;
    const choix = plans.sort((x, y) => y.score - x.score)[0]!;
    c.ressources[ACTIONS_LEGENDAIRES]! -= 1;
    if (/ne peut alors plus entreprendre cette action/i.test(choix.action.resume)) c.ressources[`${VERROU_LEGENDAIRE}${choix.action.id}`] = 1;
    journaliser(etat, { type: 'info', texte: `${c.nom} dépense une action légendaire : ${choix.action.nom} (${c.ressources[ACTIONS_LEGENDAIRES]} restante(s)).`, acteur: c.id });
    if (choix.sort && ctx) {
      lancerSortHorsTour(etat, ctx, c, choix);
      continue;
    }
    if (choix.attaque) {
      // Se déplacer d'abord (une part de sa Vitesse, sans entamer son mouvement du tour), puis frapper si l'adversaire est toujours là et lui debout.
      if (choix.vers) {
        const sauve = { mouvement: c.tour.mouvement, aBouge: c.tour.aBouge };
        c.tour.mouvement = Math.floor((vitesse(c) * (choix.action.legendaire!.deplacement ?? 0)) / TAILLE_CASE) * TAILLE_CASE;
        deplacer(etat, c, choix.vers);
        c.tour.mouvement = sauve.mouvement;
        c.tour.aBouge = sauve.aBouge;
      }
      const cible = choix.cibles[0]!;
      if (peutAgir(c) && !cible.mort && !horsCombat(cible)) attaqueMonstre(etat, c, cible, choix.attaque);
      continue;
    }
    for (const cible of choix.cibles) if (!cible.mort && !horsCombat(cible)) attaqueMonstre(etat, c, cible, choix.action.id);
  }
}
