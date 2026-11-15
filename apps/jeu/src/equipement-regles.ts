// La poupée d'équipement de la feuille de personnage : quelles cases, ce que chacune porte, pourquoi une main est bloquée et quels
// objets du sac peuvent aller à une case (avec ce que devient la CA). Aucune règle ici : tout vient du moteur (`placer`,
// `caAvecEquipement`), cette page ne fait que le présenter. Fichier pur, testé à part.
import {
  appliquerEquipement,
  caAvecEquipement,
  copieEquipement,
  harmonises,
  harmonisesEmbarques,
  HARMONISES_MAX,
  jeuDe,
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
  type Equipement,
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
    const refus = objetDe(ctx, id).attunement && harmonises(ctx, r.equipe) + harmonisesEmbarques(ctx, h) > HARMONISES_MAX ? `${h.nom} est déjà harmonisé à 3 objets magiques, le maximum.` : undefined;
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

/** Les dés d'un jet de dégâts (« 1d8 », « 2d6 », « 1 ») : leur moyenne. */
function moyenneDes(des: string): number {
  const m = /^(\d*)d(\d+)$/.exec(des);
  return m ? (Number(m[1] || 1) * (Number(m[2]) + 1)) / 2 : Number(des) || 0;
}

export interface AttaqueEnMain {
  id: string;
  nom: string;
  mode: string;
  bonus: number;
  degats: string;
  /** Les dégâts moyens d'un coup qui touche (tous les jets additionnés, bonus compris). */
  moyenne: number;
}

/** Les attaques du jeu d'armes en main (avec les bonus des armes magiques), pour le résumé de combat de la feuille. */
export function attaquesEnMain(ctx: ContexteJeu, h: Personnage): AttaqueEnMain[] {
  if (!ctx.srd) return [];
  try {
    const hc = heroCombatDe(h);
    return heroDepuisFiche(hc.fiche, hc.kit, ctx.srd, { x: 0, y: 0 }).attaques.map((a) => ({
      id: a.id,
      nom: a.nom,
      mode: a.mode === 'distance' ? 'distance' : 'corps à corps',
      bonus: a.bonusAttaque,
      degats: a.degats.map((d) => `${d.des}${d.bonus ? (d.bonus > 0 ? `+${d.bonus}` : d.bonus) : ''} ${d.type}`).join(' + '),
      moyenne: a.degats.reduce((s, d) => s + moyenneDes(d.des) + d.bonus, 0),
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Le comparateur : ce que change un objet du sac, à l'emplacement où il irait vraiment
// ---------------------------------------------------------------------------

/** Pour une ligne du comparateur : le changement est un gain, une perte, ou rien (ou sans sens, comme l'harmonisation). */
export type SensChangement = 'mieux' | 'moins' | 'egal' | 'neutre';

export interface LigneComparaison {
  cle: 'ca' | 'attaques' | 'bonus' | 'vitesse' | 'discretion' | 'harmonisation';
  libelle: string;
  avant: string;
  apres: string;
  sens: SensChangement;
}

export interface Comparaison {
  objet: string;
  nom: string;
  emplacement: Emplacement;
  /** « Torse », « Main droite (jeu II) »… */
  emplacementNom: string;
  /** Le jeu d'armes de l'emplacement, pour une main. */
  jeu?: 1 | 2;
  /** L'emplacement compte-t-il tout de suite ? (faux pour une main de l'autre jeu d'armes, qui n'est pas en main.) */
  enMain: boolean;
  /** Ce que l'objet remplace (il retourne dans le sac) : noms, vide si l'emplacement est libre. */
  remplace: string[];
  /** « Remplace sur Pip : Épée courte » ou « Libre sur Pip : Torse ». */
  titre: string;
  /** Pourquoi on ne peut pas l'équiper (alors pas de lignes). */
  refus?: string;
  lignes: LigneComparaison[];
  /** Mises en garde qui n'empêchent pas d'équiper (formation, Force). */
  notes: string[];
}

const nombreFr = (n: number): string => String(Math.round(n * 10) / 10).replace('.', ',');
const signe = (n: number): string => (n >= 0 ? `+${n}` : String(n));
const sens = (avant: number, apres: number): SensChangement => (apres > avant ? 'mieux' : apres < avant ? 'moins' : 'egal');

/** Le héros tel qu'il serait avec cet équipement, le jeu d'armes voulu en main : copie, la vraie fiche n'est pas touchée. */
function heroAvec(ctx: ContexteJeu, h: Personnage, equipe: Equipement, jeu: 1 | 2): Personnage {
  const c = structuredClone(h);
  c.equipe = { ...copieEquipement(equipe), jeuActif: jeu };
  appliquerEquipement(ctx, c);
  return c;
}

/**
 * Les attaques d'un jeu en clair, une par ligne. Un même coup qui se donne de deux façons (la dague : au corps à corps ou lancée,
 * mêmes bonus et mêmes dégâts) n'est écrit qu'une fois.
 */
export function texteAttaques(a: AttaqueEnMain[]): string {
  const vues = new Set<string>();
  const distinctes = a.filter((x) => {
    const cle = `${x.bonus}|${x.degats}`;
    return vues.has(cle) ? false : (vues.add(cle), true);
  });
  if (!distinctes.length) return 'Aucune';
  return distinctes.map((x) => `${distinctes.length > 1 ? `${x.nom} · ` : ''}${signe(x.bonus)} · ${x.degats} (moy. ${nombreFr(x.moyenne)})`).join(String.fromCharCode(10));
}

/** La meilleure attaque d'une liste : celle qui frappe le plus fort en moyenne, puis qui touche le mieux. */
const meilleure = (a: AttaqueEnMain[]): [number, number] => a.reduce<[number, number]>((m, x) => (x.moyenne > m[0] || (x.moyenne === m[0] && x.bonus > m[1]) ? [x.moyenne, x.bonus] : m), [0, -99]);

const textesBonus = (ids: string[], ctx: ContexteJeu): { texte: string; total: number } => {
  const s = { attaque: 0, degats: 0, ca: 0 };
  for (const id of ids) {
    const b = objetDe(ctx, id).bonus;
    s.attaque += b?.attaque ?? 0;
    s.degats += b?.degats ?? 0;
    s.ca += b?.ca ?? 0;
  }
  const parties = [s.attaque && `${signe(s.attaque)} attaque`, s.degats && `${signe(s.degats)} dégâts`, s.ca && `CA ${signe(s.ca)}`].filter(Boolean);
  return { texte: parties.length ? parties.join(', ') : 'aucun', total: s.attaque + s.degats + s.ca };
};

/**
 * Ce que changerait un objet du sac pour ce héros, à l'emplacement où la commande « équiper » le mettrait (celui qu'on lui donne
 * ici, sinon le même choix que la commande : un emplacement libre d'abord, puis le premier qui convient). Avant → après : la CA, les
 * attaques du jeu d'armes concerné (dégâts moyens compris), les bonus magiques, la Vitesse, la Discrétion, l'harmonisation. Tout est
 * calculé avec le moteur (`placer`, `appliquerEquipement`) sur une copie du héros : aucune règle n'est refaite ici. Rien si l'objet ne s'équipe pas.
 */
export function comparer(ctx: ContexteJeu, h: Personnage, objet: string, voulu?: Emplacement): Comparaison | undefined {
  const info = infoEquipement(ctx, objet);
  if (!info) return undefined;
  const nom = objetDe(ctx, objet).nom;
  const e = equipementDe(h);
  const r = placer(ctx, h, objet, voulu);
  if ('refus' in r) {
    const s = voulu ?? emplacementsDeFamille(info.famille, e.jeuActif)[0]!;
    return { objet, nom, emplacement: s, emplacementNom: NOMS_EMPLACEMENTS[s], enMain: true, remplace: [], titre: `${nom} sur ${h.nom}`, refus: r.refus, lignes: [], notes: [] };
  }
  const s = r.emplacement;
  const jeu = jeuDe(s);
  const jeuVise = jeu ?? e.jeuActif;
  const enMain = jeuVise === e.jeuActif;
  const remplace = r.remis.map((id) => objetDe(ctx, id).nom);
  const base = { objet, nom, emplacement: s, emplacementNom: NOMS_EMPLACEMENTS[s], jeu, enMain, remplace, titre: remplace.length ? `Remplace sur ${h.nom} : ${remplace.join(' et ')}` : `Libre sur ${h.nom} : ${NOMS_EMPLACEMENTS[s].replace(/^./, (l) => l.toLowerCase())}` };

  // L'harmonisation compte tout ce qui est porté (et emporté pour le combat), comme la commande.
  const nbAvant = harmonises(ctx, e) + harmonisesEmbarques(ctx, h);
  const nbApres = harmonises(ctx, r.equipe) + harmonisesEmbarques(ctx, h);
  if (objetDe(ctx, objet).attunement && nbApres > HARMONISES_MAX) return { ...base, refus: `${h.nom} est déjà harmonisé à ${HARMONISES_MAX} objets magiques, le maximum.`, lignes: [], notes: [] };

  const avant = heroAvec(ctx, h, e, jeuVise);
  const apres = heroAvec(ctx, h, r.equipe, jeuVise);
  const lignes: LigneComparaison[] = [];
  const notes: string[] = [];
  const genre = info.genre;

  // La CA : toujours pour une armure ou un bouclier ; pour le reste, seulement si elle bouge. Pour une main de l'autre jeu : la CA une fois ce jeu en main.
  if (genre === 'armure' || genre === 'bouclier' || avant.fiche.ca !== apres.fiche.ca)
    lignes.push({ cle: 'ca', libelle: enMain ? 'CA' : `CA (jeu ${jeuVise === 1 ? 'I' : 'II'})`, avant: String(avant.fiche.ca), apres: String(apres.fiche.ca), sens: sens(avant.fiche.ca, apres.fiche.ca) });

  // Les attaques : pour une arme, ou quand l'objet change ce qu'on tient (une arme à deux mains qui chasse le bouclier, un bouclier qui chasse l'arme de la main gauche).
  const aAvant = attaquesEnMain(ctx, avant);
  const aApres = attaquesEnMain(ctx, apres);
  const texteA = [texteAttaques(aAvant), texteAttaques(aApres)];
  if (genre === 'arme' || texteA[0] !== texteA[1]) {
    const [ma, mb] = [meilleure(aAvant), meilleure(aApres)];
    lignes.push({ cle: 'attaques', libelle: aAvant.length > 1 || aApres.length > 1 ? 'Attaques' : 'Attaque', avant: texteA[0]!, apres: texteA[1]!, sens: ma[0] !== mb[0] ? sens(ma[0], mb[0]) : sens(ma[1], mb[1]) });
  }

  const bAvant = textesBonus(r.remis, ctx);
  const bApres = textesBonus([objet], ctx);
  if (bAvant.total || bApres.total) lignes.push({ cle: 'bonus', libelle: 'Bonus magique', avant: bAvant.texte, apres: bApres.texte, sens: sens(bAvant.total, bApres.total) });

  if (avant.fiche.vitesse !== apres.fiche.vitesse) lignes.push({ cle: 'vitesse', libelle: 'Vitesse', avant: `${nombreFr(avant.fiche.vitesse)} m`, apres: `${nombreFr(apres.fiche.vitesse)} m`, sens: sens(avant.fiche.vitesse, apres.fiche.vitesse) });

  const armure = (p: Personnage) => (p.fiche.equipement?.armure ? ctx.srd?.armures.get(p.fiche.equipement.armure) : undefined);
  const gene = (p: Personnage) => !!armure(p)?.desavantageDiscretion;
  if (gene(avant) !== gene(apres)) lignes.push({ cle: 'discretion', libelle: 'Discrétion', avant: gene(avant) ? 'désavantage' : 'normale', apres: gene(apres) ? 'désavantage' : 'normale', sens: gene(apres) ? 'moins' : 'mieux' });

  if (objetDe(ctx, objet).attunement || r.remis.some((id) => objetDe(ctx, id).attunement))
    lignes.push({ cle: 'harmonisation', libelle: 'Harmonisation', avant: `${nbAvant} / ${HARMONISES_MAX}`, apres: `${nbApres} / ${HARMONISES_MAX}`, sens: 'neutre' });

  if (apres.fiche.sansFormation && !avant.fiche.sansFormation) notes.push(`${h.nom} n'a pas la formation ${genre === 'bouclier' ? 'au bouclier' : 'à cette armure'} : désavantage aux attaques et aux jets de Force et de Dextérité, aucun sort.`);
  if (!enMain) notes.push(`Ce jeu d'armes n'est pas en main : ces chiffres valent une fois qu'on l'a pris en main.`);
  return { ...base, lignes, notes };
}
