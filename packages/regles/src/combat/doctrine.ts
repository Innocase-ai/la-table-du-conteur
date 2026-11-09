// La doctrine d'un combattant : comment l'IA note ses choix (ce qu'il cherche, ce qu'il craint, quand il lâche prise).
// Séparée de l'IA pour que l'état d'un combat puisse en porter une, sans dépendre de l'IA.
import type { ActionMonstre, Degats, Monstre } from '../schemas';
import type { Camp, Combattant } from './etat';

export interface Doctrine {
  /** Poids des dégâts infligés à l'adversaire. */
  agressivite: number;
  /** Poids des dégâts subis et de l'exposition. */
  prudence: number;
  /** Cibles prioritaires. */
  focus: 'aucun' | 'lanceurs' | 'soigneurs' | 'blesses';
  /** Part des PX du groupe perdue au-delà de laquelle le groupe fuit (1 = jamais). */
  seuilFuite: number;
  /** Part de ses propres PV sous laquelle ce combattant fuit, seul (absent = il ne fuit qu'avec son groupe). */
  seuilFuitePv?: number;
  /** Valeur qu'il accorde à rester loin de l'ennemi le plus proche (absent = sa position ne lui importe pas pour elle-même). */
  garderDistance?: number;
}

export const DOCTRINE_PAR_DEFAUT: Doctrine = { agressivite: 1, prudence: 0.6, focus: 'aucun', seuilFuite: 0.7 };

/**
 * La doctrine qui s'applique à un combattant : celle de son camp (ou celle par défaut), corrigée par la sienne.
 * Un combattant sans doctrine propre suit donc exactement celle de son camp.
 */
export function doctrineDe(c: Pick<Combattant, 'camp' | 'doctrine'>, doctrines?: Partial<Record<Camp, Doctrine>>): Doctrine {
  const base = doctrines?.[c.camp] ?? DOCTRINE_PAR_DEFAUT;
  return c.doctrine ? { ...base, ...c.doctrine } : base;
}

// ---------------------------------------------------------------------------
// La conduite d'un monstre, déduite de son profil SRD
// ---------------------------------------------------------------------------

/** Ce qu'un profil dit de la conduite d'un monstre ; un monstre peut en cumuler plusieurs (un gobelin tireur et lâche). */
export type ConduiteMonstre = 'sans-peur' | 'bete' | 'brute' | 'lanceur' | 'tireur' | 'lache';

const CONDUITES: Record<ConduiteMonstre, Partial<Doctrine>> = {
  // Morts-vivants et créatures artificielles sans esprit : ils avancent, quoi qu'il arrive.
  'sans-peur': { agressivite: 1.2, prudence: 0.2, seuilFuite: 1 },
  // Un animal ne connaît pas le moral d'une troupe : il détale quand il est gravement blessé.
  bete: { seuilFuite: 1, seuilFuitePv: 0.25 },
  // Une grosse brute frappe et ne pense pas à se protéger.
  brute: { agressivite: 1.3, prudence: 0.3, seuilFuite: 0.9 },
  // Un lanceur reste en retrait et vise ceux qui peuvent le contrer.
  lanceur: { prudence: 1.2, focus: 'lanceurs', garderDistance: 0.1 },
  // Un tireur garde ses distances.
  tireur: { prudence: 1, garderDistance: 0.1 },
  // La piétaille gobeline ou kobolde ne meurt pas pour son chef.
  lache: { seuilFuitePv: 0.3 },
};

/** Portée au-delà de laquelle une attaque à distance fait un vrai tireur (un couteau de jet ne compte pas). */
const PORTEE_DE_TIR = 18;

const moyenneDes = (d: Degats): number => {
  const m = /^(\d+)d(\d+)$/.exec(d.des);
  return (m ? (Number(m[1]) * (Number(m[2]) + 1)) / 2 : 0) + (d.bonus ?? 0);
};
const degatsMoyens = (a: ActionMonstre): number => a.degats.reduce((s, d) => s + moyenneDes(d), 0);
const estDeContact = (a: ActionMonstre): boolean => a.resolution?.type === 'attaque' && a.resolution.mode === 'corps-a-corps';
const tireLoin = (a: ActionMonstre): boolean => a.portee?.type === 'distance' && (a.portee.normale ?? 0) >= PORTEE_DE_TIR && a.degats.length > 0;

/** Les conduites qu'on lit dans un profil SRD : son type, ses caractéristiques, ses attaques. */
export function conduitesDe(m: Monstre): ConduiteMonstre[] {
  const int = m.caracteristiques.int ?? 10;
  const force = m.caracteristiques.for ?? 10;
  const dex = m.caracteristiques.dex ?? 10;
  const contact = Math.max(0, ...m.actions.filter(estDeContact).map(degatsMoyens));
  const tir = Math.max(0, ...m.actions.filter(tireLoin).map(degatsMoyens));
  const res: ConduiteMonstre[] = [];
  const sansEsprit = /^(Mort-vivant|Artificiel|Vase|Plante)/.test(m.type) && int <= 8;
  if (sansEsprit) res.push('sans-peur');
  else if (m.type.startsWith('Bête') && int <= 3) res.push('bete');
  const incantation = m.traits.some((t) => t.id.includes('incantation')) || m.actions.some((a) => a.id.includes('incantation'));
  const lanceur = !sansEsprit && incantation && tir > 0 && ['TP', 'P', 'M'].includes(m.taille);
  // Un tireur vit de son adresse : le guerrier qui porte aussi un arc (chevalier, hobgobelin) reste un guerrier,
  // et le mort-vivant sans esprit armé d'un arc ne recule pas pour autant.
  const tireur = !sansEsprit && !lanceur && tir > 0 && tir >= contact && dex >= force;
  if (lanceur) res.push('lanceur');
  if (tireur) res.push('tireur');
  if (!sansEsprit && !res.includes('bete') && !lanceur && !tireur && force >= 16 && int <= 8) res.push('brute');
  // Le SRD range les kobolds parmi les Dragons : on les reconnaît à leur nom.
  if ((m.type.includes('Gobelinoïde') || m.id.includes('kobold')) && m.taille === 'P' && m.fp.includes('/')) res.push('lache');
  return res;
}

/** La conduite propre d'un monstre (rien pour un soldat ordinaire, qui suit la doctrine de son camp). */
export function doctrineDeProfil(m: Monstre): Partial<Doctrine> | undefined {
  const conduites = conduitesDe(m);
  return conduites.length ? Object.assign({}, ...conduites.map((c) => CONDUITES[c])) : undefined;
}
