// Lecteur des scènes narrées, plein écran, en deux présentations :
// - « plans » : un plan à la fois (image qui bouge lentement, texte en fondu, voix), le joueur avance ;
// - « film » : la scène d'une traite, comme une vidéo (carton de titre, fondus enchaînés, texte qui défile au rythme
//   de la voix), pour le prologue et les épilogues.
// La voix est l'enregistrement livré avec le monde, sinon la voix de synthèse du système, que le joueur peut couper.
import { type ReactNode, useEffect, useRef, useState } from 'react';
import type { SceneNarree } from '@crpg/regles';
import { manifesteDe, urlImage, urlVoix } from '../mondes';

const CLE_VOIX = 'table-du-conteur:voix-systeme';

function voixSystemeActive(): boolean {
  try {
    return localStorage.getItem(CLE_VOIX) !== 'non';
  } catch {
    return true;
  }
}

/** Une voix française du système, s'il y en a une. */
function voixFrancaise(): SpeechSynthesisVoice | undefined {
  const voix = typeof speechSynthesis !== 'undefined' ? speechSynthesis.getVoices() : [];
  return voix.find((v) => v.lang === 'fr-FR' && /natural|neural|premium|enhanced/i.test(v.name)) ?? voix.find((v) => v.lang.startsWith('fr'));
}

type Plan = SceneNarree['plans'][number];

/** Temps de lecture d'un plan sans voix enregistrée, en secondes. */
const tempsDeLecture = (p: Plan) => p.duree ?? Math.max(5, p.texte.split(/\s+/).length / 2.6);

/**
 * Dit le texte d'un plan : l'enregistrement s'il existe, sinon la synthèse, sinon le temps de lecture ; appelle `fin`
 * une fois le plan dit. Renvoie la progression (0 à 1, pour faire défiler le texte) et de quoi tout arrêter.
 */
