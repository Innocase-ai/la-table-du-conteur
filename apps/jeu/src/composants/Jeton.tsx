import { aEtat, libelleEtat, type Combattant } from '@crpg/regles';
import { estChef, svgDe } from '../icones';
import { abreviation, SYMBOLES_ETATS } from '../libelles';

interface Props {
  c: Combattant;
  taille: number;
  details?: boolean;
}

const GRANDES_TAILLES = new Set(['G', 'TG', 'Gig']);

/** Jeton d'un combattant : pastille aux couleurs du camp, pictogramme, barre de PV et badges d'états. */
export function Jeton({ c, taille, details = false }: Props) {
  const { lettres, numero } = abreviation(c);
  const svg = svgDe(c);
  const fraction = Math.max(0, Math.min(1, c.pv / c.pvMax));
  const tombe = c.mort || c.pv <= 0;
  const grand = GRANDES_TAILLES.has(c.taille);
  const badges: { symbole: string; titre: string; classe?: string }[] = c.etats
    .filter((e, i, t) => t.findIndex((x) => x.etat === e.etat) === i)
    .map((e) => ({ symbole: SYMBOLES_ETATS[e.etat], titre: libelleEtat(e.etat) }));
  if (c.rage) badges.push({ symbole: '♨', titre: 'en rage', classe: 'b-rage' });
  if (c.concentration) badges.push({ symbole: '◎', titre: `concentration (${c.concentration.sort})`, classe: 'b-conc' });
  const classes = [
    'jeton',
    c.camp === 'heros' ? 'jeton-heros' : 'jeton-monstre',
    tombe ? 'jeton-tombe' : '',
    c.mort ? 'jeton-mort' : '',
    estChef(c) ? 'jeton-chef' : '',
    grand ? 'jeton-grand' : '',
    c.rage && !tombe ? 'jeton-rage' : '',
  ];
  return (
    <div className={classes.join(' ')} style={{ width: taille, height: taille, fontSize: Math.max(10, taille * 0.36) }}>
      {c.rage && !tombe && <span className="aura-rage" />}
      <div className="jeton-disque">
        {c.mort ? (
          <span className="jeton-lettres">✝</span>
        ) : svg ? (
          <span className="pictogramme" dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <span className="jeton-lettres">{lettres}</span>
        )}
        {numero && !c.mort && <span className="jeton-numero">{numero}</span>}
        {!c.mort && c.pv <= 0 && c.camp === 'heros' && !aEtat(c, 'inconscient') && <span className="jeton-numero">z</span>}
      </div>
      {details && !c.mort && (
        <>
          <div className="jeton-pv">
            <div className={`jeton-pv-barre ${fraction > 0.5 ? 'pv-haut' : fraction > 0.25 ? 'pv-moyen' : 'pv-bas'}`} style={{ width: `${fraction * 100}%` }} />
            {c.pvTemp > 0 && <div className="jeton-pv-temp" />}
          </div>
          {badges.length > 0 && (
            <div className="jeton-badges">
              {badges.slice(0, 3).map((b) => (
                <span key={b.titre} className={`badge ${b.classe ?? ''}`} title={b.titre}>
                  {b.symbole}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
