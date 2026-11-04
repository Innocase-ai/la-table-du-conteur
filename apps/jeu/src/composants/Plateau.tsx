import { useEffect, useRef, useState } from 'react';
import { cle, etatApparent, typeCase, type Combattant, type EtatCombat, type Position, type Terrain } from '@crpg/regles';
import { LIBELLES_APPARENT, nomClasse } from '../libelles';
import type { Donnees } from '@crpg/regles';
import type { Effet } from '../animations';
import { COULEURS_FAMILLES, type Famille } from '../effets-visuels';
import { textureTerrain } from '../visuels';
import { Jeton } from './Jeton';

export interface Surcouches {
  /** Cases atteignables par le héros actif (clé « x,y » → coût en mètres). */
  atteignables: Map<string, number>;
  /** Chemin survolé. */
  chemin: Set<string>;
  /** Cases de la zone d'effet prévisualisée. */
  zone: Set<string>;
  /** Cases à portée d'un sort de zone. */
  portee: Set<string>;
  ciblesValides: Set<string>;
  ciblesChoisies: Map<string, number>;
  modeCible: 'aucun' | 'cibles' | 'point';
}

interface Props {
  etat: EtatCombat;
  donnees: Donnees;
  actifId: string;
  /** Ambiance du plateau (textures) ; sans elle, les cases gardent leurs couleurs unies. */
  terrain?: Terrain;
  surcouches: Surcouches;
  onSurvolCase: (p: Position | null) => void;
  onClicCase: (p: Position) => void;
  onClicJeton: (c: Combattant) => void;
  onSurvolJeton: (id: string | null) => void;
  /** Effets d'animation en cours (projectiles, chiffres flottants…). */
  effets: Effet[];
  /** Éléments des jetons, pour les animations (élan, secousse, mort). */
  elements: Map<string, HTMLElement>;
  /** Multiplicateur des durées d'animation (accéléré < 1). */
  vitesse: number;
}

/** Plateau vu de dessus : cases carrées. */
const INCLINAISON = 1;
/** Léger relief des murs (fraction d'une case) : leur dessus est décalé vers le haut, une face sombre en dessous. */
const HAUTEUR_MUR = 0.22;
/** Une texture couvre 4 × 4 cases avant de se répéter (elles sont raccordables). */
const REPETITION = 4;
const COTE_MIN = 24;
const COTE_MAX = 160;
/** En dessous, on préfère faire défiler le plateau plutôt que rapetisser les jetons. */
const COTE_CONFORT = 52;
/** Diamètre d'un jeton (fraction d'une case) ; les grandes créatures remplissent leur case. */
const TAILLE_JETON = 0.9;
const TAILLE_JETON_GRAND = 1;

export interface Geometrie {
  cote: number;
  /** Hauteur d'une case à l'écran. */
  hc: number;
  /** Marge au-dessus de la première rangée, où dépasse le relief des murs. */
  marge: number;
}

/** Centre d'une case (départ et arrivée des projectiles, lueurs, textes). */
const centre = (p: Position, g: Geometrie) => ({ x: (p.x + 0.5) * g.cote, y: g.marge + (p.y + 0.5) * g.hc });

