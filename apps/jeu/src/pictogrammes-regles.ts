// Quelle icône pour quelle carte (pur : testé dans `pictogrammes.test.ts`).
import { DESSINS } from './pictogrammes';

/** Le SRD français appelle « invocation » l'école que les autres éditions appellent conjuration. */
const SYNONYMES_ECOLES: Record<string, string> = { invocation: 'conjuration' };

/** « évocation » → « evocation » : la clé d'une école de magie dans les dessins. */
export function cleEcole(ecole: string | undefined): string | undefined {
  if (!ecole) return undefined;
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
