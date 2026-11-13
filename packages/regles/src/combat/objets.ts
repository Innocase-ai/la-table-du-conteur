// Les objets qu'un héros emporte au combat (potions, antidotes…) : ce qu'ils font à celui qui les prend. Les effets sont écrits dans
// les données de l'objet (`usage.agit`, `ActionObjet`) ; ce fichier les applique au combattant, sans rien connaître du catalogue.
import type { ActionObjet } from '../monde/schemas';
import type { Etat } from '../schemas';
import { aEtat, journaliser, lancerDes, type Combattant, type EtatCombat } from './etat';
import { infligerDegats, retirerEtat, sauvegarde, soigner } from './moteur';

/** Les ressources d'un héros qui comptent ses objets embarqués : `objet:<id>`. */
export const PREFIXE_OBJET = 'objet:';

/** Un objet confié à un héros pour le combat : de quoi construire sa carte et l'appliquer, sans relire le catalogue. */
export interface ObjetEmbarque {
  nom: string;
  actions: ActionObjet[];
  /** Durée des aides (10 rounds = 1 minute) ; absent : jusqu'à la fin du combat. */
  rounds?: number;
  /** Les sorts de l'objet (parchemin, baguette) : niveau de lancer et coût en charges. */
  sorts?: { sort: string; niveau: number; charges: number }[];
  /** DD de sauvegarde et bonus d'attaque des sorts de l'objet. */
  dd?: number;
  attaque?: number;
  /** Un objet à charges : le maximum et ce qu'il regagne à l'aube (le nombre actuel est dans `ressources['charges:<id>']`). */
  charges?: { max: number; recharge?: { des: string; bonus: number } };
}

/** Les ressources d'un héros qui comptent les charges de l'objet qu'il porte : `charges:<id>`. */
export const PREFIXE_CHARGES = 'charges:';

/** L'objet tel qu'un héros l'emporte, d'après ses données d'usage. */
export function embarquerDepuis(nom: string, usage: { soins?: string; agit?: ActionObjet[]; rounds?: number; sorts?: { sort: string; niveau?: number; charges?: number }[]; dd?: number; attaque?: number; charges?: ObjetEmbarque['charges'] } | undefined, niveauDuSort: (sort: string) => number): ObjetEmbarque {
  return {
    nom,
    actions: actionsDeUsage(usage),
    ...(usage?.rounds ? { rounds: usage.rounds } : {}),
    ...(usage?.sorts?.length ? { sorts: usage.sorts.map((s) => ({ sort: s.sort, niveau: s.niveau ?? niveauDuSort(s.sort), charges: s.charges ?? 1 })) } : {}),
    ...(usage?.dd ? { dd: usage.dd } : {}),
    ...(usage?.attaque !== undefined ? { attaque: usage.attaque } : {}),
    ...(usage?.charges ? { charges: { max: usage.charges.max, ...(usage.charges.recharge ? { recharge: { des: usage.charges.recharge.des, bonus: usage.charges.recharge.bonus ?? 0 } } : {}) } } : {}),
  };
}

/**
 * Fait de l'objet le lanceur le temps de faire quelque chose (calculer une carte, lancer le sort) : son DD et son bonus d'attaque remplacent
 * ceux du héros, et un seul emplacement du niveau voulu est là pour le sort. Le héros retrouve ensuite son incantation.
 */
export function avecIncantationDObjet<T>(c: Combattant, objet: ObjetEmbarque, niveau: number, f: () => T): T {
  const avant = c.incantation;
  const emplacements = Array.from({ length: 9 }, (_, i) => (i === niveau - 1 ? 1 : 0));
  c.incantation = { dd: objet.dd ?? 13, bonusAttaque: objet.attaque ?? 5, modificateur: 0, emplacements, emplacementsMax: [...emplacements] };
  try {
    return f();
  } finally {
    c.incantation = avant;
  }
}

/** Les types de la table de la potion de résistance (d10). */
export const TYPES_RESISTANCE = ['acide', 'feu', 'force', 'foudre', 'froid', 'nécrotique', 'poison', 'psychique', 'radiant', 'tonnerre'] as const;

/** Les actions d'un objet : ses soins (`usage.soins`) d'abord, puis `usage.agit`. */
export const actionsDeUsage = (usage: { soins?: string; agit?: ActionObjet[] } | undefined): ActionObjet[] => [...(usage?.soins ? [{ soins: usage.soins }] : []), ...(usage?.agit ?? [])];

