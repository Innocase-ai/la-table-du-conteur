// Le tirage d'arrivée : quand le groupe arrive dans un lieu, un dé à six faces dit ce qui s'y passe. Un lieu n'est jamais vide.
//
//   2        un combat (adversaire au hasard) ; dans un lieu sûr (auberge, maison…) : un passant à la place
//   3        une rencontre de PNJ, même juste pour dire bonjour
//   4        quelque chose attire l'œil : « Fouiller » a une chance de faire trouver un objet (arme, armure, parchemin, fiole…)
//   1, 5, 6  rien ; le jeu le dit à l'écran (animation)
//
// Chaque lieu a un budget de 2 à 4 interactions (le même d'une partie à l'autre : il dépend de son identifiant). Chacune vécue
// (combat, rencontre, découverte) en consomme une ; le lieu épuisé reste calme pour de bon. Le monde peut tout couper avec
// `tirageArrivee: false` (`monde.json`). Les rencontres que l'auteur écrit avec le déclencheur `aleatoire` sont tirées en premier.
import { composerRencontre, THEMES, type Difficulte } from '../combat/escarmouche';
import { lancer } from '../des';
import type { CompteRendu, PartieMonde } from './exploration';
import { evaluerCondition } from './etat';
import { pnjPresents } from './presence';
import { RencontreMonde, type Lieu } from './schemas';
import brut from './hasard-arrivee.json';

export type IssueArrivee = 'rien' | 'calme' | 'combat' | 'pnj' | 'decouverte';

/** Ce que le tirage a donné : le dé, l'issue et la phrase que l'écran montre (l'animation du dé, puis ce texte). */
export interface TirageArrivee {
  de: number;
  issue: IssueArrivee;
  texte: string;
}

/** Ce qu'un lieu a déjà vécu, et la trouvaille qui attend d'être fouillée. */
export interface HasardLieu {
  vecues: number;
  /** Une trouvaille amorcée par un 4 : la table de butin et le DD du jet de fouille (secret). Une seule tentative. */
  decouverte?: { table: string; dd: number };
}

interface Textes {
  passants: { id: string; nom: string; texte: string }[];
  indicesDecouverte: string[];
  trouvailles: string[];
  combatIntros: Record<string, string[]>;
  rien: string[];
  calme: string[];
}
const TEXTES = brut as Textes;

/** Les trouvailles possibles d'une fouille réussie : la phrase du jeu, avec `{objet}` à remplacer. */
export const phraseTrouvaille = (gen: () => number, objet: string): string => {
  const phrases = TEXTES.trouvailles;
  return phrases[Math.floor(gen() * phrases.length)]!.replace('{objet}', objet);
};

const choisirDans = <T>(liste: readonly T[], gen: () => number): T => liste[Math.min(liste.length - 1, Math.floor(gen() * liste.length))]!;

