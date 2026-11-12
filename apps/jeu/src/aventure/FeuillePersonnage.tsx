// La feuille de personnage pendant l'aventure, en grand : elle sert aussi d'inventaire (touche I, le bouton du sac, ou un clic sur
// un héros du bandeau). Onglet « Équipement » : la poupée du héros (portrait, cases du corps, jeux d'armes), le sac du groupe et la
// fiche de l'objet choisi avec ses actions, plus un résumé de combat (CA, PV, attaques du jeu en main). Onglet « Fiche » (touche C) :
// caractéristiques, jets de sauvegarde, compétences, attaques, sorts, traits et aptitudes. Les actions sont des propositions du
// moteur et les règles d'équipement viennent du moteur (`equipement-regles.ts`) : cette page ne fait que les présenter.
import { useEffect, useState } from 'react';
import { idElementPorte, NOMS_EMPLACEMENTS, POTION_DE_COMBAT, type ContexteJeu, type ElementGrille, type Emplacement, type Encart, type Ordre, type Partie, type Proposition } from '@crpg/regles';
import { Portrait } from '../createur/ui';
import { FichePerso } from '../createur/FichePerso';
import { attaquesEnMain, candidatsPour, casesPour, poupeeDe, texteCa } from '../equipement-regles';
import { BoutonProposition } from './BoutonProposition';
import { resumeRessources } from './fiches';
import { FicheElement, GrilleElements } from './GrilleElements';
import { GLISSE, PoupeeEquipement } from './PoupeeEquipement';

export type OngletFeuille = 'equipement' | 'fiche';

interface Props {
  ctx: ContexteJeu;
  monde: string;
  partie: Partie;
  /** L'identifiant du héros montré. */
  heros: string;
  onChoisir: (id: string) => void;
  onglet: OngletFeuille;
  onOnglet: (o: OngletFeuille) => void;
  /** La grille du sac (encart `sac-objets` du module Inventaire) et ses propositions (onglet « Sac »). */
  sac?: Encart;
  propositions: Proposition[];
  jouer: (o: Ordre) => void;
  onCombat: () => void;
  onFermer: () => void;
}

type Selection = { type: 'sac'; id: string } | { type: 'case'; s: Emplacement } | { type: 'potions' };

const signe = (n: number) => (n >= 0 ? `+${n}` : String(n));

