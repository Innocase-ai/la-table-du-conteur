import { ca, etatApparent, libelleEtat, vitesse, type Combattant, type Donnees } from '@crpg/regles';
import { formatMetres, LIBELLES_APPARENT, libelleModificateur, nomClasse, ressourcesLisibles } from '../libelles';
import { Jeton } from './Jeton';
import { RenseignementsMonstre } from './RenseignementsMonstre';

interface Props {
  c: Combattant;
  donnees: Donnees;
  estActif: boolean;
  elan: boolean;
}

export function Fiche({ c, donnees, estActif, elan }: Props) {
  const fraction = Math.max(0, c.pv / c.pvMax);
  const inc = c.incantation;
  const nomSort = (id: string) => donnees.sorts.get(id)?.nom ?? id;
  return (
    <div className={`fiche ${c.camp === 'heros' ? 'fiche-heros' : 'fiche-monstre'}`}>
      <div className="fiche-entete">
        <Jeton c={c} taille={40} />
        <div>
          <h2>{c.nom}</h2>
          <span className="classe">{nomClasse(c, donnees)}</span>
          {estActif && <span className="pastille-actif">À son tour</span>}
        </div>
      </div>

      <div className="fiche-pv">
        <div className="fiche-pv-texte">
          <span>PV</span>
          <strong>
            {Math.max(0, c.pv)} / {c.pvMax}
          </strong>
          {c.pvTemp > 0 && <span className="pv-temp">+{c.pvTemp} temp.</span>}
        </div>
        <div className="barre">
          <div className={`barre-remplie ${fraction > 0.5 ? 'pv-haut' : fraction > 0.25 ? 'pv-moyen' : 'pv-bas'}`} style={{ width: `${fraction * 100}%` }} />
        </div>
        {c.camp === 'monstres' && <span className="apparent">Paraît {LIBELLES_APPARENT[etatApparent(c)]}</span>}
        {c.mort && <span className="apparent mort">Mort</span>}
        {c.enFuite && <span className="apparent">En fuite</span>}
      </div>

      <div className="fiche-stats">
        <div>
          <span>CA</span>
          <strong>{ca(c)}</strong>
        </div>
        <div>
          <span>Vitesse</span>
          <strong>{formatMetres(vitesse(c))}</strong>
        </div>
        <div>
          <span>Init.</span>
          <strong>{c.initiative}</strong>
        </div>
      </div>

      {c.camp === 'heros' && c.pv <= 0 && !c.mort && (
        <div className="fiche-bloc">
          <h3>Jets contre la mort</h3>
          <div className="jets-mort">
            <span>
              Succès{' '}
              {[0, 1, 2].map((i) => (
                <i key={i} className={i < c.jetsMort.succes ? 'pip plein succes' : 'pip'} />
              ))}
            </span>
            <span>
              Échecs{' '}
              {[0, 1, 2].map((i) => (
                <i key={i} className={i < c.jetsMort.echecs ? 'pip plein echec' : 'pip'} />
              ))}
            </span>
            {c.stable && <em>Stabilisé</em>}
          </div>
        </div>
      )}

      {inc && inc.emplacementsMax.some((n) => n > 0) && (
        <div className="fiche-bloc">
          <h3>Emplacements de sorts</h3>
          {inc.emplacementsMax.map((max, i) =>
            max > 0 ? (
              <div key={i} className="emplacements">
                <span>Niv. {i + 1}</span>
                {Array.from({ length: max }, (_, j) => (
                  <i key={j} className={j < (inc.emplacements[i] ?? 0) ? 'pip plein' : 'pip'} />
                ))}
              </div>
            ) : null,
          )}
          <div className="petit">
            DD {inc.dd} · attaque +{inc.bonusAttaque}
          </div>
        </div>
      )}

      <div className="fiche-bloc">
        <h3>Ressources</h3>
        <dl className="ressources">
          {ressourcesLisibles(c).map((r) => (
            <div key={r.nom}>
              <dt>{r.nom}</dt>
              <dd>{r.valeur}</dd>
            </div>
          ))}
          {elan && c.elan && (
            <div>
              <dt>Deck d'élan</dt>
              <dd>
                {c.elan.pioche.length} pioche · {c.elan.defausse.length} déf.
              </dd>
            </div>
          )}
        </dl>
      </div>

      {(c.etats.length > 0 || c.concentration || c.rage || c.modificateurs.length > 0 || c.tour.esquive || c.tour.desengage) && (
        <div className="fiche-bloc">
          <h3>Effets</h3>
          <ul className="effets">
            {c.rage && <li className="effet-rage">En rage</li>}
            {c.concentration && <li className="effet-conc">Concentration : {nomSort(c.concentration.sort)}</li>}
            {c.etats.map((e, i) => (
              <li key={i} className="effet-etat">
                {libelleEtat(e.etat)}
                {e.sort ? ` (${nomSort(e.sort)})` : ''}
                {e.sauvegarde ? ` — JS ${e.sauvegarde.caracteristique.toUpperCase()} DD ${e.sauvegarde.dd}` : ''}
              </li>
            ))}
            {c.tour.esquive && <li>Esquive</li>}
            {c.tour.desengage && <li>Désengagé</li>}
            {c.modificateurs.map((m, i) => (
              <li key={`m${i}`}>{libelleModificateur(m)}</li>
            ))}
          </ul>
        </div>
      )}

      {c.camp === 'monstres' && <RenseignementsMonstre c={c} donnees={donnees} />}
    </div>
  );
}
