import { useState, type ReactNode } from 'react';
import { TAILLE_GROUPE } from '@crpg/regles';
import { SYMBOLES_ETATS } from '../libelles';
import { NOM_JEU } from '../jeu';

interface Section {
  id: string;
  titre: string;
  contenu: ReactNode;
}

const SECTIONS: Section[] = [
  {
    id: 'principe',
    titre: 'Le principe',
    contenu: (
      <>
        <p>
          {NOM_JEU} est un jeu de rôle : vous menez un groupe de {TAILLE_GROUPE} aventuriers dans une histoire racontée par <strong>le conteur</strong>, un
          maître de jeu animé par une IA. Il décrit les lieux, fait parler les personnages et réagit à vos choix.
        </p>
        <p>
          <strong>Le conteur propose, le moteur décide.</strong> Les jets de dés, les combats, les trésors et les conséquences suivent les règles du SRD 5.2.1
          (la cinquième édition du jeu de rôle le plus joué), appliquées par le moteur du jeu. Le conteur ne peut pas tricher.
        </p>
        <ol>
          <li>Créez votre groupe dans « Mon groupe ».</li>
          <li>Choisissez une histoire : chacune est un monde complet, avec ses lieux, ses personnages, ses quêtes et plusieurs fins.</li>
          <li>Explorez, parlez, combattez : vos décisions changent le monde et la fin de l'histoire.</li>
        </ol>
        <p className="aide-note">Prototype : la création du groupe et le combat sont jouables ; le conteur arrive à l'étape suivante.</p>
      </>
    ),
  },
  {
    id: 'groupe',
    titre: 'Créer son groupe',
    contenu: (
      <>
        <p>Un groupe compte {TAILLE_GROUPE} personnages, tous du même niveau. Le créateur vous guide étape par étape :</p>
        <ol>
          <li>
            <strong>Espèce</strong> (humain, elfe, nain, halfelin, gnome, orc, tieffelin, goliath, drakéide) et <strong>classe</strong> (guerrier, magicien,
            clerc…).
          </li>
          <li>
            <strong>Historique</strong> : ce que faisait le personnage avant l'aventure ; il donne des compétences et des bonus de caractéristiques.
          </li>
          <li>
            <strong>Caractéristiques</strong> : valeurs standard, achat de points ou tirage aux dés.
          </li>
          <li>
            <strong>Compétences, équipement, sorts</strong>, puis <strong>nom, portrait et alignement</strong>.
          </li>
        </ol>
        <p>
          Le <strong>portrait</strong> choisi dans la galerie représente votre personnage partout : en combat et dans les illustrations de l'histoire. « Groupe
          conseillé » crée en un clic un groupe équilibré, à modifier ensuite.
        </p>
        <p>Un bon groupe mêle des combattants au contact, des tireurs, un soigneur et un lanceur de sorts.</p>
      </>
    ),
  },
  {
    id: 'combat',
    titre: 'Le combat',
    contenu: (
      <>
        <p>
          Le combat se joue sur une grille de cases de <strong>1,5 m</strong>, au tour par tour, dans l'ordre d'<strong>initiative</strong> (affiché en haut
          de l'écran).
        </p>
        <h3>Votre tour</h3>
        <ul>
          <li>
            <strong>Mouvement</strong> : jusqu'à votre Vitesse (9 m = 6 cases), avant et après votre action. Une diagonale coûte une case ; le terrain difficile
            coûte double. Cliquez une case en surbrillance pour vous y rendre.
          </li>
          <li>
            <strong>Action</strong> : attaquer, lancer un sort, foncer (mouvement doublé), se désengager, esquiver, boire une potion…
          </li>
          <li>
            <strong>Action bonus</strong> : certaines aptitudes et certains sorts (Second souffle, Rage, Action rusée…).
          </li>
          <li>
            <strong>Réaction</strong> : une par round, jouée automatiquement (attaque d'opportunité, sort de Bouclier).
          </li>
        </ul>
        <h3>Règles utiles</h3>
        <ul>
          <li>
            <strong>Attaque d'opportunité</strong> : quitter le contact d'un ennemi sans se désengager lui offre une attaque gratuite.
          </li>
          <li>
            <strong>Ligne de vue</strong> : les murs bloquent les attaques à distance et les sorts.
          </li>
          <li>
            <strong>Tir à distance</strong> : désavantage au-delà de la portée normale, ou si un ennemi est à votre contact.
          </li>
          <li>
            <strong>Critique</strong> : un 20 naturel touche toujours et double les dés de dégâts.
          </li>
        </ul>
        <p>
          Les monstres sont menés par une IA tactique qui ne triche pas : elle ignore vos PV exacts et peut fuir quand son chef tombe. Survolez un jeton pour
          voir sa fiche et son illustration en bas à gauche.
        </p>
      </>
    ),
  },
  {
    id: 'cartes',
    titre: 'Les cartes',
    contenu: (
      <>
        <p>Chaque option de votre personnage est une carte, rangée dans la colonne de droite. Sa couleur indique son coût :</p>
        <ul className="aide-couts">
          <li>
            <span className="cout cout-action">Action</span> utilise votre action du tour.
          </li>
          <li>
            <span className="cout cout-bonus">Bonus</span> utilise votre action bonus.
          </li>
          <li>
            <span className="cout cout-reaction">Réaction</span> utilise votre réaction.
          </li>
          <li>
            <span className="cout cout-elan">Élan</span> est gratuite.
          </li>
        </ul>
        <p>
          Jouez une carte, puis choisissez sa cible sur le plateau (ou un point, pour un sort de zone). Une carte grisée n'est pas jouable : survolez-la pour
          savoir pourquoi.
        </p>
        <h3>Le deck d'élan</h3>
        <p>
          Option des escarmouches. Chaque héros a un petit paquet de cartes tiré de sa classe : il en pioche <strong>deux</strong> au début de son tour et peut
          en jouer <strong>une</strong> gratuitement (Garde haute, Pas de côté, Coup appuyé…). Les autres sont défaussées.
        </p>
      </>
    ),
  },
  {
    id: 'etats',
    titre: 'États, blessures et mort',
    contenu: (
      <>
        <p>Les badges sur un jeton signalent ses états :</p>
        <ul className="aide-etats">
          <li>
            <span className="badge">{SYMBOLES_ETATS['a-terre']}</span> À terre : se relever coûte la moitié du mouvement ; les attaques au contact contre lui
            ont l'avantage.
          </li>
          <li>
            <span className="badge">{SYMBOLES_ETATS.inconscient}</span> Inconscient : hors de combat, à la merci des ennemis.
          </li>
          <li>
            <span className="badge">{SYMBOLES_ETATS.entrave}</span> Entravé, <span className="badge">{SYMBOLES_ETATS.empoigne}</span> empoigné : ne peut plus se
            déplacer.
          </li>
          <li>
            <span className="badge">{SYMBOLES_ETATS.effraye}</span> Effrayé, <span className="badge">{SYMBOLES_ETATS.paralyse}</span> paralysé,{' '}
            <span className="badge">{SYMBOLES_ETATS.neutralise}</span> neutralisé…
          </li>
          <li>
            <span className="badge b-conc">◎</span> Concentration : le personnage maintient un sort ; une blessure peut la rompre.
          </li>
          <li>
            <span className="badge b-rage">♨</span> Rage du barbare.
          </li>
        </ul>
        <p>
          Un héros à <strong>0 PV</strong> tombe inconscient et fait des <strong>jets contre la mort</strong> à chacun de ses tours : trois réussites, il se
          stabilise ; trois échecs, il meurt. Un soin le relève aussitôt. Les monstres à 0 PV meurent.
        </p>
      </>
    ),
  },
  {
    id: 'raccourcis',
    titre: 'Commandes',
    contenu: (
      <ul className="aide-touches">
        <li>
          <kbd>Clic</kbd> sur une case en surbrillance : se déplacer.
        </li>
        <li>
          <kbd>Clic</kbd> sur une carte, puis sur une cible : jouer la carte.
        </li>
        <li>
          <kbd>Échap</kbd> : annuler la carte choisie, fermer une fenêtre.
        </li>
        <li>
          <kbd>Entrée</kbd> : valider une carte à plusieurs cibles.
        </li>
        <li>
          <kbd>Ctrl</kbd> + <kbd>molette</kbd>, ou les boutons − ⤢ + : zoomer sur le plateau (⤢ remet tout le plateau à l'écran).
        </li>
        <li>
          <kbd>Survol</kbd> d'un jeton ou de la barre d'initiative : fiche et illustration du combattant.
        </li>
        <li>« Tour auto » fait jouer l'IA à votre place pour ce tour ; « Héros auto » pour tout le combat ; « Rapide » accélère les animations.</li>
      </ul>
    ),
  },
  {
    id: 'glossaire',
    titre: 'Glossaire',
    contenu: (
      <dl className="aide-glossaire">
        <dt>PV</dt>
        <dd>Points de vie. À 0, un héros tombe inconscient.</dd>
        <dt>CA</dt>
        <dd>Classe d'armure : le score qu'une attaque doit atteindre pour toucher.</dd>
        <dt>DD</dt>
        <dd>Degré de difficulté d'un jet (sauvegarde contre un sort, test de compétence).</dd>
        <dt>Jet de sauvegarde</dt>
        <dd>Jet de d20 pour résister à un effet (Force, Dextérité, Constitution, Intelligence, Sagesse, Charisme).</dd>
        <dt>Avantage / désavantage</dt>
        <dd>On lance deux d20 et on garde le meilleur (avantage) ou le moins bon (désavantage).</dd>
        <dt>Emplacement de sort</dt>
        <dd>Ressource dépensée pour lancer un sort de niveau 1 ou plus ; les sorts mineurs n'en coûtent pas.</dd>
        <dt>Botte d'arme</dt>
        <dd>Effet propre à une arme maîtrisée (Sape, Ouverture, Renversement, Ralentissement…), appliqué quand elle touche.</dd>
        <dt>PX</dt>
        <dd>Points d'expérience : ils mesurent la difficulté d'une rencontre et font monter le groupe de niveau.</dd>
      </dl>
    ),
  },
];

/** Aide au jeu : principe, création du groupe, combat, cartes, états, commandes, glossaire. */
export function EcranAide({ onRetour }: { onRetour: () => void }) {
  const [active, setActive] = useState(SECTIONS[0]!.id);
  const section = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0]!;
  return (
    <div className="aide">
      <header className="ecran-entete">
        <button type="button" className="bouton-discret" onClick={onRetour}>
          ‹ Menu
        </button>
        <h1>Aide au jeu</h1>
      </header>
      <div className="aide-corps">
        <nav className="aide-sommaire" aria-label="Sommaire de l'aide">
          {SECTIONS.map((s) => (
            <button key={s.id} type="button" className={s.id === active ? 'actif' : ''} aria-current={s.id === active} onClick={() => setActive(s.id)}>
              {s.titre}
            </button>
          ))}
        </nav>
        <article className="aide-texte">
          <h2>{section.titre}</h2>
          {section.contenu}
        </article>
      </div>
    </div>
  );
}
