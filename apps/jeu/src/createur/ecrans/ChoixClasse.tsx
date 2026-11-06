import { useMemo, useState } from 'react';
import { COMPETENCES, effetsAcquis, exigences, sortsEligibles, type Competence, type Sort } from '@crpg/regles';
import { ficheApercu, tousLesManquants, type Brouillon } from '../brouillon';
import { NOMS_CARAC, NOMS_COMPETENCES, liste } from '../libelles';
import { BadgeJouable, ListeNav, ListeSorts, Option, Section } from '../ui';
import { Panneau, Puces, SelecteurChoix, detailSort, type PropsEcran } from './commun';

interface Detail {
  titre: string;
  texte: string;
  sort?: Sort;
}

/** Répartit des compétences choisies sur des emplacements (restreints ou libres) sans les perdre. */
function repartir(restrictions: (Competence[] | undefined)[], valeurs: Competence[]): (Competence | undefined)[] {
  const restantes = [...valeurs];
  const res: (Competence | undefined)[] = restrictions.map(() => undefined);
  restrictions.forEach((r, i) => {
    if (!r) return;
    const k = restantes.findIndex((v) => r.includes(v));
    if (k >= 0) res[i] = restantes.splice(k, 1)[0];
  });
  restrictions.forEach((r, i) => {
    if (!r) res[i] = restantes.shift();
  });
  return res;
}

function SelecteurCompetence({
  valeur,
  options,
  etiquette,
  onChange,
}: {
  valeur: Competence | undefined;
  options: Competence[];
  etiquette: string;
  onChange: (k: Competence | undefined) => void;
}) {
  return (
    <label className="champ-select">
      <span>{etiquette}</span>
      <select value={valeur ?? ''} onChange={(e) => onChange((e.target.value || undefined) as Competence | undefined)}>
        <option value="">— à choisir —</option>
        {options.map((k) => (
          <option key={k} value={k}>
            {NOMS_COMPETENCES[k]} ({NOMS_CARAC[COMPETENCES[k]].slice(0, 3)})
          </option>
        ))}
      </select>
    </label>
  );
}

