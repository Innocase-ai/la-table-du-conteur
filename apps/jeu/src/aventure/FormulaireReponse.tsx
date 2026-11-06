// Le formulaire de réponse d'une proposition structurée (une énigme à séquence, à cadran, à leviers ou à placement).
// L'écran ne connaît pas l'énigme : il montre ce que décrit `Proposition.formulaire` et renvoie la réponse dans le champ
// que l'ordre attend.
import { useState } from 'react';
import type { FormulaireReponse as Formulaire, Ordre, Proposition } from '@crpg/regles';

interface Props {
  p: Proposition;
  f: Formulaire;
  jouer: (o: Ordre) => void;
}

export function FormulaireReponse({ p, f, jouer }: Props) {
  const envoyer = (reponse: unknown) => p.ordre && jouer({ ...p.ordre, [f.champ]: reponse });
  switch (f.type) {
    case 'ordre':
      return <FormulaireOrdre f={f} libelle={p.libelle} desactivee={p.desactivee} envoyer={envoyer} />;
    case 'nombres':
      return <FormulaireNombres f={f} libelle={p.libelle} desactivee={p.desactivee} envoyer={envoyer} />;
    case 'interrupteurs':
      return <FormulaireLeviers f={f} libelle={p.libelle} desactivee={p.desactivee} envoyer={envoyer} />;
    case 'association':
      return <FormulaireAssociation f={f} libelle={p.libelle} desactivee={p.desactivee} envoyer={envoyer} />;
  }
}

interface PropsType<F> {
  f: F;
  libelle: string;
  desactivee?: string;
  envoyer: (reponse: unknown) => void;
}

type Cas<T extends Formulaire['type']> = Extract<Formulaire, { type: T }>;

/** Les éléments s'ajoutent un à un, dans l'ordre de la réponse. */
function FormulaireOrdre({ f, libelle, desactivee, envoyer }: PropsType<Cas<'ordre'>>) {
  const [choisis, setChoisis] = useState<string[]>([]);
  const nom = (valeur: string) => f.options.find((o) => o.valeur === valeur)?.libelle ?? valeur;
  const complet = choisis.length === f.taille;
  return (
    <div className="formulaire-reponse">
      <ol className="formulaire-ordre" aria-label="Votre réponse">
        {Array.from({ length: f.taille }, (_, i) => (
          <li key={i} className={choisis[i] ? 'rempli' : ''}>
            {choisis[i] ? nom(choisis[i]!) : '…'}
          </li>
        ))}
      </ol>
      <div className="formulaire-options" role="group" aria-label="Éléments à placer dans l'ordre">
        {f.options.map((o) => (
          <button
            key={o.valeur}
            type="button"
            className="bouton"
            disabled={choisis.includes(o.valeur) || complet}
            onClick={() => setChoisis([...choisis, o.valeur])}
          >
            {o.libelle}
          </button>
        ))}
      </div>
      <div className="liste-actions-ligne">
        <button
          type="button"
          className="bouton-principal"
          disabled={!complet || !!desactivee}
          title={complet ? desactivee : `Choisir encore ${f.taille - choisis.length} élément(s)`}
          onClick={() => {
            envoyer(choisis);
            setChoisis([]);
          }}
        >
          {libelle}
        </button>
        <button type="button" className="bouton-discret" disabled={!choisis.length} onClick={() => setChoisis(choisis.slice(0, -1))}>
          Retirer le dernier
        </button>
        <button type="button" className="bouton-discret" disabled={!choisis.length} onClick={() => setChoisis([])}>
          Recommencer
        </button>
      </div>
    </div>
  );
}

/** Des nombres à régler, un champ par réglage (borné quand la plage est connue). */
function FormulaireNombres({ f, libelle, desactivee, envoyer }: PropsType<Cas<'nombres'>>) {
  const [valeurs, setValeurs] = useState<string[]>(() => f.libelles.map(() => ''));
  const valide = valeurs.every(
    (v) => v !== '' && Number.isInteger(Number(v)) && (f.min === undefined || Number(v) >= f.min) && (f.max === undefined || Number(v) <= f.max),
  );
  return (
    <form
      className="formulaire-reponse"
      onSubmit={(ev) => {
        ev.preventDefault();
        if (valide) envoyer(valeurs.map(Number));
      }}
    >
      <div className="formulaire-champs">
        {f.libelles.map((nom, i) => (
          <label key={nom + i} className="formulaire-champ">
            <span>{nom}</span>
            <input
              type="number"
              inputMode="numeric"
              step={1}
              min={f.min}
              max={f.max}
              value={valeurs[i]}
              placeholder={f.min !== undefined && f.max !== undefined ? `${f.min} à ${f.max}` : undefined}
              onChange={(ev) => setValeurs(valeurs.map((v, j) => (j === i ? ev.target.value : v)))}
            />
          </label>
        ))}
      </div>
      <div className="liste-actions-ligne">
        <button type="submit" className="bouton-principal" disabled={!valide || !!desactivee} title={desactivee}>
          {libelle}
        </button>
      </div>
    </form>
  );
}

/** Des leviers à mettre en haut ou en bas (tous en bas au départ). */
function FormulaireLeviers({ f, libelle, desactivee, envoyer }: PropsType<Cas<'interrupteurs'>>) {
  const [positions, setPositions] = useState<boolean[]>(() => f.libelles.map(() => false));
  return (
    <div className="formulaire-reponse">
      <div className="formulaire-leviers">
        {f.libelles.map((nom, i) => (
          <button
            key={nom + i}
            type="button"
            className={`formulaire-levier ${positions[i] ? 'haut' : 'bas'}`}
            aria-pressed={positions[i]}
            onClick={() => setPositions(positions.map((v, j) => (j === i ? !v : v)))}
          >
            <span>{nom}</span>
            <strong>{f.etats[positions[i] ? 1 : 0]}</strong>
          </button>
        ))}
      </div>
      <div className="liste-actions-ligne">
        <button type="button" className="bouton-principal" disabled={!!desactivee} title={desactivee} onClick={() => envoyer(positions)}>
          {libelle}
        </button>
      </div>
    </div>
  );
}

/** Chaque emplacement reçoit un élément, une seule fois. */
function FormulaireAssociation({ f, libelle, desactivee, envoyer }: PropsType<Cas<'association'>>) {
  const [choix, setChoix] = useState<Record<string, string>>({});
  const complet = f.emplacements.every((e) => choix[e.cle]);
  return (
    <div className="formulaire-reponse">
      <div className="formulaire-champs">
        {f.emplacements.map((e) => (
          <label key={e.cle} className="formulaire-champ">
            <span>{e.libelle}</span>
            <select value={choix[e.cle] ?? ''} onChange={(ev) => setChoix({ ...choix, [e.cle]: ev.target.value })}>
              <option value="">—</option>
              {f.options.map((o) => (
                <option key={o.valeur} value={o.valeur} disabled={Object.entries(choix).some(([cle, v]) => v === o.valeur && cle !== e.cle)}>
                  {o.libelle}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="liste-actions-ligne">
        <button
          type="button"
          className="bouton-principal"
          disabled={!complet || !!desactivee}
          title={complet ? desactivee : 'Il faut un élément à chaque emplacement'}
          onClick={() => envoyer(choix)}
        >
          {libelle}
        </button>
      </div>
    </div>
  );
}
