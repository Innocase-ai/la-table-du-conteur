// L'écran de montée de niveau : le moteur a déjà fait monter les héros avec les choix conseillés ; ici le joueur revoit les
// nouveaux choix de chacun (amélioration de caractéristique, sorts, options de classe, expertises). Le moteur valide tout
// (`reviserChoixDeMontee`) : l'écran n'est qu'un habillage. Échap ou « Plus tard » ferment sans rien changer.
import { useEffect, useMemo, useState } from 'react';
import {
  CARACTERISTIQUES,
  choixDeMontee,
  effetsAcquis,
  reviserChoixDeMontee,
  sortsEligibles,
  type Caracteristique,
  type ChoixPersonnage,
  type Competence,
  type Donnees,
  type Personnage,
} from '@crpg/regles';
import { SelecteurChoix } from '../createur/ecrans/commun';
import { NOMS_CARAC, NOMS_COMPETENCES } from '../createur/libelles';
import { ListeNav, ListeSorts, Option, Portrait, Section } from '../createur/ui';

type Amelioration = Partial<Record<Caracteristique, number>>;

interface Props {
  donnees: Donnees;
  groupe: Personnage[];
  /** Envoie une commande au moteur ; renvoie le refus éventuel. */
  envoyer: (ordre: { type: string; [cle: string]: unknown }) => string | undefined;
  onFermer: () => void;
}

