import { useState } from 'react';
import { choixRequis, type Espece } from '@crpg/regles';
import { changerEspece } from '../brouillon';
import { ESPECES_INFO } from '../descriptions';
import { formatMetres } from '../../libelles';
import { nomTaille } from '../libelles';
import { ListeNav, Option, Section } from '../ui';
import { Panneau, Puces, SelecteurChoix, type PropsEcran } from './commun';

function visionNoir(e: Espece): number {
  return Math.max(0, ...e.traits.flatMap((t) => t.effets).map((x) => (x.type === 'vision_dans_le_noir' ? x.metres : 0)));
}

function sousTitre(e: Espece): string {
  return `${e.tailles.map(nomTaille).join(' ou ')} · Vitesse ${formatMetres(e.vitesse)}`;
}

function Details({ e }: { e: Espece }) {
  const vision = visionNoir(e);
  return (
    <Panneau titre={e.nom} sous={ESPECES_INFO[e.id]}>
      <Puces
        elements={[
          { nom: 'Type', valeur: e.type },
          { nom: 'Taille', valeur: e.tailles.map(nomTaille).join(' ou ') },
          { nom: 'Vitesse', valeur: formatMetres(e.vitesse) },
          { nom: 'Vision dans le noir', valeur: vision ? formatMetres(vision) : 'aucune' },
        ]}
      />
      <h3 className="titre-liste">Traits</h3>
      <ul className="liste-traits">
        {e.traits.map((t) => (
          <li key={t.id}>
            <strong>{t.nom}</strong>
            {t.niveau > 1 && <span className="niveau-trait"> (niveau {t.niveau})</span>}
            <p>{t.resume}</p>
          </li>
        ))}
      </ul>
    </Panneau>
  );
}

export function EcranEspece({ b, donnees, maj }: PropsEcran) {
  const especes = [...donnees.especes.values()].sort((a, z) => a.nom.localeCompare(z.nom, 'fr'));
  const [survol, setSurvol] = useState<string | null>(null);
  const courante = b.choix.espece ? donnees.especes.get(b.choix.espece) : undefined;
  const affichee = (survol ? donnees.especes.get(survol) : undefined) ?? courante;
  const choixEspece = courante ? choixRequis('', courante.id, b.choix.niveau, donnees).filter((x) => x.choix.source.type === 'espece') : [];
  const donsOrigine = [...donnees.dons.values()].filter((d) => d.categorie === 'origines' && d.id !== 'initie-a-la-magie');
  const polyvalent = !!courante?.traits.some((t) => t.id === 'polyvalent');
  const donChoisi = (b.choix.dons ?? []).find((id) => donnees.dons.get(id)?.categorie === 'origines');
  const [descSurvol, setDescSurvol] = useState<{ titre: string; texte: string } | null>(null);

  return (
    <div className="ecran ecran-2col">
      <div className="colonne-liste">
        <ListeNav className="liste-options" aria-label="Espèces">
          {especes.map((e) => (
            <Option
              key={e.id}
              selectionne={e.id === b.choix.espece}
              titre={e.nom}
              sous={sousTitre(e)}
              onSurvol={(a) => setSurvol(a ? e.id : null)}
              onChoisir={() => maj((x) => changerEspece(x, e.id, donnees))}
            />
          ))}
        </ListeNav>
      </div>
      <div className="colonne-detail">
        {affichee ? <Details e={affichee} /> : <Panneau titre="Choisissez une espèce">Sélectionnez une espèce à gauche pour lire ses traits.</Panneau>}
        {courante && (courante.tailles.length > 1 || choixEspece.length > 0 || polyvalent) && (
          <div className="panneau-description panneau-choix">
            <h2>Vos choix : {courante.nom}</h2>
            {courante.tailles.length > 1 && (
              <Section titre="Taille" etat={b.choix.taille ? 'ok' : 'manque'}>
                <ListeNav className="liste-options liste-horizontale" aria-label="Taille">
                  {courante.tailles.map((t) => (
                    <Option
                      key={t}
                      selectionne={b.choix.taille === t}
                      compact
                      titre={nomTaille(t)}
                      sous={t === 'P' ? 'Plus discret, passe partout' : 'Taille standard'}
                      onChoisir={() => maj((x) => ({ ...x, choix: { ...x.choix, taille: t } }))}
                    />
                  ))}
                </ListeNav>
              </Section>
            )}
            {choixEspece.map(({ choix, nombre }) => (
              <Section key={choix.id} titre={choix.nom} etat={(b.choix.choix?.[choix.id]?.length ?? 0) >= nombre ? 'ok' : 'manque'}>
                <SelecteurChoix
                  def={choix}
                  nombre={nombre}
                  niveau={b.choix.niveau}
                  valeur={b.choix.choix?.[choix.id] ?? []}
                  onChange={(v) => maj((x) => ({ ...x, choix: { ...x.choix, choix: { ...(x.choix.choix ?? {}), [choix.id]: v } } }))}
                />
              </Section>
            ))}
            {polyvalent && (
              <Section titre="Don d'origine" aide="Polyvalent : choisissez un don d'origine." etat={donChoisi ? 'ok' : 'manque'}>
                <ListeNav className="liste-options" aria-label="Don d'origine">
                  {donsOrigine.map((d) => (
                    <Option
                      key={d.id}
                      selectionne={donChoisi === d.id}
                      compact
                      titre={d.nom}
                      sous={d.resume}
                      onSurvol={(a) => setDescSurvol(a ? { titre: d.nom, texte: d.resume } : null)}
                      onChoisir={() =>
                        maj((x) => ({
                          ...x,
                          choix: { ...x.choix, dons: [...(x.choix.dons ?? []).filter((id) => donnees.dons.get(id)?.categorie !== 'origines'), d.id] },
                        }))
                      }
                    />
                  ))}
                </ListeNav>
              </Section>
            )}
            {descSurvol && <p className="aide">{descSurvol.texte}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
