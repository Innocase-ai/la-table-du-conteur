// Jouer avec le conteur dans le terminal (le vrai modèle, la vraie clé) : pour juger ses récits et mesurer ce qu'un tour
// coûte, avant de passer par l'écran du jeu.
//
//   pnpm conteur [monde] [--essai "texte" "texte"…] [--modele anthropic/claude-haiku-5.5] [--plafond 0.25] [--go]
//
// Dans --essai, une ligne qui commence par ! prépare la scène sans appeler le modèle (gratuit) : !fuite (le groupe se
// replie d'une rencontre), !lieu <id>, !attitude <pnj> <n>, !fait <id>, !drapeau <id>, !issue <rencontre> <victoire|alternative|fuite|defaite>
// [alternative] (la rencontre s'est dénouée ainsi, sous les yeux des PNJ du lieu courant), !parle <pnj> (le groupe lui a parlé).
//
// Sans --go : simulation (aucun appel, aucun coût). Avec --essai : les tours sont joués dans l'ordre ; sinon, chaque ligne
// tapée est un tour. La clé OpenRouter est lue dans `.env` (jamais affichée).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { bilanPersonnage, groupeConseille } from '../../packages/regles/src/creation/groupe';
import { chargerDonneesSrd } from '../../packages/regles/src/donnees-node';
import { creerLLM, evenementsEnTexte, jouerTour, MODELE_CONTEUR, outilsDuConteur, promptSysteme, type Echange } from '../../packages/regles/src/conteur';
import { chargerMonde, RACINE_MONDES } from '../../packages/regles/src/monde/chargeur';
import { consignerIssue, consignerParole, type PartieMonde } from '../../packages/regles/src/monde/exploration';
import { TYPES_ISSUE, type TypeIssue } from '../../packages/regles/src/monde/schemas';
import { MODULES_STANDARD } from '../../packages/regles/src/modules';
import { creerMoteur } from '../../packages/regles/src/noyau/moteur';
import { personnageDepuisFiche } from '../../packages/regles/src/personnage';
import { empreinte, lireMontant } from '../cle';
import { lireEnv } from '../images/cli';
import { CLE_OPENROUTER } from '../images/services';

const args = process.argv.slice(2);
const option = (nom: string) => {
  const i = args.indexOf(nom);
  return i >= 0 ? args[i + 1] : undefined;
};
const essais = (() => {
  const i = args.indexOf('--essai');
  if (i < 0) return [];
  const res: string[] = [];
  for (const a of args.slice(i + 1)) {
    if (a.startsWith('--')) break;
    res.push(a);
  }
  return res;
})();
const idMonde = args[0] && !args[0].startsWith('--') ? args[0] : 'marche-d-ombrefiel';
const modele = option('--modele') ?? MODELE_CONTEUR;
const plafond = lireMontant(option('--plafond'), 0.25);