export function FeuillePersonnage({ ctx, monde, partie, heros, onChoisir, onglet, onOnglet, sac, propositions, jouer, onCombat, onFermer }: Props) {
  const groupe = partie.groupe;
  const index = Math.max(0, groupe.findIndex((h) => h.id === heros));
  const h = groupe[index]!;
  const srd = ctx.srd;
  const classe = srd?.classes.get(h.fiche.classe)?.nom ?? h.fiche.classe;
  const espece = srd?.especes.get(h.fiche.espece)?.nom ?? h.fiche.espece;
  const historique = srd?.historiques.get(h.fiche.historique)?.nom ?? h.fiche.historique;
  const res = resumeRessources(h);
  const pourcent = (Math.max(0, h.pv) / h.fiche.pvMax) * 100;

  const [sel, setSel] = useState<Selection>();
  const [glisseSac, setGlisseSac] = useState<string>();
  const [glisseCase, setGlisseCase] = useState<Emplacement>();

  // Le sac du groupe sans ce que portent les héros (montré sur la poupée).
  const grille = sac?.grille;
  const elementsSac = grille?.elements.filter((e) => !e.porteur) ?? [];
  const tous = grille?.elements ?? [];
  const choisiSac = sel?.type === 'sac' ? elementsSac.find((e) => e.id === sel.id) : undefined;
  // L'objet du sac « en main » : celui qu'on glisse, sinon celui qu'on a choisi ; les cases où il peut aller s'allument.
  const enMain = glisseSac ?? choisiSac?.id;
  const cibles = enMain ? casesPour(ctx, h, enMain) : {};
  const poupee = poupeeDe(ctx, h);
  const caseChoisie = sel?.type === 'case' ? [...poupee.corps, ...poupee.jeux.flatMap((j) => [j.droite, j.gauche])].find((c) => c.emplacement === sel.s) : undefined;
  const elementCase = caseChoisie?.objet ? tous.find((e) => e.id === idElementPorte(h.id, caseChoisie.objet!.id)) : undefined;
  const elementPotions = tous.find((e) => e.id === idElementPorte(h.id, POTION_DE_COMBAT));
  const actionsDe = (e?: ElementGrille) => (e ? propositions.filter((p) => p.element?.id === e.id) : []);
  const boutons = (ps: Proposition[]) => ps.map((p, i) => <BoutonProposition key={`${p.libelle}:${i}`} p={p} jouer={jouer} onCombat={onCombat} groupe={groupe} monde={monde} />);
  const attaques = attaquesEnMain(ctx, h);
  // Une sélection qui ne montre plus rien (objet équipé, donc sorti du sac) ne compte pas.
  const selectionVisible = onglet === 'equipement' && !!(choisiSac || caseChoisie || sel?.type === 'potions');

  useEffect(() => {
    const surTouche = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const cible = ev.target as HTMLElement | null;
      if (cible && (/^(input|textarea|select)$/i.test(cible.tagName) || cible.isContentEditable)) return;
      const k = ev.key.toLowerCase();
      // Échap repose d'abord l'objet ou la case choisie, puis ferme la feuille.
      if (ev.key === 'Escape') return selectionVisible ? setSel(undefined) : onFermer();
      if (k === 'i') return onglet === 'equipement' ? onFermer() : onOnglet('equipement');
      if (k === 'c') return onglet === 'fiche' ? onFermer() : onOnglet('fiche');
      if (ev.key === 'ArrowLeft') onChoisir(groupe[(index + groupe.length - 1) % groupe.length]!.id);
      if (ev.key === 'ArrowRight') onChoisir(groupe[(index + 1) % groupe.length]!.id);
    };
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  }, [groupe, index, onChoisir, onFermer, onglet, onOnglet, selectionVisible]);

  // Changer de héros garde l'objet du sac choisi (le sac est commun), pas la case.
  useEffect(() => {
    setSel((s) => (s?.type === 'sac' ? s : undefined));
  }, [heros]);

  const choisirSac = (e: ElementGrille) => {
    setSel(sel?.type === 'sac' && sel.id === e.id ? undefined : { type: 'sac', id: e.id });
    // Regarder un objet « nouveau » lui retire sa pastille.
    if (e.nouveau && e.ordreVu) jouer(e.ordreVu);
  };

  /** Ce que montre la colonne de droite : l'objet du sac choisi, la case choisie, ou les potions portées. */
  const fiche = () => {
    if (choisiSac) {
      const possibles = Object.entries(cibles).filter(([, c]) => !c!.refus);
      const refus = Object.values(cibles).find((c) => c!.refus)?.refus;
      return (
        <>
          <FicheElement monde={monde} e={choisiSac} actions={boutons(actionsDe(choisiSac))} />
          {Object.keys(cibles).length > 0 && (
            <p className="inv-consigne">
              {possibles.length
                ? `Glissez-le sur une case allumée de ${h.nom}, ou cliquez-la (${possibles.map(([s, c]) => `${NOMS_EMPLACEMENTS[s as Emplacement].toLowerCase()} : ${texteCa(c!.ca)}`).join(' · ')}).`
                : `${h.nom} ne peut pas le porter maintenant : ${refus}`}
            </p>
          )}
        </>
      );
    }
    if (sel?.type === 'potions')
      return elementPotions ? <FicheElement monde={monde} e={elementPotions} actions={boutons(actionsDe(elementPotions))} /> : <p className="vide">{h.nom} ne porte aucune potion de guérison. Confiez-en une depuis le sac.</p>;
    if (caseChoisie) {
      const candidats = caseChoisie.bloquee ? [] : candidatsPour(ctx, h, caseChoisie.emplacement, partie.etat.inventaire);
      return (
        <>
          {elementCase ? (
            <FicheElement
              monde={monde}
              e={elementCase}
              actions={
                <button type="button" className="bouton" onClick={() => jouer({ type: 'retirerEquipement', personnage: h.id, emplacement: caseChoisie.emplacement })} title="Le remet dans le sac du groupe (ou glissez-le vers le sac)">
                  Ranger dans le sac
                </button>
              }
            />
          ) : (
            <h3 className="inv-titre-case">{caseChoisie.nom}</h3>
          )}
          {caseChoisie.bloquee ? (
            <p className="vide">{caseChoisie.bloquee} Rangez-la, ou prenez l'autre jeu.</p>
          ) : (
            <section className="inv-candidats">
              <h4>Du sac vers {caseChoisie.nom.toLowerCase()}</h4>
              {candidats.length ? (
                <ul className="feuille-liste">
                  {candidats.map((c) => (
                    <li key={c.objet}>
                      <span className="feuille-nom">{c.nom}</span>
                      <span className="feuille-effet">{c.refus ? '—' : texteCa(c.ca)}</span>
                      <button type="button" className="bouton-discret" disabled={!!c.refus || h.pv <= 0} title={c.refus ?? 'Ce qui était porté retourne dans le sac.'} onClick={() => jouer({ type: 'equiper', objet: c.objet, personnage: h.id, emplacement: caseChoisie.emplacement })}>
                        {caseChoisie.objet ? 'Remplacer' : 'Équiper'}
                      </button>
                      {c.refus && <span className="poupee-refus">{c.refus}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="vide">Rien dans le sac ne va ici.</p>
              )}
            </section>
          )}
        </>
      );
    }
    return <p className="encart-texte">Choisissez un objet du sac ou une case de {h.nom} pour voir sa fiche et ce que vous pouvez en faire.</p>;
  };

  return (
    <div className="page-pleine feuille-perso" role="dialog" aria-label={`Feuille de ${h.nom}`}>
      <header className="page-pleine-haut">
        <nav className="feuille-onglets" aria-label="Onglets de la feuille">
          <button type="button" className={onglet === 'equipement' ? 'actif' : ''} aria-pressed={onglet === 'equipement'} onClick={() => onOnglet('equipement')}>
            🎒 Équipement <small>(I)</small>
          </button>
          <button type="button" className={onglet === 'fiche' ? 'actif' : ''} aria-pressed={onglet === 'fiche'} onClick={() => onOnglet('fiche')}>
            📜 Fiche <small>(C)</small>
          </button>
        </nav>
        <nav className="feuille-heros" aria-label="Héros">
          {groupe.map((x) => (
            <button key={x.id} type="button" className={`feuille-heros-bouton${x.id === h.id ? ' actif' : ''}${x.pv <= 0 ? ' tombe' : ''}`} aria-pressed={x.id === h.id} onClick={() => onChoisir(x.id)} title={x.nom}>
              <Portrait id={x.portrait} espece={x.fiche.espece} classe={x.fiche.classe} taille={28} />
              <span>{x.nom}</span>
            </button>
          ))}
        </nav>
        <button type="button" className="bouton-discret" onClick={onFermer} autoFocus>
          Fermer ✕ <small>(Échap)</small>
        </button>
      </header>

      <div className={`feuille-corps feuille-${onglet}`}>
        <section className="feuille-identite">
          {onglet === 'fiche' && <Portrait id={h.portrait} espece={h.fiche.espece} classe={h.fiche.classe} taille={72} />}
          <div className="feuille-identite-texte">
            <h3>{h.nom}</h3>
            <p>
              {espece} · {classe} niveau {h.fiche.niveau} · {historique}
            </p>
            <div className="feuille-pv" title={`${h.pv} / ${h.fiche.pvMax} points de vie`}>
              <div className="barre">
                <div className={`barre-remplie ${pourcent > 50 ? 'pv-haut' : pourcent > 25 ? 'pv-moyen' : 'pv-bas'}`} style={{ width: `${pourcent}%` }} />
              </div>
              <strong>
                {h.pv} / {h.fiche.pvMax} PV
              </strong>
              <span>CA {h.fiche.ca}</span>
              {h.pv <= 0 && <em className="feuille-tombe">hors de combat</em>}
            </div>
            {res.detail && <p className="feuille-ressources">{res.detail.split(/\n/).join(' · ')}</p>}
          </div>
          {grille?.resume && (
            <div className="feuille-resume-sac">
              {grille.resume.map((l) => (
                <span key={l.libelle} className={l.ton ? `ton-${l.ton}` : ''}>
                  {l.libelle} <strong>{l.valeur}</strong>
                </span>
              ))}
            </div>
          )}
        </section>

        {onglet === 'fiche' ? (
          srd && <FichePerso fiche={h.fiche} donnees={srd} enJeu />
        ) : (
          <div className="inv-corps">
            <section className="fp-bloc inv-poupee">
              <h3>Porté par {h.nom}</h3>
              <PoupeeEquipement
                ctx={ctx}
                heros={h}
                jouer={jouer}
                choisie={caseChoisie?.emplacement}
                onChoisir={(s) => setSel(sel?.type === 'case' && sel.s === s ? undefined : { type: 'case', s })}
                cibles={cibles}
                enMain={enMain}
                potions={h.ressources.potions ?? 0}
                potionsChoisies={sel?.type === 'potions'}
                onPotions={() => setSel(sel?.type === 'potions' ? undefined : { type: 'potions' })}
                onGlisserCase={setGlisseCase}
              />
              <div className="inv-combat">
                <h4>
                  Au combat <span>CA {h.fiche.ca}</span> <span>{h.pv} / {h.fiche.pvMax} PV</span>
                </h4>
                {attaques.length ? (
                  <ul>
                    {attaques.map((a) => (
                      <li key={a.id}>
                        <strong>{a.nom}</strong> <span className="fp-meta">{a.mode}</span> · {signe(a.bonus)} · {a.degats}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="vide">Mains nues.</p>
                )}
              </div>
            </section>

            <section
              className={`fp-bloc inv-sac${glisseCase ? ' depot' : ''}`}
              onDragOver={(ev) => {
                if (glisseCase) {
                  ev.preventDefault();
                  ev.dataTransfer.dropEffect = 'move';
                }
              }}
              onDrop={(ev) => {
                ev.preventDefault();
                const d = ev.dataTransfer.getData(GLISSE);
                if (d.startsWith('case:')) jouer({ type: 'retirerEquipement', personnage: h.id, emplacement: d.slice(5) });
                setGlisseCase(undefined);
              }}
            >
              <h3>Sac du groupe {glisseCase && <small>— lâchez ici pour ranger</small>}</h3>
              {grille ? (
                <GrilleElements
                  monde={monde}
                  grille={{ ...grille, elements: elementsSac }}
                  cle="feuille-sac"
                  selection={choisiSac?.id}
                  heros={groupe}
                  onChoisir={choisirSac}
                  glisser={{
                    type: GLISSE,
                    peut: (e) => Object.keys(casesPour(ctx, h, e.id)).length > 0,
                    debut: (e) => setGlisseSac(e.id),
                    fin: () => setGlisseSac(undefined),
                  }}
                />
              ) : (
                <p className="vide">Pas de sac.</p>
              )}
            </section>

            <aside className="fp-bloc inv-fiche">
              {fiche()}
            </aside>
          </div>
        )}
      </div>

      <footer className="feuille-pied">
        <button type="button" className="bouton-discret" onClick={() => onChoisir(groupe[(index + groupe.length - 1) % groupe.length]!.id)}>
          ‹ Précédent <small>(←)</small>
        </button>
        <button type="button" className="bouton-discret" onClick={() => onChoisir(groupe[(index + 1) % groupe.length]!.id)}>
          Suivant › <small>(→)</small>
        </button>
      </footer>
    </div>
  );
}

