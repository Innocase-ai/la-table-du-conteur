// La grille d'éléments d'un module (le sac aujourd'hui) : des vignettes rangées par groupe, que le joueur peut trier,
// filtrer et chercher, et la fiche détaillée d'un élément. Rien ici ne sait ce qu'est un objet : l'écran lit des
// `ElementGrille` (noyau/types.ts), de sorte qu'un grimoire ou un bestiaire pourra s'afficher de la même façon.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ElementGrille, GrilleElements as Grille } from '@crpg/regles';
import type { Personnage } from '@crpg/regles';
import { Portrait } from '../createur/ui';
import { manifesteDe, urlImage, urlImageCommune } from '../mondes';
import { Icone, LIBELLE_RARETE } from './icones';

/**
 * L'image d'un élément : celle du monde (manifeste), sinon l'image commune du moteur (équipement du SRD), sinon rien,
 * et on montre alors l'icône.
 */
export function useImageElement(monde: string, image?: ElementGrille['image'], commune?: ElementGrille['imageCommune']): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let actif = true;
    setUrl(undefined);
    const fichier = image ? (manifesteDe(monde) as Record<string, Record<string, string>> | undefined)?.[image.groupe]?.[image.id] : undefined;
    const promesse = (fichier ? urlImage(monde, fichier) : undefined) ?? (commune ? urlImageCommune(commune.groupe, commune.id) : undefined);
    promesse?.then((u) => actif && setUrl(u));
    return () => {
      actif = false;
    };
  }, [monde, image?.groupe, image?.id, commune?.groupe, commune?.id]);
  return url;
}

const normaliser = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const nombre = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

// ---------------------------------------------------------------------------
// Tri
// ---------------------------------------------------------------------------

/** Les critères de tri : le rangement par groupe, le nom, l'ordre d'arrivée, puis chaque mesure (↓ : du plus grand au plus petit). */
function criteres(elements: ElementGrille[]): { id: string; libelle: string }[] {
  const mesures = new Map<string, string>();
  for (const e of elements) for (const m of e.mesures ?? []) mesures.set(m.id, m.libelle);
  return [
    { id: 'rangement', libelle: 'Par type' },
    { id: 'nom', libelle: 'Par nom' },
    { id: 'arrivee', libelle: 'Derniers arrivés' },
    ...[...mesures].map(([id, libelle]) => ({ id: `mesure:${id}`, libelle: `${libelle} ↓` })),
  ];
}

function trier(elements: ElementGrille[], critere: string): ElementGrille[] {
  const parNom = (a: ElementGrille, b: ElementGrille) => a.titre.localeCompare(b.titre, 'fr');
  if (critere === 'arrivee') return [...elements].reverse();
  if (critere.startsWith('mesure:')) {
    const id = critere.slice(7);
    const valeur = (e: ElementGrille) => e.mesures?.find((m) => m.id === id)?.valeur ?? 0;
    return [...elements].sort((a, b) => valeur(b) - valeur(a) || parNom(a, b));
  }
  if (critere === 'rangement') return [...elements].sort((a, b) => a.groupe.ordre - b.groupe.ordre || parNom(a, b));
  return [...elements].sort(parNom);
}

/** Une préférence d'affichage retenue sur la machine du joueur (sans elle, la valeur par défaut). */
function usePreference(cle: string, defaut: string): [string, (v: string) => void] {
  const nom = `table-du-conteur:${cle}`;
  const [valeur, setValeur] = useState(() => {
    try {
      return localStorage.getItem(nom) ?? defaut;
    } catch {
      return defaut;
    }
  });
  return [
    valeur,
    (v) => {
      setValeur(v);
      try {
        localStorage.setItem(nom, v);
      } catch {
        // préférence non retenue : sans importance
      }
    },
  ];
}

// ---------------------------------------------------------------------------
// Vignette
// ---------------------------------------------------------------------------

