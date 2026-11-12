// Les règles de l'équipement, en code pur : ce qu'on peut porter et où (emplacements, mains), ce que ça change à la fiche (CA,
// armes de combat), ce que ça pèse. Tout repose sur le catalogue du SRD, commun à tous les mondes : une arme ou une armure d'un
// monde cite l'arme ou l'armure du SRD sur laquelle elle repose (`base`) et n'ajoute que ses bonus et son nom.
import {
  autreJeu,
  emplacementsDeFamille,
  estMainGauche,
  mainOpposee,
  mainsDuJeu,
  EMPLACEMENTS,
  familleDe,
  NOMS_EMPLACEMENTS,
  type Emplacement,
  type Famille,
} from '../equipement/emplacements';
import { rangerEquipement, type AncienEquipement } from '../equipement/ranger';
import { caAvec, type DefenseFiche } from '../fiche';
import type { ContexteJeu } from '../noyau/types';
import { equipementDe, type BonusArme, type Equipement, type Personnage } from '../personnage';
import { objetDe } from './catalogue';

export const HARMONISES_MAX = 3;
/** Charge portable par point de Force (SRD 5.2.1 : 15 livres). */
export const KG_PAR_FORCE = 7.5;

export type Genre = 'armure' | 'bouclier' | 'arme' | 'porte';

/** Comment un objet s'équipe, sur quelle armure ou arme du SRD il repose, et la famille d'emplacements où il va. */
export function infoEquipement(ctx: ContexteJeu, id: string): { genre: Genre; base?: string; famille: Famille } | undefined {
  const o = objetDe(ctx, id);
  const base = o.base ?? id;
  if (o.categorie === 'bouclier' || base === 'bouclier') return { genre: 'bouclier', base: 'bouclier', famille: 'main' };
  if (o.categorie === 'armure' && ctx.srd?.armures.has(base)) return { genre: 'armure', base, famille: 'torse' };
  if (o.categorie === 'arme' && ctx.srd?.armes.has(base)) return { genre: 'arme', base, famille: 'main' };
  const famille = familleDe(o);
  if (famille && famille !== 'main') return { genre: 'porte', famille };
  return undefined;
}

/** Les propriétés d'une arme (« Deux mains », « Légère », « Polyvalente »…) ; rien si l'objet n'est pas une arme du SRD. */
export function proprietesArme(ctx: ContexteJeu, id: string): string[] | undefined {
  const info = infoEquipement(ctx, id);
  return info?.genre === 'arme' ? ctx.srd?.armes.get(info.base!)?.proprietes : undefined;
}
export const estDeuxMains = (ctx: ContexteJeu, id: string | undefined): boolean => !!id && !!proprietesArme(ctx, id)?.includes('Deux mains');
export const estLegere = (ctx: ContexteJeu, id: string | undefined): boolean => !!id && !!proprietesArme(ctx, id)?.includes('Légère');

/** Tout ce que porte un héros, en identifiants d'objets (les deux jeux d'armes comptent). */
export function objetsPortes(e: Equipement): string[] {
  return EMPLACEMENTS.flatMap((s) => (e.emplacements[s] ? [e.emplacements[s]!] : []));
}

export const copieEquipement = (e: Equipement): Equipement => ({ emplacements: { ...e.emplacements }, jeuActif: e.jeuActif, bonus: e.bonus && { ...e.bonus }, armesActives: e.armesActives && [...e.armesActives] });

/** L'objet tenu à cet emplacement, s'il y en a un. */
export const objetA = (e: Equipement, s: Emplacement): string | undefined => e.emplacements[s];

/** Les mains du jeu actif qui tiennent une arme (la droite d'abord). */
export function mainsArmees(ctx: ContexteJeu, e: Equipement, jeu = e.jeuActif): Emplacement[] {
  const m = mainsDuJeu(jeu);
  return [m.droite, m.gauche].filter((s) => e.emplacements[s] && infoEquipement(ctx, e.emplacements[s]!)?.genre === 'arme');
}

