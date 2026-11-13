// Libellés, abréviations et petites fonctions d'affichage partagées par les composants.
import {
  CARTES_ELAN,
  etatApparent,
  type Carte,
  type Combattant,
  type CoutCarte,
  type Donnees,
  type EtatCombat,
  type Etat,
  type Evenement,
  type Modificateur,
  type Rencontre,
} from '@crpg/regles';

export const LIBELLES_COUT: Record<CoutCarte, string> = {
  action: 'Action',
  bonus: 'Action bonus',
  reaction: 'Réaction',
  gratuit: 'Gratuit',
  elan: 'Élan',
};

export const LIBELLES_DIFFICULTE: Record<Rencontre['difficulte'], string> = {
  faible: 'Faible',
  moderee: 'Modérée',
  elevee: 'Élevée',
};

export const LIBELLES_APPARENT: Record<ReturnType<typeof etatApparent>, string> = {
  intact: 'intact',
  blesse: 'blessé',
  'en-sang': 'en sang',
  'hors-combat': 'hors de combat',
};

/** Petit symbole par état, pour les badges sur les jetons. */
export const SYMBOLES_ETATS: Record<Etat, string> = {
  'a-terre': '↓',
  aveugle: '◌',
  charme: '♥',
  empoigne: '⊗',
  entrave: '⌗',
  effraye: '!',
  inconscient: 'z',
  neutralise: '⊘',
  paralyse: '✶',
  empoisonne: '☣',
  etourdi: '✺',
  invisible: '◇',
};

export const ORDRE_CATEGORIES: Carte['categorie'][] = ['elan', 'attaque', 'monstre', 'sort', 'aptitude', 'base'];

const ABREVIATIONS_MONSTRES: Record<string, string> = {
  'sbire-gobelin': 'Gb',
  'combattant-gobelin': 'Gb',
  'chef-gobelin': 'CG',
  'combattant-hobgobelin': 'Hb',
  'capitaine-hobgobelin': 'CH',
  'combattant-gobelours': 'Go',
  'traqueur-gobelours': 'TG',
  loup: 'Lp',
  'loup-sanguinaire': 'Lp',
  squelette: 'Sq',
  zombi: 'Zb',
  ogre: 'Og',
  bandit: 'Bd',
  'chef-de-bande': 'CB',
  'combattant-gnoll': 'Gn',
  goule: 'Gl',
};

/** Deux lettres pour le jeton, et le numéro du monstre s'il y en a plusieurs. */
export function abreviation(c: Combattant): { lettres: string; numero?: string } {
  if (c.camp === 'heros') return { lettres: c.nom.slice(0, 2) };
  const m = /-(\d+)$/.exec(c.id);
  const lettres = ABREVIATIONS_MONSTRES[c.modele] ?? c.nom.slice(0, 2);
  return { lettres, numero: /\d+$/.test(c.nom) ? m?.[1] : undefined };
}

const NOMS_MODIFICATEURS: Record<string, string> = {
  'benediction-a': 'Bénédiction',
  'aide-a': 'Aide',
  'benediction-s': 'Bénédiction',
  'fleau-a': 'Fléau',
  'fleau-s': 'Fléau',
  'eclair-tracant': 'Éclair traçant',
  'bouclier-de-la-foi': 'Bouclier de la foi',
  'marque-du-chasseur': 'Marque du chasseur',
  'rayon-de-givre': 'Rayon de givre',
  'visee-appliquee': 'Visée appliquée',
  'inspiration-bardique': 'Inspiration bardique',
  bouclier: 'Bouclier',
  sape: 'Botte : sape',
  ouverture: 'Botte : ouverture',
  ralentissement: 'Botte : ralentissement',
};

