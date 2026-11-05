// L'écriture d'une fiche dans un fichier de monde, avec toutes les précautions : Claude Code et les agents écrivent dans les
// mêmes fichiers, donc on refuse si le fichier a changé depuis qu'on l'a lu (empreinte), on valide la fiche avec son schéma avant
// d'écrire, on ne change que l'élément visé (le reste du fichier reste identique à l'octet près) et on écrit de façon atomique.
// Fonctions synchrones, sans dépendance à Vite, testées dans ecriture.test.ts.
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
// Imports relatifs (et non `@crpg/regles`) : ce fichier est chargé par la configuration de Vite, qui ne sait pas lire le TypeScript d'un paquet.
import { ajouterElement, elementsDuFichier, indexDeElement, remplacerElement } from '../../packages/regles/src/monde/ecriture-json';
import { problemeIdentifiant } from '../../packages/regles/src/monde/identifiants';
import { champIdentifiant, DOSSIERS_EDITABLES, schemaDuDossier } from '../../packages/regles/src/monde/schemas-par-dossier';
import { cheminFichierValide, resoudre } from './chemins';

export const TAILLE_MAX_FICHE = 400_000;

export interface DemandeEcriture {
  monde: string;
  /** `<dossier>/<fichier>.json`. */
  chemin: string;
  mode: 'remplacer' | 'ajouter';
  /** Pour `remplacer` : l'identifiant de la fiche à remplacer. */
  id?: string;
  valeur: unknown;
  /** L'empreinte du fichier telle que la page l'a lue ; `null` pour créer un fichier qui n'existe pas encore. */
  empreinteAttendue: string | null;
}

export type ResultatEcriture =
  | { ok: true; empreinte: string }
  | { ok: false; statut: 400 | 403 | 404 | 409 | 413 | 500; erreur: string; empreinteActuelle?: string };

export const empreinteDe = (texte: string): string => createHash('sha256').update(texte).digest('hex');

const refus = (statut: 400 | 403 | 404 | 409 | 413 | 500, erreur: string, empreinteActuelle?: string): ResultatEcriture => ({ ok: false, statut, erreur, ...(empreinteActuelle ? { empreinteActuelle } : {}) });

