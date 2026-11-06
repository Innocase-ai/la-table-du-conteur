import { Fragment } from 'react';
import { ALIGNEMENTS, type Alignement } from '@crpg/regles';
import { ALIGNEMENTS_INFO } from '../descriptions';
import type { PropsEcran } from './commun';

const COLONNES = ['Loyal', 'Neutre', 'Chaotique'];
const LIGNES = ['Bon', 'Neutre', 'Mauvais'];

export function EcranAlignement({ b, maj }: PropsEcran) {
  const choisi = b.identite.alignement;
  const choisir = (a: Alignement) => maj((x) => ({ ...x, identite: { ...x.identite, alignement: a } }));
  return (
    <div className="ecran ecran-alignement">
      <p className="aide aide-centre">L'alignement décrit les valeurs éthiques et morales du personnage : son rapport à l'ordre (loyal, chaotique) et au bien (bon, mauvais).</p>
      <div className="grille-alignements" role="group" aria-label="Alignement">
        <span />
        {COLONNES.map((c) => (
          <span key={c} className="axe">
            {c}
          </span>
        ))}
        {LIGNES.map((ligne, i) => (
          <Fragment key={ligne}>
            <span className="axe axe-ligne">
              {ligne}
            </span>
            {ALIGNEMENTS.slice(i * 3, i * 3 + 3).map((a) => (
              <button
                key={a.id}
                type="button"
                className={`case-alignement ${choisi === a.id ? 'option-choisie' : ''}`}
                aria-pressed={choisi === a.id}
                onClick={() => choisir(a.id)}
              >
                <strong>{ALIGNEMENTS_INFO[a.id].nom}</strong>
                <span className="abreviation">{a.id}</span>
                <span className="description-alignement">{ALIGNEMENTS_INFO[a.id].description}</span>
              </button>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
