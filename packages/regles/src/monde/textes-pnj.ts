// Contrôles des défauts de texte de PNJ trouvés à la relecture de la Tombe du 18/11/2026 (fiche C5 du lot 1) : ce que personne ne voyait
// et que le test `tombe-textes-pnj.test.ts` ne gardait que sur la Tombe. Ce sont des avis ; les faux positifs se rejettent dans `revue.json`.
//  (a) un renvoi « demandez à X » vers un PNJ qui n'a aucun sujet de conversation (conseil : c'est une heuristique de langage) ;
//  (b) une interjection de compagnon qui en nomme un autre sans condition de présence ;
//  (c) une variante de sujet que son attitude ferme pour toujours (texte mort) : défaut de jeu.
// (d) un drapeau lu qui diffère d'un caractère d'un drapeau posé est dans `validation.ts` ; (e) un fait détenu hors du canon, dans `revue.ts`.
import { interjectionsDe } from './interjections-donnees';
import type { Condition, DonneesMonde } from './schemas';

/** Les verbes qui envoient vers quelqu'un (la première lettre peut être une majuscule). */
const VERBES = ['demandez', 'demande', 'interrogez', 'questionnez', 'voyez', 'adressez-vous', 'parlez', 'allez voir', 'allez parler', 'cherchez', 'renseignez-vous', 'retrouvez', 'consultez'];
const MAJ_OU_MIN = (m: string) => `[${m[0]!.toUpperCase()}${m[0]}]${m.slice(1)}`;
const TITRES = "le|la|l['’]|les|frère|sœur|soeur|sergent|capitaine|maître|dame|messire|commandant|commandeur|père|mère";
/** Un verbe de renvoi, un titre facultatif, puis un nom propre (le groupe 1). */
const RENVOI = new RegExp(String.raw`\b(?:${VERBES.map(MAJ_OU_MIN).join('|')})\s+(?:donc\s+|plutôt\s+|aussi\s+)?(?:à|au|aux|auprès de|chez)?\s*(?:(?:${TITRES})\s+)?(\p{Lu}[\p{L}'’-]{2,})`, 'gu');

/** Les PNJ qu'un nom propre peut désigner : un mot de leur nom (« Odile » pour « Odile Brun », « Balthazar » pour « Frère Balthazar »). */
function pnjDeNom(dm: DonneesMonde, mot: string): string[] {
  const m = mot.toLowerCase();
  return [...dm.pnj.values()].filter((p) => p.nom.split(/\s+/).some((x) => x.toLowerCase() === m && x.length >= 3)).map((p) => p.id);
}

/** Les mots à majuscule d'un nom du monde (PNJ, lieux, factions, objets) : ce qu'un renvoi peut désigner sans être un PNJ. */
function mots(noms: string[]): Set<string> {
  return new Set(noms.flatMap((n) => n.split(/\s+/)).map((x) => x.toLowerCase()));
}

export function avisRenvoisVersPnj(dm: DonneesMonde): string[] {
  const res: string[] = [];
  const connus = mots([...dm.lieux.values()].map((l) => l.nom).concat([...dm.factions.values()].map((f) => f.nom), [...dm.objets.values()].map((o) => o.nom)));
  for (const p of dm.pnj.values()) {
    for (const s of p.sujets) {
      const vus = new Set<string>();
      for (const texte of [s.reponse, ...s.variantes.map((v) => v.reponse)]) {
        for (const m of texte.matchAll(RENVOI)) {
          const mot = m[1]!;
          if (vus.has(mot)) continue;
          vus.add(mot);
          const cibles = pnjDeNom(dm, mot);
          if (cibles.length !== 1 || cibles[0] === p.id) continue;
          const cible = dm.pnj.get(cibles[0]!)!;
          if (!cible.sujets.length && !connus.has(mot.toLowerCase())) res.push(`PNJ « ${p.id} », sujet « ${s.id} » : renvoie vers « ${cible.id} » (« ${m[0]} »), qui n'a aucun sujet de conversation ; le joueur n'y trouverait rien.`);
        }
      }
    }
  }
  return res;
}

