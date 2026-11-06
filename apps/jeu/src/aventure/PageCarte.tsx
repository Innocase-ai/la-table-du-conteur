// La carte du monde en plein écran (touche M) : la carte à gauche, le volet du lieu choisi sous elle, les héros en bas.
import type { CarteMonde as DonneesCarte, Ordre, Personnage } from '@crpg/regles';
import { CarteMonde } from './CarteMonde';
import { BandeauHeros } from './fiches';

interface Props {
  monde: string;
  carte: DonneesCarte;
  groupe: Personnage[];
  jouer: (o: Ordre) => void;
  onFermer: () => void;
}

export function PageCarte({ monde, carte, groupe, jouer, onFermer }: Props) {
  return (
    <div className="page-pleine page-carte" role="dialog" aria-label="Carte du monde">
      <header className="page-pleine-haut">
        <h2>Carte du monde</h2>
        <div className="page-pleine-resume">
          <span>
            Vous êtes à <strong>{carte.lieu.nom}</strong>
          </span>
        </div>
        <button type="button" className="bouton-discret" onClick={onFermer} autoFocus>
          Fermer ✕ <small>(Échap)</small>
        </button>
      </header>
      <div className="page-carte-corps">
        <CarteMonde monde={monde} carte={carte} jouer={jouer} grande />
      </div>
      <footer className="page-pleine-groupe">
        <BandeauHeros groupe={groupe} />
      </footer>
    </div>
  );
}
