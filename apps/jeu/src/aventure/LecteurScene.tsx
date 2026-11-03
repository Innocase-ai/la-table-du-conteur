// Lecteur des scènes narrées : plein écran, une image du monde qui bouge lentement, le texte en fondu, et la voix
// (l'enregistrement livré avec le monde, sinon la voix de synthèse du système, que le joueur peut couper).
import { useEffect, useState } from 'react';
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

interface Props {
  monde: string;
  scene: SceneNarree;
  onFin: () => void;
}

export function LecteurScene({ monde, scene, onFin }: Props) {
  const [plan, setPlan] = useState(0);
  const [image, setImage] = useState<string>();
  const [voixActive, setVoixActive] = useState(voixSystemeActive);
  const p = scene.plans[plan]!;
  const dernier = plan === scene.plans.length - 1;
  const suivant = () => (dernier ? onFin() : setPlan(plan + 1));

  // L'image du plan, d'après le manifeste du monde.
  useEffect(() => {
    let actif = true;
    const fichier = p.image ? manifesteDe(monde)?.[p.image.groupe][p.image.id] : undefined;
    if (fichier) urlImage(monde, fichier)?.then((u) => actif && setImage(u));
    return () => {
      actif = false;
    };
  }, [monde, p]);

  // La voix : l'enregistrement s'il existe, sinon la synthèse ; à défaut, le temps de lecture. Puis le plan suivant.
  useEffect(() => {
    let fini = false;
    let audio: HTMLAudioElement | undefined;
    const lecture = (p.duree ?? Math.max(5, p.texte.split(/\s+/).length / 2.6)) * 1000;
    let minuteur = window.setTimeout(() => !fini && suivant(), lecture + 1500);
    const apres = () => {
      if (fini) return;
      window.clearTimeout(minuteur);
      minuteur = window.setTimeout(() => !fini && suivant(), 1200);
    };
    const enregistre = urlVoix(monde, `${scene.id}-${plan + 1}`);
    if (enregistre && voixActive) {
      window.clearTimeout(minuteur);
      enregistre.then((u) => {
        if (fini) return;
        audio = new Audio(u);
        audio.onended = apres;
        audio.play().catch(() => (minuteur = window.setTimeout(() => !fini && suivant(), lecture)));
      });
    } else if (voixActive && typeof speechSynthesis !== 'undefined') {
      window.clearTimeout(minuteur);
      const u = new SpeechSynthesisUtterance(p.texte);
      u.lang = 'fr-FR';
      const v = voixFrancaise();
      if (v) u.voice = v;
      u.rate = 0.95;
      u.onend = apres;
      u.onerror = () => (minuteur = window.setTimeout(() => !fini && suivant(), lecture));
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }
    return () => {
      fini = true;
      window.clearTimeout(minuteur);
      audio?.pause();
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    };
  }, [scene.id, plan, voixActive]);

  const basculerVoix = () => {
    const v = !voixActive;
    setVoixActive(v);
    try {
      localStorage.setItem(CLE_VOIX, v ? 'oui' : 'non');
    } catch {
      // préférence non retenue : sans importance
    }
  };

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
        <button type="button" className="bouton-discret" onClick={basculerVoix} title="Voix de la narration">
          Voix : {voixActive ? 'oui' : 'non'}
        </button>
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
