// La boîte de dialogue d'une conversation, posée sur l'illustration du lieu : le portrait, le nom et l'attitude du personnage
// (badge et jauge), tout l'échange en cours (la dernière réplique du personnage est mise en avant), puis les répliques du
// joueur, numérotées (touches 1 à 9), les sujets d'un côté et, à part, « Peser sur son attitude » : chaque jet d'influence y
// annonce sa compétence, son DD, son meilleur orateur et son bonus, l'Avantage ou le Désavantage. « Fin du dialogue » referme la
// conversation. Un panneau peut s'ouvrir à côté (la vitrine d'un marchand). Elle ne connaît aucune commande : les choix sont des
// propositions du moteur.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Ordre, Proposition } from '@crpg/regles';
import { Pictogramme } from '../composants/Pictogramme';
import { jetAnnonce } from './conversation-regles';

/** Le degré d'attitude du personnage, tel que le moteur le calcule (`Interlocuteur`). */
export interface AttitudeAffichee {
  niveau: 'hostile' | 'mefiant' | 'neutre' | 'bienveillant' | 'amical';
  libelle: string;
  /** La valeur brute (−100 à 100) : la jauge et l'infobulle. */
  valeur: number;
  mode?: 'avantage' | 'desavantage';
}

interface Props {
  nom: string;
  role: string;
  /** L'URL du portrait, si le monde en a un. */
  portrait?: string;
  attitude?: AttitudeAffichee;
  /** Tout l'échange de la conversation en cours : les entrées du journal rendues par l'écran (la dernière réplique du personnage porte la classe `dialogue-derniere`). */
  children: ReactNode;
  /** Un changement de ce nombre fait défiler le texte jusqu'à la dernière réponse. */
  nombreEntrees: number;
  choix: Proposition[];
  fin?: Proposition;
  jouer: (o: Ordre) => void;
  /** Demande au conteur de redire la dernière réplique plus simplement ; absent quand le conteur n'est pas disponible. */
  plusSimple?: () => void;
  /** Un panneau qui s'ouvre à côté du dialogue (la boutique d'un marchand) ; `libelle` est celui de son bouton. Absent : pas de bouton. */
  panneau?: { libelle: string; contenu: (fermer: () => void) => ReactNode };
  /** Identifie la conversation : un nouveau personnage referme le panneau. */
  cle?: string;
}

const MODES = {
  avantage: 'Avantage : il vous apprécie, vos jets d’influence se font avec Avantage',
  desavantage: 'Désavantage : il vous méprise, vos jets d’influence se font avec Désavantage',
} as const;

/** En dessous de cette largeur (px), la boutique remplace le dialogue au lieu de s'ouvrir à côté. */
const LARGEUR_MINI_VITRINE = 680;

const estInfluence = (p: Proposition) => p.ordre?.type === 'influencer';

