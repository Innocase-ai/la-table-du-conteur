// Construction des combattants : héros à partir d'une fiche, monstres à partir d'un profil du SRD.
import { modificateur } from '../caracteristiques';
import type { Donnees } from '../donnees';
import type { Fiche } from '../fiche';
import { CARACTERISTIQUES, type Arme, type Caracteristique, type Monstre } from '../schemas';
import { DECK_ELAN_LANCEUR, DECK_ELAN_MARTIAL } from './cartes';
import { doctrineDeProfil } from './doctrine';
import type { AttaqueArme, Botte, Combattant } from './etat';
import type { Position } from './grille';

const BOTTES: Record<string, Botte> = {
  Sape: 'sape',
  Ouverture: 'ouverture',
  Renversement: 'renversement',
  Ralentissement: 'ralentissement',
  Poussée: 'poussee',
  Écorchure: 'ecorchure',
  Enchaînement: 'enchainement',
  'Coup double': 'coup-double',
};

/** Aptitudes de la fiche que le moteur de combat sait jouer. */
const TRAITS_COMBAT = [
  'rage', 'temerite', 'sens-du-danger', 'frenesie', 'attaque-sournoise', 'ruse', 'visee-appliquee', 'mains-lestes',
  'second-souffle', 'fougue', 'critique-ameliore', 'proie-du-chasseur', 'disciple-de-la-vie', 'survivance', 'sort-mineur-appuye',
  'inspiration-bardique', 'chatiment-de-paladin', 'credo-du-moine', 'frappe-etourdissante', 'arts-martiaux', 'metabolisme-surnaturel',
];

const CLASSES_LANCEUSES = ['barde', 'clerc', 'druide', 'ensorceleur', 'magicien', 'occultiste'];

export interface Kit {
  /**
   * Armes portées ; `botte` : l'arme fait partie des bottes maîtrisées. Une arme magique repose sur une arme du SRD (`id`) :
   * `nom` est son nom propre, `bonus` ses bonus d'attaque et de dégâts.
   */
  armes: ArmeKit[];
  /**
   * L'autre jeu d'armes (celui qui n'est pas en main) : ses armes, la CA quand on l'a en main (le bouclier suit le jeu) et le manque
   * de formation qu'il entraîne. Sans lui, pas de carte « Changer d'armes ».
   */
  autreJeu?: { armes: ArmeKit[]; ca: number; sansFormation?: boolean };
  /** Le numéro du jeu en main (1 ou 2), gardé pendant le combat dans `ressources.jeuArmes` pour revenir à l'histoire. */
  jeu?: 1 | 2;
  sorts?: string[];
  potions?: number;
}

/** Une arme du kit ; `main: 'gauche'` : tenue de la main gauche (attaque de la main gauche, arme Légère). */
export interface ArmeKit {
  id: string;
  botte?: boolean;
  nom?: string;
  bonus?: { attaque: number; degats: number };
  main?: 'gauche';
}

function vierge(): Combattant['tour'] {
  return {
    mouvement: 0, action: true, bonus: true, attaquesRestantes: 0, desengage: false, esquive: false, aBouge: false,
    sortEmplacementLance: false, sortBonusLance: false, sournoiseUtilisee: false, proieUtilisee: false,
    enchainementUtilise: false, frenesieUtilisee: false, temeraire: false, elanJoue: false, attaqueEntreprise: false, etourdissanteUtilisee: false,
  };
}

/** Maîtrise d'une arme (SRD 5.2.1) : par catégorie, par id, ou par propriété (« armes de guerre dotées de la propriété Finesse ou Légère »). */
export function maitriseArme(fiche: Pick<Fiche, 'maitrisesArmes'>, arme: Arme): boolean {
  const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const proprietes = arme.proprietes.map((p) => norm(p.replace(/\s*\(.*\)$/, '')));
  return fiche.maitrisesArmes.some((m) => {
    const t = norm(m);
    if (t === arme.id) return true;
    const categorie = arme.categorie === 'courante' ? /^courante/ : /^(guerre|armes? de guerre)/;
    if (!categorie.test(t)) return false;
    const avec = t.match(/propriete\s+(.+)$/);
    return !avec || avec[1]!.split(/\s+ou\s+/).some((x) => proprietes.includes(x.trim()));
  });
}

