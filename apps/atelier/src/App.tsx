import { useCallback, useEffect, useMemo, useState } from 'react';
import { assemblerMonde, diagnostiquerMonde, type DiagnosticMonde, type DonneesMonde } from '@crpg/regles';
import { lireMonde, listerMondes, type MondeLu, type ResumeMonde } from './api';
import { chargerDonnees } from './donnees';
import { Cartes } from './vues/Cartes';
import { Fiches } from './vues/Fiches';
import { Graphes } from './vues/Graphes';
import { Parcours } from './vues/Parcours';
import { Registre } from './vues/Registre';
import { Revue } from './vues/Revue';
import { Sante } from './vues/Sante';

type Etat =
  | { etat: 'vide' }
  | { etat: 'chargement' }
  | { etat: 'erreur'; message: string }
  | { etat: 'illisible'; erreurs: { fichier: string; message: string }[] }
  | { etat: 'ok'; lu: MondeLu; dm: DonneesMonde; diag: DiagnosticMonde; duree: number };

const VUES = ['graphes', 'parcours', 'fiches', 'cartes', 'registre', 'revue'] as const;

/** Le monde et la vue choisis : `#/<monde>` (santé), `#/<monde>/graphes`, `#/<monde>/fiches/<dossier>/<id>`… */
const lireHash = () => {
  const [monde = '', vue = '', dossier = '', ident = ''] = window.location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  return { monde, vue: (VUES as readonly string[]).includes(vue) ? (vue as (typeof VUES)[number]) : ('sante' as const), dossier, ident };
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
        <select value={id} onChange={(e) => (window.location.hash = `#/${e.target.value}${h.vue === 'sante' ? '' : `/${h.vue}`}`)} aria-label="Monde">
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
            <a href={`#/${id}/parcours`} className={h.vue === 'parcours' ? 'actif' : ''}>
              Parcours
            </a>
            <a href={`#/${id}/fiches`} className={h.vue === 'fiches' ? 'actif' : ''}>
              Fiches
            </a>
            <a href={`#/${id}/cartes`} className={h.vue === 'cartes' ? 'actif' : ''}>
              Cartes
            </a>
            <a href={`#/${id}/registre`} className={h.vue === 'registre' ? 'actif' : ''}>
              Registre
            </a>
            <a href={`#/${id}/revue`} className={h.vue === 'revue' ? 'actif' : ''}>
              Revue
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
        {etat.etat === 'ok' && h.vue === 'parcours' && <Parcours lu={etat.lu} dm={etat.dm} />}
        {etat.etat === 'ok' && h.vue === 'fiches' && <Fiches lu={etat.lu} dm={etat.dm} diag={etat.diag} dossier={h.dossier} ident={h.ident} recharger={() => charger(id)} />}
        {etat.etat === 'ok' && h.vue === 'cartes' && <Cartes lu={etat.lu} dm={etat.dm} recharger={() => charger(id)} />}
        {etat.etat === 'ok' && h.vue === 'registre' && <Registre lu={etat.lu} dm={etat.dm} diag={etat.diag} />}
        {etat.etat === 'ok' && h.vue === 'revue' && <Revue lu={etat.lu} dm={etat.dm} diag={etat.diag} recharger={() => charger(id)} />}
      </main>
    </div>
  );
}
