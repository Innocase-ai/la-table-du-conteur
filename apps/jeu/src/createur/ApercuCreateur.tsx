// Bandeau d'aperçu permanent du créateur : PV, CA, meilleure attaque, sorts. Les chiffres viennent du moteur
// (`apercuBrouillon`) et se recalculent à chaque choix.
import { useMemo } from 'react';
import type { Donnees } from '@crpg/regles';
import { apercuBrouillon } from './apercu-regles';
import type { Brouillon } from './brouillon';
import { NOMS_CARAC, signe } from './libelles';
import { Portrait } from './ui';
import './apercu.css';

export function ApercuCreateur({ b, donnees }: { b: Brouillon; donnees: Donnees }) {
  const a = useMemo(() => apercuBrouillon(b, donnees), [b, donnees]);
  const { choix, identite } = b;
  const classe = choix.classe ? donnees.classes.get(choix.classe) : undefined;
  const espece = choix.espece ? donnees.especes.get(choix.espece) : undefined;
  const nom = identite.nom.trim();

  return (
    <aside className="apercu-createur-bandeau" aria-label="Aperçu du héros">
      <div className="apercu-createur-qui">
        <Portrait id={identite.portrait} espece={choix.espece} classe={choix.classe} taille={44} />
        <div className="apercu-createur-nom">
          <strong>{nom || 'Votre héros'}</strong>
          <span>
            {[espece?.nom, classe?.nom].filter(Boolean).concat(`niveau ${choix.niveau}`).join(' · ')}
          </span>
        </div>
      </div>

      {a.disponible ? (
        <dl className="apercu-createur-chiffres">
          <div className="apercu-createur-case" title="Points de vie au maximum">
            <dt>PV</dt>
            <dd>{a.pv}</dd>
          </div>
          <div className="apercu-createur-case" title="Classe d'armure avec l'équipement de départ choisi">
            <dt>CA</dt>
            <dd>{a.ca}</dd>
          </div>
          <div className="apercu-createur-case apercu-createur-large" title="Meilleure attaque d'arme : bonus pour toucher et dégâts">
            <dt>Attaque</dt>
            <dd>
              {a.attaque ? (
                <>
                  <span className="apercu-createur-valeur">{signe(a.attaque.bonus)}</span>
                  <small>
                    {a.attaque.nom} · {a.attaque.degats}
                  </small>
                </>
              ) : (
                <small>Aucune arme</small>
              )}
            </dd>
          </div>
          <div className="apercu-createur-case apercu-createur-large" title="Sorts : DD des sauvegardes, bonus d'attaque des sorts, sorts pris (dont ceux que le combat sait jouer)">
            <dt>Sorts</dt>
            <dd>
              {a.sorts ? (
                <>
                  <span className="apercu-createur-valeur">DD {a.sorts.dd}</span>
                  <small>
                    {NOMS_CARAC[a.sorts.caracteristique]} · attaque {signe(a.sorts.bonusAttaque)}
                    {' · '}
                    {a.sorts.mineurs.max > 0 && `${a.sorts.mineurs.pris}/${a.sorts.mineurs.max} mineurs`}
                    {a.sorts.mineurs.max > 0 && a.sorts.prepares.max > 0 && ', '}
                    {a.sorts.prepares.max > 0 && `${a.sorts.prepares.pris}/${a.sorts.prepares.max} préparés`}
                    {a.sorts.total > 0 && ` (${a.sorts.jouables} jouables en combat)`}
                  </small>
                </>
              ) : a.sorts === undefined && b.choix.classe ? (
                <small>Pas de magie de classe</small>
              ) : null}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="apercu-createur-vide">{a.indication}</p>
      )}

      {a.disponible && (
        <span
          className={`apercu-createur-etat ${a.exact ? 'apercu-createur-exact' : 'apercu-createur-provisoire'}`}
          title={a.exact ? 'Tous les choix sont faits : ces chiffres sont ceux du héros.' : 'Provisoire : il reste des choix à faire ; ceux qui manquent sont remplacés par les valeurs recommandées et les chiffres peuvent encore changer.'}
        >
          {a.exact ? 'Choix complets' : 'Provisoire'}
        </span>
      )}
    </aside>
  );
}
