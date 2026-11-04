// Voix des scènes narrées : chaque plan de chaque scène est lu par un modèle audio (OpenRouter, sortie audio en
// streaming), une fois, et livré avec le monde (`packages/mondes/<monde>/voix/<scene>-<plan>.mp3`), gratuit pour le joueur.
//
//   pnpm voix lister <monde>                                      plans, longueur des textes, voix déjà faites
//   pnpm voix generer <monde> [--scene id] [--modele mini|complet] [--voix onyx] [--plafond 0.25] [--go]
//                                                                  sans --go : simulation (aucun appel, aucun coût)
//   VOIX OFFICIELLE du Maître de jeu (Gemini Flash TTS, Algieba, ×1,15) : par défaut ; essai | convertir, voir gemini-scenes.ts
//
// La lecture elle-même (appel, contrôle de fidélité et de durée, MP3) est dans `lecture.ts`.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chargerMonde, RACINE_MONDES } from '../../packages/regles/src/monde/chargeur';
import { scenesDu } from '../../packages/regles/src/modules/scenes';
import { empreinte, lireMontant } from '../cle';
import { lireEnv } from '../images/cli';
import { CLE_OPENROUTER, utilisationCle } from '../images/services';
import { convertir, essai, genererGemini } from './gemini-scenes';
import { durees, enMp3, fidelite, lire, MODELES, VOIX } from './lecture';

/**
 * La consigne : une voix de lecture, pas un conteur qui improvise. Un premier essai a montré que le modèle, laissé
 * « narrateur », lisait le texte puis inventait une suite (« …en cherchant le passage secret ») : d'où les balises,
 * l'arrêt explicite et la vérification de la transcription.
 */
const CONSIGNE =
  'Tu es une voix de lecture française pour un jeu. On te donne un texte entre les balises <texte> et </texte>. ' +
  'Tu le lis à voix haute exactement, mot pour mot, puis tu te tais. Tu n’ajoutes rien avant ni après : pas de suite, pas de commentaire, ' +
  'pas de description, pas de question. Ton : voix grave, posée et chaleureuse de conteur, rythme calme, en français.';

