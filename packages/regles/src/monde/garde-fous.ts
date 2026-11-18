// Garde-fous du validateur pour les futurs épisodes (audit du moteur du 18/11/2026, M22) : ce que les auteurs risquent d'écrire et que le
// validateur laissait passer. Ce sont des avis (jamais des erreurs : un faux positif se rejette dans `revue.json`), sauf la cible inexistante
// d'un `debloquer`, qui est une erreur (references.ts).
import type { Condition, DonneesMonde } from './schemas';

const stable = (c: unknown): string =>
  JSON.stringify(c, (_k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))) : v));

/** Ce qui rend une condition impossible à remplir, sans rien jouer : jauge hors de ses bornes, niveau hors du monde, une chose et son contraire. */
export function conditionsImpossibles(c: Condition, dm: DonneesMonde): string[] {
  const res: string[] = [];
  const visiter = (x: Condition): void => {
    if ('jauge' in x) {
      const j = dm.jauges.get(x.jauge.id);
      if (j && x.jauge.min !== undefined && x.jauge.min > j.max) res.push(`la jauge « ${j.id} » est exigée à ${x.jauge.min} au moins, son maximum est ${j.max}`);
      if (j && x.jauge.max !== undefined && x.jauge.max < j.min) res.push(`la jauge « ${j.id} » est exigée à ${x.jauge.max} au plus, son minimum est ${j.min}`);
    } else if ('niveauGroupe' in x) {
      const { min, max } = dm.monde.niveaux;
      if (x.niveauGroupe.min !== undefined && x.niveauGroupe.min > max) res.push(`le niveau du groupe est exigé à ${x.niveauGroupe.min} au moins, le monde s'arrête au niveau ${max}`);
      if (x.niveauGroupe.max !== undefined && x.niveauGroupe.max < min) res.push(`le niveau du groupe est exigé à ${x.niveauGroupe.max} au plus, le monde commence au niveau ${min}`);
    } else if ('non' in x) visiter(x.non);
    else if ('et' in x) {
      const vues = new Set(x.et.map(stable));
      for (const y of x.et) if ('non' in y && vues.has(stable(y.non))) res.push('un `et` exige une chose et son contraire');
      x.et.forEach(visiter);
    } else if ('ou' in x) x.ou.forEach(visiter);
  };
  visiter(c);
  return res;
}

/**
 * Cette condition peut-elle être vraie alors que la quête n'est pas active ? Les atomes qui nomment la quête (statut ou étape) sont faux ;
 * tout le reste (drapeau, fait, objet…) peut être vrai ou faux au gré du joueur. Un passage n'est protégé par la quête que si la réponse est non.
 */
export function ouvrableSansQuete(c: Condition, quete: string): boolean {
  const nomme = (x: Condition): boolean => ('quete' in x && x.quete.id === quete) || ('etape' in x && x.etape.quete === quete);
  const peutEtreVrai = (x: Condition): boolean => {
    if (nomme(x)) return false;
    if ('non' in x) return peutEtreFaux(x.non);
    if ('et' in x) return x.et.every(peutEtreVrai);
    if ('ou' in x) return x.ou.some(peutEtreVrai);
    return true;
  };
  const peutEtreFaux = (x: Condition): boolean => {
    if (nomme(x)) return true;
    if ('non' in x) return peutEtreVrai(x.non);
    if ('et' in x) return x.et.some(peutEtreFaux);
    if ('ou' in x) return x.ou.every(peutEtreFaux);
    return true;
  };
  return peutEtreVrai(c);
}

/**
 * Les lieux d'où l'on ne peut revenir à aucun lieu sûr (où l'on dort, ou le départ) par les sorties que le moteur propose : liens (à double sens
 * en face aussi), sortie vers le parent, accès aux enfants. Les conditions, cachettes et verrous sont ignorés : on cherche une impasse de structure.
 */
export function lieuxSansRetour(dm: DonneesMonde): string[] {
  const sorties = new Map<string, Set<string>>();
  const ajouter = (de: string, vers: string) => {
    if (!dm.lieux.has(de) || !dm.lieux.has(vers)) return;
    (sorties.get(de) ?? sorties.set(de, new Set()).get(de)!).add(vers);
  };
  for (const l of dm.lieux.values()) {
    if (l.parent) {
      ajouter(l.id, l.parent);
      ajouter(l.parent, l.id);
    }
    for (const lien of l.liens) {
      ajouter(l.id, lien.vers);
      if (lien.sens === 'double') ajouter(lien.vers, l.id);
    }
  }
  // On remonte les sorties à partir des lieux sûrs : ce qui n'est pas atteint n'a aucun chemin de retour.
  const arrivees = new Map<string, Set<string>>();
  for (const [de, vers] of sorties) for (const v of vers) (arrivees.get(v) ?? arrivees.set(v, new Set()).get(v)!).add(de);
  const sains = new Set<string>([dm.monde.depart.lieu, ...[...dm.lieux.values()].filter((l) => l.repos === 'sur').map((l) => l.id)].filter((id) => dm.lieux.has(id)));
  const file = [...sains];
  while (file.length) for (const avant of arrivees.get(file.shift()!) ?? []) if (!sains.has(avant)) (sains.add(avant), file.push(avant));
  return [...dm.lieux.keys()].filter((id) => !sains.has(id));
}
