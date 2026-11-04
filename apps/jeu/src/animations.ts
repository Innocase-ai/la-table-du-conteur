// Animations pilotées par le journal du moteur.
// Le moteur applique une commande d'un coup ; on rejoue ensuite les nouvelles entrées du
// journal en file (déplacements, attaques, dégâts…). Pendant la file, l'affichage s'appuie
// sur des « surcharges » (position, PV, états…) qui partent de l'état d'avant la commande
// et avancent au rythme des animations ; à la fin, on revient à l'état réel du moteur.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Combattant, Donnees, EtatActif, EtatCombat, Evenement, Position } from '@crpg/regles';
import { estPhysique, estRayon, famille, familleDominante, formeSort, styleMort, type Famille, type FamillePhysique, type FormeSort } from './effets-visuels';
import { jouerSon, precharger } from './sons';
import { armeDuJournal, degatsDeLAttaque, sonAuLancement, sonDeCoup, sonDeRate, sonDeSort, sonDeTir, type Son } from './sons-regles';

export interface Surcharge {
  position: Position;
  pv: number;
  pvTemp: number;
  mort: boolean;
  enFuite: boolean;
  etats: EtatActif[];
}

export type Effet =
  | { id: number; type: 'projectile'; de: Position; vers: Position; style: 'fleche' | 'trait' | Exclude<FormeSort, 'zigzag' | 'rayon'>; couleur: string; duree: number }
  /** Rayon instantané d'un sort (éclair en zigzag, faisceau) : il apparaît d'un coup, puis s'éteint. */
  | { id: number; type: 'rayon'; de: Position; vers: Position; forme: 'zigzag' | 'rayon'; couleur: string; duree: number }
  /** Cercle d'incantation, tracé sous le lanceur. */
  | { id: number; type: 'cercle'; position: Position; couleur: string; duree: number }
  | { id: number; type: 'texte'; position: Position; texte: string; classe: string; duree: number; decalage?: number }
  | { id: number; type: 'bulle'; position: Position; texte: string; duree: number }
  /** Zone d'effet ; avec `origine` et `delai`, elle se propage case après case depuis l'origine (délai par case, en ms). */
  | { id: number; type: 'zone'; cases: Position[]; couleur: string; duree: number; origine?: Position; delai?: number }
  | { id: number; type: 'lueur'; position: Position; couleur: string; duree: number }
  /** Impact d'une famille de dégâts sur une case (éclat, particules) ; `gros` pour une mort ou un critique. */
  | { id: number; type: 'impact'; position: Position; famille: Famille; gros: boolean; duree: number }
  /** Coup d'arme : arc de lame, estoc ou onde de choc, orienté de l'attaquant vers la cible (angle en radians). */
  | { id: number; type: 'lame'; position: Position; angle: number; genre: FamillePhysique; duree: number }
  /** Le plateau tremble et se rapproche de la cible (critique, tonnerre). */
  | { id: number; type: 'secousse'; position: Position; fort: boolean; duree: number };

type SansId<T> = T extends unknown ? Omit<T, 'id'> : never;
export type EffetSansId = SansId<Effet>;

export interface Coup {
  famille: Famille;
  /** Case de la cible. */
  position: Position;
  /** Direction du coup, de l'attaquant vers la cible (radians). */
  angle: number;
  valeur: number;
  critique: boolean;
  reaction?: 'resiste' | 'vulnerable' | 'immunise';
}

/** Les effets visuels d'un coup qui porte : arme, impact, secousse, chiffre et mention de résistance. */
export function effetsDeCoup(c: Coup, reduit: boolean): EffetSansId[] {
  const effets: EffetSansId[] = [];
  if (c.valeur > 0 && !reduit) {
    if (estPhysique(c.famille)) effets.push({ type: 'lame', position: c.position, angle: c.angle, genre: c.famille, duree: c.famille === 'tranchant' ? 420 : 360 });
    effets.push({ type: 'impact', position: c.position, famille: c.famille, gros: c.critique, duree: c.famille === 'feu' || c.famille === 'necrotique' ? 900 : 650 });
    if (c.critique || c.famille === 'tonnerre') effets.push({ type: 'secousse', position: c.position, fort: c.critique, duree: 420 });
  }
  effets.push({
    type: 'texte',
    position: c.position,
    texte: c.valeur > 0 ? `−${c.valeur}` : '0',
    classe: `ft-degats ft-t-${c.famille}${c.critique ? ' ft-gros' : ''}`,
    duree: 1100,
  });
  if (c.reaction) {
    const libelle = c.reaction === 'resiste' ? 'Résiste' : c.reaction === 'vulnerable' ? 'Vulnérable !' : 'Immunisé';
    effets.push({ type: 'texte', position: c.position, texte: libelle, classe: `ft-reaction ft-reaction-${c.reaction}`, duree: 1200, decalage: -0.42 });
  }
  return effets;
}

