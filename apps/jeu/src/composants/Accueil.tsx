import { useMemo, useState } from 'react';
import {
  ca,
  composerRencontre,
  DIFFICULTES,
  personnageComplet,
  bilanPersonnage,
  preparerRencontre,
  RENCONTRES,
  TAILLE_GROUPE,
  THEMES,
  type Difficulte,
  type Donnees,
  type Groupe,
  type Rencontre,
  type RencontreComposee,
} from '@crpg/regles';
import type { Reglages } from '../App';
import { LIBELLES_DIFFICULTE, nomClasse } from '../libelles';
import { Credits } from './Credits';
import { herosDuGroupe } from '../groupe/stockage';
import { Portrait } from '../createur/ui';
import { Jeton } from './Jeton';

interface Props {
  donnees: Donnees;
  groupe: Groupe;
  initial?: Reglages;
  onGerer: () => void;
  onCombattre: (r: Reglages) => void;
  onRetour: () => void;
}

/** La couleur de chaque caractère d'une carte en texte dans l'aperçu (un caractère inconnu se lit comme du sol). */
const CLASSES_MINI_CARTE: Record<string, string> = {
  '#': 'mc-mur',
  '~': 'mc-difficile',
  T: 'mc-arbre',
  R: 'mc-rocher',
  e: 'mc-eau',
  b: 'mc-boue',
  n: 'mc-neige',
  r: 'mc-rocher-bas',
  t: 'mc-tronc',
  c: 'mc-caisse',
  H: 'mc-heros',
  m: 'mc-monstre',
};