export function libelleModificateur(m: Modificateur): string {
  // Un objet pris en combat (`objet:<nom>|<effet>`) montre le nom de l'objet.
  const nom = NOMS_MODIFICATEURS[m.id] ?? CARTES_ELAN[m.id]?.nom ?? (m.id.startsWith('objet:') ? m.id.slice(6).split('|')[0]! : m.id);
  const v = m.valeur ?? 0;
  const effet: Record<Modificateur['type'], string> = {
    bonus_ca: `${v >= 0 ? '+' : ''}${v} CA`,
    de_attaque: `${m.de ?? ''} aux attaques`,
    de_sauvegarde: `${m.de ?? ''} aux sauvegardes`,
    de_inspiration: `${m.de ?? ''} sur un jet raté (une fois)`,
    avantage_attaque: 'avantage à la prochaine attaque',
    desavantage_attaque: 'désavantage à la prochaine attaque',
    avantage_contre: 'prochaine attaque contre lui avec avantage',
    vitesse: `${v >= 0 ? '+' : ''}${v} m de Vitesse`,
    bonus_attaque: v ? `${v >= 0 ? '+' : ''}${v} à la prochaine attaque` : 'marqué',
    de_degats: `+${m.de ?? ''} dégâts à la prochaine attaque`,
    repere: 'points de vie maximum accrus',
    degats_differes: 'dégâts à la fin de son tour',
    hate: 'une attaque de plus par tour, +2 CA, Vitesse doublée, avantage aux sauvegardes de Dextérité',
    resistance: m.typeDegats === 'tous' ? 'résistance à tous les dégâts' : `résistance aux dégâts de type ${m.typeDegats ?? '?'}`,
  };
  return `${nom} : ${effet[m.type]}`;
}

/** Ressources lisibles d'un combattant (hors emplacements de sorts). */
export function ressourcesLisibles(c: Combattant): { nom: string; valeur: string }[] {
  const r = c.ressources;
  const res: { nom: string; valeur: string }[] = [];
  const simples: [string, string][] = [
    ['rages', 'Rages'],
    ['secondSouffle', 'Second souffle'],
    ['fougue', 'Fougue'],
    ['conduit', 'Conduit divin'],
    ['inspiration', 'Inspiration bardique'],
    ['chatimentGratuit', 'Châtiment divin gratuit'],
    ['credo', 'Points de Credo'],
    ['potions', 'Potions de soins'],
  ];
  for (const [cle, nom] of simples) if (r[cle] !== undefined) res.push({ nom, valeur: String(r[cle]) });
  if (c.rage && r.degatsRage) res.push({ nom: 'Dégâts de rage', valeur: `+${r.degatsRage}` });
  if ((r.attaquesParAction ?? 1) > 1) res.push({ nom: 'Attaques par action', valeur: String(r.attaquesParAction) });
  if (r.armeSpirituelle && c.concentration?.sort === 'arme-spirituelle') res.push({ nom: 'Arme spirituelle', valeur: `niv. ${r.armeSpirituelle}` });
  for (const a of c.actionsMonstre) {
    if (a.recharge) res.push({ nom: `${a.nom} (${a.recharge})`, valeur: (r[`recharge:${a.id}`] ?? 1) > 0 ? 'prête' : 'en recharge' });
    if (a.utilisations) res.push({ nom: a.nom, valeur: `${r[`util:${a.id}`] ?? a.utilisations.nombre}/${a.utilisations.nombre}` });
  }
  res.push({ nom: 'Réaction', valeur: r.reaction ? 'disponible' : 'utilisée' });
  return res;
}

export function nomClasse(c: Combattant, donnees: Donnees): string {
  if (c.camp === 'monstres') return donnees.monstres.get(c.modele)?.nom ?? c.type;
  const classe = donnees.classes.get(c.modele);
  if (!classe) return c.modele;
  return c.niveau >= 3 ? `${classe.nom} (${classe.sousClasse.nom})` : classe.nom;
}

export const COULEURS_JOURNAL: Partial<Record<Evenement['type'], string>> = {
  attaque: 'j-attaque',
  degats: 'j-degats',
  soins: 'j-soins',
  sort: 'j-sort',
  etat: 'j-etat',
  mort: 'j-mort',
  fin: 'j-fin',
  info: 'j-info',
  tour: 'j-tour',
  deplacement: 'j-deplacement',
};

/** Une créature peut être visée plusieurs fois par ces sorts (projectiles, rayons). */
export function ciblesRepetables(carte: Carte): boolean {
  return carte.id === 'sort:projectile-magique' || carte.id === 'sort:rayon-ardent';
}

export function formatMetres(m: number): string {
  return `${String(Math.round(m * 10) / 10).replace('.', ',')} m`;
}
