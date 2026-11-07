// Voix des ouvertures de conversation des PNJ : chaque ouverture (packages/donnees/repliques/ouvertures.json, les mêmes pour
// toutes les histoires) est dite en version homme (`m`) et femme (`f`) par Gemini Flash TTS (via OpenRouter), avec les
// deux voix choisies à l'oreille (`voix` du même fichier). L'accord de genre (`{ravi|ravie}`) suit la voix.
//
//   pnpm ouvertures lister                                        les ouvertures, les voix choisies, ce qui est livré
//   pnpm ouvertures essai [--types] [--go]                          une même phrase dite par six timbres (3 d'homme, 3 de femme) pour choisir à l'oreille ; --types : six voix plus typées (un personnage derrière le timbre)
//   pnpm ouvertures generer [m|f|tous] [--voix id,id] [--ouvertures id,id] [--livrer] [--refaire] [--plafond 0.05] [--go]
//                                                                  sans --go : simulation (aucun appel, aucun coût) ; ≈ 0,0005 $ par phrase
//
// Les prises vont dans `sorties/voix-ouvertures/<voix>/<id>.mp3` (hors de git, avec l'audio brut `.pcm`, écrit dès qu'il
// arrive : une prise payée n'est jamais perdue) ; avec `--livrer`, les MP3 sont copiés dans le jeu
// (`apps/jeu/src/voix/ouvertures/<voix>/<id>.mp3`). Une phrase déjà livrée n'est pas refaite (sauf `--refaire`).
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FichierOuvertures, LIBELLES_TONS, texteOuverture, type TonOuverture } from '../../apps/jeu/src/ouvertures-regles';
import { empreinte, lireMontant } from '../cle';
import { lireEnv } from '../images/cli';
import { CLE_OPENROUTER, utilisationCle } from '../images/services';
import { coutGeneration, direGemini, durees, enMp3Egalise, filtreLong } from './lecture';

const RACINE = join(import.meta.dirname, '..', '..');
const FICHIER = join(RACINE, 'packages', 'donnees', 'repliques', 'ouvertures.json');
const SORTIES = join(RACINE, 'sorties', 'voix-ouvertures');
const LIVRAISON = join(RACINE, 'apps', 'jeu', 'src', 'voix', 'ouvertures');
const MODELE = 'google/gemini-3.8-flash-tts';

/** Le ton de chaque ouverture, court (Google conseille un style bref). */
const STYLE_TON: Record<TonOuverture, string> = {
  neutre: 'ton posé et naturel, poli',
  amical: 'chaleureux, souriant, accueillant',
  mefiant: 'sec, soupçonneux, sur la défensive',
};

/** Les timbres à comparer à l'oreille : aucun n'est celui d'un héros ni la voix du Maître de jeu (Algieba). */
const ESSAI: { genre: 'm' | 'f'; timbre: string; caractere: string; jeu?: string }[] = [
  { genre: 'm', timbre: 'Charon', caractere: 'informative' },
  { genre: 'm', timbre: 'Umbriel', caractere: 'décontractée' },
  { genre: 'm', timbre: 'Sadaltager', caractere: 'savante' },
  { genre: 'f', timbre: 'Despina', caractere: 'douce' },
  { genre: 'f', timbre: 'Callirrhoe', caractere: 'décontractée' },
  { genre: 'f', timbre: 'Erinome', caractere: 'claire' },
];

/** Des voix plus typées : un vrai personnage derrière le timbre (`--types`), pour comparer avec les voix neutres de l'essai. */
const ESSAI_TYPES: typeof ESSAI = [
  { genre: 'm', timbre: 'Rasalgethi', caractere: 'informative', jeu: 'aubergiste bourru et bon enfant d’un monde de fantasy médiévale, voix grave et posée, un peu rocailleuse' },
  { genre: 'm', timbre: 'Zubenelgenubi', caractere: 'familière', jeu: 'villageois bonhomme et rieur d’un monde de fantasy médiévale, voix chaude et familière' },
  { genre: 'm', timbre: 'Enceladus', caractere: 'soufflée', jeu: 'vieux sage mystérieux d’un monde de fantasy médiévale, voix soufflée, lente et un peu usée' },
  { genre: 'f', timbre: 'Laomedeia', caractere: 'enjouée', jeu: 'commère du village d’un monde de fantasy médiévale, voix vive, rieuse et bavarde' },
  { genre: 'f', timbre: 'Achernar', caractere: 'tendre', jeu: 'vieille guérisseuse d’un monde de fantasy médiévale, voix douce, tendre et un peu usée' },
  { genre: 'f', timbre: 'Erinome', caractere: 'claire', jeu: 'matrone sévère et respectée d’un monde de fantasy médiévale, voix claire, ferme et autoritaire' },
];

