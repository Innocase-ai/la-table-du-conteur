// L'en-tête du panneau d'actions du combat : le héros dont c'est le tour (portrait, PV), ses ressources (mouvement, Action,
// Bonus, Réaction, Élan), la consigne, « Fin du tour » bien visible, et un menu ⚙ qui range les réglages (tour auto, héros auto,
// vitesse, son). Il ne connaît aucune règle : tout lui vient de `Combat.tsx`.
import { useEffect, useRef, useState } from 'react';
import { vitesse as vitesseDe, type Carte, type Combattant } from '@crpg/regles';
import { formatMetres } from '../libelles';
import { imageCombattant } from '../visuels';
import { ControleSon } from './ControleSon';
import { Pictogramme } from './Pictogramme';
import './PanneauTour.css';

interface Props {
  /** Le combattant dont c'est le tour, tel qu'il s'affiche (en retard sur le moteur pendant les animations). */
  heros: Combattant;
  /** Le tour affiché : mouvement et actions restantes. */
  finAffichee: boolean;
  /** Les ressources du tour se montrent seulement pour un combattant qui peut agir. */
  peutAgir: boolean;
  /** Les cartes d'élan sont en jeu et ce combattant en a. */
  elan: boolean;
  consigne: string;
  tourJoueur: boolean;
  occupe: boolean;
  termine: boolean;
  /** La carte choisie, s'il y en a une (affiche Valider et Annuler). */
  carte?: Carte;
  nbChoisies: number;
  /** Plus rien d'utile à jouer ce tour-ci : « Fin du tour » se met en avant. */
  toutJoue: boolean;
  herosAuto: boolean;
  rapide: boolean;
  onValider: () => void;
  onAnnuler: () => void;
  onFinTour: () => void;
  onTourAuto: () => void;
  onHerosAuto: () => void;
  onRapide: () => void;
}

const pas = (n: number) => Math.round(n * 10) / 10;

