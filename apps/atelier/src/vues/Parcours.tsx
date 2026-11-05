import { useEffect, useRef, useState } from 'react';
import type { CategorieCouverture, DonneesMonde, Parcours as UnParcours, RapportExploration } from '@crpg/regles';
import type { MondeLu } from '../api';
import type { EntreeSimulateur, SortieSimulateur } from '../simulateur.worker';

const NOMS_COUVERTURE: Record<CategorieCouverture, string> = {
  lieux: 'Lieux',
  pnj: 'PNJ parlés',
  rencontres: 'Rencontres',
  evenements: 'Événements',
  faits: 'Faits appris',
  enigmes: 'Énigmes résolues',
  quetes: 'Quêtes terminées',
  fins: 'Fins',
};

const RAISONS: Record<RapportExploration['arret'], string> = {
  'toutes-atteintes': 'Toutes les fins ont été atteintes.',
  epuise: 'Tous les états accessibles ont été explorés.',
  budget: 'Le nombre d’états autorisé est épuisé.',
  temps: 'Le temps autorisé est épuisé.',
  arret: 'Arrêté par l’utilisateur.',
};

/** Le joueur automatique : il joue le vrai moteur pour atteindre chaque fin et rend un parcours rejouable. */
export function Parcours({ lu, dm }: { lu: MondeLu; dm: DonneesMonde }) {
  const [etats, setEtats] = useState(6000);
  const [secondes, setSecondes] = useState(60);
  const [couvrir, setCouvrir] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [progres, setProgres] = useState<{ etats: number; fins: string[]; ms: number } | null>(null);
  const [rapport, setRapport] = useState<RapportExploration | null>(null);
  const [erreur, setErreur] = useState('');
  const [ouvert, setOuvert] = useState<string | null>(null);
  const worker = useRef<Worker | null>(null);

  // Le calcul s'arrête si on quitte la page ou change de monde.
  useEffect(() => () => worker.current?.terminate(), []);
  useEffect(() => {
    worker.current?.terminate();
    worker.current = null;
    setEnCours(false);
    setRapport(null);
    setProgres(null);
    setErreur('');
    setOuvert(null);
  }, [lu.id]);

  const arreter = () => {
    worker.current?.terminate();
    worker.current = null;
    setEnCours(false);
  };

  const lancer = () => {
    worker.current?.terminate();
    const w = new Worker(new URL('../simulateur.worker.ts', import.meta.url), { type: 'module' });
    worker.current = w;
    setEnCours(true);
    setRapport(null);
    setErreur('');
    setProgres(null);
    setOuvert(null);
    w.onmessage = (e: MessageEvent<SortieSimulateur>) => {
      if (e.data.type === 'progres') setProgres(e.data);
      else {
        if (e.data.type === 'fini') setRapport(e.data.rapport);
        else setErreur(e.data.message);
        setEnCours(false);
        w.terminate();
        worker.current = null;
      }
    };
    w.onerror = (e) => {
      setErreur(e.message || 'Le simulateur a échoué.');
      setEnCours(false);
    };
    const message: EntreeSimulateur = {
      monde: lu.monde,
      fichiers: lu.fichiers.map(({ chemin, contenu }) => ({ chemin, contenu })),
      options: { budgetEtats: etats, budgetMs: secondes * 1000, graines: [21, 7], couvrir },
    };
    w.postMessage(message);
  };

  const parcoursOuvert = rapport?.parcours.find((p) => p.fin === ouvert);

  return (
    <section>
      <p className="muet">
        Un joueur automatique joue le <b>vrai moteur</b> (mêmes boutons que le joueur) pour atteindre chaque fin. Il suppose les combats gagnés et ne fait ni achat ni saisie libre. Une fin « non atteinte » n’est pas prouvée impossible : c’est « pas trouvée avec ce budget ».
      </p>
      <div className="outils">
        <label>
          États : <input type="number" min={200} max={100000} step={500} value={etats} onChange={(e) => setEtats(Number(e.target.value))} disabled={enCours} />
        </label>
        <label>
          Secondes : <input type="number" min={5} max={600} step={5} value={secondes} onChange={(e) => setSecondes(Number(e.target.value))} disabled={enCours} />
        </label>
        <label title="Continue d'explorer après avoir trouvé toutes les fins, pour savoir ce que le joueur automatique voit.">
          <input type="checkbox" checked={couvrir} onChange={(e) => setCouvrir(e.target.checked)} disabled={enCours} /> Continuer après les fins (couverture)
        </label>
        {enCours ? (
          <button className="bouton" onClick={arreter}>
            Arrêter
          </button>
        ) : (
          <button className="bouton principal" onClick={lancer}>
            Lancer la simulation
          </button>
        )}
        {enCours && (
          <span className="muet">{progres ? `${progres.etats} états · ${(progres.ms / 1000).toFixed(0)} s · ${progres.fins.length}/${dm.fins.size} fins` : 'Démarrage…'}</span>
        )}
      </div>
      {erreur && <p className="erreur">{erreur}</p>}

      {rapport && (
        <>
          <p className={rapport.finsNonAtteintes.length ? 'avertit' : 'bravo'}>
            {rapport.parcours.length}/{dm.fins.size} fins atteintes — {rapport.etats} états en {(rapport.ms / 1000).toFixed(1)} s. {RAISONS[rapport.arret]}
          </p>
          <table className="diagnostics">
            <thead>
              <tr>
                <th>Fin</th>
                <th>Résultat</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {dm.fins.size === 0 && (
                <tr>
                  <td colSpan={3} className="muet">
                    Ce monde n’a aucune fin.
                  </td>
                </tr>
              )}
              {[...dm.fins.values()].map((f) => {
                const p = rapport.parcours.find((x) => x.fin === f.id);
                return (
                  <tr key={f.id} className={p ? '' : 'avis'}>
                    <td>
                      {f.nom} <code>{f.id}</code>
                    </td>
                    <td>{p ? <span className="bravo">atteinte en {p.etapes.length} pas</span> : <span className="orange">non atteinte</span>}</td>
                    <td>
                      {p && (
                        <button className="lien" onClick={() => setOuvert(ouvert === f.id ? null : f.id)}>
                          {ouvert === f.id ? 'Masquer le parcours' : 'Voir le parcours'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {parcoursOuvert && <Chemin p={parcoursOuvert} />}

          <h3>Ce que le joueur automatique a vu</h3>
          <div className="couverture">
            {(Object.keys(NOMS_COUVERTURE) as CategorieCouverture[]).map((k) => {
              const c = rapport.couverture[k];
              const total = c.vus.length + c.jamais.length;
              return (
                <details key={k}>
                  <summary>
                    {NOMS_COUVERTURE[k]} : <b>{c.vus.length}</b> / {total}
                    {c.jamais.length > 0 && <span className="muet"> — {c.jamais.length} jamais vu(s)</span>}
                  </summary>
                  {c.jamais.length > 0 && (
                    <p className="puces">
                      {c.jamais.map((id) => (
                        <code key={id} className="puce">
                          {id}
                        </code>
                      ))}
                    </p>
                  )}
                </details>
              );
            })}
          </div>
          <p className="muet">Sur les états explorés seulement : si le budget est épuisé, « jamais vu » veut dire « pas trouvé ».</p>
          <details>
            <summary>Hypothèses du simulateur</summary>
            <ul>
              {rapport.hypotheses.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </details>
        </>
      )}
    </section>
  );
}

function Chemin({ p }: { p: UnParcours }) {
  return (
    <div className="chemin">
      <h3>
        Parcours vers <code>{p.fin}</code>{' '}
        <span className="muet">
          (graine {p.graine}, niveau {p.niveau})
        </span>
      </h3>
      <ol>
        {p.etapes.map((e, i) => (
          <li key={i}>
            {e.libelle} <span className="muet">→ {e.lieu}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
