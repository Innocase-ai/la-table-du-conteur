import { useEffect, useMemo, useState } from 'react';
import {
  BUDGET_ACHAT,
  CARACTERISTIQUES,
  VALEUR_MAX,
  bonusHistoriqueRecommande,
  coutAchat,
  exigences,
  modificateur,
  prioriteCaracteristiques,
  recommanderCaracteristiques,
  tirerValeurs,
  type Caracteristique,
  type Valeurs,
} from '@crpg/regles';
import { ficheApercu, totaux, valeursInitiales, type Brouillon } from '../brouillon';
import { CLASSES_INFO } from '../descriptions';
import { NOMS_CARAC, signe } from '../libelles';
import { Portrait } from '../ui';
import type { PropsEcran } from './commun';

type Methode = 'standard' | 'achat' | 'tirage';

const NOMS_METHODES: Record<Methode, string> = { standard: 'Standard', achat: 'Achat de points', tirage: 'Tirage 4d6' };

function construireBonus(plus2: Caracteristique, plus1: Caracteristique): Partial<Valeurs> {
  return { [plus2]: 2, [plus1]: 1 };
}

interface LigneAmelio {
  mode: '2' | '11';
  picks: Caracteristique[];
}

function versLigne(v: Partial<Valeurs> | undefined): LigneAmelio {
  const entrees = Object.entries(v ?? {}).filter(([, n]) => n) as [Caracteristique, number][];
  if (!entrees.length) return { mode: '2', picks: [] };
  return entrees.length === 1 ? { mode: '2', picks: [entrees[0]![0]] } : { mode: '11', picks: entrees.map(([k]) => k) };
}

function versAmelioration(l: LigneAmelio): Partial<Valeurs> | undefined {
  if (l.mode === '2') return l.picks.length === 1 ? { [l.picks[0]!]: 2 } : undefined;
  return l.picks.length === 2 ? { [l.picks[0]!]: 1, [l.picks[1]!]: 1 } : undefined;
}

