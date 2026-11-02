// Animations pilotées par le journal du moteur.
// Le moteur applique une commande d'un coup ; on rejoue ensuite les nouvelles entrées du
// journal en file (déplacements, attaques, dégâts…). Pendant la file, l'affichage s'appuie
// sur des « surcharges » (position, PV, états…) qui partent de l'état d'avant la commande
// et avancent au rythme des animations ; à la fin, on revient à l'état réel du moteur.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Combattant, Donnees, EtatActif, EtatCombat, Evenement, Position } from '@crpg/regles';

export interface Surcharge {
  position: Position;
  pv: number;
  pvTemp: number;
  mort: boolean;
  enFuite: boolean;
  etats: EtatActif[];
}

export type Effet =
  | { id: number; type: 'projectile'; de: Position; vers: Position; style: 'fleche' | 'trait'; couleur: string; duree: number }
  | { id: number; type: 'texte'; position: Position; texte: string; classe: string; duree: number }
  | { id: number; type: 'bulle'; position: Position; texte: string; duree: number }
  | { id: number; type: 'zone'; cases: Position[]; couleur: string; duree: number }
  | { id: number; type: 'lueur'; position: Position; couleur: string; duree: number };

type SansId<T> = T extends unknown ? Omit<T, 'id'> : never;
type EffetSansId = SansId<Effet>;

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

  etat.journal.slice(inst.journal).forEach((ev: Evenement, i) => {
    const index = inst.journal + i + 1;
    const d = ev.details ?? {};
    const local: Pas[] = [];
    const ajouter = (duree: number, appliquer: () => void = () => {}) => local.push({ duree, appliquer });

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
        if (!a || !b || !ev.acteur || !ev.cible) break;
        const acteur = ev.acteur;
        const cible = ev.cible;
        // Élan ou projectile.
        if (d.distance) {
          if (!reduit) {
            const duree = Math.max(160, Math.min(420, distanceCases(a, b) * 40));
            const style = d.sort || d.sauvegarde ? 'trait' : 'fleche';
            const couleur = d.sort ? couleurSort(donnees, d.sort) : d.sauvegarde ? '#c9b48a' : '#e8d6b0';
            ajouter(duree, () => o.effet({ type: 'projectile', de: a, vers: b, style, couleur, duree }));
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
          ajouter(260, () => {
            bulle();
            o.effet({ type: 'texte', position: b, texte: 'Raté !', classe: 'ft-rate', duree: 1000 });
          });
        } else if (d.resultat === 'touche' || d.resultat === 'critique') {
          const critique = d.resultat === 'critique';
          ajouter(critique ? 340 : 220, () => {
            bulle();
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
        ajouter(300, () => {
          const x = s(id);
          if (x) {
            const absorbe = Math.min(x.pvTemp, valeur);
            x.pvTemp -= absorbe;
            x.pv = Math.max(0, x.pv - (valeur - absorbe));
          }
          o.effet({
            type: 'texte',
            position: b,
            texte: valeur > 0 ? `−${valeur}` : '0',
            classe: d.critique ? 'ft-degats ft-gros' : 'ft-degats',
            duree: 1100,
          });
        });
        break;
      }
      case 'soins': {
        const id = ev.cible;
        const b = pos(id);
        if (!id || !b || !ev.valeur) break;
        const valeur = ev.valeur;
        const max = reel(id)?.pvMax ?? Infinity;
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
        if (d.sauvegarde && ev.cible && b) {
          const cible = ev.cible;
          if (d.distance && a && !reduit) {
            const duree = Math.max(160, Math.min(420, distanceCases(a, b) * 40));
            const couleur = couleurSort(donnees, d.sort);
            ajouter(duree, () => o.effet({ type: 'projectile', de: a, vers: b, style: 'trait', couleur, duree }));
          }
          ajouter(220, () => {
            if (d.sauvegarde === 'ratee') o.animer(cible, reduit ? FLASH : SECOUSSE, 300);
            else o.effet({ type: 'texte', position: b, texte: 'Sauvegarde !', classe: 'ft-resiste', duree: 1000 });
          });
        } else if (d.sort && a) {
          const couleur = couleurSort(donnees, d.sort);
          ajouter(d.cases?.length ? 120 : 260, () => o.effet({ type: 'lueur', position: a, couleur, duree: 600 }));
          if (d.cases?.length) {
            const cases = d.cases;
            ajouter(480, () => o.effet({ type: 'zone', cases, couleur, duree: 700 }));
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
        ajouter(c.mort ? 560 : 300, () =>
          o.animer(
            id,
            [
              { opacity: 1, transform: 'scale(1) translateY(0)' },
              { opacity: 0.35, transform: 'scale(0.72) translateY(14%) rotate(-8deg)' },
            ],
            c.mort ? 560 : 300,
          ),
        );
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

  useEffect(
    () => () => {
      window.clearTimeout(minuteur.current);
      for (const t of minuteursEffets.current) window.clearTimeout(t);
    },
    [],
  );

  return { vue: vue.current, enCours, jouer, terminer, elements: elements.current };
}
