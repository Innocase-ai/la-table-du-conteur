// Le gabarit de lieu de départ et le contrôle de densité (F2 du 20/11/2026, docs/PRD-SAGA.md et docs/GABARIT-LIEU-DE-DEPART.md).
//
// Le gabarit est une liste d'emplacements (4 bâtiments d'une pièce, une taverne de 2 ou 3 pièces avec une chambre qui est un service de repos,
// un sanctuaire avec un soigneur, la maison du chef, un marchand) lue dans `gabarit-depart.json` ; le contrôle dit, par des AVIS, quelle pièce
// est vide ou pauvre et quel emplacement manque. Barème INDICATIF : une pièce porte 2 à 4 « couches » parmi PNJ, contenant, verrou ou piège,
// adversaire avec butin, service, objet ; toutes les couches partout ne sont pas un but (ne jamais remplir mécaniquement).
//
// Opt-in par les données (P2 du PRD) : le contrôle ne s'applique qu'à un monde dont `monde.json` déclare `depart.gabarit`. Il ne produit
// JAMAIS d'erreur : le monde reste valide et jouable (P1). Il ne change rien au jeu. Pur : il lit seulement les données du monde.
import { z } from 'zod';
import brut from './gabarit-depart.json';
import { EPISODE, lieuDeDepart, piecesDuDepart } from './episode';
import { evenementsChoixDe } from './evenements-choix-donnees';
import { examensDe } from './examens-donnees';
import type { DonneesMonde, Lieu, Pnj } from './schemas';
import { typeDeService } from './services';

const Bornes = z.object({ min: z.number().int().min(0), max: z.number().int().min(0).optional() });
const Fichier = z.object({
  version: z.literal(1),
  nom: z.string().min(1),
  resume: z.string().min(1),
  couches: z.object({ min: z.number().int().min(1), max: z.number().int().min(1), liste: z.array(z.object({ id: z.string(), libelle: z.string(), aide: z.string() })).min(1) }),
  emplacements: z.array(z.object({ id: z.string(), libelle: z.string(), aide: z.string(), pieces: Bornes.optional(), nombre: Bornes.optional() })).min(1),
});
export const GABARIT_DEPART = Fichier.parse(brut);

export type Couche = 'pnj' | 'contenant' | 'obstacle' | 'adversaire' | 'service' | 'objet';
export const COUCHES: readonly Couche[] = GABARIT_DEPART.couches.liste.map((c) => c.id as Couche);
/** Les identifiants des emplacements du gabarit (`taverne`, `sanctuaire`…), tels qu'on les déclare dans `depart.gabarit.emplacements`. */
export const EMPLACEMENTS = GABARIT_DEPART.emplacements.map((e) => e.id);

/** Un avis de densité ou de gabarit : même forme que les écarts de `completude.ts` (qui les range dans les rubriques `densite` et `gabarit`). */
export interface AvisGabarit {
  categorie: 'densite' | 'gabarit';
  /** Le lieu (densité) ou l'emplacement (gabarit) concerné. */
  cible: string;
  detail: string;
}

/** Le monde déclare-t-il le gabarit ? (opt-in : un monde qui ne le déclare pas n'est jamais contrôlé.) */
export const gabaritDeclare = (dm: DonneesMonde): boolean => dm.monde.depart?.gabarit !== undefined; // `?.` : certains tests fabriquent un monde sans `depart`

const libelleCouche = (c: string) => GABARIT_DEPART.couches.liste.find((x) => x.id === c)?.libelle ?? c;
const emplacement = (id: string) => GABARIT_DEPART.emplacements.find((e) => e.id === id)!;
const liste = (xs: string[], n = 6) => `${xs.slice(0, n).join(', ')}${xs.length > n ? `… (${xs.length} en tout)` : ''}`;
const sansAccent = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// ---------------------------------------------------------------------------
// Les couches d'une pièce
// ---------------------------------------------------------------------------

