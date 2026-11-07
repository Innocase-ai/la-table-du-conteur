import { useState, type ReactNode } from 'react';
import { TAILLE_GROUPE } from '@crpg/regles';
import { SYMBOLES_ETATS } from '../libelles';
import { NOM_JEU } from '../jeu';
import { IconeClasse } from '../createur/ui';
import { Pictogramme } from '../composants/Pictogramme';
import { COULEURS_FAMILLES, FAMILLES, LIBELLES_FAMILLES, type Famille } from '../effets-visuels';
import contenuAide from '../aide/contenu.json';

interface Section {
  id: string;
  titre: string;
  contenu: ReactNode;
}

/** Captures d'écran de l'aide (dossier `aide/`), par nom de fichier sans extension. */
const IMAGES_AIDE = new Map(
  Object.entries(import.meta.glob<string>('../aide/*.{png,jpg,webp}', { eager: true, query: '?url', import: 'default' })).map(([chemin, url]) => [
    chemin.replace(/^.*\/(.+)\.[a-z]+$/, '$1'),
    url,
  ]),
);

/** Une capture d'écran légendée. */
function Capture({ nom, alt, legende }: { nom: string; alt: string; legende: ReactNode }) {
  const url = IMAGES_AIDE.get(nom);
  return (
    <figure className="aide-capture">
      {url && <img src={url} alt={alt} loading="lazy" />}
      <figcaption>{legende}</figcaption>
    </figure>
  );
}

/** Un texte avec du **gras** (marqué par deux astérisques). */
function Gras({ texte }: { texte: string }) {
  return (
    <>
      {texte.split('**').map((morceau, i) => (i % 2 === 1 ? <strong key={i}>{morceau}</strong> : morceau))}
    </>
  );
}

/** Un bloc de contenu de l'aide, écrit en données (`aide/contenu.json`) : paragraphe, sous-titre, listes, remarque, capture(s). */
type Bloc =
  | { t: 'p' | 'h3' | 'note'; texte: string }
  | { t: 'ul' | 'ol'; items: string[] }
  | { t: 'capture'; nom: string; alt: string; legende: string }
  | { t: 'captures'; liste: { nom: string; alt: string; legende: string }[] };

