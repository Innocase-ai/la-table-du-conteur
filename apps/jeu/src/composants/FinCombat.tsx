import type { EtatCombat } from '@crpg/regles';

interface Props {
  etat: EtatCombat;
  onRejouer: () => void;
  onRetour: () => void;
  onVoir: () => void;
  /** Combat d'une histoire : un seul bouton, retour au récit. */
  onContinuer?: () => void;
}

export function FinCombat({ etat, onRejouer, onRetour, onVoir, onContinuer }: Props) {
  const victoire = etat.vainqueur === 'heros';
  const heros = etat.combattants.filter((c) => c.camp === 'heros');
  const monstres = etat.combattants.filter((c) => c.camp === 'monstres');
  const tombes = heros.filter((c) => c.mort || c.pv <= 0);
  const pvRestants = heros.reduce((s, c) => s + Math.max(0, c.pv), 0);
  const pvMax = heros.reduce((s, c) => s + c.pvMax, 0);
  return (
    <div className="fin-fond">
      <div className={`fin ${victoire ? 'fin-victoire' : 'fin-defaite'}`}>
        <div className="ornement">{victoire ? '✦' : '✝'}</div>
        <h1>{victoire ? 'Victoire' : 'Défaite'}</h1>
        <p className="fin-sous-titre">{victoire ? 'Les héros restent maîtres du terrain.' : 'La compagnie a été vaincue…'}</p>
        <dl className="fin-resume">
          <div>
            <dt>Rounds</dt>
            <dd>{etat.round}</dd>
          </div>
          <div>
            <dt>PV des héros</dt>
            <dd>
              {pvRestants} / {pvMax}
            </dd>
          </div>
          <div>
            <dt>Ennemis vaincus</dt>
            <dd>
              {monstres.filter((m) => m.mort).length} / {monstres.length}
              {monstres.some((m) => m.enFuite) && ` (${monstres.filter((m) => m.enFuite).length} en fuite)`}
            </dd>
          </div>
          <div>
            <dt>Héros tombés</dt>
            <dd>{tombes.length ? tombes.map((c) => `${c.nom}${c.mort ? ' (mort)' : ''}`).join(', ') : 'aucun'}</dd>
          </div>
        </dl>
        <div className="fin-boutons">
          {onContinuer ? (
            <button type="button" className="bouton-principal" onClick={onContinuer}>
              Reprendre le récit
            </button>
          ) : (
            <>
              <button type="button" className="bouton-principal" onClick={onRejouer}>
                Rejouer
              </button>
              <button type="button" className="bouton" onClick={onRetour}>
                Retour
              </button>
            </>
          )}
          <button type="button" className="bouton-discret" onClick={onVoir}>
            Voir le plateau
          </button>
        </div>
      </div>
    </div>
  );
}