function attaquesArme(fiche: Fiche, arme: Arme, botte: boolean): AttaqueArme[] {
  const mods = Object.fromEntries(CARACTERISTIQUES.map((c) => [c, fiche.caracteristiques[c].modificateur])) as Record<Caracteristique, number>;
  const finesse = arme.proprietes.includes('Finesse');
  const archerie = fiche.dons.includes('archerie') ? 2 : 0;
  // Sans maîtrise de l'arme, pas de bonus de maîtrise à l'attaque (SRD 5.2.1).
  const pb = maitriseArme(fiche, arme) ? fiche.bonusMaitrise : 0;
  const b = botte ? BOTTES[arme.botte] : undefined;
  const legere = arme.proprietes.includes('Légère') || undefined;
  const res: AttaqueArme[] = [];
  if (arme.portee === 'distance') {
    const carac: Caracteristique = 'dex';
    res.push({
      id: arme.id, nom: arme.nom, mode: 'distance', caracteristique: carac, bonusAttaque: mods[carac] + pb + archerie,
      degats: [{ des: arme.degats, bonus: mods[carac], type: arme.typeDegats }], allonge: 0, portees: arme.portees, finesse, botte: b, legere,
    });
    return res;
  }
  const carac: Caracteristique = finesse && mods.dex > mods.for ? 'dex' : 'for';
  const allonge = arme.proprietes.includes('Allonge') ? 3 : 1.5;
  res.push({
    id: arme.id, nom: arme.nom, mode: 'corps-a-corps', caracteristique: carac, bonusAttaque: mods[carac] + pb,
    degats: [{ des: arme.degats, bonus: mods[carac], type: arme.typeDegats }], allonge, finesse, botte: b, legere,
  });
  if (arme.proprietes.includes('Lancer') && arme.portees) {
    res.push({
      id: `${arme.id}-lancer`, nom: `${arme.nom} (lancer)`, mode: 'distance', caracteristique: carac,
      bonusAttaque: mods[carac] + pb + archerie, degats: [{ des: arme.degats, bonus: mods[carac], type: arme.typeDegats }],
      allonge: 0, portees: arme.portees, finesse, botte: b, legere,
    });
  }
  return res;
}

const nombreColonne = (v: number | string | undefined) => (typeof v === 'number' ? v : Number(String(v ?? '0').replace(/[^\d-]/g, '')) || 0);

/** Ce qu'un héros garde d'un combat à l'autre, PV mis à part : potions, usages d'aptitudes, emplacements de sorts. */
export interface EtatDurable {
  ressources: Record<string, number>;
  emplacements: number[];
}

/** Récupération d'une ressource au repos (SRD 5.2.1) : une seule, toutes, ou aucune. */
export const RECUPERATION: Record<string, { court: 'une' | 'toutes' | 'aucune'; long: 'toutes' | 'aucune' }> = {
  potions: { court: 'aucune', long: 'aucune' },
  rages: { court: 'une', long: 'toutes' },
  secondSouffle: { court: 'une', long: 'toutes' },
  fougue: { court: 'toutes', long: 'toutes' },
  conduit: { court: 'une', long: 'toutes' },
  // Dés de vie (SRD 5.2.1) : on en dépense au repos court pour se soigner ; le repos long les rend tous.
  desVie: { court: 'aucune', long: 'toutes' },
  // Imposition des mains (paladin) : une réserve de PV, reconstituée au repos long.
  impositionDesMains: { court: 'aucune', long: 'toutes' },
  // Inspiration bardique : au repos long ; dès le niveau 5 (Source d'inspiration), aussi au repos court (voir `recuperer`).
  inspiration: { court: 'aucune', long: 'toutes' },
  // Châtiment divin lancé sans emplacement (Paladin, niveau 2) : une fois par repos long.
  chatimentGratuit: { court: 'aucune', long: 'toutes' },
  // Points de Credo du Moine : tous rendus au repos court ou long. Métabolisme surnaturel : une fois par repos long.
  credo: { court: 'toutes', long: 'toutes' },
  metabolisme: { court: 'aucune', long: 'toutes' },
};

