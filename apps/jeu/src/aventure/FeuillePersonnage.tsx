// La feuille de personnage pendant l'aventure (touche C, ou un clic sur un héros du bandeau) : l'état du moment (points de
// vie, ressources, emplacements), l'équipement porté avec ses actions (retirer, équiper depuis le sac) et la fiche complète
// du héros (caractéristiques, compétences, attaques, sorts, aptitudes). Les actions sont des propositions du moteur : cette
// page ne connaît aucune règle d'équipement.
import { useEffect } from 'react';
import { equipementDe, objetDe, type ContexteJeu, type Ordre, type Partie, type Personnage, type Proposition } from '@crpg/regles';
import { Portrait } from '../createur/ui';
import { FichePerso } from '../createur/FichePerso';
import { resumeRessources } from './fiches';

interface Props {
  ctx: ContexteJeu;
  partie: Partie;
  /** L'identifiant du héros montré. */
  heros: string;
  onChoisir: (id: string) => void;
  propositions: Proposition[];
  jouer: (o: Ordre) => void;
  onFermer: () => void;
}

/** Ce que porte un héros : (genre, objet) dans l'ordre armure, bouclier, armes, parures. */
function portes(h: Personnage): { genre: string; objet: string }[] {
  const e = equipementDe(h);
  return [
    ...(e.armure ? [{ genre: 'Armure', objet: e.armure }] : []),
    ...(e.bouclier ? [{ genre: 'Bouclier', objet: e.bouclier }] : []),
    ...e.armes.map((objet) => ({ genre: 'Arme', objet })),
    ...e.portes.map((objet) => ({ genre: 'Parure', objet })),
  ];
}

export function FeuillePersonnage({ ctx, partie, heros, onChoisir, propositions, jouer, onFermer }: Props) {
  const groupe = partie.groupe;
  const index = Math.max(0, groupe.findIndex((h) => h.id === heros));
  const h = groupe[index]!;
  const srd = ctx.srd;
  const classe = srd?.classes.get(h.fiche.classe)?.nom ?? h.fiche.classe;
  const espece = srd?.especes.get(h.fiche.espece)?.nom ?? h.fiche.espece;
  const historique = srd?.historiques.get(h.fiche.historique)?.nom ?? h.fiche.historique;
  const res = resumeRessources(h);
  const pourcent = (Math.max(0, h.pv) / h.fiche.pvMax) * 100;
  const porte = portes(h);
  // Les objets du sac que ce héros peut équiper : les propositions « Équiper… » du moteur, avec leur effet sur la CA.
  const aEquiper = propositions
    .filter((p) => p.ordre?.type === 'equiper' && p.choix)
    .map((p) => ({ p, option: p.choix!.options.find((o) => o.valeur === h.id) }))
    .filter((x): x is { p: Proposition; option: NonNullable<typeof x.option> } => !!x.option);

  useEffect(() => {
    const surTouche = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const cible = ev.target as HTMLElement | null;
      if (cible && (/^(input|textarea|select)$/i.test(cible.tagName) || cible.isContentEditable)) return;
      if (ev.key === 'Escape' || ev.key.toLowerCase() === 'c') return onFermer();
      if (ev.key === 'ArrowLeft') onChoisir(groupe[(index + groupe.length - 1) % groupe.length]!.id);
      if (ev.key === 'ArrowRight') onChoisir(groupe[(index + 1) % groupe.length]!.id);
    };
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  }, [groupe, index, onChoisir, onFermer]);

  return (
    <div className="page-pleine feuille-perso" role="dialog" aria-label={`Feuille de ${h.nom}`}>
      <header className="page-pleine-haut">
        <h2>Feuille de personnage</h2>
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

      <div className="feuille-corps">
        <section className="feuille-identite">
          <Portrait id={h.portrait} espece={h.fiche.espece} classe={h.fiche.classe} taille={92} />
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
            {res.detail && <p className="feuille-ressources">{res.detail}</p>}
          </div>
        </section>

        <section className="fp-bloc feuille-equipement">
          <h3>Équipement porté</h3>
          {porte.length ? (
            <ul className="feuille-liste">
              {porte.map(({ genre, objet }, i) => {
                const o = objetDe(ctx, objet);
                return (
                  <li key={`${objet}-${i}`}>
                    <span className="feuille-genre">{genre}</span>
                    <span className="feuille-nom">
                      {o.nom}
                      {o.magique && (
                        <span className="encart-info" title="Objet magique">
                          {' '}
                          ✦
                        </span>
                      )}
                    </span>
                    <button type="button" className="bouton-discret" onClick={() => jouer({ type: 'retirerEquipement', objet, personnage: h.id })} title="Le remet dans le sac du groupe">
                      Retirer
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="vide">Rien n'est porté.</p>
          )}
          <h3>Dans le sac : à équiper</h3>
          {aEquiper.length ? (
            <ul className="feuille-liste">
              {aEquiper.map(({ p, option }) => (
                <li key={p.element!.id}>
                  <span className="feuille-nom">{p.element!.titre}</span>
                  <span className="feuille-effet">{option.detail}</span>
                  <button type="button" className="bouton-discret" disabled={!!option.desactivee} title={option.desactivee ?? p.aide} onClick={() => jouer({ ...p.ordre!, personnage: h.id })}>
                    Équiper
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="vide">Rien d'équipable dans le sac.</p>
          )}
          <p className="fp-ligne">Or du groupe : {partie.etat.pieces.toLocaleString('fr-FR')} po</p>
        </section>

        {srd && <FichePerso fiche={h.fiche} donnees={srd} enJeu />}
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
