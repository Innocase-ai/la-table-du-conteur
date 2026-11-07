import { useEffect } from 'react';
import creditsIcones from '../icones/CREDITS.md?raw';
import lisezMoi from '../../../../README.md?raw';

/** Lignes « | fichiers | auteur | » du tableau de CREDITS.md. */
function auteursIcones(): { fichiers: string; auteur: string }[] {
  return creditsIcones
    .split('\n')
    .filter((l) => l.startsWith('|') && !l.includes('---') && !/Fichier/.test(l))
    .map((l) => l.split('|').map((x) => x.trim()))
    .map((cols) => ({ fichiers: cols[1] ?? '', auteur: cols[2] ?? '' }))
    .filter((x) => x.fichiers && x.auteur);
}

/** Mention d'attribution du SRD reprise du README racine. */
function mentionSrd(): string {
  return lisezMoi.split('\n').find((l) => l.includes('System Reference Document')) ?? '';
}

/** Rend les URL d'un texte cliquables. */
function avecLiens(texte: string) {
  return texte.split(/(https?:\/\/[^\s),]+)/g).map((morceau, i) =>
    /^https?:\/\//.test(morceau) ? (
      <a key={i} href={morceau.replace(/\.$/, '')} target="_blank" rel="noreferrer">
        {morceau}
      </a>
    ) : (
      morceau
    ),
  );
}

export function Credits({ onFermer }: { onFermer: () => void }) {
  useEffect(() => {
    const f = (e: KeyboardEvent) => e.key === 'Escape' && onFermer();
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [onFermer]);
  return (
    <div className="credits-fond" onClick={onFermer}>
      <div className="credits" role="dialog" aria-modal="true" aria-labelledby="titre-credits" onClick={(e) => e.stopPropagation()}>
        <h2 id="titre-credits">Crédits</h2>
        <h3>Pictogrammes</h3>
        <p>
          Pictogrammes issus de{' '}
          <a href="https://game-icons.net" target="_blank" rel="noreferrer">
            game-icons.net
          </a>
          , sous licence{' '}
          <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">
            Creative Commons BY 3.0
          </a>
          . Fond noir retiré et couleur adaptée à l'affichage.
        </p>
        <table>
          <tbody>
            {auteursIcones().map((x) => (
              <tr key={x.fichiers}>
                <td>{x.fichiers}</td>
                <td>{x.auteur}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3>Musiques</h3>
        <p>
          Musiques d'accueil, de fond et de bataille issues de{' '}
          <a href="https://pixabay.com" target="_blank" rel="noreferrer">
            Pixabay
          </a>{' '}
          (Pixabay Content License), notamment par Leberch, Menieldm et The_Mountain. Les autres ambiances de combat ont été générées avec une IA (Google Lyria 3).
        </p>
        <h3>Règles</h3>
        <p>{avecLiens(mentionSrd())}</p>
        <div className="fin-boutons">
          <button type="button" className="bouton" onClick={onFermer}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
