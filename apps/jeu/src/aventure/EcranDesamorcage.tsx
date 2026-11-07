// L'écran de désamorçage : le mécanisme du piège en grand (aiguille, fil, plaque, sol, chute, gaz, glyphe, rouages), l'outil du
// héros qui s'approche, un anneau qui se vide, puis le résultat : neutralisé, raté sans suite, ou déclenché (avec ce que le moteur
// a déjà calculé). La musique de fond baisse. Échap, Espace ou Entrée passent. Le moteur a tout décidé : ce n'est qu'un habillage.
import { useEffect, useState } from 'react';
import { NOMS_CARAC, NOMS_COMPETENCES } from '../createur/libelles';
import {
  dureeDesamorcage,
  dureeResultat,
  messageFinal,
  MS_PAR_SECONDE,
  phraseDeTravail,
  sonDuResultat,
  titreDesamorcage,
  type Desamorcage,
  type MecanismePiege,
} from '../desamorcage-regles';
import { baisserMusique } from '../musique';
import { jouerSon } from '../sons';

interface Props {
  desamorcage: Desamorcage;
  onFin: () => void;
}

const RAYON = 54;
const CIRCONFERENCE = 2 * Math.PI * RAYON;

function libelleTest(test: string): string {
  if (test in NOMS_COMPETENCES) return NOMS_COMPETENCES[test as keyof typeof NOMS_COMPETENCES];
  const s = /^sauvegarde de (\w+)$/.exec(test);
  if (s) return `Sauvegarde de ${NOMS_CARAC[s[1] as keyof typeof NOMS_CARAC] ?? s[1]}`;
  return test;
}

/** Où l'outil touche le mécanisme (dans le repère 200 × 160 du dessin). */
const POINT_DE_TRAVAIL: Record<MecanismePiege, [number, number]> = {
  aiguille: [100, 72],
  fil: [100, 88],
  plaque: [100, 100],
  sol: [100, 74],
  chute: [100, 96],
  gaz: [100, 70],
  glyphe: [100, 84],
  rouages: [108, 88],
};

