// Les renseignements d'un monstre pendant le combat : ce que l'on sait de la créature (taille, type, défenses, capacités,
// actions), d'après son profil du SRD et son état actuel. Affichés dans la fiche quand on clique (ou survole) un ennemi.
import { libelleEtat, type Combattant, type Donnees } from '@crpg/regles';

const TAILLES: Record<string, string> = { TP: 'Très petite', P: 'Petite', M: 'Moyenne', G: 'Grande', TG: 'Très grande', Gig: 'Gigantesque' };
const COUTS: Record<string, string> = { action: 'Action', bonus: 'Action bonus', reaction: 'Réaction', gratuit: 'Gratuite' };
const CARACS = [
  ['for', 'FOR'],
  ['dex', 'DEX'],
  ['con', 'CON'],
  ['int', 'INT'],
  ['sag', 'SAG'],
  ['cha', 'CHA'],
] as const;

const signe = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
const liste = (xs: readonly string[]) => xs.map((x) => x.replace(/-/g, ' ')).join(', ');

interface Props {
  c: Combattant;
  donnees: Donnees;
}

export function RenseignementsMonstre({ c, donnees }: Props) {
  const m = donnees.monstres.get(c.modele);
  if (!m) return null;
  const defenses = [
    c.resistances.length ? `Résistances : ${liste(c.resistances)}` : '',
    c.immunites.length ? `Immunités : ${liste(c.immunites)}` : '',
    c.vulnerabilites.length ? `Vulnérabilités : ${liste(c.vulnerabilites)}` : '',
    c.immunitesEtats.length ? `Insensible à : ${c.immunitesEtats.map((e) => libelleEtat(e).toLowerCase()).join(', ')}` : '',
  ].filter(Boolean);
  const sens = [
    m.sens.visionDansLeNoir ? `vision dans le noir ${m.sens.visionDansLeNoir} m` : '',
    m.sens.visionAveugle ? `vision aveugle ${m.sens.visionAveugle} m` : '',
    `Perception passive ${m.sens.perceptionPassive}`,
  ].filter(Boolean);
  return (
    <div className="renseignements-monstre">
      <div className="fiche-bloc">
        <h3>Renseignements</h3>
        <p className="renseignements-type">
          {m.type.charAt(0).toUpperCase() + m.type.slice(1)} de taille {TAILLES[m.taille]?.toLowerCase() ?? m.taille} · FP {m.fp}
        </p>
        {m.description && <p className="renseignements-description">{m.description}</p>}
        <div className="renseignements-caracs" aria-label="Caractéristiques">
          {CARACS.map(([id, abr]) => (
            <div key={id}>
              <span>{abr}</span>
              <strong>{signe(c.mods[id])}</strong>
            </div>
          ))}
        </div>
        <p className="petit">{sens.join(' · ')}</p>
        {m.langues && m.langues !== '—' && <p className="petit">Langues : {m.langues}</p>}
      </div>

      {defenses.length > 0 && (
        <div className="fiche-bloc">
          <h3>Défenses</h3>
          <ul className="renseignements-liste">
            {defenses.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      {m.traits.length > 0 && (
        <div className="fiche-bloc">
          <h3>Capacités</h3>
          <ul className="renseignements-liste">
            {m.traits.map((t) => (
              <li key={t.id}>
                <strong>{t.nom}.</strong> {t.resume}
              </li>
            ))}
          </ul>
        </div>
      )}

      {m.actions.length > 0 && (
        <div className="fiche-bloc">
          <h3>Actions</h3>
          <ul className="renseignements-liste">
            {m.actions.map((a) => (
              <li key={a.id}>
                <strong>{a.nom}</strong>
                <span className="renseignements-cout">
                  {' '}
                  ({COUTS[a.cout] ?? a.cout}
                  {a.recharge ? `, recharge ${a.recharge}` : ''}
                  {a.utilisations ? `, ${a.utilisations.nombre}/${a.utilisations.par === 'jour' ? 'jour' : 'repos'}` : ''})
                </span>
                . {a.resume}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
