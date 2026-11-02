// Outils des mondes :
//   pnpm monde lister                 mondes disponibles
//   pnpm monde valider [monde]        validation (références, accessibilité, quêtes, rencontres…) ; code 1 s'il y a des erreurs
//   pnpm monde doc [monde]            écrit docs/mondes/<monde>.md depuis les données
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chargerDonneesSrd } from '../../packages/regles/src/donnees-node';
import { chargerMonde, listerMondes, RACINE_MONDES } from '../../packages/regles/src/monde/chargeur';
import { validerMonde } from '../../packages/regles/src/monde/validation';
import { genererDocMonde } from './doc';

const [commande, cible] = process.argv.slice(2);
const mondes = cible ? [cible] : listerMondes();

if (commande === 'lister' || !commande) {
  for (const id of listerMondes()) console.log(id);
  if (!commande) console.log('Usage : pnpm monde lister | valider [monde] | doc [monde]');
  process.exit(0);
}

const srd = chargerDonneesSrd();
let echec = false;
for (const id of mondes) {
  const r = chargerMonde(join(RACINE_MONDES, id));
  if (!r.ok) {
    echec = true;
    console.error(`\n❌ ${id} : fichiers invalides`);
    for (const e of r.erreurs) console.error(`  ${e.fichier} — ${e.message}`);
    continue;
  }
  const bilan = validerMonde(r.monde, srd);
  if (commande === 'doc') {
    mkdirSync(join(RACINE_MONDES, '../../docs/mondes'), { recursive: true });
    const chemin = join(RACINE_MONDES, '../../docs/mondes', `${id}.md`);
    writeFileSync(chemin, genererDocMonde(r.monde, srd, bilan));
    console.log(`Document écrit : docs/mondes/${id}.md`);
    continue;
  }
  console.log(`\n${bilan.erreurs.length ? '❌' : '✅'} ${id} — ${bilan.erreurs.length} erreur(s), ${bilan.avertissements.length} avertissement(s)`);
  for (const e of bilan.erreurs) console.log(`  ERREUR  ${e}`);
  for (const a of bilan.avertissements) console.log(`  avis    ${a}`);
  const s = bilan.stats;
  console.log(`  lieux ${JSON.stringify(s.lieux)} · ${s.pnj} PNJ (${s.sujets} sujets) · quêtes ${JSON.stringify(s.quetes)} · ${s.rencontres} rencontres · ${s.tresors} trésors (≈ ${s.valeurTresorsPo} po) · ${s.enigmes} énigmes · ${s.pieges} pièges · ${s.faits} faits`);
  if (bilan.erreurs.length) echec = true;
}
process.exit(echec ? 1 : 0);
