import { useCallback, useEffect, useMemo, useState } from 'react';
import { assemblerMonde, diagnostiquerMonde, type DiagnosticMonde, type DonneesMonde } from '@crpg/regles';
import { lireMonde, listerMondes, type MondeLu, type ResumeMonde } from './api';
import { chargerDonnees } from './donnees';
import { Graphes } from './vues/Graphes';
import { Sante } from './vues/Sante';

type Etat =
  | { etat: 'vide' }
  | { etat: 'chargement' }
  | { etat: 'erreur'; message: string }
  | { etat: 'illisible'; erreurs: { fichier: string; message: string }[] }
  | { etat: 'ok'; lu: MondeLu; dm: DonneesMonde; diag: DiagnosticMonde; duree: number };

/** Le monde et la vue choisis : `#/<monde>` (santé) ou `#/<monde>/graphes`. */
const lireHash = () => {
  const [monde = '', vue = ''] = window.location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  return { monde, vue: vue === 'graphes' ? ('graphes' as const) : ('sante' as const) };
};

export function App() {
  const [mondes, setMondes] = useState<ResumeMonde[]>([]);
  const [h, setH] = useState(lireHash());
  const id = h.monde;
  const [etat, setEtat] = useState<Etat>({ etat: 'vide' });
  const [maj, setMaj] = useState<Date | null>(null);

  useEffect(() => {
    listerMondes().then(setMondes, (e: Error) => setEtat({ etat: 'erreur', message: e.message }));
    const surHash = () => setH(lireHash());
    window.addEventListener('hashchange', surHash);
    return () => window.removeEventListener('hashchange', surHash);
  }, []);

  const charger = useCallback(async (cible: string) => {
    if (!cible) return setEtat({ etat: 'vide' });
    try {
      const lu = await lireMonde(cible);
      const debut = performance.now();
      const r = assemblerMonde(lu.monde, lu.fichiers.map(({ chemin, contenu }) => ({ chemin, contenu })), lu.erreursLecture);
      if (!r.ok) return setEtat({ etat: 'illisible', erreurs: r.erreurs });
      const diag = diagnostiquerMonde(r.monde, chargerDonnees());
      setEtat({ etat: 'ok', lu, dm: r.monde, diag, duree: Math.round(performance.now() - debut) });
      setMaj(new Date());
    } catch (e) {
      setEtat({ etat: 'erreur', message: (e as Error).message });
    }
  }, []);

  useEffect(() => {
    setEtat(id ? { etat: 'chargement' } : { etat: 'vide' });
    void charger(id);
  }, [id, charger]);

  // Un fichier du monde change sur le disque (Claude Code, un agent, un éditeur) : on recharge et on revalide.
  useEffect(() => {
    if (!import.meta.hot) return;
    const surChangement = (d: { monde: string }) => d.monde === id && void charger(id);
    import.meta.hot.on('atelier:change', surChangement);
    return () => import.meta.hot?.off?.('atelier:change', surChangement);
  }, [id, charger]);

  const courant = useMemo(() => mondes.find((m) => m.id === id), [mondes, id]);

  return (
    <div className="atelier">
      <header className="entete">
        <h1>Atelier du Conteur</h1>
        <select value={id} onChange={(e) => (window.location.hash = `#/${e.target.value}${h.vue === 'graphes' ? '/graphes' : ''}`)} aria-label="Monde">
          <option value="">— choisir un monde —</option>
          {mondes.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nom}
              {m.statut === 'brouillon' ? ' (brouillon)' : ''}
            </option>
          ))}
        </select>
        {id && (
          <nav className="vues">
            <a href={`#/${id}`} className={h.vue === 'sante' ? 'actif' : ''}>
              Santé
            </a>
            <a href={`#/${id}/graphes`} className={h.vue === 'graphes' ? 'actif' : ''}>
              Graphes
            </a>
          </nav>
        )}
        {maj && <span className="muet">à jour à {maj.toLocaleTimeString('fr-FR')} · surveille le disque</span>}
      </header>
      <main>
        {etat.etat === 'vide' && <p className="muet">Choisissez un monde pour voir sa santé : erreurs, avis et conseils, mis à jour dès qu’un fichier change.</p>}
        {etat.etat === 'chargement' && <p className="muet">Chargement…</p>}
        {etat.etat === 'erreur' && <p className="erreur">{etat.message}</p>}
        {etat.etat === 'illisible' && (
          <section>
            <h2>Monde illisible</h2>
            <p>Des fichiers ne respectent pas le format : le monde ne peut pas être assemblé.</p>
            <ul className="liste">
              {etat.erreurs.map((e, i) => (
                <li key={i}>
                  <code>{e.fichier}</code> — {e.message}
                </li>
              ))}
            </ul>
          </section>
        )}
        {etat.etat === 'ok' && h.vue === 'sante' && <Sante nom={courant?.nom ?? id} statut={courant?.statut ?? ''} dm={etat.dm} diag={etat.diag} duree={etat.duree} />}
        {etat.etat === 'ok' && h.vue === 'graphes' && <Graphes lu={etat.lu} dm={etat.dm} diag={etat.diag} />}
      </main>
    </div>
  );
}