function dire(monde: string, nom: string, p: Plan, voixActive: boolean, fin: () => void): { progression: () => number; arreter: () => void } {
  let arrete = false;
  let audio: HTMLAudioElement | undefined;
  const debut = performance.now();
  const lecture = tempsDeLecture(p) * 1000;
  const termine = () => !arrete && fin();
  let minuteur = window.setTimeout(termine, lecture);
  const enregistre = urlVoix(monde, nom);
  if (enregistre && voixActive) {
    window.clearTimeout(minuteur);
    enregistre.then((u) => {
      if (arrete) return;
      audio = new Audio(u);
      audio.onended = termine;
      audio.play().catch(() => {
        audio = undefined;
        minuteur = window.setTimeout(termine, lecture);
      });
    });
  } else if (voixActive && typeof speechSynthesis !== 'undefined') {
    window.clearTimeout(minuteur);
    const u = new SpeechSynthesisUtterance(p.texte);
    u.lang = 'fr-FR';
    const v = voixFrancaise();
    if (v) u.voice = v;
    u.rate = 0.95;
    u.onend = termine;
    u.onerror = () => (minuteur = window.setTimeout(termine, lecture));
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
  return {
    progression: () =>
      audio && audio.duration > 0 && Number.isFinite(audio.duration) ? audio.currentTime / audio.duration : Math.min(1, (performance.now() - debut) / lecture),
    arreter: () => {
      arrete = true;
      window.clearTimeout(minuteur);
      audio?.pause();
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    },
  };
}

/** Les images des plans, d'après le manifeste du monde (indice du plan → URL). */
function useImages(monde: string, scene: SceneNarree): (string | undefined)[] {
  const [images, setImages] = useState<(string | undefined)[]>([]);
  useEffect(() => {
    let actif = true;
    const manifeste = manifesteDe(monde);
    Promise.all(
      scene.plans.map((p) => {
        const fichier = p.image ? manifeste?.[p.image.groupe][p.image.id] : undefined;
        return fichier ? urlImage(monde, fichier) : undefined;
      }),
    ).then((urls) => actif && setImages(urls));
    return () => {
      actif = false;
    };
  }, [monde, scene]);
  return images;
}

interface Props {
  monde: string;
  scene: SceneNarree;
  /** La scène a déjà été vue : le joueur la revoit depuis le journal. */
  revue?: boolean;
  onFin: () => void;
}

export function LecteurScene(props: Props) {
  const [voixActive, setVoixActive] = useState(voixSystemeActive);
  const basculerVoix = () => {
    const v = !voixActive;
    setVoixActive(v);
    try {
      localStorage.setItem(CLE_VOIX, v ? 'oui' : 'non');
    } catch {
      // préférence non retenue : sans importance
    }
  };
  const boutonVoix = (
    <button type="button" className="bouton-discret" onClick={basculerVoix} title="Voix de la narration">
      Voix : {voixActive ? 'oui' : 'non'}
    </button>
  );
  return props.scene.presentation === 'film' ? (
    <Film {...props} voixActive={voixActive} boutonVoix={boutonVoix} />
  ) : (
    <Plans {...props} voixActive={voixActive} boutonVoix={boutonVoix} />
  );
}

interface PropsPresentation extends Props {
  voixActive: boolean;
  boutonVoix: ReactNode;
}

/** Un plan à la fois ; le joueur avance, ou la scène avance seule à la fin de la voix. */
function Plans({ monde, scene, onFin, voixActive, boutonVoix }: PropsPresentation) {
  const [plan, setPlan] = useState(0);
  const images = useImages(monde, scene);
  const p = scene.plans[plan]!;
  const dernier = plan === scene.plans.length - 1;
  const suivant = () => (dernier ? onFin() : setPlan(plan + 1));

  useEffect(() => {
    let suite = 0;
    const d = dire(monde, `${scene.id}-${plan + 1}`, p, voixActive, () => (suite = window.setTimeout(suivant, 1200)));
    return () => {
      d.arreter();
      window.clearTimeout(suite);
    };
  }, [scene.id, plan, voixActive]);

  const image = images[plan];
  return (
    <div className="lecteur-scene" role="dialog" aria-label={scene.nom}>
      <div key={`${plan}-${image ?? ''}`} className={`lecteur-image mouvement-${p.mouvement}`} style={image ? { backgroundImage: `url(${image})` } : undefined} />
      <div className="lecteur-voile" />
      <div className="lecteur-texte">
        <span className="lecteur-titre">{scene.nom}</span>
        <p key={plan}>{p.texte}</p>
        <div className="lecteur-progression">
          {scene.plans.map((_, i) => (
            <span key={i} className={i <= plan ? 'faite' : ''} />
          ))}
        </div>
      </div>
      <div className="lecteur-boutons">
        {boutonVoix}
        <button type="button" className="bouton-discret" onClick={onFin}>
          Passer la scène
        </button>
        <button type="button" className="bouton" onClick={suivant} autoFocus>
          {dernier ? 'Reprendre ›' : 'Suivant ›'}
        </button>
      </div>
    </div>
  );
}

/** Durée du carton de titre et pause entre deux plans, en millisecondes. */
const TITRE_MS = 4200;
const PAUSE_MS = 700;

/** La scène d'une traite : carton de titre, puis chaque plan, le texte défilant au rythme de la voix ; à la fin, le titre revient. */
function Film({ monde, scene, revue, onFin, voixActive, boutonVoix }: PropsPresentation) {
  const [phase, setPhase] = useState<'titre' | 'plans' | 'fin'>('titre');
  const [plan, setPlan] = useState(0);
  const images = useImages(monde, scene);
  const zone = useRef<HTMLDivElement>(null);
  const colonne = useRef<HTMLDivElement>(null);
  const barre = useRef<HTMLDivElement>(null);
  const progression = useRef<() => number>(() => 0);
  const position = useRef<number | undefined>(undefined);
  const n = scene.plans.length;

  // Le carton de titre, puis les plans.
  useEffect(() => {
    if (phase !== 'titre') return;
    const t = window.setTimeout(() => setPhase('plans'), TITRE_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  // Chaque plan est dit, puis le suivant ; après le dernier, la fin.
  useEffect(() => {
    if (phase !== 'plans') return;
    let suite = 0;
    const d = dire(monde, `${scene.id}-${plan + 1}`, scene.plans[plan]!, voixActive, () => {
      progression.current = () => 1;
      suite = window.setTimeout(() => (plan + 1 < n ? setPlan(plan + 1) : setPhase('fin')), PAUSE_MS);
    });
    progression.current = d.progression;
    return () => {
      d.arreter();
      window.clearTimeout(suite);
    };
  }, [phase, plan, voixActive]);

  // Le défilement : le paragraphe dit se tient au milieu de la zone de texte et monte d'une demi-hauteur pendant qu'il
  // est dit (du quart aux trois quarts) ; on y glisse en douceur, y compris d'un paragraphe au suivant.
  useEffect(() => {
    let id = 0;
    const image = () => {
      const z = zone.current;
      const c = colonne.current;
      const el = c?.children[plan] as HTMLElement | undefined;
      if (z && c && el) {
        const f = phase === 'titre' ? 0 : phase === 'fin' ? 1 : progression.current();
        const cible = z.clientHeight * 0.5 - (el.offsetTop + (0.25 + 0.5 * f) * el.offsetHeight);
        position.current = position.current === undefined ? cible : position.current + (cible - position.current) * 0.06;
        c.style.transform = `translateY(${position.current.toFixed(1)}px)`;
        if (barre.current) barre.current.style.width = `${(((phase === 'fin' ? n : plan + (phase === 'plans' ? f : 0)) / n) * 100).toFixed(2)}%`;
      }
      id = requestAnimationFrame(image);
    };
    id = requestAnimationFrame(image);
    return () => cancelAnimationFrame(id);
  }, [phase, plan]);

  const debut = 'debut' in scene.declencheur && !revue;
  return (
    <div className={`lecteur-scene film film-phase-${phase}`} role="dialog" aria-label={scene.nom}>
      {scene.plans.map((p, i) =>
        i <= plan ? (
          <div key={i} className="film-calque">
            <div
              className={`lecteur-image mouvement-${p.mouvement}`}
              style={{ backgroundImage: images[i] ? `url(${images[i]})` : undefined, animationDuration: `${tempsDeLecture(p) + (i === 0 ? TITRE_MS / 1000 : 0) + 6}s` }}
            />
          </div>
        ) : null,
      )}
      <div className="film-voile" />
      <div className="film-carton" aria-hidden={phase === 'plans'}>
        <h1>{scene.nom}</h1>
      </div>
      <div className="film-zone" ref={zone} aria-live="polite">
        <div className="film-colonne" ref={colonne}>
          {scene.plans.map((p, i) => (
            <p key={i} className={i < plan || phase === 'fin' ? 'lu' : i === plan && phase === 'plans' ? 'en-cours' : 'a-venir'}>
              {p.texte}
            </p>
          ))}
        </div>
      </div>
      <div className="film-barre">
        <div ref={barre} />
      </div>
      <div className="lecteur-boutons">
        {boutonVoix}
        {phase === 'fin' ? (
          <button type="button" className="bouton" onClick={onFin} autoFocus>
            {debut ? 'Commencer l’aventure ›' : 'Reprendre ›'}
          </button>
        ) : (
          <button type="button" className="bouton-discret" onClick={onFin}>
            Passer ›
          </button>
        )}
      </div>
    </div>
  );
}
