import { useState } from 'react';
import { NIVEAU_MAX, type Classe } from '@crpg/regles';
import { changerClasse, changerNiveau } from '../brouillon';
import { CLASSES_INFO } from '../descriptions';
import { NOMS_CARAC, NOMS_CATEGORIES_ARMURE, NOMS_COMPETENCES, liste } from '../libelles';
import { IconeClasse, ListeNav, Option } from '../ui';
import { Panneau, Puces, type PropsEcran } from './commun';

function principale(c: Classe): string {
  const noms = c.caracteristiquesPrincipales.liste.map((k) => NOMS_CARAC[k]);
  return noms.join(c.caracteristiquesPrincipales.mode === 'et' ? ' et ' : ' ou ');
}

function Details({ c, niveau }: { c: Classe; niveau: number }) {
  const info = CLASSES_INFO[c.id];
  const inc = c.incantation;
  const aptitudes = c.aptitudes.filter((a) => a.niveau <= niveau);
  return (
    <Panneau titre={c.nom} sous={info?.role}>
      <Puces
        elements={[
          { nom: 'Caractéristique principale', valeur: principale(c) },
          { nom: 'Dé de vie', valeur: `d${c.deVie}` },
          { nom: 'Complexité', valeur: <span className={`tag-complexite cx-${(info?.complexite ?? 'Moyenne').toLowerCase()}`}>{info?.complexite ?? '—'}</span> },
          { nom: 'Prédilection', valeur: info?.predilection ?? '—' },
          { nom: 'Sauvegardes maîtrisées', valeur: c.sauvegardes.map((k) => NOMS_CARAC[k]).join(', ') },
          { nom: 'Armures', valeur: c.formationArmures.length ? c.formationArmures.map((k) => NOMS_CATEGORIES_ARMURE[k] ?? k).join(', ') : 'aucune' },
          { nom: 'Armes', valeur: liste(c.maitrisesArmes) },
          {
            nom: 'Compétences',
            valeur:
              c.competences.parmi === 'toutes'
                ? `${c.competences.nombre} au choix`
                : `${c.competences.nombre} parmi ${c.competences.parmi.map((k) => NOMS_COMPETENCES[k]).join(', ')}`,
          },
          {
            nom: 'Magie',
            valeur: inc ? `${inc.type === 'complet' ? 'Lanceur complet' : inc.type === 'demi' ? 'Demi-lanceur' : 'Pacte'} (${NOMS_CARAC[inc.caracteristique]})` : 'aucune',
          },
        ]}
      />
      <h3 className="titre-liste">
        Aptitudes jusqu'au niveau {niveau}
        {niveau >= 3 && <span className="niveau-trait"> · {c.sousClasse.nom}</span>}
      </h3>
      <ul className="liste-traits">
        {aptitudes.map((a) => (
          <li key={a.id}>
            <strong>{a.nom}</strong>
            <span className="niveau-trait"> (niveau {a.niveau})</span>
            <p>{a.resume}</p>
          </li>
        ))}
        {niveau >= 3 &&
          c.sousClasse.aptitudes
            .filter((a) => a.niveau <= niveau)
            .map((a) => (
              <li key={a.id}>
                <strong>{a.nom}</strong>
                <span className="niveau-trait"> ({c.sousClasse.nom}, niveau {a.niveau})</span>
                <p>{a.resume}</p>
              </li>
            ))}
      </ul>
    </Panneau>
  );
}

export function EcranClasse({ b, donnees, maj, rapide }: PropsEcran & { rapide: () => void }) {
  const classes = [...donnees.classes.values()].sort((a, z) => a.nom.localeCompare(z.nom, 'fr'));
  const [survol, setSurvol] = useState<string | null>(null);
  const courante = b.choix.classe ? donnees.classes.get(b.choix.classe) : undefined;
  const affichee = (survol ? donnees.classes.get(survol) : undefined) ?? courante;
  const peutRapide = !!b.choix.espece && !!b.choix.classe;
  return (
    <div className="ecran ecran-2col">
      <div className="colonne-liste">
        <ListeNav className="liste-options" aria-label="Classes">
          {classes.map((c) => (
            <Option
              key={c.id}
              selectionne={c.id === b.choix.classe}
              gauche={<IconeClasse classe={c.id} taille={30} />}
              titre={c.nom}
              sous={`d${c.deVie} · ${principale(c)}`}
              droite={<span className={`tag-complexite cx-${(CLASSES_INFO[c.id]?.complexite ?? 'Moyenne').toLowerCase()}`}>{CLASSES_INFO[c.id]?.complexite}</span>}
              onSurvol={(a) => setSurvol(a ? c.id : null)}
              onChoisir={() => maj((x) => changerClasse(x, c.id, donnees))}
            />
          ))}
        </ListeNav>
      </div>
      <div className="colonne-detail">
        <div className="panneau-description panneau-choix panneau-niveau">
          <div className="ligne-niveau">
            <div>
              <h2>Niveau de départ</h2>
              <p className="aide">Modifier le niveau relance les recommandations des caractéristiques et des choix de classe.</p>
            </div>
            <div className="segments segments-niveaux" role="group" aria-label="Niveau de départ">
              {Array.from({ length: NIVEAU_MAX }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" className={b.choix.niveau === n ? 'actif' : ''} aria-pressed={b.choix.niveau === n} onClick={() => maj((x) => changerNiveau(x, n, donnees))}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          {peutRapide && (
            <div className="ligne-rapide">
              <button type="button" className="bouton-principal bouton-moyen" onClick={rapide}>
                Création rapide
              </button>
              <p className="aide">Applique tous les choix recommandés, tire un prénom au hasard et passe directement au récapitulatif.</p>
            </div>
          )}
          {!peutRapide && <p className="aide">La création rapide est proposée dès qu'une espèce et une classe sont choisies.</p>}
        </div>
        {affichee ? <Details c={affichee} niveau={b.choix.niveau} /> : <Panneau titre="Choisissez une classe">Sélectionnez une classe à gauche pour voir son rôle et ses aptitudes.</Panneau>}
      </div>
    </div>
  );
}
