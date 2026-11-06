// Comparaison des services d'images (M2).
//
//   pnpm images lister                      lot de test et prompts, sans rien appeler
//   pnpm images generer <service|tous> --go génère les images (payant) ; sans --go : simulation
//                                            service = alias (flux2, flux3, gemini…) ou identifiant OpenRouter (auteur/modele)
//   pnpm images comparer                    construit sorties/images/comparaison.html
//   pnpm images monde <monde>               lieux du monde, dans l'ordre, avec les images faites / à faire
//   pnpm images monde <monde> --lieu <id> [--service klein] [--go]   génère les images d'un lieu (sans --go : simulation)
//   pnpm images cartes <monde>              lieux qui méritent une carte illustrée (≥ 5 enfants), avec les cartes faites / à faire
//   pnpm images cartes <monde> --lieu <id> | --tous [--service klein] [--go]   génère la carte d'un lieu (ou de tous les candidats ; sans --go : simulation)
//   pnpm images galerie [--service klein] [--max N] [--go]   génère les 54 portraits du créateur (communs à tous les mondes)
//   pnpm images bestiaire [--go]           une image par profil de monstre du SRD (combat, tous mondes)
//   pnpm images equipement [--max N] [--partie i/n] [--go]          une image par arme et par armure du SRD (équipement commun à tous les mondes)
//   pnpm images terrains [--go]            textures du plateau de combat (sol, difficile, mur par ambiance)
//   pnpm images interface [--go]           illustrations de l'interface (écran titre)
//   pnpm images depense                     dépense cumulée de la clé OpenRouter
//
// Options de `generer` : --lot portraits|scenes|tout (défaut : tout), --id <élément> (une seule image, ex. portrait-bran),
// --refs <service> (prend les portraits de référence dans un autre service), --max N (garde-fou, défaut 12 par service).
// La clé OpenRouter est lue dans l'environnement ou dans le fichier `.env` à la racine (voir `.env.example`).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chargerMonde, RACINE_MONDES } from '../../packages/regles/src/monde/chargeur';
import { candidatsCartes, elementsCartes, enfantsDe } from './cartes';
import { elementsParLieu } from './monde';
import { elementsGalerie } from './galerie';
import { elementsBestiaire, elementsEquipement, elementsInterface, elementsTerrains } from './plateau';
import { chargerCharte, construireElements, RACINE, type Element } from './charte';
import { construirePageComparaison } from './comparer';
import { CLE_OPENROUTER, SERVICES, trouverService, utilisationCle, type Env, type Reference, type Service } from './services';
import { lireFichierEnv } from '../cle';

export const SORTIES = join(RACINE, 'sorties/images');

/**
 * Les variables du projet (clé OpenRouter comprise) : le fichier `.env` gagne sur le shell, comme pour tous les outils
 * (voir `outils/cle.ts`). Avant, la variable du shell l'emportait, et une clé laissée par un autre projet était facturée.
 */
export function lireEnv(fichier = join(RACINE, '.env')): Env {
  return { ...process.env, ...lireFichierEnv(fichier) };
}

