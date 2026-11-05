// Module Interjections : un personnage qui voyage avec le groupe réagit de lui-même à ce qui arrive (voir
// `monde/interjections-donnees.ts`). Chaque interjection se dit une seule fois, quand sa condition devient vraie et que son
// personnage est avec le groupe ; ses effets (approbation, drapeaux) s'appliquent à ce moment-là.
import { pnjPresents } from '../monde/dialogue';
import { evaluerCondition } from '../monde/etat';
import { jouerEffets } from '../monde/exploration';
import { interjectionsDe } from '../monde/interjections-donnees';
import type { Module, Partie, Transaction } from '../noyau/types';
import { partieMonde, verser } from './commun';

export interface EtatInterjections {
  /** Les interjections déjà dites. */
  dites: string[];
}

const etat = (p: Partie): EtatInterjections => ((p.modules['interjections'] ??= { dites: [] }) as EtatInterjections);

/** Le personnage est-il avec le groupe : escorté, ou présent là où il est ? */
function avecLeGroupe(t: Transaction, pnj: string): boolean {
  if ((t.partie.etat.escortes ?? []).includes(pnj)) return true;
  return pnjPresents(partieMonde(t)).some((x) => x.id === pnj);
}

/** Dit les interjections dues : jamais deux fois, jamais par un absent ni par un mort. */
function reagir(t: Transaction): void {
  const es = etat(t.partie);
  for (const i of interjectionsDe(t.ctx.dm).interjections) {
    if (es.dites.includes(i.id)) continue;
    const pnj = t.ctx.dm.pnj.get(i.pnj);
    if (!pnj || (t.partie.etat.pnjEtats[i.pnj] ?? 'vivant') !== 'vivant') continue;
    if (!evaluerCondition(i.quand, t.partie.etat) || !avecLeGroupe(t, i.pnj)) continue;
    es.dites.push(i.id);
    t.emettre({ type: 'texte', texte: i.texte, voix: pnj.nom });
    if (i.effets.length) verser(t, jouerEffets(partieMonde(t), [], i.effets));
  }
}

export const moduleInterjections: Module = {
  id: 'interjections',
  etatInitial: (): EtatInterjections => ({ dites: [] }),
  reactions: {
    arrivee: reagir,
    deplacement: reagir,
    faitAppris: reagir,
    queteMiseAJour: reagir,
    jaugeChange: reagir,
    jourSuivant: reagir,
    objetObtenu: reagir,
    dilemmeTranche: reagir,
    sceneChange: reagir,
  },
  valider: (ctx) => {
    const { interjections, erreurs } = interjectionsDe(ctx.dm);
    const ids = interjections.map((i) => i.id);
    for (const id of ids.filter((x, k) => ids.indexOf(x) !== k)) erreurs.push(`Interjection « ${id} » : identifiant en double.`);
    for (const i of interjections) if (!ctx.dm.pnj.has(i.pnj)) erreurs.push(`Interjection « ${i.id} » : PNJ inconnu « ${i.pnj} ».`);
    return erreurs;
  },
  conseils: (ctx) => {
    const avis: string[] = [];
    const { interjections } = interjectionsDe(ctx.dm);
    const par = new Map<string, number>();
    for (const i of interjections) par.set(i.pnj, (par.get(i.pnj) ?? 0) + 1);
    // Un personnage escorté par un effet du monde doit parler en chemin.
    const escortes = new Set(JSON.stringify([...ctx.dm.evenements.values(), ...ctx.dm.quetes.values(), ...ctx.dm.pnj.values()]).match(/"escorte":\{"pnj":"[a-z0-9-]+"/g)?.map((x) => x.replace(/.*"pnj":"/, '').replace('"', '')) ?? []);
    for (const pnj of escortes) {
      const n = par.get(pnj) ?? 0;
      if (n < 10) avis.push(`Interjections : « ${pnj} » voyage avec le groupe mais n'a que ${n} interjection(s) ; visez 10 à 16 (lieux, faits, quêtes, choix, jauge), dont plusieurs qui changent son approbation (effet \`attitude\`).`);
    }
    for (const i of interjections) if (i.texte.split(/\s+/).length > 45) avis.push(`Interjection « ${i.id} » : plus de 45 mots ; une à deux phrases courtes.`);
    return avis;
  },
};
