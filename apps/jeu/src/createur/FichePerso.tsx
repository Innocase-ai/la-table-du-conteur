// Fiche complète d'un personnage créé (récapitulatif) : caractéristiques, compétences, attaques, sorts, traits.
import {
  CARACTERISTIQUES,
  COMPETENCES,
  heroDepuisFiche,
  kitDepuisFiche,
  type Competence,
  type Donnees,
  type Fiche,
  type NiveauMaitrise,
} from '@crpg/regles';
import { formatMetres } from '../libelles';
import { NOMS_CARAC, NOMS_CATEGORIES_ARMURE, NOMS_COMPETENCES, majuscule, signe } from './libelles';
import { BadgeJouable, nomEcole } from './ui';

const MARQUEURS: Record<NiveauMaitrise, { symbole: string; titre: string }> = {
  aucune: { symbole: '○', titre: 'sans maîtrise' },
  demi: { symbole: '◐', titre: 'demi-maîtrise' },
  maitrise: { symbole: '●', titre: 'maîtrise' },
  expertise: { symbole: '◆', titre: 'expertise' },
};

function attaquesDe(fiche: Fiche, donnees: Donnees) {
  try {
    return heroDepuisFiche(fiche, kitDepuisFiche(fiche), donnees, { x: 0, y: 0 }).attaques;
  } catch {
    return [];
  }
}

/**
 * `enJeu` : la fiche d'un héros pendant l'aventure. L'équipement (porté, avec ses actions) et l'or sont montrés ailleurs, par
 * la page de la feuille de personnage : le kit de création et son « or restant » n'ont plus de sens une fois l'histoire commencée.
 */
