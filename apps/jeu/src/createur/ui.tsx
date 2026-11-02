// Petits composants partagés par le créateur et l'écran du groupe.
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { SORTS_JOUABLES_EN_COMBAT, type Sort } from '@crpg/regles';
import { svgModele } from '../icones';
import { COULEURS_ESPECES, imagePortrait, infoPortrait } from './portraits';
import { majuscule, tronquer } from './libelles';

/** Pictogramme d'une classe (SVG inline), ou l'initiale si la classe n'en a pas. */
export function IconeClasse({ classe, taille = 28 }: { classe: string; taille?: number }) {
  const svg = svgModele(classe);
  return svg ? (
    <span className="icone-classe" style={{ width: taille, height: taille }} dangerouslySetInnerHTML={{ __html: svg }} />
  ) : (
    <span className="icone-classe icone-lettre" style={{ width: taille, height: taille, fontSize: taille * 0.6 }}>
      {majuscule(classe).charAt(0)}
    </span>
  );
}

interface PortraitProps {
  id?: string;
  espece?: string;
  classe?: string;
  taille?: number;
  selectionne?: boolean;
}

/** Portrait : l'image de la galerie si elle existe, sinon une tuile d'attente (couleur d'espèce, pictogramme, initiale, numéro). */
export function Portrait({ id, espece, classe, taille = 64, selectionne }: PortraitProps) {
  const info = id ? infoPortrait(id) : undefined;
  const esp = espece ?? info?.espece ?? 'humain';
  const image = id ? imagePortrait(id) : undefined;
  const style = { width: taille, height: Math.round(taille * 1.25) };
  if (image) {
    return (
      <span className={`portrait ${selectionne ? 'portrait-choisi' : ''}`} style={style}>
        <img src={image} alt="" />
      </span>
    );
  }
  const couleur = COULEURS_ESPECES[esp] ?? '#444';
  return (
    <span
      className={`portrait portrait-attente ${selectionne ? 'portrait-choisi' : ''}`}
      style={{ ...style, background: `linear-gradient(160deg, ${couleur}, #14100c 85%)` }}
      aria-hidden
    >
      {classe && (
        <span className="portrait-icone">
          <IconeClasse classe={classe} taille={Math.round(taille * 0.6)} />
        </span>
      )}
      <span className="portrait-initiale" style={{ fontSize: taille * 0.28 }}>
        {esp.charAt(0).toUpperCase()}
      </span>
      {info && (
        <span className="portrait-numero" style={{ fontSize: Math.max(9, taille * 0.16) }}>
          n° {info.numero}
        </span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Listes de choix
// ---------------------------------------------------------------------------

/** Conteneur dont les boutons se parcourent aux flèches haut/bas (et gauche/droite). */
export function ListeNav({ children, className = '', ...reste }: { children: ReactNode; className?: string; 'aria-label'?: string }) {
  const surTouche = (e: KeyboardEvent<HTMLDivElement>) => {
    const touches = ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!touches.includes(e.key)) return;
    const boutons = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
    const i = boutons.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    const suivant = e.key === 'Home' ? 0 : e.key === 'End' ? boutons.length - 1 : e.key === 'ArrowDown' || e.key === 'ArrowRight' ? i + 1 : i - 1;
    boutons[(suivant + boutons.length) % boutons.length]?.focus();
  };
  return (
    <div className={`liste-nav ${className}`} role="group" onKeyDown={surTouche} {...reste}>
      {children}
    </div>
  );
}

interface OptionProps {
  selectionne: boolean;
  onChoisir: () => void;
  titre: ReactNode;
  sous?: ReactNode;
  gauche?: ReactNode;
  droite?: ReactNode;
  desactive?: boolean;
  raison?: string;
  onSurvol?: (actif: boolean) => void;
  compact?: boolean;
}

/** Une option de liste : bouton à bascule (aria-pressed), avec libellé, sous-titre et pictogramme éventuels. */
export function Option({ selectionne, onChoisir, titre, sous, gauche, droite, desactive, raison, onSurvol, compact }: OptionProps) {
  return (
    <button
      type="button"
      className={`option ${selectionne ? 'option-choisie' : ''} ${compact ? 'option-compacte' : ''}`}
      aria-pressed={selectionne}
      disabled={desactive}
      title={desactive ? raison : undefined}
      onClick={onChoisir}
      onMouseEnter={() => onSurvol?.(true)}
      onMouseLeave={() => onSurvol?.(false)}
      onFocus={() => onSurvol?.(true)}
      onBlur={() => onSurvol?.(false)}
    >
      {gauche && <span className="option-gauche">{gauche}</span>}
      <span className="option-texte">
        <span className="option-titre">{titre}</span>
        {sous && <span className="option-sous">{sous}</span>}
        {desactive && raison && <span className="option-raison">{raison}</span>}
      </span>
      {droite && <span className="option-droite">{droite}</span>}
      <span className="option-coche" aria-hidden>
        {selectionne ? '✓' : ''}
      </span>
    </button>
  );
}

export function Section({ titre, aide, etat, children }: { titre: string; aide?: ReactNode; etat?: 'ok' | 'manque'; children: ReactNode }) {
  return (
    <section className="section-choix">
      <h3>
        {titre}
        {etat && (
          <span className={`etat-section ${etat === 'ok' ? 'etat-ok' : 'etat-manque'}`} aria-label={etat === 'ok' ? 'terminé' : 'à compléter'}>
            {etat === 'ok' ? '✓' : '•'}
          </span>
        )}
      </h3>
      {aide && <p className="aide">{aide}</p>}
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sorts
// ---------------------------------------------------------------------------

export function BadgeJouable({ id }: { id: string }) {
  const jouable = SORTS_JOUABLES_EN_COMBAT.has(id);
  return (
    <span className={`badge-jouable ${jouable ? 'bj-oui' : 'bj-non'}`} title={jouable ? 'Ce sort est géré par le moteur de combat.' : 'Ce sort figure sur la fiche mais ne peut pas encore être joué en combat.'}>
      {jouable ? 'Jouable en combat' : 'Non jouable en combat'}
    </span>
  );
}

const ECOLES: Record<string, string> = {
  abjuration: 'Abjuration',
  divination: 'Divination',
  enchantement: 'Enchantement',
  évocation: 'Évocation',
  illusion: 'Illusion',
  invocation: 'Invocation',
  nécromancie: 'Nécromancie',
  transmutation: 'Transmutation',
};

export function nomEcole(e: string): string {
  return ECOLES[e] ?? majuscule(e);
}

export function etiquetteNiveauSort(s: Sort): string {
  return s.niveau === 0 ? 'Sort mineur' : `Niveau ${s.niveau}`;
}

export function CarteSort({
  sort,
  selectionne,
  desactive,
  raison,
  onChoisir,
  onSurvol,
}: {
  sort: Sort;
  selectionne: boolean;
  desactive?: boolean;
  raison?: string;
  onChoisir: () => void;
  onSurvol?: (actif: boolean) => void;
}) {
  return (
    <Option
      selectionne={selectionne}
      onChoisir={onChoisir}
      desactive={desactive}
      raison={raison}
      onSurvol={onSurvol}
      compact
      titre={
        <>
          {sort.nom}
          {sort.concentration && <span className="mini-tag" title="Concentration">C</span>}
        </>
      }
      sous={
        <>
          <span className="sort-meta">
            {etiquetteNiveauSort(sort)} · {nomEcole(sort.ecole)}
          </span>
          <span className="sort-resume">{tronquer(sort.resume, 150)}</span>
        </>
      }
      droite={<BadgeJouable id={sort.id} />}
    />
  );
}

export interface PropsListeSorts {
  sorts: Sort[];
  choisis: string[];
  max: number;
  onChange: (ids: string[]) => void;
  onSurvol?: (sort: Sort | null) => void;
  /** Montre un filtre par niveau de sort. */
  filtreNiveau?: boolean;
  etiquette: string;
}

/** Liste de sorts filtrable (texte, niveau), à sélection limitée. */
export function ListeSorts({ sorts, choisis, max, onChange, onSurvol, filtreNiveau, etiquette }: PropsListeSorts) {
  const [texte, setTexte] = useState('');
  const [niveau, setNiveau] = useState<number | 'tous'>('tous');
  const niveaux = [...new Set(sorts.map((s) => s.niveau))].sort((a, b) => a - b);
  const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const visibles = sorts.filter((s) => (niveau === 'tous' || s.niveau === niveau) && (!texte || norm(s.nom + ' ' + s.resume).includes(norm(texte))));
  const plein = choisis.length >= max;
  return (
    <div className="liste-sorts">
      <div className="liste-sorts-entete">
        <input
          type="search"
          className="champ champ-filtre"
          placeholder="Filtrer par nom ou description…"
          aria-label={`Filtrer ${etiquette}`}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
        />
        {filtreNiveau && niveaux.length > 1 && (
          <div className="segments segments-petits" role="group" aria-label="Niveau de sort">
            <button type="button" className={niveau === 'tous' ? 'actif' : ''} aria-pressed={niveau === 'tous'} onClick={() => setNiveau('tous')}>
              Tous
            </button>
            {niveaux.map((n) => (
              <button key={n} type="button" className={niveau === n ? 'actif' : ''} aria-pressed={niveau === n} onClick={() => setNiveau(n)}>
                {n === 0 ? 'Mineurs' : `Niv. ${n}`}
              </button>
            ))}
          </div>
        )}
        <span className="compteur-choix" aria-live="polite">
          {choisis.length} / {max}
        </span>
      </div>
      <ListeNav className="liste-sorts-corps" aria-label={etiquette}>
        {visibles.map((s) => {
          const choisi = choisis.includes(s.id);
          return (
            <CarteSort
              key={s.id}
              sort={s}
              selectionne={choisi}
              desactive={!choisi && plein}
              raison={`Vous avez déjà choisi ${max} sort(s) : retirez-en un d'abord.`}
              onChoisir={() => onChange(choisi ? choisis.filter((x) => x !== s.id) : [...choisis, s.id])}
              onSurvol={(a) => onSurvol?.(a ? s : null)}
            />
          );
        })}
        {!visibles.length && <p className="aide">Aucun sort ne correspond à ce filtre.</p>}
      </ListeNav>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fenêtre de confirmation
// ---------------------------------------------------------------------------

export function Modale({
  titre,
  texte,
  confirmer,
  annuler = 'Annuler',
  dangereux,
  onConfirmer,
  onAnnuler,
}: {
  titre: string;
  texte: ReactNode;
  confirmer: string;
  annuler?: string;
  dangereux?: boolean;
  onConfirmer: () => void;
  onAnnuler: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const f = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onAnnuler();
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [onAnnuler]);
  return (
    <div className="credits-fond" onClick={onAnnuler}>
      <div className="credits modale" role="dialog" aria-modal="true" aria-labelledby="titre-modale" onClick={(e) => e.stopPropagation()}>
        <h2 id="titre-modale">{titre}</h2>
        <div className="aide">{texte}</div>
        <div className="fin-boutons">
          <button type="button" className={dangereux ? 'bouton bouton-danger' : 'bouton-principal bouton-moyen'} onClick={onConfirmer} ref={ref}>
            {confirmer}
          </button>
          <button type="button" className="bouton-discret" onClick={onAnnuler}>
            {annuler}
          </button>
        </div>
      </div>
    </div>
  );
}