async function main(): Promise<void> {
  const dossier = join(RACINE_MONDES, idMonde);
  const r = chargerMonde(dossier);
  if (!r.ok) throw new Error(`Monde « ${idMonde} » invalide.`);
  const srd = chargerDonneesSrd();
  const moteur = creerMoteur({ dm: r.monde, srd }, MODULES_STANDARD);
  const bible = readFileSync(join(dossier, 'BIBLE.md'), 'utf8');
  const groupe = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  let partie = moteur.executer(moteur.nouvellePartie(groupe, { graine: 17, niveau: 3 }), { type: 'commencer' }).partie;

  const systeme = promptSysteme(r.monde, bible);
  console.log(
    `${modele} — monde « ${idMonde} » : préfixe fixe ${systeme.length} caractères (≈ ${Math.round(systeme.length / 3.6)} tokens), ${outilsDuConteur(moteur).length} outils, plafond ${plafond} $.`,
  );
  if (!args.includes('--go')) {
    console.log('Simulation : aucun appel. Ajoute --go pour jouer réellement (service payant).');
    for (const t of essais) console.log(`  [tour] ${t}`);
    return;
  }
  const cle = lireEnv()[CLE_OPENROUTER];
  if (!cle) throw new Error(`Variable ${CLE_OPENROUTER} absente (voir .env.example).`);
  console.log(`Clé utilisée : ${empreinte(cle)} (celle du .env du projet).`);
  const llm = creerLLM({ cle, modele });

  let memoire: Echange[] = [];
  let depense = 0;
  const jouer = async (texte: string): Promise<void> => {
    console.log(`\n▶ ${texte}`);
    const avant = partie.journal.length;
    const res = await jouerTour({
      moteur,
      partie,
      texte,
      bible,
      llm,
      memoire,
      surOutil: (o) => console.log(`  ⚙ ${o.nom} ${JSON.stringify(o.args)}${o.refus ? ` → REFUS : ${o.refus}` : ''}`),
    });
    partie = res.partie;
    memoire = res.memoire;
    depense += res.usage.cout;
    // Ce que le moteur a fait pendant le tour, tel que le joueur le lit.
    const evenements = partie.journal.slice(avant).filter((e) => e.type !== 'saisieJoueur' && e.type !== 'recitConteur');
    const resume = evenementsEnTexte(r.monde, evenements);
    if (!resume.startsWith('Fait.'))
      console.log(
        resume
          .split('\n')
          .map((l) => `  │ ${l}`)
          .join('\n'),
      );
    if (res.erreur) console.log(`  ✗ ${res.erreur}`);
    else console.log(`\n${res.recit}\n`);
    if (res.actions.length) console.log(`  Actions : ${res.actions.join(' | ')}`);
    console.log(
      `  ${res.appels} appel(s), ${res.usage.entree} tokens d'entrée (${res.usage.cache} du cache), ${res.usage.sortie} produits, ${res.usage.cout.toFixed(5)} $ ; total ${depense.toFixed(5)} $`,
    );
  };

  if (essais.length) {
    const preparer = (t: string): void => {
      const [cmd, a, b] = t.slice(1).trim().split(/\s+/);
      if (cmd === 'fuite') {
        const res = moteur.executer(partie, { type: 'reglerRencontre', issue: 'fuite' });
        if (!res.refus) partie = res.partie;
      } else if (cmd === 'lieu' && a) partie = { ...partie, etat: { ...partie.etat, lieu: a, lieuxVisites: [...new Set([...partie.etat.lieuxVisites, a])] } };
      else if (cmd === 'attitude' && a) partie.etat.attitudes[a] = Number(b ?? 0);
      else if (cmd === 'fait' && a && !partie.etat.faits.includes(a)) partie.etat.faits.push(a);
      else if (cmd === 'drapeau' && a) partie.etat.flags[a] = true;
      else if (cmd === 'issue' && a && (TYPES_ISSUE as readonly string[]).includes(b ?? '')) consignerIssue({ dm: r.monde, etat: partie.etat as PartieMonde['etat'], groupe: partie.groupe, gen: () => 0 }, a, b as TypeIssue, t.slice(1).trim().split(/s+/)[3]);
      else if (cmd === 'parle' && a) consignerParole({ dm: r.monde, etat: partie.etat as PartieMonde['etat'], groupe: partie.groupe, gen: () => 0 }, a);
      else console.log(`  (préparation inconnue : ${t})`);
      console.log(`  [préparation] ${t.slice(1)}`);
    };
    for (const t of essais) {
      if (t.startsWith('!')) {
        preparer(t);
        continue;
      }
      if (depense >= plafond) {
        console.log(`Plafond de ${plafond} $ atteint : arrêt.`);
        break;
      }
      await jouer(t);
    }
    return;
  }
  const lecteur = createInterface({ input: process.stdin, output: process.stdout });
  console.log('\nÉcris ce que font les héros (ligne vide pour quitter).');
  for (;;) {
    const t = (await lecteur.question('\n> ')).trim();
    if (!t || depense >= plafond) break;
    await jouer(t);
  }
  lecteur.close();
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