/** Les ressources durables d'une fiche, à leur maximum (avec `potions` potions de départ). */
export function etatDurableMax(fiche: Fiche, potions = 0): EtatDurable {
  const col = fiche.colonnes;
  const traits = fiche.aptitudes.map((a) => a.id).filter((t) => TRAITS_COMBAT.includes(t));
  const ressources: Record<string, number> = { potions, desVie: fiche.niveau };
  if (traits.includes('rage')) ressources.rages = nombreColonne(col.Rages);
  if (traits.includes('second-souffle')) ressources.secondSouffle = nombreColonne(col['Second souffle']);
  if (traits.includes('fougue')) ressources.fougue = 1;
  if (traits.includes('survivance')) ressources.conduit = nombreColonne(col['Conduit divin']);
  if (fiche.aptitudes.some((a) => a.id === 'imposition-des-mains')) ressources.impositionDesMains = 5 * fiche.niveau;
  if (traits.includes('chatiment-de-paladin')) ressources.chatimentGratuit = 1;
  if (traits.includes('credo-du-moine')) ressources.credo = nombreColonne(col['Points de Credo']);
  if (traits.includes('metabolisme-surnaturel')) ressources.metabolisme = 1;
  // Autant d'inspirations que le modificateur de Charisme (au moins une).
  if (traits.includes('inspiration-bardique')) ressources.inspiration = Math.max(1, fiche.caracteristiques.cha.modificateur);
  let emplacements: number[] = [];
  const i = fiche.incantation;
  if (i) {
    emplacements = [...i.emplacements];
    // Magie de pacte : tous les emplacements sont du même niveau.
    if (i.niveauEmplacementPacte) emplacements = Array.from({ length: i.niveauEmplacementPacte }, (_, n) => (n === i.niveauEmplacementPacte! - 1 ? i.emplacements[0]! : 0));
  }
  return { ressources, emplacements };
}

/** Les attaques d'un jeu d'armes : une par arme (et son lancer), les Arts martiaux du Moine, ou le coup de poing sans arme. */
function attaquesDuJeu(fiche: Fiche, armes: ArmeKit[], donnees: Donnees, mods: Record<Caracteristique, number>): AttaqueArme[] {
  const deja = new Map<string, number>();
  const attaques: AttaqueArme[] = armes.flatMap((a) => {
    // La même arme portée deux fois : deux attaques distinctes, sinon la carte jouée serait toujours la première.
    const rang = (deja.get(a.id) ?? 0) + 1;
    deja.set(a.id, rang);
    const arme = donnees.armes.get(a.id);
    if (!arme) throw new Error(`Arme inconnue : ${a.id}`);
    return attaquesArme(fiche, arme, !!a.botte).map((brute) => {
      const marquee = a.main === 'gauche' ? { ...brute, main: 'gauche' as const } : brute;
      const atq = rang > 1 ? { ...marquee, id: `${marquee.id}-${rang}` } : marquee;
      if (!a.bonus && !a.nom) return atq;
      return {
        ...atq,
        nom: a.nom ? atq.nom.replace(arme.nom, a.nom) : atq.nom,
        bonusAttaque: atq.bonusAttaque + (a.bonus?.attaque ?? 0),
        degats: atq.degats.map((d, i) => (i === 0 ? { ...d, bonus: d.bonus + (a.bonus?.degats ?? 0) } : d)),
      };
    });
  });
  // Arts martiaux du Moine, et coup de poing pour qui n'a aucune arme.
  const nombreForce = mods.for;
  const colArts = fiche.colonnes['Arts martiaux'];
  if (fiche.classe === 'moine') {
    const carac: Caracteristique = mods.dex >= mods.for ? 'dex' : 'for';
    attaques.push({
      id: 'arts-martiaux', nom: 'Arts martiaux', mode: 'corps-a-corps', caracteristique: carac, bonusAttaque: mods[carac] + fiche.bonusMaitrise,
      degats: [{ des: typeof colArts === 'string' && /^\d*d\d+$/.test(colArts) ? colArts : '1d6', bonus: mods[carac], type: 'contondant' }], allonge: 1.5, finesse: true,
    });
  } else if (!attaques.length) {
    attaques.push({
      id: 'mains-nues', nom: 'Coup de poing', mode: 'corps-a-corps', caracteristique: 'for', bonusAttaque: nombreForce + fiche.bonusMaitrise,
      degats: [{ des: '1', bonus: nombreForce, type: 'contondant' }], allonge: 1.5, finesse: false,
    });
  }
  return attaques;
}

