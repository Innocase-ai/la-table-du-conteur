// Le registre des identifiants d'un monde : pour chaque entité qui peut être citée (lieu, PNJ, quête, fait, objet, fin…), qui
// la produit et qui la lit ; et, à l'inverse, ce qui est cité sans exister. Le pendant vivant du registre de la BIBLE (§ 7).
import type { Donnees } from './../donnees';
import type { IndexReferences, Site } from './references';
import type { DonneesMonde } from './schemas';

/** Le dossier d'une entité, et le genre de référence qui la désigne. */
const GENRE_DU_DOSSIER: Record<string, string> = { lieux: 'lieu', pnj: 'pnj', quetes: 'quete', faits: 'fait', objets: 'objet', rencontres: 'rencontre', fins: 'fin', jauges: 'jauge', factions: 'faction' };

export interface LigneRegistre {
  id: string;
  nom?: string;
  /** Combien de sites produisent / lisent cette entité. */
  produit: number;
  consomme: number;
}

export interface RefInconnue {
  genre: string;
  id: string;
  sites: Site[];
}

export interface Registre {
  /** Par dossier (`lieux`, `pnj`, `quetes`, `faits`, `objets`, `fins`, `rencontres`, `jauges`, `factions`) : une ligne par entité. */
  entites: Record<string, LigneRegistre[]>;
  /** Cité (condition, effet, lien…) mais inexistant : le validateur l'appelle « inconnu ». */
  inconnus: RefInconnue[];
}

const MAPS = (dm: DonneesMonde): Record<string, Map<string, { nom?: string }>> => ({
  lieux: dm.lieux, pnj: dm.pnj, quetes: dm.quetes, faits: dm.faits as Map<string, { nom?: string }>, objets: dm.objets, rencontres: dm.rencontres, fins: dm.fins, jauges: dm.jauges, factions: dm.factions,
});

export function registreIds(dm: DonneesMonde, idx: IndexReferences, srd?: Donnees): Registre {
  const maps = MAPS(dm);
  const entites: Record<string, LigneRegistre[]> = {};
  for (const [dossier, genre] of Object.entries(GENRE_DU_DOSSIER)) {
    const m = maps[dossier]!;
    entites[dossier] = [...m.entries()]
      .map(([id, e]) => ({ id, ...(e.nom ? { nom: e.nom } : {}), produit: idx.produit.get(`${genre}:${id}`)?.length ?? 0, consomme: idx.consomme.get(`${genre}:${id}`)?.length ?? 0 }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }
  const inconnus = new Map<string, RefInconnue>();
  const verifier = (cle: string, sites: Site[]) => {
    const i = cle.indexOf(':');
    const genre = cle.slice(0, i);
    const id = cle.slice(i + 1);
    const dossier = Object.entries(GENRE_DU_DOSSIER).find(([, g]) => g === genre)?.[0];
    if (!dossier || maps[dossier]!.has(id)) return;
    if (genre === 'objet' && srd && (srd.objets.has(id) || srd.armes.has(id) || srd.armures.has(id))) return;
    const r = inconnus.get(cle) ?? inconnus.set(cle, { genre, id, sites: [] }).get(cle)!;
    r.sites.push(...sites);
  };
  for (const [cle, sites] of idx.consomme) verifier(cle, sites);
  for (const [cle, sites] of idx.produit) verifier(cle, sites);
  return { entites, inconnus: [...inconnus.values()].sort((a, b) => a.genre.localeCompare(b.genre) || a.id.localeCompare(b.id)) };
}

/** Les identifiants promis par la BIBLE (§ 7) mais qui n'existent nulle part dans les données (ni entité, ni drapeau cité). */
export function promisMaisAbsents(idsBible: ReadonlySet<string>, dm: DonneesMonde, idx: IndexReferences): string[] {
  const connus = new Set<string>();
  const maps = MAPS(dm);
  for (const m of Object.values(maps)) for (const id of m.keys()) connus.add(id);
  for (const m of [dm.tresors, dm.tables, dm.pieges, dm.enigmes, dm.evenements]) for (const id of m.keys()) connus.add(id);
  for (const cle of [...idx.produit.keys(), ...idx.consomme.keys()]) connus.add(cle.slice(cle.indexOf(':') + 1));
  return [...idsBible].filter((id) => !connus.has(id)).sort();
}
