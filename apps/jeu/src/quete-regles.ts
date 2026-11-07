// Le retour visuel d'une quête acceptée : repérer les quêtes qui viennent de passer « en cours » (bouton « Accepter », mais
// aussi une parole de PNJ ou un événement qui la lancent) et préparer ce que le parchemin raconte. Sans React, testé avec le
// vrai moteur (`quete-regles.test.ts`).
import type { DonneesMonde, EtatMonde } from '@crpg/regles';

type EtatQuetes = EtatMonde['quetes'];

/** Les quêtes qui viennent de devenir « en cours » : absentes ou seulement proposées avant, actives maintenant. */
export function nouvellesQuetes(avant: EtatQuetes, apres: EtatQuetes): string[] {
  return Object.entries(apres)
    .filter(([id, q]) => q.statut === 'active' && (!avant[id] || avant[id]!.statut === 'proposee'))
    .map(([id]) => id);
}

const TYPES: Record<string, string> = { principale: 'Quête principale', secondaire: 'Quête secondaire', personnelle: 'Quête personnelle', faction: 'Quête de faction' };

export interface ParcheminQuete {
  id: string;
  type: 'principale' | 'secondaire' | 'personnelle' | 'faction';
  rubrique: string;
  nom: string;
  /** Qui la donne et où (phrase courte), s'il y en a un. */
  origine?: string;
  /** Id du PNJ qui la donne, pour son portrait. */
  donneur?: string;
  /** L'explication de la quête, telle que le journal la raconte. */
  explication: string;
  /** Le premier objectif. */
  objectif?: string;
  /** Les récompenses en clair (PX, or, objets). */
  recompenses: string[];
  niveaux: string;
}

/** Ce que le parchemin raconte d'une quête, d'après le monde (aucun secret : jamais les ramifications ni les conditions). */
export function parcheminDeQuete(dm: DonneesMonde, id: string, nomObjet: (id: string) => string = (x) => dm.objets.get(x)?.nom ?? x): ParcheminQuete | undefined {
  const q = dm.quetes.get(id);
  if (!q) return undefined;
  const donneur = q.donneur ? dm.pnj.get(q.donneur) : undefined;
  const lieu = q.lieu ? dm.lieux.get(q.lieu) : donneur ? dm.lieux.get(donneur.lieu) : undefined;
  // Le rôle d'un PNJ est une phrase d'auteur (« Aubergiste : elle sait tout… ») : on n'en garde que le métier, avant les deux points.
  const metier = donneur?.titre ?? donneur?.role.split(/s*:s*/)[0];
  const origine = donneur ? `${donneur.nom}${metier ? `, ${metier}` : ''}${lieu ? ` — ${lieu.nom}` : ''}` : lieu ? lieu.nom : undefined;
  const objectif = q.etapes.find((e) => e.id === q.debut)?.texte;
  const recompenses = [
    q.recompenses.xp ? `${q.recompenses.xp} PX` : '',
    q.recompenses.pieces ? `${q.recompenses.pieces} po` : '',
    ...q.recompenses.objets.map(nomObjet),
  ].filter(Boolean);
  return {
    id,
    type: q.type,
    rubrique: TYPES[q.type] ?? 'Quête',
    nom: q.nom,
    ...(origine ? { origine } : {}),
    ...(donneur ? { donneur: donneur.id } : {}),
    explication: q.resume,
    ...(objectif ? { objectif } : {}),
    recompenses,
    niveaux: q.niveau.min === q.niveau.max ? `niveau ${q.niveau.min}` : `niveaux ${q.niveau.min} à ${q.niveau.max}`,
  };
}

