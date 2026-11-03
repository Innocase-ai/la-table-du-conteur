// Écran d'aventure, mode « livre » : le moteur résout chaque action (boutons), le jeu affiche les jets, les constats
// et les textes écrits par l'auteur. Le conteur (IA) viendra s'ajouter pour la saisie libre (M4b).
import { useEffect, useReducer, useRef, useState } from 'react';
import {
  aller,
  desarmer,
  ficheDeScene,
  fouiller,
  indiceEnigme,
  influencer,
  issueRencontre,
  ouvrir,
  parler,
  prendre,
  repondreEnigme,
  seReposer,
  sujetsDisponibles,
  type CompteRendu,
  type Influence,
  type Jet,
} from '@crpg/regles';
import { NOMS_CARAC, NOMS_COMPETENCES } from '../createur/libelles';
import { Portrait } from '../createur/ui';
import { manifesteDe, urlImage } from '../mondes';
import { sauverAventure, type Aventure, type Entree } from './partie';

interface Props {
  aventure: Aventure;
  onCombat: (rencontre: string) => void;
  onMenu: () => void;
}

function libelleTest(test: string): string {
  if (test in NOMS_COMPETENCES) return NOMS_COMPETENCES[test as keyof typeof NOMS_COMPETENCES];
  if (test in NOMS_CARAC) return NOMS_CARAC[test as keyof typeof NOMS_CARAC];
  const sauvegarde = /^sauvegarde de (\w+)$/.exec(test);
  if (sauvegarde) return `Sauvegarde de ${NOMS_CARAC[sauvegarde[1] as keyof typeof NOMS_CARAC] ?? sauvegarde[1]}`;
  return test;
}

function TexteJet({ j }: { j: Jet }) {
  const des = j.des.length > 1 ? `${j.des.join(' / ')}${j.avantage ? ', avantage' : j.desavantage ? ', désavantage' : ''}` : `${j.des[0]}`;
  return (
    <>
      <strong>{j.nom}</strong> — {libelleTest(j.test)} : <strong>{j.total}</strong>{' '}
      <small>
        (d20 {des} {j.bonus >= 0 ? '+' : '−'} {Math.abs(j.bonus)})
      </small>
      {j.ddSecret ? (j.reussite ? ' — trouve quelque chose' : ' — rien') : ` contre DD ${j.dd} — ${j.reussite ? 'réussi' : 'raté'}`}
    </>
  );
}

/** Image d'un lieu ou d'un PNJ, d'après le manifeste du monde. */
function useImage(monde: string, groupe: 'lieux' | 'pnj', id: string | undefined): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let actif = true;
    setUrl(undefined);
    const fichier = id ? manifesteDe(monde)?.[groupe][id] : undefined;
    if (fichier) urlImage(monde, fichier)?.then((u) => actif && setUrl(u));
    return () => {
      actif = false;
    };
  }, [monde, groupe, id]);
  return url;
}

