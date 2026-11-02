import { useState } from 'react';
import { exigences, sortsEligibles, type Donnees, type Historique, type Sort } from '@crpg/regles';
import { changerHistorique } from '../brouillon';
import { HISTORIQUES_INFO } from '../descriptions';
import { NOMS_CARAC, NOMS_COMPETENCES } from '../libelles';
import { ListeNav, ListeSorts, Option, Section, BadgeJouable } from '../ui';
import { Panneau, Puces, detailSort, type PropsEcran } from './commun';

function Details({ h, donnees }: { h: Historique; donnees: Donnees }) {
  const don = donnees.dons.get(h.don);
  return (
    <Panneau titre={h.nom} sous={HISTORIQUES_INFO[h.id]}>
      <Puces
        elements={[
          { nom: 'Caractéristiques liées', valeur: h.caracteristiques.map((k) => NOMS_CARAC[k]).join(', ') },
          { nom: 'Don', valeur: don?.nom ?? h.don },
          { nom: 'Compétences', valeur: h.competences.map((k) => NOMS_COMPETENCES[k]).join(', ') },
          { nom: 'Outils', valeur: h.outils },
        ]}
      />
      {don && (
        <>
          <h3 className="titre-liste">{don.nom}</h3>
          <p className="texte-don">{don.resume}</p>
        </>
      )}
    </Panneau>
  );
}

export function EcranHistorique({ b, donnees, maj }: PropsEcran) {
  const historiques = [...donnees.historiques.values()].sort((a, z) => a.nom.localeCompare(z.nom, 'fr'));
  const [survol, setSurvol] = useState<string | null>(null);
  const [sortSurvol, setSortSurvol] = useState<Sort | null>(null);
  const courant = b.choix.historique ? donnees.historiques.get(b.choix.historique) : undefined;
  const affiche = (survol ? donnees.historiques.get(survol) : undefined) ?? courant;
  const ex = exigences(b.choix, donnees);
  const initie = ex?.initie;
  const sorts = initie ? sortsEligibles(initie.liste, 1, donnees) : [];
  const { mineurs = [], niveau1 = [] } = b.choix.sortsInitie ?? {};
  const majInitie = (m: string[], n: string[]) => maj((x) => ({ ...x, choix: { ...x.choix, sortsInitie: { mineurs: m, niveau1: n } } }));

  return (
    <div className="ecran ecran-2col">
      <div className="colonne-liste">
        <ListeNav className="liste-options" aria-label="Historiques">
          {historiques.map((h) => (
            <Option
              key={h.id}
              selectionne={h.id === b.choix.historique}
              titre={h.nom}
              sous={`${h.caracteristiques.map((k) => NOMS_CARAC[k].slice(0, 3)).join(' · ')} — ${donnees.dons.get(h.don)?.nom ?? h.don}`}
              onSurvol={(a) => setSurvol(a ? h.id : null)}
              onChoisir={() => maj((x) => changerHistorique(x, h.id, donnees))}
            />
          ))}
        </ListeNav>
      </div>
      <div className="colonne-detail">
        {affiche ? <Details h={affiche} donnees={donnees} /> : <Panneau titre="Choisissez un historique">Votre historique donne des compétences, un don et des caractéristiques à améliorer.</Panneau>}
        {initie && courant && (
          <div className="panneau-description panneau-choix">
            <h2>Initié à la magie</h2>
            <p className="aide">
              Choisissez {initie.mineurs} sorts mineurs et {initie.niveau1} sort de niveau 1 dans la liste des {initie.liste === 'clerc' ? 'clercs' : 'magiciens'}.
            </p>
            <div className="deux-listes">
              <Section titre="Sorts mineurs" etat={mineurs.length >= initie.mineurs ? 'ok' : 'manque'}>
                <ListeSorts
                  etiquette="sorts mineurs d'initié"
                  sorts={sorts.filter((s) => s.niveau === 0)}
                  choisis={mineurs}
                  max={initie.mineurs}
                  onChange={(v) => majInitie(v, niveau1)}
                  onSurvol={setSortSurvol}
                />
              </Section>
              <Section titre="Sort de niveau 1" etat={niveau1.length >= initie.niveau1 ? 'ok' : 'manque'}>
                <ListeSorts
                  etiquette="sort de niveau 1 d'initié"
                  sorts={sorts.filter((s) => s.niveau === 1)}
                  choisis={niveau1}
                  max={initie.niveau1}
                  onChange={(v) => majInitie(mineurs, v)}
                  onSurvol={setSortSurvol}
                />
              </Section>
            </div>
            {sortSurvol && (
              <div className="encart-sort">
                <strong>{sortSurvol.nom}</strong> <BadgeJouable id={sortSurvol.id} />
                <p>{sortSurvol.resume}</p>
                <Puces elements={detailSort(sortSurvol)} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
