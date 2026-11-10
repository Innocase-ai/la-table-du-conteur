import { useMemo, useState } from 'react';
import type { DiagnosticMonde, DonneesMonde } from '@crpg/regles';
import type { MondeLu } from '../api';
import { arbreDuMonde, filtrerArbre, LIBELLES_DOSSIERS, tailleDuNoeud, type NoeudLieu } from '../arbre';

/** Les lieux du monde en arbre, et sous chacun ce qui s'y trouve ; un clic ouvre la fiche dans l'éditeur. */
export function Arbre({ lu, dm, diag }: { lu: MondeLu; dm: DonneesMonde; diag: DiagnosticMonde }) {
  const arbre = useMemo(() => arbreDuMonde(dm), [dm]);
  const [recherche, setRecherche] = useState('');
  // `ouvert` : true = tout déplié, false = tout replié ; `version` force les <details> à reprendre l'état choisi.
  const [ouvert, setOuvert] = useState(true);
  const [version, setVersion] = useState(0);
  const visibles = useMemo(() => filtrerArbre(arbre.racines, recherche), [arbre, recherche]);

  // Les diagnostics par fiche : `lieux/val-moulin` → 2 erreurs, 1 avis.
  const gravites = useMemo(() => {
    const m = new Map<string, { erreur: number; avis: number }>();
    for (const d of diag.diagnostics) {
      if (!d.entite || (d.gravite !== 'erreur' && d.gravite !== 'avis')) continue;
      const cle = `${d.entite.type}/${d.entite.id}`;
      const c = m.get(cle) ?? { erreur: 0, avis: 0 };
      c[d.gravite]++;
      m.set(cle, c);
    }
    return m;
  }, [diag]);

  const lien = (dossier: string, id: string) => `#/${lu.id}/fiches/${dossier}/${encodeURIComponent(id)}`;
  const pastilles = (dossier: string, id: string) => {
    const c = gravites.get(`${dossier}/${id}`);
    if (!c) return null;
    return (
      <>
        {c.erreur > 0 && <span className="arbreDiag erreur" title="erreurs du validateur">{c.erreur}</span>}
        {c.avis > 0 && <span className="arbreDiag avis" title="avis du validateur">{c.avis}</span>}
      </>
    );
  };

  const noeud = (n: NoeudLieu, profondeur: number) => (
    <details key={`${n.id}-${version}`} className="arbreLieu" open={recherche.trim() ? true : ouvert || profondeur === 0}>
      <summary>
        <a href={lien('lieux', n.id)} onClick={(e) => e.stopPropagation()}>
          {n.nom}
        </a>{' '}
        <code className="muet">{n.id}</code> <span className="pastille">{n.type}</span>
        {pastilles('lieux', n.id)}
        {n.enfants.length > 0 && <span className="muet"> · {tailleDuNoeud(n) - 1} lieu(x) dessous</span>}
      </summary>
      {n.entites.length > 0 && (
        <ul className="arbreEntites">
          {n.entites.map((e) => (
            <li key={`${e.dossier}/${e.id}/${e.detail ?? ''}`}>
              <span className={`arbreDossier d-${e.dossier}`}>{LIBELLES_DOSSIERS[e.dossier] ?? e.dossier}</span>
              <a href={lien(e.dossier, e.id)}>{e.nom}</a>
              {e.nom !== e.id && <code className="muet"> {e.id}</code>}
              {e.detail && <span className="muet"> — {e.detail}</span>}
              {pastilles(e.dossier, e.id)}
            </li>
          ))}
        </ul>
      )}
      {n.enfants.length > 0 && <div className="arbreEnfants">{n.enfants.map((x) => noeud(x, profondeur + 1))}</div>}
    </details>
  );

  return (
    <section>
      <div className="outils">
        <input type="search" placeholder="Chercher un lieu, un PNJ, une rencontre…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        <button className="bouton" onClick={() => (setOuvert(true), setVersion((v) => v + 1))}>
          Tout déplier
        </button>
        <button className="bouton" onClick={() => (setOuvert(false), setVersion((v) => v + 1))}>
          Tout replier
        </button>
        <span className="muet">
          {dm.lieux.size} lieux · {arbre.racines.length} racine(s)
        </span>
      </div>
      {visibles.length === 0 && <p className="muet">Rien ne correspond à « {recherche} ».</p>}
      <div className="arbre">{visibles.map((n) => noeud(n, 0))}</div>
      {arbre.egarees.length > 0 && (
        <>
          <h3>Fiches rattachées à un lieu inconnu</h3>
          <ul className="arbreEntites">
            {arbre.egarees.map((e) => (
              <li key={`${e.dossier}/${e.id}`}>
                <span className={`arbreDossier d-${e.dossier}`}>{LIBELLES_DOSSIERS[e.dossier] ?? e.dossier}</span>
                <a href={lien(e.dossier, e.id)}>{e.nom}</a> <span className="erreur">lieu « {e.lieu} » introuvable</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
