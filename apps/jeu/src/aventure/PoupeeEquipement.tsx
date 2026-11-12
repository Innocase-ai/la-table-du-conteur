// La poupée d'équipement : le portrait du héros au centre, les cases du corps de part et d'autre (tête, cou, dos, torse, gants,
// ceinture, pieds, anneaux, potions portées) et les deux jeux d'armes dessous (main droite, main gauche). Les cases acceptent un
// objet glissé depuis le sac ; un objet porté se glisse vers le sac pour le ranger. Quand un objet du sac est choisi ou glissé,
// les cases où il peut aller s'allument (et celles qui le refusent disent pourquoi). Aucune règle ici : voir `equipement-regles.ts`.
import type { ContexteJeu, Emplacement, Ordre, Personnage } from '@crpg/regles';
import { useImageCommune } from '../composants/ImageCommune';
import { Portrait } from '../createur/ui';
import { poupeeDe, texteCa, type Candidat, type CaseEquipement } from '../equipement-regles';

/** Le type de donnée glissée : un objet du sac (`sac:<id>`) ou une case portée (`case:<emplacement>`). */
export const GLISSE = 'application/x-table-du-conteur';

interface Props {
  ctx: ContexteJeu;
  heros: Personnage;
  jouer: (o: Ordre) => void;
  /** La case choisie (sa fiche est montrée à côté). */
  choisie?: Emplacement;
  onChoisir: (s: Emplacement) => void;
  /** Où peut aller l'objet du sac choisi ou glissé (vide : aucun objet en main). */
  cibles: Partial<Record<Emplacement, Candidat>>;
  /** L'objet du sac choisi ou glissé, s'il y en a un. */
  enMain?: string;
  /** Le nombre de potions de guérison que porte le héros, et l'ouverture de leur fiche. */
  potions: number;
  onPotions: () => void;
  potionsChoisies: boolean;
  /** Un objet porté commence à être glissé (pour allumer la zone du sac). */
  onGlisserCase: (s: Emplacement | undefined) => void;
}

const ICONES: Partial<Record<Emplacement, string>> = {
  tete: '⛑',
  cou: '📿',
  dos: '🧥',
  torse: '🥋',
  gants: '🧤',
  anneau1: '💍',
  anneau2: '💍',
  ceinture: '➰',
  pieds: '🥾',
  'j1.droite': '🗡',
  'j2.droite': '🏹',
  'j1.gauche': '🛡',
  'j2.gauche': '🛡',
};

