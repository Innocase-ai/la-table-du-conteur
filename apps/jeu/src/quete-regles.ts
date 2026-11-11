// Le retour visuel d'une quête : repérer les quêtes qui viennent de commencer (bouton « Accepter », parole de PNJ, événement), de
// se terminer ou d'échouer, et préparer ce que le parchemin raconte. Sans React, testé avec le vrai moteur (`quete-regles.test.ts`).
import { recompensesDeQuete, type DonneesMonde, type EtatMonde } from '@crpg/regles';

type EtatQuetes = EtatMonde['quetes'];

/** Ce qui vient d'arriver à une quête : elle commence, elle est accomplie, ou elle est perdue. */
export type GenreParchemin = 'debut' | 'fin' | 'echec';

export interface ChangementQuete {
  id: string;
  genre: GenreParchemin;
}

/**
 * Les quêtes dont le sort vient de changer entre deux états de la partie. Une quête qui commence et finit dans la même action
 * (récompense immédiate) n'est annoncée que comme terminée.
 */
export function changementsDeQuetes(avant: EtatQuetes, apres: EtatQuetes): ChangementQuete[] {
  const res: ChangementQuete[] = [];
  for (const [id, q] of Object.entries(apres)) {
    const a = avant[id];
    if (q.statut === 'terminee' && a?.statut !== 'terminee') res.push({ id, genre: 'fin' });
    else if (q.statut === 'echouee' && a?.statut !== 'echouee') res.push({ id, genre: 'echec' });
    else if (q.statut === 'active' && (!a || a.statut === 'proposee')) res.push({ id, genre: 'debut' });
  }
  return res;
}

/** Les quêtes qui viennent de devenir « en cours » : absentes ou seulement proposées avant, actives maintenant. */
export function nouvellesQuetes(avant: EtatQuetes, apres: EtatQuetes): string[] {
  return changementsDeQuetes(avant, apres).filter((c) => c.genre === 'debut').map((c) => c.id);
}

const TYPES: Record<string, string> = { principale: 'Quête principale', secondaire: 'Quête secondaire', personnelle: 'Quête personnelle', faction: 'Quête de faction' };

export interface ParcheminQuete {
  id: string;
  genre: GenreParchemin;
  type: 'principale' | 'secondaire' | 'personnelle' | 'faction';
  /** « Quête secondaire », ou « Quête accomplie » / « Quête échouée » quand elle se termine. */
  rubrique: string;
  nom: string;
  /** Qui la donne et où (phrase courte), s'il y en a un. */
  origine?: string;
  /** Id du PNJ qui la donne, pour son portrait. */
  donneur?: string;
  /** L'explication de la quête, telle que le journal la raconte. */
  explication: string;
  /** Le premier objectif (au début d'une quête). */
  objectif?: string;
  /** Les récompenses en clair (PX, or, objets) : promises au début, reçues à la fin, absentes d'un échec. */
  recompenses: string[];
  niveaux: string;
}

/** Ce que le parchemin raconte d'une quête, d'après le monde (aucun secret : jamais les ramifications ni les conditions). */
export function parcheminDeQuete(
  dm: DonneesMonde,
  id: string,
  genre: GenreParchemin = 'debut',
  nomObjet: (id: string) => string = (x) => dm.objets.get(x)?.nom ?? x,
): ParcheminQuete | undefined {
  const q = dm.quetes.get(id);
  if (!q) return undefined;
  const donneur = q.donneur ? dm.pnj.get(q.donneur) : undefined;
  const lieu = q.lieu ? dm.lieux.get(q.lieu) : donneur ? dm.lieux.get(donneur.lieu) : undefined;
  // Le rôle d'un PNJ est une phrase d'auteur (« Aubergiste : elle sait tout… ») : on n'en garde que le métier, avant les deux points.
  const metier = donneur?.titre ?? donneur?.role.split(/\s*:\s*/)[0];
  const origine = donneur ? `${donneur.nom}${metier ? `, ${metier}` : ''}${lieu ? ` — ${lieu.nom}` : ''}` : lieu ? lieu.nom : undefined;
  const objectif = genre === 'debut' ? q.etapes.find((e) => e.id === q.debut)?.texte : undefined;
  // Tout ce que la quête rapporte : ses récompenses et ce que donnent ses étapes (PX, or, objets), plus ce que le donneur promet.
  const total = recompensesDeQuete(q);
  const recompenses =
    genre === 'echec'
      ? []
      : [total.xp ? `${total.xp} PX` : '', total.pieces ? `${total.pieces} po` : '', ...total.objets.map(nomObjet), total.annonce ?? ''].filter(Boolean);
  return {
    id,
    genre,
    type: q.type,
    rubrique: genre === 'fin' ? 'Quête accomplie' : genre === 'echec' ? 'Quête échouée' : (TYPES[q.type] ?? 'Quête'),
    nom: q.nom,
    ...(origine ? { origine } : {}),
    ...(donneur ? { donneur: donneur.id } : {}),
    explication: genre === 'echec' && q.echec?.texte ? q.echec.texte : q.resume,
    ...(objectif ? { objectif } : {}),
    recompenses,
    niveaux: q.niveau.min === q.niveau.max ? `niveau ${q.niveau.min}` : `niveaux ${q.niveau.min} à ${q.niveau.max}`,
  };
}