function Tuile({ monde, e, choisi, legende, heros, onClick }: { monde: string; e: ElementGrille; choisi: boolean; legende: boolean; heros?: Personnage[]; onClick: () => void }) {
  const url = useImageElement(monde, e.image, e.imageCommune);
  const porteur = e.porteur ? heros?.find((h) => h.id === e.porteur!.id) : undefined;
  const plusieurs = (e.quantite ?? 1) > 1;
  return (
    <button
      type="button"
      className={`tuile rarete-${e.rarete ?? 'commun'} ${choisi ? 'tuile-choisie' : ''} ${e.ton ? `ton-${e.ton}` : ''}`}
      aria-pressed={choisi}
      title={`${e.titre}${plusieurs ? ` × ${e.quantite}` : ''}${e.nouveau ? ' (nouveau)' : ''}${e.inconnu ? ' — à découvrir' : ''}`}
      onClick={onClick}
    >
      <span className="tuile-cadre">
        {url ? <img src={url} alt="" loading="lazy" /> : <Icone id={e.icone} taille={legende ? 40 : 30} />}
        {plusieurs && <span className="tuile-quantite">×{e.quantite}</span>}
        {e.nouveau && <span className="tuile-nouveau" aria-label="Nouveau" />}
        {e.porteur && (
          <span className="tuile-porteur" title={`Porté par ${e.porteur.nom}`}>
            {porteur ? <Portrait id={porteur.portrait} espece={porteur.fiche.espece} classe={porteur.fiche.classe} taille={20} /> : e.porteur.nom.charAt(0)}
          </span>
        )}
        {e.inconnu && (
          <span className="tuile-inconnu" aria-label="À découvrir">
            ?
          </span>
        )}
      </span>
      {legende && <span className="tuile-legende">{e.titre}</span>}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Grille
// ---------------------------------------------------------------------------

interface PropsGrille {
  monde: string;
  grille: Grille;
  /** Identifiant de l'encart, pour retenir le tri choisi. */
  cle: string;
  /** Version réduite (colonne de l'écran d'aventure) : pas de barre d'outils, vignettes plus petites. */
  compact?: boolean;
  selection?: string;
  onChoisir: (e: ElementGrille) => void;
  /** Les héros du groupe, pour montrer qui porte un élément. */
  heros?: Personnage[];
}

export function GrilleElements({ monde, grille, cle, compact, selection, onChoisir, heros }: PropsGrille) {
  const [critere, setCritere] = usePreference(`tri:${cle}`, 'rangement');
  const [filtre, setFiltre] = useState<string>();
  const [recherche, setRecherche] = useState('');
  const options = useMemo(() => criteres(grille.elements), [grille.elements]);
  const groupes = useMemo(
    () => [...new Map(grille.elements.map((e) => [e.groupe.id, e.groupe])).values()].sort((a, b) => a.ordre - b.ordre),
    [grille.elements],
  );
  const tri = compact || !options.some((o) => o.id === critere) ? 'rangement' : critere;
  const q = normaliser(recherche.trim());
  const visibles = grille.elements.filter(
    (e) => (compact || !filtre || e.groupe.id === filtre) && (compact || !q || normaliser(`${e.titre} ${e.resume ?? ''} ${e.groupe.titre}`).includes(q)),
  );
  const tuile = (e: ElementGrille) => <Tuile key={e.id} monde={monde} e={e} choisi={e.id === selection} legende={!compact} heros={heros} onClick={() => onChoisir(e)} />;

  let contenu: ReactNode;
  if (!grille.elements.length) contenu = <p className="encart-texte">{grille.vide ?? 'Rien ici.'}</p>;
  else if (!visibles.length) contenu = <p className="encart-texte">Aucun résultat.</p>;
  else if (tri === 'rangement') {
    contenu = groupes.map((g) => {
      const membres = trier(
        visibles.filter((e) => e.groupe.id === g.id),
        'nom',
      );
      return membres.length ? (
        <section key={g.id} className="grille-rubrique">
          <h4>
            {g.titre} <small>{membres.length}</small>
          </h4>
          <div className="grille-tuiles">{membres.map(tuile)}</div>
        </section>
      ) : null;
    });
  } else contenu = <div className="grille-tuiles">{trier(visibles, tri).map(tuile)}</div>;

  return (
    <div className={`grille-elements ${compact ? 'grille-compacte' : 'grille-pleine'}`}>
      {compact && grille.resume && (
        <div className="grille-resume">
          {grille.resume.map((l) => (
            <span key={l.libelle} className={l.ton ? `ton-${l.ton}` : ''}>
              {l.libelle} <strong>{l.valeur}</strong>
            </span>
          ))}
        </div>
      )}
      {!compact && grille.elements.length > 0 && (
        <div className="grille-barre">
          <input type="search" value={recherche} placeholder="Chercher…" aria-label="Chercher" onChange={(ev) => setRecherche(ev.target.value)} />
          <label className="grille-tri">
            <span>Trier</span>
            <select value={tri} onChange={(ev) => setCritere(ev.target.value)}>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.libelle}
                </option>
              ))}
            </select>
          </label>
          <div className="grille-filtres" role="group" aria-label="Filtrer par type">
            <button type="button" className={!filtre ? 'actif' : ''} aria-pressed={!filtre} onClick={() => setFiltre(undefined)}>
              Tout <small>{grille.elements.length}</small>
            </button>
            {groupes.map((g) => (
              <button
                key={g.id}
                type="button"
                className={filtre === g.id ? 'actif' : ''}
                aria-pressed={filtre === g.id}
                onClick={() => setFiltre(filtre === g.id ? undefined : g.id)}
              >
                {g.titre} <small>{grille.elements.filter((e) => e.groupe.id === g.id).length}</small>
              </button>
            ))}
          </div>
        </div>
      )}
      {contenu}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fiche d'un élément