const pause = (ms: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/** Écrit un fichier de façon atomique : dans un fichier temporaire du même dossier, puis renommé (quelques essais : sous Windows un éditeur ou un antivirus peut le tenir un instant). */
export function ecrireAtomique(chemin: string, texte: string): void {
  const tmp = `${chemin}.tmp-${process.pid}`;
  writeFileSync(tmp, texte, 'utf8');
  let derniere: unknown;
  for (let essai = 0; essai < 4; essai++) {
    try {
      renameSync(tmp, chemin);
      return;
    } catch (e) {
      derniere = e;
      pause(40 * (essai + 1));
    }
  }
  try {
    unlinkSync(tmp);
  } catch {
    // le temporaire a déjà disparu
  }
  throw derniere;
}

/** Les identifiants déjà pris dans un dossier du monde, tous fichiers confondus (pour refuser un doublon). */
function idsDuDossier(dossierAbsolu: string, champ: 'id' | 'pnj'): Set<string> {
  const ids = new Set<string>();
  if (!existsSync(dossierAbsolu)) return ids;
  for (const f of readdirSync(dossierAbsolu).filter((x) => x.endsWith('.json'))) {
    try {
      const contenu = JSON.parse(readFileSync(join(dossierAbsolu, f), 'utf8')) as unknown;
      for (const e of Array.isArray(contenu) ? contenu : [contenu]) {
        const id = (e as Record<string, unknown> | null)?.[champ];
        if (typeof id === 'string') ids.add(id);
      }
    } catch {
      // un fichier illisible ne fait pas d'id
    }
  }
  return ids;
}

export function ecrireFiche(racine: string, d: DemandeEcriture): ResultatEcriture {
  if (d.mode !== 'remplacer' && d.mode !== 'ajouter') return refus(400, 'Mode inconnu.');
  if (!cheminFichierValide(d.chemin) || d.chemin.startsWith('monde.json') || d.chemin.startsWith('canon.json')) return refus(403, 'Seuls les fichiers de données d’un dossier du monde peuvent être modifiés.');
  const dossier = d.chemin.split('/')[0]!;
  if (!DOSSIERS_EDITABLES.includes(dossier)) return refus(403, `Le dossier « ${dossier} » n’est pas modifiable depuis l’atelier.`);
  const fichier = resoudre(racine, d.monde, d.chemin);
  if (!fichier) return refus(403, 'Chemin refusé.');
  if (!d.valeur || typeof d.valeur !== 'object' || Array.isArray(d.valeur)) return refus(400, 'La fiche doit être un objet.');
  if (JSON.stringify(d.valeur).length > TAILLE_MAX_FICHE) return refus(413, 'Fiche trop grande.');

  // La fiche doit respecter le schéma de son dossier : un fichier du monde ne reçoit jamais une fiche invalide.
  const schema = schemaDuDossier(dossier);
  if (!schema) return refus(403, `Le dossier « ${dossier} » n’a pas de schéma.`);
  const valide = schema.safeParse(d.valeur);
  if (!valide.success) {
    const i = valide.error.issues[0];
    return refus(400, `Fiche invalide : ${i?.path.join('.') || 'racine'} — ${i?.message}`);
  }
  const champ = champIdentifiant(dossier);
  const idFiche = (d.valeur as Record<string, unknown>)[champ];
  if (typeof idFiche !== 'string') return refus(400, `La fiche n’a pas de « ${champ} ».`);
  const probleme = problemeIdentifiant(idFiche);
  if (probleme) return refus(400, `Identifiant « ${idFiche} » : ${probleme}.`);

  const existe = existsSync(fichier);
  if (existe && !lstatSync(fichier).isFile()) return refus(403, 'Chemin refusé.');
  const texte = existe ? readFileSync(fichier, 'utf8') : '';
  const empreinte = existe ? empreinteDe(texte) : null;
  if (empreinte !== d.empreinteAttendue) {
    return refus(409, existe ? 'Le fichier a changé sur le disque depuis que vous l’avez ouvert : rechargez avant de modifier.' : 'Ce fichier n’existe pas (ou plus).', empreinte ?? undefined);
  }
  if (existe) {
    try {
      JSON.parse(texte);
    } catch {
      return refus(400, 'Le fichier existant contient du JSON invalide : corrigez-le d’abord.');
    }
    if (!elementsDuFichier(texte)) return refus(400, 'Le fichier existant n’est pas un tableau ou un objet JSON.');
  }

  let neuf: string;
  if (d.mode === 'remplacer') {
    if (!existe) return refus(404, 'Fichier introuvable.');
    if (!d.id) return refus(400, 'Il faut l’identifiant de la fiche à remplacer.');
    if (idFiche !== d.id) return refus(400, 'On ne change pas l’identifiant d’une fiche (les références seraient cassées).');
    const index = indexDeElement(texte, d.id);
    if (index < 0) return refus(404, `Fiche « ${d.id} » introuvable dans ce fichier.`);
    neuf = remplacerElement(texte, index, d.valeur);
  } else {
    if (idsDuDossier(dirname(fichier), champ).has(idFiche)) return refus(409, `L’identifiant « ${idFiche} » existe déjà dans le dossier « ${dossier} ».`);
    try {
      neuf = ajouterElement(texte, d.valeur);
    } catch (e) {
      return refus(400, (e as Error).message);
    }
    if (!existe) mkdirSync(dirname(fichier), { recursive: true });
  }
  // Garde-fou final : le fichier obtenu est du JSON, et contient bien la fiche attendue.
  try {
    const relu = JSON.parse(neuf) as unknown;
    const liste = Array.isArray(relu) ? relu : [relu];
    if (!liste.some((e) => (e as Record<string, unknown>)?.[champ] === idFiche)) return refus(500, 'Écriture annulée : la fiche n’apparaît pas dans le fichier obtenu.');
  } catch {
    return refus(500, 'Écriture annulée : le fichier obtenu n’est pas du JSON valide.');
  }
  try {
    ecrireAtomique(fichier, neuf);
  } catch (e) {
    return refus(500, `Écriture impossible : ${(e as Error).message}`);
  }
  return { ok: true, empreinte: empreinteDe(neuf) };
}
