// La vitrine d'un marchand : qui, dans le groupe, pourrait porter un article, et à quel prix pour sa CA. Aucune règle ici : tout
// vient du moteur (`infoEquipement`, `placer` via `casesPour`, `maitriseArme`, formation aux armures de la fiche). Fichier pur.
import { infoEquipement, maitriseArme, type ContexteJeu, type Personnage } from '@crpg/regles';
import { casesPour, texteCa } from '../equipement-regles';

export type EtatPort = 'oui' | 'sans-formation' | 'non';

export interface PorteurPossible {
  heros: string;
  nom: string;
  /** `oui` : il peut le porter ; `sans-formation` : il le peut, mais sans formation ou sans maîtrise (pénalités du SRD) ; `non` : les règles l'en empêchent. */
  etat: EtatPort;
  /** Une phrase courte : « CA 15 → 17 », « sans maîtrise : pas de bonus de maîtrise », ou le motif du refus. */
  detail?: string;
  /** Une armure ou un bouclier qui ferait monter sa CA. */
  ameliore: boolean;
}

export interface Compatibilite {
  /** Faux pour un objet qui ne s'équipe pas (potion, clé, curiosité) : la vitrine n'affiche alors aucune ligne de compatibilité. */
  equipable: boolean;
  genre?: 'armure' | 'bouclier' | 'arme' | 'porte';
  heros: PorteurPossible[];
}

const NOMS_CATEGORIES: Record<string, string> = { legere: 'armures légères', intermediaire: 'armures intermédiaires', lourde: 'armures lourdes', bouclier: 'boucliers' };

/** Pour chaque héros du groupe : peut-il porter cet article ? Les cases, le refus éventuel et la CA viennent du moteur. */
export function compatibilite(ctx: ContexteJeu, groupe: Personnage[], objet: string): Compatibilite {
  const info = infoEquipement(ctx, objet);
  if (!info) return { equipable: false, heros: [] };
  const arme = info.genre === 'arme' ? ctx.srd?.armes.get(info.base!) : undefined;
  const armure = info.genre === 'armure' || info.genre === 'bouclier' ? ctx.srd?.armures.get(info.base!) : undefined;
  const heros = groupe.map((h): PorteurPossible => {
    const cases = Object.values(casesPour(ctx, h, objet));
    const libre = cases.find((c) => !c!.refus);
    if (!libre) return { heros: h.id, nom: h.nom, etat: 'non', detail: cases.find((c) => c!.refus)?.refus, ameliore: false };
    if (armure && !h.fiche.formationArmures.includes(armure.categorie)) {
      return { heros: h.id, nom: h.nom, etat: 'sans-formation', detail: `non formé aux ${NOMS_CATEGORIES[armure.categorie] ?? armure.categorie} : désavantage, pas d'incantation`, ameliore: false };
    }
    if (arme && !maitriseArme(h.fiche, arme)) return { heros: h.id, nom: h.nom, etat: 'sans-formation', detail: 'sans maîtrise : pas de bonus de maîtrise à l’attaque', ameliore: false };
    const ameliore = !!armure && libre.ca.apres > libre.ca.avant;
    return { heros: h.id, nom: h.nom, etat: 'oui', detail: armure ? texteCa(libre.ca) : undefined, ameliore };
  });
  return { equipable: true, genre: info.genre, heros };
}

/** Une phrase pour l'infobulle ou le résumé : « Peut le porter : Hilda, Pip. » */
export function resumeCompatibilite(c: Compatibilite): string {
  if (!c.equipable) return '';
  const oui = c.heros.filter((h) => h.etat === 'oui').map((h) => h.nom);
  const demi = c.heros.filter((h) => h.etat === 'sans-formation').map((h) => h.nom);
  if (!oui.length && !demi.length) return 'Personne du groupe ne peut le porter.';
  return [oui.length ? `Peut le porter : ${oui.join(', ')}.` : '', demi.length ? `Sans formation : ${demi.join(', ')}.` : ''].filter(Boolean).join(' ');
}