// ---------------------------------------------------------------------------

export function FicheElement({ monde, e, actions }: { monde: string; e: ElementGrille; actions?: ReactNode }) {
  const url = useImageElement(monde, e.image, e.imageCommune);
  return (
    <section className={`fiche-element rarete-${e.rarete ?? 'commun'}`}>
      <div className="fiche-element-image">{url ? <img src={url} alt="" /> : <Icone id={e.icone} taille={88} />}</div>
      <h3>
        {e.titre}
        {(e.quantite ?? 1) > 1 && <small> × {e.quantite}</small>}
      </h3>
      <p className="fiche-element-etiquettes">
        {e.rarete && <span className="fiche-etiquette">{LIBELLE_RARETE[e.rarete] ?? e.rarete}</span>}
        <span>{e.groupe.titre}</span>
        {e.inconnu && <span className="fiche-etiquette fiche-etiquette-inconnu">À découvrir</span>}
      </p>
      {!!e.mesures?.length && (
        <p className="fiche-element-mesures">
          {e.mesures.map((m) => (
            <span key={m.id}>
              {m.libelle}{' '}
              <strong>
                {nombre(m.valeur)}
                {m.unite ? ` ${m.unite}` : ''}
              </strong>
            </span>
          ))}
        </p>
      )}
      {e.resume && <p className="fiche-element-resume">{e.resume}</p>}
      {e.histoire && <p className="fiche-element-histoire">{e.histoire}</p>}
      {e.inconnu && <p className="encart-texte">Son histoire reste à découvrir.</p>}
      {!!e.proprietes?.length && (
        <dl className="fiche-element-proprietes">
          {e.proprietes.map((p) => (
            <div key={p.libelle}>
              <dt>{p.libelle}</dt>
              <dd>{p.valeur}</dd>
            </div>
          ))}
        </dl>
      )}
      {actions && <div className="fiche-element-actions">{actions}</div>}
    </section>
  );
}
