// Créateur de personnage : 8 écrans (espèce, classe, historique, caractéristiques, choix de classe,
// alignement, nom et portrait, récapitulatif), avec « Recommandé » à chaque étape.
import { useEffect, useMemo, useState } from 'react';
import {
  ETAPES,
  NOMS_ETAPES,
  recommanderCaracteristiques,
  recommanderCompetences,
  recommanderEspece,
  recommanderHistorique,
  historiqueRecommande,
  nouvelId,
  type Donnees,
  type Etape,
  type PersonnageCree,
} from '@crpg/regles';
import {
  bilanBrouillon,
  brouillonDepuis,
  brouillonVide,
  changerHistorique,
  creationRapideBrouillon,
  manquantsEtape,
  tousLesManquants,
  versPersonnage,
  type Brouillon,
} from './brouillon';
import { nomAuHasard, portraitEquivalent } from './portraits';
import { EcranAlignement } from './ecrans/Alignement';
import { EcranCaracteristiques } from './ecrans/Caracteristiques';
import { EcranChoixClasse } from './ecrans/ChoixClasse';
import { EcranClasse } from './ecrans/Classe';
import { EcranEspece } from './ecrans/Espece';
import { EcranHistorique } from './ecrans/Historique';
import { EcranIdentite } from './ecrans/Identite';
import { EcranRecapitulatif } from './ecrans/Recapitulatif';
import { Modale } from './ui';

interface Props {
  donnees: Donnees;
  /** Personnage à modifier ; absent pour une création. */
  personnage?: PersonnageCree;
  niveauGroupe: number;
  onTerminer: (p: PersonnageCree) => void;
  onQuitter: () => void;
}

const TITRES: Record<Etape, string> = {
  espece: 'Choisissez une espèce',
  classe: 'Choisissez une classe',
  historique: 'Choisissez un historique',
  caracteristiques: 'Répartissez les caractéristiques',
  competences: 'Choix de classe, sorts et équipement',
  alignement: 'Choisissez un alignement',
  identite: 'Nom et portrait',
  recapitulatif: 'Récapitulatif',
};

const AVEC_RECOMMANDE: Etape[] = ['espece', 'historique', 'caracteristiques', 'competences', 'alignement', 'identite'];

/** Le héros en cours de création (ou de modification), gardé dans le navigateur : un rechargement ne fait rien perdre. */
const CLE_BROUILLON = 'crpg.brouillon.v1';

interface BrouillonSauve {
  /** L'id du héros modifié ; absent pour une création. */
  pour?: string;
  b: Brouillon;
  index: number;
  maxAtteint: number;
}

function lireBrouillon(pour: string | undefined): BrouillonSauve | undefined {
  try {
    const s = JSON.parse(window.localStorage.getItem(CLE_BROUILLON) ?? 'null') as BrouillonSauve | null;
    if (!s || typeof s !== 'object' || !s.b?.choix || !s.b?.identite || typeof s.index !== 'number') return undefined;
    if ((s.pour ?? undefined) !== pour) return undefined;
    const index = Math.max(0, Math.min(ETAPES.length - 1, s.index));
    return { ...s, index, maxAtteint: Math.max(index, Math.min(ETAPES.length - 1, s.maxAtteint ?? index)) };
  } catch {
    return undefined;
  }
}

function effacerBrouillon(): void {
  try {
    window.localStorage.removeItem(CLE_BROUILLON);
  } catch {
    // stockage indisponible : rien à effacer
  }
}

