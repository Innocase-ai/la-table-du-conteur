// Outils des mondes :
//   pnpm monde lister                 mondes disponibles
//   pnpm monde valider [monde]        validation (références, accessibilité, quêtes, rencontres…) ; code 1 s'il y a des erreurs
//   pnpm monde enigmes [monde]        audit des énigmes : chacune est JOUÉE dans le moteur (bonne, mauvaise, mal formée) ; code 1 s'il y a des erreurs
//   pnpm monde doc [monde]            écrit docs/mondes/<monde>.md depuis les données
//   pnpm monde estimer [monde]        écrit packages/mondes/<monde>/estimation.json (durée et coût d'API, affichés aux joueurs)
//   pnpm monde manque [monde]         ce qui MANQUE : images (lieux, PNJ, objets), cartes, positions, scènes, voix, estimation ; code 1 s'il manque quelque chose
//   pnpm monde parcours [monde] [--etats N] [--ms N] [--graines a,b] [--chemin] [--couvrir]   (--couvrir liste aussi ce qui n'est jamais vu ; --frontiere N : états en attente au plus, 40 000 par défaut, 4 000 avec --couvrir)
//                                     un joueur automatique joue le VRAI moteur pour atteindre chaque fin (combats supposés gagnés) ;
//                                     code 1 si une fin n'est pas atteinte (avec ce budget : ce n'est pas une preuve d'impossibilité)
//   pnpm monde verifier [monde] [--sans-parcours] [--etats N] [--ms N] [--graines a,b]
//                                     le bilan complet en une commande (point V8) : validation, ce qui manque, estimation à jour, revue de secrets du canon, fins prouvées ;
//                                     code 1 si une rubrique bloque la publication
//   pnpm monde nouveau <id> "<Nom>"    crée le squelette d'un nouveau monde (voir .claude/skills/creer-monde)
//   pnpm monde importer-forge <fichier.forge.json> <id-monde> [--niveaux 1-2] [--heures 1]
//                                     convertit une conception de la Forge d'Histoires (RPGMakerStory) en NOUVEAU monde brouillon, avec RAPPORT-FORGE.md (docs/FORGE.md)
//   pnpm monde campagne              le registre des échos de campagne (émis et lus) de tous les épisodes, et son contrôle entre épisodes ; code 1 s'il y a une erreur (F5)
//   pnpm monde quete <fiche.json> [monde] [--ecrire]   la fiche de quête (but, donneur, cible, verbes, butin) produit le JSON des étapes et les sujets des PNJ ; --ecrire écrit la quête dans quetes/ (F3)
//   pnpm monde quetes [monde] [--parcours] [--etats N] [--ms N]   avis de quêtes (fiche F3) ; --parcours joue chaque quête avec le parcours automatique ; code 1 si l'une n'est pas terminée
//   pnpm monde calibrer <temps-de-jeu.json>   compare le temps de jeu mesuré (export de l'écran Options) à la durée estimée de chaque histoire
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chargerDonneesSrd } from '../../packages/regles/src/donnees-node';
import { chargerMonde, listerMondes, RACINE_MONDES as RACINE_DEPOT } from '../../packages/regles/src/monde/chargeur';
import { registreDeCampagne, validerCampagne } from '../../packages/regles/src/monde/campagne';
import { diagnostiquerMonde } from '../../packages/regles/src/monde/diagnostiquer';
import { resumerCompletude } from '../../packages/regles/src/monde/completude';
import { problemesDeChargement } from '../../packages/regles/src/monde/assemblage';
import { estimerCampagne } from '../../packages/regles/src/monde/estimation';
import { auditerEnigmes, bilanAudit } from '../../packages/regles/src/verification/enigmes';
import { bilanDesQuetes, genererDepuisFichier } from './quetes-cli';
import { explorerParcours } from '../../packages/regles/src/verification/parcours';
import { calibrer, texteCalibrage } from './calibrer';
import { COMMANDES, lignesParcours, lireOptions, USAGE } from './cli-aide';
import { genererDocMonde } from './doc';
import { ecrireMondeForge, messagePourClaude } from './importer-forge';
import { creerSquelette } from './nouveau';
import { afficherBilan, classerAvis, completudeDuMonde, lireRevue, verifierMonde } from './verifier';

