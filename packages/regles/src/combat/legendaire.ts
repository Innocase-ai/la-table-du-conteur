// Les actions légendaires (F6 de docs/PRD-SAGA.md, lot 3). Un monstre qui porte le trait `actions-legendaires` dispose d'une réserve d'utilisations
// (`ressources.actionsLegendaires`, N écrit dans le trait, rendues en entier au début de son tour) : aussitôt après le tour d'un adversaire, il peut en
// dépenser une pour une de ses « actions légendaires » (les actions du profil dont le texte commence par « Action légendaire. »). Une seule par fin de tour.
//
// Ce lot joue celles qui portent une `resolution` (attaque ou sauvegarde) : une cible (portée de l'action) ou une zone (sphère autour d'un point
// visible, émanation autour du monstre). Les autres (déplacement + attaque, sorts, effets sans résolution) n'ont pas encore de règle : le monstre ne
// les joue pas. Opt-in par les données : un monstre sans le trait n'est jamais concerné. Ces actions ne sont plus des cartes de son propre tour.
import { moyenneDes } from '../des';
import type { ActionMonstre } from '../schemas';
import { ACTIONS_LEGENDAIRES, ACTIONS_LEGENDAIRES_MAX, ennemis, estActionLegendaire, horsCombat, journaliser, peutAgir, type Combattant, type EtatCombat } from './etat';
import { casesZone, distanceMetres, ligneDeVue, TAILLE_CASE, type Position } from './grille';
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
}

/** Ce qu'une cible touchée rapporte au monstre : ses dégâts moyens (pondérés par la chance de toucher ou de faire rater) et un bonus pour les états infligés. */
const valeurParCible = (a: ActionMonstre): number => a.degats.reduce((s, d) => s + moyenneDes(d.des) + d.bonus, 0) * 0.6 + (a.etats.length ? 3 : 0);

/** La portée d'une action d'attaque du profil, en mètres. */
const porteeDe = (a: ActionMonstre): number => (a.portee?.type === 'distance' ? (a.portee.longue ?? a.portee.normale ?? 1.5) : (a.portee?.allonge ?? 1.5));

/**
 * « Se déplace d'une part de sa Vitesse et effectue une attaque de X » (`legendaire`) : la meilleure attaque listée (dégâts moyens), contre l'adversaire le
 * plus blessé qu'il peut atteindre, d'où il est ou après s'être approché (chemin le moins cher dans la part de Vitesse permise). Aucun déplacement si une
 * cible est déjà à portée.
 */
function planDeplacerEtAttaquer(etat: EtatCombat, c: Combattant, a: ActionMonstre): Plan | undefined {
  const attaques = a.legendaire!.attaque.map((id) => c.actionsMonstre.find((x) => x.id === id)).filter((x): x is ActionMonstre => x?.resolution?.type === 'attaque');
  if (!attaques.length) return undefined;
  const moyenne = (x: ActionMonstre) => x.degats.reduce((s, d) => s + moyenneDes(d.des) + d.bonus, 0);
  const attaque = [...attaques].sort((x, y) => moyenne(y) - moyenne(x))[0]!;
  const portee = Math.max(porteeDe(attaque), 1.5);
  const visibles = ennemis(etat, c);
  const unite = moyenne(attaque) * 0.65;
  const dejaLa = visibles.filter((e) => distanceMetres(c.position, e.position) <= portee && (attaque.portee?.type !== 'distance' || ligneDeVue(etat.grille, c.position, e.position)));
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
      if (distanceMetres(arrivee, e.position) > portee) continue;
      if (!meilleur || chemin.cout < meilleur.cout || (chemin.cout === meilleur.cout && e.pv < meilleur.cible.pv)) meilleur = { cible: e, vers: arrivee, cout: chemin.cout };
    }
  }
  return meilleur ? { action: a, cibles: [meilleur.cible], score: unite - 0.1, attaque: attaque.id, vers: meilleur.vers } : undefined;
}

