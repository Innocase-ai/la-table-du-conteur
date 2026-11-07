// Le parchemin d'une quête : un rouleau qui se déroule au centre de l'écran, avec le cachet de cire, le nom, qui la donne (son
// portrait) et l'explication. Au début d'une quête : le premier objectif et les récompenses promises. À la fin : un tampon
// « Accomplie » et ce que le groupe reçoit. À l'échec : un tampon « Échouée ». Le moteur a déjà tout réglé : l'écran ne fait que
// raconter. « Commencer », Échap, Espace ou Entrée le ferment.
import { useEffect } from 'react';
import { Portrait } from '../createur/ui';
import type { ParcheminQuete } from '../quete-regles';

interface Props {
  quete: ParcheminQuete;
  /** Portrait du PNJ qui donne la quête (image du monde), s'il y en a une. */
  imageDonneur?: string;
  /** Combien d'autres parchemins attendent derrière celui-ci. */
  suivantes: number;
  onFin: () => void;
}

// Des signes en texte (pas en émoji) : le cachet les peint de la couleur du type de quête.
const CACHET: Record<ParcheminQuete['type'], string> = { principale: '✦︎', secondaire: '◆︎', personnelle: '♥︎', faction: '⚑︎' };

const BOUTON = { debut: 'Commencer la quête', fin: 'Poursuivre', echec: 'Poursuivre' } as const;
const NOTE = {
  debut: 'Retrouvez-la dans le Journal, onglet des quêtes en cours.',
  fin: 'Elle est notée dans le Journal, parmi les quêtes accomplies.',
  echec: 'Elle est notée dans le Journal, parmi les quêtes closes.',
} as const;

export function EcranQuete({ quete, imageDonneur, suivantes, onFin }: Props) {
  useEffect(() => {
    const surTouche = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' || ev.key === ' ' || ev.key === 'Enter') {
        ev.preventDefault();
        ev.stopPropagation();
        onFin();
      }
    };
    // En phase de capture : le parchemin prend les touches avant la conversation ou les raccourcis de l'écran dessous.
    window.addEventListener('keydown', surTouche, true);
    return () => window.removeEventListener('keydown', surTouche, true);
  }, [onFin]);

  const fin = quete.genre === 'fin';
  const echec = quete.genre === 'echec';
  return (
    <div className={`ecran-quete ecran-quete-${quete.type} ecran-quete-${quete.genre}`} role="dialog" aria-modal="true" aria-label={`${quete.rubrique} : ${quete.nom}`}>
      <div className="quete-rouleau">
        <div className="quete-baton quete-baton-haut" aria-hidden />
        <div className="quete-feuille">
          <div className="quete-cachet" aria-hidden>
            {fin ? '✓︎' : echec ? '✕︎' : CACHET[quete.type]}
          </div>
          {(fin || echec) && (
            <div className="quete-tampon" aria-hidden>
              {fin ? 'Accomplie' : 'Échouée'}
            </div>
          )}
          <p className="quete-rubrique">{quete.rubrique}</p>
          <h2 className="quete-nom">{quete.nom}</h2>
          <div className="quete-filet" aria-hidden>
            <span>❦</span>
          </div>
          {quete.origine && (
            <div className="quete-donneur">
              {quete.donneur && (imageDonneur ? <img className="quete-portrait" src={imageDonneur} alt="" /> : <Portrait espece="humain" classe="roublard" taille={52} />)}
              <span>
                {fin ? 'Rapportée à' : 'Confiée par'} <strong>{quete.origine}</strong>
              </span>
            </div>
          )}
          <div className="quete-texte">
            {quete.explication.split(/\n{2,}/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          {quete.objectif && (
            <div className="quete-objectif">
              <span className="quete-etiquette">Premier objectif</span>
              <p>{quete.objectif}</p>
            </div>
          )}
          {quete.recompenses.length > 0 && fin && (
            <div className="quete-butin">
              <span className="quete-etiquette">Le groupe reçoit</span>
              <ul>
                {quete.recompenses.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {quete.recompenses.length > 0 && !fin && !echec && (
            <p className="quete-recompenses">
              <span className="quete-etiquette">Récompenses</span> {quete.recompenses.join(' · ')}
            </p>
          )}
          <p className="quete-note">{NOTE[quete.genre]}</p>
        </div>
        <div className="quete-baton quete-baton-bas" aria-hidden />
      </div>
      <button type="button" className="quete-commencer" onClick={onFin} autoFocus>
        {suivantes > 0 ? `Suivante (${suivantes})` : BOUTON[quete.genre]}
      </button>
    </div>
  );
}
