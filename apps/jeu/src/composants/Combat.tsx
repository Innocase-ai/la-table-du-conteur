import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  actif,
  aEtat,
  apercuCarte,
  doitFuir,
  cartesDisponibles,
  casesZone,
  choisirEtape,
  cle,
  creerCombat,
  deplacementsPossibles,
  distanceMetres,
  executer,
  jouerTourIA,
  memePosition,
  peutAgir,
  preparerRencontre,
  typeCase,
  type Carte,
  type Combattant,
  type Commande,
  type Donnees,
  type EtatCombat,
  type Position,
} from '@crpg/regles';
import { OPTIONS_IA, type Reglages } from '../App';
import { capturer, effetDeReplique, etatAffiche, mouvementReduit, useAnimations, type Instantane } from '../animations';
import { REPLIQUES } from '../repliques';
import { prechargerVoix } from '../voix';
import { choisirReplique, declencheurs, nouvelleMemoire, voixDuPortrait, type Replique } from '../repliques-regles';
import { ciblesRepetables, formatMetres } from '../libelles';
import { carteDeTouche, sectionsDeMain, texteApercu, toutEstJoue, touchesDeCartes } from '../main-cartes-regles';
import { arreterMusique, demarrerMusique } from '../musique';
import { Fiche } from './Fiche';
import { Illustration } from './Illustration';
import { FinCombat } from './FinCombat';
import type { XpHistoire } from './xp-combat';
import { Initiative } from './Initiative';
import { cleDeSort } from '../pictogrammes-regles';
import { Journal } from './Journal';
import { MainCartes, useSectionsRepliees } from './MainCartes';
import { PanneauTour } from './PanneauTour';
import { Plateau, type Surcouches } from './Plateau';

interface Props {
  donnees: Donnees;
  reglages: Reglages;
  graine: number;
  onRejouer: () => void;
  onRetour: () => void;
  /** Combat d'une histoire : pas de « Rejouer » ; à la fin (ou en fuyant), l'état final revient au récit. */
  onFinHistoire?: (etat: EtatCombat) => void;
  /** Combat d'une histoire : l'XP que la victoire rapportera, affichée dans le panneau de fin. */
  xpHistoire?: XpHistoire;
  /** Combat d'une histoire repris d'une sauvegarde : on reprend cet état (dés compris), on ne crée pas un nouveau combat. */
  etatInitial?: EtatCombat;
  /** Combat d'une histoire : appelé au début puis après chaque action (la sauvegarde du combat en cours). */
  onProgres?: (etat: EtatCombat) => void;
}

interface Selection {
  carte: string;
  cibles: string[];
}

// Pause après les animations, avant l'étape suivante de l'IA.
const DELAI_IA = 280;
const DELAI_IA_RAPIDE = 90;

