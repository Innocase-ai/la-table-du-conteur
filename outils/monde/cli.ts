// Outils des mondes :
//   pnpm monde lister                 mondes disponibles
//   pnpm monde valider [monde]        validation (références, accessibilité, quêtes, rencontres…) ; code 1 s'il y a des erreurs
//   pnpm monde enigmes [monde]        audit des énigmes : chacune est JOUÉE dans le moteur (bonne, mauvaise, mal formée) ; code 1 s'il y a des erreurs
//   pnpm monde doc [monde]            écrit docs/mondes/<monde>.md depuis les données
//   pnpm monde estimer [monde]        écrit packages/mondes/<monde>/estimation.json (durée et coût d'API, affichés aux joueurs)
//   pnpm monde manque [monde]         ce qui MANQUE : images (lieux, PNJ, objets), cartes, positions, scènes, voix, estimation ; code 1 s'il manque quelque chose
//   pnpm monde parcours [monde] [--etats N] [--ms N] [--graines a,b] [--chemin] [--couvrir]
//                                     un joueur automatique joue le VRAI moteur pour atteindre chaque fin (combats supposés gagnés) ;
//                                     code 1 si une fin n'est pas atteinte (avec ce budget : ce n'est pas une preuve d'impossibilité)
//   pnpm monde nouveau <id> "<Nom>"    crée le squelette d'un nouveau monde (voir .claude/skills/creer-monde)
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chargerDonneesSrd } from '../../packages/regles/src/donnees-node';
import { chargerMonde, listerMondes, RACINE_MONDES } from '../../packages/regles/src/monde/chargeur';
import { diagnostiquerMonde } from '../../packages/regles/src/monde/diagnostiquer';
import { resumerCompletude, verifierCompletude } from '../../packages/regles/src/monde/completude';
import { estimerCampagne } from '../../packages/regles/src/monde/estimation';
import { ManifesteImages } from '../../packages/regles/src/monde/images';
import { idImageCommune } from '../../packages/regles/src/modules/image-commune';
import { scenesDu } from '../../packages/regles/src/modules/scenes';
import { auditerEnigmes, bilanAudit } from '../../packages/regles/src/verification/enigmes';
import { explorerParcours } from '../../packages/regles/src/verification/parcours';
import { genererDocMonde } from './doc';
import { creerSquelette } from './nouveau';

const args = process.argv.slice(2);
/** La valeur d'une option `--nom valeur` (et on la retire des arguments positionnels). */
function option(nom: string): string | undefined {
  const i = args.indexOf(`--${nom}`);
  if (i < 0) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
}
const optEtats = option('etats');
const optMs = option('ms');
const optGraines = option('graines');
const optChemin = args.includes('--chemin');
if (optChemin) args.splice(args.indexOf('--chemin'), 1);
const optCouvrir = args.includes('--couvrir');
if (optCouvrir) args.splice(args.indexOf('--couvrir'), 1);
const [commande, cible, nomMonde] = args;
const mondes = cible ? [cible] : listerMondes();

if (commande === 'nouveau') {
  try {
    const dossier = creerSquelette(RACINE_MONDES, cible ?? '', nomMonde ?? '', { dossier: join(RACINE_MONDES, '../../.claude/skills/creer-monde/assets'), atlas: join(RACINE_MONDES, '../../.claude/skills/decrire-lieux/assets/ATLAS.modele.md') });
    console.log(`Monde créé : ${dossier}\nÉtapes suivantes : remplir BIBLE.md (canon et registre d'identifiants), compléter monde.json, puis lancer les agents de zone (skill creer-monde).`);
    process.exit(0);
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }
}

