// La page plein écran d'un onglet qui a une grille (le sac, touche I) : la grille à gauche, la fiche de l'élément
// choisi et ses actions à droite, les héros en bas. Elle ne connaît aucune commande : les actions sont les propositions
// de l'onglet qui portent sur l'élément choisi.
import type { Encart, Ordre, Partie, Proposition } from '@crpg/regles';
import { BoutonProposition } from './BoutonProposition';
import { BandeauHeros, FicheEncart } from './fiches';
import { FicheElement, GrilleElements } from './GrilleElements';

interface Props {
  monde: string;
  /** Les encarts de l'onglet (la grille et, à côté, les autres fiches) et ses propositions. */
  encarts: Encart[];
  propositions: Proposition[];
  partie: Partie;
  selection?: string;
  /** Le groupe d'éléments montré à l'ouverture (voir `GrilleElements`). */
  filtre?: string;
  onChoisir: (id: string | undefined) => void;
  jouer: (o: Ordre) => void;
  onCombat: () => void;
  onFermer: () => void;
  /** Ouvre la feuille de personnage d'un héros (le porteur de l'objet choisi, sinon celui du filtre, sinon le premier debout). */
  onFeuille?: (heros: string) => void;
}

export function PagePleine({ monde, encarts, propositions, partie, selection, filtre, onChoisir, jouer, onCombat, onFermer, onFeuille }: Props) {
  const principal = encarts.find((e) => e.grille)!;
  const grille = principal.grille!;
  const autres = encarts.filter((e) => e !== principal);
  const choisi = grille.elements.find((e) => e.id === selection);
  const actions = choisi ? propositions.filter((p) => p.element?.id === choisi.id) : [];
  // La feuille qu'ouvre le bouton : celle du porteur de l'objet choisi, sinon du héros du filtre (« Porté par X »), sinon du premier héros debout.
  const idFiltre = filtre?.startsWith('porte:') ? filtre.slice('porte:'.length) : undefined;
  const pourFeuille =
    partie.groupe.find((h) => h.id === choisi?.porteur?.id) ?? partie.groupe.find((h) => h.id === idFiltre) ?? partie.groupe.find((h) => h.pv > 0) ?? partie.groupe[0];

  return (
    <div className="page-pleine" role="dialog" aria-label={principal.titre}>
      <header className="page-pleine-haut">
        <h2>{principal.titre}</h2>
        <div className="page-pleine-resume">
          {grille.resume?.map((l) => (
            <span key={l.libelle} className={l.ton ? `ton-${l.ton}` : ''}>
              {l.libelle} <strong>{l.valeur}</strong>
            </span>
          ))}
        </div>
        {onFeuille && pourFeuille && (
          <button type="button" className="bouton-discret" onClick={() => onFeuille(pourFeuille.id)} title={`Ouvre la feuille de personnage de ${pourFeuille.nom} (touche C)`}>
            📋 Feuille {/^[AEIOUÀÂÉÈÊÎÔÛ]/i.test(pourFeuille.nom) ? 'd’' : 'de '}
            {pourFeuille.nom}
          </button>
        )}
        <button type="button" className="bouton-discret" onClick={onFermer} autoFocus>
          Fermer ✕ <small>(Échap)</small>
        </button>
      </header>
      <div className="page-pleine-corps">
        <div className="page-pleine-grille">
          <GrilleElements
            monde={monde}
            grille={grille}
            cle={principal.id}
            selection={choisi?.id}
            filtreInitial={filtre}
            heros={partie.groupe}
            onChoisir={(e) => {
              onChoisir(e.id);
              // Regarder un élément « nouveau » lui retire sa pastille.
              if (e.nouveau && e.ordreVu) jouer(e.ordreVu);
            }}
          />
        </div>
        <aside className="page-pleine-fiche">
          {choisi ? (
            <FicheElement
              monde={monde}
              e={choisi}
              actions={actions.map((p, i) => (
                <BoutonProposition key={`${p.libelle}:${i}`} p={p} jouer={jouer} onCombat={onCombat} groupe={partie.groupe} monde={monde} />
              ))}
            />
          ) : (
            <p className="encart-texte">Choisis un élément pour voir sa fiche et ce que tu peux en faire.</p>
          )}
          {autres.map((e) => (
            <FicheEncart key={e.id} e={e} />
          ))}
        </aside>
      </div>
      <footer className="page-pleine-groupe">
        <BandeauHeros groupe={partie.groupe} />
      </footer>
    </div>
  );
}