export function BoiteDialogue({ nom, role, portrait, attitude, children, nombreEntrees, choix, fin, jouer, plusSimple, panneau, cle }: Props) {
  const texte = useRef<HTMLDivElement>(null);
  const [panneauOuvert, setPanneauOuvert] = useState(false);
  const [influenceOuverte, setInfluenceOuverte] = useState(true);
  // Étroite : la boutique prend toute la place de la boîte au lieu de s'ouvrir à côté du dialogue.
  const racine = useRef<HTMLDivElement>(null);
  const [etroite, setEtroite] = useState(false);
  useEffect(() => {
    const el = racine.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const mesure = () => setEtroite(el.clientWidth < LARGEUR_MINI_VITRINE);
    mesure();
    const o = new ResizeObserver(mesure);
    o.observe(el);
    return () => o.disconnect();
  }, []);
  // La boutique ne reste pas ouverte d'un personnage à l'autre.
  useEffect(() => setPanneauOuvert(false), [cle]);
  // Échap ferme d'abord le panneau (la boutique), et ne met fin au dialogue qu'au second appui.
  useEffect(() => {
    if (!panneauOuvert) return;
    const surTouche = (ev: KeyboardEvent) => {
      // Les touches 1 à 9 ne choisissent pas de réplique pendant qu'on regarde la boutique (elles pourraient viser une réplique cachée).
      if (/^[1-9]$/.test(ev.key) && !(ev.target instanceof HTMLElement && (/^(input|textarea|select)$/i.test(ev.target.tagName) || ev.target.isContentEditable))) return ev.stopPropagation();
      if (ev.key !== 'Escape') return;
      ev.stopPropagation();
      setPanneauOuvert(false);
    };
    window.addEventListener('keydown', surTouche, true);
    return () => window.removeEventListener('keydown', surTouche, true);
  }, [panneauOuvert]);
  // Chaque nouvelle entrée ramène la dernière réponse du personnage en haut du texte (le début de ce qui vient d'être dit),
  // sans effacer ce qui précède : on peut remonter relire. Sans réponse, on descend au bas du texte.
  useEffect(() => {
    const zone = texte.current;
    if (!zone) return;
    const derniere = zone.querySelector<HTMLElement>('.dialogue-derniere');
    const bas = Math.max(0, zone.scrollHeight - zone.clientHeight);
    let haut = bas;
    if (derniere) {
      const debut = Math.max(0, derniere.offsetTop - zone.offsetTop - 2);
      // Une longue réponse se lit depuis son début ; sinon on montre son début si tout ce qui la suit (jet, faits appris) tient dans la boîte, et la fin du texte sinon.
      haut = derniere.offsetHeight >= zone.clientHeight * 0.8 || zone.scrollHeight - debut <= zone.clientHeight ? debut : bas;
    }
    zone.scrollTo({ top: haut, behavior: 'smooth' });
  }, [nombreEntrees]);

  const numerotes = choix.map((p, i) => ({ p, num: i + 1 }));
  const sujets = numerotes.filter((x) => !estInfluence(x.p));
  const influences = numerotes.filter((x) => estInfluence(x.p));

  return (
    <div ref={racine} className={`boite-dialogue${panneau && panneauOuvert ? ' avec-vitrine' : ''}${etroite ? ' etroite' : ''}`} role="group" aria-label={`Conversation avec ${nom}`}>
      <div className="dialogue-colonne">
        <div className="boite-entete">
          <div className="boite-portrait" style={portrait ? { backgroundImage: `url(${portrait})` } : undefined} aria-hidden>
            {!portrait && nom.charAt(0)}
          </div>
          <div className="boite-identite">
            <h3>{nom}</h3>
            <small>{role}</small>
            {attitude && (
              <span className="dialogue-attitude-ligne">
                <span
                  className={`dialogue-attitude dialogue-attitude-${attitude.niveau}`}
                  title={`Attitude ${attitude.valeur > 0 ? '+' : ''}${attitude.valeur}${attitude.mode ? ` — ${MODES[attitude.mode]}` : ' — ni Avantage ni Désavantage aux jets d’influence'}`}
                >
                  {attitude.libelle}
                </span>
                <span className="dialogue-jauge" role="img" aria-label={`Attitude ${attitude.valeur}`}>
                  <i style={{ left: `${Math.min(100, Math.max(0, (attitude.valeur + 100) / 2))}%` }} />
                </span>
              </span>
            )}
          </div>
          {panneau && (
            <button type="button" className={`boite-fin dialogue-boutique${panneauOuvert ? ' ouverte' : ''}`} aria-expanded={panneauOuvert} onClick={() => setPanneauOuvert(!panneauOuvert)}>
              {panneau.libelle}
            </button>
          )}
          {plusSimple && (
            <button type="button" className="boite-fin boite-simple" title="Le personnage redit sa dernière réplique avec des mots plus simples (un tour du conteur)" onClick={plusSimple}>
              Dis-le plus simplement
            </button>
          )}
          {fin?.ordre && (
            <button type="button" className="boite-fin" title="Échap" onClick={() => jouer(fin.ordre!)}>
              {fin.libelle}
            </button>
          )}
        </div>
        <div className="boite-texte" ref={texte} aria-live="polite">
          {children}
        </div>
        <div className="dialogue-reponses">
          <ol className="boite-choix" aria-label="Vos répliques">
            {sujets.map(({ p, num }) => (
              <li key={`${p.libelle}:${num}`}>
                <button
                  type="button"
                  className={`boite-choix-bouton${p.detail === 'déjà abordé' ? ' vu' : ''}${p.etiquette ? ' avec-ton' : ''}`}
                  title={p.desactivee ?? p.aide}
                  disabled={!!p.desactivee}
                  onClick={() => p.ordre && jouer(p.ordre)}
                >
                  <span className="boite-choix-num">{num}.</span>
                  <span className="boite-choix-texte">
                    {p.etiquette && <span className="boite-choix-ton">[{p.etiquette}]</span>} {p.libelle}
                    {p.detail === 'déjà abordé' && <small> — déjà abordé</small>}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          {influences.length > 0 && (
            <section className="dialogue-influence" aria-label="Peser sur son attitude">
              <button type="button" className="dialogue-influence-titre" aria-expanded={influenceOuverte} onClick={() => setInfluenceOuverte(!influenceOuverte)}>
                <span aria-hidden>{influenceOuverte ? '▾' : '▸'}</span> Peser sur son attitude
                {attitude?.mode && <span className={`dialogue-mode dialogue-mode-${attitude.mode}`}>{attitude.mode === 'avantage' ? 'Avantage' : 'Désavantage'}</span>}
                <small>{influences.length} manière{influences.length > 1 ? 's' : ''}</small>
              </button>
              {influenceOuverte && (
                <ol className="dialogue-influence-liste">
                  {influences.map(({ p, num }) => {
                    const jet = p.jet ? jetAnnonce(p.jet) : undefined;
                    return (
                      <li key={`${p.libelle}:${num}`}>
                        <button type="button" className="dialogue-influence-bouton" title={p.desactivee ?? p.aide} disabled={!!p.desactivee} onClick={() => p.ordre && jouer(p.ordre)}>
                          <span className="boite-choix-num">{num}.</span>
                          <span className="dialogue-influence-texte">
                            <span className="dialogue-influence-phrase">
                              {p.icone && <Pictogramme cle={p.icone} taille={16} />}
                              {p.etiquette && <span className="boite-choix-ton">[{p.etiquette}]</span>} {p.libelle}
                            </span>
                            {(jet || p.desactivee) && (
                              <span className="dialogue-jet">
                                {jet && (
                                  <span className={`dialogue-jet-puce${jet.mode ? ` dialogue-jet-${jet.mode === 'Avantage' ? 'avantage' : 'desavantage'}` : ''}`}>
                                    <span aria-hidden>⚄</span> {jet.texte}
                                  </span>
                                )}
                                {p.desactivee && <span className="dialogue-jet-attente">{p.desactivee}</span>}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          )}
        </div>
      </div>
      {panneau && panneauOuvert && <div className="dialogue-panneau">{panneau.contenu(() => setPanneauOuvert(false))}</div>}
    </div>
  );
}