export function EcranAventure({ aventure, onCombat, onMenu }: Props) {
  const { dm, partie } = aventure;
  const [, rafraichir] = useReducer((x: number) => x + 1, 0);
  const [interlocuteur, setInterlocuteur] = useState<string>();
  const [reponses, setReponses] = useState<Record<string, string>>({});
  const [indices, setIndices] = useState<Record<string, number>>({});
  const recit = useRef<HTMLDivElement>(null);
  const scene = ficheDeScene(partie);
  const image = useImage(dm.monde.id, 'lieux', scene.lieu.id);
  const imagePnj = useImage(dm.monde.id, 'pnj', interlocuteur);
  const combat = aventure.combatEnAttente ? dm.rencontres.get(aventure.combatEnAttente) : undefined;

  useEffect(() => {
    recit.current?.scrollTo({ top: recit.current.scrollHeight, behavior: 'smooth' });
  }, [aventure.journal.length]);

  const ajouter = (...e: Entree[]) => aventure.journal.push(...e);

  /** Verse un compte rendu du moteur dans le récit. */
  const raconter = (cr: CompteRendu, options: { sansPremierConstat?: boolean; sansConstats?: boolean; voix?: string } = {}) => {
    if (!cr.ok && cr.refus) ajouter({ type: 'refus', texte: cr.refus });
    // Ordre de lecture : les dés, le texte de l'auteur, ce que le groupe constate, puis ce qu'il apprend.
    for (const j of cr.jets) ajouter({ type: 'jet', jet: j });
    for (const n of cr.narrations) ajouter(options.voix ? { type: 'parole', qui: options.voix, texte: n } : { type: 'texte', texte: n });
    if (!options.sansConstats) cr.constats.slice(options.sansPremierConstat ? 1 : 0).forEach((t) => ajouter({ type: 'constat', texte: t }));
    for (const f of cr.revele) {
      const fait = dm.faits.get(f);
      // Le texte d'une rumeur contient la vérité pour le conteur (« c'est faux… ») : le joueur ne l'a que par la bouche des PNJ.
      if (fait?.fiable) ajouter({ type: 'fait', texte: fait.texte, rumeur: false });
    }
    if (cr.combat) aventure.combatEnAttente = cr.combat;
    sauverAventure(aventure);
    rafraichir();
  };

  const allerVers = (vers: string) => {
    const cr = aller(partie, vers);
    if (cr.ok) {
      setInterlocuteur(undefined);
      const l = dm.lieux.get(vers)!;
      ajouter({ type: 'lieu', titre: l.nom, texte: l.resume, ambiance: l.ambiance });
    }
    raconter(cr, { sansPremierConstat: cr.ok });
  };

  const tours = (fn: () => CompteRendu, options?: Parameters<typeof raconter>[1]) => raconter(fn(), options);
  const pnj = interlocuteur ? dm.pnj.get(interlocuteur) : undefined;
  const bloque = !!combat || !!scene.fin;

  return (
    <div className="aventure">
      <header className="aventure-haut">
        <button type="button" className="bouton-discret" onClick={onMenu}>
          ‹ Menu
        </button>
        <div className="aventure-titre">
          <span>{dm.monde.nom}</span>
          <strong>{scene.lieu.nom}</strong>
        </div>
        <div className="aventure-etat">
          <span>Jour {scene.jour}</span>
          {scene.jauges.map((j) => (
            <span key={j.id} className="aventure-jauge" title={dm.jauges.get(j.id)?.resume}>
              {j.nom} {j.valeur}/{j.max}
            </span>
          ))}
          <span>{scene.pieces.toLocaleString('fr-FR')} po</span>
        </div>
      </header>

      <main className="aventure-centre">
        <div className="aventure-image" style={image ? { backgroundImage: `url(${image})` } : undefined}>
          <div className="aventure-image-legende">
            <strong>{scene.lieu.nom}</strong>
            <span>{scene.lieu.resume}</span>
          </div>
        </div>
        <div className="aventure-recit" ref={recit}>
          {aventure.journal.map((e, i) => (
            <EntreeRecit key={i} e={e} />
          ))}
        </div>
        <div className="aventure-saisie" title="Le conteur (IA) arrive à l'étape suivante : il répondra à ce que vous écrivez.">
          <input type="text" disabled placeholder="Que faites-vous ? (le conteur arrive bientôt ; jouez avec les actions de droite)" />
        </div>
      </main>

      <aside className="aventure-actions">
        {scene.fin && (
          <section className="panneau-action fin-histoire">
            <h3>{dm.fins.get(scene.fin)?.nom}</h3>
            <p>{dm.fins.get(scene.fin)?.epilogue}</p>
            <button type="button" className="bouton-principal" onClick={onMenu}>
              Retour au menu
            </button>
          </section>
        )}

        {combat && (
          <section className="panneau-action panneau-danger">
            <h3>{combat.nom}</h3>
            <button type="button" className="bouton-principal" onClick={() => onCombat(combat.id)}>
              Combattre
            </button>
            {combat.alternatives.map((alt) => (
              <button
                key={alt.id}
                type="button"
                className="bouton"
                title={alt.jet ? `${NOMS_COMPETENCES[alt.jet.competence]} DD ${alt.jet.dd}` : undefined}
                onClick={() => {
                  const cr = issueRencontre(partie, combat.id, { type: 'alternative', id: alt.id });
                  if (cr.ok) aventure.combatEnAttente = undefined;
                  raconter(cr);
                }}
              >
                {alt.nom}
                {alt.jet && <small> ({NOMS_COMPETENCES[alt.jet.competence]})</small>}
              </button>
            ))}
            <button
              type="button"
              className="bouton-discret"
              onClick={() => {
                aventure.combatEnAttente = undefined;
                raconter(issueRencontre(partie, combat.id, { type: 'fuite' }));
              }}
            >
              Se replier
            </button>
          </section>
        )}

        {pnj ? (
          <section className="panneau-action">
            <div className="dialogue-entete">
              <div className="dialogue-portrait" style={imagePnj ? { backgroundImage: `url(${imagePnj})` } : undefined} />
              <div>
                <h3>{pnj.nom}</h3>
                <small>{pnj.role}</small>
              </div>
            </div>
            <div className="liste-actions">
              {sujetsDisponibles(partie, pnj).map((s) => (
                <button key={s.id} type="button" className="bouton" disabled={bloque} onClick={() => tours(() => parler(partie, pnj.id, s.id), { voix: pnj.nom })}>
                  {s.mots.slice(0, 3).join(' · ')}
                </button>
              ))}
            </div>
            <div className="liste-actions liste-actions-ligne">
              {(['persuasion', 'intimidation', 'tromperie'] as Influence[]).map((m) => (
                <button key={m} type="button" className="bouton-discret" disabled={bloque} onClick={() => tours(() => influencer(partie, pnj.id, m))}>
                  {m === 'persuasion' ? 'Persuader' : m === 'intimidation' ? 'Intimider' : 'Tromper'}
                </button>
              ))}
            </div>
            <button type="button" className="bouton-discret" onClick={() => setInterlocuteur(undefined)}>
              ‹ Terminer la conversation
            </button>
          </section>
        ) : (
          <>
            {scene.pnj.length > 0 && (
              <section className="panneau-action">
                <h3>Personnes</h3>
                <div className="liste-actions">
                  {scene.pnj.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className="bouton"
                      disabled={bloque}
                      onClick={() => {
                        setInterlocuteur(n.id);
                        // La liste des sujets (pour le conteur) devient les boutons du panneau de dialogue.
                        tours(() => parler(partie, n.id), { voix: n.nom, sansConstats: true });
                      }}
                    >
                      Parler à {n.nom}
                      <small> — {n.role}</small>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="panneau-action">
              <h3>Ici</h3>
              <div className="liste-actions liste-actions-ligne">
                <button type="button" className="bouton" disabled={bloque} onClick={() => tours(() => fouiller(partie))}>
                  Fouiller
                </button>
                <button type="button" className="bouton-discret" disabled={bloque} onClick={() => tours(() => seReposer(partie, 'court'))}>
                  Halte
                </button>
                <button type="button" className="bouton-discret" disabled={bloque || scene.lieu.repos === 'impossible'} onClick={() => tours(() => seReposer(partie, 'long'))} title={`Repos : ${scene.lieu.repos}`}>
                  Dormir
                </button>
              </div>
            </section>

            {(scene.tresors.length > 0 || scene.pieges.some((x) => x.etat === 'repere')) && (
              <section className="panneau-action">
                <h3>À portée de main</h3>
                {scene.pieges
                  .filter((x) => x.etat === 'repere')
                  .map((pg) => (
                    <div key={pg.id} className="objet-action objet-danger">
                      <span>⚠ {pg.nom}</span>
                      <button type="button" className="bouton" disabled={bloque} onClick={() => tours(() => desarmer(partie, pg.id))}>
                        Désarmer
                      </button>
                    </div>
                  ))}
                {scene.tresors.map((t) => {
                  const cle = dm.tresors.get(t.id)?.acces.verrou?.cle;
                  return (
                    <div key={t.id} className="objet-action">
                      <span title={t.description}>{t.nom}</span>
                      {t.etat === 'garde' && <small>gardé</small>}
                      {t.etat === 'ouvert' && (
                        <button type="button" className="bouton" disabled={bloque} onClick={() => tours(() => prendre(partie, t.id))}>
                          Prendre
                        </button>
                      )}
                      {t.etat === 'ferme' && (
                        <span className="liste-actions-ligne">
                          {cle && (partie.etat.inventaire[cle] ?? 0) > 0 && (
                            <button type="button" className="bouton" disabled={bloque} onClick={() => tours(() => ouvrir(partie, { tresor: t.id }, 'cle'))}>
                              Clé
                            </button>
                          )}
                          <button type="button" className="bouton-discret" disabled={bloque} onClick={() => tours(() => ouvrir(partie, { tresor: t.id }, 'crocheter'))}>
                            Crocheter
                          </button>
                          <button type="button" className="bouton-discret" disabled={bloque} onClick={() => tours(() => ouvrir(partie, { tresor: t.id }, 'forcer'))}>
                            Forcer
                          </button>
                        </span>
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            {scene.enigmes
              .filter((e) => e.etat !== 'resolue')
              .map((e) => (
                <section key={e.id} className="panneau-action">
                  <h3>{e.nom}</h3>
                  <p className="enonce">{e.enonce}</p>
                  <form
                    className="enigme-reponse"
                    onSubmit={(ev) => {
                      ev.preventDefault();
                      tours(() => repondreEnigme(partie, e.id, reponses[e.id] ?? ''));
                    }}
                  >
                    <input type="text" value={reponses[e.id] ?? ''} placeholder="Votre réponse" onChange={(ev) => setReponses({ ...reponses, [e.id]: ev.target.value })} />
                    <button type="submit" className="bouton" disabled={bloque || !(reponses[e.id] ?? '').trim()}>
                      Répondre
                    </button>
                  </form>
                  <button
                    type="button"
                    className="bouton-discret"
                    disabled={(indices[e.id] ?? 0) >= 3}
                    onClick={() => {
                      const n = (indices[e.id] ?? 0) + 1;
                      setIndices({ ...indices, [e.id]: n });
                      tours(() => indiceEnigme(partie, e.id, n));
                    }}
                  >
                    Chercher un indice
                  </button>
                </section>
              ))}

            <section className="panneau-action">
              <h3>Partir</h3>
              <div className="liste-actions">
                {scene.sorties.map((s) => (
                  <div key={s.vers} className="objet-action">
                    <button type="button" className="bouton" disabled={bloque || s.etat !== 'libre'} onClick={() => allerVers(s.vers)} title={s.description}>
                      {s.vers === scene.lieu.parent ? '↑ ' : ''}
                      {s.nom}
                    </button>
                    {s.etat === 'verrouille' && (
                      <span className="liste-actions-ligne">
                        <button type="button" className="bouton-discret" disabled={bloque} onClick={() => tours(() => ouvrir(partie, { lien: s.vers }, 'cle'))}>
                          Clé
                        </button>
                        <button type="button" className="bouton-discret" disabled={bloque} onClick={() => tours(() => ouvrir(partie, { lien: s.vers }, 'crocheter'))}>
                          Crocheter
                        </button>
                        <button type="button" className="bouton-discret" disabled={bloque} onClick={() => tours(() => ouvrir(partie, { lien: s.vers }, 'forcer'))}>
                          Forcer
                        </button>
                      </span>
                    )}
                    {s.etat === 'bloque' && <small>infranchissable</small>}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </aside>

      <footer className="aventure-groupe">
        {partie.groupe.map((a) => (
          <div key={a.id} className={`aventure-heros ${a.pv <= 0 ? 'aventure-heros-tombe' : ''}`} title={`${a.nom} — ${a.pv}/${a.fiche.pvMax} PV`}>
            <Portrait id={aventure.portraits[a.id]} espece={a.fiche.espece} classe={a.fiche.classe} taille={40} />
            <div>
              <strong>{a.nom}</strong>
              <div className="barre">
                <div className={`barre-remplie ${a.pv / a.fiche.pvMax > 0.5 ? 'pv-haut' : a.pv / a.fiche.pvMax > 0.25 ? 'pv-moyen' : 'pv-bas'}`} style={{ width: `${(Math.max(0, a.pv) / a.fiche.pvMax) * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
        <div className="aventure-sac" title={scene.inventaire.map((o) => `${o.quantite} × ${o.nom}`).join('\n') || 'Sac vide'}>
          Sac : {scene.inventaire.reduce((s, o) => s + o.quantite, 0)} objet(s)
        </div>
      </footer>
    </div>
  );
}

function EntreeRecit({ e }: { e: Entree }) {
  switch (e.type) {
    case 'lieu':
      return (
        <div className="recit-lieu">
          <h3>{e.titre}</h3>
          <p>{e.texte}</p>
          {e.ambiance && <p className="recit-ambiance">{e.ambiance}</p>}
        </div>
      );
    case 'texte':
      return <p className="recit-texte">{e.texte}</p>;
    case 'parole':
      return (
        <p className="recit-parole">
          <strong>{e.qui}</strong> {e.texte}
        </p>
      );
    case 'constat':
      return <p className="recit-constat">{e.texte}</p>;
    case 'fait':
      return <p className="recit-fait">{e.rumeur ? 'Rumeur' : 'Vous apprenez'} : {e.texte}</p>;
    case 'jet':
      return (
        <p className={`recit-jet ${e.jet.reussite ? 'jet-reussi' : 'jet-rate'}`}>
          <span className="recit-de">⚄</span> <TexteJet j={e.jet} />
        </p>
      );
    case 'refus':
      return <p className="recit-refus">{e.texte}</p>;
  }
}
