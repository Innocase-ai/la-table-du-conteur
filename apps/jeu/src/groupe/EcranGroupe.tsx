// Écran du groupe : quatre ou six emplacements de personnages, création, import et export.
import { useMemo, useRef, useState } from 'react';
import {
  NIVEAU_MAX,
  avertissementsGroupe,
  bilanPersonnage,
  groupeConseille,
  herosRetires,
  nouvelId,
  personnageComplet,
  redimensionner,
  serialiser,
  TAILLES_GROUPE,
  type BilanPersonnage,
  type Donnees,
  type Groupe,
  type PersonnageCree,
  type TailleGroupe,
} from '@crpg/regles';
import { formatMetres } from '../libelles';
import { Modale, Portrait } from '../createur/ui';
import { ALIGNEMENTS_INFO } from '../createur/descriptions';
import { lireGroupeFrancais } from './erreurs';

interface Props {
  groupe: Groupe;
  donnees: Donnees;
  onChange: (g: Groupe) => void;
  onCreer: (index: number) => void;
  onModifier: (index: number) => void;
  onRetour: () => void;
}

type Action = { type: 'supprimer'; index: number } | { type: 'conseille' } | { type: 'importer'; groupe: Groupe } | { type: 'taille'; taille: TailleGroupe };

function resume(p: PersonnageCree, donnees: Donnees): string {
  const espece = donnees.especes.get(p.choix.espece)?.nom ?? p.choix.espece;
  const classe = donnees.classes.get(p.choix.classe)?.nom ?? p.choix.classe;
  return `${espece} · ${classe} · niv. ${p.choix.niveau}`;
}

function Emplacement({
  index,
  p,
  bilan,
  donnees,
  props,
  actions,
}: {
  index: number;
  p: PersonnageCree | null;
  bilan: BilanPersonnage | null;
  donnees: Donnees;
  props: Props;
  actions: { dupliquer: () => void; supprimer: () => void; deplacer: (d: -1 | 1) => void; videDispo: boolean };
}) {
  if (!p || !bilan) {
    return (
      <div className="emplacement emplacement-vide">
        <span className="emplacement-numero">Emplacement {index + 1}</span>
        <button type="button" className="bouton-creer" onClick={() => props.onCreer(index)}>
          <span className="plus">+</span>
          Créer un personnage
        </button>
      </div>
    );
  }
  const complet = personnageComplet(bilan);
  const f = bilan.fiche;
  return (
    <div className={`emplacement ${complet ? '' : 'emplacement-incomplet'}`}>
      <span className="emplacement-numero">Emplacement {index + 1}</span>
      <div className="emplacement-corps">
        <Portrait id={p.portrait} espece={p.choix.espece} classe={p.choix.classe} taille={88} />
        <div className="emplacement-infos">
          <h3>{p.choix.nom || 'Sans nom'}</h3>
          <p>{resume(p, donnees)}</p>
          <p className="emplacement-stats">
            <span title="Points de vie">PV {f?.pvMax ?? '—'}</span>
            <span title="Classe d'armure">CA {f?.ca ?? '—'}</span>
            {f && <span title="Vitesse">{formatMetres(f.vitesse)}</span>}
          </p>
          <p className="emplacement-alignement">{ALIGNEMENTS_INFO[p.alignement].nom}</p>
          {p.caractere && <p className="emplacement-caractere">« {p.caractere} »</p>}
          <span className={`badge-etat ${complet ? 'badge-complet' : 'badge-incomplet'}`} title={complet ? undefined : bilan.manquants.map((m) => m.message).join('\n') || bilan.erreurs.join('\n')}>
            {complet ? 'Complet' : 'Incomplet'}
          </span>
        </div>
      </div>
      <div className="emplacement-actions">
        <button type="button" className="bouton" onClick={() => props.onModifier(index)}>
          Modifier
        </button>
        <button type="button" className="bouton-discret" onClick={actions.dupliquer} disabled={!actions.videDispo} title={actions.videDispo ? undefined : 'Aucun emplacement libre.'}>
          Dupliquer
        </button>
        <button type="button" className="bouton-discret bouton-danger-texte" onClick={actions.supprimer}>
          Supprimer
        </button>
        <span className="deplacer">
          <button type="button" className="bouton-rond" aria-label={`Monter ${p.choix.nom}`} disabled={index === 0} onClick={() => actions.deplacer(-1)}>
            ↑
          </button>
          <button type="button" className="bouton-rond" aria-label={`Descendre ${p.choix.nom}`} disabled={index === props.groupe.emplacements.length - 1} onClick={() => actions.deplacer(1)}>
            ↓
          </button>
        </span>
      </div>
    </div>
  );
}