const aUnDrapeau = (c: Condition): boolean => {
  if ('flag' in c) return true;
  if ('non' in c) return aUnDrapeau(c.non);
  if ('et' in c) return c.et.some(aUnDrapeau);
  if ('ou' in c) return c.ou.some(aUnDrapeau);
  return false;
};

/** Une interjection de compagnon qui nomme un autre compagnon : sa condition doit garantir (par un drapeau de recrutement) qu'il est dans le groupe. */
export function avisCompagnonsNommes(dm: DonneesMonde): string[] {
  const res: string[] = [];
  const compagnons = [...dm.pnj.values()].filter((p) => p.compagnon);
  for (const i of interjectionsDe(dm).interjections) {
    const qui = dm.pnj.get(i.pnj);
    if (!qui?.compagnon || aUnDrapeau(i.quand)) continue;
    for (const autre of compagnons) {
      if (autre.id === qui.id) continue;
      const prenom = autre.nom.split(/\s+/)[0]!;
      if (prenom.length >= 3 && new RegExp(`(?<![\\p{L}'’-])${prenom}(?![\\p{L}-])`, 'u').test(i.texte))
        res.push(`Interjection « ${i.id} » : « ${qui.id} » nomme « ${autre.id} » sans condition de présence (aucun drapeau dans « quand ») ; si « ${autre.id} » n'est pas dans le groupe, la phrase n'a pas de sens.`);
    }
  }
  return res;
}

/** Les bornes d'attitude qu'une conjonction de conditions impose à ce PNJ (les `ou` et les `non` ne bornent rien de sûr). */
function bornesAttitude(c: Condition | undefined, pnj: string): { min?: number; max?: number } {
  const b: { min?: number; max?: number } = {};
  const visiter = (x: Condition) => {
    if ('pnj' in x && x.pnj.id === pnj) {
      if (x.pnj.attitudeMin !== undefined) b.min = Math.max(b.min ?? -Infinity, x.pnj.attitudeMin);
      if (x.pnj.attitudeMax !== undefined) b.max = Math.min(b.max ?? Infinity, x.pnj.attitudeMax);
    } else if ('et' in x) x.et.forEach(visiter);
  };
  if (c) visiter(c);
  return b;
}

/** Une variante de réponse qu'aucune attitude ne peut lire : elle exige une attitude au plus basse que celle que le sujet exige au moins. */
export function avisVariantesMortes(dm: DonneesMonde): string[] {
  const res: string[] = [];
  for (const p of dm.pnj.values()) {
    for (const s of p.sujets) {
      const porte = bornesAttitude(s.condition, p.id).min;
      const minSujet = Math.max(s.attitudeMin ?? -Infinity, porte ?? -Infinity);
      if (!Number.isFinite(minSujet)) continue;
      s.variantes.forEach((v, k) => {
        const max = bornesAttitude(v.condition, p.id).max;
        if (max !== undefined && max < minSujet)
          res.push(`PNJ « ${p.id} », sujet « ${s.id} » : la variante ${k + 1} n'est lue qu'à une attitude de ${max} au plus, mais le sujet exige ${minSujet} au moins : texte mort (le sujet reste fermé à cette attitude).`);
      });
    }
  }
  return res;
}

/** La distance d'édition entre deux mots (Levenshtein), pour proposer le drapeau voisin d'un drapeau jamais posé. */
export function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0]![j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length]![b.length]!;
}

/** Le drapeau posé qui ressemble le plus à `flag` (à deux caractères près, pour un drapeau d'au moins 5 caractères), s'il y en a un. */
export function drapeauVoisin(flag: string, poses: Iterable<string>): string | undefined {
  if (flag.length < 5) return undefined;
  let meilleur: { f: string; d: number } | undefined;
  for (const f of poses) {
    const d = distance(flag, f);
    if (d > 0 && d <= 2 && (!meilleur || d < meilleur.d)) meilleur = { f, d };
  }
  return meilleur?.f;
}