/** Une amélioration de caractéristique : +2 à une, ou +1 à deux. `sans` : les valeurs sans cette amélioration. */
function LigneAmelioration({ numero, sans, valeur, onChange }: { numero: number; sans: Record<Caracteristique, number>; valeur: Amelioration; onChange: (a: Amelioration) => void }) {
  const entrees = Object.entries(valeur).filter(([, v]) => v) as [Caracteristique, number][];
  const premiere = entrees[0]?.[0] ?? '';
  const seconde = entrees.length === 2 ? entrees[1]![0] : '';
  const poser = (p: Caracteristique | '', s: Caracteristique | '') => {
    if (!p) return onChange({});
    onChange(!s || s === p ? { [p]: 2 } : { [p]: 1, [s]: 1 });
  };
  const gain = seconde ? 1 : 2;
  return (
    <div className="montee-amelioration">
      <strong>Amélioration {numero}</strong>
      <label>
        <span className="etiquette">Une caractéristique</span>
        <select className="champ" value={premiere} onChange={(e) => poser(e.target.value as Caracteristique | '', seconde)}>
          <option value="">—</option>
          {CARACTERISTIQUES.map((k) => (
            <option key={k} value={k} disabled={sans[k] + gain > 20 && k !== premiere}>
              {NOMS_CARAC[k]} ({sans[k]} → {Math.min(20, sans[k] + gain)})
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="etiquette">Et une seconde (+1 chacune), ou aucune (+2)</span>
        <select className="champ" value={seconde} onChange={(e) => poser(premiere, e.target.value as Caracteristique | '')} disabled={!premiere}>
          <option value="">Aucune : +2 à la première</option>
          {CARACTERISTIQUES.filter((k) => k !== premiere).map((k) => (
            <option key={k} value={k} disabled={sans[k] + 1 > 20}>
              {NOMS_CARAC[k]} ({sans[k]} → {sans[k] + 1})
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function PanneauHeros({ h, donnees, envoyer }: { h: Personnage; donnees: Donnees; envoyer: Props['envoyer'] }) {
  const base = h.choix!;
  const nouveaux = useMemo(() => choixDeMontee(base, donnees)!, [base, donnees]);
  const [choix, setChoix] = useState<ChoixPersonnage>(base);
  const [refus, setRefus] = useState<string>();
  const verif = useMemo(() => reviserChoixDeMontee(base, choix, donnees), [base, choix, donnees]);
  const nom = (id: string) => donnees.sorts.get(id)?.nom ?? id;

  // --- Améliorations ---
  const figesAmelio = nouveaux.ameliorations.figes;
  const nbAmelio = nouveaux.ameliorations.total - figesAmelio;
  const sansAmelio = (i: number): Record<Caracteristique, number> =>
    Object.fromEntries(CARACTERISTIQUES.map((k) => [k, h.fiche.caracteristiques[k].valeur - (base.ameliorations?.[figesAmelio + i]?.[k] ?? 0)])) as Record<Caracteristique, number>;
  const majAmelio = (i: number, a: Amelioration) =>
    setChoix((c) => {
      const liste = [...(c.ameliorations ?? [])];
      liste[figesAmelio + i] = a;
      return { ...c, ameliorations: liste };
    });

  // --- Sorts ---
  const accordes = useMemo(
    () => effetsAcquis({ classe: base.classe, espece: base.espece, historique: base.historique, niveau: base.niveau, dons: base.dons, choix: base.choix }, donnees).flatMap((e) => (e.type === 'sorts_accordes' ? e.sorts : [])),
    [base, donnees],
  );
  const mineursFiges = (base.sortsMineurs ?? []).slice(0, nouveaux.sortsMineurs.figes);
  const preparesFiges = (base.sortsPrepares ?? []).slice(0, nouveaux.sortsPrepares.figes);
  const exclus = new Set([...accordes, ...(base.sortsInitie?.mineurs ?? []), ...(base.sortsInitie?.niveau1 ?? []), ...mineursFiges, ...preparesFiges]);
  const eligibles = sortsEligibles(base.classe, nouveaux.niveauSortMax, donnees).filter((s) => !exclus.has(s.id));
  const nbMineurs = nouveaux.sortsMineurs.total - nouveaux.sortsMineurs.figes;
  const nbPrepares = nouveaux.sortsPrepares.total - nouveaux.sortsPrepares.figes;

  // --- Expertises ---
  const expertisesFiges = (base.expertises ?? []).slice(0, nouveaux.expertises.figes);
  const nbExpertises = nouveaux.expertises.total - nouveaux.expertises.figes;
  const expertisesNouvelles = (choix.expertises ?? []).slice(nouveaux.expertises.figes);
  const candidates = (Object.keys(h.fiche.competences) as Competence[]).filter((k) => h.fiche.competences[k].maitrise !== 'aucune' && h.fiche.competences[k].maitrise !== 'demi' && !expertisesFiges.includes(k));

  const valider = () => setRefus(envoyer({ type: 'reviserMontee', personnage: h.id, choix }));
  const garder = () => setRefus(envoyer({ type: 'garderMontee', personnage: h.id }));

  return (
    <div className="montee-heros">
      <p className="aide">
        Niveau {base.niveau} atteint pour {h.nom} : les choix conseillés sont déjà en place. Changez ce que vous voulez, puis validez.
      </p>

      {nbAmelio > 0 && (
        <Section titre="Amélioration de caractéristique" aide="+2 à une caractéristique, ou +1 à deux (20 au plus).">
          {Array.from({ length: nbAmelio }, (_, i) => (
            <LigneAmelioration key={i} numero={i + 1} sans={sansAmelio(i)} valeur={choix.ameliorations?.[figesAmelio + i] ?? {}} onChange={(a) => majAmelio(i, a)} />
          ))}
        </Section>
      )}

      {nbMineurs > 0 && (
        <Section titre="Sorts mineurs" aide={mineursFiges.length ? `Déjà connus : ${mineursFiges.map(nom).join(', ')}.` : undefined} etat={(choix.sortsMineurs ?? []).length - mineursFiges.length === nbMineurs ? 'ok' : 'manque'}>
          <ListeSorts
            sorts={eligibles.filter((s) => s.niveau === 0)}
            choisis={(choix.sortsMineurs ?? []).slice(mineursFiges.length)}
            max={nbMineurs}
            etiquette="les sorts mineurs"
            onChange={(ids) => setChoix((c) => ({ ...c, sortsMineurs: [...mineursFiges, ...ids] }))}
          />
        </Section>
      )}

      {nbPrepares > 0 && (
        <Section titre="Sorts préparés" aide={preparesFiges.length ? `Déjà préparés : ${preparesFiges.map(nom).join(', ')}.` : undefined} etat={(choix.sortsPrepares ?? []).length - preparesFiges.length === nbPrepares ? 'ok' : 'manque'}>
          <ListeSorts
            sorts={eligibles.filter((s) => s.niveau > 0)}
            choisis={(choix.sortsPrepares ?? []).slice(preparesFiges.length)}
            max={nbPrepares}
            filtreNiveau
            etiquette="les sorts préparés"
            onChange={(ids) => setChoix((c) => ({ ...c, sortsPrepares: [...preparesFiges, ...ids] }))}
          />
        </Section>
      )}

      {nouveaux.options.map((o) => {
        const figes = (base.choix?.[o.choix.id] ?? []).slice(0, o.figes);
        return (
          <Section key={o.choix.id} titre={o.choix.nom} aide={`Choisissez ${o.total - o.figes} option(s) de plus.`}>
            <SelecteurChoix
              def={o.choix}
              nombre={o.total}
              valeur={choix.choix?.[o.choix.id] ?? []}
              niveau={base.niveau}
              figes={figes}
              onChange={(v) => setChoix((c) => ({ ...c, choix: { ...c.choix, [o.choix.id]: [...figes, ...v.filter((x) => !figes.includes(x))] } }))}
            />
          </Section>
        );
      })}

      {nbExpertises > 0 && (
        <Section titre="Expertise" aide={`Choisissez ${nbExpertises} compétence(s) maîtrisée(s) : le bonus de maîtrise est doublé.`} etat={expertisesNouvelles.length === nbExpertises ? 'ok' : 'manque'}>
          <ListeNav className="liste-options" aria-label="Expertises">
            {candidates.map((k) => {
              const choisi = expertisesNouvelles.includes(k);
              return (
                <Option
                  key={k}
                  compact
                  selectionne={choisi}
                  desactive={!choisi && expertisesNouvelles.length >= nbExpertises}
                  raison={`Vous avez déjà choisi ${nbExpertises} expertise(s) : retirez-en une d'abord.`}
                  titre={NOMS_COMPETENCES[k]}
                  onChoisir={() => setChoix((c) => ({ ...c, expertises: [...expertisesFiges, ...(choisi ? expertisesNouvelles.filter((x) => x !== k) : [...expertisesNouvelles, k])] }))}
                />
              );
            })}
          </ListeNav>
        </Section>
      )}

      {!verif.ok && <p className="montee-erreur" role="alert">{verif.erreur}</p>}
      {refus && <p className="montee-erreur" role="alert">{refus}</p>}
      <div className="montee-actions">
        <button type="button" className="bouton-principal" onClick={valider} disabled={!verif.ok}>
          Valider mes choix
        </button>
        <button type="button" className="bouton" onClick={garder}>
          Garder les choix conseillés
        </button>
      </div>
    </div>
  );
}

export function EcranMontee({ donnees, groupe, envoyer, onFermer }: Props) {
  const attente = groupe.filter((h) => h.monteeEnAttente && h.choix);
  const [choisi, setChoisi] = useState<string>();
  const courant = attente.find((h) => h.id === choisi) ?? attente[0];

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
    <div className="ecran-montee" role="dialog" aria-modal="true" aria-label="Montée de niveau">
      <div className="montee-fenetre">
        <header className="montee-entete">
          <h2>Montée de niveau</h2>
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
        <PanneauHeros key={`${courant.id}:${courant.monteeEnAttente}`} h={courant} donnees={donnees} envoyer={envoyer} />
      </div>
    </div>
  );
}
