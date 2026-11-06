// Équilibre des escarmouches adaptées : l'IA joue les deux camps sur chaque thème, à chaque niveau et chaque difficulté,
// avec six héros du groupe conseillé. Sert à caler le coefficient de danger des thèmes (combat/escarmouche.ts).
// Usage : pnpm escarmouches [parties=8] [theme|tous] [niveaux=1,2,3,4,5] [--danger crypte=1.4,camp-hobgobelin=1.5] [--difficultes faible,moderee,elevee]
import { IA_RAPIDE, jouerTourIA } from '../packages/regles/src/combat/ia';
import { creerCombat } from '../packages/regles/src/combat/moteur';
import { composerRencontre, DIFFICULTES, THEMES, type Difficulte } from '../packages/regles/src/combat/escarmouche';
import { preparerRencontre } from '../packages/regles/src/combat/prototype';
import { bilanPersonnage, groupeConseille } from '../packages/regles/src/creation/groupe';
import { chargerDonneesSrd } from '../packages/regles/src/donnees-node';
import { heroCombatDe, personnageDepuisFiche } from '../packages/regles/src/personnage';

const args = process.argv.slice(2);
const option = (nom: string) => {
  const i = args.indexOf(nom);
  return i >= 0 ? args[i + 1] : undefined;
};
const positionnels = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
const parties = Number(positionnels[0] ?? 8);
const filtre = positionnels[1] && positionnels[1] !== 'tous' ? positionnels[1] : undefined;
const niveaux = (positionnels[2] ?? '1,2,3,4,5').split(',').map(Number);
const difficultes = (option('--difficultes') ?? DIFFICULTES.join(',')).split(',') as Difficulte[];
const danger = Object.fromEntries(
  (option('--danger') ?? '')
    .split(',')
    .filter(Boolean)
    .map((x) => x.split('=') as [string, string]),
);

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };

for (const theme of THEMES.filter((t) => !filtre || t.id === filtre)) {
  const t = { ...theme, danger: danger[theme.id] ? Number(danger[theme.id]) : theme.danger };
  for (const niveau of niveaux) {
    const groupe = groupeConseille(niveau, donnees).emplacements.map((p) => {
      const f = bilanPersonnage(p!, donnees).fiche!;
      return heroCombatDe(personnageDepuisFiche(f, { id: f.nom.toLowerCase() }));
    });
    for (const difficulte of difficultes) {
      const r = composerRencontre(
        t,
        groupe.map((h) => h.fiche.niveau),
        difficulte,
        donnees,
      );
      let victoires = 0;
      let rounds = 0;
      let pv = 0;
      let tombes = 0;
      let morts = 0;
      for (let p = 0; p < parties; p++) {
        const { grille, combattants } = preparerRencontre(r, donnees, groupe);
        const etat = creerCombat(grille, combattants, 2000 + p);
        while (!etat.vainqueur && etat.round < 30) jouerTourIA(etat, ctx, IA_RAPIDE);
        const heros = etat.combattants.filter((c) => c.camp === 'heros');
        if (etat.vainqueur === 'heros') victoires++;
        rounds += etat.round;
        pv += heros.reduce((s, c) => s + c.pv, 0) / heros.reduce((s, c) => s + c.pvMax, 0);
        tombes += heros.filter((c) => c.pv <= 0).length;
        morts += heros.filter((c) => c.mort).length;
      }
      const monstres = r.monstres.map((m) => `${m.nombre}×${m.profil}`).join(' ');
      console.log(
        `${theme.id.padEnd(20)} niv ${niveau} ${difficulte.padEnd(7)} PX ${String(r.px).padStart(5)}/${String(Math.round(r.budget / t.danger)).padEnd(5)} victoires ${String(Math.round((100 * victoires) / parties)).padStart(3)} %  rounds ${(rounds / parties).toFixed(1).padStart(4)}  PV ${String(Math.round((100 * pv) / parties)).padStart(3)} %  à terre ${(tombes / parties).toFixed(1)} morts ${(morts / parties).toFixed(1)}  ${monstres}`,
      );
    }
  }
}