const fichier = FichierOuvertures.parse(JSON.parse(readFileSync(FICHIER, 'utf8')));
const livre = (voixId: string, id: string) => join(LIVRAISON, voixId, `${id}.mp3`);

function cleApi(): string {
  const cle = lireEnv()[CLE_OPENROUTER];
  if (!cle) throw new Error(`Variable ${CLE_OPENROUTER} absente (voir .env.example).`);
  console.log(`Clé utilisée : ${empreinte(cle)} (celle du .env du projet).`);
  return cle;
}

async function main(): Promise<void> {
  const [commande, ...args] = process.argv.slice(2);
  const option = (nom: string) => {
    const i = args.indexOf(nom);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const go = args.includes('--go');

  if (commande === 'lister') {
    console.log(`${fichier.ouvertures.length} ouvertures :`);
    for (const t of ['neutre', 'amical', 'mefiant'] as const) console.log(`  ${LIBELLES_TONS[t].padEnd(8)} ${fichier.ouvertures.filter((o) => o.ton === t).length}`);
    console.log(fichier.voix ? `Voix : ${fichier.voix.m.length} d'homme, ${fichier.voix.f.length} de femme.` : 'Voix pas encore choisies : pnpm ouvertures essai.');
    for (const v of [...(fichier.voix?.m ?? []), ...(fichier.voix?.f ?? [])]) console.log(`  ${v.id.padEnd(18)} ${v.timbre.padEnd(14)} livrées ${fichier.ouvertures.filter((o) => existsSync(livre(v.id, o.id))).length} / ${fichier.ouvertures.length}`);
    return;
  }

  if (commande === 'essai') {
    const ouverture = fichier.ouvertures[0]!;
    const serie = args.includes('--types') ? ESSAI_TYPES : ESSAI;
    console.log(`${MODELE} : ${serie.length} timbres, un appel chacun, la même phrase (${ouverture.id}).`);
    for (const e of serie) console.log(`  ${e.genre} ${e.timbre} (${e.caractere}${e.jeu ? ` ; ${e.jeu}` : ''}) — « ${texteOuverture(ouverture, e.genre)} »`);
    if (!go) {
      console.log('  [simulation] Ajoute --go pour générer réellement (service payant, ≈ 0,0005 $ par phrase).');
      return;
    }
    const cle = cleApi();
    const dossier = join(SORTIES, 'essai');
    mkdirSync(dossier, { recursive: true });
    const suffixe = args.includes('--types') ? '-type' : '';
    for (const e of serie) {
      const texte = texteOuverture(ouverture, e.genre);
      const style = `${e.jeu ?? `villageois${e.genre === 'f' ? 'e' : ''} d’un monde de fantasy médiévale, voix naturelle`} ; ${STYLE_TON[ouverture.ton]}`;
      process.stdout.write(`  ${e.timbre} … `);
      try {
        const res = await direGemini(texte, { modele: MODELE, voix: e.timbre, style, cle });
        writeFileSync(join(dossier, `${e.genre}-${e.timbre}${suffixe}.pcm`), res.pcm);
        const { duree } = enMp3Egalise(res.pcm, join(dossier, `${e.genre}-${e.timbre}${suffixe}.mp3`), { frequence: res.frequence, filtre: filtreLong(1) });
        const cout = await coutGeneration(res.generation, cle);
        console.log(`ok (${duree.toFixed(1)} s${cout === undefined ? '' : `, ${cout.toFixed(4)} $`})`);
      } catch (erreur) {
        console.log(`erreur : ${(erreur as Error).message.slice(0, 200)}`);
      }
    }
    console.log(`Prises dans ${dossier}`);
    return;
  }

  if (commande === 'generer') {
    if (!fichier.voix) throw new Error('Aucune voix choisie dans ouvertures.json (`voix.m` et `voix.f`) : lance d’abord `pnpm ouvertures essai`.');
    const demande = args.find((a) => !a.startsWith('--') && ['m', 'f', 'tous'].includes(a)) ?? 'tous';
    const genres = demande === 'tous' ? (['m', 'f'] as const) : ([demande] as ('m' | 'f')[]);
    const ids = option('--ouvertures')?.split(',').map((x) => x.trim());
    if (ids) for (const id of ids) if (!fichier.ouvertures.some((o) => o.id === id)) throw new Error(`Ouverture inconnue : ${id}.`);
    const seules = option('--voix')?.split(',').map((x) => x.trim());
    const livrer = args.includes('--livrer');
    const refaire = args.includes('--refaire');
    const travail = genres.flatMap((genre) =>
      fichier.voix![genre]
        .filter((v) => !seules || seules.includes(v.id))
        .flatMap((voix) =>
          fichier.ouvertures
            .filter((o) => !ids || ids.includes(o.id))
            .filter((o) => refaire || !livrer || !existsSync(livre(voix.id, o.id)))
            .map((o) => ({ genre, o, texte: texteOuverture(o, genre), voix })),
        ),
    );
    console.log(`${MODELE} : ${travail.length} phrase(s) à dire, un appel chacun (pas de nouvel essai automatique).`);
    for (const g of genres) for (const v of fichier.voix[g]) console.log(`  ${v.id.padEnd(18)} ${String(travail.filter((t) => t.voix.id === v.id).length).padStart(3)} phrases, timbre ${v.timbre}`);
    if (travail.length <= 6) for (const t of travail) console.log(`    ${t.voix.id} ${t.o.id} « ${t.texte} »`);
    if (!go) {
      console.log(`  [simulation] Ajoute --go pour générer réellement (service payant, ≈ ${(travail.length * 0.00075).toFixed(3)} $ en tout).`);
      return;
    }
    const plafond = lireMontant(option('--plafond'), 0.05);
    const cle = cleApi();
    const depart = await utilisationCle(cle);
    let faits = 0;
    let refus = 0;
    for (const { genre, o, texte, voix } of travail) {
      if (faits > 0 && faits % 10 === 0) {
        const maintenant = await utilisationCle(cle);
        if (maintenant !== undefined && depart !== undefined && maintenant - depart > plafond) {
          console.log(`Arrêt : ${(maintenant - depart).toFixed(4)} $ au compteur, au-delà du plafond de ${plafond} $.`);
          break;
        }
      }
      const dossier = join(SORTIES, voix.id);
      mkdirSync(dossier, { recursive: true });
      const style = `${voix.jeu} ; ${STYLE_TON[o.ton]}`;
      process.stdout.write(`  ${voix.id} ${o.id} « ${texte} » … `);
      let res: Awaited<ReturnType<typeof direGemini>>;
      try {
        res = await direGemini(texte, { modele: MODELE, voix: voix.timbre, style, cle });
      } catch (erreur) {
        refus++;
        console.log(`erreur : ${(erreur as Error).message.slice(0, 200)}`);
        continue;
      }
      faits++;
      // L'audio brut d'abord, sur le disque : il est payé.
      writeFileSync(join(dossier, `${o.id}.pcm`), res.pcm);
      let duree = 0;
      let probleme: string | undefined;
      const { attendue, max } = durees(texte);
      if (!res.pcm.length) probleme = 'pas d’audio';
      else {
        duree = enMp3Egalise(res.pcm, join(dossier, `${o.id}.mp3`), { frequence: res.frequence, filtre: filtreLong(1) }).duree;
        if (duree > max || duree < attendue / 3) probleme = `durée anormale (${duree.toFixed(1)} s pour ${attendue.toFixed(1)} s attendues)`;
      }
      if (livrer && !probleme) {
        mkdirSync(join(LIVRAISON, voix.id), { recursive: true });
        copyFileSync(join(dossier, `${o.id}.mp3`), livre(voix.id, o.id));
      }
      writeFileSync(join(dossier, `${o.id}.json`), JSON.stringify({ texte, modele: MODELE, timbre: voix.timbre, style, duree: Math.round(duree * 10) / 10, generation: res.generation }, null, 2) + '\n');
      if (probleme) refus++;
      console.log(`${probleme ? `À VÉRIFIER : ${probleme}` : 'ok'} (${duree.toFixed(1)} s)`);
    }
    await new Promise((r) => setTimeout(r, 20_000));
    const fin = await utilisationCle(cle);
    console.log(`Bilan : ${faits - refus} prise(s) bonne(s), ${refus} à vérifier ou en erreur${depart !== undefined && fin !== undefined ? `, ${(fin - depart).toFixed(4)} $ au compteur de la clé` : ''}.`);
    return;
  }

  console.log('Usage : pnpm ouvertures lister | essai [--go] | generer [m|f|tous] [--voix id,id] [--ouvertures id,id] [--livrer] [--refaire] [--plafond 0.05] [--go]');
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
