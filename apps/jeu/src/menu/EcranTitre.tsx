import { useState, type KeyboardEvent } from 'react';
import { bilanPersonnage, personnageComplet, TAILLE_GROUPE, type Donnees, type Groupe } from '@crpg/regles';
import { Credits } from '../composants/Credits';
import { NOM_JEU, SOUS_TITRE_JEU } from '../jeu';
import { histoires } from '../mondes';
import { imageInterface } from '../visuels';

interface Props {
  donnees: Donnees;
  groupe: Groupe;
  onHistoires: () => void;
  onGroupe: () => void;
  onEscarmouche: () => void;
  onAide: () => void;
  /** Aventure en cours (dans cette session), à reprendre. */
  enCours?: { nom: string; onReprendre: () => void };
}

/** Taille de l'illustration de l'écran titre (pixels) : les zones ci-dessous sont dans ce repère. */
const LARGEUR_IMAGE = 1248;
const HAUTEUR_IMAGE = 832;

/** Objets de la table qu'on peut cliquer : chacun ouvre une entrée du menu. */
interface Zone {
  id: string;
  objet: string;
  points: [number, number][];
  /** Où afficher le nom de l'objet au survol. */
  etiquette: [number, number];
}

const ZONES: Zone[] = [
  { id: 'histoires', objet: 'Le livre des histoires', etiquette: [640, 300], points: [[272, 380], [560, 300], [770, 262], [1000, 455], [700, 548], [420, 618]] },
  { id: 'groupe', objet: 'La plume : écrire ses héros', etiquette: [800, 560], points: [[612, 818], [880, 572], [912, 585], [960, 640], [958, 790], [820, 792], [652, 822]] },
  {
    id: 'escarmouche',
    objet: 'Les dés : une escarmouche',
    etiquette: [1010, 290],
    points: [[930, 300], [995, 300], [1080, 420], [1142, 438], [1142, 482], [1068, 500], [1072, 600], [1015, 682], [955, 668], [932, 545], [1000, 470], [940, 362]],
  },
  { id: 'aide', objet: "La lanterne : l'aide au jeu", etiquette: [1080, 350], points: [[998, 18], [1162, 18], [1168, 326], [994, 326]] },
  { id: 'credits', objet: 'Les parchemins : crédits', etiquette: [905, 118], points: [[800, 150], [1000, 125], [1012, 242], [812, 200]] },
];

/** Écran d'arrivée du joueur : l'histoire à vivre, le groupe à créer, l'entraînement au combat, l'aide. */
export function EcranTitre({ donnees, groupe, onHistoires, onGroupe, onEscarmouche, onAide, enCours }: Props) {
  const [credits, setCredits] = useState(false);
  const complets = groupe.emplacements.filter((p) => p && personnageComplet(bilanPersonnage(p, donnees))).length;
  const nbHistoires = histoires().length;
  const fond = imageInterface('ecran-titre');

  const entrees = [
    ...(enCours ? [{ titre: "Reprendre l'aventure", detail: enCours.nom, action: enCours.onReprendre, principale: true }] : []),
    {
      titre: 'Choisir une histoire',
      detail: `${nbHistoires} histoire${nbHistoires > 1 ? 's' : ''} disponible${nbHistoires > 1 ? 's' : ''}`,
      action: onHistoires,
      principale: !enCours,
    },
    {
      titre: 'Mon groupe',
      detail: complets ? `${complets} personnage${complets > 1 ? 's' : ''} prêt${complets > 1 ? 's' : ''} (jusqu'à ${TAILLE_GROUPE})` : `Créer de 1 à ${TAILLE_GROUPE} aventuriers`,
      action: onGroupe,
    },
    { titre: 'Escarmouche', detail: "Un combat d'entraînement, sans histoire", action: onEscarmouche },
    { titre: 'Aide au jeu', detail: 'Règles, combat, cartes, raccourcis', action: onAide },
  ];

  const actions: Record<string, () => void> = { histoires: onHistoires, groupe: onGroupe, escarmouche: onEscarmouche, aide: onAide, credits: () => setCredits(true) };
  const clavier = (e: KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="titre">
      {fond && (
        // L'illustration et ses objets cliquables partagent le même repère : « xMaxYMid slice » cale l'image à droite
        // et la recadre comme un fond « cover », quelle que soit la taille de l'écran.
        <svg className="titre-scene" viewBox={`0 0 ${LARGEUR_IMAGE} ${HAUTEUR_IMAGE}`} preserveAspectRatio="xMaxYMid slice" aria-label="La table du conteur">
          <image href={fond} width={LARGEUR_IMAGE} height={HAUTEUR_IMAGE} />
          {ZONES.map((z) => (
            <g
              key={z.id}
              className="titre-zone"
              role="button"
              tabIndex={0}
              aria-label={z.objet}
              onClick={actions[z.id]}
              onKeyDown={(e) => clavier(e, actions[z.id]!)}
            >
              <polygon points={z.points.map((p) => p.join(',')).join(' ')} />
              <text x={z.etiquette[0]} y={z.etiquette[1]}>
                {z.objet}
              </text>
            </g>
          ))}
        </svg>
      )}
      <div className="titre-voile" />
      <main className="titre-contenu">
        <header className="titre-entete">
          <div className="ornement">✦</div>
          <h1>{NOM_JEU}</h1>
          <p className="sous-titre">{SOUS_TITRE_JEU}</p>
        </header>
        <nav className="titre-menu" aria-label="Menu principal">
          {entrees.map((e) => (
            <button key={e.titre} type="button" className={`titre-entree ${e.principale ? 'titre-entree-principale' : ''}`} onClick={e.action}>
              <span className="titre-entree-nom">{e.titre}</span>
              <span className="titre-entree-detail">{e.detail}</span>
            </button>
          ))}
        </nav>
        <footer className="titre-pied">
          <button type="button" className="lien-credits" onClick={() => setCredits(true)}>
            Crédits
          </button>
          <span>Les objets de la table s'ouvrent aussi d'un clic. Prototype : le conteur (maître de jeu) n'est pas encore branché.</span>
        </footer>
      </main>
      {credits && <Credits onFermer={() => setCredits(false)} />}
    </div>
  );
}
