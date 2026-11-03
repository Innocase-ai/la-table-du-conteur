// Écran d'aventure, mode « livre » : chaque bouton envoie une commande au moteur ; le récit se lit dans le journal
// d'événements de la partie. Le conteur (IA) viendra s'ajouter pour la saisie libre (M4b).
import { useEffect, useRef, useState } from 'react';
import {
  etatDurableMax,
  type DonneesMonde,
  type EvenementJeu,
  type Encart,
  type FicheScene,
  type Proposition,
  type SceneNarree,
  type Interlocuteur,
  type Jet,
  type Ordre,
  type Partie,
  type Personnage,
} from '@crpg/regles';
import { NOMS_CARAC, NOMS_COMPETENCES } from '../createur/libelles';
import { Portrait } from '../createur/ui';
import { manifesteDe, urlImage } from '../mondes';
import type { Aventure } from './partie';
import { LecteurScene } from './LecteurScene';

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

const NOMS_RESSOURCES: Record<string, string> = {
  potions: 'Potions',
  secondSouffle: 'Second souffle',
  fougue: 'Fougue',
  rages: 'Rages',
  conduit: 'Conduit divin',
};

/** Ressources d'un héros en une ligne : potions, emplacements de sorts restants, usages d'aptitudes. */
function resumeRessources(a: Personnage): { court: string; detail: string } {
  const max = etatDurableMax(a.fiche);
  const sorts = a.emplacements.reduce((s, n) => s + n, 0);
  const sortsMax = max.emplacements.reduce((s, n) => s + n, 0);
  const court = [`Potions ${a.ressources.potions ?? 0}`, sortsMax ? `Sorts ${sorts}/${sortsMax}` : ''].filter(Boolean).join(' · ');
  const detail = Object.entries(a.ressources)
    .map(([k, v]) => `${NOMS_RESSOURCES[k] ?? k} : ${v}${k !== 'potions' && max.ressources[k] !== undefined ? `/${max.ressources[k]}` : ''}`)
    .concat(a.emplacements.map((n, i) => (max.emplacements[i] ? `Emplacements niv. ${i + 1} : ${n}/${max.emplacements[i]}` : '')).filter(Boolean))
    .join('\n');
  return { court, detail };
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
  const scene = moteur.vue<FicheScene>('scene', partie);
  const interlocuteur = moteur.vue<Interlocuteur | undefined>('interlocuteur', partie);
  const image = useImage(dm.monde.id, 'lieux', scene.lieu.id);
  const imagePnj = useImage(dm.monde.id, 'pnj', interlocuteur?.id);
  const fin = partie.scene.type === 'fin' ? dm.fins.get(partie.scene.fin) : undefined;
  const sceneNarree = moteur.vue<SceneNarree | undefined>('sceneEnCours', partie);
  const propositions = moteur.propositions(partie);
  const encarts = moteur.encarts(partie);
  // Les onglets viennent des modules : « Actions », puis ceux que déclarent encarts et propositions (Sac, Grimoire, Journal…).
  const onglets = ['Actions', ...new Set([...encarts.map((e) => e.onglet), ...propositions.flatMap((x) => (x.groupe.onglet ? [x.groupe.onglet] : []))])];
  const [onglet, setOnglet] = useState('Actions');
  const ongletActif = onglets.includes(onglet) ? onglet : 'Actions';
  // Une rencontre ou une conversation ramène à l'onglet des actions.
  useEffect(() => {
    if (partie.scene.type !== 'exploration') setOnglet('Actions');
  }, [partie.scene.type]);

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
        <nav className="onglets" aria-label="Onglets">
          {onglets.map((o) => (
            <button key={o} type="button" className={o === ongletActif ? 'actif' : ''} aria-current={o === ongletActif} onClick={() => setOnglet(o)}>
              {o}
            </button>
          ))}
        </nav>
        {ongletActif !== 'Actions' ? (
          <>
            {encarts
              .filter((e) => e.onglet === ongletActif)
              .map((e) => (
                <FicheEncart key={e.id} e={e} />
              ))}
            <Panneaux propositions={propositions.filter((x) => x.groupe.onglet === ongletActif)} jouer={jouer} onCombat={onCombat} />
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
              propositions={propositions.filter((x) => !x.groupe.onglet)}
              jouer={jouer}
              onCombat={onCombat}
              cacherTitre={interlocuteur ? 'dialogue' : undefined}
            />
          </>
        )}
      </aside>

      <footer className="aventure-groupe">
        {partie.groupe.map((a) => {
          const res = resumeRessources(a);
          return (
            <div
              key={a.id}
              className={`aventure-heros ${a.pv <= 0 ? 'aventure-heros-tombe' : ''}`}
              title={`${a.nom} — ${a.pv}/${a.fiche.pvMax} PV\n${res.detail}`}
            >
              <Portrait id={a.portrait} espece={a.fiche.espece} classe={a.fiche.classe} taille={40} />
              <div>
                <strong>{a.nom}</strong>
                <div className="barre">
                  <div
                    className={`barre-remplie ${a.pv / a.fiche.pvMax > 0.5 ? 'pv-haut' : a.pv / a.fiche.pvMax > 0.25 ? 'pv-moyen' : 'pv-bas'}`}
                    style={{ width: `${(Math.max(0, a.pv) / a.fiche.pvMax) * 100}%` }}
                  />
                </div>
                <small className="aventure-ressources">{res.court}</small>
              </div>
            </div>
          );
        })}
        <div className="aventure-sac" title={scene.inventaire.map((o) => `${o.quantite} × ${o.nom}`).join('\n') || 'Sac vide'}>
          Sac : {scene.inventaire.reduce((s, o) => s + o.quantite, 0)} objet(s)
        </div>
      </footer>
      {sceneNarree && <LecteurScene key={sceneNarree.id} monde={dm.monde.id} scene={sceneNarree} onFin={() => jouer({ type: 'terminerScene', scene: sceneNarree.id })} />}
    </div>
  );
}