function Blocs({ blocs }: { blocs: Bloc[] }) {
  return (
    <>
      {blocs.map((b, i) => {
        switch (b.t) {
          case 'p':
            return (
              <p key={i}>
                <Gras texte={b.texte} />
              </p>
            );
          case 'h3':
            return <h3 key={i}>{b.texte}</h3>;
          case 'note':
            return (
              <p key={i} className="aide-note">
                <Gras texte={b.texte} />
              </p>
            );
          case 'ul':
            return (
              <ul key={i}>
                {b.items.map((x, k) => (
                  <li key={k}>
                    <Gras texte={x} />
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={i}>
                {b.items.map((x, k) => (
                  <li key={k}>
                    <Gras texte={x} />
                  </li>
                ))}
              </ol>
            );
          case 'capture':
            return <Capture key={i} nom={b.nom} alt={b.alt} legende={b.legende} />;
          case 'captures':
            return (
              <div key={i} className="aide-captures">
                {b.liste.map((c) => (
                  <Capture key={c.nom} nom={c.nom} alt={c.alt} legende={c.legende} />
                ))}
              </div>
            );
        }
      })}
    </>
  );
}

/** Les sections écrites en données (`aide/contenu.json`), par identifiant. */
const SECTIONS_DONNEES = new Map((contenuAide.sections as { id: string; titre: string; blocs: Bloc[] }[]).map((s) => [s.id, s]));

/** Une section dont le contenu vient de `aide/contenu.json`. */
function sectionDonnees(id: string): Section {
  const s = SECTIONS_DONNEES.get(id);
  if (!s) throw new Error(`Aide : section « ${id} » absente de contenu.json`);
  return { id: s.id, titre: s.titre, contenu: <Blocs blocs={s.blocs} /> };
}

/** Les classes jouables : identifiant, nom et rôle en une phrase. */
const CLASSES_AIDE: { id: string; nom: string; role: string }[] = [
  { id: 'guerrier', nom: 'Guerrier', role: 'Combattant robuste, maître des armes et des armures ; il se ressaisit en plein combat.' },
  { id: 'barbare', nom: 'Barbare', role: 'Entre en rage : il frappe fort et encaisse la moitié des dégâts physiques.' },
  { id: 'roublard', nom: 'Roublard', role: 'Agile et rusé ; son attaque sournoise fait très mal quand il a l’avantage.' },
  { id: 'rodeur', nom: 'Rôdeur', role: 'Tireur et pisteur ; il marque sa proie pour la frapper plus sûrement.' },
  { id: 'clerc', nom: 'Clerc', role: 'Soigneur et lanceur de sorts divins ; il protège et soutient le groupe.' },
  { id: 'magicien', nom: 'Magicien', role: 'Lanceur de sorts offensifs, fragile au contact.' },
  { id: 'paladin', nom: 'Paladin', role: 'Guerrier sacré, entre combat au contact et magie de protection.' },
  { id: 'ensorceleur', nom: 'Ensorceleur', role: 'Magie innée, sorts puissants tirés de son sang.' },
  { id: 'occultiste', nom: 'Occultiste', role: 'Lié par un pacte à une entité ; ses sorts reviennent vite.' },
  { id: 'druide', nom: 'Druide', role: 'Magie de la nature et soins, appuyés sur les forces vives.' },
  { id: 'moine', nom: 'Moine', role: 'Combat à mains nues, vif et mobile.' },
  { id: 'barde', nom: 'Barde', role: 'Soutien par la musique et la parole, avec une magie variée.' },
];

/** Ce que l'on voit à l'impact de chaque famille de dégâts. */
const IMPACTS_AIDE: Record<Famille, string> = {
  tranchant: 'un arc de lame blanc et des étincelles',
  perforant: 'un estoc rapide et quelques étincelles',
  contondant: 'une onde de choc et de la poussière',
  feu: 'une boule de feu dont les braises montent',
  froid: 'des éclats de glace qui jaillissent',
  foudre: 'un éclair qui crépite',
  acide: 'des bulles vertes qui montent et éclatent',
  poison: 'des bulles vertes plus sombres',
  necrotique: 'une brume sombre aux volutes vertes',
  radiant: 'un éclair blanc doré et des rayons',
  force: 'tout converge vers la cible dans une onde violette',
  psychique: 'des ondes roses concentriques',
  tonnerre: 'une onde de choc épaisse qui secoue le plateau',
};

const SECTIONS_ECRITES: Section[] = [
  {
    id: 'principe',
    titre: 'Le principe',
    contenu: (
      <>
        <p>
          {NOM_JEU} est un jeu de rôle : vous menez un groupe de 1 à {TAILLE_GROUPE} aventuriers (au choix) dans une histoire racontée par <strong>le conteur</strong>, un
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
        <p className="aide-note">Le jeu est un prototype jouable, en cours de développement. Le mode « livre » (boutons et textes des auteurs) est complet ; le conteur IA est encore à l'essai (voir « Le conteur et le mode livre »).</p>
      </>
    ),
  },
  {
    id: 'groupe',
    titre: 'Créer son groupe',
    contenu: (
      <>
        <p>Un groupe a 4 ou 6 emplacements (au choix, en haut de l'écran Mon groupe) et compte de 1 à {TAILLE_GROUPE} personnages, tous du même niveau ; on peut laisser des emplacements vides. Les combats des histoires s'adaptent au nombre de héros, et chaque histoire annonce la taille de groupe pour laquelle elle est écrite. Le créateur vous guide étape par étape :</p>
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
    id: 'classes',
    titre: 'Les classes et leurs icônes',
    contenu: (
      <>
        <p>
          Chaque classe a <strong>son icône</strong>. Vous la retrouvez à deux endroits : sur le <strong>jeton</strong> de votre héros, sur le plateau, et en{' '}
          <strong>médaillon</strong> en bas à droite de son portrait, dans la fiche du combattant. Un coup d’œil suffit alors pour reconnaître qui est le guerrier,
          qui est le soigneur, et qui doit rester à l’arrière.
        </p>
        <Capture
          nom="classes"
          alt="Les douze classes : portrait avec médaillon de classe et jeton"
          legende="Les douze classes. Au-dessus : le portrait du héros avec son médaillon de classe ; en dessous : son jeton sur le plateau."
        />
        <ul className="aide-classes">
          {CLASSES_AIDE.map((k) => (
            <li key={k.id}>
              <IconeClasse classe={k.id} taille={34} />
              <span>
                <strong>{k.nom}</strong> : {k.role}
              </span>
            </li>
          ))}
        </ul>
        <Capture
          nom="plateau"
          alt="Le plateau de combat : jetons des héros avec l’icône de leur classe, jetons rouges des monstres"
          legende="Sur le plateau, les héros (jetons bleus) portent l’icône de leur classe ; les monstres (jetons rouges) portent leur propre pictogramme. Les cases dorées montrent où le héros actif peut aller."
        />
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
    id: 'terrain',
    titre: 'Le terrain',
    contenu: (
      <>
        <p>
          Chaque combat a son décor : une <strong>ambiance</strong> (forêt, souterrain, caverne, camp, neige) donne le sol et les murs du plateau, et des
          éléments sont posés sur les cases. Un élément a toujours un effet sur le jeu, jamais seulement un dessin.
        </p>
        <ul>
          <li>
            <strong>Arbres et rochers</strong> : on ne peut ni les traverser ni voir ou tirer à travers, comme un mur. Contournez-les, ou cachez-vous derrière.
          </li>
          <li>
            <strong>Eau peu profonde, boue, neige profonde</strong> : du <strong>terrain difficile</strong>, chaque case coûte double en déplacement. Une
            rivière ralentit celui qui la traverse : cherchez le gué.
          </li>
          <li>
            <strong>Rochers bas, troncs couchés, caisses</strong> : on ne peut pas les traverser, mais on voit et on tire par-dessus. Ils donnent un{' '}
            <strong>demi-couvert</strong> à qui se tient derrière : <strong>+2 à la CA</strong> et +2 aux jets de sauvegarde de Dextérité contre ce qui
            vient de l'autre côté. Qui se tient collé à l'obstacle tire par-dessus sans gêne. Quand vous visez, un bouclier{' '}
            <strong>🛡+2</strong> marque les cibles à couvert.
          </li>
          <li>
            <strong>Murs</strong> : le bord du plateau, les piliers, les palissades. Ils bloquent comme un arbre.
          </li>
        </ul>
        <Capture
          nom="terrain"
          alt="Une rivière à galets, de la boue, un rocher et un arbre sur le plateau"
          legende="Le gué des brigands : l'eau et la boue (cases doublées) ralentissent, le rocher et l'arbre bloquent le passage et la vue."
        />
        <p>
          Sur l'écran de choix d'une escarmouche, l'aperçu de chaque carte montre ces éléments (vert : arbre, gris : rocher, gris clair : rocher bas, bleu : eau,
          brun : boue ou tronc, beige : caisse, blanc : neige).
        </p>
      </>
    ),
  },
  {
    id: 'effets',
    titre: 'Voir les attaques et la magie',
    contenu: (
      <>
        <p>
          Chaque attaque et chaque sort se voit à l’écran : ce que vous regardez est ce que le moteur vient de calculer. Les effets ne changent rien aux règles, ils
          les <strong>racontent</strong>.
        </p>

        <h3>Les coups : une famille de dégâts, un habillage</h3>
        <p>
          Le <strong>type de dégâts</strong> d’un coup décide de ce que l’on voit à l’impact et de la couleur du chiffre. Une arme enchantée prend l’habillage de son
          élément : une épée de feu brûle.
        </p>
        <Capture
          nom="familles-degats"
          alt="Les treize impacts, un par famille de dégâts, avec le chiffre de dégâts coloré"
          legende="Les treize familles de dégâts, de gauche à droite et de haut en bas (tranchant, perforant, contondant, feu, froid, foudre, acide, poison, nécrotique, radiant, force, psychique, tonnerre)."
        />
        <ul className="aide-familles">
          {FAMILLES.map((f) => (
            <li key={f}>
              <span className="pastille-famille" style={{ background: COULEURS_FAMILLES[f] }} />
              <strong>{LIBELLES_FAMILLES[f]}</strong> : {IMPACTS_AIDE[f]}.
            </li>
          ))}
        </ul>
        <p>
          Pour une arme, le tracé suit le sens du coup : l’<strong>arc de lame</strong> du tranchant, l’<strong>estoc</strong> du perforant, l’<strong>étoile de choc</strong>{' '}
          du contondant.
        </p>

        <h3>Le coup critique</h3>
        <p>
          Un critique marque un <strong>temps d’arrêt</strong>, puis le plateau <strong>tremble</strong> et se rapproche de la cible, tandis que les bords de l’écran
          rougissent. Le tonnerre secoue aussi le plateau, plus légèrement.
        </p>
        <Capture
          nom="critique"
          alt="Un coup critique tranchant : le plateau est zoomé, les bords sont rouges, le chiffre est grand"
          legende="Un critique tranchant sur une cible vulnérable : arc de lame, plateau qui se rapproche, bords rougis, chiffre agrandi et mention « Vulnérable ! »."
        />

        <h3>Résiste, vulnérable, immunisé</h3>
        <p>
          Sous le chiffre de dégâts, une mention vous dit ce qui s’est passé : <strong>Résiste</strong> (dégâts divisés par deux), <strong>Vulnérable !</strong> (dégâts
          doublés) ou <strong>Immunisé</strong> (aucun dégât). La rage du barbare, par exemple, fait résister aux dégâts physiques.
        </p>

        <h3>Les sorts à distance</h3>
        <p>Chaque sort a sa façon de traverser le plateau, selon sa nature :</p>
        <div className="aide-captures">
          <Capture nom="sort-boule" alt="Une boule de feu traverse le plateau" legende="Trait de feu : une boule de feu à traînée." />
          <Capture nom="sort-glace" alt="Un éclat de glace traverse le plateau" legende="Rayon de givre : un éclat de glace." />
          <Capture nom="sort-eclair" alt="Un éclair en zigzag relie le lanceur à la cible" legende="Éclair traçant : un éclair en zigzag, instantané." />
          <Capture nom="sort-rayon" alt="Un faisceau orange relie le lanceur à la cible" legende="Rayon ardent, flamme sacrée : un faisceau qui jaillit puis s’éteint." />
          <Capture nom="sort-dards" alt="Un dard magique en vol vers la cible" legende="Projectile magique : un dard par fléchette, qui dévie en arc avant de toucher." />
        </div>
        <p>
          Un jet d’acide décrit un arc, une volute de poison ou de nécrotique serpente. Avant chaque sort, un <strong>cercle de runes</strong> se trace sous le lanceur
          (visible sur chaque capture ci-dessus) : c’est le signal qu’une incantation commence.
        </p>

        <h3>Les zones d’effet</h3>
        <p>
          Une zone part de son <strong>centre</strong> — le point visé, ou le lanceur pour un souffle — et gagne les cases une à une. Les créatures qu’elle atteint
          encaissent à leur tour, et un sort de dégâts lancé à distance ajoute une explosion à son point d’origine.
        </p>
        <div className="aide-captures">
          <Capture nom="zone-cone" alt="Un cône de feu part du lanceur et s’étend vers la droite" legende="Mains brûlantes : un cône de feu parti du lanceur." />
          <Capture nom="zone-sphere" alt="Une sphère violette entoure la cible" legende="Sommeil : une sphère centrée sur le point visé." />
        </div>

        <h3>Les bruitages</h3>
        <p>
          Les coups et les sorts s’entendent aussi.
        </p>
        <ul className="aide-etats">
          <li>
            <strong>Les armes</strong> sonnent à l’impact selon leur nature : épée, hache, fouet, estoc de lance, rapière ou dague, masse ou marteau, massue ou gourdin, choc
            sourd. Une arme qui <strong>rate</strong> siffle dans le vide.
          </li>
          <li>
            <strong>Les tirs</strong> s’entendent au départ : corde d’arc, déclic d’arbalète, fronde, détonation d’une arme à feu, sarbacane, et le sifflement d’une arme lancée
            (javeline, hachette, dague).
          </li>
          <li>
            <strong>Les sorts</strong> ont leur bruit au départ : feu, glace, foudre, lumière sacrée, acide, poison, magie nécrotique, tonnerre, projectile magique (un son par
            fléchette) et arme spirituelle. Sommeil et immobilisation ont aussi le leur.
          </li>
          <li>
            <strong>Le soutien</strong> a le sien : soin, protection (bouclier, bouclier de la foi, bénédiction), renforcement (Aide), marque du chasseur et malédiction.
          </li>
        </ul>
        <p>
          Le bouton <strong>🔊</strong> de la barre d’actions coupe ou remet le son, et le curseur règle le volume ; votre choix est gardé d’une partie à l’autre.
        </p>

        <h3>La musique d’ambiance</h3>
        <p>
          Chaque combat a sa <strong>musique d’ambiance</strong>, tirée au hasard parmi cinq : embuscade en forêt, crypte et souterrain, caverne, camp de guerre et combat
          intense. On ne retombe jamais deux fois de suite sur la même. Elle s’installe en fondu au début du combat, tourne en boucle sans coupure et s’éteint en douceur
          quand le combat se termine.
        </p>
        <p>
          C’est un fond sonore : elle reste volontairement <strong>sous les bruitages</strong>, qu’elle ne couvre jamais. Le bouton <strong>♪</strong> la coupe ou la remet, et
          son curseur, séparé de celui des bruitages, règle son volume ; votre choix est gardé d’une partie à l’autre.
        </p>

        <p className="aide-note">
          « Rapide » accélère toutes les animations. Si votre système demande de réduire les animations, les effets en mouvement sont remplacés par les seuls chiffres ;
          les bruitages, eux, restent.
        </p>
      </>
    ),
  },
  {
    id: 'cartes',
    titre: 'Les cartes',
    contenu: (
      <>
        <p>
          Chaque option de votre personnage est une carte, rangée dans la colonne de droite. Sa couleur et son signe indiquent son coût (les mêmes signes
          s'allument ou s'éteignent en haut du panneau, selon ce qu'il vous reste à jouer ce tour-ci) :
        </p>
        <ul className="aide-couts">
          <li>
            <span className="cout cout-action">
              <Pictogramme cle="cout:action" taille={11} surFond />
              Action
            </span>{' '}
            utilise votre action du tour.
          </li>
          <li>
            <span className="cout cout-bonus">
              <Pictogramme cle="cout:bonus" taille={11} surFond />
              Bonus
            </span>{' '}
            utilise votre action bonus.
          </li>
          <li>
            <span className="cout cout-reaction">
              <Pictogramme cle="cout:reaction" taille={11} surFond />
              Réaction
            </span>{' '}
            utilise votre réaction.
          </li>
          <li>
            <span className="cout cout-elan">
              <Pictogramme cle="cout:elan" taille={11} surFond />
              Élan
            </span>{' '}
            est gratuite.
          </li>
        </ul>
        <p>
          À droite de chaque carte, un <strong>médaillon</strong> dit ce qu'elle est : la <strong>couleur</strong> est celle de son effet (orange pour le feu,
          bleu clair pour le froid, jaune pour la foudre, vert pour les soins, bleu pour la protection, violet pour la force et les sorts d'esprit…), le
          dessin est propre à chaque sort, à chaque arme et à chaque action de base. Un sort sans dessin à lui porte le signe de son <strong>école de
          magie</strong> (abjuration, conjuration, divination, enchantement, évocation, illusion, nécromancie ou transmutation).
        </p>
        <div className="aide-pictos">
          {[
            ['sort:trait-de-feu', 'Trait de feu'],
            ['sort:rayon-de-givre', 'Rayon de givre'],
            ['sort:poigne-electrique', 'Poigne électrique'],
            ['sort:soins', 'Soins'],
            ['sort:bouclier', 'Bouclier'],
            ['sort:sommeil', 'Sommeil'],
            ['sort:projectile-magique', 'Projectile magique'],
            ['arme:epee', 'Épée'],
            ['arme:arc', 'Arc'],
            ['base:foncer', 'Foncer'],
            ['ecole:necromancie', 'École de nécromancie'],
          ].map(([cle, nom]) => (
            <span key={cle} className="aide-picto">
              <Pictogramme cle={cle!} taille={34} medaillon />
              <span>{nom}</span>
            </span>
          ))}
        </div>
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
            <span className="badge">{SYMBOLES_ETATS.neutralise}</span> neutralisé,{' '}
            <span className="badge">{SYMBOLES_ETATS.etourdi}</span> étourdi…
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
    id: 'auras',
    titre: 'Auras et états sur les jetons',
    contenu: (
      <>
        <p>
          Tant qu’un effet dure, il reste visible sur le jeton du plateau. Les <strong>auras</strong> sont des anneaux autour du jeton ; les <strong>états</strong>{' '}
          se lisent sur le jeton lui-même. Les badges (voir « États, blessures et mort ») donnent le détail.
        </p>
        <Capture
          nom="auras-etats"
          alt="Les auras (béni, protégé, maudit, marqué, givre, illuminé, concentré, points de vie temporaires) et les états (à terre, aveugle, charmé, empoigné, entravé, effrayé, inconscient, neutralisé, paralysé, empoisonné)"
          legende="Les auras (en haut) et les états (en dessous), chacun sur un jeton."
        />
        <h3>Les auras</h3>
        <ul className="aide-etats">
          <li>
            <strong>Béni</strong> : anneau doré qu’une étincelle parcourt (Bénédiction).
          </li>
          <li>
            <strong>Protégé</strong> : bulle de lumière froide qui miroite (Bouclier de la foi, sort Bouclier).
          </li>
          <li>
            <strong>Maudit</strong> : anneau violet sombre qui vacille (Fléau).
          </li>
          <li>
            <strong>Marqué</strong> : réticule rouge sur le jeton (Marque du chasseur).
          </li>
          <li>
            <strong>Ralenti par le froid</strong> : anneau de glace (Rayon de givre, botte Ralentissement).
          </li>
          <li>
            <strong>Illuminé</strong> : anneau jaune qui scintille (Éclair traçant : la prochaine attaque contre lui a l’avantage).
          </li>
          <li>
            <strong>Concentré</strong> : fin cercle de runes qui tourne ; le personnage maintient un sort.
          </li>
          <li>
            <strong>Points de vie temporaires</strong> : mince liseré blanc.
          </li>
        </ul>
        <p>Un jeton montre au plus trois auras à la fois. Une aura qui apparaît « se pose » en une demi-seconde.</p>
        <h3>Les états</h3>
        <ul className="aide-etats">
          <li>
            <strong>À terre</strong> : le jeton est couché.
          </li>
          <li>
            <strong>Inconscient, neutralisé</strong> (dont le sommeil) : des « z » montent au-dessus du jeton.
          </li>
          <li>
            <strong>Paralysé</strong> : le jeton crépite d’étincelles jaunes et des éclairs apparaissent.
          </li>
          <li>
            <strong>Effrayé</strong> : l’icône tremble, avec des points d’exclamation.
          </li>
          <li>
            <strong>Charmé</strong> : des cœurs montent au-dessus du jeton.
          </li>
          <li>
            <strong>Aveugle</strong> : l’icône s’éteint, des points d’interrogation apparaissent.
          </li>
          <li>
            <strong>Empoisonné</strong> : une lueur verte et de petites bulles.
          </li>
          <li>
            <strong>Entravé, empoigné</strong> : une chaîne entoure le jeton.
          </li>
        </ul>
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
        <li>
          <kbd>I</kbd> : le sac du groupe (en aventure). <kbd>M</kbd> : la carte du monde en plein écran. <kbd>C</kbd>, ou un clic sur un héros du bandeau : sa feuille de personnage (flèches ← → pour changer de héros).
        </li>
        <li>
          <kbd>1</kbd> à <kbd>9</kbd> : choisir une réplique dans une conversation ; <kbd>Échap</kbd> y met fin.
        </li>
        <li>« Tour auto » fait jouer l'IA à votre place pour ce tour ; « Héros auto » pour tout le combat ; « Rapide » accélère les animations.</li>
        <li>
          <kbd>🔊</kbd> coupe ou remet les bruitages ; le curseur à côté règle leur volume. <kbd>♪</kbd> et son curseur font de même pour la musique d’ambiance.
        </li>
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

/** Les sections dans l'ordre du sommaire : le parcours du joueur (groupe, histoire, exploration, dialogues…), puis le combat en détail. */
const ORDRE: string[] = [
  'principe',
  'groupe',
  'groupe-plus',
  'histoires',
  'explorer',
  'parler',
  'carte-journal',
  'sac-boutiques',
  'rencontres',
  'repos-niveaux',
  'conteur',
  'classes',
  'combat',
  'combat-plus',
  'terrain',
  'effets',
  'cartes',
  'etats',
  'auras',
  'raccourcis',
  'glossaire',
];
const SECTIONS: Section[] = ORDRE.map((id) => SECTIONS_ECRITES.find((s) => s.id === id) ?? sectionDonnees(id));

/** Aide au jeu : principe, groupe, histoires, exploration, dialogues, carte, sac, rencontres, repos, conteur, classes, combat, effets, cartes, états, auras, commandes, glossaire. */
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