/** Le dossier des mondes : `MONDES_RACINE` (les tests du CLI travaillent dans un dossier temporaire) ou celui du dépôt. */
const RACINE_MONDES = process.env['MONDES_RACINE'] ?? RACINE_DEPOT;

// Les options sont lues strictement : une valeur mal écrite est refusée, jamais ignorée en silence (audit du 18/11/2026, O8).
let lues: ReturnType<typeof lireOptions>;
try {
  lues = lireOptions(process.argv.slice(2));
} catch (e) {
  console.error(`❌ ${(e as Error).message}
${USAGE}`);
  process.exit(1);
}
const { options: opt, positionnels: args } = lues;
const [commande, cible, nomMonde] = args;
// Une commande inconnue (faute de frappe : `verifie`, `manquee`) ne lance plus la validation : elle est refusée (O1).
if (commande && !(COMMANDES as readonly string[]).includes(commande)) {
  console.error(`❌ Commande inconnue « ${commande} ».
${USAGE}`);
  process.exit(1);
}
const mondes = cible ? [cible] : listerMondes(RACINE_MONDES);

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

if (commande === 'importer-forge') {
  // Une conception de la Forge d'Histoires (RPGMakerStory) devient un NOUVEAU monde en brouillon (docs/FORGE.md).
  if (!cible || !nomMonde) {
    console.error('Usage : pnpm monde importer-forge <fichier.forge.json> <id-monde> [--niveaux 1-2] [--heures 1]');
    process.exit(1);
  }
  try {
    const profils = [...chargerDonneesSrd().monstres.keys()];
    const { dossier, resultat } = ecrireMondeForge(
      RACINE_MONDES,
      nomMonde,
      cible,
      JSON.parse(readFileSync(cible, 'utf8')),
      { dossier: join(RACINE_MONDES, '../../.claude/skills/creer-monde/assets'), atlas: join(RACINE_MONDES, '../../.claude/skills/decrire-lieux/assets/ATLAS.modele.md') },
      { profils, armes: [...chargerDonneesSrd().armes.keys()], ...(opt.niveaux ? { niveaux: opt.niveaux } : {}), ...(opt.heures ? { heures: opt.heures } : {}) },
    );
    const n = (d: string) => resultat.dossiers[d]?.length ?? 0;
    console.log(`Monde brouillon créé : ${dossier}\n  ${n('lieux')} lieux, ${n('pnj')} PNJ, ${n('objets')} objets, ${n('tresors')} trésors, ${n('rencontres')} rencontres, ${n('quetes')} quêtes ; ${resultat.aEcrire} champ(s) « À écrire ».`);
    for (const a of resultat.avertissements) console.log(`  avis  ${a}`);
    console.log(`Rapport : ${join(dossier, 'RAPPORT-FORGE.md')}\nBrief d'écriture : ${join(dossier, 'BRIEF-ECRITURE.md')}\nÉtape suivante : pnpm monde valider ${nomMonde}, puis remplir les « À écrire » ; message pour Claude :\n  ${messagePourClaude(nomMonde)}`);
    process.exit(0);
  } catch (e) {
    console.error(`❌ ${(e as Error).message}`);
    process.exit(1);
  }
}

if (commande === 'calibrer') {
  // Le temps de jeu mesuré (export de l'écran Options) contre la durée estimée de chaque histoire.
  if (!cible) {
    console.error('Usage : pnpm monde calibrer <temps-de-jeu.json>  (le fichier exporté par Options > Temps de jeu)');
    process.exit(1);
  }
  let texte: string;
  try {
    texte = readFileSync(cible, 'utf8');
  } catch {
    console.error(`❌ Fichier illisible : ${cible}`);
    process.exit(1);
  }
  const estimations = new Map<string, ReturnType<typeof estimerCampagne>>();
  for (const id of listerMondes(RACINE_MONDES)) {
    const r = chargerMonde(join(RACINE_MONDES, id));
    if (r.ok) estimations.set(id, estimerCampagne(r.monde));
  }
  const res = calibrer(texte, estimations);
  console.log(texteCalibrage(res));
  process.exit(res.erreur ? 1 : 0);
}

