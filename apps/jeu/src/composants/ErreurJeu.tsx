// Filet de sécurité de l'écran : une erreur d'affichage montre une page lisible au lieu d'un écran blanc, avec de quoi
// garder la partie (fichier) et envoyer un rapport. La partie sauvegardée n'est pas touchée : elle date de la dernière action.
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { CLE_SAUVEGARDE, nomFichierPartie, resumeSauvegarde, telechargerTexte } from '../aventure/partie';

interface Etat {
  erreur?: Error;
  pile?: string;
  copie?: boolean;
}

/** Le texte du rapport d'erreur : message, pile, page, navigateur, date. Rien de personnel (ni clé, ni sauvegarde). */
export function rapportDErreur(erreur: Error, pileComposants?: string): string {
  return [
    `La Table du Conteur — rapport d'erreur du ${new Date().toISOString()}`,
    `Erreur : ${erreur.message}`,
    '',
    erreur.stack ?? '(pas de pile)',
    pileComposants ? `\nComposants :${pileComposants}` : '',
    '',
    `Page : ${window.location.pathname}${window.location.search}`,
    `Navigateur : ${navigator.userAgent}`,
  ].join('\n');
}

export class ErreurJeu extends Component<{ children: ReactNode }, Etat> {
  state: Etat = {};

  static getDerivedStateFromError(erreur: Error): Etat {
    return { erreur };
  }

  componentDidCatch(erreur: Error, info: ErrorInfo): void {
    console.error('Erreur de l’écran', erreur, info.componentStack);
    this.setState({ pile: info.componentStack ?? undefined });
  }

  render(): ReactNode {
    const { erreur, pile, copie } = this.state;
    if (!erreur) return this.props.children;
    const rapport = rapportDErreur(erreur, pile);
    const sauvegarde = resumeSauvegarde(CLE_SAUVEGARDE);
    return (
      <div className="erreur-jeu" role="alert">
        <div className="erreur-jeu-carte">
          <h1>Le jeu a rencontré une erreur</h1>
          <p>
            {sauvegarde
              ? `Votre partie est sauvegardée telle qu’elle était à la dernière action (jour ${sauvegarde.jour}). Vous pouvez la garder dans un fichier par précaution, puis recharger le jeu.`
              : 'Rechargez le jeu pour reprendre.'}
          </p>
          <div className="erreur-jeu-boutons">
            <button type="button" className="bouton-principal bouton-moyen" onClick={() => window.location.reload()}>
              Recharger le jeu
            </button>
            {sauvegarde && (
              <button type="button" className="bouton" onClick={() => telechargerTexte(sauvegarde.texte, nomFichierPartie(sauvegarde.monde, sauvegarde.jour))}>
                Enregistrer la partie dans un fichier
              </button>
            )}
            <button
              type="button"
              className="bouton"
              onClick={() =>
                navigator.clipboard?.writeText(rapport).then(
                  () => this.setState({ copie: true }),
                  () => telechargerTexte(rapport, 'rapport-erreur.txt'),
                )
              }
            >
              {copie ? 'Rapport copié' : 'Copier le rapport'}
            </button>
          </div>
          <details>
            <summary>Détail technique</summary>
            <pre>{rapport}</pre>
          </details>
        </div>
      </div>
    );
  }
}
