// Voix des cris de combat : chaque cri (packages/donnees/repliques/cris.json, les mêmes pour tous) est dit par un vrai
// moteur de synthèse vocale, Gemini Flash TTS (Google, via OpenRouter), avec la voix de la race et du genre
// (packages/donnees/repliques/voix.json : `nain-f`, `elfe-m`…), la même pour tous les cris : c'est la cohérence d'une voix.
//
//   pnpm repliques lister                                           voix, cris, voix déjà livrées
//   pnpm repliques voix <voix|tous> [--lignes situation:n,…] [--modele flash|lite] [--tempo 1.25]
//                                   [--livrer] [--refaire] [--cout] [--plafond 0.05] [--go]
//                                                                    sans --go : simulation (aucun appel, aucun coût)
//   pnpm repliques dire <voix> "<texte>" [--ton "…"] [--tempo 1] [--sortie fichier.mp3] [--go]
//                                                                    une phrase libre (histoire, dialogue) avec la voix d'une race : mêmes timbres, texte quelconque
//   pnpm repliques convertir <voix|tous> [--tempo 1.25] [--livrer]   refait les MP3 (débit, volume égalisé) depuis l’audio brut, sans appel
//
// Premier essai (04/11/2026) avec gpt-audio, un modèle de conversation qui parle : jugé « robotique » par l'utilisateur.
// Un moteur de synthèse vocale joue bien mieux : on lui donne le texte exact et, à part, le style (`instructions`,
// transmis à Gemini comme `speech_metadata.style`) ; il ne lit pas le style à voix haute. Débit ×1,25, validé à l'oreille.
// Documentation lue le 04/11/2026 : https://openrouter.ai/docs/guides/overview/multimodal/tts (POST /api/v1/audio/speech,
// réponse en octets bruts, PCM seulement pour Gemini, en-tête X-Generation-Id) et
// https://aistudio.google.com/docs/speech-generation (voix, style court, balises <sigh> <gasp> en anglais).
//
// Les prises vont dans `sorties/voix-repliques/<voix>/` (hors de git) : l'audio brut (.pcm) est écrit dès qu'il arrive,
// une prise payée n'est jamais perdue. Avec `--livrer`, le MP3 est aussi copié dans le jeu
// (`apps/jeu/src/voix/<voix>/<situation>-<n>.mp3`) ; un cri déjà livré n'est pas refait (sauf `--refaire`).
// L'accord de genre d'un cri (`{blessé|blessée}`) suit le genre de la voix.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { accorder, FichierCris, FichierVoix, SITUATIONS, type Situation } from '../../apps/jeu/src/repliques-regles';
import { empreinte, lireMontant } from '../cle';
import { lireEnv } from '../images/cli';
import { CLE_OPENROUTER, utilisationCle } from '../images/services';
import { durees, enMp3Egalise, filtreLong, filtreReplique } from './lecture';

const RACINE = join(import.meta.dirname, '..', '..');
const DOSSIER_REPLIQUES = join(RACINE, 'packages', 'donnees', 'repliques');
const SORTIES = join(RACINE, 'sorties', 'voix-repliques');
const LIVRAISON = join(RACINE, 'apps', 'jeu', 'src', 'voix');

const MODELES = { flash: 'google/gemini-3.8-flash-tts', lite: 'google/gemini-3.8-flash-lite-tts' } as const;
/** Les 30 voix de Gemini (Google AI Studio, 04/11/2026), avec leur caractère. */
export const VOIX_GEMINI: Record<string, string> = {
  Zephyr: 'brillante', Puck: 'enjouée', Charon: 'informative', Kore: 'ferme', Fenrir: 'excitable', Leda: 'juvénile',
  Orus: 'ferme', Aoede: 'légère', Callirrhoe: 'décontractée', Autonoe: 'brillante', Enceladus: 'soufflée', Iapetus: 'claire',
  Umbriel: 'décontractée', Algieba: 'douce', Despina: 'douce', Erinome: 'claire', Algenib: 'rocailleuse', Rasalgethi: 'informative',
  Laomedeia: 'enjouée', Achernar: 'tendre', Alnilam: 'ferme', Schedar: 'égale', Gacrux: 'mûre', Pulcherrima: 'directe',
  Achird: 'amicale', Zubenelgenubi: 'familière', Vindemiatrix: 'douce', Sadachbia: 'vive', Sadaltager: 'savante', Sulafat: 'chaleureuse',
};

