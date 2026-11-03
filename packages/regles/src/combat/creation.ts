// Construction des combattants : héros à partir d'une fiche, monstres à partir d'un profil du SRD.
import { modificateur } from '../caracteristiques';
import type { Donnees } from '../donnees';
import type { Fiche } from '../fiche';
import { CARACTERISTIQUES, type Arme, type Caracteristique, type Monstre } from '../schemas';
import { DECK_ELAN_LANCEUR, DECK_ELAN_MARTIAL } from './cartes';
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
];

const CLASSES_LANCEUSES = ['barde', 'clerc', 'druide', 'ensorceleur', 'magicien', 'occultiste'];

export interface Kit {
  /**
   * Armes portées ; `botte` : l'arme fait partie des bottes maîtrisées. Une arme magique repose sur une arme du SRD (`id`) :
   * `nom` est son nom propre, `bonus` ses bonus d'attaque et de dégâts.
   */
  armes: { id: string; botte?: boolean; nom?: string; bonus?: { attaque: number; degats: number } }[];
  sorts?: string[];
  potions?: number;
}

function vierge(): Combattant['tour'] {
  return {
    mouvement: 0, action: true, bonus: true, attaquesRestantes: 0, desengage: false, esquive: false, aBouge: false,
    sortEmplacementLance: false, sortBonusLance: false, sournoiseUtilisee: false, proieUtilisee: false,
    enchainementUtilise: false, temeraire: false, elanJoue: false,
  };
}

function attaquesArme(fiche: Fiche, arme: Arme, botte: boolean): AttaqueArme[] {
  const mods = Object.fromEntries(CARACTERISTIQUES.map((c) => [c, fiche.caracteristiques[c].modificateur])) as Record<Caracteristique, number>;
  const finesse = arme.proprietes.includes('Finesse');
  const archerie = fiche.dons.includes('archerie') ? 2 : 0;
  const pb = fiche.bonusMaitrise;
  const b = botte ? BOTTES[arme.botte] : undefined;
  const res: AttaqueArme[] = [];
  if (arme.portee === 'distance') {
    const carac: Caracteristique = 'dex';
    res.push({
      id: arme.id, nom: arme.nom, mode: 'distance', caracteristique: carac, bonusAttaque: mods[carac] + pb + archerie,
      degats: [{ des: arme.degats, bonus: mods[carac], type: arme.typeDegats }], allonge: 0, portees: arme.portees, finesse, botte: b,
    });
    return res;
  }
  const carac: Caracteristique = finesse && mods.dex > mods.for ? 'dex' : 'for';
  const allonge = arme.proprietes.includes('Allonge') ? 3 : 1.5;
  res.push({
    id: arme.id, nom: arme.nom, mode: 'corps-a-corps', caracteristique: carac, bonusAttaque: mods[carac] + pb,
    degats: [{ des: arme.degats, bonus: mods[carac], type: arme.typeDegats }], allonge, finesse, botte: b,
  });
  if (arme.proprietes.includes('Lancer') && arme.portees) {
    res.push({
      id: `${arme.id}-lancer`, nom: `${arme.nom} (lancer)`, mode: 'distance', caracteristique: carac,
      bonusAttaque: mods[carac] + pb + archerie, degats: [{ des: arme.degats, bonus: mods[carac], type: arme.typeDegats }],
      allonge: 0, portees: arme.portees, finesse, botte: b,
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
};

/** Les ressources durables d'une fiche, à leur maximum (avec `potions` potions de départ). */
export function etatDurableMax(fiche: Fiche, potions = 0): EtatDurable {
  const col = fiche.colonnes;
  const traits = fiche.aptitudes.map((a) => a.id).filter((t) => TRAITS_COMBAT.includes(t));
  const ressources: Record<string, number> = { potions };
  if (traits.includes('rage')) ressources.rages = nombreColonne(col.Rages);
  if (traits.includes('second-souffle')) ressources.secondSouffle = nombreColonne(col['Second souffle']);
  if (traits.includes('fougue')) ressources.fougue = 1;
  if (traits.includes('survivance')) ressources.conduit = nombreColonne(col['Conduit divin']);
  let emplacements: number[] = [];
  const i = fiche.incantation;
  if (i) {
    emplacements = [...i.emplacements];
    // Magie de pacte : tous les emplacements sont du même niveau.
    if (i.niveauEmplacementPacte) emplacements = Array.from({ length: i.niveauEmplacementPacte }, (_, n) => (n === i.niveauEmplacementPacte! - 1 ? i.emplacements[0]! : 0));
  }
  return { ressources, emplacements };
}

export function heroDepuisFiche(fiche: Fiche, kit: Kit, donnees: Donnees, position: Position, id = fiche.nom.toLowerCase()): Combattant {
  const mods = Object.fromEntries(CARACTERISTIQUES.map((c) => [c, fiche.caracteristiques[c].modificateur])) as Record<Caracteristique, number>;
  const sauvegardes = Object.fromEntries(CARACTERISTIQUES.map((c) => [c, fiche.sauvegardes[c].bonus])) as Record<Caracteristique, number>;
  const attaques = kit.armes.flatMap((a) => {
    const arme = donnees.armes.get(a.id);
    if (!arme) throw new Error(`Arme inconnue : ${a.id}`);
    return attaquesArme(fiche, arme, !!a.botte).map((atq) => {
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
  const durable = etatDurableMax(fiche, kit.potions ?? 0);
  // Les ressources qui durent d'un combat à l'autre (potions, rages…), plus celles qui ne servent qu'en combat.
  const ressources: Record<string, number> = { reaction: 1, ...durable.ressources };
  const traits = fiche.aptitudes.map((a) => a.id).filter((t) => TRAITS_COMBAT.includes(t));
  if (traits.includes('rage')) ressources.degatsRage = nombreColonne(fiche.colonnes['Dégâts de Rage']);
  if (fiche.aptitudes.some((a) => a.id === 'attaque-supplementaire')) ressources.attaquesParAction = 2;
  let incantation: Combattant['incantation'];
  if (fiche.incantation) {
    const i = fiche.incantation;
    incantation = { dd: i.ddSauvegarde, bonusAttaque: i.bonusAttaque, modificateur: mods[i.caracteristique], emplacements: [...durable.emplacements], emplacementsMax: [...durable.emplacements] };
  }
  const lanceur = CLASSES_LANCEUSES.includes(fiche.classe);
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
  };
}

export function monstreDepuisProfil(m: Monstre, id: string, position: Position, nom = m.nom): Combattant {
  const mods = Object.fromEntries(CARACTERISTIQUES.map((c) => [c, modificateur(m.caracteristiques[c] ?? 10)])) as Record<Caracteristique, number>;
  const sauvegardes = Object.fromEntries(CARACTERISTIQUES.map((c) => [c, m.sauvegardes[c] ?? mods[c]])) as Record<Caracteristique, number>;
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
  };
}
