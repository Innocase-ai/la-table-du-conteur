import { combattant, type EtatCombat } from '@crpg/regles';
import { Jeton } from './Jeton';

interface Props {
  etat: EtatCombat;
  onSurvol: (id: string | null) => void;
}

export function Initiative({ etat, onSurvol }: Props) {
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
          return (
            <li
              key={id}
              className={classes.join(' ')}
              title={`${c.nom} — initiative ${c.initiative}${c.mort ? ' (mort)' : c.enFuite ? ' (en fuite)' : ''}`}
              onMouseEnter={() => onSurvol(id)}
              onMouseLeave={() => onSurvol(null)}
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
