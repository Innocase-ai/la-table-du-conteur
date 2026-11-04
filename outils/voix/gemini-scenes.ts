// Voix des scènes narrées avec Gemini Flash TTS (le moteur des répliques de combat), à la place de gpt-audio : « un robot qui
// récite » (jugé ainsi par l'utilisateur pour les répliques le 04/11/2026), voix trop posée pour une vidéo. Un moteur de
// synthèse donne des intonations ; on lui passe le texte exact et, à part, le style.
//
//   pnpm voix essai <monde> --scene id --plan n --timbres Algieba,Orus [--ton "…"] [--tempo 1.15] [--go]
//        plusieurs timbres sur un plan, dans `sorties/voix-scenes-essais/` : rien n'est livré
//   pnpm voix generer <monde> [--moteur gemini] [--timbre Algieba] [--scene id] [--ton "…"] [--tempo 1.15] [--refaire] [--plafond 0.05] [--go]
//        livre `voix/<scene>-<plan>.mp3` (+ `.json`) ; l'audio brut est gardé dans `sorties/voix-scenes/<monde>/`
//   pnpm voix convertir <monde> [--scene id] [--tempo 1.15]
//        refait les MP3 livrés depuis l'audio brut gardé, sans aucun appel (réglage du débit)
//
// Sans --go : simulation, aucun appel et aucun coût. Une prise payée n'est jamais perdue : le PCM brut est écrit dès qu'il arrive.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { empreinte, lireMontant } from '../cle';
import { lireEnv } from '../images/cli';
import { CLE_OPENROUTER, utilisationCle } from '../images/services';
import { coutGeneration, direGemini, enMp3, filtreLong, MODELES_GEMINI } from './lecture';

const RACINE = join(import.meta.dirname, '..', '..');
const TIMBRES = [
  'Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Leda', 'Orus', 'Aoede', 'Callirrhoe', 'Autonoe', 'Enceladus', 'Iapetus', 'Umbriel', 'Algieba', 'Despina',
  'Erinome', 'Algenib', 'Rasalgethi', 'Laomedeia', 'Achernar', 'Alnilam', 'Schedar', 'Gacrux', 'Pulcherrima', 'Achird', 'Zubenelgenubi', 'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat',
];

/**
 * Le style des voix de scène : un conteur vivant, mais naturel. Court, comme Google le conseille ; il n'est pas lu à voix haute.
 * Un premier style plus théâtral (« intonations marquées, mots clés appuyés ») a été jugé « un peu trop accentué ».
 */
export const STYLE_CONTEUR =
  'Conteur qui raconte à voix haute, naturel et vivant : intonations nuancées mais retenues, accent seulement sur les mots importants, ' +
  'sans emphase ni théâtralité ; rythme soutenu, pauses brèves ; ton sombre et sobre, jamais monotone';

/**
 * LA VOIX OFFICIELLE DU MAÎTRE DE JEU (décision de l'utilisateur, 04/11/2026) : toutes les vidéos et scènes narrées de toutes
 * les histoires, présentes et futures, sont lues avec ce timbre, ce style et ce débit. Ne pas en changer sans son accord.
 * Choisie à l'oreille parmi Orus, Algieba et Fenrir (prise de référence : `ouverture-1` du Val des Cendres, Algieba ×1,15).
 */
export const VOIX_OFFICIELLE = { timbre: 'Algieba', tempo: 1.15, style: STYLE_CONTEUR } as const;

/** Estimation du coût d'une prise (d'après les cris : ≈ 0,001 $ la phrase courte) ; la vraie valeur se lit après coup. */
const COUT_ESTIME = (texte: string) => 0.0008 + texte.split(/\s+/).length * 0.00008;

interface Plan {
  nom: string;
  texte: string;
}
interface Contexte {
  idMonde: string;
  plans: Plan[];
  dossier: string;
  option: (nom: string) => string | undefined;
  args: string[];
}

const tempoDe = (c: Contexte, defaut: number = VOIX_OFFICIELLE.tempo): number => {
  const t = Number((c.option('--tempo') ?? String(defaut)).replace(',', '.'));
  if (!(t >= 0.8 && t <= 1.6)) throw new Error('--tempo : entre 0,8 et 1,6.');
  return t;
};
const timbreDe = (nom: string): string => {
  const t = TIMBRES.find((x) => x.toLowerCase() === nom.toLowerCase());
  if (!t) throw new Error(`Timbre inconnu « ${nom} » : ${TIMBRES.join(', ')}.`);
  return t;
};

