// Règles pures de la main de cartes du combat : les sections, les touches 1 à 9, les pastilles de chiffres d'une carte et
// la phrase d'aperçu face à une cible. Sans React : testé à part (`main-cartes-regles.test.ts`).
import type { ApercuCarte, Carte } from '@crpg/regles';
import { NOMS_CARAC } from './createur/libelles';
import { formatMetres, ORDRE_CATEGORIES } from './libelles';
import { cleDegats } from './pictogrammes-regles';

export const TITRES_SECTIONS: Record<Carte['categorie'], string> = {
  elan: 'Élan',
  attaque: 'Attaques',
  monstre: 'Actions',
  sort: 'Sorts',
  aptitude: 'Aptitudes',
  base: 'Actions de base',
};

export type IdSection = Carte['categorie'] | 'indisponibles';

export interface SectionMain {
  id: IdSection;
  titre: string;
  cartes: Carte[];
}

/** Une carte que seule la distance empêche (« Aucune cible à portée ») : elle reste à sa place, atténuée, pour qu'on voie son épée et qu'on comprenne qu'il faut s'approcher. */
export const horsDePortee = (k: Carte): boolean => !k.jouable && !!k.raison?.startsWith('Aucune cible');

/** Les cartes jouables (et celles hors de portée) rangées par catégorie, puis une dernière section « Indisponibles » (coût déjà payé, plus d'emplacement…). */
export function sectionsDeMain(cartes: Carte[]): SectionMain[] {
  const rang = (k: Carte) => ORDRE_CATEGORIES.indexOf(k.categorie);
  const triees = [...cartes].sort((a, b) => rang(a) - rang(b));
  const enPlace = (k: Carte) => k.jouable || horsDePortee(k);
  const sections: SectionMain[] = ORDRE_CATEGORIES.map((categorie) => ({ id: categorie, titre: TITRES_SECTIONS[categorie], cartes: triees.filter((k) => k.categorie === categorie && enPlace(k)) })).filter((s) => s.cartes.length);
  const indisponibles = triees.filter((k) => !enPlace(k));
  if (indisponibles.length) sections.push({ id: 'indisponibles', titre: 'Indisponibles', cartes: indisponibles });
  return sections;
}

/** Les sections repliées au départ : « Indisponibles » seulement. */
export const REPLIEES_PAR_DEFAUT: IdSection[] = ['indisponibles'];

/** Les touches 1 à 9 : les cartes jouables visibles (section non repliée), dans l'ordre où elles s'affichent. */
export function touchesDeCartes(sections: SectionMain[], repliees: ReadonlySet<string>): Map<string, number> {
  const res = new Map<string, number>();
  for (const s of sections) {
    if (s.id === 'indisponibles' || repliees.has(s.id)) continue;
    for (const k of s.cartes) if (k.jouable && res.size < 9) res.set(k.id, res.size + 1);
  }
  return res;
}

/** La carte qu'une touche désigne (« 3 » → la 3e carte jouable affichée) ; rien pour une autre touche. */
export function carteDeTouche(touche: string, numeros: ReadonlyMap<string, number>): string | undefined {
  const n = Number(touche);
  if (!Number.isInteger(n) || n < 1 || n > 9) return undefined;
  return [...numeros].find(([, num]) => num === n)?.[0];
}

export interface Pastille {
  id: string;
  texte: string;
  genre: 'attaque' | 'degats' | 'dd' | 'portee';
  /** La clé du pictogramme (motif d'un type de dégâts). */
  cle?: string;
  titre: string;
}

const FORMES: Record<string, string> = { cone: 'cône', sphere: 'sphère', cube: 'cube', ligne: 'ligne', cylindre: 'cylindre', emanation: 'émanation' };

const signe = (n: number) => (n >= 0 ? `+${n}` : String(n));
const decimal = (n: number) => String(n).replace('.', ',');

/** Les chiffres d'une carte en pastilles : « +5 », « DD 13 Dex », « 2d6+3 » (avec le motif du type de dégâts), « 1,5 m », « ×3 cibles ». */
export function pastillesDeCarte(k: Carte): Pastille[] {
  const res: Pastille[] = [];
  const s = k.stats;
  if (s?.attaque !== undefined) res.push({ id: 'attaque', texte: signe(s.attaque), genre: 'attaque', titre: "Bonus au jet d'attaque" });
  if (s?.sauvegarde) res.push({ id: 'dd', texte: `DD ${s.sauvegarde.dd} ${NOMS_CARAC[s.sauvegarde.caracteristique].slice(0, 3)}`, genre: 'dd', titre: `Sauvegarde de ${NOMS_CARAC[s.sauvegarde.caracteristique]} de la cible, DD ${s.sauvegarde.dd}` });
  for (const [i, d] of (s?.degats ?? []).entries()) {
    const cle = cleDegats(d.type);
    res.push({ id: `degats-${i}`, texte: `${d.des}${d.bonus ? signe(d.bonus) : ''}`, genre: 'degats', ...(cle ? { cle } : {}), titre: `Dégâts ${d.type}` });
  }
  const portee = k.zone ? `${FORMES[k.zone.forme] ?? k.zone.forme} ${formatMetres(k.zone.taille)}` : k.portee ? formatMetres(k.portee) : '';
  const cibles = k.nbCibles > 1 ? `×${k.nbCibles} cibles` : '';
  if (portee || cibles) res.push({ id: 'portee', texte: [portee, cibles].filter(Boolean).join(' · '), genre: 'portee', titre: 'Portée et nombre de cibles' });
  return res;
}

/** La phrase d'aperçu quand une carte est choisie et qu'une cible est survolée ; rien si la carte n'a pas de chiffres à comparer. */
export function texteApercu(a: ApercuCarte | undefined, carte: Pick<Carte, 'nom'>, cible: string): string | undefined {
  if (!a) return undefined;
  const degats = a.degatsMoyens !== undefined ? `, ≈ ${decimal(a.degatsMoyens)} dégâts` : '';
  if (a.pourcentToucher !== undefined) {
    const situation = a.avantage ? ' (avantage)' : a.desavantage ? ' (désavantage)' : '';
    return `${carte.nom} → ${cible} : ${a.pourcentToucher} % de toucher${situation}${a.couvert ? ', cible à couvert' : ''}${degats}.`;
  }
  if (a.pourcentEchec !== undefined && a.caracteristique) return `${carte.nom} → ${cible} : sauvegarde de ${NOMS_CARAC[a.caracteristique]} DD ${a.dd}, ${a.pourcentEchec} % d'échec${degats}.`;
  return a.degatsMoyens !== undefined ? `${carte.nom} → ${cible} : ≈ ${decimal(a.degatsMoyens)} dégâts.` : undefined;
}

/** Vrai quand il ne reste rien d'utile à jouer ce tour-ci : aucune carte jouable autre que l'élan et le gratuit. */
export function toutEstJoue(cartes: Carte[]): boolean {
  return !cartes.some((k) => k.jouable && k.cout !== 'elan' && k.cout !== 'gratuit' && k.cout !== 'reaction');
}
