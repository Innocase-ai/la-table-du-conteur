// Ce qu'un objet du catalogue dit de lui-même, en quelques lignes : dégâts d'une arme, CA d'une armure, effet d'un consommable,
// bonus magiques. Sert la vitrine d'un marchand (module Commerce) : le joueur voit ce qu'il achète avant de payer. Pur : rien
// d'autre que le catalogue (SRD + monde) et la liste des objets déjà identifiés.
import type { ContexteJeu } from '../noyau/types';
import { objetDe } from './catalogue';

export interface CaracteristiqueObjet {
  libelle: string;
  valeur: string;
}

export interface ResumeObjet {
  /** Le nom montré au joueur : celui d'un objet magique non identifié reste mystérieux. */
  nom: string;
  resume: string;
  /** Dégâts, CA, propriétés, effet, bonus : les lignes de la fiche, dans l'ordre. */
  proprietes: CaracteristiqueObjet[];
  /** Un objet à identifier : on n'en dit que ce que son étiquette « inconnu » laisse voir. */
  inconnu: boolean;
}

const signe = (n: number) => `${n > 0 ? '+' : ''}${n}`;

/** Le résumé d'un objet vu par le joueur ; `identifies` : les objets déjà étudiés (un objet magique à identifier garde son mystère). */
export function resumeObjet(ctx: ContexteJeu, id: string, identifies: readonly string[] = []): ResumeObjet {
  const o = objetDe(ctx, id);
  const aIdentifier = !!o.identification && !identifies.includes(o.id);
  if (aIdentifier) {
    return { nom: o.inconnu?.nom ?? o.nom, resume: o.inconnu?.resume ?? o.resume, proprietes: [{ libelle: 'À étudier', valeur: `Arcanes, DD ${o.identification}` }], inconnu: true };
  }
  const proprietes: CaracteristiqueObjet[] = [];
  const base = o.base ?? o.id;
  const arme = o.categorie === 'arme' ? ctx.srd?.armes.get(base) : undefined;
  const armure = o.categorie === 'armure' || o.categorie === 'bouclier' ? ctx.srd?.armures.get(base) : undefined;
  if (arme) {
    proprietes.push({ libelle: 'Dégâts', valeur: `${arme.degats} ${arme.typeDegats}` });
    if (arme.proprietes.length) proprietes.push({ libelle: 'Propriétés', valeur: arme.proprietes.join(', ') });
    if (arme.portees) proprietes.push({ libelle: 'Portée', valeur: `${arme.portees[0]} / ${arme.portees[1]} m` });
  }
  if (armure) {
    const bouclier = armure.categorie === 'bouclier';
    proprietes.push({ libelle: bouclier ? 'CA' : 'CA de base', valeur: bouclier ? `+${armure.ca}` : `${armure.ca}${armure.dex === 'complet' ? ' + Dex' : armure.dex === 'max2' ? ' + Dex (2 au plus)' : ''}` });
    if (armure.forceMin) proprietes.push({ libelle: 'Force min.', valeur: String(armure.forceMin) });
    if (armure.desavantageDiscretion) proprietes.push({ libelle: 'Discrétion', valeur: 'désavantage' });
  }
  const u = o.usage;
  if (u) proprietes.push({ libelle: { consommable: 'Consommable', charges: 'À charges', permanent: 'Effet permanent' }[u.type], valeur: u.soins ? `soigne ${u.soins}` : (u.resume ?? '—') });
  if (u?.sorts?.length) proprietes.push({ libelle: 'Sorts', valeur: u.sorts.map((s) => ctx.srd?.sorts.get(s.sort)?.nom ?? s.sort).join(', ') });
  const b = o.bonus;
  const bonus = b ? [b.attaque && `${signe(b.attaque)} attaque`, b.degats && `${signe(b.degats)} dégâts`, b.ca && `${signe(b.ca)} CA`].filter(Boolean).join(', ') : '';
  if (bonus) proprietes.push({ libelle: 'Bonus', valeur: bonus });
  if (o.attunement) proprietes.push({ libelle: 'Harmonisation', valeur: 'requise' });
  return { nom: o.nom, resume: o.resume, proprietes, inconnu: false };
}
