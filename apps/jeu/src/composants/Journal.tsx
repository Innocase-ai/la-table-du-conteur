import { Fragment, useEffect, useRef } from 'react';
import type { Evenement } from '@crpg/regles';
import { COULEURS_JOURNAL } from '../libelles';
import type { Replique } from '../repliques-regles';

interface Ligne {
  ev: Evenement;
  /** Répliques dites juste après cet événement. */
  repliques: Replique[];
}

export function Journal({ journal, longueur, repliques = [] }: { journal: Evenement[]; longueur: number; repliques?: Replique[] }) {
  const fin = useRef<HTMLDivElement>(null);
  const dites = repliques.filter((r) => r.apres <= longueur).length;
  useEffect(() => {
    const el = fin.current?.parentElement;
    if (el) el.scrollTop = el.scrollHeight;
  }, [longueur, dites]);

  const rounds: { round: number; lignes: Ligne[] }[] = [];
  journal.slice(0, longueur).forEach((ev, i) => {
    const ligne = { ev, repliques: repliques.filter((r) => r.apres === i + 1) };
    const dernier = rounds[rounds.length - 1];
    if (dernier && dernier.round === ev.round) dernier.lignes.push(ligne);
    else rounds.push({ round: ev.round, lignes: [ligne] });
  });

  return (
    <div className="journal">
      <h2>Journal</h2>
      <div className="journal-defilement">
        {rounds.map((r, i) => (
          <section key={i} className="journal-round">
            <h3>Round {r.round}</h3>
            {r.lignes.map(({ ev, repliques: dites }, j) => (
              <Fragment key={j}>
                {!(ev.type === 'info' && /^Round \d+\.$/.test(ev.texte)) && <p className={`journal-ligne ${COULEURS_JOURNAL[ev.type] ?? ''}`}>{ev.texte}</p>}
                {dites.map((x, k) => (
                  <p key={k} className="journal-ligne journal-replique">
                    <strong>{x.nom}</strong> : « {x.texte} »
                  </p>
                ))}
              </Fragment>
            ))}
          </section>
        ))}
        <div ref={fin} />
      </div>
    </div>
  );
}
