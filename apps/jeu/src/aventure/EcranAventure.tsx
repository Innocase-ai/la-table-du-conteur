// Écran d'aventure, mode « livre » : chaque bouton envoie une commande au moteur ; le récit se lit dans le journal
// d'événements de la partie. Le conteur (IA) viendra s'ajouter pour la saisie libre (M4b).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type DonneesMonde,
  type EvenementJeu,
  type FicheScene,
  type Proposition,
  type SceneNarree,
  type Interlocuteur,
  type Jet,
  jouerTour,
  type Ordre,
  type Partie,
  type Personnage,
} from '@crpg/regles';
import { NOMS_CARAC, NOMS_COMPETENCES } from '../createur/libelles';
import { bibleDe, manifesteDe, urlImage } from '../mondes';
import { etatConteur, llmDuJeu, type EtatConteur } from './conteur';
import type { Aventure } from './partie';
import { BoiteDialogue } from './BoiteDialogue';
import { BoutonProposition } from './BoutonProposition';
import { CarteMonde } from './CarteMonde';
import { FeuillePersonnage } from './FeuillePersonnage';
import { BandeauHeros, FicheEncart } from './fiches';
import { GrilleElements } from './GrilleElements';
import { LecteurScene } from './LecteurScene';
import { EcranSommeil } from './EcranSommeil';
import { decorSommeil, detecterSommeil, heuresDormies, type DecorSommeil } from '../sommeil-regles';
import { ControleSon } from '../composants/ControleSon';
import { OUVERTURES } from '../ouvertures';
import { ageApproximatif, choisirOuverture, texteOuverture, tonDeLAttitude, voixDuPnj } from '../ouvertures-regles';
import { direOuverture } from '../voix';
import { PageCarte } from './PageCarte';
import { PagePleine } from './PagePleine';

/** Le moment de la journée, pour l'en-tête (les présences des PNJ, elles, ne distinguent que jour, soir et nuit). */
const momentLisible = (heure: number) => (heure >= 6 && heure < 12 ? 'matin' : heure >= 12 && heure < 18 ? 'après-midi' : heure >= 18 && heure < 22 ? 'soir' : 'nuit');

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

/**
 * Ce qui vient de se dire dans la conversation en cours : la dernière parole du personnage et ce qui l'a suivie (ce que le
 * groupe apprend, un jet d'influence). Sans parole du personnage, la fin du journal jusqu'à l'arrivée au lieu, à la saisie
 * du joueur ou à la parole d'un autre personnage.
 */
