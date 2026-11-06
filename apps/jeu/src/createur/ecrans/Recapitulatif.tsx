import { NOMS_ETAPES, type Etape } from '@crpg/regles';
import { ALIGNEMENTS_INFO } from '../descriptions';
import { bilanBrouillon } from '../brouillon';
import { FichePerso } from '../FichePerso';
import { Portrait } from '../ui';
import type { PropsEcran } from './commun';

export function EcranRecapitulatif({ b, donnees, aller }: PropsEcran & { aller: (e: Etape) => void }) {
  const bilan = bilanBrouillon(b, donnees);
  const { choix, identite } = b;
  const classe = choix.classe ? donnees.classes.get(choix.classe) : undefined;
  const espece = choix.espece ? donnees.especes.get(choix.espece) : undefined;
  const historique = choix.historique ? donnees.historiques.get(choix.historique) : undefined;
  return (
    <div className="ecran ecran-recap">
      <header className="recap-entete">
        <Portrait id={identite.portrait} espece={choix.espece} classe={choix.classe} taille={72} />
        <div>
          <h2>{identite.nom.trim() || 'Sans nom'}</h2>
          <p>
            {espece?.nom ?? '—'} · {classe?.nom ?? '—'}
            {bilan.fiche?.sousClasse && classe ? ` (${classe.sousClasse.nom})` : ''} · niveau {choix.niveau}
          </p>
          <p className="fp-meta">
            {historique?.nom ?? '—'} · {identite.alignement ? ALIGNEMENTS_INFO[identite.alignement].nom : 'alignement non choisi'}
            {identite.caractere.trim() && <> · « {identite.caractere.trim()} »</>}
          </p>
        </div>
        <div className={`recap-etat ${bilan.complet ? 'recap-complet' : 'recap-incomplet'}`}>{bilan.complet ? '✓ Prêt à être enregistré' : 'Personnage incomplet'}</div>
      </header>

      {!bilan.complet && (
        <div className="recap-manquants" role="alert">
          <strong>Avant de terminer :</strong>
          <ul>
            {bilan.manquants.map((m) => (
              <li key={`${m.etape}-${m.message}`}>
                <button type="button" className="lien-manquant" onClick={() => aller(m.etape)}>
                  {m.message} <span className="fp-meta">→ {NOMS_ETAPES[m.etape]}</span>
                </button>
              </li>
            ))}
            {/* Les incohérences ne sont détaillées que si rien ne manque : sinon elles ne font que répéter les manques. */}
            {bilan.manquants.length === 0 &&
              bilan.erreurs.map((e) => (
                <li key={e}>{e}</li>
              ))}
          </ul>
        </div>
      )}

      {bilan.fiche ? (
        <FichePerso fiche={bilan.fiche} donnees={donnees} />
      ) : (
        <p className="aide aide-centre">La fiche s'affichera dès que les choix seront cohérents.</p>
      )}
    </div>
  );
}