export function FichePerso({ fiche, donnees, enJeu }: { fiche: Fiche; donnees: Donnees; enJeu?: boolean }) {
  const attaques = attaquesDe(fiche, donnees);
  const inc = fiche.incantation;
  const sorts = [
    ...fiche.sortsMineurs.map((id) => ({ id, origine: 'Sort mineur' })),
    ...fiche.sortsPrepares.map((id) => ({ id, origine: 'Préparé' })),
    ...fiche.sortsAccordes.map((id) => ({ id, origine: 'Accordé' })),
    ...(fiche.grimoire ?? []).map((id) => ({ id, origine: 'Grimoire' })),
    ...(fiche.sortsInitie?.mineurs ?? []).map((id) => ({ id, origine: 'Initié (mineur)' })),
    ...(fiche.sortsInitie?.niveau1 ?? []).map((id) => ({ id, origine: 'Initié' })),
  ].filter((s, i, t) => t.findIndex((x) => x.id === s.id) === i);
  const eq = fiche.equipement;
  const armure = eq?.armure ? donnees.armures.get(eq.armure) : undefined;
  const groupes = new Map<string, typeof fiche.aptitudes>();
  for (const a of fiche.aptitudes) groupes.set(a.source, [...(groupes.get(a.source) ?? []), a]);

  return (
    <div className="fiche-perso">
      <div className="fp-colonne">
        <section className="fp-bloc">
          <h3>Caractéristiques</h3>
          <div className="fp-carac">
            {CARACTERISTIQUES.map((k) => (
              <div key={k} className="fp-carac-case">
                <span>{NOMS_CARAC[k].slice(0, 3)}</span>
                <strong>{fiche.caracteristiques[k].valeur}</strong>
                <em>{signe(fiche.caracteristiques[k].modificateur)}</em>
              </div>
            ))}
          </div>
        </section>
        <section className="fp-bloc">
          <h3>Combat</h3>
          <div className="metriques metriques-6">
            <div>
              <span>PV</span>
              <strong>{fiche.pvMax}</strong>
            </div>
            <div>
              <span>CA</span>
              <strong>{fiche.ca}</strong>
            </div>
            <div>
              <span>Initiative</span>
              <strong>{signe(fiche.initiative)}</strong>
            </div>
            <div>
              <span>Vitesse</span>
              <strong>{formatMetres(fiche.vitesse)}</strong>
            </div>
            <div>
              <span>Maîtrise</span>
              <strong>{signe(fiche.bonusMaitrise)}</strong>
            </div>
            <div>
              <span>Perc. passive</span>
              <strong>{fiche.perceptionPassive}</strong>
            </div>
          </div>
          <p className="fp-ligne">
            Dé de vie d{fiche.deVie}
            {fiche.visionDansLeNoir > 0 && ` · Vision dans le noir ${formatMetres(fiche.visionDansLeNoir)}`}
            {fiche.resistances.length > 0 && ` · Résistance : ${fiche.resistances.join(', ')}`}
          </p>
        </section>
        <section className="fp-bloc">
          <h3>Jets de sauvegarde</h3>
          <ul className="fp-saves">
            {CARACTERISTIQUES.map((k) => (
              <li key={k} className={fiche.sauvegardes[k].maitrise ? 'fp-maitrise' : ''}>
                <span className="marqueur" title={fiche.sauvegardes[k].maitrise ? 'maîtrise' : 'sans maîtrise'}>
                  {fiche.sauvegardes[k].maitrise ? '●' : '○'}
                </span>
                {NOMS_CARAC[k]}
                <strong>{signe(fiche.sauvegardes[k].bonus)}</strong>
              </li>
            ))}
          </ul>
        </section>
        {!enJeu && (
        <section className="fp-bloc">
          <h3>Équipement</h3>
          <ul className="fp-liste">
            {armure && (
              <li>
                {armure.nom} <span className="fp-meta">armure {NOMS_CATEGORIES_ARMURE[armure.categorie] ?? armure.categorie}</span>
              </li>
            )}
            {eq?.bouclier && <li>Bouclier</li>}
            {(eq?.armes ?? []).map((id, i) => (
              <li key={`${id}-${i}`}>{donnees.armes.get(id)?.nom ?? id}</li>
            ))}
            {(eq?.autres ?? []).map((o, i) => (
              <li key={`${o}-${i}`}>{majuscule(o)}</li>
            ))}
            {!armure && !eq?.bouclier && !(eq?.armes ?? []).length && !(eq?.autres ?? []).length && <li className="vide">Aucun équipement</li>}
          </ul>
          {eq && <p className="fp-ligne">Or restant : {eq.po} po</p>}
        </section>
        )}
      </div>

      <div className="fp-colonne">
        <section className="fp-bloc">
          <h3>Compétences</h3>
          <ul className="fp-competences">
            {(Object.keys(COMPETENCES) as Competence[]).map((k) => {
              const c = fiche.competences[k];
              return (
                <li key={k} className={c.maitrise === 'aucune' ? '' : 'fp-maitrise'}>
                  <span className="marqueur" title={MARQUEURS[c.maitrise].titre}>
                    {MARQUEURS[c.maitrise].symbole}
                  </span>
                  <span className="fp-comp-nom">{NOMS_COMPETENCES[k]}</span>
                  <span className="fp-meta">{NOMS_CARAC[COMPETENCES[k]].slice(0, 3)}</span>
                  <strong>{signe(c.bonus)}</strong>
                </li>
              );
            })}
          </ul>
          <p className="fp-ligne legende">○ aucune · ◐ demi-maîtrise · ● maîtrise · ◆ expertise</p>
        </section>
      </div>

      <div className="fp-colonne fp-colonne-large">
        <section className="fp-bloc">
          <h3>Attaques</h3>
          {attaques.length ? (
            <ul className="fp-liste">
              {attaques.map((a) => (
                <li key={a.id}>
                  <strong>{a.nom}</strong> <span className="fp-meta">{a.mode === 'distance' ? 'distance' : 'corps à corps'}</span>
                  <br />
                  <span>
                    {signe(a.bonusAttaque)} pour toucher · {a.degats.map((d) => `${d.des}${d.bonus ? signe(d.bonus) : ''} ${d.type}`).join(' + ')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="vide">Aucune arme.</p>
          )}
          {fiche.bottes.length > 0 && (
            <p className="fp-ligne">
              Bottes :{' '}
              {fiche.bottes
                .map((id) => {
                  const a = donnees.armes.get(id);
                  return a ? `${a.nom} (${a.botte})` : id;
                })
                .join(', ')}
            </p>
          )}
        </section>

        {(sorts.length > 0 || inc) && (
          <section className="fp-bloc">
            <h3>Sorts</h3>
            {inc && (
              <p className="fp-ligne">
                {NOMS_CARAC[inc.caracteristique]} · DD {inc.ddSauvegarde} · attaque {signe(inc.bonusAttaque)} · emplacements :{' '}
                {inc.emplacements.length ? inc.emplacements.map((n, i) => ({ n, niv: inc.niveauEmplacementPacte ?? i + 1 })).filter((e) => e.n > 0).map((e) => `niv. ${e.niv} ×${e.n}`).join(', ') : 'aucun'}
              </p>
            )}
            <ul className="fp-sorts">
              {sorts.map(({ id, origine }) => {
                const s = donnees.sorts.get(id);
                return (
                  <li key={id} title={s?.resume}>
                    <span>
                      <strong>{s?.nom ?? id}</strong>
                      <span className="fp-meta">
                        {' '}
                        {s ? `${s.niveau === 0 ? 'mineur' : `niv. ${s.niveau}`} · ${nomEcole(s.ecole)}` : ''} · {origine}
                      </span>
                    </span>
                    <BadgeJouable id={id} />
                  </li>
                );
              })}
              {!sorts.length && <li className="vide">Aucun sort choisi.</li>}
            </ul>
          </section>
        )}

        <section className="fp-bloc">
          <h3>Traits et aptitudes</h3>
          {[...groupes].map(([source, liste]) => (
            <div key={source} className="fp-groupe">
              <h4>{source === 'Don' ? 'Dons' : source}</h4>
              {liste.map((a) => (
                <details key={`${source}-${a.id}`}>
                  <summary>
                    {a.nom}
                    {a.niveau > 1 && <span className="fp-meta"> (niv. {a.niveau})</span>}
                  </summary>
                  <p>{a.resume}</p>
                </details>
              ))}
            </div>
          ))}
        </section>

        {fiche.avertissements.length > 0 && (
          <section className="fp-bloc fp-avertissements">
            <h3>Avertissements</h3>
            <ul className="fp-liste">
              {fiche.avertissements.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