/** Ce que ferait cette action maintenant : qui serait touché (zone) ou visé (une cible), et ce que ça vaut ; rien si personne n'est à portée. */
function planDe(etat: EtatCombat, c: Combattant, a: ActionMonstre): Plan | undefined {
  if (a.legendaire) return planDeplacerEtAttaquer(etat, c, a);
  const visibles = ennemis(etat, c);
  const portee = a.portee?.type === 'distance' ? (a.portee.longue ?? a.portee.normale ?? 1.5) : a.portee?.type === 'contact' ? (a.portee.allonge ?? 1.5) : 0;
  const unite = valeurParCible(a);
  if (a.zone && (a.zone.forme === 'sphere' || a.zone.forme === 'emanation')) {
    const forme = a.zone.forme;
    // Une émanation part du monstre ; une sphère est centrée sur un point qu'il voit à portée : on essaie la case de chaque ennemi.
    const centres = forme === 'emanation' ? [c.position] : visibles.filter((e) => distanceMetres(c.position, e.position) <= portee && ligneDeVue(etat.grille, c.position, e.position)).map((e) => e.position);
    let meilleur: Plan | undefined;
    for (const centre of centres) {
      const cases = casesZone(etat.grille, forme, a.zone.taille, c.position, centre);
      const dedans = (x: Combattant) => cases.some((p) => p.x === x.position.x && p.y === x.position.y);
      const touchesEnnemis = visibles.filter(dedans);
      // Ses alliés pris dans la zone comptent contre ce centre (les actions légendaires les frappent aussi).
      const touchesAllies = etat.combattants.filter((x) => x.camp === c.camp && x.id !== c.id && !horsCombat(x) && dedans(x)).length;
      const score = (touchesEnnemis.length - touchesAllies) * unite;
      if (touchesEnnemis.length && score > 0 && (!meilleur || score > meilleur.score)) meilleur = { action: a, cibles: touchesEnnemis, score };
    }
    return meilleur;
  }
  const atteignables = visibles.filter((e) => distanceMetres(c.position, e.position) <= Math.max(portee, 1.5) && (a.portee?.type !== 'distance' || ligneDeVue(etat.grille, c.position, e.position)));
  if (!atteignables.length) return undefined;
  const cible = [...atteignables].sort((x, y) => x.pv - y.pv)[0]!;
  return { action: a, cibles: [cible], score: unite };
}

/**
 * Aussitôt après le tour de `apres` : chaque monstre légendaire de l'autre camp peut dépenser une utilisation. Il choisit l'action jouable qui vaut le
 * plus (le plus de cibles, sans trop toucher ses alliés) ; s'il n'y en a pas, il garde sa réserve. Sans effet pour tout monstre sans la réserve.
 */
export function actionsLegendairesApres(etat: EtatCombat, apres: Combattant): void {
  for (const c of etat.combattants) {
    if (etat.vainqueur) return;
    if (c.camp === apres.camp || c.id === apres.id) continue;
    if ((c.ressources[ACTIONS_LEGENDAIRES] ?? 0) <= 0 || !peutAgir(c)) continue;
    const plans = actionsLegendairesJouables(c)
      .filter((a) => !c.ressources[`${VERROU_LEGENDAIRE}${a.id}`])
      .map((a) => planDe(etat, c, a))
      .filter((p): p is Plan => !!p);
    if (!plans.length) continue;
    const choix = plans.sort((x, y) => y.score - x.score)[0]!;
    c.ressources[ACTIONS_LEGENDAIRES]! -= 1;
    if (/ne peut alors plus entreprendre cette action/i.test(choix.action.resume)) c.ressources[`${VERROU_LEGENDAIRE}${choix.action.id}`] = 1;
    journaliser(etat, { type: 'info', texte: `${c.nom} dépense une action légendaire : ${choix.action.nom} (${c.ressources[ACTIONS_LEGENDAIRES]} restante(s)).`, acteur: c.id });
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
