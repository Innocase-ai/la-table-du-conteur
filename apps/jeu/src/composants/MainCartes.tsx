// La main du héros dont c'est le tour : des sections repliables (Élan, Attaques, Sorts, Aptitudes…), puis « Indisponibles »
// replié. Une carte montre son coût, son nom, ses chiffres en pastilles (+5, 2d6+3, 1,5 m), sa description et l'illustration de
// l'arme ; un chiffre 1 à 9 la joue au clavier ; ⓘ la déplie. Les règles (sections, touches, pastilles) sont dans
// `main-cartes-regles.ts`, testées à part.
import { useCallback, useState } from 'react';
import type { Carte } from '@crpg/regles';
import { LIBELLES_COUT } from '../libelles';
import type { CoutCarte } from '@crpg/regles';
import { pastillesDeCarte, REPLIEES_PAR_DEFAUT, type IdSection, type SectionMain } from '../main-cartes-regles';
import { cleDeCarte, imageDeCarte } from '../pictogrammes-regles';
import { useImageCommune } from './ImageCommune';
import { Pictogramme } from './Pictogramme';
import './MainCartes.css';

const CLE_REPLIEES = 'crpg.combat.sections-repliees';

/** Le coût en un mot, pour la bande de la carte (la bande est étroite). */
const COUT_COURT: Record<CoutCarte, string> = { action: 'Action', bonus: 'Bonus', reaction: 'Réac.', gratuit: 'Gratuit', elan: 'Élan' };

/** Les sections repliées, gardées dans le navigateur (chaque joueur garde son rangement). */
export function useSectionsRepliees(): [ReadonlySet<string>, (id: IdSection) => void] {
  const [repliees, setRepliees] = useState<ReadonlySet<string>>(() => {
    try {
      const brut = JSON.parse(window.localStorage.getItem(CLE_REPLIEES) ?? 'null') as unknown;
      if (Array.isArray(brut)) return new Set(brut.filter((x): x is string => typeof x === 'string'));
    } catch {
      // stockage indisponible ou illisible : le rangement par défaut
    }
    return new Set<string>(REPLIEES_PAR_DEFAUT);
  });
  const basculer = useCallback((id: IdSection) => {
    setRepliees((avant) => {
      const apres = new Set(avant);
      if (apres.has(id)) apres.delete(id);
      else apres.add(id);
      try {
        window.localStorage.setItem(CLE_REPLIEES, JSON.stringify([...apres]));
      } catch {
        // stockage plein ou indisponible : le rangement vaut pour cette session
      }
      return apres;
    });
  }, []);
  return [repliees, basculer];
}

interface Props {
  sections: SectionMain[];
  repliees: ReadonlySet<string>;
  onBasculer: (id: IdSection) => void;
  /** Les touches 1 à 9 : l'id d'une carte → son chiffre. */
  numeros: ReadonlyMap<string, number>;
  selection?: string;
  inactive: boolean;
  onJouer: (k: Carte) => void;
  /** L'école de magie d'un sort (pour l'icône d'un sort sans dessin propre). */
  ecoleDe?: (idSort: string) => string | undefined;
}

/** L'illustration d'une carte : l'image de l'arme si le moteur en a une, sinon le pictogramme de la carte. */
function VisuelCarte({ k, ecoleDe, grand = false }: { k: Carte; ecoleDe?: Props['ecoleDe']; grand?: boolean }) {
  const icone = cleDeCarte(k, k.categorie === 'sort' ? ecoleDe?.(k.id.slice('sort:'.length)) : undefined);
  const ref = imageDeCarte(k);
  const url = useImageCommune(ref?.groupe, ref?.id);
  if (url) {
    return (
      <span className={`mc-image${grand ? ' mc-image-grande' : ''}`}>
        <img src={url} alt="" draggable={false} />
        {icone.lancer && (
          <span className="mc-lancer" title="Arme lancée">
            ➹
          </span>
        )}
      </span>
    );
  }
  return (
    <span className={`mc-symbole${grand ? ' mc-symbole-grand' : ''}`}>
      <Pictogramme cle={icone.cle} lancer={icone.lancer} taille={grand ? 52 : 30} medaillon />
    </span>
  );
}

