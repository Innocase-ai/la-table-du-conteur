import { useMemo, useState } from 'react';
import { type Diagnostic, type DiagnosticMonde, type DonneesMonde, type Gravite } from '@crpg/regles';

const GRAVITES: { id: Gravite; nom: string }[] = [
  { id: 'erreur', nom: 'Erreurs' },
  { id: 'avis', nom: 'Avis' },
  { id: 'conseil', nom: 'Conseils' },
];

const SOURCES: Record<string, string> = {
  validation: 'Validateur',
  enigmes: 'Énigmes (jouées)',
  controles: 'Contrôles de l’atelier',
};
const nomSource = (s: string) => (s.startsWith('module:') ? `Module « ${s.slice(7)} »` : (SOURCES[s] ?? s));

/** La santé d'un monde : tout ce que le validateur, les modules, l'audit des énigmes et les contrôles de l'atelier relèvent. */
export function Sante({ nom, statut, dm, diag, duree }: { nom: string; statut: string; dm: DonneesMonde; diag: DiagnosticMonde; duree: number }) {
  const [gravites, setGravites] = useState<Set<Gravite>>(new Set(['erreur', 'avis', 'conseil']));
  const [source, setSource] = useState('');
  const [recherche, setRecherche] = useState('');

  const parGravite = useMemo(() => {
    const n: Record<Gravite, number> = { erreur: 0, avis: 0, conseil: 0 };
    for (const d of diag.diagnostics) n[d.gravite]++;
    return n;
  }, [diag]);
  const sources = useMemo(() => [...new Set(diag.diagnostics.map((d) => d.source))].sort(), [diag]);
  const parCode = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of diag.diagnostics) m.set(d.code, (m.get(d.code) ?? 0) + 1);
    return [...m].sort((a, b) => b[1] - a[1]);
  }, [diag]);

  const q = recherche.trim().toLowerCase();
  const visibles = diag.diagnostics.filter(
    (d) => gravites.has(d.gravite) && (!source || d.source === source) && (!q || `${d.code} ${d.message} ${d.entite?.id ?? ''}`.toLowerCase().includes(q)),
  );
  const ordre: Record<Gravite, number> = { erreur: 0, avis: 1, conseil: 2 };
  visibles.sort((a, b) => ordre[a.gravite] - ordre[b.gravite]);

  const bascule = (g: Gravite) =>
    setGravites((cur) => {
      const n = new Set(cur);
      if (n.has(g)) n.delete(g);
      else n.add(g);
      return n;
    });

  const s = diag.stats;
  const nbLieux = Object.values(s.lieux).reduce((a, b) => a + b, 0);

  return (
    <section>
      <div className="titre">
        <h2>{nom}</h2>
        {statut && <span className={`pastille ${statut}`}>{statut}</span>}
      </div>
      <p className="muet">
        {nbLieux} lieux · {s.pnj} PNJ ({s.sujets} sujets) · {Object.values(s.quetes).reduce((a, b) => a + b, 0)} quêtes · {s.rencontres} rencontres · {s.tresors} trésors · {s.enigmes} énigmes · {s.pieges} pièges · {s.faits} faits · {s.factions} factions ·{' '}
        {dm.fins.size} fins. Diagnostic en {duree} ms ; {diag.index.produit.size} références produites, {diag.index.consomme.size} consommées.
      </p>

      <div className="compteurs">
        {GRAVITES.map((g) => (
          <button key={g.id} className={`compteur ${g.id}${gravites.has(g.id) ? ' actif' : ''}`} onClick={() => bascule(g.id)} aria-pressed={gravites.has(g.id)}>
            <strong>{parGravite[g.id]}</strong> {g.nom}
          </button>
        ))}
        <select value={source} onChange={(e) => setSource(e.target.value)} aria-label="Source">
          <option value="">Toutes les sources</option>
          {sources.map((x) => (
            <option key={x} value={x}>
              {nomSource(x)}
            </option>
          ))}
        </select>
        <input type="search" placeholder="Chercher (code, id, mot)…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
      </div>

      {parGravite.erreur === 0 && <p className="bravo">Aucune erreur : le monde est jouable.</p>}

      <details className="codes">
        <summary>{parCode.length} types de diagnostic</summary>
        <div className="puces">
          {parCode.map(([code, n]) => (
            <button key={code} className="puce" onClick={() => setRecherche(code)}>
              {code} <b>{n}</b>
            </button>
          ))}
        </div>
      </details>

      {visibles.length === 0 ? (
        <p className="muet">Rien à afficher avec ces filtres.</p>
      ) : (
        <table className="diagnostics">
          <thead>
            <tr>
              <th>Gravité</th>
              <th>Code</th>
              <th>Entité</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((d, i) => (
              <Ligne key={i} d={d} />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function Ligne({ d }: { d: Diagnostic }) {
  return (
    <tr className={d.gravite}>
      <td>
        <span className={`gravite ${d.gravite}`}>{d.gravite}</span>
      </td>
      <td>
        <code>{d.code}</code>
      </td>
      <td>{d.entite ? <code title={d.entite.type}>{d.entite.id}</code> : <span className="muet">—</span>}</td>
      <td>
        {d.message}
        <div className="source">{nomSource(d.source)}</div>
      </td>
    </tr>
  );
}
