import { useEffect, useRef, useState } from 'react';
import { cle, etatApparent, typeCase, type Combattant, type EtatCombat, type Position } from '@crpg/regles';
import { LIBELLES_APPARENT, nomClasse } from '../libelles';
import type { Donnees } from '@crpg/regles';
import type { Effet } from '../animations';
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

export function Plateau({ etat, donnees, actifId, surcouches, onSurvolCase, onClicCase, onClicJeton, onSurvolJeton, effets, elements, vitesse }: Props) {
  const conteneur = useRef<HTMLDivElement>(null);
  const [cote, setCote] = useState(36);
  const [infobulle, setInfobulle] = useState<string | null>(null);
  const { largeur, hauteur } = etat.grille;

  useEffect(() => {
    const el = conteneur.current;
    if (!el) return;
    const ajuster = () => {
      const w = el.clientWidth - 8;
      const h = el.clientHeight - 8;
      setCote(Math.max(20, Math.min(60, Math.floor(Math.min(w / largeur, h / hauteur)))));
    };
    ajuster();
    const obs = new ResizeObserver(ajuster);
    obs.observe(el);
    return () => obs.disconnect();
  }, [largeur, hauteur]);

  const cases = [];
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
      cases.push(
        <div
          key={k}
          className={classes.join(' ')}
          style={{ left: x * cote, top: y * cote, width: cote, height: cote }}
          onMouseEnter={() => onSurvolCase(p)}
          onClick={() => type !== 'mur' && onClicCase(p)}
        >
          {type === 'difficile' && <span className="motif-difficile" />}
        </div>,
      );
    }
  }

  const visibles = etat.combattants.filter((c) => !c.enFuite);
  // Les morts d'abord, pour que les vivants passent au-dessus.
  visibles.sort((a, b) => Number(b.mort) - Number(a.mort));
  const survole = infobulle ? etat.combattants.find((c) => c.id === infobulle) : undefined;

  return (
    <div className="plateau-conteneur" ref={conteneur}>
      <div
        className={`plateau mode-${surcouches.modeCible}`}
        style={{ width: largeur * cote, height: hauteur * cote, ['--vitesse' as string]: vitesse, ['--cote' as string]: `${cote}px` }}
        onMouseLeave={() => {
          onSurvolCase(null);
          setInfobulle(null);
          onSurvolJeton(null);
        }}
      >
        {cases}
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
              style={{ left: c.position.x * cote, top: c.position.y * cote, width: cote, height: cote }}
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
              <Jeton c={c} taille={Math.round(cote * (['G', 'TG', 'Gig'].includes(c.taille) ? 0.98 : 0.82))} details />
              {choisie !== undefined && <span className="compteur-cible">{choisie > 1 ? `×${choisie}` : '✓'}</span>}
            </div>
          );
        })}
        <EffetsPlateau effets={effets} cote={cote} vitesse={vitesse} />
        {survole && (
          <div
            className={`infobulle ${survole.position.y < 2 ? 'infobulle-bas' : ''}`}
            style={{ left: (survole.position.x + 0.5) * cote, top: survole.position.y < 2 ? (survole.position.y + 1) * cote + 4 : survole.position.y * cote - 4 }}
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
    </div>
  );
}

const centre = (p: Position, cote: number) => ({ x: (p.x + 0.5) * cote, y: (p.y + 0.5) * cote });

function EffetsPlateau({ effets, cote, vitesse }: { effets: Effet[]; cote: number; vitesse: number }) {
  return (
    <div className="effets-plateau" aria-hidden>
      {effets.map((e) => {
        const duree = `${Math.round(e.duree * vitesse)}ms`;
        switch (e.type) {
          case 'projectile': {
            const a = centre(e.de, cote);
            const b = centre(e.vers, cote);
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
            const a = centre(e.position, cote);
            return (
              <div key={e.id} className={`texte-flottant ${e.classe}`} style={{ left: a.x, top: a.y - cote * 0.3, animationDuration: duree }}>
                {e.texte}
              </div>
            );
          }
          case 'bulle': {
            const a = centre(e.position, cote);
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
                style={{ left: p.x * cote, top: p.y * cote, width: cote, height: cote, animationDuration: duree, ['--couleur' as string]: e.couleur }}
              />
            ));
          case 'lueur': {
            const a = centre(e.position, cote);
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
