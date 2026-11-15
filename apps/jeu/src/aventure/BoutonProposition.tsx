// Le bouton d'une proposition des modules : un clic envoie l'ordre au moteur. Il sait aussi demander un texte (`saisie`),
// proposer un choix parmi des options (`choix`, avec les portraits quand ce sont des héros) et demander une
// confirmation pour ce qui ne se défait pas (`confirmer`). Aucune commande n'est connue ici.
import { useContext, useEffect, useState } from 'react';
import type { Ordre, Personnage, Proposition } from '@crpg/regles';
import { NOMS_COMPETENCES } from '../createur/libelles';
import { Portrait } from '../createur/ui';
import { Pictogramme } from '../composants/Pictogramme';
import { FormulaireReponse } from './FormulaireReponse';
import { useImageElement } from './GrilleElements';
import { ContextePreparation } from './preparation-contexte';

interface Props {
  p: Proposition;
  jouer: (o: Ordre) => void;
  onCombat: () => void;
  /** Les héros du groupe, pour montrer le portrait des options qui en désignent un. */
  groupe: Personnage[];
  /** Le monde de l'histoire, pour retrouver la vignette d'un bouton (portrait d'un PNJ). */
  monde?: string;
}

/** « +6 » ou « −1 » : le bonus d'un test, avec son signe. */
const signeBonus = (n: number | undefined) => (n === undefined ? '' : n >= 0 ? `+${n}` : `−${Math.abs(n)}`);

