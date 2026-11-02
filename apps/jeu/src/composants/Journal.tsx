import { useEffect, useRef } from 'react';
import type { Evenement } from '@crpg/regles';
import { COULEURS_JOURNAL } from '../libelles';

export function Journal({ journal, longueur }: { journal: Evenement[]; longueur: number }) {
  const fin = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = fin.current?.parentElement;
    if (el) el.scrollTop = el.scrollHeight;
  }, [longueur]);

  const rounds: { round: number; evenements: Evenement[] }[] = [];
  for (const ev of journal.slice(0, longueur)) {
    const dernier = rounds[rounds.length - 1];
    if (dernier && dernier.round === ev.round) dernier.evenements.push(ev);
    else rounds.push({ round: ev.round, evenements: [ev] });
  }

  return (
    <div className="journal">
      <h2>Journal</h2>
      <div className="journal-defilement">
        {rounds.map((r, i) => (
          <section key={i} className="journal-round">
            <h3>Round {r.round}</h3>
            {r.evenements
              .filter((ev) => !(ev.type === 'info' && /^Round \d+\.$/.test(ev.texte)))
              .map((ev, j) => (
                <p key={j} className={`journal-ligne ${COULEURS_JOURNAL[ev.type] ?? ''}`}>
                  {ev.texte}
                </p>
              ))}
          </section>
        ))}
        <div ref={fin} />
      </div>
    </div>
  );
}
