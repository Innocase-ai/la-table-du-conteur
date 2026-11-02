import { useEffect, useRef, useState } from 'react';
import { cle, etatApparent, typeCase, type Combattant, type EtatCombat, type Position } from '@crpg/regles';
import { LIBELLES_APPARENT, nomClasse } from '../libelles';
import type { Donnees } from '@crpg/regles';
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
}

export function Plateau({ etat, donnees, actifId, surcouches, onSurvolCase, onClicCase, onClicJeton, onSurvolJeton }: Props) {
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
        style={{ width: largeur * cote, height: hauteur * cote }}
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
              <Jeton c={c} taille={Math.round(cote * 0.82)} details />
              {choisie !== undefined && <span className="compteur-cible">{choisie > 1 ? `×${choisie}` : '✓'}</span>}
            </div>
          );
        })}
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
