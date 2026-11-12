// La poupée d'équipement de la feuille de personnage : quelles cases, ce que chacune porte, pourquoi une main est bloquée et quels
// objets du sac peuvent aller à une case (avec ce que devient la CA). Aucune règle ici : tout vient du moteur (`placer`,
// `caAvecEquipement`), cette page ne fait que le présenter. Fichier pur, testé à part.
import {
  caAvecEquipement,
  equipementDe,
  estDeuxMains,
  idImageCommune,
  infoEquipement,
  mainOpposee,
  NOMS_EMPLACEMENTS,
  objetDe,
  placer,
  estMainGauche,
  emplacementsDeFamille,
  heroCombatDe,
  heroDepuisFiche,
  type ContexteJeu,
  type Emplacement,
  type Personnage,
} from '@crpg/regles';

export interface CaseEquipement {
  emplacement: Emplacement;
  /** Le nom de la case (« Tête », « Main gauche »…). */
  nom: string;
  /** L'objet porté, avec son nom, son image commune et son éventuelle magie. */
  objet?: { id: string; nom: string; magique: boolean; image?: { groupe: string; id: string } };
  /** Pourquoi on ne peut rien y poser pour l'instant (main prise par une arme à deux mains). */
  bloquee?: string;
}

/** Les cases du corps, dans l'ordre où la poupée les place. */
export const CASES_CORPS: Emplacement[] = ['tete', 'cou', 'dos', 'torse', 'gants', 'anneau1', 'ceinture', 'anneau2', 'pieds'];

function caseDe(ctx: ContexteJeu, h: Personnage, s: Emplacement): CaseEquipement {
  const e = equipementDe(h);
  const id = e.emplacements[s];
  let bloquee: string | undefined;
  if (!id && estMainGauche(s)) {
    const droite = e.emplacements[mainOpposee(s)!];
    if (droite && estDeuxMains(ctx, droite)) bloquee = `${objetDe(ctx, droite).nom} se tient à deux mains.`;
  }
  const o = id ? objetDe(ctx, id) : undefined;
  return {
    emplacement: s,
    nom: NOMS_EMPLACEMENTS[s],
    objet: o ? { id: o.id, nom: o.nom, magique: !!o.magique, image: { groupe: 'equipement', id: idImageCommune(o.base ?? o.id) } } : undefined,
    bloquee,
  };
}

export interface JeuPoupee {
  jeu: 1 | 2;
  actif: boolean;
  droite: CaseEquipement;
  gauche: CaseEquipement;
}

export interface Poupee {
  corps: CaseEquipement[];
  jeux: [JeuPoupee, JeuPoupee];
  /** Les mains du jeu en main ont-elles quelque chose ? (le bouton de bascule n'a de sens que s'il y a un autre jeu garni) */
  autreJeuGarni: boolean;
}

export function poupeeDe(ctx: ContexteJeu, h: Personnage): Poupee {
  const e = equipementDe(h);
  const jeu = (n: 1 | 2): JeuPoupee => ({ jeu: n, actif: e.jeuActif === n, droite: caseDe(ctx, h, `j${n}.droite` as Emplacement), gauche: caseDe(ctx, h, `j${n}.gauche` as Emplacement) });
  const autre = e.jeuActif === 1 ? 2 : 1;
  return {
    corps: CASES_CORPS.map((s) => caseDe(ctx, h, s)),
    jeux: [jeu(1), jeu(2)],
    autreJeuGarni: !!(e.emplacements[`j${autre}.droite` as Emplacement] || e.emplacements[`j${autre}.gauche` as Emplacement]),
  };
}

export interface Candidat {
  objet: string;
  nom: string;
  /** Pourquoi on ne peut pas (harmonisation, mains…). */
  refus?: string;
  /** La CA avant et après. */
  ca: { avant: number; apres: number };
  /** Ce que l'objet remplace et qui retournera dans le sac. */
  remplace: string[];
}

/**
 * Les objets du sac qui vont à cette case, avec ce que devient la CA et ce qu'ils remplacent ; ceux que les règles refusent sont
 * gardés avec leur motif (pour les montrer grisés). Les objets qui n'iraient pas à cette case sont absents.
 */
export function candidatsPour(ctx: ContexteJeu, h: Personnage, emplacement: Emplacement, sac: Record<string, number>): Candidat[] {
  const e = equipementDe(h);
  const res: Candidat[] = [];
  for (const id of Object.keys(sac)) {
    if (!sac[id]) continue;
    const info = infoEquipement(ctx, id);
    if (!info || !emplacementsDeFamille(info.famille, e.jeuActif).includes(emplacement)) continue;
    const r = placer(ctx, h, id, emplacement);
    if ('refus' in r) {
      res.push({ objet: id, nom: objetDe(ctx, id).nom, refus: r.refus, ca: { avant: h.fiche.ca, apres: h.fiche.ca }, remplace: [] });
      continue;
    }
    // Même règle que la commande : l'harmonisation se compte sur tout ce qui serait porté.
    const harmonises = Object.values(r.equipe.emplacements).filter((x) => x && objetDe(ctx, x).attunement).length;
    const refus = objetDe(ctx, id).attunement && harmonises > 3 ? `${h.nom} est déjà harmonisé à 3 objets magiques, le maximum.` : undefined;
    res.push({ objet: id, nom: objetDe(ctx, id).nom, refus, ca: { avant: h.fiche.ca, apres: caAvecEquipement(ctx, h, r.equipe) }, remplace: r.remis });
  }
  return res.sort((a, b) => Number(!!a.refus) - Number(!!b.refus) || a.nom.localeCompare(b.nom, 'fr'));
}

/** Le résumé d'un changement de CA (« CA 15 → 17 », ou « CA 15 » si rien ne change). */
export const texteCa = (c: Candidat['ca']): string => (c.avant === c.apres ? `CA ${c.avant}` : `CA ${c.avant} → ${c.apres}`);

/** Où un objet du sac peut aller chez ce héros : chaque case qui l'accepte (avec la CA qui en résulte) ou le refuse (avec le motif). */
export function casesPour(ctx: ContexteJeu, h: Personnage, objet: string): Partial<Record<Emplacement, Candidat>> {
  const res: Partial<Record<Emplacement, Candidat>> = {};
  const e = equipementDe(h);
  const info = infoEquipement(ctx, objet);
  if (!info) return res;
  for (const s of [...emplacementsDeFamille(info.famille, e.jeuActif)]) {
    const c = candidatsPour(ctx, h, s, { [objet]: 1 })[0];
    if (c) res[s] = c;
  }
  return res;
}

/** Les attaques du jeu d'armes en main (avec les bonus des armes magiques), pour le résumé de combat de la feuille. */
export function attaquesEnMain(ctx: ContexteJeu, h: Personnage): { id: string; nom: string; mode: string; bonus: number; degats: string }[] {
  if (!ctx.srd) return [];
  try {
    const hc = heroCombatDe(h);
    return heroDepuisFiche(hc.fiche, hc.kit, ctx.srd, { x: 0, y: 0 }).attaques.map((a) => ({
      id: a.id,
      nom: a.nom,
      mode: a.mode === 'distance' ? 'distance' : 'corps à corps',
      bonus: a.bonusAttaque,
      degats: a.degats.map((d) => `${d.des}${d.bonus ? (d.bonus > 0 ? `+${d.bonus}` : d.bonus) : ''} ${d.type}`).join(' + '),
    }));
  } catch {
    return [];
  }
}