if (commande === 'campagne') {
  const charges = listerMondes(RACINE_MONDES).map((id) => ({ id, r: chargerMonde(join(RACINE_MONDES, id)) }));
  const invalides = charges.filter((c) => !c.r.ok);
  for (const c of invalides) console.error(`❌ ${c.id} : fichiers invalides, ses échos ne sont pas lus`);
  const dms = charges.flatMap((c) => (c.r.ok ? [c.r.monde] : []));
  const reg = registreDeCampagne(dms);
  const { erreurs, avis } = validerCampagne(dms);
  console.log(`\nCampagne : ${reg.emis.length} écho(s) émis, ${new Set(reg.lus.map((l) => l.id)).size} lu(s) par ${new Set(reg.lus.map((l) => l.monde)).size} épisode(s), sur ${dms.length} monde(s)`);
  for (const e of reg.emis) console.log(`  ${e.id.padEnd(34)} émis par ${e.monde} — ${e.phrase}`);
  for (const l of reg.lus) console.log(`  lu : ${l.id.padEnd(30)} ${l.monde} (${l.ou})`);
  for (const m of erreurs) console.error(`  ❌ ${m}`);
  for (const m of avis) console.warn(`  ⚠️  ${m}`);
  console.log(erreurs.length || invalides.length ? '\n❌ La campagne a des erreurs.' : '\n✅ Aucune erreur entre épisodes.');
  process.exit(erreurs.length || invalides.length ? 1 : 0);
}

if (commande === 'quete') {
  // La fiche de quête : `pnpm monde quete <fiche.json> [monde] [--ecrire]` (le monde est facultatif : sans lui, la structure seule).
  if (!cible) {
    console.error('Usage : pnpm monde quete <fiche.json> [monde] [--ecrire]');
    process.exit(1);
  }
  let dm;
  if (nomMonde) {
    const r = chargerMonde(join(RACINE_MONDES, nomMonde));
    if (!r.ok) {
      console.error(`❌ ${nomMonde} : fichiers invalides`);
      for (const e of r.erreurs) console.error(`  ${e.fichier} — ${e.message}`);
      process.exit(1);
    }
    dm = r.monde;
  }
  const res = genererDepuisFichier(cible, { ...(dm ? { dm, srd: chargerDonneesSrd(), dossierMonde: join(RACINE_MONDES, nomMonde!) } : {}), ecrire: opt.ecrire });
  for (const l of res.lignes) console.log(l);
  process.exit(res.echec ? 1 : 0);
}