export function EcranGroupe(props: Props) {
  const { groupe, donnees, onChange, onRetour } = props;
  const [action, setAction] = useState<Action | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const fichier = useRef<HTMLInputElement>(null);

  const bilans = useMemo(() => groupe.emplacements.map((p) => (p ? bilanPersonnage(p, donnees) : null)), [groupe, donnees]);
  const fiches = bilans.flatMap((b) => (b && personnageComplet(b) && b.fiche ? [b.fiche] : []));
  const taille = groupe.emplacements.length as TailleGroupe;
  const avertissements = useMemo(() => avertissementsGroupe(fiches, donnees, taille), [fiches, donnees, taille]);
  const nombre = groupe.emplacements.filter(Boolean).length;
  const videDispo = nombre < taille;

  const remplacer = (i: number, p: PersonnageCree | null) => onChange({ ...groupe, emplacements: groupe.emplacements.map((x, j) => (j === i ? p : x)) });

  const deplacer = (i: number, d: -1 | 1) => {
    const e = [...groupe.emplacements];
    [e[i], e[i + d]] = [e[i + d]!, e[i]!];
    onChange({ ...groupe, emplacements: e });
  };

  const dupliquer = (i: number) => {
    const p = groupe.emplacements[i];
    const libre = groupe.emplacements.findIndex((x) => x === null);
    if (!p || libre < 0) return;
    const copie: PersonnageCree = { ...structuredClone(p), id: nouvelId() };
    copie.choix.nom = `${p.choix.nom} (copie)`.slice(0, 40);
    remplacer(libre, copie);
  };

  const exporter = () => {
    const blob = new Blob([serialiser(groupe)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'groupe-crpg.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setInfo('Groupe exporté dans « groupe-crpg.json ».');
    setErreur(null);
  };

  const importer = async (f: File | undefined) => {
    if (!f) return;
    const texte = await f.text();
    const r = lireGroupeFrancais(texte);
    if (!r.ok) {
      setErreur(r.erreur);
      setInfo(null);
    } else if (nombre === 0) appliquer({ type: 'importer', groupe: r.groupe });
    else setAction({ type: 'importer', groupe: r.groupe });
    if (fichier.current) fichier.current.value = '';
  };

  const appliquer = (a: Action) => {
    setAction(null);
    setErreur(null);
    if (a.type === 'supprimer') remplacer(a.index, null);
    else if (a.type === 'taille') {
      onChange(redimensionner(groupe, a.taille));
      setInfo(`Le groupe a maintenant ${a.taille} emplacements.`);
    } else if (a.type === 'conseille') {
      onChange(groupeConseille(groupe.niveau, donnees, taille));
      setInfo('Groupe conseillé créé.');
    } else {
      onChange(a.groupe);
      setInfo('Groupe importé.');
    }
  };

  /** Changer le nombre d'emplacements ; en retirer avec des héros dedans demande confirmation. */
  const demanderTaille = (n: TailleGroupe) => {
    if (n === taille) return;
    if (herosRetires(groupe, n).length) setAction({ type: 'taille', taille: n });
    else appliquer({ type: 'taille', taille: n });
  };

  const demanderConseille = () => (nombre === 0 ? appliquer({ type: 'conseille' }) : setAction({ type: 'conseille' }));

  return (
    <div className="ecran-groupe">
      <header className="groupe-entete">
        <button type="button" className="bouton-discret" onClick={onRetour}>
          ‹ Retour
        </button>
        <div>
          <h1>Mon groupe</h1>
          <p className="sous-titre">{nombre} personnage(s) sur {taille} emplacements (on peut en laisser de vides) · {fiches.length} complet(s)</p>
        </div>
        <div className="groupe-outils">
          <div className="niveau-groupe">
            <span className="etiquette">Taille du groupe</span>
            <div className="segments segments-petits" role="group" aria-label="Taille du groupe">
              {TAILLES_GROUPE.map((n) => (
                <button key={n} type="button" className={taille === n ? 'actif' : ''} aria-pressed={taille === n} onClick={() => demanderTaille(n)}>
                  {n} héros
                </button>
              ))}
            </div>
          </div>
          <div className="niveau-groupe">
            <span className="etiquette">Niveau du groupe</span>
            <div className="segments segments-petits" role="group" aria-label="Niveau du groupe">
              {Array.from({ length: NIVEAU_MAX }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" className={groupe.niveau === n ? 'actif' : ''} aria-pressed={groupe.niveau === n} onClick={() => onChange({ ...groupe, niveau: n })}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="bouton" onClick={demanderConseille}>
            Groupe conseillé
          </button>
          <button type="button" className="bouton" onClick={exporter} disabled={nombre === 0}>
            Exporter
          </button>
          <button type="button" className="bouton" onClick={() => fichier.current?.click()}>
            Importer
          </button>
          <input ref={fichier} type="file" accept=".json,application/json" hidden onChange={(e) => importer(e.target.files?.[0])} aria-label="Importer un groupe (fichier JSON)" />
        </div>
      </header>

      {erreur && (
        <div className="bandeau bandeau-erreur" role="alert">
          {erreur}
        </div>
      )}
      {info && !erreur && (
        <div className="bandeau bandeau-info" role="status">
          {info}
        </div>
      )}
      {nombre > 0 && avertissements.length > 0 && (
        <div className="bandeau bandeau-avis" aria-label="Conseils de composition">
          <strong>Conseils de composition</strong>
          <ul>
            {avertissements.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grille-groupe">
        {groupe.emplacements.map((p, i) => (
          <Emplacement
            key={p?.id ?? `vide-${i}`}
            index={i}
            p={p}
            bilan={bilans[i] ?? null}
            donnees={donnees}
            props={props}
            actions={{ dupliquer: () => dupliquer(i), supprimer: () => setAction({ type: 'supprimer', index: i }), deplacer: (d) => deplacer(i, d), videDispo }}
          />
        ))}
      </div>

      {action?.type === 'supprimer' && (
        <Modale
          titre="Supprimer ce personnage ?"
          texte={`« ${groupe.emplacements[action.index]?.choix.nom || 'Sans nom'} » sera retiré du groupe. Cette action est définitive.`}
          confirmer="Supprimer"
          dangereux
          onConfirmer={() => appliquer(action)}
          onAnnuler={() => setAction(null)}
        />
      )}
      {action?.type === 'conseille' && (
        <Modale
          titre="Remplacer le groupe ?"
          texte={`Le groupe conseillé remplit les ${taille} emplacements : les personnages actuels seront remplacés.`}
          confirmer="Remplacer"
          dangereux
          onConfirmer={() => appliquer(action)}
          onAnnuler={() => setAction(null)}
        />
      )}
      {action?.type === 'taille' && (
        <Modale
          titre={`Passer à ${action.taille} héros ?`}
          texte={`${herosRetires(groupe, action.taille).map((p) => `« ${p.choix.nom || 'Sans nom'} »`).join(', ')} ${herosRetires(groupe, action.taille).length > 1 ? 'seront retirés' : 'sera retiré'} du groupe (emplacements en trop). Vous pouvez exporter le groupe avant pour le garder.`}
          confirmer="Retirer"
          dangereux
          onConfirmer={() => appliquer(action)}
          onAnnuler={() => setAction(null)}
        />
      )}
      {action?.type === 'importer' && (
        <Modale
          titre="Remplacer le groupe par le fichier ?"
          texte="Le groupe importé remplace les personnages actuels."
          confirmer="Importer"
          dangereux
          onConfirmer={() => appliquer(action)}
          onAnnuler={() => setAction(null)}
        />
      )}
    </div>
  );
}