export function BoutonProposition({ p, jouer, onCombat, groupe, monde = '' }: Props) {
  const [texte, setTexte] = useState('');
  const [ouvert, setOuvert] = useState(false);
  const [aConfirmer, setAConfirmer] = useState(false);
  const [acteurOuvert, setActeurOuvert] = useState(false);
  const vignette = useImageElement(monde, p.image);
  const preparer = useContext(ContextePreparation);

  // Une confirmation demandée se perd si on n'y répond pas.
  useEffect(() => {
    if (!aConfirmer) return;
    const t = window.setTimeout(() => setAConfirmer(false), 3000);
    return () => window.clearTimeout(t);
  }, [aConfirmer]);

  if (p.formulaire) return <FormulaireReponse p={p} f={p.formulaire} jouer={jouer} />;

  if (p.saisie) {
    return (
      <form
        className="enigme-reponse"
        onSubmit={(ev) => {
          ev.preventDefault();
          if (p.ordre && texte.trim()) jouer({ ...p.ordre, [p.saisie!.champ]: texte.trim() });
        }}
      >
        <input type="text" value={texte} placeholder={p.saisie.indication} onChange={(ev) => setTexte(ev.target.value)} />
        <button type="submit" className="bouton" disabled={!texte.trim() || !!p.desactivee}>
          {p.libelle}
        </button>
      </form>
    );
  }

  const classe = `${p.style === 'principal' ? 'bouton-principal' : p.style === 'discret' ? 'bouton-discret' : 'bouton'}${p.image ? ' bouton-vignette' : ''}${p.icone && !p.image ? ' bouton-icone' : ''}`;
  const detail = p.detail ? (NOMS_COMPETENCES[p.detail as keyof typeof NOMS_COMPETENCES] ?? p.detail) : undefined;

  if (p.choix) {
    const { champ, indication, options } = p.choix;
    return (
      <span className="choix">
        <button
          type="button"
          className={classe}
          disabled={!!p.desactivee}
          title={p.desactivee ?? p.aide}
          aria-expanded={ouvert}
          onClick={() => setOuvert(!ouvert)}
        >
          {p.libelle}
        </button>
        {ouvert && (
          <span className="choix-options" role="group" aria-label={indication}>
            <small>{indication}</small>
            {options.map((o) => {
              const heros = o.personnage ? groupe.find((a) => a.id === o.personnage) : undefined;
              return (
                <button
                  key={o.valeur}
                  type="button"
                  className="choix-option"
                  disabled={!!o.desactivee}
                  title={o.desactivee}
                  onClick={() => {
                    setOuvert(false);
                    if (p.ordre) jouer({ ...p.ordre, [champ]: o.valeur });
                  }}
                >
                  {heros && <Portrait id={heros.portrait} espece={heros.fiche.espece} classe={heros.fiche.classe} taille={26} />}
                  <span>
                    <strong>{o.libelle}</strong>
                    {o.detail && <small>{o.detail}</small>}
                  </span>
                </button>
              );
            })}
          </span>
        )}
      </span>
    );
  }

  const bouton = (
    <button
      type="button"
      className={`${classe} ${aConfirmer ? 'bouton-confirmer' : ''}`}
      disabled={!!p.desactivee}
      title={p.desactivee ?? p.aide}
      onClick={() => {
        if (p.confirmer && !aConfirmer) return setAConfirmer(true);
        setAConfirmer(false);
        if (p.intention === 'combattre') onCombat();
        else if (p.intention === 'preparer') preparer(String(p.ordre?.personnage ?? ''));
        else if (p.ordre) jouer(p.ordre);
      }}
    >
      {p.image && !aConfirmer ? (
        <>
          <span className="vignette-bouton" style={vignette ? { backgroundImage: `url(${vignette})` } : undefined} aria-hidden>
            {!vignette && p.libelle.replace(/^Parler à /, '').charAt(0)}
            {p.signe && <span className={`signe-quete signe-${p.signe === '?' ? 'rapport' : p.signe === '!' ? 'quete' : 'objectif'}`} aria-label={p.aide}>{p.signe}</span>}
          </span>
          <span className="bouton-texte">
            <span className="bouton-titre">{p.libelle}</span>
            {detail && <small>{detail}</small>}
          </span>
        </>
      ) : (
        <>
          {p.icone && !aConfirmer && <Pictogramme cle={p.icone} taille={p.style === 'discret' ? 18 : 22} surFond={p.style === 'principal'} />}
          {p.signe && !aConfirmer && <span className={`signe-quete signe-en-ligne signe-${p.signe === '?' ? 'rapport' : p.signe === '!' ? 'quete' : 'objectif'}`} title="Objectif de quête">{p.signe}</span>}
          {aConfirmer ? 'Confirmer ?' : p.etiquette ? `[${p.etiquette}] ${p.libelle}` : p.libelle}
          {!aConfirmer && detail && <small> — {detail}</small>}
          {!aConfirmer && !p.detail && p.jet?.qui && <small className="acteur-annonce"> — {p.jet.qui} {signeBonus(p.jet.bonus)}</small>}
        </>
      )}
    </button>
  );
  // Un test d'exploration : un petit sélecteur fait agir un autre héros du groupe que celui annoncé sur le bouton.
  const acteurs = p.acteurs && p.acteurs.length > 1 && p.ordre && !p.desactivee ? p.acteurs : undefined;
  if (acteurs && p.ordre) {
    const ordre = p.ordre;
    return (
      <span className="acteur-bloc">
        <span className="acteur-ligne">
          {bouton}
          <button
            type="button"
            className="acteur-bascule"
            aria-expanded={acteurOuvert}
            aria-label={`${p.libelle} : choisir qui agit`}
            title="Faire agir un autre héros"
            onClick={() => setActeurOuvert(!acteurOuvert)}
          >
            ⇄
          </button>
        </span>
        {acteurOuvert && (
          <span className="choix-options acteur-options" role="group" aria-label={`Qui tente : ${p.libelle}`}>
            <small>Qui tente ?</small>
            {acteurs.map((o) => {
              const heros = groupe.find((a) => a.id === o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  className={`choix-option${o.nom === p.jet?.qui ? ' acteur-defaut' : ''}`}
                  disabled={!!o.desactivee}
                  title={o.desactivee}
                  onClick={() => {
                    setActeurOuvert(false);
                    jouer({ ...ordre, personnage: o.id });
                  }}
                >
                  {heros && <Portrait id={heros.portrait} espece={heros.fiche.espece} classe={heros.fiche.classe} taille={26} />}
                  <span>
                    <strong>{o.nom}</strong>
                    <small>{o.desactivee ?? `${signeBonus(o.bonus)}${o.nom === p.jet?.qui ? ' · par défaut' : ''}`}</small>
                  </span>
                </button>
              );
            })}
          </span>
        )}
      </span>
    );
  }
  // Une phrase d'explication sous le bouton (où mène une sortie) : le joueur sait pourquoi il clique.
  if (!p.apercu) return bouton;
  return (
    <div className="proposition-apercu">
      {bouton}
      <p>{p.apercu}</p>
    </div>
  );
}