/** Le bouclier du jeu actif (le jeu qu'on a en main), s'il y en a un. */
export function bouclierActif(ctx: ContexteJeu, e: Equipement): string | undefined {
  const id = e.emplacements[mainsDuJeu(e.jeuActif).gauche];
  return id && infoEquipement(ctx, id)?.genre === 'bouclier' ? id : undefined;
}

/** Ce qu'un objet de l'autre jeu d'armes (celui qui n'est pas en main) ne donne pas : sa CA, son harmonisation à l'usage… */
const horsDuJeuActif = (e: Equipement, s: Emplacement): boolean => {
  const m = mainsDuJeu(autreJeu(e.jeuActif));
  return s === m.droite || s === m.gauche;
};

const defenseDe = (p: Personnage): DefenseFiche =>
  p.fiche.defense ?? {
    mods: Object.fromEntries(Object.entries(p.fiche.caracteristiques).map(([c, v]) => [c, v.modificateur])) as DefenseFiche['mods'],
    bonusToujours: 0,
    bonusEnArmure: 0,
    sansArmure: [],
  };

/** La CA du héros avec cet équipement : l'armure du torse, le bouclier du jeu en main, les bonus des objets portés (hors du jeu qui n'est pas en main). */
export function caAvecEquipement(ctx: ContexteJeu, p: Personnage, e: Equipement): number {
  const torse = e.emplacements.torse;
  const armure = torse && infoEquipement(ctx, torse)?.genre === 'armure' ? ctx.srd?.armures.get(infoEquipement(ctx, torse)!.base!) : undefined;
  const bouclier = !!bouclierActif(ctx, e) && p.fiche.formationArmures.includes('bouclier');
  const bonus = EMPLACEMENTS.reduce((s, emp) => (e.emplacements[emp] && !horsDuJeuActif(e, emp) ? s + (objetDe(ctx, e.emplacements[emp]!).bonus?.ca ?? 0) : s), 0);
  return caAvec(defenseDe(p), armure, bouclier, bonus);
}

// ---------------------------------------------------------------------------
// Placer et retirer
// ---------------------------------------------------------------------------

export type ResultatPlacer = { equipe: Equipement; remis: string[]; emplacement: Emplacement } | { refus: string };

/** Pose l'objet à cet emplacement dans une copie de l'équipement ; ce qu'il déloge est rendu (`remis`). Refuse selon les règles des mains. */
function poserA(ctx: ContexteJeu, h: Personnage, e0: Equipement, objet: string, s: Emplacement, info: NonNullable<ReturnType<typeof infoEquipement>>): ResultatPlacer {
  const e = copieEquipement(e0);
  const remis: string[] = [];
  const nom = objetDe(ctx, objet).nom;
  const prendre = (emp: Emplacement | undefined) => {
    if (emp && e.emplacements[emp]) {
      remis.push(e.emplacements[emp]!);
      delete e.emplacements[emp];
    }
  };
  if (info.famille === 'main') {
    const autre = mainOpposee(s)!;
    const gauche = estMainGauche(s);
    const dansAutre = e.emplacements[autre];
    const autreEstArme = !!dansAutre && infoEquipement(ctx, dansAutre)?.genre === 'arme';
    if (info.genre === 'bouclier') {
      if (!gauche) return { refus: `Un bouclier se tient de la main gauche : ${h.nom} le porte au bras, pas dans la main droite.` };
      if (estDeuxMains(ctx, dansAutre)) return { refus: `${objetDe(ctx, dansAutre!).nom} demande les deux mains : ${h.nom} ne peut pas y ajouter un bouclier.` };
    } else if (gauche) {
      if (!estLegere(ctx, objet)) return { refus: `Seule une arme Légère se tient de la main gauche : ${nom} ne l'est pas (un bouclier, oui).` };
      if (!autreEstArme || !estLegere(ctx, dansAutre)) return { refus: `Pour tenir ${nom} de la main gauche, ${h.nom} doit avoir une arme Légère dans la main droite.` };
    } else if (estDeuxMains(ctx, objet)) {
      // Une arme à deux mains prend les deux mains : ce que tenait la main gauche revient au sac.
      prendre(autre);
    } else if (autreEstArme && !estLegere(ctx, objet)) {
      // Une arme qui n'est pas Légère ne se tient pas avec une arme dans l'autre main (seul le combat à deux armes Légères le permet).
      prendre(autre);
    }
  }
  prendre(s);
  e.emplacements[s] = objet;
  return { equipe: e, remis, emplacement: s };
}

