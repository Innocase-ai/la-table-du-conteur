import { ALIGNEMENTS_INFO } from '../descriptions';
import { nomAuHasard, portraitEquivalent, portraitsPour, type Sexe } from '../portraits';
import { Portrait } from '../ui';
import type { PropsEcran } from './commun';

export function EcranIdentite({ b, donnees, maj }: PropsEcran) {
  const { identite, choix } = b;
  const espece = choix.espece ? donnees.especes.get(choix.espece) : undefined;
  const galerie = choix.espece ? portraitsPour(choix.espece, identite.sexe) : [];
  const majId = (p: Partial<typeof identite>) => maj((x) => ({ ...x, identite: { ...x.identite, ...p } }));
  const changerSexe = (s: Sexe) => {
    if (s === identite.sexe) return;
    majId({ sexe: s, portrait: choix.espece ? portraitEquivalent(identite.portrait, choix.espece, s) : identite.portrait });
  };
  return (
    <div className="ecran ecran-identite">
      <div className="identite-champs">
        <div className="champ-groupe">
          <label htmlFor="champ-nom">Nom</label>
          <div className="champ-ligne">
            <input
              id="champ-nom"
              className="champ"
              type="text"
              value={identite.nom}
              maxLength={40}
              placeholder="Le nom de votre personnage"
              onChange={(e) => majId({ nom: e.target.value })}
            />
            <button type="button" className="bouton" onClick={() => majId({ nom: nomAuHasard(choix.espece ?? 'humain', identite.sexe, identite.nom) })}>
              Au hasard
            </button>
          </div>
        </div>
        <div className="champ-groupe">
          <span className="etiquette" id="etiquette-sexe">
            Sexe
          </span>
          <div className="segments" role="group" aria-labelledby="etiquette-sexe">
            {(['F', 'M'] as Sexe[]).map((s) => (
              <button key={s} type="button" className={identite.sexe === s ? 'actif' : ''} aria-pressed={identite.sexe === s} onClick={() => changerSexe(s)}>
                {s === 'F' ? 'Féminin' : 'Masculin'}
              </button>
            ))}
          </div>
        </div>
        <div className="champ-groupe">
          <label htmlFor="champ-caractere">
            Caractère <span className="facultatif">(facultatif)</span>
          </label>
          <input
            id="champ-caractere"
            className="champ"
            type="text"
            value={identite.caractere}
            maxLength={200}
            placeholder="Une ligne sur sa personnalité"
            onChange={(e) => majId({ caractere: e.target.value })}
          />
          <span className="compteur-caractere">{identite.caractere.length} / 200</span>
        </div>
        <p className="aide">
          {espece?.nom ?? '—'} · alignement {identite.alignement ? ALIGNEMENTS_INFO[identite.alignement].nom : 'non choisi'}
        </p>
      </div>
      <div className="identite-galerie">
        <h2>Portrait</h2>
        <p className="aide">Trois portraits sont proposés pour cette espèce et ce sexe.</p>
        <div className="galerie" role="group" aria-label="Portraits">
          {galerie.map((p) => (
            <button key={p.id} type="button" className={`vignette ${identite.portrait === p.id ? 'vignette-choisie' : ''}`} aria-pressed={identite.portrait === p.id} onClick={() => majId({ portrait: p.id })}>
              <Portrait id={p.id} espece={p.espece} classe={choix.classe} taille={128} selectionne={identite.portrait === p.id} />
              <span>Portrait {p.numero}</span>
            </button>
          ))}
          {!galerie.length && <p className="aide">Choisissez d'abord une espèce.</p>}
        </div>
      </div>
    </div>
  );
}
