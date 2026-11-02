import type { Carte } from '@crpg/regles';
import { formatMetres, LIBELLES_COUT, ORDRE_CATEGORIES, SYMBOLES_CATEGORIES } from '../libelles';

interface Props {
  cartes: Carte[];
  selection?: string;
  inactive: boolean;
  onJouer: (k: Carte) => void;
}

const LIBELLES_FORMES: Record<string, string> = {
  cone: 'cône',
  sphere: 'sphère',
  cube: 'cube',
  ligne: 'ligne',
  cylindre: 'cylindre',
  emanation: 'émanation',
};

function CarteJeu({ k, choisie, inactive, onJouer }: { k: Carte; choisie: boolean; inactive: boolean; onJouer: () => void }) {
  const jouable = k.jouable && !inactive;
  const titre = k.jouable ? k.description : `${k.raison ?? 'Injouable.'}\n\n${k.description}`;
  return (
    <button
      type="button"
      className={`carte cat-${k.categorie} cout-${k.cout} ${jouable ? '' : 'injouable'} ${choisie ? 'choisie' : ''}`}
      title={titre}
      aria-label={`${k.nom} (${LIBELLES_COUT[k.cout]})${k.jouable ? '' : ' — injouable'}`}
      onClick={() => jouable && onJouer()}
      aria-disabled={!jouable}
    >
      <div className="carte-haut">
        <span className={`cout cout-${k.cout}`}>{LIBELLES_COUT[k.cout]}</span>
        <span className="carte-symbole">{SYMBOLES_CATEGORIES[k.categorie]}</span>
      </div>
      <div className="carte-nom">{k.nom}</div>
      <div className="carte-description">{k.description}</div>
      <div className="carte-pied">
        {k.ressource && <span className="carte-ressource">{k.ressource}</span>}
        <span className="carte-portee">
          {k.zone ? `${LIBELLES_FORMES[k.zone.forme] ?? k.zone.forme} ${formatMetres(k.zone.taille)}` : k.portee ? formatMetres(k.portee) : ''}
          {k.nbCibles > 1 ? ` · ${k.nbCibles} cibles` : ''}
        </span>
      </div>
      {!k.jouable && k.raison && <div className="carte-raison">{k.raison}</div>}
    </button>
  );
}

export function MainCartes({ cartes, selection, inactive, onJouer }: Props) {
  const triees = [...cartes].sort((a, b) => ORDRE_CATEGORIES.indexOf(a.categorie) - ORDRE_CATEGORIES.indexOf(b.categorie));
  if (!triees.length) return <div className="main-vide">Aucune carte</div>;
  return (
    <div className="main">
      {triees.map((k, i) => (
        <div key={k.id} className={`main-emplacement ${i > 0 && triees[i - 1]!.categorie !== k.categorie ? 'separateur' : ''}`}>
          <CarteJeu k={k} choisie={k.id === selection} inactive={inactive} onJouer={() => onJouer(k)} />
        </div>
      ))}
    </div>
  );
}
