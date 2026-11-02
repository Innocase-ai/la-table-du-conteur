import { useMemo, useState } from 'react';
import { ca, preparerRencontre, RENCONTRES, type Donnees, type Rencontre } from '@crpg/regles';
import type { Reglages } from '../App';
import { LIBELLES_DIFFICULTE, nomClasse } from '../libelles';
import { Credits } from './Credits';
import { Jeton } from './Jeton';

interface Props {
  donnees: Donnees;
  initial?: Reglages;
  onCombattre: (r: Reglages) => void;
}

function MiniCarte({ carte }: { carte: string[] }) {
  const largeur = Math.max(...carte.map((l) => l.length));
  return (
    <div className="mini-carte" style={{ gridTemplateColumns: `repeat(${largeur}, 1fr)` }} aria-hidden>
      {carte.flatMap((ligne, y) =>
        [...ligne.padEnd(largeur, '#')].map((c, x) => (
          <span
            key={`${x},${y}`}
            className={c === '#' ? 'mc-mur' : c === '~' ? 'mc-difficile' : c === 'H' ? 'mc-heros' : c === 'm' ? 'mc-monstre' : 'mc-sol'}
          />
        )),
      )}
    </div>
  );
}

function listeMonstres(r: Rencontre, donnees: Donnees): string {
  return r.monstres
    .map(({ profil, nombre }) => {
      const nom = donnees.monstres.get(profil)?.nom ?? profil;
      return `${nombre} × ${nom}`;
    })
    .join(' · ');
}

export function Accueil({ donnees, initial, onCombattre }: Props) {
  const [rencontre, setRencontre] = useState<Rencontre>(initial?.rencontre ?? RENCONTRES[0]!);
  const [elan, setElan] = useState(initial?.elan ?? true);
  const [ia, setIa] = useState<Reglages['ia']>(initial?.ia ?? 'normale');
  const [credits, setCredits] = useState(false);

  const heros = useMemo(() => preparerRencontre(RENCONTRES[0]!, donnees).combattants.filter((c) => c.camp === 'heros'), [donnees]);
  const px = (r: Rencontre) => r.monstres.reduce((s, m) => s + (donnees.monstres.get(m.profil)?.px ?? 0) * m.nombre, 0);

  return (
    <div className="accueil">
      <header className="accueil-entete">
        <div className="ornement">✦</div>
        <h1>Le Combat de cartes</h1>
        <p className="sous-titre">Prototype tactique — règles du SRD 5.2.1</p>
      </header>

      <div className="accueil-corps">
        <section className="accueil-rencontres">
          <h2>Choisissez une rencontre</h2>
          <div className="grille-rencontres">
            {RENCONTRES.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`rencontre ${r.id === rencontre.id ? 'choisie' : ''}`}
                onClick={() => setRencontre(r)}
                onDoubleClick={() => onCombattre({ rencontre: r, elan, ia })}
              >
                <MiniCarte carte={r.carte} />
                <div className="rencontre-texte">
                  <div className="rencontre-titre">
                    <h3>{r.nom}</h3>
                    <span className={`difficulte d-${r.difficulte}`}>{LIBELLES_DIFFICULTE[r.difficulte]}</span>
                  </div>
                  <p>{r.description}</p>
                  <p className="rencontre-monstres">{listeMonstres(r, donnees)}</p>
                  <p className="rencontre-px">{px(r)} PX</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <aside className="accueil-cote">
          <section className="panneau">
            <h2>Options</h2>
            <label className="interrupteur">
              <input type="checkbox" checked={elan} onChange={(e) => setElan(e.target.checked)} />
              <span className="glissiere" />
              <span>
                Deck d'élan
                <small>Deux cartes piochées à chaque tour, une jouable gratuitement.</small>
              </span>
            </label>
            <div className="choix-ia">
              <span className="etiquette">Difficulté de l'IA</span>
              <div className="segments">
                {(['normale', 'facile'] as const).map((n) => (
                  <button key={n} type="button" className={ia === n ? 'actif' : ''} onClick={() => setIa(n)}>
                    {n === 'normale' ? 'Normale' : 'Facile'}
                  </button>
                ))}
              </div>
            </div>
            <button type="button" className="bouton-principal" onClick={() => onCombattre({ rencontre, elan, ia })}>
              Combattre
            </button>
          </section>

          <section className="panneau">
            <h2>La compagnie</h2>
            <ul className="liste-heros">
              {heros.map((h) => (
                <li key={h.id}>
                  <div className="liste-heros-jeton">
                    <Jeton c={h} taille={34} />
                  </div>
                  <div>
                    <strong>{h.nom}</strong>
                    <span className="classe">{nomClasse(h, donnees)}</span>
                  </div>
                  <div className="stats">
                    <span title="Points de vie">PV {h.pvMax}</span>
                    <span title="Classe d'armure">CA {ca(h)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <p className="accueil-pied">
            <button type="button" className="lien-credits" onClick={() => setCredits(true)}>
              Crédits
            </button>
          </p>
        </aside>
      </div>
      {credits && <Credits onFermer={() => setCredits(false)} />}
    </div>
  );
}
