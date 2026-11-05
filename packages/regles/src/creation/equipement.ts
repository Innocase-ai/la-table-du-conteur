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

/**
 * Le kit allégé du jeu (décision du 05/11/2026) : le SRD donne à chaque héros le kit de sa classe (3 à 8 objets) plus celui de
 * son historique (5 à 7 objets), un sac d'armes qui encombre le départ. Ici :
 * - le kit de **classe** garde son armure, son bouclier, ses outils et son paquetage, mais **deux armes** au plus : la
 *   première (l'arme principale) et la première arme de jet ou de tir qui suit (javelines, hachettes, arc), sinon la
 *   deuxième ; les munitions ne restent qu'avec une arme de jet ou de tir gardée ;
 * - le kit d'**historique** ne donne plus d'armes ni de munitions (la lance et l'arc court du Soldat, les dagues du Criminel) ;
 * - le reste est **à acheter** : le prix des armes retirées est ajouté à l'or de départ.
 */
export function allegerKit(objets: string[], po: number, source: 'classe' | 'historique', donnees: Donnees): { objets: string[]; po: number } {
  const armes = new Map<string, Arme>();
  for (const a of donnees.armes.values()) armes.set(normaliser(a.nom), a);
  const lignes = objets.map((texte) => {
    const brut = normaliser(texte.replace(/\(.*?\)/g, ''));
    const quantite = Number(/^(\d+) /.exec(brut)?.[1] ?? 1);
    const nom = brut.replace(/^\d+ /, '');
    const arme = [nom, nom.split(' ').map(singulier).join(' ')].map((v) => armes.get(v)).find(Boolean);
    return { texte, quantite, arme, munition: !arme && MUNITIONS.test(nom) };
  });
  const gardees = new Set<number>();
  if (source === 'classe') {
    const idx = lignes.flatMap((l, i) => (l.arme ? [i] : []));
    const principale = idx[0];
    if (principale !== undefined) {
      gardees.add(principale);
      const secondaire = idx.slice(1).find((i) => lignes[i]!.arme!.portees) ?? idx[1];
      if (secondaire !== undefined) gardees.add(secondaire);
    }
  }
  const tirOuJet = [...gardees].some((i) => lignes[i]!.arme!.portees);
  let retire = 0;
  const gardes = lignes.filter((l, i) => {
    if (l.arme) {
      const garde = gardees.has(i);
      if (!garde) retire += (l.arme.prixPo ?? 0) * l.quantite;
      return garde;
    }
    return !l.munition || (source === 'classe' && tirOuJet);
  });
  return { objets: gardes.map((l) => l.texte), po: po + Math.round(retire * 10) / 10 };
}

/**
 * Options d'équipement proposées pour une classe ou un historique : celles qui contiennent des objets (l'option « or » est
 * écartée), dans leur version allégée (`allegerKit`).
 */
export function optionsEquipement(options: { id: string; objets: string[]; po: number }[], source: 'classe' | 'historique', donnees: Donnees): { id: string; objets: string[]; po: number }[] {
  return options.filter((o) => o.objets.length > 0).map((o) => ({ ...o, ...allegerKit(o.objets, o.po, source, donnees) }));
}

export function equipementChoisi(
  classeId: string,
  historiqueId: string,
  optionClasse: string | undefined,
  optionHistorique: string | undefined,
  donnees: Donnees,
): EquipementResolu | undefined {
  const classe = donnees.classes.get(classeId);
  const historique = donnees.historiques.get(historiqueId);
  if (!classe || !historique || !optionClasse) return undefined;
  const a = optionsEquipement(classe.equipementDepart, 'classe', donnees).find((o) => o.id === optionClasse);
  if (!a) return undefined;
  const b = optionHistorique ? optionsEquipement(historique.equipementDepart, 'historique', donnees).find((o) => o.id === optionHistorique) : undefined;
  const resolu = resoudreObjets([...a.objets, ...(b?.objets ?? [])], donnees);
  return { ...resolu, po: a.po + (b?.po ?? 0) };
}
