// Icônes des éléments d'une grille (objets du sac, sorts…). Dessinées ici, au trait, une par catégorie d'objet : elles
// servent quand l'élément n'a pas d'image à lui, et donnent à la grille une silhouette lisible d'un coup d'œil.
import type { ReactNode } from 'react';

const ICONES: Record<string, ReactNode> = {
  arme: (
    <>
      <path d="M19.5 4.5V8L12 15.5 8.5 12 16 4.5z" />
      <path d="M6.5 13.5l4 4" />
      <path d="M8.5 15.5 5 19" />
      <circle cx="4.3" cy="19.7" r="1" />
    </>
  ),
  armure: <path d="M8 4 4 7l1.5 4L8 10v10h8V10l2.5 1L20 7l-4-3c-1 2-7 2-8 0z" />,
  bouclier: (
    <>
      <path d="M12 3l7 3v6c0 4.5-3.5 7.5-7 9-3.5-1.5-7-4.5-7-9V6z" />
      <path d="M12 3v18M5 11h14" />
    </>
  ),
  potion: (
    <>
      <path d="M9.5 3h5" />
      <path d="M10 3v5L5.5 17a2.5 2.5 0 0 0 2.3 3.5h8.4a2.5 2.5 0 0 0 2.3-3.5L14 8V3" />
      <path d="M7.7 15h8.6" />
    </>
  ),
  parchemin: (
    <>
      <path d="M7 4h11v13a3 3 0 0 1-3 3H6a3 3 0 0 0 3-3V6a2 2 0 0 0-2-2z" />
      <path d="M11 8h4M11 12h4" />
    </>
  ),
  baguette: (
    <>
      <path d="M5 19 15 9" />
      <path d="M18 3.5v5M15.5 6h5" />
      <path d="M19.5 11.5l1.2 1.2" />
    </>
  ),
  anneau: (
    <>
      <circle cx="12" cy="14.5" r="5.5" />
      <path d="M9.5 6.5 12 3.5l2.5 3z" />
    </>
  ),
  bijou: (
    <>
      <path d="M7 3c0 6 3 7.5 5 7.5S17 9 17 3" />
      <path d="M12 10.5l4 3.5-4 7-4-7z" />
    </>
  ),
  vetement: (
    <>
      <path d="M8 4h8l3.5 16h-15z" />
      <path d="M8 4c1 3 7 3 8 0" />
    </>
  ),
  outil: (
    <g transform="rotate(45 12 12)">
      <rect x="7" y="4" width="10" height="5" rx="1" />
      <path d="M12 9v12" />
    </g>
  ),
  materiel: (
    <>
      <path d="M6 10a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19z" />
      <path d="M9.5 7V5.5a2.5 2.5 0 0 1 5 0V7" />
      <path d="M9 14h6v4H9z" />
    </>
  ),
  nourriture: (
    <>
      <path d="M12 7.5C9.5 5.5 4.5 7 5 13c.5 5 3.5 8 7 7 3.5 1 6.5-2 7-7 .5-6-4.5-7.5-7-5.5z" />
      <path d="M12 7.5c0-2 1-3.5 2.5-4.5" />
    </>
  ),
  livre: (
    <>
      <path d="M6 4h12v14H8a2 2 0 0 0-2 2z" />
      <path d="M6 20h12M10 8h5" />
    </>
  ),
  cle: (
    <>
      <circle cx="8" cy="15" r="3.5" />
      <path d="M10.5 12.5 19 4M16 7l2.5 2.5M13.5 9.5l2 2" />
    </>
  ),
  quete: <path d="M12 3l2.6 6 6.4.5-4.8 4.3 1.5 6.2L12 16.7 6.3 20l1.5-6.2L3 9.5 9.4 9z" />,
  curiosite: (
    <>
      <path d="M12 3l6 6-6 12-6-12z" />
      <path d="M6 9h12M12 3 9.5 9 12 21M12 3l2.5 6L12 21" />
    </>
  ),
  'monnaie-ancienne': (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.8" />
      <path d="M12 9.8v4.4" />
    </>
  ),
  // Pierre précieuse : une gemme taillée, vue de dessus (couronne, table et pointe).
  gemme: (
    <>
      <path d="M7 4h10l4 5-9 11L3 9z" />
      <path d="M3 9h18M9 4 7.5 9 12 20M15 4l1.5 5L12 20M7.5 9h9" />
    </>
  ),
  // Objet d'art : un calice sur son pied.
  'objet-d-art': (
    <>
      <path d="M6 4h12c0 5-2.5 8-6 8s-6-3-6-8z" />
      <path d="M12 12v6M8 20h8M9 18h6" />
    </>
  ),
  divers: (
    <>
      <path d="M4 8l8-4 8 4v8l-8 4-8-4z" />
      <path d="M4 8l8 4 8-4M12 12v8" />
    </>
  ),
};

/** L'icône d'une catégorie (une caisse si on ne la connaît pas). Elle prend la couleur du texte. */
export function Icone({ id, taille = 28 }: { id?: string; taille?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={taille}
      height={taille}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {(id && ICONES[id]) || ICONES['divers']}
    </svg>
  );
}

export const LIBELLE_RARETE: Record<string, string> = {
  commun: 'Commun',
  'peu-commun': 'Peu commun',
  rare: 'Rare',
  'tres-rare': 'Très rare',
  legendaire: 'Légendaire',
};
