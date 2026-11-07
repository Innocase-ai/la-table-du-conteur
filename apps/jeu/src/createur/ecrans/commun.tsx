// Éléments communs aux écrans du créateur.
import type { ReactNode } from 'react';
import type { ChoixCreation, Donnees, Sort } from '@crpg/regles';
import type { Brouillon } from '../brouillon';
import { ListeNav, Option, nomEcole } from '../ui';

export interface PropsEcran {
  b: Brouillon;
  donnees: Donnees;
  maj: (f: (b: Brouillon) => Brouillon) => void;
}

/** Panneau de description (colonne de droite). */
export function Panneau({ titre, sous, children }: { titre?: ReactNode; sous?: ReactNode; children: ReactNode }) {
  return (
    <div className="panneau-description">
      {titre && <h2>{titre}</h2>}
      {sous && <p className="panneau-sous">{sous}</p>}
      {children}
    </div>
  );
}

export function Puces({ elements }: { elements: { nom: string; valeur: ReactNode }[] }) {
  return (
    <dl className="puces">
      {elements.map((e) => (
        <div key={e.nom}>
          <dt>{e.nom}</dt>
          <dd>{e.valeur}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Niveau minimal exigé par une option (« Prérequis : niveau d'Occultiste 5+ »), 0 sinon. */
export function niveauRequis(resume: string): number {
  const m = /Prérequis : niveau d['’][A-Za-zéèêëïîôûùç ]+? (\d+)\+/.exec(resume);
  return m ? Number(m[1]) : 0;
}

/** Choix de création (lignage, ordre divin, métamagie…) : une ou plusieurs options à prendre. */
export function SelecteurChoix({
  def,
  nombre,
  valeur,
  niveau,
  onChange,
  onSurvol,
  figes = [],
}: {
  def: ChoixCreation;
  nombre: number;
  valeur: string[];
  niveau: number;
  onChange: (v: string[]) => void;
  onSurvol?: (id: string | null) => void;
  /** Options prises aux niveaux précédents : affichées choisies, mais qu'on ne peut plus changer (montée de niveau). */
  figes?: string[];
}) {
  const unique = nombre === 1;
  return (
    <ListeNav className="liste-options" aria-label={def.nom}>
      {def.options.map((o) => {
        const choisi = valeur.includes(o.id);
        const requis = niveauRequis(o.resume);
        const fige = figes.includes(o.id);
        const bloque = requis > niveau || fige;
        const plein = !unique && valeur.length >= nombre && !choisi;
        return (
          <Option
            key={o.id}
            selectionne={choisi}
            compact
            desactive={bloque || plein}
            raison={fige ? 'Choisie aux niveaux précédents.' : bloque ? `Réservé aux personnages de niveau ${requis} ou plus.` : `Vous avez déjà choisi ${nombre} option(s) : retirez-en une d'abord.`}
            titre={o.nom}
            sous={o.resume}
            onSurvol={(a) => onSurvol?.(a ? o.id : null)}
            onChoisir={() => onChange(unique ? [o.id] : choisi ? valeur.filter((x) => x !== o.id) : [...valeur, o.id])}
          />
        );
      })}
    </ListeNav>
  );
}

export function detailSort(s: Sort): { nom: string; valeur: string }[] {
  const portee = s.portee.type === 'contact' ? 'Contact' : s.portee.type === 'personnel' ? 'Personnelle' : `${String(s.portee.normale ?? 0).replace('.', ',')} m`;
  return [
    { nom: 'Niveau', valeur: s.niveau === 0 ? 'Sort mineur' : String(s.niveau) },
    { nom: 'École', valeur: nomEcole(s.ecole) },
    { nom: 'Portée', valeur: portee },
    { nom: 'Composantes', valeur: s.composantes },
    { nom: 'Durée', valeur: s.concentration ? `${s.duree} (concentration)` : s.duree },
  ];
}