/**
 * Ce que donnerait l'équipement du héros avec cet objet : à l'emplacement voulu, ou au premier qui convient (un emplacement libre
 * d'abord, sinon on remplace). `remis` : ce qui revient dans le sac. Refuse si l'objet ne s'équipe pas ou si les mains ne le permettent pas.
 */
export function placer(ctx: ContexteJeu, h: Personnage, objet: string, voulu?: Emplacement): ResultatPlacer {
  const info = infoEquipement(ctx, objet);
  const nom = objetDe(ctx, objet).nom;
  if (!info) return { refus: `${nom} ne s'équipe pas.` };
  const e = equipementDe(h);
  const candidats = emplacementsDeFamille(info.famille, e.jeuActif);
  if (voulu && !candidats.includes(voulu)) return { refus: `${nom} ne se porte pas à cet endroit : ${NOMS_EMPLACEMENTS[voulu].toLowerCase()}.` };
  const ordre = voulu ? [voulu] : candidats;
  const essais = ordre.map((s) => poserA(ctx, h, e, objet, s, info));
  const ok = (r: ResultatPlacer): r is Extract<ResultatPlacer, { equipe: Equipement }> => 'equipe' in r;
  // Sans emplacement imposé : celui qui ne déloge rien d'abord, puis le premier qui convient.
  return essais.find((r) => ok(r) && r.remis.length === 0) ?? essais.find(ok) ?? essais[0]!;
}

/** L'équipement une fois l'emplacement vidé ; une arme Légère de la main gauche ne reste pas sans arme Légère à droite. */
export function retirerDe(ctx: ContexteJeu, e0: Equipement, s: Emplacement): { equipe: Equipement; remis: string[] } {
  const e = copieEquipement(e0);
  const remis: string[] = [];
  const sortir = (emp: Emplacement) => {
    if (e.emplacements[emp]) {
      remis.push(e.emplacements[emp]!);
      delete e.emplacements[emp];
    }
  };
  sortir(s);
  const gauche = ['j1.droite', 'j2.droite'].includes(s) ? mainOpposee(s) : undefined;
  if (gauche && e.emplacements[gauche] && infoEquipement(ctx, e.emplacements[gauche]!)?.genre === 'arme') sortir(gauche);
  return { equipe: e, remis };
}

/** Les objets harmonisés portés (SRD : trois au plus, de toute sorte) : tous les emplacements comptent. */
export const harmonises = (ctx: ContexteJeu, e: Equipement): number => objetsPortes(e).filter((id) => objetDe(ctx, id).attunement).length;

// ---------------------------------------------------------------------------
// Ranger l'équipement d'une ancienne forme (départ, sauvegardes)
// ---------------------------------------------------------------------------

/** Range l'équipement en listes dans les emplacements, avec le catalogue : le surplus (sans place) revient dans le sac. */
export function rangerAvecCatalogue(ctx: ContexteJeu, ancien: AncienEquipement): { equipement: Equipement; surplus: string[] } {
  return rangerEquipement(ancien, {
    proprietes: (id) => proprietesArme(ctx, id),
    objet: (id) => {
      const o = objetDe(ctx, id);
      return { id: o.id, categorie: o.categorie, base: o.base, emplacement: o.emplacement };
    },
  });
}

/**
 * Le héros, équipement de départ rangé avec le SRD : appelé à l'ouverture de la partie et au chargement d'une ancienne sauvegarde.
 * Renvoie ce qui n'a pas trouvé de place (à verser dans le sac du groupe).
 */