/** Les pièces du mécanisme : chacune a une classe `pg-…` que le CSS anime selon l'état (travail, réussi, raté, déclenché). */
function Mecanisme({ type }: { type: MecanismePiege }) {
  switch (type) {
    case 'aiguille':
      return (
        <g>
          <rect x="52" y="34" width="96" height="104" rx="12" className="pg-metal pg-vibre" />
          <rect x="60" y="42" width="80" height="88" rx="8" className="pg-metal-clair" />
          <circle cx="100" cy="78" r="13" className="pg-trou" />
          <rect x="97" y="78" width="6" height="16" rx="2" className="pg-trou" />
          <circle cx="64" cy="48" r="2.5" className="pg-rivet" />
          <circle cx="136" cy="48" r="2.5" className="pg-rivet" />
          <circle cx="64" cy="124" r="2.5" className="pg-rivet" />
          <circle cx="136" cy="124" r="2.5" className="pg-rivet" />
          <g className="pg-aiguille">
            <polygon points="100,18 96.5,78 103.5,78" className="pg-pointe" />
            <circle cx="100" cy="18" r="3.4" className="pg-goutte" />
          </g>
          <g className="pg-apparait">
            <rect x="96" y="70" width="8" height="16" rx="2" className="pg-cale" />
            <path d="M86 108 l8 8 l18 -20" className="pg-coche" />
          </g>
        </g>
      );
    case 'fil':
      return (
        <g>
          <rect x="22" y="38" width="12" height="104" rx="3" className="pg-bois" />
          <rect x="166" y="38" width="12" height="104" rx="3" className="pg-bois" />
          <path d="M34 88 L166 88" className="pg-fil pg-vibre" />
          {[64, 100, 136].map((x) => (
            <g key={x} className="pg-cloche" style={{ transformOrigin: `${x}px 88px` }}>
              <path d={`M${x} 88 v12`} className="pg-fil-fin" />
              <path d={`M${x - 7} 114 q7 -18 14 0 z`} className="pg-bronze" />
            </g>
          ))}
          <g className="pg-apparait">
            <path d="M34 88 Q58 112 78 132" className="pg-fil" />
            <path d="M166 88 Q142 112 122 132" className="pg-fil" />
          </g>
        </g>
      );
    case 'plaque':
      return (
        <g>
          <g className="pg-lames">
            <polygon points="16,80 70,92 16,104" className="pg-lame pg-lame-g" />
            <polygon points="184,80 130,92 184,104" className="pg-lame pg-lame-d" />
          </g>
          <rect x="0" y="40" width="20" height="104" className="pg-mur" />
          <rect x="180" y="40" width="20" height="104" className="pg-mur" />
          <rect x="20" y="108" width="160" height="34" rx="3" className="pg-dalle" />
          <rect x="70" y="100" width="60" height="12" rx="3" className="pg-plaque pg-vibre" />
          <g className="pg-apparait">
            <polygon points="80,112 120,112 100,124" className="pg-cale" />
          </g>
        </g>
      );
    case 'sol':
      return (
        <g>
          <rect x="20" y="78" width="160" height="66" className="pg-fosse" />
          <polygon points="26,144 38,112 50,144 62,112 74,144 86,112 98,144 110,112 122,144 134,112 146,144 158,112 170,144" className="pg-pieux" />
          <rect x="0" y="70" width="34" height="74" className="pg-dalle" />
          <rect x="166" y="70" width="34" height="74" className="pg-dalle" />
          <g className="pg-trappe pg-trappe-g" style={{ transformOrigin: '34px 76px' }}>
            <rect x="34" y="70" width="66" height="10" rx="2" className="pg-planche" />
            <path d="M52 70 v10 M76 70 v10" className="pg-joint" />
          </g>
          <g className="pg-trappe pg-trappe-d" style={{ transformOrigin: '166px 76px' }}>
            <rect x="100" y="70" width="66" height="10" rx="2" className="pg-planche" />
            <path d="M124 70 v10 M148 70 v10" className="pg-joint" />
          </g>
          <g className="pg-apparait">
            <rect x="26" y="58" width="148" height="9" rx="3" className="pg-cale" />
          </g>
        </g>
      );
    case 'chute':
      return (
        <g>
          <rect x="20" y="10" width="160" height="14" rx="3" className="pg-bois" />
          <g className="pg-bloc-groupe">
            <path d="M100 24 v16" className="pg-chaine" />
            <rect x="66" y="40" width="68" height="42" rx="5" className="pg-bloc" />
            <path d="M74 52 h52 M74 64 h40" className="pg-joint" />
          </g>
          <rect x="82" y="128" width="36" height="16" rx="2" className="pg-bois" />
          <path d="M10 146 H190" className="pg-sol-ligne" />
          <g className="pg-poussiere">
            <circle cx="70" cy="136" r="9" />
            <circle cx="130" cy="136" r="10" />
            <circle cx="100" cy="124" r="8" />
          </g>
          <g className="pg-apparait">
            <rect x="95" y="82" width="10" height="62" rx="2" className="pg-cale" />
          </g>
        </g>
      );
    case 'gaz':
      return (
        <g>
          <rect x="68" y="66" width="64" height="72" rx="16" className="pg-bois pg-vibre" />
          <path d="M70 84 H130 M70 120 H130" className="pg-cercle" />
          <g className="pg-bouchon">
            <rect x="86" y="54" width="28" height="14" rx="4" className="pg-bronze" />
          </g>
          <g className="pg-bouffees">
            <circle cx="92" cy="50" r="10" className="pg-bouffee pg-b1" />
            <circle cx="108" cy="46" r="12" className="pg-bouffee pg-b2" />
            <circle cx="100" cy="40" r="9" className="pg-bouffee pg-b3" />
            <circle cx="84" cy="40" r="8" className="pg-bouffee pg-b4" />
          </g>
          <g className="pg-apparait">
            <rect x="82" y="64" width="36" height="6" rx="3" className="pg-cale" />
          </g>
        </g>
      );
    case 'glyphe':
      return (
        <g>
          <circle cx="100" cy="84" r="30" className="pg-flamme" />
          <g className="pg-glyphe">
            <circle cx="100" cy="84" r="62" className="pg-cercle-rune pg-tourne" />
            <circle cx="100" cy="84" r="50" className="pg-cercle-fin" />
            <polygon points="100,38 114,122 52,70 148,70 86,122" className="pg-etoile" />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i * 30 * Math.PI) / 180;
              return <path key={i} d={`M${100 + Math.sin(a) * 52} ${84 - Math.cos(a) * 52} L${100 + Math.sin(a) * 60} ${84 - Math.cos(a) * 60}`} className="pg-rune" />;
            })}
          </g>
          <g className="pg-apparait">
            <path d="M52 40 L148 128" className="pg-coche" />
          </g>
        </g>
      );
    case 'rouages':
      return (
        <g>
          <g className="pg-roue pg-roue-a" style={{ transformOrigin: '78px 78px' }}>
            <circle cx="78" cy="78" r="38" className="pg-dents" strokeDasharray="6.5 5.44" />
            <circle cx="78" cy="78" r="34" className="pg-bronze" />
            <circle cx="78" cy="78" r="10" className="pg-trou" />
            <path d="M78 52 V104 M52 78 H104" className="pg-joint" />
          </g>
          <g className="pg-roue pg-roue-b" style={{ transformOrigin: '140px 100px' }}>
            <circle cx="140" cy="100" r="24" className="pg-dents" strokeDasharray="5.6 4.5" />
            <circle cx="140" cy="100" r="21" className="pg-metal" />
            <circle cx="140" cy="100" r="7" className="pg-trou" />
            <path d="M140 82 V118 M122 100 H158" className="pg-joint" />
          </g>
          <g className="pg-etincelles">
            <circle cx="112" cy="84" r="2.5" />
            <circle cx="118" cy="72" r="2" />
            <circle cx="108" cy="96" r="2" />
          </g>
          <g className="pg-apparait">
            <rect x="60" y="92" width="96" height="9" rx="3" className="pg-cale" transform="rotate(-24 108 96)" />
          </g>
        </g>
      );
  }
}

