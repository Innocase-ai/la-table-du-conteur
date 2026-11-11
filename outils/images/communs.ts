// Bibliothèque commune des assets venus des histoires : portraits de PNJ, images d'objets propres aux mondes, salutations déjà dites.
// Deux commandes :
//
//   pnpm images communs extraire            lit tous les mondes, écrit les tables communes (`packages/donnees/visuel/`) et copie les
//                                           images dans `apps/jeu/src/communs/` ; relançable (le résultat ne dépend que des mondes)
//   pnpm images communs proposer <monde>    pour chaque PNJ et objet du monde sans image, les assets communs les plus proches
//                                           (espèce, sexe, âge, métier) ; `--appliquer` écrit les références `commun:…` au manifeste
//
// Une histoire utilise un asset commun par une entrée de manifeste `commun:pnj/<id>` ou `commun:objets/<id>` (au lieu d'un fichier) :
// le client la résout (`apps/jeu/src/mondes.ts`) et la complétude du monde la compte comme une image.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chargerMonde, listerMondes, RACINE_MONDES } from '../../packages/regles/src/monde/chargeur';
import { ageApproximatif, FichierOuvertures, voixDuPnj } from '../../apps/jeu/src/ouvertures-regles';
import { cleParole, texteDeParole } from '../../apps/jeu/src/paroles-regles';
import { lireReferenceCommune, proposerObjets, proposerPortraits, referenceCommune, TableObjetsHistoires, TablePnjCommuns, type EntreeObjetCommun, type EntreePnjCommun, type EntreeSalutationCommune, type TrancheAge } from '../../packages/regles/src/monde/communs';

const RACINE = join(import.meta.dirname, '..', '..');
const VISUEL = join(RACINE, 'packages', 'donnees', 'visuel');
const COMMUNS = join(RACINE, 'apps', 'jeu', 'src', 'communs');
const DIALOGUES = join(RACINE, 'apps', 'jeu', 'src', 'voix', 'dialogues');
const EQUIPEMENT = join(RACINE, 'apps', 'jeu', 'src', 'equipement');

// ---------------------------------------------------------------------------------------------------------------------------------
// Étiquettes
// ---------------------------------------------------------------------------------------------------------------------------------

const sansAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** L'espèce jouable d'après le texte libre des fiches (« humain, noyé » → humain) ; sinon « autre ». */
const ESPECES: [RegExp, string][] = [
  [/hobgobelin/, 'hobgobelin'], [/gobelours/, 'gobelours'], [/gobelin/, 'gobelin'], [/drake|dragonborn/, 'drakeide'], [/tieffelin/, 'tieffelin'],
  [/halfelin/, 'halfelin'], [/goliath/, 'goliath'], [/gnome/, 'gnome'], [/nain/, 'nain'], [/elfe/, 'elfe'], [/orc/, 'orc'], [/ogre/, 'ogre'], [/humain/, 'humain'],
];
export function especeNormalisee(texte: string): string {
  const t = sansAccents(texte);
  if (/spectre|fantome|noye|voix sans corps|construction|armure animee/.test(t) && !/^(humain|nain|elfe)$/.test(t)) return ESPECES.find(([m]) => m.test(t))?.[1] ?? 'autre';
  return ESPECES.find(([m]) => m.test(t))?.[1] ?? 'autre';
}

export function trancheAge(age: string | undefined): TrancheAge {
  const n = ageApproximatif(age);
  if (n === undefined) return 'inconnu';
  return n < 18 ? 'enfant' : n < 30 ? 'jeune' : n < 50 ? 'adulte' : n < 65 ? 'mur' : 'age';
}

