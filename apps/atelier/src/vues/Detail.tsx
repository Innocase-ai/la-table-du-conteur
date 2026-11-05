import type { DonneesMonde, IndexReferences, NoeudGraphe, RefEntite, Site } from '@crpg/regles';
import type { MondeLu } from '../api';

/** Le JSON brut d'une entité (tel qu'il est dans le fichier du monde), avec le fichier qui le contient. */
export function trouverBrut(lu: MondeLu, e: RefEntite): { chemin: string; objet: unknown } | undefined {
  for (const f of lu.fichiers) {
    if (!f.chemin.startsWith(`${e.type}/`)) continue;
    const objet = (Array.isArray(f.contenu) ? f.contenu : [f.contenu]).find((x) => (x as { id?: string; pnj?: string })?.id === e.id || (e.type === 'savoirs' && (x as { pnj?: string })?.pnj === e.id));
    if (objet) return { chemin: f.chemin, objet };
  }
  return undefined;
}

function Sites({ titre, sites, onVoir }: { titre: string; sites: Site[]; onVoir: (e: RefEntite) => void }) {
  const uniques = [...new Map(sites.map((s) => [`${s.entite.type}:${s.entite.id}`, s])).values()];
  return (
    <div className="sites">
      <h4>
        {titre} <span className="muet">({uniques.length})</span>
      </h4>
      {uniques.length === 0 ? (
        <p className="muet">Personne.</p>
      ) : (
        <ul>
          {uniques.slice(0, 40).map((s) => (
            <li key={`${s.entite.type}:${s.entite.id}`}>
              <button className="lien" onClick={() => onVoir(s.entite)}>
                {s.entite.id}
              </button>{' '}
              <span className="muet">{s.entite.type}</span>
            </li>
          ))}
          {uniques.length > 40 && <li className="muet">… et {uniques.length - 40} autres</li>}
        </ul>
      )}
    </div>
  );
}

/** Le panneau de droite : ce qu'est le nœud choisi, d'où il vient, qui le produit et qui le lit. */
export function Detail({ noeud, entite, lu, dm, idx, onVoir }: { noeud: NoeudGraphe | null; entite: RefEntite | null; lu: MondeLu; dm: DonneesMonde; idx: IndexReferences; onVoir: (e: RefEntite) => void }) {
  const cible = entite ?? noeud?.entite ?? null;
  const ref = !entite && noeud?.ref ? noeud.ref : null;
  if (!cible && !ref) return <aside className="detail muet">Cliquez sur un nœud pour voir son détail.</aside>;
  const brut = cible ? trouverBrut(lu, cible) : undefined;
  const cle = ref ? `${ref.genre}:${ref.id}` : null;
  const fait = ref?.genre === 'fait' ? dm.faits.get(ref.id) : undefined;
  return (
    <aside className="detail">
      {ref && (
        <>
          <h3>
            <code>{ref.id}</code>
          </h3>
          <p className="muet">
            {ref.genre}
            {noeud?.etat === 'orphelin' ? ' — rien ne le produit' : ''}
          </p>
          {fait && <p className="fait">{fait.texte}</p>}
          <Sites titre="Produit par" sites={cle ? (idx.produit.get(cle) ?? []) : []} onVoir={onVoir} />
          <Sites titre="Lu par" sites={cle ? (idx.consomme.get(cle) ?? []) : []} onVoir={onVoir} />
        </>
      )}
      {cible && (
        <>
          <h3>
            <code>{cible.id}</code>
          </h3>
          <p className="muet">
            {cible.type}
            {brut ? ` · ${brut.chemin}` : ''}
          </p>
          {brut ? <pre>{JSON.stringify(brut.objet, null, 2)}</pre> : <p className="muet">Fiche introuvable dans les fichiers du monde.</p>}
        </>
      )}
    </aside>
  );
}