export function heroDepuisFiche(fiche: Fiche, kit: Kit, donnees: Donnees, position: Position, id = fiche.nom.toLowerCase()): Combattant {
  const mods = Object.fromEntries(CARACTERISTIQUES.map((c) => [c, fiche.caracteristiques[c].modificateur])) as Record<Caracteristique, number>;
  const sauvegardes = Object.fromEntries(CARACTERISTIQUES.map((c) => [c, fiche.sauvegardes[c].bonus])) as Record<Caracteristique, number>;
  const attaques = attaquesDuJeu(fiche, kit.armes, donnees, mods);
  const durable = etatDurableMax(fiche, kit.potions ?? 0);
  // Les ressources qui durent d'un combat à l'autre (potions, rages…), plus celles qui ne servent qu'en combat.
  const ressources: Record<string, number> = { reaction: 1, ...durable.ressources };
  const traits = fiche.aptitudes.map((a) => a.id).filter((t) => TRAITS_COMBAT.includes(t));
  if (traits.includes('rage')) ressources.degatsRage = nombreColonne(fiche.colonnes['Dégâts de Rage']);
  // Moine : le maximum de Credo et le dé d'Arts martiaux (Métabolisme surnaturel, Frappe étourdissante).
  if (traits.includes('credo-du-moine')) {
    ressources.credoMax = nombreColonne(fiche.colonnes['Points de Credo']);
    ressources.deArtsMartiaux = Number(/d(\d+)/.exec(String(fiche.colonnes['Arts martiaux'] ?? '1d6'))?.[1] ?? 6);
  }
  // Le dé d'Inspiration bardique (colonne « Dé bardique » : d6, d8, d10, d12).
  if (traits.includes('inspiration-bardique')) ressources.deInspiration = Number(/d(\d+)/.exec(String(fiche.colonnes['Dé bardique'] ?? 'd6'))?.[1] ?? 6);
  // Attaque supplémentaire (2 attaques), puis le Guerrier : double (niveau 11, 3 attaques) et triple (niveau 20, 4 attaques).
  const ids = new Set(fiche.aptitudes.map((x) => x.id));
  if (ids.has('triple-attaque-supplementaire')) ressources.attaquesParAction = 4;
  else if (ids.has('double-attaque-supplementaire')) ressources.attaquesParAction = 3;
  else if (ids.has('attaque-supplementaire')) ressources.attaquesParAction = 2;
  let incantation: Combattant['incantation'];
  if (fiche.incantation) {
    const i = fiche.incantation;
    incantation = { dd: i.ddSauvegarde, bonusAttaque: i.bonusAttaque, modificateur: mods[i.caracteristique], emplacements: [...durable.emplacements], emplacementsMax: [...durable.emplacements] };
  } else if (fiche.sortsAccordes.length || kit.sorts?.length) {
    // Un non-lanceur qui tient des sorts de son espèce ou d'Initié à la magie (Guerrier tieffelin : Bouffée de poison) : le SRD
    // fait choisir Intelligence, Sagesse ou Charisme pour ces sorts ; on prend la meilleure des trois. Pas d'emplacement.
    const carac = (['int', 'sag', 'cha'] as const).reduce((a, b) => (mods[b] > mods[a] ? b : a));
    incantation = { dd: 8 + fiche.bonusMaitrise + mods[carac], bonusAttaque: fiche.bonusMaitrise + mods[carac], modificateur: mods[carac], emplacements: [], emplacementsMax: [] };
  }
  const lanceur = CLASSES_LANCEUSES.includes(fiche.classe);
  // Deux jeux d'armes : celui en main, et l'autre, que la carte « Changer d'armes » prend en main.
  if (kit.jeu) ressources.jeuArmes = kit.jeu;
  const autreJeu: Combattant['autreJeu'] = kit.autreJeu && {
    attaques: attaquesDuJeu(fiche, kit.autreJeu.armes, donnees, mods),
    caBase: kit.autreJeu.ca,
    sansFormation: kit.autreJeu.sansFormation,
    nom: kit.autreJeu.armes.map((a) => a.nom ?? donnees.armes.get(a.id)?.nom ?? a.id).join(' et ') || 'les mains nues',
    image: kit.autreJeu.armes[0]?.id,
  };
  return {
    id,
    nom: fiche.nom,
    camp: 'heros',
    modele: fiche.classe,
    type: 'Humanoïde',
    taille: fiche.taille,
    niveau: fiche.niveau,
    position,
    pv: fiche.pvMax,
    pvMax: fiche.pvMax,
    pvTemp: 0,
    caBase: fiche.ca,
    vitesse: fiche.vitesse,
    mods,
    sauvegardes,
    // Pour les tests de compétence en combat (s'échapper d'une prise : Athlétisme ou Acrobaties, maîtrise comprise si on l'a).
    competences: { athletisme: fiche.competences.athletisme.bonus, acrobaties: fiche.competences.acrobaties.bonus },
    bonusInitiative: fiche.initiative,
    bonusMaitrise: fiche.bonusMaitrise,
    resistances: fiche.resistances,
    immunites: [],
    vulnerabilites: [],
    immunitesEtats: [],
    etats: [],
    modificateurs: [],
    attaques,
    actionsMonstre: [],
    traits,
    sorts: kit.sorts ?? [],
    incantation,
    ressources,
    rage: false,
    initiative: 0,
    mort: false,
    jetsMort: { succes: 0, echecs: 0 },
    stable: false,
    enFuite: false,
    tour: vierge(),
    elan: { pioche: [...(lanceur ? DECK_ELAN_LANCEUR : DECK_ELAN_MARTIAL)], main: [], defausse: [] },
    px: 0,
    sansFormation: fiche.sansFormation,
    ...(autreJeu ? { autreJeu } : {}),
  };
}