function entreesDeConversation(journal: EvenementJeu[], pnj: string): EvenementJeu[] {
  const derniere = journal.map((e) => e.type === 'texte' && e.voix === pnj).lastIndexOf(true);
  if (derniere >= 0) return journal.slice(derniere);
  const res: EvenementJeu[] = [];
  for (let i = journal.length - 1; i >= 0 && res.length < 12; i--) {
    const e = journal[i]!;
    if (e.type === 'arrivee' || e.type === 'deplacement' || e.type === 'saisieJoueur' || e.type === 'recitConteur') break;
    if (e.type === 'texte' && e.voix && e.voix !== pnj) break;
    res.unshift(e);
  }
  return res;
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

/** Ce que l'écran affiche pendant que le conteur agit : jamais le nom d'une commande, toujours un geste du groupe. */
const PENDANT_OUTIL: Record<string, string> = {
  aller: 'En route…',
  fouiller: 'Le groupe fouille…',
  ouvrir: 'Le groupe tente d’ouvrir…',
  desarmer: 'Des doigts prudents sur le mécanisme…',
  prendre: 'Le groupe se sert…',
  repondreEnigme: 'Le groupe tente une réponse…',
  indiceEnigme: 'Le groupe réfléchit…',
  seReposer: 'Un temps de repos…',
  testLibre: 'Le groupe s’y essaie…',
  parler: 'La conversation s’engage…',
  influencer: 'Les mots se font plus pressants…',
  quitterDialogue: 'Le groupe prend congé…',
  utiliserObjet: 'Le groupe fouille dans le sac…',
  lancerSort: 'Une formule s’élève…',
  imposerLesMains: 'Des mains se posent sur une blessure…',
  equiper: 'On ajuste l’équipement…',
  retirerEquipement: 'On ajuste l’équipement…',
  accepterQuete: 'Une promesse est faite…',
  acheter: 'On marchande…',
  vendre: 'On marchande…',
  payerService: 'Quelques pièces changent de main…',
};

export function EcranAventure({ aventure, onPartie, onCombat, onMenu }: Props) {
  const { moteur, partie } = aventure;
  const dm = moteur.ctx.dm;
  const [refus, setRefus] = useState<string>();
  const recit = useRef<HTMLDivElement>(null);
  // Le conteur (IA) : disponible si le serveur du jeu a une clé ; le joueur lui écrit librement.
  const [conteur, setConteur] = useState<EtatConteur>();
  const [saisie, setSaisie] = useState('');
  const [enCours, setEnCours] = useState<string>();
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
  // La conversation : les répliques du joueur (touches 1 à 9) et « Fin du dialogue » vont dans la boîte posée sur la scène.
  const delaConversation = (x: Proposition) => !!interlocuteur && x.groupe.id === 'dialogue';
  const choixDialogue = propositions.filter((x) => delaConversation(x) && x.ordre?.type !== 'quitterDialogue');
  const finDialogue = propositions.find((x) => delaConversation(x) && x.ordre?.type === 'quitterDialogue');
  const entreesDialogue = interlocuteur ? entreesDeConversation(partie.journal, interlocuteur.nom) : [];
  // Le sommeil : quand une nuit vient d'être dormie (bouton « Dormir », chambre payée, conteur), l'écran de sommeil s'ouvre.
  // On le repère dans les nouvelles entrées du journal (le moteur écrit « Le groupe se repose une nuit entière »).
  const [sommeil, setSommeil] = useState<{ decor: DecorSommeil; heureDebut: number; heures: number; interrompu: boolean }>();
  const avantSommeil = useRef({ jour: partie.etat.jour, heure: partie.etat.heure ?? 8, journal: partie.journal.length });
  useEffect(() => {
    const avant = avantSommeil.current;
    const nouvelles = partie.journal.length >= avant.journal ? partie.journal.slice(avant.journal) : partie.journal.slice(-12);
    avantSommeil.current = { jour: partie.etat.jour, heure: partie.etat.heure ?? 8, journal: partie.journal.length };
    const nuit = detecterSommeil(nouvelles);
    if (!nuit || partie.etat.jour <= avant.jour) return;
    setSommeil({
      decor: decorSommeil(dm.lieux.get(partie.etat.lieu)?.type, nuit.nuitPayee),
      heureDebut: avant.heure,
      heures: heuresDormies(avant, { jour: partie.etat.jour, heure: partie.etat.heure ?? 8 }),
      interrompu: partie.scene.type === 'rencontre',
    });
  }, [partie, dm]);
  const finSommeil = useCallback(() => setSommeil(undefined), []);

  // L'ouverture : à chaque début de conversation, le PNJ lance d'abord une phrase tirée d'un fonds commun, dite avec la voix
  // d'homme ou de femme qui est la sienne (toujours la même), puis vient sa salutation propre.
  const [ouverture, setOuverture] = useState<{ pnj: string; texte: string }>();
  const derniereOuverture = useRef<string>();
  const idInterlocuteur = interlocuteur?.id;
  useEffect(() => {
    if (!idInterlocuteur) {
      setOuverture(undefined);
      return;
    }
    const pnj = dm.pnj.get(idInterlocuteur);
    const donnees = OUVERTURES;
    if (!pnj || !donnees?.voix) return;
    const attitude = moteur.vue<{ attitude: number } | undefined>('interlocuteur', partie)?.attitude ?? 0;
    const o = choisirOuverture(donnees.ouvertures, tonDeLAttitude(attitude, Math.random()), derniereOuverture.current, Math.random());
    const voix = voixDuPnj(donnees.voix, pnj.sexe, pnj.id, ageApproximatif(pnj.age));
    derniereOuverture.current = o.id;
    setOuverture({ pnj: pnj.id, texte: texteOuverture(o, voix.id.startsWith('f-') ? 'f' : 'm') });
    direOuverture(voix.id, o.id);
    // Une seule fois par conversation : seul le changement d'interlocuteur la relance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idInterlocuteur]);
  // Les encarts se recalculent quand la partie change, pas à chaque frappe dans la saisie du conteur.
  const encarts = useMemo(() => moteur.encarts(partie), [moteur, partie]);
  // Les onglets viennent des modules : « Actions », puis ceux que déclarent encarts et propositions (Sac, Grimoire, Journal…).
  const onglets = ['Actions', ...new Set([...encarts.map((e) => e.onglet), ...propositions.flatMap((x) => (x.groupe.onglet ? [x.groupe.onglet] : []))])];
  const [onglet, setOnglet] = useState('Actions');
  const ongletActif = onglets.includes(onglet) ? onglet : 'Actions';
  // La page plein écran d'un onglet qui a une grille (le sac : touche I).
  const [page, setPage] = useState<{ onglet: string; selection?: string }>();
  // La feuille de personnage d'un héros (touche C, ou un clic sur le bandeau).
  const [feuille, setFeuille] = useState<string>();
  // La carte du monde en plein écran (touche M).
  const [carteOuverte, setCarteOuverte] = useState(false);
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
      if (ev.ctrlKey || ev.metaKey || ev.altKey || sceneNarree || feuille || sommeil) return;
      const cible = ev.target as HTMLElement | null;
      if (cible && (/^(input|textarea|select)$/i.test(cible.tagName) || cible.isContentEditable)) return;
      if (ev.key.toLowerCase() === 'm' && encarts.some((e) => e.carte)) return setCarteOuverte((o) => !o);
      if (ev.key === 'Escape' && carteOuverte) return setCarteOuverte(false);
      if (ev.key.toLowerCase() === 'c' && partie.groupe.length) return setFeuille(partie.groupe.find((h) => h.pv > 0)?.id ?? partie.groupe[0]!.id);
      if (ev.key === 'Escape' && pageOuverte) return setPage(undefined);
      const e = encarts.find((x) => x.grille?.touche === ev.key.toLowerCase());
      if (e) setPage(pageOuverte?.onglet === e.onglet ? undefined : { onglet: e.onglet });
    };
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  }, [encarts, pageOuverte, sceneNarree, feuille, partie.groupe, carteOuverte]);

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
        // La mémoire du conteur vient du journal de la partie : rien à garder ici, elle survit au rechargement.
        surOutil: (o) => setEnCours(PENDANT_OUTIL[o.nom] ?? 'Le récit se poursuit…'),
      });
      setDepense((d) => d + res.usage.cout);
      if (res.erreur) setErreurConteur(res.erreur);
      else {
        setSaisie('');
        setSuggestions(res.actions);
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

  // Pendant une conversation : les touches 1 à 9 choisissent une réplique, Échap met fin au dialogue. Sans effet pendant une
  // scène narrée, dans un champ de saisie, ou quand une page plein écran est ouverte.
  useEffect(() => {
    if (!interlocuteur || sceneNarree || pageOuverte || feuille || carteOuverte || sommeil) return;
    const surTouche = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const cible = ev.target as HTMLElement | null;
      if (cible && (/^(input|textarea|select)$/i.test(cible.tagName) || cible.isContentEditable)) return;
      if (ev.key === 'Escape' && finDialogue?.ordre) return jouer(finDialogue.ordre);
      const n = Number(ev.key);
      const choix = Number.isInteger(n) && n >= 1 ? choixDialogue[n - 1] : undefined;
      if (choix?.ordre && !choix.desactivee) jouer(choix.ordre);
    };
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  });

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
          <span title={`${scene.heure} h`}>
            Jour {scene.jour} · {momentLisible(scene.heure)}
          </span>
          {scene.jauges.map((j) => (
            <span key={j.id} className="aventure-jauge" title={[dm.jauges.get(j.id)?.resume, j.prochain ? `Prochain palier : ${j.prochain}.` : 'Dernier palier atteint.'].filter(Boolean).join('\n\n')}>
              {j.nom} {j.max <= 10 ? `${'●'.repeat(Math.max(0, j.valeur))}${'○'.repeat(Math.max(0, j.max - j.valeur))}` : `${j.valeur}/${j.max}`}
              {j.palier ? ` · ${j.palier}` : ''}
            </span>
          ))}
          <span>{scene.pieces.toLocaleString('fr-FR')} po</span>
          <ControleSon />
        </div>
      </header>

      <main className="aventure-centre">
        <div className={`aventure-image${interlocuteur ? ' en-dialogue' : ''}`} style={image ? { backgroundImage: `url(${image})` } : undefined}>
          {interlocuteur ? (
            <BoiteDialogue
              nom={interlocuteur.nom}
              role={interlocuteur.role}
              portrait={imagePnj}
              nombreEntrees={entreesDialogue.length + (refus ? 1 : 0)}
              choix={choixDialogue}
              fin={finDialogue}
              jouer={jouer}
            >
              {ouverture && ouverture.pnj === interlocuteur.id && (
                <p className="recit-parole">
                  <strong>{interlocuteur.nom}</strong> « {ouverture.texte} »
                </p>
              )}
              {entreesDialogue.map((e, i) => (
                <EntreeRecit key={i} e={e} dm={dm} />
              ))}
              {refus && <p className="recit-refus">{refus}</p>}
            </BoiteDialogue>
          ) : (
            <div className="aventure-image-legende">
              <strong>{scene.lieu.nom}</strong>
              <span>{scene.lieu.resume}</span>
            </div>
          )}
        </div>
        {!interlocuteur && (
          <div className="aventure-recit" ref={recit}>
            {partie.journal.map((e, i) => (
              <EntreeRecit key={i} e={e} dm={dm} />
            ))}
            {refus && <p className="recit-refus">{refus}</p>}
          </div>
        )}
        {suggestions.length > 0 && !enCours && !interlocuteur && (
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
              e.carte ? (
                <section key={e.id} className="panneau-action encart">
                  <h3>{e.titre}</h3>
                  <CarteMonde monde={dm.monde.id} carte={e.carte} jouer={jouer} />
                  <button type="button" className="bouton" onClick={() => setCarteOuverte(true)}>
                    Ouvrir en plein écran (M)
                  </button>
                </section>
              ) : e.grille ? (
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
                <h3>Conversation</h3>
                <p className="enonce">
                  Vous parlez à {interlocuteur.nom}. Choisissez une réplique dans la boîte de dialogue, sur l'illustration (touches 1 à 9, Échap pour finir).
                </p>
              </section>
            )}
            <Panneaux monde={dm.monde.id} propositions={propositions.filter((x) => !x.groupe.onglet && !delaConversation(x))} jouer={jouer} onCombat={onCombat} groupe={partie.groupe} />
          </>
        )}
      </aside>

      <footer className="aventure-groupe">
        <BandeauHeros groupe={partie.groupe} onChoisir={setFeuille} />
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
      {carteOuverte && !sceneNarree && !feuille && encarts.find((e) => e.carte)?.carte && (
        <PageCarte monde={dm.monde.id} carte={encarts.find((e) => e.carte)!.carte!} groupe={partie.groupe} jouer={jouer} onFermer={() => setCarteOuverte(false)} />
      )}
      {feuille && !sceneNarree && (
        <FeuillePersonnage ctx={moteur.ctx} partie={partie} heros={feuille} onChoisir={setFeuille} propositions={propositions} jouer={jouer} onFermer={() => setFeuille(undefined)} />
      )}
      {sommeil && <EcranSommeil decor={sommeil.decor} heureDebut={sommeil.heureDebut} heures={sommeil.heures} interrompu={sommeil.interrompu} onFin={finSommeil} />}
      {sceneNarree && !sommeil && <LecteurScene key={sceneNarree.id} monde={dm.monde.id} scene={sceneNarree} revue={sceneRevue} onFin={() => jouer({ type: 'terminerScene', scene: sceneNarree.id })} />}
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