/** L'outil : une pointe fine à manche de bois, posée sur le point de travail du mécanisme. */
function Outil({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="piege-outil">
        <path d="M0 0 L38 -32" className="pg-outil-lame" />
        <rect x="34" y="-42" width="30" height="9" rx="4.5" transform="rotate(-40 34 -37)" className="pg-outil-manche" />
      </g>
    </g>
  );
}

export function EcranDesamorcage({ desamorcage: d, onFin }: Props) {
  // Le compte à rebours est le même pour tous les résultats : il ne laisse rien deviner de l'issue.
  const duree = dureeDesamorcage(d.jet.bonus, d.jet.dd);
  const [ecoulees, setEcoulees] = useState(0);
  const fini = ecoulees >= duree;

  useEffect(() => {
    baisserMusique(true);
    return () => baisserMusique(false);
  }, []);

  // Le bruit du résultat, quand le compte à rebours est fini.
  useEffect(() => {
    if (!fini) return;
    const son = sonDuResultat(d);
    if (son) jouerSon(son);
  }, [fini, d]);

  // Une seconde par seconde, jusqu'au résultat, qui reste un instant avant de se fermer.
  useEffect(() => {
    const t = window.setTimeout(fini ? onFin : () => setEcoulees((e) => e + 1), fini ? dureeResultat(d.issue) : MS_PAR_SECONDE);
    return () => window.clearTimeout(t);
  }, [ecoulees, fini, onFin, d.issue]);

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
  const [px, py] = POINT_DE_TRAVAIL[d.mecanisme];
  const jet = d.jet;
  const des = jet.des.length > 1 ? `${jet.des.join(' / ')}` : `${jet.des[0]}`;
  return (
    <div className={`ecran-piege ${fini ? d.issue : 'travail'}`} role="dialog" aria-modal="true" aria-label="Le désamorçage d’un piège">
      <div className="piege-contenu" aria-live="polite">
        <p className="piege-titre">{titreDesamorcage(d.nomHeros, d.piege)}</p>
        <div className="piege-scene">
          <svg className="crochetage-anneau" viewBox="0 0 128 128" aria-hidden>
            <circle cx="64" cy="64" r={RAYON} className="crochetage-anneau-fond" />
            <circle cx="64" cy="64" r={RAYON} className="piege-anneau-reste" strokeDasharray={CIRCONFERENCE} strokeDashoffset={CIRCONFERENCE * (1 - restant / duree)} transform="rotate(-90 64 64)" />
          </svg>
          <svg className={`piege-dessin piege-${d.mecanisme}`} viewBox="0 0 200 160" aria-hidden>
            <Mecanisme type={d.mecanisme} />
            <Outil x={px} y={py} />
          </svg>
          <p className="crochetage-compte">{fini ? '' : restant}</p>
        </div>
        {fini ? (
          <div className="piege-resultat">
            <p className="piege-phrase">{messageFinal(d.mecanisme, d.issue)}</p>
            <p className={`crochetage-jet ${jet.reussite ? 'jet-reussi' : 'jet-rate'}`}>
              {libelleTest(jet.test)} : d20 {des} {jet.bonus >= 0 ? '+' : '−'} {Math.abs(jet.bonus)} = <strong>{jet.total}</strong>
              {jet.ddSecret ? '' : ` contre DD ${jet.dd}`}
              {jet.desavantage ? ' (désavantage : il manque l’outil)' : ''}
            </p>
            {d.issue === 'declenche' && (
              <div className="piege-suites">
                {d.declenchement && <p className="piege-declenchement">{d.declenchement}</p>}
                {d.sauvegarde && (
                  <p className={`crochetage-jet ${d.sauvegarde.reussite ? 'jet-reussi' : 'jet-rate'}`}>
                    {libelleTest(d.sauvegarde.test)} : d20 {d.sauvegarde.des.join(' / ')} {d.sauvegarde.bonus >= 0 ? '+' : '−'} {Math.abs(d.sauvegarde.bonus)} = <strong>{d.sauvegarde.total}</strong> contre DD {d.sauvegarde.dd} —{' '}
                    {d.sauvegarde.reussite ? 'réussie' : 'ratée'}
                  </p>
                )}
                {d.consequences.map((c) => (
                  <p key={c} className="piege-degats">
                    {c}
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="crochetage-reste">{phraseDeTravail(d.mecanisme)}</p>
        )}
        <button type="button" className="bouton-discret crochetage-passer" onClick={onFin}>
          Passer (Échap)
        </button>
      </div>
    </div>
  );
}