/** Les couches de chaque lieu du monde : un seul passage sur les données. */
export function indexDesCouches(dm: DonneesMonde): Map<string, Set<Couche>> {
  const index = new Map<string, Set<Couche>>();
  const ajouter = (lieu: string | undefined, c: Couche) => {
    if (!lieu) return;
    const s = index.get(lieu) ?? new Set<Couche>();
    s.add(c);
    index.set(lieu, s);
  };

  for (const p of dm.pnj.values()) {
    for (const lieu of [p.lieu, ...p.presences.map((x) => x.lieu)]) {
      ajouter(lieu, 'pnj');
      if (p.boutique || p.services.length) ajouter(lieu, 'service');
    }
  }
  const combatAvecButin = (id: string): boolean => {
    const r = dm.rencontres.get(id);
    return !!r && (r.type === 'combat' || r.type === 'mixte') && r.monstres.length > 0 && (r.butin.depouilles !== false || r.butin.tables.length > 0 || r.butin.tresors.length > 0);
  };
  for (const l of dm.lieux.values()) {
    if (l.services.length) ajouter(l.id, 'service');
    if (l.faits.length) ajouter(l.id, 'objet');
    for (const e of l.evenements) if (dm.evenements.has(e)) ajouter(l.id, 'objet');
    for (const r of l.rencontres) if (combatAvecButin(r.id)) ajouter(l.id, 'adversaire');
    if (l.liens.some((x) => x.verrou)) ajouter(l.id, 'obstacle');
  }
  for (const r of dm.rencontres.values()) if (r.lieu && combatAvecButin(r.id)) ajouter(r.lieu, 'adversaire');
  for (const t of dm.tresors.values()) {
    // Un objet posé au sol (`sol`) est à ramasser, pas à ouvrir : couche « objet » ; tout autre contenant est à fouiller.
    ajouter(t.lieu, t.contenant === 'sol' ? 'objet' : 'contenant');
    if (t.acces.verrou || t.acces.piege) ajouter(t.lieu, 'obstacle');
    if (t.gardien && combatAvecButin(t.gardien)) ajouter(t.lieu, 'adversaire');
  }
  for (const x of dm.pieges.values()) ajouter(x.lieu, 'obstacle');
  for (const x of dm.enigmes.values()) ajouter(x.lieu, 'obstacle');
  for (const x of dm.evenements.values()) ajouter(x.lieu, 'objet');
  for (const x of examensDe(dm).examens) ajouter(x.lieu, 'objet');
  for (const x of evenementsChoixDe(dm).evenements) ajouter(x.lieu, 'objet');
  return index;
}

// ---------------------------------------------------------------------------
// Les emplacements : déclarés par l'auteur, sinon reconnus d'après les données
// ---------------------------------------------------------------------------

/** La pièce et tout ce qu'elle contient (ses descendants) : les « pièces visitables » d'un emplacement. */
function sousArbre(dm: DonneesMonde, racine: string): Lieu[] {
  const res: Lieu[] = [];
  const visiter = (id: string) => {
    const l = dm.lieux.get(id);
    if (!l || res.length > 200) return;
    res.push(l);
    for (const e of dm.lieux.values()) if (e.parent === id) visiter(e.id);
  };
  visiter(racine);
  return res;
}

/** Ce que dit le PNJ qui habite la pièce (son lieu principal, pas ses passages) : services par type. */
const pnjDe = (dm: DonneesMonde, lieu: string): Pnj[] => [...dm.pnj.values()].filter((p) => p.lieu === lieu);
const aUnService = (dm: DonneesMonde, l: Lieu, type: 'nuit' | 'soins'): boolean =>
  l.services.some((s) => typeDeService({ id: s }) === type || (type === 'nuit' && /auberge|taverne/.test(s))) ||
  pnjDe(dm, l.id).some((p) => p.services.some((s) => typeDeService(s) === type));
const nomDe = (l: Lieu) => sansAccent(`${l.id} ${l.nom}`);

/** Reconnaissance des emplacements d'après les données (quand l'auteur ne les a pas déclarés) ; chaque règle est documentée dans docs/GABARIT-LIEU-DE-DEPART.md. */
const RECONNAISSANCE: Record<'taverne' | 'sanctuaire' | 'maison-du-chef', (dm: DonneesMonde, pieces: Lieu[]) => Lieu | undefined> = {
  taverne: (dm, pieces) => pieces.find((l) => aUnService(dm, l, 'nuit')) ?? pieces.find((l) => /auberge|taverne|relais|hostellerie/.test(nomDe(l))),
  sanctuaire: (dm, pieces) => pieces.find((l) => aUnService(dm, l, 'soins')) ?? pieces.find((l) => /sanctuaire|temple|chapelle|infirmerie|hospice|oratoire/.test(nomDe(l))),
  'maison-du-chef': (_dm, pieces) => pieces.find((l) => /\b(chef|conseil|maire|mairie|seigneur|bailli|doyen|manoir|capitaine|bourgmestre|commandement)\b/.test(nomDe(l).replace(/-/g, ' '))),
};

