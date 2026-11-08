import { useEffect, useMemo, useState } from 'react';
import { bilanPersonnage, personnageComplet, TAILLE_GROUPE, TAILLE_GROUPE_MIN, type Donnees, type Groupe } from '@crpg/regles';
import { histoires, type Histoire } from '../mondes';

interface Props {
  donnees: Donnees;
  groupe: Groupe;
  onGroupe: () => void;
  onRetour: () => void;
  onCommencer: (monde: string) => void;
}

const nombre = (x: number) => x.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

/** Ce que veut dire la taille de groupe pour laquelle une histoire est écrite. */
function texteGroupe(conseille: number): string {
  if (conseille <= 4) return `Écrite pour un groupe de ${conseille} héros. À 5 ou 6 héros, des renforts s'ajoutent aux combats ; à moins de ${conseille}, ils sont allégés.`;
  return `Écrite pour un groupe de ${conseille} héros. Avec moins de héros, les combats comptent moins de monstres (tout reste jouable de 1 à ${conseille} héros).`;
}
const dollars = (x: number) => `${nombre(x)} $`;

/** Coût d'API estimé pour finir l'histoire, par modèle du conteur (le joueur paie avec sa propre clé). */
function CoutHistoire({ h }: { h: Histoire }) {
  const e = h.estimation;
  if (!e) return <p className="histoire-bientot">Durée et coût pas encore estimés.</p>;
  return (
    <div className="histoire-cout">
      <p>
        Durée estimée : <strong>environ {e.heures.total} h</strong> ({nombre(e.heures.recit)} h d'exploration et de dialogues, {nombre(e.heures.combats)} h de
        combats), dont {e.toursConteur} moments racontés par le conteur.
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
        Payé avec votre propre clé d'API, pour finir l'histoire. Seuls les moments racontés par le conteur coûtent : l'exploration, les combats et les
        images du monde sont gratuits. Estimation provisoire, calculée sur le contenu de l'histoire ; elle sera recalée sur des parties réelles.
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
export function EcranHistoires({ donnees, groupe, onGroupe, onRetour, onCommencer }: Props) {
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
                      Niveaux {h.monde.niveaux.min} à {h.monde.niveaux.max} · pour {h.monde.groupe.conseille} héros · {h.monde.chapitres.length} chapitre{h.monde.chapitres.length > 1 ? 's' : ''}
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
                <p className="histoire-groupe">
                  <strong>Groupe conseillé : {choisie.monde.groupe.conseille} héros.</strong> {texteGroupe(choisie.monde.groupe.conseille)}
                </p>
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
                  <li className={complets >= TAILLE_GROUPE_MIN ? 'ok' : 'manque'}>
                    Un groupe de {TAILLE_GROUPE_MIN} à {TAILLE_GROUPE} personnages complets (conseillé : {choisie.monde.groupe.conseille}) : {complets} prêt{complets > 1 ? 's' : ''}
                    {complets > 0 && complets !== choisie.monde.groupe.conseille && ` (les combats seront adaptés à ${complets} héros)`}
                    {(complets < TAILLE_GROUPE_MIN || complets < choisie.monde.groupe.conseille) && (
                      <button type="button" className="lien" onClick={onGroupe}>
                        {complets < TAILLE_GROUPE_MIN ? 'créer mon groupe' : 'modifier mon groupe'}
                      </button>
                    )}
                  </li>
                  <li className={groupe.niveau >= choisie.monde.niveaux.min && groupe.niveau <= choisie.monde.niveaux.max ? 'ok' : 'manque'}>
                    Niveau du groupe : {groupe.niveau} (histoire écrite pour les niveaux {choisie.monde.niveaux.min} à {choisie.monde.niveaux.max})
                    {(groupe.niveau < choisie.monde.niveaux.min || groupe.niveau > choisie.monde.niveaux.max) && (
                      <button type="button" className="lien" onClick={onGroupe}>
                        changer le niveau
                      </button>
                    )}
                  </li>
                </ul>
                <button type="button" className="bouton-principal" disabled={complets < TAILLE_GROUPE_MIN || groupe.niveau < choisie.monde.niveaux.min || groupe.niveau > choisie.monde.niveaux.max} onClick={() => onCommencer(choisie.monde.id)}>
                  Commencer l'aventure
                </button>
                <p className="histoire-bientot">
                  Mode « livre » : vous jouez avec les actions proposées et les textes de l'histoire, sans clé d'API et sans frais. Le conteur (l'IA qui répond à
                  ce que vous écrivez) arrive à l'étape suivante.
                </p>
              </div>
            </article>
          )}
        </div>
      )}
    </div>
  );
}