function CarteJeu({ k, choisie, inactive, touche, ouverte, onJouer, onBasculerDetail, ecoleDe }: { k: Carte; choisie: boolean; inactive: boolean; touche?: number; ouverte: boolean; onJouer: () => void; onBasculerDetail: () => void; ecoleDe?: Props['ecoleDe'] }) {
  const jouable = k.jouable && !inactive;
  const pastilles = pastillesDeCarte(k);
  const titre = k.jouable ? k.description : `${k.raison ?? 'Indisponible.'}\n\n${k.description}`;
  return (
    <div className={`mc-emplacement cout-${k.cout}${ouverte ? ' ouverte' : ''}`}>
      <button
        type="button"
        className={`mc-carte cat-${k.categorie}${jouable ? '' : ' injouable'}${choisie ? ' choisie' : ''}`}
        title={titre}
        aria-label={`${k.nom} (${LIBELLES_COUT[k.cout]})${k.jouable ? '' : ` — indisponible : ${k.raison ?? ''}`}`}
        aria-keyshortcuts={touche ? String(touche) : undefined}
        onClick={() => jouable && onJouer()}
        aria-disabled={!jouable}
      >
        <span className="mc-bande">
          <Pictogramme cle={`cout:${k.cout}`} taille={14} surFond />
          <span className="mc-cout" title={LIBELLES_COUT[k.cout]}>{COUT_COURT[k.cout]}</span>
        </span>
        <span className="mc-corps">
          <span className="mc-nom">{k.nom}</span>
          {pastilles.length > 0 && (
            <span className="mc-pastilles">
              {pastilles.map((p) => (
                <span key={p.id} className={`mc-pastille mc-${p.genre}`} title={p.titre}>
                  {p.cle && <Pictogramme cle={p.cle} taille={13} />}
                  {p.texte}
                </span>
              ))}
            </span>
          )}
          <span className="mc-description">{k.description}</span>
          {k.ressource && <span className="mc-ressource">{k.ressource}</span>}
          {!k.jouable && k.raison && <span className="mc-raison">{k.raison}</span>}
        </span>
        <VisuelCarte k={k} ecoleDe={ecoleDe} />
        {touche && jouable && <kbd className="mc-touche">{touche}</kbd>}
      </button>
      <button type="button" className="mc-info" aria-expanded={ouverte} aria-label={`Détails : ${k.nom}`} title="Détails" onClick={onBasculerDetail}>
        {ouverte ? '▴' : 'ⓘ'}
      </button>
      {ouverte && (
        <div className="mc-detail">
          <VisuelCarte k={k} ecoleDe={ecoleDe} grand />
          <div>
            <p>{k.description}</p>
            {k.ressource && <p className="mc-ressource">{k.ressource}</p>}
            {!k.jouable && k.raison && <p className="mc-raison">{k.raison}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export function MainCartes({ sections, repliees, onBasculer, numeros, selection, inactive, onJouer, ecoleDe }: Props) {
  const [details, setDetails] = useState<ReadonlySet<string>>(new Set());
  const basculerDetail = (id: string) =>
    setDetails((avant) => {
      const apres = new Set(avant);
      if (apres.has(id)) apres.delete(id);
      else apres.add(id);
      return apres;
    });
  if (!sections.length) return <div className="main-vide">Aucune carte</div>;
  return (
    <div className="mc-main">
      {sections.map((s) => {
        const repliee = repliees.has(s.id);
        return (
          <section key={s.id} className={`mc-section mc-section-${s.id}`} aria-label={s.titre}>
            <button type="button" className="mc-titre" aria-expanded={!repliee} onClick={() => onBasculer(s.id)}>
              <span className="mc-chevron" aria-hidden>
                {repliee ? '▸' : '▾'}
              </span>
              {s.titre}
              <span className="mc-compteur">{s.cartes.length}</span>
            </button>
            {!repliee && (
              <div className="mc-cartes">
                {s.cartes.map((k) => (
                  <CarteJeu
                    key={k.id}
                    k={k}
                    choisie={k.id === selection}
                    inactive={inactive}
                    touche={numeros.get(k.id)}
                    ouverte={details.has(k.id)}
                    onJouer={() => onJouer(k)}
                    onBasculerDetail={() => basculerDetail(k.id)}
                    ecoleDe={ecoleDe}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