export function normaliserEquipement(ctx: ContexteJeu, p: Personnage): string[] {
  const e = p.fiche.equipement;
  const brut = p.equipe;
  const ancien: AncienEquipement | undefined = brut && 'armes' in brut ? brut : !brut ? { armure: e?.armure, bouclier: e?.bouclier ? 'bouclier' : undefined, armes: [...(e?.armes ?? [])], portes: [] } : undefined;
  if (!ancien) return [];
  const { equipement, surplus } = rangerAvecCatalogue(ctx, ancien);
  p.equipe = equipement;
  appliquerEquipement(ctx, p);
  return surplus;
}

// ---------------------------------------------------------------------------
// Appliquer à la fiche
// ---------------------------------------------------------------------------

/**
 * Applique l'équipement du héros à sa fiche : l'équipement résolu sur le SRD (celui que lit le combat : le jeu d'armes en main),
 * la CA et les bonus des armes magiques. À appeler après chaque changement.
 */
export function appliquerEquipement(ctx: ContexteJeu, p: Personnage): void {
  const e = copieEquipement(equipementDe(p));
  const base = (id: string) => infoEquipement(ctx, id)?.base ?? id;
  const bonus: Partial<Record<Emplacement, BonusArme>> = {};
  for (const s of EMPLACEMENTS) {
    const id = e.emplacements[s];
    if (!id || infoEquipement(ctx, id)?.genre !== 'arme') continue;
    const o = objetDe(ctx, id);
    const srd = ctx.srd?.armes.get(base(id));
    if (o.bonus?.attaque || o.bonus?.degats || (srd && o.nom !== srd.nom)) bonus[s] = { attaque: o.bonus?.attaque ?? 0, degats: o.bonus?.degats ?? 0, nom: srd && o.nom !== srd.nom ? o.nom : undefined };
  }
  const armees = mainsArmees(ctx, e);
  e.bonus = bonus;
  e.armesActives = armees;
  p.equipe = e;
  const torse = e.emplacements.torse;
  const armureId = torse && infoEquipement(ctx, torse)?.genre === 'armure' ? torse : undefined;
  const avant = p.fiche.equipement;
  p.fiche.equipement = { autres: avant?.autres ?? [], po: avant?.po ?? 0, armure: armureId ? base(armureId) : undefined, bouclier: !!bouclierActif(ctx, e), armes: armees.map((s) => base(e.emplacements[s]!)) };
  p.fiche.ca = caAvecEquipement(ctx, p, e);
  const armureSrd = armureId ? ctx.srd?.armures.get(base(armureId)) : undefined;
  const formation = p.fiche.formationArmures;
  const penalite = armureSrd?.forceMin && p.fiche.caracteristiques.for.valeur < armureSrd.forceMin ? 3 : 0;
  p.fiche.vitesse += (p.fiche.penaliteForce ?? 0) - penalite;
  p.fiche.penaliteForce = penalite;
  p.fiche.sansFormation = (!!armureSrd && !formation.includes(armureSrd.categorie)) || (!!bouclierActif(ctx, e) && !formation.includes('bouclier'));
}

/** Ce que pèse ce qu'un héros porte. */
export const poidsPorte = (ctx: ContexteJeu, p: Personnage): number =>
  objetsPortes(equipementDe(p)).reduce((s, id) => s + (objetDe(ctx, id).poidsKg ?? 0), 0) + (p.ressources.potions ?? 0) * (objetDe(ctx, 'potion-de-guerison').poidsKg ?? 0);

/** Ce que le groupe peut porter, et ce qu'il porte (le sac et ce que portent les héros). */
export function chargeDuGroupe(ctx: ContexteJeu, groupe: Personnage[], sac: Record<string, number>): { poids: number; capacite: number } {
  const dansLeSac = Object.entries(sac).reduce((s, [id, q]) => s + (objetDe(ctx, id).poidsKg ?? 0) * q, 0);
  return {
    poids: dansLeSac + groupe.reduce((s, a) => s + poidsPorte(ctx, a), 0),
    capacite: groupe.reduce((s, a) => s + a.fiche.caracteristiques.for.valeur * KG_PAR_FORCE, 0),
  };
}

/** Un identifiant d'élément de grille pour un objet porté par un héros (le même objet peut aussi être dans le sac). */
export const idElementPorte = (heros: string, objet: string) => `porte:${heros}:${objet}`;
