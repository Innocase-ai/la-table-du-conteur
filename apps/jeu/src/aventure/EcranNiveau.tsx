// L'annonce d'une montée de niveau : le parchemin se déroule au centre de l'écran, avec le niveau atteint, chaque héros qui monte
// (portrait, PV avant → après) et, s'il y en a, la mention des choix à revoir (l'écran de montée s'ouvre ensuite). Le moteur a déjà
// tout réglé : l'écran ne fait que raconter. « Continuer », Échap, Espace ou Entrée le ferment.
import { useEffect } from 'react';
import { Portrait } from '../createur/ui';
import type { AnnonceNiveau } from '../niveau-regles';

interface Props {
  annonce: AnnonceNiveau;
  onFin: () => void;
}

export function EcranNiveau({ annonce, onFin }: Props) {
  useEffect(() => {
    const surTouche = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' || ev.key === ' ' || ev.key === 'Enter') {
        ev.preventDefault();
        ev.stopPropagation();
        onFin();
      }
    };
    // En phase de capture : l'annonce prend les touches avant la conversation ou les raccourcis de l'écran dessous.
    window.addEventListener('keydown', surTouche, true);
    return () => window.removeEventListener('keydown', surTouche, true);
  }, [onFin]);

  const avecChoix = annonce.heros.some((h) => h.choix);
  return (
    <div className="ecran-quete ecran-quete-niveau" role="dialog" aria-modal="true" aria-label={`Le groupe atteint le niveau ${annonce.niveau}`}>
      <div className="quete-rouleau">
        <div className="quete-baton quete-baton-haut" aria-hidden />
        <div className="quete-feuille">
          <div className="quete-cachet" aria-hidden>
            ⬆︎
          </div>
          <p className="quete-rubrique">Montée de niveau</p>
          <h2 className="quete-nom">Niveau {annonce.niveau}</h2>
          <div className="quete-filet" aria-hidden>
            <span>❦</span>
          </div>
          <ul className="niveau-heros">
            {annonce.heros.map((h) => (
              <li key={h.id} className="niveau-heros-ligne">
                <Portrait id={h.portrait} espece={h.espece} classe={h.classe} taille={40} />
                <span className="niveau-heros-nom">{h.nom}</span>
                <span className="niveau-heros-pv">
                  PV {h.pvAvant} → <strong>{h.pv}</strong>
                </span>
                {h.choix && <span className="niveau-heros-choix">choix à revoir</span>}
              </li>
            ))}
          </ul>
          <p className="quete-note">
            {avecChoix ? 'De nouveaux choix vous attendent : l’écran suivant les propose, déjà remplis avec les choix conseillés.' : 'Rien à choisir à ce niveau : tout est déjà en place sur les fiches.'}
          </p>
        </div>
        <div className="quete-baton quete-baton-bas" aria-hidden />
      </div>
      <button type="button" className="quete-commencer" onClick={onFin} autoFocus>
        Continuer
      </button>
    </div>
  );
}