function Case({ c, props }: { c: CaseEquipement; props: Props }) {
  const { heros: h, jouer, choisie, onChoisir, cibles, enMain, onGlisserCase } = props;
  const url = useImageCommune(c.objet?.image?.groupe, c.objet?.image?.id);
  const cible = enMain ? cibles[c.emplacement] : undefined;
  const etat = enMain ? (cible ? (cible.refus ? 'refusee' : 'possible') : 'eteinte') : '';
  const titre = cible?.refus ?? (cible ? `${c.objet ? `Remplacer ${c.objet.nom}` : `Équiper ici`} — ${texteCa(cible.ca)}` : (c.bloquee ?? (c.objet ? `${c.nom} : ${c.objet.nom}` : `${c.nom} : libre`)));
  return (
    <button
      type="button"
      className={`poupee-case poupee-${c.emplacement.replace('.', '-')}${c.objet ? ' pleine' : ''}${choisie === c.emplacement ? ' choisie' : ''}${c.bloquee ? ' bloquee' : ''}${etat ? ` ${etat}` : ''}`}
      onClick={() => {
        // Un objet du sac en main : un clic sur une case qui l'accepte l'y pose.
        if (enMain && cible && !cible.refus) return jouer({ type: 'equiper', objet: enMain, personnage: h.id, emplacement: c.emplacement });
        onChoisir(c.emplacement);
      }}
      draggable={!!c.objet}
      onDragStart={(ev) => {
        if (!c.objet) return;
        ev.dataTransfer.setData(GLISSE, `case:${c.emplacement}`);
        ev.dataTransfer.effectAllowed = 'move';
        onGlisserCase(c.emplacement);
      }}
      onDragEnd={() => onGlisserCase(undefined)}
      onDragOver={(ev) => {
        if (cible && !cible.refus) {
          ev.preventDefault();
          ev.dataTransfer.dropEffect = 'move';
        }
      }}
      onDrop={(ev) => {
        ev.preventDefault();
        const d = ev.dataTransfer.getData(GLISSE);
        if (d.startsWith('sac:') && cible && !cible.refus) jouer({ type: 'equiper', objet: d.slice(4), personnage: h.id, emplacement: c.emplacement });
      }}
      title={titre}
      aria-label={c.objet ? `${c.nom} : ${c.objet.nom}` : `${c.nom} : libre`}
    >
      {url ? <img src={url} alt="" draggable={false} /> : <span className="poupee-icone">{c.objet ? '◆' : (ICONES[c.emplacement] ?? '·')}</span>}
      <span className="poupee-nom">{c.objet ? c.objet.nom : c.nom}</span>
      {c.objet?.magique && (
        <span className="poupee-magie" aria-hidden>
          ✦
        </span>
      )}
      {cible && !cible.refus && cible.ca.apres !== cible.ca.avant && <span className={`poupee-delta ${cible.ca.apres > cible.ca.avant ? 'plus' : 'moins'}`}>CA {cible.ca.apres > cible.ca.avant ? '+' : ''}{cible.ca.apres - cible.ca.avant}</span>}
    </button>
  );
}

export function PoupeeEquipement(props: Props) {
  const { ctx, heros: h, jouer, potions, onPotions, potionsChoisies } = props;
  const p = poupeeDe(ctx, h);
  const cases = new Map(p.corps.map((c) => [c.emplacement, c]));
  const colonne = (ids: Emplacement[]) => ids.map((s) => <Case key={s} c={cases.get(s)!} props={props} />);
  const horsCombat = h.pv <= 0;

  return (
    <div className="poupee">
      <div className="poupee-silhouette">
        <div className="poupee-colonne">{colonne(['tete', 'dos', 'torse', 'gants', 'pieds'])}</div>
        <div className="poupee-centre">
          <div className="poupee-portrait">
            <Portrait id={h.portrait} espece={h.fiche.espece} classe={h.fiche.classe} taille={150} />
          </div>
          <div className="poupee-jeux">
            {p.jeux.map((j) => (
              <div key={j.jeu} className={`poupee-jeu${j.actif ? ' actif' : ''}`}>
                <div className="poupee-jeu-titre">
                  <strong>Jeu {j.jeu === 1 ? 'I' : 'II'}</strong>
                  {j.actif ? (
                    <span className="poupee-en-main">en main</span>
                  ) : (
                    <button type="button" className="bouton-discret" disabled={horsCombat || !p.autreJeuGarni} onClick={() => jouer({ type: 'changerJeuArmes', personnage: h.id })} title="Prendre ce jeu d'armes en main (hors combat, c'est libre)">
                      Prendre en main
                    </button>
                  )}
                </div>
                <div className="poupee-mains">
                  <Case c={j.droite} props={props} />
                  <Case c={j.gauche} props={props} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="poupee-colonne">
          {colonne(['cou', 'anneau1', 'anneau2', 'ceinture'])}
          <button type="button" className={`poupee-case poupee-potions${potions ? ' pleine' : ''}${potionsChoisies ? ' choisie' : ''}`} onClick={onPotions} title={`Potions de guérison portées : ${potions} (à boire en combat)`}>
            <span className="poupee-icone">🧪</span>
            <span className="poupee-nom">Potions</span>
            <span className="poupee-quantite">×{potions}</span>
          </button>
        </div>
      </div>
      <p className="poupee-aide">Glissez un objet du sac sur une case, ou choisissez-le puis cliquez la case qui s'allume. Droite : arme ; gauche : bouclier ou arme Légère.</p>
    </div>
  );
}
