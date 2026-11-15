// Écran Options : taille du texte, réduction des animations, et l'état du conteur (modèle, plafond de dépense, clé).
// Sécurité : l'écran ne lit ni n'affiche jamais la valeur d'une clé d'API ; il ne montre que ce que le relais du jeu
// publie (`/api/conteur/etat` : branché ou non, modèle, dépense, plafond).
import { useCallback, useEffect, useState } from 'react';
import { etatConteur, type EtatConteur } from '../aventure/conteur';
import {
  ECHELLES_TEXTE,
  animationsReduites,
  appliquerOptions,
  lireOptions,
  resumerConteur,
  sauverOptions,
  systemeReduitLesMouvements,
  type EchelleTexte,
  type Options,
} from '../options/options-regles';
import { SectionTempsDeJeu } from './SectionTempsDeJeu';
import '../options/options.css';

const dollars = (x: number) => `${x.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })} $`;

export function EcranOptions({ onRetour }: { onRetour: () => void }) {
  const [options, setOptions] = useState<Options>(() => lireOptions());
  const [memorise, setMemorise] = useState(true);
  const [conteur, setConteur] = useState<EtatConteur | undefined>();
  const [attente, setAttente] = useState(true);
  const systeme = systemeReduitLesMouvements();

  const regler = (suite: Partial<Options>) => {
    const prochaines = { ...options, ...suite };
    setOptions(prochaines);
    appliquerOptions(prochaines);
    setMemorise(sauverOptions(prochaines));
  };

  const actualiser = useCallback(() => {
    setAttente(true);
    void etatConteur().then((e) => {
      setConteur(e);
      setAttente(false);
    });
  }, []);
  useEffect(actualiser, [actualiser]);

  useEffect(() => {
    const f = (e: KeyboardEvent) => e.key === 'Escape' && onRetour();
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [onRetour]);

  const reduit = animationsReduites(options, systeme);
  const resume = resumerConteur(conteur);

  return (
    <div className="options">
      <header className="ecran-entete">
        <button type="button" className="bouton-discret" onClick={onRetour}>
          ‹ Menu
        </button>
        <h1>Options</h1>
      </header>

      <div className="options-corps">
        <section className="options-bloc" aria-labelledby="options-affichage">
          <h2 id="options-affichage">Affichage</h2>

          <div className="options-ligne">
            <div className="options-texte">
              <span className="options-nom" id="options-taille">
                Taille du texte
              </span>
              <p className="options-aide">Agrandit tout le jeu : récits, boutons, fiches, cartes de combat.</p>
            </div>
            <div className="segments" role="group" aria-labelledby="options-taille">
              {ECHELLES_TEXTE.map((n) => (
                <button key={n} type="button" className={options.echelleTexte === n ? 'actif' : ''} aria-pressed={options.echelleTexte === n} onClick={() => regler({ echelleTexte: n as EchelleTexte })}>
                  {n} %
                </button>
              ))}
            </div>
          </div>
          <p className="options-exemple" aria-label="Exemple de texte à la taille choisie">
            « La porte s'ouvre en grinçant sur une salle froide ; au fond, une lueur bleue danse sur les dalles. »
          </p>

          <div className="options-ligne">
            <div className="options-texte">
              <span className="options-nom" id="options-animations">
                Réduire les animations
              </span>
              <p className="options-aide">
                Supprime les mouvements d'effets, de cartes et de transitions. Sans réglage de votre part, le jeu suit celui de votre système
                {systeme ? ' (actuellement : animations réduites)' : ''}.
              </p>
            </div>
            <button
              type="button"
              className={`options-interrupteur ${reduit ? 'actif' : ''}`}
              role="switch"
              aria-checked={reduit}
              aria-labelledby="options-animations"
              onClick={() => regler({ reduireAnimations: !reduit })}
            >
              <span className="options-interrupteur-bille" />
              <span className="options-interrupteur-etat">{reduit ? 'Oui' : 'Non'}</span>
            </button>
          </div>

          {!memorise && (
            <p className="options-alerte" role="status">
              Le navigateur refuse de garder ces réglages : ils valent pour cette session seulement.
            </p>
          )}
        </section>

        <section className="options-bloc" aria-labelledby="options-conteur">
          <h2 id="options-conteur">Le conteur</h2>
          <p className="options-aide">Le conteur est le maître de jeu IA : il répond à la saisie libre et aux dialogues. Le moteur du jeu, lui, décide toujours des règles.</p>

          <dl className="options-etat">
            <div>
              <dt>État</dt>
              <dd>
                {attente ? (
                  'Vérification…'
                ) : resume ? (
                  <>
                    <span className={`options-pastille ${resume.etat === 'ok' ? 'options-pastille-ok' : 'options-pastille-absent'}`}>{resume.etat === 'ok' ? 'Branché' : 'Non branché'}</span>
                    <span className="options-aide options-etat-texte">{resume.libelle}</span>
                  </>
                ) : null}
              </dd>
            </div>
            {!attente && resume?.etat === 'ok' && (
              <>
                <div>
                  <dt>Modèle</dt>
                  <dd>{resume.modele ?? '—'}</dd>
                </div>
                <div>
                  <dt>Dépense de la session</dt>
                  <dd>
                    {resume.depense !== undefined ? dollars(resume.depense) : '—'}
                    {resume.plafond !== undefined && <> sur un plafond de {dollars(resume.plafond)}</>}
                  </dd>
                </div>
                {resume.part !== undefined && (
                  <div className="options-jauge" role="progressbar" aria-label="Part du plafond de dépense utilisée" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(resume.part * 100)}>
                    <span style={{ width: `${Math.round(resume.part * 100)}%` }} className={resume.part >= 0.9 ? 'options-jauge-pleine' : ''} />
                  </div>
                )}
              </>
            )}
          </dl>

          <div className="options-cle">
            <h3>Clé d'API</h3>
            <p className="options-aide">
              La clé de votre compte OpenRouter n'est jamais affichée ici, ni écrite dans le jeu. Aujourd'hui, le serveur du jeu la lit dans le fichier <code>.env</code>
              {' '}(variable <code>OPENROUTER_API_KEY</code>) et le jeu ne fait que lui poser des questions. Dans l'application de bureau, la saisie de la clé arrivera ici, et la clé sera gardée
              dans le trousseau de votre système.
            </p>
            <p className="options-aide">Le modèle et le plafond de dépense sont fixés par le relais du conteur ; ils deviendront réglables ici avec la clé du joueur.</p>
          </div>

          <button type="button" className="bouton" onClick={actualiser} disabled={attente}>
            Actualiser l'état
          </button>
        </section>

        <SectionTempsDeJeu />
      </div>
    </div>
  );
}
