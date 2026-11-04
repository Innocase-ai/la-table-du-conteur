import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  actif,
  aEtat,
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
import { capturer, etatAffiche, mouvementReduit, useAnimations } from '../animations';
import { ciblesRepetables, formatMetres } from '../libelles';
import { Fiche } from './Fiche';
import { Illustration } from './Illustration';
import { FinCombat } from './FinCombat';
import { ControleSon } from './ControleSon';
import { Initiative } from './Initiative';
import { Journal } from './Journal';
import { MainCartes } from './MainCartes';
import { Plateau, type Surcouches } from './Plateau';

interface Props {
  donnees: Donnees;
  reglages: Reglages;
  graine: number;
  onRejouer: () => void;
  onRetour: () => void;
  /** Combat d'une histoire : pas de « Rejouer » ; à la fin (ou en fuyant), l'état final revient au récit. */
  onFinHistoire?: (etat: EtatCombat) => void;
}

interface Selection {
  carte: string;
  cibles: string[];
}

// Pause après les animations, avant l'étape suivante de l'IA.
const DELAI_IA = 280;
const DELAI_IA_RAPIDE = 90;

export function Combat({ donnees, reglages, graine, onRejouer, onRetour, onFinHistoire }: Props) {
  const ctx = useMemo(() => ({ sorts: donnees.sorts }), [donnees]);
  // Le moteur mute l'état en place : on le garde dans une ref et on force le rendu avec `version`.
  const etatRef = useRef<EtatCombat | null>(null);
  if (!etatRef.current) {
    const { grille, combattants } = preparerRencontre(reglages.rencontre, donnees, reglages.herosCombat);
    etatRef.current = creerCombat(grille, combattants, graine, { elan: reglages.elan });
  }
  const etat = etatRef.current;
  const [version, setVersion] = useState(0);
  const rafraichir = useCallback(() => setVersion((v) => v + 1), []);

  const [selection, setSelection] = useState<Selection | null>(null);
  const [survolCase, setSurvolCase] = useState<Position | null>(null);
  const [survolId, setSurvolId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rapide, setRapide] = useState(false);
  const [pensee, setPensee] = useState<string | null>(null);
  const [masquerFin, setMasquerFin] = useState(false);
  // L'IA peut jouer le tour d'un héros (une fois, ou pour tous les héros).
  const [tourAuto, setTourAuto] = useState<string | null>(null);
  const [herosAuto, setHerosAuto] = useState(false);

  const reduit = useMemo(() => mouvementReduit(), []);
  const vitesse = (rapide ? 0.4 : 1) * (reduit ? 0.5 : 1);
  const anim = useAnimations(donnees, vitesse);
  const occupe = anim.enCours;
  // État affiché : en retard sur le moteur tant que la file d'animations joue.
  const vue = etatAffiche(etat, anim.vue, occupe);
  const cVue = actif(vue);

  const c = actif(etat);
  const termine = !!etat.vainqueur;
  const finAffichee = termine && !occupe;
  const cleCourante = `${etat.round}:${etat.actif}`;
  const tourJoueur = !termine && c.camp === 'heros' && peutAgir(c) && !herosAuto && tourAuto !== cleCourante;

  const cartes = useMemo(() => (termine || !peutAgir(c) ? [] : cartesDisponibles(etat, ctx, c.id)), [version, c.id, termine]);
  const chemins = useMemo(() => (tourJoueur ? deplacementsPossibles(etat, c) : new Map<string, { cout: number; etapes: Position[] }>()), [version, tourJoueur]);
  const carte: Carte | undefined = selection && tourJoueur ? cartes.find((k) => k.id === selection.carte) : undefined;
  const sort = carte?.categorie === 'sort' ? donnees.sorts.get(carte.id.slice('sort:'.length)) : undefined;
  const personnel = sort?.portee.type === 'personnel';
  const modeCible: Surcouches['modeCible'] = !carte ? 'aucun' : carte.ciblage === 'point' ? 'point' : 'cibles';

  // Messages éphémères.
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(null), 3200);
    return () => window.clearTimeout(t);
  }, [message]);

  // ---------------------------------------------------------------------------
  // Commandes du joueur
  // ---------------------------------------------------------------------------

  /** Exécute une commande puis rejoue ses entrées de journal en animation. */
  const executerAnime = (cmd: Commande) => {
    const avant = capturer(etat);
    const r = executer(etat, ctx, cmd);
    anim.jouer(etat, avant);
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
      clicCase(t.position);
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

  // Clavier : Échap annule, Entrée valide une sélection multiple.
  const clavier = useRef<(e: KeyboardEvent) => void>(() => {});
  clavier.current = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setSelection(null);
    if (e.key === 'Enter' && selection?.cibles.length) valider();
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
        anim.jouer(etat, avant);
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

  const ficheId = survolId ?? cVue.id;
  const fiche = vue.combattants.find((x) => x.id === ficheId) ?? cVue;
  const survolChemin = !carte && survolCase ? chemins.get(cle(survolCase)) : undefined;

  let consigne: string;
  if (termine) consigne = 'Combat terminé.';
  else if (!tourJoueur || (occupe && cVue.id !== c.id)) consigne = pensee ?? `Tour de ${cVue.nom}…`;
  else if (carte && modeCible === 'point') consigne = `${carte.nom} : choisissez ${personnel ? 'une direction' : 'un point'} sur le plateau.`;
  else if (carte && carte.nbCibles > 1) consigne = `${carte.nom} : choisissez jusqu'à ${carte.nbCibles} cibles (${selection?.cibles.length ?? 0}/${carte.nbCibles})${ciblesRepetables(carte) ? ', une même créature peut être visée plusieurs fois' : ''}.`;
  else if (carte) consigne = `${carte.nom} : choisissez une cible.`;
  else if (survolChemin) consigne = `Déplacement : ${formatMetres(survolChemin.cout)}.`;
  else consigne = 'Cliquez une case en surbrillance pour vous déplacer, ou jouez une carte.';

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
        <Journal journal={etat.journal} longueur={occupe ? (anim.vue.journal ?? etat.journal.length) : etat.journal.length} />
      </aside>

      <aside className="zone-main">
        <div className={`barre-tour ${tourJoueur && cVue.id === c.id ? 'barre-joueur' : 'barre-ia'}`}>
          <div className="barre-tour-qui">
            <strong>{finAffichee ? '—' : cVue.nom}</strong>
            {!finAffichee && peutAgir(cVue) && (
              <div className="ressources-tour">
                <span className="rt-mouvement" title="Mouvement restant">
                  ➜ {formatMetres(t.mouvement)}
                </span>
                <span className={`rt ${t.action || t.attaquesRestantes > 0 ? 'dispo' : ''} rt-action`} title="Action">
                  Action{t.attaquesRestantes > 0 ? ` (${t.attaquesRestantes} att.)` : ''}
                </span>
                <span className={`rt ${t.bonus ? 'dispo' : ''} rt-bonus`} title="Action bonus">
                  Bonus
                </span>
                <span className={`rt ${cVue.ressources.reaction ? 'dispo' : ''} rt-reaction`} title="Réaction">
                  Réaction
                </span>
                {reglages.elan && cVue.elan && (
                  <span className={`rt ${!t.elanJoue ? 'dispo' : ''} rt-elan`} title="Carte d'élan">
                    Élan
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="barre-tour-consigne">{consigne}</div>
          <div className="barre-tour-boutons">
            {carte && carte.nbCibles > 1 && (
              <button type="button" className="bouton" disabled={!selection?.cibles.length} onClick={() => valider()}>
                Valider ({selection?.cibles.length ?? 0}/{carte.nbCibles})
              </button>
            )}
            {carte && (
              <button type="button" className="bouton-discret" onClick={() => setSelection(null)} title="Échap">
                Annuler
              </button>
            )}
            {tourJoueur && !carte && (
              <button type="button" className="bouton-discret" onClick={() => setTourAuto(cleCourante)} title="L'IA joue ce tour à votre place">
                Tour auto
              </button>
            )}
            {!termine && (
              <button
                type="button"
                className={`bouton-discret ${herosAuto ? 'actif' : ''}`}
                onClick={() => {
                  setSelection(null);
                  setHerosAuto(!herosAuto);
                }}
                title="L'IA joue aussi tous les héros (pour observer un combat)"
              >
                Héros auto
              </button>
            )}
            {!termine && (
              <button type="button" className={`bouton-discret ${rapide ? 'actif' : ''}`} onClick={() => setRapide(!rapide)} title="Accélérer les animations et les tours de l'IA">
                {rapide ? '▶▶ Rapide' : '▶ Normal'}
              </button>
            )}
            <ControleSon />
            <button type="button" className="bouton fin-tour" disabled={!tourJoueur || occupe} onClick={() => jouer({ type: 'finTour' })}>
              Fin du tour
            </button>
          </div>
        </div>
        <MainCartes cartes={occupe && cVue.id !== c.id ? [] : cartes} selection={selection?.carte} inactive={!tourJoueur} onJouer={choisirCarte} />
      </aside>

      {finAffichee && !masquerFin && (
        <FinCombat etat={etat} onRejouer={onRejouer} onRetour={onRetour} onVoir={() => setMasquerFin(true)} onContinuer={onFinHistoire && (() => onFinHistoire(etat))} />
      )}
      {finAffichee && masquerFin && (
        <button type="button" className="bouton reafficher-fin" onClick={() => setMasquerFin(false)}>
          Résumé du combat
        </button>
      )}
    </div>
  );
}