/** Ce qui traverse le plateau quand un sort est lancé de `de` vers `vers` : projectile ou rayon, selon le sort. */
export function effetDeSort(donnees: Donnees, sortId: string | undefined, de: Position, vers: Position, duree: number): EffetSansId {
  const type = sortId ? donnees.sorts.get(sortId)?.degats[0]?.type : undefined;
  const forme = formeSort(sortId, famille(type));
  const couleur = couleurSort(donnees, sortId);
  if (estRayon(forme)) return { type: 'rayon', de, vers, forme, couleur, duree: Math.max(duree, 450) };
  // Un jet d'acide décrit un arc et met plus de temps à arriver.
  return { type: 'projectile', de, vers, style: forme, couleur, duree: forme === 'lob' ? Math.round(duree * 1.35) : duree };
}

export interface Vue {
  surcharges: Map<string, Surcharge>;
  actif?: number;
  round?: number;
  journal?: number;
  effets: Effet[];
}

export interface Instantane {
  surcharges: Map<string, Surcharge>;
  actif: number;
  round: number;
  journal: number;
}

/** État affiché avant une commande (à passer à `jouer` après l'exécution). */
export function capturer(etat: EtatCombat): Instantane {
  return {
    surcharges: new Map(
      etat.combattants.map((c) => [
        c.id,
        { position: { ...c.position }, pv: c.pv, pvTemp: c.pvTemp, mort: c.mort, enFuite: c.enFuite, etats: c.etats.map((e) => ({ ...e })) },
      ]),
    ),
    actif: etat.actif,
    round: etat.round,
    journal: etat.journal.length,
  };
}

/** Combattants tels qu'affichés pendant la file. */
export function etatAffiche(etat: EtatCombat, vue: Vue, enCours: boolean): EtatCombat {
  if (!enCours) return etat;
  return {
    ...etat,
    combattants: etat.combattants.map((c) => {
      const s = vue.surcharges.get(c.id);
      return s ? { ...c, ...s } : c;
    }),
    actif: vue.actif ?? etat.actif,
    round: vue.round ?? etat.round,
  };
}

// ---------------------------------------------------------------------------
// Couleurs
// ---------------------------------------------------------------------------

const COULEURS_TYPES: Record<string, string> = {
  feu: '#ff8a3c',
  froid: '#9fe2ff',
  foudre: '#ffe45c',
  radiant: '#fff0b5',
  force: '#b98cff',
  necrotique: '#6fdc8c',
  nécrotique: '#6fdc8c',
  poison: '#a8ff3c',
  acide: '#a8ff3c',
  tonnerre: '#c9d4ff',
  psychique: '#ff8ad8',
};

const COULEURS_SORTS: Record<string, string> = {
  soins: '#7fe0a0',
  'mot-de-guerison': '#7fe0a0',
  aide: '#7fe0a0',
  benediction: '#f0cd84',
  'bouclier-de-la-foi': '#f0cd84',
  fleau: '#6fdc8c',
  sommeil: '#c8a8ff',
  'immobilisation-de-personne': '#d9b3ff',
  'marque-du-chasseur': '#7fe0a0',
  'arme-spirituelle': '#b98cff',
};

export function couleurSort(donnees: Donnees, id: string | undefined): string {
  if (!id) return '#d4ae66';
  const type = donnees.sorts.get(id)?.degats[0]?.type;
  return (type && COULEURS_TYPES[type]) ?? COULEURS_SORTS[id] ?? '#d4ae66';
}

// ---------------------------------------------------------------------------
// Construction de la file
// ---------------------------------------------------------------------------

interface Pas {
  duree: number;
  appliquer: () => void;
}

interface Outils {
  vue: () => Vue;
  effet: (e: EffetSansId) => void;
  animer: (id: string, images: Keyframe[], duree: number) => void;
  /** Joue un bruitage (sans effet si le joueur a coupé le son). */
  son: (nom: Son) => void;
}

