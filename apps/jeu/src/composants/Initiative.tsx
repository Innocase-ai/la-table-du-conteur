import { combattant, type EtatCombat } from '@crpg/regles';
import { Jeton } from './Jeton';

interface Props {
  etat: EtatCombat;
  /** Le portrait survolé (ou au clavier) : la fiche s'affiche et son jeton s'illumine sur le plateau. */
  onSurvol: (id: string | null) => void;
  /** Un clic sur un portrait : épingler sa fiche, ou le choisir comme cible pendant un choix de cible. */
  onClic: (id: string) => void;
  /** Le combattant dont la fiche est épinglée. */
  epingleId?: string | null;
}

export function Initiative({ etat, onSurvol, onClic, epingleId }: Props) {
  return (
    <div className="initiative">
      <div className="initiative-round">
        <span>Round</span>
        <strong>{etat.round}</strong>
      </div>
      <ol className="initiative-liste">
        {etat.ordre.map((id, i) => {
          const c = combattant(etat, id);
          const classes = ['initiative-entree', c.camp === 'heros' ? 'ie-heros' : 'ie-monstre'];
          if (i === etat.actif && !etat.vainqueur) classes.push('ie-actif');
          if (c.mort) classes.push('ie-mort');
          else if (c.enFuite) classes.push('ie-fuite');
          else if (c.pv <= 0) classes.push('ie-tombe');
          const epingle = id === epingleId;
          if (epingle) classes.push('initiative-epingle-portrait');
          const etatTexte = c.mort ? ' (mort)' : c.enFuite ? ' (en fuite)' : '';
          return (
            <li
              key={id}
              className={classes.join(' ')}
              role="button"
              tabIndex={0}
              aria-pressed={epingle}
              aria-label={`${c.nom}${etatTexte} : voir sa fiche`}
              title={`${c.nom} — initiative ${c.initiative}${etatTexte}. Cliquer : épingler sa fiche.`}
              onMouseEnter={() => onSurvol(id)}
              onMouseLeave={() => onSurvol(null)}
              onFocus={() => onSurvol(id)}
              onBlur={() => onSurvol(null)}
              onClick={() => onClic(id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClic(id);
                }
              }}
            >
              <Jeton c={c} taille={28} />
              <span className="ie-nom">{c.nom}</span>
              <span className="ie-pv">
                <span style={{ width: `${Math.max(0, c.pv / c.pvMax) * 100}%` }} />
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