export function PanneauTour({ heros, finAffichee, peutAgir, elan, consigne, tourJoueur, occupe, termine, carte, nbChoisies, toutJoue, herosAuto, rapide, onValider, onAnnuler, onFinTour, onTourAuto, onHerosAuto, onRapide }: Props) {
  const [menu, setMenu] = useState(false);
  const zone = useRef<HTMLDivElement>(null);
  const t = heros.tour;
  const image = imageCombattant(heros);
  const mouvementMax = Math.max(vitesseDe(heros), t.mouvement, 0.1);
  const pvFraction = Math.max(0, Math.min(1, heros.pv / heros.pvMax));

  // Le menu se ferme d'un clic ailleurs ou d'Échap.
  useEffect(() => {
    if (!menu) return;
    const dehors = (e: PointerEvent) => {
      if (zone.current && !zone.current.contains(e.target as Node)) setMenu(false);
    };
    const echap = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    window.addEventListener('pointerdown', dehors);
    window.addEventListener('keydown', echap);
    return () => {
      window.removeEventListener('pointerdown', dehors);
      window.removeEventListener('keydown', echap);
    };
  }, [menu]);

  const actionDispo = t.action || t.attaquesRestantes > 0;
  const finPrete = tourJoueur && !occupe && !carte && toutJoue;

  return (
    <div className={`pt ${tourJoueur && !finAffichee ? 'pt-joueur' : 'pt-ia'}`} ref={zone}>
      <div className="pt-heros">
        {image ? <img className="pt-portrait" src={image} alt="" draggable={false} /> : <span className="pt-portrait pt-portrait-vide" aria-hidden />}
        <div className="pt-identite">
          <strong>{finAffichee ? '—' : heros.nom}</strong>
          {!finAffichee && (
            <span className="pt-pv" title={`${heros.pv} points de vie sur ${heros.pvMax}`}>
              <span className="pt-pv-barre">
                <span style={{ width: `${pvFraction * 100}%` }} className={pvFraction <= 0.25 ? 'critique' : pvFraction <= 0.5 ? 'bas' : ''} />
              </span>
              <span className="pt-pv-texte">
                {heros.pv} / {heros.pvMax}
              </span>
            </span>
          )}
        </div>
        <button type="button" className={`pt-options${menu ? ' actif' : ''}`} aria-expanded={menu} aria-haspopup="true" aria-label="Options du combat" title="Options : tour auto, vitesse, son" onClick={() => setMenu((m) => !m)}>
          ⚙
        </button>
      </div>

      {menu && (
        <div className="pt-menu" role="menu">
          {tourJoueur && !carte && (
            <button type="button" role="menuitem" className="bouton-discret" onClick={() => { setMenu(false); onTourAuto(); }} title="L'IA joue ce tour à votre place">
              Tour auto
            </button>
          )}
          {!termine && (
            <button type="button" role="menuitemcheckbox" aria-checked={herosAuto} className={`bouton-discret ${herosAuto ? 'actif' : ''}`} onClick={onHerosAuto} title="L'IA joue aussi tous les héros (pour observer un combat)">
              Héros auto {herosAuto ? '· activé' : ''}
            </button>
          )}
          {!termine && (
            <button type="button" role="menuitemcheckbox" aria-checked={rapide} className={`bouton-discret ${rapide ? 'actif' : ''}`} onClick={onRapide} title="Accélérer les animations et les tours de l'IA">
              {rapide ? '▶▶ Rapide' : '▶ Normal'}
            </button>
          )}
          <ControleSon />
        </div>
      )}

      {!finAffichee && peutAgir && (
        <div className="pt-ressources">
          <span className="pt-mouvement" title="Mouvement restant ce tour-ci">
            <span className="pt-mouvement-texte">
              ➜ {formatMetres(pas(t.mouvement))} <small>/ {formatMetres(pas(mouvementMax))}</small>
            </span>
            <span className="pt-mouvement-barre">
              <span style={{ width: `${Math.min(100, (t.mouvement / mouvementMax) * 100)}%` }} />
            </span>
          </span>
          <span className="pt-pastilles">
            <span className={`pt-pastille cout-action ${actionDispo ? 'dispo' : ''}`} title="Action">
              <Pictogramme cle="cout:action" taille={12} surFond={actionDispo} />
              Action{t.attaquesRestantes > 0 ? ` · ${t.attaquesRestantes} att.` : ''}
            </span>
            <span className={`pt-pastille cout-bonus ${t.bonus ? 'dispo' : ''}`} title="Action bonus">
              <Pictogramme cle="cout:bonus" taille={12} surFond={t.bonus} />
              Bonus
            </span>
            <span className={`pt-pastille cout-reaction ${heros.ressources.reaction ? 'dispo' : ''}`} title="Réaction">
              <Pictogramme cle="cout:reaction" taille={12} surFond={!!heros.ressources.reaction} />
              Réaction
            </span>
            {elan && (
              <span className={`pt-pastille cout-elan ${!t.elanJoue ? 'dispo' : ''}`} title="Carte d'élan">
                <Pictogramme cle="cout:elan" taille={12} surFond={!t.elanJoue} />
                Élan
              </span>
            )}
          </span>
        </div>
      )}

      <p className="pt-consigne" aria-live="polite">
        {consigne}
      </p>

      <div className="pt-actions">
        {carte && carte.nbCibles > 1 && (
          <button type="button" className="bouton" disabled={!nbChoisies} onClick={onValider}>
            Valider ({nbChoisies}/{carte.nbCibles})
          </button>
        )}
        {carte && (
          <button type="button" className="bouton-discret" onClick={onAnnuler} title="Échap">
            Annuler
          </button>
        )}
        <button type="button" className={`pt-fin${finPrete ? ' pret' : ''}`} disabled={!tourJoueur || occupe} onClick={onFinTour} title="Passer au suivant (touche F)">
          Fin du tour <kbd>F</kbd>
        </button>
      </div>
    </div>
  );
}
