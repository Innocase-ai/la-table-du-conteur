// Simulation d'équilibre de HAUT NIVEAU (F6, docs/PRD-SAGA.md) : un monstre légendaire contre le groupe conseillé de six héros, l'IA jouant les deux camps.
// Complète `pnpm simuler` (les six rencontres du prototype, niveau 3), dont la sortie ne doit pas changer : ici, des scénarios à part pour mesurer ce que
// font les actions légendaires et la Résistance légendaire. Graines 1000 à 1000 + parties - 1 (déterministe).
// Usage : pnpm simuler:haut [parties=10] [rapide|normale] [profil]
import { chargerDonneesSrd } from '../packages/regles/src/donnees-node';
import { IA_NORMALE, IA_RAPIDE, jouerTourIA } from '../packages/regles/src/combat/ia';
import { creerCombat } from '../packages/regles/src/combat/moteur';
import { preparerRencontre, RENCONTRES } from '../packages/regles/src/combat/prototype';
import { heroCombatDe } from '../packages/regles/src/personnage';
import { groupeDeTest } from '../packages/regles/src/verification/enigmes';

/** Chaque scénario : un monstre légendaire et le niveau du groupe qui l'affronte (le niveau de son défi, à peu près). */
export const SCENARIOS_HAUT_NIVEAU = [
  { profil: 'aboleth', niveau: 8 },
  { profil: 'vampire', niveau: 12 },
  { profil: 'dragon-blanc-adulte', niveau: 12 },
  { profil: 'dragon-d-airain-adulte', niveau: 12 },
  { profil: 'dragon-rouge-adulte', niveau: 15 },
  { profil: 'liche', niveau: 17 },
  { profil: 'kraken', niveau: 17 },
] as const;

const parties = Number(process.argv[2] ?? 10);
const ia = process.argv[3] === 'normale' ? IA_NORMALE : IA_RAPIDE;
const filtre = process.argv[4];
const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };

for (const s of SCENARIOS_HAUT_NIVEAU.filter((x) => !filtre || x.profil === filtre)) {
  const monstre = donnees.monstres.get(s.profil)!;
  let victoires = 0;
  let rounds = 0;
  let pvRestants = 0;
  let herosTombes = 0;
  let actionsLegendaires = 0;
  let resistances = 0;
  const debut = Date.now();
  for (let p = 0; p < parties; p++) {
    const heros = groupeDeTest(donnees, s.niveau).map(heroCombatDe);
    const { grille, combattants } = preparerRencontre({ ...RENCONTRES[0]!, id: 'haut-niveau', nom: monstre.nom, monstres: [{ profil: s.profil, nombre: 1 }] }, donnees, heros);
    const etat = creerCombat(grille, combattants, 1000 + p);
    while (!etat.vainqueur && etat.round < 30) jouerTourIA(etat, ctx, ia);
    const h = etat.combattants.filter((c) => c.camp === 'heros');
    if (etat.vainqueur === 'heros') victoires++;
    rounds += etat.round;
    pvRestants += h.reduce((t, c) => t + c.pv, 0) / h.reduce((t, c) => t + c.pvMax, 0);
    herosTombes += h.filter((c) => c.pv <= 0).length;
    actionsLegendaires += etat.journal.filter((e) => /dépense une action légendaire/.test(e.texte)).length;
    resistances += etat.journal.filter((e) => /Résistance légendaire/.test(e.texte)).length;
  }
  console.log(
    `${monstre.nom.padEnd(24)} (FP ${monstre.fp.padStart(2)}, niv. ${String(s.niveau).padStart(2)})  victoires ${String(Math.round((100 * victoires) / parties)).padStart(3)} %  rounds ${(rounds / parties).toFixed(1)}  PV héros restants ${Math.round((100 * pvRestants) / parties)} %  héros à terre ${(herosTombes / parties).toFixed(1)}  actions lég. ${(actionsLegendaires / parties).toFixed(1)}  résist. lég. ${(resistances / parties).toFixed(1)}  (${((Date.now() - debut) / parties / 1000).toFixed(1)} s/partie)`,
  );
}
