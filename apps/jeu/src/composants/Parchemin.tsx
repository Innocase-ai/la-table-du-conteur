// La fenêtre de parchemin des informations importantes (un sort, une quête) : bandeau, tableau libellé / valeur, texte, et
// un bouton « Terminer ». Elle ne sait pas de quoi parle la fiche (`FicheInfo`).
import { useEffect } from 'react';
import type { FicheInfo } from '@crpg/regles';

export function Parchemin({ fiche, onFermer }: { fiche: FicheInfo; onFermer: () => void }) {
  useEffect(() => {
    // En phase de capture : Échap ferme le parchemin sans fermer, en plus, la conversation ou la page qui est dessous.
    const f = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onFermer();
    };
    window.addEventListener('keydown', f, true);
    return () => window.removeEventListener('keydown', f, true);
  }, [onFermer]);

  return (
    <div className="credits-fond" onClick={onFermer}>
      <div className="parchemin-cadre" role="dialog" aria-modal="true" aria-labelledby="titre-parchemin" onClick={(e) => e.stopPropagation()}>
        <div className="parchemin-bandeau">{fiche.rubrique}</div>
        <div className="parchemin-nom">{fiche.titre}</div>
        <div className="parchemin-feuille">
          <h2 id="titre-parchemin">{fiche.titre}</h2>
          {fiche.sousTitre && <p className="parchemin-sous-titre">{fiche.sousTitre}</p>}
          <dl className="parchemin-proprietes">
            {fiche.proprietes.map((p) => (
              <div key={p.libelle}>
                <dt>{p.libelle} :</dt>
                <dd>{p.valeur}</dd>
              </div>
            ))}
          </dl>
          {fiche.texte && (
            <div className="parchemin-texte">
              {fiche.texte.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}
        </div>
        <button type="button" className="parchemin-terminer" onClick={onFermer} autoFocus>
          Terminer
        </button>
      </div>
    </div>
  );
}
