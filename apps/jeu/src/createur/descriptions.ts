// Descriptions courtes (paraphrases du SRD 5.2.1) pour les écrans du créateur : classes, espèces,
// historiques et alignements. Les mécanismes exacts viennent des données ; ce texte sert à choisir.
import type { Alignement } from '@crpg/regles';

export interface InfoClasse {
  /** Rôle de la classe en une phrase. */
  role: string;
  complexite: 'Faible' | 'Moyenne' | 'Élevée';
  /** Thème de la classe (colonne « Prédilection » du SRD). */
  predilection: string;
}

export const CLASSES_INFO: Record<string, InfoClasse> = {
  barbare: {
    role: 'Combattant déchaîné : sa rage lui fait encaisser les coups et frapper très fort au corps à corps.',
    complexite: 'Moyenne',
    predilection: 'Combat',
  },
  barde: {
    role: 'Artiste dont les chants et les mots sont magiques : il inspire ses alliés et touche à tous les domaines.',
    complexite: 'Élevée',
    predilection: 'Représentation',
  },
  clerc: {
    role: "Serviteur d'une puissance divine : il soigne, protège ses compagnons et lance des sorts de bataille.",
    complexite: 'Moyenne',
    predilection: 'Dieux',
  },
  druide: {
    role: 'Gardien de la nature : sorts primitifs, soins et, plus tard, métamorphoses en bêtes.',
    complexite: 'Élevée',
    predilection: 'Nature',
  },
  ensorceleur: {
    role: 'Lanceur de sorts à la magie innée, qu’il façonne grâce à la métamagie pour la plier à son idée.',
    complexite: 'Élevée',
    predilection: 'Pouvoirs',
  },
  guerrier: {
    role: 'Maître des armes et des armures : solide, polyvalent et simple à jouer, au front comme à distance.',
    complexite: 'Faible',
    predilection: 'Combat',
  },
  magicien: {
    role: 'Érudit dont le grimoire recèle de puissants sorts : fragile, mais capable de dévaster un champ de bataille.',
    complexite: 'Élevée',
    predilection: 'Magie',
  },
  moine: {
    role: 'Combattant agile et rapide qui frappe à mains nues en puisant dans une discipline intérieure.',
    complexite: 'Élevée',
    predilection: 'Arts martiaux',
  },
  occultiste: {
    role: 'Lanceur lié par un pacte à une entité mystérieuse, qui lui confère des manifestations occultes.',
    complexite: 'Élevée',
    predilection: 'Pactes',
  },
  paladin: {
    role: 'Guerrier sacré en armure : il combat au corps à corps, soigne et châtie par la magie divine.',
    complexite: 'Moyenne',
    predilection: 'Combat',
  },
  rodeur: {
    role: 'Éclaireur et chasseur à l’aise en terrain sauvage : il marque sa proie et la frappe à distance.',
    complexite: 'Moyenne',
    predilection: 'Nature',
  },
  roublard: {
    role: 'Combattant furtif et rusé, expert des attaques sournoises, des talents et des déplacements malins.',
    complexite: 'Faible',
    predilection: 'Ruse',
  },
};

export const ESPECES_INFO: Record<string, string> = {
  drakeide: 'Descendant des dragons : il crache un souffle élémentaire et vole brièvement à haut niveau.',
  elfe: 'Être gracieux et longévif, aux sens aiguisés ; son lignage lui confère un petit pouvoir magique.',
  gnome: 'Petit être vif et curieux, rusé face à la magie, doté d’un lignage de forêt ou de roche.',
  goliath: 'Colosse des montagnes, endurant, qui invoque la puissance de ses ancêtres géants.',
  halfelin: 'Petit et agile, chanceux et courageux, il se faufile partout et relance ses plus mauvais jets.',
  humain: 'Adaptable et ambitieux : il peut être de taille petite ou moyenne et choisit un don d’origine.',
  nain: 'Robuste et tenace, résistant au poison et doté d’une vision dans le noir ; endurant par nature.',
  orc: 'Guerrier endurant et déterminé : il se rue sur l’ennemi et refuse de tomber au premier coup.',
  tieffelin: 'Marqué par un héritage fiélon, il manie une magie infernale ou abyssale et voit dans le noir.',
};

export const HISTORIQUES_INFO: Record<string, string> = {
  acolyte: 'Vous avez consacré vos jeunes années au service d’un temple : prières, rites et savoir sacré.',
  criminel: 'Vous avez vécu en marge de la loi : filouteries, vols et ruelles sombres n’ont plus de secret pour vous.',
  sage: 'Vous avez passé des années dans les bibliothèques et auprès de maîtres, à étudier tous les savoirs.',
  soldat: 'Vous avez servi dans une armée ou une milice : discipline, armes et champs de bataille.',
};

export interface InfoAlignement {
  nom: string;
  description: string;
}

/** Description courte des 9 alignements (paraphrase de la section « Alignement » du SRD, p. 25). */
export const ALIGNEMENTS_INFO: Record<Alignement, InfoAlignement> = {
  LB: { nom: 'Loyal bon', description: 'Fait le bien en respectant les attentes de la société : protège les innocents, combat l’injustice.' },
  NB: { nom: 'Neutre bon', description: 'Fait de son mieux et aide les autres selon leurs besoins, sans s’enfermer dans les règles.' },
  CB: { nom: 'Chaotique bon', description: 'Suit sa conscience sans se soucier des attentes d’autrui : un rebelle au grand cœur.' },
  LN: { nom: 'Loyal neutre', description: 'Vit selon la loi, la tradition ou son code personnel, sans pencher vers le bien ni le mal.' },
  N: { nom: 'Neutre', description: 'Évite les débats moraux et ne prend pas parti : agit au cas par cas, du mieux possible.' },
  CN: { nom: 'Chaotique neutre', description: 'Agit comme bon lui semble : sa liberté compte plus que tout le reste.' },
  LM: { nom: 'Loyal mauvais', description: 'Prend méthodiquement ce qu’il désire, dans le cadre de l’ordre et de la tradition.' },
  NM: { nom: 'Neutre mauvais', description: 'Ne se soucie pas du mal qu’il cause pour assouvir ses désirs.' },
  CM: { nom: 'Chaotique mauvais', description: 'Agit avec violence et cruauté, guidé par la haine ou l’envie de détruire.' },
};
