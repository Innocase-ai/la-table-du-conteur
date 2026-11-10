// La boîte de dialogue d'une conversation, posée sur l'illustration du lieu : le portrait et le nom du personnage, ce qu'il
// vient de dire (et ce que le groupe apprend), puis les répliques du joueur, numérotées (touches 1 à 9). « Fin du dialogue »
// referme la conversation. Elle ne connaît aucune commande : les choix sont des propositions du moteur.
import { useEffect, useRef, type ReactNode } from 'react';
import type { Ordre, Proposition } from '@crpg/regles';

interface Props {
  nom: string;
  role: string;
  /** L'URL du portrait, si le monde en a un. */
  portrait?: string;
  /** Ce qui vient de se dire : les entrées du journal rendues par l'écran. */
  children: ReactNode;
  /** Un changement de ce nombre fait défiler le texte vers le bas. */
  nombreEntrees: number;
  choix: Proposition[];
  fin?: Proposition;
  jouer: (o: Ordre) => void;
  /** Demande au conteur de redire la dernière réplique plus simplement ; absent quand le conteur n'est pas disponible. */
  plusSimple?: () => void;
}

export function BoiteDialogue({ nom, role, portrait, children, nombreEntrees, choix, fin, jouer, plusSimple }: Props) {
  const texte = useRef<HTMLDivElement>(null);
  useEffect(() => {
    texte.current?.scrollTo({ top: texte.current.scrollHeight, behavior: 'smooth' });
  }, [nombreEntrees]);

  return (
    <div className="boite-dialogue" role="group" aria-label={`Conversation avec ${nom}`}>
      <div className="boite-entete">
        <div className="boite-portrait" style={portrait ? { backgroundImage: `url(${portrait})` } : undefined} aria-hidden>
          {!portrait && nom.charAt(0)}
        </div>
        <div className="boite-identite">
          <h3>{nom}</h3>
          <small>{role}</small>
        </div>
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
      <ol className="boite-choix" aria-label="Vos répliques">
        {choix.map((p, i) => (
          <li key={`${p.libelle}:${i}`}>
            <button
              type="button"
              className={`boite-choix-bouton${p.detail === 'déjà abordé' ? ' vu' : ''}${p.etiquette ? ' avec-ton' : ''}`}
              title={p.desactivee ?? p.aide}
              disabled={!!p.desactivee}
              onClick={() => p.ordre && jouer(p.ordre)}
            >
              <span className="boite-choix-num">{i + 1}.</span>
              <span className="boite-choix-texte">
                {p.etiquette && <span className="boite-choix-ton">[{p.etiquette}]</span>} {p.libelle}
                {p.detail === 'déjà abordé' && <small> — déjà abordé</small>}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
