// L'écran de sommeil : l'illustration de la nuit (chambre d'auberge ou camp autour d'un feu) en plein écran, une horloge qui
// avance d'une heure par seconde et le compte des heures restantes. La musique de fond baisse. Un clic sur « Se réveiller »,
// Échap ou Espace passent. Une nuit interrompue (rencontre) s'arrête au milieu sur une alerte.
import { useEffect, useRef, useState } from 'react';
import { baisserMusique } from '../musique';
import { heureDuCadran, heureDuReveilBrutal, MS_PAR_HEURE, obscurite, type DecorSommeil } from '../sommeil-regles';
import { imageInterface } from '../visuels';

interface Props {
  decor: DecorSommeil;
  /** L'heure du coucher (0 à 23). */
  heureDebut: number;
  /** Les heures dormies (le moteur a déjà fait passer le temps). */
  heures: number;
  /** Une rencontre attend le groupe : la nuit s'arrête avant l'aube. */
  interrompu: boolean;
  onFin: () => void;
}

/** Combien de temps le message final (aube ou alerte) reste affiché avant de rendre la main. */
const DUREE_MESSAGE = 1600;

export function EcranSommeil({ decor, heureDebut, heures, interrompu, onFin }: Props) {
  // Des heures pleines, quoi qu'on reçoive : jamais de virgule à l'écran.
  const heuresPleines = Math.max(1, Math.round(heures));
  const arret = useRef(interrompu ? heureDuReveilBrutal(heuresPleines, Math.random()) : heuresPleines);
  const [ecoulees, setEcoulees] = useState(0);
  const fini = ecoulees >= arret.current;
  const image = imageInterface(decor === 'chambre' ? 'sommeil-chambre' : 'sommeil-camp');

  // La musique de fond se fait discrète pendant le sommeil.
  useEffect(() => {
    baisserMusique(true);
    return () => baisserMusique(false);
  }, []);

  // Une heure par seconde, jusqu'à l'aube (ou jusqu'à l'alerte), puis le message reste un instant et l'écran se ferme.
  useEffect(() => {
    if (fini) {
      const t = window.setTimeout(onFin, DUREE_MESSAGE);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setEcoulees((e) => e + 1), MS_PAR_HEURE);
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

  const restant = Math.max(0, heuresPleines - ecoulees);
  return (
    <div className={`ecran-sommeil${interrompu && fini ? ' alerte' : ''}`} role="dialog" aria-modal="true" aria-label="Le groupe dort">
      <div className="sommeil-image" style={image ? { backgroundImage: `url(${image})` } : undefined} />
      <div className="sommeil-voile" style={{ opacity: interrompu && fini ? 0.2 : obscurite(ecoulees, heuresPleines) }} />
      <div className="sommeil-contenu" aria-live="polite">
        <p className="sommeil-titre">{decor === 'chambre' ? 'Une nuit à l’abri' : 'Une nuit au coin du feu'}</p>
        <p className="sommeil-heure">{heureDuCadran(heureDebut, ecoulees)}</p>
        <p className="sommeil-reste">
          {fini ? (interrompu ? 'Un bruit vous tire du sommeil !' : 'Le jour se lève.') : `Encore ${restant} h de sommeil`}
        </p>
        <button type="button" className="bouton-discret sommeil-passer" onClick={onFin}>
          Se réveiller (Échap)
        </button>
      </div>
    </div>
  );
}