export interface EmplacementsDuDepart {
  /** Les lieux qui tiennent chaque emplacement (absent : emplacement non trouvé). */
  lieux: Map<string, string[]>;
  /** Emplacements déclarés par l'auteur et qui ne tiennent pas (clé inconnue du gabarit, lieu qui n'existe pas). */
  declaresInvalides: string[];
}

/** Quel lieu tient quel emplacement : la déclaration de l'auteur (`depart.gabarit.emplacements`) d'abord, la reconnaissance ensuite. */
export function emplacementsDuDepart(dm: DonneesMonde): EmplacementsDuDepart {
  const pieces = piecesDuDepart(dm);
  const declares = dm.monde.depart.gabarit?.emplacements ?? {};
  const lieux = new Map<string, string[]>();
  const declaresInvalides: string[] = [];
  const declare = new Set<string>();
  for (const [cle, v] of Object.entries(declares)) {
    if (!EMPLACEMENTS.includes(cle)) {
      declaresInvalides.push(`« ${cle} » n'est pas un emplacement du gabarit (${EMPLACEMENTS.join(', ')})`);
      continue;
    }
    const ids = Array.isArray(v) ? v : [v];
    const inconnus = ids.filter((id) => !dm.lieux.has(id));
    if (inconnus.length) declaresInvalides.push(`« ${cle} » : lieu inconnu ${liste(inconnus)}`);
    const connus = ids.filter((id) => dm.lieux.has(id));
    if (connus.length) {
      lieux.set(cle, connus);
      declare.add(cle);
    }
  }
  for (const cle of ['taverne', 'sanctuaire', 'maison-du-chef'] as const) {
    if (declare.has(cle)) continue;
    const l = RECONNAISSANCE[cle](dm, pieces);
    if (l) lieux.set(cle, [l.id]);
  }
  if (!declare.has('marchand')) {
    // Dans l'ordre des pièces (le lieu de départ d'abord) : le marchand le plus proche de la place, pas le premier PNJ du fichier.
    const l = pieces.find((x) => pnjDe(dm, x.id).some((p) => p.boutique));
    if (l) lieux.set('marchand', [l.id]);
  }
  if (!declare.has('batiments')) {
    const hub = lieuDeDepart(dm);
    const pris = new Set<string>(['taverne', 'sanctuaire', 'maison-du-chef'].flatMap((c) => (lieux.get(c) ?? []).flatMap((id) => sousArbre(dm, id).map((x) => x.id))));
    const seuls = pieces.filter((l) => l.parent === hub?.id && l.id !== hub?.id && !pris.has(l.id) && !pieces.some((e) => e.parent === l.id)).map((l) => l.id);
    if (seuls.length) lieux.set('batiments', seuls);
  }
  return { lieux, declaresInvalides };
}

// ---------------------------------------------------------------------------
// Le contrôle
// ---------------------------------------------------------------------------

export interface OptionsGabarit {
  /** Contrôle même un monde qui ne déclare pas le gabarit (audit d'un monde existant ; jamais utilisé par le jeu ni par les commandes). */
  forcer?: boolean;
}