if (commande === 'lister' || !commande) {
  for (const id of listerMondes(RACINE_MONDES)) console.log(id);
  if (!commande) console.log(USAGE);
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
  // `valider`, `verifier` et `doc` passent par le diagnostic complet, qui dit déjà tout ceci ; les autres commandes le disent ici : sans cela,
  // elles jouent, comptent ou estiment un monde amputé de ses fiches invalides, sans prévenir.
  if (['estimer', 'manque', 'parcours', 'enigmes'].includes(commande ?? '')) {
    const pb = problemesDeChargement(r.monde);
    for (const e of pb.erreurs) console.error(`  ❌ ${id} — fiche écartée par le jeu : ${e}`);
    for (const a of pb.avis) console.warn(`  ⚠️  ${id} — ${a}`);
    if (pb.erreurs.length) {
      echec = true;
      if (commande === 'estimer') {
        console.error(`  ${id} : estimation non écrite (corrigez d'abord ces fiches).`);
        continue;
      }
    }
  }
  if (commande === 'quetes') {
    const res = bilanDesQuetes(id, r.monde, srd, { parcours: opt.parcours, ...(opt.etats ? { etats: opt.etats } : {}), ...(opt.ms ? { ms: opt.ms } : {}), ...(opt.graines ? { graines: opt.graines } : {}) });
    for (const l of res.lignes) console.log(l);
    if (res.echec) echec = true;
    continue;
  }
  if (commande === 'verifier') {
    const b = verifierMonde(id, join(RACINE_MONDES, id), r.monde, srd, { parcours: !opt.sansParcours, ...(opt.etats ? { etats: opt.etats } : {}), ...(opt.ms ? { ms: opt.ms } : {}), ...(opt.graines ? { graines: opt.graines } : {}) });
    for (const l of afficherBilan(b)) console.log(l);
    if (!b.ok) echec = true;
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
    let ecarts: ReturnType<typeof completudeDuMonde>;
    try {
      ecarts = completudeDuMonde(join(RACINE_MONDES, id), r.monde);
    } catch (e) {
      console.error(`
❌ ${id} — ${(e as Error).message}`);
      echec = true;
      continue;
    }
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
      { budgetEtats: opt.etats ?? 6000, budgetMs: opt.ms ?? 120_000, couvrir: opt.couvrir, ...(opt.frontiere ? { frontiereMax: opt.frontiere } : {}), ...(opt.graines ? { graines: opt.graines } : {}) },
    );
    const lignes = lignesParcours(id, r.monde.fins.size, rap, (Date.now() - t0) / 1000);
    const manque = lignes.echec;
    console.log(lignes.entete);
    for (const p of rap.parcours) {
      console.log(`  ✅ ${p.fin} — ${p.etapes.length} pas (graine ${p.graine})`);
      if (opt.chemin) p.etapes.forEach((e, i) => console.log(`       ${String(i + 1).padStart(3)}. ${e.libelle}  → ${e.lieu}`));
    }
    for (const l of lignes.manquantes) console.log(l);
    const c = rap.couverture;
    console.log('  vu : ' + (['lieux', 'pnj', 'rencontres', 'evenements', 'faits', 'enigmes'] as const).map((k) => `${k} ${c[k].vus.length}/${c[k].vus.length + c[k].jamais.length}`).join(' · '));
    if (opt.couvrir) {
      // Ce que le joueur automatique n'a jamais vu (pas une preuve d'inaccessibilité : il est limité par son budget). Les rencontres tirées au hasard à l'arrivée (« auto-… ») sont comptées à part.
      for (const k of ['lieux', 'pnj', 'rencontres', 'evenements', 'faits', 'enigmes', 'quetes'] as const) {
        const jamais = c[k].jamais;
        const auto = jamais.filter((x) => x.startsWith('auto-'));
        const reste = jamais.filter((x) => !x.startsWith('auto-'));
        if (reste.length || auto.length) console.log(`  jamais vus — ${k} (${reste.length}${auto.length ? ` + ${auto.length} tirages au hasard` : ''}) : ${reste.join(', ') || '—'}`);
      }
    }
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
    if (bilan.erreurs.length) {
      for (const e of bilan.erreurs) console.error(`  ERREUR  ${e}`);
      console.error(`❌ ${id} — ${bilan.erreurs.length} erreur(s) : le document est écrit, mais le monde n'est pas valide.`);
      echec = true;
    }
    continue;
  }
  // revue.json : les avis jugés sans objet (rejetés) et les défauts acceptés avec leur raison ne sont pas répétés ici ; leur nombre est dit.
  let revue;
  try {
    revue = lireRevue(join(RACINE_MONDES, id));
  } catch (e) {
    console.error(`  ⚠️  ${id} — ${(e as Error).message} : ses rejets ne sont pas appliqués.`);
  }
  const classes = revue ? classerAvis(bilan, revue) : undefined;
  const ecartes = classes ? new Set([...classes.rejetes, ...classes.acceptes]) : new Set();
  const lignes = classes ? classes.lignes.filter((l) => !ecartes.has(l)) : bilan.avertissements.map((texte) => ({ texte }));
  console.log(`\n${bilan.erreurs.length ? '❌' : '✅'} ${id} — ${bilan.erreurs.length} erreur(s), ${lignes.length} avertissement(s)${ecartes.size ? ` (${ecartes.size} rejeté(s) ou accepté(s) dans revue.json)` : ''}`);
  for (const e of bilan.erreurs) console.log(`  ERREUR  ${e}`);
  for (const l of lignes) console.log(`  avis    ${l.texte}`);
  const s = bilan.stats;
  console.log(`  lieux ${JSON.stringify(s.lieux)} · ${s.pnj} PNJ (${s.sujets} sujets) · quêtes ${JSON.stringify(s.quetes)} · ${s.rencontres} rencontres · ${s.tresors} trésors (≈ ${s.valeurTresorsPo} po) · ${s.enigmes} énigmes · ${s.pieges} pièges · ${s.faits} faits`);
  if (bilan.erreurs.length) echec = true;
}
process.exit(echec ? 1 : 0);
