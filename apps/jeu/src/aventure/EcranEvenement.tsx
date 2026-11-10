// L'écran d'un événement à choix illustré : une grande image du lieu, et dessous une boîte de texte sombre. D'abord la
// narration et les choix numérotés (généraux, puis ceux qui sont propres à l'origine d'un héros du groupe, préfixés
// « (Nain) »), puis, une fois le choix fait, le résultat et le seul bouton « Partir ». Il ne connaît aucune règle : tout
// vient de la vue `evenementEnCours` du moteur, et chaque bouton envoie une commande.
import { useEffect, useRef, useState } from 'react';
import type { DonneesMonde, FicheEvenement, Ordre } from '@crpg/regles';
import { actionDeTouche, libelleJet, ligneDeJet } from '../evenement-regles';
import { manifesteDe, urlImage } from '../mondes';
import './EcranEvenement.css';

interface Props {
  dm: DonneesMonde;
  fiche: FicheEvenement;
  /** Envoie une commande au moteur. */
  jouer: (o: Ordre) => void;
}

/** L'image de l'événement (celle qu'il désigne, sinon celle de son lieu). */
function useIllustration(monde: string, fiche: FicheEvenement): string | undefined {
  const [url, setUrl] = useState<string>();
  const groupe = fiche.image?.groupe ?? 'lieux';
  const id = fiche.image?.id ?? fiche.lieu;
  useEffect(() => {
    let actif = true;
    setUrl(undefined);
    const fichier = manifesteDe(monde)?.[groupe][id];
    if (fichier) urlImage(monde, fichier)?.then((u) => actif && setUrl(u));
    return () => {
      actif = false;
    };
  }, [monde, groupe, id]);
  return url;
}

export function EcranEvenement({ dm, fiche, jouer }: Props) {
  const image = useIllustration(dm.monde.id, fiche);
  const resultat = fiche.resultat;
  const partir = () => jouer({ type: 'quitterEvenement', evenement: fiche.id });
  const choisir = (choix: string) => jouer({ type: 'choisirEvenement', evenement: fiche.id, choix });
  const texte = useRef<HTMLDivElement>(null);
  useEffect(() => {
    texte.current?.scrollTo({ top: 0 });
  }, [resultat]);

  // Touches 1 à 9, Échap pour partir (Entrée aussi, une fois le résultat lu).
  useEffect(() => {
    const surTouche = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const a = actionDeTouche(ev.key, fiche.choix, !!resultat);
      if (!a) return;
      ev.preventDefault();
      ev.stopPropagation();
      if (a.type === 'partir') partir();
      else choisir(a.id);
    };
    window.addEventListener('keydown', surTouche, true);
    return () => window.removeEventListener('keydown', surTouche, true);
  });

  return (
    <div className="evt" role="dialog" aria-modal="true" aria-label={fiche.titre}>
      <div className="evt-cadre">
        <div className="evt-image" style={image ? { backgroundImage: `url(${image})` } : undefined} aria-hidden />
        <div className="evt-boite">
          <h2 className="evt-titre">{fiche.titre}</h2>
          <div className="evt-texte" ref={texte} aria-live="polite">
            {resultat ? (
              <>
                <p className="evt-choisi">
                  {resultat.heros && <strong>{resultat.heros} : </strong>}
                  {resultat.libelle}
                </p>
                {resultat.jets.map((j, i) => (
                  <p key={i} className={`evt-jet ${j.reussite ? 'evt-jet-reussi' : 'evt-jet-rate'}`}>
                    <span aria-hidden>⚄</span> {ligneDeJet(j)}
                  </p>
                ))}
                <p>{resultat.texte}</p>
                {resultat.narrations.map((n, i) => (
                  <p key={`n${i}`}>{n}</p>
                ))}
                {resultat.faits.flatMap((f) => {
                  const fait = dm.faits.get(f);
                  return fait?.fiable ? [<p key={f} className="evt-constat">Vous apprenez : {fait.texte}</p>] : [];
                })}
                {resultat.constats.filter((c) => !(resultat.jets.length && /\b(réussit|échoue)\.$/.test(c))).map((c, i) => (
                  <p key={`c${i}`} className="evt-constat">
                    {c}
                  </p>
                ))}
              </>
            ) : (
              <p>{fiche.narration}</p>
            )}
          </div>
          <ol className="evt-choix" aria-label={resultat ? 'Sortie' : 'Vos choix'}>
            {!resultat &&
              fiche.choix.map((c, i) => (
                <li key={c.id}>
                  <button type="button" className={`evt-choix-bouton${c.origine ? ' evt-origine' : ''}`} disabled={!!c.desactivee} title={c.desactivee} onClick={() => choisir(c.id)}>
                    <span className="evt-choix-num">{i + 1}.</span>
                    <span>
                      {c.origine && <span className="evt-choix-origine">({c.origine})</span>} {c.libelle}
                      {c.jet && <small className="evt-choix-jet"> [{libelleJet(c.jet)}]</small>}
                      {c.desactivee && <small className="evt-choix-jet"> — {c.desactivee}</small>}
                    </span>
                  </button>
                </li>
              ))}
            <li>
              <button type="button" className="evt-choix-bouton evt-partir" title="Échap" onClick={partir}>
                {!resultat && <span className="evt-choix-num">{fiche.choix.length + 1}.</span>}
                <span>{fiche.partir}</span>
              </button>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