/** Le ton de la situation, court (Google conseille un style bref). Ce sont des cris de combat, pas du dialogue. */
const TON_SITUATIONS: Record<Situation, string> = {
  'debut-combat': 'cri de guerre, énergique, en criant',
  blesse: 'grogne de douleur, bref, serre les dents',
  'grievement-blesse': 'crie à l’aide, à bout de souffle, urgence, en criant',
  releve: 'revient à lui, essoufflé, soulagé, bref',
  soigne: 'reconnaissant, bref',
  'critique-donne': 'cri de triomphe, exalté, en criant',
  'critique-recu': 'cri de douleur, sonné, bref',
  'ennemi-abattu': 'sec, bref, satisfait',
  'allie-tombe': 'crie l’alarme, affolé, en criant',
  rate: 'agacé, bref',
  'rate-encore': 'exaspéré, bref',
  victoire: 'crie victoire, exalté, en criant',
};

const cris = FichierCris.parse(JSON.parse(readFileSync(join(DOSSIER_REPLIQUES, 'cris.json'), 'utf8')));
const voixDispo = FichierVoix.parse(JSON.parse(readFileSync(join(DOSSIER_REPLIQUES, 'voix.json'), 'utf8')));

interface Phrase {
  situation: Situation;
  numero: number;
  /** Le cri, accordé au genre de la voix : ce que Gemini doit dire. */
  texte: string;
}

/** Les cris d'une voix (`nain-f`) : tous, ou ceux de `--lignes debut-combat:1,victoire:2` (numéros à partir de 1). */
function phrasesDe(voix: string, lignes: string | undefined): Phrase[] {
  const feminin = voix.endsWith('-f');
  const tous = SITUATIONS.flatMap((situation) => cris.situations[situation].map((texte, i) => ({ situation, numero: i + 1, texte: accorder(texte, feminin) })));
  if (!lignes) return tous;
  return lignes.split(',').map((x) => {
    const [s, n] = x.trim().split(':');
    const p = tous.find((q) => q.situation === s && q.numero === Number(n));
    if (!p) throw new Error(`Cri inconnu : ${x} (situation:numéro).`);
    return p;
  });
}

const livre = (voix: string, p: Phrase) => join(LIVRAISON, voix, `${p.situation}-${p.numero}.mp3`);