export interface Meta {
  id: string;
  service: string;
  modele: string;
  prompt: string;
  references: string[];
  dureeMs: number;
  /** Coût annoncé par l'API dans la réponse (`usage.cost`). */
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

export async function genererLot(service: Service, elements: Element[], env: Env, go: boolean, max: number, serviceRefs?: string, dossierSortie?: string): Promise<void> {
  const dossier = dossierSortie ?? join(SORTIES, service.id);
  // Les références (portraits) viennent d'un autre service quand on veut tester un modèle sur les mêmes visages.
  const dossierRefs = serviceRefs ? join(SORTIES, trouverService(serviceRefs)?.id ?? serviceRefs) : dossier;
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
  // Dépense réelle du lot : variation du compteur de la clé (mis à jour avec un retard de quelques dizaines de secondes).
  const depart = await utilisationCle(cle);
  let annonce = 0;
  let generees = 0;
  const refuses: string[] = [];
  const bilan = async () => {
    if (depart === undefined || !generees) return;
    await new Promise((r) => setTimeout(r, 30_000));
    const fin = await utilisationCle(cle);
    if (fin !== undefined) console.log(`  Bilan : ${generees} image(s), ${annonce.toFixed(3)} $ annoncés, ${(fin - depart).toFixed(3)} $ réellement dépensés (compteur de la clé).`);
  };
  // Les portraits d'abord : les scènes s'en servent comme références.
  for (const e of [...aFaire].sort((a, b) => Number(a.groupe === 'scenes') - Number(b.groupe === 'scenes'))) {
    const refs = e.references.map((id) => {
      const r = charger(dossierRefs, id);
      if (!r) throw new Error(`${e.id} : le portrait « ${id} » manque ; génère d'abord les portraits (--lot portraits).`);
      return r;
    });
    if (refs.length > service.maxReferences) throw new Error(`${e.id} : ${refs.length} références, ${service.id} en accepte ${service.maxReferences}.`);
    process.stdout.write(`  ${e.id} … `);
    try {
      const res = await service.generer({ prompt: e.prompt, references: refs, format: e.format }, cle, env);
      annonce += res.coutUsd ?? 0;
      generees += 1;
      writeFileSync(join(dossier, `${e.id}.png`), res.image);
      const meta: Meta = {
        id: e.id, service: service.id, modele: res.modele, prompt: e.prompt, references: serviceRefs ? e.references.map((r) => `${serviceRefs}/${r}`) : e.references,
        dureeMs: res.dureeMs, coutUsd: res.coutUsd, date: new Date().toISOString(),
      };
      writeFileSync(join(dossier, `${e.id}.json`), JSON.stringify(meta, null, 2) + '\n');
      console.log(`ok (${(res.dureeMs / 1000).toFixed(1)} s${res.coutUsd === undefined ? '' : `, ${res.coutUsd.toFixed(3)} $`})`);
    } catch (erreur) {
      console.log('ÉCHEC');
      console.error(`    ${(erreur as Error).message}`);
      // Un refus de modération ne concerne que cette image : on passe à la suivante. Toute autre erreur arrête le lot.
      if (/HTTP 400.*blocked/s.test((erreur as Error).message)) {
        refuses.push(e.id);
        continue;
      }
      await bilan();
      return; // inutile d'enchaîner : la même erreur se répéterait (et coûterait)
    }
  }
  if (refuses.length) console.log(`  Refusées par le service : ${refuses.join(', ')} — corrige leur texte dans images.json du monde (voir docs/M2-IMAGES.md).`);
  await bilan();
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
    const cible = args.find((a) => !a.startsWith('--') && a !== option('--lot') && a !== option('--max') && a !== option('--id') && a !== option('--refs'));
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
    for (const s of services) await genererLot(s, choisis, env, args.includes('--go'), Number(option('--max') ?? 12), option('--refs'));
    return;
  }
  if (commande === 'monde') {
    const idMonde = args[0]?.startsWith('--') ? undefined : args[0];
    if (!idMonde) throw new Error('Usage : pnpm images monde <monde> [--lieu <id>] [--service klein] [--max N] [--go]');
    const charge = chargerMonde(join(RACINE_MONDES, idMonde));
    if (!charge.ok) throw new Error(`Monde « ${idMonde} » invalide : ${charge.erreurs[0]?.message ?? ''}`);
    const fichierRetouches = join(RACINE_MONDES, idMonde, 'images.json');
    const retouches = existsSync(fichierRetouches) ? (JSON.parse(readFileSync(fichierRetouches, 'utf8')) as Record<string, string>) : {};
    const parLieu = elementsParLieu(charge.monde, { charte, racineSrd: join(RACINE, 'packages/donnees/srd'), retouches });
    const service = trouverService(option('--service') ?? 'klein');
    if (!service) throw new Error(`Service inconnu « ${option('--service')} ».`);
    const dossier = join(SORTIES, 'mondes', idMonde);
    const fait = (e: Element) => existsSync(join(dossier, `${e.id}.png`));
    const lieu = option('--lieu');
    if (!lieu) {
      let reste = 0;
      for (const [id, els] of parLieu) {
        const manque = els.filter((e) => !fait(e)).length;
        reste += manque;
        console.log(`${manque === 0 ? '✓' : ' '} ${id.padEnd(40)} ${els.length - manque}/${els.length}`);
      }
      console.log(`\n${reste} image(s) restantes sur ${[...parLieu.values()].flat().length}.`);
      return;
    }
    const elements = parLieu.get(lieu);
    if (!elements) throw new Error(`Lieu inconnu « ${lieu} ». Voir : pnpm images monde ${idMonde}`);
    console.log(`Lieu ${lieu} : ${elements.map((e) => e.id).join(', ')}`);
    await genererLot(service, elements, lireEnv(), args.includes('--go'), Number(option('--max') ?? 20), undefined, dossier);
    return;
  }
  if (commande === 'cartes') {
    const idMonde = args[0]?.startsWith('--') ? undefined : args[0];
    if (!idMonde) throw new Error('Usage : pnpm images cartes <monde> [--lieu <id> | --tous] [--service klein] [--max N] [--go]');
    const charge = chargerMonde(join(RACINE_MONDES, idMonde));
    if (!charge.ok) throw new Error(`Monde « ${idMonde} » invalide : ${charge.erreurs[0]?.message ?? ''}`);
    const dm = charge.monde;
    const fichierRetouches = join(RACINE_MONDES, idMonde, 'images.json');
    const retouches = existsSync(fichierRetouches) ? (JSON.parse(readFileSync(fichierRetouches, 'utf8')) as Record<string, string>) : {};
    const service = trouverService(option('--service') ?? 'klein');
    if (!service) throw new Error(`Service inconnu « ${option('--service')} ».`);
    const dossier = join(SORTIES, 'mondes', idMonde);
    const lieu = option('--lieu');
    const candidats = candidatsCartes(dm);
    if (!lieu && !args.includes('--tous')) {
      for (const l of candidats) console.log(`${existsSync(join(dossier, `carte-${l.id}.png`)) ? '✓' : ' '} ${l.id.padEnd(40)} ${enfantsDe(dm, l.id).length} lieux`);
      console.log(`
${candidats.length} carte(s) proposée(s). Génère-en une avec --lieu <id> (n'importe quel lieu qui en contient d'autres), ou toutes avec --tous.`);
      return;
    }
    const cibles = lieu ? [dm.lieux.get(lieu)].filter((l): l is NonNullable<typeof l> => !!l) : candidats;
    if (lieu && !cibles.length) throw new Error(`Lieu inconnu « ${lieu} ».`);
    if (lieu && !enfantsDe(dm, lieu).length) throw new Error(`« ${lieu} » ne contient aucun lieu : pas de carte à dessiner.`);
    await genererLot(service, elementsCartes(dm, { charte, retouches }, cibles), lireEnv(), args.includes('--go'), Number(option('--max') ?? 6), undefined, dossier);
    return;
  }
  if (commande === 'galerie') {
    const service = trouverService(option('--service') ?? 'klein');
    if (!service) throw new Error(`Service inconnu « ${option('--service')} ».`);
    // Sortie : sorties/images/galerie/ ; à copier ensuite dans apps/jeu/src/portraits/ (voir docs/M2-IMAGES.md).
    await genererLot(service, elementsGalerie(charte), lireEnv(), args.includes('--go'), Number(option('--max') ?? 60), undefined, join(SORTIES, 'galerie'));
    return;
  }
  if (commande === 'bestiaire' || commande === 'terrains' || commande === 'interface' || commande === 'equipement') {
    const service = trouverService(option('--service') ?? 'klein');
    if (!service) throw new Error(`Service inconnu « ${option('--service')} ».`);
    const lot =
      commande === 'bestiaire' ? elementsBestiaire(charte) : commande === 'terrains' ? elementsTerrains(charte) : commande === 'equipement' ? elementsEquipement(charte) : elementsInterface(charte);
    // --partie i/n : ne fait que le i-ème des n morceaux de la liste, pour lancer plusieurs processus en parallèle (reprise sans doublon : les images déjà faites sont sautées).
    const partie = /^(\d+)\/(\d+)$/.exec(option('--partie') ?? '');
    const part = partie ? lot.filter((_, k) => k % Number(partie[2]) === Number(partie[1]) - 1) : lot;
    await genererLot(service, part, lireEnv(), args.includes('--go'), Number(option('--max') ?? 40), undefined, join(SORTIES, commande));
    return;
  }
  if (commande === 'depense') {
    const cle = lireEnv()[CLE_OPENROUTER];
    if (!cle) throw new Error(`Variable ${CLE_OPENROUTER} absente (voir .env.example).`);
    const usage = await utilisationCle(cle);
    console.log(usage === undefined ? 'Dépense indisponible (API de la clé injoignable).' : `Dépense cumulée de la clé : ${usage.toFixed(3)} $ (l'API met parfois quelques secondes à la mettre à jour).`);
    return;
  }
  if (commande === 'comparer') {
    mkdirSync(SORTIES, { recursive: true });
    const page = join(SORTIES, 'comparaison.html');
    writeFileSync(page, construirePageComparaison(SORTIES, elements, SERVICES));
    console.log(`Page écrite : ${page}`);
    return;
  }
  console.log('Usage : pnpm images lister | generer <service|tous> [--lot portraits|scenes|tout] [--id élément] [--refs service] [--max N] [--go] | monde <monde> | cartes <monde> | galerie | bestiaire | equipement | terrains | interface | comparer | depense');
}

// Seulement quand ce fichier est le programme lancé (pas quand un autre outil l'importe, comme outils/voix).
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((e) => {
    console.error((e as Error).message);
    process.exit(1);
  });
}
