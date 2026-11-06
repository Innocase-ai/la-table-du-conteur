// Messages français lisibles pour un fichier de groupe invalide (les messages du schéma Zod sont en anglais).
import { Groupe, lireGroupe } from '@crpg/regles';

const NOMS_CHAMPS: Record<string, string> = {
  version: 'version',
  niveau: 'niveau',
  emplacements: 'emplacements',
  id: 'identifiant',
  sexe: 'sexe',
  alignement: 'alignement',
  portrait: 'portrait',
  caractere: 'caractère',
  choix: 'choix',
  nom: 'nom',
  classe: 'classe',
  espece: 'espèce',
  historique: 'historique',
  methode: 'méthode de caractéristiques',
  valeursBase: 'caractéristiques de base',
  bonusHistorique: "bonus d'historique",
};

function chemin(path: (string | number)[]): string {
  const parties: string[] = [];
  for (let i = 0; i < path.length; i++) {
    const p = path[i]!;
    if (p === 'emplacements' && typeof path[i + 1] === 'number') {
      parties.push(`personnage ${(path[i + 1] as number) + 1}`);
      i++;
    } else if (typeof p === 'number') parties.push(`n° ${p + 1}`);
    else parties.push(NOMS_CHAMPS[p] ?? p);
  }
  return parties.join(' › ') || 'fichier';
}

/** Lit un groupe ; en cas d'échec renvoie un message en français. */
export function lireGroupeFrancais(texte: string): { ok: true; groupe: Groupe } | { ok: false; erreur: string } {
  const r = lireGroupe(texte);
  if (r.ok) return r;
  let brut: unknown;
  try {
    brut = JSON.parse(texte);
  } catch {
    return { ok: false, erreur: "Ce fichier n'est pas un groupe valide (JSON illisible)." };
  }
  const analyse = Groupe.safeParse(brut);
  if (analyse.success) return { ok: false, erreur: r.erreur };
  const i = analyse.error.issues[0]!;
  const ou = chemin(i.path);
  let motif: string;
  switch (i.code) {
    case 'invalid_type':
      motif = i.received === 'undefined' ? 'est manquant' : "n'a pas le bon type";
      break;
    case 'too_big':
      motif = i.type === 'array' ? `doit contenir au plus ${i.maximum} éléments` : `doit être au plus ${i.maximum}`;
      break;
    case 'too_small':
      motif = i.type === 'array' ? `doit contenir au moins ${i.minimum} éléments` : i.type === 'string' ? 'ne doit pas être vide' : `doit être au moins ${i.minimum}`;
      break;
    case 'invalid_enum_value':
      motif = "a une valeur inconnue";
      break;
    case 'invalid_literal':
      motif = "n'est pas pris en charge (fichier d'une autre version ?)";
      break;
    default:
      motif = "n'est pas valide";
  }
  return { ok: false, erreur: `Groupe invalide : « ${ou} » ${motif}.` };
}
