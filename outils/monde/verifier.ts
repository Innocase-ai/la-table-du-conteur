// Le bilan d'une histoire en une commande (`pnpm monde verifier <monde>`) : tout ce que l'auteur lançait un par un avant de dire « c'est
// prêt » (point V8 du skill creer-monde). Validation (modules et énigmes jouées compris), ce qui manque, estimation à jour, revue de
// secrets du canon, preuve des fins. Une rubrique ❌ bloque la publication ; une rubrique ⚠️ se lit et se décide.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Donnees } from '../../packages/regles/src/donnees';
import { Canon, Revue } from '../../packages/regles/src/monde/canon';
import { resumerCompletude, verifierCompletude, type Ecart } from '../../packages/regles/src/monde/completude';
import { diagnostiquerMonde } from '../../packages/regles/src/monde/diagnostiquer';
import { Estimation, estimerCampagne } from '../../packages/regles/src/monde/estimation';
import { ManifesteImages } from '../../packages/regles/src/monde/images';
import { listerRevue } from '../../packages/regles/src/monde/revue';
import { RACINE_MONDES } from '../../packages/regles/src/monde/chargeur';
import type { DonneesMonde } from '../../packages/regles/src/monde/schemas';
import { idImageCommune } from '../../packages/regles/src/modules/image-commune';
import { scenesDu } from '../../packages/regles/src/modules/scenes';
import { explorerParcours } from '../../packages/regles/src/verification/parcours';

const lireJson = (fichier: string): unknown => (existsSync(fichier) ? JSON.parse(readFileSync(fichier, 'utf8')) : undefined);

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
  });
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

/** Le bilan d'un monde : il lit les fichiers de son dossier (canon, revue, estimation, images, voix) et peut jouer le parcours. */
export function verifierMonde(id: string, dossier: string, dm: DonneesMonde, srd: Donnees, options: OptionsVerification = {}): BilanVerification {
  const publie = dm.monde.statut === 'publie';
  const rubriques: Rubrique[] = [];

  // 1. Validation : références, accessibilité, quêtes, rencontres, modules (fiches d'extension invalides comprises), énigmes jouées.
  const diag = diagnostiquerMonde(dm, srd);
  rubriques.push({
    nom: 'Validation',
    statut: diag.erreurs.length ? 'echec' : diag.avertissements.length ? 'avis' : 'ok',
    resume: `${pluriel(diag.erreurs.length, 'erreur')}, ${pluriel(diag.avertissements.length, 'avis')}`,
    details: premiers([...diag.erreurs.map((e) => `ERREUR  ${e}`), ...diag.avertissements.map((a) => `avis    ${a}`)]),
  });

  // 2. Ce qui manque : images, cartes, positions, scènes, voix, textes, estimation.
  const ecarts = completudeDuMonde(dossier, dm);
  const manques = ecarts.filter((x) => x.gravite === 'manque');
  rubriques.push({
    nom: 'Complétude',
    statut: manques.length ? 'echec' : ecarts.length ? 'avis' : 'ok',
    resume: `${pluriel(manques.length, 'manque')}, ${pluriel(ecarts.length - manques.length, 'avis')}${ecarts.length ? ` (${[...resumerCompletude(ecarts)].map(([r, n]) => `${r} ${n.manque + n.avis}`).join(', ')})` : ''}`,
    details: premiers(ecarts.map((x) => `${x.gravite === 'manque' ? 'MANQUE' : 'avis  '}  [${x.categorie}] ${x.cible} : ${x.detail}`)),
  });

  // 3. L'estimation de durée et de coût (affichée aux joueurs) correspond-elle au monde tel qu'il est ?
  const fichierEstimation = join(dossier, 'estimation.json');
  if (!existsSync(fichierEstimation)) {
    rubriques.push({ nom: 'Estimation', statut: publie ? 'echec' : 'avis', resume: 'estimation.json absent', details: ['pnpm monde estimer ' + id] });
  } else {
    const lue = Estimation.safeParse(lireJson(fichierEstimation));
    const aJour = lue.success && stable(lue.data) === stable(estimerCampagne(dm));
    rubriques.push({ nom: 'Estimation', statut: aJour ? 'ok' : publie ? 'echec' : 'avis', resume: aJour ? 'à jour' : 'périmée (le monde a changé depuis)', details: aJour ? [] : [`pnpm monde estimer ${id}`] });
  }

  // 4. La revue de secrets du canon : un mot tabou dans un texte libre est un secret qui fuit ; les noms inconnus, des inventions possibles.
  const fichierCanon = join(dossier, 'canon.json');
  if (!existsSync(fichierCanon)) {
    rubriques.push({ nom: 'Revue de secrets', statut: 'avis', resume: 'pas de canon.json : la revue n’a pas eu lieu', details: ['Le canon (secrets, mots tabou, personnages) se complète dans l’atelier, onglet Revue (« Compléter depuis le monde »).'] });
  } else {
    let canon: Canon | undefined;
    let revue: Revue = { rejets: [] };
    let probleme: string | undefined;
    try {
      const c = Canon.safeParse(lireJson(fichierCanon));
      if (c.success) canon = c.data;
      else probleme = `canon.json invalide : ${c.error.issues[0]?.path.join('.')} — ${c.error.issues[0]?.message}`;
      const r = Revue.safeParse(lireJson(join(dossier, 'revue.json')) ?? {});
      if (r.success) revue = r.data;
      else probleme ??= 'revue.json invalide';
    } catch (e) {
      probleme = `canon.json illisible : ${(e as Error).message}`;
    }
    if (!canon) {
      rubriques.push({ nom: 'Revue de secrets', statut: 'echec', resume: probleme ?? 'canon.json invalide', details: [] });
    } else {
      const alertes = listerRevue(dm, canon, revue);
      const fuites = alertes.filter((a) => a.code === 'revue.secret');
      const autres = alertes.filter((a) => a.code !== 'revue.secret');
      const par = (code: string) => autres.filter((a) => a.code === code).length;
      rubriques.push({
        nom: 'Revue de secrets',
        statut: fuites.length ? 'echec' : autres.length ? 'avis' : 'ok',
        resume: `secrets du canon : ${canon.secrets.length} (${canon.secrets.filter((s) => s.motsTabou.length).length} avec mots tabou) ; ${pluriel(fuites.length, 'fuite')}, ${pluriel(par('revue.personnage'), 'écart')} de personnage, ${pluriel(par('revue.nom-inconnu'), 'nom')} inconnu(s), ${pluriel(par('revue.lien-reciproque'), 'lien')} non réciproque(s)`,
        details: premiers([...fuites, ...autres].map((a) => `${a.code === 'revue.secret' ? 'FUITE ' : 'avis  '}  ${a.message}`)).concat(probleme ? [probleme] : []),
      });
    }
  }

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
        ...rap.finsNonAtteintes.map((f) => `NON ATTEINTE  ${f}${rap.arret === 'epuise' ? ' (tous les états explorés)' : ' (budget épuisé : relancer avec --etats plus grand ; ce n’est pas une preuve d’impossibilité)'}`),
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
  lignes.push(bloquants.length ? `\n❌ Pas prêt : ${bloquants.map((r) => r.nom).join(', ')}.` : `\n✅ Rien ne bloque${aLire.length ? ` ; à lire : ${aLire.map((r) => r.nom).join(', ')}` : ''}.`);
  return lignes;
}
