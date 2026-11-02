// Comparaison des services d'images (M2).
//
//   pnpm images lister                      lot de test et prompts, sans rien appeler
//   pnpm images generer <service|tous> --go génère les images (payant) ; sans --go : simulation
//                                            service = alias (flux2, flux3, gemini…) ou identifiant OpenRouter (auteur/modele)
//   pnpm images comparer                    construit sorties/images/comparaison.html
//
// Options de `generer` : --lot portraits|scenes|tout (défaut : tout), --id <élément> (une seule image, ex. portrait-bran),
// --max N (garde-fou, défaut 12 par service).
// La clé OpenRouter est lue dans l'environnement ou dans le fichier `.env` à la racine (voir `.env.example`).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chargerCharte, construireElements, RACINE, type Element } from './charte';
import { construirePageComparaison } from './comparer';
import { SERVICES, trouverService, type Env, type Reference, type Service } from './services';

export const SORTIES = join(RACINE, 'sorties/images');

export function lireEnv(fichier = join(RACINE, '.env')): Env {
  const env: Env = { ...process.env };
  if (!existsSync(fichier)) return env;
  for (const ligne of readFileSync(fichier, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(ligne);
    if (m && m[2] && !env[m[1]!]) env[m[1]!] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

export interface Meta {
  id: string;
  service: string;
  modele: string;
  prompt: string;
  references: string[];
  dureeMs: number;
  coutUsd?: number;
  date: string;
}

/** Type MIME d'après les premiers octets : certains services renvoient du JPEG ou du WebP. */
export function mimeDepuisOctets(o: Buffer): string {
  if (o[0] === 0xff && o[1] === 0xd8) return 'image/jpeg';
  if (o.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  return 'image/png';
}

function charger(dossier: string, id: string): Reference | undefined {
  const chemin = join(dossier, `${id}.png`);
  if (!existsSync(chemin)) return undefined;
  const donnees = readFileSync(chemin);
  return { nom: id, mime: mimeDepuisOctets(donnees), donnees };
}

export async function genererLot(service: Service, elements: Element[], env: Env, go: boolean, max: number): Promise<void> {
  const dossier = join(SORTIES, service.id);
  mkdirSync(dossier, { recursive: true });
  const cle = env[service.cleEnv];
  const aFaire = elements.filter((e) => !existsSync(join(dossier, `${e.id}.png`)));
  console.log(`\n${service.nom} — modèle ${service.modele(env)} — ${aFaire.length} image(s) à générer sur ${elements.length}.`);
  if (aFaire.length > max) throw new Error(`${aFaire.length} images dépassent le garde-fou (--max ${max}).`);
  if (!go) {
    for (const e of aFaire) console.log(`  [simulation] ${e.id} (${e.format}, ${e.references.length} référence(s))`);
    console.log('  Ajoute --go pour générer réellement (service payant).');
    return;
  }
  if (!cle) throw new Error(`${service.nom} : variable ${service.cleEnv} absente (voir .env.example).`);
  // Les portraits d'abord : les scènes s'en servent comme références.
  for (const e of [...aFaire].sort((a, b) => Number(a.groupe === 'scenes') - Number(b.groupe === 'scenes'))) {
    const refs = e.references.map((id) => {
      const r = charger(dossier, id);
      if (!r) throw new Error(`${e.id} : le portrait « ${id} » manque ; génère d'abord les portraits (--lot portraits).`);
      return r;
    });
    if (refs.length > service.maxReferences) throw new Error(`${e.id} : ${refs.length} références, ${service.id} en accepte ${service.maxReferences}.`);
    process.stdout.write(`  ${e.id} … `);
    try {
      const res = await service.generer({ prompt: e.prompt, references: refs, format: e.format }, cle, env);
      writeFileSync(join(dossier, `${e.id}.png`), res.image);
      const meta: Meta = {
        id: e.id, service: service.id, modele: res.modele, prompt: e.prompt, references: e.references,
        dureeMs: res.dureeMs, coutUsd: res.coutUsd, date: new Date().toISOString(),
      };
      writeFileSync(join(dossier, `${e.id}.json`), JSON.stringify(meta, null, 2) + '\n');
      console.log(`ok (${(res.dureeMs / 1000).toFixed(1)} s${res.coutUsd === undefined ? '' : `, ${res.coutUsd.toFixed(3)} $`})`);
    } catch (erreur) {
      console.log('ÉCHEC');
      console.error(`    ${(erreur as Error).message}`);
      return; // inutile d'enchaîner : la même erreur se répéterait (et coûterait)
    }
  }
}

async function main(): Promise<void> {
  const [commande, ...args] = process.argv.slice(2);
  const option = (nom: string) => {
    const i = args.indexOf(nom);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const charte = chargerCharte();
  const elements = construireElements(charte);

  if (commande === 'lister') {
    for (const e of elements) console.log(`\n# ${e.id} — ${e.nom} (${e.format}, références : ${e.references.join(', ') || 'aucune'})\n${e.prompt}`);
    console.log(`\n${elements.length} images par service. Alias : ${SERVICES.map((s) => `${s.id} (${s.modele({})})`).join(', ')}.`);
    return;
  }
  if (commande === 'generer') {
    const cible = args.find((a) => !a.startsWith('--') && a !== option('--lot') && a !== option('--max') && a !== option('--id'));
    const service = cible && cible !== 'tous' ? trouverService(cible) : undefined;
    const services = cible === 'tous' ? SERVICES : service ? [service] : [];
    if (!services.length) {
      throw new Error(`Service inconnu « ${cible ?? ''} ». Alias : ${SERVICES.map((s) => s.id).join(', ')}, tous ; ou un identifiant OpenRouter (auteur/modele).`);
    }
    const lot = option('--lot') ?? 'tout';
    const unique = option('--id');
    const choisis = elements.filter((e) => (unique ? e.id === unique : lot === 'tout' || e.groupe === lot));
    if (unique && !choisis.length) throw new Error(`Élément inconnu « ${unique} ». Voir : pnpm images lister`);
    const env = lireEnv();
    for (const s of services) await genererLot(s, choisis, env, args.includes('--go'), Number(option('--max') ?? 12));
    return;
  }
  if (commande === 'comparer') {
    mkdirSync(SORTIES, { recursive: true });
    const page = join(SORTIES, 'comparaison.html');
    writeFileSync(page, construirePageComparaison(SORTIES, elements, SERVICES));
    console.log(`Page écrite : ${page}`);
    return;
  }
  console.log('Usage : pnpm images lister | generer <service|tous> [--lot portraits|scenes|tout] [--id élément] [--max N] [--go] | comparer');
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop()!)) {
  main().catch((e) => {
    console.error((e as Error).message);
    process.exit(1);
  });
}