const sansDe = (des: string): { des: string; bonus: number } => {
  const m = /^(\d+d\d+)([+-]\d+)?$/.exec(des);
  return { des: m?.[1] ?? '0', bonus: Number(m?.[2] ?? 0) };
};

const normaliser = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** L'objet est-il un objet de jet (acide, feu grégeois, eau bénite) ? Sa carte vise un ennemi à portée au lieu d'un allié au contact. */
export const jetDe = (actions: ActionObjet[]) => actions.flatMap((a) => ('jet' in a ? [a.jet] : []))[0];

/** Une créature de ce type est-elle visée par le jet (« Fiélon », « Mort-vivant » : le type SRD peut porter une précision) ? */
export const visePar = (jet: NonNullable<ReturnType<typeof jetDe>>, cible: Pick<Combattant, 'type'>): boolean => !jet.contre?.length || jet.contre.some((t) => normaliser(cible.type).includes(normaliser(t)));

/** Ce que l'objet ferait à cette créature maintenant : de quoi rendre la carte inutile (pas blessé, aucun état à retirer) ou jouable. */
export function utileA(actions: ActionObjet[], cible: Combattant): boolean {
  return actions.some((a) => {
    if ('soins' in a) return cible.pv < cible.pvMax;
    if ('retirerEtats' in a) return cible.etats.some((e) => a.retirerEtats.includes(e.etat));
    if ('pvTemporaires' in a) return cible.pvTemp < a.pvTemporaires;
    if ('force' in a) return Math.floor((a.force - 10) / 2) > cible.mods.for;
    if ('jet' in a) return visePar(a.jet, cible);
    if ('etat' in a) return !aEtat(cible, a.etat);
    if ('hate' in a) return !cible.modificateurs.some((m) => m.type === 'hate');
    return true;
  });
}

/** Un objet qui ne se donne qu'à soi (il fait mal : potion toxique). */
export const pourSoiSeul = (actions: ActionObjet[]): boolean => actions.some((a) => 'degats' in a);

