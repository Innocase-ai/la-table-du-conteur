// L'encart « Remplace sur [Héros] : [objet actuel] » sous la fiche d'un objet du sac : ce que l'objet changerait (CA, attaques, bonus
// magiques, Vitesse, Discrétion, harmonisation), avant → après, pour l'emplacement où il irait vraiment. Aucune règle ici : voir
// `comparer` dans `equipement-regles.ts` (le moteur place l'objet sur une copie du héros).
import type { Comparaison } from '../equipement-regles';

const SIGNE = { mieux: '▲', moins: '▼', egal: '=', neutre: '' } as const;
const MOT = { mieux: 'mieux', moins: 'moins bien', egal: 'inchangé', neutre: '' } as const;

export function ComparateurEquipement({ c }: { c: Comparaison }) {
  const lieu = c.jeu ? `${c.emplacementNom}${c.enMain ? ' · en main' : ' · pas en main'}` : c.emplacementNom;
  return (
    <section className={`comparateur${c.refus ? ' comparateur-refus' : ''}`} aria-label={`Comparaison : ${c.titre}`}>
      <h4 className="comparateur-titre">{c.titre}</h4>
      <p className="comparateur-lieu">{c.refus ? 'Impossible pour l’instant' : lieu}</p>
      {c.refus ? (
        <p className="poupee-refus">{c.refus}</p>
      ) : (
        <>
          {c.lignes.length > 0 ? (
            <dl className="comparateur-lignes">
              {c.lignes.map((l) => {
                // Un texte long (une attaque et ses dégâts) s'écrit sur deux lignes, avant puis après ; un chiffre court tient sur une seule.
                const long = l.avant.length + l.apres.length > 26 || /\n/.test(l.avant) || /\n/.test(l.apres);
                return (
                  <div key={l.cle} className={`comparateur-ligne comparateur-${l.sens}${long ? ' comparateur-long' : ''}`}>
                    <dt>{l.libelle}</dt>
                    <dd className="comparateur-valeurs">
                      <span className="comparateur-avant">{l.avant}</span>
                      <span className="comparateur-fleche" aria-hidden>
                        →
                      </span>
                      <span className="comparateur-apres">
                        {l.apres}
                        {SIGNE[l.sens] && (
                          <span className="comparateur-sens" title={MOT[l.sens]}>
                            {' '}
                            {SIGNE[l.sens]}
                            <span className="comparateur-lecteur"> ({MOT[l.sens]})</span>
                          </span>
                        )}
                      </span>
                    </dd>
                  </div>
                );
              })}
            </dl>
          ) : (
            <p className="comparateur-rien">Rien ne change pour les chiffres du héros.</p>
          )}
          {c.notes.map((n) => (
            <p key={n} className="comparateur-note">
              {n}
            </p>
          ))}
        </>
      )}
    </section>
  );
}
