// L'écran d'une rencontre qui se présente : l'illustration du lieu assombrie, le nom et le danger, l'introduction, une carte
// par créature (portrait du bestiaire, nombre, apparence, le chef mis en avant), puis les choix : combattre, les autres
// issues (compétence, DD, qui le tenterait), se replier. Les créatures se dévoilent une à une ; « Combattre » dégaine
// (son, fondu) avant d'ouvrir le plateau. Il ne connaît aucune règle : tout vient de la vue `rencontre` et des propositions.
import { useEffect, useState } from 'react';
import type { EvenementJeu, Ordre, PresentationRencontre, Proposition } from '@crpg/regles';
import { DANGERS, libelleJetAnnonce, ordreDesChoix, suitesDeRencontre } from '../rencontre-regles';
import { jouerSon } from '../sons';
import { imageMonstre } from '../visuels';
import './EcranRencontre.css';

interface Props {
  rencontre: PresentationRencontre;
  /** L'illustration du lieu (URL), s'il y en a une. */
  image?: string;
  /** Les propositions de la rencontre (panneau `rencontre`). */
  propositions: Proposition[];
  journal: EvenementJeu[];
  refus?: string;
  jouer: (o: Ordre) => void;
  onCombat: () => void;
  /** Mettre l'écran de côté (voir le groupe, la carte) ; un bouton le rappelle. */
  onReduire: () => void;
}

/** Durée du fondu de « Combattre » avant d'ouvrir le plateau (ms) ; nulle si le joueur réduit les animations. */
const DUREE_DEGAINER = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 550;

export function EcranRencontre({ rencontre, image, propositions, journal, refus, jouer, onCombat, onReduire }: Props) {
  const [degaine, setDegaine] = useState(false);
  const choix = ordreDesChoix(propositions);
  const suites = suitesDeRencontre(journal, rencontre.nom);
  const danger = DANGERS[rencontre.difficulte];

  const agir = (p: Proposition) => {
    if (p.desactivee || degaine) return;
    if (p.intention === 'combattre') {
      setDegaine(true);
      jouerSon('epee', 0.8);
      window.setTimeout(onCombat, DUREE_DEGAINER);
    } else if (p.ordre) jouer(p.ordre);
  };

  // Touches 1 à 9 : les choix dans l'ordre affiché ; Échap met l'écran de côté.
  useEffect(() => {
    const f = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const cible = ev.target as HTMLElement | null;
      if (cible && (/^(input|textarea|select)$/i.test(cible.tagName) || cible.isContentEditable)) return;
      if (ev.key === 'Escape') return onReduire();
      const n = Number(ev.key);
      const p = Number.isInteger(n) && n >= 1 ? choix[n - 1] : undefined;
      if (p) agir(p);
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  });

  return (
    <div className={`rencontre-ecran${degaine ? ' rencontre-degaine' : ''}`} role="dialog" aria-modal="true" aria-labelledby="rencontre-titre">
      <div className="rencontre-cadre">
        <header className="rencontre-image" style={image ? { backgroundImage: `url(${image})` } : undefined}>
          <div className="rencontre-titres">
            <span className="rencontre-lieu">{rencontre.lieu.nom}</span>
            <h1 id="rencontre-titre">{rencontre.nom}</h1>
          </div>
          <span className={`rencontre-danger danger-${danger.ton}`}>{danger.libelle}</span>
          <button type="button" className="rencontre-reduire" onClick={onReduire} title="Voir le groupe et le récit (Échap)">
            Voir le groupe
          </button>
        </header>

        <p className="rencontre-intro">{rencontre.intro}</p>

        {rencontre.monstres.length > 0 && (
          <ul className="rencontre-creatures" aria-label="Les créatures">
            {rencontre.monstres.map((m, i) => {
              const portrait = imageMonstre(m.profil);
              return (
                <li key={`${m.profil}:${m.nom}`} className={`rencontre-creature${m.chef ? ' creature-chef' : ''}`} style={{ animationDelay: `${0.25 + i * 0.22}s` }}>
                  <div className="creature-portrait" style={portrait ? { backgroundImage: `url(${portrait})` } : undefined} aria-hidden>
                    {m.nombre > 1 && <span className="creature-nombre">×{m.nombre}</span>}
                    {m.chef && <span className="creature-couronne">Chef</span>}
                  </div>
                  <strong>{m.nom}</strong>
                  {m.description && <p>{m.description}</p>}
                </li>
              );
            })}
          </ul>
        )}

        {(suites.length > 0 || refus) && (
          <div className="rencontre-suites" aria-live="polite">
            {suites.map((s, i) => (
              <p key={i}>{s}</p>
            ))}
            {refus && <p className="recit-refus">{refus}</p>}
          </div>
        )}

        <div className="rencontre-choix">
          {choix.map((p, i) => (
            <button
              key={`${p.libelle}:${i}`}
              type="button"
              className={p.intention === 'combattre' ? 'rencontre-combattre' : p.style === 'discret' ? 'bouton-discret' : 'bouton'}
              disabled={!!p.desactivee || degaine}
              title={p.desactivee ?? p.aide}
              onClick={() => agir(p)}
            >
              <span className="rencontre-touche">{i + 1}</span>
              <span className="rencontre-libelle">
                {p.libelle}
                {p.jet && <small>{libelleJetAnnonce(p.jet)}</small>}
                {p.desactivee && <small>{p.desactivee}</small>}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
