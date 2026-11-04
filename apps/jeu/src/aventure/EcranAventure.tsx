// Écran d'aventure, mode « livre » : chaque bouton envoie une commande au moteur ; le récit se lit dans le journal
// d'événements de la partie. Le conteur (IA) viendra s'ajouter pour la saisie libre (M4b).
import { useEffect, useRef, useState } from 'react';
import {
  type DonneesMonde,
  type EvenementJeu,
  type FicheScene,
  type Proposition,
  type SceneNarree,
  type Interlocuteur,
  type Jet,
  jouerTour,
  type Echange,
  type Ordre,
  type Partie,
  type Personnage,
} from '@crpg/regles';
import { NOMS_CARAC, NOMS_COMPETENCES } from '../createur/libelles';
import { bibleDe, manifesteDe, urlImage } from '../mondes';
import { etatConteur, llmDuJeu, type EtatConteur } from './conteur';
import type { Aventure } from './partie';
import { BoutonProposition } from './BoutonProposition';
import { BandeauHeros, FicheEncart } from './fiches';
import { GrilleElements } from './GrilleElements';
import { LecteurScene } from './LecteurScene';
import { PagePleine } from './PagePleine';

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
  const recit = useRef<HTMLDivElement>(null);
  // Le conteur (IA) : disponible si le serveur du jeu a une clé ; le joueur lui écrit librement.
  const [conteur, setConteur] = useState<EtatConteur>();
  const [saisie, setSaisie] = useState('');
  const [enCours, setEnCours] = useState<string>();
  const [memoire, setMemoire] = useState<Echange[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [erreurConteur, setErreurConteur] = useState<string>();
  const [depense, setDepense] = useState(0);
  useEffect(() => {
    void etatConteur().then(setConteur);
  }, []);
  const scene = moteur.vue<FicheScene>('scene', partie);
  const interlocuteur = moteur.vue<Interlocuteur | undefined>('interlocuteur', partie);
  const image = useImage(dm.monde.id, 'lieux', scene.lieu.id);
  const imagePnj = useImage(dm.monde.id, 'pnj', interlocuteur?.id);
  const fin = partie.scene.type === 'fin' ? dm.fins.get(partie.scene.fin) : undefined;
  const sceneNarree = moteur.vue<SceneNarree | undefined>('sceneEnCours', partie);
  const sceneRevue = !!sceneNarree && ((partie.modules['scenes'] as { vues?: string[] } | undefined)?.vues ?? []).includes(sceneNarree.id);
  const propositions = moteur.propositions(partie);
  const encarts = moteur.encarts(partie);
  // Les onglets viennent des modules : « Actions », puis ceux que déclarent encarts et propositions (Sac, Grimoire, Journal…).
  const onglets = ['Actions', ...new Set([...encarts.map((e) => e.onglet), ...propositions.flatMap((x) => (x.groupe.onglet ? [x.groupe.onglet] : []))])];
  const [onglet, setOnglet] = useState('Actions');
  const ongletActif = onglets.includes(onglet) ? onglet : 'Actions';
  // La page plein écran d'un onglet qui a une grille (le sac : touche I).
  const [page, setPage] = useState<{ onglet: string; selection?: string }>();
  const encartsDe = (o: string) => encarts.filter((e) => e.onglet === o);
  const pageOuverte = page && encartsDe(page.onglet).some((e) => e.grille) ? page : undefined;
  const nouveautes = (o: string) => encartsDe(o).reduce((n, e) => n + (e.grille?.elements.filter((x) => x.nouveau).length ?? 0), 0);
  // Une rencontre ou une conversation ramène à l'onglet des actions.
  useEffect(() => {
    if (partie.scene.type !== 'exploration') setOnglet('Actions');
  }, [partie.scene.type]);

  useEffect(() => {
    recit.current?.scrollTo({ top: recit.current.scrollHeight, behavior: 'smooth' });
  }, [partie.journal.length, refus]);

  // Les touches des pages (I pour le sac) et Échap pour les fermer ; sans effet pendant une scène narrée ou une saisie.
  useEffect(() => {
    const surTouche = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey || sceneNarree) return;
      const cible = ev.target as HTMLElement | null;
      if (cible && (/^(input|textarea|select)$/i.test(cible.tagName) || cible.isContentEditable)) return;
      if (ev.key === 'Escape' && pageOuverte) return setPage(undefined);
      const e = encarts.find((x) => x.grille?.touche === ev.key.toLowerCase());
      if (e) setPage(pageOuverte?.onglet === e.onglet ? undefined : { onglet: e.onglet });
    };
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  }, [encarts, pageOuverte, sceneNarree]);

  /** Un tour du conteur : le joueur écrit, le conteur agit par les commandes du moteur et raconte. */
  const raconter = async (texte: string) => {
    const t = texte.trim();
    if (!t || enCours) return;
    setEnCours('Le conteur réfléchit…');
    setErreurConteur(undefined);
    setRefus(undefined);
    try {
      const res = await jouerTour({
        moteur,
        partie,
        texte: t,
        bible: await bibleDe(dm.monde.id),
        llm: llmDuJeu(),
        memoire,
        surOutil: (o) => setEnCours(`Le moteur résout : ${o.nom}…`),
      });
      setDepense((d) => d + res.usage.cout);
      if (res.erreur) setErreurConteur(res.erreur);
      else {
        setSaisie('');
        setSuggestions(res.actions);
        setMemoire(res.memoire);
      }
      if (res.partie !== partie) onPartie(res.partie);
    } finally {
      setEnCours(undefined);
    }
  };
  const plafond = conteur?.plafond ?? 0.5;
  const plafondAtteint = (conteur?.depense ?? 0) + depense >= plafond;

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
        {suggestions.length > 0 && !enCours && (
          <div className="aventure-suggestions" aria-label="Actions suggérées par le conteur">
            {suggestions.map((s) => (
              <button key={s} type="button" className="bouton-discret" onClick={() => void raconter(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
        {erreurConteur && <p className="recit-refus">{erreurConteur}</p>}
        <form
          className="aventure-saisie"
          onSubmit={(ev) => {
            ev.preventDefault();
            void raconter(saisie);
          }}
        >
          <input
            type="text"
            value={saisie}
            onChange={(ev) => setSaisie(ev.target.value)}
            disabled={!conteur?.disponible || !!enCours || plafondAtteint}
            maxLength={500}
            placeholder={
              !conteur?.disponible
                ? 'Saisie libre indisponible (pas de clé du conteur sur ce serveur) : jouez avec les actions de droite.'
                : plafondAtteint
                  ? 'Plafond de dépense du conteur atteint.'
                  : enCours
                    ? enCours
                    : 'Que faites-vous ? (le conteur vous répond)'
            }
          />
          <button type="submit" className="bouton" disabled={!conteur?.disponible || !!enCours || plafondAtteint || !saisie.trim()}>
            {enCours ? '…' : 'Raconter ›'}
          </button>
          {conteur?.disponible && (
            <small className="aventure-depense" title={`Modèle : ${conteur.modele}`}>
              {(depense + (conteur.depense ?? 0)).toFixed(3)} $ / {plafond} $
            </small>
          )}
        </form>
      </main>

      <aside className={`aventure-actions ${enCours ? 'occupe' : ''}`} aria-busy={!!enCours}>
        <nav className="onglets" aria-label="Onglets">
          {onglets.map((o) => (
            <button key={o} type="button" className={o === ongletActif ? 'actif' : ''} aria-current={o === ongletActif} onClick={() => setOnglet(o)}>
              {o}
              {nouveautes(o) > 0 && <span className="onglet-nouveau" title={`${nouveautes(o)} nouveau(x)`}>{nouveautes(o)}</span>}
            </button>
          ))}
        </nav>
        {ongletActif !== 'Actions' ? (
          <>
            {encartsDe(ongletActif).map((e) =>
              e.grille ? (
                <section key={e.id} className="panneau-action encart">
                  <h3>{e.titre}</h3>
                  <GrilleElements monde={dm.monde.id} grille={e.grille} cle={e.id} compact heros={partie.groupe} onChoisir={(x) => setPage({ onglet: e.onglet, selection: x.id })} />
                  <button type="button" className="bouton" onClick={() => setPage({ onglet: e.onglet })}>
                    Ouvrir en plein écran{e.grille.touche ? ` (${e.grille.touche.toUpperCase()})` : ''}
                  </button>
                </section>
              ) : (
                <FicheEncart key={e.id} e={e} />
              ),
            )}
            {/* Les actions d'un élément de la grille sont dans sa fiche (page plein écran), pas ici. */}
            <Panneaux
              monde={dm.monde.id}
              propositions={propositions.filter(
                (x) => x.groupe.onglet === ongletActif && !encartsDe(ongletActif).some((e) => e.grille?.elements.some((el) => el.id === x.element?.id)),
              )}
              jouer={jouer}
              onCombat={onCombat}
              groupe={partie.groupe}
            />
          </>
        ) : (
          <>
            {fin && (
              <section className="panneau-action fin-histoire">
                <h3>{fin.nom}</h3>
                <p>{fin.epilogue}</p>
                <button type="button" className="bouton-principal" onClick={onMenu}>
                  Retour au menu
                </button>
              </section>
            )}
            {interlocuteur && (
              <section className="panneau-action">
                <div className="dialogue-entete">
                  <div className="dialogue-portrait" style={imagePnj ? { backgroundImage: `url(${imagePnj})` } : undefined} />
                  <div>
                    <h3>{interlocuteur.nom}</h3>
                    <small>{interlocuteur.role}</small>
                  </div>
                </div>
              </section>
            )}
            <Panneaux
              monde={dm.monde.id}
              propositions={propositions.filter((x) => !x.groupe.onglet)}
              jouer={jouer}
              onCombat={onCombat}
              groupe={partie.groupe}
              cacherTitre={interlocuteur ? 'dialogue' : undefined}
            />
          </>
        )}
      </aside>

      <footer className="aventure-groupe">
        <BandeauHeros groupe={partie.groupe} />
        <button
          type="button"
          className="aventure-sac"
          title={(scene.inventaire.map((o) => `${o.quantite} × ${o.nom}`).join('\n') || 'Sac vide') + '\n\nOuvrir le sac (I)'}
          onClick={() => setPage({ onglet: 'Sac' })}
        >
          Sac : {scene.inventaire.reduce((n, o) => n + o.quantite, 0)} objet(s)
          {nouveautes('Sac') > 0 && <span className="onglet-nouveau">{nouveautes('Sac')}</span>}
        </button>
      </footer>
      {pageOuverte && (
        <PagePleine
          monde={dm.monde.id}
          encarts={encartsDe(pageOuverte.onglet)}
          propositions={propositions.filter((x) => x.groupe.onglet === pageOuverte.onglet)}
          partie={partie}
          selection={pageOuverte.selection}
          onChoisir={(id) => setPage({ onglet: pageOuverte.onglet, selection: id })}
          jouer={jouer}
          onCombat={onCombat}
          onFermer={() => setPage(undefined)}
        />
      )}
      {sceneNarree && <LecteurScene key={sceneNarree.id} monde={dm.monde.id} scene={sceneNarree} revue={sceneRevue} onFin={() => jouer({ type: 'terminerScene', scene: sceneNarree.id })} />}
    </div>
  );
}

/**
 * Les actions proposées par les modules, rangées en panneaux. Cet affichage ne connaît aucune commande : un module
 * qui ajoute des propositions apparaît ici sans code d'interface.
 */
function Panneaux({
  monde,
  propositions,
  jouer,
  onCombat,
  groupe,
  cacherTitre,
}: {
  monde: string;
  propositions: Proposition[];
  jouer: (o: Ordre) => void;
  onCombat: () => void;
  groupe: Personnage[];
  cacherTitre?: string;
}) {
  const panneaux: { groupe: Proposition['groupe']; items: Proposition[] }[] = [];
  for (const p of propositions) {
    const dernier = panneaux[panneaux.length - 1];
    if (dernier && dernier.groupe.id === p.groupe.id) dernier.items.push(p);
    else panneaux.push({ groupe: p.groupe, items: [p] });
  }

  const bouton = (p: Proposition, cle: string) => <BoutonProposition key={cle} p={p} jouer={jouer} onCombat={onCombat} groupe={groupe} monde={monde} />;

  return (
    <>
      {panneaux.map(({ groupe: panneau, items }) => {
        // Dans un panneau : les éléments (un trésor, une sortie verrouillée) sur une ligne chacun ; les actions discrètes
        // côte à côte ; les autres en liste.
        const blocs: { element?: Proposition['element']; items: Proposition[] }[] = [];
        for (const p of items) {
          const dernier = blocs[blocs.length - 1];
          const memeBloc = p.element
            ? dernier?.element?.id === p.element.id
            : !dernier?.element && dernier?.items[0]?.style === 'discret' && p.style === 'discret';
          if (dernier && memeBloc) dernier.items.push(p);
          else blocs.push({ element: p.element, items: [p] });
        }
        return (
          <section key={panneau.id} className={`panneau-action ${panneau.danger ? 'panneau-danger' : ''}`}>
            {cacherTitre !== panneau.id && <h3>{panneau.titre}</h3>}
            {panneau.description && <p className="enonce">{panneau.description}</p>}
            <div className="liste-actions">
              {blocs.map((b, i) =>
                b.element ? (
                  <div key={`${panneau.id}:${b.element.id}`} className={`objet-action ${b.element.danger ? 'objet-danger' : ''}`}>
                    <span>{b.element.titre}</span>
                    <span className="liste-actions-ligne">{b.items.map((p, j) => bouton(p, `${panneau.id}:${b.element!.id}:${j}`))}</span>
                  </div>
                ) : b.items.length > 1 || b.items[0]?.style === 'discret' ? (
                  <div key={`${panneau.id}:${i}`} className="liste-actions-ligne">
                    {b.items.map((p, j) => bouton(p, `${panneau.id}:${i}:${j}`))}
                  </div>
                ) : (
                  bouton(b.items[0]!, `${panneau.id}:${i}`)
                ),
              )}
            </div>
          </section>
        );
      })}
    </>
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
    case 'saisieJoueur':
      return <p className="recit-saisie">▸ {e.texte}</p>;
    case 'recitConteur':
      return (
        <div className="recit-conteur">
          {e.texte.split(/\n{2,}/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      );
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
