// Équipement de départ : les listes du SRD sont du texte (« 8 javelines », « Cotte de mailles »).
// On retrouve les armes et armures des données ; le reste (paquetages, focaliseurs…) est conservé tel quel.
import type { Donnees } from '../donnees';
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

/** Options d'équipement proposées pour une classe ou un historique : celles qui contiennent des objets (l'option « or » est écartée). */
export function optionsEquipement(options: { id: string; objets: string[]; po: number }[]): { id: string; objets: string[]; po: number }[] {
  return options.filter((o) => o.objets.length > 0);
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
  const a = optionsEquipement(classe.equipementDepart).find((o) => o.id === optionClasse);
  if (!a) return undefined;
  const b = optionHistorique ? optionsEquipement(historique.equipementDepart).find((o) => o.id === optionHistorique) : undefined;
  const resolu = resoudreObjets([...a.objets, ...(b?.objets ?? [])], donnees);
  return { ...resolu, po: a.po + (b?.po ?? 0) };
}