/** Les avis de densité (pièces vides ou pauvres) et de gabarit (emplacements manquants) d'un monde qui déclare le gabarit. Jamais une erreur. */
export function avisGabarit(dm: DonneesMonde, options: OptionsGabarit = {}): AvisGabarit[] {
  if (!gabaritDeclare(dm) && !options.forcer) return [];
  const avis: AvisGabarit[] = [];
  const hub = lieuDeDepart(dm);
  if (!hub) {
    avis.push({ categorie: 'gabarit', cible: dm.monde.depart.lieu, detail: `le lieu de départ « ${dm.monde.depart.lieu} » n'existe pas : le gabarit n'a rien à contrôler.` });
    return avis;
  }
  const pieces = piecesDuDepart(dm);
  const { lieux, declaresInvalides } = emplacementsDuDepart(dm);
  const gab = (cible: string, detail: string) => avis.push({ categorie: 'gabarit', cible, detail });
  const aide = (id: string) => emplacement(id).aide;

  for (const d of declaresInvalides) gab('depart.gabarit', `emplacement déclaré qui ne tient pas : ${d}.`);

  // Le nombre de pièces : le profil « épisode » le dit déjà (`conseilsEpisode`) ; ici seulement quand le monde n'a pas ce profil.
  if (dm.monde.format !== 'episode' && (pieces.length < EPISODE.pieces.min || pieces.length > EPISODE.pieces.max)) {
    gab(hub.id, `le lieu de départ compte ${pieces.length} pièces (visé : ${EPISODE.pieces.min} à ${EPISODE.pieces.max}, lui compris).`);
  }

  // 1. Les emplacements.
  const bornesPieces = (id: string, ids: string[]) => {
    const b = emplacement(id).pieces;
    if (!b) return;
    const n = new Set(ids.flatMap((x) => sousArbre(dm, x).map((l) => l.id))).size;
    const max = b.max ?? Infinity;
    if (n < b.min || n > max) gab(id, `${emplacement(id).libelle} « ${ids.join(', ')} » : ${n} pièce${n > 1 ? 's' : ''} (visé : ${b.max === b.min ? b.min : `${b.min} à ${b.max}`}).`);
  };
  const lieuxDe = (id: string) => lieux.get(id) ?? [];

  const bat = lieuxDe('batiments');
  const nbBat = emplacement('batiments').nombre?.min ?? 4;
  if (bat.length < nbBat) gab('batiments', `${bat.length} bâtiment${bat.length > 1 ? 's' : ''} d'une pièce reconnu${bat.length > 1 ? 's' : ''}${bat.length ? ` (${liste(bat)})` : ''} sur ${nbBat} attendus : ${aide('batiments')}.`);
  for (const id of bat) if (sousArbre(dm, id).length !== 1) bornesPieces('batiments', [id]);

  const taverne = lieuxDe('taverne');
  if (!taverne.length) gab('taverne', `aucune taverne trouvée : ${aide('taverne')} (sinon, déclarez-la dans depart.gabarit.emplacements).`);
  else {
    bornesPieces('taverne', taverne);
    const sous = taverne.flatMap((id) => sousArbre(dm, id));
    if (!sous.some((l) => aUnService(dm, l, 'nuit'))) gab('chambre', `la taverne « ${taverne.join(', ')} » n'offre aucune chambre : ${aide('chambre')}.`);
    if (!sous.some((l) => pnjDe(dm, l.id).length)) gab('taverne', `la taverne « ${taverne.join(', ')} » n'a aucun PNJ (un tavernier à qui parler).`);
  }

  const sanctuaire = lieuxDe('sanctuaire');
  if (!sanctuaire.length) gab('sanctuaire', `aucun sanctuaire trouvé : ${aide('sanctuaire')} (sinon, déclarez-le dans depart.gabarit.emplacements).`);
  else {
    bornesPieces('sanctuaire', sanctuaire);
    if (!sanctuaire.flatMap((id) => sousArbre(dm, id)).some((l) => aUnService(dm, l, 'soins'))) gab('sanctuaire', `le sanctuaire « ${sanctuaire.join(', ')} » n'a pas de soigneur : ${aide('sanctuaire')}.`);
  }

  const chef = lieuxDe('maison-du-chef');
  if (!chef.length) gab('maison-du-chef', `aucune maison du chef trouvée : ${aide('maison-du-chef')} (sinon, déclarez-la dans depart.gabarit.emplacements).`);
  else {
    bornesPieces('maison-du-chef', chef);
    if (!chef.flatMap((id) => sousArbre(dm, id)).some((l) => pnjDe(dm, l.id).length)) gab('maison-du-chef', `la maison du chef « ${chef.join(', ')} » n'a aucun PNJ : le chef doit y être.`);
  }

  const marchand = lieuxDe('marchand');
  if (!marchand.length) gab('marchand', `aucun marchand trouvé : ${aide('marchand')}.`);
  else if (!marchand.some((id) => pnjDe(dm, id).some((p) => p.boutique))) gab('marchand', `le lieu « ${marchand.join(', ')} » n'a aucun PNJ avec une boutique (un marchand).`);

  // 2. La densité : chaque pièce porte `couches.min` à `couches.max` couches (barème indicatif ; au-delà du maximum, rien n'est signalé).
  const index = indexDesCouches(dm);
  const { min } = GABARIT_DEPART.couches;
  for (const l of pieces) {
    const c = [...(index.get(l.id) ?? [])];
    if (c.length >= min) continue;
    const reste = COUCHES.filter((x) => !c.includes(x)).map(libelleCouche);
    avis.push({
      categorie: 'densite',
      cible: l.id,
      detail: c.length
        ? `« ${l.nom} » n'a qu'une couche (${libelleCouche(c[0]!)}) : visez ${min} à ${GABARIT_DEPART.couches.max} parmi ${reste.join(', ')} (barème indicatif, pas toutes les couches partout).`
        : `« ${l.nom} » est vide : rien à y faire (visez ${min} à ${GABARIT_DEPART.couches.max} couches parmi ${COUCHES.map(libelleCouche).join(', ')} ; barème indicatif).`,
    });
  }
  return avis;
}