async function main(): Promise<void> {
  const [commande, idMonde, ...args] = process.argv.slice(2);
  const option = (nom: string) => {
    const i = args.indexOf(nom);
    return i >= 0 ? args[i + 1] : undefined;
  };
  if (!idMonde || !['lister', 'generer', 'essai', 'convertir'].includes(commande ?? '')) {
    console.log('Usage : pnpm voix lister <monde> | generer <monde> [--scene id] [--refaire] [--plans 2,3] [--go] (voix officielle : Gemini, Algieba, ×1,15) | generer <monde> --moteur gpt [--modele mini|complet] [--voix onyx] [--go] (ancienne lecture) | essai <monde> --scene id --plan n --timbres A,B,C [--go] | convertir <monde> [--tempo 1.15]');
    return;
  }
  const r = chargerMonde(join(RACINE_MONDES, idMonde));
  if (!r.ok) throw new Error(`Monde « ${idMonde} » invalide.`);
  const dossier = join(RACINE_MONDES, idMonde, 'voix');
  const scenes = scenesDu(r.monde).scenes.filter((s) => !option('--scene') || s.id === option('--scene'));
  const plans = scenes.flatMap((s) => s.plans.map((p, i) => ({ nom: `${s.id}-${i + 1}`, texte: p.texte })));
  // Une voix est faite si son MP3 existe et que le texte lu est encore celui du plan (sinon : texte retouché, à relire).
  const fait = ({ nom, texte }: { nom: string; texte: string }) => {
    if (!existsSync(join(dossier, `${nom}.mp3`))) return false;
    const trace = join(dossier, `${nom}.json`);
    return !existsSync(trace) || (JSON.parse(readFileSync(trace, 'utf8')) as { texte?: string }).texte === texte;
  };
  if (commande === 'lister') {
    for (const p of plans) console.log(`${fait(p) ? '✓' : ' '} ${p.nom.padEnd(32)} ${p.texte.length} caractères`);
    console.log(
      `\n${plans.filter((p) => !fait(p)).length} voix à faire sur ${plans.length} (${plans.reduce((s, p) => s + p.texte.length, 0)} caractères en tout).`,
    );
    return;
  }
  const gemini = { idMonde, plans, dossier, option, args };
  if (commande === 'essai') return essai(gemini);
  if (commande === 'convertir') return convertir(gemini);
  // Gemini est le moteur par défaut (voix officielle du Maître de jeu) ; `--moteur gpt` garde l'ancienne lecture gpt-audio.
  if (option('--moteur') !== 'gpt') return genererGemini(gemini, fait);
  const modele = MODELES[(option('--modele') ?? 'mini') as keyof typeof MODELES];
  const voix = option('--voix') ?? 'onyx';
  if (!modele) throw new Error('Modèle : mini ou complet.');
  if (!(VOIX as readonly string[]).includes(voix)) throw new Error(`Voix : ${VOIX.join(', ')}.`);
  const aFaire = plans.filter((p) => !fait(p));
  console.log(`${modele}, voix ${voix} : ${aFaire.length} plan(s) à lire sur ${plans.length}.`);
  if (!args.includes('--go')) {
    for (const p of aFaire) console.log(`  [simulation] ${p.nom} (${p.texte.length} caractères)`);
    console.log('  Ajoute --go pour générer réellement (service payant).');
    return;
  }
  const plafond = lireMontant(option('--plafond'), 0.25);
  const cle = lireEnv()[CLE_OPENROUTER];
  if (!cle) throw new Error(`Variable ${CLE_OPENROUTER} absente (voir .env.example).`);
  console.log(`Clé utilisée : ${empreinte(cle)} (celle du .env du projet).`);
  mkdirSync(dossier, { recursive: true });
  const depart = await utilisationCle(cle);
  let annonce = 0;
  let echecs = 0;
  for (const p of aFaire) {
    if (annonce > plafond) {
      console.log(`Arrêt : ${annonce.toFixed(4)} $ annoncés, au-delà du plafond de ${plafond} $ (--plafond pour le changer).`);
      break;
    }
    process.stdout.write(`  ${p.nom} … `);
    const { attendue, max } = durees(p.texte);
    // Jusqu'à trois essais : la lecture doit être fidèle au texte (rien d'inventé, rien d'oublié) et de durée normale.
    let reussi = false;
    for (let essai = 1; essai <= 3 && !reussi; essai++) {
      let res: Awaited<ReturnType<typeof lire>>;
      try {
        res = await lire(p.texte, { modele, voix, cle, consigne: CONSIGNE, message: `<texte>${p.texte}</texte>` });
      } catch (e) {
        process.stdout.write(`essai ${essai} : ${(e as Error).message.slice(0, 80)} … `);
        continue;
      }
      annonce += res.cout ?? 0;
      const f = fidelite(p.texte, res.transcription);
      const probleme = res.coupe
        ? `audio coupé au-delà de ${max.toFixed(0)} s`
        : !res.pcm.length
          ? 'pas d’audio'
          : f.retrouves < 0.92 || f.enTrop > 0.08
            ? `infidèle (${Math.round(f.retrouves * 100)} % du texte, ${Math.round(f.enTrop * 100)} % en trop)`
            : undefined;
      if (probleme) {
        process.stdout.write(`essai ${essai} ${probleme} … `);
        continue;
      }
      const chemin = join(dossier, `${p.nom}.mp3`);
      const duree = enMp3(res.pcm, chemin);
      if (duree > max || duree < attendue / 2.5) {
        rmSync(chemin);
        process.stdout.write(`essai ${essai} durée anormale (${duree.toFixed(1)} s pour ${attendue.toFixed(0)} s attendues) … `);
        continue;
      }
      // La transcription reste à côté du fichier : on peut relire ce que le modèle a vraiment dit.
      writeFileSync(
        join(dossier, `${p.nom}.json`),
        JSON.stringify({ texte: p.texte, transcription: res.transcription, modele, voix, duree: Math.round(duree * 10) / 10, cout: res.cout }, null, 2) + '\n',
      );
      console.log(`ok (${duree.toFixed(1)} s, fidélité ${Math.round(f.retrouves * 100)} %${res.cout === undefined ? '' : `, ${res.cout.toFixed(4)} $`})`);
      reussi = true;
    }
    if (!reussi) {
      echecs++;
      console.log('ÉCHEC : fichier non écrit.');
    }
  }
  await new Promise((r2) => setTimeout(r2, 30_000));
  const fin = await utilisationCle(cle);
  console.log(
    `Bilan : ${aFaire.length - echecs} voix faites, ${echecs} échec(s), ${annonce.toFixed(4)} $ annoncés${depart !== undefined && fin !== undefined ? `, ${(fin - depart).toFixed(4)} $ au compteur de la clé` : ''}.`,
  );
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