function distanceCases(a: Position, b: Position): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function signe(n: number): string {
  return n >= 0 ? `+ ${n}` : `− ${-n}`;
}

const SECOUSSE: Keyframe[] = [
  { transform: 'translateX(0)', filter: 'none' },
  { transform: 'translateX(-14%)', filter: 'brightness(1.8) drop-shadow(0 0 6px #ff3b2f)' },
  { transform: 'translateX(11%)', filter: 'brightness(1.5) drop-shadow(0 0 6px #ff3b2f)' },
  { transform: 'translateX(-7%)' },
  { transform: 'translateX(4%)' },
  { transform: 'translateX(0)', filter: 'none' },
];

const FLASH: Keyframe[] = [{ filter: 'none' }, { filter: 'brightness(1.9) drop-shadow(0 0 6px #ff3b2f)' }, { filter: 'none' }];

function construire(etat: EtatCombat, inst: Instantane, donnees: Donnees, o: Outils, reduit: boolean): Pas[] {
  const pas: Pas[] = [];
  const positions = new Map([...inst.surcharges].map(([id, s]) => [id, { ...s.position }]));
  const pos = (id: string | undefined) => (id ? positions.get(id) : undefined);
  const s = (id: string) => o.vue().surcharges.get(id);
  const reel = (id: string): Combattant | undefined => etat.combattants.find((c) => c.id === id);
  // Dernière famille de dégâts reçue par chacun : la mort s'habille comme le coup fatal.
  const derniereFamille = new Map<string, Famille>();
  // D'où vient le coup en cours (arme, sort, à distance) : décide du bruitage des dégâts qui suivent.
  // `sonJoue` : le bruit du coup a déjà été joué quand la cible a été touchée (ne pas le rejouer avec les dégâts).
  let contexte: { sort?: string; arme?: string; distance?: boolean; sonJoue?: boolean } = {};
  /** Le son d'un sort, d'après le sort et la famille de ses dégâts. */
  const sonDuSort = (id: string | undefined) => sonDeSort(id, famille(id ? donnees.sorts.get(id)?.degats[0]?.type : undefined));

  const nouveaux = etat.journal.slice(inst.journal);
  nouveaux.forEach((ev: Evenement, i) => {
    const index = inst.journal + i + 1;
    const d = ev.details ?? {};
    const local: Pas[] = [];
    const ajouter = (duree: number, appliquer: () => void = () => {}) => local.push({ duree, appliquer });
    /** Un bruitage, joué à cet endroit de la file (le son ne dépend pas du réglage « mouvement réduit »). */
    const jouer = (nom: Son | undefined) => {
      if (nom) ajouter(0, () => o.son(nom));
    };

    switch (ev.type) {
      case 'deplacement': {
        const id = ev.acteur;
        if (!id || !d.chemin?.length) break;
        for (const p of d.chemin) {
          positions.set(id, { ...p });
          ajouter(reduit ? 40 : 110, () => {
            const x = s(id);
            if (x) x.position = { ...p };
          });
        }
        break;
      }
      case 'attaque': {
        const a = pos(ev.acteur);
        const b = pos(ev.cible);
        contexte = { sort: d.sort, arme: armeDuJournal(ev.texte), distance: !!d.distance };
        // Le bruit d'un coup d'arme part quand la cible est touchée (sa secousse), pas avec l'affichage des dégâts qui suit :
        // on va chercher dans le journal les dégâts que porte cette attaque pour savoir quel son jouer.
        const portes = d.resultat === 'touche' || d.resultat === 'critique' ? degatsDeLAttaque(nouveaux, i) : undefined;
        const sonImpact =
          portes && (portes.valeur ?? 0) > 0
            ? sonDeCoup({ famille: familleDominante(portes.details?.types), arme: contexte.arme, sort: !!d.sort, distance: !!d.distance })
            : undefined;
        contexte.sonJoue = !!sonImpact;
        if (!a || !b || !ev.acteur || !ev.cible) break;
        const acteur = ev.acteur;
        const cible = ev.cible;
        // Le bruit du départ : la corde d'un arc, ou le sort qui part (au contact comme à distance).
        jouer(d.sort ? sonDuSort(d.sort) : d.distance ? sonDeTir(contexte.arme) : undefined);
        // Élan ou projectile.
        if (d.distance) {
          if (!reduit) {
            const duree = Math.max(160, Math.min(420, distanceCases(a, b) * 40));
            if (d.sort) {
              // Un sort a son projectile (boule, éclat de glace, dard…) ou son rayon.
              ajouter(duree, () => o.effet(effetDeSort(donnees, d.sort, a, b, duree)));
            } else {
              const style = d.sauvegarde ? 'trait' : 'fleche';
              const couleur = d.sauvegarde ? '#c9b48a' : '#e8d6b0';
              ajouter(duree, () => o.effet({ type: 'projectile', de: a, vers: b, style, couleur, duree }));
            }
          }
        } else if (!reduit) {
          const dx = Math.sign(b.x - a.x);
          const dy = Math.sign(b.y - a.y);
          ajouter(170, () =>
            o.animer(
              acteur,
              [{ transform: 'translate(0, 0)' }, { transform: `translate(${dx * 38}%, ${dy * 38}%)`, offset: 0.45 }, { transform: 'translate(0, 0)' }],
              300,
            ),
          );
        }
        // Bulle de dé près de l'attaquant.
        const bulle = () => {
          if (d.de === undefined || d.total === undefined) return;
          const fleche = d.avantage ? '⇈ ' : d.desavantage ? '⇊ ' : '';
          o.effet({ type: 'bulle', position: a, texte: `${fleche}${d.de} ${signe(d.total - d.de)} = ${d.total}${d.ca !== undefined ? ` contre CA ${d.ca}` : ''}`, duree: 1200 });
        };
        if (d.resultat === 'rate') {
          // Une arme qui rate siffle dans le vide (un sort qui rate n'a pas de bruit propre).
          jouer(sonDeRate({ sort: !!d.sort }));
          ajouter(260, () => {
            bulle();
            o.effet({ type: 'texte', position: b, texte: 'Raté !', classe: 'ft-rate', duree: 1000 });
          });
        } else if (d.resultat === 'touche' || d.resultat === 'critique') {
          const critique = d.resultat === 'critique';
          // Les dégâts (arc de lame, impact, chiffre) suivent de près la secousse : le coup se voit et s'entend d'un bloc.
          ajouter(critique ? 240 : 110, () => {
            bulle();
            if (sonImpact) o.son(sonImpact);
            o.animer(cible, reduit ? FLASH : SECOUSSE, critique ? 420 : 300);
            if (critique) o.effet({ type: 'texte', position: b, texte: 'Critique !', classe: 'ft-critique', duree: 1300 });
          });
        } else if (d.sauvegarde) {
          ajouter(220, () => {
            if (d.sauvegarde === 'ratee') o.animer(cible, reduit ? FLASH : SECOUSSE, 300);
            else o.effet({ type: 'texte', position: b, texte: 'Résiste !', classe: 'ft-resiste', duree: 1000 });
          });
        }
        break;
      }
      case 'degats': {
        const id = ev.cible;
        const b = pos(id);
        if (!id || !b) break;
        const valeur = ev.valeur ?? 0;
        const fam = familleDominante(d.types);
        if (valeur > 0) derniereFamille.set(id, fam);
        const source = pos(ev.acteur);
        // Direction du coup : de l'attaquant vers la cible (à défaut, une diagonale descendante).
        const angle = source && (source.x !== b.x || source.y !== b.y) ? Math.atan2(b.y - source.y, b.x - source.x) : -0.6;
        // Un critique marque un temps d'arrêt avant que le coup ne porte.
        if (d.critique && !reduit && valeur > 0) ajouter(90);
        // Le bruit du coup, au moment où il porte (les dégâts d'un sort n'en ont pas : le sort a eu le sien au départ).
        if (valeur > 0 && !contexte.sonJoue) jouer(sonDeCoup({ famille: fam, arme: contexte.arme, sort: !!contexte.sort, distance: contexte.distance }));
        contexte.sonJoue = false;
        ajouter(300, () => {
          const x = s(id);
          if (x) {
            const absorbe = Math.min(x.pvTemp, valeur);
            x.pvTemp -= absorbe;
            x.pv = Math.max(0, x.pv - (valeur - absorbe));
          }
          for (const e of effetsDeCoup({ famille: fam, position: b, angle, valeur, critique: !!d.critique, reaction: d.reaction }, reduit)) o.effet(e);
        });
        break;
      }
      case 'soins': {
        const id = ev.cible;
        const b = pos(id);
        if (!id || !b || !ev.valeur) break;
        const valeur = ev.valeur;
        const max = reel(id)?.pvMax ?? Infinity;
        jouer('soin');
        ajouter(300, () => {
          const x = s(id);
          if (x) x.pv = Math.min(max, Math.max(0, x.pv) + valeur);
          o.effet({ type: 'texte', position: b, texte: `+${valeur}`, classe: 'ft-soins', duree: 1100 });
          o.effet({ type: 'lueur', position: b, couleur: '#7fe0a0', duree: 600 });
        });
        break;
      }
      case 'sort': {
        const a = pos(ev.acteur);
        const b = pos(ev.cible);
        if (d.sort) contexte = { sort: d.sort };
        if (d.sauvegarde && ev.cible && b) {
          const cible = ev.cible;
          // Le bruit d'un sort à jet de sauvegarde (flamme sacrée, blessure, immobilisation…) ; pour une zone, il joue une
          // seule fois, au départ de la zone, pas à chaque créature atteinte.
          if (d.sort && !donnees.sorts.get(d.sort)?.zone) jouer(sonDuSort(d.sort));
          if (d.distance && a && !reduit) {
            const duree = Math.max(160, Math.min(420, distanceCases(a, b) * 40));
            ajouter(duree, () => o.effet(effetDeSort(donnees, d.sort, a, b, duree)));
          }
          ajouter(220, () => {
            if (d.sauvegarde === 'ratee') o.animer(cible, reduit ? FLASH : SECOUSSE, 300);
            else o.effet({ type: 'texte', position: b, texte: 'Sauvegarde !', classe: 'ft-resiste', duree: 1000 });
          });
        } else if (d.sort && a) {
          const couleur = couleurSort(donnees, d.sort);
          const definition = donnees.sorts.get(d.sort);
          const typeDegats = definition?.degats[0]?.type;
          // Un sort de soutien (bouclier, bénédiction, aide, marque, malédiction) a son bruit dès le lancement : rien ne
          // traverse le plateau.
          jouer(sonAuLancement(d.sort));
          // Incantation : un cercle de runes se trace sous le lanceur (une simple lueur en mouvement réduit).
          ajouter(d.cases?.length ? 200 : 300, () =>
            o.effet(reduit ? { type: 'lueur', position: a, couleur, duree: 600 } : { type: 'cercle', position: a, couleur, duree: 850 }),
          );
          if (d.cases?.length) {
            const cases = d.cases;
            // La zone part de son centre (le point visé, ou le lanceur pour un sort personnel) et s'étend case après case.
            const origine = definition?.portee.type === 'personnel' || !d.point ? a : d.point;
            const rayon = Math.max(0, ...cases.map((p) => distanceCases(origine, p)));
            jouer(sonDuSort(d.sort));
            ajouter(Math.min(720, 240 + rayon * 60), () => {
              o.effet({ type: 'zone', cases, couleur, duree: 520 + (reduit ? 0 : rayon * 60), origine, delai: reduit ? 0 : 60 });
              // Une explosion à l'origine pour les sorts de dégâts lancés à distance (pas pour un souffle parti du lanceur).
              if (!reduit && typeDegats && definition?.portee.type !== 'personnel') {
                o.effet({ type: 'impact', position: origine, famille: famille(typeDegats), gros: true, duree: 900 });
              }
            });
          }
        } else if (b && !ev.details) {
          ajouter(160, () => o.effet({ type: 'lueur', position: b, couleur: '#f0cd84', duree: 500 }));
        }
        break;
      }
      case 'etat': {
        const id = ev.cible ?? ev.acteur;
        const c = id && reel(id);
        if (!id || !c) break;
        const etats = c.etats.map((e) => ({ ...e }));
        ajouter(160, () => {
          const x = s(id);
          if (x) x.etats = etats;
        });
        break;
      }
      case 'mort': {
        const id = ev.cible;
        const c = id && reel(id);
        if (!id || !c) break;
        const etats = c.etats.map((e) => ({ ...e }));
        const fam = derniereFamille.get(id) ?? 'contondant';
        const style = styleMort(fam, c.mort);
        const lieu = pos(id);
        ajouter(style.duree, () => {
          o.animer(id, style.images, style.duree);
          if (c.mort && lieu && !reduit) o.effet({ type: 'impact', position: lieu, famille: fam, gros: true, duree: 900 });
        });
        ajouter(0, () => {
          const x = s(id);
          if (!x) return;
          x.mort = c.mort;
          x.pv = Math.min(x.pv, 0);
          x.etats = etats;
        });
        break;
      }
      case 'tour': {
        contexte = {};
        const idx = ev.acteur ? etat.ordre.indexOf(ev.acteur) : -1;
        if (idx >= 0)
          ajouter(140, () => {
            o.vue().actif = idx;
          });
        break;
      }
      case 'info': {
        const m = /^Round (\d+)\.$/.exec(ev.texte);
        if (m) {
          const round = Number(m[1]);
          ajouter(0, () => {
            o.vue().round = round;
          });
        }
        break;
      }
      default:
        break;
    }
    // Le journal s'affiche au rythme des animations.
    const premier = local[0];
    if (premier) {
      const f = premier.appliquer;
      premier.appliquer = () => {
        o.vue().journal = index;
        f();
      };
      pas.push(...local);
    } else {
      pas.push({
        duree: 0,
        appliquer: () => {
          o.vue().journal = index;
        },
      });
    }
  });
  return pas;
}

