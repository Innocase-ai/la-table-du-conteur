import type { Carte } from '@crpg/regles';
import { formatMetres, LIBELLES_COUT, ORDRE_CATEGORIES } from '../libelles';
import { cleDeCarte } from '../pictogrammes-regles';
import { Pictogramme } from './Pictogramme';

interface Props {
  cartes: Carte[];
  selection?: string;
  inactive: boolean;
  onJouer: (k: Carte) => void;
  /** L'école de magie d'un sort (pour l'icône d'un sort sans dessin propre). */
  ecoleDe?: (idSort: string) => string | undefined;
}

const LIBELLES_FORMES: Record<string, string> = {
  cone: 'cône',
  sphere: 'sphère',
  cube: 'cube',
  ligne: 'ligne',
  cylindre: 'cylindre',
  emanation: 'émanation',
};

function CarteJeu({ k, choisie, inactive, onJouer, ecoleDe }: { k: Carte; choisie: boolean; inactive: boolean; onJouer: () => void; ecoleDe?: Props['ecoleDe'] }) {
  const jouable = k.jouable && !inactive;
  const icone = cleDeCarte(k, k.categorie === 'sort' ? ecoleDe?.(k.id.slice('sort:'.length)) : undefined);
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
        <span className={`cout cout-${k.cout}`}>
          <Pictogramme cle={`cout:${k.cout}`} taille={10} surFond />
          {k.cout === 'bonus' ? 'Bonus' : LIBELLES_COUT[k.cout]}
        </span>
        <span className="carte-symbole">
          <Pictogramme cle={icone.cle} lancer={icone.lancer} taille={27} medaillon />
        </span>
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

export function MainCartes({ cartes, selection, inactive, onJouer, ecoleDe }: Props) {
  const triees = [...cartes].sort((a, b) => ORDRE_CATEGORIES.indexOf(a.categorie) - ORDRE_CATEGORIES.indexOf(b.categorie));
  if (!triees.length) return <div className="main-vide">Aucune carte</div>;
  return (
    <div className="main">
      {triees.map((k, i) => (
        <div key={k.id} className={`main-emplacement ${i > 0 && triees[i - 1]!.categorie !== k.categorie ? 'separateur' : ''}`}>
          <CarteJeu k={k} choisie={k.id === selection} inactive={inactive} onJouer={() => onJouer(k)} ecoleDe={ecoleDe} />
        </div>
      ))}
    </div>
  );
}