/** Une fiche d'information d'un module (sac, grimoire, journal…). */
function FicheEncart({ e }: { e: Encart }) {
  return (
    <section className="panneau-action encart">
      <h3>{e.titre}</h3>
      {e.texte && <p className="encart-texte">{e.texte}</p>}
      {e.lignes?.map((l, i) => (
        <div key={i} className={`encart-ligne ${l.ton ? `ton-${l.ton}` : ''}`}>
          <div className="encart-tete">
            <span>{l.libelle}</span>
            {l.valeur && <span className="encart-valeur">{l.valeur}</span>}
          </div>
          {l.detail && <p className="encart-detail">{l.detail}</p>}
        </div>
      ))}
    </section>
  );
}

/**
 * Les actions proposées par les modules, rangées en panneaux. Cet affichage ne connaît aucune commande : un module
 * qui ajoute des propositions apparaît ici sans code d'interface.
 */
function Panneaux({
  propositions,
  jouer,
  onCombat,
  cacherTitre,
}: {
  propositions: Proposition[];
  jouer: (o: Ordre) => void;
  onCombat: () => void;
  cacherTitre?: string;
}) {
  const [saisies, setSaisies] = useState<Record<string, string>>({});
  const panneaux: { groupe: Proposition['groupe']; items: Proposition[] }[] = [];
  for (const p of propositions) {
    const dernier = panneaux[panneaux.length - 1];
    if (dernier && dernier.groupe.id === p.groupe.id) dernier.items.push(p);
    else panneaux.push({ groupe: p.groupe, items: [p] });
  }

  const bouton = (p: Proposition, cle: string) => {
    if (p.saisie) {
      const valeur = saisies[cle] ?? '';
      return (
        <form
          key={cle}
          className="enigme-reponse"
          onSubmit={(ev) => {
            ev.preventDefault();
            if (p.ordre && valeur.trim()) jouer({ ...p.ordre, [p.saisie!.champ]: valeur.trim() });
          }}
        >
          <input type="text" value={valeur} placeholder={p.saisie.indication} onChange={(ev) => setSaisies({ ...saisies, [cle]: ev.target.value })} />
          <button type="submit" className="bouton" disabled={!valeur.trim() || !!p.desactivee}>
            {p.libelle}
          </button>
        </form>
      );
    }
    const classe = p.style === 'principal' ? 'bouton-principal' : p.style === 'discret' ? 'bouton-discret' : 'bouton';
    const detail = p.detail ? (NOMS_COMPETENCES[p.detail as keyof typeof NOMS_COMPETENCES] ?? p.detail) : undefined;
    return (
      <button
        key={cle}
        type="button"
        className={classe}
        disabled={!!p.desactivee}
        title={p.desactivee ?? p.aide}
        onClick={() => (p.intention === 'combattre' ? onCombat() : p.ordre && jouer(p.ordre))}
      >
        {p.libelle}
        {detail && <small> — {detail}</small>}
      </button>
    );
  };

  return (
    <>
      {panneaux.map(({ groupe, items }) => {
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
          <section key={groupe.id} className={`panneau-action ${groupe.danger ? 'panneau-danger' : ''}`}>
            {cacherTitre !== groupe.id && <h3>{groupe.titre}</h3>}
            {groupe.description && <p className="enonce">{groupe.description}</p>}
            <div className="liste-actions">
              {blocs.map((b, i) =>
                b.element ? (
                  <div key={`${groupe.id}:${b.element.id}`} className={`objet-action ${b.element.danger ? 'objet-danger' : ''}`}>
                    <span>{b.element.titre}</span>
                    <span className="liste-actions-ligne">{b.items.map((p, j) => bouton(p, `${groupe.id}:${b.element!.id}:${j}`))}</span>
                  </div>
                ) : b.items.length > 1 || b.items[0]?.style === 'discret' ? (
                  <div key={`${groupe.id}:${i}`} className="liste-actions-ligne">
                    {b.items.map((p, j) => bouton(p, `${groupe.id}:${i}:${j}`))}
                  </div>
                ) : (
                  bouton(b.items[0]!, `${groupe.id}:${i}`)
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