export function Plateau({ etat, donnees, actifId, terrain, surcouches, onSurvolCase, onClicCase, onClicJeton, onSurvolJeton, effets, elements, vitesse }: Props) {
  const conteneur = useRef<HTMLDivElement>(null);
  const [ajuste, setAjuste] = useState(36);
  const [zoom, setZoom] = useState(1);
  const [infobulle, setInfobulle] = useState<string | null>(null);
  const { largeur, hauteur } = etat.grille;
  const margeRelative = HAUTEUR_MUR * INCLINAISON;

  useEffect(() => {
    const el = conteneur.current;
    if (!el) return;
    const ajuster = () => {
      const w = el.clientWidth - 16;
      const h = el.clientHeight - 16;
      // Hauteur totale : les rangées inclinées plus la marge du haut.
      setAjuste(Math.floor(Math.min(w / largeur, (h - 6) / (hauteur * INCLINAISON + margeRelative))));
    };
    ajuster();
    const obs = new ResizeObserver(ajuster);
    obs.observe(el);
    return () => obs.disconnect();
  }, [largeur, hauteur, margeRelative]);

  // Ctrl + molette : zoom (écouteur non passif pour empêcher le zoom de la page).
  useEffect(() => {
    const el = conteneur.current;
    if (!el) return;
    const molette = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZoom((z) => Math.min(3, Math.max(0.4, z * (e.deltaY < 0 ? 1.1 : 1 / 1.1))));
    };
    el.addEventListener('wheel', molette, { passive: false });
    return () => el.removeEventListener('wheel', molette);
  }, []);

  // Le combattant actif reste visible quand le plateau défile.
  useEffect(() => {
    elements.get(actifId)?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [actifId, elements]);

  const base = Math.max(ajuste, COTE_CONFORT);
  const cote = Math.max(COTE_MIN, Math.min(COTE_MAX, Math.round(base * zoom)));
  const g: Geometrie = { cote, hc: Math.round(cote * INCLINAISON), marge: Math.round(cote * margeRelative) };
  const hMur = Math.round(g.hc * HAUTEUR_MUR);

  const cases = [];
  const murs = [];
  for (let y = 0; y < hauteur; y++) {
    for (let x = 0; x < largeur; x++) {
      const p = { x, y };
      const k = cle(p);
      const type = typeCase(etat.grille, p);
      const classes = ['case', `case-${type}`];
      if (surcouches.atteignables.has(k)) classes.push('case-atteignable');
      if (surcouches.chemin.has(k)) classes.push('case-chemin');
      if (surcouches.portee.has(k)) classes.push('case-portee');
      if (surcouches.zone.has(k)) classes.push('case-zone');
      const texture = (t: 'sol' | 'difficile' | 'mur') => {
        const url = textureTerrain(terrain, t);
        return url
          ? {
              backgroundImage: `url(${url})`,
              backgroundSize: `${REPETITION * g.cote}px ${REPETITION * g.hc}px`,
              backgroundPosition: `${-(x % REPETITION) * g.cote}px ${-(y % REPETITION) * g.hc}px`,
            }
          : {};
      };
      if (textureTerrain(terrain, 'sol')) classes.push('case-texturee');
      cases.push(
        <div
          key={k}
          className={classes.join(' ')}
          style={{ left: x * g.cote, top: g.marge + y * g.hc, width: g.cote, height: g.hc, ...(type === 'mur' ? {} : texture(type)) }}
          onMouseEnter={() => onSurvolCase(p)}
          onClick={() => type !== 'mur' && onClicCase(p)}
        >
          {type === 'difficile' && !textureTerrain(terrain, 'difficile') && <span className="motif-difficile" />}
        </div>,
      );
      if (type === 'mur') {
        // Un mur est un bloc en relief : son dessus est décalé vers le haut, sa face avant tombe sur la case.
        murs.push(
          <div key={`m${k}`} className="mur" style={{ left: x * g.cote, top: g.marge + y * g.hc - hMur, width: g.cote, height: g.hc + hMur, zIndex: 10 + y * 3 }}>
            <div className="mur-dessus" style={{ height: g.hc, ...texture('mur') }} />
            <div className="mur-face" style={{ height: hMur, ...texture('mur') }} />
          </div>,
        );
      }
    }
  }

  const visibles = etat.combattants.filter((c) => !c.enFuite);
  // Les morts d'abord, pour que les vivants passent au-dessus.
  visibles.sort((a, b) => Number(b.mort) - Number(a.mort));
  const survole = infobulle ? etat.combattants.find((c) => c.id === infobulle) : undefined;
  // Un coup critique fait trembler le plateau et le rapproche de la cible.
  const secousse = effets.find((e) => e.type === 'secousse');
  const origineSecousse = secousse ? centre(secousse.position, g) : undefined;

  return (
    <div className="plateau-conteneur" ref={conteneur}>
      <div
        className={`plateau mode-${surcouches.modeCible}${terrain ? ` terrain-${terrain}` : ''}${secousse ? (secousse.fort ? ' plateau-secoue plateau-secoue-fort' : ' plateau-secoue') : ''}`}
        style={{
          width: largeur * g.cote,
          height: g.marge + hauteur * g.hc,
          ['--vitesse' as string]: vitesse,
          ['--cote' as string]: `${g.cote}px`,
          ...(secousse && origineSecousse
            ? { transformOrigin: `${origineSecousse.x}px ${origineSecousse.y}px`, animationDuration: `${Math.round(secousse.duree * vitesse)}ms` }
            : {}),
        }}
        onMouseLeave={() => {
          onSurvolCase(null);
          setInfobulle(null);
          onSurvolJeton(null);
        }}
      >
        {cases}
        {murs}
        {visibles.map((c) => {
          const valide = surcouches.ciblesValides.has(c.id);
          const choisie = surcouches.ciblesChoisies.get(c.id);
          const dansZone = surcouches.zone.has(cle(c.position));
          const classes = ['emplacement-jeton'];
          if (c.id === actifId) classes.push('jeton-actif');
          if (valide) classes.push(c.camp === 'heros' ? 'cible-allie' : 'cible-ennemie');
          if (surcouches.modeCible === 'cibles' && !valide && c.id !== actifId) classes.push('non-ciblable');
          if (choisie) classes.push('cible-choisie');
          if (dansZone && !c.mort) classes.push('dans-zone');
          if (c.mort) classes.push('emplacement-mort');
          return (
            <div
              key={c.id}
              ref={(el) => {
                if (el) elements.set(c.id, el);
                else elements.delete(c.id);
              }}
              className={classes.join(' ')}
              style={{
                left: c.position.x * g.cote,
                top: g.marge + c.position.y * g.hc,
                width: g.cote,
                height: g.hc,
                // Un jeton passe devant le relief du mur situé juste au sud ; les morts restent dessous.
                zIndex: c.mort ? 2 : 11 + c.position.y * 3 + (c.id === actifId ? 1 : 0),
              }}
              onMouseEnter={() => {
                setInfobulle(c.id);
                onSurvolJeton(c.id);
                onSurvolCase(c.position);
              }}
              onMouseLeave={() => {
                setInfobulle(null);
                onSurvolJeton(null);
              }}
              onClick={(e) => {
                e.stopPropagation();
                onClicJeton(c);
              }}
            >
              <Jeton c={c} taille={Math.round(g.cote * (['G', 'TG', 'Gig'].includes(c.taille) ? TAILLE_JETON_GRAND : TAILLE_JETON))} details />
              {choisie !== undefined && <span className="compteur-cible">{choisie > 1 ? `×${choisie}` : '✓'}</span>}
            </div>
          );
        })}
        <EffetsPlateau effets={effets} g={g} vitesse={vitesse} />
        {survole && (
          <div
            className={`infobulle ${survole.position.y < 2 ? 'infobulle-bas' : ''}`}
            style={{ left: (survole.position.x + 0.5) * g.cote, top: g.marge + (survole.position.y < 2 ? (survole.position.y + 1) * g.hc + 4 : survole.position.y * g.hc - 4) }}
          >
            <strong>{survole.nom}</strong>
            <span className="infobulle-classe">{nomClasse(survole, donnees)}</span>
            {survole.mort ? (
              <span>Mort</span>
            ) : (
              <span>
                PV {Math.max(0, survole.pv)}/{survole.pvMax}
                {survole.pvTemp > 0 && ` (+${survole.pvTemp})`}
                {survole.camp === 'monstres' && <em> — paraît {LIBELLES_APPARENT[etatApparent(survole)]}</em>}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="zoom-plateau" onClick={(e) => e.stopPropagation()}>
        <button type="button" title="Dézoomer (Ctrl + molette)" onClick={() => setZoom((z) => Math.max(0.4, z / 1.2))}>
          −
        </button>
        <button type="button" title="Tout le plateau à l'écran" onClick={() => setZoom(ajuste / base)}>
          ⤢
        </button>
        <button type="button" title="Zoomer (Ctrl + molette)" onClick={() => setZoom((z) => Math.min(3, z * 1.2))}>
          +
        </button>
      </div>
    </div>
  );
}

/** Nombre de particules d'un impact, selon la famille de dégâts. */
const PARTICULES: Record<Famille, number> = {
  tranchant: 6,
  perforant: 4,
  contondant: 8,
  feu: 10,
  froid: 7,
  foudre: 6,
  acide: 8,
  poison: 8,
  necrotique: 7,
  radiant: 10,
  force: 8,
  psychique: 6,
  tonnerre: 6,
};

/** Pseudo-hasard stable (même effet, même rendu) pour disperser les particules. */
function alea(id: number, i: number): number {
  const x = Math.sin(id * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Éclair en zigzag, tracé d'un trait qui s'efface (famille foudre). */
const ECLAIR = 'M62 0 L44 34 L58 38 L36 72 L50 76 L30 108 L66 62 L52 58 L70 24 L56 20 Z';

/** Effets d'animation posés sur le plateau (aussi utilisés par le banc d'essai). */
export function EffetsPlateau({ effets, g, vitesse }: { effets: Effet[]; g: Geometrie; vitesse: number }) {
  const cote = g.cote;
  return (
    <div className="effets-plateau" aria-hidden>
      {effets.map((e) => {
        const duree = `${Math.round(e.duree * vitesse)}ms`;
        switch (e.type) {
          case 'projectile': {
            const a = centre(e.de, g);
            const b = centre(e.vers, g);
            const angle = Math.atan2(b.y - a.y, b.x - a.x);
            return (
              <div
                key={e.id}
                className={`projectile projectile-${e.style}`}
                style={{
                  left: a.x,
                  top: a.y,
                  animationDuration: duree,
                  ['--dx' as string]: `${b.x - a.x}px`,
                  ['--dy' as string]: `${b.y - a.y}px`,
                  ['--angle' as string]: `${angle}rad`,
                  ['--couleur' as string]: e.couleur,
                }}
              >
                <span />
              </div>
            );
          }
          case 'texte': {
            const a = centre(e.position, g);
            return (
              <div key={e.id} className={`texte-flottant ${e.classe}`} style={{ left: a.x, top: a.y - cote * 0.3 + (e.decalage ?? 0) * cote, animationDuration: duree }}>
                {e.texte}
              </div>
            );
          }
          case 'bulle': {
            const a = centre(e.position, g);
            return (
              <div key={e.id} className="bulle-de" style={{ left: a.x, top: a.y - cote * 0.55, animationDuration: duree }}>
                <span className="bulle-de-icone">⚄</span>
                {e.texte}
              </div>
            );
          }
          case 'zone':
            return e.cases.map((p, i) => (
              <div
                key={`${e.id}-${i}`}
                className="eclat-zone"
                style={{ left: p.x * cote, top: g.marge + p.y * g.hc, width: cote, height: g.hc, animationDuration: duree, ['--couleur' as string]: e.couleur }}
              />
            ));
          case 'impact': {
            const a = centre(e.position, g);
            const n = Math.round(PARTICULES[e.famille] * (e.gros ? 1.5 : 1));
            return (
              <div
                key={e.id}
                className={`impact impact-${e.famille}${e.gros ? ' impact-gros' : ''}`}
                style={{ left: a.x, top: a.y, width: cote, height: cote, ['--couleur' as string]: COULEURS_FAMILLES[e.famille], ['--duree' as string]: duree }}
              >
                <span className="impact-noyau" />
                <span className="impact-onde" />
                {e.famille === 'foudre' && (
                  <svg className="impact-eclair" viewBox="0 0 100 108" aria-hidden>
                    <path d={ECLAIR} />
                  </svg>
                )}
                {Array.from({ length: n }, (_, i) => (
                  <span
                    key={i}
                    className="impact-part"
                    style={{
                      ['--a' as string]: `${Math.round((i * 360) / n + alea(e.id, i) * 40 - 20)}deg`,
                      ['--d' as string]: (0.5 + alea(e.id, i + 50) * 0.55).toFixed(2),
                      ['--r' as string]: (0.6 + alea(e.id, i + 99) * 0.8).toFixed(2),
                      animationDelay: `${Math.round(alea(e.id, i + 7) * 90)}ms`,
                    }}
                  />
                ))}
              </div>
            );
          }
          case 'lame': {
            const a = centre(e.position, g);
            return (
              <div
                key={e.id}
                className={`lame lame-${e.genre}`}
                style={{ left: a.x, top: a.y, width: cote * 1.05, height: cote * 1.05, animationDuration: duree, ['--angle' as string]: `${e.angle}rad` }}
              >
                <svg viewBox="0 0 100 100" aria-hidden>
                  {e.genre === 'tranchant' && <path d="M52 6 C78 30 78 70 48 94 C62 70 62 30 52 6 Z" />}
                  {e.genre === 'perforant' && <path d="M0 50 L100 50 L8 46 Z M0 50 L100 50 L8 54 Z" />}
                  {e.genre === 'contondant' && <path d="M50 4 L58 36 L92 28 L66 50 L92 72 L58 64 L50 96 L42 64 L8 72 L34 50 L8 28 L42 36 Z" />}
                </svg>
              </div>
            );
          }
          case 'secousse':
            return e.fort ? <div key={e.id} className="flash-ecran" style={{ animationDuration: duree }} /> : null;
          case 'lueur': {
            const a = centre(e.position, g);
            return (
              <div
                key={e.id}
                className="lueur"
                style={{ left: a.x, top: a.y, width: cote * 1.4, height: cote * 1.4, animationDuration: duree, ['--couleur' as string]: e.couleur }}
              />
            );
          }
        }
      })}
    </div>
  );
}
