// Voix des salutations des PNJ. Deux usages :
//
// 1. Les salutations PROPRES d'une histoire (`salutations.neutre`, `amical`, `hostile`, et les `variantes` qui se déclenchent selon ce que
//    le groupe a fait) : chacune est dite avec LA voix du PNJ, celle de son ouverture de conversation (`voixDuPnj` : même genre, même âge,
//    même identifiant, donc le même timbre et le même personnage).
// 2. La BIBLIOTHÈQUE COMMUNE (`packages/regles/src/monde/salutations-communes.json`, partagée par toutes les histoires) : chaque ligne est
//    dite une fois par chacune des 12 voix ; un PNJ secondaire qui nomme un registre (`salutations: { commune: "garde" }`) n'a alors plus
//    rien à écrire ni à faire dire.
//
//   pnpm salutations lister <monde> [--toutes]       les textes d'un monde, la voix de chaque PNJ, ce qui est livré
//   pnpm salutations generer <monde> [--toutes] [--pnj id,id] [--livrer] [--refaire] [--plafond 0.15] [--go]
//   pnpm salutations communes [--registres a,b] [--voix id,id] [--livrer] [--refaire] [--plafond 2] [--go]
//                                                     sans --go : simulation (aucun appel, aucun coût). Avec --toutes (monde) : aussi les
//                                                     salutations d'origine (neutre, amicale, hostile), pas seulement les variantes
//
// Les prises vont dans `sorties/voix-salutations/<monde ou « communes »>/<voix>/<clé>.mp3` (hors de git, avec l'audio brut `.pcm`, écrit dès
// qu'il arrive : une prise payée n'est jamais perdue) ; avec `--livrer`, les MP3 sont copiés dans le jeu (`apps/jeu/src/voix/dialogues/
// <voix>/<clé>.mp3`). La clé est celle du texte (`cleParole`) : un texte modifié a une autre clé, donc sa voix est à refaire. Un texte déjà
// livré n'est pas refait.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ageApproximatif, FichierOuvertures, voixDuPnj, type VoixOuverture } from '../../apps/jeu/src/ouvertures-regles';
import { cheminParole, cleParole, texteDeParole } from '../../apps/jeu/src/paroles-regles';
import { chargerMonde, RACINE_MONDES } from '../../packages/regles/src/monde/chargeur';
import { SALUTATIONS_COMMUNES, TONS_SALUTATION } from '../../packages/regles/src/monde/salutations-communes';
import { empreinte, lireMontant } from '../cle';
import { lireEnv } from '../images/cli';
import { CLE_OPENROUTER, utilisationCle } from '../images/services';
import { coutGeneration, direGemini, durees, enMp3Egalise, filtreLong } from './lecture';

const RACINE = join(import.meta.dirname, '..', '..');
const SORTIES = join(RACINE, 'sorties', 'voix-salutations');
const LIVRAISON = join(RACINE, 'apps', 'jeu', 'src', 'voix', 'dialogues');
const MODELE = 'google/gemini-3.8-flash-tts';
const FICHIER_OUVERTURES = join(RACINE, 'packages', 'donnees', 'repliques', 'ouvertures.json');
/** Estimation du coût d'une prise longue : environ 0,0003 $ par seconde dite (mesure du 10/11/2026 : 41 s pour 0,011 $). */
const DOLLARS_PAR_SECONDE = 0.0003;

/** Le ton de chaque sorte de salutation (court : Google conseille un style bref). */
const STYLE: Record<'neutre' | 'amical' | 'hostile' | 'variante', string> = {
  neutre: 'ton posé et naturel',
  amical: 'chaleureux, accueillant',
  hostile: 'sec, soupçonneux, sur la défensive',
  variante: 'intonations nuancées mais retenues, selon le sens de la phrase',
};

interface Parole {
  /** Le PNJ (ou, pour la bibliothèque, le registre). */
  pnj: string;
  nom: string;
  sorte: keyof typeof STYLE;
  texte: string;
  voix: VoixOuverture;
}

const ouvertures = () => {
  const o = FichierOuvertures.parse(JSON.parse(readFileSync(FICHIER_OUVERTURES, 'utf8')));
  if (!o.voix) throw new Error('Aucune voix choisie dans ouvertures.json.');
  return { ...o, voix: o.voix };
};

