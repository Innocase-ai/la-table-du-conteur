// Les sauvegardes, depuis l'écran titre : garder la partie dans un fichier, en charger une, revenir à la partie d'avant
// (gardée quand une nouvelle histoire a commencé), récupérer une sauvegarde qui ne se lisait plus.
import { useRef, useState } from 'react';
import { CLE_ILLISIBLE, CLE_PRECEDENTE, CLE_SAUVEGARDE, importerPartie, nomFichierPartie, restaurerPartiePrecedente, resumeSauvegarde, telechargerTexte } from '../aventure/partie';
import { histoires } from '../mondes';

const nomMonde = (id: string) => histoires().find((h) => h.monde.id === id)?.monde.nom ?? id;

export function Sauvegardes() {
  const [ouvert, setOuvert] = useState(false);
  const [message, setMessage] = useState<{ texte: string; erreur?: boolean }>();
  const fichier = useRef<HTMLInputElement>(null);
  const actuelle = resumeSauvegarde(CLE_SAUVEGARDE);
  const precedente = resumeSauvegarde(CLE_PRECEDENTE);
  let illisible: string | undefined;
  try {
    illisible = localStorage.getItem(CLE_ILLISIBLE) ?? undefined;
  } catch {
    illisible = undefined;
  }

  /** Après un changement de la sauvegarde, on relance le jeu pour qu'il la relise proprement. */
  const relancer = (texte: string) => {
    setMessage({ texte });
    window.setTimeout(() => window.location.reload(), 900);
  };

  const charger = async (f: File | undefined) => {
    if (!f) return;
    const erreur = importerPartie(await f.text());
    if (fichier.current) fichier.current.value = '';
    if (erreur) setMessage({ texte: erreur, erreur: true });
    else relancer('Partie chargée. La partie d’avant est gardée comme « précédente ».');
  };

  return (
    <div className="titre-sauvegardes">
      <button type="button" className="lien-credits" aria-expanded={ouvert} onClick={() => setOuvert((o) => !o)}>
        Sauvegardes
      </button>
      {ouvert && (
        <div className="titre-sauvegardes-volet" role="dialog" aria-label="Sauvegardes">
          <p>{actuelle ? `Partie en cours : ${nomMonde(actuelle.monde)}, jour ${actuelle.jour}.` : 'Aucune partie en cours.'}</p>
          {actuelle && (
            <button type="button" className="bouton" onClick={() => telechargerTexte(actuelle.texte, nomFichierPartie(actuelle.monde, actuelle.jour))}>
              Enregistrer la partie dans un fichier
            </button>
          )}
          <button type="button" className="bouton" onClick={() => fichier.current?.click()}>
            Charger une partie depuis un fichier
          </button>
          <input ref={fichier} type="file" accept=".json,application/json" hidden onChange={(e) => void charger(e.target.files?.[0])} />
          {precedente && (
            <button type="button" className="bouton" onClick={() => restaurerPartiePrecedente() && relancer('Partie précédente restaurée.')}>
              Revenir à la partie précédente ({nomMonde(precedente.monde)}, jour {precedente.jour})
            </button>
          )}
          {illisible && (
            <button type="button" className="bouton" onClick={() => telechargerTexte(illisible!, 'partie-illisible.json')}>
              Enregistrer la sauvegarde illisible dans un fichier
            </button>
          )}
          {message && <div className={`bandeau ${message.erreur ? 'bandeau-erreur' : 'bandeau-info'}`}>{message.texte}</div>}
        </div>
      )}
    </div>
  );
}
