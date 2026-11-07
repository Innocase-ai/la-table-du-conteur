// L'écran de crochetage : le crochet (ou le pied-de-biche) en grand, un anneau qui se vide au rythme d'une seconde par
// seconde, puis le résultat : le d20, le total, le DD et la phrase finale ; si des témoins ont vu le groupe, ils le disent.
// La musique de fond baisse. Échap, Espace ou Entrée passent. Le moteur a déjà tout décidé : ce n'est qu'un habillage.
import { useEffect, useState } from 'react';
import { Pictogramme } from '../composants/Pictogramme';
import { dureeCrochetage, messageFinal, MS_PAR_SECONDE, sonDuResultat, type Ouverture } from '../crochetage-regles';
import { baisserMusique } from '../musique';
import { jouerSon } from '../sons';

interface Props {
  ouverture: Ouverture;
  /** Le nom du héros qui agit. */
  nomHeros: string;
  onFin: () => void;
}

/** Combien de temps le résultat reste affiché avant de rendre la main. */
const DUREE_RESULTAT = 3600;
const RAYON = 54;
const CIRCONFERENCE = 2 * Math.PI * RAYON;

export function EcranCrochetage({ ouverture, nomHeros, onFin }: Props) {
  const duree = dureeCrochetage(ouverture.jet.bonus, ouverture.jet.dd, ouverture.methode);
  const [ecoulees, setEcoulees] = useState(0);
  const fini = ecoulees >= duree;
  const { jet } = ouverture;

  // La musique de fond se fait discrète pendant l'effort.
  useEffect(() => {
    baisserMusique(true);
    return () => baisserMusique(false);
  }, []);

  // Le bruit du résultat, quand le compte à rebours est fini : la serrure s'ouvre ou le verrou cède.
  useEffect(() => {
    if (!fini) return;
    const son = sonDuResultat(ouverture);
    if (son) jouerSon(son);
  }, [fini, ouverture]);

  // Une seconde par seconde, jusqu'au résultat, qui reste un instant avant de se fermer.
  useEffect(() => {
    const t = window.setTimeout(fini ? onFin : () => setEcoulees((e) => e + 1), fini ? DUREE_RESULTAT : MS_PAR_SECONDE);
    return () => window.clearTimeout(t);
  }, [ecoulees, fini, onFin]);

  useEffect(() => {
    const surTouche = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' || ev.key === ' ' || ev.key === 'Enter') {
        ev.preventDefault();
        onFin();
      }
    };
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  }, [onFin]);

  const restant = Math.max(0, duree - ecoulees);
  const crochet = ouverture.methode === 'crocheter';
  return (
    <div className={`ecran-crochetage${fini ? (ouverture.reussie ? ' reussi' : ' rate') : ''}`} role="dialog" aria-modal="true" aria-label={crochet ? 'Le crochetage' : 'Le forçage'}>
      <div className="crochetage-contenu" aria-live="polite">
        <p className="crochetage-titre">
          {nomHeros} {crochet ? 'crochète' : 'force'} {ouverture.objet.replace(/^L[ea]s? /, (m) => m.toLowerCase())}
        </p>
        <div className="crochetage-scene">
          <svg className="crochetage-anneau" viewBox="0 0 128 128" aria-hidden>
            <circle cx="64" cy="64" r={RAYON} className="crochetage-anneau-fond" />
            <circle
              cx="64"
              cy="64"
              r={RAYON}
              className="crochetage-anneau-reste"
              strokeDasharray={CIRCONFERENCE}
              strokeDashoffset={CIRCONFERENCE * (1 - restant / duree)}
              transform="rotate(-90 64 64)"
            />
          </svg>
          <div className={`crochetage-pic ${crochet ? 'crochet' : 'pied-de-biche'}${fini ? ' immobile' : ''}`}>
            <Pictogramme cle={crochet ? 'base:crocheter' : 'base:forcer'} taille={150} />
          </div>
          <p className="crochetage-compte">{fini ? '' : restant}</p>
        </div>
        {fini ? (
          <div className="crochetage-resultat">
            <p className="crochetage-phrase">{messageFinal(ouverture)}</p>
            <p className={`crochetage-jet ${ouverture.reussie ? 'jet-reussi' : 'jet-rate'}`}>
              d20 {jet.des.join(' / ')} {jet.bonus >= 0 ? '+' : '−'} {Math.abs(jet.bonus)} = <strong>{jet.total}</strong> contre DD {jet.dd}
            </p>
            {ouverture.repere && <p className="crochetage-repere">{ouverture.repere}</p>}
          </div>
        ) : (
          <p className="crochetage-reste">{crochet ? 'Les goupilles résistent…' : 'Le bois grince…'}</p>
        )}
        <button type="button" className="bouton-discret crochetage-passer" onClick={onFin}>
          Passer (Échap)
        </button>
      </div>
    </div>
  );
}