/** Applique l'objet à la cible : journalise ce qui change (PV, états, résistances, dés). */
export function appliquerObjet(etat: EtatCombat, source: Combattant, cible: Combattant, objet: ObjetEmbarque): void {
  const lance = objet.actions.some((a) => 'jet' in a);
  journaliser(etat, { type: 'info', texte: lance ? `${source.nom} lance ${objet.nom} sur ${cible.nom}.` : cible === source ? `${source.nom} utilise ${objet.nom}.` : `${source.nom} donne ${objet.nom} à ${cible.nom}.`, acteur: source.id, cible: cible.id });
  const expire = objet.rounds ? { moment: 'debut_tour' as const, de: cible.id, apres: objet.rounds - 1 } : undefined;
  const id = (suffixe: string) => `objet:${objet.nom}|${suffixe}`;
  for (const a of objet.actions) {
    if ('soins' in a) {
      const { des, bonus } = sansDe(a.soins);
      soigner(etat, cible, Math.max(1, lancerDes(etat, des) + bonus), source);
    } else if ('pvTemporaires' in a) {
      if (cible.pvTemp < a.pvTemporaires) {
        cible.pvTemp = a.pvTemporaires;
        journaliser(etat, { type: 'soins', texte: `${cible.nom} gagne ${a.pvTemporaires} PV temporaires.`, acteur: source.id, cible: cible.id, valeur: a.pvTemporaires });
      }
    } else if ('retirerEtats' in a) {
      const retires = cible.etats.filter((e) => a.retirerEtats.includes(e.etat)).map((e) => e.etat as Etat);
      for (const e of retires) retirerEtat(cible, e);
      if (retires.length) journaliser(etat, { type: 'etat', texte: `${cible.nom} est délivré : ${retires.join(', ')}.`, acteur: source.id, cible: cible.id });
    } else if ('resistance' in a) {
      const type = a.resistance === 'au-hasard' ? TYPES_RESISTANCE[Math.floor((lancerDes(etat, '1d10') - 1) % TYPES_RESISTANCE.length)]! : a.resistance;
      cible.modificateurs.push({ id: id(`resistance-${type}`), type: 'resistance', typeDegats: type, source: source.id, ...(expire ? { expire: { ...expire } } : {}) });
      journaliser(etat, { type: 'info', texte: type === 'tous' ? `${cible.nom} résiste à tous les dégâts.` : `${cible.nom} résiste aux dégâts de type ${type}.`, acteur: source.id, cible: cible.id });
    } else if ('de' in a) {
      cible.modificateurs.push({ id: id(`de-${a.de.pour}`), type: a.de.pour === 'attaque' ? 'de_attaque' : 'de_sauvegarde', de: a.de.de, source: source.id, ...(expire ? { expire: { ...expire } } : {}) });
    } else if ('force' in a) {
      // Force 21 : modificateur +5. Les attaques de Force (arme, lancer, mains nues) gagnent l'écart au toucher et aux dégâts ; la sauvegarde de Force aussi.
      const mod = Math.floor((a.force - 10) / 2);
      const ecart = mod - cible.mods.for;
      if (ecart > 0) {
        cible.mods.for = mod;
        cible.sauvegardes.for += ecart;
        if (cible.competences?.athletisme !== undefined) cible.competences.athletisme += ecart;
        for (const jeu of [cible.attaques, cible.autreJeu?.attaques ?? []])
          for (const atq of jeu) {
            if (atq.caracteristique !== 'for') continue;
            atq.bonusAttaque += ecart;
            if (atq.degats[0]) atq.degats[0] = { ...atq.degats[0], bonus: atq.degats[0].bonus + ecart };
          }
        journaliser(etat, { type: 'info', texte: `${cible.nom} a la force d'un géant (Force ${a.force}, modificateur +${mod}).`, acteur: source.id, cible: cible.id });
      } else journaliser(etat, { type: 'info', texte: `${cible.nom} est déjà plus fort que la potion : aucun effet.`, acteur: source.id, cible: cible.id });
    } else if ('jet' in a) {
      const { sauvegarde: carac, des, type, enflamme } = a.jet;
      if (!visePar(a.jet, cible)) {
        journaliser(etat, { type: 'info', texte: `${objet.nom} n'a aucun effet sur ${cible.nom}.`, acteur: source.id, cible: cible.id });
        continue;
      }
      const dd = 8 + source.mods.dex + source.bonusMaitrise;
      if (sauvegarde(etat, cible, carac, dd)) {
        journaliser(etat, { type: 'info', texte: `${cible.nom} esquive ${objet.nom} (sauvegarde réussie, DD ${dd}).`, acteur: source.id, cible: cible.id, details: { sauvegarde: 'reussie' } });
      } else {
        journaliser(etat, { type: 'info', texte: `${cible.nom} rate sa sauvegarde (DD ${dd}).`, acteur: source.id, cible: cible.id, details: { sauvegarde: 'ratee' } });
        infligerDegats(etat, cible, [{ montant: lancerDes(etat, des), type }], source);
        if (enflamme && !cible.mort && !cible.modificateurs.some((m) => m.id === 'brule')) {
          // Il brûle à chaque fin de tour (1d4 de feu) jusqu'à ce qu'il s'éteigne (carte « Éteindre les flammes ») ou, à défaut, 3 tours.
          cible.modificateurs.push({ id: 'brule', type: 'degats_differes', de: '1d4', typeDegats: 'feu', repete: true, source: source.id, expire: { moment: 'fin_tour', de: cible.id, apres: 2 } });
          journaliser(etat, { type: 'etat', texte: `${cible.nom} prend feu.`, acteur: source.id, cible: cible.id });
        }
      }
    } else if ('etat' in a) {
      if (!aEtat(cible, a.etat)) cible.etats.push({ etat: a.etat, source: source.id });
      journaliser(etat, { type: 'etat', texte: `${cible.nom} devient invisible.`, acteur: source.id, cible: cible.id });
    } else if ('hate' in a) {
      if (!cible.modificateurs.some((m) => m.type === 'hate')) {
        const base = { source: source.id, ...(expire ? { expire: { ...expire } } : {}) };
        cible.modificateurs.push({ id: id('hate'), type: 'hate', ...base }, { id: id('hate-ca'), type: 'bonus_ca', valeur: 2, ...base }, { id: id('hate-vitesse'), type: 'vitesse', valeur: cible.vitesse, ...base });
        cible.tour.mouvement += cible.vitesse;
        journaliser(etat, { type: 'info', texte: `${cible.nom} est hâté : une attaque de plus par tour, +2 CA, Vitesse doublée.`, acteur: source.id, cible: cible.id });
      }
    } else if ('degats' in a) {
      infligerDegats(etat, cible, [{ montant: lancerDes(etat, a.degats.des), type: a.degats.type }], source);
    }
  }
}
