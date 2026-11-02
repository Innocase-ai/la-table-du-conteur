// Simulation d'équilibre : l'IA joue les deux camps sur chaque rencontre du prototype.
// Usage : pnpm simuler [parties=20] [rapide|normale] [rencontre]
import { chargerDonneesSrd } from '../packages/regles/src/donnees-node';
import { IA_NORMALE, IA_RAPIDE, jouerTourIA } from '../packages/regles/src/combat/ia';
import { creerCombat } from '../packages/regles/src/combat/moteur';
import { preparerRencontre, RENCONTRES } from '../packages/regles/src/combat/prototype';

const parties = Number(process.argv[2] ?? 20);
const ia = process.argv[3] === 'normale' ? IA_NORMALE : IA_RAPIDE;
const filtre = process.argv[4];
const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };

for (const r of RENCONTRES.filter((x) => !filtre || x.id === filtre)) {
  let victoires = 0;
  let rounds = 0;
  let pvRestants = 0;
  let herosTombes = 0;
  let herosMorts = 0;
  const debut = Date.now();
  for (let p = 0; p < parties; p++) {
    const { grille, combattants } = preparerRencontre(r, donnees);
    const etat = creerCombat(grille, combattants, 1000 + p);
    while (!etat.vainqueur && etat.round < 30) jouerTourIA(etat, ctx, ia);
    const heros = etat.combattants.filter((c) => c.camp === 'heros');
    if (etat.vainqueur === 'heros') victoires++;
    rounds += etat.round;
    pvRestants += heros.reduce((s, c) => s + c.pv, 0) / heros.reduce((s, c) => s + c.pvMax, 0);
    herosTombes += heros.filter((c) => c.pv <= 0).length;
    herosMorts += heros.filter((c) => c.mort).length;
    if (p === 0 && process.env.JOURNAL) console.log(etat.journal.map((e) => `[${e.round}] ${e.texte}`).join('\n'));
  }
  console.log(
    `${r.nom.padEnd(26)} victoires ${String(Math.round((100 * victoires) / parties)).padStart(3)} %  rounds ${(rounds / parties).toFixed(1)}  PV héros restants ${Math.round((100 * pvRestants) / parties)} %  héros à terre ${(herosTombes / parties).toFixed(1)}  morts ${(herosMorts / parties).toFixed(1)}  (${((Date.now() - debut) / parties / 1000).toFixed(1)} s/partie)`,
  );
}