// ---------------------------------------------------------------------------
// File et minuterie
// ---------------------------------------------------------------------------

export function mouvementReduit(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function useAnimations(donnees: Donnees, facteur: number) {
  const [, setTic] = useState(0);
  const [enCours, setEnCours] = useState(false);
  const vue = useRef<Vue>({ surcharges: new Map(), effets: [] });
  const file = useRef<Pas[]>([]);
  const minuteur = useRef<number | undefined>(undefined);
  const minuteursEffets = useRef(new Set<number>());
  const elements = useRef(new Map<string, HTMLElement>());
  const facteurRef = useRef(facteur);
  facteurRef.current = facteur;
  const prochainId = useRef(1);
  const forcer = useCallback(() => setTic((t) => t + 1), []);

  const outils: Outils = {
    vue: () => vue.current,
    effet: (e) => {
      const id = prochainId.current++;
      vue.current.effets = [...vue.current.effets, { ...e, id } as Effet];
      const t = window.setTimeout(() => {
        minuteursEffets.current.delete(t);
        vue.current.effets = vue.current.effets.filter((x) => x.id !== id);
        forcer();
      }, e.duree * facteurRef.current + 50);
      minuteursEffets.current.add(t);
    },
    animer: (id, images, duree) => {
      const el = elements.current.get(id);
      el?.animate?.(images, { duration: duree * facteurRef.current, easing: 'ease-out' });
    },
    son: (nom) => jouerSon(nom),
  };

  const finir = useCallback(() => {
    window.clearTimeout(minuteur.current);
    file.current = [];
    vue.current = { surcharges: new Map(), effets: vue.current.effets };
    setEnCours(false);
    forcer();
  }, [forcer]);

  const suivant = () => {
    let p = file.current.shift();
    // Les pas sans durée sont appliqués d'un coup.
    while (p && p.duree === 0) {
      p.appliquer();
      p = file.current.shift();
    }
    if (!p) {
      finir();
      return;
    }
    p.appliquer();
    forcer();
    minuteur.current = window.setTimeout(suivant, p.duree * facteurRef.current);
  };

  /** Rejoue les entrées du journal ajoutées depuis l'instantané. */
  const jouer = (etat: EtatCombat, inst: Instantane) => {
    if (file.current.length) terminer();
    vue.current = {
      surcharges: new Map([...inst.surcharges].map(([id, x]) => [id, { ...x, position: { ...x.position }, etats: [...x.etats] }])),
      actif: inst.actif,
      round: inst.round,
      journal: inst.journal,
      effets: vue.current.effets,
    };
    const pas = construire(etat, inst, donnees, outils, mouvementReduit());
    if (!pas.length) {
      finir();
      return;
    }
    file.current = pas;
    setEnCours(true);
    suivant();
  };

  /** Termine la file immédiatement (le joueur a cliqué pendant les animations). */
  const terminer = () => {
    for (const t of minuteursEffets.current) window.clearTimeout(t);
    minuteursEffets.current.clear();
    vue.current.effets = [];
    for (const el of elements.current.values()) for (const a of el.getAnimations?.() ?? []) a.finish();
    finir();
  };

  useEffect(() => {
    precharger();
    return () => {
      window.clearTimeout(minuteur.current);
      for (const t of minuteursEffets.current) window.clearTimeout(t);
    };
  }, []);

  return { vue: vue.current, enCours, jouer, terminer, elements: elements.current };
}
