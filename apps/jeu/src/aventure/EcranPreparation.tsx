// L'écran de préparation des sorts : après un repos ou un niveau, le joueur change la liste de sorts préparés de son héros (et un
// sort mineur quand le SRD le permet). La « place en mémoire » est le nombre de sorts préparés permis, qui grandit avec le niveau.
// Le moteur valide tout (`verifierPreparation`, commande `changerSortsPrepares`) : l'écran n'est qu'un habillage. Il emprunte
// l'habillage de l'écran de montée de niveau.
import { useEffect, useMemo, useState } from 'react';
import { descriptionDroits, niveauSortMax, sortsEligibles, verifierPreparation, type Donnees, type Personnage } from '@crpg/regles';
import { ListeSorts, Portrait, Section } from '../createur/ui';

interface Props {
  donnees: Donnees;
  groupe: Personnage[];
  /** Le héros montré d'abord (celui dont on a cliqué le bouton). */
  initial?: string;
  /** Envoie une commande au moteur ; renvoie le refus éventuel. */
  envoyer: (ordre: { type: string; [cle: string]: unknown }) => string | undefined;
  onFermer: () => void;
}

/** Ceux qui ont le droit de changer leurs sorts maintenant. */
export const peutPreparer = (h: Personnage): boolean => !!h.choix && !!descriptionDroits(h.preparation);

function PanneauHeros({ h, donnees, envoyer }: { h: Personnage; donnees: Donnees; envoyer: Props['envoyer'] }) {
  const base = h.choix!;
  const droit = h.preparation!;
  const inc = h.fiche.incantation!;
  const [prepares, setPrepares] = useState<string[]>(base.sortsPrepares ?? []);
  const [mineurs, setMineurs] = useState<string[]>(base.sortsMineurs ?? []);
  const [refus, setRefus] = useState<string>();
  const classe = donnees.classes.get(base.classe);
  const niveauMax = classe ? niveauSortMax(classe, base.niveau) : 0;
  const nom = (id: string) => donnees.sorts.get(id)?.nom ?? id;

  // Les sorts toujours préparés ou venus d'ailleurs (don Initié, espèce) ne comptent pas dans la place en mémoire.
  const exclus = useMemo(() => new Set([...h.fiche.sortsAccordes, ...(base.sortsInitie?.mineurs ?? []), ...(base.sortsInitie?.niveau1 ?? [])]), [h.fiche.sortsAccordes, base.sortsInitie]);
  const eligibles = useMemo(() => sortsEligibles(base.classe, niveauMax, donnees).filter((s) => !exclus.has(s.id)), [base.classe, niveauMax, donnees, exclus]);

  const droitMineurs = droit.mineurs > 0;
  const verif = useMemo(() => verifierPreparation(h, { prepares, ...(droitMineurs ? { mineurs } : {}) }, donnees), [h, prepares, mineurs, droitMineurs, donnees]);
  const inchange = !verif.ok && verif.erreur === 'Rien n’a changé.';
  const retire = base.sortsPrepares?.filter((id) => !prepares.includes(id)) ?? [];
  const valider = () => setRefus(envoyer({ type: 'changerSortsPrepares', personnage: h.id, prepares, ...(droitMineurs ? { mineurs } : {}) }));

  return (
    <div className="montee-heros">
      <p className="aide">
        {h.nom} peut changer {descriptionDroits(droit)}.{' '}
        {droit.prepares === 'tous' ? 'Reprenez ce que vous voulez, dans la place en mémoire du niveau.' : 'Retirez un sort de la liste pour en choisir un autre.'}
      </p>

      {(droit.prepares === 'tous' || droit.prepares > 0) && inc.sortsPrepares > 0 && (
        <Section
          titre={`Sorts préparés — place en mémoire ${prepares.length} / ${inc.sortsPrepares}`}
          aide={retire.length ? `Retirés : ${retire.map(nom).join(', ')}.` : h.fiche.sortsAccordes.length ? `Toujours préparés (hors compteur) : ${h.fiche.sortsAccordes.map(nom).join(', ')}.` : undefined}
          etat={prepares.length === inc.sortsPrepares ? 'ok' : 'manque'}
        >
          <ListeSorts sorts={eligibles.filter((s) => s.niveau > 0)} choisis={prepares} max={inc.sortsPrepares} filtreNiveau etiquette="les sorts préparés" onChange={setPrepares} />
        </Section>
      )}

      {droitMineurs && (
        <Section titre={`Sorts mineurs — ${mineurs.length} / ${inc.sortsMineurs}`} aide="Vous pouvez remplacer un sort mineur par niveau gagné." etat={mineurs.length === inc.sortsMineurs ? 'ok' : 'manque'}>
          <ListeSorts sorts={eligibles.filter((s) => s.niveau === 0)} choisis={mineurs} max={inc.sortsMineurs} etiquette="les sorts mineurs" onChange={setMineurs} />
        </Section>
      )}

      {!verif.ok && !inchange && <p className="montee-erreur" role="alert">{verif.erreur}</p>}
      {refus && <p className="montee-erreur" role="alert">{refus}</p>}
      <div className="montee-actions">
        <button type="button" className="bouton-principal" onClick={valider} disabled={!verif.ok}>
          Valider mes sorts
        </button>
      </div>
    </div>
  );
}

export function EcranPreparation({ donnees, groupe, initial, envoyer, onFermer }: Props) {
  const attente = groupe.filter(peutPreparer);
  const [choisi, setChoisi] = useState<string | undefined>(initial || undefined);
  const courant = attente.find((h) => h.id === choisi) ?? attente[0];

  // Quand plus personne n'a rien à changer, l'écran se ferme tout seul.
  useEffect(() => {
    if (!attente.length) onFermer();
  }, [attente.length, onFermer]);
  useEffect(() => {
    const surTouche = (ev: KeyboardEvent) => ev.key === 'Escape' && onFermer();
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  }, [onFermer]);

  if (!courant) return null;
  return (
    <div className="ecran-montee" role="dialog" aria-modal="true" aria-label="Préparer ses sorts">
      <div className="montee-fenetre">
        <header className="montee-entete">
          <h2>Préparer ses sorts</h2>
          <button type="button" className="bouton-discret" onClick={onFermer}>
            Plus tard
          </button>
        </header>
        <div className="montee-onglets" role="tablist">
          {attente.map((h) => (
            <button key={h.id} type="button" role="tab" aria-selected={h.id === courant.id} className={h.id === courant.id ? 'actif' : ''} onClick={() => setChoisi(h.id)}>
              <Portrait id={h.portrait} espece={h.fiche.espece} classe={h.fiche.classe} taille={32} />
              {h.nom}
            </button>
          ))}
        </div>
        <PanneauHeros key={`${courant.id}:${JSON.stringify(courant.preparation)}:${(courant.choix?.sortsPrepares ?? []).join(',')}`} h={courant} donnees={donnees} envoyer={envoyer} />
      </div>
    </div>
  );
}
