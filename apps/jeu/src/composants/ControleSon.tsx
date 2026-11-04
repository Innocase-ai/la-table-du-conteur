import { jouerSon, regler, useReglagesSon } from '../sons';

/** Bouton de sourdine et curseur de volume des bruitages ; le réglage est mémorisé dans le navigateur. */
export function ControleSon() {
  const r = useReglagesSon();
  return (
    <span className="controle-son">
      <button
        type="button"
        className={`bouton-discret ${r.actif ? 'actif' : ''}`}
        aria-pressed={r.actif}
        onClick={() => regler({ actif: !r.actif })}
        title={r.actif ? 'Couper les bruitages' : 'Activer les bruitages'}
      >
        {r.actif ? '🔊' : '🔇'}
      </button>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(r.volume * 100)}
        disabled={!r.actif}
        aria-label="Volume des bruitages"
        title={`Volume : ${Math.round(r.volume * 100)} %`}
        onChange={(e) => regler({ volume: Number(e.target.value) / 100 })}
        // Un coup d'épée à la fin du réglage, pour juger le volume à l'oreille.
        onPointerUp={() => jouerSon('epee')}
        onKeyUp={() => jouerSon('epee')}
      />
    </span>
  );
}
