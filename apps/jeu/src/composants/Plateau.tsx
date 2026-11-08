import { useEffect, useRef, useState, type ReactElement } from 'react';
import { cle, couvert, etatApparent, reliefDe, typeCase, type Combattant, type EtatCombat, type Position, type Relief, type Terrain } from '@crpg/regles';
import { LIBELLES_APPARENT, nomClasse } from '../libelles';
import type { Donnees } from '@crpg/regles';
import type { Effet } from '../animations';
import { COULEURS_FAMILLES, type Famille } from '../effets-visuels';
import { textureRelief, textureTerrain } from '../visuels';
import { Jeton } from './Jeton';
import { DessinRelief, TAILLE_SPRITE } from './Reliefs';

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

/**
 * Liseré d'une plaque (eau, boue, neige) : un fin ombrage sur chaque côté où la plaque s'arrête, pour qu'une mare se lise
 * comme une mare et pas comme un damier. Le trait de grille, lui, reste partout.
 */
function liseres(grille: EtatCombat['grille'], p: Position, relief: Relief, cote: number): string {
  const e = Math.max(2, Math.round(cote * 0.07));
  const autre = (dx: number, dy: number) => reliefDe(grille, { x: p.x + dx, y: p.y + dy }) !== relief;
  const ombres = ['inset 0 0 0 0.5px rgba(0,0,0,0.35)'];
  if (autre(0, -1)) ombres.push(`inset 0 ${e}px ${e}px -${Math.round(e / 2)}px rgba(0,0,0,0.42)`);
  if (autre(0, 1)) ombres.push(`inset 0 -${e}px ${e}px -${Math.round(e / 2)}px rgba(0,0,0,0.42)`);
  if (autre(-1, 0)) ombres.push(`inset ${e}px 0 ${e}px -${Math.round(e / 2)}px rgba(0,0,0,0.42)`);
  if (autre(1, 0)) ombres.push(`inset -${e}px 0 ${e}px -${Math.round(e / 2)}px rgba(0,0,0,0.42)`);
  return ombres.join(', ');
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
  const reliefsDessines: ReactElement[] = [];
  for (let y = 0; y < hauteur; y++) {
    for (let x = 0; x < largeur; x++) {
      const p = { x, y };
      const k = cle(p);
      const type = typeCase(etat.grille, p);
      const relief = reliefDe(etat.grille, p);
      // Arbres et rochers se dessinent par-dessus un sol normal ; l'eau, la boue et la neige remplacent le sol de la case.
      const plaque = relief === 'eau' || relief === 'boue' || relief === 'neige' ? relief : undefined;
      // Sous un élément dessiné (arbre, rocher, obstacle bas), la case a l'aspect d'un sol ; les règles gardent son type.
      const sousRelief = !!relief && !plaque;
      const classes = ['case', `case-${sousRelief ? 'sol' : type}`];
      if (plaque) classes.push('case-relief', `case-relief-${plaque}`);
      if (surcouches.atteignables.has(k)) classes.push('case-atteignable');
      if (surcouches.chemin.has(k)) classes.push('case-chemin');
      if (surcouches.portee.has(k)) classes.push('case-portee');
      if (surcouches.zone.has(k)) classes.push('case-zone');
      // Zone de sort qui dure (sphère de feu, rayon de lune, meute) : visible tant que le sort dure ; le nuage d'orage reste discret.
      for (const z of etat.zones ?? []) {
        if (Math.max(Math.abs(p.x - z.centre.x), Math.abs(p.y - z.centre.y)) <= z.rayon) classes.push(z.declencheurs.length ? `case-zone-durable case-zone-${z.sort}` : 'case-zone-nuage');
      }
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
      // Une plaque (eau, boue, neige) a sa propre texture, continue d'une case à l'autre, et un liseré sur les côtés où elle s'arrête.
      const urlPlaque = plaque ? textureRelief(plaque) : undefined;
      const stylePlaque = plaque
        ? {
            ...(urlPlaque
              ? {
                  backgroundImage: `url(${urlPlaque})`,
                  backgroundSize: `${REPETITION * g.cote}px ${REPETITION * g.hc}px`,
                  backgroundPosition: `${-(x % REPETITION) * g.cote}px ${-(y % REPETITION) * g.hc}px`,
                }
              : {}),
            boxShadow: liseres(etat.grille, p, plaque, g.cote),
          }
        : {};
      // Sous un arbre ou un rocher, le sol de l'ambiance.
      const styleCase = type === 'mur' && !sousRelief ? {} : plaque ? stylePlaque : texture(sousRelief || type === 'obstacle' ? 'sol' : type);
      cases.push(
        <div
          key={k}
          className={classes.join(' ')}
          style={{ left: x * g.cote, top: g.marge + y * g.hc, width: g.cote, height: g.hc, ...styleCase }}
          onMouseEnter={() => onSurvolCase(p)}
          onClick={() => type !== 'mur' && onClicCase(p)}
        >
          {type === 'difficile' && !plaque && !textureTerrain(terrain, 'difficile') && <span className="motif-difficile" />}
          {plaque === 'eau' && <span className="ondes" />}
        </div>,
      );
      if (relief && !plaque) {
        // Plus large et plus haut que la case : la couronne d'un arbre dépasse un peu ; un obstacle bas reste dans sa case.
        // Toujours sous les jetons (lisibilité d'abord).
        const [fl, fh] = TAILLE_SPRITE[relief];
        const largeur = Math.round(g.cote * fl);
        const hauteur = Math.round(g.cote * fh);
        reliefsDessines.push(
          <div
            key={`r${k}`}
            className={`relief relief-${relief}`}
            style={{ left: Math.round((x + 0.5) * g.cote - largeur / 2), top: g.marge + (y + 1) * g.hc - hauteur + Math.round(g.hc * 0.06), width: largeur, height: hauteur, zIndex: 7 + y * 3 }}
          >
            <DessinRelief relief={relief} x={x} y={y} terrain={terrain} />
          </div>,
        );
        continue;
      }
      if (type === 'mur' && !relief) {
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
  const positionActif = etat.combattants.find((c) => c.id === actifId)?.position;
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
        {reliefsDessines}
        {murs}
        {visibles.map((c) => {
          const valide = surcouches.ciblesValides.has(c.id);
          // Une cible visée derrière un obstacle bas est à couvert : +2 à sa CA, signalé par un bouclier.
          const aCouvert = valide && surcouches.modeCible === 'cibles' && !!positionActif && c.id !== actifId && couvert(etat.grille, positionActif, c.position) > 0;
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
                // Un jeton passe devant le relief du mur situé juste au sud (z = 10 + 3 × (y + 1) = 13 + 3y : il dépasse d'une
                // demi-case sur la rangée du jeton) ; les morts passent aussi devant les murs, mais sous les vivants.
                zIndex: (c.mort ? 14 : 15) + c.position.y * 3 + (c.id === actifId ? 1 : 0),
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
              {aCouvert && (
                <span className="badge-couvert" title="À couvert derrière un obstacle bas : +2 à sa CA">
                  🛡+2
                </span>
              )}
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
            const longueur = Math.hypot(b.x - a.x, b.y - a.y);
            // Un jet d'acide monte en arc ; un dard dévie d'un côté ou de l'autre, au hasard de son numéro.
            const arc =
              e.style === 'lob' ? -Math.round(longueur * 0.4) : e.style === 'dard' ? Math.round((alea(e.id, 1) > 0.5 ? -1 : 1) * (10 + alea(e.id, 2) * 24)) : 0;
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
                  ['--arc' as string]: `${arc}px`,
                  ['--couleur' as string]: e.couleur,
                }}
              >
                <span style={{ animationDuration: duree }} />
              </div>
            );
          }
          case 'rayon': {
            const a = centre(e.de, g);
            const b = centre(e.vers, g);
            const longueur = Math.hypot(b.x - a.x, b.y - a.y);
            const angle = Math.atan2(b.y - a.y, b.x - a.x);
            const style = {
              left: a.x,
              top: a.y,
              width: longueur,
              animationDuration: duree,
              ['--angle' as string]: `${angle}rad`,
              ['--couleur' as string]: e.couleur,
            };
            if (e.forme === 'zigzag') {
              // Un éclair : une ligne brisée aux écarts tirés du numéro de l'effet (stable d'un rendu à l'autre).
              const n = Math.max(3, Math.round(longueur / 22));
              const points = Array.from({ length: n + 1 }, (_, i) => {
                const ecart = i === 0 || i === n ? 0 : (alea(e.id, i) - 0.5) * 26;
                return `${((i / n) * longueur).toFixed(1)},${(20 + ecart).toFixed(1)}`;
              }).join(' ');
              return (
                <svg key={e.id} className="rayon rayon-zigzag" style={{ ...style, height: 40 }} viewBox={`0 0 ${longueur.toFixed(1)} 40`} preserveAspectRatio="none">
                  <polyline className="zigzag-halo" points={points} />
                  <polyline className="zigzag-coeur" points={points} />
                </svg>
              );
            }
            return <div key={e.id} className="rayon rayon-droit" style={style} />;
          }
          case 'cercle': {
            const a = centre(e.position, g);
            return (
              <div
                key={e.id}
                className="cercle-magique"
                style={{ left: a.x, top: a.y, width: cote * 1.5, height: cote * 1.5, animationDuration: duree, ['--couleur' as string]: e.couleur }}
              >
                <svg viewBox="0 0 100 100" aria-hidden>
                  <circle cx="50" cy="50" r="46" />
                  <circle cx="50" cy="50" r="42" strokeDasharray="2 9.9" />
                  <circle cx="50" cy="50" r="34" />
                  <polygon points="50,16 84,50 50,84 16,50" />
                  <polygon points="26,26 74,26 74,74 26,74" />
                </svg>
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
          case 'replique': {
            const a = centre(e.position, g);
            return (
              // Le temps de lecture ne suit pas la vitesse des animations.
              <div key={e.id} className="bulle-replique" style={{ left: a.x, top: a.y - cote * 0.62, animationDuration: `${e.duree}ms` }}>
                {e.texte}
              </div>
            );
          }
          case 'zone':
            return e.cases.map((p, i) => {
              // Propagation : chaque case s'allume après un délai proportionnel à sa distance à l'origine.
              const delai = e.origine && e.delai ? Math.max(Math.abs(p.x - e.origine.x), Math.abs(p.y - e.origine.y)) * e.delai : 0;
              return (
                <div
                  key={`${e.id}-${i}`}
                  className="eclat-zone"
                  style={{
                    left: p.x * cote,
                    top: g.marge + p.y * g.hc,
                    width: cote,
                    height: g.hc,
                    animationDuration: e.delai ? `${Math.round(480 * vitesse)}ms` : duree,
                    animationDelay: `${Math.round(delai * vitesse)}ms`,
                    ['--couleur' as string]: e.couleur,
                  }}
                />
              );
            });
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