/** Métiers reconnus dans le titre et le rôle d'un PNJ. */
const METIERS: [string, RegExp][] = [
  ['aubergiste', /aubergist|tavern|cabaret|hote/], ['marchand', /marchand|commercant|colporteur|negociant|boutiqu|apothicaire|vendeur/],
  ['forgeron', /forge|fondeur|armurier|taillandier/], ['garde', /garde|milic|sentinelle|soldat|guet|veilleur|sergent|capitaine|gardien|peager/],
  ['pretre', /pretre|pretresse|clerc|moine|moniale|acolyte|mere-gardienne|sacristain|chapelain|temple|eglise|devot/],
  ['erudit', /erudit|savant|mage|magicien|sorcier|archimage|alchimiste|scribe|archiviste|bibliothec|historien/],
  ['voleur', /voleur|bandit|brigand|contrebandier|espion|informateur|assassin|pillard|maraudeur|deserteur/],
  ['noble', /noble|duc|baron|bailli|maire|seigneur|comte|chancelier|doyen|conseiller|roi|reine|prince/],
  ['paysan', /paysan|fermier|metayer|meunier|laboureur|eleveur|berger|boulanger|cuisinier|ouvrier|tisserand|veuve|refugie/],
  ['pecheur', /pecheur|marin|batelier|passeur|capitaine de port|pilote|nautonier/], ['mineur', /mineur|contremaitre|carrier/],
  ['chasseur', /chasseur|bucheron|trappeur|forestier|guide|eclaireur|pisteur|rodeur/], ['artiste', /menestrel|barde|chantre|chanteur|musicien|conteur|jongleur/],
  ['guerisseur', /guerisseur|herboriste|medecin|infirmi|soigneur/], ['enfant', /enfant|gamin|orphelin|apprenti/], ['monstre', /gobelin|hobgobelin|ogre|kobold|chef de bande|gobelours/],
];
export function metiersDe(titre: string | undefined, role: string | undefined): string[] {
  const t = sansAccents(`${titre ?? ''} ${role ?? ''}`);
  return METIERS.filter(([, m]) => m.test(t)).map(([n]) => n);
}

const MOTS = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

