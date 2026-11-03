import { useEffect, useMemo, useState } from 'react';
import { bilanPersonnage, personnageComplet, TAILLE_GROUPE, type Donnees, type Groupe } from '@crpg/regles';
import { histoires, type Histoire } from '../mondes';

interface Props {
  donnees: Donnees;
  groupe: Groupe;
  onGroupe: () => void;
  onRetour: () => void;
}

const nombre = (x: number) => x.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
const dollars = (x: number) => `${nombre(x)} $`;

/** Coût d'API estimé pour finir l'histoire, par modèle du conteur (le joueur paie avec sa propre clé). */
function CoutHistoire({ h }: { h: Histoire }) {
  const e = h.estimation;
  if (!e) return <p className="histoire-bientot">Durée et coût pas encore estimés.</p>;
  return (
    <div className="histoire-cout">
      <p>
        Durée estimée : <strong>environ {e.heures.total} h</strong> ({nombre(e.heures.recit)} h de récit, {nombre(e.heures.combats)} h de combats), soit {e.tours} tours de
        conteur.
      </p>
      <table>
        <thead>
          <tr>
            <th>Conteur</th>
            <th>Coût d'API estimé</th>
          </tr>
        </thead>
        <tbody>
          {e.couts.map((c) => (
            <tr key={c.modele}>
              <td>{c.nom}</td>
              <td>
                <strong>≈ {dollars(c.usd)}</strong> <small>({dollars(c.min)} à {dollars(c.max)})</small>
              </td>
            </tr>
          ))}
          <tr>
            <td>Images du groupe</td>
            <td>≈ {dollars(e.imagesUsd)}</td>
          </tr>
        </tbody>
      </table>
      <p className="histoire-bientot">
        Payé avec votre propre clé d'API, pour finir l'histoire. Les combats et les images du monde ne coûtent rien. Estimation provisoire, calculée sur le
        contenu de l'histoire ; elle sera recalée sur des parties réelles.
      </p>
    </div>
  );
}

function Couverture({ h }: { h: Histoire }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let actif = true;
    h.couverture?.().then((u) => actif && setUrl(u));
    return () => {
      actif = false;
    };
  }, [h]);
  return <div className="histoire-couverture" style={url ? { backgroundImage: `url(${url})` } : undefined} />;
}

/** Choix de l'histoire à vivre : chaque monde publié, avec ce qu'il faut pour le commencer. */
export function EcranHistoires({ donnees, groupe, onGroupe, onRetour }: Props) {
  const liste = useMemo(() => histoires(), []);
  const [choisie, setChoisie] = useState<Histoire | undefined>(liste[0]);
  const complets = groupe.emplacements.filter((p) => p && personnageComplet(bilanPersonnage(p, donnees))).length;

  return (
    <div className="histoires">
      <header className="ecran-entete">
        <button type="button" className="bouton-discret" onClick={onRetour}>
          ‹ Menu
        </button>
        <h1>Choisir une histoire</h1>
      </header>

      {!liste.length ? (
        <p className="vide">Aucune histoire publiée pour l'instant.</p>
      ) : (
        <div className="histoires-corps">
          <ul className="histoires-liste">
            {liste.map((h) => (
              <li key={h.monde.id}>
                <button type="button" className={`histoire-carte ${choisie?.monde.id === h.monde.id ? 'choisie' : ''}`} onClick={() => setChoisie(h)}>
                  <Couverture h={h} />
                  <span className="histoire-carte-texte">
                    <strong>{h.monde.nom}</strong>
                    <span>{h.monde.accroche}</span>
                    <small>
                      Niveaux {h.monde.niveaux.min} à {h.monde.niveaux.max} · {h.monde.chapitres.length} chapitre{h.monde.chapitres.length > 1 ? 's' : ''}
                      {h.estimation && ` · ≈ ${h.estimation.heures.total} h · API ${dollars(Math.min(...h.estimation.couts.map((c) => c.usd)))} à ${dollars(Math.max(...h.estimation.couts.map((c) => c.usd)))}`}
                    </small>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {choisie && (
            <article className="histoire-detail">
              <Couverture h={choisie} />
              <div className="histoire-detail-texte">
                <h2>{choisie.monde.nom}</h2>
                <p className="histoire-accroche">{choisie.monde.accroche}</p>
                <ul className="histoire-ton">
                  {choisie.monde.ton.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <p>{choisie.monde.resume}</p>
                <h3>Chapitres</h3>
                <ol className="histoire-chapitres">
                  {choisie.monde.chapitres.map((c) => (
                    <li key={c.id}>
                      <strong>{c.nom}</strong> <small>(niveaux {c.niveaux.min} à {c.niveaux.max})</small>
                    </li>
                  ))}
                </ol>

                <h3>Durée et coût</h3>
                <CoutHistoire h={choisie} />

                <h3>Pour commencer</h3>
                <ul className="histoire-conditions">
                  <li className={complets === TAILLE_GROUPE ? 'ok' : 'manque'}>
                    Un groupe de {TAILLE_GROUPE} personnages complets : {complets} / {TAILLE_GROUPE}
                    {complets < TAILLE_GROUPE && (
                      <button type="button" className="lien" onClick={onGroupe}>
                        compléter mon groupe
                      </button>
                    )}
                  </li>
                  <li className={groupe.niveau >= choisie.monde.niveaux.min && groupe.niveau <= choisie.monde.niveaux.max ? 'ok' : 'manque'}>
                    Niveau du groupe : {groupe.niveau} (histoire écrite pour les niveaux {choisie.monde.niveaux.min} à {choisie.monde.niveaux.max})
                  </li>
                </ul>
                <button type="button" className="bouton-principal" disabled title="Le conteur (maître de jeu) n'est pas encore branché.">
                  Commencer l'aventure
                </button>
                <p className="histoire-bientot">
                  Bientôt : le conteur, le maître de jeu animé par l'IA, n'est pas encore branché. L'histoire est écrite et illustrée ; elle sera jouable à
                  l'étape suivante du projet.
                </p>
              </div>
            </article>
          )}
        </div>
      )}
    </div>
  );
}
