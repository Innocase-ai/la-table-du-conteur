// Quelle icône pour quelle carte (pur : testé dans `pictogrammes.test.ts`).
import type { Sort } from '@crpg/regles';
import { DESSINS } from './pictogrammes';

/** Le SRD français appelle « invocation » l'école que les autres éditions appellent conjuration. */
const SYNONYMES_ECOLES: Record<string, string> = { invocation: 'conjuration' };

/** « évocation » → « evocation » : la clé d'une école de magie dans les dessins. */
export function cleEcole(ecole: string | undefined): string | undefined {
  if (!ecole) return undefined;
  // Déjà une clé de dessin (motif d'un sort, voir `cleDeSort`).
  if (ecole.startsWith('motif:') || ecole.startsWith('ecole:')) return ecole in DESSINS ? ecole : undefined;
  const nom = ecole.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const k = `ecole:${SYNONYMES_ECOLES[nom] ?? nom}`;
  return k in DESSINS ? k : undefined;
}

/** L'arme d'une carte d'attaque (`epee-longue`, `dague-lancer`, `arc-court`…) : son dessin et si elle est lancée. */
export function armeDeCarte(reste: string): { cle: string; lancer: boolean } {
  const lancer = reste.endsWith('-lancer');
  const id = reste.replace(/-lancer$/, '');
  const a = (...mots: string[]) => mots.some((m) => id.includes(m));
  const cle =
    id.startsWith('arc') || id.startsWith('arbalete') || a('fronde')
      ? 'arme:arc'
      : a('rapiere')
        ? 'arme:rapiere'
        : a('dague')
          ? 'arme:dague'
          : a('hachette')
            ? 'arme:hachette'
            : a('hache')
              ? 'arme:hache'
              : a('masse', 'marteau', 'fleau', 'morgenstern')
                ? 'arme:masse'
                : a('baton', 'massue', 'gourdin')
                  ? 'arme:baton'
                  : a('javeline', 'lance', 'pique', 'trident')
                    ? 'arme:javeline'
                    : a('epee-courte')
                      ? 'arme:epee-courte'
                      : a('cimeterre')
                        ? 'arme:cimeterre'
                        : 'arme:epee';
  return { cle, lancer };
}

/** Le motif d'un type de dégâts. */
const MOTIF_DEGATS: Record<string, string> = {
  feu: 'feu', froid: 'froid', foudre: 'foudre', tonnerre: 'tonnerre', acide: 'acide', poison: 'poison', 'nécrotique': 'necrotique',
  radiant: 'radiant', force: 'force', psychique: 'psychique', tranchant: 'physique', contondant: 'physique', perforant: 'physique',
};

/**
 * La clé du dessin d'un sort, du plus précis au plus général : son propre dessin (`sort:<id>`), le motif de ses dégâts (feu,
 * froid…), le motif de soin, puis le symbole de son école de magie. Jamais le dessin par défaut.
 */
export function cleDeSort(s: Pick<Sort, 'id' | 'ecole' | 'degats' | 'soins'>): string {
  if (`sort:${s.id}` in DESSINS) return `sort:${s.id}`;
  const type = s.degats[0]?.type;
  const motif = type ? MOTIF_DEGATS[type] : undefined;
  if (motif && `motif:${motif}` in DESSINS) return `motif:${motif}`;
  if (s.soins) return 'motif:soin';
  return cleEcole(s.ecole) ?? 'aptitude:defaut';
}

export interface CarteIcone {
  id: string;
  categorie: 'attaque' | 'sort' | 'aptitude' | 'base' | 'elan' | 'monstre';
}

/** La clé du dessin d'une carte, et si l'arme est lancée. Un sort sans dessin prend celui de son école, sinon un symbole d'aptitude. */
export function cleDeCarte(k: CarteIcone, ecole?: string): { cle: string; lancer: boolean } {
  const reste = k.id.slice(k.id.indexOf(':') + 1);
  const connu = (cle: string) => (cle in DESSINS ? cle : undefined);
  switch (k.categorie) {
    case 'sort':
      return { cle: connu(`sort:${reste}`) ?? cleEcole(ecole) ?? 'aptitude:defaut', lancer: false };
    case 'attaque':
      return armeDeCarte(reste);
    case 'monstre':
      return {
        cle:
          connu(`monstre:${reste}`) ??
          (reste.includes('arc') ? 'arme:arc' : reste.includes('cimeterre') ? 'arme:cimeterre' : reste.includes('fuite') ? 'base:foncer' : 'monstre:attaques-multiples'),
        lancer: false,
      };
    case 'base':
      return { cle: connu(`base:${reste}`) ?? 'aptitude:defaut', lancer: false };
    case 'aptitude':
      return {
        cle:
          connu(`aptitude:${reste}`) ??
          (reste === 'ruse-foncer' ? 'base:foncer' : reste === 'ruse-desengager' ? 'base:desengager' : reste === 'temerite' || reste === 'fougue' ? 'aptitude:rage' : 'aptitude:defaut'),
        lancer: false,
      };
    default:
      return { cle: 'cout:elan', lancer: false };
  }
}
