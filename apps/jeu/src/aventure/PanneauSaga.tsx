// Le carnet de la saga et la suite (F5 d de docs/PRD-SAGA.md) : ce que les épisodes précédents ont laissé derrière le groupe (une phrase par écho),
// et, à la fin d'un épisode, le choix de l'épisode suivant (« Continuer la saga »).
import type { EchoCarnet } from '@crpg/regles';
import type { SuiteSaga } from './saga-regles';

/** Le carnet : un repli discret, une phrase par écho. Rien à afficher quand il est vide. */
export function CarnetSaga({ carnet, noms, ouvert = false }: { carnet: EchoCarnet[]; noms: Record<string, string>; ouvert?: boolean }) {
  if (!carnet.length) return null;
  return (
    <details className="carnet-saga" open={ouvert}>
      <summary>Carnet de la saga ({carnet.length})</summary>
      <ul>
        {carnet.map((e) => (
          <li key={e.id}>
            <span className="carnet-saga-phrase">{e.phrase}</span>
            <span className="carnet-saga-origine"> — {noms[e.monde] ?? e.monde}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Les suites possibles : un bouton par épisode, avec sa plage de niveaux ; le plus proche du niveau du groupe en premier. */
export function ChoixSuite({ suites, niveau, occupe, onChoisir }: { suites: SuiteSaga[]; niveau: number; occupe: boolean; onChoisir: (monde: string) => void }) {
  if (!suites.length) return null;
  return (
    <div className="choix-suite">
      <h4>Continuer la saga</h4>
      <p className="enonce">Votre groupe (niveau {niveau}) emporte ses héros, son or, son sac et ses souvenirs vers un nouvel épisode.</p>
      <ul>
        {suites.map((s) => (
          <li key={s.id}>
            <button type="button" className="bouton-principal" disabled={occupe} onClick={() => onChoisir(s.id)}>
              {s.nom} <span className="choix-suite-niveaux">(niveaux {s.min === s.max ? s.min : `${s.min} à ${s.max}`})</span>
            </button>
            <span className="choix-suite-accroche">{s.accroche}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