export function EcranChoixClasse({ b, donnees, maj, aller }: PropsEcran & { aller: (e: 'espece' | 'classe' | 'historique') => void }) {
  const c = b.choix;
  const ex = useMemo(() => exigences(c, donnees), [c, donnees]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const survol = (d: Detail) => (actif: boolean) => setDetail(actif ? d : null);
  const manques = useMemo(() => tousLesManquants(b, donnees, true).filter((m) => m.etape === 'competences'), [b, donnees]);

  if (!ex || !c.classe || !c.espece || !c.historique) {
    return (
      <div className="ecran ecran-vide">
        <Panneau titre="Il manque des informations">
          <p>Choisissez d'abord une espèce, une classe et un historique pour accéder aux choix de classe.</p>
          <div className="fin-boutons">
            {!c.espece && (
              <button type="button" className="bouton" onClick={() => aller('espece')}>
                Choisir l'espèce
              </button>
            )}
            {!c.classe && (
              <button type="button" className="bouton" onClick={() => aller('classe')}>
                Choisir la classe
              </button>
            )}
            {!c.historique && (
              <button type="button" className="bouton" onClick={() => aller('historique')}>
                Choisir l'historique
              </button>
            )}
          </div>
        </Panneau>
      </div>
    );
  }

  const classe = donnees.classes.get(c.classe)!;
  const historique = donnees.historiques.get(c.historique)!;
  const poser = (f: (x: Brouillon['choix']) => Brouillon['choix']) => maj((x) => ({ ...x, choix: f(x.choix) }));

  // --- Compétences ---
  const deClasse = c.competencesClasse ?? [];
  const supp = c.competencesSupplementaires ?? [];
  const expertises = c.expertises ?? [];
  const maitrisees = new Set<Competence>([...historique.competences, ...deClasse, ...supp]);
  const nettoyer = (x: Brouillon['choix']): Brouillon['choix'] => {
    const m = new Set<Competence>([...historique.competences, ...(x.competencesClasse ?? []), ...(x.competencesSupplementaires ?? [])]);
    return { ...x, expertises: (x.expertises ?? []).filter((e) => m.has(e)) };
  };

  const basculerClasse = (k: Competence) =>
    poser((x) => {
      const actuelles = x.competencesClasse ?? [];
      const present = actuelles.includes(k);
      return nettoyer({
        ...x,
        competencesClasse: present ? actuelles.filter((v) => v !== k) : [...actuelles, k],
        competencesSupplementaires: present ? x.competencesSupplementaires : (x.competencesSupplementaires ?? []).filter((v) => v !== k),
      });
    });

  const emplacementsSupp = ex.competencesSupplementaires.restrictions;
  const supplementaires = repartir(emplacementsSupp, supp);
  const majSupp = (i: number, k: Competence | undefined) => {
    const emplacements = supplementaires.map((v, j) => (j === i ? k : v));
    poser((x) => nettoyer({ ...x, competencesSupplementaires: emplacements.filter((v): v is Competence => !!v) }));
  };

  const nbRestreintes = Math.max(0, ex.expertises.nombre - ex.expertises.libres);
  const restrExp: (Competence[] | undefined)[] = [
    ...Array.from({ length: nbRestreintes }, (_, i) => ex.expertises.restreintes[ex.expertises.restreintes.length === nbRestreintes ? i : 0] ?? [...new Set(ex.expertises.restreintes.flat())]),
    ...Array.from({ length: ex.expertises.libres }, () => undefined),
  ];
  const emplacementsExp = repartir(restrExp, expertises);
  const majExp = (i: number, k: Competence | undefined) => {
    const emplacements = emplacementsExp.map((v, j) => (j === i ? k : v));
    poser((x) => ({ ...x, expertises: emplacements.filter((v): v is Competence => !!v) }));
  };

  // --- Style de combat ---
  const donsStyle = [...donnees.dons.values()].filter((d) => d.categorie === 'style-de-combat');
  const styleChoisi = (c.dons ?? []).find((id) => donnees.dons.get(id)?.categorie === 'style-de-combat');

  // --- Bottes d'arme ---
  const bottes = c.bottes ?? [];

  // --- Sorts ---
  const accordes = effetsAcquis({ classe: c.classe, espece: c.espece, historique: c.historique, niveau: c.niveau, dons: c.dons, choix: c.choix }, donnees).flatMap((e) => (e.type === 'sorts_accordes' ? e.sorts : []));
  const exclus = new Set([...(c.sortsInitie?.mineurs ?? []), ...(c.sortsInitie?.niveau1 ?? []), ...accordes]);
  const eligibles = ex.sorts ? sortsEligibles(c.classe, ex.sorts.niveauMax, donnees).filter((s) => !exclus.has(s.id)) : [];
  const mineurs = c.sortsMineurs ?? [];
  const prepares = c.sortsPrepares ?? [];
  const survolSort = (s: Sort | null) => setDetail(s ? { titre: s.nom, texte: s.resume, sort: s } : null);

  // --- Équipement ---
  const eqClasse = c.equipementClasse;
  const eqHist = c.equipementHistorique;

  const complet = (n: number, total: number): 'ok' | 'manque' => (n >= total ? 'ok' : 'manque');

  return (
    <div className="ecran ecran-choix">
      <div className="choix-gauche">
        <Section titre="Compétences de classe" aide={`${classe.nom} : choisissez ${ex.competencesClasse.nombre} compétences. Celles que votre historique donne déjà sont grisées.`} etat={complet(deClasse.length, ex.competencesClasse.nombre)}>
          <ListeNav className="grille-competences" aria-label="Compétences de classe">
            {ex.competencesClasse.parmi.map((k) => {
              const choisi = deClasse.includes(k);
              const dejaHist = historique.competences.includes(k);
              const dejaSupp = supp.includes(k);
              const plein = deClasse.length >= ex.competencesClasse.nombre && !choisi;
              return (
                <Option
                  key={k}
                  compact
                  selectionne={choisi || dejaHist}
                  desactive={dejaHist || dejaSupp || plein}
                  raison={dejaHist ? `Déjà maîtrisée grâce à l'historique ${historique.nom}.` : dejaSupp ? 'Déjà choisie parmi les compétences supplémentaires.' : `Vous avez déjà choisi ${ex.competencesClasse.nombre} compétences.`}
                  titre={NOMS_COMPETENCES[k]}
                  sous={NOMS_CARAC[COMPETENCES[k]]}
                  onChoisir={() => basculerClasse(k)}
                />
              );
            })}
          </ListeNav>
        </Section>

        {ex.competencesSupplementaires.nombre > 0 && (
          <Section titre="Compétences supplémentaires" aide="Accordées par votre espèce ou vos dons." etat={complet(supp.length, ex.competencesSupplementaires.nombre)}>
            <div className="selects">
              {emplacementsSupp.map((r, i) => (
                <SelecteurCompetence
                  key={i}
                  etiquette={r ? `Une parmi ${r.map((k) => NOMS_COMPETENCES[k]).join(', ')}` : 'Au choix'}
                  valeur={supplementaires[i]}
                  options={(r ?? (Object.keys(COMPETENCES) as Competence[])).filter((k) => k === supplementaires[i] || !maitrisees.has(k))}
                  onChange={(k) => majSupp(i, k)}
                />
              ))}
            </div>
          </Section>
        )}

        {ex.expertises.nombre > 0 && (
          <Section titre="Expertises" aide="Votre bonus de maîtrise est doublé pour ces compétences (elles doivent être maîtrisées)." etat={complet(expertises.length, ex.expertises.nombre)}>
            <div className="selects">
              {restrExp.map((r, i) => (
                <SelecteurCompetence
                  key={i}
                  etiquette={r ? `Une parmi ${r.map((k) => NOMS_COMPETENCES[k]).join(', ')}` : 'Au choix'}
                  valeur={emplacementsExp[i]}
                  options={[...maitrisees].filter((k) => (!r || r.includes(k)) && (k === emplacementsExp[i] || !expertises.includes(k)))}
                  onChange={(k) => majExp(i, k)}
                />
              ))}
            </div>
          </Section>
        )}

        {ex.donsStyle > 0 && (
          <Section titre="Style de combat" etat={styleChoisi ? 'ok' : 'manque'}>
            <ListeNav className="liste-options" aria-label="Style de combat">
              {donsStyle.map((d) => (
                <Option
                  key={d.id}
                  compact
                  selectionne={styleChoisi === d.id}
                  titre={d.nom}
                  sous={d.resume}
                  onSurvol={survol({ titre: d.nom, texte: d.resume })}
                  onChoisir={() => poser((x) => ({ ...x, dons: [...(x.dons ?? []).filter((id) => donnees.dons.get(id)?.categorie !== 'style-de-combat'), d.id] }))}
                />
              ))}
            </ListeNav>
          </Section>
        )}

        {ex.choixClasse.map(({ choix, nombre }) => (
          <Section
            key={choix.id}
            titre={choix.nom}
            aide={nombre > 1 ? `Choisissez ${nombre} options.` : undefined}
            etat={complet(c.choix?.[choix.id]?.length ?? 0, nombre)}
          >
            <SelecteurChoix
              def={choix}
              nombre={nombre}
              niveau={c.niveau}
              valeur={c.choix?.[choix.id] ?? []}
              onChange={(v) => poser((x) => ({ ...x, choix: { ...(x.choix ?? {}), [choix.id]: v } }))}
              onSurvol={(id) => setDetail(id ? { titre: choix.options.find((o) => o.id === id)!.nom, texte: choix.options.find((o) => o.id === id)!.resume } : null)}
            />
          </Section>
        ))}

        {ex.bottes && (
          <Section titre="Bottes d'arme" aide={`Choisissez ${ex.bottes.nombre} arme(s) dont vous maîtrisez la botte (effet spécial de l'arme).`} etat={complet(bottes.length, ex.bottes.nombre)}>
            <ListeNav className="grille-armes" aria-label="Bottes d'arme">
              {ex.bottes.parmi.map((id) => {
                const a = donnees.armes.get(id);
                if (!a) return null;
                const choisi = bottes.includes(id);
                return (
                  <Option
                    key={id}
                    compact
                    selectionne={choisi}
                    desactive={!choisi && bottes.length >= ex.bottes!.nombre}
                    raison={`Vous avez déjà choisi ${ex.bottes!.nombre} arme(s).`}
                    titre={a.nom}
                    sous={`${a.degats} ${a.typeDegats} · ${a.botte}`}
                    onSurvol={survol({ titre: a.nom, texte: `${a.categorie === 'guerre' ? 'Arme de guerre' : 'Arme courante'}, ${a.portee === 'distance' ? 'à distance' : 'corps à corps'}. Dégâts ${a.degats} ${a.typeDegats}. Botte : ${a.botte}. ${a.proprietes.length ? `Propriétés : ${a.proprietes.join(', ')}.` : ''}` })}
                    onChoisir={() => poser((x) => ({ ...x, bottes: choisi ? bottes.filter((v) => v !== id) : [...bottes, id] }))}
                  />
                );
              })}
            </ListeNav>
          </Section>
        )}

        {ex.sorts && (
          <>
            {ex.sorts.mineurs > 0 && (
              <Section titre="Sorts mineurs" aide={`Choisissez ${ex.sorts.mineurs} sorts mineurs (lançables à volonté).`} etat={complet(mineurs.length, ex.sorts.mineurs)}>
                <ListeSorts
                  etiquette="sorts mineurs"
                  sorts={eligibles.filter((s) => s.niveau === 0)}
                  choisis={mineurs}
                  max={ex.sorts.mineurs}
                  onChange={(v) => poser((x) => ({ ...x, sortsMineurs: v }))}
                  onSurvol={survolSort}
                />
              </Section>
            )}
            {ex.sorts.prepares > 0 && (
              <Section titre="Sorts préparés" aide={`Choisissez ${ex.sorts.prepares} sorts de niveau 1${ex.sorts.niveauMax > 1 ? ` à ${ex.sorts.niveauMax}` : ''}.`} etat={complet(prepares.length, ex.sorts.prepares)}>
                <ListeSorts
                  etiquette="sorts préparés"
                  sorts={eligibles.filter((s) => s.niveau > 0)}
                  choisis={prepares}
                  max={ex.sorts.prepares}
                  filtreNiveau
                  onChange={(v) => poser((x) => ({ ...x, sortsPrepares: v }))}
                  onSurvol={survolSort}
                />
              </Section>
            )}
          </>
        )}

        <Section titre="Équipement de classe" aide="Votre équipement de départ ; la CA se calcule d'après l'armure obtenue." etat={eqClasse ? 'ok' : 'manque'}>
          <ListeNav className="liste-options" aria-label="Équipement de classe">
            {ex.equipementClasse.map((o) => (
              <Option
                key={o.id}
                compact
                selectionne={eqClasse === o.id}
                titre={`Option ${o.id}`}
                sous={`${liste(o.objets)} — plus ${o.po} po`}
                droite={<span className="tag-ca">CA {ficheApercu(c, donnees, { equipementClasse: o.id })?.ca ?? '—'}</span>}
                onChoisir={() => poser((x) => ({ ...x, equipementClasse: o.id }))}
              />
            ))}
          </ListeNav>
        </Section>

        {ex.equipementHistorique.length > 0 && (
          <Section titre="Équipement d'historique" etat={eqHist ? 'ok' : 'manque'}>
            <ListeNav className="liste-options" aria-label="Équipement d'historique">
              {ex.equipementHistorique.map((o) => (
                <Option
                  key={o.id}
                  compact
                  selectionne={eqHist === o.id}
                  titre={`Option ${o.id}`}
                  sous={`${liste(o.objets)} — plus ${o.po} po`}
                  onChoisir={() => poser((x) => ({ ...x, equipementHistorique: o.id }))}
                />
              ))}
            </ListeNav>
          </Section>
        )}
      </div>

      <aside className="choix-droite">
        <Panneau titre="Ce qu'il reste à choisir">
          {manques.length === 0 ? (
            <p className="tout-bon">✓ Tous les choix de cet écran sont faits.</p>
          ) : (
            <ul className="liste-manquants">
              {manques.map((m) => (
                <li key={m.message}>{m.message}</li>
              ))}
            </ul>
          )}
        </Panneau>
        <Panneau titre={detail ? detail.titre : 'Survolez un choix'}>
          {detail ? (
            <>
              {detail.sort && (
                <p>
                  <BadgeJouable id={detail.sort.id} />
                </p>
              )}
              <p className="texte-don">{detail.texte}</p>
              {detail.sort && <Puces elements={detailSort(detail.sort)} />}
            </>
          ) : (
            <p className="aide">Passez la souris (ou le focus clavier) sur un sort, une option ou une arme pour lire sa description.</p>
          )}
        </Panneau>
      </aside>
    </div>
  );
}
