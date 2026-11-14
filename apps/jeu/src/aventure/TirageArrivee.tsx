import { useEffect, useState } from 'react';
import './TirageArrivee.css';

export type IssueTirage = 'rien' | 'calme' | 'combat' | 'pnj' | 'decouverte';

const ETIQUETTES: Record<IssueTirage, string> = {
  rien: 'Rien ne se passe',
  calme: 'Le lieu est calme',
  combat: 'Un combat !',
  pnj: 'Une rencontre',
  decouverte: 'Une trouvaille ?',
};

const reduireLesMouvements = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Le dé d'arrivée dans un lieu : il roule, s'arrête sur son score, puis l'issue apparaît. Quand il ne se passe rien, de la poussière
 * de lumière monte doucement et un anneau se disperse : le calme se voit, il n'est pas un trou dans le récit.
 * `animer` : seul le dernier tirage du récit joue son animation ; les anciens s'affichent posés.
 */
export function TirageArrivee({ de, issue, texte, animer }: { de: number; issue: IssueTirage; texte: string; animer: boolean }) {
  const mouvement = animer && !reduireLesMouvements();
  const [face, setFace] = useState(mouvement ? 1 + Math.floor(Math.random() * 6) : de);
  const [pose, setPose] = useState(!mouvement);

  useEffect(() => {
    if (!mouvement) return;
    let tours = 0;
    const id = window.setInterval(() => {
      tours += 1;
      if (tours >= 10) {
        window.clearInterval(id);
        setFace(de);
        setPose(true);
      } else setFace(1 + Math.floor(Math.random() * 6));
    }, 80);
    return () => window.clearInterval(id);
  }, [mouvement, de]);

  const calme = issue === 'rien' || issue === 'calme';
  return (
    <div className={`tirage tirage-${issue}${pose ? ' pose' : ' roule'}`} role="status" aria-live="polite">
      <span className="tirage-de" aria-label={`Dé d’arrivée : ${de}`}>
        {face}
      </span>
      <span className="tirage-corps">
        <strong>{ETIQUETTES[issue]}</strong>
        <em>{texte}</em>
      </span>
      {calme && pose && (
        <span className="tirage-poussieres" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} style={{ ['--i' as string]: i }} />
          ))}
        </span>
      )}
    </div>
  );
}

export interface TirageAffiche {
  cle: number;
  de: number;
  issue: IssueTirage;
  texte: string;
}

/** Un combat qui commence ne fait pas attendre : le dé se montre, puis l'écran de rencontre prend la place. */
const dureeDe = (issue: IssueTirage) => (issue === 'combat' ? 2300 : 3400);

/**
 * Le même dé, en grand, par-dessus l'illustration du lieu qu'on vient d'atteindre : il roule, s'arrête, dit l'issue, puis se dissipe
 * tout seul (un clic le ferme). Quand il ne se passe rien, la lumière se disperse en poussière : le calme se voit.
 */
export function TirageSurImage({ tirage, onFin }: { tirage: TirageAffiche; onFin: () => void }) {
  const mouvement = !reduireLesMouvements();
  const [face, setFace] = useState(mouvement ? 1 + Math.floor(Math.random() * 6) : tirage.de);
  const [pose, setPose] = useState(!mouvement);

  useEffect(() => {
    const fin = window.setTimeout(onFin, mouvement ? dureeDe(tirage.issue) : 1800);
    let id = 0;
    if (mouvement) {
      let tours = 0;
      id = window.setInterval(() => {
        tours += 1;
        if (tours >= 12) {
          window.clearInterval(id);
          setFace(tirage.de);
          setPose(true);
        } else setFace(1 + Math.floor(Math.random() * 6));
      }, 75);
    }
    return () => {
      window.clearTimeout(fin);
      window.clearInterval(id);
    };
  }, [mouvement, tirage.de, tirage.issue, onFin]);

  const calme = tirage.issue === 'rien' || tirage.issue === 'calme';
  return (
    <div className={`tirage-voile tirage-${tirage.issue}${pose ? ' pose' : ' roule'}`} onClick={onFin} role="status" aria-live="polite">
      <div className="tirage-voile-centre">
        <span className="tirage-grand-de" aria-label={`Dé d’arrivée : ${tirage.de}`}>
          {face}
        </span>
        {pose && (
          <span className="tirage-voile-texte">
            <strong>{ETIQUETTES[tirage.issue]}</strong>
            <em>{tirage.texte}</em>
          </span>
        )}
      </div>
      {calme && pose && (
        <span className="tirage-voile-poussieres" aria-hidden="true">
          {Array.from({ length: 16 }, (_, i) => (
            <i key={i} style={{ ['--i' as string]: i, ['--x' as string]: `${(i * 37) % 100}%`, ['--d' as string]: `${(i % 5) * 0.35}s` }} />
          ))}
        </span>
      )}
    </div>
  );
}
