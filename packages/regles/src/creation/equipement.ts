// Équipement de départ : les listes du SRD sont du texte (« 8 javelines », « Cotte de mailles »).
// On retrouve les armes et armures des données ; le reste (paquetages, focaliseurs…) est conservé tel quel.
import type { Donnees } from '../donnees';
import type { Arme } from '../schemas';
import { normaliser } from './texte';

export interface EquipementResolu {
  /** Id de l'armure portée (la plus protectrice si plusieurs). */
  armure?: string;
  bouclier: boolean;
  armes: string[];
  autres: string[];
  po: number;
  /** En jeu (équipement par emplacements) : la dernière des armes est tenue de la main gauche. */
  gauche?: boolean;
  /** En jeu : le numéro du jeu d'armes en main (1 ou 2). */
  jeu?: 1 | 2;
  /** En jeu : l'autre jeu d'armes (armes du SRD, main gauche, CA quand on le prend en main, manque de formation). */
  autreJeu?: { armes: string[]; gauche?: boolean; ca: number; sansFormation?: boolean };
}

function singulier(mot: string): string {
  return mot.length > 3 ? mot.replace(/[sx]$/, '') : mot;
}

export function resoudreObjets(objets: string[], donnees: Donnees): Omit<EquipementResolu, 'po'> {
  const armes = new Map<string, string>();
  for (const a of donnees.armes.values()) armes.set(normaliser(a.nom), a.id);
  const armures = new Map<string, string>();
  for (const a of donnees.armures.values()) armures.set(normaliser(a.nom), a.id);

  const res = { armure: undefined as string | undefined, bouclier: false, armes: [] as string[], autres: [] as string[] };
  for (const objet of objets) {
    const brut = normaliser(objet.replace(/\(.*?\)/g, ''));
    const nom = brut.replace(/^\d+ /, '');
    const variantes = [nom, nom.split(' ').map(singulier).join(' ')];
    if (nom.startsWith('focaliseur') || nom.startsWith('instrument') || nom.startsWith('outils')) {
      res.autres.push(objet);
      continue;
    }
    const arme = variantes.map((v) => armes.get(v)).find(Boolean);
    const armure = variantes.map((v) => armures.get(v)).find(Boolean);
    if (armure === 'bouclier') res.bouclier = true;
    else if (armure) {
      const actuelle = res.armure ? donnees.armures.get(res.armure) : undefined;
      if (!actuelle || donnees.armures.get(armure)!.ca > actuelle.ca) res.armure = armure;
    } else if (arme) {
      if (!res.armes.includes(arme)) res.armes.push(arme);
    } else res.autres.push(objet);
  }
  return res;
}

const MUNITIONS = /^(fleche|carreau|bille|dard|balle|carquois|etui)/;

/** Les deux jeux d'armes d'un kit de classe : le jeu de **mêlée** (l'arme principale) et le jeu de **jet ou de tir** (la première arme de jet ou de tir qui suit). */
export type JeuArmes = 'melee' | 'tir';

/** Le jeu d'armes gardé quand le joueur n'a pas choisi : la mêlée, sauf le rôdeur, qui démarre avec son arc. */
export const jeuArmesParDefaut = (classe: string): JeuArmes => (classe === 'rodeur' ? 'tir' : 'melee');

interface LigneKit {
  texte: string;
  quantite: number;
  arme?: Arme;
  munition: boolean;
}

function analyserKit(objets: string[], donnees: Donnees): { lignes: LigneKit[]; principale?: number; alternative?: number } {
  const armes = new Map<string, Arme>();
  for (const a of donnees.armes.values()) armes.set(normaliser(a.nom), a);
  const lignes: LigneKit[] = objets.map((texte) => {
    const brut = normaliser(texte.replace(/\(.*?\)/g, ''));
    const quantite = Number(/^(\d+) /.exec(brut)?.[1] ?? 1);
    const nom = brut.replace(/^\d+ /, '');
    const arme = [nom, nom.split(' ').map(singulier).join(' ')].map((v) => armes.get(v)).find(Boolean);
    return { texte, quantite, arme, munition: !arme && MUNITIONS.test(nom) };
  });
  const idx = lignes.flatMap((l, i) => (l.arme ? [i] : []));
  const principale = idx[0];
  const alternative = principale === undefined ? undefined : (idx.slice(1).find((i) => lignes[i]!.arme!.portees) ?? idx[1]);
  return { lignes, principale, alternative };
}