export function Createur({ donnees, personnage, niveauGroupe, onTerminer, onQuitter }: Props) {
  // Un brouillon laissé en route (rechargement, fermeture) pour ce même héros reprend où il était.
  const [repris] = useState(() => lireBrouillon(personnage?.id));
  const [b, setB] = useState<Brouillon>(() => repris?.b ?? (personnage ? brouillonDepuis(personnage) : brouillonVide(niveauGroupe)));
  const [index, setIndex] = useState(repris?.index ?? (personnage ? ETAPES.length - 1 : 0));
  const [maxAtteint, setMaxAtteint] = useState(repris?.maxAtteint ?? (personnage ? ETAPES.length - 1 : 0));
  /** Incrémenté quand une recommandation remplace des choix : les écrans à état local se réinitialisent. */
  const [version, setVersion] = useState(0);
  const [confirmerSortie, setConfirmerSortie] = useState(false);
  const [modifie, setModifie] = useState(!!repris);
  const etape = ETAPES[index]!;

  const maj = (f: (x: Brouillon) => Brouillon) => {
    setB((x) => f(x));
    setModifie(true);
  };
  /** Valeurs de départ posées par un écran (caractéristiques par défaut) : ce n'est pas un choix du joueur. */
  const initialiser = (f: (x: Brouillon) => Brouillon) => setB((x) => f(x));

  useEffect(() => {
    if (!modifie) return;
    try {
      window.localStorage.setItem(CLE_BROUILLON, JSON.stringify({ pour: personnage?.id, b, index, maxAtteint } satisfies BrouillonSauve));
    } catch {
      // stockage indisponible (navigation privée, quota) : le brouillon reste en mémoire
    }
  }, [b, index, maxAtteint, modifie, personnage?.id]);

  /** Quitter la création (bouton « Annuler », « Quitter » au premier écran, Échap) : on confirme si des choix seraient perdus. */
  const demanderSortie = () => {
    if (modifie) setConfirmerSortie(true);
    else {
      effacerBrouillon();
      onQuitter();
    }
  };
  useEffect(() => {
    const f = (ev: KeyboardEvent) => {
      if (ev.key !== 'Escape' || confirmerSortie) return;
      const cible = ev.target as HTMLElement | null;
      if (cible && (/^(input|textarea|select)$/i.test(cible.tagName) || cible.isContentEditable)) return;
      if (document.querySelector('.modale-fond, [role="dialog"]')) return;
      demanderSortie();
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  });

  const manquants = useMemo(() => manquantsEtape(b, donnees, etape), [b, donnees, etape]);
  const tousManquants = useMemo(() => tousLesManquants(b, donnees, true), [b, donnees]);
  const bilan = useMemo(() => (etape === 'recapitulatif' ? bilanBrouillon(b, donnees) : undefined), [b, donnees, etape]);

  const aller = (e: Etape) => {
    const i = ETAPES.indexOf(e);
    setIndex(i);
    setMaxAtteint((m) => Math.max(m, i));
  };

  const suivant = () => {
    if (manquants.length) return;
    aller(ETAPES[Math.min(ETAPES.length - 1, index + 1)]!);
  };
  const retour = () => {
    if (index === 0) demanderSortie();
    else setIndex(index - 1);
  };

  const rapide = () => {
    const r = creationRapideBrouillon(b, donnees);
    if (!r) return;
    setB(r);
    setModifie(true);
    setVersion((v) => v + 1);
    setMaxAtteint(ETAPES.length - 1);
    setIndex(ETAPES.length - 1);
  };

  /** Applique la recommandation de l'écran courant. */
  const recommander = () => {
    setB((x) => {
      const c = x.choix;
      switch (etape) {
        case 'espece':
          return { ...x, choix: { ...c, ...recommanderEspece(c, donnees) } };
        case 'historique': {
          const base = c.historique || !c.classe ? x : changerHistorique(x, historiqueRecommande(c.classe, donnees), donnees);
          return { ...base, choix: { ...base.choix, ...recommanderHistorique(base.choix, donnees) } };
        }
        case 'caracteristiques':
          return { ...x, tirageValide: false, choix: { ...c, ...recommanderCaracteristiques(c, donnees) } };
        case 'competences':
          return { ...x, choix: { ...c, ...recommanderCompetences(c, donnees) } };
        case 'alignement':
          return { ...x, identite: { ...x.identite, alignement: 'NB' } };
        case 'identite': {
          const espece = c.espece ?? 'humain';
          return {
            ...x,
            identite: {
              ...x.identite,
              nom: x.identite.nom.trim() || nomAuHasard(espece, x.identite.sexe),
              portrait: x.identite.portrait ?? portraitEquivalent(undefined, espece, x.identite.sexe),
            },
          };
        }
        default:
          return x;
      }
    });
    setModifie(true);
    setVersion((v) => v + 1);
  };

  const peutRecommander = (() => {
    const c = b.choix;
    switch (etape) {
      case 'espece':
        return !!c.espece;
      case 'historique':
        return !!c.classe;
      case 'caracteristiques':
        return !!c.classe && !!c.historique;
      case 'competences':
        return !!c.classe && !!c.espece && !!c.historique;
      default:
        return true;
    }
  })();
  const raisonRecommande = etape === 'espece' ? "Choisissez d'abord une espèce." : "Choisissez d'abord les éléments précédents.";

  const terminer = () => {
    if (!bilan?.complet) return;
    const p = versPersonnage(b, b.id ?? nouvelId(), donnees);
    if (!p) return;
    effacerBrouillon();
    onTerminer(p);
  };

  const props = { b, donnees, maj, initialiser };
  let ecran;
  switch (etape) {
    case 'espece':
      ecran = <EcranEspece key={version} {...props} />;
      break;
    case 'classe':
      ecran = <EcranClasse key={version} {...props} rapide={rapide} />;
      break;
    case 'historique':
      ecran = <EcranHistorique key={version} {...props} />;
      break;
    case 'caracteristiques':
      ecran = <EcranCaracteristiques key={version} {...props} />;
      break;
    case 'competences':
      ecran = <EcranChoixClasse key={version} {...props} aller={(e) => aller(e)} />;
      break;
    case 'alignement':
      ecran = <EcranAlignement key={version} {...props} />;
      break;
    case 'identite':
      ecran = <EcranIdentite key={version} {...props} />;
      break;
    default:
      ecran = <EcranRecapitulatif key={version} {...props} aller={aller} />;
  }

  const dernier = index === ETAPES.length - 1;

  return (
    <div className="createur">
      <header className="createur-haut">
        <nav className="etapes" aria-label="Étapes de la création">
          {ETAPES.map((e, i) => {
            const accessible = i <= maxAtteint;
            const fait = i < index || (i <= maxAtteint && i !== index && !tousManquants.some((m) => m.etape === e));
            const classes = ['etape', i === index ? 'etape-courante' : '', fait ? 'etape-faite' : '', accessible ? '' : 'etape-future'].join(' ');
            return (
              <button key={e} type="button" className={classes} disabled={!accessible} aria-current={i === index ? 'step' : undefined} onClick={() => aller(e)}>
                <span className="etape-num">{fait && i !== index ? '✓' : i + 1}</span>
                <span className="etape-nom">{NOMS_ETAPES[e]}</span>
              </button>
            );
          })}
        </nav>
        <div className="createur-titre">
          <h1>{TITRES[etape]}</h1>
          <span className="createur-sous">
            {personnage ? 'Modification du personnage' : 'Nouveau personnage'}
            {repris ? ' · repris là où vous l’aviez laissé' : ''}
          </span>
        </div>
      </header>

      <main className="createur-corps">{ecran}</main>

      <footer className="createur-pied">
        <div className="pied-gauche">
          <button type="button" className="bouton" onClick={retour}>
            {index === 0 ? '‹ Quitter' : '‹ Retour'}
          </button>
          {index > 0 && (
            <button type="button" className="bouton-discret" onClick={demanderSortie} title="Quitter la création (Échap)">
              Annuler
            </button>
          )}
        </div>
        <div className="pied-message" aria-live="polite">
          {dernier
            ? bilan && !bilan.complet
              ? `Il reste ${bilan.manquants.length + bilan.erreurs.length} point(s) à régler.`
              : ''
            : manquants.length
              ? `Pour continuer : ${manquants[0]!.message}${manquants.length > 1 ? ` (+${manquants.length - 1})` : ''}`
              : ''}
        </div>
        <div className="pied-droite">
          {AVEC_RECOMMANDE.includes(etape) && (
            <button type="button" className="bouton" onClick={recommander} disabled={!peutRecommander} title={peutRecommander ? 'Applique les choix conseillés pour cet écran' : raisonRecommande}>
              Recommandé
            </button>
          )}
          {dernier ? (
            <button type="button" className="bouton-principal bouton-moyen" onClick={terminer} disabled={!bilan?.complet} title={bilan?.complet ? undefined : 'Réglez les points signalés ci-dessus.'}>
              Terminer
            </button>
          ) : (
            <button type="button" className="bouton-principal bouton-moyen" onClick={suivant} disabled={manquants.length > 0} title={manquants.length ? manquants.map((m) => m.message).join('\n') : undefined}>
              Suivant ›
            </button>
          )}
        </div>
      </footer>

      {confirmerSortie && (
        <Modale
          titre={personnage ? 'Abandonner ces modifications ?' : 'Abandonner ce personnage ?'}
          texte={personnage ? 'Le personnage reste tel qu’il était avant ces modifications.' : 'Les choix faits pendant cette création seront perdus.'}
          confirmer="Abandonner"
          annuler="Continuer"
          dangereux
          onConfirmer={() => {
            effacerBrouillon();
            onQuitter();
          }}
          onAnnuler={() => setConfirmerSortie(false)}
        />
      )}
    </div>
  );
}
