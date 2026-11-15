// Options : le temps de jeu mesuré de chaque histoire, comparé à l'estimation. Tout reste dans le navigateur ; le joueur peut
// exporter les mesures (pour recaler l'estimation : `pnpm monde calibrer`) ou les effacer.
import { useMemo, useState } from 'react';
import { histoires } from '../mondes';
import { bilan, chargerMesures, dureeLisible, effacerMesures, exporterMesures, type Mesures } from '../mesure/mesure-temps';

export function SectionTempsDeJeu() {
  const [mesures, setMesures] = useState<Mesures>(() => chargerMesures());
  const [confirmer, setConfirmer] = useState(false);
  const liste = useMemo(() => histoires(), []);
  const lignes = liste.map((h) => ({ h, m: mesures[h.monde.id] })).filter((x): x is { h: (typeof liste)[number]; m: NonNullable<(typeof mesures)[string]> } => !!x.m);

  const exporter = () => {
    try {
      const url = URL.createObjectURL(new Blob([exporterMesures(mesures)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'temps-de-jeu.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // le navigateur refuse le téléchargement : rien à faire de plus
    }
  };

  return (
    <section className="options-bloc" aria-labelledby="options-temps">
      <h2 id="options-temps">Temps de jeu</h2>
      <p className="options-aide">
        Le jeu compte le temps où vous jouez vraiment (onglet visible, une action dans les 90 dernières secondes) et le nombre d'actions, histoire par histoire. Rien n'est envoyé : cela reste dans votre navigateur.
        Ces mesures servent à vérifier la durée estimée de chaque histoire.
      </p>
      {lignes.length === 0 ? (
        <p className="options-aide">Rien de mesuré pour l'instant : lancez une histoire.</p>
      ) : (
        <table className="options-temps">
          <thead>
            <tr>
              <th>Histoire</th>
              <th>Joué</th>
              <th>Actions</th>
              <th>Estimé</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map(({ h, m }) => {
              const b = bilan(h.monde.id, m, h.estimation?.heures.total);
              return (
                <tr key={h.monde.id}>
                  <td>{h.monde.nom}</td>
                  <td>
                    {dureeLisible(m.secondes)}
                    <small> · {m.sessions} session{m.sessions > 1 ? 's' : ''}</small>
                  </td>
                  <td>
                    {m.actions}
                    {b.secondesParAction !== undefined && <small> · {Math.round(b.secondesParAction)} s par action</small>}
                  </td>
                  <td>{h.estimation ? `≈ ${h.estimation.heures.total} h` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <div className="options-temps-actions">
        <button type="button" className="bouton" onClick={exporter} disabled={lignes.length === 0}>
          Exporter les mesures
        </button>
        {confirmer ? (
          <>
            <button
              type="button"
              className="bouton"
              onClick={() => {
                effacerMesures();
                setMesures({});
                setConfirmer(false);
              }}
            >
              Oui, tout effacer
            </button>
            <button type="button" className="bouton-discret" onClick={() => setConfirmer(false)}>
              Annuler
            </button>
          </>
        ) : (
          <button type="button" className="bouton-discret" onClick={() => setConfirmer(true)} disabled={lignes.length === 0}>
            Effacer
          </button>
        )}
      </div>
    </section>
  );
}