const aDesMunitions = (arme: Arme): boolean => arme.proprietes.some((p) => /munitions/i.test(p));

/**
 * Le kit allégé du jeu (décisions du 05/11 puis du 17/11/2026) : le SRD donne à chaque héros le kit de sa classe (3 à 8 objets) plus
 * celui de son historique (5 à 7 objets), un sac d'armes qui encombre le départ. Ici :
 * - le kit de **classe** garde son armure, son bouclier, ses outils et son paquetage, mais **un seul jeu d'armes** : l'arme principale
 *   (`melee`, par défaut) ou la première arme de jet ou de tir qui suit (`tir`, au choix du joueur) ; les munitions ne restent
 *   qu'avec une arme à munitions gardée (arc, arbalète) ;
 * - le kit d'**historique** ne donne plus d'armes ni de munitions (la lance et l'arc court du Soldat, les dagues du Criminel) ;
 * - le reste est perdu : **le prix des armes retirées n'est pas ajouté à l'or de départ** (décision du 17/11/2026 : la bourse de
 *   départ d'un groupe de 6 dépassait 240 po, de quoi tout acheter dans un village de départ).
 */
export function allegerKit(objets: string[], po: number, source: 'classe' | 'historique', donnees: Donnees, jeu: JeuArmes = 'melee'): { objets: string[]; po: number } {
  const { lignes, principale, alternative } = analyserKit(objets, donnees);
  const gardee = source === 'classe' ? (jeu === 'tir' && alternative !== undefined ? alternative : principale) : undefined;
  const avecMunitions = gardee !== undefined && aDesMunitions(lignes[gardee]!.arme!);
  const gardes = lignes.filter((l, i) => (l.arme ? i === gardee : !l.munition || avecMunitions));
  return { objets: gardes.map((l) => l.texte), po };
}

/** Les jeux d'armes qu'un kit de classe permet de choisir (vide s'il n'a qu'un jeu) : pour chacun, ses armes et ses munitions. */
export function jeuxDArmes(options: { id: string; objets: string[] }[], donnees: Donnees): { id: JeuArmes; armes: string[] }[] {
  const kit = options.find((o) => o.objets.length > 0);
  if (!kit) return [];
  const { lignes, principale, alternative } = analyserKit(kit.objets, donnees);
  if (principale === undefined || alternative === undefined) return [];
  const munitions = lignes.filter((l) => l.munition).map((l) => l.texte);
  const avec = (i: number) => (aDesMunitions(lignes[i]!.arme!) ? [lignes[i]!.texte, ...munitions] : [lignes[i]!.texte]);
  return [
    { id: 'melee', armes: avec(principale) },
    { id: 'tir', armes: avec(alternative) },
  ];
}

/**
 * Options d'équipement proposées pour une classe ou un historique : celles qui contiennent des objets (l'option « or » est
 * écartée), dans leur version allégée (`allegerKit`).
 */
export function optionsEquipement(options: { id: string; objets: string[]; po: number }[], source: 'classe' | 'historique', donnees: Donnees, jeu: JeuArmes = 'melee'): { id: string; objets: string[]; po: number }[] {
  return options.filter((o) => o.objets.length > 0).map((o) => ({ ...o, ...allegerKit(o.objets, o.po, source, donnees, jeu) }));
}

export function equipementChoisi(
  classeId: string,
  historiqueId: string,
  optionClasse: string | undefined,
  optionHistorique: string | undefined,
  donnees: Donnees,
  jeu?: JeuArmes,
): EquipementResolu | undefined {
  const classe = donnees.classes.get(classeId);
  const historique = donnees.historiques.get(historiqueId);
  if (!classe || !historique || !optionClasse) return undefined;
  const a = optionsEquipement(classe.equipementDepart, 'classe', donnees, jeu ?? jeuArmesParDefaut(classeId)).find((o) => o.id === optionClasse);
  if (!a) return undefined;
  const b = optionHistorique ? optionsEquipement(historique.equipementDepart, 'historique', donnees).find((o) => o.id === optionHistorique) : undefined;
  const resolu = resoudreObjets([...a.objets, ...(b?.objets ?? [])], donnees);
  return { ...resolu, po: a.po + (b?.po ?? 0) };
}