/** Une phrase dite par Gemini : l'audio PCM (16 bits, mono) tel que reçu, son débit, et l'identifiant de la génération. */
async function dire(texte: string, options: { modele: string; voix: string; style: string; cle: string }): Promise<{ pcm: Buffer; frequence: number; generation?: string }> {
  const rep = await fetch('https://openrouter.ai/api/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${options.cle}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: options.modele, input: texte, voice: options.voix, instructions: options.style, response_format: 'pcm' }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!rep.ok) throw new Error(`HTTP ${rep.status} — ${(await rep.text()).slice(0, 500)}`);
  const type = rep.headers.get('content-type') ?? '';
  const frequence = Number(/rate=(\d+)/.exec(type)?.[1] ?? 24000);
  return { pcm: Buffer.from(await rep.arrayBuffer()), frequence, generation: rep.headers.get('x-generation-id') ?? undefined };
}

/** Le coût d'une génération, lu après coup (appel gratuit ; la fiche met quelques secondes à apparaître). */
async function coutDe(generation: string | undefined, cle: string): Promise<number | undefined> {
  if (!generation) return undefined;
  for (let i = 0; i < 4; i++) {
    await new Promise((r) => setTimeout(r, 2500));
    const rep = await fetch(`https://openrouter.ai/api/v1/generation?id=${encodeURIComponent(generation)}`, { headers: { Authorization: `Bearer ${cle}` } });
    if (rep.ok) return ((await rep.json()) as { data?: { total_cost?: number } }).data?.total_cost;
  }
  return undefined;
}

async function main(): Promise<void> {
  const [commande, voixDemandee, ...args] = process.argv.slice(2);
  const option = (nom: string) => {
    const i = args.indexOf(nom);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const tempo = Number((option('--tempo') ?? '1.25').replace(',', '.'));
  if (!(tempo >= 0.8 && tempo <= 1.6)) throw new Error('--tempo : entre 0,8 et 1,6 (1,25 par défaut).');
  const toutes = Object.keys(voixDispo);
  if (commande === 'dire' && voixDemandee) {
    // Une phrase libre dite par la voix d'une race (histoires, dialogues) : les mêmes timbres que les cris, tout autre texte.
    const texte = args.find((a, i) => !a.startsWith('--') && (i === 0 || !args[i - 1]!.startsWith('--')));
    const reglage = voixDispo[voixDemandee];
    if (!reglage) throw new Error(`Voix inconnue « ${voixDemandee} » (voix.json) : ${toutes.join(', ')}.`);
    if (!texte) throw new Error('Usage : pnpm repliques dire <voix> "<texte>" [--ton "…"] [--tempo 1] [--sortie fichier.mp3] [--go]');
    const ton = option('--ton') ?? 'naturel, posé';
    const style = `${reglage.jeu} ; ${ton}`;
    const debit = Number((option('--tempo') ?? '1').replace(',', '.'));
    if (!(debit >= 0.8 && debit <= 1.6)) throw new Error('--tempo : entre 0,8 et 1,6 (1 par défaut pour une phrase libre).');
    console.log(`${MODELES.flash} : voix ${voixDemandee} (${reglage.timbre}), ${texte.split(/\s+/).length} mots, un appel.`);
    console.log(`  « ${texte} »
  style : ${style}`);
    if (!args.includes('--go')) {
      console.log('  [simulation] Ajoute --go pour générer réellement (service payant, ≈ 0,0005 $ par phrase courte).');
      return;
    }
    const cle = lireEnv()[CLE_OPENROUTER];
    if (!cle) throw new Error(`Variable ${CLE_OPENROUTER} absente (voir .env.example).`);
    console.log(`Clé utilisée : ${empreinte(cle)} (celle du .env du projet).`);
    const dossier = join(SORTIES, voixDemandee);
    mkdirSync(dossier, { recursive: true });
    const nom = `histoire-${texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}-${Date.now().toString(36)}`;
    const res = await dire(texte, { modele: MODELES.flash, voix: reglage.timbre, style, cle });
    writeFileSync(join(dossier, `${nom}.pcm`), res.pcm);
    if (!res.pcm.length) throw new Error('Pas d’audio reçu.');
    const { duree, gain } = enMp3Egalise(res.pcm, join(dossier, `${nom}.mp3`), { frequence: res.frequence, filtre: filtreLong(debit) });
    const { attendue } = durees(texte);
    writeFileSync(join(dossier, `${nom}.json`), JSON.stringify({ texte, modele: MODELES.flash, voix: reglage.timbre, style, frequence: res.frequence, duree: Math.round(duree * 10) / 10, generation: res.generation }, null, 2) + '\n');
    if (option('--sortie')) copyFileSync(join(dossier, `${nom}.mp3`), option('--sortie')!);
    console.log(`  ${nom}.mp3 : ${duree.toFixed(1)} s (≈ ${attendue.toFixed(1)} s attendues, ${gain >= 0 ? '+' : ''}${gain.toFixed(1)} dB)${duree < attendue / 2 ? ' — SUSPECT : bien plus court que prévu, texte peut-être tronqué' : ''}`);
    return;
  }
  if (commande === 'convertir' && voixDemandee) {
    // Refait les MP3 depuis l'audio brut gardé (.pcm), sans appel : pour régler le débit ou le volume après coup.
    // Avec --livrer, les prises bonnes remplacent celles du jeu.
    const livrer = args.includes('--livrer');
    for (const voix of voixDemandee === 'tous' ? toutes : [voixDemandee]) {
      const dossier = join(SORTIES, voix);
      if (!existsSync(dossier)) continue;
      for (const brut of readdirSync(dossier).filter((x) => x.endsWith('.pcm') && !x.endsWith('.mp3.pcm') && !x.startsWith('histoire-'))) {
        const nom = brut.replace(/\.pcm$/, '');
        const fiche = join(dossier, `${nom}.json`);
        const lu = existsSync(fiche) ? (JSON.parse(readFileSync(fiche, 'utf8')) as { frequence?: number; probleme?: string }) : {};
        const { duree, gain } = enMp3Egalise(readFileSync(join(dossier, brut)), join(dossier, `${nom}.mp3`), { frequence: lu.frequence ?? 24000, filtre: filtreReplique(tempo) });
        const m = /^(.+-\d+)-gemini-[a-z]+$/.exec(nom);
        const livre = livrer && !lu.probleme && m;
        if (livre) {
          mkdirSync(join(LIVRAISON, voix), { recursive: true });
          copyFileSync(join(dossier, `${nom}.mp3`), join(LIVRAISON, voix, `${m[1]}.mp3`));
        }
        console.log(`  ${voix}/${nom}.mp3 : ${duree.toFixed(1)} s (×${tempo}, ${gain >= 0 ? '+' : ''}${gain.toFixed(1)} dB)${livre ? ' → livré' : ''}${lu.probleme ? ` — refusé : ${lu.probleme}` : ''}`);
      }
    }
    return;
  }
  if (commande === 'lister') {
    const nb = SITUATIONS.reduce((n, x) => n + cris.situations[x].length, 0);
    console.log(`${nb} cris communs, ${toutes.length} voix.`);
    for (const voix of toutes) {
      const cris = phrasesDe(voix, undefined);
      const livrees = cris.filter((p) => existsSync(livre(voix, p))).length;
      console.log(`${voix.padEnd(12)} ${livrees}/${cris.length} cris livrés, ${voixDispo[voix]!.timbre} (${VOIX_GEMINI[voixDispo[voix]!.timbre] ?? '?'}) — ${voixDispo[voix]!.jeu}`);
    }
    return;
  }
  if (commande !== 'voix' || !voixDemandee) {
    console.log('Usage : pnpm repliques lister | dire <voix> "<texte>" | voix <voix|tous> [--lignes situation:n,…] [--modele flash|lite] [--tempo 1.25] [--livrer] [--refaire] [--cout] [--plafond 0.05] [--go] | convertir <voix|tous> [--tempo 1.25] [--livrer]');
    return;
  }
  const cleModele = (option('--modele') ?? 'flash') as keyof typeof MODELES;
  const modele = MODELES[cleModele];
  if (!modele) throw new Error('Modèle : flash ou lite.');
  const livrer = args.includes('--livrer');
  const refaire = args.includes('--refaire');
  const cibles = voixDemandee === 'tous' ? toutes : [voixDemandee];
  if (voixDemandee === 'tous' && option('--lignes')) throw new Error('--lignes ne va qu’avec une voix.');

  // Le travail : chaque cri de chaque voix, sauf ceux déjà livrés.
  const travail = cibles.flatMap((nom) => {
    const reglage = voixDispo[nom];
    if (!reglage) throw new Error(`Voix inconnue « ${nom} » (voix.json) : ${toutes.join(', ')}.`);
    if (!VOIX_GEMINI[reglage.timbre]) throw new Error(`Timbre Gemini inconnu « ${reglage.timbre} » : ${Object.keys(VOIX_GEMINI).join(', ')}.`);
    return phrasesDe(nom, option('--lignes'))
      .filter((p) => refaire || !livrer || !existsSync(livre(nom, p)))
      .map((p) => ({ nom, p, voix: reglage.timbre, jeu: reglage.jeu }));
  });
  console.log(`${modele} : ${travail.length} cri(s) à dire pour ${cibles.length} voix, un appel chacun (pas de nouvel essai automatique).`);
  for (const nom of cibles) {
    const n = travail.filter((t) => t.nom === nom);
    console.log(`  ${nom.padEnd(12)} ${String(n.length).padStart(2)} cris, timbre ${n[0]?.voix ?? '—'}`);
  }
  if (travail.length <= 20) for (const t of travail) console.log(`    ${t.nom} ${t.p.situation}-${t.p.numero} « ${t.p.texte} » — ${t.jeu} ; ${TON_SITUATIONS[t.p.situation]}`);
  if (!args.includes('--go')) {
    console.log('  [simulation] Ajoute --go pour générer réellement (service payant).');
    return;
  }
  const plafond = lireMontant(option('--plafond'), 0.05);
  const cle = lireEnv()[CLE_OPENROUTER];
  if (!cle) throw new Error(`Variable ${CLE_OPENROUTER} absente (voir .env.example).`);
  console.log(`Clé utilisée : ${empreinte(cle)} (celle du .env du projet).`);
  const depart = await utilisationCle(cle);
  const avecCout = args.includes('--cout');
  let annonce = 0;
  let refus = 0;
  let faits = 0;
  for (const { nom, p, voix, jeu } of travail) {
    // Le compteur de la clé est lu de temps en temps : le plafond tient même sans relever chaque prise.
    if (faits > 0 && faits % 10 === 0 && !avecCout) {
      const maintenant = await utilisationCle(cle);
      if (maintenant !== undefined && depart !== undefined && maintenant - depart > plafond) {
        console.log(`Arrêt : ${(maintenant - depart).toFixed(4)} $ au compteur, au-delà du plafond de ${plafond} $.`);
        break;
      }
    }
    if (annonce > plafond) {
      console.log(`Arrêt : ${annonce.toFixed(4)} $, au-delà du plafond de ${plafond} $.`);
      break;
    }
    const dossier = join(SORTIES, nom);
    mkdirSync(dossier, { recursive: true });
    const fichier = `${p.situation}-${p.numero}-gemini-${cleModele}`;
    process.stdout.write(`  ${nom} ${p.situation}-${p.numero} « ${p.texte} » … `);
    const style = `${jeu} ; ${TON_SITUATIONS[p.situation]}`;
    let res: Awaited<ReturnType<typeof dire>>;
    try {
      res = await dire(p.texte, { modele, voix, style, cle });
    } catch (e) {
      refus++;
      console.log(`erreur : ${(e as Error).message.slice(0, 200)}`);
      continue;
    }
    faits++;
    // L'audio brut d'abord, sur le disque : il est payé.
    writeFileSync(join(dossier, `${fichier}.pcm`), res.pcm);
    // 16 bits mono : deux octets par échantillon.
    const brute = res.pcm.length / (2 * res.frequence);
    const { attendue, max } = durees(p.texte);
    let duree = 0;
    let probleme: string | undefined;
    if (!res.pcm.length) probleme = 'pas d’audio';
    else {
      duree = enMp3Egalise(res.pcm, join(dossier, `${fichier}.mp3`), { frequence: res.frequence, filtre: filtreReplique(tempo) }).duree;
      if (duree > max || duree < attendue / 3) probleme = `durée anormale (${duree.toFixed(1)} s pour ${attendue.toFixed(1)} s attendues)`;
    }
    if (livrer && !probleme) {
      mkdirSync(join(LIVRAISON, nom), { recursive: true });
      copyFileSync(join(dossier, `${fichier}.mp3`), livre(nom, p));
    }
    const cout = avecCout ? await coutDe(res.generation, cle) : undefined;
    annonce += cout ?? 0;
    writeFileSync(
      join(dossier, `${fichier}.json`),
      JSON.stringify({ texte: p.texte, modele, voix, style, situation: p.situation, frequence: res.frequence, dureeBrute: Math.round(brute * 10) / 10, duree: Math.round(duree * 10) / 10, cout, generation: res.generation, probleme }, null, 2) + '\n',
    );
    if (probleme) refus++;
    console.log(`${probleme ? `À VÉRIFIER : ${probleme}` : 'ok'} (${duree.toFixed(1)} s${cout === undefined ? '' : `, ${cout.toFixed(4)} $`})`);
  }
  await new Promise((r) => setTimeout(r, 20_000));
  const fin = await utilisationCle(cle);
  console.log(
    `Bilan : ${faits - refus} prise(s) bonne(s), ${refus} à vérifier ou en erreur, ${annonce > 0 ? `${annonce.toFixed(4)} $ relevés, ` : ''}${depart !== undefined && fin !== undefined ? `${(fin - depart).toFixed(4)} $ au compteur de la clé` : 'compteur indisponible'}.`,
  );
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
