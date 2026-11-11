// La carte du monde : l'image illustrée du lieu conteneur (région, ville, donjon…), les lieux posés dessus, un voile de
// brouillard sur ce que le groupe n'a pas vu et le repère « vous êtes ici ». Elle ne calcule rien : le module Carte du moteur
// lui donne les lieux visibles ; se déplacer, c'est la commande `aller`, comme avec les boutons de l'onglet Actions.
import { useEffect, useId, useState } from 'react';
import type { CarteMonde as DonneesCarte, MarqueurCarte, Ordre } from '@crpg/regles';
import { manifesteDe, urlImage } from '../mondes';

const LARGEUR = 1248;
const HAUTEUR = 832;

const TYPES: Record<string, string> = {
  region: 'Région', ville: 'Ville', village: 'Village', hameau: 'Hameau', camp: 'Camp', route: 'Route', grotte: 'Grotte', donjon: 'Donjon', niveau: 'Niveau',
  salle: 'Salle', ruine: 'Ruine', batiment: 'Bâtiment', quartier: 'Quartier', 'lieu-dit': 'Lieu-dit',
};

/** L'image de la carte d'un lieu conteneur, d'après le manifeste du monde (absente : on dessine un fond uni). */
function useImageCarte(monde: string, id: string): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let actif = true;
    setUrl(undefined);
    // Pas de carte illustrée pour ce lieu (peu d'enfants : le seuil des cartes est de 5) : son image de lieu sert de fond, plutôt
    // qu'un fond noir.
    const manifeste = manifesteDe(monde);
    const fichier = manifeste?.cartes?.[id] ?? manifeste?.lieux?.[id];
    if (fichier) urlImage(monde, fichier)?.then((u) => actif && setUrl(u));
    return () => {
      actif = false;
    };
  }, [monde, id]);
  return url;
}

interface Props {
  monde: string;
  carte: DonneesCarte;
  jouer: (o: Ordre) => void;
  /** Plein écran : les noms de tous les lieux sont écrits ; sinon seul le lieu du groupe (et celui qu'on regarde). */
  grande?: boolean;
}