/** Un entier stable tiré de l'identifiant d'un lieu (le budget ne change pas d'une partie à l'autre). */
function empreinte(id: string): number {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Les interactions que ce lieu offre en tout : 2, 3 ou 4. */
export const budgetDuLieu = (lieu: Pick<Lieu, 'id'>): number => 2 + (empreinte(lieu.id) % 3);

/** Un lieu où l'on dort en sécurité : pas de combat à l'arrivée. */
export const lieuSur = (lieu: Pick<Lieu, 'repos'>): boolean => lieu.repos === 'sur';

/** Le palier de butin du groupe : 1 = niveaux 1-4, 2 = 5-10, 3 = 11-16, 4 = 17-20. */
export const palierDuGroupe = (groupe: { fiche: { niveau: number } }[]): 1 | 2 | 3 | 4 => {
  const n = Math.max(1, ...groupe.map((h) => h.fiche.niveau));
  return n <= 4 ? 1 : n <= 10 ? 2 : n <= 16 ? 3 : 4;
};

/** Le DD secret de la fouille amorcée, selon le palier. */
const DD_PAR_PALIER = { 1: 10, 2: 12, 3: 14, 4: 16 } as const;

/** Les thèmes de combat qui vont à ce lieu (le terrain de leur carte) ; à défaut, tous. */
function themesPour(lieu: Lieu): typeof THEMES {
  const souterrain = ['grotte', 'donjon', 'salle', 'ruine', 'cave', 'crypte'].includes(lieu.type);
  const camp = lieu.type === 'camp';
  const choisis = THEMES.filter((t) => (souterrain ? t.terrain === 'souterrain' : camp ? t.terrain === 'camp' || t.terrain === 'foret' : t.terrain === 'foret' || t.terrain === 'camp'));
  return choisis.length ? choisis : THEMES;
}

/** Ce que le tirage appelle dans le moteur d'exploration (pour ne pas en dépendre) : lancer une rencontre du monde. */
export interface AppelsTirage {
  lancerRencontre(id: string): boolean;
}

/** L'état du hasard d'un lieu (créé au besoin). */
export const hasardDe = (p: PartieMonde, lieu: string): HasardLieu => ((p.etat.exploration.hasard ??= {})[lieu] ??= { vecues: 0 });

/** Une rencontre fortuite pour ce groupe : un thème au hasard, composé pour son niveau et sa taille (faible, ou modérée une fois sur trois). */
function rencontreFortuite(p: PartieMonde, lieu: Lieu, numero: number): RencontreMonde | undefined {
  if (!p.srd) return undefined;
  const theme = choisirDans(themesPour(lieu), p.gen);
  const difficulte: Difficulte = p.gen() < 1 / 3 ? 'moderee' : 'faible';
  const composee = composerRencontre(theme, p.groupe.filter((h) => h.pv > 0).map((h) => h.fiche.niveau), difficulte, p.srd);
  const intro = choisirDans(TEXTES.combatIntros[theme.id] ?? Object.values(TEXTES.combatIntros).flat(), p.gen);
  return RencontreMonde.parse({
    id: `auto-${lieu.id}-${numero}`,
    nom: 'Une rencontre inattendue',
    type: 'combat',
    lieu: lieu.id,
    difficulte,
    intro,
    monstres: composee.monstres.map((m) => ({ profil: m.profil, nombre: m.nombre })),
    carte: theme.carte,
    terrain: theme.terrain,
  });
}

/**
 * Le tirage d'arrivée. Sans effet si le monde le coupe, si le lieu est une région (un grand ensemble, pas un lieu où l'on se tient)
 * ou si une rencontre écrite vient déjà de se déclencher à l'entrée. Le résultat est dans `r.tirage` ; le reste (récit, rencontre,
 * trouvaille amorcée) est versé au compte rendu comme n'importe quelle action.
 */
export function tirerArrivee(p: PartieMonde, r: CompteRendu, lieu: Lieu, appels: AppelsTirage): void {
  if (p.dm.monde.tirageArrivee === false || lieu.type === 'region' || r.combat) return;
  const ex = p.etat.exploration;
  const etat = hasardDe(p, lieu.id);
  const de = lancer('1d6', p.gen).total;
  let issue: IssueArrivee = de === 2 ? (lieuSur(lieu) ? 'pnj' : 'combat') : de === 3 ? 'pnj' : de === 4 ? 'decouverte' : 'rien';
  if (issue !== 'rien' && etat.vecues >= budgetDuLieu(lieu)) issue = 'calme';
  if (issue === 'decouverte' && etat.decouverte) issue = 'rien'; // une trouvaille attend déjà d'être fouillée

  let texte = '';
  if (issue === 'combat') {
    // Une rencontre écrite par l'auteur pour ce lieu (déclencheur `aleatoire`, pas encore jouée) passe avant l'adversaire tiré au hasard.
    const ecrite = lieu.rencontres.find((rc) => {
      if (rc.declencheur !== 'aleatoire' || (rc.unique && p.etat.rencontresFaites.includes(rc.id))) return false;
      if (rc.condition && !evaluerCondition(rc.condition, p.etat)) return false;
      const def = p.dm.rencontres.get(rc.id);
      return !!def && (def.type === 'combat' || def.type === 'mixte');
    });
    let id = ecrite?.id;
    if (!id) {
      const def = rencontreFortuite(p, lieu, etat.vecues + 1);
      if (def) {
        p.dm.rencontres.set(def.id, def);
        (ex.rencontresAuto ??= {})[def.id] = def;
        id = def.id;
      }
    }
    if (id && appels.lancerRencontre(id)) {
      etat.vecues += 1;
      texte = 'Un combat éclate.';
    } else issue = 'rien';
  }
  if (issue === 'pnj') {
    // Un PNJ du lieu à qui le groupe n'a pas encore parlé, sinon un passant.
    const connus = ex.pnjVus ?? {};
    const du_lieu = pnjPresents(p).filter((n) => !connus[n.id] && n.salutations.neutre?.trim());
    if (du_lieu.length) {
      const n = choisirDans(du_lieu, p.gen);
      r.narrations.push(n.salutations.neutre!);
      r.paroles = (r.paroles ?? 0) + 1;
      texte = `${n.nom} vous interpelle.`;
    } else {
      const vus = ex.passantsVus ?? [];
      const libres = TEXTES.passants.filter((x) => !vus.includes(x.id));
      const x = choisirDans(libres.length ? libres : TEXTES.passants, p.gen);
      ex.passantsVus = libres.length ? [...vus, x.id] : [x.id];
      r.narrations.push(x.texte);
      texte = `${x.nom} vous interpelle.`;
    }
    etat.vecues += 1;
  }
  if (issue === 'decouverte') {
    const palier = palierDuGroupe(p.groupe);
    etat.decouverte = { table: `commun-decouverte-p${palier}`, dd: DD_PAR_PALIER[palier] };
    // La fouille du jour ne doit pas fermer la porte à ce que l'arrivée vient de révéler.
    ex.fouilles = ex.fouilles.filter((f) => f !== `${lieu.id}:${p.etat.jour}`);
    r.narrations.push(choisirDans(TEXTES.indicesDecouverte, p.gen));
    etat.vecues += 1;
    texte = 'Quelque chose attire votre regard.';
  }
  if (issue === 'rien') texte = choisirDans(TEXTES.rien, p.gen);
  if (issue === 'calme') texte = choisirDans(TEXTES.calme, p.gen);
  r.tirage = { de, issue, texte };
}