function cle(): string {
  const c = lireEnv()[CLE_OPENROUTER];
  if (!c) throw new Error(`Variable ${CLE_OPENROUTER} absente (voir .env.example).`);
  console.log(`Clé utilisée : ${empreinte(c)} (celle du .env du projet).`);
  return c;
}

/** Plusieurs timbres sur un plan, pour choisir une voix à l'oreille. Rien n'est livré. */
export async function essai(c: Contexte): Promise<void> {
  const plan = Number(c.option('--plan') ?? '1');
  const p = c.plans.filter((x) => !c.option('--scene') || x.nom.startsWith(`${c.option('--scene')}-`))[plan - 1];
  if (!p) throw new Error('Plan introuvable (--scene id --plan n).');
  const timbres = (c.option('--timbres') ?? `${VOIX_OFFICIELLE.timbre},Orus`).split(',').map((t) => timbreDe(t.trim()));
  const ton = c.option('--ton') ?? STYLE_CONTEUR;
  const tempo = tempoDe(c);
  const dossier = join(RACINE, 'sorties', 'voix-scenes-essais');
  console.log(`${MODELES_GEMINI.flash} : ${timbres.length} appel(s) (${timbres.join(', ')}), plan ${p.nom}, ${p.texte.split(/\s+/).length} mots ; ≈ ${(timbres.length * COUT_ESTIME(p.texte)).toFixed(3)} $ estimés.`);
  console.log(`  « ${p.texte} »\n  style : ${ton}\n  débit livré : ×${tempo} (le brut est gardé : on peut le refaire sans appel)`);
  if (!c.args.includes('--go')) return console.log('  Ajoute --go pour générer réellement (service payant).');
  mkdirSync(dossier, { recursive: true });
  const k = cle();
  const depart = await utilisationCle(k);
  let total = 0;
  for (const t of timbres) {
    const base = join(dossier, `${p.nom}-${t}`);
    process.stdout.write(`  ${t} … `);
    const res = await direGemini(p.texte, { modele: MODELES_GEMINI.flash, voix: t, style: ton, cle: k });
    writeFileSync(`${base}.brut.pcm`, res.pcm);
    const duree = enMp3(res.pcm, `${base}.mp3`, { filtre: filtreLong(tempo), frequence: res.frequence });
    const cout = await coutGeneration(res.generation, k);
    total += cout ?? 0;
    console.log(`ok (${duree.toFixed(1)} s${cout === undefined ? '' : `, ${cout.toFixed(4)} $`}) → ${base}.mp3`);
  }
  await new Promise((r) => setTimeout(r, 30_000));
  const fin = await utilisationCle(k);
  console.log(`Bilan : ${total.toFixed(4)} $ annoncés${depart !== undefined && fin !== undefined ? `, ${(fin - depart).toFixed(4)} $ au compteur de la clé` : ''}.`);
}

