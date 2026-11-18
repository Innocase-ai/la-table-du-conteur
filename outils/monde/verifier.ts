// Le bilan d'une histoire en une commande (`pnpm monde verifier <monde>`) : tout ce que l'auteur lançait un par un avant de dire « c'est
// prêt » (point V8 du skill creer-monde). Validation (modules et énigmes jouées compris), ce qui manque, estimation à jour, revue de
// secrets du canon, preuve des fins. Une rubrique ❌ bloque la publication ; une rubrique ⚠️ se lit et se décide.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { Donnees } from '../../packages/regles/src/donnees';
import { Canon, Revue } from '../../packages/regles/src/monde/canon';
import { resumerCompletude, verifierCompletude, type Ecart } from '../../packages/regles/src/monde/completude';
import { diagnostiquerMonde } from '../../packages/regles/src/monde/diagnostiquer';
import { Estimation, estimerCampagne } from '../../packages/regles/src/monde/estimation';
import { TableObjetsHistoires, TablePnjCommuns } from '../../packages/regles/src/monde/communs';
import { ManifesteImages, type IdsCommuns } from '../../packages/regles/src/monde/images';
import { cleDeRevue, listerRevue, revoirMonde } from '../../packages/regles/src/monde/revue';
import { diagnosticDeMessage, estDefautDeJeu, type Diagnostic } from '../../packages/regles/src/monde/diagnostics';
import type { DiagnosticMonde } from '../../packages/regles/src/monde/diagnostiquer';
import { RACINE_MONDES } from '../../packages/regles/src/monde/chargeur';
import type { DonneesMonde } from '../../packages/regles/src/monde/schemas';
import { idImageCommune } from '../../packages/regles/src/modules/image-commune';
import { scenesDu } from '../../packages/regles/src/modules/scenes';
import { explorerParcours } from '../../packages/regles/src/verification/parcours';
import { conseilArret } from './cli-aide';

/** Lit un fichier JSON ; absent : `undefined` ; mal formé : une erreur qui nomme le fichier (audit du 18/11/2026, O2), jamais un plantage nu. */
const lireJson = (fichier: string): unknown => {
  if (!existsSync(fichier)) return undefined;
  try {
    return JSON.parse(readFileSync(fichier, 'utf8'));
  } catch (e) {
    throw new Error(`${basename(fichier)} illisible : ${(e as Error).message}`);
  }
};

/** Ce qui manque à un monde (images, cartes, positions, scènes, voix, textes, estimation) : lit les fichiers du dossier du monde. */
export function completudeDuMonde(dossier: string, dm: DonneesMonde): Ecart[] {
  const manifeste = ManifesteImages.safeParse(lireJson(join(dossier, 'images/manifeste.json')) ?? {});
  const equipement = join(RACINE_MONDES, '../../apps/jeu/src/equipement');
  const noms = (d: string, ext: string) => new Set(existsSync(d) ? readdirSync(d).filter((f) => f.endsWith(ext)).map((f) => f.slice(0, -ext.length)) : []);
  return verifierCompletude({
    dm,
    manifeste: manifeste.success ? manifeste.data : undefined,
    imagesCommunes: noms(equipement, '.webp'),
    idImageCommune,
    scenes: scenesDu(dm).scenes,
    voix: noms(join(dossier, 'voix'), '.mp3'),
    estimationPresente: existsSync(join(dossier, 'estimation.json')),
    // Le disque et la bibliothèque commune (audit du 18/11/2026, rang 3) : une image citée mais absente, une référence commune inconnue.
    fichiersImages: new Set(existsSync(join(dossier, 'images')) ? readdirSync(join(dossier, 'images')) : []),
    communs: idsCommuns(),
  });
}