export function Combat({ donnees, reglages, graine, onRejouer, onRetour, onFinHistoire, xpHistoire, etatInitial, onProgres }: Props) {
  const ctx = useMemo(() => ({ sorts: donnees.sorts }), [donnees]);
  // Le moteur mute l'état en place : on le garde dans une ref et on force le rendu avec `version`.
  const etatRef = useRef<EtatCombat | null>(null);
  if (!etatRef.current && etatInitial) etatRef.current = structuredClone(etatInitial);
  if (!etatRef.current) {
    const { grille, combattants } = preparerRencontre(reglages.rencontre, donnees, reglages.herosCombat);
    etatRef.current = creerCombat(grille, combattants, graine, { elan: reglages.elan, ...(reglages.rencontre.surprise ? { surpris: [reglages.rencontre.surprise] } : {}) });
  }
  const etat = etatRef.current;
  const [version, setVersion] = useState(0);
  const rafraichir = useCallback(() => setVersion((v) => v + 1), []);
  // Sauvegarde du combat d'une histoire : au début, puis après chaque action (version change à chaque commande exécutée).
  useEffect(() => {
    onProgres?.(etat);
  }, [version]);

  const [selection, setSelection] = useState<Selection | null>(null);
  const [survolCase, setSurvolCase] = useState<Position | null>(null);
  const [survolId, setSurvolId] = useState<string | null>(null);
  // Fiche épinglée : un clic sur un combattant (hors choix de cible) garde ses renseignements à l'écran ; Échap ou un second clic la retire.
  const [epingle, setEpingle] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rapide, setRapide] = useState(false);
  const [pensee, setPensee] = useState<string | null>(null);
  const [masquerFin, setMasquerFin] = useState(false);
  // L'IA peut jouer le tour d'un héros (une fois, ou pour tous les héros).
  const [tourAuto, setTourAuto] = useState<string | null>(null);
  const [herosAuto, setHerosAuto] = useState(false);

  const reduit = useMemo(() => mouvementReduit(), []);
  const vitesse = (rapide ? 0.4 : 1) * (reduit ? 0.5 : 1);
  // Cris des compagnons notés dans le journal : seulement ceux vraiment dits (une bulle trop en retard est abandonnée).
  const [repliques, setRepliques] = useState<Replique[]>([]);
  const anim = useAnimations(donnees, vitesse, (r) => setRepliques((l) => [...l, r]));
  const occupe = anim.enCours;
  // État affiché : en retard sur le moteur tant que la file d'animations joue.
  const vue = etatAffiche(etat, anim.vue, occupe);
  const cVue = actif(vue);

  const c = actif(etat);
  const termine = !!etat.vainqueur;
  // Le bilan attend que la dernière réplique (la victoire, souvent) ait été lue.
  const finAffichee = termine && !occupe && !anim.parle();
  const cleCourante = `${etat.round}:${etat.actif}`;
  const tourJoueur = !termine && c.camp === 'heros' && peutAgir(c) && !herosAuto && tourAuto !== cleCourante;

  const cartes = useMemo(() => (termine || !peutAgir(c) ? [] : cartesDisponibles(etat, ctx, c.id)), [version, c.id, termine]);
  const chemins = useMemo(() => (tourJoueur ? deplacementsPossibles(etat, c) : new Map<string, { cout: number; etapes: Position[] }>()), [version, tourJoueur]);
  const carte: Carte | undefined = selection && tourJoueur ? cartes.find((k) => k.id === selection.carte) : undefined;
  const sort = carte?.categorie === 'sort' ? donnees.sorts.get(carte.id.slice('sort:'.length)) : undefined;
  const personnel = sort?.portee.type === 'personnel';
  const modeCible: Surcouches['modeCible'] = !carte ? 'aucun' : carte.ciblage === 'point' ? 'point' : 'cibles';

  // La main : des sections (Élan, Attaques, Sorts… puis « Indisponibles »), et les touches 1 à 9 sur les cartes jouables visibles.
  const cartesAffichees = useMemo(() => (occupe && cVue.id !== c.id ? [] : cartes), [cartes, occupe, cVue.id, c.id]);
  const sections = useMemo(() => sectionsDeMain(cartesAffichees), [cartesAffichees]);
  const [repliees, basculerSection] = useSectionsRepliees();
  const numeros = useMemo(() => touchesDeCartes(sections, repliees), [sections, repliees]);

  // Musique d'ambiance : une au hasard à chaque combat (jamais la même deux fois de suite), qui s'éteint en douceur quand le
  // combat se termine et à la sortie de l'écran.
  useEffect(() => {
    demarrerMusique();
    return () => arreterMusique(0.8);
  }, []);
  useEffect(() => {
    if (finAffichee) arreterMusique(3);
  }, [finAffichee]);

  // Cris des compagnons : la voix vient de la race et du genre du portrait ; dits dans une bulle et notés au journal.
  const memoireRepliques = useRef(nouvelleMemoire());
  // Au début du combat, un héros donne le ton (après un court instant, que le plateau soit affiché).
  useEffect(() => {
    prechargerVoix(etat.combattants.flatMap((x) => (x.camp === 'heros' ? [voixDuPortrait(x.portrait) ?? ''] : [])));
    const t = window.setTimeout(() => {
      // Un combat repris d'une sauvegarde est déjà commencé : pas de cri de début.
      if (!REPLIQUES || etatInitial) return;
      const r = choisirReplique([{ situation: 'debut-combat', apres: etat.journal.length }], etat, REPLIQUES, memoireRepliques.current, Math.random);
      if (!r) return;
      const lieu = etat.combattants.find((x) => x.id === r.locuteur)?.position;
      if (lieu) anim.afficher(effetDeReplique(r, lieu));
    }, 700);
    return () => window.clearTimeout(t);
  }, []);

  // Messages éphémères.
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(null), 3200);
    return () => window.clearTimeout(t);
  }, [message]);

  // ---------------------------------------------------------------------------
  // Commandes du joueur
  // ---------------------------------------------------------------------------

  /** Rejoue les entrées de journal ajoutées depuis `avant`, avec la réplique d'un compagnon si la situation s'y prête. */
  const rejouer = (avant: Instantane) => {
    const r = REPLIQUES ? choisirReplique(declencheurs(etat, avant), etat, REPLIQUES, memoireRepliques.current, Math.random) : undefined;
    anim.jouer(etat, avant, r ? [r] : []);
  };

  /** Exécute une commande puis rejoue ses entrées de journal en animation. */
  const executerAnime = (cmd: Commande) => {
    const avant = capturer(etat);
    const r = executer(etat, ctx, cmd);
    rejouer(avant);
    return r;
  };

  const jouer = (cmd: Commande) => {
    if (occupe) {
      anim.terminer();
      return;
    }
    const r = executerAnime(cmd);
    if (!r.ok) setMessage(r.erreur);
    setSelection(null);
    rafraichir();
  };

  const pointValide = (p: Position): boolean => {
    if (!carte || typeCase(etat.grille, p) === 'mur') return false;
    if (personnel) return !memePosition(p, c.position);
    return distanceMetres(c.position, p) <= Math.max(carte.portee ?? 0, 1.5);
  };

  const choisirCarte = (k: Carte) => {
    if (occupe) {
      anim.terminer();
      return;
    }
    if (!tourJoueur) return;
    if (selection?.carte === k.id) {
      setSelection(null);
      return;
    }
    if (k.ciblage === 'point') setSelection({ carte: k.id, cibles: [] });
    else if (k.nbCibles === 0) jouer({ type: 'jouer', carte: k.id });
    else setSelection({ carte: k.id, cibles: [] });
  };

  const valider = (cibles = selection?.cibles ?? []) => {
    if (!carte || !cibles.length) return;
    jouer({ type: 'jouer', carte: carte.id, cibles });
  };

  const clicCase = (p: Position) => {
    if (occupe) {
      anim.terminer();
      return;
    }
    if (!tourJoueur) return;
    if (modeCible === 'point') {
      if (pointValide(p)) jouer({ type: 'jouer', carte: carte!.id, point: p });
      else setMessage('Point hors de portée.');
      return;
    }
    if (modeCible === 'cibles') return;
    if (chemins.has(cle(p))) jouer({ type: 'deplacer', vers: p });
  };

  const clicJeton = (t: Combattant) => {
    if (occupe) {
      anim.terminer();
      return;
    }
    if (modeCible !== 'cibles' || !carte || !selection) {
      // Hors choix de cible, cliquer un combattant affiche ses renseignements (sa case est occupée : on ne peut pas s'y déplacer).
      setEpingle((x) => (x === t.id ? null : t.id));
      return;
    }
    if (!carte.cibles.includes(t.id)) {
      setMessage(`${t.nom} n'est pas une cible valide pour ${carte.nom}.`);
      return;
    }
    let cibles: string[];
    if (ciblesRepetables(carte)) cibles = [...selection.cibles, t.id];
    else cibles = selection.cibles.includes(t.id) ? selection.cibles.filter((x) => x !== t.id) : [...selection.cibles, t.id];
    const max = ciblesRepetables(carte) ? carte.nbCibles : Math.min(carte.nbCibles, carte.cibles.length);
    if (cibles.length >= max) valider(cibles);
    else setSelection({ ...selection, cibles });
  };

  // Clavier : Échap annule, Entrée valide une sélection multiple, 1 à 9 jouent la carte du même numéro, F termine le tour.
  const clavier = useRef<(e: KeyboardEvent) => void>(() => {});
  clavier.current = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const cible = e.target as HTMLElement | null;
    const saisie = !!cible && (/^(input|textarea|select)$/i.test(cible.tagName) || cible.isContentEditable);
    if (e.key === 'Escape') {
      if (selection) setSelection(null);
      else setEpingle(null);
    }
    if (e.key === 'Enter' && selection?.cibles.length) valider();
    if (saisie || !tourJoueur || occupe || termine) return;
    const idCarte = carteDeTouche(e.key, numeros);
    const k = idCarte ? cartes.find((x) => x.id === idCarte) : undefined;
    if (k) choisirCarte(k);
    else if (e.key === 'f' || e.key === 'F') jouer({ type: 'finTour' });
  };
  useEffect(() => {
    const f = (e: KeyboardEvent) => clavier.current(e);
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, []);

  // ---------------------------------------------------------------------------
  // Tours des monstres : l'IA joue étape par étape, une commande à la fois.
  // ---------------------------------------------------------------------------

  const cleTour = useRef('');
  const fileIA = useRef<Commande[]>([]);
  const etapesIA = useRef(0);

  const nomsDans = (texte: string) => {
    let t = texte;
    for (const x of etat.combattants) t = t.replace(new RegExp(`\\b${x.id}\\b`, 'g'), x.nom);
    return t.replace(/^aller en \(\d+,\d+\)$/, 'se déplace').replace(/^fin du tour$/, 'termine son tour');
  };

  const avancerIA = () => {
    const a = actif(etat);
    const k = `${etat.round}:${etat.actif}:${a.id}`;
    if (cleTour.current !== k) {
      cleTour.current = k;
      fileIA.current = [];
      etapesIA.current = 0;
    }
    if (!peutAgir(a)) {
      setPensee(`${a.nom} passe son tour.`);
      executerAnime({ type: 'finTour' });
      return;
    }
    if (!fileIA.current.length) {
      if (etapesIA.current === 0 && doitFuir(etat, a) && !aEtat(a, 'empoigne')) {
        setPensee(`${a.nom} cherche à fuir !`);
        const avant = capturer(etat);
        jouerTourIA(etat, ctx, OPTIONS_IA[reglages.ia]);
        rejouer(avant);
        return;
      }
      if (etapesIA.current >= 8) {
        executerAnime({ type: 'finTour' });
        return;
      }
      const e = choisirEtape(etat, ctx, OPTIONS_IA[reglages.ia]);
      etapesIA.current += 1;
      fileIA.current = [...e.commandes];
      setPensee(`${a.nom} : ${nomsDans(e.libelle)}`);
    }
    const cmd = fileIA.current.shift()!;
    const r = executerAnime(cmd);
    if (!r.ok) {
      fileIA.current = [];
      if (!etat.vainqueur && actif(etat).id === a.id) executerAnime({ type: 'finTour' });
    }
  };

  useEffect(() => {
    if (etat.vainqueur || occupe) return;
    const a = actif(etat);
    if (a.camp === 'heros' && peutAgir(a) && !herosAuto && tourAuto !== `${etat.round}:${etat.actif}`) return;
    const t = window.setTimeout(
      () => {
        try {
          avancerIA();
        } catch (err) {
          console.error(err);
          setMessage(`Erreur du moteur pendant le tour de ${a.nom} : ${err instanceof Error ? err.message : String(err)}`);
          if (!etat.vainqueur && actif(etat).id === a.id) executer(etat, ctx, { type: 'finTour' });
        }
        rafraichir();
      },
      rapide ? DELAI_IA_RAPIDE : DELAI_IA,
    );
    return () => window.clearTimeout(t);
  }, [version, rapide, herosAuto, tourAuto, occupe]);

  useEffect(() => {
    if (tourJoueur) setPensee(null);
  }, [tourJoueur]);

  // ---------------------------------------------------------------------------
  // Surcouches du plateau
  // ---------------------------------------------------------------------------

  const surcouches = useMemo<Surcouches>(() => {
    const s: Surcouches = {
      atteignables: new Map(),
      chemin: new Set(),
      zone: new Set(),
      portee: new Set(),
      ciblesValides: new Set(),
      ciblesChoisies: new Map(),
      modeCible,
    };
    if (!tourJoueur || occupe) return s;
    if (!carte) {
      for (const [k, ch] of chemins) s.atteignables.set(k, ch.cout);
      const ch = survolCase && chemins.get(cle(survolCase));
      if (ch) for (const p of ch.etapes) s.chemin.add(cle(p));
      return s;
    }
    if (modeCible === 'cibles') {
      for (const id of carte.cibles) s.ciblesValides.add(id);
      for (const id of selection?.cibles ?? []) s.ciblesChoisies.set(id, (s.ciblesChoisies.get(id) ?? 0) + 1);
      // Les chances de la carte sur chaque cible valide (« 65 % »), montrées sur son jeton.
      for (const id of carte.cibles) {
        const ap = apercuCarte(etat, c.id, carte, id);
        const pourcent = ap?.pourcentToucher ?? ap?.pourcentEchec;
        if (!ap || pourcent === undefined) continue;
        s.chances ??= new Map();
        s.chances.set(id, { texte: `${pourcent} %`, titre: texteApercu(ap, carte, etat.combattants.find((x) => x.id === id)?.nom ?? '') ?? '', fort: pourcent >= 60 });
      }
    } else if (carte.zone) {
      if (!personnel) {
        for (let y = 0; y < etat.grille.hauteur; y++)
          for (let x = 0; x < etat.grille.largeur; x++) if (pointValide({ x, y })) s.portee.add(cle({ x, y }));
      }
      if (survolCase && pointValide(survolCase)) {
        const forme = carte.zone.forme as Parameters<typeof casesZone>[1];
        for (const p of casesZone(etat.grille, forme, carte.zone.taille, personnel ? c.position : survolCase, survolCase)) s.zone.add(cle(p));
      }
    }
    return s;
  }, [version, tourJoueur, occupe, carte, selection, survolCase, chemins]);

  // ---------------------------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------------------------

  const ficheId = survolId ?? (epingle && vue.combattants.some((x) => x.id === epingle) ? epingle : cVue.id);
  const fiche = vue.combattants.find((x) => x.id === ficheId) ?? cVue;
  const survolChemin = !carte && survolCase ? chemins.get(cle(survolCase)) : undefined;

  // Une carte à cible choisie et un ennemi survolé : les chances de toucher (ou d'échec de sa sauvegarde) et les dégâts moyens.
  const survoleCible = carte && modeCible === 'cibles' && survolId && carte.cibles.includes(survolId) ? survolId : undefined;
  const apercu = carte && survoleCible ? texteApercu(apercuCarte(etat, c.id, carte, survoleCible), carte, vue.combattants.find((x) => x.id === survoleCible)?.nom ?? '') : undefined;

  let consigne: string;
  if (termine) consigne = 'Combat terminé.';
  else if (!tourJoueur || (occupe && cVue.id !== c.id)) consigne = pensee ?? `Tour de ${cVue.nom}…`;
  else if (carte && modeCible === 'point') consigne = `${carte.nom} : choisissez ${personnel ? 'une direction' : 'un point'} sur le plateau.`;
  else if (carte && apercu) consigne = apercu + (carte.nbCibles > 1 ? ` (${selection?.cibles.length ?? 0}/${carte.nbCibles} cibles)` : '');
  else if (carte && carte.nbCibles > 1) consigne = `${carte.nom} : choisissez jusqu'à ${carte.nbCibles} cibles (${selection?.cibles.length ?? 0}/${carte.nbCibles})${ciblesRepetables(carte) ? ', une même créature peut être visée plusieurs fois' : ''}.`;
  else if (carte) consigne = `${carte.nom} : choisissez une cible.`;
  else if (survolChemin) consigne = `Déplacement : ${formatMetres(survolChemin.cout)}.`;
  else consigne = 'Cliquez une case en surbrillance pour vous déplacer, jouez une carte, ou cliquez un ennemi pour voir ses renseignements.';

  const t = cVue.tour;
  return (
    <div className="combat">
      <header className="combat-haut">
        <button
          type="button"
          className="bouton-discret"
          onClick={onFinHistoire ? () => onFinHistoire(etat) : onRetour}
          title={onFinHistoire ? 'Le groupe se replie et retourne au récit' : 'Retour au choix de la rencontre'}
        >
          {onFinHistoire ? '‹ Fuir' : '‹ Escarmouche'}
        </button>
        <Initiative etat={vue} onSurvol={setSurvolId} />
        <div className="combat-titre">
          <span>{reglages.rencontre.nom}</span>
          <small>
            IA {reglages.ia === 'normale' ? 'normale' : 'facile'} · élan {reglages.elan ? 'activé' : 'désactivé'}
          </small>
        </div>
      </header>

      <aside className="colonne-fiche">
        <Illustration c={fiche} />
        <div className="colonne-fiche-texte">
          <Fiche c={fiche} donnees={donnees} estActif={fiche.id === cVue.id && !finAffichee} elan={reglages.elan} />
        </div>
      </aside>

      <main className="zone-plateau">
        <Plateau
          etat={vue}
          donnees={donnees}
          actifId={finAffichee ? '' : cVue.id}
          terrain={reglages.rencontre.terrain}
          surcouches={surcouches}
          onSurvolCase={setSurvolCase}
          onClicCase={clicCase}
          onClicJeton={clicJeton}
          onSurvolJeton={setSurvolId}
          effets={anim.vue.effets}
          elements={anim.elements}
          vitesse={vitesse}
        />
        {message && <div className="message">{message}</div>}
      </main>

      <aside className="colonne-journal">
        <Journal journal={etat.journal} longueur={occupe ? (anim.vue.journal ?? etat.journal.length) : etat.journal.length} repliques={repliques} />
      </aside>

      <aside className="zone-main">
        <PanneauTour
          heros={cVue}
          finAffichee={finAffichee}
          peutAgir={peutAgir(cVue)}
          elan={reglages.elan && !!cVue.elan}
          consigne={consigne}
          tourJoueur={tourJoueur && cVue.id === c.id}
          occupe={occupe}
          termine={termine}
          carte={carte}
          nbChoisies={selection?.cibles.length ?? 0}
          toutJoue={toutEstJoue(cartes)}
          herosAuto={herosAuto}
          rapide={rapide}
          onValider={() => valider()}
          onAnnuler={() => setSelection(null)}
          onFinTour={() => jouer({ type: 'finTour' })}
          onTourAuto={() => setTourAuto(cleCourante)}
          onHerosAuto={() => {
            setSelection(null);
            setHerosAuto(!herosAuto);
          }}
          onRapide={() => setRapide(!rapide)}
        />
        <MainCartes
          sections={sections}
          repliees={repliees}
          onBasculer={basculerSection}
          numeros={numeros}
          selection={selection?.carte}
          inactive={!tourJoueur}
          onJouer={choisirCarte}
          ecoleDe={(id) => {
            const s = donnees.sorts.get(id);
            return s ? cleDeSort(s) : undefined;
          }}
        />
      </aside>

      {finAffichee && !masquerFin && (
        <FinCombat etat={etat} onRejouer={onRejouer} onRetour={onRetour} onVoir={() => setMasquerFin(true)} onContinuer={onFinHistoire && (() => onFinHistoire(etat))} xpHistoire={xpHistoire} />
      )}
      {finAffichee && masquerFin && (
        <button type="button" className="bouton reafficher-fin" onClick={() => setMasquerFin(false)}>
          Résumé du combat
        </button>
      )}
    </div>
  );
}