function MiniCarte({ carte }: { carte: string[] }) {
  const largeur = Math.max(...carte.map((l) => l.length));
  return (
    <div className="mini-carte" style={{ gridTemplateColumns: `repeat(${largeur}, 1fr)` }} aria-hidden>
      {carte.flatMap((ligne, y) =>
        [...ligne.padEnd(largeur, '#')].map((c, x) => (
          <span
            key={`${x},${y}`}
            className={CLASSES_MINI_CARTE[c] ?? 'mc-sol'}
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

/** « 6 héros de niveau 3 » ou « 4 héros, niveaux 2 à 4 ». */
function resumeGroupe(niveaux: number[]): string {
  const min = Math.min(...niveaux);
  const max = Math.max(...niveaux);
  return `${niveaux.length} héros ${min === max ? `de niveau ${min}` : `de niveaux ${min} à ${max}`}`;
}

export function Accueil({ donnees, groupe, initial, onGerer, onCombattre, onRetour }: Props) {
  // Le thème choisi (une carte, un camp de monstres) et la difficulté : la rencontre est composée pour le groupe.
  const [themeId, setThemeId] = useState<string>(initial?.rencontre.id ?? THEMES[0]!.id);
  const [difficulte, setDifficulte] = useState<Difficulte>(initial?.rencontre.difficulte ?? 'moderee');
  const [elan, setElan] = useState(initial?.elan ?? true);
  const [ia, setIa] = useState<Reglages['ia']>(initial?.ia ?? 'normale');
  const [credits, setCredits] = useState(false);
  const [heros, setHeros] = useState<Reglages['heros']>(initial?.heros ?? 'pretires');

  const pretires = useMemo(() => preparerRencontre(RENCONTRES[0]!, donnees).combattants.filter((c) => c.camp === 'heros'), [donnees]);
  const bilans = useMemo(() => groupe.emplacements.map((p) => (p ? { p, bilan: bilanPersonnage(p, donnees) } : null)), [groupe, donnees]);
  const nbComplets = bilans.filter((x) => x && personnageComplet(x.bilan)).length;
  const groupeDispo = nbComplets > 0;
  const modeHeros: Reglages['heros'] = heros === 'groupe' && groupeDispo ? 'groupe' : 'pretires';
  // Les niveaux des héros qui combattront : leur nombre et leur niveau font le budget de la rencontre.
  const niveaux = useMemo(
    () =>
      modeHeros === 'groupe' ? bilans.flatMap((x) => (x && personnageComplet(x.bilan) && x.bilan.fiche ? [x.bilan.fiche.niveau] : [])) : pretires.map(() => 3),
    [modeHeros, bilans, pretires],
  );
  const composees = useMemo(() => THEMES.map((t) => composerRencontre(t, niveaux, difficulte, donnees)), [niveaux, difficulte, donnees]);
  const rencontre: RencontreComposee = composees.find((r) => r.id === themeId) ?? composees[0]!;
  const lancer = (r: Rencontre) =>
    onCombattre({ rencontre: r, elan, ia, heros: modeHeros, herosCombat: modeHeros === 'groupe' ? herosDuGroupe(groupe, donnees) : undefined });

  return (
    <div className="accueil">
      <header className="accueil-entete">
        <button type="button" className="bouton-discret accueil-retour" onClick={onRetour}>
          ‹ Menu
        </button>
        <div className="ornement">✦</div>
        <h1>Escarmouche</h1>
        <p className="sous-titre">Un combat d'entraînement, hors de toute histoire</p>
      </header>

      <div className="accueil-corps">
        <section className="accueil-rencontres">
          <h2>Choisissez une rencontre</h2>
          <div className="choix-difficulte">
            <div className="segments" role="group" aria-label="Difficulté de la rencontre">
              {DIFFICULTES.map((d) => (
                <button key={d} type="button" className={d === difficulte ? 'actif' : ''} aria-pressed={d === difficulte} onClick={() => setDifficulte(d)}>
                  {LIBELLES_DIFFICULTE[d]}
                </button>
              ))}
            </div>
            <small>Composée pour {resumeGroupe(niveaux)}.</small>
          </div>
          <div className="grille-rencontres">
            {composees.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`rencontre ${r.id === rencontre.id ? 'choisie' : ''}`}
                onClick={() => setThemeId(r.id)}
                onDoubleClick={() => lancer(r)}
              >
                <MiniCarte carte={r.carte} />
                <div className="rencontre-texte">
                  <div className="rencontre-titre">
                    <h3>{r.nom}</h3>
                    <span className={`difficulte d-${r.difficulte}`}>{LIBELLES_DIFFICULTE[r.difficulte]}</span>
                  </div>
                  <p>{r.description}</p>
                  <p className="rencontre-monstres">{listeMonstres(r, donnees)}</p>
                  <p className="rencontre-px">
                    {r.px} PX sur {r.depense} prévus
                  </p>
                  {r.px < 0.8 * r.depense && <p className="rencontre-note">Peu de monstres assez puissants pour ce niveau : plus facile que prévu.</p>}
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
            <button type="button" className="bouton-principal" onClick={() => lancer(rencontre)}>
              Combattre
            </button>
          </section>

          <section className="panneau">
            <h2>Les héros</h2>
            <div className="segments segments-heros" role="group" aria-label="Héros du combat">
              <button
                type="button"
                className={modeHeros === 'pretires' ? 'actif' : ''}
                aria-pressed={modeHeros === 'pretires'}
                onClick={() => setHeros('pretires')}
              >
                Pré-tirés
              </button>
              <button
                type="button"
                className={modeHeros === 'groupe' ? 'actif' : ''}
                aria-pressed={modeHeros === 'groupe'}
                disabled={!groupeDispo}
                title={groupeDispo ? undefined : 'Créez au moins un personnage complet dans « Mon groupe ».'}
                onClick={() => setHeros('groupe')}
              >
                Mon groupe
              </button>
            </div>
            {modeHeros === 'pretires' ? (
              <ul className="liste-heros">
                {pretires.map((h) => (
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
            ) : (
              <ul className="liste-heros">
                {bilans.map((x) =>
                  x && personnageComplet(x.bilan) && x.bilan.fiche ? (
                    <li key={x.p.id}>
                      <div className="liste-heros-jeton">
                        <Portrait id={x.p.portrait} espece={x.p.choix.espece} classe={x.p.choix.classe} taille={30} />
                      </div>
                      <div>
                        <strong>{x.p.choix.nom}</strong>
                        <span className="classe">
                          {donnees.classes.get(x.p.choix.classe)?.nom} · niv. {x.p.choix.niveau}
                        </span>
                      </div>
                      <div className="stats">
                        <span>PV {x.bilan.fiche.pvMax}</span>
                        <span>CA {x.bilan.fiche.ca}</span>
                      </div>
                    </li>
                  ) : null,
                )}
              </ul>
            )}
            <p className="resume-groupe">
              Mon groupe : {nbComplets} personnage(s) complet(s) (jusqu'à {TAILLE_GROUPE})
              {bilans.filter((x) => x && !personnageComplet(x.bilan)).length > 0 &&
                `, ${bilans.filter((x) => x && !personnageComplet(x.bilan)).length} incomplet(s)`}
            </p>
            <button type="button" className="bouton bouton-large" onClick={onGerer}>
              Gérer mon groupe
            </button>
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