function parolesDuMonde(monde: string, toutes: boolean, seulement: string[] | undefined): Parole[] {
  const o = ouvertures();
  const r = chargerMonde(join(RACINE_MONDES, monde));
  if (!r.ok) throw new Error(`Monde illisible : ${r.erreurs.map((e) => e.message).join(' ; ')}`);
  const res: Parole[] = [];
  for (const p of r.monde.pnj.values()) {
    if (seulement && !seulement.includes(p.id)) continue;
    const voix = voixDuPnj(o.voix, p.sexe, p.id, ageApproximatif(p.age));
    const ajouter = (sorte: Parole['sorte'], texte: string | undefined) => {
      if (texte && texte.trim()) res.push({ pnj: p.id, nom: p.nom, sorte, texte: texteDeParole(texte), voix });
    };
    if (toutes) {
      ajouter('neutre', p.salutations.neutre);
      ajouter('amical', p.salutations.amical);
      ajouter('hostile', p.salutations.hostile);
    }
    for (const v of p.salutations.variantes) ajouter('variante', v.texte);
  }
  return res;
}

/** La bibliothèque commune : chaque ligne de chaque registre, dite par chacune des 12 voix (ou celles demandées). */
function parolesCommunes(registres: string[] | undefined, voixDemandees: string[] | undefined): Parole[] {
  const o = ouvertures();
  const voix = [...o.voix.m, ...o.voix.f].filter((v) => !voixDemandees || voixDemandees.includes(v.id));
  const res: Parole[] = [];
  for (const reg of SALUTATIONS_COMMUNES.registres) {
    if (registres && !registres.includes(reg.id)) continue;
    for (const ton of TONS_SALUTATION) for (const texte of reg.lignes[ton]) for (const v of voix) res.push({ pnj: reg.id, nom: `commun/${reg.id}`, sorte: ton, texte: texteDeParole(texte), voix: v });
  }
  return res;
}

/** Le texte à dire : sans les guillemets français (la voix dit la parole, elle ne lit pas la typographie). */
const aDire = (texte: string): string => texte.replace(/^«\s*/, '').replace(/\s*»$/, '').trim();

const livre = (voix: string, texte: string) => join(LIVRAISON, `${cheminParole(voix, texte)}.mp3`);

function cleApi(): string {
  const cle = lireEnv()[CLE_OPENROUTER];
  if (!cle) throw new Error(`Variable ${CLE_OPENROUTER} absente (voir .env.example).`);
  console.log(`Clé utilisée : ${empreinte(cle)} (celle du .env du projet).`);
  return cle;
}