export function CarteMonde({ monde, carte, jouer, grande }: Props) {
  const idMasque = useId().replace(/:/g, '');
  const [vueId, setVueId] = useState(carte.courant);
  const [choisi, setChoisi] = useState<string>();
  // Le groupe a bougé : la carte revient sur le lieu où il se trouve.
  useEffect(() => {
    setVueId(carte.courant);
    setChoisi(undefined);
  }, [carte.courant, carte.lieu.id]);
  const vue = carte.vues[vueId] ?? carte.vues[carte.courant];
  const image = useImageCarte(monde, vue?.conteneur.id ?? '');
  if (!vue) return <p className="encart-texte">Pas encore de carte à montrer ici.</p>;

  const u = grande ? 1 : 2.6; // taille d'un point d'interface en unités du dessin
  const px = (m: MarqueurCarte) => ({ cx: (m.x / 100) * LARGEUR, cy: (m.y / 100) * HAUTEUR });
  const sel = vue.marqueurs.find((m) => m.id === choisi);
  const parent = vue.conteneur.parent && carte.vues[vue.conteneur.parent] ? vue.conteneur.parent : undefined;
  const rayonVoile = (m: MarqueurCarte) => (m.etat === 'connu' ? 120 : 180);

  return (
    <div className={`carte-monde${grande ? ' carte-grande' : ''}`}>
      <div className="carte-titre">
        {parent ? (
          <button type="button" className="bouton-discret" onClick={() => { setVueId(parent); setChoisi(undefined); }}>
            ‹ {carte.vues[parent]!.conteneur.nom}
          </button>
        ) : null}
        <strong>{vue.conteneur.nom}</strong>
        <small>{TYPES[vue.conteneur.type] ?? vue.conteneur.type}</small>
      </div>
      <svg className="carte-svg" viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`} role="group" aria-label={`Carte : ${vue.conteneur.nom}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id={`${idMasque}-fond`} cx="50%" cy="45%" r="75%">
            <stop offset="0%" stopColor="#2a2118" />
            <stop offset="100%" stopColor="#120f0b" />
          </radialGradient>
          <filter id={`${idMasque}-flou`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="38" />
          </filter>
          <mask id={`${idMasque}-masque`} maskUnits="userSpaceOnUse" x="0" y="0" width={LARGEUR} height={HAUTEUR}>
            <rect width={LARGEUR} height={HAUTEUR} fill="white" />
            <g filter={`url(#${idMasque}-flou)`} fill="black">
              {vue.marqueurs.map((m) => (
                <circle key={m.id} {...px(m)} r={rayonVoile(m)} />
              ))}
            </g>
          </mask>
        </defs>
        <rect width={LARGEUR} height={HAUTEUR} fill={`url(#${idMasque}-fond)`} />
        {image && <image href={image} width={LARGEUR} height={HAUTEUR} preserveAspectRatio="xMidYMid slice" />}
        {image && <rect width={LARGEUR} height={HAUTEUR} fill="#0b0907" opacity="0.84" mask={`url(#${idMasque}-masque)`} pointerEvents="none" />}
        {vue.marqueurs.map((m) => {
          const { cx, cy } = px(m);
          const actif = m.id === choisi;
          const nom = grande || m.etat === 'ici' || actif;
          return (
            <g
              key={m.id}
              className={`carte-lieu carte-${m.etat}${actif ? ' carte-choisi' : ''}`}
              role="button"
              tabIndex={0}
              aria-label={`${m.nom}${m.etat === 'ici' ? ' (vous êtes ici)' : m.etat === 'connu' ? ' (pas encore visité)' : ''}`}
              onClick={() => setChoisi(m.id)}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                  ev.preventDefault();
                  setChoisi(m.id);
                }
              }}
            >
              <circle className="carte-zone" cx={cx} cy={cy} r={26 * u} />
              {m.etat === 'ici' && <circle className="carte-repere" cx={cx} cy={cy} r={20 * u} />}
              <circle className="carte-point" cx={cx} cy={cy} r={(m.etat === 'ici' ? 11 : 9) * u} />
              {m.objectifs && (
                <rect className="carte-objectif" x={cx + 9 * u} y={cy - 21 * u} width={11 * u} height={11 * u} transform={`rotate(45 ${cx + 14.5 * u} ${cy - 15.5 * u})`}>
                  <title>Objectif : {m.objectifs.join(', ')}</title>
                </rect>
              )}
              {nom && (
                <text className="carte-nom" x={cx} y={cy - 18 * u} fontSize={15 * u} textAnchor="middle">
                  {m.nom}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="carte-volet" aria-live="polite">
        {sel ? (
          <>
            <strong>{sel.nom}</strong> <small>{TYPES[sel.type] ?? sel.type}</small>
            {sel.objectifs && <p className="carte-objectifs">◆ Objectif de quête : {sel.objectifs.join(', ')}</p>}
            {sel.etat === 'ici' ? (
              <p>{sel.id === carte.lieu.id ? 'Le groupe est ici.' : 'Le groupe est quelque part là-dedans.'}</p>
            ) : sel.acces?.bloque ? (
              <p>Ce passage est infranchissable pour l’instant.</p>
            ) : sel.acces?.verrouille ? (
              <p>Le passage est verrouillé : voyez « Partir » dans l’onglet Actions.</p>
            ) : sel.acces ? (
              <button type="button" className="bouton-principal" onClick={() => jouer({ type: 'aller', vers: sel.id })}>
                Y aller{sel.acces.heures ? ` (${sel.acces.heures} h)` : ''}
              </button>
            ) : (
              <p>Pas de passage direct d’ici.</p>
            )}
            {sel.etat === 'connu' && <p className="carte-aide">Pas encore visité.</p>}
            {sel.aCarte && (
              <button type="button" className="bouton" onClick={() => { setVueId(sel.id); setChoisi(undefined); }}>
                Ouvrir sa carte
              </button>
            )}
          </>
        ) : (
          <p className="carte-aide">
            <span className="carte-legende ici" /> vous êtes ici · <span className="carte-legende visite" /> visité · <span className="carte-legende connu" /> connu, pas encore visité · <span className="carte-legende objectif" /> objectif de quête. Choisissez un lieu.
          </p>
        )}
      </div>
    </div>
  );
}