if (commande === 'lister' || !commande) {
  for (const id of listerMondes()) console.log(id);
  if (!commande) console.log('Usage : pnpm monde lister | valider [monde] | enigmes [monde] | doc [monde] | estimer [monde] | nouveau <id> "<Nom>"');
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
  if (commande === 'estimer') {
    const e = estimerCampagne(r.monde);
    writeFileSync(join(RACINE_MONDES, id, 'estimation.json'), JSON.stringify(e, null, 2) + '\n');
    console.log(`${id} : ${e.tours} tours dont ${e.toursConteur} racontés par le conteur, ≈ ${e.heures.total} h (${e.heures.recit} h de récit, ${e.heures.combats} h de combats)`);
    for (const c of e.couts) console.log(`  ${c.nom.padEnd(18)} ≈ ${c.usd} $ (${c.min} à ${c.max} $)`);
    console.log(`  images du groupe   ≈ ${e.imagesUsd} $`);
    continue;
  }
  if (commande === 'manque') {
    const dossier = join(RACINE_MONDES, id);
    const lireJson = (f: string) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : undefined);
    const manifeste = ManifesteImages.safeParse(lireJson(join(dossier, 'images/manifeste.json')) ?? {});
    const equipement = join(RACINE_MONDES, '../../apps/jeu/src/equipement');
    const noms = (d: string, ext: string) => new Set(existsSync(d) ? readdirSync(d).filter((f) => f.endsWith(ext)).map((f) => f.slice(0, -ext.length)) : []);
    const ecarts = verifierCompletude({
      dm: r.monde,
      manifeste: manifeste.success ? manifeste.data : undefined,
      imagesCommunes: noms(equipement, '.webp'),
      idImageCommune,
      scenes: scenesDu(r.monde).scenes,
      voix: noms(join(dossier, 'voix'), '.mp3'),
      estimationPresente: existsSync(join(dossier, 'estimation.json')),
    });
    const manques = ecarts.filter((x) => x.gravite === 'manque');
    console.log(`\n${manques.length ? '⚠️ ' : '✅'} ${id} — ${manques.length} manque(s), ${ecarts.length - manques.length} avis`);
    for (const [rubrique, n] of resumerCompletude(ecarts)) console.log(`  ${rubrique.padEnd(12)} ${n.manque} manque(s), ${n.avis} avis`);
    for (const x of ecarts) console.log(`  ${x.gravite === 'manque' ? 'MANQUE' : 'avis  '}  [${x.categorie}] ${x.cible} : ${x.detail}`);
    if (manques.length) echec = true;
    continue;
  }
  if (commande === 'parcours') {
    const t0 = Date.now();
    const rap = explorerParcours(
      { dm: r.monde, srd },
      { budgetEtats: optEtats ? Number(optEtats) : 6000, budgetMs: optMs ? Number(optMs) : 120_000, couvrir: optCouvrir, ...(optGraines ? { graines: optGraines.split(',').map(Number) } : {}) },
    );
    const manque = rap.finsNonAtteintes.length > 0;
    console.log(`
${manque ? '⚠️ ' : '✅'} ${id} — ${rap.parcours.length}/${r.monde.fins.size} fins atteintes (${rap.etats} états en ${((Date.now() - t0) / 1000).toFixed(1)} s ; arrêt : ${rap.arret})`);
    for (const p of rap.parcours) {
      console.log(`  ✅ ${p.fin} — ${p.etapes.length} pas (graine ${p.graine})`);
      if (optChemin) p.etapes.forEach((e, i) => console.log(`       ${String(i + 1).padStart(3)}. ${e.libelle}  → ${e.lieu}`));
    }
    for (const f of rap.finsNonAtteintes) console.log(`  ❌ ${f} — non atteinte${rap.arret === 'epuise' ? ' (tous les états ont été explorés)' : ' (budget ou temps épuisé : relancer avec --etats plus grand)'}`);
    const c = rap.couverture;
    console.log('  vu : ' + (['lieux', 'pnj', 'rencontres', 'evenements', 'faits', 'enigmes'] as const).map((k) => `${k} ${c[k].vus.length}/${c[k].vus.length + c[k].jamais.length}`).join(' · '));
    console.log('  hypothèses : ' + rap.hypotheses.join(' '));
    if (manque) echec = true;
    continue;
  }
  if (commande === 'enigmes') {
    const rapports = auditerEnigmes(r.monde, srd);
    console.log(`\nÉnigmes de ${id} : ${rapports.length}`);
    for (const rap of rapports) {
      const manques = rap.verifications.filter((x) => !x.ok);
      const erreurs = manques.filter((x) => x.gravite === 'erreur');
      console.log(`${erreurs.length ? '❌' : manques.length ? '⚠️ ' : '✅'} ${rap.nom} (${rap.type}, ${rap.lieu}) — ${rap.verifications.length - manques.length}/${rap.verifications.length} contrôles`);
      for (const x of manques) console.log(`     ${x.gravite === 'erreur' ? 'ERREUR' : 'avis  '}  [${x.id}] ${x.detail}`);
    }
    const b = bilanAudit(rapports);
    console.log(`\n${b.erreurs ? '❌' : '✅'} ${b.erreurs} erreur(s), ${b.avis} avis sur ${rapports.length} énigmes`);
    if (b.erreurs) echec = true;
    continue;
  }
  // Le diagnostic complet : validateur, modules, audit des énigmes (même sortie qu'avant, voir diagnostiquerMonde).
  const bilan = diagnostiquerMonde(r.monde, srd);
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