/** Lit les plans avec Gemini et les livre (`voix/<scene>-<plan>.mp3`). */
export async function genererGemini(c: Contexte, fait: (p: Plan) => boolean): Promise<void> {
  const timbre = timbreDe(c.option('--timbre') ?? VOIX_OFFICIELLE.timbre);
  const ton = c.option('--ton') ?? STYLE_CONTEUR;
  const tempo = tempoDe(c);
  const refaire = c.args.includes('--refaire');
  // `--plans 2,3,4` : seulement ces plans (numéros dans la scène) ; utile pour garder une prise déjà choisie.
  const numeros = c.option('--plans')?.split(',').map((n) => n.trim());
  const aFaire = c.plans.filter((p) => (refaire || !fait(p)) && (!numeros || numeros.includes(p.nom.slice(p.nom.lastIndexOf('-') + 1))));
  const estime = aFaire.reduce((s, p) => s + COUT_ESTIME(p.texte), 0);
  console.log(`${MODELES_GEMINI.flash}, timbre ${timbre}, débit ×${tempo} : ${aFaire.length} plan(s) à lire sur ${c.plans.length} (un appel chacun, pas de nouvel essai automatique) ; ≈ ${estime.toFixed(3)} $ estimés.`);
  console.log(`  style : ${ton}`);
  if (!c.args.includes('--go')) {
    for (const p of aFaire) console.log(`  [simulation] ${p.nom} (${p.texte.length} caractères)`);
    return console.log('  Ajoute --go pour générer réellement (service payant).');
  }
  const plafond = lireMontant(c.option('--plafond'), 0.05);
  const k = cle();
  const brut = join(RACINE, 'sorties', 'voix-scenes', c.idMonde);
  mkdirSync(brut, { recursive: true });
  mkdirSync(c.dossier, { recursive: true });
  const depart = await utilisationCle(k);
  let annonce = 0;
  let echecs = 0;
  for (const p of aFaire) {
    if (annonce > plafond) {
      console.log(`Arrêt : ${annonce.toFixed(4)} $ annoncés, au-delà du plafond de ${plafond} $ (--plafond pour le changer).`);
      break;
    }
    process.stdout.write(`  ${p.nom} … `);
    try {
      const res = await direGemini(p.texte, { modele: MODELES_GEMINI.flash, voix: timbre, style: ton, cle: k });
      writeFileSync(join(brut, `${p.nom}.pcm`), res.pcm);
      const duree = enMp3(res.pcm, join(c.dossier, `${p.nom}.mp3`), { filtre: filtreLong(tempo), frequence: res.frequence });
      const cout = await coutGeneration(res.generation, k);
      annonce += cout ?? COUT_ESTIME(p.texte);
      const trace = { texte: p.texte, moteur: 'gemini', modele: MODELES_GEMINI.flash, voix: timbre, style: ton, tempo, frequence: res.frequence, duree: Math.round(duree * 10) / 10, cout };
      writeFileSync(join(c.dossier, `${p.nom}.json`), JSON.stringify(trace, null, 2) + '\n');
      writeFileSync(join(brut, `${p.nom}.json`), JSON.stringify(trace, null, 2) + '\n');
      console.log(`ok (${duree.toFixed(1)} s, ${p.texte.split(/\s+/).length} mots${cout === undefined ? '' : `, ${cout.toFixed(4)} $`})`);
    } catch (e) {
      echecs++;
      console.log(`ÉCHEC : ${(e as Error).message.slice(0, 120)}`);
    }
  }
  await new Promise((r) => setTimeout(r, 30_000));
  const fin = await utilisationCle(k);
  console.log(`Bilan : ${aFaire.length - echecs} voix faites, ${echecs} échec(s), ${annonce.toFixed(4)} $ annoncés${depart !== undefined && fin !== undefined ? `, ${(fin - depart).toFixed(4)} $ au compteur de la clé` : ''}.`);
}

/** Refait les MP3 livrés depuis l'audio brut gardé : réglage du débit, aucun appel. */
export function convertir(c: Contexte): void {
  const tempo = tempoDe(c);
  const brut = join(RACINE, 'sorties', 'voix-scenes', c.idMonde);
  let n = 0;
  for (const p of c.plans) {
    const pcm = join(brut, `${p.nom}.pcm`);
    const fiche = join(brut, `${p.nom}.json`);
    if (!existsSync(pcm) || !existsSync(fiche)) continue;
    const trace = JSON.parse(readFileSync(fiche, 'utf8')) as { frequence?: number; texte: string };
    if (trace.texte !== p.texte) {
      console.log(`  ${p.nom} : le texte a changé depuis la prise, à refaire (generer --refaire)`);
      continue;
    }
    const chemin = join(c.dossier, `${p.nom}.mp3`);
    const duree = enMp3(readFileSync(pcm), chemin, { filtre: filtreLong(tempo), frequence: trace.frequence ?? 24000 });
    const maj = { ...JSON.parse(readFileSync(fiche, 'utf8')), tempo, duree: Math.round(duree * 10) / 10 };
    writeFileSync(fiche, JSON.stringify(maj, null, 2) + '\n');
    copyFileSync(fiche, join(c.dossier, `${p.nom}.json`));
    console.log(`  ${p.nom} : ×${tempo}, ${duree.toFixed(1)} s`);
    n++;
  }
  console.log(`${n} MP3 refait(s) sans appel.`);
}