/** Les ids de la bibliothèque commune (`packages/donnees/visuel/pnj-communs.json` et `objets-histoires.json`). */
function idsCommuns(): IdsCommuns {
  const visuel = join(RACINE_MONDES, '../donnees/visuel');
  const pnj = TablePnjCommuns.safeParse(lireJson(join(visuel, 'pnj-communs.json')));
  const objets = TableObjetsHistoires.safeParse(lireJson(join(visuel, 'objets-histoires.json')));
  return { pnj: new Set(pnj.success ? pnj.data.pnj.map((e) => e.id) : []), objets: new Set(objets.success ? objets.data.objets.map((e) => e.id) : []) };
}

export type StatutRubrique = 'ok' | 'avis' | 'echec' | 'saute';

export interface Rubrique {
  nom: string;
  statut: StatutRubrique;
  /** Une ligne : le compte. */
  resume: string;
  /** Les lignes à lire (les premières ; les autres sont comptées dans `resume`). */
  details: string[];
}

export interface BilanVerification {
  monde: string;
  statut: 'brouillon' | 'publie';
  rubriques: Rubrique[];
  /** Aucune rubrique ❌ : rien ne bloque la publication. */
  ok: boolean;
}

export interface OptionsVerification {
  /** Jouer le parcours automatique (défaut : oui). */
  parcours?: boolean;
  etats?: number;
  ms?: number;
  graines?: number[];
}

