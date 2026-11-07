import { jouerSon, regler, useReglagesSon } from '../sons';
import { reglerMusique, suivant, usePisteEnCours, useReglagesMusique } from '../musique';
import { LIBELLES_FOND, type MusiqueFond } from '../musique-regles';

/**
 * Sourdine et volume des bruitages (🔊), puis de la musique d'ambiance (♪) : deux canaux séparés, mémorisés dans le
 * navigateur. La musique est un fond sonore : elle reste sous les bruitages, qu'elle ne couvre jamais.
 */
export function ControleSon() {
  const son = useReglagesSon();
  const musique = useReglagesMusique();
  const piste = usePisteEnCours();
  // Pendant une histoire, un bouton passe au fond suivant (l'ordre est aléatoire, sans répétition).
  const fond = piste?.startsWith('fond-') ? (piste as MusiqueFond) : undefined;
  return (
    <span className="controle-son">
      <button
        type="button"
        className={`bouton-discret ${son.actif ? 'actif' : ''}`}
        aria-pressed={son.actif}
        onClick={() => regler({ actif: !son.actif })}
        title={son.actif ? 'Couper les bruitages' : 'Activer les bruitages'}
      >
        {son.actif ? '🔊' : '🔇'}
      </button>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(son.volume * 100)}
        disabled={!son.actif}
        aria-label="Volume des bruitages"
        title={`Bruitages : ${Math.round(son.volume * 100)} %`}
        onChange={(e) => regler({ volume: Number(e.target.value) / 100 })}
        // Un coup d'épée à la fin du réglage, pour juger le volume à l'oreille.
        onPointerUp={() => jouerSon('epee')}
        onKeyUp={() => jouerSon('epee')}
      />
      <button
        type="button"
        className={`bouton-discret ${musique.actif ? 'actif' : ''}`}
        aria-pressed={musique.actif}
        onClick={() => reglerMusique({ actif: !musique.actif })}
        title={musique.actif ? 'Couper la musique' : 'Activer la musique'}
      >
        {musique.actif ? '♪' : '♪̸'}
      </button>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(musique.volume * 100)}
        disabled={!musique.actif}
        aria-label="Volume de la musique"
        title={`Musique : ${Math.round(musique.volume * 100)} %`}
        onChange={(e) => reglerMusique({ volume: Number(e.target.value) / 100 })}
      />
      {fond && (
        <button type="button" className="bouton-discret" onClick={() => void suivant()} title={`Musique suivante (en cours : ${LIBELLES_FOND[fond]})`} aria-label="Musique suivante">
          ⏭
        </button>
      )}
    </span>
  );
}