export function monstreDepuisProfil(m: Monstre, id: string, position: Position, nom = m.nom): Combattant {
  const mods = Object.fromEntries(CARACTERISTIQUES.map((c) => [c, modificateur(m.caracteristiques[c] ?? 10)])) as Record<Caracteristique, number>;
  const sauvegardes = Object.fromEntries(CARACTERISTIQUES.map((c) => [c, m.sauvegardes[c] ?? mods[c]])) as Record<Caracteristique, number>;
  const doctrine = doctrineDeProfil(m);
  return {
    id,
    nom,
    camp: 'monstres',
    modele: m.id,
    type: m.type,
    taille: m.taille,
    niveau: 0,
    position,
    pv: m.pv.moyenne,
    pvMax: m.pv.moyenne,
    pvTemp: 0,
    caBase: m.ca,
    vitesse: m.vitesse.marche,
    mods,
    sauvegardes,
    competences: m.competences,
    bonusInitiative: m.initiative,
    bonusMaitrise: m.bonusMaitrise,
    resistances: m.resistances,
    immunites: m.immunitesDegats,
    vulnerabilites: m.vulnerabilites,
    immunitesEtats: m.immunitesEtats,
    etats: [],
    modificateurs: [],
    attaques: [],
    actionsMonstre: m.actions,
    traits: m.traits.map((t) => t.id),
    sorts: [],
    ressources: { reaction: 1 },
    rage: false,
    initiative: 0,
    mort: false,
    jetsMort: { succes: 0, echecs: 0 },
    stable: false,
    enFuite: false,
    tour: vierge(),
    px: m.px,
    ...(doctrine ? { doctrine } : {}),
  };
}