const MAX_DETAILS = 8;
const premiers = (lignes: string[]): string[] => (lignes.length > MAX_DETAILS ? [...lignes.slice(0, MAX_DETAILS), `… et ${lignes.length - MAX_DETAILS} autre(s)`] : lignes);
const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 && !mot.endsWith('s') ? 's' : ''}`;

/** Une écriture stable (clés triées) pour comparer deux estimations. */
const stable = (x: unknown): string => JSON.stringify(x, (_k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))) : v));

/** Le `revue.json` d'un monde (vide s'il n'existe pas) ; mal formé, une erreur qui nomme le fichier. */
export function lireRevue(dossier: string): Revue {
  const brut = lireJson(join(dossier, 'revue.json'));
  const r = Revue.safeParse(brut ?? {});
  if (!r.success) throw new Error('revue.json invalide');
  return r.data;
}

/** Un avis du validateur : sa phrase (comme le CLI l'écrit) et son diagnostic (code, entité). */
export interface LigneAvis {
  texte: string;
  d: Diagnostic;
}

/**
 * Les avis du validateur rangés : `conseils` (richesse, longueurs… : ils ne bloquent jamais), `defauts` de jeu (ils font échouer un monde publié) et
 * ce que `revue.json` écarte (`rejetes` : des conseils jugés sans objet ; `acceptes` : des défauts acceptés, avec leur raison dans `revue.raisons`).
 */
export function classerAvis(diag: DiagnosticMonde, revue: Revue): { lignes: LigneAvis[]; conseils: LigneAvis[]; defauts: LigneAvis[]; rejetes: LigneAvis[]; acceptes: LigneAvis[] } {
  // Les avis du diagnostic sont, dans l'ordre, ceux de `avertissements` (les contrôles de l'atelier, source « controles », s'y ajoutent sans y figurer).
  const diags = diag.diagnostics.filter((d) => d.gravite === 'avis' && d.source !== 'controles');
  const lignes: LigneAvis[] = diag.avertissements.map((texte, i) => ({ texte, d: diags.length === diag.avertissements.length ? diags[i]! : diagnosticDeMessage(texte, 'avis') }));
  const rejetes = new Set(revue.rejets);
  const ecarte = (l: LigneAvis) => rejetes.has(cleDeRevue(l.d));
  return {
    lignes,
    conseils: lignes.filter((l) => !estDefautDeJeu(l.d.code) && !ecarte(l)),
    defauts: lignes.filter((l) => estDefautDeJeu(l.d.code) && !ecarte(l)),
    rejetes: lignes.filter((l) => !estDefautDeJeu(l.d.code) && ecarte(l)),
    acceptes: lignes.filter((l) => estDefautDeJeu(l.d.code) && ecarte(l)),
  };
}

/** Le bilan d'un monde : il lit les fichiers de son dossier (canon, revue, estimation, images, voix) et peut jouer le parcours. */
export function verifierMonde(id: string, dossier: string, dm: DonneesMonde, srd: Donnees, options: OptionsVerification = {}): BilanVerification {
  const publie = dm.monde.statut === 'publie';
  const rubriques: Rubrique[] = [];

  // revue.json : les avis rejetés et les défauts acceptés (avec leur raison). Mal formé, il est dit plus bas, dans la revue de secrets.
  let revue: Revue = { rejets: [], raisons: {} };
  let problemeRevue: string | undefined;
  try {
    const rv = Revue.safeParse(lireJson(join(dossier, 'revue.json')) ?? {});
    if (rv.success) revue = rv.data;
    else problemeRevue = 'revue.json invalide';
  } catch (e) {
    problemeRevue = (e as Error).message;
  }

  // 1. Validation : références, accessibilité, quêtes, rencontres, modules (fiches d'extension invalides comprises), énigmes jouées.
  // Ici les erreurs et les conseils d'écriture ; les défauts de jeu ont leur rubrique, juste après.
  const diag = diagnostiquerMonde(dm, srd);
  const avis = classerAvis(diag, revue);
  rubriques.push({
    nom: 'Validation',
    statut: diag.erreurs.length ? 'echec' : avis.conseils.length ? 'avis' : 'ok',
    resume: `${pluriel(diag.erreurs.length, 'erreur')}, ${pluriel(avis.conseils.length, 'avis')}${avis.rejetes.length ? ` (${avis.rejetes.length} rejeté(s) dans revue.json)` : ''}`,
    details: premiers([...diag.erreurs.map((e) => `ERREUR  ${e}`), ...avis.conseils.map((l) => `avis    ${l.texte}`)]),
  });

  // 2. Ce qui manque : images, cartes, positions, scènes, voix, textes, estimation.
  try {
    const ecarts = completudeDuMonde(dossier, dm);
    const manques = ecarts.filter((x) => x.gravite === 'manque');
    rubriques.push({
      nom: 'Complétude',
      statut: manques.length ? 'echec' : ecarts.length ? 'avis' : 'ok',
      resume: `${pluriel(manques.length, 'manque')}, ${pluriel(ecarts.length - manques.length, 'avis')}${ecarts.length ? ` (${[...resumerCompletude(ecarts)].map(([r, n]) => `${r} ${n.manque + n.avis}`).join(', ')})` : ''}`,
      details: premiers(ecarts.map((x) => `${x.gravite === 'manque' ? 'MANQUE' : 'avis  '}  [${x.categorie}] ${x.cible} : ${x.detail}`)),
    });
  } catch (e) {
    rubriques.push({ nom: 'Complétude', statut: 'echec', resume: (e as Error).message, details: ['Corrigez le fichier : la complétude n’a pas pu être vérifiée.'] });
  }

  // 3. L'estimation de durée et de coût (affichée aux joueurs) correspond-elle au monde tel qu'il est ?
  const fichierEstimation = join(dossier, 'estimation.json');
  if (!existsSync(fichierEstimation)) {
    rubriques.push({ nom: 'Estimation', statut: publie ? 'echec' : 'avis', resume: 'estimation.json absent', details: ['pnpm monde estimer ' + id] });
  } else {
    let brut: unknown;
    let illisible: string | undefined;
    try {
      brut = lireJson(fichierEstimation);
    } catch (e) {
      illisible = (e as Error).message;
    }
    if (illisible) {
      rubriques.push({ nom: 'Estimation', statut: 'echec', resume: illisible, details: [`pnpm monde estimer ${id} la réécrit`] });
    } else {
      const lue = Estimation.safeParse(brut);
      const aJour = lue.success && stable(lue.data) === stable(estimerCampagne(dm));
      rubriques.push({ nom: 'Estimation', statut: aJour ? 'ok' : publie ? 'echec' : 'avis', resume: aJour ? 'à jour' : 'périmée (le monde a changé depuis)', details: aJour ? [] : [`pnpm monde estimer ${id}`] });
    }
  }

  let defautsRevue: Diagnostic[] = [];
  let acceptesRevue: Diagnostic[] = [];
  // 4. La revue de secrets du canon : un mot tabou dans un texte libre est un secret qui fuit ; les noms inconnus, des inventions possibles.
  const fichierCanon = join(dossier, 'canon.json');
  if (!existsSync(fichierCanon)) {
    rubriques.push({ nom: 'Revue de secrets', statut: 'avis', resume: 'pas de canon.json : la revue n’a pas eu lieu', details: ['Le canon (secrets, mots tabou, personnages) se complète dans l’atelier, onglet Revue (« Compléter depuis le monde »).'] });
  } else {
    let canon: Canon | undefined;
    let probleme: string | undefined;
    try {
      const c = Canon.safeParse(lireJson(fichierCanon));
      if (c.success) canon = c.data;
      else probleme = `canon.json invalide : ${c.error.issues[0]?.path.join('.')} — ${c.error.issues[0]?.message}`;
    } catch (e) {
      probleme = (e as Error).message;
    }
    // Un revue.json mal formé est dit, sous son nom, et empêche la revue : sans lui, on ne sait pas quelles alertes l'auteur a rejetées.
    if (!canon) {
      rubriques.push({ nom: 'Revue de secrets', statut: 'echec', resume: probleme ?? 'canon.json invalide', details: [] });
    } else if (problemeRevue) {
      rubriques.push({ nom: 'Revue de secrets', statut: 'echec', resume: problemeRevue, details: ['La revue n’a pas eu lieu : corrigez ce fichier d’abord.'] });
    } else {
      const alertes = listerRevue(dm, canon, revue);
      // Un fait détenu hors du canon est un défaut de jeu : il est dans la rubrique « Défauts de jeu ».
      defautsRevue = alertes.filter((a) => estDefautDeJeu(a.code));
      acceptesRevue = revoirMonde(dm, canon).filter((a) => estDefautDeJeu(a.code) && revue.rejets.includes(cleDeRevue(a)));
      const fuites = alertes.filter((a) => a.code === 'revue.secret');
      const autres = alertes.filter((a) => a.code !== 'revue.secret' && !estDefautDeJeu(a.code));
      const par = (code: string) => autres.filter((a) => a.code === code).length;
      rubriques.push({
        nom: 'Revue de secrets',
        statut: fuites.length ? 'echec' : autres.length || !canon.secrets.length ? 'avis' : 'ok',
        resume: `secrets du canon : ${canon.secrets.length} (${canon.secrets.filter((s) => s.motsTabou.length).length} avec mots tabou) ; ${pluriel(fuites.length, 'fuite')}, ${pluriel(par('revue.personnage'), 'écart')} de personnage, ${pluriel(par('revue.nom-inconnu'), 'nom')} inconnu(s), ${pluriel(par('revue.lien-reciproque'), 'lien')} non réciproque(s)`,
        details: [...(canon.secrets.length ? [] : ['avis    Le canon ne contient aucun secret : la revue ne surveille rien. Complétez canon.json (secrets, mots tabou) dans l’atelier, onglet Revue.'])].concat(premiers([...fuites, ...autres].map((a) => `${a.code === 'revue.secret' ? 'FUITE ' : 'avis  '}  ${a.message}`))).concat(probleme ? [probleme] : []),
      });
    }
  }

  // Les défauts de jeu (objet introuvable, drapeau jamais posé, quête sautable, lieu sans retour, condition impossible, texte mort, fait hors canon) :
  // un monde publié qui en a n'est pas prêt, sauf défaut accepté dans revue.json avec sa raison. Les conseils d'écriture ne bloquent jamais.
  const defautsAFaire = [...avis.defauts.map((l) => ({ texte: l.texte, d: l.d })), ...defautsRevue.map((a) => ({ texte: a.message, d: a }))];
  const lignesDefauts = defautsAFaire.map((x) => x.texte);
  const acceptes = [...avis.acceptes.map((l) => ({ texte: l.texte, d: l.d })), ...acceptesRevue.map((a) => ({ texte: a.message, d: a }))];
  rubriques.splice(1, 0, {
    nom: 'Défauts de jeu',
    statut: lignesDefauts.length ? (publie ? 'echec' : 'avis') : 'ok',
    resume: `${pluriel(lignesDefauts.length, 'défaut')}${acceptes.length ? `, ${acceptes.length} accepté(s) dans revue.json` : ''}`,
    details: premiers([
      // La clé est à copier dans `rejets` de revue.json pour accepter le défaut (et la raison dans `raisons`).
      ...defautsAFaire.map((x) => `DÉFAUT  ${x.texte}  [clé : ${cleDeRevue(x.d)}]`),
      ...acceptes.map((a) => `accepté ${a.texte} — raison : ${revue.raisons[cleDeRevue(a.d)] ?? '(aucune raison écrite : ajoutez-la dans revue.json, « raisons »)'}`),
    ]),
  });

  // 5. Les fins arrivent-elles ? Un joueur automatique joue le vrai moteur (combats supposés gagnés).
  if (options.parcours === false) {
    rubriques.push({ nom: 'Parcours', statut: 'saute', resume: 'non joué (--sans-parcours)', details: [] });
  } else if (dm.fins.size === 0) {
    rubriques.push({ nom: 'Parcours', statut: 'avis', resume: 'aucune fin définie : rien à prouver', details: [] });
  } else {
    const rap = explorerParcours({ dm, srd }, { budgetEtats: options.etats ?? 6000, budgetMs: options.ms ?? 120_000, ...(options.graines ? { graines: options.graines } : {}) });
    const c = rap.couverture;
    rubriques.push({
      nom: 'Parcours',
      statut: rap.finsNonAtteintes.length ? 'echec' : 'ok',
      resume: `${rap.parcours.length}/${dm.fins.size} fins atteintes (${rap.etats} états ; arrêt : ${rap.arret})`,
      details: [
        ...rap.finsNonAtteintes.map((f) => `NON ATTEINTE  ${f} (${conseilArret(rap.arret) ?? 'budget épuisé'}${rap.arret === 'epuise' ? '' : ' ; ce n’est pas une preuve d’impossibilité'})`),
        'vu : ' + (['lieux', 'pnj', 'rencontres', 'evenements', 'faits', 'enigmes'] as const).map((k) => `${k} ${c[k].vus.length}/${c[k].vus.length + c[k].jamais.length}`).join(' · '),
      ],
    });
  }

  return { monde: id, statut: dm.monde.statut, rubriques, ok: rubriques.every((r) => r.statut !== 'echec') };
}

const ICONES: Record<StatutRubrique, string> = { ok: '✅', avis: '⚠️ ', echec: '❌', saute: '⏭️ ' };

/** Le bilan en lignes de texte, pour la console. */
export function afficherBilan(b: BilanVerification): string[] {
  const lignes = [`\nVérification de ${b.monde} (${b.statut === 'publie' ? 'publié' : 'brouillon'})`];
  for (const r of b.rubriques) {
    lignes.push(`${ICONES[r.statut]} ${r.nom.padEnd(17)} ${r.resume}`);
    for (const d of r.details) lignes.push(`       ${d}`);
  }
  const bloquants = b.rubriques.filter((r) => r.statut === 'echec');
  const aLire = b.rubriques.filter((r) => r.statut === 'avis');
  // Sans parcours joué, aucune fin n'est prouvée : le dire (audit du 18/11/2026, O3).
  const nonJoue = b.rubriques.some((x) => x.nom === 'Parcours' && x.statut === 'saute');
  lignes.push(bloquants.length ? `\n❌ Pas prêt : ${bloquants.map((r) => r.nom).join(', ')}.` : `\n✅ Rien ne bloque${nonJoue ? ' (parcours non joué)' : ''}${aLire.length ? ` ; à lire : ${aLire.map((r) => r.nom).join(', ')}` : ''}.`);
  return lignes;
}