/** Fait dire les paroles (simulation sans `--go`). `dossierSortie` : « communes » ou l'identifiant du monde. */
async function generer(paroles: Parole[], dossierSortie: string, args: string[], plafondParDefaut: number): Promise<void> {
  const option = (nom: string) => {
    const i = args.indexOf(nom);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const go = args.includes('--go');
  const livrer = args.includes('--livrer');
  const refaire = args.includes('--refaire');
  // Un même texte et une même voix ne se disent qu'une fois (deux registres ou deux PNJ peuvent partager une ligne).
  const vus = new Set<string>();
  const uniques = paroles.filter((p) => {
    const k = cheminParole(p.voix.id, p.texte);
    if (vus.has(k)) return false;
    vus.add(k);
    return true;
  });
  const travail = uniques.filter((p) => refaire || !livrer || !existsSync(livre(p.voix.id, p.texte)));
  const secondes = travail.reduce((s, p) => s + durees(aDire(p.texte)).attendue, 0);
  console.log(`${MODELE} : ${travail.length} texte(s) à dire (${uniques.length - travail.length} déjà livré(s)), un appel chacun, ≈ ${secondes.toFixed(0)} s de voix.`);
  for (const nom of [...new Set(travail.map((p) => p.nom))]) {
    const ceux = travail.filter((p) => p.nom === nom);
    const voix = [...new Set(ceux.map((p) => p.voix.id))];
    console.log(`  ${nom.padEnd(28)} ${voix.length === 1 ? `${voix[0]!.padEnd(14)} timbre ${ceux[0]!.voix.timbre.padEnd(14)}` : `${voix.length} voix`.padEnd(30)} ${ceux.length} texte(s)`);
  }
  const estimation = secondes * DOLLARS_PAR_SECONDE;
  if (!go) {
    console.log(`  [simulation] Ajoute --go pour générer réellement (service payant, ≈ ${estimation.toFixed(3)} $ en tout).`);
    return;
  }
  const plafond = lireMontant(option('--plafond'), plafondParDefaut);
  const cle = cleApi();
  const depart = await utilisationCle(cle);
  let faits = 0;
  let refus = 0;
  for (const p of travail) {
    if (faits > 0 && faits % 10 === 0) {
      const maintenant = await utilisationCle(cle);
      if (maintenant !== undefined && depart !== undefined && maintenant - depart > plafond) {
        console.log(`Arrêt : ${(maintenant - depart).toFixed(4)} $ au compteur, au-delà du plafond de ${plafond} $.`);
        break;
      }
    }
    const cleTexte = cleParole(p.texte);
    const dossier = join(SORTIES, dossierSortie, p.voix.id);
    mkdirSync(dossier, { recursive: true });
    const style = `${p.voix.jeu} ; ${STYLE[p.sorte]}`;
    process.stdout.write(`  ${p.nom} (${p.voix.id}) ${cleTexte} « ${aDire(p.texte).slice(0, 50)}… » … `);
    let res: Awaited<ReturnType<typeof direGemini>>;
    try {
      res = await direGemini(aDire(p.texte), { modele: MODELE, voix: p.voix.timbre, style, cle });
    } catch (erreur) {
      refus++;
      console.log(`erreur : ${(erreur as Error).message.slice(0, 200)}`);
      continue;
    }
    faits++;
    // L'audio brut d'abord, sur le disque : il est payé.
    writeFileSync(join(dossier, `${cleTexte}.pcm`), res.pcm);
    let duree = 0;
    let probleme: string | undefined;
    const { attendue, max } = durees(aDire(p.texte));
    if (!res.pcm.length) probleme = 'pas d’audio';
    else {
      duree = enMp3Egalise(res.pcm, join(dossier, `${cleTexte}.mp3`), { frequence: res.frequence, filtre: filtreLong(1) }).duree;
      if (duree > max || duree < attendue / 3) probleme = `durée anormale (${duree.toFixed(1)} s pour ${attendue.toFixed(1)} s attendues)`;
    }
    if (livrer && !probleme) {
      mkdirSync(join(LIVRAISON, p.voix.id), { recursive: true });
      copyFileSync(join(dossier, `${cleTexte}.mp3`), livre(p.voix.id, p.texte));
    }
    writeFileSync(join(dossier, `${cleTexte}.json`), JSON.stringify({ origine: dossierSortie, pnj: p.pnj, texte: p.texte, modele: MODELE, timbre: p.voix.timbre, style, duree: Math.round(duree * 10) / 10, generation: res.generation }, null, 2) + '\n');
    if (probleme) refus++;
    console.log(`${probleme ? `À VÉRIFIER : ${probleme}` : 'ok'} (${duree.toFixed(1)} s)`);
    if (res.generation) {
      const cout = await coutGeneration(res.generation, cle);
      if (cout !== undefined) process.stdout.write(`      ${cout.toFixed(4)} $\n`);
    }
  }
  await new Promise((r) => setTimeout(r, 20_000));
  const fin = await utilisationCle(cle);
  console.log(`Bilan : ${faits - refus} prise(s) bonne(s), ${refus} à vérifier ou en erreur${depart !== undefined && fin !== undefined ? `, ${(fin - depart).toFixed(4)} $ au compteur de la clé` : ''}.`);
}

async function main(): Promise<void> {
  const [commande, ...reste] = process.argv.slice(2);
  const usage = 'Usage : pnpm salutations lister <monde> [--toutes] | generer <monde> [--toutes] [--pnj id,id] [--livrer] [--refaire] [--plafond 0.15] [--go] | communes [--registres a,b] [--voix id,id] [--livrer] [--refaire] [--plafond 2] [--go]';
  if (!commande) return void console.log(usage);
  const liste = (args: string[], nom: string) => {
    const i = args.indexOf(nom);
    return i >= 0 ? args[i + 1]?.split(',').map((x) => x.trim()) : undefined;
  };

  if (commande === 'communes') {
    const paroles = parolesCommunes(liste(reste, '--registres'), liste(reste, '--voix'));
    if (!SALUTATIONS_COMMUNES.registres.length) return void console.log('La bibliothèque commune est vide (packages/regles/src/monde/salutations-communes.json).');
    await generer(paroles, 'communes', reste, 2);
    return;
  }

  const [monde, ...args] = reste;
  if (!monde) return void console.log(usage);
  const paroles = parolesDuMonde(monde, args.includes('--toutes'), liste(args, '--pnj'));
  if (commande === 'lister') {
    console.log(`${paroles.length} texte(s) dans « ${monde} » :`);
    for (const p of paroles) {
      const secondes = durees(aDire(p.texte)).attendue;
      console.log(`  ${existsSync(livre(p.voix.id, p.texte)) ? '✓' : '·'} ${p.nom.padEnd(26)} ${p.voix.id.padEnd(14)} ${p.sorte.padEnd(8)} ${cleParole(p.texte)}  ≈ ${secondes.toFixed(0)} s`);
    }
    return;
  }
  if (commande === 'generer') {
    await generer(paroles, monde, args, 0.15);
    return;
  }
  console.log(usage);
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