function LigneAmelioration({
  index,
  valeur,
  autres,
  onChange,
}: {
  index: number;
  valeur: Partial<Valeurs> | undefined;
  /** Totaux de caractéristique sans cette ligne. */
  autres: Valeurs | undefined;
  onChange: (v: Partial<Valeurs> | undefined) => void;
}) {
  const [ligne, setLigne] = useState<LigneAmelio>(() => versLigne(valeur));
  // Une recommandation appliquée de l'extérieur remplace la sélection locale.
  useEffect(() => {
    if (valeur && JSON.stringify(valeur) !== JSON.stringify(versAmelioration(ligne))) setLigne(versLigne(valeur));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valeur]);
  const maj = (l: LigneAmelio) => {
    setLigne(l);
    onChange(versAmelioration(l));
  };
  const gain = ligne.mode === '2' ? 2 : 1;
  return (
    <div className="ligne-amelio">
      <span className="amelio-titre">Amélioration {index + 1}</span>
      <div className="segments segments-petits" role="group" aria-label={`Type de l'amélioration ${index + 1}`}>
        <button type="button" className={ligne.mode === '2' ? 'actif' : ''} aria-pressed={ligne.mode === '2'} onClick={() => maj({ mode: '2', picks: ligne.picks.slice(0, 1) })}>
          +2 à une
        </button>
        <button type="button" className={ligne.mode === '11' ? 'actif' : ''} aria-pressed={ligne.mode === '11'} onClick={() => maj({ mode: '11', picks: ligne.picks.slice(0, 2) })}>
          +1 à deux
        </button>
      </div>
      <div className="chips">
        {CARACTERISTIQUES.map((k) => {
          const choisi = ligne.picks.includes(k);
          const depasse = !!autres && autres[k] + gain > VALEUR_MAX;
          return (
            <button
              key={k}
              type="button"
              className={`chip ${choisi ? 'chip-actif' : ''}`}
              aria-pressed={choisi}
              disabled={!choisi && depasse}
              title={!choisi && depasse ? `${NOMS_CARAC[k]} dépasserait ${VALEUR_MAX}.` : undefined}
              onClick={() => {
                const max = ligne.mode === '2' ? 1 : 2;
                const picks = choisi ? ligne.picks.filter((x) => x !== k) : [...ligne.picks.slice(ligne.picks.length >= max ? 1 : 0), k];
                maj({ ...ligne, picks });
              }}
            >
              {NOMS_CARAC[k].slice(0, 3)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function EcranCaracteristiques({ b, donnees, maj }: PropsEcran) {
  const { choix } = b;
  const methode: Methode = choix.methode ?? 'standard';
  const historique = choix.historique ? donnees.historiques.get(choix.historique) : undefined;
  const classe = choix.classe ? donnees.classes.get(choix.classe) : undefined;
  const espece = choix.espece ? donnees.especes.get(choix.espece) : undefined;
  const ex = useMemo(() => exigences(choix, donnees), [choix, donnees]);
  const nbAmelio = ex?.ameliorations ?? 0;
  const [selection, setSelection] = useState<Caracteristique | null>(null);

  // Valeurs de départ raisonnables : on n'impose rien, le joueur peut tout changer.
  useEffect(() => {
    maj((x) => {
      let c = x.choix;
      const m: Methode = c.methode ?? 'standard';
      if (!c.valeursBase && m !== 'tirage') c = { ...c, methode: m, valeursBase: valeursInitiales(x, m) };
      if (c.classe && c.historique && !Object.values(c.bonusHistorique ?? {}).some((v) => v)) {
        c = { ...c, bonusHistorique: bonusHistoriqueRecommande(c.classe, c.historique, donnees) };
      }
      if (c.valeursBase && c.classe && c.historique && c.ameliorations === undefined) {
        const e = exigences(c, donnees);
        if (e && e.ameliorations > 0) {
          const reco = recommanderCaracteristiques(c, donnees).ameliorations;
          const essai = { ...c, ameliorations: reco };
          const t = totaux(essai);
          if (reco && t && CARACTERISTIQUES.every((k) => t[k] <= VALEUR_MAX)) c = essai;
        }
      }
      return c === x.choix ? x : { ...x, choix: c };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const valeurs = choix.valeursBase;
  const bonus = choix.bonusHistorique ?? {};
  const totalCourant = totaux(choix);
  const apercu = useMemo(() => ficheApercu(choix, donnees), [choix, donnees]);

  const poser = (f: (c: Brouillon['choix']) => Brouillon['choix']) => maj((x) => ({ ...x, choix: f(x.choix) }));

  const choisirMethode = (m: Methode) => {
    if (m === methode) return;
    maj((x) => ({ ...x, tirageValide: false, choix: { ...x.choix, methode: m, valeursBase: valeursInitiales(x, m) } }));
    setSelection(null);
  };

  const echanger = (a: Caracteristique, z: Caracteristique) =>
    poser((c) => (c.valeursBase ? { ...c, valeursBase: { ...c.valeursBase, [a]: c.valeursBase[z], [z]: c.valeursBase[a] } } : c));

  const cliquerValeur = (k: Caracteristique) => {
    if (selection === null) setSelection(k);
    else if (selection === k) setSelection(null);
    else {
      echanger(selection, k);
      setSelection(null);
    }
  };

  const changerAchat = (k: Caracteristique, delta: number) =>
    poser((c) => {
      if (!c.valeursBase) return c;
      const nv = c.valeursBase[k] + delta;
      if (nv < 8 || nv > 15) return c;
      const essai = { ...c.valeursBase, [k]: nv };
      const cout = coutAchat(essai);
      return cout !== undefined && cout <= BUDGET_ACHAT ? { ...c, valeursBase: essai } : c;
    });

  const lancer = () => {
    const tires = tirerValeurs(Math.random).sort((a, z) => z - a);
    const ordre = choix.classe ? prioriteCaracteristiques(choix.classe) : [...CARACTERISTIQUES];
    const nouvelles = {} as Valeurs;
    ordre.forEach((k, i) => (nouvelles[k] = tires[i]!));
    maj((x) => ({ ...x, tirageValide: false, choix: { ...x.choix, methode: 'tirage', valeursBase: nouvelles } }));
    setSelection(null);
  };

  // Bonus d'historique : +2/+1 ou +1/+1/+1 sur les trois caractéristiques de l'historique.
  const liees: Caracteristique[] = historique ? [...historique.caracteristiques] : [];
  const entreesBonus = Object.entries(bonus).filter(([, v]) => v) as [Caracteristique, number][];
  const mode111 = entreesBonus.length === 3;
  const plus2 = entreesBonus.find(([, v]) => v === 2)?.[0];
  const plus1 = entreesBonus.find(([, v]) => v === 1)?.[0];
  const autreQue = (...exclus: (Caracteristique | undefined)[]) => liees.find((k) => !exclus.includes(k));

  const choisirModeBonus = (m: '21' | '111') => {
    if (!historique || (m === '111') === mode111) return;
    if (m === '111') poser((c) => ({ ...c, bonusHistorique: Object.fromEntries(liees.map((k) => [k, 1])) }));
    else poser((c) => ({ ...c, bonusHistorique: c.classe ? bonusHistoriqueRecommande(c.classe, historique.id, donnees) : construireBonus(liees[0]!, liees[1]!) }));
  };
  const poserPlus2 = (k: Caracteristique) => {
    const nouveauPlus1 = plus1 === k ? plus2 : plus1;
    const p1 = nouveauPlus1 && nouveauPlus1 !== k ? nouveauPlus1 : autreQue(k)!;
    poser((c) => ({ ...c, bonusHistorique: construireBonus(k, p1) }));
  };
  const poserPlus1 = (k: Caracteristique) => {
    const nouveauPlus2 = plus2 === k ? plus1 : plus2;
    const p2 = nouveauPlus2 && nouveauPlus2 !== k ? nouveauPlus2 : autreQue(k)!;
    poser((c) => ({ ...c, bonusHistorique: construireBonus(p2, k) }));
  };

  // Améliorations de caractéristique (niveau 4 et plus).
  const [lignes, setLignes] = useState<(Partial<Valeurs> | undefined)[]>(() => Array.from({ length: nbAmelio }, (_, i) => choix.ameliorations?.[i]));
  useEffect(() => {
    const c = choix.ameliorations ?? [];
    if (JSON.stringify(c) !== JSON.stringify(lignes.filter(Boolean))) setLignes(Array.from({ length: nbAmelio }, (_, i) => c[i]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choix.ameliorations, nbAmelio]);
  const majLigne = (i: number, v: Partial<Valeurs> | undefined) => {
    const suivantes = Array.from({ length: nbAmelio }, (_, j) => (j === i ? v : lignes[j]));
    setLignes(suivantes);
    poser((c) => ({ ...c, ameliorations: suivantes.filter((x): x is Partial<Valeurs> => !!x) }));
  };
  const sansLigne = (i: number): Valeurs | undefined => {
    if (!totalCourant) return undefined;
    const res = { ...totalCourant };
    for (const k of CARACTERISTIQUES) res[k] -= lignes[i]?.[k] ?? 0;
    return res;
  };

  const cout = valeurs && methode === 'achat' ? coutAchat(valeurs) : undefined;
  const restants = cout === undefined ? undefined : BUDGET_ACHAT - cout;
  const priorite = choix.classe ? prioriteCaracteristiques(choix.classe) : [];
  const info = choix.classe ? CLASSES_INFO[choix.classe] : undefined;
  const depasse = totalCourant ? CARACTERISTIQUES.filter((k) => totalCourant[k] > VALEUR_MAX) : [];
  const tire = methode === 'tirage' && !valeurs;

  return (
    <div className="ecran ecran-carac">
      <div className="carac-gauche">
        <div className="carac-entete">
          <div className="segments" role="group" aria-label="Méthode de répartition">
            {(Object.keys(NOMS_METHODES) as Methode[]).map((m) => (
              <button key={m} type="button" className={methode === m ? 'actif' : ''} aria-pressed={methode === m} onClick={() => choisirMethode(m)}>
                {NOMS_METHODES[m]}
              </button>
            ))}
          </div>
          <div className="carac-points" aria-live="polite">
            {methode === 'achat' && restants !== undefined && (
              <>
                Points à répartir <strong>{restants}</strong> / {BUDGET_ACHAT}
              </>
            )}
            {methode === 'standard' && <>Valeurs à répartir : 15, 14, 13, 12, 10, 8 — échangez-les entre les lignes</>}
            {methode === 'tirage' && (
              <span className="tirage-actions">
                <button type="button" className="bouton" onClick={lancer} disabled={!!b.tirageValide}>
                  {valeurs ? 'Relancer les dés' : 'Lancer les dés'}
                </button>
                {valeurs && !b.tirageValide && (
                  <button type="button" className="bouton-principal bouton-moyen" onClick={() => maj((x) => ({ ...x, tirageValide: true }))}>
                    Valider le tirage
                  </button>
                )}
                {b.tirageValide && <span className="valide-tag">Tirage validé</span>}
              </span>
            )}
          </div>
        </div>

        <table className="table-carac">
          <thead>
            <tr>
              <th scope="col">Caractéristique</th>
              <th scope="col">Base</th>
              <th scope="col">
                Historique
                {historique && (
                  <div className="segments segments-petits segments-bonus" role="group" aria-label="Répartition du bonus d'historique">
                    <button type="button" className={!mode111 ? 'actif' : ''} aria-pressed={!mode111} onClick={() => choisirModeBonus('21')}>
                      +2 / +1
                    </button>
                    <button type="button" className={mode111 ? 'actif' : ''} aria-pressed={mode111} onClick={() => choisirModeBonus('111')}>
                      +1 ×3
                    </button>
                  </div>
                )}
              </th>
              {nbAmelio > 0 && <th scope="col">Amélio.</th>}
              <th scope="col">Total</th>
              <th scope="col">Mod.</th>
            </tr>
          </thead>
          <tbody>
            {CARACTERISTIQUES.map((k, i) => {
              const base = valeurs?.[k];
              const total = totalCourant?.[k];
              const lie = liees.includes(k);
              const gainAmelio = (choix.ameliorations ?? []).reduce((s, a) => s + (a[k] ?? 0), 0);
              return (
                <tr key={k} className={total !== undefined && total > VALEUR_MAX ? 'ligne-erreur' : ''}>
                  <th scope="row">
                    {NOMS_CARAC[k]}
                    {priorite[0] === k && <span className="mini-tag" title="Caractéristique principale conseillée">★</span>}
                  </th>
                  <td className="cellule-base">
                    {base === undefined ? (
                      <span className="vide">—</span>
                    ) : methode === 'achat' ? (
                      <span className="stepper">
                        <button type="button" className="bouton-rond" aria-label={`Diminuer ${NOMS_CARAC[k]}`} disabled={base <= 8} onClick={() => changerAchat(k, -1)}>
                          −
                        </button>
                        <strong>{base}</strong>
                        <button
                          type="button"
                          className="bouton-rond"
                          aria-label={`Augmenter ${NOMS_CARAC[k]}`}
                          disabled={base >= 15 || (restants !== undefined && restants < (coutAchat({ ...valeurs!, [k]: base + 1 }) ?? 99) - (cout ?? 0))}
                          onClick={() => changerAchat(k, 1)}
                        >
                          +
                        </button>
                      </span>
                    ) : (
                      <span className="stepper">
                        <button type="button" className="bouton-rond" aria-label={`Monter ${NOMS_CARAC[k]}`} disabled={i === 0} onClick={() => echanger(k, CARACTERISTIQUES[i - 1]!)}>
                          ▲
                        </button>
                        <button
                          type="button"
                          className={`valeur-echange ${selection === k ? 'valeur-selectionnee' : ''}`}
                          aria-pressed={selection === k}
                          title={selection === null ? 'Cliquez, puis cliquez une autre valeur pour les échanger' : 'Cliquez pour échanger'}
                          onClick={() => cliquerValeur(k)}
                        >
                          {base}
                        </button>
                        <button type="button" className="bouton-rond" aria-label={`Descendre ${NOMS_CARAC[k]}`} disabled={i === CARACTERISTIQUES.length - 1} onClick={() => echanger(k, CARACTERISTIQUES[i + 1]!)}>
                          ▼
                        </button>
                      </span>
                    )}
                  </td>
                  <td className="cellule-bonus">
                    {!historique || !lie ? (
                      <span className="vide">—</span>
                    ) : mode111 ? (
                      <strong className="bonus-fixe">+1</strong>
                    ) : (
                      <span className="segments segments-petits">
                        <button type="button" className={plus2 === k ? 'actif' : ''} aria-pressed={plus2 === k} aria-label={`+2 en ${NOMS_CARAC[k]}`} onClick={() => poserPlus2(k)}>
                          +2
                        </button>
                        <button type="button" className={plus1 === k ? 'actif' : ''} aria-pressed={plus1 === k} aria-label={`+1 en ${NOMS_CARAC[k]}`} onClick={() => poserPlus1(k)}>
                          +1
                        </button>
                      </span>
                    )}
                  </td>
                  {nbAmelio > 0 && <td>{gainAmelio ? signe(gainAmelio) : '—'}</td>}
                  <td className="cellule-total">{total ?? '—'}</td>
                  <td className="cellule-mod">{total !== undefined ? signe(modificateur(total)) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {tire && <p className="aide aide-centre">Lancez les dés : chaque valeur est la somme des trois meilleurs de quatre d6. Vous pourrez ensuite les échanger entre les caractéristiques.</p>}
        {methode === 'achat' && restants !== undefined && restants > 0 && <p className="aide aide-centre">Il vous reste {restants} point(s) : vous pouvez les dépenser ou les garder.</p>}
        {depasse.length > 0 && <p className="alerte">{depasse.map((k) => NOMS_CARAC[k]).join(', ')} dépasse {VALEUR_MAX} : réduisez une amélioration ou le bonus d'historique.</p>}

        {nbAmelio > 0 && (
          <div className="bloc-amelios">
            <h3>Améliorations de caractéristique</h3>
            <p className="aide">Chaque amélioration donne +2 à une caractéristique ou +1 à deux (20 au maximum).</p>
            {Array.from({ length: nbAmelio }, (_, i) => (
              <LigneAmelioration key={i} index={i} valeur={lignes[i]} autres={sansLigne(i)} onChange={(v) => majLigne(i, v)} />
            ))}
          </div>
        )}
      </div>

      <aside className="carac-droite">
        <div className="carte-perso">
          <Portrait id={undefined} espece={espece?.id} classe={classe?.id} taille={56} />
          <div className="carte-perso-texte">
            <dl>
              <div>
                <dt>Espèce</dt>
                <dd>{espece?.nom ?? '—'}</dd>
              </div>
              <div>
                <dt>Classe</dt>
                <dd>{classe ? `${classe.nom} (niveau ${choix.niveau})` : '—'}</dd>
              </div>
              <div>
                <dt>Historique</dt>
                <dd>{historique?.nom ?? '—'}</dd>
              </div>
            </dl>
          </div>
        </div>
        {classe && (
          <p className="conseil">
            <strong>Conseil.</strong> Un {classe.nom.toLowerCase()} (complexité {info?.complexite.toLowerCase() ?? 'moyenne'}) a surtout besoin de{' '}
            {priorite
              .slice(0, 3)
              .map((k) => NOMS_CARAC[k])
              .join(', ')}
            . La Constitution protège les points de vie ; le bonus de l'historique se place sur ce qui compte le plus pour la classe.
          </p>
        )}
        <div className="metriques">
          <div>
            <span>PV</span>
            <strong>{apercu?.pvMax ?? '—'}</strong>
          </div>
          <div>
            <span>Initiative</span>
            <strong>{apercu ? signe(apercu.initiative) : '—'}</strong>
          </div>
          <div>
            <span>Maîtrise</span>
            <strong>{apercu ? signe(apercu.bonusMaitrise) : '—'}</strong>
          </div>
          <div>
            <span>CA</span>
            <strong>{apercu?.ca ?? '—'}</strong>
          </div>
        </div>
        <p className="aide">La CA affichée suppose l'équipement recommandé tant que vous n'avez pas choisi le vôtre.</p>
      </aside>
    </div>
  );
}
