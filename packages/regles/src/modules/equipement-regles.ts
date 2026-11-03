// Les règles de l'équipement, en code pur : ce qu'on peut porter, ce que ça change à la fiche (CA, armes de combat), ce
// que ça pèse. Tout repose sur le catalogue du SRD, commun à tous les mondes : une arme ou une armure d'un monde cite
// l'arme ou l'armure du SRD sur laquelle elle repose (`base`) et n'ajoute que ses bonus et son nom.
import { caAvec, type DefenseFiche } from '../fiche';
import type { ContexteJeu } from '../noyau/types';
import { equipementDe, type Equipement, type Personnage } from '../personnage';
import { objetDe } from './catalogue';

/** Armes portées au plus : les équipements de départ du SRD en comptent jusqu'à cinq, le reste voyage dans le sac. */
export const ARMES_MAX = 6;
export const PORTES_MAX = 5;
export const HARMONISES_MAX = 3;
/** Charge portable par point de Force (SRD 5.2.1 : 15 livres). */
export const KG_PAR_FORCE = 7.5;

export type Genre = 'armure' | 'bouclier' | 'arme' | 'porte';

/** Comment un objet s'équipe, et sur quelle armure ou arme du SRD il repose. */
export function infoEquipement(ctx: ContexteJeu, id: string): { genre: Genre; base?: string } | undefined {
  const o = objetDe(ctx, id);
  const base = o.base ?? id;
  if (o.categorie === 'bouclier' || base === 'bouclier') return { genre: 'bouclier', base: 'bouclier' };
  if (o.categorie === 'armure' && ctx.srd?.armures.has(base)) return { genre: 'armure', base };
  if (o.categorie === 'arme' && ctx.srd?.armes.has(base)) return { genre: 'arme', base };
  if (['anneau', 'bijou', 'vetement'].includes(o.categorie)) return { genre: 'porte' };
  return undefined;
}

/** Tout ce que porte un héros, en identifiants d'objets. */
export function objetsPortes(e: Equipement): string[] {
  return [...(e.armure ? [e.armure] : []), ...(e.bouclier ? [e.bouclier] : []), ...e.armes, ...e.portes];
}

const defenseDe = (p: Personnage): DefenseFiche =>
  p.fiche.defense ?? {
    mods: Object.fromEntries(Object.entries(p.fiche.caracteristiques).map(([c, v]) => [c, v.modificateur])) as DefenseFiche['mods'],
    bonusToujours: 0,
    bonusEnArmure: 0,
    sansArmure: [],
  };

/** La CA du héros avec cet équipement. */
export function caAvecEquipement(ctx: ContexteJeu, p: Personnage, e: Equipement): number {
  const armure = e.armure ? ctx.srd?.armures.get(infoEquipement(ctx, e.armure)?.base ?? e.armure) : undefined;
  const bouclier = !!e.bouclier && p.fiche.formationArmures.includes('bouclier');
  const bonus = objetsPortes(e).reduce((s, id) => s + (objetDe(ctx, id).bonus?.ca ?? 0), 0);
  return caAvec(defenseDe(p), armure, bouclier, bonus);
}

/**
 * Applique l'équipement du héros à sa fiche : l'équipement résolu sur le SRD (celui que lit le combat), la CA et les bonus
 * des armes magiques. À appeler après chaque changement.
 */
export function appliquerEquipement(ctx: ContexteJeu, p: Personnage): void {
  const e = equipementDe(p);
  const base = (id: string) => infoEquipement(ctx, id)?.base ?? id;
  const armes = e.armes.map(base);
  const bonusArmes: NonNullable<Equipement['bonusArmes']> = {};
  e.armes.forEach((id, i) => {
    const o = objetDe(ctx, id);
    const srd = ctx.srd?.armes.get(armes[i]!);
    if (o.bonus?.attaque || o.bonus?.degats || (srd && o.nom !== srd.nom))
      bonusArmes[armes[i]!] = { attaque: o.bonus?.attaque ?? 0, degats: o.bonus?.degats ?? 0, nom: srd && o.nom !== srd.nom ? o.nom : undefined };
  });
  p.equipe = { ...e, bonusArmes };
  const avant = p.fiche.equipement;
  p.fiche.equipement = { autres: avant?.autres ?? [], po: avant?.po ?? 0, armure: e.armure ? base(e.armure) : undefined, bouclier: !!e.bouclier, armes };
  p.fiche.ca = caAvecEquipement(ctx, p, p.equipe);
}

/** Ce que pèse ce qu'un héros porte. */
export const poidsPorte = (ctx: ContexteJeu, p: Personnage): number => objetsPortes(equipementDe(p)).reduce((s, id) => s + (objetDe(ctx, id).poidsKg ?? 0), 0);

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