/** Une ligne dite à voix haute est réutilisable si elle ne cite ni nom propre, ni chiffre, ni lieu et reste courte. */
export function estGenerique(texte: string): boolean {
  if (MOTS(texte) > 30 || /\d/.test(texte)) return false;
  // Majuscule en milieu de phrase = nom propre probable (on ignore le début des phrases et des répliques entre guillemets).
  const morceaux = texte.split(/(?<=[.!?…])\s+|«\s*|»/).map((s) => s.trim()).filter(Boolean);
  for (const m of morceaux) {
    const mots = m.split(/\s+/).slice(1);
    if (mots.some((w) => /^[A-ZÀ-Ý][a-zà-ÿ'-]+/.test(w) && !/^(Je|Vous|Ah|Eh|Oh|Dieu|Bon|Hé|Hey|Non|Oui|Ça)$/.test(w))) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------------------------------------------------------------

interface BrutPnj {
  id: string;
  sujets?: unknown[];
  salutations?: { commune?: string };
}

function pnjBruts(monde: string): Map<string, BrutPnj> {
  const res = new Map<string, BrutPnj>();
  const dossier = join(RACINE_MONDES, monde, 'pnj');
  if (!existsSync(dossier)) return res;
  for (const f of readdirSync(dossier).filter((n) => n.endsWith('.json'))) for (const p of JSON.parse(readFileSync(join(dossier, f), 'utf8')) as BrutPnj[]) res.set(p.id, p);
  return res;
}

function extraire(): void {
  mkdirSync(join(COMMUNS, 'pnj'), { recursive: true });
  mkdirSync(join(COMMUNS, 'objets'), { recursive: true });
  const ouv = FichierOuvertures.parse(JSON.parse(readFileSync(join(RACINE, 'packages', 'donnees', 'repliques', 'ouvertures.json'), 'utf8')));
  if (!ouv.voix) throw new Error('Aucune voix choisie dans ouvertures.json.');
  const pnjs: EntreePnjCommun[] = [];
  const objets: EntreeObjetCommun[] = [];
  const salutations: EntreeSalutationCommune[] = [];
  const idsPris = new Set<string>();
  const libre = (id: string, monde: string) => {
    let c = id;
    if (idsPris.has(c)) c = `${monde}-${id}`;
    let n = 2;
    while (idsPris.has(c)) c = `${monde}-${id}-${n++}`;
    idsPris.add(c);
    return c;
  };

  for (const monde of listerMondes()) {
    const r = chargerMonde(join(RACINE_MONDES, monde));
    if (!r.ok) {
      console.log(`  (monde illisible, ignoré : ${monde})`);
      continue;
    }
    const dm = r.monde;
    const fichierManifeste = join(RACINE_MONDES, monde, 'images', 'manifeste.json');
    const manifeste = existsSync(fichierManifeste) ? (JSON.parse(readFileSync(fichierManifeste, 'utf8')) as { pnj?: Record<string, string>; objets?: Record<string, string> }) : {};
    const bruts = pnjBruts(monde);
    const donneurs = new Set([...dm.quetes.values()].map((q) => q.donneur).filter(Boolean) as string[]);

    for (const p of dm.pnj.values()) {
      const fichier = manifeste.pnj?.[p.id];
      const source = fichier ? join(RACINE_MONDES, monde, 'images', fichier) : undefined;
      if (source && existsSync(source) && !fichier!.startsWith('commun:')) {
        const id = libre(p.id, monde);
        copyFileSync(source, join(COMMUNS, 'pnj', `${id}.webp`));
        const principal = donneurs.has(p.id) || (p.sujets?.length ?? 0) >= 8 || p.secrets.length >= 3;
        pnjs.push({
          id, nom: p.nom, origine: { monde, pnj: p.id }, espece: especeNormalisee(p.espece), sexe: p.sexe, age: p.age, tranche: trancheAge(p.age),
          metiers: metiersDe(p.titre, p.role), titre: p.titre, apparence: p.apparence, categorie: principal ? 'principal' : 'secondaire',
        });
      }
      // Salutations déjà dites avec la voix du PNJ (hors bibliothèque commune : celle-là est déjà partagée).
      const brut = bruts.get(p.id);
      if (brut?.salutations?.commune) continue;
      const voix = voixDuPnj(ouv.voix, p.sexe, p.id, ageApproximatif(p.age));
      for (const [ton, texte] of [['neutre', p.salutations.neutre], ['amical', p.salutations.amical], ['hostile', p.salutations.hostile]] as const) {
        if (!texte?.trim()) continue;
        const t = texteDeParole(texte);
        const cle = cleParole(t);
        if (!existsSync(join(DIALOGUES, voix.id, `${cle}.mp3`))) continue;
        salutations.push({ voix: voix.id, genre: voix.id.startsWith('f-') ? 'f' : 'm', ton, texte: t, cle, origine: { monde, pnj: p.id }, generique: estGenerique(t) });
      }
    }

    for (const o of dm.objets.values()) {
      const fichier = manifeste.objets?.[o.id];
      const source = fichier ? join(RACINE_MONDES, monde, 'images', fichier) : undefined;
      if (!source || !existsSync(source) || fichier!.startsWith('commun:')) continue;
      if (existsSync(join(EQUIPEMENT, `${o.id}.webp`))) continue; // déjà dans le catalogue commun (objet du SRD)
      const id = libre(o.id, monde);
      copyFileSync(source, join(COMMUNS, 'objets', `${id}.webp`));
      const intrigue = o.categorie === 'quete' || o.categorie === 'cle' || !!o.lore && /intrigue|preuve|canon/.test(o.lore);
      objets.push({
        id, nom: o.nom, origine: { monde, objet: o.id }, objetCategorie: o.categorie, rarete: o.rarete, magique: o.magique, resume: o.resume,
        categorie: intrigue || o.rarete === 'legendaire' ? 'intrigue' : 'generique',
      });
    }
  }

  const tri = <T extends { id: string }>(a: T[]) => a.sort((x, y) => x.id.localeCompare(y.id));
  const ecrire = (nom: string, o: unknown) => writeFileSync(join(VISUEL, nom), JSON.stringify(o, null, 2) + '\n');
  ecrire('pnj-communs.json', { version: 1, pnj: tri(pnjs) });
  ecrire('objets-histoires.json', { version: 1, objets: tri(objets) });
  ecrire('salutations-reprises.json', { version: 1, salutations: salutations.sort((a, b) => a.voix.localeCompare(b.voix) || a.ton.localeCompare(b.ton) || a.cle.localeCompare(b.cle)) });
  const gen = (a: { categorie: string }[], c: string) => a.filter((x) => x.categorie === c).length;
  console.log(`PNJ : ${pnjs.length} portraits (${gen(pnjs, 'secondaire')} secondaires, ${gen(pnjs, 'principal')} principaux)`);
  console.log(`Objets : ${objets.length} images (${gen(objets, 'generique')} génériques, ${gen(objets, 'intrigue')} d'intrigue)`);
  console.log(`Salutations : ${salutations.length} lignes déjà dites (${salutations.filter((s) => s.generique).length} réutilisables telles quelles)`);
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Proposition pour un monde
// ---------------------------------------------------------------------------------------------------------------------------------

function lireTable<T>(nom: string, schema: { parse: (x: unknown) => T }): T {
  return schema.parse(JSON.parse(readFileSync(join(VISUEL, nom), 'utf8')));
}

function proposer(monde: string, appliquer: boolean): void {
  const r = chargerMonde(join(RACINE_MONDES, monde));
  if (!r.ok) throw new Error(`Monde illisible : ${r.erreurs.map((e) => e.message).join(' ; ')}`);
  const dm = r.monde;
  const fichierManifeste = join(RACINE_MONDES, monde, 'images', 'manifeste.json');
  const manifeste = (existsSync(fichierManifeste) ? JSON.parse(readFileSync(fichierManifeste, 'utf8')) : { lieux: {}, pnj: {}, monstres: {}, objets: {}, cartes: {} }) as Record<string, Record<string, string>>;
  manifeste['pnj'] ??= {};
  manifeste['objets'] ??= {};
  const pnjCommuns = lireTable('pnj-communs.json', TablePnjCommuns).pnj.filter((e) => e.origine.monde !== monde);
  const objetsCommuns = lireTable('objets-histoires.json', TableObjetsHistoires).objets.filter((e) => e.origine.monde !== monde);
  const utilises = new Set<string>();
  for (const f of [...Object.values(manifeste['pnj']!), ...Object.values(manifeste['objets']!)]) {
    const ref = lireReferenceCommune(f);
    if (ref) utilises.add(`${ref.groupe}/${ref.id}`);
  }
  let poses = 0;
  console.log(`\nPNJ de « ${monde} » sans image :`);
  for (const p of dm.pnj.values()) {
    if (manifeste['pnj']![p.id]) continue;
    const demande = { espece: especeNormalisee(p.espece), sexe: p.sexe, tranche: trancheAge(p.age), metiers: metiersDe(p.titre, p.role) };
    const exclus = new Set([...utilises].filter((u) => u.startsWith('pnj/')).map((u) => u.slice(4)));
    const propositions = proposerPortraits(pnjCommuns, demande, exclus, 3);
    console.log(`  ${p.id} (${demande.espece}, ${p.sexe}, ${demande.tranche}, ${demande.metiers.join('/') || 'sans métier'})`);
    for (const { entree, score } of propositions) console.log(`    ${String(score).padStart(3)}  ${entree.id}  (${entree.origine.monde}/${entree.nom}, ${entree.categorie})`);
    const meilleure = propositions[0];
    if (appliquer && meilleure && meilleure.score >= 60) {
      manifeste['pnj']![p.id] = referenceCommune('pnj', meilleure.entree.id);
      utilises.add(`pnj/${meilleure.entree.id}`);
      poses++;
    }
  }
  console.log(`\nObjets de « ${monde} » sans image :`);
  for (const o of dm.objets.values()) {
    if (manifeste['objets']![o.id] || existsSync(join(EQUIPEMENT, `${o.id}.webp`))) continue;
    const propositions = proposerObjets(objetsCommuns, { categorie: o.categorie, rarete: o.rarete, magique: o.magique }, new Set([...utilises].filter((u) => u.startsWith('objets/')).map((u) => u.slice(7))), 3);
    console.log(`  ${o.id} (${o.categorie}, ${o.rarete})`);
    for (const { entree, score } of propositions) console.log(`    ${String(score).padStart(3)}  ${entree.id}  (${entree.origine.monde}/${entree.nom})`);
    const meilleure = propositions[0];
    // Un objet de quête ou une clé est propre à son intrigue : on propose, on n'applique pas.
    if (appliquer && meilleure && meilleure.score >= 80 && o.categorie !== 'quete' && o.categorie !== 'cle') {
      manifeste['objets']![o.id] = referenceCommune('objets', meilleure.entree.id);
      utilises.add(`objets/${meilleure.entree.id}`);
      poses++;
    }
  }
  if (appliquer) {
    mkdirSync(join(RACINE_MONDES, monde, 'images'), { recursive: true });
    writeFileSync(fichierManifeste, JSON.stringify(manifeste, null, 2) + '\n');
    console.log(`\n${poses} référence(s) commune(s) écrite(s) dans ${fichierManifeste}.`);
  } else console.log('\n(simulation : --appliquer écrit les meilleures propositions au manifeste)');
}

export async function lancerCommuns(args: string[]): Promise<void> {
  const [sous, monde] = args;
  if (sous === 'extraire') extraire();
  else if (sous === 'proposer' && monde) proposer(monde, args.includes('--appliquer'));
  else console.log('Usage : pnpm images communs extraire | proposer <monde> [--appliquer]');
}
