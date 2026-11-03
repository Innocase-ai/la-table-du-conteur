// Les morceaux d'écran que partagent l'écran d'aventure et les pages plein écran : la fiche d'information d'un module
// et la bande des héros.
import { etatDurableMax, type Encart, type Personnage } from '@crpg/regles';
import { Portrait } from '../createur/ui';

const NOMS_RESSOURCES: Record<string, string> = {
  potions: 'Potions',
  secondSouffle: 'Second souffle',
  fougue: 'Fougue',
  rages: 'Rages',
  conduit: 'Conduit divin',
};

/** Ressources d'un héros en une ligne : potions, emplacements de sorts restants, usages d'aptitudes. */
function resumeRessources(a: Personnage): { court: string; detail: string } {
  const max = etatDurableMax(a.fiche);
  const sorts = a.emplacements.reduce((s, n) => s + n, 0);
  const sortsMax = max.emplacements.reduce((s, n) => s + n, 0);
  const court = [`Potions ${a.ressources.potions ?? 0}`, sortsMax ? `Sorts ${sorts}/${sortsMax}` : ''].filter(Boolean).join(' · ');
  const detail = Object.entries(a.ressources)
    .map(([k, v]) => `${NOMS_RESSOURCES[k] ?? k} : ${v}${k !== 'potions' && max.ressources[k] !== undefined ? `/${max.ressources[k]}` : ''}`)
    .concat(a.emplacements.map((n, i) => (max.emplacements[i] ? `Emplacements niv. ${i + 1} : ${n}/${max.emplacements[i]}` : '')).filter(Boolean))
    .join('\n');
  return { court, detail };
}

/** Les héros du groupe : portrait, points de vie et ressources. */
export function BandeauHeros({ groupe }: { groupe: Personnage[] }) {
  return (
    <>
      {groupe.map((a) => {
        const res = resumeRessources(a);
        return (
          <div
            key={a.id}
            className={`aventure-heros ${a.pv <= 0 ? 'aventure-heros-tombe' : ''}`}
            title={`${a.nom} — ${a.pv}/${a.fiche.pvMax} PV\n${res.detail}`}
          >
            <Portrait id={a.portrait} espece={a.fiche.espece} classe={a.fiche.classe} taille={40} />
            <div>
              <strong>{a.nom}</strong>
              <div className="barre">
                <div
                  className={`barre-remplie ${a.pv / a.fiche.pvMax > 0.5 ? 'pv-haut' : a.pv / a.fiche.pvMax > 0.25 ? 'pv-moyen' : 'pv-bas'}`}
                  style={{ width: `${(Math.max(0, a.pv) / a.fiche.pvMax) * 100}%` }}
                />
              </div>
              <small className="aventure-ressources">{res.court}</small>
            </div>
          </div>
        );
      })}
    </>
  );
}

/** Une fiche d'information d'un module (potions portées, livre de sorts, quêtes…). */
export function FicheEncart({ e }: { e: Encart }) {
  return (
    <section className="panneau-action encart">
      <h3>{e.titre}</h3>
      {e.texte && <p className="encart-texte">{e.texte}</p>}
      {e.lignes?.map((l, i) => (
        <div key={i} className={`encart-ligne ${l.ton ? `ton-${l.ton}` : ''}`}>
          <div className="encart-tete">
            <span>{l.libelle}</span>
            {l.valeur && <span className="encart-valeur">{l.valeur}</span>}
          </div>
          {l.detail && <p className="encart-detail">{l.detail}</p>}
        </div>
      ))}
    </section>
  );
}
