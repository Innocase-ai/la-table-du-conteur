// Écran d'aventure, mode « livre » : chaque bouton envoie une commande au moteur ; le récit se lit dans le journal
// d'événements de la partie. Le conteur (IA) viendra s'ajouter pour la saisie libre (M4b).
import { useEffect, useRef, useState } from 'react';
import type { DonneesMonde, EvenementJeu, FicheScene, Interlocuteur, Jet, Ordre, Partie } from '@crpg/regles';
import { NOMS_CARAC, NOMS_COMPETENCES } from '../createur/libelles';
import { Portrait } from '../createur/ui';
import { manifesteDe, urlImage } from '../mondes';
import type { Aventure } from './partie';

interface Props {
  aventure: Aventure;
  onPartie: (p: Partie) => void;
  onCombat: () => void;
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

export function EcranAventure({ aventure, onPartie, onCombat, onMenu }: Props) {
  const { moteur, partie } = aventure;
  const dm = moteur.ctx.dm;
  const [refus, setRefus] = useState<string>();
  const [reponses, setReponses] = useState<Record<string, string>>({});
  const [indices, setIndices] = useState<Record<string, number>>({});
  const recit = useRef<HTMLDivElement>(null);
  const scene = moteur.vue<FicheScene>('scene', partie);
  const interlocuteur = moteur.vue<Interlocuteur | undefined>('interlocuteur', partie);
  const image = useImage(dm.monde.id, 'lieux', scene.lieu.id);
  const imagePnj = useImage(dm.monde.id, 'pnj', interlocuteur?.id);
  const rencontre = partie.scene.type === 'rencontre' ? dm.rencontres.get(partie.scene.rencontre) : undefined;
  const fin = partie.scene.type === 'fin' ? dm.fins.get(partie.scene.fin) : undefined;
  const bloque = !!rencontre || !!fin;

  useEffect(() => {
    recit.current?.scrollTo({ top: recit.current.scrollHeight, behavior: 'smooth' });
  }, [partie.journal.length, refus]);

  /** Envoie une commande au moteur ; un refus s'affiche sans changer la partie. */
  const jouer = (ordre: Ordre) => {
    const r = moteur.executer(partie, ordre);
    setRefus(r.refus);
    if (!r.refus) onPartie(r.partie);
  };

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
          {partie.journal.map((e, i) => (
            <EntreeRecit key={i} e={e} dm={dm} />
          ))}
          {refus && <p className="recit-refus">{refus}</p>}
        </div>
        <div className="aventure-saisie" title="Le conteur (IA) arrive à l'étape suivante : il répondra à ce que vous écrivez.">
          <input type="text" disabled placeholder="Que faites-vous ? (le conteur arrive bientôt ; jouez avec les actions de droite)" />
        </div>
      </main>

      <aside className="aventure-actions">
        {fin && (
          <section className="panneau-action fin-histoire">
            <h3>{fin.nom}</h3>
            <p>{fin.epilogue}</p>
            <button type="button" className="bouton-principal" onClick={onMenu}>
              Retour au menu
            </button>
          </section>
        )}

        {rencontre && (
          <section className="panneau-action panneau-danger">
            <h3>{rencontre.nom}</h3>
            <button type="button" className="bouton-principal" onClick={onCombat}>
              Combattre
            </button>
            {rencontre.alternatives.map((alt) => (
              <button
                key={alt.id}
                type="button"
                className="bouton"
                title={alt.jet ? `${NOMS_COMPETENCES[alt.jet.competence]} DD ${alt.jet.dd}` : undefined}
                onClick={() => jouer({ type: 'reglerRencontre', issue: 'alternative', alternative: alt.id })}
              >
                {alt.nom}
                {alt.jet && <small> ({NOMS_COMPETENCES[alt.jet.competence]})</small>}
              </button>
            ))}
            <button type="button" className="bouton-discret" onClick={() => jouer({ type: 'reglerRencontre', issue: 'fuite' })}>
              Se replier
            </button>
          </section>
        )}

        {interlocuteur ? (
          <section className="panneau-action">
            <div className="dialogue-entete">
              <div className="dialogue-portrait" style={imagePnj ? { backgroundImage: `url(${imagePnj})` } : undefined} />
              <div>
                <h3>{interlocuteur.nom}</h3>
                <small>{interlocuteur.role}</small>
              </div>
            </div>
            <div className="liste-actions">
              {interlocuteur.sujets.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="bouton"
                  disabled={bloque}
                  onClick={() => jouer({ type: 'parler', pnj: interlocuteur.id, sujet: s.id })}
                >
                  {s.mots.slice(0, 3).join(' · ')}
                </button>
              ))}
            </div>
            <div className="liste-actions liste-actions-ligne">
              {(['persuasion', 'intimidation', 'tromperie'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className="bouton-discret"
                  disabled={bloque}
                  onClick={() => jouer({ type: 'influencer', pnj: interlocuteur.id, maniere: m })}
                >
                  {m === 'persuasion' ? 'Persuader' : m === 'intimidation' ? 'Intimider' : 'Tromper'}
                </button>
              ))}
            </div>
            <button type="button" className="bouton-discret" onClick={() => jouer({ type: 'quitterDialogue' })}>
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
                    <button key={n.id} type="button" className="bouton" disabled={bloque} onClick={() => jouer({ type: 'parler', pnj: n.id })}>
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
                <button type="button" className="bouton" disabled={bloque} onClick={() => jouer({ type: 'fouiller' })}>
                  Fouiller
                </button>
                <button type="button" className="bouton-discret" disabled={bloque} onClick={() => jouer({ type: 'seReposer', duree: 'court' })}>
                  Halte
                </button>
                <button
                  type="button"
                  className="bouton-discret"
                  disabled={bloque || scene.lieu.repos === 'impossible'}
                  onClick={() => jouer({ type: 'seReposer', duree: 'long' })}
                >
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
                      <button type="button" className="bouton" disabled={bloque} onClick={() => jouer({ type: 'desarmer', piege: pg.id })}>
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
                        <button type="button" className="bouton" disabled={bloque} onClick={() => jouer({ type: 'prendre', tresor: t.id })}>
                          Prendre
                        </button>
                      )}
                      {t.etat === 'ferme' && (
                        <span className="liste-actions-ligne">
                          {cle && (partie.etat.inventaire[cle] ?? 0) > 0 && (
                            <button
                              type="button"
                              className="bouton"
                              disabled={bloque}
                              onClick={() => jouer({ type: 'ouvrir', cible: { tresor: t.id }, methode: 'cle' })}
                            >
                              Clé
                            </button>
                          )}
                          <button
                            type="button"
                            className="bouton-discret"
                            disabled={bloque}
                            onClick={() => jouer({ type: 'ouvrir', cible: { tresor: t.id }, methode: 'crocheter' })}
                          >
                            Crocheter
                          </button>
                          <button
                            type="button"
                            className="bouton-discret"
                            disabled={bloque}
                            onClick={() => jouer({ type: 'ouvrir', cible: { tresor: t.id }, methode: 'forcer' })}
                          >
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
                      jouer({ type: 'repondreEnigme', enigme: e.id, reponse: reponses[e.id] ?? '' });
                    }}
                  >
                    <input
                      type="text"
                      value={reponses[e.id] ?? ''}
                      placeholder="Votre réponse"
                      onChange={(ev) => setReponses({ ...reponses, [e.id]: ev.target.value })}
                    />
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
                      jouer({ type: 'indiceEnigme', enigme: e.id, niveau: n });
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
                    <button
                      type="button"
                      className="bouton"
                      disabled={bloque || s.etat !== 'libre'}
                      onClick={() => jouer({ type: 'aller', vers: s.vers })}
                      title={s.description}
                    >
                      {s.vers === scene.lieu.parent ? '↑ ' : ''}
                      {s.nom}
                    </button>
                    {s.etat === 'verrouille' && (
                      <span className="liste-actions-ligne">
                        <button
                          type="button"
                          className="bouton-discret"
                          disabled={bloque}
                          onClick={() => jouer({ type: 'ouvrir', cible: { lien: s.vers }, methode: 'cle' })}
                        >
                          Clé
                        </button>
                        <button
                          type="button"
                          className="bouton-discret"
                          disabled={bloque}
                          onClick={() => jouer({ type: 'ouvrir', cible: { lien: s.vers }, methode: 'crocheter' })}
                        >
                          Crocheter
                        </button>
                        <button
                          type="button"
                          className="bouton-discret"
                          disabled={bloque}
                          onClick={() => jouer({ type: 'ouvrir', cible: { lien: s.vers }, methode: 'forcer' })}
                        >
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
            <Portrait id={a.portrait} espece={a.fiche.espece} classe={a.fiche.classe} taille={40} />
            <div>
              <strong>{a.nom}</strong>
              <div className="barre">
                <div
                  className={`barre-remplie ${a.pv / a.fiche.pvMax > 0.5 ? 'pv-haut' : a.pv / a.fiche.pvMax > 0.25 ? 'pv-moyen' : 'pv-bas'}`}
                  style={{ width: `${(Math.max(0, a.pv) / a.fiche.pvMax) * 100}%` }}
                />
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

/** Une ligne du récit, d'après un événement du journal. Les événements sans texte pour le joueur ne s'affichent pas. */
function EntreeRecit({ e, dm }: { e: EvenementJeu; dm: DonneesMonde }) {
  switch (e.type) {
    case 'arrivee':
    case 'deplacement': {
      const l = dm.lieux.get(e.type === 'arrivee' ? e.lieu : e.vers);
      if (!l) return null;
      return (
        <div className="recit-lieu">
          <h3>{l.nom}</h3>
          <p>{l.resume}</p>
          {l.ambiance && <p className="recit-ambiance">{l.ambiance}</p>}
        </div>
      );
    }
    case 'texte':
      return e.voix ? (
        <p className="recit-parole">
          <strong>{e.voix}</strong> {e.texte}
        </p>
      ) : (
        <p className="recit-texte">{e.texte}</p>
      );
    case 'constat':
      return <p className="recit-constat">{e.texte}</p>;
    case 'faitAppris': {
      // Le texte d'une rumeur porte la vérité pour le conteur : le joueur ne l'apprend que par la bouche des PNJ.
      const f = dm.faits.get(e.fait);
      return f?.fiable ? <p className="recit-fait">Vous apprenez : {f.texte}</p> : null;
    }
    case 'queteMiseAJour': {
      const q = dm.quetes.get(e.quete);
      if (!q) return null;
      const texte =
        e.nouvelle && e.statut !== 'terminee'
          ? `Nouvelle quête : ${q.nom}.`
          : e.statut === 'terminee'
            ? `Quête terminée : ${q.nom}.`
            : e.statut === 'echouee'
              ? `Quête échouée : ${q.nom}.`
              : e.etapesAccomplies.length
                ? `Quête « ${q.nom} » : une étape est accomplie.`
                : `Nouvelle quête : ${q.nom}.`;
      return <p className="recit-quete">{texte}</p>;
    }
    case 'jet':
      return (
        <p className={`recit-jet ${e.jet.reussite ? 'jet-reussi' : 'jet-rate'}`}>
          <span className="recit-de">⚄</span> <TexteJet j={e.jet} />
        </p>
      );
    case 'refus':
      return <p className="recit-refus">{e.texte}</p>;
    default:
      return null;
  }
}
